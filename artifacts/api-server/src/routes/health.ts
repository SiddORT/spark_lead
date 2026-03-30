import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Basic liveness check (used by Replit infra)
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// Full diagnostic health check — useful for debugging production issues
router.get("/health", async (_req, res) => {
  const checks: Record<string, string> = {};

  // Database connectivity
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "✅ connected";
  } catch (e: any) {
    checks.database = `❌ ${e.message}`;
  }

  // Environment variables
  checks.jwtSecret   = process.env.JWT_SECRET    ? "✅ set" : "❌ missing";
  checks.frontendUrl = process.env.FRONTEND_URL   ? `✅ ${process.env.FRONTEND_URL}` : "⚠️  not set (using default)";
  checks.smtpHost    = process.env.SMTP_HOST      ? `✅ ${process.env.SMTP_HOST}` : "⚠️  not set";
  checks.smtpUser    = process.env.SMTP_USER      ? "✅ set" : "⚠️  not set (emails disabled)";
  checks.nodeEnv     = process.env.NODE_ENV       || "development";
  checks.port        = process.env.PORT           || "(not set)";

  const allOk = !Object.values(checks).some((v) => v.startsWith("❌"));

  res.status(allOk ? 200 : 500).json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
