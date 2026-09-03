import { Router } from "express";

import { equipmentController } from "../controllers/equipment.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createEquipmentCategorySchema,
  createEquipmentSchema,
  unlockEquipmentModuleSchema,
  updateEquipmentSchema,
} from "../validators/equipment.validator.js";

export const equipmentRoutes = Router();

equipmentRoutes.use(authenticate);

// Rotas de nome fixo antes de "/:id", senao caem na rota de detalhe.
// "access" e "unlock" nao exigem equipment:read: sao o que decide se a
// pessoa chega a ver o modulo.
equipmentRoutes.get("/access", asyncHandler(equipmentController.access));
equipmentRoutes.post(
  "/unlock",
  validateBody(unlockEquipmentModuleSchema),
  asyncHandler(equipmentController.unlock),
);
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
