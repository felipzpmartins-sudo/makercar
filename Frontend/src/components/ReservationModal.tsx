import { AlertCircle, CreditCard } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import {
  isVehicleAvailable,
  isVehicleReservable,
  type ReservationDraft,
  type Vehicle,
} from "@/data/vehicles";
import { authClient, type AuthUser } from "@/services/authClient";
import { getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";
import { imageFileToDataUrl } from "@/utils/imageUpload";

const emptyDraft: ReservationDraft = {
  requesterName: "",
  department: "",
  pickupDate: "",
  pickupTime: "",
  returnDate: "",
  returnTime: "18:00",
  reason: "",
  cnhNumber: "",
  cnhExpiresAt: "",
  cnhPhotoDataUrl: "",
};

interface ReservationModalProps {
  open: boolean;
  vehicle: Vehicle;
  currentUser: AuthUser;
  unavailableDates: Set<string>;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: ReservationDraft) => void | Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isAvailable = isVehicleAvailable(vehicle.status);
  const isReservable = isVehicleReservable(vehicle.status);
  const needsCnhUpload =
    !currentUser.cnhNumber ||
    !currentUser.cnhExpiresAt ||
    new Date(currentUser.cnhExpiresAt).getTime() < Date.now() ||
    currentUser.cnhStatus === "REJECTED";

  useEffect(() => {
    if (open) {
      setSubmitError("");
      setDraft({
        ...emptyDraft,
        requesterName: currentUser.name,
        department: currentUser.department.name,
        cnhNumber: currentUser.cnhNumber ?? "",
        cnhExpiresAt: currentUser.cnhExpiresAt?.slice(0, 10) ?? "",
      });
    }
  }, [currentUser.cnhExpiresAt, currentUser.cnhNumber, currentUser.department.name, currentUser.name, open, vehicle.id]);

  function updateField(field: keyof ReservationDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (needsCnhUpload) {
      if (!draft.cnhNumber || !/^\d{11}$/.test(draft.cnhNumber)) {
        toast.error("Informe os 11 numeros da CNH.");
        return;
      }
      if (!draft.cnhExpiresAt) {
        toast.error("Informe a validade da CNH.");
        return;
      }
      if (!draft.cnhPhotoDataUrl) {
        toast.error("Envie uma foto legivel da CNH mostrando a validade.");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (needsCnhUpload) {
        const updatedUser = await authClient.updateCnh({
          cnhNumber: draft.cnhNumber ?? "",
          cnhExpiresAt: draft.cnhExpiresAt ?? "",
          cnhPhotoDataUrl: draft.cnhPhotoDataUrl ?? "",
        });
        const session = getStoredAuthSession();
        if (session) {
          saveAuthSession({ ...session, user: updatedUser });
        }
      }

      await onConfirm(draft);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel enviar a reserva.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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

        {!isReservable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Este veiculo nao esta disponivel para reserva.</p>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isAvailable ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Este veiculo esta ocupado agora. Voce pode reservar uma data livre no calendario.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do solicitante" htmlFor="requesterName">
                <Input id="requesterName" value={draft.requesterName} readOnly className="bg-slate-100" required />
              </Field>
              <Field label="Departamento" htmlFor="department">
                <Input id="department" value={draft.department} readOnly className="bg-slate-100" required />
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
              <Field label="Data de devolucao" htmlFor="returnDate">
                <ReservationDatePicker
                  id="returnDate"
                  value={draft.returnDate}
                  onChange={(value) => updateField("returnDate", value)}
                  disabledDates={unavailableDates}
                  placeholder="Selecionar devolucao"
                  required
                />
              </Field>
            </div>

            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Datas riscadas no calendario ja possuem reserva para este veiculo. A reserva vai
              ficar pendente ate a aprovacao da Juliana.
            </p>

            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                  <CreditCard className="h-4 w-4" />
                  CNH com foto
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  Envie uma foto legivel da CNH e mostre a validade do documento. Se ela nao
                  estiver aprovada, a reserva segue para analise da Juliana.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Numero da CNH" htmlFor="cnhNumber">
                  <Input
                    id="cnhNumber"
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    value={draft.cnhNumber ?? ""}
                    onChange={(event) => updateField("cnhNumber", event.target.value.replace(/\D/g, ""))}
                    required={needsCnhUpload}
                  />
                </Field>
                <Field label="Validade da CNH" htmlFor="cnhExpiresAt">
                  <Input
                    id="cnhExpiresAt"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={draft.cnhExpiresAt ?? ""}
                    onChange={(event) => updateField("cnhExpiresAt", event.target.value)}
                    required={needsCnhUpload}
                  />
                </Field>
                <Field label="Foto da CNH" htmlFor="cnhPhotoDataUrl">
                  <Input
                    id="cnhPhotoDataUrl"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      void imageFileToDataUrl(file)
                        .then((value) => updateField("cnhPhotoDataUrl", value))
                        .catch(() => toast.error("Foto invalida."));
                    }}
                    required={needsCnhUpload}
                  />
                </Field>
              </div>
            </div>

            <Field label="Motivo" htmlFor="reason">
              <Textarea
                id="reason"
                value={draft.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                required
                className="min-h-28"
              />
            </Field>

            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <DialogFooter className="gap-3 sm:items-center">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <GetStartedButton
                type="submit"
                label={isSubmitting ? "Enviando..." : "Enviar para aprovacao"}
                disabled={isSubmitting}
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
