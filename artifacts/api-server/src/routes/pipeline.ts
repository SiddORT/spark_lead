import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import {
  pipelineStagesTable,
  pipelineStatusesTable,
  leadsTable,
  auditLogTable,
} from "@workspace/db";
import { eq, asc, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// GET /api/pipeline/stages — all active stages with nested statuses
router.get("/stages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const stages = await db
      .select()
      .from(pipelineStagesTable)
      .where(eq(pipelineStagesTable.isActive, true))
      .orderBy(asc(pipelineStagesTable.sortOrder));

    const statuses = await db
      .select()
      .from(pipelineStatusesTable)
      .where(eq(pipelineStatusesTable.isActive, true))
      .orderBy(asc(pipelineStatusesTable.sortOrder));

    const result = stages.map((stage) => ({
      ...stage,
      statuses: statuses.filter((s) => s.stageId === stage.id),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get pipeline stages error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/pipeline/stages/:stageId/statuses
router.get("/stages/:stageId/statuses", requireAuth, async (req: AuthRequest, res) => {
  try {
    const statuses = await db
      .select()
      .from(pipelineStatusesTable)
      .where(
        and(
          eq(pipelineStatusesTable.stageId, req.params.stageId),
          eq(pipelineStatusesTable.isActive, true)
        )
      )
      .orderBy(asc(pipelineStatusesTable.sortOrder));
    res.json(statuses);
  } catch (err) {
    req.log.error({ err }, "Get stage statuses error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/pipeline/stages — admin only
router.post("/stages", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { displayName, description, color, icon, sortOrder } = req.body;
    const name = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const id = uuidv4();
    const [stage] = await db
      .insert(pipelineStagesTable)
      .values({ id, name, displayName, description, color: color || "#6b7a9a", icon, sortOrder: sortOrder || 0 })
      .returning();
    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "stage_created",
      resource: "pipeline_stages",
      resourceId: stage.id,
      details: { displayName },
    });
    res.status(201).json(stage);
  } catch (err) {
    req.log.error({ err }, "Create stage error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/pipeline/stages/:id — admin only
router.patch("/stages/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { displayName, description, color, icon, sortOrder, isTerminal } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (displayName !== undefined) updates.displayName = displayName;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isTerminal !== undefined) updates.isTerminal = isTerminal;
    const [updated] = await db
      .update(pipelineStagesTable)
      .set(updates)
      .where(eq(pipelineStagesTable.id, req.params.id))
      .returning();
    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "stage_updated",
      resource: "pipeline_stages",
      resourceId: req.params.id,
      details: req.body,
    });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update stage error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/pipeline/stages/:id — soft delete, admin only
router.delete("/stages/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadsTable)
      .where(eq(leadsTable.pipelineStageId, req.params.id));
    const count = countResult[0]?.count ?? 0;
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete — ${count} lead(s) are currently in this stage`,
      });
    }
    await db
      .update(pipelineStagesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pipelineStagesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete stage error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/pipeline/statuses — admin only
router.post("/statuses", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { stageId, displayName, description, color, sortOrder, isWon, isLost } = req.body;
    const name = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const [status] = await db
      .insert(pipelineStatusesTable)
      .values({
        id: uuidv4(),
        stageId,
        name,
        displayName,
        description,
        color: color || "#6b7a9a",
        sortOrder: sortOrder || 0,
        isWon: isWon || false,
        isLost: isLost || false,
      })
      .returning();
    res.status(201).json(status);
  } catch (err) {
    req.log.error({ err }, "Create status error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/pipeline/statuses/:id — admin only
router.patch("/statuses/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { displayName, description, color, sortOrder, isWon, isLost } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (displayName !== undefined) updates.displayName = displayName;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isWon !== undefined) updates.isWon = isWon;
    if (isLost !== undefined) updates.isLost = isLost;
    const [updated] = await db
      .update(pipelineStatusesTable)
      .set(updates)
      .where(eq(pipelineStatusesTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update status error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/pipeline/statuses/:id — soft delete, admin only
router.delete("/statuses/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadsTable)
      .where(eq(leadsTable.pipelineStatusId, req.params.id));
    const count = countResult[0]?.count ?? 0;
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete — ${count} lead(s) have this status`,
      });
    }
    await db
      .update(pipelineStatusesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pipelineStatusesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete status error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
