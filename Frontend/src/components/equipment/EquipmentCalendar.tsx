import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  formatEquipmentPeriod,
  isBlockingReservation,
  type Equipment,
  type EquipmentAvailability,
  type EquipmentReservation,
} from "@/data/equipment";
import { formatDateValue, startOfDay } from "@/utils/availability";

interface EquipmentCalendarProps {
  equipments: Equipment[];
  /** Janelas ocupadas de todos — e o que define se um dia esta livre. */
  availability: EquipmentAvailability[];
  /**
   * Reservas com solicitante e finalidade. Opcional: o usuario comum ve apenas
   * ocupado/livre, o administrador ve de quem e cada dia.
   */
  reservations?: EquipmentReservation[];
}

const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

/*
 * Agenda mensal por equipamento.
 *
 * Um mes por vez, um bloco por equipamento — e assim que a pergunta real
 * ("quando o robo cachorro esta livre?") e respondida sem cruzar listas.
 *
 * A ocupacao vem sempre de `availability`, que qualquer pessoa autenticada
 * pode ler. Nome e finalidade so aparecem quando `reservations` e fornecido,
 * o que acontece na area do administrador.
 */
export function EquipmentCalendar({
  equipments,
  availability,
  reservations,
}: EquipmentCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const monthLabel = visibleMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  /*
   * Dia a dia ocupado, por equipamento. Expandir os intervalos uma unica vez
   * evita percorrer todas as reservas dentro de cada celula do calendario.
   */
  const busyDaysByEquipment = useMemo(() => {
    const map = new Map<string, Map<string, DayOccupation>>();

    const detailByReservationId = new Map(
      (reservations ?? [])
        .filter((reservation) => isBlockingReservation(reservation.status))
        .map((reservation) => [reservation.id, reservation]),
    );

    availability.forEach((period) => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return;

      const days = map.get(period.equipmentId) ?? new Map<string, DayOccupation>();
      const cursor = startOfDay(start);
      const lastDay = startOfDay(end);
      // Periodo terminando a meia-noite nao ocupa o dia seguinte.
      if (end.getTime() === lastDay.getTime()) lastDay.setDate(lastDay.getDate() - 1);

      while (cursor <= lastDay) {
        const detail = detailByReservationId.get(period.id);
        days.set(formatDateValue(cursor), {
          status: period.status,
          requesterName: detail?.requesterName,
          purpose: detail?.purpose,
          period: detail ? formatEquipmentPeriod(detail) : undefined,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      map.set(period.equipmentId, days);
    });

    return map;
  }, [availability, reservations]);

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstWeekDay }, (_, index) => ({
        key: `empty-${index}`,
        day: null as number | null,
        value: "",
      })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
          key: `day-${day}`,
          day,
          value: formatDateValue(new Date(year, month, day)),
        };
      }),
    ];
  }, [visibleMonth]);

  const today = formatDateValue(new Date());

  function changeMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Agenda dos equipamentos</h2>
            <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">
              {monthLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Mês anterior"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const now = new Date();
              setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            Hoje
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Próximo mês"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <LegendItem className="bg-success/70" label="Disponível" />
        <LegendItem className="bg-warning" label="Solicitação pendente" />
        <LegendItem className="bg-info" label="Reserva aprovada" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {equipments.map((equipment) => {
          const busyDays = busyDaysByEquipment.get(equipment.id);

          return (
            <article
              key={equipment.id}
              className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
            >
              <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70">
                  <img
                    src={equipment.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="max-h-8 w-auto object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{equipment.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {equipment.category.name}
                  </p>
                </div>
              </header>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map((weekDay) => (
                    <div
                      key={weekDay}
                      className="flex h-7 items-center justify-center text-[10px] font-semibold text-muted-foreground"
                    >
                      {weekDay}
                    </div>
                  ))}

                  {calendarCells.map((cell) => {
                    if (!cell.day) return <div key={cell.key} className="h-11" />;

                    const occupation = busyDays?.get(cell.value);
                    const isToday = cell.value === today;

                    return (
                      <div
                        key={cell.key}
                        title={buildDayTitle(cell.value, occupation)}
                        className={[
                          "flex h-11 min-w-0 flex-col items-center justify-center rounded-lg border text-center transition-colors duration-150",
                          isToday ? "border-primary/45" : "border-transparent",
                          occupation
                            ? occupation.status === "Aprovada"
                              ? "bg-info-subtle text-info-subtle-foreground"
                              : "bg-warning-subtle text-warning-subtle-foreground"
                            : "bg-muted/45 text-muted-foreground",
                        ].join(" ")}
                      >
                        <span className="tabular text-xs font-semibold leading-none">
                          {cell.day}
                        </span>
                        {occupation?.requesterName ? (
                          <span className="mt-0.5 max-w-full truncate px-1 text-[9px] leading-tight">
                            {firstName(occupation.requesterName)}
                          </span>
                        ) : occupation ? (
                          <span className="mt-1 h-1 w-1 rounded-full bg-current" aria-hidden />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface DayOccupation {
  status: EquipmentAvailability["status"];
  requesterName?: string;
  purpose?: string;
  period?: string;
}

function buildDayTitle(date: string, occupation?: DayOccupation) {
  const [year, month, day] = date.split("-");
  const label = `${day}/${month}/${year}`;
  if (!occupation) return `${label} — disponível`;

  const details = [occupation.requesterName, occupation.purpose, occupation.period]
    .filter(Boolean)
    .join(" · ");
  return details
    ? `${label} — ${occupation.status}: ${details}`
    : `${label} — ${occupation.status}`;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  );
}
