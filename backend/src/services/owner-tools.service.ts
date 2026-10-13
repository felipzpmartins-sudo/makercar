import { prisma } from "../database/prisma.js";
import { reservationsRepository } from "../repositories/reservations.repository.js";
import { HttpError } from "../utils/http-error.js";
import { isSupremeOwner } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { syncVehicleReservationStatus } from "./fleet-status.service.js";
import { publishFleetUpdate } from "./realtime.service.js";

export const ownerToolsService = {
  async listDeletedReservations(user: AccessTokenPayload) {
    if (!isSupremeOwner(user)) {
      throw new HttpError(403, "Apenas o Imperador Supremo pode ver reservas excluídas.");
    }

    return prisma.reservation.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: {
        vehicle: true,
        user: { include: { department: true, role: true } },
        reviewedBy: { include: { department: true, role: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
        logs: {
          orderBy: { createdAt: "desc" },
          include: { user: { include: { department: true, role: true } } },
        },
        checklist: true,
        odometerRecords: {
          orderBy: { occurredAt: "asc" },
          include: {
            vehicle: true,
            createdBy: { include: { department: true, role: true } },
          },
        },
      },
    });
  },

  async deleteReservationHistory(id: string, user: AccessTokenPayload) {
    if (!isSupremeOwner(user)) {
      throw new HttpError(403, "Apenas o dono pode excluir históricos de veículo.");
    }

    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva não encontrada.");

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
      await tx.reservationLog.create({
        data: { reservationId: id, userId: user.id, action: "RESERVATION_ARCHIVED" },
      });
      await tx.reservation.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: user.id },
      });

      for (const vehicleId of affectedVehicleIds) {
        await syncVehicleReservationStatus(tx, vehicleId);
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ARCHIVE_HISTORY",
          entity: "Reservation",
          entityId: id,
        },
      });

      return { id };
    });

    publishFleetUpdate({ entity: "reservation", id });
    return deleted;
  },

  async restoreReservationHistory(id: string, user: AccessTokenPayload) {
    if (!isSupremeOwner(user)) {
      throw new HttpError(403, "Apenas o Imperador Supremo pode restaurar reservas.");
    }

    const reservation = await reservationsRepository.findDeletedById(id);
    if (!reservation) throw new HttpError(404, "Reserva excluída não encontrada.");

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

    const restored = await prisma.$transaction(async (tx) => {
      const conflict = await tx.reservation.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          vehicleId: reservation.vehicleId,
          status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
          pickupDate: { lt: reservation.returnDate },
          returnDate: { gt: reservation.pickupDate },
        },
        select: { id: true },
      });
      if (conflict && ["PENDING", "APPROVED", "ACTIVE"].includes(reservation.status)) {
        throw new HttpError(409, "Não é possível restaurar: o veículo já possui uma reserva nesse período.");
      }

      await tx.reservation.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
      });
      await tx.reservationLog.create({
        data: { reservationId: id, userId: user.id, action: "RESERVATION_RESTORED" },
      });

      for (const vehicleId of affectedVehicleIds) {
        await syncVehicleReservationStatus(tx, vehicleId);
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "RESTORE_HISTORY",
          entity: "Reservation",
          entityId: id,
        },
      });

      return { id };
    });

    publishFleetUpdate({ entity: "reservation", id });
    return restored;
  },
};
