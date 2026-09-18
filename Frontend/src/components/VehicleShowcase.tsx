import { CalendarClock, CalendarPlus, KeyRound } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  getVehicleStatusDot,
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  isVehicleMaintenance,
  isVehicleReservable,
  type Vehicle,
} from "@/data/vehicles";
import type { ReservationAvailability } from "@/services/reservationService";

interface VehicleShowcaseProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle;
  availability: ReservationAvailability[];
  onSelectVehicle: (vehicleId: string) => void;
  onReserve: () => void;
}

/*
 * Vitrine do veiculo selecionado, no mesmo desenho de Equipamentos e Salas.
 *
 * Substitui tres telas da frota antiga — destaque, grade e detalhe — que
 * mostravam o mesmo carro em partes: a foto ficava numa, a ficha na outra e o
 * botao de reservar numa terceira, sem foto. Aqui a pessoa ve o carro, ve se
 * ele esta livre e reserva sem trocar de tela.
 */
export function VehicleShowcase({
  vehicles,
  selectedVehicle,
  availability,
  onSelectVehicle,
  onReserve,
}: VehicleShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const pickedFromListRef = useRef(false);
  const statusLabel = getVehicleStatusLabel(selectedVehicle.status);
  const canReserve = isVehicleReservable(selectedVehicle.status);
  const inMaintenance = isVehicleMaintenance(selectedVehicle.status);
  const { current, next } = describeSchedule(selectedVehicle, availability);

  /*
   * No celular o seletor fica abaixo da dobra: ao tocar num carro, a vitrine
   * troca fora da vista e parece que nada aconteceu. Sobe ate ela.
   */
  useEffect(() => {
    if (!pickedFromListRef.current) return;
    pickedFromListRef.current = false;
    const section = sectionRef.current;
    if (section && section.getBoundingClientRect().top < 0) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedVehicle.id]);

  return (
    <section ref={sectionRef} className="min-w-0 scroll-mt-24" aria-label="Veículos da frota">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="eq-stage eq-grid relative grid items-center gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Palco do veiculo */}
          <div className="relative flex min-h-[210px] items-end justify-center sm:min-h-[300px] lg:min-h-[380px]">
            <div className="eq-halo" />
            <div className="eq-floor bottom-4" />
            <img
              key={selectedVehicle.id}
              src={selectedVehicle.image}
              alt={selectedVehicle.name}
              decoding="async"
              className={`animate-car-enter relative z-10 max-h-[190px] w-auto max-w-full object-contain drop-shadow-2xl sm:max-h-[260px] lg:max-h-[310px] ${
                inMaintenance ? "opacity-70 grayscale" : ""
              }`}
            />
          </div>

          {/* Ficha do veiculo */}
          <div className="relative z-10 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selectedVehicle.status} />
              {selectedVehicle.supportOnly ? (
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary-subtle px-2.5 py-1 text-xs font-medium leading-none text-primary-subtle-foreground">
                  Exclusivo do suporte
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {selectedVehicle.name}
            </h2>
            <p className="mt-1 font-mono text-base font-semibold tracking-wider text-muted-foreground">
              {selectedVehicle.plate}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-2.5">
              <Spec
                label="Quilometragem"
                value={`${selectedVehicle.km.toLocaleString("pt-BR")} km`}
              />
              <Spec label="Combustível" value={selectedVehicle.fuel} />
              <Spec label="Câmbio" value={selectedVehicle.transmission} />
              <Spec label="Capacidade" value={selectedVehicle.capacity} />
            </dl>

            <div className="mt-5 space-y-2 text-sm">
              {current ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
                  <span>
                    Em uso até{" "}
                    <strong className="font-medium text-foreground">
                      {formatMoment(current.end)}
                    </strong>
                  </span>
                </p>
              ) : null}
              {next ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <span>
                    Próxima reserva:{" "}
                    <strong className="font-medium text-foreground">
                      {formatMoment(next.start)} até {formatMoment(next.end)}
                    </strong>
                  </span>
                </p>
              ) : null}
              {!current && !next && canReserve ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>Nenhuma reserva marcada para este veículo.</span>
                </p>
              ) : null}
              {selectedVehicle.supportOnly ? (
                <p className="text-muted-foreground">
                  A reserva deste veículo pede a senha compartilhada do suporte.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                type="button"
                size="lg"
                onClick={onReserve}
                disabled={!canReserve}
                className="h-11 w-full shadow-sm hover:bg-primary disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none sm:w-auto"
              >
                <CalendarPlus />
                {canReserve ? "Reservar veículo" : "Indisponível"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {canReserve
                  ? "Escolha datas livres; a reserva segue para aprovação."
                  : `Este veículo está ${statusLabel.toLowerCase()} e não aceita novas reservas.`}
              </p>
            </div>
          </div>
        </div>

        {vehicles.length > 1 ? (
          <div className="border-t border-border bg-card p-3 sm:p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
              <h3 className="text-sm font-semibold text-foreground">Veículos da frota</h3>
              <span className="text-xs text-muted-foreground">{vehicles.length} veículos</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {vehicles.map((vehicle) => {
                const isActive = vehicle.id === selectedVehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      pickedFromListRef.current = true;
                      onSelectVehicle(vehicle.id);
                    }}
                    className={[
                      "group flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left sm:gap-3 sm:p-2.5",
                      "transition-[border-color,background-color,transform] duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "eq-card-active border-primary/40 bg-primary-subtle/50"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-border-strong",
                    ].join(" ")}
                  >
                    <span className="flex h-10 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70 sm:h-11 sm:w-14">
                      <img
                        src={vehicle.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`max-h-8 w-auto object-contain transition-transform sm:max-h-9 duration-300 ease-out group-hover:scale-110 ${
                          isVehicleMaintenance(vehicle.status) ? "opacity-60 grayscale" : ""
                        }`}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-tight text-foreground sm:truncate">
                        {shortName(vehicle.name)}
                      </span>
                      <span className="block font-mono text-[11px] tracking-wide text-muted-foreground">
                        {vehicle.plate}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${getVehicleStatusDot(vehicle.status)}`}
                          aria-hidden
                        />
                        <span className="truncate">{getVehicleStatusLabel(vehicle.status)}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="eq-glass rounded-xl px-3.5 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

/** Etiqueta de status; o pulso so em "Em uso", que e o estado ao vivo. */
function StatusPill({ status }: { status: Vehicle["status"] }) {
  const isLive = status === "Em uso";
  const dot = getVehicleStatusDot(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${getVehicleStatusStyle(status)}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        {isLive ? <span className={`eq-pulse-ring absolute inset-0 rounded-full ${dot}`} /> : null}
        <span className={`relative h-2 w-2 rounded-full ${dot}`} />
      </span>
      {getVehicleStatusLabel(status)}
    </span>
  );
}

/* Todos os carros sao Renault: no seletor estreito a marca so empurra a cor para fora. */
function shortName(name: string) {
  return name.replace(/^Renault\s+/i, "");
}

function describeSchedule(vehicle: Vehicle, availability: ReservationAvailability[]) {
  const now = Date.now();
  const periods = availability
    .filter((period) => period.vehicleId === vehicle.id)
    .map((period) => ({ start: new Date(period.pickupDate), end: new Date(period.returnDate) }))
    .filter((period) => !Number.isNaN(period.start.getTime()) && period.end.getTime() > now)
    .sort((first, second) => first.start.getTime() - second.start.getTime());

  // O motorista pode retirar minutos antes do horario marcado: com o carro ja
  // em uso, o periodo ativo e o primeiro que ainda nao terminou.
  const current =
    periods.find((period) => period.start.getTime() <= now) ??
    (vehicle.status === "Em uso" ? periods[0] : undefined);

  return {
    current,
    next: periods.find((period) => period !== current && period.start.getTime() > now),
  };
}

const momentFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMoment(date: Date) {
  return momentFormatter.format(date).replace(",", " às");
}
