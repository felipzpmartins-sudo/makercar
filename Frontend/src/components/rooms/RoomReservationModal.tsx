import { AlertCircle, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDuration,
  formatWeekdayLabel,
  isRoomReservable,
  minutesToTime,
  overlaps,
  timeToMinutes,
  todayValue,
  type MeetingRoom,
  type MeetingRoomAvailability,
  type MeetingRoomReservationDraft,
} from "@/data/meetingRooms";

interface RoomReservationModalProps {
  open: boolean;
  room: MeetingRoom;
  /** Blocos já ocupados desta sala, de todos os dias. */
  reservedPeriods: MeetingRoomAvailability[];
  /** Horário pré-selecionado ao clicar num vão livre da agenda. */
  initialDate: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: MeetingRoomReservationDraft) => Promise<boolean>;
}

/** Duração sugerida quando a pessoa abre o formulário pelo botão principal. */
const DEFAULT_DURATION_MINUTES = 60;

/*
 * Formulario de reserva de sala.
 *
 * O formulario e curto de proposito: data, horario, assunto e quantas pessoas.
 * Sem termo de responsabilidade e sem "local de uso" — a sala e o local, e o
 * termo dos equipamentos existe porque robo quebra e sai do predio.
 *
 * O choque de horario e verificado enquanto a pessoa escolhe, nao so no envio.
 * O backend recusa de qualquer forma, mas descobrir o choque no botao final e
 * o tipo de atrito que faz o pessoal voltar a marcar sala no grupo.
 */
