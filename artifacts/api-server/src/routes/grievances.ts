import { Router, type IRouter } from "express";
import { db, grievancesTable } from "@workspace/db";
import { and, eq, or, isNull } from "drizzle-orm";
import {
  CreateGrievanceBody,
  UpdateGrievanceBody,
  GetGrievanceParams,
  UpdateGrievanceParams,
  DeleteGrievanceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatGrievance(g: typeof grievancesTable.$inferSelect) {
  return {
    ...g,
    currentAssessment: Number(g.currentAssessment),
    equalizationRate: g.equalizationRate != null ? Number(g.equalizationRate) : null,
    estimatedMarketValue: Number(g.estimatedMarketValue),
    requestedAssessment: Number(g.requestedAssessment),
    livingArea: g.livingArea != null ? Number(g.livingArea) : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

router.get("/grievances", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const grievances = await db
      .select()
      .from(grievancesTable)
      .where(
        userId
          ? eq(grievancesTable.userId, userId)
          : isNull(grievancesTable.userId)
      )
      .orderBy(grievancesTable.createdAt);
    res.json(grievances.map(formatGrievance));
  } catch (err) {
    req.log.error({ err }, "Failed to list grievances");
    res.status(500).json({ error: "internal_error", message: "Failed to list grievances" });
  }
});

router.post("/grievances", async (req, res) => {
  try {
    const body = CreateGrievanceBody.parse(req.body);
    const userId = req.isAuthenticated() ? req.user.id : null;
    const [created] = await db.insert(grievancesTable).values({
      userId,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone ?? null,
      ownerEmail: body.ownerEmail ?? null,
      ownerMailingAddress: body.ownerMailingAddress ?? null,
      propertyAddress: body.propertyAddress,
      county: body.county,
      municipality: body.municipality,
      schoolDistrict: body.schoolDistrict ?? null,
      parcelId: body.parcelId ?? null,
      propertyClass: body.propertyClass ?? null,
      yearBuilt: body.yearBuilt ?? null,
      livingArea: body.livingArea != null ? String(body.livingArea) : null,
      lotSize: body.lotSize ?? null,
      taxYear: body.taxYear,
      currentAssessment: String(body.currentAssessment),
      equalizationRate: body.equalizationRate != null ? String(body.equalizationRate) : null,
      estimatedMarketValue: String(body.estimatedMarketValue),
      requestedAssessment: String(body.requestedAssessment),
      basisOfComplaint: body.basisOfComplaint ?? null,
      status: "draft",
      filingDeadline: body.filingDeadline ?? null,
      notes: body.notes ?? null,
    }).returning();
    res.status(201).json(formatGrievance(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create grievance");
    res.status(400).json({ error: "validation_error", message: String(err) });
  }
});

router.get("/grievances/:id", async (req, res) => {
  try {
    const { id } = GetGrievanceParams.parse({ id: Number(req.params.id) });
    const userId = req.isAuthenticated() ? req.user.id : null;
    const [grievance] = await db
      .select()
      .from(grievancesTable)
      .where(
        and(
          eq(grievancesTable.id, id),
          userId
            ? eq(grievancesTable.userId, userId)
            : isNull(grievancesTable.userId)
        )
      );
    if (!grievance) {
      return res.status(404).json({ error: "not_found", message: "Grievance not found" });
    }
    res.json(formatGrievance(grievance));
  } catch (err) {
    req.log.error({ err }, "Failed to get grievance");
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

router.put("/grievances/:id", async (req, res) => {
  try {
    const { id } = UpdateGrievanceParams.parse({ id: Number(req.params.id) });
    const body = UpdateGrievanceBody.parse(req.body);
    const userId = req.isAuthenticated() ? req.user.id : null;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
    if (body.ownerPhone !== undefined) updateData.ownerPhone = body.ownerPhone;
    if (body.ownerEmail !== undefined) updateData.ownerEmail = body.ownerEmail;
    if (body.ownerMailingAddress !== undefined) updateData.ownerMailingAddress = body.ownerMailingAddress;
    if (body.propertyAddress !== undefined) updateData.propertyAddress = body.propertyAddress;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.municipality !== undefined) updateData.municipality = body.municipality;
    if (body.schoolDistrict !== undefined) updateData.schoolDistrict = body.schoolDistrict;
    if (body.parcelId !== undefined) updateData.parcelId = body.parcelId;
    if (body.propertyClass !== undefined) updateData.propertyClass = body.propertyClass;
    if (body.yearBuilt !== undefined) updateData.yearBuilt = body.yearBuilt;
    if (body.livingArea !== undefined) updateData.livingArea = body.livingArea != null ? String(body.livingArea) : null;
    if (body.lotSize !== undefined) updateData.lotSize = body.lotSize;
    if (body.taxYear !== undefined) updateData.taxYear = body.taxYear;
    if (body.currentAssessment !== undefined) updateData.currentAssessment = String(body.currentAssessment);
    if (body.equalizationRate !== undefined) updateData.equalizationRate = body.equalizationRate != null ? String(body.equalizationRate) : null;
    if (body.estimatedMarketValue !== undefined) updateData.estimatedMarketValue = String(body.estimatedMarketValue);
    if (body.requestedAssessment !== undefined) updateData.requestedAssessment = String(body.requestedAssessment);
    if (body.basisOfComplaint !== undefined) updateData.basisOfComplaint = body.basisOfComplaint;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.filingDeadline !== undefined) updateData.filingDeadline = body.filingDeadline;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const [updated] = await db
      .update(grievancesTable)
      .set(updateData)
      .where(
        and(
          eq(grievancesTable.id, id),
          userId
            ? eq(grievancesTable.userId, userId)
            : isNull(grievancesTable.userId)
        )
      )
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "not_found", message: "Grievance not found" });
    }
    res.json(formatGrievance(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update grievance");
    res.status(400).json({ error: "validation_error", message: String(err) });
  }
});

router.delete("/grievances/:id", async (req, res) => {
  try {
    const { id } = DeleteGrievanceParams.parse({ id: Number(req.params.id) });
    const userId = req.isAuthenticated() ? req.user.id : null;
    await db
      .delete(grievancesTable)
      .where(
        and(
          eq(grievancesTable.id, id),
          userId
            ? eq(grievancesTable.userId, userId)
            : isNull(grievancesTable.userId)
        )
      );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete grievance");
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

export default router;
