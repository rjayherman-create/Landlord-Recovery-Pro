export interface FlAfterFilingStep {
  title: string;
  timeframe: string;
  description: string;
  tip?: string;
}

export interface FlCountyFilingInfo {
  county: string;
  vabName: string;
  formName: string;
  filingBody: string;
  filingDeadline: string;
  howToFile: string[];
  mailingAddress?: string;
  onlinePortal?: { label: string; url: string };
  phone?: string;
  notes?: string;
  afterFiling: {
    steps: FlAfterFilingStep[];
    ifDenied: { appealName: string; deadline: string; fee: string; description: string; url?: string };
    ifReduced: string;
    normalSilence: string;
  };
}

const FL_GENERIC_AFTER_FILING = {
  steps: [
    {
      title: "Petition acknowledged",
      timeframe: "Within a few weeks",
      description: "The VAB clerk logs your petition and sends a confirmation. Your case is scheduled for a hearing before a special magistrate — typically an independent real estate appraiser or attorney appointed by the VAB.",
      tip: "Keep your petition confirmation. You'll receive a hearing notice by mail at least 25 days before the scheduled date.",
    },
    {
      title: "Informal conference with property appraiser (optional)",
      timeframe: "Prior to hearing",
      description: "You may request an informal conference with the county property appraiser before your VAB hearing. Many cases are settled informally. Bring your comparable sales, photos, and any evidence of condition issues.",
      tip: "You are not required to accept any informal offer. If the reduction offered is insufficient, your VAB hearing still proceeds.",
    },
    {
      title: "VAB hearing before a special magistrate",
      timeframe: "October–February",
      description: "A neutral special magistrate reviews your evidence and the property appraiser's defense. The magistrate issues a recommended decision, which the VAB then adopts. Present your comparable sales clearly — focus on sales of similar homes that sold for less than your assessed Just Value.",
      tip: "Hearings are typically 30–60 minutes. Bring 3–4 printed copies of all evidence: comps, photos, appraisals. Dress professionally.",
    },
    {
      title: "VAB final decision issued",
      timeframe: "Weeks after the hearing",
      description: "The VAB adopts the magistrate's recommendation and issues a Final Decision. If upheld in your favor, the property appraiser must adjust your Just Value. Your tax bill will reflect the corrected value.",
    },
  ],
  ifDenied: {
    appealName: "Florida Circuit Court",
    deadline: "Within 60 days of the VAB's final decision",
    fee: "Court filing fees vary by county (~$300–$400)",
    description: "If the VAB denies your petition or the reduction is unsatisfactory, you may file a lawsuit in Florida Circuit Court against the county property appraiser. Most homeowners hire a property tax attorney who works on contingency (typically 30–40% of the first year's savings). You must file within 60 days of the VAB's Final Decision date.",
    url: "https://www.flcourts.gov/",
  },
  ifReduced: "The reduction applies to the current tax year. Your property appraiser will adjust your Just Value and reissue a corrected TRIM notice or adjust your tax bill accordingly. Note: The Save Our Homes cap continues to apply to homestead properties — your Assessed Value may still differ from the reduced Just Value.",
  normalSilence: "Hearing notices typically arrive September–November. Hearings are held October–February. Several months of silence after filing is normal — the VAB processes thousands of petitions.",
};

