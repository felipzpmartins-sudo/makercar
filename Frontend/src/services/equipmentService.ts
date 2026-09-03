import type {
  Equipment,
  EquipmentAvailability,
  EquipmentCategory,
  EquipmentReservation,
  EquipmentReservationDraft,
  EquipmentReservationStatus,
  EquipmentReservationWindow,
  EquipmentSpec,
  EquipmentStatus,
  EquipmentSummary,
  EquipmentTerms,
} from "@/data/equipment";
import { apiRequest } from "@/services/apiClient";
import { getStoredEquipmentAccess } from "@/utils/equipmentAccess";

type ApiEquipmentStatus = "AVAILABLE" | "RESERVED" | "IN_USE" | "MAINTENANCE" | "UNAVAILABLE";

type ApiEquipmentReservationStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  _count?: { equipments: number };
}

interface ApiReservationWindow {
  id: string;
  startDate: string;
  endDate: string;
  status: ApiEquipmentReservationStatus;
  purpose?: string | null;
  usageLocation?: string | null;
  operatorName?: string | null;
  user?: { id: string; name: string } | null;
}

interface ApiEquipment {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: ApiCategory;
  imageUrl?: string | null;
  heroImageUrl?: string | null;
  status: ApiEquipmentStatus;
  effectiveStatus: ApiEquipmentStatus;
  location?: string | null;
  notes?: string | null;
  usageRules?: string | null;
  specs?: unknown;
  active: boolean;
  currentReservation?: ApiReservationWindow | null;
  nextReservation?: ApiReservationWindow | null;
  upcomingCount?: number;
}

interface ApiEquipmentReservation {
  id: string;
  equipmentId: string;
  userId: string;
  startDate: string;
  endDate: string;
  operatorName: string;
  purpose: string;
  usageLocation: string;
  notes?: string | null;
  status: ApiEquipmentReservationStatus;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  termsAcceptedAt: string;
  termsVersion: string;
  reviewedAt?: string | null;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    heroImageUrl?: string | null;
    location?: string | null;
    category: { id: string; name: string; slug: string; icon?: string | null };
  };
  user: {
    id: string;
    name: string;
    email: string;
    department: { id: string; name: string };
  };
  reviewedBy?: { id: string; name: string; email: string } | null;
  logs?: Array<{
    id: string;
    action: string;
    detail?: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface ApiSummary {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
  today: number;
  total_equipments: number;
  reserved_equipments: number;
  available_equipments: number;
  blocked_equipments: number;
}

const statusFromApi: Record<ApiEquipmentStatus, EquipmentStatus> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  IN_USE: "Em uso",
  MAINTENANCE: "Em manutenção",
  UNAVAILABLE: "Indisponível",
};

const statusToApi: Record<EquipmentStatus, ApiEquipmentStatus> = {
  Disponível: "AVAILABLE",
  Reservado: "RESERVED",
  "Em uso": "IN_USE",
  "Em manutenção": "MAINTENANCE",
  Indisponível: "UNAVAILABLE",
};

const reservationStatusFromApi: Record<ApiEquipmentReservationStatus, EquipmentReservationStatus> =
  {
    PENDING: "Pendente",
    APPROVED: "Aprovada",
    REJECTED: "Recusada",
    CANCELLED: "Cancelada",
    COMPLETED: "Concluída",
  };

/** Imagem de fallback: um equipamento recém-cadastrado pode não ter foto ainda. */
const FALLBACK_IMAGE = "/makercar-assets/site-icon.png";

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
 * locais. Anexar o offset do navegador evita o classico "reservei as 09:00 e
 * apareceu 06:00" — mesma conversao usada nas reservas de veiculo.
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

function normalizeSpecs(value: unknown): EquipmentSpec[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const spec = item as { label?: unknown; value?: unknown };
    if (typeof spec.label !== "string" || typeof spec.value !== "string") return [];
    return [{ label: spec.label, value: spec.value }];
  });
}

