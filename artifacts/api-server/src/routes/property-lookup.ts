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
  currentAssessment?: number;
  landAssessment?: number;
  ownerName?: string;
  source: string;
  confidence: "high" | "partial" | "geocode-only";
  fieldsFound: string[];
  message?: string;
  // Raw record for visual confirmation and PDF printing
  rawRecord?: PropertyRecord;
  lookupAddress?: string;
  lookupDate?: string;
}

interface PropertyRecord {
  // Identity
  address?: string;
  borough?: string;
  block?: string;
  lot?: string;
  bbl?: string;
  zipcode?: string;
  // Ownership
  ownerName?: string;
  // Physical
  buildingClass?: string;
  buildingClassDesc?: string;
  yearBuilt?: number;
  yearAltered?: number;
  numBuildings?: number;
  numFloors?: number;
  unitCount?: number;
  buildingArea?: number;
  lotArea?: number;
  lotFrontage?: number;
  lotDepth?: number;
  // Areas breakdown
  residentialArea?: number;
  commercialArea?: number;
  // Assessment
  landAssessment?: number;
  totalAssessment?: number;
  exemptTotal?: number;
  // Zoning
  zoneDist?: string;
  landUse?: string;
  historicDistrict?: string;
  // School / sanitation
  schoolDist?: string;
  councilDist?: string;
  // Data provenance
  dataVersion?: string;
  dataSource: string;
  retrievedAt: string;
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
  if (bldgClass.startsWith("A")) result.propertyClass = "210";
  else if (bldgClass.startsWith("B")) result.propertyClass = "220";
  else if (bldgClass.startsWith("C")) result.propertyClass = "220";
  if (result.propertyClass) fieldsFound.push("propertyClass");

  if (match.assesstot && parseFloat(match.assesstot) > 0) {
    result.currentAssessment = Math.round(parseFloat(match.assesstot));
    fieldsFound.push("currentAssessment");
  }
  if (match.assessland && parseFloat(match.assessland) > 0) {
    result.landAssessment = Math.round(parseFloat(match.assessland));
    fieldsFound.push("landAssessment");
  }

  // NYC school district label
  if (match.schooldist) {
    result.schoolDistrict = `NYC School District ${match.schooldist}`;
    fieldsFound.push("schoolDistrict");
  }

  // Owner name from PLUTO — stored in mixed case already
  if (match.ownername) {
    result.ownerName = String(match.ownername).trim();
    fieldsFound.push("ownerName");
  }

  // Raw record for visual confirmation
  const LAND_USE_LABELS: Record<string, string> = {
    "1": "One & Two Family Buildings", "2": "Multi-Family Walkup Buildings",
    "3": "Multi-Family Elevator Buildings", "4": "Mixed Residential & Commercial",
    "5": "Commercial & Office Buildings", "6": "Industrial & Manufacturing",
    "7": "Transportation & Utility", "8": "Public Facilities & Institutions",
    "9": "Open Space & Outdoor Recreation", "10": "Parking Facilities", "11": "Vacant Land",
  };
  result.rawRecord = {
    address: match.address,
    borough: match.borough,
    block: match.block,
    lot: match.lot,
    bbl: match.bbl ? String(Math.round(parseFloat(match.bbl))) : undefined,
    zipcode: match.zipcode,
    ownerName: match.ownername,
    buildingClass: match.bldgclass,
    yearBuilt: match.yearbuilt ? parseInt(match.yearbuilt) : undefined,
    yearAltered: match.yearalter1 && parseInt(match.yearalter1) > 0 ? parseInt(match.yearalter1) : undefined,
    numBuildings: match.numbldgs ? parseInt(match.numbldgs) : undefined,
    numFloors: match.numfloors ? parseFloat(match.numfloors) : undefined,
    unitCount: match.unitstotal ? parseInt(match.unitstotal) : undefined,
    buildingArea: match.bldgarea ? Math.round(parseFloat(match.bldgarea)) : undefined,
    lotArea: match.lotarea ? Math.round(parseFloat(match.lotarea)) : undefined,
    lotFrontage: match.lotfront ? parseFloat(match.lotfront) : undefined,
    lotDepth: match.lotdepth ? parseFloat(match.lotdepth) : undefined,
    residentialArea: match.resarea ? Math.round(parseFloat(match.resarea)) : undefined,
    commercialArea: match.comarea ? Math.round(parseFloat(match.comarea)) : undefined,
    landAssessment: match.assessland ? Math.round(parseFloat(match.assessland)) : undefined,
    totalAssessment: match.assesstot ? Math.round(parseFloat(match.assesstot)) : undefined,
    exemptTotal: match.exempttot ? Math.round(parseFloat(match.exempttot)) : undefined,
    zoneDist: match.zonedist1,
    landUse: match.landuse ? LAND_USE_LABELS[match.landuse] || `Code ${match.landuse}` : undefined,
    historicDistrict: match.histdist || undefined,
    schoolDist: match.schooldist ? `NYC SD ${match.schooldist}` : undefined,
    councilDist: match.council,
    dataVersion: match.version,
    dataSource: "NYC Open Data — MapPLUTO",
    retrievedAt: new Date().toISOString(),
  };

