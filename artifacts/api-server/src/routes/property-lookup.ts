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

const STATE_NAMES: Record<string, string> = {
  NY: "New York", NJ: "New Jersey", TX: "Texas", FL: "Florida",
};

async function geocodeAddress(address: string, stateHint?: string): Promise<{
  lat: number; lon: number;
  county: string; municipality: string; state: string; postcode: string;
  displayName: string;
} | null> {
  // Append the state name only if the address doesn't already include a state abbreviation/name
  const stateLabel = stateHint ? (STATE_NAMES[stateHint] || stateHint) : "";
  const hasState = /\b(NY|NJ|TX|FL|New York|New Jersey|Texas|Florida)\b/i.test(address);
  const query = hasState ? address : (stateLabel ? `${address}, ${stateLabel}` : address);

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=3&countrycodes=us`;
  const res = await fetch(url, {
    headers: { "User-Agent": "TaxAppealDIY/1.0 (educational-tool)" },
  });
  if (!res.ok) return null;
  const data = await res.json() as any[];
  if (!data?.length) return null;

  // Prefer results matching the requested state
  let r = data[0];
  if (stateHint && data.length > 1) {
    const stateFullLower = (STATE_NAMES[stateHint] || stateHint).toLowerCase();
    const stateMatch = data.find((d: any) => {
      const addrState = (d.address?.state || "").toLowerCase();
      return addrState.includes(stateFullLower) || addrState === stateHint.toLowerCase();
    });
    if (stateMatch) r = stateMatch;
  }

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

  // Owner name — combine first + last from ORPS, convert from ALL CAPS
  const ownerFirst = toTitleCase(String(best.primary_owner_first_name || "").trim());
  const ownerLast = toTitleCase(String(best.primary_owner_last_name || "").trim());
  const ownerFull = [ownerFirst, ownerLast].filter(Boolean).join(" ");
  if (ownerFull) {
    result.ownerName = ownerFull;
    fieldsFound.push("ownerName");
  }

  // ── Supplemental physical characteristics from NYS Real Property Sales (5ry4-ks3m) ──
  // The ORPS assessment roll (7vem-aaz7) doesn't carry year built, sq ft, floors, or units.
  // The sales dataset shares parcel IDs and does carry these fields.
  let suppYearBuilt: number | undefined;
  let suppGrossSqFt: number | undefined;
  let suppTotalUnits: number | undefined;
  let suppNumBuildings: number | undefined;
  let suppNumFloors: number | undefined;
  let suppLotArea: number | undefined;

  if (best.print_key_code) {
    try {
      const suppUrl = "https://data.ny.gov/resource/5ry4-ks3m.json?" + new URLSearchParams({
        "$where": `county_name='${countyName}' AND print_key_code='${best.print_key_code}'`,
        "$order": "sale_date DESC",
        "$limit": "5",
      });
      const suppRes = await fetch(suppUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (suppRes.ok) {
        const suppData: any[] = await suppRes.json();
        if (Array.isArray(suppData) && suppData.length > 0) {
          // Use the record with the most physical data (prefer highest gross_sq_ft)
          const suppBest = suppData.reduce((a, b) =>
            (parseFloat(b.gross_sq_ft || "0") > parseFloat(a.gross_sq_ft || "0")) ? b : a
          , suppData[0]);

          const yb = parseInt(suppBest.year_built || "0");
          if (yb > 1600 && yb <= new Date().getFullYear()) suppYearBuilt = yb;

          const gsf = parseFloat(suppBest.gross_sq_ft || "0");
          if (gsf > 0) suppGrossSqFt = Math.round(gsf);

          const tu = parseInt(suppBest.total_units || "0");
          if (tu > 0) suppTotalUnits = tu;

          const nb = parseInt(suppBest.number_of_buildings || suppBest.num_buildings || "0");
          if (nb > 0) suppNumBuildings = nb;

          const nf = parseFloat(suppBest.number_of_stories || suppBest.num_floors || "0");
          if (nf > 0) suppNumFloors = nf;

          // Lot area from sales dataset (calc_acre_lot or lot_size)
          const la = parseFloat(suppBest.lot_size || suppBest.calc_acre_lot || "0");
          if (la > 0) {
            // If < 10 it's probably acres, else sq ft
            suppLotArea = la < 10 ? Math.round(la * 43560) : Math.round(la);
          }
        }
      }
    } catch { /* non-fatal: supplemental data only */ }
  }

  // Merge supplemental physical data into top-level result
  if (suppYearBuilt) { result.yearBuilt = suppYearBuilt; fieldsFound.push("yearBuilt"); }
  if (suppGrossSqFt) { result.livingArea = suppGrossSqFt; fieldsFound.push("livingArea"); }

  // Lot area — prefer supplemental over frontage × depth
  const front = parseFloat(best.front || "0");
  const depth = parseFloat(best.depth || "0");
  const lotSqft = suppLotArea ?? (front > 0 && depth > 0 ? Math.round(front * depth) : 0);
  if (lotSqft > 0) {
    const acres = (lotSqft / 43560).toFixed(3);
    result.lotSize = front > 0 && depth > 0 && !suppLotArea
      ? `${front}×${depth} ft (≈${lotSqft.toLocaleString()} sq ft / ${acres} acres)`
      : `${lotSqft.toLocaleString()} sq ft / ${acres} acres`;
    if (!fieldsFound.includes("lotSize")) fieldsFound.push("lotSize");
  }

  // Raw property record card
  result.rawRecord = {
    address: `${best.parcel_address_number} ${best.parcel_address_street}`,
    zipcode: best.mailing_address_zip,
    ownerName: ownerFull || undefined,
    buildingClass: best.property_class,
    buildingClassDesc: best.property_class_description ? toTitleCase(best.property_class_description) : undefined,
    yearBuilt: suppYearBuilt,
    numBuildings: suppNumBuildings,
    numFloors: suppNumFloors,
    unitCount: suppTotalUnits,
    buildingArea: suppGrossSqFt,
    lotArea: lotSqft > 0 ? lotSqft : undefined,
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

/* ─── NJ lookup — geocode + county detection + Tax Board directory link ────── */
// NJ property assessment data (MOD-IV) is not exposed through a public JSON API.
// We confirm the address via Nominatim, fill county + municipality, and direct
// the user to their specific County Board of Taxation or municipality assessor.

const NJ_TAX_BOARD_URLS: Record<string, string> = {
  "atlantic":    "https://www.atlantic-county.org/tax/",
  "bergen":      "https://www.co.bergen.nj.us/tax-board",
  "burlington":  "https://co.burlington.nj.us/135/Tax-Board",
  "camden":      "https://www.camdencounty.com/service/boards-commissions/county-board-of-taxation/",
  "cape may":    "https://capemaycountynj.gov/365/Tax-Board",
  "cumberland":  "https://www.co.cumberland.nj.us/200/Tax-Board",
  "essex":       "https://www.essexcountytaxboard.com/",
  "gloucester":  "https://www.gloucestercountynj.gov/222/Tax-Board",
  "hudson":      "https://www.hudsoncountytaxboard.com/",
  "hunterdon":   "https://www.co.hunterdon.nj.us/taxboard.htm",
  "mercer":      "https://www.mercercounty.org/departments/tax-board",
  "middlesex":   "https://www.co.middlesex.nj.us/Government/Departments/TaxBoard",
  "monmouth":    "https://www.co.monmouth.nj.us/county_departments/tax_board/",
  "morris":      "https://www.morriscountynj.gov/Departments/Tax-Board",
  "ocean":       "https://www.co.ocean.nj.us/OC/Boards/TaxBoard",
  "passaic":     "https://www.passaiccountynj.org/government/departments/tax_board",
  "salem":       "https://www.salemcountynj.gov/county/departments/tax-board/",
  "somerset":    "https://www.co.somerset.nj.us/government/boards-committees-commissions/tax-board",
  "sussex":      "https://www.sussex.nj.us/cn/webpage.cfm?tpid=8624",
  "union":       "https://ucnj.org/county-services/tax-board/",
  "warren":      "https://www.co.warren.nj.us/government/departments/tax-board.html",
};

async function lookupNJProperty(
  _address: string,
  geocodeMunicipality: string,
  geocodeCounty: string,
): Promise<Partial<LookupResult>> {
  const countyLow = geocodeCounty.toLowerCase();
  const taxBoardUrl = Object.entries(NJ_TAX_BOARD_URLS).find(([k]) => countyLow.includes(k))?.[1]
    ?? "https://www.njtaxationpropertyapp.com/Appeal";

  const result: Partial<LookupResult> = {
    county: geocodeCounty,
    municipality: geocodeMunicipality,
    confidence: "partial",
    source: "OpenStreetMap (geocode confirmed)",
    message: `${geocodeCounty} County address confirmed. To get your assessed value and Block/Lot number, visit your County Tax Board: ${taxBoardUrl}`,
    fieldsFound: ["county", "municipality"],
    rawRecord: {
      address: geocodeMunicipality,
      dataSource: `New Jersey — ${geocodeCounty} County Board of Taxation`,
      retrievedAt: new Date().toISOString(),
    },
  };
  return result;
}

/* ─── TX lookup — geocode + county detection + CAD directory link ─────────── */
// Texas has ~250+ county appraisal districts (CADs), each with its own API.
// We confirm the address via geocoding, fill in county/municipality, then
// provide a direct link to the county CAD for the user to retrieve their
// appraised value and account number.

const TX_CAD_URLS: Record<string, string> = {
  "harris":     "https://public.hcad.org/records/",
  "dallas":     "https://www.dallascad.org/SearchAddr.aspx",
  "tarrant":    "https://www.tad.org/",
  "bexar":      "https://esearch.bcad.org/",
  "travis":     "https://tcad.org/",
  "collin":     "https://search.collincad.org/",
  "denton":     "https://dentoncad.com/",
  "hidalgo":    "https://hcad.net/",
  "el paso":    "https://www.epcad.org/",
  "fort bend":  "https://www.fbcad.org/",
  "montgomery": "https://www.mctx.org/departments/tax_assessor_collector/",
  "williamson": "https://wcad.org/",
  "galveston":  "https://actweb.acttax.com/act_webdev/galveston/",
  "nueces":     "https://www.nuecescad.net/",
  "lubbock":    "https://lubbockcad.org/",
  "jefferson":  "https://www.jcad.org/",
  "smith":      "https://www.smithcad.org/",
  "webb":       "https://www.webbcad.org/",
  "brazoria":   "https://brazoriacad.org/",
  "bell":       "https://www.bellcad.org/",
};

async function lookupTXProperty(
  geocodeCounty: string,
  geocodeMunicipality: string,
): Promise<Partial<LookupResult>> {
  const countyLow = geocodeCounty.toLowerCase();
  const cadUrl = Object.entries(TX_CAD_URLS).find(([k]) => countyLow.includes(k))?.[1]
    ?? `https://comptroller.texas.gov/taxes/property-tax/cadmap.php`;

  const result: Partial<LookupResult> = {
    county: geocodeCounty,
    municipality: geocodeMunicipality,
    confidence: "partial",
    source: "OpenStreetMap (geocode confirmed)",
    message: `${geocodeCounty} County address confirmed. To get your appraised value and account number, visit your County Appraisal District: ${cadUrl}`,
    fieldsFound: ["county", "municipality"],
    rawRecord: {
      address: geocodeMunicipality,
      dataSource: `Texas — ${geocodeCounty} County Appraisal District`,
      retrievedAt: new Date().toISOString(),
    },
  };
  return result;
}