function normalizeCategory(category: ApiCategory): EquipmentCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    icon: category.icon ?? undefined,
    equipmentCount: category._count?.equipments,
  };
}

function normalizeWindow(
  window: ApiReservationWindow | null | undefined,
): EquipmentReservationWindow | undefined {
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
    requesterName: window.user?.name,
    operatorName: window.operatorName ?? undefined,
    purpose: window.purpose ?? undefined,
    usageLocation: window.usageLocation ?? undefined,
  };
}

function normalizeEquipment(equipment: ApiEquipment): Equipment {
  const image = equipment.imageUrl || FALLBACK_IMAGE;

  return {
    id: equipment.id,
    name: equipment.name,
    slug: equipment.slug,
    description: equipment.description ?? "",
    category: normalizeCategory(equipment.category),
    image,
    heroImage: equipment.heroImageUrl || image,
    status: statusFromApi[equipment.status],
    effectiveStatus: statusFromApi[equipment.effectiveStatus ?? equipment.status],
    location: equipment.location ?? "",
    notes: equipment.notes ?? "",
    usageRules: equipment.usageRules ?? "",
    specs: normalizeSpecs(equipment.specs),
    currentReservation: normalizeWindow(equipment.currentReservation),
    nextReservation: normalizeWindow(equipment.nextReservation),
    upcomingCount: equipment.upcomingCount ?? 0,
    active: equipment.active,
  };
}

