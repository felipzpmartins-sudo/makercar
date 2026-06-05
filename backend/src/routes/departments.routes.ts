import { Router } from "express";

import { departmentsController } from "../controllers/departments.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

export const departmentsRoutes = Router();

departmentsRoutes.use(authenticate, authorize("departments:read"));
departmentsRoutes.get("/", asyncHandler(departmentsController.list));
