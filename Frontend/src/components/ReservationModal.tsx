import { AlertCircle, CreditCard } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GetStartedButton } from "@/components/ui/get-started-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReservationDatePicker } from "@/components/ReservationDatePicker";
import {
  isVehicleAvailable,
  isVehicleReservable,
  type ReservationDraft,
  type Vehicle,
} from "@/data/vehicles";
import { authClient, type AuthUser } from "@/services/authClient";
import type { ReservationAvailability } from "@/services/reservationService";
import { getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";
import { cnhFileToDataUrl } from "@/utils/imageUpload";

const emptyDraft: ReservationDraft = {
  requesterName: "",
  department: "",
  pickupDate: "",
  pickupTime: "",
  returnDate: "",
  returnTime: "",
  reason: "",
  cnhNumber: "",
  cnhExpiresAt: "",
  cnhPhotoDataUrl: "",
};

interface ReservationModalProps {
  open: boolean;
  vehicle: Vehicle;
  currentUser: AuthUser;
  reservedPeriods: ReservationAvailability[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: ReservationDraft) => void | Promise<void>;
}

export function ReservationModal({
  open,
  vehicle,
  currentUser,
  reservedPeriods,
  onOpenChange,
  onConfirm,
}: ReservationModalProps) {
  const [draft, setDraft] = useState<ReservationDraft>(emptyDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isAvailable = isVehicleAvailable(vehicle.status);
  const isReservable = isVehicleReservable(vehicle.status);
  const needsCnhUpload =
    !currentUser.cnhNumber ||
    !currentUser.cnhExpiresAt ||
    new Date(currentUser.cnhExpiresAt).getTime() < Date.now() ||
    currentUser.cnhStatus === "REJECTED";
  const reservationConflict = findReservationConflict(draft, reservedPeriods);
  const fullyReservedDates = useMemo(
    () => getFullyReservedDates(reservedPeriods),
    [reservedPeriods],
  );
  const partiallyReservedDates = useMemo(
    () => getPartiallyReservedDates(reservedPeriods),
    [reservedPeriods],
  );

  useEffect(() => {
    if (open) {
      setSubmitError("");
      setDraft({
        ...emptyDraft,
        requesterName: currentUser.name,
        department: currentUser.department.name,
        cnhNumber: currentUser.cnhNumber ?? "",
        cnhExpiresAt: currentUser.cnhExpiresAt?.slice(0, 10) ?? "",
      });
    }
  }, [
    currentUser.cnhExpiresAt,
    currentUser.cnhNumber,
    currentUser.department.name,
    currentUser.name,
    open,
    vehicle.id,
  ]);

  function updateField(field: keyof ReservationDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function notifyPartialAvailability(date: string) {
    const availability = getAvailabilityForDate(date, reservedPeriods);
    if (availability) toast.info(availability);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (needsCnhUpload) {
      if (!draft.cnhNumber || !/^\d{11}$/.test(draft.cnhNumber)) {
        toast.error("Informe os 11 numeros da CNH.");
        return;
      }
      if (!draft.cnhExpiresAt) {
        toast.error("Informe a validade da CNH.");
        return;
      }
      if (!draft.cnhPhotoDataUrl) {
        toast.error("Envie uma imagem ou PDF legivel da CNH mostrando a validade.");
        return;
      }
    }
    if (reservationConflict) {
      toast.error(
        `Este veiculo ja esta reservado ${formatReservationPeriod(reservationConflict)}.`,
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (needsCnhUpload) {
        const updatedUser = await authClient.updateCnh({
          cnhNumber: draft.cnhNumber ?? "",
          cnhExpiresAt: draft.cnhExpiresAt ?? "",
          cnhPhotoDataUrl: draft.cnhPhotoDataUrl ?? "",
        });
        const session = getStoredAuthSession();
        if (session) {
          saveAuthSession({ ...session, user: updatedUser });
        }
      }

      await onConfirm(draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel enviar a reserva.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Reserva</DialogTitle>
          <DialogDescription>
            {vehicle.name} - {vehicle.plate}
          </DialogDescription>
        </DialogHeader>

        {!isReservable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Este veiculo nao esta disponivel para reserva.</p>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isAvailable ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Este veiculo esta ocupado agora. Voce pode reservar uma data livre no calendario.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do solicitante" htmlFor="requesterName">
                <Input
                  id="requesterName"
                  value={draft.requesterName}
                  readOnly
                  className="bg-slate-100"
                  required
                />
              </Field>
              <Field label="Departamento" htmlFor="department">
                <Input
                  id="department"
                  value={draft.department}
                  readOnly
                  className="bg-slate-100"
                  required
                />
              </Field>
              <Field label="Data de retirada" htmlFor="pickupDate">
                <ReservationDatePicker
                  id="pickupDate"
                  value={draft.pickupDate}
                  onChange={(value) => updateField("pickupDate", value)}
                  reservedDates={partiallyReservedDates}
                  disabledDates={fullyReservedDates}
                  onReservedDateSelect={notifyPartialAvailability}
                  placeholder="Selecionar retirada"
                  required
                />
              </Field>
              <Field label="Hora de retirada" htmlFor="pickupTime">
                <Input
                  id="pickupTime"
                  type="time"
                  value={draft.pickupTime}
                  onChange={(event) => updateField("pickupTime", event.target.value)}
                  required
                />
              </Field>
              <Field label="Data de devolucao" htmlFor="returnDate">
                <ReservationDatePicker
                  id="returnDate"
                  value={draft.returnDate}
                  onChange={(value) => updateField("returnDate", value)}
                  reservedDates={partiallyReservedDates}
                  disabledDates={fullyReservedDates}
                  onReservedDateSelect={notifyPartialAvailability}
                  placeholder="Selecionar devolucao"
                  required
                />
              </Field>
              <Field label="Hora de retorno" htmlFor="returnTime">
                <Input
                  id="returnTime"
                  type="time"
                  value={draft.returnTime}
                  onChange={(event) => updateField("returnTime", event.target.value)}
                  required
                />
              </Field>
            </div>

            {reservationConflict ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                Este horario ja esta reservado {formatReservationPeriod(reservationConflict)}.
              </p>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Dias em vermelho possuem apenas parte do dia reservada: ao selecionar, os horários
                livres serão informados. Dias em cinza estão ocupados o dia todo e não podem ser
                selecionados.
              </p>
            )}

            {needsCnhUpload ? (
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                    <CreditCard className="h-4 w-4" />
                    CNH com foto
                  </h3>
                  <p className="mt-1 text-sm text-amber-800">
                    Envie uma foto legivel ou PDF da CNH e mostre a validade do documento. Se ela
                    nao estiver aprovada, a reserva segue para analise da Juliana.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Numero da CNH" htmlFor="cnhNumber">
                    <Input
                      id="cnhNumber"
                      inputMode="numeric"
                      pattern="[0-9]{11}"
                      maxLength={11}
                      value={draft.cnhNumber ?? ""}
                      onChange={(event) =>
                        updateField("cnhNumber", event.target.value.replace(/\D/g, ""))
                      }
                      required={needsCnhUpload}
                    />
                  </Field>
                  <Field label="Validade da CNH" htmlFor="cnhExpiresAt">
                    <Input
                      id="cnhExpiresAt"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={draft.cnhExpiresAt ?? ""}
                      onChange={(event) => updateField("cnhExpiresAt", event.target.value)}
                      required={needsCnhUpload}
                    />
                  </Field>
                  <Field label="Arquivo da CNH" htmlFor="cnhPhotoDataUrl">
                    <Input
                      id="cnhPhotoDataUrl"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void cnhFileToDataUrl(file)
                          .then((value) => updateField("cnhPhotoDataUrl", value))
                          .catch((error) =>
                            toast.error(
                              error instanceof Error ? error.message : "Arquivo invalido.",
                            ),
                          );
                      }}
                      required={needsCnhUpload}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">CNH cadastrada</p>
                <p className="mt-1">
                  Sua CNH ja esta salva no perfil e sera usada nesta reserva. Nao e necessario
                  enviar o documento novamente.
                </p>
              </div>
            )}

            <Field label="Motivo" htmlFor="reason">
              <Textarea
                id="reason"
                value={draft.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                required
                className="min-h-28"
              />
            </Field>

            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <DialogFooter className="gap-3 sm:items-center">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <GetStartedButton
                type="submit"
                label={isSubmitting ? "Enviando..." : "Enviar para aprovacao"}
                disabled={isSubmitting || Boolean(reservationConflict)}
                className="bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function findReservationConflict(draft: ReservationDraft, periods: ReservationAvailability[]) {
  if (!draft.pickupDate || !draft.pickupTime || !draft.returnDate || !draft.returnTime) {
    return undefined;
  }

  const pickup = new Date(`${draft.pickupDate}T${draft.pickupTime}:00`);
  const returnDate = new Date(`${draft.returnDate}T${draft.returnTime}:00`);
  if (
    Number.isNaN(pickup.getTime()) ||
    Number.isNaN(returnDate.getTime()) ||
    pickup >= returnDate
  ) {
    return undefined;
  }

  return periods.find((period) => {
    const reservedPickup = new Date(period.pickupDate);
    const reservedReturn = new Date(period.returnDate);
    return pickup < reservedReturn && returnDate > reservedPickup;
  });
}

function formatReservationPeriod(period: ReservationAvailability) {
  const pickup = new Date(period.pickupDate);
  const returnDate = new Date(period.returnDate);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `de ${formatter.format(pickup)} ate ${formatter.format(returnDate)}`;
}

type TimeInterval = { start: Date; end: Date };

function getFullyReservedDates(periods: ReservationAvailability[]) {
  const dates = new Set<string>();
  getReservationDates(periods).forEach((date) => {
    if (isDateFullyReserved(date, periods)) dates.add(date);
  });
  return dates;
}

function getPartiallyReservedDates(periods: ReservationAvailability[]) {
  const dates = new Set<string>();
  getReservationDates(periods).forEach((date) => {
    if (!isDateFullyReserved(date, periods)) dates.add(date);
  });
  return dates;
}

function getReservationDates(periods: ReservationAvailability[]) {
  const dates = new Set<string>();

  periods.forEach((period) => {
    const start = new Date(period.pickupDate);
    const end = new Date(period.returnDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return;

    const current = startOfDay(start);
    const finalDay = startOfDay(end);
    if (end.getTime() === finalDay.getTime()) finalDay.setDate(finalDay.getDate() - 1);
    while (current <= finalDay) {
      dates.add(formatDateValue(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return dates;
}

function isDateFullyReserved(date: string, periods: ReservationAvailability[]) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const intervals = mergeIntervals(getBusyIntervals(dayStart, dayEnd, periods));

  return intervals.length === 1 && intervals[0].start <= dayStart && intervals[0].end >= dayEnd;
}

function getAvailabilityForDate(date: string, periods: ReservationAvailability[]) {
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

  if (freeIntervals.length === 0) return "Este veículo está indisponível durante todo este dia.";
  return `Horários livres em ${formatShortDate(dayStart)}: ${freeIntervals.map(formatInterval).join(" e ")}.`;
}

function getBusyIntervals(dayStart: Date, dayEnd: Date, periods: ReservationAvailability[]) {
  return periods.flatMap((period) => {
    const start = new Date(period.pickupDate);
    const end = new Date(period.returnDate);
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

function mergeIntervals(intervals: TimeInterval[]) {
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

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatDateValue(date: Date) {
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

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
