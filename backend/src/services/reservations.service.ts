import { ReservationStatus, VehicleStatus, type Prisma } from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { reservationsRepository } from "../repositories/reservations.repository.js";
import { HttpError } from "../utils/http-error.js";
import { hasPermission } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";

const reservationInclude = {
  vehicle: true,
  user: { include: { department: true, role: true } },
  logs: { orderBy: { createdAt: "desc" } },
  checklist: true,
} satisfies Prisma.ReservationInclude;

function canAccessReservation(
  user: AccessTokenPayload,
  reservationUserId: string,
) {
  return (
    hasPermission(user.role, "reservations:read-all") ||
    reservationUserId === user.id
  );
}

async function assertNoVehicleConflict(
  vehicleId: string,
  pickupDate: Date,
  returnDate: Date,
  ignoreReservationId?: string,
) {
  if (pickupDate >= returnDate) {
    throw new HttpError(
      400,
      "A data de devolução deve ser posterior à retirada.",
    );
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
      vehicleId,
      status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
      pickupDate: { lt: returnDate },
      returnDate: { gt: pickupDate },
    },
  });

  if (conflict) {
    throw new HttpError(
      409,
      "Já existe reserva ativa para este veículo no período informado.",
    );
  }
}

async function addReservationLog(
  tx: Prisma.TransactionClient,
  reservationId: string,
  userId: string,
  action: string,
) {
  await tx.reservationLog.create({
    data: {
      reservationId,
      userId,
      action,
    },
  });
}

export const reservationsService = {
  async list(
    user: AccessTokenPayload,
    query: {
      status?: ReservationStatus;
      user_id?: string;
      vehicle_id?: string;
    },
  ) {
    const where: Prisma.ReservationWhereInput = {
      status: query.status,
      vehicleId: query.vehicle_id,
    };

    if (hasPermission(user.role, "reservations:read-all")) {
      where.userId = query.user_id;
    } else {
      where.userId = user.id;
    }

    return prisma.reservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: reservationInclude,
    });
  },

  async get(id: string, user: AccessTokenPayload) {
    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva não encontrada.");
    if (!canAccessReservation(user, reservation.userId)) {
      throw new HttpError(403, "Usuário sem acesso a esta reserva.");
    }
    return reservation;
  },

  async create(
    user: AccessTokenPayload,
    data: {
      vehicle_id: string;
      pickup_date: Date;
      return_date: Date;
      reason: string;
    },
  ) {
    await assertNoVehicleConflict(
      data.vehicle_id,
      data.pickup_date,
      data.return_date,
    );

    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: data.vehicle_id },
      });
      if (!vehicle || !vehicle.active)
        throw new HttpError(404, "Veículo não encontrado.");
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new HttpError(409, "Veículo indisponível para reserva.");
      }

      const reservation = await tx.reservation.create({
        data: {
          vehicleId: data.vehicle_id,
          userId: user.id,
          pickupDate: data.pickup_date,
          returnDate: data.return_date,
          reason: data.reason,
          status: ReservationStatus.PENDING,
        },
        include: reservationInclude,
      });

      await tx.vehicle.update({
        where: { id: data.vehicle_id },
        data: { status: VehicleStatus.RESERVED },
      });
      await addReservationLog(
        tx,
        reservation.id,
        user.id,
        "RESERVATION_CREATED",
      );
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE",
          entity: "Reservation",
          entityId: reservation.id,
        },
      });

      return reservation;
    });
  },

  async update(
    id: string,
    user: AccessTokenPayload,
    data: Partial<{
      pickup_date: Date;
      return_date: Date;
      reason: string;
      status: ReservationStatus;
    }>,
  ) {
    const reservation = await this.get(id, user);
    if (!canAccessReservation(user, reservation.userId)) {
      throw new HttpError(
        403,
        "Usuário sem permissão para alterar esta reserva.",
      );
    }
    if (
      reservation.status !== ReservationStatus.PENDING &&
      !hasPermission(user.role, "reservations:approve")
    ) {
      throw new HttpError(400, "Apenas reservas pendentes podem ser editadas.");
    }

    const pickupDate = data.pickup_date ?? reservation.pickupDate;
    const returnDate = data.return_date ?? reservation.returnDate;
    await assertNoVehicleConflict(
      reservation.vehicleId,
      pickupDate,
      returnDate,
      id,
    );

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          pickupDate: data.pickup_date,
          returnDate: data.return_date,
          reason: data.reason,
          status: data.status,
        },
        include: reservationInclude,
      });

      if (data.status) {
        const vehicleStatusByReservationStatus: Partial<
          Record<ReservationStatus, VehicleStatus>
        > = {
          PENDING: VehicleStatus.RESERVED,
          APPROVED: VehicleStatus.RESERVED,
          ACTIVE: VehicleStatus.IN_USE,
          FINISHED: VehicleStatus.AVAILABLE,
          CANCELLED: VehicleStatus.AVAILABLE,
        };
        await tx.vehicle.update({
          where: { id: reservation.vehicleId },
          data: { status: vehicleStatusByReservationStatus[data.status] },
        });
        await addReservationLog(tx, id, user.id, `RESERVATION_${data.status}`);
      }

      return updated;
    });
  },

  async approve(id: string, user: AccessTokenPayload) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });
      if (!reservation) throw new HttpError(404, "Reserva não encontrada.");
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new HttpError(
          400,
          "Somente reservas pendentes podem ser aprovadas.",
        );
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.APPROVED },
        include: reservationInclude,
      });
      await addReservationLog(tx, id, user.id, "RESERVATION_APPROVED");
      return updated;
    });
  },

  async cancel(id: string, user: AccessTokenPayload) {
    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva não encontrada.");

    const canCancelAll = hasPermission(user.role, "reservations:cancel-all");
    const canCancelOwn =
      hasPermission(user.role, "reservations:cancel-own") &&
      reservation.userId === user.id;
    if (!canCancelAll && !canCancelOwn) {
      throw new HttpError(
        403,
        "Usuário sem permissão para cancelar esta reserva.",
      );
    }
    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.FINISHED
    ) {
      throw new HttpError(400, "Reserva não pode mais ser cancelada.");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
        include: reservationInclude,
      });
      await tx.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
      await addReservationLog(tx, id, user.id, "RESERVATION_CANCELLED");
      return updated;
    });
  },

  async finish(id: string, user: AccessTokenPayload) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });
      if (!reservation) throw new HttpError(404, "Reserva não encontrada.");
      if (
        reservation.status !== ReservationStatus.APPROVED &&
        reservation.status !== ReservationStatus.ACTIVE
      ) {
        throw new HttpError(
          400,
          "Somente reservas aprovadas ou ativas podem ser finalizadas.",
        );
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.FINISHED },
        include: reservationInclude,
      });
      await tx.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
      await addReservationLog(tx, id, user.id, "RESERVATION_FINISHED");
      return updated;
    });
  },
};
