import { Car, Fuel, Gauge, Settings2, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  getVehicleStatusDot,
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  isVehicleReservable,
  type Vehicle,
} from "@/data/vehicles";

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onReserve: () => void;
}

export function VehicleDetails({ vehicle, onReserve }: VehicleDetailsProps) {
  const statusLabel = getVehicleStatusLabel(vehicle.status);
  const statusStyle = getVehicleStatusStyle(vehicle.status);
  const statusDot = getVehicleStatusDot(vehicle.status);
  const canReserve = isVehicleReservable(vehicle.status);

  return (
    <aside
      id="reservas"
      className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{vehicle.name}</h2>
          <p className="mt-1 font-mono text-sm tracking-wide text-slate-500">{vehicle.plate}</p>
        </div>
        <span
          className={`inline-flex min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-xs font-medium leading-none ${statusStyle}`}
          title={statusLabel}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
          <span className="truncate">{statusLabel}</span>
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Detail
          icon={
            <span
              className={`h-3 w-3 rounded-full ${
                vehicle.color === "Branco"
                  ? "bg-white ring-1 ring-slate-300"
                  : vehicle.color === "Prata"
                    ? "bg-slate-300 ring-1 ring-slate-400"
                    : "bg-slate-950"
              }`}
            />
          }
          label="Cor"
          value={vehicle.color}
        />
        <Detail
          icon={<Gauge className="h-4 w-4 text-blue-600" />}
          label="KM"
          value={`${vehicle.km.toLocaleString("pt-BR")} km`}
        />
        <Detail
          icon={<Fuel className="h-4 w-4 text-blue-600" />}
          label="Combustível"
          value={vehicle.fuel}
        />
        <Detail
          icon={<Settings2 className="h-4 w-4 text-blue-600" />}
          label="Câmbio"
          value={vehicle.transmission}
        />
        <Detail
          icon={<Users className="h-4 w-4 text-blue-600" />}
          label="Capacidade"
          value={vehicle.capacity}
        />
        <Detail
          icon={<Car className="h-4 w-4 text-blue-600" />}
          label="Status"
          value={statusLabel}
        />
      </dl>

      <div className="mt-6 space-y-2">
        <Button
          type="button"
          onClick={onReserve}
          disabled={!canReserve}
          className="w-full bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none"
        >
          {canReserve ? "Reservar Veículo" : "Indisponível"}
        </Button>
        <Button type="button" variant="outline" className="w-full">
          Ver Detalhes
        </Button>
      </div>
    </aside>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-950">{value}</dd>
    </div>
  );
}
