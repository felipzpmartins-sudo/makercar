import { Camera, KeyRound, Loader2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
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
import type { PickupDraft, Reservation, Vehicle } from "@/data/vehicles";
import { buildPhotoChecklistDataUrl, imageFileToDataUrl } from "@/utils/imageUpload";

interface PickupModalProps {
  open: boolean;
  reservation?: Reservation;
  vehicles: Vehicle[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: PickupDraft) => void;
}

type ChecklistKey =
  | "spareTire"
  | "wheelWrench"
  | "jack"
  | "triangle"
  | "cleanNoDamage"
  | "documents"
  | "tires"
  | "lights"
  | "noPanelWarnings";

type PhotoKey = "front" | "rear" | "sides" | "panel";

const checklistItems: Array<{ key: ChecklistKey; label: string }> = [
  { key: "spareTire", label: "Estepe presente e em boas condicoes" },
  { key: "wheelWrench", label: "Chave de roda presente" },
  { key: "jack", label: "Macaco presente" },
  { key: "triangle", label: "Triangulo presente" },
  { key: "cleanNoDamage", label: "Veiculo limpo e sem avarias aparentes" },
  { key: "documents", label: "Documentacao do veiculo presente" },
  { key: "tires", label: "Pneus em boas condicoes" },
  { key: "lights", label: "Farois e lanternas funcionando" },
  { key: "noPanelWarnings", label: "Nao ha luzes de alerta acesas no painel" },
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

export function PickupModal({
  open,
  reservation,
  vehicles,
  onOpenChange,
  onConfirm,
}: PickupModalProps) {
  const [requesterName, setRequesterName] = useState("");
  const [tookReservedVehicle, setTookReservedVehicle] = useState(true);
  const [usedVehicleId, setUsedVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [damages, setDamages] = useState("");
  const [checklist, setChecklist] = useState(createChecklistState);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState(createPhotoState);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  const reservedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === reservation?.requestedVehicleId),
    [reservation?.requestedVehicleId, vehicles],
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === usedVehicleId),
    [usedVehicleId, vehicles],
  );

  const hasRequiredPhotos = photoItems
    .filter((item) => item.required)
    .every((item) => Boolean(photos[item.key]));

  useEffect(() => {
    if (!open || !reservation) return;
    const now = new Date();
    setRequesterName(reservation.requesterName);
    setTookReservedVehicle(true);
    setUsedVehicleId(reservation.requestedVehicleId);
    setDate(formatLocalDate(now));
    setTime(formatLocalTime(now));
    setKmStart(String(reservedVehicle?.km ?? ""));
    setFuelLevel("");
    setVehicleCondition("");
    setDamages("");
    setChecklist(createChecklistState());
    setNotes("");
    setPhotos(createPhotoState());
  }, [open, reservation, reservedVehicle?.km]);

  if (!reservation) return null;
  const currentReservation = reservation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasRequiredPhotos || isPreparingPhoto) return;
    if (!fuelLevel) {
      toast.error("Informe o nivel de combustivel na retirada.");
      return;
    }

    const photoDataUrl = await buildPhotoChecklistDataUrl(
      photoItems
        .filter((item) => photos[item.key])
        .map((item) => ({ label: item.label, dataUrl: photos[item.key] })),
    );

    onConfirm({
      reservationId: currentReservation.id,
      requesterName,
      usedVehicleId,
      tookReservedVehicle,
      date,
      time,
      kmStart: Number(kmStart),
      fuelLevel,
      vehicleCondition,
      damages,
      notes: buildChecklistNotes({
        title: "Checklist de retirada",
        rows: [
          ["Nivel de combustivel conferido", fuelLevel],
          ["Estado geral do veiculo", vehicleCondition],
          ...checklistItems.map(
            (item) => [item.label, checklist[item.key] ? "Sim" : "Nao"] as [string, string],
          ),
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
          <DialogTitle>Registrar retirada</DialogTitle>
          <DialogDescription>
            {currentReservation.vehicleName} - {currentReservation.plate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do solicitante" htmlFor="pickupRequester">
              <Input
                id="pickupRequester"
                value={requesterName}
                onChange={(event) => setRequesterName(event.target.value)}
                required
              />
            </Field>
            <Field label="Veiculo reservado" htmlFor="reservedVehicle">
              <Input
                id="reservedVehicle"
                value={reservedVehicle?.plate ?? currentReservation.plate}
                readOnly
              />
            </Field>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Retirou o veiculo reservado?</p>
            <div className="mt-3 flex gap-3">
              <Button
                type="button"
                variant={tookReservedVehicle ? "default" : "outline"}
                onClick={() => {
                  setTookReservedVehicle(true);
                  setUsedVehicleId(currentReservation.requestedVehicleId);
                  setKmStart(String(reservedVehicle?.km ?? ""));
                }}
                className={tookReservedVehicle ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
              >
                Sim
              </Button>
              <Button
                type="button"
                variant={!tookReservedVehicle ? "default" : "outline"}
                onClick={() => setTookReservedVehicle(false)}
              >
                Nao
              </Button>
            </div>
          </div>

          {!tookReservedVehicle ? (
            <Field label="Veiculo realmente retirado" htmlFor="usedVehicleId">
              <select
                id="usedVehicleId"
                value={usedVehicleId}
                onChange={(event) => {
                  const nextVehicleId = event.target.value;
                  const nextVehicle = vehicles.find((vehicle) => vehicle.id === nextVehicleId);
                  setUsedVehicleId(nextVehicleId);
                  setKmStart(String(nextVehicle?.km ?? ""));
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Data da retirada" htmlFor="pickupDateActual">
              <Input
                id="pickupDateActual"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Hora da retirada" htmlFor="pickupTimeActual">
              <Input
                id="pickupTimeActual"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </Field>
            <Field label="KM na retirada" htmlFor="kmStart">
              <Input
                id="kmStart"
                type="number"
                min={selectedVehicle?.km ?? 0}
                value={kmStart}
                onChange={(event) => setKmStart(event.target.value)}
                required
              />
            </Field>
            <Field label="Combustivel" htmlFor="pickupFuel">
              <select
                id="pickupFuel"
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
            <Field label="Estado geral" htmlFor="pickupCondition">
              <select
                id="pickupCondition"
                value={vehicleCondition}
                onChange={(event) => setVehicleCondition(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Selecione</option>
                <option value="Excelente">Excelente</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Ruim">Ruim</option>
              </select>
            </Field>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Checklist do veiculo</h3>
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
            <h3 className="text-sm font-semibold text-slate-800">Fotos da retirada</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {photoItems.map((item) => (
                <PhotoField
                  key={item.key}
                  id={`pickupPhoto-${item.key}`}
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

          <Field label="Observacoes da retirada" htmlFor="pickupNotes">
            <Textarea
              id="pickupNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24"
              placeholder="Banco rasgado, arranhoes, amassados, falta de combustivel, pneu danificado, equipamentos faltando ou luz de alerta acesa."
            />
          </Field>

          <Field label="Avarias existentes" htmlFor="pickupDamages">
            <Textarea
              id="pickupDamages"
              value={damages}
              onChange={(event) => setDamages(event.target.value)}
              className="min-h-24"
              placeholder="Descreva avarias visiveis antes da retirada. Se nao houver, deixe em branco."
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
                <KeyRound className="h-4 w-4" />
              )}
              Confirmar retirada
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
