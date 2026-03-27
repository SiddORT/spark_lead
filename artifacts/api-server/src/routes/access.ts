import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  accessRequestsTable,
  whitelistedUsersTable,
  usersTable,
  userRolesTable,
  passwordResetTokensTable,
  auditLogTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { sendPasswordSetupEmail } from "../lib/email";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, department, reason } = req.body;
  if (!name || !email) {
    res.status(400).json({ message: "Name and email are required" });
    return;
  }

  try {
    await db.insert(accessRequestsTable).values({
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      department: department || null,
      reason: reason || null,
      status: "pending",
    });
    res.status(201).json({ success: true, message: "Access request submitted" });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ message: "You have already submitted an access request with this email." });
      return;
    }
    req.log.error({ err }, "Access request error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { status } = req.query;
  try {
    let rows = await db.select().from(accessRequestsTable).orderBy(accessRequestsTable.createdAt);
    if (status) {
      rows = rows.filter((r) => r.status === status);
    }
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        department: r.department,
        reason: r.reason,
        status: r.status,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get access requests error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/approve", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const request = await db
      .select()
      .from(accessRequestsTable)
      .where(eq(accessRequestsTable.id, req.params.id))
      .limit(1);

    if (!request[0]) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    const { email, name } = request[0];

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existingUser[0]) {
      await db
        .update(accessRequestsTable)
        .set({ status: "approved", reviewedBy: req.user!.userId, reviewedAt: new Date() })
        .where(eq(accessRequestsTable.id, req.params.id));

      res.json({ success: true, message: "User already has an account. Request approved." });
      return;
    }

    // Upsert whitelist
    const existing = await db
      .select()
      .from(whitelistedUsersTable)
      .where(eq(whitelistedUsersTable.email, email.toLowerCase()))
      .limit(1);

    if (!existing[0]) {
      await db.insert(whitelistedUsersTable).values({
        id: uuidv4(),
        email: email.toLowerCase(),
        status: "active",
        assignedRole: "deal_handler",
        invitedBy: req.user!.userId,
      });
    } else {
      await db
        .update(whitelistedUsersTable)
        .set({ status: "active", assignedRole: "deal_handler", updatedAt: new Date() })
        .where(eq(whitelistedUsersTable.email, email.toLowerCase()));
    }

    // Create user with placeholder password
    const userId = uuidv4();
    const tempHash = await bcrypt.hash(uuidv4(), 12);
    await db.insert(usersTable).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash: tempHash,
      displayName: name,
    });

    await db.insert(userRolesTable).values({
      id: uuidv4(),
      userId,
      role: "deal_handler",
    });

    // Create password reset token
    const token = uuidv4();
    await db.insert(passwordResetTokensTable).values({
      id: uuidv4(),
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    await sendPasswordSetupEmail({
      toEmail: email,
      userName: name,
      setPasswordUrl: `${frontendUrl}/set-password?token=${token}`,
    });

    await db
      .update(accessRequestsTable)
      .set({ status: "approved", reviewedBy: req.user!.userId, reviewedAt: new Date() })
      .where(eq(accessRequestsTable.id, req.params.id));

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "access_request_approved",
      resource: "access_requests",
      resourceId: req.params.id,
      details: { email, name },
    });

    res.json({ success: true, message: "Access request approved and user invited" });
  } catch (err) {
    req.log.error({ err }, "Approve access request error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/reject", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    await db
      .update(accessRequestsTable)
      .set({ status: "rejected", reviewedBy: req.user!.userId, reviewedAt: new Date() })
      .where(eq(accessRequestsTable.id, req.params.id));

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "access_request_rejected",
      resource: "access_requests",
      resourceId: req.params.id,
      details: {},
    });

    res.json({ success: true, message: "Request rejected" });
  } catch (err) {
    req.log.error({ err }, "Reject access request error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
