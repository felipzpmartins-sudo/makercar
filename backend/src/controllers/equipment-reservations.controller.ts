import type { Request, Response } from "express";

import type { RequestWithValidatedQuery } from "../middlewares/validate.middleware.js";
import { equipmentReservationsService } from "../services/equipment-reservations.service.js";
import { HttpError } from "../utils/http-error.js";

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, "Usuario nao autenticado.");
  return req.user;
}

export const equipmentReservationsController = {
  async list(req: Request, res: Response) {
    const query = (req as RequestWithValidatedQuery).validatedQuery ?? req.query;
    res.json(await equipmentReservationsService.list(requireUser(req), query));
  },

  async availability(_req: Request, res: Response) {
    res.json(await equipmentReservationsService.availability());
  },

  async summary(req: Request, res: Response) {
    res.json(await equipmentReservationsService.summary(requireUser(req)));
  },

  async get(req: Request, res: Response) {
    res.json(
      await equipmentReservationsService.get(
        String(req.params.id),
        requireUser(req),
      ),
    );
  },

  async create(req: Request, res: Response) {
    const reservation = await equipmentReservationsService.create(
      requireUser(req),
      req.body,
    );
    res.status(201).json(reservation);
  },

  async approve(req: Request, res: Response) {
    res.json(
      await equipmentReservationsService.approve(
        String(req.params.id),
        requireUser(req),
      ),
    );
  },

  async reject(req: Request, res: Response) {
    res.json(
      await equipmentReservationsService.reject(
        String(req.params.id),
        requireUser(req),
        req.body.reason,
      ),
    );
  },

  async cancel(req: Request, res: Response) {
    res.json(
      await equipmentReservationsService.cancel(
        String(req.params.id),
        requireUser(req),
        req.body?.reason,
      ),
    );
  },

  async complete(req: Request, res: Response) {
    res.json(
      await equipmentReservationsService.complete(
        String(req.params.id),
        requireUser(req),
      ),
    );
  },
};
