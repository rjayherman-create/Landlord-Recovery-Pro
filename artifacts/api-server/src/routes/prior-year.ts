import { Router, type IRouter } from "express";
import { db, grievancesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/prior-year/:grievanceId", async (req, res) => {
  try {
    const grievanceId = Number(req.params.grievanceId);
    if (!grievanceId) return res.status(400).json({ error: "grievanceId required" });

    const [grievance] = await db.select().from(grievancesTable).where(eq(grievancesTable.id, grievanceId));
    if (!grievance) return res.status(404).json({ error: "Grievance not found" });

    // Prior-year data from NYS ORPS only available for NY
    const state = (grievance as any).state ?? "NY";
    if (state !== "NY") {
      return res.json({ priorYear: null, message: `Prior-year lookup not available for ${state} yet` });
    }

    const { parcelId, county, municipality } = grievance;
    if (!parcelId && !(county && municipality)) {
      return res.json({ priorYear: null, message: "Insufficient property info for prior-year lookup" });
    }

    const thisYear = grievance.taxYear ?? new Date().getFullYear();
    const priorYear = thisYear - 1;

    let whereClause = `roll_year=${priorYear}`;
    if (county) whereClause += ` AND county_name='${county.toUpperCase()}'`;
    if (municipality) whereClause += ` AND municipality_name LIKE '${municipality.toUpperCase().replace(/'/g, "''")}%'`;
    if (parcelId) whereClause += ` AND print_key_code='${parcelId.replace(/'/g, "''")}'`;

    const params = new URLSearchParams({
      "$where": whereClause,
      "$limit": "5",
    });

    const url = `https://data.ny.gov/resource/7vem-aaz7.json?${params}`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    } as RequestInit);

    if (!response.ok) throw new Error(`ORPS API error: ${response.status}`);
    const data = await response.json() as Record<string, string>[];

    if (!data.length) {
      return res.json({ priorYear: null, message: "No prior year data found" });
    }

    const record = data[0];
    const priorAssessment = record.assessment_total ? Number(record.assessment_total) : null;
    const priorMarketValue = record.full_market_value ? Number(record.full_market_value) : null;

    const currentAssessment = Number(grievance.currentAssessment);
    const currentMarketValue = Number(grievance.estimatedMarketValue);

    const assessmentDelta = priorAssessment
      ? ((currentAssessment - priorAssessment) / priorAssessment) * 100
      : null;
    const marketValueDelta = priorMarketValue
      ? ((currentMarketValue - priorMarketValue) / priorMarketValue) * 100
      : null;

    res.json({
      priorYear,
      priorAssessment,
      priorMarketValue,
      currentAssessment,
      currentMarketValue,
      assessmentDelta: assessmentDelta !== null ? Math.round(assessmentDelta * 10) / 10 : null,
      marketValueDelta: marketValueDelta !== null ? Math.round(marketValueDelta * 10) / 10 : null,
      source: "NYS Office of Real Property Services Assessment Roll",
    });
  } catch (err) {
    console.error("prior-year error:", err);
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

export default router;
