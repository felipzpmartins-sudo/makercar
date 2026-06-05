import { Router } from "express";

import { rolesController } from "../controllers/roles.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

export const rolesRoutes = Router();

rolesRoutes.use(authenticate, authorize("users:manage"));
rolesRoutes.get("/", asyncHandler(rolesController.list));
