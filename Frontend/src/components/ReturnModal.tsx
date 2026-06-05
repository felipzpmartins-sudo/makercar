import { RotateCcw } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

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
import type { Reservation, ReturnDraft } from "@/data/vehicles";

interface ReturnModalProps {
  open: boolean;
  reservation?: Reservation;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: ReturnDraft) => void;
}

export function ReturnModal({ open, reservation, onOpenChange, onConfirm }: ReturnModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [kmEnd, setKmEnd] = useState("");
  const [notes, setNotes] = useState("sem observações");

  useEffect(() => {
    if (!open || !reservation) return;
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
    setKmEnd(String(reservation.pickup?.kmStart ?? ""));
    setNotes("sem observações");
  }, [open, reservation]);

  if (!reservation) return null;
  const currentReservation = reservation;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm({
      reservationId: currentReservation.id,
      date,
      time,
      kmEnd: Number(kmEnd),
      notes: notes.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar devolução</DialogTitle>
          <DialogDescription>
            {currentReservation.vehicleName} - KM inicial {currentReservation.pickup?.kmStart ?? "-"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
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
            <Field label="KM final" htmlFor="kmEnd">
              <Input
                id="kmEnd"
                type="number"
                min="0"
                value={kmEnd}
                onChange={(event) => setKmEnd(event.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Observações da devolução" htmlFor="returnNotes">
            <Textarea
              id="returnNotes"
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
              <RotateCcw className="h-4 w-4" />
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
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
