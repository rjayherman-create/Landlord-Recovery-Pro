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
}

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
  },
};

export function getFilingInfo(county: string): CountyFilingInfo | null {
  const normalized = county.trim();
  return COUNTY_FILING[normalized] ?? null;
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
  };
}
