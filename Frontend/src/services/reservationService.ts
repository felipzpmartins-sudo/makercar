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
  odometerRecords?: Array<{
    id: string;
    type: "PICKUP" | "RETURN";
    vehicleId?: string | null;
    mileage: number;
    photoUrl: string;
    notes?: string | null;
    occurredAt: string;
    tookReservedVehicle?: boolean | null;
    vehicle?: {
      id: string;
      plate: string;
      name: string;
    } | null;
  }>;
}

const statusFromApi: Record<ApiReservationStatus, Reservation["status"]> = {
  PENDING: "Reservado",
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
    date: formatLocalDate(date),
    time: formatLocalTime(date),
  };
}

function toApiDateTime(date: string, time: string) {
  return withLocalTimezoneOffset(date, time);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function withLocalTimezoneOffset(date: string, time: string) {
  const selectedTime = time || "00:00";
  const value = new Date(`${date}T${selectedTime}:00`);
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainderMinutes = String(absoluteOffset % 60).padStart(2, "0");
  return `${date}T${selectedTime}:00${sign}${offsetHours}:${offsetRemainderMinutes}`;
}

function normalizeReservation(reservation: ApiReservation): Reservation {
  const pickup = splitDateTime(reservation.pickupDate);
  const plannedReturn = splitDateTime(reservation.returnDate);
  const pickupRecord = reservation.odometerRecords?.find((record) => record.type === "PICKUP");
  const returnRecord = reservation.odometerRecords?.find((record) => record.type === "RETURN");
  const actualPickup = pickupRecord ? splitDateTime(pickupRecord.occurredAt) : undefined;
  const actualReturn = returnRecord ? splitDateTime(returnRecord.occurredAt) : undefined;

  return {
    id: reservation.id,
    requesterName: reservation.user.name,
    department: reservation.user.department.name,
    requestedVehicleId: reservation.vehicleId,
    usedVehicleId: pickupRecord?.vehicleId ?? reservation.vehicleId,
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
    pickup: pickupRecord
      ? {
          date: actualPickup?.date ?? "",
          time: actualPickup?.time ?? "",
          kmStart: pickupRecord.mileage,
          notes: pickupRecord.notes ?? "",
          tookReservedVehicle: pickupRecord.tookReservedVehicle ?? true,
          photoUrl: pickupRecord.photoUrl,
          vehicleId: pickupRecord.vehicleId ?? reservation.vehicleId,
        }
      : undefined,
    return: returnRecord
      ? {
          date: actualReturn?.date ?? "",
          time: actualReturn?.time ?? "",
          kmEnd: returnRecord.mileage,
          notes: returnRecord.notes ?? "",
          photoUrl: returnRecord.photoUrl,
          vehicleId: returnRecord.vehicleId ?? pickupRecord?.vehicleId ?? reservation.vehicleId,
        }
      : undefined,
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

  async registerPickup(
    reservationId: string,
    data: {
      vehicleId: string;
      tookReservedVehicle: boolean;
      occurredAt: string;
      mileage: number;
      notes: string;
      photoDataUrl: string;
    },
  ) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}/pickup`, {
      method: "POST",
      body: JSON.stringify({
        vehicle_id: data.vehicleId,
        took_reserved_vehicle: data.tookReservedVehicle,
        occurred_at: data.occurredAt,
        mileage: data.mileage,
        notes: data.notes,
        photo_data_url: data.photoDataUrl,
      }),
    });
    return normalizeReservation(reservation);
  },

  async cancel(reservationId: string) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}/cancel`, {
      method: "POST",
    });
    return normalizeReservation(reservation);
  },

  async registerReturn(
    reservationId: string,
    data: {
      occurredAt: string;
      mileage: number;
      notes: string;
      photoDataUrl: string;
    },
  ) {
    const reservation = await apiRequest<ApiReservation>(`/reservations/${reservationId}/return`, {
      method: "POST",
      body: JSON.stringify({
        occurred_at: data.occurredAt,
        mileage: data.mileage,
        notes: data.notes,
        photo_data_url: data.photoDataUrl,
      }),
    });
    return normalizeReservation(reservation);
  },
};
