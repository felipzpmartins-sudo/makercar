import { CalendarX, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatDuration,
  formatWeekdayLabel,
  isBlockingRoomReservation,
  roomReservationStatusDots,
  roomReservationStatusStyles,
  timeToMinutes,
  todayValue,
  type MeetingRoomReservation,
  type MeetingRoomReservationStatus,
} from "@/data/meetingRooms";

interface RoomReservationsPanelProps {
  reservations: MeetingRoomReservation[];
  onCancel: (reservationId: string, reason?: string) => void;
}

type PanelFilter = "Próximas" | MeetingRoomReservationStatus;

const filters: PanelFilter[] = ["Próximas", "Confirmada", "Cancelada", "Concluída"];

const filterLabels: Record<PanelFilter, string> = {
  Próximas: "Próximas",
  Confirmada: "Confirmadas",
  Cancelada: "Canceladas",
  Concluída: "Concluídas",
};

/*
 * Todas as reservas de sala.
 *
 * O filtro padrao e "Proximas" e nao "Todas": o que o administrador precisa
 * ver ao abrir e o que ainda vai acontecer. Historico completo continua a um
 * clique, nas outras abas.
 */
export function RoomReservationsPanel({ reservations, onCancel }: RoomReservationsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<PanelFilter>("Próximas");
  const [cancelling, setCancelling] = useState<MeetingRoomReservation>();
  const [reason, setReason] = useState("");

  const today = todayValue();

  const countByFilter = useMemo(() => {
    const counts = new Map<PanelFilter, number>();
    counts.set(
      "Próximas",
      reservations.filter(
        (reservation) => reservation.status === "Confirmada" && reservation.date >= today,
      ).length,
    );
    reservations.forEach((reservation) => {
      counts.set(reservation.status, (counts.get(reservation.status) ?? 0) + 1);
    });
    return counts;
  }, [reservations, today]);

  const visibleReservations = useMemo(() => {
    const filtered =
      activeFilter === "Próximas"
        ? reservations.filter(
            (reservation) => reservation.status === "Confirmada" && reservation.date >= today,
          )
        : reservations.filter((reservation) => reservation.status === activeFilter);

    // Próximas sobem em ordem cronológica; o histórico começa pelo mais recente.
    const direction = activeFilter === "Próximas" ? 1 : -1;
    return [...filtered].sort((first, second) =>
      first.date === second.date
        ? direction * (timeToMinutes(first.startTime) - timeToMinutes(second.startTime))
        : direction * first.date.localeCompare(second.date),
    );
  }, [reservations, activeFilter, today]);

  function confirmCancel() {
    if (!cancelling) return;
    onCancel(cancelling.id, reason.trim() || undefined);
    setCancelling(undefined);
    setReason("");
  }

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reservas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as reservas de sala da empresa. Cancele uma reserva quando a sala precisar ser
          liberada.
        </p>
      </header>

      <nav
        className="scrollbar-none flex snap-x gap-2 overflow-x-auto pb-1"
        aria-label="Filtrar reservas"
      >
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          const count = countByFilter.get(filter) ?? 0;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={isActive}
              className={[
                "inline-flex h-9 shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 text-sm font-medium",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary/25 bg-primary-subtle text-primary-subtle-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
              ].join(" ")}
            >
              {filterLabels[filter]}
              <span className="text-xs tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </nav>

      {visibleReservations.length === 0 ? (
        <EmptyState
          icon={<CalendarX />}
          title="Nenhuma reserva nesta lista"
          description={
            activeFilter === "Próximas"
              ? "Não há reuniões marcadas de hoje em diante."
              : `Não há reservas ${filterLabels[activeFilter].toLowerCase()}.`
          }
        />
      ) : (
        <ul className="space-y-2">
          {visibleReservations.map((reservation) => (
            <li
              key={reservation.id}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {reservation.title}
                  </span>
                  <StatusBadge status={reservation.status} />
                </span>

                <span className="mt-1 block text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{reservation.roomName}</span> ·{" "}
                  <span>{formatWeekdayLabel(reservation.date)}</span> ·{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {reservation.startTime} – {reservation.endTime}
                  </span>{" "}
                  ({formatDuration(reservation.startTime, reservation.endTime)})
                </span>

                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="truncate">
                    {reservation.requesterName} · {reservation.requesterDepartment}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" aria-hidden />
                    {reservation.attendees}
                  </span>
                </span>

                {reservation.notes ? (
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {reservation.notes}
                  </span>
                ) : null}

                {reservation.cancellationReason ? (
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Cancelada: {reservation.cancellationReason}
                    {reservation.cancelledByName ? ` — ${reservation.cancelledByName}` : null}
                  </span>
                ) : null}
              </span>

              {isBlockingRoomReservation(reservation.status) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCancelling(reservation);
                    setReason("");
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => {
          if (!open) setCancelling(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              {cancelling
                ? `${cancelling.title} — ${cancelling.roomName}, ${cancelling.startTime} às ${cancelling.endTime}.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
            <Input
              id="cancel-reason"
              value={reason}
              maxLength={1000}
              placeholder="Ex.: sala em manutenção"
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              O motivo aparece para quem fez a reserva.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setCancelling(undefined)}>
              Voltar
            </Button>
            <Button type="button" onClick={confirmCancel}>
              Cancelar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StatusBadge({ status }: { status: MeetingRoomReservationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${roomReservationStatusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${roomReservationStatusDots[status]}`}
        aria-hidden
      />
      {status}
    </span>
  );
}
