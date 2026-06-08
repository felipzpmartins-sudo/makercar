import type { Reservation, Vehicle } from "@/data/vehicles";
import { isVehicleAvailable, isVehicleMaintenance, isVehicleUnavailable } from "@/data/vehicles";

export const adminService = {
  getSummary(vehicles: Vehicle[], reservations: Reservation[]) {
    const today = formatLocalDate(new Date());

    return {
      totalVehicles: vehicles.length,
      available: vehicles.filter((vehicle) => isVehicleAvailable(vehicle.status)).length,
      reserved: vehicles.filter((vehicle) => vehicle.status === "Reservado").length,
      inUse: vehicles.filter((vehicle) => vehicle.status === "Em uso").length,
      maintenance: vehicles.filter((vehicle) => isVehicleMaintenance(vehicle.status)).length,
      unavailable: vehicles.filter((vehicle) => isVehicleUnavailable(vehicle.status)).length,
      todayReservations: reservations.filter((reservation) => reservation.pickupDate === today)
        .length,
      activeReservations: reservations.filter((reservation) =>
        ["Reservado", "Em uso"].includes(reservation.status),
      ).length,
      finishedReservations: reservations.filter(
        (reservation) => reservation.status === "Finalizada",
      ).length,
    };
  },
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
