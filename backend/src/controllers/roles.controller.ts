import type { Request, Response } from "express";

import { rolesService } from "../services/roles.service.js";

export const rolesController = {
  async list(_req: Request, res: Response) {
    res.json(await rolesService.list());
  },
};
