import type { Response } from "express";

type RealtimeEvent = {
  type: "fleet:update" | "users:update" | "equipment:update" | "rooms:update";
  entity:
    | "reservation"
    | "vehicle"
    | "user"
    | "equipment"
    | "equipment-reservation"
    | "room"
    | "room-reservation";
  id?: string;
};

const clients = new Set<Response>();

export function addRealtimeClient(res: Response) {
  clients.add(res);
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  const ping = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
  }, 25_000);

  res.on("close", () => {
    clearInterval(ping);
    clients.delete(res);
  });
}

export function publishFleetUpdate(event: Omit<RealtimeEvent, "type">) {
  const payload: RealtimeEvent = { type: "fleet:update", ...event };

  for (const client of clients) {
    client.write(`event: fleet:update\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

/*
 * Reservas de equipamento correm em canal proprio: quem esta na tela da
 * frota nao precisa recarregar por causa de um robo, e vice-versa.
 */
export function publishEquipmentUpdate(event: Omit<RealtimeEvent, "type">) {
  const payload: RealtimeEvent = { type: "equipment:update", ...event };

  for (const client of clients) {
    client.write(`event: equipment:update\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

/*
 * Salas seguem a mesma separacao dos equipamentos: quem esta escolhendo um
 * horario na Sala 2 nao deve ter a tela recarregada porque um carro saiu.
 */
export function publishRoomsUpdate(event: Omit<RealtimeEvent, "type">) {
  const payload: RealtimeEvent = { type: "rooms:update", ...event };

  for (const client of clients) {
    client.write(`event: rooms:update
`);
    client.write(`data: ${JSON.stringify(payload)}

`);
  }
}

export function publishUsersUpdate(id?: string) {
  const payload: RealtimeEvent = { type: "users:update", entity: "user", id };

  for (const client of clients) {
    client.write(`event: users:update\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
