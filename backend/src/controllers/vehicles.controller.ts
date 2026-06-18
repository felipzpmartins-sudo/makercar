import type { Request, Response } from "express";

import { HttpError } from "../utils/http-error.js";
import { vehiclesService } from "../services/vehicles.service.js";

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, "UsuÃ¡rio nÃ£o autenticado.");
  return req.user;
}

export const vehiclesController = {
  async list(_req: Request, res: Response) {
    res.json(await vehiclesService.list());
  },

  async get(req: Request, res: Response) {
    res.json(await vehiclesService.get(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    const vehicle = await vehiclesService.create(req.body);
    res.status(201).json(vehicle);
  },

  async update(req: Request, res: Response) {
    res.json(await vehiclesService.update(String(req.params.id), req.body));
  },

  async delete(req: Request, res: Response) {
    res.json(await vehiclesService.delete(String(req.params.id)));
  },

  async resetMileage(req: Request, res: Response) {
    res.json(await vehiclesService.resetMileage(String(req.params.id), requireUser(req)));
  },
};
