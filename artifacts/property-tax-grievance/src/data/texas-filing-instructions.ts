export interface TxAfterFilingStep {
  title: string;
  timeframe: string;
  description: string;
  tip?: string;
}

export interface TxCountyFilingInfo {
  county: string;
  cadName: string;
  formName: string;
  filingBody: string;
  filingDeadline: string;
  howToFile: string[];
  mailingAddress?: string;
  onlinePortal?: { label: string; url: string };
  phone?: string;
  notes?: string;
  afterFiling: {
    steps: TxAfterFilingStep[];
    ifDenied: { appealName: string; deadline: string; fee: string; description: string; url?: string };
    ifReduced: string;
    normalSilence: string;
  };
}

const TX_GENERIC_AFTER_FILING = {
  steps: [
    {
      title: "Protest acknowledged",
      timeframe: "Within a few days",
      description: "The appraisal district logs your protest and sends an acknowledgment. You may receive an informal meeting date or a hearing notice from the ARB.",
      tip: "Keep a copy of your protest form and all correspondence. If you filed online, screenshot the confirmation.",
    },
    {
      title: "Informal meeting with CAD appraiser",
      timeframe: "Weeks 2–6",
      description: "Most districts offer an informal review before the formal ARB hearing. Bring your evidence — comparable sales, photos of condition issues, repair estimates. Many cases are resolved here with a reduction offer.",
      tip: "You are not required to accept the informal offer. If it doesn't meet your target, proceed to the formal ARB hearing.",
    },
    {
      title: "ARB hearing (if informal not resolved)",
      timeframe: "Weeks 4–12",
      description: "The Appraisal Review Board schedules a formal hearing. Present your evidence. The ARB panel is independent from the appraisal district. Bring printed copies of your comparable sales and any documentation of property condition.",
      tip: "Dress professionally and be concise. Most residential hearings last 15–30 minutes. Lead with your market value evidence.",
    },
    {
      title: "ARB order issued",
      timeframe: "Within a few days of hearing",
      description: "The ARB issues a written order with the final appraised value. If reduced, the new value applies to your current tax year. Your tax bill will reflect the reduction.",
    },
  ],
  ifDenied: {
    appealName: "Binding Arbitration or District Court",
    deadline: "60 days from the ARB order date",
    fee: "Binding arbitration: $500 deposit (refundable if you win); District court: filing fees vary by county",
    description: "If the ARB denies your protest or offers an unsatisfactory reduction, you have two paths: (1) Binding arbitration — available if the ARB value is $5 million or less (or $3 million for ag land). An independent arbitrator reviews the case; the CAD pays the $500 fee if you win. (2) District Court — file a lawsuit against the appraisal district. Most homeowners hire a property tax attorney for this step, who typically works on contingency.",
    url: "https://comptroller.texas.gov/taxes/property-tax/dispute/",
  },
  ifReduced: "The reduction applies immediately to the current tax year. Your tax bill (usually sent in October/November) will reflect the lower appraised value. The reduction does not automatically carry forward — you must protest again next year if the value goes back up.",
  normalSilence: "Silence of 4–8 weeks after filing is normal. Districts process thousands of protests each May–July. Your informal meeting or hearing notice will arrive by mail.",
};

