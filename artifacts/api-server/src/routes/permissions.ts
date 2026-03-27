import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { rolePermissionsTable, auditLogTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { sendPasswordSetupEmail, sendActivityAlertEmail } from "../lib/email";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const perms = await db.select().from(rolePermissionsTable).orderBy(rolePermissionsTable.roleName, rolePermissionsTable.resource, rolePermissionsTable.action);
    res.json(
      perms.map((p) => ({
        id: p.id,
        roleName: p.roleName,
        resource: p.resource,
        action: p.action,
        allowed: p.allowed,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get permissions error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { roleName, resource, action, allowed } = req.body;
    if (!roleName || !resource || !action || allowed === undefined) {
      res.status(400).json({ message: "roleName, resource, action, allowed are required" });
      return;
    }

    const existing = await db
      .select()
      .from(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleName, roleName),
          eq(rolePermissionsTable.resource, resource),
          eq(rolePermissionsTable.action, action)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(rolePermissionsTable)
        .set({ allowed })
        .where(eq(rolePermissionsTable.id, existing[0].id));
    } else {
      await db.insert(rolePermissionsTable).values({
        id: uuidv4(),
        roleName,
        resource,
        action,
        allowed,
      });
    }

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "permission_change",
      resource: "settings",
      resourceId: `${roleName}:${resource}:${action}`,
      details: { roleName, resource, action, allowed },
    });

    res.json({ success: true, message: "Permission updated" });
  } catch (err) {
    req.log.error({ err }, "Update permission error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/test-email/activity", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (user[0]) {
      await sendActivityAlertEmail({
        recipientEmail: user[0].email,
        leadName: "Test Lead",
        changeDetails: "stage: \"discovery\" → \"qualification\"\ndeal_value: \"\" → \"₹50,000\"",
        actorName: user[0].displayName,
      });
    }
    res.json({ success: true, message: "Test activity email sent" });
  } catch (err) {
    req.log.error({ err }, "Test activity email error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/test-email/password", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (user[0]) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      await sendPasswordSetupEmail({
        toEmail: user[0].email,
        userName: user[0].displayName,
        setPasswordUrl: `${frontendUrl}/set-password?token=test-token-123`,
      });
    }
    res.json({ success: true, message: "Test password email sent" });
  } catch (err) {
    req.log.error({ err }, "Test password email error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
