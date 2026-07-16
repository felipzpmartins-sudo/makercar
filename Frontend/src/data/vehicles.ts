export type VehicleStatus =
  | "Dispon\u00edvel"
  | "Reservado"
  | "Pendente"
  | "Em uso"
  | "Em manuten\u00e7\u00e3o"
  | "Indispon\u00edvel";
export type VehicleColor = "Branco" | "Preto" | "Prata";
export type ReservationStatus =
  | "Pendente"
  | "Reservado"
  | "Recusada"
  | "Em uso"
  | "Finalizada"
  | "Cancelada";

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
  photoUrl?: string;
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
  photoUrl?: string;
  vehicleId?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Reservation {
  id: string;
  requesterName: string;
  requesterEmail?: string;
  department: string;
  requestedVehicleId: string;
  usedVehicleId?: string;
  vehicleName: string;
  plate: string;
  reason: string;
  rejectionReason?: string;
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
  notes: string;
  photoDataUrl: string;
}

const kwidWhite = "/makercar-assets/kwid-white.png";
const kwidBlack = "/makercar-assets/kwid-black.png";
const kwidSilver = "/makercar-assets/kwid-silver.png";

export const initialVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Renault Kwid Branco",
    plate: "BKA3F78",
    status: "Dispon\u00edvel",
    color: "Branco",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidWhite,
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
    name: "Renault Kwid Prata",
    plate: "RBW5D42",
    status: "Dispon\u00edvel",
    color: "Prata",
    km: 0,
    fuel: "Flex",
    transmission: "Manual",
    capacity: "5 lugares",
    image: kwidSilver,
  },
];

export const statusStyles: Record<VehicleStatus, string> = {
  "Dispon\u00edvel": "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Reservado: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Pendente: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  "Em uso": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "Em manuten\u00e7\u00e3o": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "Indispon\u00edvel": "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

export const statusDots: Record<VehicleStatus, string> = {
  "Dispon\u00edvel": "bg-emerald-500",
  Reservado: "bg-amber-500",
  Pendente: "bg-orange-500",
  "Em uso": "bg-blue-500",
  "Em manuten\u00e7\u00e3o": "bg-red-500",
  "Indispon\u00edvel": "bg-slate-500",
};

export const statusAccents: Record<VehicleStatus, string> = {
  "Dispon\u00edvel": "bg-emerald-500",
  Reservado: "bg-amber-500",
  Pendente: "bg-orange-500",
  "Em uso": "bg-blue-500",
  "Em manuten\u00e7\u00e3o": "bg-red-500",
  "Indispon\u00edvel": "bg-slate-500",
};

export const reservationStatusStyles: Record<ReservationStatus, string> = {
  Pendente: "bg-orange-100 text-orange-700",
  Reservado: "bg-amber-100 text-amber-700",
  Recusada: "bg-rose-100 text-rose-700",
  "Em uso": "bg-blue-100 text-blue-700",
  Finalizada: "bg-emerald-100 text-emerald-700",
  Cancelada: "bg-slate-100 text-slate-600",
};

export function getVehicleStatusLabel(status: VehicleStatus) {
  if (status.includes("Dispon")) return "Dispon\u00edvel";
  if (status.includes("manuten")) return "Em manuten\u00e7\u00e3o";
  if (status.includes("Indispon")) return "Indispon\u00edvel";
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
  if (isVehicleAvailable(status)) return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "Reservado") return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  if (status === "Pendente") return "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
  if (status === "Em uso") return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  if (isVehicleMaintenance(status)) return "bg-red-100 text-red-700 ring-1 ring-red-200";
  return "bg-slate-200 text-slate-700 ring-1 ring-slate-300";
}

export function getVehicleStatusDot(status: VehicleStatus) {
  if (isVehicleAvailable(status)) return "bg-emerald-500";
  if (status === "Reservado") return "bg-amber-500";
  if (status === "Pendente") return "bg-orange-500";
  if (status === "Em uso") return "bg-blue-500";
  if (isVehicleMaintenance(status)) return "bg-red-500";
  return "bg-slate-500";
}
