import {
  Ban,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  PackageCheck,
  PackageX,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import {
  formatEquipmentPeriod,
  type EquipmentReservation,
  type EquipmentSummary,
} from "@/data/equipment";

interface EquipmentAdminDashboardProps {
  summary: EquipmentSummary | null;
  reservations: EquipmentReservation[];
  onOpenRequest: (reservation: EquipmentReservation) => void;
  onSeeAllRequests: () => void;
}

/*
 * Painel do administrador.
 *
 * A linha de cima e o que exige acao (pendentes) e o que esta acontecendo hoje.
 * A segunda linha e o historico, que informa mas nao cobra nada. Logo abaixo
 * vem a fila de pendentes, porque o numero sozinho nao diz de quem e a espera.
 */
export function EquipmentAdminDashboard({
  summary,
  reservations,
  onOpenRequest,
  onSeeAllRequests,
}: EquipmentAdminDashboardProps) {
  const pendingRequests = reservations
    .filter((reservation) => reservation.status === "Pendente")
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));

  return (
    <section className="min-w-0 space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Situação das reservas e dos equipamentos internos.
        </p>
      </header>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Clock />}
          tone="warning"
          label="Reservas pendentes"
          value={summary?.pending}
          hint="Aguardando sua análise"
        />
        <StatCard
          icon={<CheckCircle2 />}
          tone="success"
          label="Reservas aprovadas"
          value={summary?.approved}
          hint="Autorizadas e vigentes"
        />
        <StatCard
          icon={<CalendarDays />}
          tone="info"
          label="Reservas de hoje"
          value={summary?.today}
          hint="Períodos que cruzam o dia"
        />
        <StatCard
          icon={<XCircle />}
          tone="danger"
          label="Reservas recusadas"
          value={summary?.rejected}
          hint="Não autorizadas"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<PackageCheck />}
          tone="success"
          label="Equipamentos disponíveis"
          value={summary?.availableEquipments}
          hint="Livres agora"
        />
        <StatCard
          icon={<CalendarCheck />}
          tone="info"
          label="Equipamentos reservados"
          value={summary?.reservedEquipments}
          hint="Em uso neste momento"
        />
        <StatCard
          icon={<PackageX />}
          tone="danger"
          label="Equipamentos bloqueados"
          value={summary?.blockedEquipments}
          hint="Manutenção ou indisponíveis"
        />
        <StatCard
          icon={<Ban />}
          tone="neutral"
          label="Canceladas / concluídas"
          value={summary ? summary.cancelled + summary.completed : undefined}
          hint="Encerradas no histórico"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Fila de aprovação
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Solicitações aguardando decisão, da mais antiga para a mais recente.
            </p>
          </div>
          {pendingRequests.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={onSeeAllRequests}>
              Ver todas as solicitações
            </Button>
          ) : null}
        </div>

        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 />}
            title="Nenhuma solicitação pendente"
            description="Todas as solicitações já foram analisadas."
          />
        ) : (
          <ul className="divide-y divide-border">
            {pendingRequests.slice(0, 6).map((reservation) => (
              <li key={reservation.id}>
                <button
                  type="button"
                  onClick={() => onOpenRequest(reservation)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors duration-150 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70">
                    <img
                      src={reservation.equipmentImage}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="max-h-9 w-auto object-contain"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {reservation.equipmentName} · {reservation.requesterName}
                    </span>
                    <span className="tabular mt-0.5 block truncate text-xs text-muted-foreground">
                      {formatEquipmentPeriod(reservation)} · {reservation.usageLocation}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-warning-subtle px-2.5 py-1 text-xs font-medium text-warning-subtle-foreground ring-1 ring-warning/20">
                    Analisar
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const toneStyles = {
  success: "bg-success-subtle text-success-subtle-foreground ring-success/20",
  warning: "bg-warning-subtle text-warning-subtle-foreground ring-warning/20",
  info: "bg-info-subtle text-info-subtle-foreground ring-info/20",
  danger: "bg-danger-subtle text-danger-subtle-foreground ring-danger/20",
  neutral: "bg-neutral-subtle text-neutral-subtle-foreground ring-border-strong",
} as const;

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: keyof typeof toneStyles;
  label: string;
  value?: number;
  hint: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase leading-tight tracking-wider text-muted-foreground">
            {label}
          </p>
          {/* Enquanto o resumo nao chegou mostramos um traco, e nao zero: zero
              e um dado, e ainda nao sabemos qual e o dado. */}
          <p className="tabular mt-2 text-3xl font-bold text-foreground">
            {value === undefined ? "—" : value}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 [&_svg]:h-4.5 [&_svg]:w-4.5 ${toneStyles[tone]}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
