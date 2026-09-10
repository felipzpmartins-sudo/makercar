import { CalendarClock, Clock, MapPin, Users } from "lucide-react";

import { RoomPhoto } from "@/components/rooms/RoomPhoto";
import { Button } from "@/components/ui/button";
import {
  formatDateLabel,
  isRoomReservable,
  roomStatusDots,
  roomStatusStyles,
  todayValue,
  type MeetingRoom,
} from "@/data/meetingRooms";

interface RoomShowcaseProps {
  rooms: MeetingRoom[];
  selectedRoom: MeetingRoom;
  onSelectRoom: (roomId: string) => void;
  onReserve: () => void;
}

/*
 * Vitrine da sala selecionada.
 *
 * Sala nao e objeto: nao ganha o palco com halo e sombra que os robos tem no
 * modulo de equipamentos. Uma sala se mostra como ambiente — foto ocupando a
 * largura, em proporcao de foto mesmo, com a ficha ao lado. O que a pessoa
 * quer saber olhando isto e "cabe a minha reuniao e esta livre agora?".
 */
export function RoomShowcase({ rooms, selectedRoom, onSelectRoom, onReserve }: RoomShowcaseProps) {
  const status = selectedRoom.effectiveStatus;
  const canReserve = isRoomReservable(selectedRoom);
  const hasPhoto = Boolean(selectedRoom.heroImage);

  return (
    <section className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid items-stretch gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Foto do ambiente */}
          <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted lg:aspect-auto lg:min-h-[420px]">
            <RoomPhoto
              key={selectedRoom.id}
              src={selectedRoom.heroImage}
              alt={`Foto da ${selectedRoom.name}`}
              loading="eager"
              className="animate-fade-rise h-full w-full object-cover"
            />
            {/* Véu inferior: o status fica legível sobre qualquer foto. Só
                entra quando há foto — sobre o espaço vazio ele viraria uma
                mancha escura sem motivo. */}
            {hasPhoto ? (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent"
                aria-hidden
              />
            ) : null}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
              <StatusPill status={status} />
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${
                  hasPhoto
                    ? "bg-black/45 text-white backdrop-blur-sm"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                }`}
              >
                <Users className="h-3.5 w-3.5" aria-hidden />
                até {selectedRoom.capacity} pessoas
              </span>
            </div>
          </div>

          {/* Ficha da sala */}
          <div className="min-w-0 p-5 sm:p-7">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {selectedRoom.name}
            </h2>

            {selectedRoom.description ? (
              <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {selectedRoom.description}
              </p>
            ) : null}

            {selectedRoom.amenities.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {selectedRoom.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-5 space-y-2 text-sm">
              {selectedRoom.location ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{selectedRoom.location}</span>
                </p>
              ) : null}

              <p className="flex items-start gap-2 text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Aberta das{" "}
                  <strong className="font-medium text-foreground">
                    {selectedRoom.openingTime}
                  </strong>{" "}
                  às{" "}
                  <strong className="font-medium text-foreground">
                    {selectedRoom.closingTime}
                  </strong>
                </span>
              </p>

              {/* O que ocupa a sala agora — evita subir até a agenda para ver. */}
              {selectedRoom.currentReservation ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
                  <span>
                    Ocupada até{" "}
                    <strong className="font-medium text-foreground">
                      {selectedRoom.currentReservation.endTime}
                    </strong>
                    {selectedRoom.currentReservation.requesterName
                      ? ` — ${selectedRoom.currentReservation.title ?? "reunião"} (${firstName(
                          selectedRoom.currentReservation.requesterName,
                        )})`
                      : null}
                  </span>
                </p>
              ) : selectedRoom.nextReservation ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <span>
                    Livre agora. Próxima reunião:{" "}
                    <strong className="font-medium text-foreground">
                      {selectedRoom.nextReservation.startDate === todayValue()
                        ? "hoje"
                        : formatDateLabel(selectedRoom.nextReservation.startDate)}
                      , {selectedRoom.nextReservation.startTime} –{" "}
                      {selectedRoom.nextReservation.endTime}
                    </strong>
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>Nenhuma reunião marcada nos próximos dias.</span>
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
                {canReserve ? "Reservar horário" : "Indisponível"}
              </Button>
              {!canReserve ? (
                <p className="text-xs text-muted-foreground">
                  Esta sala está {status.toLowerCase()} e não aceita novas reservas.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A reserva é confirmada na hora, sem aprovação.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seletor: so aparece quando ha mais de uma sala para trocar. */}
        {rooms.length > 1 ? (
          <div className="border-t border-border bg-card p-3 sm:p-4">
            <div className="scrollbar-slim flex snap-x gap-3 overflow-x-auto">
              {rooms.map((room) => {
                const isActive = room.id === selectedRoom.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onSelectRoom(room.id)}
                    aria-pressed={isActive}
                    className={[
                      "group flex min-w-[210px] shrink-0 snap-start items-center gap-3 rounded-xl border p-2.5 text-left",
                      "transition-[border-color,background-color,transform] duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "eq-card-active border-primary/40 bg-primary-subtle/50"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-border-strong",
                    ].join(" ")}
                  >
                    <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted/70">
                      <RoomPhoto
                        src={room.image}
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {room.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${roomStatusDots[room.effectiveStatus]}`}
                          aria-hidden
                        />
                        <span className="truncate">{room.effectiveStatus}</span>
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

function firstName(value: string) {
  return value.trim().split(/\s+/)[0];
}

/** Etiqueta de status com ponto pulsante — o pulso so em "Em uso", que e ao vivo. */
function StatusPill({ status }: { status: MeetingRoom["effectiveStatus"] }) {
  const isLive = status === "Em uso";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium leading-none shadow-sm ${roomStatusStyles[status]}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        {isLive ? (
          <span
            className={`eq-pulse-ring absolute inset-0 rounded-full ${roomStatusDots[status]}`}
          />
        ) : null}
        <span className={`relative h-2 w-2 rounded-full ${roomStatusDots[status]}`} />
      </span>
      {status}
    </span>
  );
}
