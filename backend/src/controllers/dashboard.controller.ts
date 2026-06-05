import type { Request, Response } from "express";

import { dashboardService } from "../services/dashboard.service.js";

export const dashboardController = {
  async summary(_req: Request, res: Response) {
    res.json(await dashboardService.summary());
  },
};
