import { VehicleStatus } from "@prisma/client";

import { prisma } from "../database/prisma.js";

export const dashboardService = {
  async summary() {
    const [totalVehicles, available, reserved, maintenance, inUse] =
      await Promise.all([
        prisma.vehicle.count({ where: { active: true } }),
        prisma.vehicle.count({
          where: { active: true, status: VehicleStatus.AVAILABLE },
        }),
        prisma.vehicle.count({
          where: { active: true, status: VehicleStatus.RESERVED },
        }),
        prisma.vehicle.count({
          where: { active: true, status: VehicleStatus.MAINTENANCE },
        }),
        prisma.vehicle.count({
          where: { active: true, status: VehicleStatus.IN_USE },
        }),
      ]);

    return {
      total_vehicles: totalVehicles,
      available,
      reserved,
      maintenance,
      in_use: inUse,
    };
  },
};
