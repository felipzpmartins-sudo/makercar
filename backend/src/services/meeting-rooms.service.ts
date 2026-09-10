import {
  MeetingRoomReservationStatus,
  MeetingRoomStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { publishRoomsUpdate } from "./realtime.service.js";

/*
 * Catalogo das salas de reuniao.
 *
 * Mesma divisao do equipment.service: `status` guarda a decisao do
 * administrador (manutencao, indisponivel) e a ocupacao do momento e derivada
 * das reservas. Uma sala nunca fica "presa" em RESERVED porque alguem esqueceu
 * de mudar o status na mao.
 */

/** Reservas que ocupam a agenda. Cancelada e concluida nao bloqueiam nada. */
export const blockingRoomReservationStatuses: MeetingRoomReservationStatus[] = [
  MeetingRoomReservationStatus.CONFIRMED,
];

const reservationWindowSelect = {
  id: true,
  roomId: true,
  startDate: true,
  endDate: true,
  status: true,
  title: true,
  attendees: true,
  user: { select: { id: true, name: true } },
} satisfies Prisma.MeetingRoomReservationSelect;

type ReservationWindow = Prisma.MeetingRoomReservationGetPayload<{
  select: typeof reservationWindowSelect;
}>;

/**
 * Junta a sala com a agenda: quem esta la agora e qual e a proxima reuniao.
 * Evita que o cliente precise cruzar duas listas para montar o card.
 */
function withAvailability(
  room: Prisma.MeetingRoomGetPayload<object>,
  reservations: ReservationWindow[],
  now: Date,
) {
  const roomReservations = reservations
    .filter((reservation) => reservation.roomId === room.id)
    .sort(
      (first, second) => first.startDate.getTime() - second.startDate.getTime(),
    );

  const current =
    roomReservations.find(
      (reservation) =>
        reservation.startDate <= now && reservation.endDate > now,
    ) ?? null;

  const next =
    roomReservations.find((reservation) => reservation.startDate > now) ?? null;

  const isBlockedByAdmin =
    room.status === MeetingRoomStatus.MAINTENANCE ||
    room.status === MeetingRoomStatus.UNAVAILABLE;

  /*
   * "Reservado" so vale para o que acontece hoje. Uma reuniao marcada para a
   * semana que vem nao pode fazer a sala parecer ocupada agora — quem olha o
   * card quer saber se pode entrar.
   */
  const hasReservationToday =
    next !== null && next.startDate.toDateString() === now.toDateString();

  return {
    ...room,
    effectiveStatus: isBlockedByAdmin
      ? room.status
      : current
        ? MeetingRoomStatus.IN_USE
        : hasReservationToday
          ? MeetingRoomStatus.RESERVED
          : MeetingRoomStatus.AVAILABLE,
    currentReservation: current,
    nextReservation: next,
    upcomingCount: roomReservations.filter(
      (reservation) => reservation.endDate > now,
    ).length,
  };
}

function loadReservationWindows(roomIds: string[]) {
  return prisma.meetingRoomReservation.findMany({
    where: {
      roomId: { in: roomIds },
      status: { in: blockingRoomReservationStatuses },
    },
    select: reservationWindowSelect,
    orderBy: { startDate: "asc" },
  });
}

export const meetingRoomsService = {
  async list(options: { includeInactive?: boolean } = {}) {
    const rooms = await prisma.meetingRoom.findMany({
      where: options.includeInactive ? undefined : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const reservations = await loadReservationWindows(
      rooms.map((room) => room.id),
    );
    const now = new Date();
    return rooms.map((room) => withAvailability(room, reservations, now));
  },

  async get(id: string) {
    const room = await prisma.meetingRoom.findUnique({ where: { id } });
    if (!room) throw new HttpError(404, "Sala nao encontrada.");

    const reservations = await loadReservationWindows([room.id]);
    return withAvailability(room, reservations, new Date());
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    hero_image_url?: string;
    status?: MeetingRoomStatus;
    location?: string;
    capacity?: number;
    amenities?: string[];
    notes?: string;
    usage_rules?: string;
    opening_time?: string;
    closing_time?: string;
    sort_order?: number;
    active?: boolean;
  }) {
    assertOpeningWindow(data.opening_time, data.closing_time);

    const room = await prisma.meetingRoom.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.image_url,
        heroImageUrl: data.hero_image_url,
        status: data.status ?? MeetingRoomStatus.AVAILABLE,
        location: data.location,
        capacity: data.capacity ?? 6,
        amenities: data.amenities ?? undefined,
        notes: data.notes,
        usageRules: data.usage_rules,
        openingTime: data.opening_time ?? "07:00",
        closingTime: data.closing_time ?? "19:00",
        sortOrder: data.sort_order ?? 0,
        active: data.active ?? true,
      },
    });

    publishRoomsUpdate({ entity: "room", id: room.id });
    return room;
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      image_url: string;
      hero_image_url: string;
      status: MeetingRoomStatus;
      location: string;
      capacity: number;
      amenities: string[];
      notes: string;
      usage_rules: string;
      opening_time: string;
      closing_time: string;
      sort_order: number;
      active: boolean;
    }>,
  ) {
    const current = await meetingRoomsService.get(id);
    assertOpeningWindow(
      data.opening_time ?? current.openingTime,
      data.closing_time ?? current.closingTime,
    );

    const room = await prisma.meetingRoom.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.image_url,
        heroImageUrl: data.hero_image_url,
        status: data.status,
        location: data.location,
        capacity: data.capacity,
        amenities: data.amenities ?? undefined,
        notes: data.notes,
        usageRules: data.usage_rules,
        openingTime: data.opening_time,
        closingTime: data.closing_time,
        sortOrder: data.sort_order,
        active: data.active,
      },
    });

    publishRoomsUpdate({ entity: "room", id });
    return room;
  },
};

/** Converte "14:30" em minutos desde a meia-noite. */
export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN;
  return hours * 60 + minutes;
}

function assertOpeningWindow(opening?: string, closing?: string) {
  if (!opening || !closing) return;

  const start = timeToMinutes(opening);
  const end = timeToMinutes(closing);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new HttpError(400, "Informe horarios de funcionamento validos.");
  }
  if (start >= end) {
    throw new HttpError(
      400,
      "O horario de fechamento deve ser posterior ao de abertura.",
    );
  }
}
