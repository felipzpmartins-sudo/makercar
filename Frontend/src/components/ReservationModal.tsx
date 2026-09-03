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
import {
  describeFreeIntervals,
  findPeriodConflict,
  formatBusyPeriod,
  getFullyReservedDates,
  getPartiallyReservedDates,
  type BusyPeriod,
} from "@/utils/availability";
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
  // O utilitario de disponibilidade e generico: fala em inicio e fim, nao em
  // retirada e devolucao.
  const busyPeriods = useMemo<BusyPeriod[]>(
    () =>
      reservedPeriods.map((period) => ({
        startDate: period.pickupDate,
        endDate: period.returnDate,
      })),
    [reservedPeriods],
  );
  const reservationConflict = findPeriodConflict(
    {
      startDate: draft.pickupDate,
      startTime: draft.pickupTime,
      endDate: draft.returnDate,
      endTime: draft.returnTime,
    },
    busyPeriods,
  );
  const fullyReservedDates = useMemo(() => getFullyReservedDates(busyPeriods), [busyPeriods]);
  const partiallyReservedDates = useMemo(
    () => getPartiallyReservedDates(busyPeriods),
    [busyPeriods],
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
    const availability = describeFreeIntervals(date, busyPeriods);
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
      toast.error(`Este veiculo ja esta reservado ${formatBusyPeriod(reservationConflict)}.`);
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
          <div className="rounded-lg border border-warning/25 bg-warning-subtle p-4 text-sm text-warning-subtle-foreground">
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
              <div className="rounded-lg border border-primary/25 bg-primary-subtle p-3 text-sm text-primary-subtle-foreground">
                Este veiculo esta ocupado agora. Voce pode reservar uma data livre no calendario.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do solicitante" htmlFor="requesterName">
                <Input
                  id="requesterName"
                  value={draft.requesterName}
                  readOnly
                  className="bg-muted"
                  required
                />
              </Field>
              <Field label="Departamento" htmlFor="department">
                <Input
                  id="department"
                  value={draft.department}
                  readOnly
                  className="bg-muted"
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
              <p className="rounded-lg border border-danger/25 bg-danger-subtle px-3 py-2 text-xs font-medium text-danger-subtle-foreground">
                Este horario ja esta reservado {formatBusyPeriod(reservationConflict)}.
              </p>
            ) : (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                Dias em vermelho possuem apenas parte do dia reservada: ao selecionar, os horários
                livres serão informados. Dias em cinza estão ocupados o dia todo e não podem ser
                selecionados.
              </p>
            )}

            {vehicle.supportOnly ? (
              <div className="rounded-lg border border-primary/25 bg-primary-subtle p-4">
                <p className="text-sm font-semibold text-primary-subtle-foreground">
                  Veículo de uso exclusivo do suporte
                </p>
                <p className="mt-1 text-sm text-primary-subtle-foreground">
                  Informe a senha compartilhada do suporte para continuar com esta reserva.
                </p>
                <div className="mt-3">
                  <Field label="Senha de acesso do suporte" htmlFor="supportAccessPassword">
                    {/*
                      Este campo NAO e a senha de login do usuario, e sim a senha
                      compartilhada do suporte. O Chrome ignora autoComplete="off"
                      em campos de senha e preenchia aqui a credencial salva do
                      site — o usuario via bolinhas e achava que o app tinha
                      sugerido a senha. "new-password" desliga esse preenchimento;
                      os data-* fazem o mesmo com 1Password, LastPass e Bitwarden.
                    */}
                    <Input
                      id="supportAccessPassword"
                      type="password"
                      value={draft.supportAccessPassword ?? ""}
                      onChange={(event) => updateField("supportAccessPassword", event.target.value)}
                      required
                      autoComplete="new-password"
                      data-1p-ignore
                      data-bwignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {needsCnhUpload ? (
              <div className="space-y-4 rounded-lg border border-warning/25 bg-warning-subtle p-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-warning-subtle-foreground">
                    <CreditCard className="h-4 w-4" />
                    CNH com foto
                  </h3>
                  <p className="mt-1 text-sm text-warning-subtle-foreground">
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
              <div className="rounded-lg border border-success/25 bg-success-subtle p-4 text-sm text-success-subtle-foreground">
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
              <div className="rounded-lg border border-danger/25 bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
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
                className="shadow-sm hover:bg-primary"
              />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
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
