import { Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getVehicleStatusDot,
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  type Vehicle,
} from "@/data/vehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  isActive: boolean;
  onSelect: (vehicleId: string) => void;
}

export function VehicleCard({ vehicle, isActive, onSelect }: VehicleCardProps) {
  const statusLabel = getVehicleStatusLabel(vehicle.status);
  const statusStyle = getVehicleStatusStyle(vehicle.status);
  const statusDot = getVehicleStatusDot(vehicle.status);

  return (
    <article
      className={`group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
        isActive ? "border-blue-500 ring-2 ring-blue-500/25" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(vehicle.id)}
        className="block w-full text-left"
        aria-pressed={isActive}
      >
        <div
          className={`relative flex h-44 items-center justify-center overflow-hidden ${vehicle.color === "Preto" ? "bg-slate-100" : "bg-slate-50"}`}
        >
          <img
            src={vehicle.image}
            alt={vehicle.name}
            loading="lazy"
            className="max-h-36 w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
          <span
            className={`absolute right-3 top-3 inline-flex min-w-24 max-w-[calc(100%-1.5rem)] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-xs font-medium leading-none ${statusStyle}`}
            title={statusLabel}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
            <span className="truncate">{statusLabel}</span>
          </span>
        </div>
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">{vehicle.name}</h3>
            <p className="mt-1 font-mono text-xs tracking-wide text-slate-500">{vehicle.plate}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                vehicle.color === "Branco"
                  ? "bg-white ring-1 ring-slate-300"
                  : vehicle.color === "Prata"
                    ? "bg-slate-300 ring-1 ring-slate-400"
                    : "bg-slate-950"
              }`}
            />
            {vehicle.color}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Gauge className="h-3.5 w-3.5" />
            {vehicle.km.toLocaleString("pt-BR")} km
          </span>
          <Button
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onSelect(vehicle.id)}
            className={isActive ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
          >
            {isActive ? "Selecionado" : "Selecionar"}
          </Button>
        </div>
      </div>
    </article>
  );
}
