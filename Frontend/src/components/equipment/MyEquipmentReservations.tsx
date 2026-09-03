import { CalendarClock, CalendarX, ClipboardList, MapPin, Target, User } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import {
  equipmentReservationStatusDots,
  equipmentReservationStatusHints,
  equipmentReservationStatusStyles,
  formatEquipmentPeriod,
  isCancellableReservation,
  type EquipmentReservation,
  type EquipmentReservationStatus,
} from "@/data/equipment";

interface MyEquipmentReservationsProps {
  reservations: EquipmentReservation[];
  onCancel: (reservationId: string, reason?: string) => void;
}

type ReservationFilter = "Todas" | EquipmentReservationStatus;

const filters: ReservationFilter[] = [
  "Todas",
  "Pendente",
  "Aprovada",
  "Recusada",
  "Cancelada",
  "Concluída",
];

/** Plural do filtro — o badge da reserva fica no singular ("Pendente"). */
const filterLabels: Record<ReservationFilter, string> = {
  Todas: "Todas",
  Pendente: "Pendentes",
  Aprovada: "Aprovadas",
  Recusada: "Recusadas",
  Cancelada: "Canceladas",
  Concluída: "Concluídas",
};

export function MyEquipmentReservations({ reservations, onCancel }: MyEquipmentReservationsProps) {
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>("Todas");

  const countByFilter = useMemo(() => {
    const counts = new Map<ReservationFilter, number>([["Todas", reservations.length]]);
    reservations.forEach((reservation) => {
      counts.set(reservation.status, (counts.get(reservation.status) ?? 0) + 1);
    });
    return counts;
  }, [reservations]);

  const visibleReservations = useMemo(
    () =>
      activeFilter === "Todas"
        ? reservations
        : reservations.filter((reservation) => reservation.status === activeFilter),
    [activeFilter, reservations],
  );

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Minhas reservas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o andamento das suas solicitações de equipamento.
        </p>
      </header>

      <nav
        className="scrollbar-none flex snap-x gap-2 overflow-x-auto pb-1"
        aria-label="Filtrar reservas por situação"
      >
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          const count = countByFilter.get(filter) ?? 0;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={isActive}
              className={[
                "inline-flex h-9 shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 text-sm font-medium",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary/25 bg-primary-subtle text-primary-subtle-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
              ].join(" ")}
            >
              {filterLabels[filter]}
              <span
                className={`tabular rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                  isActive ? "bg-primary/15" : "bg-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {visibleReservations.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title={
            activeFilter === "Todas"
              ? "Nenhuma solicitação registrada"
              : `Nenhuma reserva ${filterLabels[activeFilter].toLowerCase()}`
          }
          description={
            activeFilter === "Todas"
              ? "Escolha um equipamento no catálogo para enviar sua primeira solicitação."
              : "Troque o filtro para ver as demais solicitações."
          }
        />
      ) : (
        <div className="stagger grid min-w-0 gap-4 lg:grid-cols-2">
          {visibleReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} onCancel={onCancel} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: EquipmentReservation;
  onCancel: (reservationId: string, reason?: string) => void;
}) {
  const canCancel = isCancellableReservation(reservation.status);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] duration-200 ease-out hover:border-border-strong hover:shadow-sm">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div className="eq-stage relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-24 sm:w-24">
          <div className="eq-halo opacity-60" />
          <img
            src={reservation.equipmentImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="relative z-10 max-h-16 w-auto object-contain drop-shadow-lg sm:max-h-20"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold tracking-tight text-foreground">
                {reservation.equipmentName}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {reservation.equipmentCategory}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${equipmentReservationStatusStyles[reservation.status]}`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${equipmentReservationStatusDots[reservation.status]}`}
                aria-hidden
              />
              {reservation.status}
            </span>
          </div>

          <p className="mt-2.5 flex items-start gap-1.5 text-sm text-foreground">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span className="tabular">{formatEquipmentPeriod(reservation)}</span>
          </p>
        </div>
      </div>

      <dl className="grid gap-2 border-t border-border px-4 py-3.5 text-sm sm:px-5">
        <InfoRow icon={<Target className="h-3.5 w-3.5" />} label="Finalidade">
          {reservation.purpose}
        </InfoRow>
        <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Local">
          {reservation.usageLocation}
        </InfoRow>
        <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Utilizado por">
          {reservation.operatorName}
        </InfoRow>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
        <p className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
          {/* O motivo da recusa e o do cancelamento importam mais que a dica
              generica: quando existem, eles substituem a frase padrao. */}
          {reservation.rejectionReason
            ? `Motivo da recusa: ${reservation.rejectionReason}`
            : reservation.cancellationReason
              ? `Motivo do cancelamento: ${reservation.cancellationReason}`
              : equipmentReservationStatusHints[reservation.status]}
        </p>

        {canCancel ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => {
              const reason = window.prompt("Informe o motivo do cancelamento (opcional):");
              // prompt devolve null no "Cancelar" do navegador: nesse caso a
              // pessoa desistiu de cancelar, e nada deve acontecer.
              if (reason === null) return;
              onCancel(reservation.id, reason.trim() || undefined);
            }}
          >
            <CalendarX className="h-4 w-4" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 break-words text-muted-foreground">
        <span className="font-medium text-foreground">{label}: </span>
        {children}
      </dd>
    </div>
  );
}
