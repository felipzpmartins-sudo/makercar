export type VehicleStatus =
  | "Dispon\u00edvel"
  | "Reservado"
  | "Pendente"
  | "Em uso"
  | "Em manuten\u00e7\u00e3o"
  | "Indispon\u00edvel";
export type VehicleColor = "Branco" | "Preto" | "Prata";
export type ReservationStatus =
  "Pendente" | "Reservado" | "Recusada" | "Em uso" | "Finalizada" | "Cancelada";

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: VehicleStatus;
  color: VehicleColor;
  km: number;
  fuel: string;
  transmission: string;
  capacity: string;
  image: string;
  supportOnly?: boolean;
  lastUser?: string;
  lastReservation?: string;
  lastPickup?: string;
  lastReturn?: string;
}

export interface ReservationPickup {
  date: string;
  time: string;
  kmStart: number;
  fuelLevel: string;
  vehicleCondition: string;
  damages: string;
  notes: string;
  tookReservedVehicle: boolean;
  photoUrl?: string | null;
  vehicleId?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReservationReturn {
  date: string;
  time: string;
  kmEnd: number;
  fuelLevel: string;
  vehicleCondition: string;
  damages: string;
  notes: string;
  photoUrl?: string | null;
  vehicleId?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Reservation {
  id: string;
  /** Id do usuario titular. Use-o para comparar pessoas; nomes se repetem. */
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  department: string;
  requestedVehicleId: string;
  usedVehicleId?: string;
  vehicleName: string;
  plate: string;
  reason: string;
  rejectionReason?: string;
  cancellationRequestedAt?: string;
  cancellationRequestReason?: string;
  reviewedByName?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  requesterCnhNumber?: string | null;
  requesterCnhPhotoUrl?: string | null;
  requesterCnhExpiresAt?: string | null;
  requesterCnhStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  reservationStart: string;
  reservationEnd: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  status: ReservationStatus;
  pickup?: ReservationPickup;
  return?: ReservationReturn;
  logs?: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      department: {
        id: string;
        name: string;
      };
      role: {
        id: string;
        name: string;
      };
    };
  }>;
  createdAt: string;
}

export interface ReservationDraft {
  requesterName: string;
  department: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  reason: string;
  cnhNumber?: string;
  cnhExpiresAt?: string;
  cnhPhotoDataUrl?: string;
  supportAccessPassword?: string;
}

export interface PickupDraft {
  reservationId: string;
  requesterName: string;
  usedVehicleId: string;
  tookReservedVehicle: boolean;
  date: string;
  time: string;
  kmStart: number;
  fuelLevel: string;
  vehicleCondition: string;
  damages: string;
  notes: string;
  photoDataUrl: string;
}

export interface ReturnDraft {
  reservationId: string;
  date: string;
  time: string;
  kmEnd: number;
  fuelLevel: string;
  vehicleCondition: string;
  damages: string;
  hasDamage: boolean;
  notes: string;
}

const kwidWhite = "/makercar-assets/kwid-white.png";
const kwidBlack = "/makercar-assets/kwid-black.png";
const kwidSilver = "/makercar-assets/kwid-silver.png";
const renaultMasterWhite = "/makercar-assets/renault-master-white.png";

export const initialVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Renault Kwid Prata",
    plate: "BKA3F78",
    status: "Dispon\u00edvel",
    color: "Prata",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidSilver,
  },
  {
    id: "2",
    name: "Renault Kwid Preto",
    plate: "GAV6H84",
    status: "Reservado",
    color: "Preto",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidBlack,
  },
  {
    id: "3",
    name: "Renault Kwid Preto",
    plate: "GEL8E37",
    status: "Em manuten\u00e7\u00e3o",
    color: "Preto",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidBlack,
  },
  {
    id: "4",
    name: "Renault Kwid Branco",
    plate: "RBW5D42",
    status: "Dispon\u00edvel",
    color: "Branco",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidWhite,
  },
  {
    id: "5",
    name: "Renault Kwid Zen 2 Preto",
    plate: "URY5A94",
    status: "Dispon\u00edvel",
    color: "Preto",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidBlack,
  },
  {
    id: "6",
    name: "Renault Kwid Branco",
    plate: "FXC0I09",
    status: "Dispon\u00edvel",
    color: "Branco",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidWhite,
  },
  {
    id: "7",
    name: "Renault Kwid Prata",
    plate: "FVB6H55",
    status: "Dispon\u00edvel",
    color: "Prata",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidSilver,
  },
  {
    id: "8",
    name: "Renault Kwid Branco",
    plate: "BWK7761",
    status: "Dispon\u00edvel",
    color: "Branco",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidWhite,
    supportOnly: true,
  },
  {
    id: "9",
    name: "Renault Master",
    plate: "SUP8E16",
    status: "Dispon\u00edvel",
    color: "Branco",
    km: 0,
    fuel: "Diesel",
    transmission: "Manual",
    capacity: "3 lugares",
    image: renaultMasterWhite,
  },
];

