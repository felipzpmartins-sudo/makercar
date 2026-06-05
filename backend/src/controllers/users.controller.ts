import type { Request, Response } from "express";

import { usersService } from "../services/users.service.js";

export const usersController = {
  async list(_req: Request, res: Response) {
    res.json(await usersService.list());
  },

  async get(req: Request, res: Response) {
    res.json(await usersService.get(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    const user = await usersService.create(req.body);
    res.status(201).json(user);
  },

  async update(req: Request, res: Response) {
    res.json(await usersService.update(String(req.params.id), req.body));
  },

  async delete(req: Request, res: Response) {
    res.json(await usersService.delete(String(req.params.id)));
  },
};
