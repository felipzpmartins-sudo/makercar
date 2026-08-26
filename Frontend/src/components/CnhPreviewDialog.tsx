import { AlertCircle, CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
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
import { getStoredAuthSession } from "@/utils/authStorage";

export type CnhStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CnhPreviewTarget {
  userId: string;
  name: string;
  cnhNumber: string | null;
  cnhExpiresAt: string | null;
  cnhStatus: CnhStatus | null;
  photoUrl: string;
}

interface CnhPreviewDialogProps {
  target: CnhPreviewTarget | null;
  canReview: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeStatus: (userId: string, status: CnhStatus) => void;
}

/*
 * Visualizador da CNH enviada.
 *
 * A foto fica atras de autenticacao (/uploads exige Bearer), entao nao da
 * para apontar um <img src> direto: baixamos com o token e mostramos o blob.
 * A revisao acontece aqui mesmo — quem aprova precisa ver o documento e
 * decidir sem trocar de aba.
 */
export function CnhPreviewDialog({
  target,
  canReview,
  onOpenChange,
  onChangeStatus,
}: CnhPreviewDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!target) return;

    let cancelled = false;
    let created: string | null = null;

    setIsLoading(true);
    setError(null);
    setObjectUrl(null);

    const token = getStoredAuthSession()?.accessToken;
    fetch(target.photoUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar o documento.");
        const blob = await response.blob();
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Não foi possível carregar o documento.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      // Libera a memoria do blob ao fechar; sem isto a imagem fica presa.
      if (created) URL.revokeObjectURL(created);
    };
  }, [target]);

  const expiresAt = formatDate(target?.cnhExpiresAt);
  const isExpired =
    target?.cnhExpiresAt != null && new Date(target.cnhExpiresAt).getTime() < Date.now();

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>CNH de {target?.name}</DialogTitle>
          <DialogDescription>Confira o documento antes de aprovar ou recusar.</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:grid-cols-3">
          <Field label="Número" value={target?.cnhNumber ?? "-"} mono />
          <Field
            label="Validade"
            value={expiresAt}
            tone={isExpired ? "danger" : undefined}
            hint={isExpired ? "vencida" : undefined}
          />
          <Field label="Situação" value={statusLabel(target?.cnhStatus)} />
        </dl>

        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
          {isLoading ? (
            <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              Carregando documento...
            </span>
          ) : error ? (
            <span className="flex max-w-sm flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-danger" aria-hidden />
              {error}
            </span>
          ) : objectUrl ? (
            <img
              src={objectUrl}
              alt={`CNH de ${target?.name}`}
              className="max-h-[52vh] w-full object-contain"
            />
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!objectUrl}
            onClick={() => objectUrl && window.open(objectUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir em nova aba
          </Button>

          {canReview && target ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onChangeStatus(target.userId, "REJECTED");
                  onOpenChange(false);
                }}
              >
                <XCircle className="h-4 w-4 text-danger" />
                Recusar
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => {
                  onChangeStatus(target.userId, "APPROVED");
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
              </Button>
            </div>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  mono,
  tone,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "danger";
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={[
          "mt-0.5 truncate text-sm",
          mono ? "font-mono" : "",
          tone === "danger" ? "text-danger-subtle-foreground" : "text-foreground",
        ].join(" ")}
      >
        {value}
        {hint ? <span className="ml-1 text-xs font-medium">({hint})</span> : null}
      </dd>
    </div>
  );
}

export function statusLabel(status: CnhStatus | null | undefined) {
  if (status === "APPROVED") return "Aprovada";
  if (status === "REJECTED") return "Recusada";
  if (status === "PENDING") return "Em análise";
  return "Não enviada";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}
