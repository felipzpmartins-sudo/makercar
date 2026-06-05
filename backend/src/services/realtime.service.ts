import type { Response } from "express";

type RealtimeEvent = {
  type: "fleet:update" | "users:update";
  entity: "reservation" | "vehicle" | "user";
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

export function publishUsersUpdate(id?: string) {
  const payload: RealtimeEvent = { type: "users:update", entity: "user", id };

  for (const client of clients) {
    client.write(`event: users:update\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
