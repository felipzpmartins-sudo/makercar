import {
  CnhStatus,
  ReservationOdometerType,
  ReservationStatus,
  VehicleStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { reservationsRepository } from "../repositories/reservations.repository.js";
import { HttpError } from "../utils/http-error.js";
import { hasPermission } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { uploadReservationPhoto } from "./photo-storage.service.js";
import { publishFleetUpdate } from "./realtime.service.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  cnhNumber: true,
  cnhExpiresAt: true,
  cnhPhotoUrl: true,
  cnhStatus: true,
  cnhReviewedAt: true,
  department: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

const reservationLogSelect = {
  id: true,
  action: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ReservationLogSelect;

const reservationInclude = {
  vehicle: true,
  user: { select: userSelect },
  reviewedBy: { select: userSelect },
  logs: { orderBy: { createdAt: "desc" }, select: reservationLogSelect },
  checklist: true,
  odometerRecords: {
    orderBy: { occurredAt: "asc" },
    include: {
      vehicle: true,
      createdBy: { select: userSelect },
    },
  },
} satisfies Prisma.ReservationInclude;

const reservableVehicleStatuses: VehicleStatus[] = [
  VehicleStatus.AVAILABLE,
  VehicleStatus.RESERVED,
  VehicleStatus.IN_USE,
];

async function assertUserHasValidCnh(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cnhStatus: true, cnhExpiresAt: true, cnhNumber: true, cnhPhotoUrl: true },
  });
  if (!user || !user.cnhNumber || !user.cnhPhotoUrl) {
    throw new HttpError(403, "Envie sua CNH com foto antes de reservar um veiculo.");
  }
  if (user.cnhStatus === CnhStatus.REJECTED) {
    throw new HttpError(403, "Sua CNH foi recusada. Atualize o documento no seu perfil.");
  }
  if (!user.cnhExpiresAt || user.cnhExpiresAt.getTime() < Date.now()) {
    throw new HttpError(403, "Sua CNH esta vencida. Atualize o documento no seu perfil.");
  }
}

function canAccessReservation(
  user: AccessTokenPayload,
  reservationUserId: string,
) {
  return (
    hasPermission(user.role, "reservations:read-all") ||
    reservationUserId === user.id
  );
}

function canOperateReservation(user: AccessTokenPayload, reservationUserId: string) {
  return (
    hasPermission(user.role, "reservations:finish") ||
    reservationUserId === user.id
  );
}

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
      status: scheduledReservation
        ? VehicleStatus.RESERVED
        : VehicleStatus.AVAILABLE,
    },
  });
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