function normalizeReservation(reservation: ApiEquipmentReservation): EquipmentReservation {
  const start = splitDateTime(reservation.startDate);
  const end = splitDateTime(reservation.endDate);

  return {
    id: reservation.id,
    equipmentId: reservation.equipmentId,
    equipmentName: reservation.equipment.name,
    equipmentImage: reservation.equipment.imageUrl || FALLBACK_IMAGE,
    equipmentCategory: reservation.equipment.category.name,
    requesterId: reservation.user.id,
    requesterName: reservation.user.name,
    requesterEmail: reservation.user.email,
    requesterDepartment: reservation.user.department.name,
    operatorName: reservation.operatorName,
    purpose: reservation.purpose,
    usageLocation: reservation.usageLocation,
    notes: reservation.notes ?? "",
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    status: reservationStatusFromApi[reservation.status],
    rejectionReason: reservation.rejectionReason ?? undefined,
    cancellationReason: reservation.cancellationReason ?? undefined,
    reviewedByName: reservation.reviewedBy?.name,
    reviewedAt: reservation.reviewedAt ?? undefined,
    termsAcceptedAt: reservation.termsAcceptedAt,
    termsVersion: reservation.termsVersion,
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

/** Situacao da cortina de lancamento do modulo. */
export interface EquipmentAccessState {
  locked: boolean;
  message: string | null;
}

export const equipmentService = {
  async getAccess() {
    return apiRequest<EquipmentAccessState>("/equipment/access");
  },

  /** Valida a senha de acesso antecipado. Lanca com a mensagem do servidor se errada. */
  async unlock(password: string) {
    return apiRequest<{ unlocked: boolean }>("/equipment/unlock", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },

  async listCategories() {
    const categories = await apiRequest<ApiCategory[]>("/equipment/categories");
    return categories.map(normalizeCategory);
  },

  async list() {
    const equipments = await apiRequest<ApiEquipment[]>("/equipment");
    return equipments.map(normalizeEquipment);
  },

  async get(equipmentId: string) {
    return normalizeEquipment(await apiRequest<ApiEquipment>(`/equipment/${equipmentId}`));
  },

  async getTerms() {
    return apiRequest<EquipmentTerms>("/equipment/terms");
  },

  async updateStatus(equipmentId: string, status: EquipmentStatus) {
    return normalizeEquipment(
      await apiRequest<ApiEquipment>(`/equipment/${equipmentId}`, {
        method: "PUT",
        body: JSON.stringify({ status: statusToApi[status] }),
      }),
    );
  },

  async update(
    equipmentId: string,
    data: Partial<{
      name: string;
      description: string;
      location: string;
      notes: string;
      usageRules: string;
      status: EquipmentStatus;
      active: boolean;
    }>,
  ) {
    return normalizeEquipment(
      await apiRequest<ApiEquipment>(`/equipment/${equipmentId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          location: data.location,
          notes: data.notes,
          usage_rules: data.usageRules,
          status: data.status ? statusToApi[data.status] : undefined,
          active: data.active,
        }),
      }),
    );
  },
};

export const equipmentReservationService = {
  /** Reservas do proprio usuario. */
  async listOwn() {
    const reservations = await apiRequest<ApiEquipmentReservation[]>("/equipment-reservations");
    return reservations.map(normalizeReservation);
  },

  /** Todas as reservas — exige permissao de administracao. */
  async listAll() {
    const reservations = await apiRequest<ApiEquipmentReservation[]>(
      "/equipment-reservations?scope=all",
    );
    return reservations.map(normalizeReservation);
  },

  async listAvailability() {
    const periods = await apiRequest<
      Array<{
        id: string;
        equipmentId: string;
        startDate: string;
        endDate: string;
        status: ApiEquipmentReservationStatus;
      }>
    >("/equipment-reservations/availability");

    return periods.map<EquipmentAvailability>((period) => ({
      id: period.id,
      equipmentId: period.equipmentId,
      startDate: period.startDate,
      endDate: period.endDate,
      status: reservationStatusFromApi[period.status],
    }));
  },

  async summary(): Promise<EquipmentSummary> {
    const summary = await apiRequest<ApiSummary>("/equipment-reservations/summary");
    return {
      pending: summary.pending,
      approved: summary.approved,
      rejected: summary.rejected,
      cancelled: summary.cancelled,
      completed: summary.completed,
      today: summary.today,
      totalEquipments: summary.total_equipments,
      reservedEquipments: summary.reserved_equipments,
      availableEquipments: summary.available_equipments,
      blockedEquipments: summary.blocked_equipments,
    };
  },

  async create(draft: EquipmentReservationDraft) {
    const reservation = await apiRequest<ApiEquipmentReservation>("/equipment-reservations", {
      method: "POST",
      body: JSON.stringify({
        equipment_id: draft.equipmentId,
        start_date: toApiDateTime(draft.startDate, draft.startTime),
        end_date: toApiDateTime(draft.endDate, draft.endTime),
        operator_name: draft.operatorName.trim(),
        purpose: draft.purpose.trim(),
        usage_location: draft.usageLocation.trim(),
        notes: draft.notes.trim() || undefined,
        terms_accepted: draft.termsAccepted,
        terms_version: draft.termsVersion,
        // Vai junto porque o backend exige a senha enquanto o modulo
        // estiver em "em breve"; liberado, o campo e ignorado.
        access_password: getStoredEquipmentAccess() ?? undefined,
      }),
    });
    return normalizeReservation(reservation);
  },

  async approve(reservationId: string) {
    return normalizeReservation(
      await apiRequest<ApiEquipmentReservation>(
        `/equipment-reservations/${reservationId}/approve`,
        { method: "POST" },
      ),
    );
  },

  async reject(reservationId: string, reason: string) {
    return normalizeReservation(
      await apiRequest<ApiEquipmentReservation>(`/equipment-reservations/${reservationId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    );
  },

  async cancel(reservationId: string, reason?: string) {
    return normalizeReservation(
      await apiRequest<ApiEquipmentReservation>(`/equipment-reservations/${reservationId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: reason?.trim() || undefined }),
      }),
    );
  },

  async complete(reservationId: string) {
    return normalizeReservation(
      await apiRequest<ApiEquipmentReservation>(
        `/equipment-reservations/${reservationId}/complete`,
        { method: "POST" },
      ),
    );
  },
};
