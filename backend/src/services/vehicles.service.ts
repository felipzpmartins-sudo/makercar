import { VehicleStatus } from "@prisma/client";

import { prisma } from "../database/prisma.js";
import { vehiclesRepository } from "../repositories/vehicles.repository.js";
import { HttpError } from "../utils/http-error.js";
import { isSupremeOwner } from "../utils/permissions.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { publishFleetUpdate } from "./realtime.service.js";

export const vehiclesService = {
  list() {
    return vehiclesRepository.list();
  },

  async get(id: string) {
    const vehicle = await vehiclesRepository.findById(id);
    if (!vehicle) throw new HttpError(404, "Veículo não encontrado.");
    return vehicle;
  },

  async create(data: {
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
    const vehicle = await prisma.vehicle.create({
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
    publishFleetUpdate({ entity: "vehicle", id: vehicle.id });
    return vehicle;
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
    const currentVehicle = await vehiclesService.get(id);
    if (
      data.mileage !== undefined &&
      data.mileage < currentVehicle.mileage
    ) {
      throw new HttpError(
        400,
        `KM informado (${data.mileage}) nao pode ser menor que o KM atual do veiculo (${currentVehicle.mileage}).`,
      );
    }

    const vehicle = await prisma.vehicle.update({
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
    publishFleetUpdate({ entity: "vehicle", id });
    return vehicle;
  },

  async delete(id: string) {
    await vehiclesService.get(id);
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { active: false },
    });
    publishFleetUpdate({ entity: "vehicle", id });
    return vehicle;
  },

  async resetMileage(id: string, user: AccessTokenPayload) {
    if (!isSupremeOwner(user)) {
      throw new HttpError(403, "Apenas o dono pode zerar KM dos veiculos.");
    }

    await vehiclesService.get(id);
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { mileage: 0 },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "RESET_MILEAGE",
        entity: "Vehicle",
        entityId: id,
      },
    });
    publishFleetUpdate({ entity: "vehicle", id });
    return vehicle;
  },
};
