import { prisma } from "../database/prisma.js";

export const vehiclesRepository = {
  list() {
    return prisma.vehicle.findMany({
      where: { active: true },
      orderBy: { plate: "asc" },
    });
  },

  findById(id: string) {
    return prisma.vehicle.findUnique({ where: { id } });
  },
};
