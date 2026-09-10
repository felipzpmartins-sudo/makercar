/*
 * Salas de reuniao — tipos e vocabulario visual.
 *
 * Segue a mesma divisao de data/equipment.ts: a API fala em maiusculas
 * (AVAILABLE, CONFIRMED...) e a interface fala em portugues. A traducao
 * acontece uma unica vez, no service.
 *
 * A diferenca de fundo em relacao a equipamento: aqui a reserva nasce
 * confirmada e vive dentro de um dia. Por isso o vocabulario e menor — nao
 * existe "Pendente" nem "Recusada" para explicar.
 */

export type MeetingRoomStatus =
  "Disponível" | "Reservada" | "Em uso" | "Em manutenção" | "Indisponível";

export type MeetingRoomReservationStatus = "Confirmada" | "Cancelada" | "Concluída";

/** Reuniao resumida — o que ocupa a sala agora ou em seguida. */
export interface MeetingRoomReservationWindow {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: MeetingRoomReservationStatus;
  title?: string;
  attendees?: number;
  requesterName?: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  heroImage: string;
  /** Disponibilidade definida pelo administrador. */
  status: MeetingRoomStatus;
  /** O que a interface mostra: cruza a decisao do admin com a agenda. */
  effectiveStatus: MeetingRoomStatus;
  location: string;
  capacity: number;
  amenities: string[];
  notes: string;
  usageRules: string;
  /** Janela de funcionamento, em hora local ("07:00"). */
  openingTime: string;
  closingTime: string;
  currentReservation?: MeetingRoomReservationWindow;
  nextReservation?: MeetingRoomReservationWindow;
  upcomingCount: number;
  active: boolean;
}

export interface MeetingRoomReservation {
  id: string;
  roomId: string;
  roomName: string;
  roomImage: string;
  roomLocation: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  title: string;
  attendees: number;
  notes: string;
  date: string;
  startTime: string;
  endTime: string;
  status: MeetingRoomReservationStatus;
  cancellationReason?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  createdAt: string;
  logs?: Array<{
    id: string;
    action: string;
    detail?: string;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;
}

export interface MeetingRoomReservationDraft {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  attendees: number;
  notes: string;
}

/**
 * Bloco ocupado da agenda.
 *
 * Diferente do equivalente de equipamentos, traz titulo e responsavel: uma
 * agenda de sala so serve se as pessoas veem o que ja esta marcado ali.
 */
export interface MeetingRoomAvailability {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: MeetingRoomReservationStatus;
  title: string;
  attendees: number;
  requesterId: string;
  requesterName: string;
}

export interface MeetingRoomSummary {
  confirmed: number;
  cancelled: number;
  completed: number;
  today: number;
  totalRooms: number;
  busyRooms: number;
  freeRooms: number;
  blockedRooms: number;
}

/*
 * Cores de estado — mesmos tokens semanticos dos outros modulos: verde livre,
 * ambar comprometido, azul em uso, vermelho bloqueado, cinza encerrado.
 */
export const roomStatusStyles: Record<MeetingRoomStatus, string> = {
  Disponível: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success/20",
  Reservada: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning/20",
  "Em uso": "bg-info-subtle text-info-subtle-foreground ring-1 ring-info/20",
  "Em manutenção": "bg-danger-subtle text-danger-subtle-foreground ring-1 ring-danger/20",
  Indisponível: "bg-neutral-subtle text-neutral-subtle-foreground ring-1 ring-border-strong",
};

export const roomStatusDots: Record<MeetingRoomStatus, string> = {
  Disponível: "bg-success",
  Reservada: "bg-warning",
  "Em uso": "bg-info",
  "Em manutenção": "bg-danger",
  Indisponível: "bg-muted-foreground",
};

export const roomReservationStatusStyles: Record<MeetingRoomReservationStatus, string> = {
  Confirmada: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success/20",
  Cancelada: "bg-neutral-subtle text-neutral-subtle-foreground ring-1 ring-border-strong",
  Concluída: "bg-info-subtle text-info-subtle-foreground ring-1 ring-info/20",
};

export const roomReservationStatusDots: Record<MeetingRoomReservationStatus, string> = {
  Confirmada: "bg-success",
  Cancelada: "bg-muted-foreground",
  Concluída: "bg-info",
};

/** Frase que explica o estado — o badge sozinho não diz o que acontece agora. */
export const roomReservationStatusHints: Record<MeetingRoomReservationStatus, string> = {
  Confirmada: "A sala está garantida para você neste horário.",
  Cancelada: "A reserva foi cancelada e o horário está livre novamente.",
  Concluída: "O horário já passou.",
};

export function isRoomReservable(room: MeetingRoom) {
  return room.active && room.status !== "Em manutenção" && room.status !== "Indisponível";
}

/** Reservas que ainda ocupam a agenda — usadas para bloquear novos horários. */
export function isBlockingRoomReservation(status: MeetingRoomReservationStatus) {
  return status === "Confirmada";
}

/** Converte "14:30" em minutos desde a meia-noite. */
export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN;
  return hours * 60 + minutes;
}

/** Inverso de timeToMinutes: 870 vira "14:30". */
export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** "1h30" — mais legivel que "90 minutos" numa lista de reunioes. */
export function formatDuration(startTime: string, endTime: string) {
  const total = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (Number.isNaN(total) || total <= 0) return "-";

  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Dois blocos do mesmo dia se sobrepoem? Usado para avisar antes do envio. */
export function overlaps(
  first: { startTime: string; endTime: string },
  second: { startTime: string; endTime: string },
) {
  return (
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(first.endTime) > timeToMinutes(second.startTime)
  );
}

export function formatDateLabel(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** "10 de setembro" — usado onde o ano seria ruído. */
export function formatLongDateLabel(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(
    new Date(year, month - 1, day),
  );
}

/*
 * "Quinta-feira, 10 de setembro" — cabeçalho da agenda do dia.
 *
 * A maiúscula sai daqui e não de `capitalize` no CSS: a classe do Tailwind
 * capitaliza cada palavra e produziria "Quinta-Feira, 10 De Setembro", que
 * está errado em português.
 */
export function formatWeekdayLabel(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Data de hoje no formato do <input type="date">. */
export function todayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
