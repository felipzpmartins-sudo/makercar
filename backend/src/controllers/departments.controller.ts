import type { Request, Response } from "express";

import { departmentsService } from "../services/departments.service.js";

export const departmentsController = {
  async list(_req: Request, res: Response) {
    res.json(await departmentsService.list());
  },
};
