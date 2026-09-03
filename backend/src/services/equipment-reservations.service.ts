import {
  EquipmentReservationStatus,
  EquipmentStatus,
  type Prisma,
} from "@prisma/client";

import {
  EQUIPMENT_TERMS_VERSION,
  equipmentTerms,
} from "../config/equipment-terms.js";
import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { hasPermission } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { assertEquipmentAccess } from "./equipment-access.service.js";
import { blockingReservationStatuses } from "./equipment.service.js";
import { publishEquipmentUpdate } from "./realtime.service.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  department: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

const reservationInclude = {
  equipment: {
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      heroImageUrl: true,
      location: true,
      category: { select: { id: true, name: true, slug: true, icon: true } },
    },
  },
  user: { select: userSelect },
  reviewedBy: { select: userSelect },
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
} satisfies Prisma.EquipmentReservationInclude;

function canReviewReservations(user: AccessTokenPayload) {
  return hasPermission(user.role, "equipment-reservations:review");
}

function canReadAllReservations(user: AccessTokenPayload) {
  return hasPermission(user.role, "equipment-reservations:read-all");
}

async function addLog(
  tx: Prisma.TransactionClient,
  reservationId: string,
  userId: string,
  action: string,
  detail?: string,
) {
  await tx.equipmentReservationLog.create({
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
    data: { userId, action, entity: "EquipmentReservation", entityId },
  });
}

/**
 * Marca como concluidas as reservas aprovadas cujo periodo ja terminou.
 *
 * Roda antes de cada leitura em vez de num agendador: o sistema nao tem cron e
 * uma reserva "aprovada" de semana passada aparecendo como ativa confunde tanto
 * o usuario quanto a checagem de conflito.
 */
async function completeExpiredReservations() {
  const result = await prisma.equipmentReservation.updateMany({
    where: {
      status: EquipmentReservationStatus.APPROVED,
      endDate: { lt: new Date() },
    },
    data: { status: EquipmentReservationStatus.COMPLETED },
  });
  return result.count;
}

/**
 * Conflito de agenda.
 *
 * Duas reservas colidem quando os intervalos se sobrepoem: uma comeca antes da
 * outra terminar. Pendentes tambem bloqueiam — se nao bloqueassem, duas pessoas
 * poderiam pedir o mesmo robo no mesmo horario e uma delas so descobriria na
 * recusa.
 */
async function findConflict(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  ignoreReservationId?: string,
) {
  return prisma.equipmentReservation.findFirst({
    where: {
      id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
      equipmentId,
      status: { in: blockingReservationStatuses },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      user: { select: { name: true } },
    },
  });
}

function assertValidPeriod(startDate: Date, endDate: Date) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new HttpError(400, "Informe datas e horarios validos.");
  }
  if (startDate >= endDate) {
    throw new HttpError(
      400,
      "O termino da reserva deve ser posterior ao inicio.",
    );
  }
}

