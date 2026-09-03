import {
  Ban,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  MapPin,
  StickyNote,
  Target,
  User,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  equipmentReservationStatusDots,
  equipmentReservationStatusHints,
  equipmentReservationStatusStyles,
  formatEquipmentPeriod,
  type EquipmentReservation,
} from "@/data/equipment";

interface EquipmentReviewDialogProps {
  open: boolean;
  reservation?: EquipmentReservation;
  onOpenChange: (open: boolean) => void;
  onApprove: (reservationId: string) => Promise<boolean>;
  onReject: (reservationId: string, reason: string) => Promise<boolean>;
  onCancel: (reservationId: string, reason?: string) => Promise<boolean>;
  onComplete: (reservationId: string) => Promise<boolean>;
}

/*
 * Analise de uma solicitacao.
 *
 * O campo de motivo so aparece quando a acao escolhida e recusar ou cancelar —
 * um textarea sempre visivel sugere que a aprovacao tambem precisa de
 * justificativa, e ela nao precisa.
 */
export function EquipmentReviewDialog({
  open,
  reservation,
  onOpenChange,
  onApprove,
  onReject,
  onCancel,
  onComplete,
}: EquipmentReviewDialogProps) {
  const [pendingAction, setPendingAction] = useState<"reject" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPendingAction(null);
    setReason("");
  }, [open, reservation?.id]);

  if (!reservation) return null;

  const isPending = reservation.status === "Pendente";
  const isApproved = reservation.status === "Aprovada";

  async function run(action: () => Promise<boolean>) {
    setIsSubmitting(true);
    try {
      if (await action()) onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmReasonedAction() {
    if (!reservation) return;

    if (pendingAction === "reject") {
      if (reason.trim().length < 3) {
        toast.error("Descreva o motivo da recusa para o solicitante.");
        return;
      }
      void run(() => onReject(reservation.id, reason.trim()));
      return;
    }
    void run(() => onCancel(reservation.id, reason.trim() || undefined));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analisar solicitação</DialogTitle>
          <DialogDescription>
            {reservation.equipmentName} · {reservation.equipmentCategory}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${equipmentReservationStatusStyles[reservation.status]}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${equipmentReservationStatusDots[reservation.status]}`}
                aria-hidden
              />
              {reservation.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {equipmentReservationStatusHints[reservation.status]}
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <DetailRow icon={<CalendarClock />} label="Período">
              {formatEquipmentPeriod(reservation)}
            </DetailRow>
            <DetailRow icon={<MapPin />} label="Local de utilização">
              {reservation.usageLocation}
            </DetailRow>
            <DetailRow icon={<User />} label="Solicitante">
              {reservation.requesterName} · {reservation.requesterDepartment}
            </DetailRow>
            <DetailRow icon={<User />} label="Quem utilizará">
              {reservation.operatorName}
            </DetailRow>
            <DetailRow icon={<Target />} label="Finalidade" className="sm:col-span-2">
              {reservation.purpose}
            </DetailRow>
            {reservation.notes ? (
              <DetailRow icon={<StickyNote />} label="Observações" className="sm:col-span-2">
                {reservation.notes}
              </DetailRow>
            ) : null}
          </div>

          {/* O aceite do termo e parte do registro da reserva: quem analisa
              precisa poder confirmar que ele existe e qual versao foi aceita. */}
          <div className="flex items-start gap-2.5 rounded-lg border border-success/25 bg-success-subtle px-3.5 py-3">
            <FileCheck2
              className="mt-0.5 h-4 w-4 shrink-0 text-success-subtle-foreground"
              aria-hidden
            />
            <p className="text-sm leading-6 text-success-subtle-foreground">
              Termo de Responsabilidade versão {reservation.termsVersion} aceito em{" "}
              {formatDateTime(reservation.termsAcceptedAt)} por {reservation.requesterName}.
            </p>
          </div>

          {reservation.rejectionReason ? (
            <p className="rounded-lg border border-danger/25 bg-danger-subtle px-3.5 py-2.5 text-sm text-danger-subtle-foreground">
              <strong className="font-semibold">Motivo da recusa:</strong>{" "}
              {reservation.rejectionReason}
            </p>
          ) : null}

          {reservation.cancellationReason ? (
            <p className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">Motivo do cancelamento:</strong>{" "}
              {reservation.cancellationReason}
            </p>
          ) : null}

          {reservation.reviewedByName ? (
            <p className="text-xs text-muted-foreground">
              Analisada por {reservation.reviewedByName}
              {reservation.reviewedAt ? ` em ${formatDateTime(reservation.reviewedAt)}` : ""}.
            </p>
          ) : null}

          {pendingAction ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted p-4">
              <label htmlFor="reviewReason" className="text-sm font-medium text-foreground">
                {pendingAction === "reject"
                  ? "Motivo da recusa (obrigatório)"
                  : "Motivo do cancelamento (opcional)"}
              </label>
              <p className="text-xs text-muted-foreground">
                O solicitante verá este texto na tela de reservas dele.
              </p>
              <Textarea
                id="reviewReason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="min-h-24 bg-card"
                autoFocus
              />
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPendingAction(null);
                    setReason("");
                  }}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant={pendingAction === "reject" ? "destructive" : "default"}
                  disabled={isSubmitting}
                  onClick={confirmReasonedAction}
                >
                  {isSubmitting
                    ? "Enviando..."
                    : pendingAction === "reject"
                      ? "Confirmar recusa"
                      : "Confirmar cancelamento"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>

              {isApproved ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => setPendingAction("cancel")}
                  >
                    <Ban className="h-4 w-4" />
                    Cancelar reserva
                  </Button>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void run(() => onComplete(reservation.id))}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como concluída
                  </Button>
                </>
              ) : null}

              {isPending ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting}
                    onClick={() => setPendingAction("reject")}
                  >
                    <XCircle className="h-4 w-4" />
                    Recusar
                  </Button>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    className="shadow-sm hover:bg-primary"
                    onClick={() => void run(() => onApprove(reservation.id))}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSubmitting ? "Aprovando..." : "Aprovar"}
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-muted px-3.5 py-2.5 ${className ?? ""}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-foreground">{children}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
