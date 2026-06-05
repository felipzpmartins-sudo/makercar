import { prisma } from "../database/prisma.js";

export const rolesService = {
  list() {
    return prisma.role.findMany({ orderBy: { name: "asc" } });
  },
};
