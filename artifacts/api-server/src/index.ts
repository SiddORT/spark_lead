import app from "./app";
import { logger } from "./lib/logger";
import { verifyEmailConnection } from "./lib/email";
import { seedInitialAdmin, seedDefaultPermissions, seedPipelineStages, fixDuplicateLeadCompanies } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Warn on missing optional but important env vars
const warnIfMissing = (key: string) => {
  if (!process.env[key]) {
    logger.warn(`⚠️  Environment variable ${key} is not set`);
  }
};
warnIfMissing("JWT_SECRET");
warnIfMissing("FRONTEND_URL");

if (!process.env["JWT_SECRET"]) {
  logger.warn(
    "JWT_SECRET not set — using insecure default. Set it in Replit Secrets for production.",
  );
}

app.listen(port, "0.0.0.0", async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "🚀 Server listening on 0.0.0.0");
  logger.info(`🌍 NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 FRONTEND_URL: ${process.env.FRONTEND_URL || "(not set)"}`);
  logger.info(`📊 Health check: http://localhost:${port}/api/health`);

  // Run all seeds sequentially, awaiting each so errors appear in logs
  await seedInitialAdmin();
  await seedDefaultPermissions();
  await seedPipelineStages();
  await fixDuplicateLeadCompanies();

  // Verify email service (non-blocking — warn but don't fail startup)
  verifyEmailConnection().then((ok) => {
    if (!ok) {
      logger.warn(
        "⚠️  Email service unavailable — invites and notifications will not be delivered. Configure SMTP_USER + SMTP_PASS in Replit Secrets.",
      );
    }
  });
});
