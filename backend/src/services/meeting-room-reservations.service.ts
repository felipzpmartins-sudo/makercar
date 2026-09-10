import {
  MeetingRoomReservationStatus,
  MeetingRoomStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { hasPermission } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { publishRoomsUpdate } from "./realtime.service.js";
import {
  blockingRoomReservationStatuses,
  timeToMinutes,
} from "./meeting-rooms.service.js";

/*
 * Reserva de sala de reuniao.
 *
 * Diferente de equipamento em tres pontos que valem a duplicacao de codigo:
 * nasce confirmada (sem aprovacao), vive dentro de um unico dia e respeita o
 * horario de funcionamento da sala.
 */

/** Reuniao mais curta que isto e quase sempre engano de digitacao. */
const MINIMUM_DURATION_MINUTES = 15;
/** Teto por reserva. Quem precisa do dia inteiro faz dois blocos e pensa duas vezes. */
const MAXIMUM_DURATION_MINUTES = 8 * 60;

const userSelect = {
  id: true,
  name: true,
  email: true,
  department: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

const reservationInclude = {
  room: {
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      heroImageUrl: true,
      location: true,
      capacity: true,
    },
  },
  user: { select: userSelect },
  cancelledBy: { select: userSelect },
  logs: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      detail: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
} satisfies Prisma.MeetingRoomReservationInclude;

function canReadAllReservations(user: AccessTokenPayload) {
  return hasPermission(user.role, "room-reservations:read-all");
}

function canCancelAnyReservation(user: AccessTokenPayload) {
  return hasPermission(user.role, "room-reservations:cancel-all");
}

async function addLog(
  tx: Prisma.TransactionClient,
  reservationId: string,
  userId: string,
  action: string,
  detail?: string,
) {
  await tx.meetingRoomReservationLog.create({
    data: { reservationId, userId, action, detail },
  });
}

async function addAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  entityId: string,
) {
  await tx.auditLog.create({
    data: { userId, action, entity: "MeetingRoomReservation", entityId },
  });
}

/**
 * Fecha as reservas cujo horario ja passou.
 *
 * Roda antes de cada leitura, como no modulo de equipamentos: sem cron no
 * projeto, e a unica forma de a agenda de ontem nao continuar "confirmada".
 */
async function completeExpiredReservations() {
  const result = await prisma.meetingRoomReservation.updateMany({
    where: {
      status: MeetingRoomReservationStatus.CONFIRMED,
      endDate: { lt: new Date() },
    },
    data: { status: MeetingRoomReservationStatus.COMPLETED },
  });
  return result.count;
}

/**
 * Choque de horario.
 *
 * Dois blocos colidem quando um comeca antes de o outro terminar. Como nao ha
 * aprovacao, so reservas confirmadas bloqueiam — e a checagem precisa ser
 * exata: e o unico controle que impede duas reunioes na mesma sala.
 */
function findConflict(
  roomId: string,
  startDate: Date,
  endDate: Date,
  ignoreReservationId?: string,
) {
  return prisma.meetingRoomReservation.findFirst({
    where: {
      id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
      roomId,
      status: { in: blockingRoomReservationStatuses },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      title: true,
      user: { select: { name: true } },
    },
  });
}

/**
 * Valida o bloco de horario contra as regras da sala.
 *
 * Tudo aqui usa o fuso de Sao Paulo de proposito: o banco guarda UTC, mas
 * "mesmo dia" e "dentro do expediente" sao perguntas sobre o relogio da parede
 * do escritorio, nao sobre UTC.
 */
function assertValidPeriod(
  startDate: Date,
  endDate: Date,
  room: { openingTime: string; closingTime: string; name: string },
) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new HttpError(400, "Informe data e horarios validos.");
  }
  if (startDate >= endDate) {
    throw new HttpError(400, "O termino deve ser posterior ao inicio.");
  }

  const start = localParts(startDate);
  const end = localParts(endDate);

  if (start.day !== end.day) {
    throw new HttpError(
      400,
      "A reserva precisa comecar e terminar no mesmo dia.",
    );
  }

  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60_000;
  if (durationMinutes < MINIMUM_DURATION_MINUTES) {
    throw new HttpError(
      400,
      `A reserva precisa ter pelo menos ${MINIMUM_DURATION_MINUTES} minutos.`,
    );
  }
  if (durationMinutes > MAXIMUM_DURATION_MINUTES) {
    throw new HttpError(
      400,
      "A reserva nao pode passar de 8 horas. Divida em blocos menores.",
    );
  }

  const opening = timeToMinutes(room.openingTime);
  const closing = timeToMinutes(room.closingTime);
  if (start.minutes < opening || end.minutes > closing) {
    throw new HttpError(
      409,
      `A ${room.name} funciona das ${room.openingTime} as ${room.closingTime}.`,
    );
  }
}