/* ─── FL lookup — geocode + county detection + PAO directory link ─────────── */
// Florida has 67 county Property Appraiser Offices (PAOs).
// We confirm the address and provide a direct link to the correct PAO.

const FL_PAO_URLS: Record<string, string> = {
  "miami-dade":  "https://www.miamidade.gov/pa/property_search.asp",
  "miami dade":  "https://www.miamidade.gov/pa/property_search.asp",
  "broward":     "https://web.bcpa.net/bcpaclient/",
  "palm beach":  "https://www.pbcpao.gov/",
  "hillsborough":"https://gis.hcpafl.org/PTsearch/",
  "orange":      "https://www.ocpafl.org/",
  "pinellas":    "https://www.pcpao.gov/",
  "duval":       "https://www.coj.net/departments/property-appraiser/search-real-estate-records",
  "lee":         "https://www.leepa.org/",
  "polk":        "https://www.polkpa.org/",
  "brevard":     "https://www.bcpao.us/",
  "volusia":     "https://vcpa.volusia.org/",
  "seminole":    "https://www.scpafl.org/",
  "pasco":       "https://www.pascopa.com/",
  "sarasota":    "https://www.sc-pa.com/",
  "manatee":     "https://www.manateepao.gov/",
  "collier":     "https://www.collierappraiser.com/",
  "st. johns":   "https://www.sjcpa.us/",
  "st johns":    "https://www.sjcpa.us/",
  "alachua":     "https://www.acpafl.org/",
  "escambia":    "https://www.escpa.org/",
  "lake":        "https://www.lakecopropappr.com/",
  "osceola":     "https://www.property-appraiser.org/",
  "marion":      "https://www.pa.marion.fl.us/",
  "charlotte":   "https://www.ccappraiser.com/",
  "leon":        "https://www.leonpa.org/",
};

