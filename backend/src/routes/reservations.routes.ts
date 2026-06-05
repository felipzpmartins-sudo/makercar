import { Router } from "express";

import { reservationsController } from "../controllers/reservations.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  createReservationSchema,
  listReservationsQuerySchema,
  pickupReservationSchema,
  returnReservationSchema,
  updateReservationSchema,
} from "../validators/reservations.validator.js";

export const reservationsRoutes = Router();

reservationsRoutes.use(authenticate);
reservationsRoutes.get(
  "/",
  validateQuery(listReservationsQuerySchema),
  asyncHandler(reservationsController.list),
);
reservationsRoutes.get("/:id", asyncHandler(reservationsController.get));
reservationsRoutes.post(
  "/",
  authorize("reservations:create"),
  validateBody(createReservationSchema),
  asyncHandler(reservationsController.create),
);
reservationsRoutes.put(
  "/:id",
  validateBody(updateReservationSchema),
  asyncHandler(reservationsController.update),
);
reservationsRoutes.post(
  "/:id/approve",
  authorize("reservations:approve"),
  asyncHandler(reservationsController.approve),
);
reservationsRoutes.post(
  "/:id/cancel",
  asyncHandler(reservationsController.cancel),
);
reservationsRoutes.post(
  "/:id/pickup",
  validateBody(pickupReservationSchema),
  asyncHandler(reservationsController.pickup),
);
reservationsRoutes.post(
  "/:id/return",
  validateBody(returnReservationSchema),
  asyncHandler(reservationsController.returnVehicle),
);
reservationsRoutes.post(
  "/:id/finish",
  authorize("reservations:finish"),
  asyncHandler(reservationsController.finish),
);
