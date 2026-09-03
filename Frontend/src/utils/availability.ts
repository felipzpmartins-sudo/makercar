/*
 * Disponibilidade por periodo.
 *
 * Estas funcoes nasceram dentro do ReservationModal da frota e passaram a ser
 * compartilhadas quando o modulo de equipamentos precisou exatamente do mesmo
 * calculo: quais dias estao cheios, quais tem so um pedaco ocupado e quais
 * horarios sobram num dia.
 *
 * Trabalham com instantes ISO (o que a API devolve) e nao sabem se o recurso e
 * um carro ou um robo — quem chama traduz para { startDate, endDate }.
 */

/** Janela ocupada de um recurso, em ISO. */
export interface BusyPeriod {
  startDate: string;
  endDate: string;
}

export interface TimeInterval {
  start: Date;
  end: Date;
}

/**
 * Primeiro periodo que colide com a janela escolhida.
 *
 * Dois periodos colidem quando um comeca antes do outro terminar. Devolve
 * `undefined` enquanto a janela ainda esta incompleta ou invertida — nesse
 * estado o formulario nao deve acusar conflito, so falta preencher.
 */
export function findPeriodConflict(
  selection: { startDate: string; startTime: string; endDate: string; endTime: string },
  periods: BusyPeriod[],
) {
  if (!selection.startDate || !selection.startTime || !selection.endDate || !selection.endTime) {
    return undefined;
  }

  const start = new Date(`${selection.startDate}T${selection.startTime}:00`);
  const end = new Date(`${selection.endDate}T${selection.endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return undefined;
  }

  return periods.find((period) => {
    const busyStart = new Date(period.startDate);
    const busyEnd = new Date(period.endDate);
    return start < busyEnd && end > busyStart;
  });
}

export function formatBusyPeriod(period: BusyPeriod) {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `de ${formatter.format(start)} ate ${formatter.format(end)}`;
}

/** Dias ocupados do primeiro ao ultimo minuto — nao ha o que escolher neles. */
export function getFullyReservedDates(periods: BusyPeriod[]) {
  const dates = new Set<string>();
  getReservedDates(periods).forEach((date) => {
    if (isDateFullyReserved(date, periods)) dates.add(date);
  });
  return dates;
}

/** Dias com parte livre — selecionaveis, mas merecem aviso dos horarios vagos. */
export function getPartiallyReservedDates(periods: BusyPeriod[]) {
  const dates = new Set<string>();
  getReservedDates(periods).forEach((date) => {
    if (!isDateFullyReserved(date, periods)) dates.add(date);
  });
  return dates;
}

export function getReservedDates(periods: BusyPeriod[]) {
  const dates = new Set<string>();

  periods.forEach((period) => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return;

    const current = startOfDay(start);
    const finalDay = startOfDay(end);
    // Periodo que termina exatamente a meia-noite nao ocupa o dia seguinte.
    if (end.getTime() === finalDay.getTime()) finalDay.setDate(finalDay.getDate() - 1);
    while (current <= finalDay) {
      dates.add(formatDateValue(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return dates;
}

export function isDateFullyReserved(date: string, periods: BusyPeriod[]) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const intervals = mergeIntervals(getBusyIntervals(dayStart, dayEnd, periods));

  return intervals.length === 1 && intervals[0].start <= dayStart && intervals[0].end >= dayEnd;
}

/** Frase com os horarios que sobram no dia, para avisar quem escolheu um dia parcial. */
export function describeFreeIntervals(date: string, periods: BusyPeriod[]) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const busyIntervals = mergeIntervals(getBusyIntervals(dayStart, dayEnd, periods));
  const freeIntervals: TimeInterval[] = [];
  let cursor = dayStart;

  busyIntervals.forEach((interval) => {
    if (interval.start > cursor) freeIntervals.push({ start: cursor, end: interval.start });
    if (interval.end > cursor) cursor = interval.end;
  });
  if (cursor < dayEnd) freeIntervals.push({ start: cursor, end: dayEnd });

  if (freeIntervals.length === 0) return "Este item está indisponível durante todo este dia.";
  return `Horários livres em ${formatShortDate(dayStart)}: ${freeIntervals
    .map(formatInterval)
    .join(" e ")}.`;
}

export function getBusyIntervals(dayStart: Date, dayEnd: Date, periods: BusyPeriod[]) {
  return periods.flatMap((period) => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= dayEnd ||
      end <= dayStart
    ) {
      return [];
    }
    return [{ start: start > dayStart ? start : dayStart, end: end < dayEnd ? end : dayEnd }];
  });
}

export function mergeIntervals(intervals: TimeInterval[]) {
  return intervals
    .sort((left, right) => left.start.getTime() - right.start.getTime())
    .reduce<TimeInterval[]>((merged, interval) => {
      const previous = merged.at(-1);
      if (!previous || interval.start > previous.end) {
        merged.push({ ...interval });
      } else if (interval.end > previous.end) {
        previous.end = interval.end;
      }
      return merged;
    }, []);
}

export function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatInterval(interval: TimeInterval) {
  return `${formatTime(interval.start)}–${formatTime(interval.end)}`;
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
