import { Router } from "express";
import { db, landlordCases } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateLandlordCasePDF } from "../utils/landlordPdfGenerator";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

function buildFrontendBase(req: any): string {
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

// ─── 1. WATERMARKED PREVIEW (free, no auth) ─────────────────────────────────
router.get("/landlord/pdf/:id/preview", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) { res.status(400).json({ error: "invalid_id" }); return; }

    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, id));
    if (!found) { res.status(404).json({ error: "not_found" }); return; }

    const pdf = await generateLandlordCasePDF({
      landlordName: found.landlordName,
      landlordCompany: found.landlordCompany,
      landlordAddress: found.landlordAddress,
      landlordEmail: found.landlordEmail,
      tenantName: found.tenantName,
      tenantAddress: found.tenantAddress,
      propertyAddress: found.propertyAddress,
      claimType: found.claimType,
      claimAmount: Number(found.claimAmount),
      description: found.description,
      demandLetterText: found.demandLetterText,
      state: found.state,
      monthlyRent: found.monthlyRent ? Number(found.monthlyRent) : null,
      monthsOwed: found.monthsOwed,
      leaseStartDate: found.leaseStartDate,
      leaseEndDate: found.leaseEndDate,
      watermark: "PREVIEW — UNLOCK TO DOWNLOAD",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="preview-${id}.pdf"`);
    res.send(pdf);
  } catch (err: any) {
    req.log.error({ err }, "landlord pdf preview failed");
    res.status(500).json({ error: "preview_error", message: err.message });
  }
});

// ─── 2. STRIPE CHECKOUT for filing kit ──────────────────────────────────────
router.post("/landlord/pdf/:id/checkout", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) { res.status(400).json({ error: "invalid_id" }); return; }

    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, id));
    if (!found) { res.status(404).json({ error: "not_found" }); return; }

    // Already paid — skip checkout
    if (found.filingKitPaidAt) {
      res.json({ alreadyPaid: true });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const base = buildFrontendBase(req);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Landlord Recovery — Filing Kit",
              description: `${found.claimType} · ${found.state} · vs. ${found.tenantName} · Demand letter + court filing guide`,
            },
            unit_amount: 2900, // $29.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        caseId: String(id),
        type: "landlord-filing-kit",
      },
      success_url: `${base}/landlord-recovery/checkout/success?caseId=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/landlord-recovery/checkout/cancel`,
    });

    // Store session ID on the case so webhook can look it up
    await db
      .update(landlordCases)
      .set({ filingKitStripeSessionId: session.id, updatedAt: new Date() })
      .where(eq(landlordCases.id, id));

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "landlord pdf checkout failed");
    res.status(500).json({ error: "checkout_error", message: err.message });
  }
});

// ─── 3. FINAL DOWNLOAD (after payment) ──────────────────────────────────────
router.get("/landlord/pdf/:id/download", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sessionId = req.query.session_id as string | undefined;

    if (!id) { res.status(400).json({ error: "invalid_id" }); return; }

    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, id));
    if (!found) { res.status(404).json({ error: "not_found" }); return; }

    // Already paid in DB — allow download directly
    if (!found.filingKitPaidAt) {
      if (!sessionId) {
        res.status(402).json({ error: "payment_required", message: "Payment required to download the filing kit." });
        return;
      }

      // Verify with Stripe
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (
        session.payment_status !== "paid" ||
        session.metadata?.type !== "landlord-filing-kit" ||
        String(session.metadata?.caseId) !== String(id)
      ) {
        res.status(402).json({ error: "payment_not_confirmed", message: "Payment not confirmed for this case." });
        return;
      }

      // Record payment in DB
      await db
        .update(landlordCases)
        .set({
          filingKitPaidAt: new Date(),
          filingKitStripeSessionId: sessionId,
          updatedAt: new Date(),
        })
        .where(eq(landlordCases.id, id));
    }

    // Generate clean (no watermark) PDF
    const pdf = await generateLandlordCasePDF({
      landlordName: found.landlordName,
      landlordCompany: found.landlordCompany,
      landlordAddress: found.landlordAddress,
      landlordEmail: found.landlordEmail,
      tenantName: found.tenantName,
      tenantAddress: found.tenantAddress,
      propertyAddress: found.propertyAddress,
      claimType: found.claimType,
      claimAmount: Number(found.claimAmount),
      description: found.description,
      demandLetterText: found.demandLetterText,
      state: found.state,
      monthlyRent: found.monthlyRent ? Number(found.monthlyRent) : null,
      monthsOwed: found.monthsOwed,
      leaseStartDate: found.leaseStartDate,
      leaseEndDate: found.leaseEndDate,
    });

    const safeName = found.tenantName.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
    const filename = `filing-kit-${found.state.toLowerCase()}-vs-${safeName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (err: any) {
    req.log.error({ err }, "landlord pdf download failed");
    res.status(500).json({ error: "download_error", message: err.message });
  }
});

// ─── 4. CHECK PAYMENT STATUS ─────────────────────────────────────────────────
router.get("/landlord/pdf/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, id));
    if (!found) { res.status(404).json({ error: "not_found" }); return; }
    res.json({ paid: !!found.filingKitPaidAt, paidAt: found.filingKitPaidAt ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
