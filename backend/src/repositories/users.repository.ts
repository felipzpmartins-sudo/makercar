import { prisma } from "../database/prisma.js";

export const usersRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { department: true, role: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { department: true, role: true },
    });
  },

  list() {
    return prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { department: true, role: true },
    });
  },
};
