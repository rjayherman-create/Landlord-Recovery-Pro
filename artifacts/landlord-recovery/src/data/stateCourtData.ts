export interface StateCourtEntry {
  state: string;
  abbr: string;
  limit: string;
  filingFee: string;
  notes: string;
  filingUrl: string;
  filingSteps: string[];
}

export const stateCourtData: StateCourtEntry[] = [
  {
    state: "Alabama", abbr: "AL", limit: "$6,000", filingFee: "Varies by county", notes: "",
    filingUrl: "https://judicial.alabama.gov/",
    filingSteps: ["Download your completed filing packet", "Locate the District Court in the county where the property is located", "File your complaint form and pay the filing fee", "Receive your hearing date and return here to prepare"],
  },
  {
    state: "Alaska", abbr: "AK", limit: "$10,000", filingFee: "Varies", notes: "",
    filingUrl: "https://courts.alaska.gov/shc/civil/smallclaims.htm",
    filingSteps: ["Download your completed filing packet", "File at the nearest District Court location", "Pay the filing fee", "Track your hearing date in the dashboard"],
  },
  {
    state: "Arizona", abbr: "AZ", limit: "$3,500", filingFee: "$25 - $71", notes: "",
    filingUrl: "https://www.azcourts.gov/selfservicecenter/Civil-Matters/Small-Claims",
    filingSteps: ["Download your completed filing packet", "File at the Justice Court in the precinct where the defendant lives or the property is located", "Pay the filing fee", "Serve defendant and return to track the hearing"],
  },
  {
    state: "Arkansas", abbr: "AR", limit: "$5,000", filingFee: "$65 - $85", notes: "",
    filingUrl: "https://courts.arkansas.gov/",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the appropriate county", "Pay the filing fee", "Return to dashboard to prepare for your hearing"],
  },
  {
    state: "California", abbr: "CA", limit: "$12,500", filingFee: "$30 - $75", notes: "$10k for individuals; $5k for businesses",
    filingUrl: "https://selfhelp.courts.ca.gov/small-claims",
    filingSteps: ["Download your completed filing packet", "Review defendant information carefully", "Submit forms at your county Superior Court's small claims division", "Pay filing fee online or in person", "Track your hearing date in the dashboard"],
  },
  {
    state: "Colorado", abbr: "CO", limit: "$7,500", filingFee: "$31 - $55", notes: "",
    filingUrl: "https://www.courts.state.co.us/Self_Help/smallclaims/",
    filingSteps: ["Download your completed filing packet", "File at the County Court where the defendant resides or the property is located", "Pay the filing fee", "Serve defendant and monitor your hearing date"],
  },
  {
    state: "Connecticut", abbr: "CT", limit: "$5,000", filingFee: "$95 - $175", notes: "Small Claims Court is part of Superior Court",
    filingUrl: "https://www.jud.ct.gov/Publications/CV040.pdf",
    filingSteps: ["Download your completed filing packet", "File at the Superior Court housing session in the correct judicial district", "Pay the filing fee", "Serve defendant and return here to track the case"],
  },
  {
    state: "Delaware", abbr: "DE", limit: "$15,000", filingFee: "$35 - $95", notes: "",
    filingUrl: "https://courts.delaware.gov/help/proceedings/smallclaims.aspx",
    filingSteps: ["Download your completed filing packet", "File at the Justice of the Peace Court in the correct county", "Pay the filing fee", "Track your hearing date and prepare with the dashboard"],
  },
  {
    state: "Florida", abbr: "FL", limit: "$8,000", filingFee: "$55 - $300", notes: "",
    filingUrl: "https://help.flcourts.gov/Other-Resources/Small-Claims",
    filingSteps: ["Download your completed filing packet", "File at the County Court in the county where the defendant resides", "Pay the filing fee based on claim amount", "Attend mediation if required, then your hearing"],
  },
  {
    state: "Georgia", abbr: "GA", limit: "$15,000", filingFee: "Varies by county", notes: "Magistrate Court",
    filingUrl: "https://georgiacourts.gov/magistrate/",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate Court in the county where the tenant resides", "Pay the filing fee", "Receive hearing notice and return to prepare"],
  },
  {
    state: "Hawaii", abbr: "HI", limit: "$5,000", filingFee: "$30 - $80", notes: "",
    filingUrl: "https://www.courts.state.hi.us/self-help/courts/small_claims_court",
    filingSteps: ["Download your completed filing packet", "File at the District Court on the island where the defendant lives or the property is located", "Pay the filing fee", "Track your hearing date in the dashboard"],
  },
  {
    state: "Idaho", abbr: "ID", limit: "$5,000", filingFee: "$45 - $75", notes: "",
    filingUrl: "https://isc.idaho.gov/pages/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate Division of the District Court", "Pay the filing fee", "Serve defendant and return to prepare for your hearing"],
  },
  {
    state: "Illinois", abbr: "IL", limit: "$10,000", filingFee: "Varies by county", notes: "Chicago has additional RLTO requirements",
    filingUrl: "https://www.illinoiscourts.gov/forms/approved-forms/forms-approved-forms-circuit-court/small-claims",
    filingSteps: ["Download your completed filing packet", "Locate the Circuit Court in your county", "File your complaint and pay the county filing fee", "Pay filing fee", "Track judgment collection steps in the dashboard"],
  },
  {
    state: "Indiana", abbr: "IN", limit: "$10,000", filingFee: "$35 - $85", notes: "",
    filingUrl: "https://www.in.gov/courts/selfservice/",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims Court in the proper township", "Pay the filing fee", "Attend mandatory mediation if ordered, then your hearing"],
  },
  {
    state: "Iowa", abbr: "IA", limit: "$6,500", filingFee: "$40 - $95", notes: "",
    filingUrl: "https://www.iowacourts.gov/for-the-public/representing-yourself-in-court/small-claims/",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims Court in the county where the defendant resides", "Pay the filing fee", "Serve defendant and return to track your case"],
  },
  {
    state: "Kansas", abbr: "KS", limit: "$4,000", filingFee: "$35 - $75", notes: "",
    filingUrl: "https://www.kscourts.org/Resources/Self-Help-Center/Civil-Cases/Small-Claims",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the proper county", "Pay the filing fee", "Track your hearing date and prepare with the dashboard"],
  },
  {
    state: "Kentucky", abbr: "KY", limit: "$2,500", filingFee: "$30 - $50", notes: "",
    filingUrl: "https://courts.ky.gov/Forms/Pages/default.aspx",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the county where the defendant resides", "Pay the filing fee", "Return to dashboard to track service and hearing prep"],
  },
  {
    state: "Louisiana", abbr: "LA", limit: "$5,000", filingFee: "$50 - $150", notes: "City Court handles small claims",
    filingUrl: "https://www.lasc.org/",
    filingSteps: ["Download your completed filing packet", "File at the city or parish court with jurisdiction", "Pay the filing fee", "Serve defendant and return to prepare for your hearing"],
  },
  {
    state: "Maine", abbr: "ME", limit: "$6,000", filingFee: "$50 - $75", notes: "",
    filingUrl: "https://www.courts.maine.gov/fees_forms/forms/index.shtml",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the proper county", "Pay the filing fee", "Track your hearing date in the dashboard"],
  },
  {
    state: "Maryland", abbr: "MD", limit: "$5,000", filingFee: "$15 - $34", notes: "Notice requirements vary by county",
    filingUrl: "https://mdcourts.gov/district/selfhelp/smallclaims",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the county where the defendant resides or the property is located", "Pay the filing fee", "Attend the mandatory hearing and return to track judgment"],
  },
  {
    state: "Massachusetts", abbr: "MA", limit: "$7,000", filingFee: "$40 - $75", notes: "Wrongful deposit withholding can triple damages",
    filingUrl: "https://www.mass.gov/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims Session at the proper District or Municipal Court", "Pay the filing fee", "Serve defendant and prepare your evidence with the dashboard"],
  },
  {
    state: "Michigan", abbr: "MI", limit: "$6,500", filingFee: "$30 - $70", notes: "",
    filingUrl: "https://courts.michigan.gov/self-help/center/guides/pages/small-claims.aspx",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the district where the defendant resides", "Pay the filing fee", "Track your hearing date and service status in the dashboard"],
  },
  {
    state: "Minnesota", abbr: "MN", limit: "$15,000", filingFee: "$55 - $75", notes: "",
    filingUrl: "https://www.mncourts.gov/Help-Topics/Conciliation-Court.aspx",
    filingSteps: ["Download your completed filing packet", "File at the Conciliation Court in the proper county", "Pay the filing fee", "Serve defendant and return to prepare for your hearing"],
  },
  {
    state: "Mississippi", abbr: "MS", limit: "$3,500", filingFee: "$30 - $75", notes: "",
    filingUrl: "https://courts.ms.gov/trialcourts/justicecourt/justicecourt.php",
    filingSteps: ["Download your completed filing packet", "File at the Justice Court in the proper county", "Pay the filing fee", "Attend your hearing and return to track judgment collection"],
  },
  {
    state: "Missouri", abbr: "MO", limit: "$5,000", filingFee: "$30 - $55", notes: "",
    filingUrl: "https://www.courts.mo.gov/page.jsp?id=376",
    filingSteps: ["Download your completed filing packet", "File at the Associate Circuit Court in the proper county", "Pay the filing fee", "Return to dashboard to prepare for your hearing"],
  },
  {
    state: "Montana", abbr: "MT", limit: "$7,000", filingFee: "$30 - $50", notes: "",
    filingUrl: "https://courts.mt.gov/",
    filingSteps: ["Download your completed filing packet", "File at the Justice Court or City Court with jurisdiction", "Pay the filing fee", "Track your hearing date and prepare your evidence"],
  },
  {
    state: "Nebraska", abbr: "NE", limit: "$3,600", filingFee: "$38 - $46", notes: "",
    filingUrl: "https://supremecourt.nebraska.gov/self-help/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the County Court in the proper county", "Pay the filing fee", "Serve defendant and return to track your hearing"],
  },
  {
    state: "Nevada", abbr: "NV", limit: "$10,000", filingFee: "$50 - $75", notes: "",
    filingUrl: "https://www.nevadajudiciary.us/index.php/selfhelp",
    filingSteps: ["Download your completed filing packet", "File at the Justice Court in the proper township", "Pay the filing fee", "Return to dashboard to prepare for the hearing"],
  },
  {
    state: "New Hampshire", abbr: "NH", limit: "$10,000", filingFee: "$75 - $125", notes: "",
    filingUrl: "https://www.courts.nh.gov/representing-yourself/types-cases/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the Circuit Court — District Division in the proper county", "Pay the filing fee", "Track your hearing date in the dashboard"],
  },
  {
    state: "New Jersey", abbr: "NJ", limit: "$5,000", filingFee: "$35 - $50", notes: "Special Civil Part handles up to $15k",
    filingUrl: "https://www.njcourts.gov/self-help/small-claims-court",
    filingSteps: ["Download your completed filing packet", "File at the Special Civil Part of Superior Court in the proper county", "Pay the filing fee", "Serve defendant and return to track service and hearing prep"],
  },
  {
    state: "New Mexico", abbr: "NM", limit: "$10,000", filingFee: "$30 - $65", notes: "",
    filingUrl: "https://nmcourts.gov/self-help-center/",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate Court or Bernalillo Metropolitan Court in the proper county", "Pay the filing fee", "Return to dashboard to prepare your case"],
  },
  {
    state: "New York", abbr: "NY", limit: "$10,000", filingFee: "$15 - $20", notes: "$10k in NYC; $5k in town/village courts",
    filingUrl: "https://www.nycourts.gov/courthelp/SmallClaims/index.shtml",
    filingSteps: ["Download your completed filing packet", "Verify tenant's current address before filing", "File in the proper county — NYC, City, Town, or Village court", "Pay the filing fee", "Return to dashboard for service tracking"],
  },
  {
    state: "North Carolina", abbr: "NC", limit: "$10,000", filingFee: "$96", notes: "Magistrate Court",
    filingUrl: "https://www.nccourts.gov/help-topics/lawsuits-and-claims/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate's Office in the county where the defendant resides", "Pay the $96 filing fee", "Serve defendant and return to prepare for your hearing"],
  },
  {
    state: "North Dakota", abbr: "ND", limit: "$15,000", filingFee: "$30 - $75", notes: "",
    filingUrl: "https://www.ndcourts.gov/legal-self-help/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the proper county", "Pay the filing fee", "Return to dashboard to track service and hearing"],
  },
  {
    state: "Ohio", abbr: "OH", limit: "$6,000", filingFee: "$30 - $100", notes: "",
    filingUrl: "https://www.ohiobar.org/public-resources/commonly-asked-law-questions-results/courts/small-claims-court-what-you-need-to-know/",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims Division of the Municipal or County Court", "Pay the filing fee based on claim amount", "Return to dashboard for service tracking and hearing prep"],
  },
  {
    state: "Oklahoma", abbr: "OK", limit: "$10,000", filingFee: "$55 - $85", notes: "",
    filingUrl: "https://www.oscn.net/",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims Division of the District Court in the proper county", "Pay the filing fee", "Track your hearing date and prepare your evidence"],
  },
  {
    state: "Oregon", abbr: "OR", limit: "$10,000", filingFee: "$52 - $95", notes: "Many cities have just-cause eviction ordinances",
    filingUrl: "https://www.courts.oregon.gov/forms/Pages/small-claims.aspx",
    filingSteps: ["Download your completed filing packet", "File at the Circuit Court Small Claims Department in the proper county", "Pay the filing fee", "Serve defendant and return to prepare for your hearing"],
  },
  {
    state: "Pennsylvania", abbr: "PA", limit: "$12,000", filingFee: "Varies by county", notes: "Handled by Magisterial District Judges",
    filingUrl: "https://www.pacourts.us/learn/representing-yourself/small-claims-court",
    filingSteps: ["Download your completed filing packet", "Identify the correct Magisterial District Judge office", "File your complaint and pay the county filing fee", "Return to dashboard for service and hearing preparation"],
  },
  {
    state: "Rhode Island", abbr: "RI", limit: "$2,500", filingFee: "$65 - $80", notes: "",
    filingUrl: "https://www.courts.ri.gov/Courts/districtcourt/Pages/smallclaims.aspx",
    filingSteps: ["Download your completed filing packet", "File at the District Court in the proper division", "Pay the filing fee", "Return to dashboard to track your case"],
  },
  {
    state: "South Carolina", abbr: "SC", limit: "$7,500", filingFee: "$35 - $80", notes: "Magistrate's Court",
    filingUrl: "https://www.sccourts.org/selfHelp/",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate's Court in the proper county", "Pay the filing fee", "Serve defendant and return to prepare for your hearing"],
  },
  {
    state: "South Dakota", abbr: "SD", limit: "$12,000", filingFee: "$20 - $60", notes: "",
    filingUrl: "https://ujs.sd.gov/Small_Claims/",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate Court in the proper county", "Pay the filing fee", "Return to dashboard to track service and hearing date"],
  },
  {
    state: "Tennessee", abbr: "TN", limit: "$25,000", filingFee: "$60 - $100", notes: "Highest limit for a landlord-friendly state",
    filingUrl: "https://www.tncourts.gov/programs-services/self-help",
    filingSteps: ["Download your completed filing packet", "File at the General Sessions Court in the proper county", "Pay the filing fee", "Serve defendant and return to track your hearing"],
  },
  {
    state: "Texas", abbr: "TX", limit: "$20,000", filingFee: "$34 - $54", notes: "Highest limit in the country",
    filingUrl: "https://tjctc.org/SRL/small-claims.html",
    filingSteps: ["Download your completed filing packet", "File at the Justice Court (JP Court) in the precinct where the tenant resides", "Pay the filing fee", "Return to dashboard for service tracking and judgment steps"],
  },
  {
    state: "Utah", abbr: "UT", limit: "$11,000", filingFee: "$60 - $75", notes: "",
    filingUrl: "https://www.utcourts.gov/smallclaims/",
    filingSteps: ["Download your completed filing packet", "File at the Justice Court or District Court in the proper county", "Pay the filing fee", "Return to dashboard to prepare for your hearing"],
  },
  {
    state: "Vermont", abbr: "VT", limit: "$5,000", filingFee: "$85 - $265", notes: "",
    filingUrl: "https://www.vermontjudiciary.org/civil/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims Court in the Superior Court in the proper county", "Pay the filing fee", "Serve defendant and return to track your case"],
  },
  {
    state: "Virginia", abbr: "VA", limit: "$5,000", filingFee: "$30 - $75", notes: "",
    filingUrl: "https://www.vacourts.gov/courts/gd/home.html",
    filingSteps: ["Download your completed filing packet", "File at the General District Court in the city or county where the defendant resides", "Pay the filing fee", "Return to dashboard for service tracking and hearing prep"],
  },
  {
    state: "Washington", abbr: "WA", limit: "$10,000", filingFee: "$14 - $53", notes: "14-Day Pay or Vacate notice required",
    filingUrl: "https://www.courts.wa.gov/court_dir/?fa=court_dir.smallclaims",
    filingSteps: ["Download your completed filing packet", "File at the District Court or Municipal Court in the proper county", "Pay the filing fee based on claim amount", "Return to dashboard to track service and hearing preparation"],
  },
  {
    state: "West Virginia", abbr: "WV", limit: "$10,000", filingFee: "$35 - $75", notes: "",
    filingUrl: "https://www.courtswv.gov/public-resources/civil/small-claims.html",
    filingSteps: ["Download your completed filing packet", "File at the Magistrate Court in the proper county", "Pay the filing fee", "Serve defendant and return to track your case"],
  },
  {
    state: "Wisconsin", abbr: "WI", limit: "$10,000", filingFee: "$80 - $100", notes: "",
    filingUrl: "https://www.wicourts.gov/publications/guides/smallclaims.htm",
    filingSteps: ["Download your completed filing packet", "File at the Circuit Court in the proper county", "Pay the filing fee", "Return to dashboard to prepare for your hearing and track service"],
  },
  {
    state: "Wyoming", abbr: "WY", limit: "$6,000", filingFee: "$14 - $70", notes: "",
    filingUrl: "https://www.courts.state.wy.us/self-help/",
    filingSteps: ["Download your completed filing packet", "File at the Circuit Court in the proper county", "Pay the filing fee", "Return to dashboard to track your hearing date and prepare"],
  },
  {
    state: "Washington D.C.", abbr: "DC", limit: "$10,000", filingFee: "$5 - $45", notes: "Strong tenant protections — verify current law",
    filingUrl: "https://www.dccourts.gov/services/civil-matters/small-claims",
    filingSteps: ["Download your completed filing packet", "File at the Small Claims and Conciliation Branch of D.C. Superior Court", "Pay the filing fee", "Return to dashboard for service tracking and hearing preparation"],
  },
];
