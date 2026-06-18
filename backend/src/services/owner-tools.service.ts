import {
  ReservationOdometerType,
  ReservationStatus,
  VehicleStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { reservationsRepository } from "../repositories/reservations.repository.js";
import { HttpError } from "../utils/http-error.js";
import { isSupremeOwner } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { publishFleetUpdate } from "./realtime.service.js";

async function syncVehicleReservationStatus(
  tx: Prisma.TransactionClient,
  vehicleId: string,
) {
  const vehicle = await tx.vehicle.findUnique({
    where: { id: vehicleId },
    select: { status: true },
  });
  if (!vehicle) return;

  if (
    vehicle.status === VehicleStatus.MAINTENANCE ||
    vehicle.status === VehicleStatus.UNAVAILABLE
  ) {
    return;
  }

  const activeReservation = await tx.reservation.findFirst({
    where: {
      status: ReservationStatus.ACTIVE,
      OR: [
        {
          vehicleId,
          odometerRecords: { none: { type: ReservationOdometerType.PICKUP } },
        },
        {
          odometerRecords: {
            some: { type: ReservationOdometerType.PICKUP, vehicleId },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (activeReservation) {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.IN_USE },
    });
    return;
  }

  const scheduledReservation = await tx.reservation.findFirst({
    where: {
      vehicleId,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED] },
    },
    select: { id: true },
  });

  await tx.vehicle.update({
    where: { id: vehicleId },
    data: {
      status: scheduledReservation ? VehicleStatus.RESERVED : VehicleStatus.AVAILABLE,
    },
  });
}

export const ownerToolsService = {
  async deleteReservationHistory(id: string, user: AccessTokenPayload) {
    if (!isSupremeOwner(user)) {
      throw new HttpError(403, "Apenas o dono pode excluir historicos de veiculo.");
    }

    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");

    const affectedVehicleIds = Array.from(
      new Set(
        [
          reservation.vehicleId,
          ...reservation.odometerRecords
            .map((record) => record.vehicleId)
            .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
        ],
      ),
    );

    const deleted = await prisma.$transaction(async (tx) => {
      await tx.reservationLog.deleteMany({ where: { reservationId: id } });
      await tx.vehicleChecklist.deleteMany({ where: { reservationId: id } });
      await tx.reservationOdometerRecord.deleteMany({ where: { reservationId: id } });
      await tx.reservation.delete({ where: { id } });

      for (const vehicleId of affectedVehicleIds) {
        await syncVehicleReservationStatus(tx, vehicleId);
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_HISTORY",
          entity: "Reservation",
          entityId: id,
        },
      });

      return { id };
    });

    publishFleetUpdate({ entity: "reservation", id });
    return deleted;
  },
};
