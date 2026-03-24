import { Router, type IRouter } from "express";
import { db, grievancesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

interface NysSale {
  address: string;
  salePrice: number;
  saleDate: string;
  squareFeet?: number;
  assessedValue?: number;
  yearBuilt?: number;
  distance?: string;
  sourceUrl: string;
  notes: string;
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

router.get("/auto-comparables", async (req, res) => {
  try {
    const grievanceId = Number(req.query.grievanceId);
    if (!grievanceId) return res.status(400).json({ error: "grievanceId required" });

    const [grievance] = await db.select().from(grievancesTable).where(eq(grievancesTable.id, grievanceId));
    if (!grievance) return res.status(404).json({ error: "Grievance not found" });

    const { municipality, county, livingArea, taxYear } = grievance;
    const sqft = livingArea ? Number(livingArea) : null;

    const currentYear = taxYear ?? new Date().getFullYear();
    const fromYear = currentYear - 3;

    const params = new URLSearchParams({
      "$limit": "50",
      "$order": "sale_date DESC",
      "county_name": county.toUpperCase(),
      "$where": `municipality_name LIKE '${municipality.toUpperCase().replace(/'/g, "''")}%' AND sale_date >= '${fromYear}-01-01T00:00:00.000' AND sale_price > 50000`,
    });

    const url = `https://data.ny.gov/resource/5ry4-ks3m.json?${params}`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
    } as RequestInit);

    if (!response.ok) throw new Error(`ORPS sales API error: ${response.status}`);
    const raw: Record<string, string>[] = await response.json();

    let results: NysSale[] = raw
      .map((r) => {
        const price = Number(r.sale_price);
        const sqftVal = r.gross_sq_ft ? Number(r.gross_sq_ft) : undefined;
        if (!price || price < 50000) return null;

        const streetNum = r.parcel_address_number ?? "";
        const streetName = r.parcel_address_street ? toTitleCase(r.parcel_address_street) : "";
        const muni = r.municipality_name ? toTitleCase(r.municipality_name) : "";
        const address = `${streetNum} ${streetName}, ${muni}, NY`.trim();

        return {
          address,
          salePrice: price,
          saleDate: r.sale_date ? r.sale_date.substring(0, 10) : "",
          squareFeet: sqftVal,
          assessedValue: r.assessment_total ? Number(r.assessment_total) : undefined,
          yearBuilt: r.year_built ? Number(r.year_built) : undefined,
          distance: "same municipality",
          sourceUrl: "https://data.ny.gov/resource/5ry4-ks3m",
          notes: `Property class ${r.property_class ?? "N/A"}. Source: NYS Assessment Roll`,
        } as NysSale;
      })
      .filter((s): s is NysSale => s !== null);

    if (sqft) {
      const lo = sqft * 0.65;
      const hi = sqft * 1.35;
      const filtered = results.filter((s) => !s.squareFeet || (s.squareFeet >= lo && s.squareFeet <= hi));
      results = filtered.length >= 3 ? filtered : results;
    }

    results = results.slice(0, 8);

    res.json(results);
  } catch (err) {
    console.error("auto-comparables error:", err);
    res.status(500).json({ error: "internal_error", message: String(err) });
  }
});

export default router;
