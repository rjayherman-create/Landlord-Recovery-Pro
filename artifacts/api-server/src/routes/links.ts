import { Router, type IRouter } from "express";
import { db, filingLinksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { state } = req.query;
    const result = state
      ? await db.select().from(filingLinksTable).where(eq(filingLinksTable.state, String(state).toUpperCase()))
      : await db.select().from(filingLinksTable);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch links" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db.select().from(filingLinksTable).where(eq(filingLinksTable.id, id));
    if (!result.length) {
      res.status(404).json({ error: "Link not found" });
      return;
    }
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch link" });
  }
});

export default router;
