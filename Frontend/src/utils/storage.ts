import {
  initialVehicles,
  type Reservation,
  type ReservationStatus,
  type Vehicle,
  type VehicleStatus,
} from "@/data/vehicles";

const VEHICLES_KEY = "makercar:vehicles";
const RESERVATIONS_KEY = "makercar:reservations";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private browsing or restricted environments.
  }
}

export function loadVehicles(): Vehicle[] {
  const storedVehicles = readJson<Vehicle[]>(VEHICLES_KEY, []);
  if (!Array.isArray(storedVehicles) || storedVehicles.length === 0) {
    return initialVehicles;
  }

  const storedById = new Map(storedVehicles.map((vehicle) => [vehicle.id, vehicle]));
  return initialVehicles.map((vehicle) => {
    const stored = storedById.get(vehicle.id);
    return stored
      ? {
          ...vehicle,
          status: normalizeVehicleStatus(stored.status),
          km: Number.isFinite(stored.km) ? stored.km : vehicle.km,
          lastUser: stored.lastUser,
          lastReservation: stored.lastReservation,
          lastPickup: stored.lastPickup,
          lastReturn: stored.lastReturn,
        }
      : vehicle;
  });
}

export function saveVehicles(vehicles: Vehicle[]) {
  writeJson(VEHICLES_KEY, vehicles);
}

export function loadReservations(): Reservation[] {
  const reservations = readJson<Array<Partial<Reservation> & Record<string, unknown>>>(
    RESERVATIONS_KEY,
    [],
  );
  if (!Array.isArray(reservations)) return [];
  return reservations.map(normalizeReservation).filter(Boolean) as Reservation[];
}

export function saveReservations(reservations: Reservation[]) {
  writeJson(RESERVATIONS_KEY, reservations);
}

function normalizeVehicleStatus(status: unknown): VehicleStatus {
  if (
    status === "Disponível" ||
    status === "Reservado" ||
    status === "Pendente" ||
    status === "Em uso" ||
    status === "Em manutenção" ||
    status === "Indisponível"
  ) {
    return status;
  }
  return "Disponível";
}

function normalizeReservationStatus(status: unknown): ReservationStatus {
  if (
    status === "Pendente" ||
    status === "Reservado" ||
    status === "Em uso" ||
    status === "Finalizada" ||
    status === "Cancelada"
  ) {
    return status;
  }
  if (status === "Ativa") return "Reservado";
  return "Pendente";
}

function normalizeReservation(reservation: Partial<Reservation> & Record<string, unknown>) {
  const requestedVehicleId =
    typeof reservation.requestedVehicleId === "string"
      ? reservation.requestedVehicleId
      : typeof reservation.requestedVehicleId === "number"
        ? String(reservation.requestedVehicleId)
        : typeof reservation.vehicleId === "string"
          ? reservation.vehicleId
          : typeof reservation.vehicleId === "number"
            ? String(reservation.vehicleId)
            : undefined;

  if (!reservation.id || !requestedVehicleId) return null;

  const pickupDate = String(reservation.pickupDate ?? "");
  const pickupTime = String(reservation.pickupTime ?? "");
  const returnDate = String(reservation.returnDate ?? "");
  const returnTime = String(reservation.returnTime ?? "");

  return {
    id: String(reservation.id),
    requesterName: String(reservation.requesterName ?? ""),
    department: String(reservation.department ?? ""),
    requestedVehicleId,
    usedVehicleId:
      typeof reservation.usedVehicleId === "string"
        ? reservation.usedVehicleId
        : typeof reservation.usedVehicleId === "number"
          ? String(reservation.usedVehicleId)
          : undefined,
    vehicleName: String(reservation.vehicleName ?? ""),
    plate: String(reservation.plate ?? ""),
    reason: String(reservation.reason ?? ""),
    reservationStart: String(reservation.reservationStart ?? `${pickupDate} ${pickupTime}`.trim()),
    reservationEnd: String(reservation.reservationEnd ?? `${returnDate} ${returnTime}`.trim()),
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    status: normalizeReservationStatus(reservation.status),
    pickup: reservation.pickup,
    return: reservation.return,
    createdAt: String(reservation.createdAt ?? new Date().toISOString()),
  } satisfies Reservation;
}