export function RoomReservationModal({
  open,
  room,
  reservedPeriods,
  initialDate,
  initialStartTime,
  initialEndTime,
  onOpenChange,
  onConfirm,
}: RoomReservationModalProps) {
  const [draft, setDraft] = useState<MeetingRoomReservationDraft>(() =>
    buildDraft(room, initialDate, initialStartTime, initialEndTime),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const today = todayValue();
  const canReserve = isRoomReservable(room);

  useEffect(() => {
    if (!open) return;
    setSubmitError("");
    setDraft(buildDraft(room, initialDate, initialStartTime, initialEndTime));
  }, [open, room, initialDate, initialStartTime, initialEndTime]);

  const dayReservations = useMemo(
    () =>
      reservedPeriods
        .filter((period) => period.roomId === room.id && period.date === draft.date)
        .sort((first, second) => timeToMinutes(first.startTime) - timeToMinutes(second.startTime)),
    [reservedPeriods, room.id, draft.date],
  );

  const conflict = useMemo(() => {
    if (!draft.startTime || !draft.endTime) return null;
    if (timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime)) return null;
    return dayReservations.find((period) => overlaps(draft, period)) ?? null;
  }, [dayReservations, draft]);

  const outsideOpeningHours = useMemo(() => {
    if (!draft.startTime || !draft.endTime) return false;
    return (
      timeToMinutes(draft.startTime) < timeToMinutes(room.openingTime) ||
      timeToMinutes(draft.endTime) > timeToMinutes(room.closingTime)
    );
  }, [draft.startTime, draft.endTime, room.openingTime, room.closingTime]);

  const overCapacity = draft.attendees > room.capacity;

  function updateField<TField extends keyof MeetingRoomReservationDraft>(
    field: TField,
    value: MeetingRoomReservationDraft[TField],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  /*
   * Ao mexer no inicio, o fim acompanha mantendo a duracao ja escolhida. Sem
   * isto, adiar a reuniao em meia hora exige corrigir os dois campos.
   */
  function handleStartTimeChange(value: string) {
    setDraft((current) => {
      const previousDuration = timeToMinutes(current.endTime) - timeToMinutes(current.startTime);
      const duration =
        Number.isNaN(previousDuration) || previousDuration <= 0
          ? DEFAULT_DURATION_MINUTES
          : previousDuration;
      const start = timeToMinutes(value);
      if (Number.isNaN(start)) return { ...current, startTime: value };

      return {
        ...current,
        startTime: value,
        endTime: minutesToTime(Math.min(start + duration, timeToMinutes(room.closingTime))),
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!draft.date || !draft.startTime || !draft.endTime) {
      setSubmitError("Informe a data e os horários de início e término.");
      return;
    }
    if (timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime)) {
      setSubmitError("O término precisa ser depois do início.");
      return;
    }
    if (draft.title.trim().length < 3) {
      setSubmitError("Descreva o assunto da reunião em pelo menos 3 caracteres.");
      return;
    }
    if (conflict) {
      setSubmitError(
        `Este horário já está ocupado: ${conflict.startTime} – ${conflict.endTime} (${conflict.title}).`,
      );
      return;
    }
    if (outsideOpeningHours) {
      setSubmitError(`A ${room.name} funciona das ${room.openingTime} às ${room.closingTime}.`);
      return;
    }
    if (overCapacity) {
      setSubmitError(`A ${room.name} comporta até ${room.capacity} pessoas.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmed = await onConfirm(draft);
      if (confirmed) onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const duration =
    draft.startTime && draft.endTime ? formatDuration(draft.startTime, draft.endTime) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reservar a {room.name}</DialogTitle>
          <DialogDescription>
            A reserva é confirmada na hora. Se a reunião não acontecer, cancele para liberar o
            horário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-date">Data</Label>
            <Input
              id="room-date"
              type="date"
              value={draft.date}
              min={today}
              required
              onChange={(event) => updateField("date", event.target.value)}
            />
            {draft.date ? (
              <p className="text-xs text-muted-foreground">{formatWeekdayLabel(draft.date)}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="room-start">Início</Label>
              <Input
                id="room-start"
                type="time"
                step={300}
                value={draft.startTime}
                min={room.openingTime}
                max={room.closingTime}
                required
                onChange={(event) => handleStartTimeChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-end">Término</Label>
              <Input
                id="room-end"
                type="time"
                step={300}
                value={draft.endTime}
                min={room.openingTime}
                max={room.closingTime}
                required
                onChange={(event) => updateField("endTime", event.target.value)}
              />
            </div>
          </div>

          {duration && duration !== "-" ? (
            <p className="text-xs text-muted-foreground">
              Duração: <strong className="font-medium text-foreground">{duration}</strong> · a sala
              abre das {room.openingTime} às {room.closingTime}
            </p>
          ) : null}

          {/* Os horários já ocupados do dia ficam à vista enquanto se escolhe. */}
          {dayReservations.length > 0 ? (
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Já reservado neste dia
              </p>
              <ul className="mt-2 space-y-1">
                {dayReservations.map((period) => (
                  <li key={period.id} className="text-xs text-muted-foreground">
                    <span className="font-medium tabular-nums text-foreground">
                      {period.startTime} – {period.endTime}
                    </span>{" "}
                    · {period.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="room-title">Assunto da reunião</Label>
            <Input
              id="room-title"
              value={draft.title}
              maxLength={160}
              required
              placeholder="Ex.: Alinhamento do projeto MakerCar"
              onChange={(event) => updateField("title", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Aparece na agenda para os outros setores saberem o que ocupa a sala.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-attendees">Quantas pessoas</Label>
            <Input
              id="room-attendees"
              type="number"
              min={1}
              max={room.capacity}
              value={draft.attendees}
              required
              onChange={(event) => updateField("attendees", Number(event.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              A {room.name} comporta até {room.capacity} pessoas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-notes">Observações (opcional)</Label>
            <Textarea
              id="room-notes"
              value={draft.notes}
              maxLength={2000}
              rows={3}
              placeholder="Algo que ajude quem usa a sala antes ou depois de você."
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>

          {conflict ? (
            <Alert>
              Este horário choca com <strong>{conflict.title}</strong> ({conflict.startTime} –{" "}
              {conflict.endTime}). Escolha outro horário.
            </Alert>
          ) : null}

          {outsideOpeningHours ? (
            <Alert>
              A {room.name} funciona das {room.openingTime} às {room.closingTime}.
            </Alert>
          ) : null}

          {overCapacity ? (
            <Alert>
              A {room.name} comporta até {room.capacity} pessoas. Escolha a outra sala se o grupo
              for maior.
            </Alert>
          ) : null}

          {submitError ? <Alert>{submitError}</Alert> : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !canReserve ||
                Boolean(conflict) ||
                outsideOpeningHours ||
                overCapacity
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Reservando...
                </>
              ) : (
                "Confirmar reserva"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-subtle px-3 py-2.5 text-sm text-danger-subtle-foreground">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function buildDraft(
  room: Pick<MeetingRoom, "id" | "openingTime" | "closingTime">,
  date: string,
  slotStart: string | undefined,
  slotEnd: string | undefined,
): MeetingRoomReservationDraft {
  const opening = timeToMinutes(room.openingTime);
  const closing = timeToMinutes(room.closingTime);

  const start = slotStart ? timeToMinutes(slotStart) : suggestStart(opening, closing);
  /*
   * Clicar num vao livre nao reserva o vao inteiro: um buraco de 09:00 as
   * 18:00 viraria uma reserva de nove horas so porque a agenda estava vazia.
   * O vao define o inicio e o teto; a duracao continua sendo a padrao.
   */
  const ceiling = slotEnd ? Math.min(timeToMinutes(slotEnd), closing) : closing;
  const end = Math.min(start + DEFAULT_DURATION_MINUTES, ceiling);

  return {
    roomId: room.id,
    date: date || todayValue(),
    startTime: minutesToTime(start),
    endTime: minutesToTime(end),
    title: "",
    attendees: 2,
    notes: "",
  };
}

/*
 * Sugestao de horario: a proxima hora cheia, dentro do expediente. Chegar no
 * formulario com "14:00 - 15:00" ja preenchido poupa dois campos no caso mais
 * comum, que e marcar uma reuniao para hoje mesmo. Fora do expediente a
 * sugestao volta para a abertura — a pessoa provavelmente marca para amanha.
 */
function suggestStart(opening: number, closing: number) {
  const now = new Date();
  const nextHour = (now.getHours() + 1) * 60;
  if (nextHour + DEFAULT_DURATION_MINUTES > closing) return opening;
  return Math.max(nextHour, opening);
}
