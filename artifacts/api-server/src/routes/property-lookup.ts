import { Router, type IRouter } from "express";

const router: IRouter = Router();

/* ─── Types ─────────────────────────────────────────── */

interface LookupResult {
  municipality?: string;
  county?: string;
  schoolDistrict?: string;
  parcelId?: string;
  propertyClass?: string;
  yearBuilt?: number;
  livingArea?: number;
  lotSize?: string;
  estimatedMarketValue?: number;
  source: string;
  confidence: "high" | "partial" | "geocode-only";
  fieldsFound: string[];
  message?: string;
}

/* ─── Nominatim geocoding ────────────────────────────── */

async function geocodeAddress(address: string): Promise<{
  lat: number; lon: number;
  county: string; municipality: string; state: string; postcode: string;
  displayName: string;
} | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + " New York")}&format=json&addressdetails=1&limit=1&countrycodes=us`;
  const res = await fetch(url, {
    headers: { "User-Agent": "NYPropertyTaxGrievanceApp/1.0 (educational-tool)" },
  });
  if (!res.ok) return null;
  const data = await res.json() as any[];
  if (!data?.length) return null;
  const r = data[0];
  const addr = r.address || {};

  const municipality =
    addr.city_district ||
    addr.suburb ||
    addr.town ||
    addr.village ||
    addr.city ||
    addr.county ||
    "";

  const county = (addr.county || "")
    .replace(/ County$/, "")
    .trim();

  return {
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    county,
    municipality,
    state: addr.state || "",
    postcode: addr.postcode || "",
    displayName: r.display_name || "",
  };
}

/* ─── NYC PLUTO lookup ───────────────────────────────── */

const NYC_BOROUGHS: Record<string, string> = {
  manhattan: "MN",
  brooklyn: "BK",
  queens: "QN",
  bronx: "BX",
  "the bronx": "BX",
  "staten island": "SI",
};

async function lookupNycPluto(address: string, lat: number, lon: number): Promise<Partial<LookupResult>> {
  // Clean the address: remove borough names, city, state, zip — keep only "123 STREET NAME"
  const BOROUGHS = ["manhattan", "brooklyn", "queens", "bronx", "the bronx", "staten island"];
  let cleanAddr = address;

  // Strip everything from city/borough name onward
  for (const borough of BOROUGHS) {
    const idx = cleanAddr.toLowerCase().indexOf(borough);
    if (idx !== -1) { cleanAddr = cleanAddr.slice(0, idx).trim(); break; }
  }
  // Also strip commas and everything after
  cleanAddr = cleanAddr.replace(/,.*$/, "").trim();
  // Strip unit/apt
  cleanAddr = cleanAddr.replace(/\s+(apt|unit|#|ste|floor).*/i, "").trim().toUpperCase();

  const streetMatch = cleanAddr.match(/^(\d+[A-Z]?)\s+(.+)$/);
  if (!streetMatch) return {};

  const houseNum = streetMatch[1];
  const street = streetMatch[2].trim();

  // Determine borough from lat/lon via reverse geocode
  let borough = "";
  try {
    const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const revRes = await fetch(revUrl, {
      headers: { "User-Agent": "NYPropertyTaxGrievanceApp/1.0 (educational-tool)" },
      signal: AbortSignal.timeout(5000),
    });
    if (revRes.ok) {
      const rev = await revRes.json() as any;
      const revSuburb = (rev?.address?.suburb || rev?.address?.borough || "").toLowerCase();
      const revCity = (rev?.address?.city || "").toLowerCase();
      if (["new york", "new york city"].includes(revCity)) {
        borough = BOROUGHS.find(b => revSuburb.includes(b.split(" ")[0])) || "";
      }
    }
  } catch { /* ignore */ }

  // NYC official borough codes
  const BORO_CODES: Record<string, string> = {
    "manhattan": "1", "new york": "1",
    "bronx": "2", "the bronx": "2",
    "brooklyn": "3", "kings": "3",
    "queens": "4",
    "staten island": "5", "richmond": "5",
  };

  // Use only house number + first word of street for flexible LIKE match
  // (PLUTO stores full names: "ATLANTIC AVENUE" not "ATLANTIC AVE")
  const firstWord = street.split(/\s+/)[0];
  const whereClause = `address like '${houseNum} ${firstWord}%'`;
  let socrataUrl = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=${encodeURIComponent(whereClause)}&$limit=10`;
  const boroCode = BORO_CODES[borough] || "";
  if (boroCode) {
    socrataUrl += `&borocode=${boroCode}`;
  }

  const plutoRes = await fetch(socrataUrl, {
    headers: { "Accept": "application/json" },
  });
  if (!plutoRes.ok) return {};

  const plutoData = await plutoRes.json() as any[];
  if (!plutoData?.length) return {};

  // Try to find best match by house number
  const match = plutoData.find((p: any) => {
    const pHouse = String(p.address || "").split(" ")[0];
    return pHouse === houseNum;
  }) || plutoData[0];

  if (!match) return {};

  const result: Partial<LookupResult> = {};
  const fieldsFound: string[] = [];

  if (match.yearbuilt && parseInt(match.yearbuilt) > 1600) {
    result.yearBuilt = parseInt(match.yearbuilt);
    fieldsFound.push("yearBuilt");
  }
  if (match.bldgarea && parseFloat(match.bldgarea) > 0) {
    result.livingArea = Math.round(parseFloat(match.bldgarea));
    fieldsFound.push("livingArea");
  }
  if (match.lotarea && parseFloat(match.lotarea) > 0) {
    const sqft = Math.round(parseFloat(match.lotarea));
    const acres = (sqft / 43560).toFixed(2);
    result.lotSize = `${acres} acres / ${sqft.toLocaleString()} sq ft`;
    fieldsFound.push("lotSize");
  }
  // Map building class to NY property class code
  const bldgClass = (match.bldgclass || "").toUpperCase();
  if (bldgClass.startsWith("A")) result.propertyClass = "210"; // single family
  else if (bldgClass.startsWith("B")) result.propertyClass = "220";
  else if (bldgClass.startsWith("C")) result.propertyClass = "220";
  if (result.propertyClass) fieldsFound.push("propertyClass");

  if (match.assesstot && parseFloat(match.assesstot) > 0) {
    result.estimatedMarketValue = Math.round(parseFloat(match.assesstot));
    fieldsFound.push("estimatedMarketValue");
  }

  result.fieldsFound = fieldsFound;
  return result;
}

