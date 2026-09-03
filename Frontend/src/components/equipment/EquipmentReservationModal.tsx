import { AlertCircle, FileText, Loader2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ReservationDatePicker } from "@/components/ReservationDatePicker";
import { EquipmentTermsDialog } from "@/components/equipment/EquipmentTermsDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  isEquipmentReservable,
  type Equipment,
  type EquipmentAvailability,
  type EquipmentReservationDraft,
  type EquipmentTerms,
} from "@/data/equipment";
import type { AuthUser } from "@/services/authClient";
import {
  describeFreeIntervals,
  findPeriodConflict,
  formatBusyPeriod,
  getFullyReservedDates,
  getPartiallyReservedDates,
  type BusyPeriod,
} from "@/utils/availability";

interface EquipmentReservationModalProps {
  open: boolean;
  equipment: Equipment;
  currentUser: AuthUser;
  /** Janelas ja ocupadas deste equipamento — pendentes e aprovadas. */
  reservedPeriods: EquipmentAvailability[];
  terms?: EquipmentTerms | null;
  isLoadingTerms?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: EquipmentReservationDraft) => Promise<boolean>;
}

function buildEmptyDraft(equipmentId: string, termsVersion: string): EquipmentReservationDraft {
  return {
    equipmentId,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    operatorName: "",
    purpose: "",
    usageLocation: "",
    notes: "",
    termsAccepted: false,
    termsVersion,
  };
}

/*
 * Formulario de solicitacao.
 *
 * Duas decisoes valem registro:
 *
 * 1. O conflito e verificado enquanto a pessoa preenche, nao so no envio. O
 *    backend recusa de qualquer forma, mas descobrir o choque depois de
 *    escrever a finalidade inteira e frustrante.
 * 2. O aceite do termo trava o envio no cliente E e revalidado no servidor com
 *    a versao do texto. O checkbox aqui e conveniencia; a garantia esta la.
 */
