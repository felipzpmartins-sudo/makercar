import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReservationDatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  reservedDates?: Set<string>;
  disabledDates?: Set<string>;
  onReservedDateSelect?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

export function ReservationDatePicker({
  id,
  value,
  onChange,
  reservedDates = new Set(),
  disabledDates = new Set(),
  onReservedDateSelect,
  placeholder = "Selecionar data",
  required,
}: ReservationDatePickerProps) {
  const selectedDate = value ? parseDateValue(value) : undefined;
  const [visibleDate, setVisibleDate] = useState(selectedDate ?? new Date());
  const [isOpen, setIsOpen] = useState(false);

  const calendarDays = useMemo(() => {
    const year = visibleDate.getFullYear();
    const month = visibleDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstDayOfMonth }, (_, index) => ({
        key: `empty-${index}`,
        day: null,
      })),
      ...Array.from({ length: daysInMonth }, (_, index) => ({
        key: `day-${index + 1}`,
        day: index + 1,
      })),
    ];
  }, [visibleDate]);

  const monthLabel = visibleDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(delta: number) {
    setVisibleDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectDay(day: number) {
    const nextDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day);
    const nextValue = formatDateValue(nextDate);
    if (disabledDates.has(nextValue)) return;
    onChange(nextValue);
    if (reservedDates.has(nextValue)) onReservedDateSelect?.(nextValue);
    setVisibleDate(nextDate);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="sr-only"
        tabIndex={-1}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full justify-start text-left font-normal",
              !value && "text-slate-500",
            )}
          >
            <CalendarDays className="h-4 w-4 text-blue-600" />
            {selectedDate ? formatDateLabel(selectedDate) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto border-0 bg-transparent p-0 shadow-none">
          <div className="group relative w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-inner">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold capitalize text-slate-950">{monthLabel}</p>
                  <p className="text-xs text-slate-500">Reserva do veículo</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => changeMonth(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Mês anterior</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => changeMonth(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Próximo mês</span>
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="flex h-8 items-center justify-center text-[11px] font-semibold text-slate-400"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map(({ key, day }) =>
                  day ? (
                    <CalendarDay
                      key={key}
                      day={day}
                      isReserved={reservedDates.has(
                        formatDateValue(
                          new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day),
                        ),
                      )}
                      isDisabled={disabledDates.has(
                        formatDateValue(
                          new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day),
                        ),
                      )}
                      isSelected={
                        Boolean(selectedDate) &&
                        selectedDate?.getFullYear() === visibleDate.getFullYear() &&
                        selectedDate?.getMonth() === visibleDate.getMonth() &&
                        selectedDate?.getDate() === day
                      }
                      onClick={() => selectDay(day)}
                    />
                  ) : (
                    <div key={key} className="h-8 w-8" />
                  ),
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CalendarDay({
  day,
  isReserved,
  isDisabled,
  isSelected,
  onClick,
}: {
  day: number;
  isReserved: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={
        isDisabled
          ? "Veículo indisponível durante todo este dia"
          : isReserved
            ? "Este dia possui horário reservado"
            : undefined
      }
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-medium text-slate-600 transition-all hover:bg-blue-100 hover:text-blue-700",
        isReserved && "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800",
        isDisabled &&
          "cursor-not-allowed bg-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-400",
        isSelected &&
          "bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-600 hover:text-white",
      )}
    >
      {day}
    </button>
  );
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
