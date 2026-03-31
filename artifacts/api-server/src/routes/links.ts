import { Router, type IRouter } from "express";

const router: IRouter = Router();

const links: { id: string; state: string; county: string; label: string; url: string }[] = [
  // New York
  { id: "ny-nassau", state: "NY", county: "Nassau County", label: "Nassau Assessor Review", url: "https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html" },
  { id: "ny-islip", state: "NY", county: "Islip (Suffolk)", label: "Islip Assessor", url: "https://www.islipny.gov/departments/assessor" },
  { id: "ny-huntington", state: "NY", county: "Huntington (Suffolk)", label: "Huntington Assessor", url: "https://www.huntingtonny.gov/content/1434/1497/default.aspx" },
  { id: "ny-brookhaven", state: "NY", county: "Brookhaven (Suffolk)", label: "Brookhaven Assessor", url: "https://www.brookhavenny.gov/Government/Departments/Assessor" },
  { id: "ny-smithtown", state: "NY", county: "Smithtown (Suffolk)", label: "Smithtown Assessor", url: "https://www.smithtownny.gov/152/Assessor" },
  { id: "ny-nyc", state: "NY", county: "New York City (5 Boroughs)", label: "NYC Tax Commission", url: "https://www.nyc.gov/site/taxcommission/index.page" },
  { id: "ny-other", state: "NY", county: "All Other NY Counties", label: "NY State Grievance Info", url: "https://www.tax.ny.gov/pit/property/grievance/" },

  // New Jersey
  { id: "nj-directory", state: "NJ", county: "All NJ Counties", label: "NJ Tax Board Directory", url: "https://www.nj.gov/treasury/taxation/lpt/tax_board_directory.shtml" },
  { id: "nj-ecourts", state: "NJ", county: "Tax Court ($1M+ properties)", label: "NJ eCourts Portal", url: "https://portal.njcourts.gov/wps/portal/courtPortal/eCourts" },

  // Texas
  { id: "tx-harris", state: "TX", county: "Harris (Houston)", label: "HCAD iFile Portal", url: "https://ifile.hcad.org/" },
  { id: "tx-dallas", state: "TX", county: "Dallas", label: "DCAD e-Protest Portal", url: "https://www.dcad.org/resources/protest/" },
  { id: "tx-tarrant", state: "TX", county: "Tarrant (Fort Worth)", label: "TAD Online Protest", url: "https://www.tad.org/property-protest/" },
  { id: "tx-travis", state: "TX", county: "Travis (Austin)", label: "TCAD Online Protest", url: "https://www.traviscad.org/appeals/" },
  { id: "tx-bexar", state: "TX", county: "Bexar (San Antonio)", label: "BCAD Online Protest", url: "https://www.bcad.org/protest" },
  { id: "tx-collin", state: "TX", county: "Collin", label: "CCAD Online Protest", url: "https://www.collincad.org/propertysearch" },
  { id: "tx-denton", state: "TX", county: "Denton", label: "Denton CAD Protest", url: "https://www.dentoncad.com/protest" },
  { id: "tx-fortbend", state: "TX", county: "Fort Bend", label: "FBCAD Online Protest", url: "https://www.fbcad.org/protest/" },
  { id: "tx-montgomery", state: "TX", county: "Montgomery", label: "MCAD Online Protest", url: "https://www.mcad-tx.org/protest" },
  { id: "tx-williamson", state: "TX", county: "Williamson", label: "WCAD Online Protest", url: "https://www.wcad.org/online-protest-filing/" },
  { id: "tx-elpaso", state: "TX", county: "El Paso", label: "EPCAD Online Protest", url: "https://www.epcad.org/protest" },
  { id: "tx-galveston", state: "TX", county: "Galveston", label: "GCAD Protest Portal", url: "https://www.galvestoncad.org/protest" },
  { id: "tx-hays", state: "TX", county: "Hays", label: "Hays CAD Protest", url: "https://www.hayscad.com/protest" },
  { id: "tx-nueces", state: "TX", county: "Nueces (Corpus Christi)", label: "NCAD Protest Portal", url: "https://www.nuecescad.net/protest" },
  { id: "tx-other", state: "TX", county: "All Other TX Counties", label: "Texas CAD Directory", url: "https://comptroller.texas.gov/taxes/property-tax/cadaddresses/" },

  // Florida
  { id: "fl-miamidade", state: "FL", county: "Miami-Dade", label: "AXIA VAB Portal", url: "https://www.miamidade.gov/apps/pa/axia/" },
  { id: "fl-broward", state: "FL", county: "Broward", label: "Broward VAB Online", url: "https://www.broward.org/VAB/Pages/Default.aspx" },
  { id: "fl-palmbeach", state: "FL", county: "Palm Beach", label: "Palm Beach VAB", url: "https://www.pbcgov.com/papa/vab.htm" },
  { id: "fl-hillsborough", state: "FL", county: "Hillsborough (Tampa)", label: "Hillsborough VAB", url: "https://www.hillsclerk.com/Courts/Value-Adjustment-Board" },
  { id: "fl-orange", state: "FL", county: "Orange (Orlando)", label: "Orange County VAB", url: "https://www.orangeclerk.com/vab/" },
  { id: "fl-pinellas", state: "FL", county: "Pinellas", label: "Pinellas VAB", url: "https://www.pinellasclerk.org/vab" },
  { id: "fl-duval", state: "FL", county: "Duval (Jacksonville)", label: "Duval VAB", url: "https://www.duvalclerk.com/courts/value-adjustment-board" },
  { id: "fl-lee", state: "FL", county: "Lee", label: "Lee VAB", url: "https://www.leeclerk.org/Courts/ValueAdjustmentBoard" },
  { id: "fl-collier", state: "FL", county: "Collier (Naples)", label: "Collier VAB", url: "https://www.collierclerk.com/vab" },
  { id: "fl-sarasota", state: "FL", county: "Sarasota", label: "Sarasota VAB", url: "https://www.sarasotaclerk.com/vab" },
  { id: "fl-seminole", state: "FL", county: "Seminole", label: "Seminole VAB", url: "https://www.seminoleclerk.org/vab" },
  { id: "fl-other", state: "FL", county: "All Other FL Counties", label: "FL DR-486 Instructions", url: "https://floridarevenue.com/property/Pages/Taxpayers_Petition.aspx" },
];

// GET /api/links — all links, optionally filtered by ?state=NY
router.get("/", (req, res) => {
  const { state } = req.query;
  const result = state
    ? links.filter((l) => l.state === String(state).toUpperCase())
    : links;
  res.json(result);
});

// GET /api/links/:id — single link by id
router.get("/:id", (req, res) => {
  const link = links.find((l) => l.id === req.params.id);
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.json(link);
});

export default router;