export const FL_COUNTY_FILING: Record<string, FlCountyFilingInfo> = {
  "Miami-Dade": {
    county: "Miami-Dade",
    vabName: "Miami-Dade County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board (filed via AXIA)",
    filingBody: "Miami-Dade County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File online via the AXIA VAB portal (strongly recommended)",
      "Pay the $15 filing fee per petition online",
      "Attach evidence packet: comparable sales, appraisal, photos",
    ],
    onlinePortal: { label: "AXIA VAB Portal", url: "https://www.miamidade.gov/apps/pa/axia/" },
    phone: "(305) 375-5641",
    notes: "Miami-Dade uses the AXIA online system for all petition filings. You can track your hearing status online. Just Value = market value as of January 1.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Broward": {
    county: "Broward",
    vabName: "Broward County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board (via AXIA or mail)",
    filingBody: "Broward County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA VAB portal online",
      "Pay $15 filing fee per petition",
      "Or mail DR-486 to the VAB Clerk before the deadline",
    ],
    onlinePortal: { label: "Broward VAB Online", url: "https://www.broward.org/VAB/Pages/Default.aspx" },
    phone: "(954) 357-7205",
    notes: "Broward County allows both online (AXIA) and mail filings. Include evidence of comparable sales with your petition for best results.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Palm Beach": {
    county: "Palm Beach",
    vabName: "Palm Beach County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Palm Beach County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File online via AXIA VAB portal",
      "Pay $15 filing fee per petition",
      "Mail or drop off at Palm Beach County VAB Clerk",
    ],
    onlinePortal: { label: "Palm Beach VAB", url: "https://www.pbcgov.com/papa/vab.htm" },
    phone: "(561) 355-2060",
    notes: "Palm Beach County's Property Appraiser offers an informal conference before the VAB hearing — call to schedule. Many cases resolve at this stage.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Hillsborough": {
    county: "Hillsborough",
    vabName: "Hillsborough County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Hillsborough County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File online via AXIA or mail DR-486 to the VAB Clerk",
      "Pay $15 filing fee",
      "Include evidence: comparable sales, appraisal, photos",
    ],
    onlinePortal: { label: "Hillsborough VAB", url: "https://www.hillsclerk.com/Courts/Value-Adjustment-Board" },
    phone: "(813) 272-5082",
    notes: "Hillsborough (Tampa area). Hearings typically scheduled October–January. Request an informal review with the Property Appraiser's office first.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Orange": {
    county: "Orange",
    vabName: "Orange County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Orange County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA portal or mail DR-486 to the Orange County Clerk",
      "Pay $15 filing fee",
      "Attach all evidence at time of filing",
    ],
    onlinePortal: { label: "Orange County VAB", url: "https://www.orangeclerk.com/vab/" },
    phone: "(407) 836-7300",
    notes: "Orange County (Orlando area). VAB petitions are heard by independent magistrates. Comparable sales within the last 3 years are the strongest evidence.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Pinellas": {
    county: "Pinellas",
    vabName: "Pinellas County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Pinellas County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File online via AXIA or mail to the Pinellas County VAB Clerk",
      "$15 filing fee required",
    ],
    onlinePortal: { label: "Pinellas VAB", url: "https://www.pinellasclerk.org/vab" },
    phone: "(727) 464-3779",
    notes: "Pinellas County (St. Petersburg / Clearwater area). Hearings generally run November–February.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Duval": {
    county: "Duval",
    vabName: "Duval County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Duval County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA portal online or mail to Duval County VAB Clerk",
      "$15 filing fee per petition",
    ],
    onlinePortal: { label: "Duval VAB", url: "https://www.duvalclerk.com/courts/value-adjustment-board" },
    phone: "(904) 255-2000",
    notes: "Duval County (Jacksonville area). TRIM notices mailed by August 24. File by September 18 or 25 days from TRIM mailing.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Lee": {
    county: "Lee",
    vabName: "Lee County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Lee County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA online or mail DR-486 to the Lee County VAB Clerk",
      "$15 filing fee required",
    ],
    onlinePortal: { label: "Lee VAB", url: "https://www.leeclerk.org/Courts/ValueAdjustmentBoard" },
    phone: "(239) 533-5000",
    notes: "Lee County (Fort Myers / Cape Coral area). High volume of appeals in recent years due to rapid appreciation.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Collier": {
    county: "Collier",
    vabName: "Collier County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Collier County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File DR-486 via AXIA or mail to Collier County VAB Clerk",
      "$15 filing fee per petition",
    ],
    onlinePortal: { label: "Collier VAB", url: "https://www.collierclerk.com/vab" },
    phone: "(239) 252-8411",
    notes: "Collier County (Naples area). High property values — significant potential for reduction. Many homeowners use licensed tax agents.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Sarasota": {
    county: "Sarasota",
    vabName: "Sarasota County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Sarasota County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA online or mail DR-486 to Sarasota County VAB Clerk",
      "$15 filing fee",
    ],
    onlinePortal: { label: "Sarasota VAB", url: "https://www.sarasotaclerk.com/vab" },
    phone: "(941) 861-7400",
    notes: "Sarasota County. TRIM notices mailed August. Hearings October–January.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Manatee": {
    county: "Manatee",
    vabName: "Manatee County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Manatee County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "Mail DR-486 to Manatee County Clerk's Office or file via AXIA",
      "$15 filing fee",
    ],
    phone: "(941) 749-1800",
    notes: "Manatee County (Bradenton area).",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Seminole": {
    county: "Seminole",
    vabName: "Seminole County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Seminole County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File online via AXIA or mail to Seminole County VAB Clerk",
      "$15 filing fee",
    ],
    onlinePortal: { label: "Seminole VAB", url: "https://www.seminoleclerk.org/vab" },
    phone: "(407) 665-4234",
    notes: "Seminole County (suburban Orlando). Informal conferences with the Property Appraiser's office available before the hearing.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Brevard": {
    county: "Brevard",
    vabName: "Brevard County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Brevard County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA online or mail to Brevard County VAB Clerk",
      "$15 filing fee",
    ],
    phone: "(321) 637-5777",
    notes: "Brevard County (Space Coast — Melbourne / Cocoa Beach area).",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Volusia": {
    county: "Volusia",
    vabName: "Volusia County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "Volusia County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File via AXIA online or mail DR-486 to the Volusia County VAB Clerk",
      "$15 filing fee",
    ],
    phone: "(386) 736-5915",
    notes: "Volusia County (Daytona Beach / DeLand area).",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
  "Other": {
    county: "Other",
    vabName: "County Value Adjustment Board",
    formName: "DR-486 — Petition to Value Adjustment Board",
    filingBody: "County Value Adjustment Board",
    filingDeadline: "September 18 (or 25 days after TRIM notice mailing)",
    howToFile: [
      "File DR-486 with your County Clerk's VAB division",
      "$15 filing fee per petition",
      "File via AXIA portal if your county uses it",
    ],
    notes: "All 67 Florida counties use Form DR-486 and the same statewide September 18 deadline. Contact your county Clerk's office for local filing details.",
    afterFiling: FL_GENERIC_AFTER_FILING,
  },
};

