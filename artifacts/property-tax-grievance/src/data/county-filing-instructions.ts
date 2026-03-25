export interface AfterFilingStep {
  title: string;
  timeframe: string;
  description: string;
  tip?: string;
}

export interface AfterFilingInfo {
  steps: AfterFilingStep[];
  ifDenied: {
    appealName: string;
    deadline: string;
    fee: string;
    description: string;
    url?: string;
  };
  ifReduced: string;
  normalSilence: string;
}

export interface CountyFilingInfo {
  county: string;
  formName: string;
  filingBody: string;
  filingDeadline: string;
  howToFile: string[];
  mailingAddress?: string;
  dropOffAddress?: string;
  onlinePortal?: { label: string; url: string };
  phone?: string;
  notes?: string;
  afterFiling: AfterFilingInfo;
}

const NYC_AFTER_FILING: AfterFilingInfo = {
  steps: [
    {
      title: "Confirmation received",
      timeframe: "Same day",
      description: "You receive an email or case number from the NYC Tax Commission portal confirming your TC101/TC201 was received. Save this — it's your proof of filing.",
      tip: "Take a screenshot of the confirmation page as a backup.",
    },
    {
      title: "Tax Commission review begins",
      timeframe: "Months 1–3",
      description: "The Tax Commission reviews your property's records and comparable sales. For residential Class 1 properties, this is mostly administrative — no hearing is required unless you or the Commission requests one.",
    },
    {
      title: "Settlement offer (stipulation)",
      timeframe: "Months 3–9",
      description: "The Tax Commission may send you a stipulation — an offer to settle at a partial reduction. You are not required to accept it. Review it carefully against your original request before signing.",
      tip: "A stipulation offer means they found merit in your case. You can negotiate or decline and proceed to a hearing.",
    },
    {
      title: "Written determination issued",
      timeframe: "Months 6–18",
      description: "A formal written decision is mailed or sent by email. It will state whether your assessment was reduced, and by how much. If reduced, the new assessment takes effect on your next tax bill.",
    },
  ],
  ifDenied: {
    appealName: "Article 78 Proceeding",
    deadline: "4 months from the date of the determination",
    fee: "Court filing fee applies — an attorney is typically required",
    description: "NYC denial appeals require an Article 78 proceeding in State Supreme Court. This is a formal legal process and most homeowners use an attorney. However, given the size of NYC tax bills, it is often worth pursuing.",
    url: "https://www.nyc.gov/site/taxcommission/index.page",
  },
  ifReduced: "The reduction is applied to your assessed value for the next tax year. Your tax bill will reflect the lower assessment. The change does not refund prior years — it applies going forward.",
  normalSilence: "6–12 months of silence after filing is completely normal. The Tax Commission handles tens of thousands of applications each year. No news is not bad news.",
};

