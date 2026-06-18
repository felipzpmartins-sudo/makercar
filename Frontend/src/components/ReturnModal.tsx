import { Camera, Loader2, RotateCcw } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Reservation, ReturnDraft } from "@/data/vehicles";
import { buildPhotoChecklistDataUrl, imageFileToDataUrl } from "@/utils/imageUpload";

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

type PhotoKey = "front" | "rear" | "sides" | "panel";

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

const photoItems: Array<{ key: PhotoKey; label: string; required: boolean }> = [
  { key: "front", label: "Foto da parte frontal do veiculo", required: true },
  { key: "rear", label: "Foto da parte traseira do veiculo", required: true },
  { key: "sides", label: "Foto das laterais do veiculo", required: true },
  { key: "panel", label: "Foto do painel mostrando KM e combustivel", required: false },
];

const fuelLevels = ["Cheio", "3/4", "1/2", "1/4", "Reserva ou vazio"];

function createChecklistState() {
  return checklistItems.reduce(
    (state, item) => ({ ...state, [item.key]: false }),
    {} as Record<ChecklistKey, boolean>,
  );
}

function createPhotoState() {
  return photoItems.reduce(
    (state, item) => ({ ...state, [item.key]: "" }),
    {} as Record<PhotoKey, string>,
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
  const [collaboratorName, setCollaboratorName] = useState("");
  const [digitalAcceptance, setDigitalAcceptance] = useState(false);
  const [checklist, setChecklist] = useState(createChecklistState);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState(createPhotoState);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  const hasRequiredPhotos = photoItems
    .filter((item) => item.required)
    .every((item) => Boolean(photos[item.key]));
  const lowFuelReturn = isFuelQuarterOrLess(fuelLevel);

  useEffect(() => {
    if (!open || !reservation) return;
    const now = new Date();
    setDate(formatLocalDate(now));
    setTime(formatLocalTime(now));
    setKmEnd(String(reservation.pickup?.kmStart ?? ""));
    setFuelLevel("");
    setCollaboratorName(reservation.requesterName);
    setDigitalAcceptance(false);
    setChecklist(createChecklistState());
    setNotes("");
    setPhotos(createPhotoState());
  }, [open, reservation]);

  if (!reservation) return null;
  const currentReservation = reservation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasRequiredPhotos || isPreparingPhoto) return;
    if (!fuelLevel) {
      toast.error("Informe o nivel de combustivel na devolucao.");
      return;
    }
    if (lowFuelReturn && !notes.trim()) {
      toast.error("Registre nas observacoes o abastecimento ou o motivo de nao ter abastecido.");
      return;
    }

    const photoDataUrl = await buildPhotoChecklistDataUrl(
      photoItems
        .filter((item) => photos[item.key])
        .map((item) => ({ label: item.label, dataUrl: photos[item.key] })),
    );

    onConfirm({
      reservationId: currentReservation.id,
      date,
      time,
      kmEnd: Number(kmEnd),
      notes: buildChecklistNotes({
        title: "Checklist de devolucao",
        rows: [
          ["Nivel de combustivel na devolucao", fuelLevel],
          ["Nome do colaborador", collaboratorName || "Nao informado"],
          ["Aceite digital", digitalAcceptance ? "Sim" : "Nao"],
          ...checklistItems.map(
            (item) => [item.label, checklist[item.key] ? "Sim" : "Nao"] as [string, string],
          ),
          [
            "Regra de combustivel 1/4 ou menos",
            lowFuelReturn
              ? "Necessario abastecer antes da entrega ou registrar impossibilidade nas observacoes"
              : "Nao se aplica",
          ] as [string, string],
        ],
        notes,
      }),
      photoDataUrl,
    });
  }

  async function handlePhotoChange(key: PhotoKey, file?: File) {
    if (!file) return;
    setIsPreparingPhoto(true);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setPhotos((current) => ({ ...current, [key]: dataUrl }));
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
          <DialogTitle>Registrar devolucao</DialogTitle>
          <DialogDescription>
            {currentReservation.vehicleName} - KM inicial {currentReservation.pickup?.kmStart ?? "-"}
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
                min={currentReservation.pickup?.kmStart ?? 0}
                value={kmEnd}
                onChange={(event) => setKmEnd(event.target.value)}
                required
              />
            </Field>
            <Field label="Combustivel" htmlFor="returnFuel">
              <select
                id="returnFuel"
                value={fuelLevel}
                onChange={(event) => setFuelLevel(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Selecione</option>
                {fuelLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {lowFuelReturn ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Caso o veiculo esteja com 1/4 de tanque ou menos, o colaborador deve abastecer antes
              da entrega quando houver posto disponivel e dentro do horario de funcionamento. Se nao
              for possivel, registre a situacao nas observacoes.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do colaborador" htmlFor="returnCollaborator">
              <Input
                id="returnCollaborator"
                value={collaboratorName}
                onChange={(event) => setCollaboratorName(event.target.value)}
              />
            </Field>
            <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 sm:mt-8">
              <Checkbox
                checked={digitalAcceptance}
                onCheckedChange={(checked) => setDigitalAcceptance(checked === true)}
              />
              <span>Assinatura ou aceite digital</span>
            </label>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Checklist de devolucao</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <label
                  key={item.key}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
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

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Fotos da devolucao</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {photoItems.map((item) => (
                <PhotoField
                  key={item.key}
                  id={`returnPhoto-${item.key}`}
                  label={item.label}
                  required={item.required}
                  previewUrl={photos[item.key]}
                  onChange={(file) => {
                    void handlePhotoChange(item.key, file);
                  }}
                />
              ))}
            </div>
          </section>

          <Field label="Observacoes da devolucao" htmlFor="returnNotes">
            <Textarea
              id="returnNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24"
              placeholder="Novos riscos, amassados, itens faltando, problemas mecanicos, combustivel abaixo do nivel de retirada, pneu danificado, manutencao necessaria ou outras ocorrencias."
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={!hasRequiredPhotos || isPreparingPhoto}
            >
              {isPreparingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
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

function PhotoField({
  id,
  label,
  required,
  previewUrl,
  onChange,
}: {
  id: string;
  label: string;
  required: boolean;
  previewUrl: string;
  onChange: (file?: File) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => onChange(event.target.files?.[0])}
        required={required}
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`Previa - ${label}`}
          className="mt-3 h-32 w-full rounded-md border border-slate-200 object-cover"
        />
      ) : (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Camera className="h-4 w-4" />
          {required ? "Foto obrigatoria." : "Foto opcional."}
        </p>
      )}
    </Field>
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
