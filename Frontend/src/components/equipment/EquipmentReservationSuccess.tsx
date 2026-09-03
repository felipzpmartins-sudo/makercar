import { CalendarClock, CheckCircle2, MapPin, Target } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  equipmentReservationStatusDots,
  equipmentReservationStatusStyles,
  formatEquipmentPeriod,
  type EquipmentReservation,
} from "@/data/equipment";

interface EquipmentReservationSuccessProps {
  open: boolean;
  reservation?: EquipmentReservation;
  onOpenChange: (open: boolean) => void;
  onViewReservations: () => void;
}

/*
 * Confirmacao do envio.
 *
 * Aparece no lugar do formulario, com o resumo do que foi enviado. O ponto
 * central e o status: a solicitacao NAO esta aprovada, e a tela precisa deixar
 * isso claro antes que a pessoa saia achando que o robo ja e dela.
 */
export function EquipmentReservationSuccess({
  open,
  reservation,
  onOpenChange,
  onViewReservations,
}: EquipmentReservationSuccessProps) {
  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="overflow-hidden p-0 sm:max-w-lg">
        <div className="eq-stage eq-grid relative px-6 pb-6 pt-8 text-center">
          <div className="eq-halo opacity-80" />

          <div className="relative z-10">
            <div className="animate-fade-rise mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle text-success ring-1 ring-success/25">
              <CheckCircle2 className="h-7 w-7" aria-hidden />
            </div>

            <DialogTitle className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              Solicitação enviada!
            </DialogTitle>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Sua solicitação para o{" "}
              <strong className="font-medium text-foreground">{reservation.equipmentName}</strong>{" "}
              foi enviada para aprovação.
            </p>

            <span
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${equipmentReservationStatusStyles[reservation.status]}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${equipmentReservationStatusDots[reservation.status]}`}
                aria-hidden
              />
              Aguardando aprovação
            </span>
          </div>
        </div>

        <div className="space-y-3 border-t border-border px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Informações da solicitação
          </p>

          <SummaryRow
            icon={<CalendarClock className="h-4 w-4 text-primary" />}
            label="Período"
            value={formatEquipmentPeriod(reservation)}
          />
          <SummaryRow
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Finalidade"
            value={reservation.purpose}
          />
          <SummaryRow
            icon={<MapPin className="h-4 w-4 text-primary" />}
            label="Local"
            value={reservation.usageLocation}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row-reverse">
          <Button
            type="button"
            className="w-full shadow-sm hover:bg-primary sm:w-auto"
            onClick={() => {
              onOpenChange(false);
              onViewReservations();
            }}
          >
            Ver minhas reservas
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Continuar na tela
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 block break-words text-sm text-foreground">{value}</span>
      </span>
    </div>
  );
}
