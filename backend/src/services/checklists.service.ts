import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/http-error.js";

export const checklistsService = {
  async create(data: {
    reservation_id: string;
    fuel_level: number;
    tires_ok: boolean;
    oil_ok: boolean;
    lights_ok: boolean;
    documents_ok: boolean;
    notes?: string | null;
  }) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservation_id },
    });
    if (!reservation) throw new HttpError(404, "Reserva não encontrada.");

    return prisma.vehicleChecklist.create({
      data: {
        reservationId: data.reservation_id,
        fuelLevel: data.fuel_level,
        tiresOk: data.tires_ok,
        oilOk: data.oil_ok,
        lightsOk: data.lights_ok,
        documentsOk: data.documents_ok,
        notes: data.notes,
      },
    });
  },

  async get(id: string) {
    const checklist = await prisma.vehicleChecklist.findUnique({
      where: { id },
      include: { reservation: { include: { vehicle: true, user: true } } },
    });
    if (!checklist) throw new HttpError(404, "Checklist não encontrado.");
    return checklist;
  },
};
