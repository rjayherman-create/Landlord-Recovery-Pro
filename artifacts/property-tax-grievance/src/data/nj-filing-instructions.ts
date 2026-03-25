export interface NjAfterFilingStep {
  title: string;
  timeframe: string;
  description: string;
  tip?: string;
}

export interface NjCountyFilingInfo {
  county: string;
  formName: string;
  filingBody: string;
  filingDeadline: string;
  howToFile: string[];
  mailingAddress?: string;
  onlinePortal?: { label: string; url: string };
  phone?: string;
  notes?: string;
  afterFiling: {
    steps: NjAfterFilingStep[];
    ifDenied: { appealName: string; deadline: string; fee: string; description: string; url?: string };
    ifReduced: string;
    normalSilence: string;
  };
}

const NJ_GENERIC_AFTER_FILING = {
  steps: [
    {
      title: "Petition received and docketed",
      timeframe: "Within 1–2 weeks",
      description: "The County Board of Taxation logs your A-1 petition and assigns a docket number. You will receive an acknowledgment by mail. Keep all paperwork.",
      tip: "Take a photo or scan of your filed petition as your backup record.",
    },
    {
      title: "Informal discussion (may be offered)",
      timeframe: "Weeks 2–8",
      description: "Some counties offer an informal conference with the municipal assessor before the formal hearing. This is your opportunity to negotiate a reduction without going to the full board hearing.",
      tip: "Bring your comparable sales evidence and any appraisal reports to this meeting.",
    },
    {
      title: "County Board hearing",
      timeframe: "Typically June–October",
      description: "The County Board of Taxation schedules a formal hearing. Present your evidence — comparable sales, an independent appraisal if you have one, and documentation of any physical condition issues. Hearings are relatively informal and most homeowners represent themselves.",
      tip: "Bring 3 printed copies of all evidence — one for you, one for the board, one for the municipal attorney. Arrive early.",
    },
    {
      title: "Board judgment issued",
      timeframe: "Days to weeks after hearing",
      description: "The Board issues a judgment. If your assessment is reduced, the lower value applies to that tax year. You may receive a refund for overpaid taxes based on the new assessment.",
    },
  ],
  ifDenied: {
    appealName: "NJ Tax Court Appeal",
    deadline: "45 days from the mailing of the County Board judgment",
    fee: "Tax Court filing fee applies (typically $150–$250 for residential); hearing fee may also apply",
    description: "If the County Board denies your appeal or grants an insufficient reduction, you can appeal to the New Jersey Tax Court. Tax Court appeals are more formal — many homeowners hire a property tax attorney, who typically works on contingency for larger reductions. For properties under $750,000, cases are heard before a judge on a simplified basis.",
    url: "https://www.njcourts.gov/courts/tax/index.html",
  },
  ifReduced: "The reduction applies to the current tax year. Your municipality will recalculate your tax bill and issue a refund for any overpaid taxes. The reduced assessment does not automatically carry forward — the assessor can reassess the following year.",
  normalSilence: "Silence of 4–8 weeks after filing is completely normal. County boards process thousands of petitions in the spring and schedule hearings over the summer and fall. Your hearing notice will arrive by mail.",
};

