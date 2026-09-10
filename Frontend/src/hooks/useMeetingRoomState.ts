import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type {
  MeetingRoom,
  MeetingRoomAvailability,
  MeetingRoomReservation,
  MeetingRoomReservationDraft,
  MeetingRoomStatus,
  MeetingRoomSummary,
} from "@/data/meetingRooms";
import { getApiBaseUrl } from "@/services/apiClient";
import { meetingRoomReservationService, meetingRoomService } from "@/services/meetingRoomService";
import { getStoredAuthSession } from "@/utils/authStorage";

interface UseMeetingRoomStateOptions {
  /**
   * Carrega tambem todas as reservas e o resumo — so para quem administra.
   * Sem isto a tela do usuario comum faria duas chamadas que voltariam 403.
   */
  withAdminData?: boolean;
}

/*
 * Estado do modulo de salas.
 *
 * Espelha o useEquipmentState: uma unica funcao de recarga, atualizacao ao
 * voltar para a aba e escuta do SSE em canal proprio ("rooms:update").
 *
 * A agenda de sala muda mais rapido que a de robo — duas pessoas escolhendo
 * horario ao mesmo tempo e o caso comum, nao a excecao. Por isso a lista de
 * ocupacao e recarregada tambem depois de cada reserva criada.
 */
export function useMeetingRoomState({ withAdminData = false }: UseMeetingRoomStateOptions = {}) {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [myReservations, setMyReservations] = useState<MeetingRoomReservation[]>([]);
  const [allReservations, setAllReservations] = useState<MeetingRoomReservation[]>([]);
  const [availability, setAvailability] = useState<MeetingRoomAvailability[]>([]);
  const [summary, setSummary] = useState<MeetingRoomSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiRooms, apiReservations, apiAvailability] = await Promise.all([
        meetingRoomService.list(),
        meetingRoomReservationService.listOwn(),
        meetingRoomReservationService.listAvailability(),
      ]);
      setRooms(apiRooms);
      setMyReservations(apiReservations);
      setAvailability(apiAvailability);

      if (withAdminData) {
        const [everyReservation, apiSummary] = await Promise.all([
          meetingRoomReservationService.listAll(),
          meetingRoomReservationService.summary(),
        ]);
        setAllReservations(everyReservation);
        setSummary(apiSummary);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as salas.");
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
    events.addEventListener("rooms:update", () => {
      void refresh();
    });

    return () => {
      events.close();
    };
  }, [refresh]);

  async function createReservation(draft: MeetingRoomReservationDraft) {
    try {
      const reservation = await meetingRoomReservationService.create(draft);
      await refresh();
      return reservation;
    } catch (error) {
      /*
       * Erro de choque de horario nao e falha: e informacao. O 409 do backend
       * ja vem com o horario ocupado escrito, entao repassamos a mensagem
       * inteira em vez de trocar por um texto generico.
       */
      toast.error(error instanceof Error ? error.message : "Não foi possível reservar a sala.");
      return null;
    }
  }

  async function cancelReservation(reservationId: string, reason?: string) {
    try {
      await meetingRoomReservationService.cancel(reservationId, reason);
      await refresh();
      toast.success("Reserva cancelada. O horário está livre novamente.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a reserva.");
      return false;
    }
  }

  async function changeRoomStatus(roomId: string, status: MeetingRoomStatus) {
    try {
      await meetingRoomService.updateStatus(roomId, status);
      await refresh();
      toast.success("Disponibilidade da sala atualizada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a sala.");
      return false;
    }
  }

  return {
    rooms,
    myReservations,
    allReservations,
    availability,
    summary,
    isLoading,
    refresh,
    createReservation,
    cancelReservation,
    changeRoomStatus,
  };
}
