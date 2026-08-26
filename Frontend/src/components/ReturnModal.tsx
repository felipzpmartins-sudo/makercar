import { RotateCcw } from "lucide-react";
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
import type { Reservation, ReturnDraft } from "@/data/vehicles";

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
  { key: "triangle", label: "Triangulo presente" },
  { key: "documents", label: "Documentacao do veiculo presente" },
  { key: "clean", label: "Veiculo devolvido limpo" },
  { key: "damageDuringUse", label: "Houve avaria durante a utilizacao?" },
  { key: "panelWarnings", label: "Ha luzes de alerta acesas no painel?" },
  { key: "ticketsOrEvents", label: "Multas ou ocorrencias durante o periodo de uso?" },
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
  }, [open, reservation]);

  if (!reservation) return null;
  const currentReservation = reservation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mileage = Number(kmEnd);
    const pickupMileage = currentReservation.pickup?.kmStart;

    if (!kmEnd.trim() || !Number.isInteger(mileage) || mileage < 0) {
      toast.error("Informe o KM final da devolucao.");
      return;
    }
    if (pickupMileage !== undefined && mileage <= pickupMileage) {
      toast.error(`O KM final deve ser maior que o KM inicial (${pickupMileage}).`);
      return;
    }
    if (!fuelLevel) {
      toast.error("Informe o nivel de combustivel na devolucao.");
      return;
    }
    if (lowFuelReturn && !notes.trim()) {
      toast.error("Registre nas observacoes o abastecimento ou o motivo de nao ter abastecido.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Informe nas observacoes se esta tudo certo ou descreva a ocorrencia.");
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
      notes: buildChecklistNotes({
        title: "Checklist de devolucao",
        rows: [
          ["Nivel de combustivel na devolucao", fuelLevel],
          ["Estado geral do veiculo", vehicleCondition],
          ...checklistItems.map(
            (item) => [item.label, checklist[item.key] ? "Sim" : "Nao"] as [string, string],
          ),
          ["Avaria durante a utilizacao", hasDamage ? "Sim" : "Nao"],
          [
            "Regra de combustivel 1/4 ou menos",
            lowFuelReturn
              ? "Necessario abastecer antes da entrega ou registrar impossibilidade nas observacoes"
              : "Nao se aplica",
          ] as [string, string],
        ],
        notes,
      }),
    });
  }

  function toggleChecklist(key: ChecklistKey, checked: boolean) {
    setChecklist((current) => ({ ...current, [key]: checked }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar devolucao</DialogTitle>
          <DialogDescription>
            {currentReservation.vehicleName} - KM inicial{" "}
            {currentReservation.pickup?.kmStart ?? "-"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Data da devolucao" htmlFor="returnDateActual">
              <Input
                id="returnDateActual"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Hora da devolucao" htmlFor="returnTimeActual">
              <Input
                id="returnTimeActual"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </Field>
            <Field label="KM na devolucao" htmlFor="kmEnd">
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
              Caso o veiculo esteja com 1/4 de tanque ou menos, o colaborador deve abastecer antes
              da entrega quando houver posto disponivel e dentro do horario de funcionamento. Se nao
              for possivel, registre a situacao nas observacoes.
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Checklist de devolucao</h3>
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

          <Field label="Observacoes da devolucao" htmlFor="returnNotes">
            <Textarea
              id="returnNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24"
              placeholder="Você pode escrever 'Tudo ok' ou adicionar alguma observação sobre a devolução."
              required
            />
          </Field>

          <Field label="Novas avarias" htmlFor="returnDamages">
            <Textarea
              id="returnDamages"
              value={damages}
              onChange={(event) => setDamages(event.target.value)}
              className="min-h-24"
              placeholder="Registre novas avarias observadas na devolucao. Se nao houver, deixe em branco."
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <RotateCcw className="h-4 w-4" />
              Confirmar devolucao
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
  return `${title}\n${checklistText}\n\nObservacoes:\n${trimmedNotes || "Sem observacoes."}`;
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
