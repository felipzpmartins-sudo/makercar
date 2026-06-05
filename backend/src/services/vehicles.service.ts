import { VehicleStatus } from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { vehiclesRepository } from "../repositories/vehicles.repository.js";
import { HttpError } from "../utils/http-error.js";

export const vehiclesService = {
  list() {
    return vehiclesRepository.list();
  },

  async get(id: string) {
    const vehicle = await vehiclesRepository.findById(id);
    if (!vehicle) throw new HttpError(404, "Veículo não encontrado.");
    return vehicle;
  },

  create(data: {
    name: string;
    plate: string;
    color: string;
    status?: VehicleStatus;
    mileage: number;
    fuel_type: string;
    transmission: string;
    capacity: number;
    image_url?: string | null;
    active?: boolean;
  }) {
    return prisma.vehicle.create({
      data: {
        name: data.name,
        plate: data.plate,
        color: data.color,
        status: data.status ?? "AVAILABLE",
        mileage: data.mileage,
        fuelType: data.fuel_type,
        transmission: data.transmission,
        capacity: data.capacity,
        imageUrl: data.image_url,
        active: data.active ?? true,
      },
    });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      plate: string;
      color: string;
      status: VehicleStatus;
      mileage: number;
      fuel_type: string;
      transmission: string;
      capacity: number;
      image_url: string | null;
      active: boolean;
    }>,
  ) {
    await vehiclesService.get(id);
    return prisma.vehicle.update({
      where: { id },
      data: {
        name: data.name,
        plate: data.plate,
        color: data.color,
        status: data.status,
        mileage: data.mileage,
        fuelType: data.fuel_type,
        transmission: data.transmission,
        capacity: data.capacity,
        imageUrl: data.image_url,
        active: data.active,
      },
    });
  },

  async delete(id: string) {
    await vehiclesService.get(id);
    return prisma.vehicle.update({
      where: { id },
      data: { active: false },
    });
  },
};
