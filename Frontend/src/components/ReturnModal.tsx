import { Loader2, RotateCcw } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoPicker } from "@/components/PhotoPicker";
import { UrgentWhatsAppNotice } from "@/components/UrgentWhatsAppNotice";
import type { Reservation, ReturnDraft } from "@/data/vehicles";
import { imageFileToDataUrl } from "@/utils/imageUpload";

interface ReturnModalProps {
  open: boolean;
  reservation?: Reservation;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: ReturnDraft) => void;
}

type ChecklistKey =
  | "spareTire"
  | "wheelWrench"
  | "jack"
  | "triangle"
  | "documents"
  | "clean"
  | "damageDuringUse"
  | "panelWarnings"
  | "ticketsOrEvents";

const checklistItems: Array<{ key: ChecklistKey; label: string }> = [
  { key: "spareTire", label: "Estepe presente" },
  { key: "wheelWrench", label: "Chave de roda presente" },
  { key: "jack", label: "Macaco presente" },
  { key: "triangle", label: "Triângulo presente" },
  { key: "documents", label: "Documentação do veículo presente" },
  { key: "clean", label: "Veículo devolvido limpo" },
  { key: "damageDuringUse", label: "Houve avaria durante a utilização?" },
  { key: "panelWarnings", label: "Há luzes de alerta acesas no painel?" },
  { key: "ticketsOrEvents", label: "Multas ou ocorrências durante o período de uso?" },
];

const fuelLevels = ["Cheio", "3/4", "1/2", "1/4", "Reserva ou vazio"];

function createChecklistState() {
  return checklistItems.reduce(
    (state, item) => ({ ...state, [item.key]: false }),
    {} as Record<ChecklistKey, boolean>,
  );
}

function isFuelQuarterOrLess(fuelLevel: string) {
  return fuelLevel === "1/4" || fuelLevel === "Reserva ou vazio";
}

