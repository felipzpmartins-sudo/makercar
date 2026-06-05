import { prisma } from "../database/prisma.js";

export const reservationsRepository = {
  findById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: { include: { department: true, role: true } },
        logs: { orderBy: { createdAt: "desc" } },
        checklist: true,
      },
    });
  },
};
