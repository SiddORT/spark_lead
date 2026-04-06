import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  whitelistedUsersTable,
  usersTable,
  userRolesTable,
  rolePermissionsTable,
  pipelineStagesTable,
  pipelineStatusesTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
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

// ─── Pipeline Stages + Statuses seed ─────────────────────────────────────────
const STAGE_S1 = "a1000000-0000-0000-0000-000000000001";
const STAGE_S2 = "a1000000-0000-0000-0000-000000000002";
const STAGE_S3 = "a1000000-0000-0000-0000-000000000003";
const STAGE_S4 = "a1000000-0000-0000-0000-000000000004";

const SEED_STAGES = [
  { id: STAGE_S1, displayName: "Lead Initiation",           color: "#22d3ee", sortOrder: 1, isActive: true, isTerminal: false },
  { id: STAGE_S2, displayName: "Qualification & Analysis",  color: "#f59e0b", sortOrder: 2, isActive: true, isTerminal: false },
  { id: STAGE_S3, displayName: "Proposal & Negotiation",    color: "#a78bfa", sortOrder: 3, isActive: true, isTerminal: false },
  { id: STAGE_S4, displayName: "Closure",                   color: "#34d399", sortOrder: 4, isActive: true, isTerminal: true  },
];

const SEED_STATUSES = [
  { id: uuidv4(), stageId: STAGE_S1, displayName: "New Lead",          color: "#22d3ee", sortOrder: 1, isActive: true, isWon: false, isLost: false },
  { id: uuidv4(), stageId: STAGE_S1, displayName: "Contacted",         color: "#67e8f9", sortOrder: 2, isActive: true, isWon: false, isLost: false },
  { id: uuidv4(), stageId: STAGE_S2, displayName: "Qualifying",        color: "#fcd34d", sortOrder: 1, isActive: true, isWon: false, isLost: false },
  { id: uuidv4(), stageId: STAGE_S2, displayName: "Qualified",         color: "#f59e0b", sortOrder: 2, isActive: true, isWon: false, isLost: false },
  { id: uuidv4(), stageId: STAGE_S3, displayName: "Proposal Sent",     color: "#c4b5fd", sortOrder: 1, isActive: true, isWon: false, isLost: false },
  { id: uuidv4(), stageId: STAGE_S3, displayName: "Negotiating",       color: "#a78bfa", sortOrder: 2, isActive: true, isWon: false, isLost: false },
  { id: uuidv4(), stageId: STAGE_S4, displayName: "Closed Won",        color: "#34d399", sortOrder: 1, isActive: true, isWon: true,  isLost: false },
  { id: uuidv4(), stageId: STAGE_S4, displayName: "Closed Lost",       color: "#f87171", sortOrder: 2, isActive: true, isWon: false, isLost: true  },
  { id: uuidv4(), stageId: STAGE_S4, displayName: "Churned",           color: "#fb923c", sortOrder: 3, isActive: true, isWon: false, isLost: true  },
];

export async function seedPipelineStages(): Promise<void> {
  try {
    const existing = await db.select().from(pipelineStagesTable).limit(1);
    if (existing.length > 0) return;

    logger.info("🏗️  Seeding default pipeline stages and statuses...");

    await db.insert(pipelineStagesTable).values(SEED_STAGES);
    await db.insert(pipelineStatusesTable).values(SEED_STATUSES);

    logger.info(`✅ Seeded ${SEED_STAGES.length} pipeline stages and ${SEED_STATUSES.length} statuses.`);
  } catch (err) {
    logger.error({ err }, "❌ Failed to seed pipeline stages");
  }
}

/**
 * One-time data fix: remove duplicate rows from lead_companies so that each
 * (lead_id, company_id) pair has exactly one row.  Safe to run repeatedly —
 * it deletes nothing when there are no duplicates.
 */
export async function fixDuplicateLeadCompanies() {
  try {
    const result = await db.execute(sql`
      DELETE FROM lead_companies
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY lead_id, company_id
                   ORDER BY id
                 ) AS rn
          FROM lead_companies
        ) ranked
        WHERE rn > 1
      )
    `);
    const deleted = (result as any).rowCount ?? 0;
    if (deleted > 0) {
      logger.info(`🧹 Removed ${deleted} duplicate lead_company row(s).`);
    }
  } catch (err) {
    logger.error({ err }, "❌ Failed to fix duplicate lead_companies");
  }
}
