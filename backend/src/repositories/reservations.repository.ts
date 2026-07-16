import { prisma } from "../database/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  cnhNumber: true,
  cnhExpiresAt: true,
  cnhPhotoUrl: true,
  cnhStatus: true,
  cnhReviewedAt: true,
  department: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
};

export const reservationsRepository = {
  findById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: { select: userSelect },
        reviewedBy: { select: userSelect },
        logs: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: { select: { id: true, name: true } },
                role: { select: { id: true, name: true } },
              },
            },
          },
        },
        checklist: true,
        odometerRecords: {
          orderBy: { occurredAt: "asc" },
          include: {
            vehicle: true,
            createdBy: { select: userSelect },
          },
        },
      },
    });
  },
};
