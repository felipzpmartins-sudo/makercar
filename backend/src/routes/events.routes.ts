import { Router } from "express";

import { addRealtimeClient } from "../services/realtime.service.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const eventsRoutes = Router();

eventsRoutes.get("/", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  verifyAccessToken(token);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  addRealtimeClient(res);
});
