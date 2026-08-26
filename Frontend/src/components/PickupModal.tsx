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
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PickupDraft, Reservation, Vehicle } from "@/data/vehicles";
import { buildPhotoChecklistDataUrl, imageFileToDataUrl } from "@/utils/imageUpload";

interface PickupModalProps {
  open: boolean;
  reservation?: Reservation;
  vehicles: Vehicle[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: PickupDraft) => Promise<boolean> | boolean | void;
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

type PhotoKey = "panel";

type PickupDraftSnapshot = {
  requesterName: string;
  tookReservedVehicle: boolean;
  usedVehicleId: string;
  date: string;
  time: string;
  kmStart: string;
  fuelLevel: string;
  vehicleCondition: string;
  damages: string;
  checklist: Record<ChecklistKey, boolean>;
  notes: string;
  photos: Record<PhotoKey, string>;
};

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
  { key: "panel", label: "Foto do painel mostrando o KM", required: true },
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
  const [destination, setDestination] = useState("");
  const [photos, setPhotos] = useState(createPhotoState);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);

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
    if (!open || !reservation) {
      setIsDraftReady(false);
      return;
    }

    setIsDraftReady(false);
    const savedDraft = readPickupDraft(reservation.id);
    if (savedDraft) {
      setRequesterName(savedDraft.requesterName);
      setTookReservedVehicle(savedDraft.tookReservedVehicle);
      setUsedVehicleId(savedDraft.usedVehicleId);
      setDate(savedDraft.date);
      setTime(savedDraft.time);
      setKmStart(savedDraft.kmStart);
      setFuelLevel(savedDraft.fuelLevel);
      setVehicleCondition(savedDraft.vehicleCondition);
      setDamages(savedDraft.damages);
      setChecklist(savedDraft.checklist);
      setNotes(savedDraft.notes);
      setPhotos(savedDraft.photos);
      setIsDraftReady(true);
      toast.info("Checklist de retirada restaurado.");
      return;
    }

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
    setDestination("");
    setPhotos(createPhotoState());
    setIsDraftReady(true);
  }, [open, reservation, reservedVehicle?.km]);

  useEffect(() => {
    if (!open || !reservation || !isDraftReady) return;

    savePickupDraft(reservation.id, {
      requesterName,
      tookReservedVehicle,
      usedVehicleId,
      date,
      time,
      kmStart,
      fuelLevel,
      vehicleCondition,
      damages,
      checklist,
      notes,
      photos,
    });
  }, [
    checklist,
    damages,
    date,
    fuelLevel,
    isDraftReady,
    kmStart,
    notes,
    open,
    photos,
    requesterName,
    reservation,
    time,
    tookReservedVehicle,
    usedVehicleId,
    vehicleCondition,
  ]);

  if (!reservation) return null;
  const currentReservation = reservation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasRequiredPhotos || isPreparingPhoto) return;
    if (!destination.trim()) {
      toast.error("Informe para onde o veiculo sera utilizado.");
      return;
    }

    const photoDataUrl = photos.panel;

    const success = await onConfirm({
      reservationId: currentReservation.id,
      requesterName,
      usedVehicleId,
      tookReservedVehicle,
      date,
      time,
      kmStart: Number(kmStart),
      fuelLevel: "",
      vehicleCondition: "",
      damages: "",
      notes: `Destino: ${destination.trim()}\n\nObservacoes: ${notes.trim() || "Sem observacoes."}`,
      photoDataUrl,
    });
    if (success !== false) {
      clearPickupDraft(currentReservation.id);
    }
  }

  async function handlePhotoChange(key: PhotoKey, file?: File) {
    if (!file) return;
    setIsPreparingPhoto(true);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setPhotos((current) => ({ ...current, [key]: dataUrl }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel preparar esta foto.");
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
              <Input id="pickupRequester" value={requesterName} readOnly className="bg-muted" />
            </Field>
            <Field label="Veiculo reservado" htmlFor="reservedVehicle">
              <Input
                id="reservedVehicle"
                value={reservedVehicle?.plate ?? currentReservation.plate}
                readOnly
              />
            </Field>
          </div>

          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm font-medium text-foreground">Retirou o veiculo reservado?</p>
            <div className="mt-3 flex gap-3">
              <Button
                type="button"
                variant={tookReservedVehicle ? "default" : "outline"}
                onClick={() => {
                  setTookReservedVehicle(true);
                  setUsedVehicleId(currentReservation.requestedVehicleId);
                  setKmStart(String(reservedVehicle?.km ?? ""));
                }}
                className={tookReservedVehicle ? " " : ""}
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
              <NativeSelect
                id="usedVehicleId"
                value={usedVehicleId}
                onChange={(event) => {
                  const nextVehicleId = event.target.value;
                  const nextVehicle = vehicles.find((vehicle) => vehicle.id === nextVehicleId);
                  setUsedVehicleId(nextVehicleId);
                  setKmStart(String(nextVehicle?.km ?? ""));
                }}
                className="w-full"
                required
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : null}

          <div>
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
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Foto obrigatoria</h3>
            <div className="grid gap-4">
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

          <Field label="Local de destino" htmlFor="pickupDestination">
            <Input
              id="pickupDestination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Ex.: cliente, filial ou endereco"
              required
            />
          </Field>

          <Field label="Observacoes (opcional)" htmlFor="pickupNotes">
            <Textarea
              id="pickupNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24"
              placeholder="Registre algum problema ou outra observacao sobre o veiculo."
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearPickupDraft(currentReservation.id);
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!hasRequiredPhotos || isPreparingPhoto}>
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
          className="mt-3 h-32 w-full rounded-md border border-border object-cover"
        />
      ) : (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
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

function pickupDraftStorageKey(reservationId: string) {
  return `makercar:pickup-draft:${reservationId}`;
}

function readPickupDraft(reservationId: string): PickupDraftSnapshot | undefined {
  try {
    const rawDraft = window.localStorage.getItem(pickupDraftStorageKey(reservationId));
    if (!rawDraft) return undefined;
    return JSON.parse(rawDraft) as PickupDraftSnapshot;
  } catch {
    return undefined;
  }
}

function savePickupDraft(reservationId: string, draft: PickupDraftSnapshot) {
  try {
    window.localStorage.setItem(pickupDraftStorageKey(reservationId), JSON.stringify(draft));
  } catch {
    // O checklist continua utilizavel mesmo se o armazenamento local estiver cheio ou bloqueado.
  }
}

function clearPickupDraft(reservationId: string) {
  try {
    window.localStorage.removeItem(pickupDraftStorageKey(reservationId));
  } catch {
    // Nada a fazer se o navegador bloquear o armazenamento local.
  }
}