/** Dia e minutos do relogio de Sao Paulo para um instante UTC. */
function localParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const meetingRoomReservationsService = {
  /**
   * Janelas ocupadas de todas as salas.
   *
   * Ao contrario de equipamentos, o titulo da reuniao vai junto: a agenda de
   * sala so e util se as pessoas veem o que ja esta marcado ali. Nada mais do
   * solicitante e exposto alem do nome.
   */
  async availability() {
    await completeExpiredReservations();
    return prisma.meetingRoomReservation.findMany({
      where: { status: { in: blockingRoomReservationStatuses } },
      select: {
        id: true,
        roomId: true,
        startDate: true,
        endDate: true,
        status: true,
        title: true,
        attendees: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "asc" },
    });
  },

  async list(
    user: AccessTokenPayload,
    query: {
      status?: MeetingRoomReservationStatus;
      room_id?: string;
      user_id?: string;
      scope?: "own" | "all";
    } = {},
  ) {
    await completeExpiredReservations();

    const where: Prisma.MeetingRoomReservationWhereInput = {
      status: query.status,
      roomId: query.room_id,
    };

    // "all" so vale para quem pode ler tudo; qualquer outro caso fica preso ao
    // proprio usuario, mesmo que ele mande user_id de outra pessoa.
    if (query.scope === "all" && canReadAllReservations(user)) {
      where.userId = query.user_id;
    } else {
      where.userId = user.id;
    }

    return prisma.meetingRoomReservation.findMany({
      where,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: reservationInclude,
    });
  },

  async get(id: string, user: AccessTokenPayload) {
    const reservation = await prisma.meetingRoomReservation.findUnique({
      where: { id },
      include: reservationInclude,
    });
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
    if (!canReadAllReservations(user) && reservation.userId !== user.id) {
      throw new HttpError(403, "Usuario sem acesso a esta reserva.");
    }
    return reservation;
  },

  async summary(user: AccessTokenPayload) {
    if (!canReadAllReservations(user)) {
      throw new HttpError(403, "Usuario sem permissao para ver o resumo.");
    }
    await completeExpiredReservations();

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const [confirmed, cancelled, completed, today, totalRooms, blockedRooms, busyNow] =
      await Promise.all([
        prisma.meetingRoomReservation.count({
          where: { status: MeetingRoomReservationStatus.CONFIRMED },
        }),
        prisma.meetingRoomReservation.count({
          where: { status: MeetingRoomReservationStatus.CANCELLED },
        }),
        prisma.meetingRoomReservation.count({
          where: { status: MeetingRoomReservationStatus.COMPLETED },
        }),
        // Reunioes do dia: qualquer bloco que cruze o dia de hoje.
        prisma.meetingRoomReservation.count({
          where: {
            status: { in: blockingRoomReservationStatuses },
            startDate: { lt: startOfTomorrow },
            endDate: { gt: startOfToday },
          },
        }),
        prisma.meetingRoom.count({ where: { active: true } }),
        prisma.meetingRoom.count({
          where: {
            active: true,
            status: {
              in: [MeetingRoomStatus.MAINTENANCE, MeetingRoomStatus.UNAVAILABLE],
            },
          },
        }),
        prisma.meetingRoomReservation.findMany({
          where: {
            status: MeetingRoomReservationStatus.CONFIRMED,
            startDate: { lte: now },
            endDate: { gt: now },
          },
          select: { roomId: true },
          distinct: ["roomId"],
        }),
      ]);

    const busyRooms = busyNow.length;
    return {
      confirmed,
      cancelled,
      completed,
      today,
      total_rooms: totalRooms,
      busy_rooms: busyRooms,
      // Livre = ativa, sem bloqueio administrativo e sem reuniao correndo agora.
      free_rooms: Math.max(totalRooms - blockedRooms - busyRooms, 0),
      blocked_rooms: blockedRooms,
    };
  },

  async create(
    user: AccessTokenPayload,
    data: {
      room_id: string;
      start_date: Date;
      end_date: Date;
      title: string;
      attendees: number;
      notes?: string;
    },
  ) {
    const room = await prisma.meetingRoom.findUnique({
      where: { id: data.room_id },
    });
    if (!room || !room.active) {
      throw new HttpError(404, "Sala nao encontrada.");
    }

    assertValidPeriod(data.start_date, data.end_date, room);

    if (data.start_date < new Date()) {
      throw new HttpError(400, "Nao e possivel reservar um horario que ja passou.");
    }
    if (
      room.status === MeetingRoomStatus.MAINTENANCE ||
      room.status === MeetingRoomStatus.UNAVAILABLE
    ) {
      throw new HttpError(409, "Sala indisponivel para reserva no momento.");
    }
    if (data.attendees > room.capacity) {
      throw new HttpError(
        409,
        `A ${room.name} comporta ate ${room.capacity} pessoas.`,
      );
    }

    const conflict = await findConflict(
      data.room_id,
      data.start_date,
      data.end_date,
    );
    if (conflict) {
      throw new HttpError(409, describeConflict(conflict));
    }

    const created = await prisma.$transaction(async (tx) => {
      // Recheca dentro da transacao: entre a validacao acima e este ponto
      // outra pessoa pode ter enviado o mesmo horario.
      const concurrentConflict = await tx.meetingRoomReservation.findFirst({
        where: {
          roomId: data.room_id,
          status: { in: blockingRoomReservationStatuses },
          startDate: { lt: data.end_date },
          endDate: { gt: data.start_date },
        },
        select: { id: true },
      });
      if (concurrentConflict) {
        throw new HttpError(
          409,
          "Esta sala acabou de ser reservada neste horario. Escolha outro.",
        );
      }

      const reservation = await tx.meetingRoomReservation.create({
        data: {
          roomId: data.room_id,
          userId: user.id,
          startDate: data.start_date,
          endDate: data.end_date,
          title: data.title,
          attendees: data.attendees,
          notes: data.notes,
          status: MeetingRoomReservationStatus.CONFIRMED,
        },
        include: reservationInclude,
      });

      await addLog(tx, reservation.id, user.id, "ROOM_RESERVATION_CREATED");
      await addAuditLog(tx, user.id, "CREATE", reservation.id);
      return reservation;
    });

    publishRoomsUpdate({ entity: "room-reservation", id: created.id });
    return created;
  },

  async cancel(id: string, user: AccessTokenPayload, reason?: string) {
    const reservation = await prisma.meetingRoomReservation.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");

    const isOwner = reservation.userId === user.id;
    if (!isOwner && !canCancelAnyReservation(user)) {
      throw new HttpError(
        403,
        "Usuario sem permissao para cancelar esta reserva.",
      );
    }
    if (reservation.status !== MeetingRoomReservationStatus.CONFIRMED) {
      throw new HttpError(
        400,
        "Apenas reservas confirmadas podem ser canceladas.",
      );
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.meetingRoomReservation.update({
        where: { id },
        data: {
          status: MeetingRoomReservationStatus.CANCELLED,
          cancellationReason: reason,
          cancelledById: user.id,
          cancelledAt: new Date(),
        },
        include: reservationInclude,
      });
      await addLog(
        tx,
        id,
        user.id,
        isOwner
          ? "ROOM_RESERVATION_CANCELLED_BY_REQUESTER"
          : "ROOM_RESERVATION_CANCELLED_BY_ADMIN",
        reason,
      );
      await addAuditLog(tx, user.id, "CANCEL", id);
      return updated;
    });

    publishRoomsUpdate({ entity: "room-reservation", id });
    return cancelled;
  },
};

function describeConflict(conflict: {
  startDate: Date;
  endDate: Date;
  title: string;
  user: { name: string };
}) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const firstName = conflict.user.name.trim().split(/\s+/)[0];
  return `Esta sala ja esta reservada das ${formatter.format(
    conflict.startDate,
  )} as ${formatter.format(conflict.endDate)} (${conflict.title} — ${firstName}).`;
}
