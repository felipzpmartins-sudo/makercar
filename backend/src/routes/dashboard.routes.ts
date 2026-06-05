import { Router } from "express";

import { dashboardController } from "../controllers/dashboard.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate, authorize("dashboard:read"));
dashboardRoutes.get("/summary", asyncHandler(dashboardController.summary));
