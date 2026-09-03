import { ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/LoadingStates";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  equipmentReservationStatusDots,
  equipmentReservationStatusStyles,
  formatEquipmentPeriod,
  type EquipmentReservation,
  type EquipmentReservationStatus,
} from "@/data/equipment";

interface EquipmentRequestsPanelProps {
  reservations: EquipmentReservation[];
  onOpenRequest: (reservation: EquipmentReservation) => void;
  /** Situacao pre-selecionada ao entrar pela fila do dashboard. */
  initialFilter?: RequestFilter;
}

export type RequestFilter = "Todas" | EquipmentReservationStatus;

const filters: RequestFilter[] = [
  "Todas",
  "Pendente",
  "Aprovada",
  "Recusada",
  "Cancelada",
  "Concluída",
];

const filterLabels: Record<RequestFilter, string> = {
  Todas: "Todas",
  Pendente: "Pendentes",
  Aprovada: "Aprovadas",
  Recusada: "Recusadas",
  Cancelada: "Canceladas",
  Concluída: "Concluídas",
};

/*
 * Lista de solicitacoes do administrador.
 *
 * Tabela no desktop (comparar linhas e o que se faz aqui) e cartoes no celular,
 * mesma escolha do historico da frota. Abrir uma linha leva ao dialogo de
 * analise — a decisao nunca acontece direto na lista, para nao aprovar sem ler.
 */
export function EquipmentRequestsPanel({
  reservations,
  onOpenRequest,
  initialFilter = "Pendente",
}: EquipmentRequestsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<RequestFilter>(initialFilter);
  const [search, setSearch] = useState("");

  const countByFilter = useMemo(() => {
    const counts = new Map<RequestFilter, number>([["Todas", reservations.length]]);
    reservations.forEach((reservation) => {
      counts.set(reservation.status, (counts.get(reservation.status) ?? 0) + 1);
    });
    return counts;
  }, [reservations]);

  const visibleReservations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      if (activeFilter !== "Todas" && reservation.status !== activeFilter) return false;
      if (!term) return true;

      return [
        reservation.equipmentName,
        reservation.requesterName,
        reservation.operatorName,
        reservation.purpose,
        reservation.usageLocation,
        reservation.requesterDepartment,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [activeFilter, reservations, search]);

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Solicitações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra uma solicitação para ver os detalhes e decidir.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          className="scrollbar-none flex snap-x gap-2 overflow-x-auto pb-1"
          aria-label="Filtrar solicitações por situação"
        >
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
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
                  {countByFilter.get(filter) ?? 0}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por equipamento, pessoa ou local"
            className="pl-9"
            aria-label="Buscar solicitações"
          />
        </div>
      </div>

      {visibleReservations.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Nenhuma solicitação encontrada"
          description={
            search
              ? "Nenhum resultado para esta busca. Tente outro termo."
              : "Não há solicitações nesta situação."
          }
        />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {visibleReservations.map((reservation) => (
              <button
                key={reservation.id}
                type="button"
                onClick={() => onOpenRequest(reservation)}
                className="block w-full rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-colors duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {reservation.equipmentName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {reservation.requesterName} · {reservation.requesterDepartment}
                    </p>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
                <p className="tabular mt-3 text-sm text-foreground">
                  {formatEquipmentPeriod(reservation)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {reservation.purpose}
                </p>
              </button>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-xs lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Responsável pelo uso</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReservations.map((reservation) => (
                  <TableRow
                    key={reservation.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onOpenRequest(reservation)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenRequest(reservation);
                      }
                    }}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/70">
                          <img
                            src={reservation.equipmentImage}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="max-h-7 w-auto object-contain"
                          />
                        </span>
                        <span className="font-medium text-foreground">
                          {reservation.equipmentName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground">{reservation.requesterName}</div>
                      <div className="text-xs text-muted-foreground">
                        {reservation.requesterDepartment}
                      </div>
                    </TableCell>
                    <TableCell>{reservation.operatorName}</TableCell>
                    <TableCell className="tabular whitespace-nowrap">
                      {formatEquipmentPeriod(reservation)}
                    </TableCell>
                    <TableCell>{reservation.usageLocation}</TableCell>
                    <TableCell className="max-w-[240px] text-muted-foreground">
                      <span className="line-clamp-2">{reservation.purpose}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={reservation.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: EquipmentReservationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none ${equipmentReservationStatusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${equipmentReservationStatusDots[status]}`}
        aria-hidden
      />
      {status}
    </span>
  );
}
