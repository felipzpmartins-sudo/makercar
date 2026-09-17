import type { Request, Response } from "express";

import type { RequestWithValidatedQuery } from "../middlewares/validate.middleware.js";
import { meetingRoomReservationsService } from "../services/meeting-room-reservations.service.js";
import { HttpError } from "../utils/http-error.js";

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, "Usuário não autenticado.");
  return req.user;
}

export const meetingRoomReservationsController = {
  async list(req: Request, res: Response) {
    const query = (req as RequestWithValidatedQuery).validatedQuery ?? req.query;
    res.json(
      await meetingRoomReservationsService.list(requireUser(req), query),
    );
  },

  async availability(_req: Request, res: Response) {
    res.json(await meetingRoomReservationsService.availability());
  },

  async summary(req: Request, res: Response) {
    res.json(await meetingRoomReservationsService.summary(requireUser(req)));
  },

  async get(req: Request, res: Response) {
    res.json(
      await meetingRoomReservationsService.get(
        String(req.params.id),
        requireUser(req),
      ),
    );
  },

  async create(req: Request, res: Response) {
    const reservation = await meetingRoomReservationsService.create(
      requireUser(req),
      req.body,
    );
    res.status(201).json(reservation);
  },

  async cancel(req: Request, res: Response) {
    res.json(
      await meetingRoomReservationsService.cancel(
        String(req.params.id),
        requireUser(req),
        req.body?.reason,
      ),
    );
  },
};
