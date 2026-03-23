import { Router, type IRouter } from "express";
import { db, comparablesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AddComparableBody,
  ListComparablesQueryParams,
  DeleteComparableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/comparables", async (req, res) => {
  try {
    const { grievanceId } = ListComparablesQueryParams.parse({ grievanceId: Number(req.query.grievanceId) });
    const comparables = await db.select().from(comparablesTable)
      .where(eq(comparablesTable.grievanceId, grievanceId))
      .orderBy(comparablesTable.createdAt);
    const result = comparables.map((c) => ({
      ...c,
      salePrice: Number(c.salePrice),
      squareFeet: c.squareFeet != null ? Number(c.squareFeet) : undefined,
      bathrooms: c.bathrooms != null ? Number(c.bathrooms) : undefined,
      assessedValue: c.assessedValue != null ? Number(c.assessedValue) : undefined,
      createdAt: c.createdAt.toISOString(),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list comparables");
    res.status(400).json({ error: "validation_error", message: String(err) });
  }
});

router.post("/comparables", async (req, res) => {
  try {
    const body = AddComparableBody.parse(req.body);
    const [created] = await db.insert(comparablesTable).values({
      grievanceId: body.grievanceId,
      address: body.address,
      salePrice: String(body.salePrice),
      saleDate: body.saleDate,
      squareFeet: body.squareFeet != null ? String(body.squareFeet) : undefined,
      bedrooms: body.bedrooms ?? undefined,
      bathrooms: body.bathrooms != null ? String(body.bathrooms) : undefined,
      assessedValue: body.assessedValue != null ? String(body.assessedValue) : undefined,
      notes: body.notes ?? undefined,
    }).returning();
    res.status(201).json({
      ...created,
      salePrice: Number(created.salePrice),
      squareFeet: created.squareFeet != null ? Number(created.squareFeet) : undefined,
      bathrooms: created.bathrooms != null ? Number(created.bathrooms) : undefined,
      assessedValue: created.assessedValue != null ? Number(created.assessedValue) : undefined,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add comparable");
    res.status(400).json({ error: "validation_error", message: String(err) });
  }
});

router.delete("/comparables/:id", async (req, res) => {
  try {
    const { id } = DeleteComparableParams.parse({ id: Number(req.params.id) });
    await db.delete(comparablesTable).where(eq(comparablesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete comparable");
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

export default router;
