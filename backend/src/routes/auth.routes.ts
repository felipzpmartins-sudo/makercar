import { Router } from "express";

import { authController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateCnhSchema,
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
authRoutes.put(
  "/cnh",
  authenticate,
  validateBody(updateCnhSchema),
  asyncHandler(authController.updateCnh),
);
authRoutes.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
authRoutes.post("/logout", asyncHandler(authController.logout));
