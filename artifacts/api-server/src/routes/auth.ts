import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import {
  usersTable,
  whitelistedUsersTable,
  userRolesTable,
  passwordResetTokensTable,
} from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, requireAuth, getPermissionsForRole, getUserWithRole } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password required" });
    return;
  }

  try {
    // Check whitelist
    const wl = await db
      .select()
      .from(whitelistedUsersTable)
      .where(eq(whitelistedUsersTable.email, email.toLowerCase()))
      .limit(1);

    if (!wl[0]) {
      res.status(403).json({ message: "Access Denied. You are not on the whitelist.", code: "not_whitelisted" });
      return;
    }

    if (wl[0].status === "disabled") {
      res.status(403).json({ message: "Your account has been disabled.", code: "deactivated" });
      return;
    }

    // Find user
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!users[0]) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, users[0].passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const roleRow = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, users[0].id))
      .limit(1);
    const role = roleRow[0]?.role || "member";

    const token = signToken({ userId: users[0].id, email: users[0].email, role });
    const permissions = await getPermissionsForRole(role);

    res.json({
      token,
      user: {
        id: users[0].id,
        email: users[0].email,
        displayName: users[0].displayName,
        avatarUrl: users[0].avatarUrl,
        role,
        isWhitelisted: true,
        createdAt: users[0].createdAt.toISOString(),
      },
      permissions,
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getUserWithRole(req.user!.userId);
    if (!data) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const permissions = await getPermissionsForRole(data.role);

    res.json({
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      avatarUrl: data.user.avatarUrl,
      role: data.role,
      isWhitelisted: !!data.whitelist && data.whitelist.status === "active",
      createdAt: data.user.createdAt.toISOString(),
      permissions,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/set-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ message: "Token and password required" });
    return;
  }

  try {
    const tokenRows = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.token, token),
          eq(passwordResetTokensTable.used, false),
          gt(passwordResetTokensTable.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRows[0]) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    const hash = await bcrypt.hash(password, 12);

    await db
      .update(usersTable)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(usersTable.id, tokenRows[0].userId));

    await db
      .update(passwordResetTokensTable)
      .set({ used: true })
      .where(eq(passwordResetTokensTable.id, tokenRows[0].id));

    res.json({ success: true, message: "Password set successfully" });
  } catch (err) {
    req.log.error({ err }, "Set password error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
