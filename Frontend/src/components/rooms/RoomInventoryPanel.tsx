import { CalendarClock, Clock, DoorOpen, MapPin, Users } from "lucide-react";

import { EmptyState } from "@/components/LoadingStates";
import { RoomPhoto } from "@/components/rooms/RoomPhoto";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  formatDateLabel,
  roomStatusDots,
  roomStatusStyles,
  todayValue,
  type MeetingRoom,
  type MeetingRoomStatus,
} from "@/data/meetingRooms";

interface RoomInventoryPanelProps {
  rooms: MeetingRoom[];
  onChangeStatus: (roomId: string, status: MeetingRoomStatus) => void;
}

/*
 * Disponibilidade das salas.
 *
 * Mesma regra do inventario de equipamentos: o administrador mexe so no que e
 * decisao dele — liberar, colocar em manutencao ou fechar a sala. "Reservada"
 * e "Em uso" saem da agenda e nao entram na lista; se fossem editaveis, o
 * status gravado e o calendario passariam a discordar.
 */
const editableStatuses: MeetingRoomStatus[] = ["Disponível", "Em manutenção", "Indisponível"];

export function RoomInventoryPanel({ rooms, onChangeStatus }: RoomInventoryPanelProps) {
  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Salas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle a disponibilidade de cada sala. Fechar uma sala não cancela as reservas já
          marcadas — cancele-as pela aba de reservas.
        </p>
      </header>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen />}
          title="Nenhuma sala cadastrada"
          description="Cadastre uma sala para que ela apareça no módulo de reservas."
        />
      ) : (
        <div className="stagger grid gap-4 lg:grid-cols-2">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
            >
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <span className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <RoomPhoto
                    src={room.image}
                    alt={room.name}
                    className="h-full w-full object-cover"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold tracking-tight text-foreground">
                        {room.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        até {room.capacity} pessoas
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${roomStatusStyles[room.effectiveStatus]}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${roomStatusDots[room.effectiveStatus]}`}
                        aria-hidden
                      />
                      {room.effectiveStatus}
                    </span>
                  </div>

                  {room.location ? (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{room.location}</span>
                    </p>
                  ) : null}

                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      {room.openingTime} às {room.closingTime}
                    </span>
                  </p>

                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0">{describeAgenda(room)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                  <Label
                    htmlFor={`room-status-${room.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Disponibilidade definida pelo administrador
                  </Label>
                  {room.upcomingCount > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {room.upcomingCount}{" "}
                      {room.upcomingCount === 1
                        ? "reunião ativa na agenda"
                        : "reuniões ativas na agenda"}
                    </p>
                  ) : null}
                </div>

                <div className="w-full sm:w-48">
                  <NativeSelect
                    id={`room-status-${room.id}`}
                    value={editableStatuses.includes(room.status) ? room.status : "Disponível"}
                    onChange={(event) =>
                      onChangeStatus(room.id, event.target.value as MeetingRoomStatus)
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

function describeAgenda(room: MeetingRoom) {
  if (room.currentReservation) {
    return `Ocupada até ${room.currentReservation.endTime}`;
  }
  if (room.nextReservation) {
    const day =
      room.nextReservation.startDate === todayValue()
        ? "hoje"
        : formatDateLabel(room.nextReservation.startDate);
    return `Próxima: ${day}, ${room.nextReservation.startTime} – ${room.nextReservation.endTime}`;
  }
  return "Sem reuniões agendadas";
}
