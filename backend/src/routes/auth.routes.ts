import { Router } from "express";

import { authController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../validators/auth.validator.js";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
authRoutes.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(authController.login),
);
authRoutes.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(authController.refresh),
);
authRoutes.post("/logout", asyncHandler(authController.logout));