export const TX_COUNTY_FILING: Record<string, TxCountyFilingInfo> = {
  "Harris": {
    county: "Harris",
    cadName: "Harris Central Appraisal District (HCAD)",
    formName: "Notice of Protest (iFile online or Form 50-132)",
    filingBody: "Harris County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your appraisal notice, whichever is later)",
    howToFile: [
      "File online at hcad.org — iFile system (fastest, creates instant record)",
      "Or call HCAD at (713) 957-7800 to protest by phone",
      "Or mail/hand-deliver Form 50-132 to the HCAD office",
    ],
    mailingAddress: "13013 Northwest Freeway, Houston, TX 77040",
    onlinePortal: { label: "HCAD iFile Portal", url: "https://ifile.hcad.org/" },
    phone: "(713) 957-7800",
    notes: "Harris County is the largest county in Texas. HCAD processes over 400,000 protests annually. Filing online via iFile gives you the strongest record and is strongly recommended.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Dallas": {
    county: "Dallas",
    cadName: "Dallas Central Appraisal District (DCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Dallas County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at dcad.org — e-Protest system",
      "Or mail Form 50-132 to DCAD",
      "Or drop off in person at the DCAD office",
    ],
    mailingAddress: "2949 N. Stemmons Freeway, Dallas, TX 75247",
    onlinePortal: { label: "DCAD e-Protest Portal", url: "https://www.dcad.org/resources/protest/" },
    phone: "(214) 631-0910",
    notes: "Dallas County has a robust online protest system. The informal hearing process often resolves cases before the ARB hearing date.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Tarrant": {
    county: "Tarrant",
    cadName: "Tarrant Appraisal District (TAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Tarrant County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at tad.org — online protest portal",
      "Or mail/hand-deliver Form 50-132 to TAD",
    ],
    mailingAddress: "2500 Handley-Ederville Road, Fort Worth, TX 76118",
    onlinePortal: { label: "TAD Online Protest", url: "https://www.tad.org/property-protest/" },
    phone: "(817) 284-0024",
    notes: "Tarrant County (Fort Worth area) allows online protests and informal meetings by phone or video. Many cases settle informally.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Travis": {
    county: "Travis",
    cadName: "Travis Central Appraisal District (TCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Travis County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at traviscad.org — online protest system",
      "Or mail Form 50-132 to TCAD",
    ],
    mailingAddress: "850 East Anderson Lane, Austin, TX 78752",
    onlinePortal: { label: "TCAD Online Protest", url: "https://www.traviscad.org/appeals/" },
    phone: "(512) 834-9317",
    notes: "Travis County (Austin) saw dramatic value increases 2020–2023. TCAD handles high protest volumes — file online for the fastest acknowledgment. Austin homesteads with 10% cap may still benefit from protests if improvement values are inflated.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Bexar": {
    county: "Bexar",
    cadName: "Bexar Appraisal District (BCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Bexar County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at bcad.org — online protest filing",
      "Or mail/hand-deliver to BCAD office",
    ],
    mailingAddress: "411 N Frio Street, San Antonio, TX 78207",
    onlinePortal: { label: "BCAD Online Protest", url: "https://www.bcad.org/protest" },
    phone: "(210) 242-2432",
    notes: "Bexar County (San Antonio) offers online, in-person, and phone hearing options. Informal resolution is common for residential properties.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Collin": {
    county: "Collin",
    cadName: "Collin Central Appraisal District (CCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Collin County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at collincad.org",
      "Or mail Form 50-132 to CCAD",
    ],
    mailingAddress: "250 Eldorado Pkwy, McKinney, TX 75069",
    onlinePortal: { label: "CCAD Online Protest", url: "https://www.collincad.org/propertysearch" },
    phone: "(469) 742-9200",
    notes: "Collin County (Plano, Frisco, McKinney) is one of the fastest-growing counties in the US. High-growth areas often have aggressive CAD valuations — strong case for comparable sales evidence.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Denton": {
    county: "Denton",
    cadName: "Denton Central Appraisal District (DCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Denton County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at dentoncad.com",
      "Or mail/drop off Form 50-132 to DCAD",
    ],
    mailingAddress: "3911 Morse Street, Denton, TX 76208",
    onlinePortal: { label: "Denton CAD Protest", url: "https://www.dentoncad.com/protest" },
    phone: "(940) 349-3800",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Fort Bend": {
    county: "Fort Bend",
    cadName: "Fort Bend Central Appraisal District (FBCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Fort Bend County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at fbcad.org",
      "Or mail/drop off to FBCAD office",
    ],
    mailingAddress: "2801 B F Terry Blvd, Rosenberg, TX 77471",
    onlinePortal: { label: "FBCAD Online Protest", url: "https://www.fbcad.org/protest/" },
    phone: "(281) 344-8623",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Montgomery": {
    county: "Montgomery",
    cadName: "Montgomery Central Appraisal District (MCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Montgomery County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at mcad-tx.org",
      "Or mail/drop off Form 50-132 to MCAD",
    ],
    mailingAddress: "109 Gladstell, Conroe, TX 77301",
    onlinePortal: { label: "MCAD Online Protest", url: "https://www.mcad-tx.org/protest" },
    phone: "(936) 756-3354",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Williamson": {
    county: "Williamson",
    cadName: "Williamson Central Appraisal District (WCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Williamson County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at wcad.org",
      "Or mail/drop off to WCAD office",
    ],
    mailingAddress: "625 FM 1460, Georgetown, TX 78626",
    onlinePortal: { label: "WCAD Online Protest", url: "https://www.wcad.org/online-protest-filing/" },
    phone: "(512) 930-3787",
    notes: "Williamson County (Round Rock, Georgetown, Cedar Park) experienced some of the highest appreciation in the country 2020–2023.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "El Paso": {
    county: "El Paso",
    cadName: "El Paso Central Appraisal District (EPCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "El Paso County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at epcad.org",
      "Or mail/drop off to EPCAD office",
    ],
    mailingAddress: "5801 Trowbridge Drive, El Paso, TX 79925",
    onlinePortal: { label: "EPCAD Online Protest", url: "https://www.epcad.org/protest" },
    phone: "(915) 780-2000",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Galveston": {
    county: "Galveston",
    cadName: "Galveston Central Appraisal District (GCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Galveston County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at galvestoncad.org",
      "Or mail/drop off Form 50-132 to GCAD",
    ],
    mailingAddress: "9850 Emmett F. Lowry Expressway, Texas City, TX 77591",
    onlinePortal: { label: "GCAD Protest Portal", url: "https://www.galvestoncad.org/protest" },
    phone: "(409) 935-1980",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Hays": {
    county: "Hays",
    cadName: "Hays Central Appraisal District (HCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Hays County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at hayscad.com",
      "Or mail/drop off to HCAD office",
    ],
    mailingAddress: "21001 IH 35 North, Kyle, TX 78640",
    onlinePortal: { label: "Hays CAD Protest", url: "https://www.hayscad.com/protest" },
    phone: "(512) 268-2522",
    notes: "Hays County (Kyle, Buda, San Marcos) is one of Texas's fastest-growing counties. Values rose dramatically and protest volumes are high.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Nueces": {
    county: "Nueces",
    cadName: "Nueces County Appraisal District (NCAD)",
    formName: "Notice of Protest (online or Form 50-132)",
    filingBody: "Nueces County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value)",
    howToFile: [
      "File online at nuecescad.net",
      "Or mail/drop off to NCAD office",
    ],
    mailingAddress: "201 N. Chaparral Street, Corpus Christi, TX 78401",
    onlinePortal: { label: "NCAD Protest Portal", url: "https://www.nuecescad.net/protest" },
    phone: "(361) 881-9978",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
  "Other": {
    county: "Other",
    cadName: "Your County Appraisal District (CAD)",
    formName: "Notice of Protest (Form 50-132 or county online portal)",
    filingBody: "Your County Appraisal Review Board (ARB)",
    filingDeadline: "May 15 (or 30 days after your Notice of Appraised Value, whichever is later)",
    howToFile: [
      "Find your county's Appraisal District at comptroller.texas.gov/taxes/property-tax/cadaddresses/",
      "File Form 50-132 (Notice of Protest) with your County Appraisal District",
      "Many counties offer online protest filing — check your CAD's website",
      "Attend the informal meeting and/or ARB hearing with your evidence",
    ],
    onlinePortal: { label: "Texas CAD Directory", url: "https://comptroller.texas.gov/taxes/property-tax/cadaddresses/" },
    notes: "Every Texas county has its own Appraisal District. Look yours up at the Texas Comptroller's website above to find the exact address, phone number, and online portal.",
    afterFiling: TX_GENERIC_AFTER_FILING,
  },
};

