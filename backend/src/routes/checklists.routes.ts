import { Router } from "express";

import { checklistsController } from "../controllers/checklists.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createChecklistSchema } from "../validators/checklists.validator.js";

export const checklistsRoutes = Router();

checklistsRoutes.use(authenticate);
checklistsRoutes.post(
  "/",
  authorize("checklists:manage"),
  validateBody(createChecklistSchema),
  asyncHandler(checklistsController.create),
);
checklistsRoutes.get(
  "/:id",
  authorize("checklists:manage"),
  asyncHandler(checklistsController.get),
);
