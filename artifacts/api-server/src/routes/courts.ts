import { Router } from "express";
import { db, courts } from "@workspace/db";
import { and, eq, ilike } from "drizzle-orm";

const router = Router();

router.get("/courts", async (req, res) => {
  try {
    const state = typeof req.query.state === "string" ? req.query.state.toUpperCase().trim() : "";
    const county = typeof req.query.county === "string" ? req.query.county.trim() : "";

    if (!state || !county) {
      return res.status(400).json({ error: "state and county are required" });
    }

    const results = await db
      .select()
      .from(courts)
      .where(
        and(
          eq(courts.state, state),
          ilike(courts.county, county)
        )
      )
      .limit(1);

    if (!results.length) {
      return res.status(404).json({
        fallback: true,
        state,
        county,
        message: `Court data for ${county} County, ${state} is not yet in our directory. Contact your county clerk's office to find the appropriate small claims court.`,
      });
    }

    const court = results[0];

    return res.json({
      ...court,
      filingFeeDisplay: court.filingFee ? `$${court.filingFee}` : "Varies",
      serviceFeeDisplay:
        court.serviceFeeMin && court.serviceFeeMax
          ? `$${court.serviceFeeMin}–$${court.serviceFeeMax}`
          : court.serviceFeeMin
            ? `$${court.serviceFeeMin}`
            : "Varies",
      totalCostMin: (court.filingFee ?? 0) + (court.serviceFeeMin ?? 0),
      totalCostMax: (court.filingFee ?? 0) + (court.serviceFeeMax ?? 0),
    });
  } catch (err) {
    console.error("[courts] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/courts/states", async (_req, res) => {
  try {
    const rows = await db
      .selectDistinct({ state: courts.state })
      .from(courts)
      .orderBy(courts.state);
    return res.json({ states: rows.map((r) => r.state) });
  } catch (err) {
    console.error("[courts/states] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/courts/counties", async (req, res) => {
  try {
    const state = typeof req.query.state === "string" ? req.query.state.toUpperCase().trim() : "";
    if (!state) return res.status(400).json({ error: "state is required" });

    const rows = await db
      .select({ county: courts.county, maxClaim: courts.maxClaim })
      .from(courts)
      .where(eq(courts.state, state))
      .orderBy(courts.county);

    return res.json({ counties: rows });
  } catch (err) {
    console.error("[courts/counties] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
