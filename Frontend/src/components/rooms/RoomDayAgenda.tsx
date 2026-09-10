import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  formatDuration,
  formatLongDateLabel,
  formatWeekdayLabel,
  isRoomReservable,
  minutesToTime,
  timeToMinutes,
  todayValue,
  type MeetingRoom,
  type MeetingRoomAvailability,
} from "@/data/meetingRooms";

interface RoomDayAgendaProps {
  room: MeetingRoom;
  /** Blocos ocupados de todas as salas — filtramos a sala e o dia aqui. */
  availability: MeetingRoomAvailability[];
  date: string;
  currentUserId: string;
  onChangeDate: (date: string) => void;
  /**
   * Abre o formulário já com o vão escolhido preenchido. Sem esta prop os vãos
   * livres viram texto: é o modo de consulta usado no painel administrativo.
   */
  onReserveSlot?: (startTime: string, endTime: string) => void;
}

type AgendaSegment =
  | { kind: "free"; startTime: string; endTime: string }
  | { kind: "busy"; reservation: MeetingRoomAvailability };

/** Vao menor que isto nao cabe reuniao — vira sobra entre dois blocos. */
const MINIMUM_USEFUL_SLOT = 15;

/*
 * Agenda do dia.
 *
 * Esta e a tela que decide se o modulo vai ser usado. A pergunta real de quem
 * chega aqui nao e "quais reunioes existem?" e sim "onde eu encaixo a minha?".
 * Por isso o vao livre e um botao — clicar nele ja abre o formulario com o
 * horario preenchido, e ninguem precisa somar horas de cabeca para descobrir
 * que sobrou uma hora entre duas reunioes.
 */
export function RoomDayAgenda({
  room,
  availability,
  date,
  currentUserId,
  onChangeDate,
  onReserveSlot,
}: RoomDayAgendaProps) {
  const today = todayValue();
  const isToday = date === today;
  const canReserve = isRoomReservable(room) && Boolean(onReserveSlot);

  const dayReservations = useMemo(
    () =>
      availability
        .filter((period) => period.roomId === room.id && period.date === date)
        .sort((first, second) => timeToMinutes(first.startTime) - timeToMinutes(second.startTime)),
    [availability, room.id, date],
  );

  const segments = useMemo(
    () => buildSegments(dayReservations, room.openingTime, room.closingTime),
    [dayReservations, room.openingTime, room.closingTime],
  );

  const busyMinutes = dayReservations.reduce(
    (total, reservation) =>
      total + timeToMinutes(reservation.endTime) - timeToMinutes(reservation.startTime),
    0,
  );

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">Agenda da {room.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isToday ? `Hoje · ${formatLongDateLabel(date)}` : formatWeekdayLabel(date)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Dia anterior"
            onClick={() => onChangeDate(shiftDate(date, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(event) => onChangeDate(event.target.value || today)}
            aria-label="Data da agenda"
            className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Próximo dia"
            onClick={() => onChangeDate(shiftDate(date, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        {dayReservations.length === 0 ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Nenhuma reunião marcada neste dia — a sala está livre o expediente inteiro.
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            {dayReservations.length}{" "}
            {dayReservations.length === 1 ? "reunião marcada" : "reuniões marcadas"} ·{" "}
            {formatDuration("00:00", minutesToTime(busyMinutes))} de ocupação
          </p>
        )}

        <ol className="space-y-2">
          {segments.map((segment) =>
            segment.kind === "busy" ? (
              <BusyBlock
                key={segment.reservation.id}
                reservation={segment.reservation}
                isMine={segment.reservation.requesterId === currentUserId}
              />
            ) : (
              <FreeBlock
                key={`free-${segment.startTime}`}
                startTime={segment.startTime}
                endTime={segment.endTime}
                disabled={!canReserve}
                onReserve={() => onReserveSlot?.(segment.startTime, segment.endTime)}
              />
            ),
          )}
        </ol>
      </div>
    </section>
  );
}

/**
 * Transforma a lista de reservas nos blocos que a agenda desenha: ocupados na
 * ordem do relogio, com os vaos livres entre eles.
 *
 * Reservas sobrepostas nao deveriam existir — o backend recusa — mas se uma
 * escapar, `cursor` nunca anda para tras e o desenho continua coerente.
 */
function buildSegments(
  reservations: MeetingRoomAvailability[],
  openingTime: string,
  closingTime: string,
): AgendaSegment[] {
  const opening = timeToMinutes(openingTime);
  const closing = timeToMinutes(closingTime);
  const segments: AgendaSegment[] = [];
  let cursor = opening;

  for (const reservation of reservations) {
    const start = timeToMinutes(reservation.startTime);
    const end = timeToMinutes(reservation.endTime);

    if (start - cursor >= MINIMUM_USEFUL_SLOT) {
      segments.push({
        kind: "free",
        startTime: minutesToTime(cursor),
        endTime: reservation.startTime,
      });
    }
    segments.push({ kind: "busy", reservation });
    cursor = Math.max(cursor, end);
  }

  if (closing - cursor >= MINIMUM_USEFUL_SLOT) {
    segments.push({
      kind: "free",
      startTime: minutesToTime(cursor),
      endTime: closingTime,
    });
  }

  return segments;
}

function BusyBlock({
  reservation,
  isMine: mine,
}: {
  reservation: MeetingRoomAvailability;
  isMine: boolean;
}) {
  return (
    <li
      className={[
        "flex items-start gap-3 rounded-xl border p-3",
        mine ? "border-primary/30 bg-primary-subtle/40" : "border-border bg-surface",
      ].join(" ")}
    >
      <span className="w-[104px] shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {reservation.startTime} – {reservation.endTime}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {reservation.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="truncate">{mine ? "Sua reserva" : reservation.requesterName}</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden />
            {reservation.attendees}
          </span>
          <span>{formatDuration(reservation.startTime, reservation.endTime)}</span>
        </span>
      </span>
    </li>
  );
}

function FreeBlock({
  startTime,
  endTime,
  disabled,
  onReserve,
}: {
  startTime: string;
  endTime: string;
  disabled: boolean;
  onReserve: () => void;
}) {
  if (disabled) {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
        <span className="w-[104px] shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {startTime} – {endTime}
        </span>
        <span className="min-w-0 flex-1 text-sm text-muted-foreground">
          Livre · {formatDuration(startTime, endTime)}
        </span>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onReserve}
        className={[
          "group flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "hover:border-primary/40 hover:bg-primary-subtle/40",
        ].join(" ")}
      >
        <span className="w-[104px] shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {startTime} – {endTime}
        </span>
        <span className="min-w-0 flex-1 text-sm text-muted-foreground">
          Livre · {formatDuration(startTime, endTime)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Plus className="h-4 w-4" aria-hidden />
          Reservar
        </span>
      </button>
    </li>
  );
}

/** Soma dias a uma data "YYYY-MM-DD" sem esbarrar em fuso horário. */
function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
