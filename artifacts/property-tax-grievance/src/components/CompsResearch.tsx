import { ExternalLink, Search, MapPin, Database, BookOpen } from "lucide-react";

interface CompsResearchProps {
  county: string;
}

const COUNTY_SOURCES: Record<string, { name: string; url: string; description: string; primary?: boolean }[]> = {
  Nassau: [
    {
      name: "Nassau AROW Sales Locator",
      url: "https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html",
      description: "The official Nassau portal has a built-in comparable sales search — your most powerful tool for Nassau filings.",
      primary: true,
    },
    {
      name: "Nassau County Assessor Database",
      url: "https://www.nassaucountyny.gov/agencies/Assessor",
      description: "Look up assessed values and property details for any Nassau parcel.",
    },
    {
      name: "Zillow — Nassau County",
      url: "https://www.zillow.com/nassau-county-ny/sold/",
      description: "Recent sold homes in Nassau County. Filter by neighborhood, size, and bed/bath count.",
    },
  ],
  Suffolk: [
    {
      name: "Suffolk County Real Property Info",
      url: "https://suffolkcountyny.gov/Departments/Assessment",
      description: "Look up property assessments and find sale records for your town.",
      primary: true,
    },
    {
      name: "Suffolk County Clerk — Property Records",
      url: "https://www.suffolkcountyny.gov/Departments/CountyClerk",
      description: "Recorded deeds show actual sale prices for properties in Suffolk County.",
    },
    {
      name: "Zillow — Suffolk County",
      url: "https://www.zillow.com/suffolk-county-ny/sold/",
      description: "Filter by your town and property type to find comparable recent sales.",
    },
  ],
  "New York City": [
    {
      name: "NYC ACRIS (Property Records)",
      url: "https://a836-acris.nyc.gov/CP/",
      description: "Official NYC property sale records. Search by address to see exact sale prices and dates.",
      primary: true,
    },
    {
      name: "NYC Property Information Portal",
      url: "https://a836-acris.nyc.gov/",
      description: "Look up any NYC property's assessed value, ownership history, and more.",
    },
    {
      name: "NYC Tax Commission",
      url: "https://www.nyc.gov/site/taxcommission/index.page",
      description: "File your NYC Tax Commission application and track your case online.",
    },
  ],
  Westchester: [
    {
      name: "Westchester County GIS",
      url: "https://giswww.westchestergov.com/",
      description: "Interactive map to find parcels, assessed values, and recent sales in Westchester.",
      primary: true,
    },
    {
      name: "Westchester County Clerk",
      url: "https://www.westchesterclerk.com/",
      description: "Search recorded deeds and mortgages to find verified sale prices.",
    },
  ],
  Rockland: [
    {
      name: "Rockland County Real Property",
      url: "https://www.co.rockland.ny.us/Government/Departments/Finance/RealPropertyTax.aspx",
      description: "Look up property assessments and tax records in Rockland County.",
      primary: true,
    },
  ],
};

const DEFAULT_SOURCES = [
  {
    name: "NY State ORPTS Property Database",
    url: "https://www.tax.ny.gov/research/property/assess/sales/",
    description: "NYS Office of Real Property Tax Services publishes equalization rates and sales data for every county.",
    primary: true,
  },
  {
    name: "Zillow Sold Homes",
    url: "https://www.zillow.com/homes/sold/",
    description: "Search recent sales by ZIP code, bedroom count, and square footage. Good starting point for any county.",
  },
  {
    name: "Realtor.com Recently Sold",
    url: "https://www.realtor.com/realestateandhomes-search/recently-sold/",
    description: "Another source for recent sales data with detailed property specs.",
  },
];

const TIPS = [
  "Aim for 3–6 comparable sales within 1 mile of your property, sold within the last 24 months.",
  "Choose comps with similar square footage (±20%), bedroom/bath count, lot size, and age.",
  "Comps that sold for less than your assessed market value strengthen your case.",
  "Record the exact sale price, sale date, and property address for each comp.",
  "If you find a comp's assessed value, include it — a higher assessment ratio on your home proves unequal treatment.",
  "Screenshot or print each comp record — bring copies to your BAR hearing.",
];

export function CompsResearch({ county }: CompsResearchProps) {
  const matchedKey = Object.keys(COUNTY_SOURCES).find((k) =>
    county.toLowerCase().includes(k.toLowerCase())
  );
  const sources = matchedKey ? COUNTY_SOURCES[matchedKey] : DEFAULT_SOURCES;

  return (
    <div className="space-y-5">
      <div>
        <h4 className="font-semibold text-base flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-primary" />
          Where to Find Comparable Sales
        </h4>
        <p className="text-sm text-muted-foreground">
          {matchedKey
            ? `Best sources for finding comps in ${matchedKey} County:`
            : "Best public sources for finding comparable sales in New York:"}
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:border-primary/50 hover:bg-primary/5 group ${
              source.primary
                ? "border-primary/30 bg-primary/5"
                : "border-border"
            }`}
          >
            <Database className={`w-4 h-4 mt-0.5 flex-shrink-0 ${source.primary ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {source.name}
                </span>
                {source.primary && (
                  <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">
                    BEST SOURCE
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{source.description}</p>
            </div>
          </a>
        ))}

        {matchedKey && (
          <>
            <div className="text-xs text-muted-foreground font-medium pt-1">Also useful for any county:</div>
            {DEFAULT_SOURCES.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border border-border transition-colors hover:border-primary/50 hover:bg-primary/5 group"
              >
                <Database className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{source.name}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{source.description}</p>
                </div>
              </a>
            ))}
          </>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h5 className="font-semibold text-sm text-amber-900 flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4" /> Tips for Choosing Good Comps
        </h5>
        <ul className="space-y-1.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-amber-800">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-600" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
