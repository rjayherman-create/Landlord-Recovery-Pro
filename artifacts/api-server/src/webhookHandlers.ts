import Stripe from "stripe";
import { getStripeSync, getStripeSecretKey } from "./stripeClient";
import { db, smallClaimsCasesTable, evidenceTable, landlordCases, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateCourtPDF } from "./services/pdfFill";
import { Resend } from "resend";
import { logger } from "./lib/logger";
import { scheduleFilingReminders } from "./services/reminders";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Received type: " +
          typeof payload +
          ". " +
          "Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }

    // ── 1. Parse and verify the Stripe event ────────────────────────────────
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event | null = null;

    if (webhookSecret) {
      const secretKey = await getStripeSecretKey();
      const stripe = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" as any });
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      // No webhook secret configured — parse without verification (dev only)
      logger.warn("STRIPE_WEBHOOK_SECRET not set; skipping signature verification");
      event = JSON.parse(payload.toString()) as Stripe.Event;
    }

    // ── 2. Handle checkout payments ──────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const caseId = session.metadata?.caseId;
      const type = session.metadata?.type;

      if (caseId && session.payment_status === "paid") {
        if (type === "landlord-filing-kit") {
          await WebhookHandlers.handleLandlordFilingKitPayment(Number(caseId), session.id);
        } else {
          const plan = session.metadata?.plan ?? "basic";
          await WebhookHandlers.handleSmallClaimsPayment(Number(caseId), session.id, plan);
        }
      }
    }

    // ── 3. Handle subscription lifecycle events ──────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata?.type === "landlord-subscription") {
        const userId = session.metadata?.userId;
        if (userId) {
          await WebhookHandlers.handleSubscriptionActivated(userId, session.customer as string);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await WebhookHandlers.handleSubscriptionCanceled(sub.customer as string);
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === "active" ? "active" : sub.status === "canceled" ? "canceled" : null;
      if (status) {
        await WebhookHandlers.handleSubscriptionStatusUpdate(sub.customer as string, status);
      }
    }

    // ── 4. Let the Replit Stripe sync handle its own events ──────────────────
    try {
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature);
    } catch (err: any) {
      // Stripe sync may reject events it doesn't own — that's OK
      logger.debug({ err }, "StripeSync ignored event (expected for small-claims events)");
    }
  }

  private static async handleSubscriptionActivated(userId: string, customerId: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ subscriptionStatus: "active", stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
    logger.info({ userId }, "Webhook: subscription activated");
  }

  private static async handleSubscriptionCanceled(customerId: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ subscriptionStatus: "canceled", updatedAt: new Date() })
      .where(eq(usersTable.stripeCustomerId, customerId));
    logger.info({ customerId }, "Webhook: subscription canceled");
  }

  private static async handleSubscriptionStatusUpdate(customerId: string, status: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ subscriptionStatus: status, updatedAt: new Date() })
      .where(eq(usersTable.stripeCustomerId, customerId));
    logger.info({ customerId, status }, "Webhook: subscription status updated");
  }

  private static async handleLandlordFilingKitPayment(caseId: number, sessionId: string): Promise<void> {
    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, caseId));

    if (!found) {
      logger.warn({ caseId }, "Webhook: landlord case not found for filing kit payment");
      return;
    }

    if (found.filingKitPaidAt) {
      logger.info({ caseId }, "Webhook: landlord filing kit already marked paid, skipping");
      return;
    }

    await db
      .update(landlordCases)
      .set({
        filingKitPaidAt: new Date(),
        filingKitStripeSessionId: sessionId,
        updatedAt: new Date(),
      })
      .where(eq(landlordCases.id, caseId));

    logger.info({ caseId }, "Webhook: landlord filing kit marked as paid");
  }

  private static async handleSmallClaimsPayment(caseId: number, sessionId: string, plan = "basic"): Promise<void> {
    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, caseId));

    if (!found) {
      logger.warn({ caseId }, "Webhook: small claims case not found");
      return;
    }

    if (found.paidAt) {
      logger.info({ caseId }, "Webhook: case already marked paid, skipping");
      return;
    }

    // Mark as paid
    await db
      .update(smallClaimsCasesTable)
      .set({
        paidAt: new Date(),
        status: "ready",
        stripeSessionId: sessionId,
        plan,
        updatedAt: new Date(),
      })
      .where(eq(smallClaimsCasesTable.id, caseId));

    logger.info({ caseId }, "Webhook: case marked as paid");

    // Generate PDF
    let pdfBytes: Uint8Array | null = null;
    try {
      const evidenceFiles = await db.select().from(evidenceTable).where(eq(evidenceTable.caseId, caseId));
      pdfBytes = await generateCourtPDF({
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
    } catch (err) {
      logger.error({ err, caseId }, "Webhook: PDF generation failed");
    }

    // Send email if we have an address and a PDF
    const email = found.claimantEmail;
    if (email && pdfBytes) {
      await WebhookHandlers.sendFilingEmail(email, found, pdfBytes);
    }

    // Schedule follow-up reminders
    try {
      await scheduleFilingReminders(caseId);
    } catch (err) {
      logger.error({ err, caseId }, "Webhook: failed to schedule reminders");
    }
  }

  private static async sendFilingEmail(
    to: string,
    found: typeof smallClaimsCasesTable.$inferSelect,
    pdfBytes: Uint8Array
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn("RESEND_API_KEY not set — skipping email");
      return;
    }

    const resend = new Resend(apiKey);
    const safeDefendant = found.defendantName.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
    const filename = `small-claims-${found.state.toLowerCase()}-vs-${safeDefendant}.pdf`;

    try {
      await resend.emails.send({
        from: "SmallClaims AI <filings@smallclaimsai.com>",
        to,
        subject: `Your ${found.state} Small Claims Filing — ${found.claimantName} v. ${found.defendantName}`,
        html: `
          <p>Hi ${found.claimantName},</p>
          <p>Your payment was successful! Attached is your completed small claims court form for <strong>${found.state}</strong>.</p>
          <p><strong>Case:</strong> ${found.claimantName} v. ${found.defendantName}<br/>
          <strong>Amount:</strong> $${found.claimAmount}<br/>
          <strong>Claim type:</strong> ${found.claimType}</p>
          <p>Print this form, sign it, and bring it to your local small claims court to file. You can also <a href="https://smallclaimsai.com/scar-filing/cases">log in to your account</a> to download it again at any time.</p>
          <p>Good luck with your case!</p>
          <p>— The SmallClaims AI Team</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:11px;color:#9ca3af;line-height:1.6;">
            <strong>Legal Disclaimer:</strong> SmallClaims AI is a self-help technology platform. It is not a law firm and does not provide legal advice or representation.
            Use of this service does not create an attorney-client relationship. You are solely responsible for reviewing, verifying, and filing your documents.
            Laws and court procedures vary by jurisdiction — always verify current requirements with your local courthouse.
            We do not guarantee any legal outcome. If you need legal advice, please consult a licensed attorney in your jurisdiction.
          </p>
        `,
        attachments: [
          {
            filename,
            content: Buffer.from(pdfBytes).toString("base64"),
          },
        ],
      });
      logger.info({ to }, "Webhook: filing email sent");
    } catch (err) {
      logger.error({ err, to }, "Webhook: email sending failed");
    }
  }
}
