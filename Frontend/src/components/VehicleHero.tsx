import { Car, Gauge } from "lucide-react";

import {
  getVehicleStatusDot,
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  type Vehicle,
} from "@/data/vehicles";

interface VehicleHeroProps {
  selectedVehicle: Vehicle;
}

export function VehicleHero({ selectedVehicle }: VehicleHeroProps) {
  const statusLabel = getVehicleStatusLabel(selectedVehicle.status);
  const statusStyle = getVehicleStatusStyle(selectedVehicle.status);
  const statusDot = getVehicleStatusDot(selectedVehicle.status);

  return (
    <section id="inicio" className="scroll-mt-24">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Escolha o veículo para sua reserva
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Visualize os veículos disponíveis da empresa e selecione o Renault Kwid ideal para sua
          necessidade.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          className="absolute right-5 top-5 z-20 flex min-w-24 max-w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-full bg-white/85 px-3 py-1 text-center text-xs font-medium text-slate-700 ring-1 ring-slate-200 backdrop-blur"
          title={statusLabel}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
          <span className="truncate">{statusLabel}</span>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative flex min-h-[330px] items-end justify-center overflow-hidden rounded-lg bg-slate-50">
            <div className="absolute bottom-12 left-1/2 h-10 w-72 -translate-x-1/2 rounded-[50%] bg-slate-950/15 blur-2xl" />
            <img
              key={selectedVehicle.id}
              src={selectedVehicle.image}
              alt={selectedVehicle.name}
              className="relative z-10 max-h-[255px] w-auto max-w-full object-contain drop-shadow-2xl animate-car-enter"
            />
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700">Veículo em destaque</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {selectedVehicle.name}
              </h2>
              <p className="mt-2 font-mono text-lg font-semibold tracking-wide text-slate-700">
                {selectedVehicle.plate}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  Quilometragem
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {selectedVehicle.km.toLocaleString("pt-BR")} km
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Car className="h-4 w-4 text-blue-600" />
                  Status
                </div>
                <span
                  className={`mt-3 inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-xs font-medium leading-none ${statusStyle}`}
                  title={statusLabel}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
                  <span className="truncate">{statusLabel}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
