import { CalendarClock, CalendarX, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/LoadingStates";
import { RoomPhoto } from "@/components/rooms/RoomPhoto";
import { Button } from "@/components/ui/button";
import {
  formatDuration,
  formatWeekdayLabel,
  isBlockingRoomReservation,
  roomReservationStatusDots,
  roomReservationStatusHints,
  roomReservationStatusStyles,
  todayValue,
  type MeetingRoomReservation,
  type MeetingRoomReservationStatus,
} from "@/data/meetingRooms";

interface MyRoomReservationsProps {
  reservations: MeetingRoomReservation[];
  onCancel: (reservationId: string, reason?: string) => void;
}

type ReservationFilter = "Todas" | MeetingRoomReservationStatus;

const filters: ReservationFilter[] = ["Todas", "Confirmada", "Cancelada", "Concluída"];

/** Plural do filtro — o badge da reserva fica no singular ("Confirmada"). */
const filterLabels: Record<ReservationFilter, string> = {
  Todas: "Todas",
  Confirmada: "Confirmadas",
  Cancelada: "Canceladas",
  Concluída: "Concluídas",
};

export function MyRoomReservations({ reservations, onCancel }: MyRoomReservationsProps) {
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>("Todas");

  const countByFilter = useMemo(() => {
    const counts = new Map<ReservationFilter, number>([["Todas", reservations.length]]);
    reservations.forEach((reservation) => {
      counts.set(reservation.status, (counts.get(reservation.status) ?? 0) + 1);
    });
    return counts;
  }, [reservations]);

  const visibleReservations = useMemo(
    () =>
      activeFilter === "Todas"
        ? reservations
        : reservations.filter((reservation) => reservation.status === activeFilter),
    [activeFilter, reservations],
  );

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Minhas reservas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os horários que você marcou. Cancele o que não vai acontecer para liberar a sala.
        </p>
      </header>

      <nav
        className="scrollbar-none flex snap-x gap-2 overflow-x-auto pb-1"
        aria-label="Filtrar reservas por situação"
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
          title="Nenhuma reserva por aqui"
          description={
            activeFilter === "Todas"
              ? "Você ainda não reservou nenhuma sala. Escolha um horário livre na agenda."
              : `Você não tem reservas ${filterLabels[activeFilter].toLowerCase()}.`
          }
        />
      ) : (
        <ul className="space-y-3">
          {visibleReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} onCancel={onCancel} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: MeetingRoomReservation;
  onCancel: (reservationId: string, reason?: string) => void;
}) {
  const canCancel = isBlockingRoomReservation(reservation.status);
  const isToday = reservation.date === todayValue();

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex gap-4 p-4">
        <span className="hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
          <RoomPhoto
            src={reservation.roomImage}
            alt={reservation.roomName}
            className="h-full w-full object-cover"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">
                {reservation.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{reservation.roomName}</p>
            </div>
            <StatusBadge status={reservation.status} />
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{isToday ? "Hoje" : formatWeekdayLabel(reservation.date)}</span>
              <span className="font-medium tabular-nums text-foreground">
                {reservation.startTime} – {reservation.endTime}
              </span>
              <span>({formatDuration(reservation.startTime, reservation.endTime)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              {reservation.attendees} {reservation.attendees === 1 ? "pessoa" : "pessoas"}
            </div>
            {reservation.roomLocation ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{reservation.roomLocation}</span>
              </div>
            ) : null}
          </dl>

          {reservation.notes ? (
            <p className="mt-3 text-sm text-muted-foreground">{reservation.notes}</p>
          ) : null}

          {reservation.status === "Cancelada" && reservation.cancellationReason ? (
            <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
              Motivo do cancelamento: {reservation.cancellationReason}
              {reservation.cancelledByName ? ` — ${reservation.cancelledByName}` : null}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              {roomReservationStatusHints[reservation.status]}
            </p>
          )}
        </div>
      </div>

      {canCancel ? (
        <div className="flex justify-end border-t border-border bg-surface px-4 py-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCancel(reservation.id)}
          >
            Cancelar reserva
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function StatusBadge({ status }: { status: MeetingRoomReservationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${roomReservationStatusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${roomReservationStatusDots[status]}`}
        aria-hidden
      />
      {status}
    </span>
  );
}
