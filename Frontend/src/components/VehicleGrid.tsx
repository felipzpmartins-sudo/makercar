import { VehicleCard } from "@/components/VehicleCard";
import type { Vehicle } from "@/data/vehicles";

interface VehicleGridProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
}

export function VehicleGrid({ vehicles, selectedVehicleId, onSelectVehicle }: VehicleGridProps) {
  return (
    <section id="veiculos" className="scroll-mt-24">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Veículos da frota</h2>
          <p className="text-sm text-slate-600">
            Selecione um veículo para visualizar os detalhes.
          </p>
        </div>
        <span className="text-sm text-slate-500">{vehicles.length} veículos</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            isActive={vehicle.id === selectedVehicleId}
            onSelect={onSelectVehicle}
          />
        ))}
      </div>
    </section>
  );
}
