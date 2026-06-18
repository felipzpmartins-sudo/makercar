import "dotenv/config";
import { pathToFileURL } from "node:url";
import { PrismaClient, VehicleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const departments = [
  "Financeiro",
  "Marketing",
  "Vídeo",
  "Expansão",
  "Suporte",
  "E-commerce",
  "Administrativo",
];

const roles = [
  "Imperador Supremo",
  "CEO",
  "Administrador",
  "Gestor",
  "Colaborador",
];

const vehicles = [
  {
    name: "Renault Kwid Branco",
    plate: "BKA3F78",
    color: "Branco",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Prata",
    plate: "FVB6H55",
    color: "Prata",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Branco",
    plate: "FVU2B16",
    color: "Branco",
    status: VehicleStatus.IN_USE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Prata",
    plate: "FXC0I09",
    color: "Prata",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Preto",
    plate: "GAV6H84",
    color: "Preto",
    status: VehicleStatus.RESERVED,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Preto",
    plate: "GEL8E37",
    color: "Preto",
    status: VehicleStatus.MAINTENANCE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Branco",
    plate: "HOH8I91",
    color: "Branco",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Prata",
    plate: "RBW5D42",
    color: "Prata",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Kwid Branco",
    plate: "SUP8E16",
    color: "Branco",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
];

const makerCarVehiclePlates = ["BKA3F78", "GAV6H84", "GEL8E37", "RBW5D42"];
const makerCarVehicles = vehicles.filter((vehicle) =>
  makerCarVehiclePlates.includes(vehicle.plate),
);

export async function seedDatabase() {
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const administrativeDepartment = await prisma.department.findUniqueOrThrow({
    where: { name: "Administrativo" },
  });
  const ceoRole = await prisma.role.findUniqueOrThrow({
    where: { name: "CEO" },
  });
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "Administrador" },
  });
  const passwordHash = await bcrypt.hash("MakerCar@2026", 10);
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 10);

  await prisma.user.upsert({
    where: { email: "ceo@mkr.com" },
    update: {
      name: "CEO MKR",
      passwordHash,
      departmentId: administrativeDepartment.id,
      roleId: ceoRole.id,
      active: true,
    },
    create: {
      name: "CEO MKR",
      email: "ceo@mkr.com",
      passwordHash,
      departmentId: administrativeDepartment.id,
      roleId: ceoRole.id,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@makercar.com" },
    update: {
      name: "Administrador MakerCar",
      passwordHash: adminPasswordHash,
      departmentId: administrativeDepartment.id,
      roleId: adminRole.id,
      active: true,
    },
    create: {
      name: "Administrador MakerCar",
      email: "admin@makercar.com",
      passwordHash: adminPasswordHash,
      departmentId: administrativeDepartment.id,
      roleId: adminRole.id,
      active: true,
    },
  });

  const supremeOwnerRole = await prisma.role.findUniqueOrThrow({
    where: { name: "Imperador Supremo" },
  });
  await prisma.user.updateMany({
    where: { email: "felipzpmartins@gmail.com" },
    data: { roleId: supremeOwnerRole.id, active: true },
  });

  for (const vehicle of makerCarVehicles) {
    await prisma.vehicle.upsert({
      where: { plate: vehicle.plate },
      update: { ...vehicle, active: true },
      create: { ...vehicle, active: true },
    });
  }

  await prisma.vehicle.updateMany({
    where: {
      plate: { notIn: makerCarVehicles.map((vehicle) => vehicle.plate) },
    },
    data: { active: false },
  });
}

export async function disconnectSeedPrisma() {
  await prisma.$disconnect();
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  seedDatabase()
  .then(async () => {
    await disconnectSeedPrisma();
  })
  .catch(async (error) => {
    console.error(error);
    await disconnectSeedPrisma();
    process.exit(1);
  });
}
