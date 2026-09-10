import type { Request, Response } from "express";

import { meetingRoomsService } from "../services/meeting-rooms.service.js";
import { hasPermission } from "../utils/permissions.js";

export const meetingRoomsController = {
  async list(req: Request, res: Response) {
    // Sala desativada so aparece para quem administra o cadastro.
    const includeInactive =
      req.query.include_inactive === "true" &&
      Boolean(req.user && hasPermission(req.user.role, "rooms:manage"));
    res.json(await meetingRoomsService.list({ includeInactive }));
  },

  async get(req: Request, res: Response) {
    res.json(await meetingRoomsService.get(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await meetingRoomsService.create(req.body));
  },

  async update(req: Request, res: Response) {
    res.json(await meetingRoomsService.update(String(req.params.id), req.body));
  },
};
