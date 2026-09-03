/*
 * Equipamentos internos — tipos e vocabulario visual.
 *
 * Segue a mesma divisao de data/vehicles.ts: a API fala em maiusculas
 * (AVAILABLE, PENDING...) e a interface fala em portugues. A traducao acontece
 * uma unica vez, no service, para que nenhum componente precise conhecer o
 * formato do backend.
 */

export type EquipmentStatus =
  "Disponível" | "Reservado" | "Em uso" | "Em manutenção" | "Indisponível";

export type EquipmentReservationStatus =
  "Pendente" | "Aprovada" | "Recusada" | "Cancelada" | "Concluída";

export interface EquipmentSpec {
  label: string;
  value: string;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Nome do icone lucide escolhido no cadastro da categoria. */
  icon?: string;
  equipmentCount?: number;
}

/** Janela de uso resumida — o que ocupa o equipamento agora ou em seguida. */
export interface EquipmentReservationWindow {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: EquipmentReservationStatus;
  requesterName?: string;
  operatorName?: string;
  purpose?: string;
  usageLocation?: string;
}

export interface Equipment {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: EquipmentCategory;
  image: string;
  heroImage: string;
  /** Disponibilidade definida pelo administrador. */
  status: EquipmentStatus;
  /** O que a interface mostra: cruza a decisao do admin com a agenda. */
  effectiveStatus: EquipmentStatus;
  location: string;
  notes: string;
  usageRules: string;
  specs: EquipmentSpec[];
  currentReservation?: EquipmentReservationWindow;
  nextReservation?: EquipmentReservationWindow;
  upcomingCount: number;
  active: boolean;
}

export interface EquipmentReservation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  equipmentCategory: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  operatorName: string;
  purpose: string;
  usageLocation: string;
  notes: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: EquipmentReservationStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  termsAcceptedAt: string;
  termsVersion: string;
  createdAt: string;
  logs?: Array<{
    id: string;
    action: string;
    detail?: string;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;
}

export interface EquipmentReservationDraft {
  equipmentId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  operatorName: string;
  purpose: string;
  usageLocation: string;
  notes: string;
  termsAccepted: boolean;
  termsVersion: string;
}

/** Periodo ocupado, sem dados de quem reservou. Usado no calendario e no aviso de conflito. */
export interface EquipmentAvailability {
  id: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  status: EquipmentReservationStatus;
}

export interface EquipmentTermsSection {
  title: string;
  items: string[];
}

export interface EquipmentTerms {
  version: string;
  title: string;
  summary: string;
  updatedAt: string;
  sections: EquipmentTermsSection[];
}

export interface EquipmentSummary {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
  today: number;
  totalEquipments: number;
  reservedEquipments: number;
  availableEquipments: number;
  blockedEquipments: number;
}

/*
 * Cores de estado.
 *
 * Mesma leitura da frota, com os tokens semanticos do design system: verde
 * livre, ambar comprometido, azul em uso, vermelho bloqueado, cinza encerrado.
 * Como sao tokens, valem nos dois temas sem variante.
 */
export const equipmentStatusStyles: Record<EquipmentStatus, string> = {
  Disponível: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success/20",
  Reservado: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning/20",
  "Em uso": "bg-info-subtle text-info-subtle-foreground ring-1 ring-info/20",
  "Em manutenção": "bg-danger-subtle text-danger-subtle-foreground ring-1 ring-danger/20",
  Indisponível: "bg-neutral-subtle text-neutral-subtle-foreground ring-1 ring-border-strong",
};

export const equipmentStatusDots: Record<EquipmentStatus, string> = {
  Disponível: "bg-success",
  Reservado: "bg-warning",
  "Em uso": "bg-info",
  "Em manutenção": "bg-danger",
  Indisponível: "bg-muted-foreground",
};

export const equipmentReservationStatusStyles: Record<EquipmentReservationStatus, string> = {
  Pendente: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning/20",
  Aprovada: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success/20",
  Recusada: "bg-danger-subtle text-danger-subtle-foreground ring-1 ring-danger/20",
  Cancelada: "bg-neutral-subtle text-neutral-subtle-foreground ring-1 ring-border-strong",
  Concluída: "bg-info-subtle text-info-subtle-foreground ring-1 ring-info/20",
};

export const equipmentReservationStatusDots: Record<EquipmentReservationStatus, string> = {
  Pendente: "bg-warning",
  Aprovada: "bg-success",
  Recusada: "bg-danger",
  Cancelada: "bg-muted-foreground",
  Concluída: "bg-info",
};

/** Frase que explica o estado — o badge sozinho nao diz o que acontece agora. */
export const equipmentReservationStatusHints: Record<EquipmentReservationStatus, string> = {
  Pendente: "Aguardando aprovação do administrador.",
  Aprovada: "Reserva autorizada. O equipamento está garantido para o período.",
  Recusada: "A solicitação não foi autorizada.",
  Cancelada: "A reserva foi cancelada e o período está livre novamente.",
  Concluída: "O período de uso terminou.",
};

export function isEquipmentReservable(equipment: Equipment) {
  return (
    equipment.active && equipment.status !== "Em manutenção" && equipment.status !== "Indisponível"
  );
}

/** Reservas que ainda ocupam a agenda — usadas para bloquear novos períodos. */
export function isBlockingReservation(status: EquipmentReservationStatus) {
  return status === "Pendente" || status === "Aprovada";
}

/** Reservas que o solicitante ainda pode cancelar. */
export function isCancellableReservation(status: EquipmentReservationStatus) {
  return isBlockingReservation(status);
}

export function formatEquipmentPeriod(reservation: {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}) {
  const start = formatDateLabel(reservation.startDate);
  const end = formatDateLabel(reservation.endDate);

  if (reservation.startDate === reservation.endDate) {
    return `${start}, ${reservation.startTime} – ${reservation.endTime}`;
  }
  return `${start} ${reservation.startTime} → ${end} ${reservation.endTime}`;
}

export function formatDateLabel(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** "2 de setembro" — usado onde o ano seria ruído. */
export function formatLongDateLabel(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(
    new Date(year, month - 1, day),
  );
}
