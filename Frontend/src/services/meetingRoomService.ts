import type {
  MeetingRoom,
  MeetingRoomAvailability,
  MeetingRoomReservation,
  MeetingRoomReservationDraft,
  MeetingRoomReservationStatus,
  MeetingRoomReservationWindow,
  MeetingRoomStatus,
  MeetingRoomSummary,
} from "@/data/meetingRooms";
import { apiRequest } from "@/services/apiClient";

type ApiRoomStatus = "AVAILABLE" | "RESERVED" | "IN_USE" | "MAINTENANCE" | "UNAVAILABLE";

type ApiRoomReservationStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

interface ApiReservationWindow {
  id: string;
  startDate: string;
  endDate: string;
  status: ApiRoomReservationStatus;
  title?: string | null;
  attendees?: number | null;
  user?: { id: string; name: string } | null;
}

interface ApiAvailabilityWindow extends ApiReservationWindow {
  roomId: string;
}

interface ApiRoom {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  heroImageUrl?: string | null;
  status: ApiRoomStatus;
  effectiveStatus: ApiRoomStatus;
  location?: string | null;
  capacity: number;
  amenities?: unknown;
  notes?: string | null;
  usageRules?: string | null;
  openingTime: string;
  closingTime: string;
  active: boolean;
  currentReservation?: ApiReservationWindow | null;
  nextReservation?: ApiReservationWindow | null;
  upcomingCount?: number;
}

interface ApiRoomReservation {
  id: string;
  roomId: string;
  userId: string;
  startDate: string;
  endDate: string;
  title: string;
  attendees: number;
  notes?: string | null;
  status: ApiRoomReservationStatus;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  room: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    heroImageUrl?: string | null;
    location?: string | null;
    capacity: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    department: { id: string; name: string };
  };
  cancelledBy?: { id: string; name: string; email: string } | null;
  logs?: Array<{
    id: string;
    action: string;
    detail?: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface ApiSummary {
  confirmed: number;
  cancelled: number;
  completed: number;
  today: number;
  total_rooms: number;
  busy_rooms: number;
  free_rooms: number;
  blocked_rooms: number;
}

const statusFromApi: Record<ApiRoomStatus, MeetingRoomStatus> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservada",
  IN_USE: "Em uso",
  MAINTENANCE: "Em manutenção",
  UNAVAILABLE: "Indisponível",
};

const statusToApi: Record<MeetingRoomStatus, ApiRoomStatus> = {
  Disponível: "AVAILABLE",
  Reservada: "RESERVED",
  "Em uso": "IN_USE",
  "Em manutenção": "MAINTENANCE",
  Indisponível: "UNAVAILABLE",
};

const reservationStatusFromApi: Record<ApiRoomReservationStatus, MeetingRoomReservationStatus> = {
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
};

function splitDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  return {
    date: formatDateValue(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  };
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/*
 * O backend guarda instantes em UTC; o formulario trabalha com data e hora
 * locais. Anexar o offset do navegador evita o classico "marquei as 09:00 e
 * apareceu 06:00" — mesma conversao dos outros dois modulos.
 */
function toApiDateTime(date: string, time: string) {
  const selectedTime = time || "00:00";
  const value = new Date(`${date}T${selectedTime}:00`);
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");
  return `${date}T${selectedTime}:00${sign}${offsetHours}:${offsetRemainder}`;
}

function normalizeAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeWindow(
  window: ApiReservationWindow | null | undefined,
): MeetingRoomReservationWindow | undefined {
  if (!window) return undefined;
  const start = splitDateTime(window.startDate);
  const end = splitDateTime(window.endDate);

  return {
    id: window.id,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    status: reservationStatusFromApi[window.status],
    title: window.title ?? undefined,
    attendees: window.attendees ?? undefined,
    requesterName: window.user?.name,
  };
}

function normalizeRoom(room: ApiRoom): MeetingRoom {
  /*
   * Sem imagem o campo fica vazio de proposito: quem desenha e o RoomPhoto,
   * que mostra um espaco neutro com icone de porta. Um icone generico
   * esticado num retangulo de foto pareceria erro de carregamento.
   */
  const image = room.imageUrl ?? "";

  return {
    id: room.id,
    name: room.name,
    slug: room.slug,
    description: room.description ?? "",
    image,
    heroImage: room.heroImageUrl || image,
    status: statusFromApi[room.status],
    effectiveStatus: statusFromApi[room.effectiveStatus ?? room.status],
    location: room.location ?? "",
    capacity: room.capacity,
    amenities: normalizeAmenities(room.amenities),
    notes: room.notes ?? "",
    usageRules: room.usageRules ?? "",
    openingTime: room.openingTime,
    closingTime: room.closingTime,
    currentReservation: normalizeWindow(room.currentReservation),
    nextReservation: normalizeWindow(room.nextReservation),
    upcomingCount: room.upcomingCount ?? 0,
    active: room.active,
  };
}

function normalizeReservation(reservation: ApiRoomReservation): MeetingRoomReservation {
  const start = splitDateTime(reservation.startDate);
  const end = splitDateTime(reservation.endDate);

  return {
    id: reservation.id,
    roomId: reservation.roomId,
    roomName: reservation.room.name,
    roomImage: reservation.room.imageUrl ?? "",
    roomLocation: reservation.room.location ?? "",
    requesterId: reservation.user.id,
    requesterName: reservation.user.name,
    requesterEmail: reservation.user.email,
    requesterDepartment: reservation.user.department.name,
    title: reservation.title,
    attendees: reservation.attendees,
    notes: reservation.notes ?? "",
    // A reserva vive dentro de um dia, entao uma data so basta.
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    status: reservationStatusFromApi[reservation.status],
    cancellationReason: reservation.cancellationReason ?? undefined,
    cancelledByName: reservation.cancelledBy?.name,
    cancelledAt: reservation.cancelledAt ?? undefined,
    createdAt: reservation.createdAt,
    logs: reservation.logs?.map((log) => ({
      id: log.id,
      action: log.action,
      detail: log.detail ?? undefined,
      createdAt: log.createdAt,
      user: log.user,
    })),
  };
}

export const meetingRoomService = {
  async list() {
    const rooms = await apiRequest<ApiRoom[]>("/rooms");
    return rooms.map(normalizeRoom);
  },

  async get(roomId: string) {
    return normalizeRoom(await apiRequest<ApiRoom>(`/rooms/${roomId}`));
  },

  async updateStatus(roomId: string, status: MeetingRoomStatus) {
    return normalizeRoom(
      await apiRequest<ApiRoom>(`/rooms/${roomId}`, {
        method: "PUT",
        body: JSON.stringify({ status: statusToApi[status] }),
      }),
    );
  },

  async update(
    roomId: string,
    data: Partial<{
      name: string;
      description: string;
      location: string;
      capacity: number;
      amenities: string[];
      notes: string;
      usageRules: string;
      openingTime: string;
      closingTime: string;
      status: MeetingRoomStatus;
      active: boolean;
    }>,
  ) {
    return normalizeRoom(
      await apiRequest<ApiRoom>(`/rooms/${roomId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          location: data.location,
          capacity: data.capacity,
          amenities: data.amenities,
          notes: data.notes,
          usage_rules: data.usageRules,
          opening_time: data.openingTime,
          closing_time: data.closingTime,
          status: data.status ? statusToApi[data.status] : undefined,
          active: data.active,
        }),
      }),
    );
  },
};

export const meetingRoomReservationService = {
  /** Reservas do proprio usuario. */
  async listOwn() {
    const reservations = await apiRequest<ApiRoomReservation[]>("/room-reservations");
    return reservations.map(normalizeReservation);
  },

  /** Todas as reservas — exige permissao de administracao. */
  async listAll() {
    const reservations = await apiRequest<ApiRoomReservation[]>("/room-reservations?scope=all");
    return reservations.map(normalizeReservation);
  },

  async listAvailability() {
    const periods = await apiRequest<ApiAvailabilityWindow[]>("/room-reservations/availability");

    return periods.map<MeetingRoomAvailability>((period) => {
      const start = splitDateTime(period.startDate);
      const end = splitDateTime(period.endDate);

      return {
        id: period.id,
        roomId: period.roomId,
        date: start.date,
        startTime: start.time,
        endTime: end.time,
        status: reservationStatusFromApi[period.status],
        title: period.title ?? "",
        attendees: period.attendees ?? 1,
        requesterId: period.user?.id ?? "",
        requesterName: period.user?.name ?? "",
      };
    });
  },

  async summary(): Promise<MeetingRoomSummary> {
    const summary = await apiRequest<ApiSummary>("/room-reservations/summary");
    return {
      confirmed: summary.confirmed,
      cancelled: summary.cancelled,
      completed: summary.completed,
      today: summary.today,
      totalRooms: summary.total_rooms,
      busyRooms: summary.busy_rooms,
      freeRooms: summary.free_rooms,
      blockedRooms: summary.blocked_rooms,
    };
  },

  async create(draft: MeetingRoomReservationDraft) {
    const reservation = await apiRequest<ApiRoomReservation>("/room-reservations", {
      method: "POST",
      body: JSON.stringify({
        room_id: draft.roomId,
        start_date: toApiDateTime(draft.date, draft.startTime),
        end_date: toApiDateTime(draft.date, draft.endTime),
        title: draft.title.trim(),
        attendees: draft.attendees,
        notes: draft.notes.trim() || undefined,
      }),
    });
    return normalizeReservation(reservation);
  },

  async cancel(reservationId: string, reason?: string) {
    return normalizeReservation(
      await apiRequest<ApiRoomReservation>(`/room-reservations/${reservationId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: reason?.trim() || undefined }),
      }),
    );
  },
};
