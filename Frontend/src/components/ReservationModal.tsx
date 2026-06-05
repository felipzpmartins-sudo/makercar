import { AlertCircle } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
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
import { GetStartedButton } from "@/components/ui/get-started-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReservationDatePicker } from "@/components/ReservationDatePicker";
import { isVehicleAvailable, type ReservationDraft, type Vehicle } from "@/data/vehicles";
import type { AuthUser } from "@/services/authClient";

const emptyDraft: ReservationDraft = {
  requesterName: "",
  department: "",
  pickupDate: "",
  pickupTime: "",
  returnDate: "",
  returnTime: "18:00",
  reason: "",
};

interface ReservationModalProps {
  open: boolean;
  vehicle: Vehicle;
  currentUser: AuthUser;
  unavailableDates: Set<string>;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: ReservationDraft) => void;
}

export function ReservationModal({
  open,
  vehicle,
  currentUser,
  unavailableDates,
  onOpenChange,
  onConfirm,
}: ReservationModalProps) {
  const [draft, setDraft] = useState<ReservationDraft>(emptyDraft);
  const isAvailable = isVehicleAvailable(vehicle.status);

  useEffect(() => {
    if (open) {
      setDraft({
        ...emptyDraft,
        requesterName: currentUser.name,
        department: currentUser.department.name,
      });
    }
  }, [currentUser.department.name, currentUser.name, open, vehicle.id]);

  function updateField(field: keyof ReservationDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm(draft);
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

        {!isAvailable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Este veículo não está disponível para reserva.</p>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do solicitante" htmlFor="requesterName">
                <Input
                  id="requesterName"
                  value={draft.requesterName}
                  readOnly
                  className="bg-slate-100"
                  required
                />
              </Field>
              <Field label="Departamento" htmlFor="department">
                <Input
                  id="department"
                  value={draft.department}
                  readOnly
                  className="bg-slate-100"
                  required
                />
              </Field>
              <Field label="Data de retirada" htmlFor="pickupDate">
                <ReservationDatePicker
                  id="pickupDate"
                  value={draft.pickupDate}
                  onChange={(value) => updateField("pickupDate", value)}
                  disabledDates={unavailableDates}
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
              <Field label="Data de devolução" htmlFor="returnDate">
                <ReservationDatePicker
                  id="returnDate"
                  value={draft.returnDate}
                  onChange={(value) => updateField("returnDate", value)}
                  disabledDates={unavailableDates}
                  placeholder="Selecionar devolução"
                  required
                />
              </Field>
            </div>

            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Datas riscadas no calendário já possuem reserva para este veículo.
            </p>

            <Field label="Motivo" htmlFor="reason">
              <Textarea
                id="reason"
                value={draft.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                required
                className="min-h-28"
              />
            </Field>

            <DialogFooter className="gap-3 sm:items-center">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <GetStartedButton
                type="submit"
                label="Confirmar Reserva"
                className="bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
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