export const equipmentReservationsService = {
  getTerms() {
    return equipmentTerms;
  },

  /**
   * Janelas ocupadas de todos os equipamentos.
   *
   * Devolve apenas equipamento, periodo e situacao: serve para desenhar o
   * calendario e avisar de conflito sem expor finalidade ou solicitante a quem
   * nao tem permissao de ver as reservas alheias.
   */
  async availability() {
    await completeExpiredReservations();
    return prisma.equipmentReservation.findMany({
      where: { status: { in: blockingReservationStatuses } },
      select: {
        id: true,
        equipmentId: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: { startDate: "asc" },
    });
  },

  async list(
    user: AccessTokenPayload,
    query: {
      status?: EquipmentReservationStatus;
      equipment_id?: string;
      user_id?: string;
      scope?: "own" | "all";
    } = {},
  ) {
    await completeExpiredReservations();

    const where: Prisma.EquipmentReservationWhereInput = {
      status: query.status,
      equipmentId: query.equipment_id,
    };

    // "all" so vale para quem pode ler tudo; qualquer outro caso fica preso ao
    // proprio usuario, mesmo que ele mande user_id de outra pessoa.
    if (query.scope === "all" && canReadAllReservations(user)) {
      where.userId = query.user_id;
    } else {
      where.userId = user.id;
    }

    return prisma.equipmentReservation.findMany({
      where,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: reservationInclude,
    });
  },

  async get(id: string, user: AccessTokenPayload) {
    const reservation = await prisma.equipmentReservation.findUnique({
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

    const [
      pending,
      approved,
      rejected,
      cancelled,
      completed,
      today,
      totalEquipments,
      blockedEquipments,
      busyNow,
    ] = await Promise.all([
      prisma.equipmentReservation.count({
        where: { status: EquipmentReservationStatus.PENDING },
      }),
      prisma.equipmentReservation.count({
        where: { status: EquipmentReservationStatus.APPROVED },
      }),
      prisma.equipmentReservation.count({
        where: { status: EquipmentReservationStatus.REJECTED },
      }),
      prisma.equipmentReservation.count({
        where: { status: EquipmentReservationStatus.CANCELLED },
      }),
      prisma.equipmentReservation.count({
        where: { status: EquipmentReservationStatus.COMPLETED },
      }),
      // Reservas do dia: qualquer uma cujo periodo cruze o dia de hoje.
      prisma.equipmentReservation.count({
        where: {
          status: { in: blockingReservationStatuses },
          startDate: { lt: startOfTomorrow },
          endDate: { gt: startOfToday },
        },
      }),
      prisma.equipment.count({ where: { active: true } }),
      prisma.equipment.count({
        where: {
          active: true,
          status: {
            in: [EquipmentStatus.MAINTENANCE, EquipmentStatus.UNAVAILABLE],
          },
        },
      }),
      prisma.equipmentReservation.findMany({
        where: {
          status: EquipmentReservationStatus.APPROVED,
          startDate: { lte: now },
          endDate: { gt: now },
        },
        select: { equipmentId: true },
        distinct: ["equipmentId"],
      }),
    ]);

    const reservedNow = busyNow.length;
    return {
      pending,
      approved,
      rejected,
      cancelled,
      completed,
      today,
      total_equipments: totalEquipments,
      reserved_equipments: reservedNow,
      // Livre = ativo, sem bloqueio administrativo e sem reserva correndo agora.
      available_equipments: Math.max(
        totalEquipments - blockedEquipments - reservedNow,
        0,
      ),
      blocked_equipments: blockedEquipments,
    };
  },

  async create(
    user: AccessTokenPayload,
    data: {
      equipment_id: string;
      start_date: Date;
      end_date: Date;
      operator_name: string;
      purpose: string;
      usage_location: string;
      notes?: string;
      terms_accepted: true;
      terms_version: string;
      access_password?: string;
    },
  ) {
    // Primeira porta: com o modulo em "em breve", so passa quem tem a senha.
    assertEquipmentAccess(data.access_password);
    assertValidPeriod(data.start_date, data.end_date);

    if (data.terms_version !== EQUIPMENT_TERMS_VERSION) {
      throw new HttpError(
        409,
        "O Termo de Responsabilidade foi atualizado. Recarregue a pagina e leia a nova versao antes de enviar.",
      );
    }

    const conflict = await findConflict(
      data.equipment_id,
      data.start_date,
      data.end_date,
    );
    if (conflict) {
      throw new HttpError(409, describeConflict(conflict));
    }

    const created = await prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({
        where: { id: data.equipment_id },
      });
      if (!equipment || !equipment.active) {
        throw new HttpError(404, "Equipamento nao encontrado.");
      }
      if (
        equipment.status === EquipmentStatus.MAINTENANCE ||
        equipment.status === EquipmentStatus.UNAVAILABLE
      ) {
        throw new HttpError(
          409,
          "Equipamento indisponivel para reserva no momento.",
        );
      }

      // Recheca dentro da transacao: entre a validacao acima e este ponto
      // outra pessoa pode ter enviado a mesma janela.
      const concurrentConflict = await tx.equipmentReservation.findFirst({
        where: {
          equipmentId: data.equipment_id,
          status: { in: blockingReservationStatuses },
          startDate: { lt: data.end_date },
          endDate: { gt: data.start_date },
        },
        select: { id: true },
      });
      if (concurrentConflict) {
        throw new HttpError(
          409,
          "Este equipamento acabou de ser reservado neste periodo. Escolha outro horario.",
        );
      }

      const reservation = await tx.equipmentReservation.create({
        data: {
          equipmentId: data.equipment_id,
          userId: user.id,
          startDate: data.start_date,
          endDate: data.end_date,
          operatorName: data.operator_name,
          purpose: data.purpose,
          usageLocation: data.usage_location,
          notes: data.notes,
          status: EquipmentReservationStatus.PENDING,
          termsAcceptedAt: new Date(),
          termsVersion: data.terms_version,
        },
        include: reservationInclude,
      });

      await addLog(
        tx,
        reservation.id,
        user.id,
        "EQUIPMENT_RESERVATION_CREATED",
        `Termo ${data.terms_version} aceito.`,
      );
      await addAuditLog(tx, user.id, "CREATE", reservation.id);
      return reservation;
    });

    publishEquipmentUpdate({
      entity: "equipment-reservation",
      id: created.id,
    });
    return created;
  },

  async approve(id: string, user: AccessTokenPayload) {
    if (!canReviewReservations(user)) {
      throw new HttpError(403, "Usuario sem permissao para aprovar reservas.");
    }

    const reservation = await prisma.equipmentReservation.findUnique({
      where: { id },
      select: { id: true, status: true, equipmentId: true, startDate: true, endDate: true },
    });
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
    if (reservation.status !== EquipmentReservationStatus.PENDING) {
      throw new HttpError(400, "Apenas reservas pendentes podem ser aprovadas.");
    }

    // Outra reserva ja aprovada para a mesma janela impede a aprovacao: duas
    // pendentes sobrepostas podem coexistir ate alguem decidir qual vale.
    const approvedConflict = await prisma.equipmentReservation.findFirst({
      where: {
        id: { not: id },
        equipmentId: reservation.equipmentId,
        status: EquipmentReservationStatus.APPROVED,
        startDate: { lt: reservation.endDate },
        endDate: { gt: reservation.startDate },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        user: { select: { name: true } },
      },
    });
    if (approvedConflict) {
      throw new HttpError(409, describeConflict(approvedConflict));
    }

    const approved = await prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentReservation.update({
        where: { id },
        data: {
          status: EquipmentReservationStatus.APPROVED,
          reviewedById: user.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
        include: reservationInclude,
      });
      await addLog(tx, id, user.id, "EQUIPMENT_RESERVATION_APPROVED");
      await addAuditLog(tx, user.id, "APPROVE", id);
      return updated;
    });

    publishEquipmentUpdate({ entity: "equipment-reservation", id });
    return approved;
  },

  async reject(id: string, user: AccessTokenPayload, reason: string) {
    if (!canReviewReservations(user)) {
      throw new HttpError(403, "Usuario sem permissao para recusar reservas.");
    }

    const reservation = await prisma.equipmentReservation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
    if (
      reservation.status !== EquipmentReservationStatus.PENDING &&
      reservation.status !== EquipmentReservationStatus.APPROVED
    ) {
      throw new HttpError(
        400,
        "Apenas reservas pendentes ou aprovadas podem ser recusadas.",
      );
    }

    const rejected = await prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentReservation.update({
        where: { id },
        data: {
          status: EquipmentReservationStatus.REJECTED,
          rejectionReason: reason,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
        include: reservationInclude,
      });
      await addLog(tx, id, user.id, "EQUIPMENT_RESERVATION_REJECTED", reason);
      await addAuditLog(tx, user.id, "REJECT", id);
      return updated;
    });

    publishEquipmentUpdate({ entity: "equipment-reservation", id });
    return rejected;
  },

  async cancel(id: string, user: AccessTokenPayload, reason?: string) {
    const reservation = await prisma.equipmentReservation.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");

    const isOwner = reservation.userId === user.id;
    if (!isOwner && !canReviewReservations(user)) {
      throw new HttpError(403, "Usuario sem permissao para cancelar esta reserva.");
    }
    if (
      reservation.status !== EquipmentReservationStatus.PENDING &&
      reservation.status !== EquipmentReservationStatus.APPROVED
    ) {
      throw new HttpError(
        400,
        "Apenas reservas pendentes ou aprovadas podem ser canceladas.",
      );
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentReservation.update({
        where: { id },
        data: {
          status: EquipmentReservationStatus.CANCELLED,
          cancellationReason: reason,
          reviewedById: isOwner ? undefined : user.id,
          reviewedAt: isOwner ? undefined : new Date(),
        },
        include: reservationInclude,
      });
      await addLog(
        tx,
        id,
        user.id,
        isOwner
          ? "EQUIPMENT_RESERVATION_CANCELLED_BY_REQUESTER"
          : "EQUIPMENT_RESERVATION_CANCELLED_BY_ADMIN",
        reason,
      );
      await addAuditLog(tx, user.id, "CANCEL", id);
      return updated;
    });

    publishEquipmentUpdate({ entity: "equipment-reservation", id });
    return cancelled;
  },

  async complete(id: string, user: AccessTokenPayload) {
    if (!canReviewReservations(user)) {
      throw new HttpError(403, "Usuario sem permissao para concluir reservas.");
    }

    const reservation = await prisma.equipmentReservation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!reservation) throw new HttpError(404, "Reserva nao encontrada.");
    if (reservation.status !== EquipmentReservationStatus.APPROVED) {
      throw new HttpError(
        400,
        "Apenas reservas aprovadas podem ser concluidas.",
      );
    }

    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentReservation.update({
        where: { id },
        data: { status: EquipmentReservationStatus.COMPLETED },
        include: reservationInclude,
      });
      await addLog(tx, id, user.id, "EQUIPMENT_RESERVATION_COMPLETED");
      await addAuditLog(tx, user.id, "COMPLETE", id);
      return updated;
    });

    publishEquipmentUpdate({ entity: "equipment-reservation", id });
    return completed;
  },
};

function describeConflict(conflict: {
  startDate: Date;
  endDate: Date;
  status: EquipmentReservationStatus;
}) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const situation =
    conflict.status === EquipmentReservationStatus.APPROVED
      ? "reserva aprovada"
      : "solicitacao pendente";
  return `Ja existe ${situation} para este equipamento de ${formatter.format(
    conflict.startDate,
  )} ate ${formatter.format(conflict.endDate)}.`;
}
