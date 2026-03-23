import { Router, type IRouter } from "express";
import { db, grievancesTable, comparablesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateGrievanceBody,
  UpdateGrievanceBody,
  GetGrievanceParams,
  UpdateGrievanceParams,
  DeleteGrievanceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/grievances", async (req, res) => {
  try {
    const grievances = await db.select().from(grievancesTable).orderBy(grievancesTable.createdAt);
    const result = grievances.map((g) => ({
      ...g,
      currentAssessment: Number(g.currentAssessment),
      equalizationRate: g.equalizationRate != null ? Number(g.equalizationRate) : undefined,
      estimatedMarketValue: Number(g.estimatedMarketValue),
      requestedAssessment: Number(g.requestedAssessment),
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list grievances");
    res.status(500).json({ error: "internal_error", message: "Failed to list grievances" });
  }
});

router.post("/grievances", async (req, res) => {
  try {
    const body = CreateGrievanceBody.parse(req.body);
    const [created] = await db.insert(grievancesTable).values({
      ownerName: body.ownerName,
      propertyAddress: body.propertyAddress,
      county: body.county,
      municipality: body.municipality,
      taxYear: body.taxYear,
      currentAssessment: String(body.currentAssessment),
      equalizationRate: body.equalizationRate != null ? String(body.equalizationRate) : undefined,
      estimatedMarketValue: String(body.estimatedMarketValue),
      requestedAssessment: String(body.requestedAssessment),
      status: "draft",
      filingDeadline: body.filingDeadline ?? undefined,
      notes: body.notes ?? undefined,
    }).returning();
    res.status(201).json({
      ...created,
      currentAssessment: Number(created.currentAssessment),
      equalizationRate: created.equalizationRate != null ? Number(created.equalizationRate) : undefined,
      estimatedMarketValue: Number(created.estimatedMarketValue),
      requestedAssessment: Number(created.requestedAssessment),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create grievance");
    res.status(400).json({ error: "validation_error", message: String(err) });
  }
});

router.get("/grievances/:id", async (req, res) => {
  try {
    const { id } = GetGrievanceParams.parse({ id: Number(req.params.id) });
    const [grievance] = await db.select().from(grievancesTable).where(eq(grievancesTable.id, id));
    if (!grievance) {
      return res.status(404).json({ error: "not_found", message: "Grievance not found" });
    }
    res.json({
      ...grievance,
      currentAssessment: Number(grievance.currentAssessment),
      equalizationRate: grievance.equalizationRate != null ? Number(grievance.equalizationRate) : undefined,
      estimatedMarketValue: Number(grievance.estimatedMarketValue),
      requestedAssessment: Number(grievance.requestedAssessment),
      createdAt: grievance.createdAt.toISOString(),
      updatedAt: grievance.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get grievance");
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

router.put("/grievances/:id", async (req, res) => {
  try {
    const { id } = UpdateGrievanceParams.parse({ id: Number(req.params.id) });
    const body = UpdateGrievanceBody.parse(req.body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
    if (body.propertyAddress !== undefined) updateData.propertyAddress = body.propertyAddress;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.municipality !== undefined) updateData.municipality = body.municipality;
    if (body.taxYear !== undefined) updateData.taxYear = body.taxYear;
    if (body.currentAssessment !== undefined) updateData.currentAssessment = String(body.currentAssessment);
    if (body.equalizationRate !== undefined) updateData.equalizationRate = body.equalizationRate != null ? String(body.equalizationRate) : null;
    if (body.estimatedMarketValue !== undefined) updateData.estimatedMarketValue = String(body.estimatedMarketValue);
    if (body.requestedAssessment !== undefined) updateData.requestedAssessment = String(body.requestedAssessment);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.filingDeadline !== undefined) updateData.filingDeadline = body.filingDeadline;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const [updated] = await db.update(grievancesTable).set(updateData).where(eq(grievancesTable.id, id)).returning();
    if (!updated) {
      return res.status(404).json({ error: "not_found", message: "Grievance not found" });
    }
    res.json({
      ...updated,
      currentAssessment: Number(updated.currentAssessment),
      equalizationRate: updated.equalizationRate != null ? Number(updated.equalizationRate) : undefined,
      estimatedMarketValue: Number(updated.estimatedMarketValue),
      requestedAssessment: Number(updated.requestedAssessment),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update grievance");
    res.status(400).json({ error: "validation_error", message: String(err) });
  }
});

router.delete("/grievances/:id", async (req, res) => {
  try {
    const { id } = DeleteGrievanceParams.parse({ id: Number(req.params.id) });
    await db.delete(grievancesTable).where(eq(grievancesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete grievance");
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

export default router;
