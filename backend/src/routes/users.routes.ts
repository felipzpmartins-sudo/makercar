import { Router } from "express";

import { usersController } from "../controllers/users.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/users.validator.js";

export const usersRoutes = Router();

usersRoutes.use(authenticate, authorize("users:manage"));
usersRoutes.get("/", asyncHandler(usersController.list));
usersRoutes.get("/:id", asyncHandler(usersController.get));
usersRoutes.post(
  "/",
  validateBody(createUserSchema),
  asyncHandler(usersController.create),
);
usersRoutes.put(
  "/:id",
  validateBody(updateUserSchema),
  asyncHandler(usersController.update),
);
usersRoutes.delete("/:id", asyncHandler(usersController.delete));
