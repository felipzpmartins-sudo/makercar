import type { Request, Response } from "express";

import { authService } from "../services/auth.service.js";

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

  async logout(_req: Request, res: Response) {
    res.status(204).send();
  },
};
