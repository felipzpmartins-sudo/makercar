import { Router } from "express";

import { meetingRoomReservationsController } from "../controllers/meeting-room-reservations.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  cancelMeetingRoomReservationSchema,
  createMeetingRoomReservationSchema,
  listMeetingRoomReservationsQuerySchema,
} from "../validators/meeting-rooms.validator.js";

export const meetingRoomReservationsRoutes = Router();

meetingRoomReservationsRoutes.use(authenticate);

// Rotas fixas antes de "/:id" para nao serem capturadas pelo parametro.
meetingRoomReservationsRoutes.get(
  "/availability",
  authorize("rooms:read"),
  asyncHandler(meetingRoomReservationsController.availability),
);
meetingRoomReservationsRoutes.get(
  "/summary",
  authorize("room-reservations:read-all"),
  asyncHandler(meetingRoomReservationsController.summary),
);
meetingRoomReservationsRoutes.get(
  "/",
  authorize("rooms:read"),
  validateQuery(listMeetingRoomReservationsQuerySchema),
  asyncHandler(meetingRoomReservationsController.list),
);
meetingRoomReservationsRoutes.get(
  "/:id",
  authorize("rooms:read"),
  asyncHandler(meetingRoomReservationsController.get),
);
meetingRoomReservationsRoutes.post(
  "/",
  authorize("rooms:reserve"),
  validateBody(createMeetingRoomReservationSchema),
  asyncHandler(meetingRoomReservationsController.create),
);
// Cancelar nao usa authorize(): o dono cancela a propria reserva e o
// administrador cancela qualquer uma. Quem pode o que e decidido no service.
meetingRoomReservationsRoutes.post(
  "/:id/cancel",
  validateBody(cancelMeetingRoomReservationSchema),
  asyncHandler(meetingRoomReservationsController.cancel),
);
