import { Router } from "express";

import { meetingRoomsController } from "../controllers/meeting-rooms.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createMeetingRoomSchema,
  updateMeetingRoomSchema,
} from "../validators/meeting-rooms.validator.js";

export const meetingRoomsRoutes = Router();

meetingRoomsRoutes.use(authenticate);

meetingRoomsRoutes.get(
  "/",
  authorize("rooms:read"),
  asyncHandler(meetingRoomsController.list),
);
meetingRoomsRoutes.get(
  "/:id",
  authorize("rooms:read"),
  asyncHandler(meetingRoomsController.get),
);
meetingRoomsRoutes.post(
  "/",
  authorize("rooms:manage"),
  validateBody(createMeetingRoomSchema),
  asyncHandler(meetingRoomsController.create),
);
meetingRoomsRoutes.put(
  "/:id",
  authorize("rooms:manage"),
  validateBody(updateMeetingRoomSchema),
  asyncHandler(meetingRoomsController.update),
);
