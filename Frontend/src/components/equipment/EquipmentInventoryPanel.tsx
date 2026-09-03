import { CalendarClock, MapPin, PackageSearch } from "lucide-react";

import { EmptyState } from "@/components/LoadingStates";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  equipmentStatusDots,
  equipmentStatusStyles,
  formatEquipmentPeriod,
  type Equipment,
  type EquipmentStatus,
} from "@/data/equipment";

interface EquipmentInventoryPanelProps {
  equipments: Equipment[];
  onChangeStatus: (equipmentId: string, status: EquipmentStatus) => void;
}

/*
 * Disponibilidade dos equipamentos.
 *
 * Aqui o administrador mexe apenas no que e decisao dele: liberar, colocar em
 * manutencao ou tirar de circulacao. "Reservado" e "Em uso" nao aparecem na
 * lista porque sao consequencia da agenda — se fossem editaveis, o status
 * gravado e o calendario passariam a discordar.
 */
const editableStatuses: EquipmentStatus[] = ["Disponível", "Em manutenção", "Indisponível"];

export function EquipmentInventoryPanel({
  equipments,
  onChangeStatus,
}: EquipmentInventoryPanelProps) {
  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Equipamentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle a disponibilidade de cada equipamento do catálogo.
        </p>
      </header>

      {equipments.length === 0 ? (
        <EmptyState
          icon={<PackageSearch />}
          title="Nenhum equipamento cadastrado"
          description="Cadastre um equipamento para que ele apareça no catálogo de reservas."
        />
      ) : (
        <div className="stagger grid gap-4 lg:grid-cols-2">
          {equipments.map((equipment) => (
            <article
              key={equipment.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
            >
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <div className="eq-stage relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  <div className="eq-halo opacity-60" />
                  <img
                    src={equipment.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="relative z-10 max-h-16 w-auto object-contain drop-shadow-lg"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold tracking-tight text-foreground">
                        {equipment.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {equipment.category.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${equipmentStatusStyles[equipment.effectiveStatus]}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${equipmentStatusDots[equipment.effectiveStatus]}`}
                        aria-hidden
                      />
                      {equipment.effectiveStatus}
                    </span>
                  </div>

                  {equipment.location ? (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{equipment.location}</span>
                    </p>
                  ) : null}

                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0">
                      {equipment.currentReservation
                        ? `Em uso: ${formatEquipmentPeriod(equipment.currentReservation)}`
                        : equipment.nextReservation
                          ? `Próxima: ${formatEquipmentPeriod(equipment.nextReservation)}`
                          : "Sem reservas agendadas"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                  <Label
                    htmlFor={`status-${equipment.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Disponibilidade definida pelo administrador
                  </Label>
                  {equipment.upcomingCount > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {equipment.upcomingCount}{" "}
                      {equipment.upcomingCount === 1
                        ? "reserva ativa na agenda"
                        : "reservas ativas na agenda"}
                    </p>
                  ) : null}
                </div>

                <div className="w-full sm:w-48">
                  <NativeSelect
                    id={`status-${equipment.id}`}
                    value={
                      editableStatuses.includes(equipment.status) ? equipment.status : "Disponível"
                    }
                    onChange={(event) =>
                      onChangeStatus(equipment.id, event.target.value as EquipmentStatus)
                    }
                  >
                    {editableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
