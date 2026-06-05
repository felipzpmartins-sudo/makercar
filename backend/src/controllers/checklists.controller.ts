import type { Request, Response } from "express";

import { checklistsService } from "../services/checklists.service.js";

export const checklistsController = {
  async create(req: Request, res: Response) {
    const checklist = await checklistsService.create(req.body);
    res.status(201).json(checklist);
  },

  async get(req: Request, res: Response) {
    res.json(await checklistsService.get(String(req.params.id)));
  },
};
