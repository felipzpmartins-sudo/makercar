import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Estados de carregamento e vazio.
 *
 * Regra: se sabemos o formato do que vai chegar, mostramos skeleton no
 * formato certo (menos salto de layout); se nao sabemos, mostramos um
 * spinner centrado. Texto solto no meio da tela nunca.
 */

/** Tela cheia — usada enquanto a sessao e verificada, antes de saber o que renderizar. */
export function FullPageLoader({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className="sr-only" role="status" aria-live="polite">
        {label}
      </span>
    </div>
  );
}

/** Bloco cinza pulsante. Combine varios para desenhar a silhueta do conteudo. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

/** Silhueta da grade de veiculos, no mesmo grid da VehicleGrid. */
export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
      role="status"
      aria-label="Carregando veiculos"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="h-40 rounded-none sm:h-44" />
          <div className="space-y-3 p-4 sm:p-5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Silhueta de tabela: cabecalho mais denso, linhas de altura fixa. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Carregando dados">
      <div className="flex gap-3 border-b border-border pb-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3 border-b border-border py-4 last:border-0">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton key={columnIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Faixa discreta de "atualizando" — para quando ja existe conteudo na tela. */
export function InlineLoader({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
      {label}
    </div>
  );
}

/**
 * Estado vazio.
 *
 * Sempre com uma frase que explica o porque de estar vazio, e uma acao
 * quando existe algo que o usuario possa fazer a respeito.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-muted/30 px-6 py-12 text-center">
      {icon ? (
        <div
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:h-5 [&_svg]:w-5"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
