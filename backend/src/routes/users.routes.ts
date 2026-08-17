import { Router } from "express";

import { usersController } from "../controllers/users.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  reviewCnhSchema,
  updateUserSchema,
} from "../validators/users.validator.js";

export const usersRoutes = Router();

usersRoutes.get("/", authenticate, authorize("users:read"), asyncHandler(usersController.list));
usersRoutes.get("/:id", authenticate, authorize("users:read"), asyncHandler(usersController.get));
usersRoutes.post(
  "/",
  authenticate,
  authorize("users:manage"),
  validateBody(createUserSchema),
  asyncHandler(usersController.create),
);
usersRoutes.put(
  "/:id",
  authenticate,
  authorize("users:manage"),
  validateBody(updateUserSchema),
  asyncHandler(usersController.update),
);
usersRoutes.put(
  "/:id/cnh",
  authenticate,
  authorize("cnh:review"),
  validateBody(reviewCnhSchema),
  asyncHandler(usersController.reviewCnh),
);
usersRoutes.delete(
  "/:id",
  authenticate,
  authorize("users:manage"),
  asyncHandler(usersController.delete),
);
