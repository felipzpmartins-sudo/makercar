import type { Reservation, Vehicle, VehicleStatus } from "@/data/vehicles";
import { apiRequest } from "@/services/apiClient";

type ApiVehicleStatus = "AVAILABLE" | "IN_USE" | "RESERVED" | "MAINTENANCE" | "UNAVAILABLE";

interface ApiVehicle {
  id: string;
  name: string;
  plate: string;
  color: string;
  status: ApiVehicleStatus;
  mileage: number;
  fuelType: string;
  transmission: string;
  capacity: number;
  imageUrl?: string | null;
}

const AVAILABLE_LABEL = "Dispon\u00edvel" as VehicleStatus;
const MAINTENANCE_LABEL = "Em manuten\u00e7\u00e3o" as VehicleStatus;
const UNAVAILABLE_LABEL = "Indispon\u00edvel" as VehicleStatus;

const statusFromApi: Record<ApiVehicleStatus, VehicleStatus> = {
  AVAILABLE: AVAILABLE_LABEL,
  RESERVED: "Reservado",
  IN_USE: "Em uso",
  MAINTENANCE: MAINTENANCE_LABEL,
  UNAVAILABLE: UNAVAILABLE_LABEL,
};

function toApiStatus(status: VehicleStatus): ApiVehicleStatus {
  if (status === AVAILABLE_LABEL) return "AVAILABLE";
  if (status === "Em uso") return "IN_USE";
  if (status === MAINTENANCE_LABEL) return "MAINTENANCE";
  if (status === UNAVAILABLE_LABEL) return "UNAVAILABLE";
  return "RESERVED";
}

const colorImages: Record<string, string> = {
  Branco: "/makercar-assets/kwid-white.png",
  Preto: "/makercar-assets/kwid-black.png",
  Prata: "/makercar-assets/kwid-silver.png",
};

function normalizeVehicle(vehicle: ApiVehicle): Vehicle {
  return {
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plate,
    status: statusFromApi[vehicle.status],
    color: vehicle.color as Vehicle["color"],
    km: vehicle.mileage,
    fuel: vehicle.fuelType,
    transmission: vehicle.transmission,
    capacity: `${vehicle.capacity} lugares`,
    image: vehicle.imageUrl ?? colorImages[vehicle.color] ?? colorImages.Branco,
  };
}

export const vehicleService = {
  async list() {
    const vehicles = await apiRequest<ApiVehicle[]>("/vehicles");
    return vehicles.map(normalizeVehicle);
  },

  async updateVehicleStatus(vehicleId: string, status: VehicleStatus) {
    const vehicle = await apiRequest<ApiVehicle>(`/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify({ status: toApiStatus(status) }),
    });
    return normalizeVehicle(vehicle);
  },

  async updateVehicleMileage(vehicleId: string, mileage: number) {
    const vehicle = await apiRequest<ApiVehicle>(`/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify({ mileage }),
    });
    return normalizeVehicle(vehicle);
  },

  updateStatus(vehicles: Vehicle[], vehicleId: string, status: VehicleStatus) {
    return vehicles.map((vehicle) => (vehicle.id === vehicleId ? { ...vehicle, status } : vehicle));
  },

  updateMileageAndHistory(
    vehicles: Vehicle[],
    vehicleId: string,
    updates: Partial<
      Pick<Vehicle, "km" | "lastUser" | "lastReservation" | "lastPickup" | "lastReturn" | "status">
    >,
  ) {
    return vehicles.map((vehicle) =>
      vehicle.id === vehicleId
        ? {
            ...vehicle,
            ...updates,
          }
        : vehicle,
    );
  },

  getVehicleHistory(vehicle: Vehicle, reservations: Reservation[]) {
    return reservations.filter(
      (reservation) =>
        reservation.requestedVehicleId === vehicle.id || reservation.usedVehicleId === vehicle.id,
    );
  },
};
