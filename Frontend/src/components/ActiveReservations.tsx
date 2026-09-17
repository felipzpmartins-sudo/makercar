import { KeyRound, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { reservationStatusStyles, type Reservation } from "@/data/vehicles";

interface ActiveReservationsProps {
  reservations: Reservation[];
  onRegisterPickup: (reservation: Reservation) => void;
  onRegisterReturn: (reservation: Reservation) => void;
}

/*
 * Reserva que pede uma acao do motorista agora.
 *
 * Retirada e devolucao moravam so no historico da aba Perfil. No celular essa
 * aba fica escondida no fim da barra que rola para o lado, abaixo dos dados da
 * conta, e o motorista parado ao lado do carro precisava procura-la. Aqui a
 * reserva em uso e a proxima reserva aprovada abrem o Inicio com o botao certo.
 */
export function ActiveReservations({
  reservations,
  onRegisterPickup,
  onRegisterReturn,
}: ActiveReservationsProps) {
  const inUse = reservations.filter((reservation) => reservation.status === "Em uso");
  const nextPickup = reservations
    .filter((reservation) => reservation.status === "Reservado")
    .sort((first, second) => startKey(first).localeCompare(startKey(second)))[0];
  const items = nextPickup ? [...inUse, nextPickup] : inUse;

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="active-reservations-title" className="space-y-3">
      <h2 id="active-reservations-title" className="text-lg font-semibold text-foreground">
        {items.length > 1 ? "Suas reservas" : "Sua reserva"}
      </h2>
      <div className="grid gap-3 xl:grid-cols-2">
        {items.map((reservation) => {
          const isInUse = reservation.status === "Em uso";
          return (
            <article
              key={reservation.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{reservation.vehicleName}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${reservationStatusStyles[reservation.status]}`}
                  >
                    {reservation.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{reservation.plate}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isInUse ? "Devolução prevista: " : "Retirada: "}
                  <span className="font-medium text-foreground">
                    {isInUse
                      ? formatMoment(reservation.returnDate, reservation.returnTime)
                      : formatMoment(reservation.pickupDate, reservation.pickupTime)}
                  </span>
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="h-11 w-full shrink-0 sm:w-auto"
                onClick={() =>
                  isInUse ? onRegisterReturn(reservation) : onRegisterPickup(reservation)
                }
              >
                {isInUse ? <RotateCcw /> : <KeyRound />}
                {isInUse ? "Registrar devolução" : "Registrar retirada"}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function startKey(reservation: Reservation) {
  return `${reservation.pickupDate}T${reservation.pickupTime}`;
}

/** "hoje, 14:00", "amanhã, 08:00" ou "18/09, 08:00". */
function formatMoment(date: string, time: string) {
  if (!date) return "-";
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const dayLabel =
    days === 0
      ? "hoje"
      : days === 1
        ? "amanhã"
        : `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  return time ? `${dayLabel}, ${time}` : dayLabel;
}
