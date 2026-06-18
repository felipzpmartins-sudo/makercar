import { prisma } from "../database/prisma.js";

const makerCarVehiclePlates = ["BKA3F78", "GAV6H84", "GEL8E37", "RBW5D42"];

export const vehiclesRepository = {
  list() {
    return prisma.vehicle.findMany({
      where: { active: true, plate: { in: makerCarVehiclePlates } },
      orderBy: { plate: "asc" },
    });
  },

  findById(id: string) {
    return prisma.vehicle.findUnique({ where: { id } });
  },
};
