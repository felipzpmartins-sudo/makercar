import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import {
  disconnectSeedPrisma,
  seedDatabase,
  syncMakerCarVehicles,
} from "./seed.js";

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    console.log("Database already has users. Syncing fleet.");
    await syncMakerCarVehicles();
    return;
  }

  console.log("Database is empty. Running initial seed.");
  await seedDatabase();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await disconnectSeedPrisma();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await disconnectSeedPrisma();
    process.exit(1);
  });
