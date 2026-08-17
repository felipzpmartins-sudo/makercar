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
  changeReservationVehicleSchema,
  listReservationsQuerySchema,
  pickupReservationSchema,
  rejectReservationSchema,
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
reservationsRoutes.get(
  "/availability",
  asyncHandler(reservationsController.availability),
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
reservationsRoutes.put(
  "/:id/vehicle",
  authorize("reservations:finish"),
  validateBody(changeReservationVehicleSchema),
  asyncHandler(reservationsController.changeVehicle),
);
reservationsRoutes.post(
  "/:id/cancel",
  asyncHandler(reservationsController.cancel),
);
reservationsRoutes.post(
  "/:id/approve",
  authorize("reservations:finish"),
  asyncHandler(reservationsController.approve),
);
reservationsRoutes.post(
  "/:id/reject",
  authorize("reservations:finish"),
  validateBody(rejectReservationSchema),
  asyncHandler(reservationsController.reject),
);
reservationsRoutes.delete(
  "/:id",
  authorize("reservations:delete-history"),
  asyncHandler(reservationsController.deleteHistory),
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
