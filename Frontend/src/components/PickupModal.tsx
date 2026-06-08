import { Camera, KeyRound, Loader2 } from "lucide-react";
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
import type { PickupDraft, Reservation, Vehicle } from "@/data/vehicles";
import { imageFileToDataUrl } from "@/utils/imageUpload";

interface PickupModalProps {
  open: boolean;
  reservation?: Reservation;
  vehicles: Vehicle[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: PickupDraft) => void;
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
  const [notes, setNotes] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  const reservedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === reservation?.requestedVehicleId),
    [reservation?.requestedVehicleId, vehicles],
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === usedVehicleId),
    [usedVehicleId, vehicles],
  );

  useEffect(() => {
    if (!open || !reservation) return;
    const now = new Date();
    setRequesterName(reservation.requesterName);
    setTookReservedVehicle(true);
    setUsedVehicleId(reservation.requestedVehicleId);
    setDate(formatLocalDate(now));
    setTime(formatLocalTime(now));
    setKmStart(String(reservedVehicle?.km ?? ""));
    setNotes("");
    setPhotoDataUrl("");
  }, [open, reservation, reservedVehicle?.km]);

  if (!reservation) return null;
  const currentReservation = reservation;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoDataUrl || isPreparingPhoto) return;
    onConfirm({
      reservationId: currentReservation.id,
      requesterName,
      usedVehicleId,
      tookReservedVehicle,
      date,
      time,
      kmStart: Number(kmStart),
      notes: notes.trim(),
      photoDataUrl,
    });
  }

  async function handlePhotoChange(file?: File) {
    if (!file) return;
    setIsPreparingPhoto(true);
    try {
      setPhotoDataUrl(await imageFileToDataUrl(file));
    } finally {
      setIsPreparingPhoto(false);
    }
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
            <Field label="Veículo reservado" htmlFor="reservedVehicle">
              <Input
                id="reservedVehicle"
                value={reservedVehicle?.plate ?? currentReservation.plate}
                readOnly
              />
            </Field>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Retirou o veículo reservado?</p>
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
                Não
              </Button>
            </div>
          </div>

          {!tookReservedVehicle ? (
            <Field label="Veículo realmente retirado" htmlFor="usedVehicleId">
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

          <div className="grid gap-4 sm:grid-cols-3">
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
            <Field label="KM inicial" htmlFor="kmStart">
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

          <Field label="Observações da retirada" htmlFor="pickupNotes">
            <Textarea
              id="pickupNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24"
            />
          </Field>

          <Field label="Foto da quilometragem no painel" htmlFor="pickupPhoto">
            <Input
              id="pickupPhoto"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                void handlePhotoChange(event.target.files?.[0]);
              }}
              required
            />
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt="Previa da quilometragem de retirada"
                className="mt-3 max-h-56 w-full rounded-md border border-slate-200 object-cover"
              />
            ) : (
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Camera className="h-4 w-4" />
                Tire uma foto nitida do painel mostrando o KM atual.
              </p>
            )}
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={!photoDataUrl || isPreparingPhoto}
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
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
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
