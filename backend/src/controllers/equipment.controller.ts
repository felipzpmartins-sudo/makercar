import type { Request, Response } from "express";

import { equipmentReservationsService } from "../services/equipment-reservations.service.js";
import { equipmentService } from "../services/equipment.service.js";
import { hasPermission } from "../utils/permissions.js";

export const equipmentController = {
  async terms(_req: Request, res: Response) {
    res.json(equipmentReservationsService.getTerms());
  },

  async listCategories(_req: Request, res: Response) {
    res.json(await equipmentService.listCategories());
  },

  async list(req: Request, res: Response) {
    // Equipamento desativado so aparece para quem administra o catalogo.
    const includeInactive =
      req.query.include_inactive === "true" &&
      Boolean(req.user && hasPermission(req.user.role, "equipment:manage"));
    res.json(await equipmentService.list({ includeInactive }));
  },

  async get(req: Request, res: Response) {
    res.json(await equipmentService.get(String(req.params.id)));
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await equipmentService.create(req.body));
  },

  async update(req: Request, res: Response) {
    res.json(await equipmentService.update(String(req.params.id), req.body));
  },

  async createCategory(req: Request, res: Response) {
    res.status(201).json(await equipmentService.createCategory(req.body));
  },
};
