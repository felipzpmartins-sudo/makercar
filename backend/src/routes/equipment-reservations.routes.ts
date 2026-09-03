import { Router } from "express";

import { equipmentReservationsController } from "../controllers/equipment-reservations.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  cancelEquipmentReservationSchema,
  createEquipmentReservationSchema,
  listEquipmentReservationsQuerySchema,
  rejectEquipmentReservationSchema,
} from "../validators/equipment.validator.js";

export const equipmentReservationsRoutes = Router();

equipmentReservationsRoutes.use(authenticate);

// Rotas fixas antes de "/:id" para nao serem capturadas pelo parametro.
equipmentReservationsRoutes.get(
  "/availability",
  authorize("equipment:read"),
  asyncHandler(equipmentReservationsController.availability),
);
equipmentReservationsRoutes.get(
  "/summary",
  authorize("equipment-reservations:read-all"),
  asyncHandler(equipmentReservationsController.summary),
);
equipmentReservationsRoutes.get(
  "/",
  authorize("equipment:read"),
  validateQuery(listEquipmentReservationsQuerySchema),
  asyncHandler(equipmentReservationsController.list),
);
equipmentReservationsRoutes.get(
  "/:id",
  authorize("equipment:read"),
  asyncHandler(equipmentReservationsController.get),
);
equipmentReservationsRoutes.post(
  "/",
  authorize("equipment:reserve"),
  validateBody(createEquipmentReservationSchema),
  asyncHandler(equipmentReservationsController.create),
);
equipmentReservationsRoutes.post(
  "/:id/approve",
  authorize("equipment-reservations:review"),
  asyncHandler(equipmentReservationsController.approve),
);
equipmentReservationsRoutes.post(
  "/:id/reject",
  authorize("equipment-reservations:review"),
  validateBody(rejectEquipmentReservationSchema),
  asyncHandler(equipmentReservationsController.reject),
);
equipmentReservationsRoutes.post(
  "/:id/complete",
  authorize("equipment-reservations:review"),
  asyncHandler(equipmentReservationsController.complete),
);
// Cancelar nao usa authorize(): o dono cancela a propria solicitacao e o
// administrador cancela qualquer uma. Quem pode o que e decidido no service.
equipmentReservationsRoutes.post(
  "/:id/cancel",
  validateBody(cancelEquipmentReservationSchema),
  asyncHandler(equipmentReservationsController.cancel),
);
