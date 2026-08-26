import {
  ReservationOdometerType,
  ReservationStatus,
  VehicleStatus,
  type Prisma,
} from "@prisma/client";

/**
 * Recalcula o status do veiculo a partir das reservas existentes.
 *
 * Regra unica da frota: um veiculo em manutencao ou indisponivel mantem o
 * status definido manualmente; caso contrario ele fica EM USO enquanto houver
 * reserva ativa, RESERVADO se houver reserva pendente/aprovada e DISPONIVEL
 * quando nao houver nenhuma.
 *
 * Deve ser chamada dentro de uma transacao sempre que uma reserva mudar de
 * estado (criar, cancelar, aprovar, recusar, retirar, devolver, excluir).
 */
export async function syncVehicleReservationStatus(
  tx: Prisma.TransactionClient,
  vehicleId: string,
) {
  const vehicle = await tx.vehicle.findUnique({
    where: { id: vehicleId },
    select: { status: true },
  });
  if (!vehicle) return;

  if (
    vehicle.status === VehicleStatus.MAINTENANCE ||
    vehicle.status === VehicleStatus.UNAVAILABLE
  ) {
    return;
  }

  const activeReservation = await tx.reservation.findFirst({
    where: {
      status: ReservationStatus.ACTIVE,
      OR: [
        {
          vehicleId,
          odometerRecords: { none: { type: ReservationOdometerType.PICKUP } },
        },
        {
          odometerRecords: {
            some: { type: ReservationOdometerType.PICKUP, vehicleId },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (activeReservation) {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.IN_USE },
    });
    return;
  }

  const scheduledReservation = await tx.reservation.findFirst({
    where: {
      vehicleId,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED] },
    },
    select: { id: true },
  });

  await tx.vehicle.update({
    where: { id: vehicleId },
    data: {
      status: scheduledReservation
        ? VehicleStatus.RESERVED
        : VehicleStatus.AVAILABLE,
    },
  });
}
