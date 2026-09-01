import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  isVehicleReservable,
  type PickupDraft,
  type Reservation,
  type ReservationDraft,
  type ReturnDraft,
  type Vehicle,
  type VehicleStatus,
} from "@/data/vehicles";
import { reservationService, type ReservationAvailability } from "@/services/reservationService";
import { vehicleService } from "@/services/vehicleService";
import { getApiBaseUrl } from "@/services/apiClient";
import { getStoredAuthSession } from "@/utils/authStorage";

export function useMakerCarState() {
  // Comeca vazio de proposito: mostrar a lista estatica de veiculos antes da
  // resposta da API exibia status falso por um instante. A tela cobre esse
  // intervalo com skeleton.
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationAvailability, setReservationAvailability] = useState<ReservationAvailability[]>(
    [],
  );
  const [isLoadingFleet, setIsLoadingFleet] = useState(true);

  const refreshFleet = useCallback(async () => {
    setIsLoadingFleet(true);
    try {
      const [apiVehicles, apiReservations, apiAvailability] = await Promise.all([
        vehicleService.list(),
        reservationService.list(),
        reservationService.listAvailability(),
      ]);
      setVehicles(apiVehicles);
      setReservations(apiReservations);
      setReservationAvailability(apiAvailability);
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
    if (typeof window === "undefined") return;

    const refreshWhenAppReturns = () => {
      if (document.visibilityState === "visible") {
        void refreshFleet();
      }
    };

    const refreshVehicleMileage = () => {
      if (document.visibilityState !== "visible") return;

      void vehicleService
        .list()
        .then(setVehicles)
        .catch(() => {
          // A conexão em tempo real ou a próxima atualização tentará novamente.
        });
    };

    const interval = window.setInterval(refreshVehicleMileage, 30_000);
    window.addEventListener("focus", refreshWhenAppReturns);
    document.addEventListener("visibilitychange", refreshWhenAppReturns);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenAppReturns);
      document.removeEventListener("visibilitychange", refreshWhenAppReturns);
    };
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
    if (!draft.returnTime) {
      toast.error("Informe a hora prevista de retorno.");
      return false;
    }
    if (
      new Date(`${draft.returnDate}T${draft.returnTime}`) <=
      new Date(`${draft.pickupDate}T${draft.pickupTime}`)
    ) {
      toast.error("O retorno previsto deve ser posterior a retirada.");
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

  async function cancelReservation(reservationId: string, reason?: string) {
    try {
      await reservationService.cancel(reservationId, reason);
      await refreshFleet();
      toast.success("Reserva cancelada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel cancelar a reserva.");
      return false;
    }
  }

  async function transferReservation(reservationId: string, userId: string) {
    try {
      await reservationService.transferOwnership(reservationId, userId);
      await refreshFleet();
      toast.success("Titularidade da reserva transferida.");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel transferir a reserva.",
      );
      return false;
    }
  }

  async function requestCancellation(reservationId: string, reason: string) {
    try {
      await reservationService.requestCancellation(reservationId, reason);
      await refreshFleet();
      toast.success("Solicitacao de cancelamento enviada ao administrador.");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel solicitar o cancelamento.",
      );
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
        fuelLevel: draft.fuelLevel,
        vehicleCondition: draft.vehicleCondition,
        damages: draft.damages,
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
        fuelLevel: draft.fuelLevel,
        vehicleCondition: draft.vehicleCondition,
        damages: draft.damages,
        hasDamage: draft.hasDamage,
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
    reservationAvailability,
    isLoadingFleet,
    refreshFleet,
    createReservation,
    cancelReservation,
    transferReservation,
    requestCancellation,
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