async function lookupFLProperty(
  geocodeCounty: string,
  geocodeMunicipality: string,
): Promise<Partial<LookupResult>> {
  const countyLow = geocodeCounty.toLowerCase();
  const paoUrl = Object.entries(FL_PAO_URLS).find(([k]) => countyLow.includes(k))?.[1]
    ?? `https://floridarevenue.com/property/Pages/Taxpayers_ListOfCountyPropertyAppraisers.aspx`;

  const result: Partial<LookupResult> = {
    county: geocodeCounty,
    municipality: geocodeMunicipality,
    confidence: "partial",
    source: "OpenStreetMap (geocode confirmed)",
    message: `${geocodeCounty} County address confirmed. To get your assessed value and parcel ID, visit your County Property Appraiser: ${paoUrl}`,
    fieldsFound: ["county", "municipality"],
    rawRecord: {
      address: geocodeMunicipality,
      dataSource: `Florida — ${geocodeCounty} County Property Appraiser`,
      retrievedAt: new Date().toISOString(),
    },
  };
  return result;
}

/* ─── Main route ─────────────────────────────────────── */

const SUPPORTED_STATES = new Set(["NY", "NJ", "TX", "FL"]);

router.get("/property-lookup", async (req, res) => {
  const address = req.query.address as string;
  const stateParam = ((req.query.state as string) || "NY").toUpperCase();

  if (!address || address.trim().length < 5) {
    res.status(400).json({ error: "Address is required (minimum 5 characters)" });
    return;
  }
  if (!SUPPORTED_STATES.has(stateParam)) {
    res.status(400).json({ error: `State '${stateParam}' is not yet supported.` });
    return;
  }

  const result: LookupResult = {
    source: "OpenStreetMap",
    confidence: "geocode-only",
    fieldsFound: [],
  };

  try {
    // Step 1: Geocode with state hint
    const geo = await geocodeAddress(address, stateParam);
    if (!geo) {
      res.status(404).json({ error: `Address not found. Try including your town and state — e.g. '123 Main St, Trenton, NJ'.` });
      return;
    }

    // Warn if geocode returns a different state than requested
    const geoStateLow = geo.state.toLowerCase();
    const expectedLow = (STATE_NAMES[stateParam] || stateParam).toLowerCase();
    if (geo.state && !geoStateLow.includes(expectedLow) && !expectedLow.includes(geoStateLow.split(" ")[0])) {
      res.status(400).json({
        error: `That address appears to be in ${geo.state}, not ${STATE_NAMES[stateParam] || stateParam}. Please check the state you selected.`,
      });
      return;
    }

    result.county = geo.county;
    result.municipality = geo.municipality;
    result.fieldsFound.push("county", "municipality");

    const countyLower = geo.county.toLowerCase();

    // Step 2: State-specific enrichment
    if (stateParam === "NY") {
      const isNYC = ["new york", "kings", "queens", "bronx", "richmond"].includes(countyLower);

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
        const boroughMap: Record<string, string> = {
          "new york": "Manhattan", "kings": "Brooklyn", "queens": "Queens",
          "bronx": "The Bronx", "richmond": "Staten Island",
        };
        result.municipality = boroughMap[countyLower] || result.municipality;
        result.county = "New York City";

      } else {
        // All non-NYC NY counties — NYS ORPS Assessment Roll
        const orpsCounty = countyLower.includes("nassau")      ? "Nassau"
                         : countyLower.includes("suffolk")     ? "Suffolk"
                         : countyLower.includes("westchester") ? "Westchester"
                         : countyLower.includes("rockland")    ? "Rockland"
                         : countyLower.includes("orange")      ? "Orange"
                         : countyLower.includes("dutchess")    ? "Dutchess"
                         : countyLower.includes("putnam")      ? "Putnam"
                         : countyLower.includes("ulster")      ? "Ulster"
                         : geo.county;
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

    } else if (stateParam === "NJ") {
      try {
        const nj = await lookupNJProperty(address, geo.municipality, geo.county);
        const { fieldsFound: njFields, rawRecord: njRaw, ...njRest } = nj;
        Object.assign(result, njRest);
        if (njRaw) result.rawRecord = njRaw;
        if (njFields) result.fieldsFound.push(...njFields.filter(f => !result.fieldsFound.includes(f)));
      } catch {
        result.source = "OpenStreetMap";
        result.confidence = "partial";
        result.message = `${geo.county} County address confirmed. Enter your Block/Lot and assessed value from your tax bill.`;
      }

    } else if (stateParam === "TX") {
      const tx = await lookupTXProperty(geo.county, geo.municipality);
      const { fieldsFound: txFields, rawRecord: txRaw, ...txRest } = tx;
      Object.assign(result, txRest);
      if (txRaw) result.rawRecord = txRaw;
      if (txFields) result.fieldsFound.push(...txFields.filter(f => !result.fieldsFound.includes(f)));

    } else if (stateParam === "FL") {
      const fl = await lookupFLProperty(geo.county, geo.municipality);
      const { fieldsFound: flFields, rawRecord: flRaw, ...flRest } = fl;
      Object.assign(result, flRest);
      if (flRaw) result.rawRecord = flRaw;
      if (flFields) result.fieldsFound.push(...flFields.filter(f => !result.fieldsFound.includes(f)));
    }

    // Deduplicate fieldsFound
    result.fieldsFound = [...new Set(result.fieldsFound)];

    // Add provenance
    result.lookupAddress = address;
    result.lookupDate = new Date().toISOString();

    // Fallback raw record for geocode-only cases
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
