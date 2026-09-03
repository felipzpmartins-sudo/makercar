import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type {
  Equipment,
  EquipmentAvailability,
  EquipmentReservation,
  EquipmentReservationDraft,
  EquipmentStatus,
  EquipmentSummary,
} from "@/data/equipment";
import { getApiBaseUrl } from "@/services/apiClient";
import { equipmentReservationService, equipmentService } from "@/services/equipmentService";
import { getStoredAuthSession } from "@/utils/authStorage";

interface UseEquipmentStateOptions {
  /**
   * Carrega tambem todas as reservas e o resumo — so para quem administra.
   * Sem isto a tela do usuario comum faria duas chamadas que voltariam 403.
   */
  withAdminData?: boolean;
}

/*
 * Estado do modulo de equipamentos.
 *
 * Espelha o useMakerCarState da frota: uma unica funcao de recarga, atualizacao
 * ao voltar para a aba e escuta do SSE. O canal e proprio ("equipment:update"),
 * entao movimento na frota nao recarrega esta tela e vice-versa.
 */
export function useEquipmentState({ withAdminData = false }: UseEquipmentStateOptions = {}) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [myReservations, setMyReservations] = useState<EquipmentReservation[]>([]);
  const [allReservations, setAllReservations] = useState<EquipmentReservation[]>([]);
  const [availability, setAvailability] = useState<EquipmentAvailability[]>([]);
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiEquipments, apiReservations, apiAvailability] = await Promise.all([
        equipmentService.list(),
        equipmentReservationService.listOwn(),
        equipmentReservationService.listAvailability(),
      ]);
      setEquipments(apiEquipments);
      setMyReservations(apiReservations);
      setAvailability(apiAvailability);

      if (withAdminData) {
        const [everyReservation, apiSummary] = await Promise.all([
          equipmentReservationService.listAll(),
          equipmentReservationService.summary(),
        ]);
        setAllReservations(everyReservation);
        setSummary(apiSummary);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível carregar os equipamentos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [withAdminData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refreshWhenAppReturns = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", refreshWhenAppReturns);
    document.addEventListener("visibilitychange", refreshWhenAppReturns);
    return () => {
      window.removeEventListener("focus", refreshWhenAppReturns);
      document.removeEventListener("visibilitychange", refreshWhenAppReturns);
    };
  }, [refresh]);

  useEffect(() => {
    const token = getStoredAuthSession()?.accessToken;
    if (!token || typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const events = new EventSource(`${getApiBaseUrl()}/events?token=${encodeURIComponent(token)}`);
    events.addEventListener("equipment:update", () => {
      void refresh();
    });

    return () => {
      events.close();
    };
  }, [refresh]);

  async function createReservation(draft: EquipmentReservationDraft) {
    try {
      const reservation = await equipmentReservationService.create(draft);
      await refresh();
      return reservation;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível enviar a solicitação.",
      );
      return null;
    }
  }

  async function cancelReservation(reservationId: string, reason?: string) {
    try {
      await equipmentReservationService.cancel(reservationId, reason);
      await refresh();
      toast.success("Reserva cancelada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a reserva.");
      return false;
    }
  }

  async function approveReservation(reservationId: string) {
    try {
      await equipmentReservationService.approve(reservationId);
      await refresh();
      toast.success("Reserva aprovada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aprovar a reserva.");
      return false;
    }
  }

  async function rejectReservation(reservationId: string, reason: string) {
    try {
      await equipmentReservationService.reject(reservationId, reason);
      await refresh();
      toast.success("Reserva recusada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recusar a reserva.");
      return false;
    }
  }

  async function completeReservation(reservationId: string) {
    try {
      await equipmentReservationService.complete(reservationId);
      await refresh();
      toast.success("Reserva marcada como concluída.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a reserva.");
      return false;
    }
  }

  async function changeEquipmentStatus(equipmentId: string, status: EquipmentStatus) {
    try {
      await equipmentService.updateStatus(equipmentId, status);
      await refresh();
      toast.success("Disponibilidade do equipamento atualizada.");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar o equipamento.",
      );
      return false;
    }
  }

  return {
    equipments,
    myReservations,
    allReservations,
    availability,
    summary,
    isLoading,
    refresh,
    createReservation,
    cancelReservation,
    approveReservation,
    rejectReservation,
    completeReservation,
    changeEquipmentStatus,
  };
}
