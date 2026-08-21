import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../generated/prisma/client.js";
import {
  parseAdminSeedEnvironment,
  seedAdmin,
} from "./seeders/admin.seeder.js";
import { seedLoansLiens } from "./seeders/loans.seeder.js";
import { seedOwnershipHistory } from "./seeders/ownership-history.seeder.js";
import { seedPlans } from "./seeders/plans.seeder.js";
import { seedTitleDeeds } from "./seeders/title-deeds.seeder.js";
import { seedZoning } from "./seeders/zoning.seeder.js";

async function main(): Promise<void> {
  const adminConfig = parseAdminSeedEnvironment(process.env);
  const databaseUrl = process.env["DATABASE_URL"]?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const adapter = new PrismaMariaDb(databaseUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Seeding subscription plans...");
    await seedPlans(prisma);

    console.log("Seeding development admin...");
    await seedAdmin(prisma, adminConfig);

    console.log("Seeding synthetic title deeds...");
    const titleDeedIds = await seedTitleDeeds(prisma);

    console.log("Seeding zoning information...");
    await seedZoning(prisma, titleDeedIds);

    console.log("Seeding loans and liens...");
    await seedLoansLiens(prisma, titleDeedIds);

    console.log("Seeding ownership history...");
    await seedOwnershipHistory(prisma, titleDeedIds);

    console.log("Database seeding completed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Database seeding failed: ${message}`);
  process.exitCode = 1;
});