export const COUNTY_FILING: Record<string, CountyFilingInfo> = {
  "Nassau": {
    county: "Nassau",
    formName: "AR-1 (Nassau County Assessment Review)",
    filingBody: "Nassau County Assessment Review Commission (ARC)",
    filingDeadline: "March 1 (annually)",
    howToFile: [
      "File online via the AROW (Assessment Review Online) portal — preferred method",
      "Or download the AR-1 form and mail/drop off to the ARC office",
    ],
    onlinePortal: { label: "AROW Online Portal", url: "https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html" },
    mailingAddress: "Assessment Review Commission, 240 Old Country Rd, Mineola, NY 11501",
    dropOffAddress: "240 Old Country Rd, Mineola, NY 11501",
    phone: "(516) 571-3214",
    notes: "Nassau uses AR-1, not RP-524. The AROW portal is strongly preferred — paper filing is slower and harder to track.",
    afterFiling: {
      steps: [
        {
          title: "AROW confirmation email",
          timeframe: "Within 24 hours",
          description: "After submitting via AROW, you receive an email confirmation with a case number. Save this. It is your official proof of filing and you can use it to check your case status online.",
          tip: "Log into your AROW account at any time to view your case status.",
        },
        {
          title: "ARC reviews your submission",
          timeframe: "Months 1–5",
          description: "Nassau ARC reviews your comparable sales, property data, and market value argument. No hearing is required — the ARC makes its determination based on the written record. You do not need to appear anywhere.",
          tip: "Nassau ARC processes tens of thousands of cases annually. No contact during this period is normal.",
        },
        {
          title: "Written determination mailed",
          timeframe: "Months 4–8 (typically by October)",
          description: "ARC mails (and emails, if you opted in) a Notice of Determination. It will state: Granted (full reduction), Partially Granted (partial reduction), or Denied. If granted or partially granted, the new assessment takes effect the following tax year.",
          tip: "If you filed by March 1, expect your determination by October of the same year.",
        },
        {
          title: "Tax bill reflects new assessment",
          timeframe: "Following January",
          description: "If your grievance was granted or partially granted, your January tax bill will reflect the reduced assessment. The savings appear automatically — you do not need to do anything further.",
        },
      ],
      ifDenied: {
        appealName: "Small Claims Assessment Review (SCAR)",
        deadline: "30 days from the date on the ARC determination notice",
        fee: "$30 filing fee",
        description: "If ARC denies your complaint, you have 30 days to file a SCAR petition in Nassau County District Court. SCAR is an informal, low-cost proceeding where a hearing officer reviews your case. You do not need an attorney, though many homeowners bring one. Hearing officers frequently reduce assessments that ARC denied.",
        url: "https://www.nycourts.gov/courts/10jd/nassau/scar.shtml",
      },
      ifReduced: "The new lower assessment is applied to your tax bill starting the following January. Nassau typically sends a revised tax bill — you do not need to request it. The reduction applies year after year until the assessor reassesses your property.",
      normalSilence: "3–6 months of silence after filing is completely normal for Nassau ARC. They process over 100,000 cases per year. Your AROW account will show the current status of your case.",
    },
  },
  "Suffolk": {
    county: "Suffolk",
    formName: "RP-524",
    filingBody: "Your local Town Assessor's Office (10 towns)",
    filingDeadline: "Third Tuesday in May (varies by town)",
    howToFile: [
      "File the RP-524 form with your specific town assessor (Babylon, Brookhaven, East Hampton, Huntington, Islip, Riverhead, Shelter Island, Smithtown, Southampton, or Southold)",
      "Mail or hand-deliver to the town assessor's office before the grievance day deadline",
      "Appear at the Board of Assessment Review (BAR) hearing if required by your town",
    ],
    notes: "Suffolk has 10 separate towns each with their own assessor. Find your town at suffolkcountyny.gov. Grievance Day is the 3rd Tuesday in May for most towns.",
    onlinePortal: { label: "Suffolk County Tax Map", url: "https://gis.suffolkcountyny.gov/Portal/apps/webappviewer/index.html" },
    afterFiling: {
      steps: [
        {
          title: "Filing confirmation",
          timeframe: "Same day",
          description: "When you hand-deliver, request a date-stamped copy of your RP-524 as proof of filing. If mailing, use certified mail with return receipt. Keep both.",
          tip: "Never file by regular mail without tracking — there is no second chance if it is lost.",
        },
        {
          title: "Grievance Day hearing",
          timeframe: "3rd Tuesday in May",
          description: "Grievance Day is the day the Board of Assessment Review (BAR) convenes. Most Suffolk towns require you to appear — or submit a written statement in advance. Bring your comparables, any photos of your property, and your RP-524. The BAR hearing is informal, usually 5–10 minutes.",
          tip: "Call your town assessor's office a week before to confirm whether you need to appear in person or can submit written testimony.",
        },
        {
          title: "BAR deliberates",
          timeframe: "2–6 weeks after Grievance Day",
          description: "The Board of Assessment Review meets privately to review all cases. They may grant a full reduction, partial reduction, or deny. Suffolk BAR decisions tend to be more conservative than Nassau ARC — having strong comparables matters greatly.",
        },
        {
          title: "Written determination",
          timeframe: "By July (most towns)",
          description: "The BAR mails a Notice of Determination. If granted, the new assessment appears on your tentative assessment roll in January. If denied, your 30-day SCAR window begins from the date on this notice.",
        },
      ],
      ifDenied: {
        appealName: "Small Claims Assessment Review (SCAR)",
        deadline: "30 days from the date on the BAR determination",
        fee: "$30 filing fee",
        description: "File a SCAR petition at your local Suffolk County District Court. SCAR is informal — bring the same comparables you used in your grievance plus any additional evidence. Hearing officers often grant reductions that BAR denied, especially when supported by recent comparable sales.",
        url: "https://www.nycourts.gov/courts/10jd/suffolk/",
      },
      ifReduced: "The reduced assessment applies to your next tax bill (typically January). Suffolk will mail a revised assessment notice. The savings continue year-over-year until the town reassesses your property.",
      normalSilence: "Between filing and Grievance Day (typically 1–6 weeks), nothing happens. After Grievance Day, expect 2–6 weeks of silence while the BAR deliberates. This is normal.",
    },
  },
  "Westchester": {
    county: "Westchester",
    formName: "RP-524",
    filingBody: "Your municipality's Board of Assessment Review",
    filingDeadline: "Third Tuesday in June (for most municipalities)",
    howToFile: [
      "File RP-524 with the assessor for your specific city, town, or village",
      "Westchester has dozens of assessing units — find yours at westchestergov.com",
      "Many Westchester municipalities allow online or mail filing",
    ],
    onlinePortal: { label: "Westchester Tax Portal", url: "https://www.westchestergov.com/real-property" },
    notes: "Westchester has over 40 separate assessing units. The deadline varies — confirm with your town/village assessor.",
    afterFiling: {
      steps: [
        {
          title: "Filing acknowledgment",
          timeframe: "Within 1–2 weeks",
          description: "Your assessor's office logs your RP-524. If you hand-delivered, get a date-stamped copy. If mailed, your certified mail receipt is your proof.",
        },
        {
          title: "Grievance Day hearing",
          timeframe: "3rd Tuesday in June (most municipalities)",
          description: "The Board of Assessment Review convenes. Most Westchester municipalities allow written submissions in lieu of personal appearance — confirm with your assessor. Hearings are informal, typically 5–15 minutes. Bring your comparables and a clear explanation of your market value estimate.",
          tip: "Westchester BAR members often respond well to a one-page summary showing your comparables side-by-side with your property.",
        },
        {
          title: "BAR decision",
          timeframe: "2–8 weeks after Grievance Day",
          description: "The Board mails its determination. Westchester BAR decisions vary widely by municipality — some are generous, some conservative. The written decision will state the new assessment or confirm the original.",
        },
        {
          title: "Assessment roll updated",
          timeframe: "Following January",
          description: "If granted, the new assessment appears on the tentative assessment roll and your next tax bill reflects the reduction.",
        },
      ],
      ifDenied: {
        appealName: "Small Claims Assessment Review (SCAR)",
        deadline: "30 days from the date of the BAR determination",
        fee: "$30 filing fee",
        description: "File a SCAR petition at Westchester County Court. SCAR proceedings are informal — a hearing officer hears your case, reviews comparable sales, and often grants reductions that local BARs denied. Most cases are resolved within 6–12 months of filing the petition.",
        url: "https://www.nycourts.gov/courts/9jd/index.shtml",
      },
      ifReduced: "The reduced assessment takes effect on the following year's tax bill. Westchester counties and municipalities will issue a revised assessment notice. Savings continue annually until reassessment.",
      normalSilence: "Between filing in June and the BAR decision (typically August), 6–8 weeks of silence is normal. No contact from the assessor during this period does not indicate a problem.",
    },
  },
  "Kings": {
    county: "Kings",
    formName: "TC101 (Class 1) or TC201 (Class 2/4)",
    filingBody: "NYC Tax Commission",
    filingDeadline: "March 15 (Class 1) / March 1 (Class 2/4)",
    howToFile: [
      "File online at the NYC Tax Commission e-filing portal",
      "Or mail the completed TC101/TC201 form to NYC Tax Commission",
    ],
    onlinePortal: { label: "NYC Tax Commission E-Filing", url: "https://www.nyc.gov/site/taxcommission/index.page" },
    mailingAddress: "NYC Tax Commission, 1 Centre Street, Room 2400, New York, NY 10007",
    phone: "(212) 669-4410",
    notes: "Brooklyn (Kings County) uses NYC Tax Commission forms, not RP-524. Class 1 (1-3 family homes) uses TC101.",
    afterFiling: NYC_AFTER_FILING,
  },
  "Queens": {
    county: "Queens",
    formName: "TC101 (Class 1) or TC201 (Class 2/4)",
    filingBody: "NYC Tax Commission",
    filingDeadline: "March 15 (Class 1) / March 1 (Class 2/4)",
    howToFile: [
      "File online at the NYC Tax Commission e-filing portal",
      "Or mail TC101/TC201 to NYC Tax Commission",
    ],
    onlinePortal: { label: "NYC Tax Commission E-Filing", url: "https://www.nyc.gov/site/taxcommission/index.page" },
    mailingAddress: "NYC Tax Commission, 1 Centre Street, Room 2400, New York, NY 10007",
    phone: "(212) 669-4410",
    notes: "Queens uses NYC Tax Commission forms, not RP-524. Class 1 (1-3 family homes) uses TC101.",
    afterFiling: NYC_AFTER_FILING,
  },
  "New York": {
    county: "New York",
    formName: "TC101 (Class 1) or TC201 (Class 2/4)",
    filingBody: "NYC Tax Commission",
    filingDeadline: "March 15 (Class 1) / March 1 (Class 2/4)",
    howToFile: [
      "File online at the NYC Tax Commission e-filing portal",
      "Or mail TC101/TC201 to NYC Tax Commission",
    ],
    onlinePortal: { label: "NYC Tax Commission E-Filing", url: "https://www.nyc.gov/site/taxcommission/index.page" },
    mailingAddress: "NYC Tax Commission, 1 Centre Street, Room 2400, New York, NY 10007",
    phone: "(212) 669-4410",
    notes: "Manhattan (New York County) uses NYC Tax Commission forms.",
    afterFiling: NYC_AFTER_FILING,
  },
  "Bronx": {
    county: "Bronx",
    formName: "TC101 (Class 1) or TC201 (Class 2/4)",
    filingBody: "NYC Tax Commission",
    filingDeadline: "March 15 (Class 1) / March 1 (Class 2/4)",
    howToFile: [
      "File online at the NYC Tax Commission e-filing portal",
    ],
    onlinePortal: { label: "NYC Tax Commission E-Filing", url: "https://www.nyc.gov/site/taxcommission/index.page" },
    mailingAddress: "NYC Tax Commission, 1 Centre Street, Room 2400, New York, NY 10007",
    phone: "(212) 669-4410",
    afterFiling: NYC_AFTER_FILING,
  },
  "Richmond": {
    county: "Richmond",
    formName: "TC101 (Class 1) or TC201 (Class 2/4)",
    filingBody: "NYC Tax Commission",
    filingDeadline: "March 15 (Class 1) / March 1 (Class 2/4)",
    howToFile: [
      "File online at the NYC Tax Commission e-filing portal",
    ],
    onlinePortal: { label: "NYC Tax Commission E-Filing", url: "https://www.nyc.gov/site/taxcommission/index.page" },
    mailingAddress: "NYC Tax Commission, 1 Centre Street, Room 2400, New York, NY 10007",
    phone: "(212) 669-4410",
    notes: "Staten Island (Richmond County) uses NYC Tax Commission forms.",
    afterFiling: NYC_AFTER_FILING,
  },
};

