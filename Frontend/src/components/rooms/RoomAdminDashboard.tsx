import { CalendarCheck, CalendarClock, DoorOpen, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { EmptyState } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import {
  formatDuration,
  formatWeekdayLabel,
  timeToMinutes,
  todayValue,
  type MeetingRoomReservation,
  type MeetingRoomSummary,
} from "@/data/meetingRooms";

interface RoomAdminDashboardProps {
  summary: MeetingRoomSummary | null;
  reservations: MeetingRoomReservation[];
  onSeeAllReservations: () => void;
}

/*
 * Painel do administrador.
 *
 * Sem fila de aprovacao para vigiar — reserva de sala nasce confirmada — o
 * painel responde outra pergunta: "o que acontece nas salas hoje?". Por isso o
 * corpo e a agenda do dia inteiro, das duas salas juntas, em ordem de relogio.
 */
export function RoomAdminDashboard({
  summary,
  reservations,
  onSeeAllReservations,
}: RoomAdminDashboardProps) {
  const today = todayValue();

  const todayReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.date === today && reservation.status === "Confirmada")
        .sort((first, second) => timeToMinutes(first.startTime) - timeToMinutes(second.startTime)),
    [reservations, today],
  );

  const upcomingReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.date > today && reservation.status === "Confirmada")
        .sort((first, second) =>
          first.date === second.date
            ? timeToMinutes(first.startTime) - timeToMinutes(second.startTime)
            : first.date.localeCompare(second.date),
        )
        .slice(0, 6),
    [reservations, today],
  );

  return (
    <section className="min-w-0 space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ocupação das salas de reunião hoje e nos próximos dias.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarCheck />}
          label="Reuniões hoje"
          value={summary?.today ?? todayReservations.length}
        />
        <StatCard icon={<DoorOpen />} label="Salas livres agora" value={summary?.freeRooms ?? 0} />
        <StatCard icon={<Users />} label="Salas ocupadas agora" value={summary?.busyRooms ?? 0} />
        <StatCard
          icon={<CalendarClock />}
          label="Reservas confirmadas"
          value={summary?.confirmed ?? 0}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Hoje nas salas</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{formatWeekdayLabel(today)}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onSeeAllReservations}>
            Ver todas as reservas
          </Button>
        </header>

        <div className="p-4 sm:p-5">
          {todayReservations.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck />}
              title="Nenhuma reunião hoje"
              description="As duas salas estão livres o dia inteiro."
            />
          ) : (
            <ul className="space-y-2">
              {todayReservations.map((reservation) => (
                <ReservationRow key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {upcomingReservations.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-xs">
          <header className="border-b border-border p-4 sm:p-5">
            <h3 className="text-base font-semibold text-foreground">Próximos dias</h3>
          </header>
          <div className="p-4 sm:p-5">
            <ul className="space-y-2">
              {upcomingReservations.map((reservation) => (
                <ReservationRow key={reservation.id} reservation={reservation} showDate />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReservationRow({
  reservation,
  showDate = false,
}: {
  reservation: MeetingRoomReservation;
  showDate?: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
      <span className="w-[104px] shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {reservation.startTime} – {reservation.endTime}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {reservation.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{reservation.roomName}</span>
          <span className="truncate">
            {reservation.requesterName} · {reservation.requesterDepartment}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden />
            {reservation.attendees}
          </span>
          <span>{formatDuration(reservation.startTime, reservation.endTime)}</span>
          {showDate ? <span>{formatWeekdayLabel(reservation.date)}</span> : null}
        </span>
      </span>
    </li>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary [&_svg]:h-4 [&_svg]:w-4"
          aria-hidden
        >
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
    </div>
  );
}
