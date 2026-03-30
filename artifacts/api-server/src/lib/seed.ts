import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  whitelistedUsersTable,
  usersTable,
  userRolesTable,
} from "@workspace/db";
import { logger } from "./logger";

const SEED_EMAIL = "admin@sparkleadhub.com";
const SEED_PASSWORD = "Admin@123!";
const SEED_NAME = "Admin";

export async function seedInitialAdmin(): Promise<void> {
  try {
    // Only seed if the whitelist is completely empty (fresh database)
    const existing = await db.select().from(whitelistedUsersTable).limit(1);
    if (existing.length > 0) return;

    logger.info("🌱 Empty database detected — seeding initial admin account...");

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
    const userId = uuidv4();

    await db.insert(whitelistedUsersTable).values({
      id: uuidv4(),
      email: SEED_EMAIL,
      status: "active",
      assignedRole: "admin",
    });

    await db.insert(usersTable).values({
      id: userId,
      email: SEED_EMAIL,
      passwordHash,
      displayName: SEED_NAME,
    });

    await db.insert(userRolesTable).values({
      id: uuidv4(),
      userId,
      role: "admin",
    });

    logger.info("✅ Initial admin account created:");
    logger.info(`   Email   : ${SEED_EMAIL}`);
    logger.info(`   Password: ${SEED_PASSWORD}`);
    logger.info("   ⚠️  Please change this password after first login.");
  } catch (err) {
    logger.error({ err }, "❌ Failed to seed initial admin — check DB connectivity");
  }
}
