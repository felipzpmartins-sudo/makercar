import type { Reservation, ReservationDraft } from "@/data/vehicles";
import { apiRequest } from "@/services/apiClient";

type ApiReservationStatus = "PENDING" | "APPROVED" | "ACTIVE" | "FINISHED" | "CANCELLED";

interface ApiReservation {
  id: string;
  vehicleId: string;
  userId: string;
  pickupDate: string;
  returnDate: string;
  reason: string;
  status: ApiReservationStatus;
  createdAt: string;
  vehicle: {
    id: string;
    name: string;
    plate: string;
  };
  user: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    };
  };
}

const statusFromApi: Record<ApiReservationStatus, Reservation["status"]> = {
  PENDING: "Pendente",
  APPROVED: "Reservado",
  ACTIVE: "Em uso",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
};

function splitDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }

  return {
    date: date.toISOString().slice(0, 10),
    time: date.toTimeString().slice(0, 5),
  };
}

function toApiDateTime(date: string, time: string) {
  return `${date}T${time || "00:00"}:00`;
}

function normalizeReservation(reservation: ApiReservation): Reservation {
  const pickup = splitDateTime(reservation.pickupDate);
  const plannedReturn = splitDateTime(reservation.returnDate);

  return {
    id: reservation.id,
    requesterName: reservation.user.name,
    department: reservation.user.department.name,
    requestedVehicleId: reservation.vehicleId,
    usedVehicleId: reservation.vehicleId,
    vehicleName: reservation.vehicle.name,
    plate: reservation.vehicle.plate,
    reason: reservation.reason,
    reservationStart: `${pickup.date} ${pickup.time}`,
    reservationEnd: `${plannedReturn.date} ${plannedReturn.time}`,
    pickupDate: pickup.date,
    pickupTime: pickup.time,
    returnDate: plannedReturn.date,
    returnTime: plannedReturn.time,
    status: statusFromApi[reservation.status],
    createdAt: reservation.createdAt,
  };
}

export const reservationService = {
  async list() {
    const reservations = await apiRequest<ApiReservation[]>("/reservations");
    return reservations.map(normalizeReservation);
  },

  async createReservation(vehicleId: string, draft: ReservationDraft) {
    const reservation = await apiRequest<ApiReservation>("/reservations", {
      method: "POST",
      body: JSON.stringify({
        vehicle_id: vehicleId,
        pickup_date: toApiDateTime(draft.pickupDate, draft.pickupTime),
        return_date: toApiDateTime(draft.returnDate, draft.returnTime),
        reason: draft.reason.trim(),
      }),
    });

    return normalizeReservation(reservation);
  },

  async approve(reservationId: string) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}/approve`, {
      method: "POST",
    });
    return normalizeReservation(reservation);
  },

  async start(reservationId: string) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}`, {
      method: "PUT",
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    return normalizeReservation(reservation);
  },

  async cancel(reservationId: string) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}/cancel`, {
      method: "POST",
    });
    return normalizeReservation(reservation);
  },

  async finish(reservationId: string) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}/finish`, {
      method: "POST",
    });
    return normalizeReservation(reservation);
  },
};