export const NJ_COUNTY_FILING: Record<string, NjCountyFilingInfo> = {
  "Bergen": {
    county: "Bergen",
    formName: "A-1 Petition of Appeal (County Board of Taxation)",
    filingBody: "Bergen County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice, whichever is later)",
    howToFile: [
      "File online via the NJ Tax Court eCourts portal or mail/hand-deliver to the Bergen County Board of Taxation",
      "Or deliver in person to the County Tax Board office",
    ],
    mailingAddress: "One Bergen County Plaza, Room 360, Hackensack, NJ 07601",
    onlinePortal: { label: "NJ eCourts Portal", url: "https://portal.njcourts.gov/wps/portal/courtPortal/eCourts" },
    phone: "(201) 336-6300",
    notes: "Bergen County is the most populous county in NJ. The Board handles thousands of appeals annually. Filing online via eCourts is strongly recommended for a clear record.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Hudson": {
    county: "Hudson",
    formName: "A-1 Petition of Appeal",
    filingBody: "Hudson County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Hudson County Board of Taxation by April 1",
      "Mail or hand-deliver to the County Board office",
    ],
    mailingAddress: "257 Cornelison Avenue, Jersey City, NJ 07302",
    phone: "(201) 369-3960",
    notes: "Hudson County (Jersey City, Hoboken, Bayonne) has seen dramatic property value increases. Many homeowners successfully appeal over-assessed properties.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Essex": {
    county: "Essex",
    formName: "A-1 Petition of Appeal",
    filingBody: "Essex County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Essex County Board of Taxation",
      "Hand-deliver or mail to the Board office",
    ],
    mailingAddress: "495 Dr. Martin Luther King Jr. Blvd, Rm 230, Newark, NJ 07102",
    phone: "(973) 621-4420",
    notes: "Essex County includes Newark, Montclair, Livingston, and other communities. Assessment practices vary significantly by municipality.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Union": {
    county: "Union",
    formName: "A-1 Petition of Appeal",
    filingBody: "Union County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Union County Board of Taxation",
      "Mail or deliver to the office",
    ],
    mailingAddress: "2 Broad Street, Room B-30, Elizabeth, NJ 07207",
    phone: "(908) 527-4160",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Middlesex": {
    county: "Middlesex",
    formName: "A-1 Petition of Appeal",
    filingBody: "Middlesex County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Middlesex County Board of Taxation",
      "Mail or deliver in person",
    ],
    mailingAddress: "40 Livingston Avenue, New Brunswick, NJ 08901",
    phone: "(732) 745-3350",
    notes: "Middlesex County includes New Brunswick, Edison, Woodbridge, and Piscataway.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Monmouth": {
    county: "Monmouth",
    formName: "A-1 Petition of Appeal",
    filingBody: "Monmouth County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Monmouth County Board of Taxation by April 1",
      "Mail or deliver to the Freehold office",
    ],
    mailingAddress: "1 East Main Street, Freehold, NJ 07728",
    phone: "(732) 431-7404",
    notes: "Monmouth County (Asbury Park, Freehold, Marlboro) — coastal areas have seen significant value increases.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Morris": {
    county: "Morris",
    formName: "A-1 Petition of Appeal",
    filingBody: "Morris County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Morris County Board of Taxation",
      "Mail or deliver in person to Morristown",
    ],
    mailingAddress: "Administration & Records Building, Morristown, NJ 07963",
    phone: "(973) 285-6420",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Somerset": {
    county: "Somerset",
    formName: "A-1 Petition of Appeal",
    filingBody: "Somerset County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Somerset County Board of Taxation",
      "Mail or deliver to the Somerville office",
    ],
    mailingAddress: "27 Warren Street, Somerville, NJ 08876",
    phone: "(908) 231-7015",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Mercer": {
    county: "Mercer",
    formName: "A-1 Petition of Appeal",
    filingBody: "Mercer County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Mercer County Board of Taxation",
      "Mail or deliver to the Trenton office",
    ],
    mailingAddress: "640 South Broad Street, Trenton, NJ 08611",
    phone: "(609) 989-6695",
    notes: "Mercer County includes Trenton, Princeton, and Hamilton Township.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Burlington": {
    county: "Burlington",
    formName: "A-1 Petition of Appeal",
    filingBody: "Burlington County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Burlington County Board of Taxation",
      "Mail or deliver to the Mount Holly office",
    ],
    mailingAddress: "49 Rancocas Road, Mount Holly, NJ 08060",
    phone: "(609) 265-5145",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Camden": {
    county: "Camden",
    formName: "A-1 Petition of Appeal",
    filingBody: "Camden County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Camden County Board of Taxation",
      "Mail or deliver to the county office",
    ],
    mailingAddress: "520 Market Street, Suite 310, Camden, NJ 08102",
    phone: "(856) 225-5238",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Ocean": {
    county: "Ocean",
    formName: "A-1 Petition of Appeal",
    filingBody: "Ocean County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Ocean County Board of Taxation",
      "Mail or deliver to the Toms River office",
    ],
    mailingAddress: "CN 2191, Toms River, NJ 08754",
    phone: "(732) 929-2008",
    notes: "Ocean County covers coastal communities including Toms River, Brick, Lakewood, and shore towns.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Passaic": {
    county: "Passaic",
    formName: "A-1 Petition of Appeal",
    filingBody: "Passaic County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Passaic County Board of Taxation",
      "Mail or deliver to Paterson",
    ],
    mailingAddress: "401 Grand Street, Paterson, NJ 07505",
    phone: "(973) 225-3506",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Gloucester": {
    county: "Gloucester",
    formName: "A-1 Petition of Appeal",
    filingBody: "Gloucester County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Gloucester County Board of Taxation",
      "Mail or deliver to Woodbury",
    ],
    mailingAddress: "1 North Broad Street, Woodbury, NJ 08096",
    phone: "(856) 853-3445",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Hunterdon": {
    county: "Hunterdon",
    formName: "A-1 Petition of Appeal",
    filingBody: "Hunterdon County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Hunterdon County Board of Taxation",
      "Mail or deliver to Flemington",
    ],
    mailingAddress: "71 Main Street, Flemington, NJ 08822",
    phone: "(908) 788-1169",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Atlantic": {
    county: "Atlantic",
    formName: "A-1 Petition of Appeal",
    filingBody: "Atlantic County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Atlantic County Board of Taxation",
      "Mail or deliver to Mays Landing",
    ],
    mailingAddress: "5901 Main Street, Mays Landing, NJ 08330",
    phone: "(609) 645-5820",
    notes: "Atlantic County includes Atlantic City, Galloway, and Egg Harbor Township.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Cape May": {
    county: "Cape May",
    formName: "A-1 Petition of Appeal",
    filingBody: "Cape May County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Cape May County Board of Taxation",
      "Mail or deliver to Cape May Court House",
    ],
    mailingAddress: "Cape May Court House, NJ 08210",
    phone: "(609) 465-1030",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Sussex": {
    county: "Sussex",
    formName: "A-1 Petition of Appeal",
    filingBody: "Sussex County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Sussex County Board of Taxation",
      "Mail or deliver to Newton",
    ],
    mailingAddress: "83 Spring Street, Suite 304, Newton, NJ 07860",
    phone: "(973) 579-0850",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Warren": {
    county: "Warren",
    formName: "A-1 Petition of Appeal",
    filingBody: "Warren County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Warren County Board of Taxation",
      "Mail or deliver to Belvidere",
    ],
    mailingAddress: "165 County Route 519 South, Belvidere, NJ 07823",
    phone: "(908) 475-6607",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Salem": {
    county: "Salem",
    formName: "A-1 Petition of Appeal",
    filingBody: "Salem County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Salem County Board of Taxation",
      "Mail or deliver to Salem City",
    ],
    mailingAddress: "110 Fifth Street, Salem City, NJ 08079",
    phone: "(856) 935-7510",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Cumberland": {
    county: "Cumberland",
    formName: "A-1 Petition of Appeal",
    filingBody: "Cumberland County Board of Taxation",
    filingDeadline: "April 1 (or 45 days from mailing of assessment notice)",
    howToFile: [
      "File Form A-1 with the Cumberland County Board of Taxation",
      "Mail or deliver to Bridgeton",
    ],
    mailingAddress: "790 East Commerce Street, Bridgeton, NJ 08302",
    phone: "(856) 453-2115",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
  "Other": {
    county: "Other",
    formName: "A-1 — County Board of Taxation Petition of Appeal",
    filingBody: "Your County Board of Taxation",
    filingDeadline: "April 1 (or 45 days after mailing of the Notice of Assessment, whichever is later)",
    howToFile: [
      "File Form A-1 (Petition of Appeal) with your County Board of Taxation by April 1",
      "Find your county's tax board at: https://www.nj.gov/treasury/taxation/lpt/tax_board_directory.shtml",
      "Mail or deliver in person to the county board office",
      "Bring or attach evidence: comparable sales (within last 1 year, same neighborhood), any recent appraisal, photos of property condition issues",
    ],
    onlinePortal: { label: "NJ County Tax Board Directory", url: "https://www.nj.gov/treasury/taxation/lpt/tax_board_directory.shtml" },
    notes: "New Jersey requires Form A-1 for all county-level appeals. For properties assessed at $1 million or more, or to appeal a county board decision, file directly with the NJ Tax Court using Form A-3.",
    afterFiling: NJ_GENERIC_AFTER_FILING,
  },
};

