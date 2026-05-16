import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requirePermission } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("audit", "read"), async (req: AuthRequest, res) => {
  try {
    const entries = await db
      .select()
      .from(auditLogTable)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(100);

    const result = await Promise.all(
      entries.map(async (e) => {
        let actorName = "System";
        if (e.userId) {
          const user = await db.select().from(usersTable).where(eq(usersTable.id, e.userId)).limit(1);
          actorName = user[0]?.displayName || e.userId;
        }
        return {
          id: e.id,
          userId: e.userId || "",
          action: e.action,
          resource: e.resource,
          resourceId: e.resourceId,
          details: e.details,
          createdAt: e.createdAt.toISOString(),
          actorName,
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get audit log error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
