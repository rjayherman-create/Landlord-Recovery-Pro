import { Router, type IRouter } from "express";
import { db, smallClaimsCasesTable, evidenceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateCourtPDF, getStateConfig, getSupportedStates } from "../services/pdfFill";
import { improveClaim } from "../services/ai";
import { getUncachableStripeClient } from "../stripeClient";
import { PDFDocument, rgb, degrees } from "pdf-lib";

const router: IRouter = Router();

const PRICE_CENTS = 2900;

function buildFrontendBase(req: any): string {
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

async function getEvidenceForCase(caseId: number) {
  return db.select().from(evidenceTable).where(eq(evidenceTable.caseId, caseId));
}


// ==========================
// 1. AI IMPROVE CLAIM
// ==========================
router.post("/ai-improve", async (req, res) => {
  try {
    const { description, amount } = req.body as { description: string; amount?: number };
    if (!description) {
      res.status(400).json({ error: "description is required" });
      return;
    }

    const prompt = amount
      ? `${description}\n\nAmount: $${amount}`
      : description;

    const text = await improveClaim(prompt);
    res.json({ text });
  } catch (err: any) {
    req.log.error({ err }, "AI improve failed");
    res.status(500).json({ error: "AI failed", message: err.message });
  }
});


// ==========================
// 2. WATERMARKED PREVIEW PDF
// ==========================
router.post("/cases/:id/preview", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, id));

    if (!found) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }

    const config = getStateConfig(found.state);
    if (!config) {
      res.status(422).json({ error: "unsupported_state", message: `No template for ${found.state}` });
      return;
    }

    const evidenceFiles = await getEvidenceForCase(id);

    const pdfBytes = await generateCourtPDF({
      state: found.state,
      claimantName: found.claimantName,
      claimantAddress: found.claimantAddress,
      defendantName: found.defendantName,
      defendantAddress: found.defendantAddress,
      claimAmount: Number(found.claimAmount),
      claimDescription: found.claimDescription,
      incidentDate: found.incidentDate,
      desiredOutcome: found.desiredOutcome,
      evidenceFiles,
    });

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText("PREVIEW — UNLOCK TO DOWNLOAD", {
        x: width / 2 - 200,
        y: height / 2,
        size: 36,
        color: rgb(0.75, 0.75, 0.75),
        rotate: degrees(30),
        opacity: 0.45,
      });
    }

    const watermarked = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="preview.pdf"`);
    res.send(Buffer.from(watermarked));
  } catch (err: any) {
    req.log.error({ err }, "Preview PDF failed");
    res.status(500).json({ error: "preview_error", message: err.message });
  }
});


// ==========================
// 3. STRIPE CHECKOUT
// ==========================
router.post("/cases/:id/checkout", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, id));

    if (!found) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }

    if (found.paidAt) {
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
              name: "SmallClaims AI — Court PDF Download",
              description: `${found.state} court form · ${found.claimantName} v. ${found.defendantName}`,
            },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: { caseId: String(id) },
      success_url: `${base}/scar-filing/checkout/success?caseId=${id}&session_id={CHECKOUT_SESSION_ID}&apiBase=${encodeURIComponent(base)}`,
      cancel_url: `${base}/scar-filing/checkout/cancel`,
    });

    await db
      .update(smallClaimsCasesTable)
      .set({ stripeSessionId: session.id, updatedAt: new Date() })
      .where(eq(smallClaimsCasesTable.id, id));

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Checkout failed");
    res.status(500).json({ error: "checkout_error", message: err.message });
  }
});


// ==========================
// 4. FINAL PDF DOWNLOAD (after payment)
// ==========================
router.get("/small-claims/download/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sessionId = req.query.session_id as string | undefined;

    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, id));

    if (!found) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }

    if (!found.paidAt) {
      if (!sessionId) {
        res.status(402).json({ error: "payment_required", message: "Payment required to download" });
        return;
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid" || String(session.metadata?.caseId) !== String(id)) {
        res.status(402).json({ error: "payment_required", message: "Payment not confirmed" });
        return;
      }

      await db
        .update(smallClaimsCasesTable)
        .set({ paidAt: new Date(), status: "ready", updatedAt: new Date() })
        .where(eq(smallClaimsCasesTable.id, id));
    }

    const config = getStateConfig(found.state);
    if (!config) {
      res.status(422).json({ error: "unsupported_state", message: `No template for ${found.state}` });
      return;
    }

    const evidenceFiles = await getEvidenceForCase(id);

    const pdfBytes = await generateCourtPDF({
      state: found.state,
      claimantName: found.claimantName,
      claimantAddress: found.claimantAddress,
      defendantName: found.defendantName,
      defendantAddress: found.defendantAddress,
      claimAmount: Number(found.claimAmount),
      claimDescription: found.generatedStatement ?? found.claimDescription,
      incidentDate: found.incidentDate,
      desiredOutcome: found.desiredOutcome,
      evidenceFiles,
    });

    const safeDefendant = found.defendantName.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
    const filename = `small-claims-${found.state.toLowerCase()}-vs-${safeDefendant}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    req.log.error({ err }, "Download failed");
    res.status(500).json({ error: "download_error", message: err.message });
  }
});


// ==========================
// EXISTING CLEAN DOWNLOAD (no payment gate — alias for /cases/:id/pdf)
// ==========================
router.get("/cases/:id/pdf", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, id));

    if (!found) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }

    const config = getStateConfig(found.state);
    if (!config) {
      res.status(422).json({
        error: "unsupported_state",
        message: `PDF not supported for ${found.state}. Supported: ${getSupportedStates().join(", ")}`,
      });
      return;
    }

    const pdfBytes = await generateCourtPDF({
      state: found.state,
      claimantName: found.claimantName,
      claimantAddress: found.claimantAddress,
      defendantName: found.defendantName,
      defendantAddress: found.defendantAddress,
      claimAmount: Number(found.claimAmount),
      claimDescription: found.claimDescription,
      incidentDate: found.incidentDate,
      desiredOutcome: found.desiredOutcome,
    });

    const safeDefendant = found.defendantName.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
    const filename = `small-claims-${found.state.toLowerCase()}-vs-${safeDefendant}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    req.log.error({ err }, "PDF failed");
    res.status(500).json({ error: "pdf_error", message: err.message });
  }
});

router.get("/cases/pdf-states", async (_req, res) => {
  res.json({ states: getSupportedStates() });
});

export default router;