/*
 * Estilos de status.
 *
 * Usam tokens semanticos (success/warning/info/danger/neutral) em vez de cores
 * fixas, entao o mesmo mapa serve para o tema claro e o escuro. Ver styles.css.
 *
 * Leitura das cores:
 *   verde   = veiculo livre                azul  = em uso agora
 *   ambar   = comprometido/agendado        vermelho = bloqueado
 *   cinza   = encerrado ou indisponivel
 */
export const statusStyles: Record<VehicleStatus, string> = {
  Disponível: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success/20",
  Reservado: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning/20",
  Pendente: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning/20",
  "Em uso": "bg-info-subtle text-info-subtle-foreground ring-1 ring-info/20",
  "Em manutenção": "bg-danger-subtle text-danger-subtle-foreground ring-1 ring-danger/20",
  Indisponível: "bg-neutral-subtle text-neutral-subtle-foreground ring-1 ring-border-strong",
};

export const statusDots: Record<VehicleStatus, string> = {
  Disponível: "bg-success",
  Reservado: "bg-warning",
  Pendente: "bg-warning",
  "Em uso": "bg-info",
  "Em manutenção": "bg-danger",
  Indisponível: "bg-muted-foreground",
};

export const statusAccents: Record<VehicleStatus, string> = statusDots;

export const reservationStatusStyles: Record<ReservationStatus, string> = {
  Pendente: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning/20",
  Reservado: "bg-info-subtle text-info-subtle-foreground ring-1 ring-info/20",
  Recusada: "bg-danger-subtle text-danger-subtle-foreground ring-1 ring-danger/20",
  "Em uso": "bg-primary-subtle text-primary-subtle-foreground ring-1 ring-primary/20",
  Finalizada: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success/20",
  Cancelada: "bg-neutral-subtle text-neutral-subtle-foreground ring-1 ring-border-strong",
};

/** Bolinha de status da reserva, para usar junto do badge. */
export const reservationStatusDots: Record<ReservationStatus, string> = {
  Pendente: "bg-warning",
  Reservado: "bg-info",
  Recusada: "bg-danger",
  "Em uso": "bg-primary",
  Finalizada: "bg-success",
  Cancelada: "bg-muted-foreground",
};

export function getVehicleStatusLabel(status: VehicleStatus) {
  if (status.includes("Dispon")) return "Disponível";
  if (status.includes("manuten")) return "Em manutenção";
  if (status.includes("Indispon")) return "Indisponível";
  return status;
}

export function isVehicleAvailable(status: VehicleStatus) {
  return status.includes("Dispon") && !status.includes("Indispon");
}

export function isVehicleReservable(status: VehicleStatus) {
  return !isVehicleMaintenance(status) && !isVehicleUnavailable(status);
}

export function isVehicleMaintenance(status: VehicleStatus) {
  return status.includes("manuten");
}

export function isVehicleUnavailable(status: VehicleStatus) {
  return status.includes("Indispon");
}

export function getVehicleStatusStyle(status: VehicleStatus) {
  if (isVehicleAvailable(status)) return statusStyles["Disponível"];
  if (isVehicleMaintenance(status)) return statusStyles["Em manutenção"];
  if (isVehicleUnavailable(status)) return statusStyles["Indisponível"];
  return statusStyles[status] ?? statusStyles["Indisponível"];
}

export function getVehicleStatusDot(status: VehicleStatus) {
  if (isVehicleAvailable(status)) return statusDots["Disponível"];
  if (isVehicleMaintenance(status)) return statusDots["Em manutenção"];
  if (isVehicleUnavailable(status)) return statusDots["Indisponível"];
  return statusDots[status] ?? statusDots["Indisponível"];
}
