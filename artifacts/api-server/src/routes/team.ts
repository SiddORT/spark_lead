import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  usersTable,
  whitelistedUsersTable,
  userRolesTable,
  passwordResetTokensTable,
  leadNotesTable,
  accessRequestsTable,
  auditLogTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { sendPasswordSetupEmail } from "../lib/email";

const router = Router();

router.get("/users", requireAuth, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.displayName);
    const result = await Promise.all(
      users.map(async (u) => {
        const roleRow = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, u.id)).limit(1);
        return {
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          role: roleRow[0]?.role || "member",
        };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get users map error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/members", requireAuth, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.displayName);
    const result = await Promise.all(
      users.map(async (u) => {
        const roleRow = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, u.id)).limit(1);
        const wl = await db.select().from(whitelistedUsersTable).where(eq(whitelistedUsersTable.email, u.email)).limit(1);
        return {
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          role: roleRow[0]?.role || "member",
          whitelistStatus: wl[0]?.status || "active",
          joinedAt: u.createdAt.toISOString(),
        };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get members error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/members/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { role, status } = req.body;
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!user[0]) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (role) {
      const existingRole = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, req.params.id)).limit(1);
      if (existingRole[0]) {
        await db.update(userRolesTable).set({ role }).where(eq(userRolesTable.userId, req.params.id));
      } else {
        await db.insert(userRolesTable).values({ id: uuidv4(), userId: req.params.id, role });
      }

      await db
        .update(whitelistedUsersTable)
        .set({ assignedRole: role, updatedAt: new Date() })
        .where(eq(whitelistedUsersTable.email, user[0].email));

      await db.insert(auditLogTable).values({
        id: uuidv4(),
        userId: req.user!.userId,
        action: "role_change",
        resource: "team",
        resourceId: req.params.id,
        details: { newRole: role, email: user[0].email },
      });
    }

    if (status !== undefined) {
      await db
        .update(whitelistedUsersTable)
        .set({ status, updatedAt: new Date() })
        .where(eq(whitelistedUsersTable.email, user[0].email));

      await db.insert(auditLogTable).values({
        id: uuidv4(),
        userId: req.user!.userId,
        action: status === "disabled" ? "user_disabled" : "user_enabled",
        resource: "team",
        resourceId: req.params.id,
        details: { email: user[0].email, status },
      });
    }

    res.json({ success: true, message: "Member updated" });
  } catch (err) {
    req.log.error({ err }, "Update member error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/members/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user!.userId) {
      res.status(400).json({ message: "Cannot delete yourself" });
      return;
    }

    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!user[0]) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Full cascade delete
    await db.delete(whitelistedUsersTable).where(eq(whitelistedUsersTable.email, user[0].email));
    await db.delete(accessRequestsTable).where(eq(accessRequestsTable.email, user[0].email));
    await db.delete(userRolesTable).where(eq(userRolesTable.userId, req.params.id));
    await db.delete(leadNotesTable).where(eq(leadNotesTable.userId, req.params.id));
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, req.params.id));
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id));

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "user_deleted",
      resource: "team",
      resourceId: req.params.id,
      details: { email: user[0].email, displayName: user[0].displayName },
    });

    res.json({ success: true, message: "Member deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete member error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/members/:id/resend-password-link", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!user[0]) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Invalidate any existing unused tokens for this user
    await db
      .update(passwordResetTokensTable)
      .set({ used: true })
      .where(eq(passwordResetTokensTable.userId, req.params.id));

    // Generate a fresh token (24 hr expiry)
    const token = uuidv4();
    await db.insert(passwordResetTokensTable).values({
      id: uuidv4(),
      userId: user[0].id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const origin = (req.headers.origin as string) || (req.headers.referer as string) || "";
    const baseUrl = origin.replace(/\/$/, "") || process.env.FRONTEND_URL || "";
    const frontendUrl = baseUrl || "http://localhost:5173";
    const setPasswordUrl = `${frontendUrl}/set-password?token=${token}`;

    const roleRow = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, user[0].id)).limit(1);
    const role = roleRow[0]?.role || "member";

    const adminUser = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

    const emailSent = await sendPasswordSetupEmail({
      toEmail: user[0].email,
      userName: user[0].displayName || user[0].email.split("@")[0],
      setPasswordUrl,
      invitedByName: adminUser[0]?.displayName || "Admin",
      role,
    });

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "password_link_resent",
      resource: "team",
      resourceId: req.params.id,
      details: { email: user[0].email, emailSent },
    });

    res.json({
      success: true,
      emailSent,
      setPasswordUrl,
      message: emailSent
        ? "Password setup link sent successfully"
        : "Link generated — share manually (email not configured)",
    });
  } catch (err) {
    req.log.error({ err }, "Resend password link error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/invite", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      res.status(400).json({ message: "Email and role are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Check if already whitelisted
    const existing = await db.select().from(whitelistedUsersTable).where(eq(whitelistedUsersTable.email, normalizedEmail)).limit(1);

    if (!existing[0]) {
      await db.insert(whitelistedUsersTable).values({
        id: uuidv4(),
        email: normalizedEmail,
        status: "active",
        assignedRole: role,
        invitedBy: req.user!.userId,
      });
    } else {
      await db.update(whitelistedUsersTable).set({ status: "active", assignedRole: role, updatedAt: new Date() }).where(eq(whitelistedUsersTable.email, normalizedEmail));
    }

    // Create user if not exists
    let userId: string;
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);

    if (!existingUser[0]) {
      userId = uuidv4();
      const tempHash = await bcrypt.hash(uuidv4(), 12);
      const displayName = email.split("@")[0];
      await db.insert(usersTable).values({
        id: userId,
        email: normalizedEmail,
        passwordHash: tempHash,
        displayName,
      });

      await db.insert(userRolesTable).values({ id: uuidv4(), userId, role });
    } else {
      userId = existingUser[0].id;
      const existingRole = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId)).limit(1);
      if (existingRole[0]) {
        await db.update(userRolesTable).set({ role }).where(eq(userRolesTable.userId, userId));
      } else {
        await db.insert(userRolesTable).values({ id: uuidv4(), userId, role });
      }
    }

    // Create password reset token
    const token = uuidv4();
    await db.insert(passwordResetTokensTable).values({
      id: uuidv4(),
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const origin = (req.headers.origin as string) || (req.headers.referer as string) || "";
    const baseUrl = origin.replace(/\/$/, "") || process.env.FRONTEND_URL || "";
    const frontendUrl = baseUrl || "http://localhost:5173";
    const setPasswordUrl = `${frontendUrl}/set-password?token=${token}`;

    const inviter = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    const emailSent = await sendPasswordSetupEmail({
      toEmail: email,
      userName: email.split("@")[0],
      setPasswordUrl,
      invitedByName: inviter[0]?.displayName || "Admin",
      role,
    });

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "user_invited",
      resource: "team",
      resourceId: userId,
      details: { email: normalizedEmail, role, emailSent },
    });

    res.status(201).json({
      success: true,
      emailSent,
      setPasswordUrl,
      message: emailSent
        ? "User invited successfully — invitation email sent"
        : "User created — share the set-password link manually (email not configured)",
    });
  } catch (err) {
    req.log.error({ err }, "Invite user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
