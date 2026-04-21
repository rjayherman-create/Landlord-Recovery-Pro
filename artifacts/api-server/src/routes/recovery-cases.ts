import { Router, type IRouter } from "express";
import { db, recoveryCases } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

function formatCase(c: typeof recoveryCases.$inferSelect) {
  return {
    ...c,
    amountOwed: Number(c.amountOwed),
    rentOwed: c.rentOwed !== null ? Number(c.rentOwed) : 0,
    damageOwed: c.damageOwed !== null ? Number(c.damageOwed) : 0,
    utilityOwed: c.utilityOwed !== null ? Number(c.utilityOwed) : 0,
    otherOwed: c.otherOwed !== null ? Number(c.otherOwed) : 0,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ── List ─────────────────────────────────────────────────────────────────────
router.get("/recovery-cases", async (req: any, res: any) => {
  try {
    const cases = await db
      .select()
      .from(recoveryCases)
      .orderBy(recoveryCases.createdAt);
    res.json(cases.map(formatCase));
  } catch (err) {
    req.log?.error({ err }, "Failed to list recovery cases");
    res.status(500).json({ error: "internal_error", message: "Failed to list recovery cases" });
  }
});

// ── Create ───────────────────────────────────────────────────────────────────
router.post("/recovery-cases", async (req: any, res: any) => {
  try {
    const body = req.body as {
      caseType: string;
      claimantName: string;
      subjectName: string;
      amountOwed: number | string;
      appMode?: string;
      businessName?: string;
      propertyName?: string;
      unitLabel?: string;
      guarantorName?: string;
      lastKnownAddress?: string;
      subjectPhone?: string;
      subjectEmail?: string;
      moveOutDate?: string;
      serviceStartDate?: string;
      serviceEndDate?: string;
      rentOwed?: number | string;
      damageOwed?: number | string;
      utilityOwed?: number | string;
      otherOwed?: number | string;
      notes?: string;
      sourceMeta?: Record<string, unknown>;
      userId?: string;
      status?: string;
    };

    const [created] = await db
      .insert(recoveryCases)
      .values({
        caseType: body.caseType,
        claimantName: body.claimantName,
        subjectName: body.subjectName,
        amountOwed: String(body.amountOwed),
        appMode: body.appMode ?? "landlord",
        businessName: body.businessName ?? null,
        propertyName: body.propertyName ?? null,
        unitLabel: body.unitLabel ?? null,
        guarantorName: body.guarantorName ?? null,
        lastKnownAddress: body.lastKnownAddress ?? null,
        subjectPhone: body.subjectPhone ?? null,
        subjectEmail: body.subjectEmail ?? null,
        moveOutDate: body.moveOutDate ?? null,
        serviceStartDate: body.serviceStartDate ?? null,
        serviceEndDate: body.serviceEndDate ?? null,
        rentOwed: body.rentOwed !== undefined ? String(body.rentOwed) : "0",
        damageOwed: body.damageOwed !== undefined ? String(body.damageOwed) : "0",
        utilityOwed: body.utilityOwed !== undefined ? String(body.utilityOwed) : "0",
        otherOwed: body.otherOwed !== undefined ? String(body.otherOwed) : "0",
        notes: body.notes ?? null,
        sourceMeta: body.sourceMeta ?? null,
        userId: body.userId ?? null,
        status: body.status ?? "draft",
      })
      .returning();
    res.status(201).json(formatCase(created));
  } catch (err) {
    req.log?.error({ err }, "Failed to create recovery case");
    res.status(500).json({ error: "internal_error", message: "Failed to create recovery case" });
  }
});

// ── Get one ──────────────────────────────────────────────────────────────────
router.get("/recovery-cases/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const [found] = await db
      .select()
      .from(recoveryCases)
      .where(eq(recoveryCases.id, id));
    if (!found) {
      res.status(404).json({ error: "not_found", message: "Recovery case not found" });
      return;
    }
    res.json(formatCase(found));
  } catch (err) {
    req.log?.error({ err }, "Failed to get recovery case");
    res.status(500).json({ error: "internal_error", message: "Failed to get recovery case" });
  }
});

