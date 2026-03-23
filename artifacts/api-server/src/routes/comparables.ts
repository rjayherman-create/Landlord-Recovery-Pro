import { Router, type IRouter } from "express";
import { db, comparablesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AddComparableBody,
  ListComparablesQueryParams,
  DeleteComparableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatComparable(c: typeof comparablesTable.$inferSelect) {
  return {
    ...c,
    salePrice: Number(c.salePrice),
    squareFeet: c.squareFeet != null ? Number(c.squareFeet) : null,
    bathrooms: c.bathrooms != null ? Number(c.bathrooms) : null,
    assessedValue: c.assessedValue != null ? Number(c.assessedValue) : null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/comparables", async (req, res) => {
  try {
    const { grievanceId } = ListComparablesQueryParams.parse({ grievanceId: Number(req.query.grievanceId) });
    const comparables = await db.select().from(comparablesTable)
      .where(eq(comparablesTable.grievanceId, grievanceId))
      .orderBy(comparablesTable.createdAt);
    res.json(comparables.map(formatComparable));
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
      squareFeet: body.squareFeet != null ? String(body.squareFeet) : null,
      bedrooms: body.bedrooms ?? null,
      bathrooms: body.bathrooms != null ? String(body.bathrooms) : null,
      assessedValue: body.assessedValue != null ? String(body.assessedValue) : null,
      lotSize: body.lotSize ?? null,
      yearBuilt: body.yearBuilt ?? null,
      distance: body.distance ?? null,
      sourceUrl: body.sourceUrl ?? null,
      notes: body.notes ?? null,
    }).returning();
    res.status(201).json(formatComparable(created));
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
