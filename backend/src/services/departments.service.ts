import { prisma } from "../database/prisma.js";

export const departmentsService = {
  list() {
    return prisma.department.findMany({ orderBy: { name: "asc" } });
  },
};
