import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db";
import { sql, and, gte, lte, eq, isNotNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { subDays, format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

const router = Router();

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const leads = await db.select().from(leadsTable);

    const totalLeads = leads.length;
    const closedLeads = leads.filter((l) => l.outcome === "closed");
    const lostLeads = leads.filter((l) => l.outcome === "lost");
    const activeLeads = leads.filter((l) => l.outcome === "wip" || !l.outcome);

    const winRate = totalLeads > 0 ? (closedLeads.length / totalLeads) * 100 : 0;

    const resolvedLeads = leads.filter(
      (l) => l.resolvedAt && l.outcome && l.outcome !== "wip"
    );
    let avgConversionDays: number | null = null;
    if (resolvedLeads.length > 0) {
      const totalDays = resolvedLeads.reduce((acc, l) => {
        const diff = l.resolvedAt!.getTime() - l.createdAt.getTime();
        return acc + diff / (1000 * 60 * 60 * 24);
      }, 0);
      avgConversionDays = totalDays / resolvedLeads.length;
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
    const since = subDays(new Date(), 30);
    const leads = await db
      .select()
      .from(leadsTable)
      .where(gte(leadsTable.createdAt, since));

    const counts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      counts[d] = 0;
    }

    for (const lead of leads) {
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
    const leads = await db.select().from(leadsTable);
    const stages = ["discovery", "qualification", "strategy", "resolution"];
    const counts = stages.map((stage) => ({
      stage,
      count: leads.filter((l) => l.stage === stage).length,
    }));
    res.json(counts);
  } catch (err) {
    req.log.error({ err }, "Get stage distribution error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/kill-reasons", requireAuth, async (req: AuthRequest, res) => {
  try {
    const leads = await db.select().from(leadsTable);
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

router.get("/weekly-conversion", requireAuth, async (req: AuthRequest, res) => {
  try {
    const leads = await db.select().from(leadsTable);
    const result = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const weekEnd = endOfWeek(subWeeks(new Date(), i));

      const weekLeads = leads.filter(
        (l) => l.createdAt >= weekStart && l.createdAt <= weekEnd
      );
      const closed = weekLeads.filter((l) => l.outcome === "closed").length;
      const total = weekLeads.length;
      const rate = total > 0 ? (closed / total) * 100 : 0;

      result.push({
        week: format(weekStart, "MMM dd"),
        rate: Math.round(rate * 10) / 10,
        closed,
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
