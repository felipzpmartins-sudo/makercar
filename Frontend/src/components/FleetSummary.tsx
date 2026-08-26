import { CalendarClock, Car, CheckCircle2, Clock, OctagonX, Wrench } from "lucide-react";
import type { ReactElement } from "react";

import {
  isVehicleAvailable,
  isVehicleMaintenance,
  isVehicleUnavailable,
  statusDots,
  type Vehicle,
} from "@/data/vehicles";

interface FleetSummaryProps {
  vehicles: Vehicle[];
}

/*
 * Indicadores da frota.
 *
 * Numero grande e tabular, rotulo secundario, um ponto colorido na cor do
 * status correspondente. Sem card dentro de card: os tiles dividem o mesmo
 * painel e sao separados por borda, nao por sombra.
 */
export function FleetSummary({ vehicles }: FleetSummaryProps) {
  const summary = {
    total: vehicles.length,
    available: vehicles.filter((vehicle) => isVehicleAvailable(vehicle.status)).length,
    inUse: vehicles.filter((vehicle) => vehicle.status === "Em uso").length,
    reserved: vehicles.filter((vehicle) => vehicle.status === "Reservado").length,
    maintenance: vehicles.filter((vehicle) => isVehicleMaintenance(vehicle.status)).length,
    unavailable: vehicles.filter((vehicle) => isVehicleUnavailable(vehicle.status)).length,
  };

  return (
    <section
      id="resumo"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="border-b border-border px-5 py-4 sm:px-6 sm:py-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Indicadores da frota
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {summary.total} veículos cadastrados, atualizados em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
        <SummaryTile label="Total" value={summary.total} dot="bg-primary" icon={<Car />} />
        <SummaryTile
          label="Disponíveis"
          value={summary.available}
          dot={statusDots["Disponível"]}
          icon={<CheckCircle2 />}
        />
        <SummaryTile
          label="Em uso"
          value={summary.inUse}
          dot={statusDots["Em uso"]}
          icon={<Clock />}
        />
        <SummaryTile
          label="Reservados"
          value={summary.reserved}
          dot={statusDots.Reservado}
          icon={<CalendarClock />}
        />
        <SummaryTile
          label="Manutenção"
          value={summary.maintenance}
          dot={statusDots["Em manutenção"]}
          icon={<Wrench />}
        />
        <SummaryTile
          label="Indisponíveis"
          value={summary.unavailable}
          dot={statusDots["Indisponível"]}
          icon={<OctagonX />}
        />
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  dot,
  icon,
}: {
  label: string;
  value: number;
  dot: string;
  icon: ReactElement;
}) {
  return (
    <div className="min-w-0 px-5 py-4 transition-colors duration-150 hover:bg-muted/40">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="ml-auto shrink-0 text-muted-foreground/50 [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
