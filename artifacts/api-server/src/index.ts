import app from "./app.js";
import { startReminderRunner } from "./services/reminders.js";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync, resetStripeSync } from "./stripeClient.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@workspace/db";
import path from "path";
import { fileURLToPath } from "url";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

async function runAppMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set — skipping app migrations");
    return;
  }
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // In production (Docker) migrations live at /app/lib/db/drizzle
    // In dev they live relative to this file's compiled location
    const migrationsFolder = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "lib/db/drizzle")
      : path.join(__dirname, "../../../lib/db/drizzle");
    console.log("Running app migrations from:", migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log("App migrations complete");
  } catch (err) {
    console.error("App migration failed (non-fatal):", err);
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }

  // stripe-replit-sync only works inside Replit environments.
  // On Railway (or any non-Replit host) we skip it and rely on
  // the direct Stripe SDK for all subscription / payment operations.
  const isReplit = !!(process.env.REPL_ID || process.env.REPLIT_CONNECTORS_HOSTNAME);
  if (!isReplit) {
    console.log("Non-Replit environment — skipping stripe-replit-sync, using Stripe SDK directly");
    return;
  }

  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    console.log("Stripe schema ready");

    resetStripeSync();
    const stripeSync = await getStripeSync();

    // Use FRONTEND_URL on Railway; fall back to Replit domain in dev
    const domain =
      process.env.FRONTEND_URL ||
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    if (domain) {
      await stripeSync.findOrCreateManagedWebhook(`${domain}/api/stripe/webhook`);
      console.log("Stripe webhook configured");
    }

    stripeSync.syncBackfill()
      .then(() => console.log("Stripe data synced"))
      .catch((err: any) => console.error("Stripe backfill error:", err));
  } catch (err) {
    console.error("Stripe init failed (non-fatal):", err);
  }
}

const PORT = Number(process.env.PORT) || 8080;

// Start listening immediately so health checks pass
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);
  startReminderRunner();
  // Run migrations then Stripe init in background — server already accepts requests
  runAppMigrations()
    .then(() => initStripe())
    .catch((err) => console.error("Init error:", err));
});