async function addAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
) {
  await tx.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
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
    await assertUserHasValidCnh(user.id);
    await assertNoVehicleConflict(
      data.vehicle_id,
      data.pickup_date,
      data.return_date,
    );

    const created = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: data.vehicle_id },
      });
      if (!vehicle || !vehicle.active)
        throw new HttpError(404, "Veículo não encontrado.");
      if (!reservableVehicleStatuses.includes(vehicle.status)) {
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

      await syncVehicleReservationStatus(tx, data.vehicle_id);
      await addReservationLog(
        tx,
        reservation.id,
        user.id,
        "RESERVATION_CREATED_PENDING",
      );
      await addAuditLog(tx, user.id, "CREATE", "Reservation", reservation.id);

      return reservation;
    });

    publishFleetUpdate({ entity: "reservation", id: created.id });
    return created;
  },

  async update(
    id: string,
    user: AccessTokenPayload,
    data: Partial<{
      pickup_date: Date;
      return_date: Date;
      reason: string;
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
      !hasPermission(user.role, "reservations:read-all")
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

    const updatedReservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          pickupDate: data.pickup_date,
          returnDate: data.return_date,
          reason: data.reason,
        },
        include: reservationInclude,
      });

      return updated;
    });

    publishFleetUpdate({ entity: "reservation", id });
    return updatedReservation;
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

    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
        include: reservationInclude,
      });
      await syncVehicleReservationStatus(tx, reservation.vehicleId);
      await addReservationLog(tx, id, user.id, "RESERVATION_CANCELLED");
      await addAuditLog(tx, user.id, "CANCEL", "Reservation", id);
      return updated;
    });

    publishFleetUpdate({ entity: "reservation", id });
    return cancelled;
  },

  async finish(id: string, user: AccessTokenPayload) {
    const finished = await prisma.$transaction(async (tx) => {
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
      await syncVehicleReservationStatus(tx, reservation.vehicleId);
      await addReservationLog(tx, id, user.id, "RESERVATION_FINISHED");
      return updated;
    });

    publishFleetUpdate({ entity: "reservation", id });
    return finished;
  },

  async approve(id: string, user: AccessTokenPayload) {
    const approved = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });
      if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new HttpError(400, "Somente reservas pendentes podem ser aprovadas.");
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.APPROVED,
          reviewedById: user.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
        include: reservationInclude,
      });

      await syncVehicleReservationStatus(tx, reservation.vehicleId);
      await addReservationLog(tx, id, user.id, "RESERVATION_APPROVED");
      await addAuditLog(tx, user.id, "APPROVE", "Reservation", id);
      return updated;
    });

    publishFleetUpdate({ entity: "reservation", id });
    return approved;
  },

  async reject(
    id: string,
    user: AccessTokenPayload,
    reason: string,
  ) {
    const rejected = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });
      if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new HttpError(400, "Somente reservas pendentes podem ser recusadas.");
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.REJECTED,
          rejectionReason: reason,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
        include: reservationInclude,
      });

      await syncVehicleReservationStatus(tx, reservation.vehicleId);
      await addReservationLog(tx, id, user.id, "RESERVATION_REJECTED");
      await addAuditLog(tx, user.id, "REJECT", "Reservation", id);
      return updated;
    });

    publishFleetUpdate({ entity: "reservation", id });
    return rejected;
  },

  async pickup(
    id: string,
    user: AccessTokenPayload,
    data: {
      vehicle_id: string;
      took_reserved_vehicle: boolean;
      occurred_at: Date;
      mileage: number;
      fuel_level: string;
      vehicle_condition: string;
      damages: string;
      notes?: string;
      photo_data_url: string;
    },
  ) {
    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
    await assertUserHasValidCnh(reservation.userId);
    if (!canOperateReservation(user, reservation.userId)) {
      throw new HttpError(403, "Usuario sem permissao para registrar retirada.");
    }
    if (reservation.status !== ReservationStatus.APPROVED) {
      throw new HttpError(400, "A retirada exige uma reserva aprovada pela Juliana.");
    }

    const photo = await uploadReservationPhoto(data.photo_data_url, id, "pickup");

    const updated = await prisma.$transaction(async (tx) => {
      const usedVehicle = await tx.vehicle.findUnique({ where: { id: data.vehicle_id } });
      if (!usedVehicle || !usedVehicle.active) {
        throw new HttpError(404, "Veiculo retirado nao encontrado.");
      }
      if (
        data.vehicle_id !== reservation.vehicleId &&
        usedVehicle.status !== VehicleStatus.AVAILABLE
      ) {
        throw new HttpError(409, "Veiculo retirado esta indisponivel.");
      }
      if (data.mileage < usedVehicle.mileage) {
        throw new HttpError(
          400,
          `KM inicial nao pode ser menor que o KM atual do veiculo (${usedVehicle.mileage}).`,
        );
      }

      await tx.reservationOdometerRecord.upsert({
        where: {
          reservationId_type: {
            reservationId: id,
            type: ReservationOdometerType.PICKUP,
          },
        },
        update: {
          vehicleId: data.vehicle_id,
          mileage: data.mileage,
          fuelLevel: data.fuel_level,
          vehicleCondition: data.vehicle_condition,
          damages: data.damages,
          photoUrl: photo.url,
          photoPublicId: photo.publicId,
          notes: data.notes,
          occurredAt: data.occurred_at,
          tookReservedVehicle: data.took_reserved_vehicle,
          createdById: user.id,
        },
        create: {
          reservationId: id,
          type: ReservationOdometerType.PICKUP,
          vehicleId: data.vehicle_id,
          mileage: data.mileage,
          fuelLevel: data.fuel_level,
          vehicleCondition: data.vehicle_condition,
          damages: data.damages,
          photoUrl: photo.url,
          photoPublicId: photo.publicId,
          notes: data.notes,
          occurredAt: data.occurred_at,
          tookReservedVehicle: data.took_reserved_vehicle,
          createdById: user.id,
        },
      });

      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.ACTIVE },
      });

      if (data.vehicle_id !== reservation.vehicleId) {
        await syncVehicleReservationStatus(tx, reservation.vehicleId);
      }
      await tx.vehicle.update({
        where: { id: data.vehicle_id },
        data: { status: VehicleStatus.IN_USE, mileage: data.mileage },
      });
      await addReservationLog(tx, id, user.id, "RESERVATION_PICKUP_REGISTERED");
      await addAuditLog(tx, user.id, "PICKUP", "Reservation", id);

      return tx.reservation.findUniqueOrThrow({
        where: { id },
        include: reservationInclude,
      });
    });

    publishFleetUpdate({ entity: "reservation", id });
    return updated;
  },

  async returnVehicle(
    id: string,
    user: AccessTokenPayload,
    data: {
      occurred_at: Date;
      mileage: number;
      fuel_level: string;
      vehicle_condition: string;
      damages: string;
      notes?: string;
      photo_data_url: string;
    },
  ) {
    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
    if (!canOperateReservation(user, reservation.userId)) {
      throw new HttpError(403, "Usuario sem permissao para registrar devolucao.");
    }
    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new HttpError(400, "A devolucao exige uma reserva em uso.");
    }

    const pickupRecord = reservation.odometerRecords.find(
      (record) => record.type === ReservationOdometerType.PICKUP,
    );
    if (!pickupRecord) throw new HttpError(400, "Registre a retirada antes da devolucao.");
    if (data.mileage <= pickupRecord.mileage) {
      throw new HttpError(400, "KM final deve ser maior que o KM inicial.");
    }

    const returnedVehicleId = pickupRecord.vehicleId ?? reservation.vehicleId;
    const photo = await uploadReservationPhoto(data.photo_data_url, id, "return");

    const updated = await prisma.$transaction(async (tx) => {
      const returnedVehicle = await tx.vehicle.findUnique({
        where: { id: returnedVehicleId },
      });
      if (!returnedVehicle || !returnedVehicle.active) {
        throw new HttpError(404, "Veiculo devolvido nao encontrado.");
      }
      if (data.mileage < returnedVehicle.mileage) {
        throw new HttpError(
          400,
          `KM final nao pode ser menor que o KM atual do veiculo (${returnedVehicle.mileage}).`,
        );
      }

      await tx.reservationOdometerRecord.upsert({
        where: {
          reservationId_type: {
            reservationId: id,
            type: ReservationOdometerType.RETURN,
          },
        },
        update: {
          vehicleId: returnedVehicleId,
          mileage: data.mileage,
          fuelLevel: data.fuel_level,
          vehicleCondition: data.vehicle_condition,
          damages: data.damages,
          photoUrl: photo.url,
          photoPublicId: photo.publicId,
          notes: data.notes,
          occurredAt: data.occurred_at,
          createdById: user.id,
        },
        create: {
          reservationId: id,
          type: ReservationOdometerType.RETURN,
          vehicleId: returnedVehicleId,
          mileage: data.mileage,
          fuelLevel: data.fuel_level,
          vehicleCondition: data.vehicle_condition,
          damages: data.damages,
          photoUrl: photo.url,
          photoPublicId: photo.publicId,
          notes: data.notes,
          occurredAt: data.occurred_at,
          createdById: user.id,
        },
      });

      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.FINISHED },
      });
      await tx.vehicle.update({
        where: { id: returnedVehicleId },
        data: { mileage: data.mileage },
      });
      await syncVehicleReservationStatus(tx, returnedVehicleId);
      if (returnedVehicleId !== reservation.vehicleId) {
        await syncVehicleReservationStatus(tx, reservation.vehicleId);
      }
      await addReservationLog(tx, id, user.id, "RESERVATION_RETURN_REGISTERED");
      await addAuditLog(tx, user.id, "RETURN", "Reservation", id);

      return tx.reservation.findUniqueOrThrow({
        where: { id },
        include: reservationInclude,
      });
    });

    publishFleetUpdate({ entity: "reservation", id });
    return updated;
  },
};
