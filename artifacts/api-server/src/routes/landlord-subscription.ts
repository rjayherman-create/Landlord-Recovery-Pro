import { Router } from "express";
import Stripe from "stripe";
import { getStripeSecretKey } from "../stripeClient";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

async function getStripe(): Promise<Stripe> {
  const key = await getStripeSecretKey();
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

async function findOrCreateSubscriptionPrice(stripe: Stripe): Promise<string> {
  const envPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
  if (envPriceId) return envPriceId;

  const products = await stripe.products.search({
    query: "name:'Recovery Pro Monthly' AND active:'true'",
  });

  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: "Recovery Pro Monthly",
      description: "Monthly subscription — unlimited AI demand letters, premium PDF exports, and court-specific filing instructions.",
      metadata: { plan: "pro_monthly" },
    });
    productId = product.id;
  }

  const prices = await stripe.prices.list({ product: productId, active: true, type: "recurring" });
  if (prices.data.length > 0) return prices.data[0].id;

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: 4900,
    currency: "usd",
    recurring: { interval: "month" },
  });
  return price.id;
}

router.post("/landlord/subscription/create", async (req: any, res) => {
  try {
    const stripe = await getStripe();
    const priceId = await findOrCreateSubscriptionPrice(stripe);
    const userId = req.auth?.userId as string | undefined;

    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/landlord-recovery/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/landlord-recovery/pricing`,
      metadata: { type: "landlord-subscription", ...(userId ? { userId } : {}) },
    };

    if (req.body?.email) {
      sessionParams.customer_email = req.body.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Failed to create subscription checkout");
    res.status(500).json({ error: err.message });
  }
});

async function findOrCreateProPrice(stripe: Stripe): Promise<string> {
  const envPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (envPriceId) return envPriceId;

  const products = await stripe.products.search({
    query: "name:'Recovery Pro Unlimited' AND active:'true'",
  });

  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: "Recovery Pro Unlimited",
      description: "Unlimited cases per month — best for active landlords.",
      metadata: { plan: "pro_unlimited" },
    });
    productId = product.id;
  }

  const prices = await stripe.prices.list({ product: productId, active: true, type: "recurring" });
  if (prices.data.length > 0) return prices.data[0].id;

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: 7900,
    currency: "usd",
    recurring: { interval: "month" },
  });
  return price.id;
}

router.post("/landlord/subscription/create-pro", async (req: any, res) => {
  try {
    const stripe = await getStripe();
    const priceId = await findOrCreateProPrice(stripe);
    const userId = req.auth?.userId as string | undefined;

    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/landlord-recovery/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/landlord-recovery/pricing`,
      metadata: { type: "landlord-subscription", ...(userId ? { userId } : {}) },
    };

    if (req.body?.email) {
      sessionParams.customer_email = req.body.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Failed to create pro subscription checkout");
    res.status(500).json({ error: err.message });
  }
});

router.post("/landlord/subscription/portal", async (req: any, res) => {
  try {
    const userId = req.auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Sign in required" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: "No subscription found" });
    }

    const stripe = await getStripe();
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/landlord-recovery/dashboard`,
    });

    res.json({ url: portal.url });
  } catch (err: any) {
    logger.error({ err }, "Failed to create billing portal");
    res.status(500).json({ error: err.message });
  }
});

router.get("/landlord/subscription/status", async (req: any, res) => {
  try {
    const userId = req.auth?.userId as string | undefined;
    if (!userId) return res.json({ isPro: false, status: null });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.json({ isPro: false, status: null });

    const isPro =
      user.subscriptionStatus === "active" || user.plan === "pro";

    res.json({
      isPro,
      status: user.subscriptionStatus ?? null,
      plan: user.plan ?? null,
      hasCustomerId: !!user.stripeCustomerId,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get subscription status");
    res.status(500).json({ error: err.message });
  }
});

async function findOrCreateOneTimePrice(stripe: Stripe): Promise<string> {
  const envPriceId = process.env.STRIPE_UNLOCK_PRICE_ID;
  if (envPriceId) return envPriceId;

  const products = await stripe.products.search({
    query: "name:'Recovery Pro Unlock' AND active:'true'",
  });

  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: "Recovery Pro Unlock",
      description: "One-time unlock — full case access, court-ready documents, and filing instructions.",
      metadata: { plan: "pro_unlock" },
    });
    productId = product.id;
  }

  const prices = await stripe.prices.list({ product: productId, active: true, type: "one_time" });
  if (prices.data.length > 0) return prices.data[0].id;

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: 2900,
    currency: "usd",
  });
  return price.id;
}

router.post("/landlord/payment/unlock", async (req: any, res) => {
  try {
    const stripe = await getStripe();
    const priceId = await findOrCreateOneTimePrice(stripe);
    const userId = req.auth?.userId as string | undefined;
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/landlord-recovery/checkout/success?type=unlock&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/landlord-recovery/pricing`,
      metadata: { type: "landlord-unlock", ...(userId ? { userId } : {}) },
    };

    if (req.body?.email) {
      sessionParams.customer_email = req.body.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Failed to create unlock checkout");
    res.status(500).json({ error: err.message });
  }
});

router.post("/landlord/payment/confirm-unlock", async (req: any, res) => {
  try {
    const { sessionId } = req.body as { sessionId: string };
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    const userId = session.metadata?.userId || (req.auth?.userId as string | undefined);
    if (!userId) return res.status(401).json({ error: "User not identified" });

    await db.update(usersTable)
      .set({ plan: "pro" })
      .where(eq(usersTable.id, userId));

    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Failed to confirm unlock payment");
    res.status(500).json({ error: err.message });
  }
});

export default router;
