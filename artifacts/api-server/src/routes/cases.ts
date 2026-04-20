import { Router, type IRouter } from "express";
import { db, smallClaimsCasesTable, evidenceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateStatement } from "../services/ai";

import {
  CreateCaseBody,
  UpdateCaseBody,
  GetCaseParams,
  UpdateCaseParams,
  DeleteCaseParams,
  CreateSmallClaimBody,
  UpdateSmallClaimBody,
  GetSmallClaimParams,
  UpdateSmallClaimParams,
  DeleteSmallClaimParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getEvidenceForCase(caseId: number) {
  return db.select().from(evidenceTable).where(eq(evidenceTable.caseId, caseId));
}

function formatCase(c: typeof smallClaimsCasesTable.$inferSelect) {
  return {
    ...c,
    claimAmount: Number(c.claimAmount),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function handleList(req: any, res: any) {
  try {
    const cases = await db
      .select()
      .from(smallClaimsCasesTable)
      .orderBy(smallClaimsCasesTable.createdAt);
    res.json(cases.map(formatCase));
  } catch (err) {
    req.log.error({ err }, "Failed to list cases");
    res.status(500).json({ error: "internal_error", message: "Failed to list cases" });
  }
}

function buildInsertValues(body: ReturnType<typeof CreateCaseBody.parse>) {
  return {
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
  };
}

async function handleCreate(req: any, res: any, schema: typeof CreateCaseBody) {
  try {
    const body = schema.parse(req.body);
    const [created] = await db
      .insert(smallClaimsCasesTable)
      .values(buildInsertValues(body))
      .returning();
    res.status(201).json(formatCase(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create case");
    res.status(500).json({ error: "internal_error", message: "Failed to create case" });
  }
}

async function handleGet(req: any, res: any, schema: typeof GetCaseParams) {
  try {
    const { id } = schema.parse({ id: Number(req.params.id) });
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
    req.log.error({ err }, "Failed to get case");
    res.status(500).json({ error: "internal_error", message: "Failed to get case" });
  }
}

async function handleUpdate(req: any, res: any, paramSchema: typeof UpdateCaseParams, bodySchema: typeof UpdateCaseBody) {
  try {
    const { id } = paramSchema.parse({ id: Number(req.params.id) });
    const body = bodySchema.parse(req.body);
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
    if ("generatedStatement" in body && body.generatedStatement !== undefined) updateData.generatedStatement = body.generatedStatement;
    if ("conversationId" in body && body.conversationId !== undefined) updateData.conversationId = body.conversationId;
    if (body.status !== undefined) updateData.status = body.status;
    if ("lastUpdate" in body && body.lastUpdate !== undefined) updateData.lastUpdate = body.lastUpdate;
    if ("filingDeadline" in body && body.filingDeadline !== undefined) updateData.filingDeadline = body.filingDeadline;
    if ("hearingDate" in body && body.hearingDate !== undefined) updateData.hearingDate = body.hearingDate;
    if ("caseNumber" in body && body.caseNumber !== undefined) updateData.caseNumber = body.caseNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if ("emailReminders" in body && body.emailReminders !== undefined) updateData.emailReminders = body.emailReminders;
    if ("smsReminders" in body && body.smsReminders !== undefined) updateData.smsReminders = body.smsReminders;

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
    req.log.error({ err }, "Failed to update case");
    res.status(500).json({ error: "internal_error", message: "Failed to update case" });
  }
}

async function handleDelete(req: any, res: any, schema: typeof DeleteCaseParams) {
  try {
    const { id } = schema.parse({ id: Number(req.params.id) });
    await db.delete(smallClaimsCasesTable).where(eq(smallClaimsCasesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete case");
    res.status(500).json({ error: "internal_error", message: "Failed to delete case" });
  }
}

async function handleGenerateStatement(req: any, res: any) {
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

    await db
      .update(smallClaimsCasesTable)
      .set({ generatedStatement: statement, updatedAt: new Date() })
      .where(eq(smallClaimsCasesTable.id, id));

    res.json({ statement });
  } catch (err) {
    req.log.error({ err }, "Failed to generate statement");
    res.status(500).json({ error: "internal_error", message: "Failed to generate statement" });
  }
}

router.get("/cases", handleList);
router.post("/cases", (req, res) => handleCreate(req, res, CreateCaseBody));
router.get("/cases/:id", (req, res) => handleGet(req, res, GetCaseParams));
router.put("/cases/:id", (req, res) => handleUpdate(req, res, UpdateCaseParams, UpdateCaseBody));
router.delete("/cases/:id", (req, res) => handleDelete(req, res, DeleteCaseParams));
router.post("/cases/:id/generate-statement", handleGenerateStatement);

// Dashboard: case + evidence + derived timeline
router.get("/cases/:id/dashboard", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db.select().from(smallClaimsCasesTable).where(eq(smallClaimsCasesTable.id, id));
    if (!found) { res.status(404).json({ error: "not_found" }); return; }
    const evidence = await getEvidenceForCase(id);
    const timeline: { date: string; event: string; type: string }[] = [];
    timeline.push({ date: found.createdAt.toISOString(), event: "Case started", type: "created" });
    if (found.paidAt) timeline.push({ date: found.paidAt.toISOString(), event: "Document generated & emailed", type: "paid" });
    if (found.lastUpdate) timeline.push({ date: found.updatedAt.toISOString(), event: found.lastUpdate, type: "update" });
    res.json({ case: formatCase(found), evidence, timeline });
  } catch (err) {
    req.log?.error({ err }, "Failed to get dashboard");
    res.status(500).json({ error: "internal_error" });
  }
});

// Status update shortcut
router.patch("/cases/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, lastUpdate, hearingDate } = req.body as { status: string; lastUpdate?: string; hearingDate?: string };
    const [updated] = await db
      .update(smallClaimsCasesTable)
      .set({ status, ...(lastUpdate ? { lastUpdate } : {}), ...(hearingDate ? { hearingDate } : {}), updatedAt: new Date() })
      .where(eq(smallClaimsCasesTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "not_found" }); return; }

    // Schedule a served follow-up reminder when the defendant is marked as served
    if (status === "served") {
      import("../services/reminders.js").then(({ scheduleServedReminder }) => {
        scheduleServedReminder(id).catch((err) => console.error("[reminders] Failed to schedule served reminder:", err));
      });
    }

    res.json(formatCase(updated));
  } catch (err) {
    req.log?.error({ err }, "Failed to update status");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/small-claims", handleList);
router.post("/small-claims", (req, res) => handleCreate(req, res, CreateSmallClaimBody));
router.get("/small-claims/:id", (req, res) => handleGet(req, res, GetSmallClaimParams));
router.put("/small-claims/:id", (req, res) => handleUpdate(req, res, UpdateSmallClaimParams, UpdateSmallClaimBody));
router.delete("/small-claims/:id", (req, res) => handleDelete(req, res, DeleteSmallClaimParams));
router.post("/small-claims/:id/generate-statement", handleGenerateStatement);

export default router;