export const TX_COUNTY_NAMES = Object.keys(TX_COUNTY_FILING);

export function getTxFilingInfo(county: string): TxCountyFilingInfo {
  return TX_COUNTY_FILING[county] ?? TX_COUNTY_FILING["Other"];
}

export function getTxComputedDeadline(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-05-15`;
}

export const TX_BASIS_OPTIONS = [
  { value: "market_value", label: "Incorrect Appraised Value — Market value is lower than the CAD's appraised value" },
  { value: "unequal", label: "Unequal Appraisal — Appraised higher than comparable properties in your neighborhood" },
  { value: "not_taxable", label: "Property Not Subject to Taxation — Exempt property or improper classification" },
  { value: "ownership", label: "Incorrect Ownership / Address — Wrong owner listed or property description error" },
  { value: "ag_exemption", label: "Ag Exemption Denial — Land qualifies for agricultural appraisal but was denied" },
];

export const TX_PROPERTY_CLASS_OPTIONS = [
  { value: "A1", label: "A1 — Single Family Residence" },
  { value: "A2", label: "A2 — Mobile / Manufactured Home" },
  { value: "B1", label: "B1 — Multifamily (2–4 units)" },
  { value: "B2", label: "B2 — Multifamily (5+ units)" },
  { value: "C1", label: "C1 — Vacant Residential Land" },
  { value: "D1", label: "D1 — Qualified Agricultural Land" },
  { value: "F1", label: "F1 — Commercial Real Property" },
];