export function EquipmentReservationModal({
  open,
  equipment,
  currentUser,
  reservedPeriods,
  terms,
  isLoadingTerms = false,
  onOpenChange,
  onConfirm,
}: EquipmentReservationModalProps) {
  const termsVersion = terms?.version ?? "";
  const [draft, setDraft] = useState<EquipmentReservationDraft>(() =>
    buildEmptyDraft(equipment.id, termsVersion),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const canReserve = isEquipmentReservable(equipment);
  // Reservar para ontem nao faz sentido; o dia de hoje continua livre, e os
  // campos de hora cuidam do resto.
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const busyPeriods = useMemo<BusyPeriod[]>(
    () =>
      reservedPeriods.map((period) => ({
        startDate: period.startDate,
        endDate: period.endDate,
      })),
    [reservedPeriods],
  );
  const fullyReservedDates = useMemo(() => getFullyReservedDates(busyPeriods), [busyPeriods]);
  const partiallyReservedDates = useMemo(
    () => getPartiallyReservedDates(busyPeriods),
    [busyPeriods],
  );
  const conflict = findPeriodConflict(draft, busyPeriods);

  useEffect(() => {
    if (!open) return;
    setSubmitError("");
    setDraft(buildEmptyDraft(equipment.id, termsVersion));
  }, [open, equipment.id, termsVersion]);

  function updateField<TField extends keyof EquipmentReservationDraft>(
    field: TField,
    value: EquipmentReservationDraft[TField],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function notifyPartialAvailability(date: string) {
    const message = describeFreeIntervals(date, busyPeriods);
    if (message) toast.info(message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.startDate || !draft.startTime || !draft.endDate || !draft.endTime) {
      toast.error("Informe as datas e os horários de início e término.");
      return;
    }
    if (
      new Date(`${draft.endDate}T${draft.endTime}`) <=
      new Date(`${draft.startDate}T${draft.startTime}`)
    ) {
      toast.error("O término deve ser posterior ao início.");
      return;
    }
    if (conflict) {
      toast.error(`Este equipamento já está reservado ${formatBusyPeriod(conflict)}.`);
      return;
    }
    if (!draft.termsAccepted || !termsVersion) {
      toast.error("É necessário aceitar o Termo de Responsabilidade.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const success = await onConfirm({ ...draft, termsVersion });
      if (!success)
        setSubmitError("A solicitação não foi enviada. Revise os dados e tente novamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível enviar a solicitação.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reservar equipamento</DialogTitle>
            <DialogDescription>
              {equipment.name} · {equipment.category.name}
            </DialogDescription>
          </DialogHeader>

          {!canReserve ? (
            <div className="rounded-lg border border-warning/25 bg-warning-subtle p-4 text-sm text-warning-subtle-foreground">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p>
                  Este equipamento está {equipment.effectiveStatus.toLowerCase()} e não aceita novas
                  solicitações no momento.
                </p>
              </div>
              <DialogFooter className="mt-5">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Equipamento e responsável vêm da tela e da sessão: são exibidos
                  para conferência, não para digitação. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Equipamento" htmlFor="equipmentName">
                  <Input id="equipmentName" value={equipment.name} readOnly className="bg-muted" />
                </Field>
                <Field label="Responsável pela solicitação" htmlFor="requesterName">
                  <Input
                    id="requesterName"
                    value={`${currentUser.name} · ${currentUser.department.name}`}
                    readOnly
                    className="bg-muted"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data de início" htmlFor="startDate">
                  <ReservationDatePicker
                    id="startDate"
                    value={draft.startDate}
                    onChange={(value) => updateField("startDate", value)}
                    reservedDates={partiallyReservedDates}
                    disabledDates={fullyReservedDates}
                    onReservedDateSelect={notifyPartialAvailability}
                    placeholder="Selecionar início"
                    caption="Reserva do equipamento"
                    minDate={today}
                    required
                  />
                </Field>
                <Field label="Horário inicial" htmlFor="startTime">
                  <Input
                    id="startTime"
                    type="time"
                    value={draft.startTime}
                    onChange={(event) => updateField("startTime", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Data de término" htmlFor="endDate">
                  <ReservationDatePicker
                    id="endDate"
                    value={draft.endDate}
                    onChange={(value) => updateField("endDate", value)}
                    reservedDates={partiallyReservedDates}
                    disabledDates={fullyReservedDates}
                    onReservedDateSelect={notifyPartialAvailability}
                    placeholder="Selecionar término"
                    caption="Reserva do equipamento"
                    minDate={draft.startDate || today}
                    required
                  />
                </Field>
                <Field label="Horário final" htmlFor="endTime">
                  <Input
                    id="endTime"
                    type="time"
                    value={draft.endTime}
                    onChange={(event) => updateField("endTime", event.target.value)}
                    required
                  />
                </Field>
              </div>

              {conflict ? (
                <p className="rounded-lg border border-danger/25 bg-danger-subtle px-3 py-2 text-xs font-medium text-danger-subtle-foreground">
                  Este período já está reservado {formatBusyPeriod(conflict)}. Escolha outro horário
                  para continuar.
                </p>
              ) : (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Dias em vermelho têm parte do dia reservada — ao selecionar, os horários livres
                  são informados. Dias em cinza estão ocupados o dia todo.
                </p>
              )}

              <Field label="Quem utilizará o equipamento" htmlFor="operatorName">
                <Input
                  id="operatorName"
                  value={draft.operatorName}
                  onChange={(event) => updateField("operatorName", event.target.value)}
                  placeholder="Nome da pessoa ou equipe que vai operar"
                  minLength={3}
                  required
                />
              </Field>

              <Field label="Local da utilização" htmlFor="usageLocation">
                <Input
                  id="usageLocation"
                  value={draft.usageLocation}
                  onChange={(event) => updateField("usageLocation", event.target.value)}
                  placeholder="Onde o equipamento será usado"
                  minLength={2}
                  required
                />
              </Field>

              <Field label="Finalidade" htmlFor="purpose">
                <Textarea
                  id="purpose"
                  value={draft.purpose}
                  onChange={(event) => updateField("purpose", event.target.value)}
                  placeholder="Para que o equipamento será utilizado"
                  minLength={5}
                  required
                  className="min-h-24"
                />
              </Field>

              <Field label="Observações (opcional)" htmlFor="notes">
                <Textarea
                  id="notes"
                  value={draft.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Informações adicionais para quem vai aprovar"
                  className="min-h-20"
                />
              </Field>

              {/* Termo de responsabilidade */}
              <div className="rounded-xl border border-warning/25 bg-warning-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-warning-subtle-foreground">
                      <FileText className="h-4 w-4 shrink-0" aria-hidden />
                      Termo de Responsabilidade
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-warning-subtle-foreground">
                      A solicitação só pode ser enviada após a leitura e o aceite do termo de uso
                      dos equipamentos internos.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setIsTermsOpen(true)}
                  >
                    Ler termo
                  </Button>
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg bg-card/60 p-3">
                  <Checkbox
                    id="termsAccepted"
                    checked={draft.termsAccepted}
                    onCheckedChange={(checked) => updateField("termsAccepted", checked === true)}
                    disabled={!termsVersion}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-6 text-foreground">
                    Li e concordo com o Termo de Responsabilidade
                    {termsVersion ? (
                      <span className="text-muted-foreground"> (versão {termsVersion})</span>
                    ) : null}
                    .
                  </span>
                </label>

                {isLoadingTerms ? (
                  <p className="mt-2 flex items-center gap-2 text-xs text-warning-subtle-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Carregando o texto do termo...
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <div className="rounded-lg border border-danger/25 bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
                  {submitError}
                </div>
              ) : null}

              <DialogFooter className="gap-3 sm:items-center">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || Boolean(conflict) || !draft.termsAccepted || !termsVersion
                  }
                  className="shadow-sm hover:bg-primary"
                >
                  {isSubmitting ? "Enviando..." : "Enviar solicitação"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <EquipmentTermsDialog
        open={isTermsOpen}
        terms={terms}
        isLoading={isLoadingTerms}
        onOpenChange={setIsTermsOpen}
        onAccept={() => updateField("termsAccepted", true)}
      />
    </>
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
