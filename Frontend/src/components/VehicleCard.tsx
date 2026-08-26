import { Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getVehicleStatusDot,
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  isVehicleMaintenance,
  isVehicleUnavailable,
  type Vehicle,
} from "@/data/vehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  isActive: boolean;
  onSelect: (vehicleId: string) => void;
}

/*
 * Card de veiculo da frota.
 *
 * Hierarquia de leitura: foto -> status -> modelo -> placa -> KM. O status
 * fica sobre a foto porque e a informacao que decide se vale continuar
 * lendo o card.
 */
export function VehicleCard({ vehicle, isActive, onSelect }: VehicleCardProps) {
  const statusLabel = getVehicleStatusLabel(vehicle.status);
  const statusStyle = getVehicleStatusStyle(vehicle.status);
  const statusDot = getVehicleStatusDot(vehicle.status);
  const isBlocked = isVehicleMaintenance(vehicle.status) || isVehicleUnavailable(vehicle.status);

  return (
    <article
      className={[
        "group relative min-w-0 overflow-hidden rounded-xl border bg-card",
        "transition-[border-color,box-shadow,transform] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md",
        isActive
          ? "border-primary/50 shadow-sm ring-1 ring-primary/20"
          : "border-border shadow-xs hover:border-border-strong",
      ].join(" ")}
    >
      {/* Fio na cor da marca marca o card selecionado sem engrossar a borda. */}
      {isActive ? (
        <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-0.5 bg-primary" />
      ) : null}

      <button
        type="button"
        onClick={() => onSelect(vehicle.id)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-pressed={isActive}
      >
        <div
          className={`relative flex h-40 items-center justify-center overflow-hidden bg-muted/60 sm:h-44 ${
            isBlocked ? "vehicle-blocked" : ""
          }`}
        >
          <img
            src={vehicle.image}
            alt={vehicle.name}
            loading="lazy"
            className="max-h-32 w-auto max-w-[86%] object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:max-h-36 sm:max-w-full"
          />
          <span
            className={`absolute right-3 top-3 inline-flex min-w-24 max-w-[calc(100%-1.5rem)] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-center text-xs font-medium leading-none ${statusStyle}`}
            title={statusLabel}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} aria-hidden />
            <span className="truncate">{statusLabel}</span>
          </span>

          {vehicle.supportOnly ? (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-1 text-xs font-medium leading-none text-primary-subtle-foreground">
              Suporte
            </span>
          ) : null}
        </div>
      </button>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight text-foreground">
              {vehicle.name}
            </h3>
            <p className="mt-1 font-mono text-xs tracking-wide text-muted-foreground">
              {vehicle.plate}
            </p>
          </div>
          <div className="flex max-w-[36%] shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                vehicle.color === "Branco"
                  ? "bg-[#f8fafc] ring-1 ring-black/25 dark:ring-white/35"
                  : vehicle.color === "Prata"
                    ? "bg-[#c4cad3] ring-1 ring-black/15 dark:ring-white/25"
                    : "bg-[#111827] ring-1 ring-white/25"
              }`}
              aria-hidden
            />
            <span className="truncate">{vehicle.color}</span>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-border pt-4">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="tabular truncate">{vehicle.km.toLocaleString("pt-BR")} km</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onSelect(vehicle.id)}
            className="shrink-0"
          >
            {isActive ? "Selecionado" : "Selecionar"}
          </Button>
        </div>
      </div>
    </article>
  );
}
