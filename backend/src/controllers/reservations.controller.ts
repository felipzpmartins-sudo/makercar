import type { Request, Response } from "express";

import { HttpError } from "../utils/http-error.js";
import type { RequestWithValidatedQuery } from "../middlewares/validate.middleware.js";
import { reservationsService } from "../services/reservations.service.js";

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, "Usuário não autenticado.");
  return req.user;
}

export const reservationsController = {
  async list(req: Request, res: Response) {
    const query = (req as RequestWithValidatedQuery).validatedQuery ?? req.query;
    res.json(await reservationsService.list(requireUser(req), query));
  },

  async get(req: Request, res: Response) {
    res.json(await reservationsService.get(String(req.params.id), requireUser(req)));
  },

  async create(req: Request, res: Response) {
    const reservation = await reservationsService.create(
      requireUser(req),
      req.body,
    );
    res.status(201).json(reservation);
  },

  async update(req: Request, res: Response) {
    res.json(
      await reservationsService.update(
        String(req.params.id),
        requireUser(req),
        req.body,
      ),
    );
  },

  async approve(req: Request, res: Response) {
    res.json(
      await reservationsService.approve(String(req.params.id), requireUser(req)),
    );
  },

  async cancel(req: Request, res: Response) {
    res.json(await reservationsService.cancel(String(req.params.id), requireUser(req)));
  },

  async finish(req: Request, res: Response) {
    res.json(await reservationsService.finish(String(req.params.id), requireUser(req)));
  },

  async pickup(req: Request, res: Response) {
    res.json(await reservationsService.pickup(String(req.params.id), requireUser(req), req.body));
  },

  async returnVehicle(req: Request, res: Response) {
    res.json(await reservationsService.returnVehicle(String(req.params.id), requireUser(req), req.body));
  },
};