  result.fieldsFound = fieldsFound;
  return result;
}

/* ─── NYS ORPS Assessment Roll lookup (Nassau, Suffolk, Westchester, etc.) ─── */
// Data source: data.ny.gov dataset 7vem-aaz7 — 4.7M+ parcels, all NY counties outside NYC
// Fields: parcel address, parcel ID (SBL), property class, school district,
//         full market value, total assessment, lot frontage × depth, owner name

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function lookupNYSOrps(
  address: string,
  countyName: string,
  geocodeMunicipality: string,
): Promise<Partial<LookupResult>> {
  // Strip everything from the first comma or "NY"/"New York" or zip onward
  const cleanAddr = address.replace(/,.*$/, "").replace(/\s+NY\b.*/i, "").trim();
  const addrMatch = cleanAddr.match(/^(\d+[A-Z]?)\s+(.+)$/i);
  if (!addrMatch) return {};

  const houseNum = addrMatch[1];
  // Remove apt/unit/# suffixes; uppercase; keep first word only for LIKE match
  const streetRaw = addrMatch[2].replace(/\s+(apt|unit|#|ste|floor).*/i, "").trim().toUpperCase();
  const streetFirstWord = streetRaw.split(/\s+/)[0];

  if (!streetFirstWord || streetFirstWord.length < 2) return {};

  const where = `county_name='${countyName}' AND parcel_address_number='${houseNum}' AND parcel_address_street LIKE '${streetFirstWord}%'`;

  let data: any[];
  try {
    const url = "https://data.ny.gov/resource/7vem-aaz7.json?" + new URLSearchParams({
      "$where": where,
      "$limit": "20",
      "$order": "roll_year DESC",
    });
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    data = await res.json() as any[];
    if (!Array.isArray(data) || data.length === 0) return {};
  } catch {
    return {};
  }

  // Filter out "County Roll" duplicates (those are county-level roll copies)
  const primaryRecords = data.filter(d => !String(d.municipality_name || "").toLowerCase().includes("county roll"));
  const candidates = primaryRecords.length > 0 ? primaryRecords : data;

  // Prefer records whose municipality matches the geocoded municipality
  let best = candidates[0];
  if (geocodeMunicipality) {
    const geoLower = geocodeMunicipality.toLowerCase();
    const muniMatch = candidates.find(d => {
      const mLower = String(d.municipality_name || "").toLowerCase();
      return mLower.includes(geoLower) || geoLower.includes(mLower);
    });
    if (muniMatch) best = muniMatch;
  }

  const result: Partial<LookupResult> = {};
  const fieldsFound: string[] = [];

  // Parcel ID (SBL / print key) — critical for grievance forms
  if (best.print_key_code) {
    result.parcelId = best.print_key_code;
    fieldsFound.push("parcelId");
  }

  // Property class code (e.g. "210" = One Family Year-Round)
  if (best.property_class) {
    result.propertyClass = best.property_class;
    fieldsFound.push("propertyClass");
  }

  // Municipality — stored in ALL CAPS, convert to Title Case
  if (best.municipality_name) {
    result.municipality = toTitleCase(best.municipality_name);
    fieldsFound.push("municipality");
  }

  // School district
  if (best.school_district_name) {
    result.schoolDistrict = toTitleCase(best.school_district_name);
    fieldsFound.push("schoolDistrict");
  }

  // Full market value (what the assessor says your property is worth)
  const fmv = parseFloat(best.full_market_value || "0");
  if (fmv > 0) {
    result.estimatedMarketValue = Math.round(fmv);
    fieldsFound.push("estimatedMarketValue");
  }

  // Total assessed value (what your taxes are based on)
  const totalAss = parseFloat(best.assessment_total || "0");
  if (totalAss > 0) {
    result.currentAssessment = Math.round(totalAss);
    fieldsFound.push("currentAssessment");
  }

  // Land-only assessed value
  const landAss = parseFloat(best.assessment_land || "0");
  if (landAss > 0) {
    result.landAssessment = Math.round(landAss);
    fieldsFound.push("landAssessment");
  }

  // Lot size from frontage × depth
  const front = parseFloat(best.front || "0");
  const depth = parseFloat(best.depth || "0");
  if (front > 0 && depth > 0) {
    const sqft = Math.round(front * depth);
    const acres = (sqft / 43560).toFixed(3);
    result.lotSize = `${front}×${depth} ft (≈${sqft.toLocaleString()} sq ft / ${acres} acres)`;
    fieldsFound.push("lotSize");
  }

  // Owner name — combine first + last from ORPS, convert from ALL CAPS
  const ownerFirst = toTitleCase(String(best.primary_owner_first_name || "").trim());
  const ownerLast = toTitleCase(String(best.primary_owner_last_name || "").trim());
  const ownerFull = [ownerFirst, ownerLast].filter(Boolean).join(" ");
  if (ownerFull) {
    result.ownerName = ownerFull;
    fieldsFound.push("ownerName");
  }

  // Raw property record card
  result.rawRecord = {
    address: `${best.parcel_address_number} ${best.parcel_address_street}`,
    zipcode: best.mailing_address_zip,
    ownerName: ownerFull || undefined,
    buildingClass: best.property_class,
    buildingClassDesc: best.property_class_description ? toTitleCase(best.property_class_description) : undefined,
    lotFrontage: front > 0 ? front : undefined,
    lotDepth: depth > 0 ? depth : undefined,
    landAssessment: best.assessment_land ? Math.round(parseFloat(best.assessment_land)) : undefined,
    totalAssessment: best.assessment_total ? Math.round(parseFloat(best.assessment_total)) : undefined,
    dataSource: `NYS Assessment Roll (ORPS) — ${countyName} County`,
    retrievedAt: new Date().toISOString(),
  };

  result.fieldsFound = fieldsFound;
  return result;
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
        const { fieldsFound: plutoFields, ...plutoRest } = pluto;
        Object.assign(result, plutoRest);
        if (plutoFields?.length) {
          result.fieldsFound.push(...plutoFields);
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

    } else {
      // ── All non-NYC NY counties: query NYS ORPS Assessment Roll ──────────
      // Covers Nassau, Suffolk, Westchester, Rockland, and every other county.
      // Normalise the county name to match what ORPS stores (e.g. "Nassau", "Suffolk").
      const orpsCounty = countyLower.includes("nassau")      ? "Nassau"
                       : countyLower.includes("suffolk")     ? "Suffolk"
                       : countyLower.includes("westchester") ? "Westchester"
                       : countyLower.includes("rockland")    ? "Rockland"
                       : countyLower.includes("orange")      ? "Orange"
                       : countyLower.includes("dutchess")    ? "Dutchess"
                       : countyLower.includes("putnam")      ? "Putnam"
                       : countyLower.includes("ulster")      ? "Ulster"
                       : geo.county; // pass raw geocoded county for other counties

      result.county = orpsCounty;

      try {
        const orps = await lookupNYSOrps(address, orpsCounty, geo.municipality);
        const { fieldsFound: orpsFields, rawRecord: orpsRaw, ...orpsRest } = orps;

        Object.assign(result, orpsRest);
        if (orpsRaw) result.rawRecord = orpsRaw;

        if (orpsFields && orpsFields.length > 0) {
          result.fieldsFound.push(...orpsFields);
          result.source = `NYS Assessment Roll (${orpsCounty} County)`;
          result.confidence = "high";
        } else {
          result.source = "OpenStreetMap";
          result.confidence = "partial";
          result.message = `${orpsCounty} County address confirmed. Property details not found by address — enter your SBL number and other details from your tax bill.`;
        }
      } catch {
        result.source = "OpenStreetMap";
        result.confidence = "partial";
        result.message = `${orpsCounty} County address confirmed. Enter your SBL and property details from your tax bill.`;
      }
    }

    // Deduplicate fieldsFound
    result.fieldsFound = [...new Set(result.fieldsFound)];

    // Add provenance
    result.lookupAddress = address;
    result.lookupDate = new Date().toISOString();

    // For non-NYC (geocode only), build a minimal raw record from geocode data
    if (!result.rawRecord) {
      result.rawRecord = {
        address: geo.displayName.split(",").slice(0, 2).join(",").trim(),
        zipcode: geo.postcode,
        dataSource: "OpenStreetMap Nominatim (geocode only)",
        retrievedAt: new Date().toISOString(),
      };
    }

    res.json(result);
  } catch (err) {
    console.error("Property lookup error:", err);
    res.status(500).json({ error: "Lookup service temporarily unavailable. Please enter details manually." });
  }
});

export default router;
