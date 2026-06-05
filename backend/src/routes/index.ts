import { Router } from "express";

import { authRoutes } from "./auth.routes.js";
import { checklistsRoutes } from "./checklists.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { departmentsRoutes } from "./departments.routes.js";
import { eventsRoutes } from "./events.routes.js";
import { reservationsRoutes } from "./reservations.routes.js";
import { rolesRoutes } from "./roles.routes.js";
import { usersRoutes } from "./users.routes.js";
import { vehiclesRoutes } from "./vehicles.routes.js";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "makercar-api" });
});

routes.use("/auth", authRoutes);
routes.use("/users", usersRoutes);
routes.use("/roles", rolesRoutes);
routes.use("/departments", departmentsRoutes);
routes.use("/events", eventsRoutes);
routes.use("/vehicles", vehiclesRoutes);
routes.use("/reservations", reservationsRoutes);
routes.use("/checklists", checklistsRoutes);
routes.use("/dashboard", dashboardRoutes);
