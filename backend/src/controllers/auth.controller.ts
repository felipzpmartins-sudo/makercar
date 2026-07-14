import type { Request, Response } from "express";

import { authService } from "../services/auth.service.js";
import { HttpError } from "../utils/http-error.js";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refresh_token);
    res.json(result);
  },

  async updateCnh(req: Request, res: Response) {
    if (!req.user) throw new HttpError(401, "Usuario nao autenticado.");
    res.json(await authService.updateCnh(req.user.id, req.body));
  },

  async changePassword(req: Request, res: Response) {
    if (!req.user) {
      throw new HttpError(401, "Usuario nao autenticado.");
    }

    const result = await authService.changePassword(req.user.id, req.body.new_password);
    res.json(result);
  },

  async logout(_req: Request, res: Response) {
    res.status(204).send();
  },
};