// ── Update ───────────────────────────────────────────────────────────────────
router.put("/recovery-cases/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    const stringFields = [
      "caseType", "appMode", "claimantName", "businessName", "propertyName",
      "unitLabel", "subjectName", "guarantorName", "lastKnownAddress",
      "subjectPhone", "subjectEmail", "moveOutDate", "serviceStartDate",
      "serviceEndDate", "notes", "userId", "status", "generatedStatement",
      "conversationId", "stripeSessionId", "plan",
    ] as const;

    const numericFields = [
      "amountOwed", "rentOwed", "damageOwed", "utilityOwed", "otherOwed",
    ] as const;

    for (const field of stringFields) {
      if (field in body) updateData[field] = body[field];
    }
    for (const field of numericFields) {
      if (field in body) updateData[field] = String(body[field]);
    }
    if ("sourceMeta" in body) updateData.sourceMeta = body.sourceMeta;
    if ("emailReminders" in body) updateData.emailReminders = body.emailReminders;
    if ("smsReminders" in body) updateData.smsReminders = body.smsReminders;
    if ("paidAt" in body) updateData.paidAt = body.paidAt ? new Date(body.paidAt as string) : null;

    const [updated] = await db
      .update(recoveryCases)
      .set(updateData)
      .where(eq(recoveryCases.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Recovery case not found" });
      return;
    }
    res.json(formatCase(updated));
  } catch (err) {
    req.log?.error({ err }, "Failed to update recovery case");
    res.status(500).json({ error: "internal_error", message: "Failed to update recovery case" });
  }
});

// ── Delete ───────────────────────────────────────────────────────────────────
router.delete("/recovery-cases/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await db.delete(recoveryCases).where(eq(recoveryCases.id, id));
    res.status(204).send();
  } catch (err) {
    req.log?.error({ err }, "Failed to delete recovery case");
    res.status(500).json({ error: "internal_error", message: "Failed to delete recovery case" });
  }
});

// ── Status patch ─────────────────────────────────────────────────────────────
router.patch("/recovery-cases/:id/status", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body as { status: string; notes?: string };
    const [updated] = await db
      .update(recoveryCases)
      .set({ status, ...(notes !== undefined ? { notes } : {}), updatedAt: new Date() })
      .where(eq(recoveryCases.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Recovery case not found" });
      return;
    }
    res.json(formatCase(updated));
  } catch (err) {
    req.log?.error({ err }, "Failed to update recovery case status");
    res.status(500).json({ error: "internal_error", message: "Failed to update recovery case status" });
  }
});

// ── Generate demand statement ─────────────────────────────────────────────────
router.post("/recovery-cases/:id/generate-statement", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const [found] = await db
      .select()
      .from(recoveryCases)
      .where(eq(recoveryCases.id, id));

    if (!found) {
      res.status(404).json({ error: "not_found", message: "Recovery case not found" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: `Write a professional demand letter for a landlord recovery case.

Claimant (Landlord): ${found.claimantName}${found.businessName ? ` / ${found.businessName}` : ""}
${found.propertyName ? `Property: ${found.propertyName}${found.unitLabel ? `, Unit ${found.unitLabel}` : ""}` : ""}
Subject (Tenant): ${found.subjectName}
${found.lastKnownAddress ? `Last Known Address: ${found.lastKnownAddress}` : ""}
Case Type: ${found.caseType}
Total Amount Owed: $${found.amountOwed}
${Number(found.rentOwed) > 0 ? `  - Unpaid Rent: $${found.rentOwed}` : ""}
${Number(found.damageOwed) > 0 ? `  - Property Damage: $${found.damageOwed}` : ""}
${Number(found.utilityOwed) > 0 ? `  - Utilities: $${found.utilityOwed}` : ""}
${Number(found.otherOwed) > 0 ? `  - Other Charges: $${found.otherOwed}` : ""}
${found.moveOutDate ? `Move-Out Date: ${found.moveOutDate}` : ""}
${found.notes ? `Additional Notes: ${found.notes}` : ""}

The letter should:
- Be addressed from ${found.claimantName} to ${found.subjectName}
- Clearly state the total amount owed and itemized breakdown
- Reference the rental property and tenancy period
- Demand payment within 14 days
- Warn that failure to pay may result in legal action including small claims court filing
- Remain professional and factual
- Include a closing with contact instructions

Return only the letter text, formatted with proper spacing.`,
        },
      ],
    });

    const statement = response.choices[0]?.message?.content ?? "";

    await db
      .update(recoveryCases)
      .set({ generatedStatement: statement, updatedAt: new Date() })
      .where(eq(recoveryCases.id, id));

    res.json({ statement });
  } catch (err) {
    req.log?.error({ err }, "Failed to generate recovery case statement");
    res.status(500).json({ error: "internal_error", message: "Failed to generate statement" });
  }
});

export default router;