const GENERIC_AFTER_FILING: AfterFilingInfo = {
  steps: [
    {
      title: "Filing confirmation",
      timeframe: "Same day",
      description: "Request a date-stamped copy of your RP-524 when filing in person. If mailing, use certified mail with return receipt and keep your receipt as proof of timely filing.",
      tip: "Keep your stamped copy or tracking receipt — you may need it if there is a dispute about whether you filed on time.",
    },
    {
      title: "Grievance Day hearing",
      timeframe: "Third Tuesday in May (most counties)",
      description: "The Board of Assessment Review (BAR) meets on Grievance Day. Some counties require personal appearance; others accept written submissions. Call your assessor's office to confirm. Bring your comparables and be prepared to explain your market value estimate in plain language.",
      tip: "Keep your presentation simple: 'Three similar homes nearby sold for an average of $X. My assessment implies a value of $Y. I'm asking for the assessment to be reduced to reflect the actual market.'",
    },
    {
      title: "BAR deliberates and decides",
      timeframe: "2–6 weeks after Grievance Day",
      description: "The Board meets privately to review all cases filed. They issue a Notice of Determination by mail. Decisions are typically made by July or August.",
    },
    {
      title: "Assessment updated (if granted)",
      timeframe: "Following January",
      description: "A successful grievance takes effect on your next tax bill. The new lower assessment is applied automatically — you do not need to do anything further.",
    },
  ],
  ifDenied: {
    appealName: "Small Claims Assessment Review (SCAR)",
    deadline: "30 days from the date on the BAR determination notice",
    fee: "$30 filing fee",
    description: "If the BAR denies your complaint, you have 30 days to file a SCAR petition at your local County Court. SCAR is an informal proceeding — no attorney required. A hearing officer reviews your comparable sales evidence and issues a binding decision. Hearing officers frequently grant reductions that local BARs denied.",
    url: "https://www.nycourts.gov/",
  },
  ifReduced: "The reduced assessment applies to your next January tax bill automatically. You do not need to contact anyone or take further action. The savings continue every year until your property is reassessed.",
  normalSilence: "After filing, it is completely normal to hear nothing for weeks or months. The BAR does not send interim updates. The first contact you receive will be the Notice of Determination, typically mailed in July or August.",
};

