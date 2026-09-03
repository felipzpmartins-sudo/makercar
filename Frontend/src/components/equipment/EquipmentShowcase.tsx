import { CalendarClock, MapPin } from "lucide-react";
import { useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  equipmentStatusDots,
  equipmentStatusStyles,
  formatDateLabel,
  formatEquipmentPeriod,
  isEquipmentReservable,
  type Equipment,
} from "@/data/equipment";

interface EquipmentShowcaseProps {
  equipments: Equipment[];
  selectedEquipment: Equipment;
  onSelectEquipment: (equipmentId: string) => void;
  onReserve: () => void;
}

/*
 * Vitrine do equipamento selecionado.
 *
 * O equipamento e o objeto principal da tela: fica grande, no centro, com luz
 * atras e sombra no chao. Tudo o mais — status, ficha, seletor — orbita a
 * imagem em superficies translucidas, sem competir com ela.
 *
 * A troca entre equipamentos remonta a imagem (key={id}), o que reexecuta a
 * animacao de entrada e faz a transicao parecer um corte de cena, nao um
 * troca-troca de src.
 */
export function EquipmentShowcase({
  equipments,
  selectedEquipment,
  onSelectEquipment,
  onReserve,
}: EquipmentShowcaseProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const status = selectedEquipment.effectiveStatus;
  const canReserve = isEquipmentReservable(selectedEquipment);

  /*
   * Parallax de poucos pixels seguindo o ponteiro. Escrito em variavel CSS
   * para nao provocar render do React a cada movimento do mouse.
   */
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const stage = stageRef.current;
    if (!stage) return;

    const bounds = stage.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
    stage.style.setProperty("--eq-px", (offsetX * 16).toFixed(2));
    stage.style.setProperty("--eq-py", (offsetY * 10).toFixed(2));
  }, []);

  const resetParallax = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--eq-px", "0");
    stage.style.setProperty("--eq-py", "0");
  }, []);

  return (
    <section className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetParallax}
          className="eq-stage eq-grid relative grid items-center gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8"
        >
          {/* Palco do equipamento */}
          <div className="relative flex min-h-[300px] items-end justify-center sm:min-h-[380px] lg:min-h-[440px]">
            <div className="eq-halo" />
            <div className="eq-floor bottom-6" />
            <img
              key={selectedEquipment.id}
              src={selectedEquipment.heroImage}
              alt={selectedEquipment.name}
              decoding="async"
              className="eq-robot eq-parallax relative z-10 max-h-[280px] w-auto max-w-full object-contain drop-shadow-2xl sm:max-h-[350px] lg:max-h-[410px]"
            />
          </div>

          {/* Ficha do equipamento */}
          <div className="relative z-10 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary-subtle px-2.5 py-1 text-xs font-medium leading-none text-primary-subtle-foreground">
                {selectedEquipment.category.name}
              </span>
              <StatusPill status={status} />
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {selectedEquipment.name}
            </h2>

            {selectedEquipment.description ? (
              <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {selectedEquipment.description}
              </p>
            ) : null}

            {selectedEquipment.specs.length > 0 ? (
              <dl className="mt-5 grid grid-cols-2 gap-2.5">
                {selectedEquipment.specs.map((spec) => (
                  <div key={spec.label} className="eq-glass rounded-xl px-3.5 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-5 space-y-2 text-sm">
              {selectedEquipment.location ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{selectedEquipment.location}</span>
                </p>
              ) : null}

              {/* A proxima reserva evita a frustracao de preencher o formulario
                  inteiro para so entao descobrir que o periodo esta ocupado. */}
              {selectedEquipment.currentReservation ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
                  <span>
                    Em uso até{" "}
                    <strong className="font-medium text-foreground">
                      {formatDateLabel(selectedEquipment.currentReservation.endDate)} às{" "}
                      {selectedEquipment.currentReservation.endTime}
                    </strong>
                  </span>
                </p>
              ) : selectedEquipment.nextReservation ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <span>
                    Próxima reserva:{" "}
                    <strong className="font-medium text-foreground">
                      {formatEquipmentPeriod(selectedEquipment.nextReservation)}
                    </strong>
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>Nenhuma reserva agendada para os próximos dias.</span>
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="lg"
                onClick={onReserve}
                disabled={!canReserve}
                className="w-full shadow-sm hover:bg-primary disabled:bg-muted disabled:shadow-none sm:w-auto"
              >
                {canReserve ? "Reservar equipamento" : "Indisponível"}
              </Button>
              {!canReserve ? (
                <p className="text-xs text-muted-foreground">
                  Este equipamento está {status.toLowerCase()} e não aceita novas solicitações.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Seletor: so aparece quando ha mais de um equipamento para trocar. */}
        {equipments.length > 1 ? (
          <div className="border-t border-border bg-card p-3 sm:p-4">
            <div className="scrollbar-slim flex snap-x gap-3 overflow-x-auto">
              {equipments.map((equipment) => {
                const isActive = equipment.id === selectedEquipment.id;
                return (
                  <button
                    key={equipment.id}
                    type="button"
                    onClick={() => onSelectEquipment(equipment.id)}
                    aria-pressed={isActive}
                    className={[
                      "group flex min-w-[190px] shrink-0 snap-start items-center gap-3 rounded-xl border p-2.5 text-left",
                      "transition-[border-color,background-color,transform] duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "eq-card-active border-primary/40 bg-primary-subtle/50"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-border-strong",
                    ].join(" ")}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70">
                      <img
                        src={equipment.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="max-h-10 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-110"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {equipment.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${equipmentStatusDots[equipment.effectiveStatus]}`}
                          aria-hidden
                        />
                        <span className="truncate">{equipment.effectiveStatus}</span>
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

/** Etiqueta de status com ponto pulsante — o pulso so em "Em uso", que e ao vivo. */
function StatusPill({ status }: { status: Equipment["effectiveStatus"] }) {
  const isLive = status === "Em uso";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${equipmentStatusStyles[status]}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        {isLive ? (
          <span
            className={`eq-pulse-ring absolute inset-0 rounded-full ${equipmentStatusDots[status]}`}
          />
        ) : null}
        <span className={`relative h-2 w-2 rounded-full ${equipmentStatusDots[status]}`} />
      </span>
      {status}
    </span>
  );
}