export function ReturnModal({ open, reservation, onOpenChange, onConfirm }: ReturnModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [kmEnd, setKmEnd] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [damages, setDamages] = useState("");
  const [checklist, setChecklist] = useState(createChecklistState);
  const [notes, setNotes] = useState("");
  const [panelPhoto, setPanelPhoto] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const hasDamage = checklist.damageDuringUse || Boolean(damages.trim());
  const lowFuelReturn = isFuelQuarterOrLess(fuelLevel);

  useEffect(() => {
    if (!open || !reservation) return;
    const now = new Date();
    setDate(formatLocalDate(now));
    setTime(formatLocalTime(now));
    setKmEnd("");
    setFuelLevel("");
    setVehicleCondition("");
    setDamages("");
    setChecklist(createChecklistState());
    setNotes("");
    setPanelPhoto("");
    setIsPreparingPhoto(false);
  }, [open, reservation]);

  if (!reservation) return null;
  const currentReservation = reservation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPreparingPhoto) return;
    const mileage = Number(kmEnd);
    const pickupMileage = currentReservation.pickup?.kmStart;

    if (!kmEnd.trim() || !Number.isInteger(mileage) || mileage < 0) {
      toast.error("Informe o KM final da devolução.");
      return;
    }
    if (pickupMileage !== undefined && mileage <= pickupMileage) {
      toast.error(`O KM final deve ser maior que o KM inicial (${pickupMileage}).`);
      return;
    }
    if (!fuelLevel) {
      toast.error("Informe o nível de combustível na devolução.");
      return;
    }
    if (lowFuelReturn && !notes.trim()) {
      toast.error("Registre nas observações o abastecimento ou o motivo de não ter abastecido.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Informe nas observações se está tudo certo ou descreva a ocorrência.");
      return;
    }

    onConfirm({
      reservationId: currentReservation.id,
      date,
      time,
      kmEnd: mileage,
      fuelLevel,
      vehicleCondition,
      damages,
      hasDamage,
      photoDataUrl: panelPhoto || undefined,
      notes: buildChecklistNotes({
        title: "Checklist de devolução",
        rows: [
          ["Nível de combustível na devolução", fuelLevel],
          ["Estado geral do veículo", vehicleCondition],
          ...checklistItems.map(
            (item) => [item.label, checklist[item.key] ? "Sim" : "Não"] as [string, string],
          ),
          ["Avaria durante a utilização", hasDamage ? "Sim" : "Não"],
          [
            "Regra de combustível 1/4 ou menos",
            lowFuelReturn
              ? "Necessário abastecer antes da entrega ou registrar impossibilidade nas observações"
              : "Não se aplica",
          ] as [string, string],
        ],
        notes,
      }),
    });
  }

  async function handlePhotoChange(file?: File) {
    if (!file) return;
    setIsPreparingPhoto(true);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setPanelPhoto(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar esta foto.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function toggleChecklist(key: ChecklistKey, checked: boolean) {
    setChecklist((current) => ({ ...current, [key]: checked }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar devolução</DialogTitle>
          <DialogDescription>
            {currentReservation.vehicleName} - KM inicial{" "}
            {currentReservation.pickup?.kmStart ?? "-"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Data da devolução" htmlFor="returnDateActual">
              <Input
                id="returnDateActual"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Hora da devolução" htmlFor="returnTimeActual">
              <Input
                id="returnTimeActual"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </Field>
            <Field label="KM na devolução" htmlFor="kmEnd">
              <Input
                id="kmEnd"
                type="number"
                min={(currentReservation.pickup?.kmStart ?? -1) + 1}
                value={kmEnd}
                onChange={(event) => setKmEnd(event.target.value)}
                required
              />
            </Field>
            <Field label="Combustivel" htmlFor="returnFuel">
              <NativeSelect
                id="returnFuel"
                value={fuelLevel}
                onChange={(event) => setFuelLevel(event.target.value)}
                className="w-full"
                required
              >
                <option value="">Selecione</option>
                {fuelLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Estado geral" htmlFor="returnCondition">
              <NativeSelect
                id="returnCondition"
                value={vehicleCondition}
                onChange={(event) => setVehicleCondition(event.target.value)}
                className="w-full"
                required
              >
                <option value="">Selecione</option>
                <option value="Excelente">Excelente</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Ruim">Ruim</option>
              </NativeSelect>
            </Field>
          </div>

          {lowFuelReturn ? (
            <div className="rounded-md border border-warning/25 bg-warning-subtle p-3 text-sm text-warning-subtle-foreground">
              Caso o veículo esteja com 1/4 de tanque ou menos, o colaborador deve abastecer antes
              da entrega quando houver posto disponível e dentro do horário de funcionamento. Se não
              for possível, registre a situação nas observações.
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Foto do painel (opcional)</h3>
            <Field label="Foto do painel mostrando o KM" htmlFor="returnPanelPhoto">
              <PhotoPicker
                id="returnPanelPhoto"
                label="Foto do painel mostrando o KM"
                previewUrl={panelPhoto}
                hint="Foto opcional."
                onChange={(file) => {
                  void handlePhotoChange(file);
                }}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Checklist de devolução</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <label
                  key={item.key}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={checklist[item.key]}
                    onCheckedChange={(checked) => toggleChecklist(item.key, checked === true)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="space-y-3">
            <UrgentWhatsAppNotice />

            <Field label="Observações da devolução" htmlFor="returnNotes">
              <Textarea
                id="returnNotes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24"
                placeholder="Você pode escrever 'Tudo ok' ou adicionar alguma observação sobre a devolução."
                required
              />
            </Field>
          </div>

          <Field label="Novas avarias" htmlFor="returnDamages">
            <Textarea
              id="returnDamages"
              value={damages}
              onChange={(event) => setDamages(event.target.value)}
              className="min-h-24"
              placeholder="Registre novas avarias observadas na devolução. Se não houver, deixe em branco."
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPreparingPhoto}>
              {isPreparingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Confirmar devolução
            </Button>
          </DialogFooter>
        </form>
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

function buildChecklistNotes({
  title,
  rows,
  notes,
}: {
  title: string;
  rows: Array<[string, string]>;
  notes: string;
}) {
  const checklistText = rows.map(([label, value]) => `- ${label}: ${value}`).join("\n");
  const trimmedNotes = notes.trim();
  return `${title}\n${checklistText}\n\nObservações:\n${trimmedNotes || "Sem observações."}`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}
