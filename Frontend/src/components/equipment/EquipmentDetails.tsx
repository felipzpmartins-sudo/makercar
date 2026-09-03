import { Info, MapPin, ShieldAlert, Tag } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  equipmentStatusDots,
  equipmentStatusStyles,
  isEquipmentReservable,
  type Equipment,
} from "@/data/equipment";

interface EquipmentDetailsProps {
  equipment: Equipment;
  onReserve: () => void;
}

/*
 * Detalhes do equipamento.
 *
 * A vitrine acima ja mostra nome, status e ficha rapida. Aqui fica o que a
 * pessoa precisa ler antes de assumir a responsabilidade: onde o equipamento
 * mora, o que observar e as regras de utilizacao.
 */
export function EquipmentDetails({ equipment, onReserve }: EquipmentDetailsProps) {
  const canReserve = isEquipmentReservable(equipment);
  const rules = splitIntoItems(equipment.usageRules);

  return (
    <section className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Informações do equipamento
        </h3>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailItem icon={<Tag className="h-4 w-4 text-primary" />} label="Tipo">
            {equipment.category.name}
          </DetailItem>

          <DetailItem icon={<Info className="h-4 w-4 text-primary" />} label="Disponibilidade">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${equipmentStatusStyles[equipment.effectiveStatus]}`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${equipmentStatusDots[equipment.effectiveStatus]}`}
                aria-hidden
              />
              {equipment.effectiveStatus}
            </span>
          </DetailItem>

          <DetailItem
            icon={<MapPin className="h-4 w-4 text-primary" />}
            label="Local / base"
            className="sm:col-span-2"
          >
            {equipment.location || "Não informado"}
          </DetailItem>
        </dl>

        {equipment.notes ? (
          <div className="mt-4 rounded-xl border border-info/25 bg-info-subtle px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-info-subtle-foreground">
              Observações
            </p>
            <p className="mt-1.5 text-sm leading-6 text-info-subtle-foreground">
              {equipment.notes}
            </p>
          </div>
        ) : null}
      </div>

      {rules.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <ShieldAlert className="h-4.5 w-4.5 text-warning" aria-hidden />
            Regras de utilização
          </h3>
          <ul className="mt-3.5 space-y-2.5">
            {rules.map((rule) => (
              <li
                key={rule}
                className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground"
              >
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-warning" aria-hidden />
                {rule}
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-border pt-5">
            <Button
              type="button"
              onClick={onReserve}
              disabled={!canReserve}
              className="w-full shadow-sm hover:bg-primary disabled:bg-muted disabled:shadow-none sm:w-auto"
            >
              {canReserve ? "Reservar equipamento" : "Indisponível"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DetailItem({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-muted p-3.5 ${className ?? ""}`}>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/*
 * As regras sao cadastradas como texto corrido. Quebrar por ponto final deixa
 * cada obrigacao numa linha propria — um paragrafo unico nesta tela vira um
 * bloco que ninguem le.
 */
function splitIntoItems(value: string) {
  return value
    .split(/(?<=\.)\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
