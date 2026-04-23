console.log("📦 APP INITIALIZING...");

import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// ── Healthcheck routes registered FIRST — before any middleware ──────────────
// Railway, load balancers, and uptime monitors hit these with no cookies/auth.
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
// ─────────────────────────────────────────────────────────────────────────────

// Clerk proxy — must be before express.json() (production only)
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Stripe webhook MUST be registered before express.json() — needs raw Buffer body
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing stripe-signature' });
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, 'Stripe webhook error');
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files BEFORE Clerk middleware — no auth needed for assets
if (process.env.NODE_ENV === "production") {
  const landlordDir = path.join(process.cwd(), "artifacts/landlord-recovery/dist/public");
  app.use(express.static(landlordDir));
}

// Clerk middleware — attaches auth state to req; does NOT block unauthenticated requests
// Wrapped so a bad/missing key logs a warning instead of crashing every request
app.use((req, res, next) => {
  if (!process.env.CLERK_PUBLISHABLE_KEY && !process.env.CLERK_SECRET_KEY) {
    return next();
  }
  clerkMiddleware()(req, res, (err) => {
    if (err) {
      logger.warn({ err }, "Clerk middleware error — continuing without auth");
      return next();
    }
    next();
  });
});

app.use("/api", router);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// SPA fallback — after static assets and API routes
if (process.env.NODE_ENV === "production") {
  const landlordDir = path.join(process.cwd(), "artifacts/landlord-recovery/dist/public");
  app.get("*path", (_req, res) => {
    res.sendFile(path.join(landlordDir, "index.html"), (err) => {
      if (err) res.status(200).sendFile(path.join(landlordDir, "index.html"));
    });
  });
}

export default app;
