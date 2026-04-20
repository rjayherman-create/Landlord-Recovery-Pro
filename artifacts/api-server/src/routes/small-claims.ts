import { Router, type IRouter } from "express";
import { db, smallClaimsCasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSmallClaimBody,
  UpdateSmallClaimBody,
  GetSmallClaimParams,
  UpdateSmallClaimParams,
  DeleteSmallClaimParams,
} from "@workspace/api-zod";
import { generateStatement } from "../services/ai";

const router: IRouter = Router();

function formatCase(c: typeof smallClaimsCasesTable.$inferSelect) {
  return {
    ...c,
    claimAmount: Number(c.claimAmount),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/small-claims", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const cases = await db
      .select()
      .from(smallClaimsCasesTable)
      .orderBy(smallClaimsCasesTable.createdAt);
    res.json(cases.map(formatCase));
  } catch (err) {
    req.log.error({ err }, "Failed to list small claims");
    res.status(500).json({ error: "internal_error", message: "Failed to list small claims" });
  }
});

router.post("/small-claims", async (req, res) => {
  try {
    const body = CreateSmallClaimBody.parse(req.body);
    const [created] = await db
      .insert(smallClaimsCasesTable)
      .values({
        claimType: body.claimType,
        state: body.state ?? "NY",
        county: body.county ?? null,
        courtLocation: body.courtLocation ?? null,
        claimantName: body.claimantName,
        claimantEmail: body.claimantEmail ?? null,
        claimantPhone: body.claimantPhone ?? null,
        claimantAddress: body.claimantAddress ?? null,
        defendantName: body.defendantName,
        defendantAddress: body.defendantAddress ?? null,
        defendantEmail: body.defendantEmail ?? null,
        defendantPhone: body.defendantPhone ?? null,
        claimAmount: String(body.claimAmount),
        claimDescription: body.claimDescription,
        claimBasis: body.claimBasis ?? null,
        incidentDate: body.incidentDate ?? null,
        desiredOutcome: body.desiredOutcome ?? null,
        supportingFacts: body.supportingFacts ?? null,
        notes: body.notes ?? null,
      })
      .returning();
    res.status(201).json(formatCase(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create small claim");
    res.status(500).json({ error: "internal_error", message: "Failed to create small claim" });
  }
});

router.get("/small-claims/:id", async (req, res) => {
  try {
    const { id } = GetSmallClaimParams.parse({ id: Number(req.params.id) });
    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, id));
    if (!found) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }
    res.json(formatCase(found));
  } catch (err) {
    req.log.error({ err }, "Failed to get small claim");
    res.status(500).json({ error: "internal_error", message: "Failed to get small claim" });
  }
});

router.put("/small-claims/:id", async (req, res) => {
  try {
    const { id } = UpdateSmallClaimParams.parse({ id: Number(req.params.id) });
    const body = UpdateSmallClaimBody.parse(req.body);
    const updateData: Record<string, unknown> = {};

    if (body.claimType !== undefined) updateData.claimType = body.claimType;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.courtLocation !== undefined) updateData.courtLocation = body.courtLocation;
    if (body.claimantName !== undefined) updateData.claimantName = body.claimantName;
    if (body.claimantEmail !== undefined) updateData.claimantEmail = body.claimantEmail;
    if (body.claimantPhone !== undefined) updateData.claimantPhone = body.claimantPhone;
    if (body.claimantAddress !== undefined) updateData.claimantAddress = body.claimantAddress;
    if (body.defendantName !== undefined) updateData.defendantName = body.defendantName;
    if (body.defendantAddress !== undefined) updateData.defendantAddress = body.defendantAddress;
    if (body.defendantEmail !== undefined) updateData.defendantEmail = body.defendantEmail;
    if (body.defendantPhone !== undefined) updateData.defendantPhone = body.defendantPhone;
    if (body.claimAmount !== undefined) updateData.claimAmount = String(body.claimAmount);
    if (body.claimDescription !== undefined) updateData.claimDescription = body.claimDescription;
    if (body.claimBasis !== undefined) updateData.claimBasis = body.claimBasis;
    if (body.incidentDate !== undefined) updateData.incidentDate = body.incidentDate;
    if (body.desiredOutcome !== undefined) updateData.desiredOutcome = body.desiredOutcome;
    if (body.supportingFacts !== undefined) updateData.supportingFacts = body.supportingFacts;
    if (body.generatedStatement !== undefined) updateData.generatedStatement = body.generatedStatement;
    if (body.conversationId !== undefined) updateData.conversationId = body.conversationId;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.filingDeadline !== undefined) updateData.filingDeadline = body.filingDeadline;
    if (body.caseNumber !== undefined) updateData.caseNumber = body.caseNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(smallClaimsCasesTable)
      .set(updateData)
      .where(eq(smallClaimsCasesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }
    res.json(formatCase(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update small claim");
    res.status(500).json({ error: "internal_error", message: "Failed to update small claim" });
  }
});

router.delete("/small-claims/:id", async (req, res) => {
  try {
    const { id } = DeleteSmallClaimParams.parse({ id: Number(req.params.id) });
    await db.delete(smallClaimsCasesTable).where(eq(smallClaimsCasesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete small claim");
    res.status(500).json({ error: "internal_error", message: "Failed to delete small claim" });
  }
});

router.post("/small-claims/:id/generate-statement", async (req, res) => {
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

    const statement = await generateStatement({
      claimType: found.claimType,
      state: found.state,
      county: found.county,
      claimantName: found.claimantName,
      defendantName: found.defendantName,
      claimAmount: Number(found.claimAmount),
      claimDescription: found.claimDescription,
      incidentDate: found.incidentDate,
      claimBasis: found.claimBasis,
      supportingFacts: found.supportingFacts,
      desiredOutcome: found.desiredOutcome,
    });

    const [updated] = await db
      .update(smallClaimsCasesTable)
      .set({ generatedStatement: statement, updatedAt: new Date() })
      .where(eq(smallClaimsCasesTable.id, id))
      .returning();

    res.json({ statement });
  } catch (err) {
    req.log.error({ err }, "Failed to generate statement");
    res.status(500).json({ error: "internal_error", message: "Failed to generate statement" });
  }
});

export default router;