/* ─── Nassau County assessor lookup ─────────────────── */

async function lookupNassauCounty(address: string): Promise<Partial<LookupResult>> {
  // Nassau uses a public assessor search — try their API endpoint
  const streetParts = address.match(/^(\d+[A-Z]?)\s+(.+?)(?:\s*,|\s+NY|\s+New York|\s*$)/i);
  if (!streetParts) return {};

  const houseNum = streetParts[1];
  const streetName = streetParts[2].replace(/\s+(apt|unit|#|ste).*/i, "").trim();

  // Nassau's property search (public endpoint)
  try {
    const url = `https://apps.nassaucountyny.gov/Property/Property/SearchByAddress?houseNum=${encodeURIComponent(houseNum)}&streetName=${encodeURIComponent(streetName)}&limit=5`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      if (Array.isArray(data) && data.length > 0) {
        const p = data[0];
        const found: string[] = [];
        const r: Partial<LookupResult> = {};
        if (p.yearBuilt) { r.yearBuilt = parseInt(p.yearBuilt); found.push("yearBuilt"); }
        if (p.livingArea) { r.livingArea = parseInt(p.livingArea); found.push("livingArea"); }
        if (p.schoolDistrict) { r.schoolDistrict = p.schoolDistrict; found.push("schoolDistrict"); }
        if (p.parcelId || p.sbl) { r.parcelId = p.parcelId || p.sbl; found.push("parcelId"); }
        if (p.municipality) { r.municipality = p.municipality; found.push("municipality"); }
        r.fieldsFound = found;
        return r;
      }
    }
  } catch {
    // Nassau API not reachable — that's fine, fall through
  }

  return {};
}

/* ─── Main route ─────────────────────────────────────── */

router.get("/property-lookup", async (req, res) => {
  const address = req.query.address as string;
  if (!address || address.trim().length < 5) {
    res.status(400).json({ error: "Address is required (minimum 5 characters)" });
    return;
  }

  const result: LookupResult = {
    source: "OpenStreetMap",
    confidence: "geocode-only",
    fieldsFound: [],
  };

  try {
    // Step 1: Geocode
    const geo = await geocodeAddress(address);
    if (!geo) {
      res.status(404).json({ error: "Address not found. Try including the town, county, and state (e.g. '123 Main St, Garden City, NY')." });
      return;
    }

    if (geo.state && !geo.state.toLowerCase().includes("new york")) {
      res.status(400).json({ error: "This tool is for New York State properties only." });
      return;
    }

    result.county = geo.county;
    result.municipality = geo.municipality;
    result.fieldsFound.push("county", "municipality");

    const countyLower = geo.county.toLowerCase();
    const isNYC = ["new york", "kings", "queens", "bronx", "richmond"].includes(countyLower);
    const isNassau = countyLower.includes("nassau");

    // Step 2: County-specific enrichment
    if (isNYC) {
      try {
        const pluto = await lookupNycPluto(address, geo.lat, geo.lon);
        Object.assign(result, pluto);
        if (pluto.fieldsFound?.length) {
          result.fieldsFound.push(...(pluto.fieldsFound || []));
          result.source = "NYC Open Data (PLUTO)";
          result.confidence = "high";
        } else {
          result.source = "OpenStreetMap + NYC Open Data";
          result.confidence = "partial";
          result.message = "NYC property found but detailed data unavailable. Verify year built, living area, and lot size from your tax bill.";
        }
      } catch {
        result.source = "OpenStreetMap";
        result.confidence = "partial";
      }

      // Map borough → municipality label
      const boroughMap: Record<string, string> = {
        "new york": "Manhattan",
        "kings": "Brooklyn",
        "queens": "Queens",
        "bronx": "The Bronx",
        "richmond": "Staten Island",
      };
      result.municipality = boroughMap[countyLower] || result.municipality;
      result.county = "New York City";

    } else if (isNassau) {
      try {
        const nassau = await lookupNassauCounty(address);
        Object.assign(result, nassau);
        if (nassau.fieldsFound?.length) {
          result.fieldsFound.push(...(nassau.fieldsFound || []));
          result.source = "Nassau County Assessor";
          result.confidence = "high";
        } else {
          result.source = "OpenStreetMap";
          result.confidence = "partial";
          result.message = "Nassau County address confirmed. For full details (SBL, year built, school district), look up your property on the Nassau County AROW portal or your tax bill.";
        }
      } catch {
        result.source = "OpenStreetMap";
        result.confidence = "partial";
        result.message = "Nassau County address confirmed. For full details, look up your property on the Nassau County AROW portal.";
      }
      result.county = "Nassau";

    } else if (countyLower.includes("suffolk")) {
      result.county = "Suffolk";
      result.confidence = "partial";
      result.message = "Suffolk County address confirmed. Find your SBL number and property details on your tax bill or your Town Assessor's website.";

    } else if (countyLower.includes("westchester")) {
      result.county = "Westchester";
      result.confidence = "partial";
      result.message = "Westchester address confirmed. Find your property details on the Westchester County GIS portal or your tax bill.";

    } else if (countyLower.includes("rockland")) {
      result.county = "Rockland";
      result.confidence = "partial";
      result.message = "Rockland County address confirmed. Find your property details on your tax bill or local assessor's office.";

    } else {
      result.confidence = "partial";
      result.message = `${result.county || "Your"} County address confirmed. Find your SBL number and property details on your local assessor's website or tax bill.`;
    }

    // Deduplicate fieldsFound
    result.fieldsFound = [...new Set(result.fieldsFound)];

    res.json(result);
  } catch (err) {
    console.error("Property lookup error:", err);
    res.status(500).json({ error: "Lookup service temporarily unavailable. Please enter details manually." });
  }
});

export default router;
