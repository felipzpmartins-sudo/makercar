import {
  EquipmentReservationStatus,
  EquipmentStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { publishEquipmentUpdate } from "./realtime.service.js";

/*
 * Catalogo de equipamentos internos.
 *
 * O que esta gravado em `status` e a decisao do administrador (manutencao,
 * indisponivel...). A ocupacao do momento nao e gravada: e derivada das
 * reservas aprovadas. Status gravado e agenda se separam com facilidade — foi
 * o que aconteceu com a frota antes do fleet-status.service.
 */

/** Reservas que efetivamente ocupam a agenda de um equipamento. */
export const blockingReservationStatuses: EquipmentReservationStatus[] = [
  EquipmentReservationStatus.PENDING,
  EquipmentReservationStatus.APPROVED,
];

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  icon: true,
  sortOrder: true,
} satisfies Prisma.EquipmentCategorySelect;

const reservationWindowSelect = {
  id: true,
  equipmentId: true,
  startDate: true,
  endDate: true,
  status: true,
  purpose: true,
  usageLocation: true,
  operatorName: true,
  user: { select: { id: true, name: true } },
} satisfies Prisma.EquipmentReservationSelect;

type EquipmentWithCategory = Prisma.EquipmentGetPayload<{
  include: { category: { select: typeof categorySelect } };
}>;

type ReservationWindow = Prisma.EquipmentReservationGetPayload<{
  select: typeof reservationWindowSelect;
}>;

/**
 * Junta o equipamento com a agenda para o cliente nao precisar cruzar as duas
 * listas: devolve o que ocupa o equipamento agora e o proximo compromisso.
 */
function withAvailability(
  equipment: EquipmentWithCategory,
  reservations: ReservationWindow[],
  now: Date,
) {
  const equipmentReservations = reservations
    .filter((reservation) => reservation.equipmentId === equipment.id)
    .sort(
      (first, second) => first.startDate.getTime() - second.startDate.getTime(),
    );

  const current =
    equipmentReservations.find(
      (reservation) =>
        reservation.status === EquipmentReservationStatus.APPROVED &&
        reservation.startDate <= now &&
        reservation.endDate > now,
    ) ?? null;

  const next =
    equipmentReservations.find((reservation) => reservation.startDate > now) ??
    null;

  const isBlockedByAdmin =
    equipment.status === EquipmentStatus.MAINTENANCE ||
    equipment.status === EquipmentStatus.UNAVAILABLE;

  return {
    ...equipment,
    // O status efetivo e o que a interface mostra; `status` continua sendo a
    // decisao do administrador, para o painel poder edita-la.
    effectiveStatus: isBlockedByAdmin
      ? equipment.status
      : current
        ? EquipmentStatus.IN_USE
        : next
          ? EquipmentStatus.RESERVED
          : EquipmentStatus.AVAILABLE,
    currentReservation: current,
    nextReservation: next,
    upcomingCount: equipmentReservations.filter(
      (reservation) => reservation.endDate > now,
    ).length,
  };
}

function loadReservationWindows(equipmentIds: string[]) {
  return prisma.equipmentReservation.findMany({
    where: {
      equipmentId: { in: equipmentIds },
      status: { in: blockingReservationStatuses },
    },
    select: reservationWindowSelect,
    orderBy: { startDate: "asc" },
  });
}

export const equipmentService = {
  listCategories() {
    return prisma.equipmentCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        ...categorySelect,
        _count: { select: { equipments: { where: { active: true } } } },
      },
    });
  },

  async list(options: { includeInactive?: boolean } = {}) {
    const equipments = await prisma.equipment.findMany({
      where: options.includeInactive ? undefined : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: categorySelect } },
    });

    const reservations = await loadReservationWindows(
      equipments.map((equipment) => equipment.id),
    );
    const now = new Date();
    return equipments.map((equipment) =>
      withAvailability(equipment, reservations, now),
    );
  },

  async get(id: string) {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { category: { select: categorySelect } },
    });
    if (!equipment) throw new HttpError(404, "Equipamento nao encontrado.");

    const reservations = await loadReservationWindows([equipment.id]);
    return withAvailability(equipment, reservations, new Date());
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    category_id: string;
    image_url?: string;
    hero_image_url?: string;
    status?: EquipmentStatus;
    location?: string;
    notes?: string;
    usage_rules?: string;
    specs?: Array<{ label: string; value: string }>;
    sort_order?: number;
    active?: boolean;
  }) {
    const category = await prisma.equipmentCategory.findUnique({
      where: { id: data.category_id },
    });
    if (!category) throw new HttpError(404, "Categoria nao encontrada.");

    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.category_id,
        imageUrl: data.image_url,
        heroImageUrl: data.hero_image_url,
        status: data.status ?? EquipmentStatus.AVAILABLE,
        location: data.location,
        notes: data.notes,
        usageRules: data.usage_rules,
        specs: data.specs ?? undefined,
        sortOrder: data.sort_order ?? 0,
        active: data.active ?? true,
      },
      include: { category: { select: categorySelect } },
    });

    publishEquipmentUpdate({ entity: "equipment", id: equipment.id });
    return equipment;
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      category_id: string;
      image_url: string;
      hero_image_url: string;
      status: EquipmentStatus;
      location: string;
      notes: string;
      usage_rules: string;
      specs: Array<{ label: string; value: string }>;
      sort_order: number;
      active: boolean;
    }>,
  ) {
    await equipmentService.get(id);

    if (data.category_id) {
      const category = await prisma.equipmentCategory.findUnique({
        where: { id: data.category_id },
      });
      if (!category) throw new HttpError(404, "Categoria nao encontrada.");
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.category_id,
        imageUrl: data.image_url,
        heroImageUrl: data.hero_image_url,
        status: data.status,
        location: data.location,
        notes: data.notes,
        usageRules: data.usage_rules,
        specs: data.specs ?? undefined,
        sortOrder: data.sort_order,
        active: data.active,
      },
      include: { category: { select: categorySelect } },
    });

    publishEquipmentUpdate({ entity: "equipment", id });
    return equipment;
  },

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    sort_order?: number;
  }) {
    const category = await prisma.equipmentCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        sortOrder: data.sort_order ?? 0,
      },
      select: categorySelect,
    });

    publishEquipmentUpdate({ entity: "equipment", id: category.id });
    return category;
  },
};
