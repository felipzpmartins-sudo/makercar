import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  initialVehicles,
  isVehicleReservable,
  type PickupDraft,
  type Reservation,
  type ReservationDraft,
  type ReturnDraft,
  type Vehicle,
  type VehicleStatus,
} from "@/data/vehicles";
import { reservationService } from "@/services/reservationService";
import { vehicleService } from "@/services/vehicleService";
import { getApiBaseUrl } from "@/services/apiClient";
import { getStoredAuthSession } from "@/utils/authStorage";

export function useMakerCarState() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(true);

  const refreshFleet = useCallback(async () => {
    setIsLoadingFleet(true);
    try {
      const [apiVehicles, apiReservations] = await Promise.all([
        vehicleService.list(),
        reservationService.list(),
      ]);
      setVehicles(apiVehicles);
      setReservations(apiReservations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar a frota.");
    } finally {
      setIsLoadingFleet(false);
    }
  }, []);

  useEffect(() => {
    void refreshFleet();
  }, [refreshFleet]);

  useEffect(() => {
    const token = getStoredAuthSession()?.accessToken;
    if (!token || typeof window === "undefined" || typeof EventSource === "undefined") return;

    const events = new EventSource(`${getApiBaseUrl()}/events?token=${encodeURIComponent(token)}`);
    events.addEventListener("fleet:update", () => {
      void refreshFleet();
    });

    return () => {
      events.close();
    };
  }, [refreshFleet]);

  async function createReservation(vehicle: Vehicle, draft: ReservationDraft) {
    if (!isVehicleReservable(vehicle.status)) {
      toast.error("Este veiculo nao esta disponivel para reserva.");
      return false;
    }
    if (new Date(draft.returnDate) < new Date(draft.pickupDate)) {
      toast.error("A data de devolucao nao pode ser anterior a retirada.");
      return false;
    }

    try {
      await reservationService.createReservation(vehicle.id, draft);
      await refreshFleet();
      toast.success("Reserva enviada para aprovacao da Juliana.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a reserva.");
      return false;
    }
  }

  async function cancelReservation(reservationId: string) {
    try {
      await reservationService.cancel(reservationId);
      await refreshFleet();
      toast.success("Reserva cancelada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel cancelar a reserva.");
      return false;
    }
  }

  async function registerPickup(draft: PickupDraft) {
    const usedVehicle = vehicles.find((vehicle) => vehicle.id === draft.usedVehicleId);
    if (!usedVehicle) {
      toast.error("Veiculo nao encontrado.");
      return false;
    }
    if (!draft.kmStart && draft.kmStart !== 0) {
      toast.error("Informe o KM inicial.");
      return false;
    }
    if (draft.kmStart < usedVehicle.km) {
      toast.error(`O KM inicial nao pode ser menor que o KM atual do veiculo (${usedVehicle.km}).`);
      return false;
    }

    try {
      await reservationService.registerPickup(draft.reservationId, {
        vehicleId: usedVehicle.id,
        tookReservedVehicle: draft.tookReservedVehicle,
        occurredAt: toApiDateTime(draft.date, draft.time),
        mileage: draft.kmStart,
        notes: draft.notes,
        photoDataUrl: draft.photoDataUrl,
      });
      await refreshFleet();
      toast.success("Retirada registrada.");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel registrar a retirada.",
      );
      return false;
    }
  }

  async function registerReturn(draft: ReturnDraft) {
    const reservation = reservations.find((item) => item.id === draft.reservationId);
    if (!reservation) {
      toast.error("Reserva nao encontrada.");
      return false;
    }
    if (!draft.kmEnd && draft.kmEnd !== 0) {
      toast.error("Informe o KM final.");
      return false;
    }
    if (reservation.pickup && draft.kmEnd <= reservation.pickup.kmStart) {
      toast.error(`O KM final deve ser maior que o KM inicial (${reservation.pickup.kmStart}).`);
      return false;
    }

    try {
      await reservationService.registerReturn(draft.reservationId, {
        occurredAt: toApiDateTime(draft.date, draft.time),
        mileage: draft.kmEnd,
        notes: draft.notes,
        photoDataUrl: draft.photoDataUrl,
      });
      await refreshFleet();
      toast.success("Devolucao registrada.");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel registrar a devolucao.",
      );
      return false;
    }
  }

  async function changeVehicleStatus(vehicleId: string, status: VehicleStatus) {
    try {
      await vehicleService.updateVehicleStatus(vehicleId, status);
      await refreshFleet();
      toast.success("Status do veiculo atualizado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o veiculo.");
      return false;
    }
  }

  return {
    vehicles,
    reservations,
    isLoadingFleet,
    refreshFleet,
    createReservation,
    cancelReservation,
    registerPickup,
    registerReturn,
    changeVehicleStatus,
  };
}

function toApiDateTime(date: string, time: string) {
  const selectedTime = time || "00:00";
  const value = new Date(`${date}T${selectedTime}:00`);
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainderMinutes = String(absoluteOffset % 60).padStart(2, "0");
  return `${date}T${selectedTime}:00${sign}${offsetHours}:${offsetRemainderMinutes}`;
}