export function getFilingInfo(county: string): CountyFilingInfo | null {
  const normalized = county.trim();
  return COUNTY_FILING[normalized] ?? null;
}

function nthTuesdayISO(year: number, month: number, n: number): string {
  // month is 0-indexed (4 = May, 5 = June)
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay();
  const offset = (2 - dayOfWeek + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  const d = new Date(year, month, day);
  return d.toISOString().split("T")[0];
}

export function getComputedDeadline(county: string, state?: string): string | null {
  const year = new Date().getFullYear();
  const normalized = county.trim();
  if (state === "TX") return `${year}-05-15`;
  if (state === "NJ") return `${year}-04-01`;
  if (normalized === "Nassau") return `${year}-03-01`;
  if (["Kings", "Queens", "New York", "Bronx", "Richmond"].includes(normalized)) return `${year}-03-15`;
  if (normalized === "Suffolk") return nthTuesdayISO(year, 4, 3);
  if (normalized === "Westchester") return nthTuesdayISO(year, 5, 3);
  if (normalized === "Rockland") return nthTuesdayISO(year, 4, 3);
  if (normalized === "Albany") return nthTuesdayISO(year, 4, 3);
  if (COUNTY_FILING[normalized]) return nthTuesdayISO(year, 4, 3);
  return null;
}

export function getGenericFilingInfo(county: string): CountyFilingInfo {
  return {
    county,
    formName: "RP-524",
    filingBody: "Your local Board of Assessment Review (BAR)",
    filingDeadline: "Third Tuesday in May (most NY counties)",
    howToFile: [
      "Download and complete Form RP-524 (Complaint on Real Property Assessment)",
      "File with your local assessor's office before Grievance Day",
      "Attend the Board of Assessment Review hearing if required",
      "If denied, you may further appeal to the Small Claims Assessment Review (SCAR) court",
    ],
    onlinePortal: { label: "NYS RP-524 Form Download", url: "https://www.tax.ny.gov/pit/property/contest/contestasmt.htm" },
    notes: `For ${county} County, confirm your exact deadline with your local assessor's office, as Grievance Day varies by municipality.`,
    afterFiling: GENERIC_AFTER_FILING,
  };
}
