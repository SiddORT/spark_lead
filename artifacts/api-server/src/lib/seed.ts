import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  whitelistedUsersTable,
  usersTable,
  userRolesTable,
  rolePermissionsTable,
} from "@workspace/db";
import { logger } from "./logger";

const SEED_EMAIL = "admin@sparkleadhub.com";
const SEED_PASSWORD = "Admin@123!";
const SEED_NAME = "Admin";

type PermRow = {
  roleName: "lead_owner" | "deal_handler" | "manager" | "member";
  resource: string;
  action: string;
  allowed: boolean;
};

const DEFAULT_PERMISSIONS: PermRow[] = [
  // ── LEADS ──────────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "leads", action: "create", allowed: true  },
  { roleName: "deal_handler", resource: "leads", action: "create", allowed: false },
  { roleName: "manager",      resource: "leads", action: "create", allowed: true  },
  { roleName: "member",       resource: "leads", action: "create", allowed: false },

  { roleName: "lead_owner",   resource: "leads", action: "read",   allowed: true  },
  { roleName: "deal_handler", resource: "leads", action: "read",   allowed: true  },
  { roleName: "manager",      resource: "leads", action: "read",   allowed: true  },
  { roleName: "member",       resource: "leads", action: "read",   allowed: true  },

  { roleName: "lead_owner",   resource: "leads", action: "update", allowed: true  },
  { roleName: "deal_handler", resource: "leads", action: "update", allowed: true  },
  { roleName: "manager",      resource: "leads", action: "update", allowed: true  },
  { roleName: "member",       resource: "leads", action: "update", allowed: false },

  { roleName: "lead_owner",   resource: "leads", action: "delete", allowed: false },
  { roleName: "deal_handler", resource: "leads", action: "delete", allowed: false },
  { roleName: "manager",      resource: "leads", action: "delete", allowed: false },
  { roleName: "member",       resource: "leads", action: "delete", allowed: false },

  { roleName: "lead_owner",   resource: "leads", action: "export", allowed: true  },
  { roleName: "deal_handler", resource: "leads", action: "export", allowed: false },
  { roleName: "manager",      resource: "leads", action: "export", allowed: true  },
  { roleName: "member",       resource: "leads", action: "export", allowed: false },

  // ── REPORTS ────────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "reports", action: "read", allowed: true  },
  { roleName: "deal_handler", resource: "reports", action: "read", allowed: false },
  { roleName: "manager",      resource: "reports", action: "read", allowed: true  },
  { roleName: "member",       resource: "reports", action: "read", allowed: true  },

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "settings", action: "read",   allowed: false },
  { roleName: "deal_handler", resource: "settings", action: "read",   allowed: false },
  { roleName: "manager",      resource: "settings", action: "read",   allowed: false },
  { roleName: "member",       resource: "settings", action: "read",   allowed: false },

  { roleName: "lead_owner",   resource: "settings", action: "update", allowed: false },
  { roleName: "deal_handler", resource: "settings", action: "update", allowed: false },
  { roleName: "manager",      resource: "settings", action: "update", allowed: false },
  { roleName: "member",       resource: "settings", action: "update", allowed: false },

  // ── TEAM ───────────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "team", action: "read",   allowed: false },
  { roleName: "deal_handler", resource: "team", action: "read",   allowed: false },
  { roleName: "manager",      resource: "team", action: "read",   allowed: true  },
  { roleName: "member",       resource: "team", action: "read",   allowed: false },

  { roleName: "lead_owner",   resource: "team", action: "create", allowed: false },
  { roleName: "deal_handler", resource: "team", action: "create", allowed: false },
  { roleName: "manager",      resource: "team", action: "create", allowed: false },
  { roleName: "member",       resource: "team", action: "create", allowed: false },

  // ── AUDIT ──────────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "audit", action: "read", allowed: false },
  { roleName: "deal_handler", resource: "audit", action: "read", allowed: false },
  { roleName: "manager",      resource: "audit", action: "read", allowed: false },
  { roleName: "member",       resource: "audit", action: "read", allowed: false },

  // ── COMPANIES ──────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "companies", action: "read",   allowed: true  },
  { roleName: "deal_handler", resource: "companies", action: "read",   allowed: true  },
  { roleName: "manager",      resource: "companies", action: "read",   allowed: true  },
  { roleName: "member",       resource: "companies", action: "read",   allowed: true  },

  { roleName: "lead_owner",   resource: "companies", action: "create", allowed: false },
  { roleName: "deal_handler", resource: "companies", action: "create", allowed: false },
  { roleName: "manager",      resource: "companies", action: "create", allowed: true  },
  { roleName: "member",       resource: "companies", action: "create", allowed: false },

  { roleName: "lead_owner",   resource: "companies", action: "update", allowed: false },
  { roleName: "deal_handler", resource: "companies", action: "update", allowed: false },
  { roleName: "manager",      resource: "companies", action: "update", allowed: true  },
  { roleName: "member",       resource: "companies", action: "update", allowed: false },

  { roleName: "lead_owner",   resource: "companies", action: "delete", allowed: false },
  { roleName: "deal_handler", resource: "companies", action: "delete", allowed: false },
  { roleName: "manager",      resource: "companies", action: "delete", allowed: false },
  { roleName: "member",       resource: "companies", action: "delete", allowed: false },

  // ── SERVICES ───────────────────────────────────────────────────────────────
  { roleName: "lead_owner",   resource: "services", action: "read",   allowed: true  },
  { roleName: "deal_handler", resource: "services", action: "read",   allowed: true  },
  { roleName: "manager",      resource: "services", action: "read",   allowed: true  },
  { roleName: "member",       resource: "services", action: "read",   allowed: true  },

  { roleName: "lead_owner",   resource: "services", action: "create", allowed: false },
  { roleName: "deal_handler", resource: "services", action: "create", allowed: false },
  { roleName: "manager",      resource: "services", action: "create", allowed: true  },
  { roleName: "member",       resource: "services", action: "create", allowed: false },

  { roleName: "lead_owner",   resource: "services", action: "update", allowed: false },
  { roleName: "deal_handler", resource: "services", action: "update", allowed: false },
  { roleName: "manager",      resource: "services", action: "update", allowed: true  },
  { roleName: "member",       resource: "services", action: "update", allowed: false },

  { roleName: "lead_owner",   resource: "services", action: "delete", allowed: false },
  { roleName: "deal_handler", resource: "services", action: "delete", allowed: false },
  { roleName: "manager",      resource: "services", action: "delete", allowed: false },
  { roleName: "member",       resource: "services", action: "delete", allowed: false },
];

export async function seedInitialAdmin(): Promise<void> {
  try {
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

export async function seedDefaultPermissions(): Promise<void> {
  try {
    const existing = await db.select().from(rolePermissionsTable).limit(1);
    if (existing.length > 0) return;

    logger.info("🔐 Seeding default role permissions...");

    await db.insert(rolePermissionsTable).values(
      DEFAULT_PERMISSIONS.map((p) => ({
        id: uuidv4(),
        roleName: p.roleName,
        resource: p.resource,
        action: p.action,
        allowed: p.allowed,
      }))
    );

    logger.info(`✅ Seeded ${DEFAULT_PERMISSIONS.length} default permission rows.`);
  } catch (err) {
    logger.error({ err }, "❌ Failed to seed default permissions");
  }
}
