import { Router } from "express";
import { db } from "@workspace/db";
import {
  leadsTable,
  pipelineStagesTable,
  pipelineStatusesTable,
} from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { subDays, format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

const router = Router();

// ── Role-based access helper ─────────────────────────────────────────────────
function filterLeadsByAccess<T extends { leadOwner: string | null; dealHandler: string | null }>(
  leads: T[],
  role: string,
  userId: string,
): T[] {
  if (role === "admin") return leads;
  if (role === "lead_owner") return leads.filter((l) => l.leadOwner === userId);
  if (role === "deal_handler") return leads.filter((l) => l.dealHandler === userId);
  return [];
}

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const allLeads = await db.select().from(leadsTable);
    const leads = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);
    const statuses = await db.select().from(pipelineStatusesTable);

    const totalLeads = leads.length;

    const wonStatusIds = new Set(statuses.filter((s) => s.isWon).map((s) => s.id));
    const lostStatusIds = new Set(statuses.filter((s) => s.isLost).map((s) => s.id));

    const wonLeads = leads.filter(
      (l) => l.pipelineStatusId && wonStatusIds.has(l.pipelineStatusId)
    );
    const lostLeads = leads.filter(
      (l) => l.pipelineStatusId && lostStatusIds.has(l.pipelineStatusId)
    );
    const terminalIds = new Set([...wonStatusIds, ...lostStatusIds]);
    const activeLeads = leads.filter(
      (l) => !l.pipelineStatusId || !terminalIds.has(l.pipelineStatusId)
    );

    const winRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;

    const terminalLeads = [...wonLeads, ...lostLeads];
    let avgConversionDays: number | null = null;
    if (terminalLeads.length > 0) {
      const totalDays = terminalLeads.reduce((acc, l) => {
        const resolvedDate = l.resolvedAt ?? l.updatedAt ?? l.createdAt;
        const diffMs = resolvedDate.getTime() - l.createdAt.getTime();
        return acc + Math.max(0, diffMs) / (1000 * 60 * 60 * 24);
      }, 0);
      avgConversionDays = totalDays / terminalLeads.length;
    }

    res.json({
      avgConversionDays,
      winRate: Math.round(winRate * 10) / 10,
      lostCount: lostLeads.length,
      activePipelineCount: activeLeads.length,
    });
  } catch (err) {
    req.log.error({ err }, "Get analytics stats error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/lead-trend", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { subDays: sdFn, format: fmtFn } = await import("date-fns");
    const since = subDays(new Date(), 30);
    const allLeads = await db.select().from(leadsTable);
    const accessible = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);
    const recent = accessible.filter((l) => l.createdAt >= since);

    const counts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      counts[d] = 0;
    }

    for (const lead of recent) {
      const d = format(lead.createdAt, "yyyy-MM-dd");
      if (counts[d] !== undefined) counts[d]++;
    }

    res.json(
      Object.entries(counts).map(([date, count]) => ({ date, count }))
    );
  } catch (err) {
    req.log.error({ err }, "Get lead trend error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/stage-distribution", requireAuth, async (req: AuthRequest, res) => {
  try {
    const stages = await db
      .select()
      .from(pipelineStagesTable)
      .where(eq(pipelineStagesTable.isActive, true))
      .orderBy(asc(pipelineStagesTable.sortOrder));
    const allLeads = await db.select().from(leadsTable);
    const leads = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);

    const counts = stages.map((stage) => ({
      stage: stage.displayName,
      stageName: stage.name,
      color: stage.color,
      count: leads.filter((l) => l.pipelineStageId === stage.id).length,
    }));

    res.json(counts);
  } catch (err) {
    req.log.error({ err }, "Get stage distribution error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/closure-breakdown", requireAuth, async (req: AuthRequest, res) => {
  try {
    const allLeads = await db.select().from(leadsTable);
    const leads = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);
    const statuses = await db
      .select()
      .from(pipelineStatusesTable)
      .orderBy(asc(pipelineStatusesTable.sortOrder));

    const terminalStatuses = statuses.filter((s) => s.isWon || s.isLost);
    const result = terminalStatuses.map((status) => ({
      status: status.displayName,
      color: status.color,
      isWon: status.isWon,
      isLost: status.isLost,
      count: leads.filter((l) => l.pipelineStatusId === status.id).length,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get closure breakdown error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/kill-reasons", requireAuth, async (req: AuthRequest, res) => {
  try {
    const allLeads = await db.select().from(leadsTable);
    const leads = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);
    const reasons = ["feature_gap", "price", "ghosted"];
    const counts = reasons.map((reason) => ({
      reason,
      count: leads.filter((l) => l.killReason === reason).length,
    }));
    res.json(counts);
  } catch (err) {
    req.log.error({ err }, "Get kill reasons error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/closure-trend", requireAuth, async (req: AuthRequest, res) => {
  try {
    const range = Math.min(Math.max(parseInt(String(req.query.range || "30"), 10), 7), 90);
    const allLeads = await db.select().from(leadsTable);
    const leads = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);
    const statuses = await db.select().from(pipelineStatusesTable);

    const wonIds = new Set(statuses.filter((s) => s.isWon).map((s) => s.id));
    const postponedIds = new Set(
      statuses
        .filter((s) => !s.isWon && (s.isLost ?? false) && s.displayName.toLowerCase().includes("postponed"))
        .map((s) => s.id)
    );
    const lostIds = new Set(
      statuses
        .filter((s) => !s.isWon && (s.isLost ?? false) && !s.displayName.toLowerCase().includes("postponed"))
        .map((s) => s.id)
    );

    const closureLeads = leads.filter(
      (l) =>
        l.pipelineStatusId &&
        (wonIds.has(l.pipelineStatusId) || lostIds.has(l.pipelineStatusId) || postponedIds.has(l.pipelineStatusId))
    );

    const result = [];
    for (let i = range - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLeads = closureLeads.filter(
        (l) => format(new Date(l.updatedAt), "yyyy-MM-dd") === dateStr
      );
      result.push({
        date: format(day, "dd MMM"),
        won: dayLeads.filter((l) => wonIds.has(l.pipelineStatusId!)).length,
        lost: dayLeads.filter((l) => lostIds.has(l.pipelineStatusId!)).length,
        postponed: dayLeads.filter((l) => postponedIds.has(l.pipelineStatusId!)).length,
      });
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get closure trend error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/weekly-conversion", requireAuth, async (req: AuthRequest, res) => {
  try {
    const allLeads = await db.select().from(leadsTable);
    const leads = filterLeadsByAccess(allLeads, req.user!.role, req.user!.userId);
    const statuses = await db.select().from(pipelineStatusesTable);
    const wonStatusIds = new Set(statuses.filter((s) => s.isWon).map((s) => s.id));

    const result = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const weekEnd = endOfWeek(subWeeks(new Date(), i));

      const weekLeads = leads.filter(
        (l) => l.createdAt >= weekStart && l.createdAt <= weekEnd
      );
      const won = weekLeads.filter(
        (l) => l.pipelineStatusId && wonStatusIds.has(l.pipelineStatusId)
      ).length;
      const total = weekLeads.length;
      const rate = total > 0 ? (won / total) * 100 : 0;

      result.push({
        week: format(weekStart, "MMM dd"),
        rate: Math.round(rate * 10) / 10,
        closed: won,
        total,
      });
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get weekly conversion error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
