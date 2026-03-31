import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/county-data", async (req, res) => {
  const state = (req.query.state as string | undefined)?.toUpperCase();
  const county = req.query.county as string | undefined;

  if (!state) {
    res.status(400).json({ error: "state is required" });
    return;
  }

  if (county) {
    const result = await pool.query(
      "SELECT state, county, tax_rate, equalization_rate FROM county_data WHERE state = $1 AND county = $2 LIMIT 1",
      [state, county]
    );
    res.json(result.rows[0] ?? null);
    return;
  }

  const result = await pool.query(
    "SELECT state, county, tax_rate, equalization_rate FROM county_data WHERE state = $1 ORDER BY county",
    [state]
  );
  res.json(result.rows);
});

export default router;
