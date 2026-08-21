import { hash } from "bcryptjs";
import { z } from "zod";

import {
  UserRole,
  UserStatus,
  type PrismaClient,
} from "../../generated/prisma/client.js";

const adminEnvironmentSchema = z.object({
  SEED_ADMIN_NAME: z.string().trim().min(1),
  SEED_ADMIN_EMAIL: z.string().trim().email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
});

export type AdminSeedConfig = z.infer<typeof adminEnvironmentSchema>;

export function parseAdminSeedEnvironment(
  environment: NodeJS.ProcessEnv,
): AdminSeedConfig {
  const result = adminEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid admin seed configuration: ${issues}`);
  }

  return result.data;
}

export async function seedAdmin(
  prisma: PrismaClient,
  config: AdminSeedConfig,
): Promise<void> {
  const passwordHash = await hash(config.SEED_ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: config.SEED_ADMIN_EMAIL },
    create: {
      name: config.SEED_ADMIN_NAME,
      email: config.SEED_ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    update: {
      name: config.SEED_ADMIN_NAME,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}
