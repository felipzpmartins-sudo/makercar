import { Router } from "express";

import { vehiclesController } from "../controllers/vehicles.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../validators/vehicles.validator.js";

export const vehiclesRoutes = Router();

vehiclesRoutes.use(authenticate);
vehiclesRoutes.get(
  "/",
  authorize("vehicles:read"),
  asyncHandler(vehiclesController.list),
);
vehiclesRoutes.get(
  "/:id",
  authorize("vehicles:read"),
  asyncHandler(vehiclesController.get),
);
vehiclesRoutes.post(
  "/",
  authorize("vehicles:manage"),
  validateBody(createVehicleSchema),
  asyncHandler(vehiclesController.create),
);
vehiclesRoutes.put(
  "/:id",
  authorize("vehicles:manage"),
  validateBody(updateVehicleSchema),
  asyncHandler(vehiclesController.update),
);
vehiclesRoutes.delete(
  "/:id",
  authorize("vehicles:manage"),
  asyncHandler(vehiclesController.delete),
);