export const NJ_COUNTY_NAMES = Object.keys(NJ_COUNTY_FILING);

export function getNjFilingInfo(county: string): NjCountyFilingInfo {
  return NJ_COUNTY_FILING[county] ?? NJ_COUNTY_FILING["Other"];
}

export function getNjComputedDeadline(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-04-01`;
}

export const NJ_BASIS_OPTIONS = [
  { value: "overvaluation", label: "Overassessment — Assessed value exceeds true (market) value × equalization ratio" },
  { value: "unequal", label: "Unequal Assessment — Assessed at a higher ratio than comparable properties in the municipality" },
  { value: "unlawful", label: "Illegal Assessment — Property is tax-exempt or otherwise unlawfully assessed" },
  { value: "excessive", label: "Excessive Assessment — Exceeds statutory or constitutional limits" },
];

export const NJ_PROPERTY_CLASS_OPTIONS = [
  { value: "2", label: "Class 2 — Residential (1–4 family dwelling) — Most homeowners" },
  { value: "1", label: "Class 1 — Vacant Land" },
  { value: "4A", label: "Class 4A — Commercial" },
  { value: "4B", label: "Class 4B — Industrial" },
  { value: "4C", label: "Class 4C — Apartment (5+ units)" },
  { value: "3A", label: "Class 3A — Farm, Regular" },
  { value: "3B", label: "Class 3B — Farm, Qualified" },
];
