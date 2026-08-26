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
      className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{vehicle.name}</h2>
          <p className="mt-1 font-mono text-sm tracking-wide text-muted-foreground">{vehicle.plate}</p>
        </div>
        <span
          className={`inline-flex min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-xs font-medium leading-none ${statusStyle}`}
          title={statusLabel}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
          <span className="truncate">{statusLabel}</span>
        </span>
      </div>

      {vehicle.supportOnly ? (
        <div className="mb-5 rounded-lg border border-primary/25 bg-primary-subtle px-3 py-2 text-sm text-primary-subtle-foreground">
          Este veículo é de uso exclusivo do suporte. A reserva requer a senha do setor.
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Detail
          icon={
            <span
              className={`h-3 w-3 rounded-full ${
                vehicle.color === "Branco"
                  ? "bg-[#f8fafc] ring-1 ring-black/25 dark:ring-white/35"
                  : vehicle.color === "Prata"
                    ? "bg-[#c4cad3] ring-1 ring-black/15 dark:ring-white/25"
                    : "bg-[#111827] ring-1 ring-white/25"
              }`}
            />
          }
          label="Cor"
          value={vehicle.color}
        />
        <Detail
          icon={<Gauge className="h-4 w-4 text-primary" />}
          label="KM"
          value={`${vehicle.km.toLocaleString("pt-BR")} km`}
        />
        <Detail
          icon={<Fuel className="h-4 w-4 text-primary" />}
          label="Combustível"
          value={vehicle.fuel}
        />
        <Detail
          icon={<Settings2 className="h-4 w-4 text-primary" />}
          label="Câmbio"
          value={vehicle.transmission}
        />
        <Detail
          icon={<Users className="h-4 w-4 text-primary" />}
          label="Capacidade"
          value={vehicle.capacity}
        />
        <Detail
          icon={<Car className="h-4 w-4 text-primary" />}
          label="Status"
          value={statusLabel}
        />
      </dl>

      <div className="mt-6 space-y-2">
        <Button
          type="button"
          onClick={onReserve}
          disabled={!canReserve}
          className="w-full shadow-sm hover:bg-primary disabled:bg-muted disabled:shadow-none"
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
    <div className="rounded-lg bg-muted p-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
