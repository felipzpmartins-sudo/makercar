import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Reservation } from "@/data/vehicles";

interface ReservationCalendarProps {
  reservations: Reservation[];
}

const visibleStatuses = new Set(["Reservado", "Em uso"]);

export function ReservationCalendar({ reservations }: ReservationCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const reservationsByDay = useMemo(() => {
    const entries = new Map<string, Reservation[]>();

    reservations.forEach((reservation) => {
      if (!visibleStatuses.has(reservation.status)) return;

      eachDateInRange(reservation.pickupDate, reservation.returnDate).forEach((date) => {
        const dayReservations = entries.get(date) ?? [];
        dayReservations.push(reservation);
        entries.set(date, dayReservations);
      });
    });

    entries.forEach((dayReservations) =>
      dayReservations.sort((first, second) => first.pickupTime.localeCompare(second.pickupTime)),
    );
    return entries;
  }, [reservations]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Agenda de reservas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualize os veículos reservados e seus horários.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button type="button" variant="outline" size="icon" aria-label="Semana anterior" onClick={() => setWeekStart((date) => addDays(date, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Hoje
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="Próxima semana" onClick={() => setWeekStart((date) => addDays(date, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-center text-sm font-medium text-slate-600">
        {formatDay(weekStart)} a {formatDay(days[6])}
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => {
          const key = formatDateValue(day);
          const dayReservations = reservationsByDay.get(key) ?? [];
          const isToday = key === formatDateValue(new Date());

          return (
            <article key={key} className={`min-h-40 rounded-lg border bg-white p-3 shadow-sm ${isToday ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"}`}>
              <header className="mb-3 border-b border-slate-100 pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(day).replace(".", "")}
                </p>
                <p className={`text-lg font-bold ${isToday ? "text-blue-700" : "text-slate-950"}`}>
                  {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(day)}
                </p>
              </header>

              {dayReservations.length ? (
                <div className="space-y-2">
                  {dayReservations.map((reservation) => (
                    <div key={`${reservation.id}-${key}`} className="rounded-md bg-amber-50 p-2.5 text-sm ring-1 ring-amber-100">
                      <p className="font-semibold text-slate-900">{reservation.vehicleName}</p>
                      <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-500">
                        Placa: {reservation.plate}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-amber-800">{getReservationHours(reservation, key)}</p>
                      <p className="mt-1 truncate text-sm text-slate-700">{reservation.requesterName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pt-3 text-center text-xs text-slate-400">Sem reservas</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getReservationHours(reservation: Reservation, date: string) {
  const startsToday = reservation.pickupDate === date;
  const endsToday = reservation.returnDate === date;
  if (startsToday && endsToday) return `${reservation.pickupTime} – ${reservation.returnTime}`;
  if (startsToday) return `A partir de ${reservation.pickupTime}`;
  if (endsToday) return `Até ${reservation.returnTime}`;
  return "Dia todo";
}

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekDay = result.getDay() || 7;
  result.setDate(result.getDate() - weekDay + 1);
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function eachDateInRange(start: string, end: string) {
  const dates: string[] = [];
  const current = parseDateValue(start);
  const final = parseDateValue(end);
  while (current.getTime() <= final.getTime()) {
    dates.push(formatDateValue(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}
