import { CalendarClock, Car, CheckCircle2, Clock, OctagonX, Wrench } from "lucide-react";
import type { ReactElement } from "react";

import {
  isVehicleAvailable,
  isVehicleMaintenance,
  isVehicleUnavailable,
  statusAccents,
  type Vehicle,
} from "@/data/vehicles";

interface FleetSummaryProps {
  vehicles: Vehicle[];
}

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
      className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">Indicadores da frota</h2>
        <p className="mt-1 text-sm text-slate-600">Valores calculados dinamicamente.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Total de veículos"
          value={summary.total}
          accent="bg-blue-600"
          icon={<Car />}
        />
        <SummaryCard
          label="Disponíveis"
          value={summary.available}
          accent={statusAccents.Disponível}
          icon={<CheckCircle2 />}
        />
        <SummaryCard
          label="Em uso"
          value={summary.inUse}
          accent={statusAccents["Em uso"]}
          icon={<Clock />}
        />
        <SummaryCard
          label="Reservados"
          value={summary.reserved}
          accent={statusAccents.Reservado}
          icon={<CalendarClock />}
        />
        <SummaryCard
          label="Em manutenção"
          value={summary.maintenance}
          accent={statusAccents["Em manutenção"]}
          icon={<Wrench />}
        />
        <SummaryCard
          label="Indisponíveis"
          value={summary.unavailable}
          accent={statusAccents.Indisponível}
          icon={<OctagonX />}
        />
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: ReactElement;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{label}</p>
        <span className="text-blue-600 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
