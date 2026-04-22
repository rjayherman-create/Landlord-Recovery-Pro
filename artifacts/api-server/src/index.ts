import app from "./app.js";
import { startReminderRunner } from "./services/reminders.js";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync, resetStripeSync } from "./stripeClient.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }
  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    console.log("Stripe schema ready");

    // Reset singleton so it picks up the fully-initialized schema
    resetStripeSync();
    const stripeSync = await getStripeSync();
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log("Stripe webhook configured");

    stripeSync.syncBackfill()
      .then(() => console.log("Stripe data synced"))
      .catch((err: any) => console.error("Stripe backfill error:", err));
  } catch (err) {
    console.error("Stripe init failed (non-fatal):", err);
  }
}

const PORT = Number(process.env.PORT) || 8080;

await initStripe();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  startReminderRunner();
});
