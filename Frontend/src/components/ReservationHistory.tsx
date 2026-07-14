import { CalendarX, History, KeyRound, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reservationStatusStyles, type Reservation } from "@/data/vehicles";

interface ReservationHistoryProps {
  reservations: Reservation[];
  showReason?: boolean;
  canManageReservations?: boolean;
  canOperateReservations?: boolean;
  onCancelReservation: (reservationId: string) => void;
  onRegisterPickup: (reservation: Reservation) => void;
  onRegisterReturn: (reservation: Reservation) => void;
}

export function ReservationHistory({
  reservations,
  showReason = true,
  canManageReservations = false,
  canOperateReservations = false,
  onCancelReservation,
  onRegisterPickup,
  onRegisterReturn,
}: ReservationHistoryProps) {
  return (
    <section
      id="historico"
      className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950">
            <History className="h-5 w-5 text-blue-600" />
            Histórico de reservas
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Reservas salvas na nuvem e atualizadas em tempo real.
          </p>
        </div>
        <span className="text-sm text-slate-500">{reservations.length} registros</span>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-medium text-slate-700">Nenhuma reserva registrada.</p>
          <p className="mt-1 text-sm text-slate-500">As próximas reservas aparecerão aqui.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Saída prevista</TableHead>
              <TableHead>Retorno previsto</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Status</TableHead>
              {canManageReservations || canOperateReservations ? (
                <TableHead className="text-right">Ações</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>
                  <div className="font-medium text-slate-950">{reservation.vehicleName}</div>
                  <div className="font-mono text-xs text-slate-500">{reservation.plate}</div>
                </TableCell>
                <TableCell>{reservation.requesterName}</TableCell>
                <TableCell>{reservation.department}</TableCell>
                <TableCell>
                  {formatDateTime(reservation.pickupDate, reservation.pickupTime)}
                </TableCell>
                <TableCell>
                  {formatDateTime(reservation.returnDate, reservation.returnTime)}
                </TableCell>
                <TableCell className="max-w-[220px] text-slate-600">
                  {showReason ? reservation.reason : "Restrito ao administrador"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${reservationStatusStyles[reservation.status]}`}
                  >
                    {reservation.status}
                  </span>
                </TableCell>
                {canManageReservations || canOperateReservations ? (
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={reservation.status !== "Reservado"}
                        onClick={() => onRegisterPickup(reservation)}
                      >
                        <KeyRound className="h-4 w-4" />
                        Retirada
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={reservation.status !== "Em uso"}
                        onClick={() => onRegisterReturn(reservation)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Devolução
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          canManageReservations
                            ? !["Reservado", "Em uso"].includes(reservation.status)
                            : reservation.status !== "Reservado"
                        }
                        onClick={() => onCancelReservation(reservation.id)}
                      >
                        <CalendarX className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function formatDateTime(date: string, time: string) {
  if (!date || !time) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
}
