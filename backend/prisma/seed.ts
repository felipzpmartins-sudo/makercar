import "dotenv/config";
import { pathToFileURL } from "node:url";
import {
  EquipmentStatus,
  PrismaClient,
  VehicleStatus,
} from "@prisma/client";
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
    name: "Renault Kwid Prata",
    plate: "BKA3F78",
    color: "Prata",
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
    plate: "BWK7761",
    color: "Branco",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
    supportOnly: true,
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
    name: "Renault Kwid Branco",
    plate: "FXC0I09",
    color: "Branco",
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
    name: "Renault Kwid Branco",
    plate: "RBW5D42",
    color: "Branco",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
  {
    name: "Renault Master",
    plate: "SUP8E16",
    color: "Branco",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "Manual",
    capacity: 3,
    imageUrl: "/makercar-assets/renault-master-white.png",
  },
  {
    name: "Renault Kwid Zen 2 Preto",
    plate: "URY5A94",
    color: "Preto",
    status: VehicleStatus.AVAILABLE,
    mileage: 0,
    fuelType: "Flex",
    transmission: "Manual",
    capacity: 5,
  },
];

const makerCarVehiclePlates = [
  "BKA3F78",
  "BWK7761",
  "FVB6H55",
  "FXC0I09",
  "GAV6H84",
  "GEL8E37",
  "RBW5D42",
  "SUP8E16",
  "URY5A94",
];
const makerCarVehicles = vehicles.filter((vehicle) =>
  makerCarVehiclePlates.includes(vehicle.plate),
);

/*
 * Catalogo inicial de equipamentos internos.
 *
 * Mesma ideia do makerCarVehicles: a lista abaixo e a fonte da verdade e o
 * sync roda a cada bootstrap. Cadastrar um projetor ou um drone no futuro e
 * acrescentar um item aqui — ou usar o painel do administrador, que grava
 * direto no banco.
 */
const equipmentCategories = [
  {
    name: "Robótica",
    slug: "robotica",
    description: "Robôs e plataformas autônomas para demonstrações e eventos.",
    icon: "Bot",
    sortOrder: 1,
  },
];

const equipments = [
  {
    name: "Robô Humanoide",
    slug: "robo-humanoide",
    categorySlug: "robotica",
    description:
      "Robô humanoide bípede usado em apresentações, feiras e demonstrações institucionais. Caminha, interage com o público e executa rotinas programadas.",
    imageUrl: "/makercar-assets/robo-humanoide.png",
    heroImageUrl: "/makercar-assets/robo-humanoide-perfil.png",
    location: "Sede do Grupo Maker",
    notes:
      "Transportar sempre no case original. A bateria leva cerca de 2 horas para carregar completamente.",
    usageRules:
      "Operação exclusiva por pessoa treinada. Manter área livre de 2 metros ao redor durante a caminhada. Não operar em piso molhado, escadas ou ambiente externo sem cobertura.",
    specs: [
      { label: "Tipo", value: "Humanoide bípede" },
      { label: "Altura", value: "1 m" },
      { label: "Autonomia", value: "3 h de operação" },
      { label: "Operação", value: "Requer operador treinado" },
    ],
    sortOrder: 1,
  },
  {
    name: "Robô Cachorro",
    slug: "robo-cachorro",
    categorySlug: "robotica",
    description:
      "Robô quadrúpede de alta mobilidade, com câmera e sensores. Indicado para ativações, gravações e demonstrações de tecnologia em ambientes internos e externos.",
    imageUrl: "/makercar-assets/robo-cachorro.png",
    heroImageUrl: "/makercar-assets/robo-cachorro.png",
    location: "Sede do Grupo Maker",
    notes:
      "Acompanha controle remoto e carregador próprio. Conferir os quatro pés antes e depois de cada uso.",
    usageRules:
      "Manter o controle remoto sempre em mãos durante a operação. Não utilizar em meio a aglomerações sem isolamento. Evitar areia, lama e degraus acima de 15 cm.",
    specs: [
      { label: "Tipo", value: "Quadrúpede" },
      { label: "Sensores", value: "Câmera e sensores de profundidade" },
      { label: "Autonomia", value: "3 h por bateria (2 baterias)" },
      { label: "Ambiente", value: "Interno e externo" },
    ],
    sortOrder: 2,
  },
];

/**
 * Sincroniza o catalogo de equipamentos.
 *
 * Idempotente: pode rodar em todo deploy. Nao mexe no `status`, porque a
 * disponibilidade e decisao do administrador e seria perdida a cada boot.
 */
export async function syncMakerCarEquipment() {
  for (const category of equipmentCategories) {
    await prisma.equipmentCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        active: true,
      },
      create: { ...category, active: true },
    });
  }

  for (const { categorySlug, ...equipment } of equipments) {
    const category = await prisma.equipmentCategory.findUniqueOrThrow({
      where: { slug: categorySlug },
    });

    await prisma.equipment.upsert({
      where: { slug: equipment.slug },
      update: {
        name: equipment.name,
        description: equipment.description,
        categoryId: category.id,
        imageUrl: equipment.imageUrl,
        heroImageUrl: equipment.heroImageUrl,
        location: equipment.location,
        notes: equipment.notes,
        usageRules: equipment.usageRules,
        specs: equipment.specs,
        sortOrder: equipment.sortOrder,
        active: true,
      },
      create: {
        ...equipment,
        categoryId: category.id,
        status: EquipmentStatus.AVAILABLE,
        active: true,
      },
    });
  }
}

export async function seedDatabase() {
  const ceoInitialPassword = process.env.INITIAL_CEO_PASSWORD;
  const adminInitialPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (
    !ceoInitialPassword ||
    !adminInitialPassword ||
    ceoInitialPassword.length < 12 ||
    adminInitialPassword.length < 12
  ) {
    throw new Error(
      "INITIAL_CEO_PASSWORD e INITIAL_ADMIN_PASSWORD devem ter ao menos 12 caracteres.",
    );
  }

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
  const passwordHash = await bcrypt.hash(ceoInitialPassword, 10);
  const adminPasswordHash = await bcrypt.hash(adminInitialPassword, 10);

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

  await syncMakerCarVehicles();
  await syncMakerCarEquipment();
}

export async function syncMakerCarVehicles() {
  for (const vehicle of makerCarVehicles) {
    const { mileage: _mileage, ...fleetData } = vehicle;
    await prisma.vehicle.upsert({
      where: { plate: vehicle.plate },
      update: { ...fleetData, active: true },
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

export async function syncVehicleMileageFromOdometerRecords() {
  const mileageByVehicle = await prisma.reservationOdometerRecord.groupBy({
    by: ["vehicleId"],
    where: { vehicleId: { not: null } },
    _max: { mileage: true },
  });

  await Promise.all(
    mileageByVehicle.flatMap(({ vehicleId, _max }) => {
      if (!vehicleId || _max.mileage === null) return [];
      return prisma.vehicle.updateMany({
        where: { id: vehicleId, mileage: { lt: _max.mileage } },
        data: { mileage: _max.mileage },
      });
    }),
  );
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