export function getFlFilingInfo(county: string): FlCountyFilingInfo {
  return FL_COUNTY_FILING[county] ?? FL_COUNTY_FILING["Other"];
}

export const FL_COUNTY_NAMES = [
  "Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange",
  "Pinellas", "Duval", "Lee", "Collier", "Sarasota", "Manatee",
  "Seminole", "Brevard", "Volusia", "Other",
];

export const FL_BASIS_OPTIONS = [
  { value: "overvaluation", label: "Overvaluation — Just Value exceeds actual market value" },
  { value: "unequal", label: "Unequal Assessment — Your assessment is higher than comparable properties" },
  { value: "exemption", label: "Exemption Denial — Homestead or other exemption wrongly denied" },
  { value: "portability", label: "Portability / Save Our Homes — Incorrect cap or portability transfer" },
  { value: "classification", label: "Agricultural or Other Classification — Wrongly denied or removed" },
  { value: "unlawful", label: "Unlawful Assessment — Property is exempt or assessment is otherwise improper" },
];

export const FL_PROPERTY_CLASS_OPTIONS = [
  { value: "single_family", label: "Single-Family Residential" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family (2–4 units)" },
  { value: "vacant_land", label: "Vacant Land" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "mobile_home", label: "Mobile / Manufactured Home" },
];
