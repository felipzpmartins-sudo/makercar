import { Router } from "express";

import { equipmentController } from "../controllers/equipment.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createEquipmentCategorySchema,
  createEquipmentSchema,
  updateEquipmentSchema,
} from "../validators/equipment.validator.js";

export const equipmentRoutes = Router();

equipmentRoutes.use(authenticate);

// O termo precisa vir antes de "/:id" — senao "terms" cai na rota de detalhe.
equipmentRoutes.get("/terms", asyncHandler(equipmentController.terms));
equipmentRoutes.get(
  "/categories",
  authorize("equipment:read"),
  asyncHandler(equipmentController.listCategories),
);
equipmentRoutes.post(
  "/categories",
  authorize("equipment:manage"),
  validateBody(createEquipmentCategorySchema),
  asyncHandler(equipmentController.createCategory),
);
equipmentRoutes.get(
  "/",
  authorize("equipment:read"),
  asyncHandler(equipmentController.list),
);
equipmentRoutes.get(
  "/:id",
  authorize("equipment:read"),
  asyncHandler(equipmentController.get),
);
equipmentRoutes.post(
  "/",
  authorize("equipment:manage"),
  validateBody(createEquipmentSchema),
  asyncHandler(equipmentController.create),
);
equipmentRoutes.put(
  "/:id",
  authorize("equipment:manage"),
  validateBody(updateEquipmentSchema),
  asyncHandler(equipmentController.update),
);
