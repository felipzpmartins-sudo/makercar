import { KeyRound } from "lucide-react";
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
  const [notes, setNotes] = useState("nenhuma observação");

  const reservedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === reservation?.requestedVehicleId),
    [reservation?.requestedVehicleId, vehicles],
  );

  useEffect(() => {
    if (!open || !reservation) return;
    const now = new Date();
    setRequesterName(reservation.requesterName);
    setTookReservedVehicle(true);
    setUsedVehicleId(reservation.requestedVehicleId);
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
    setKmStart(String(reservedVehicle?.km ?? ""));
    setNotes("nenhuma observação");
  }, [open, reservation, reservedVehicle?.km]);

  if (!reservation) return null;
  const currentReservation = reservation;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm({
      reservationId: currentReservation.id,
      requesterName,
      usedVehicleId,
      tookReservedVehicle,
      date,
      time,
      kmStart: Number(kmStart),
      notes: notes.trim(),
    });
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
                onChange={(event) => setUsedVehicleId(event.target.value)}
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
                min="0"
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
              required
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              <KeyRound className="h-4 w-4" />
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
