import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WhyDIYSection } from "@/components/WhyDIYSection";
import {
  CheckCircle2, FileSearch, Scale, Building, TrendingDown,
  AlertTriangle, Info, Star, ChevronDown, ChevronUp, Home,
  BarChart2, Gavel, FileText, HelpCircle, Lightbulb, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */

type StateKey = "NY" | "NJ" | "TX" | "FL";

interface ComplaintOption {
  id: string;
  label: string;
  badge: "Most common" | "Common" | "Rare" | "Situational";
  badgeColor: string;
  whenToUse: string;
  howToProve: string;
  tip: string;
  canCombine?: boolean;
}

interface StateComplaintGuide {
  state: StateKey;
  flag: string;
  name: string;
  formName: string;
  bodyName: string;
  intro: string;
  topPick: string;
  complaints: ComplaintOption[];
  steps: { step: string; detail: string }[];
}

/* ─── Complaint guide data ───────────────────────────────────── */

const GUIDES: StateComplaintGuide[] = [
  {
    state: "NY",
    flag: "🗽",
    name: "New York",
    formName: "RP-524",
    bodyName: "Board of Assessment Review (BAR)",
    intro: "New York's RP-524 form lists four official grounds for complaint. Most homeowners use Overvaluation alone, or combine it with Unequal Assessment for a stronger case.",
    topPick: "overvaluation",
    complaints: [
      {
        id: "overvaluation",
        label: "Overvaluation",
        badge: "Most common",
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        whenToUse: "Your home's true market value — what it would realistically sell for today — is lower than what the assessment implies. In NY, the assessor multiplies your estimated market value by an equalization rate to get your assessed value. If the market value estimate is too high, your taxes are too high.",
        howToProve: "Find 3–6 comparable sales (homes similar to yours in size, style, age, and condition) that sold within the past 12 months for less than your town's estimated market value. The more similar the comps, the stronger the case. Attach them to your RP-524.",
        tip: "This is the right choice if you believe your home would sell for less than the 'Estimated Market Value' shown on your assessment notice. Most successful grievances are won on overvaluation alone.",
        canCombine: true,
      },
      {
        id: "unequal",
        label: "Unequal Assessment",
        badge: "Common",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
        whenToUse: "Your property is assessed at a higher percentage of its market value than comparable properties in your municipality. Even if the assessor's estimate of your market value is correct, you may be paying more than your fair share if neighbors with similar homes are assessed at a lower ratio.",
        howToProve: "Compare your assessment ratio (assessed value ÷ estimated market value) to your neighbors' ratios. Use public assessment rolls (available on your town or county website) to pull assessed values for similar nearby properties, then look up their sale prices to calculate their ratios. If yours is higher, you have an unequal assessment claim.",
        tip: "This is a great secondary ground to add alongside overvaluation. Even if the board doesn't accept your market-value argument, they may reduce your assessment to match your neighbors' ratios.",
        canCombine: true,
      },
      {
        id: "excessive",
        label: "Excessive Assessment",
        badge: "Rare",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
        whenToUse: "Your assessment exceeds a specific statutory or constitutional limit — for example, the assessment is greater than the full value of the property, or a special district charge is improperly applied. This is a technical legal argument.",
        howToProve: "You need documentation showing the assessment violates a specific statute or cap. This usually requires a tax attorney or consultant.",
        tip: "Skip this for most residential cases. If your assessor has simply valued your home too high, use Overvaluation instead.",
      },
      {
        id: "unlawful",
        label: "Unlawful Assessment",
        badge: "Situational",
        badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
        whenToUse: "Your property is legally exempt from taxation (religious use, nonprofit, government-owned, etc.) but was assessed anyway. Or the assessment was made without proper legal authority.",
        howToProve: "Provide documentation of the exemption status — deed, nonprofit certificate, etc.",
        tip: "This does not apply to most homeowners. Only use this if you believe your property should be fully exempt from taxation.",
      },
    ],
    steps: [
      { step: "Check your assessment notice", detail: "Look for the 'Estimated Market Value' on your tentative assessment notice. Compare it to recent sale prices in your neighborhood." },
      { step: "Choose your grounds", detail: "Select Overvaluation if the market value estimate is too high. Add Unequal Assessment if your ratio is higher than your neighbors'." },
      { step: "Gather comparable sales", detail: "Find 3–6 similar homes that sold within the past 12 months for less than your assessed market value. Print the MLS or public record pages." },
      { step: "Complete Form RP-524", detail: "Fill in your property info, choose your grounds, enter your requested assessment, and attach your comps." },
      { step: "File by Grievance Day", detail: "Submit in person, by mail, or online (Nassau uses AROW). Note: Filing cannot increase your taxes." },
    ],
  },
  {
    state: "NJ",
    flag: "🔵",
    name: "New Jersey",
    formName: "Form A-1",
    bodyName: "County Board of Taxation",
    intro: "New Jersey appeals use Form A-1 and focus on whether your assessed value exceeds your property's true market value after applying your municipality's Chapter 123 equalization ratio. Overassessment is the ground almost every homeowner uses.",
    topPick: "overvaluation",
    complaints: [
      {
        id: "overvaluation",
        label: "Overassessment",
        badge: "Most common",
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        whenToUse: "Your property's assessed value is higher than its true market value multiplied by your municipality's Chapter 123 equalization ratio. In NJ, assessments are supposed to reflect a percentage of market value (the equalization ratio) — if your assessment is too high relative to that ratio, you are overassessed.",
        howToProve: "Calculate: True Market Value = Assessed Value ÷ Equalization Ratio. If the result exceeds what comparables suggest your home is worth, you have a case. Provide 3–6 comparable sales from within the past 12–24 months. The County Board uses the Chapter 123 standard: if your assessment is 15%+ above the common level, they must reduce it.",
        tip: "Find your municipality's Chapter 123 equalization ratio on the NJ Division of Taxation website. This is the key number. If your assessed value ÷ ratio is higher than your home's true market value, file.",
        canCombine: true,
      },
      {
        id: "unequal",
        label: "Unequal Assessment",
        badge: "Common",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
        whenToUse: "Your property is assessed at a higher ratio to market value than comparable properties in your municipality — even if the assessment is not inherently excessive.",
        howToProve: "Pull the assessed values of 3–5 similar properties from the municipal tax records. Research their market values (recent sales or appraisals). Calculate each one's assessment ratio and compare to yours.",
        tip: "Combine with Overassessment for the strongest case. If you can show both that your market value estimate is too high AND your neighbors get better ratios, you have two independent paths to a reduction.",
        canCombine: true,
      },
      {
        id: "unlawful",
        label: "Illegal Assessment",
        badge: "Situational",
        badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
        whenToUse: "Your property is tax-exempt (religious, educational, charitable use) but was assessed nonetheless.",
        howToProve: "Documentation of exempt status (IRS letter, deed restrictions, etc.).",
        tip: "Only applicable if the property should be fully exempt from taxation.",
      },
      {
        id: "excessive",
        label: "Excessive Assessment",
        badge: "Rare",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
        whenToUse: "The assessment exceeds a statutory cap or constitutional limitation.",
        howToProve: "Requires specific legal documentation and typically an attorney.",
        tip: "Not applicable for typical residential overvaluation cases.",
      },
    ],
    steps: [
      { step: "Find your equalization ratio", detail: "Look up your municipality's Chapter 123 ratio on the NJ Division of Taxation site. This tells you what percentage of market value assessments should reflect." },
      { step: "Calculate your implied market value", detail: "Divide your assessed value by the equalization ratio. If that number is higher than what your home would sell for, you have a case." },
      { step: "Gather comparable sales", detail: "Find 3–6 comparable sales from the past 12–24 months showing your home's true market value is lower." },
      { step: "Complete Form A-1", detail: "Fill in your property details, select Overassessment (and Unequal Assessment if applicable), and attach your comps." },
      { step: "File by April 1", detail: "Mail or hand-deliver to your County Board of Taxation. For properties assessed at $1M+, you may instead file Form A-3 directly with the NJ Tax Court." },
    ],
  },
  {
    state: "TX",
    flag: "⭐",
    name: "Texas",
    formName: "Notice of Protest (Form 50-132)",
    bodyName: "Appraisal Review Board (ARB)",
    intro: "Texas law allows you to protest on multiple grounds simultaneously, and you should. Most homeowners check both 'Incorrect Appraised Value' and 'Unequal Appraisal' — these are independent paths to a reduction, and the ARB must consider both.",
    topPick: "market_value",
    complaints: [
      {
        id: "market_value",
        label: "Incorrect Appraised Value",
        badge: "Most common",
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        whenToUse: "The County Appraisal District (CAD) has set your appraised value higher than what your property would actually sell for on the open market. This is the most straightforward protest ground — you simply believe your home is worth less than what the CAD says.",
        howToProve: "Provide 3–6 comparable sales (similar homes, same neighborhood or area, sold within 12 months) showing your home's true market value is lower than the CAD's number. Your evidence must demonstrate what the property would sell for between a willing buyer and willing seller.",
        tip: "Always check this box. Even if your comps aren't perfect, the ARB must consider your evidence. The CAD has the burden to support its value — you just need to raise reasonable doubt.",
        canCombine: true,
      },
      {
        id: "unequal",
        label: "Unequal Appraisal",
        badge: "Common",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
        whenToUse: "Your property is appraised higher than comparable properties in your neighborhood, regardless of what the actual market value is. Texas law specifically requires the CAD to appraise properties equally and uniformly. If similar homes nearby are appraised lower, you are entitled to the same treatment.",
        howToProve: "Pull the CAD's own appraised values for 5–10 similar nearby properties (same neighborhood, similar size and age). Calculate the median appraised value per square foot. If your per-square-foot value exceeds the median, you have a strong unequal appraisal claim — even if the market value argument doesn't work.",
        tip: "This is often the stronger argument in Texas. CAD data is public — search iFile or your county's appraisal portal to pull neighbor appraisals. Many ARBs reduce values on unequal appraisal alone.",
        canCombine: true,
      },
      {
        id: "not_taxable",
        label: "Property Not Subject to Taxation",
        badge: "Situational",
        badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
        whenToUse: "Your property is exempt from taxation — religious, charitable, disabled veteran, or another qualifying exemption — but was still placed on the appraisal roll.",
        howToProve: "Documentation of the exemption (VA letter, nonprofit certificate, deed, etc.).",
        tip: "Also check if you qualify for a homestead exemption — that reduces your taxable value and is applied separately from a protest.",
      },
      {
        id: "ownership",
        label: "Incorrect Ownership / Address",
        badge: "Rare",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
        whenToUse: "The CAD has the wrong owner name, wrong property address, or wrong legal description on the appraisal record.",
        howToProve: "Your deed, closing documents, or county records showing the correct information.",
        tip: "Fix data errors first — they can affect your ability to receive notices and contest values.",
      },
      {
        id: "ag_exemption",
        label: "Ag Exemption Denial",
        badge: "Situational",
        badgeColor: "bg-lime-100 text-lime-700 border-lime-200",
        whenToUse: "Your land qualifies for agricultural, wildlife management, or timber appraisal but the CAD denied the application or removed the special valuation.",
        howToProve: "Records of agricultural activity, leases, income from farming, or wildlife management plan.",
        tip: "Ag appraisal can dramatically reduce your taxable value — the land is appraised based on its agricultural productivity, not its market value. Very worthwhile to protest if denied.",
      },
    ],
    steps: [
      { step: "Check your Notice of Appraised Value", detail: "The CAD mails this in spring. Compare the appraised value to recent comparable sale prices in your neighborhood." },
      { step: "Choose your grounds — check both market value AND unequal", detail: "You can and should protest on multiple grounds. Checking both gives you two independent paths to a reduction." },
      { step: "Pull CAD comparables for unequal appraisal", detail: "Go to your CAD's website (e.g., HCAD, DCAD, BCAD) and search nearby similar properties. Export their appraised values and calculate price per square foot." },
      { step: "Gather recent comparable sales", detail: "Find 3–6 homes similar to yours that sold within the past 12 months at a price below the CAD's value. MLS data, Zillow sold, or TCAD/HCAD sales search all work." },
      { step: "File before May 15", detail: "File your Notice of Protest online via your CAD's iFile portal, by mail, or in person. You'll receive an ARB hearing date." },
    ],
  },
  {
    state: "FL",
    flag: "🌴",
    name: "Florida",
    formName: "Form DR-486",
    bodyName: "Value Adjustment Board (VAB)",
    intro: "Florida's DR-486 petition is heard by an independent special magistrate. Most homeowners petition on Overvaluation of Just Value, with Unequal Assessment as a secondary ground. Florida also has unique grounds related to exemptions and the Save Our Homes cap.",
    topPick: "overvaluation",
    complaints: [
      {
        id: "overvaluation",
        label: "Overvaluation of Just Value",
        badge: "Most common",
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        whenToUse: "Your property's 'Just Value' (Florida's term for market value) as set by the county Property Appraiser is higher than what your home would actually sell for. Just Value is supposed to reflect 100% of market value — if the appraiser's estimate is too high, your petition is based on overvaluation.",
        howToProve: "Provide 3–6 comparable sales of similar properties in your area that sold within the past 12 months at prices below your assessed Just Value. The special magistrate will weigh your evidence against the Property Appraiser's. Focus on homes with similar size, age, condition, and location.",
        tip: "Florida law (F.S. 194.301) places the burden on the Property Appraiser to prove the value is correct. If you provide credible comparable sales evidence, the burden shifts — and many petitions are settled informally before the hearing.",
        canCombine: true,
      },
      {
        id: "unequal",
        label: "Unequal Assessment",
        badge: "Common",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
        whenToUse: "Your property's Just Value is set higher — on a per-square-foot or ratio basis — than comparable properties in the same neighborhood, even if the value itself is not necessarily above market.",
        howToProve: "Look up the Just Values of similar nearby properties on your county Property Appraiser's website. Calculate value per square foot for each. If yours is materially higher than the median, you have an unequal assessment claim.",
        tip: "This is a strong secondary ground in Florida. The VAB special magistrate can reduce your value to match the median level of comparable properties.",
        canCombine: true,
      },
      {
        id: "exemption",
        label: "Exemption Denial",
        badge: "Situational",
        badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
        whenToUse: "You applied for a homestead exemption (or other exemption — widow/widower, disability, veteran) and were denied, or the exemption was removed.",
        howToProve: "Proof of primary residence (driver's license, voter registration, utility bills), and applicable documentation for the specific exemption (discharge papers for veteran exemption, etc.).",
        tip: "The homestead exemption saves $25,000 to $50,000 off your assessed value. If you were denied, filing a DR-486 to contest the denial is absolutely worth it.",
      },
      {
        id: "portability",
        label: "Portability / Save Our Homes Cap Error",
        badge: "Situational",
        badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
        whenToUse: "The Save Our Homes cap (which limits annual increases in assessed value to 3% for homesteaded properties) was not applied correctly, or your portability benefit from a previous homestead was incorrectly calculated or denied when you moved.",
        howToProve: "Your prior homestead assessment records, the portability application you submitted, and correspondence with the Property Appraiser's office.",
        tip: "Save Our Homes can result in your Assessed Value being significantly lower than your Just Value — this is normal and intentional. If you didn't get the cap applied, or your portability transfer was denied, this is the right ground to petition.",
      },
      {
        id: "classification",
        label: "Agricultural or Other Classification Denial",
        badge: "Situational",
        badgeColor: "bg-lime-100 text-lime-700 border-lime-200",
        whenToUse: "Your land qualifies for agricultural classification (which uses productivity value rather than market value) but the Property Appraiser denied or removed the classification.",
        howToProve: "Lease agreements, records of agricultural income, evidence of bona fide agricultural use.",
        tip: "Agricultural classification can dramatically reduce your taxable value. If denied, a DR-486 petition is well worth filing.",
      },
      {
        id: "unlawful",
        label: "Unlawful Assessment",
        badge: "Rare",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
        whenToUse: "Your property is legally exempt from taxation (religious, charitable, government) but was assessed anyway.",
        howToProve: "Proof of exempt status and IRS or state documentation.",
        tip: "Only applicable if the property should be fully exempt from all property taxes.",
      },
    ],
    steps: [
      { step: "Review your TRIM notice", detail: "The Property Appraiser mails TRIM (Truth in Millage) notices by August 24. Check your Just Value and confirm your exemptions are applied correctly." },
      { step: "Choose your grounds", detail: "Select Overvaluation if the Just Value is above market. Add Unequal Assessment if neighbors' values are lower per square foot. Add Exemption Denial if your homestead or other exemption is missing." },
      { step: "Request an informal conference (optional)", detail: "You may contact your Property Appraiser's office before filing to discuss your value informally. Many cases are resolved here without a formal hearing." },
      { step: "File Form DR-486", detail: "File with your County VAB clerk before September 18. Pay the $15 filing fee. You can file online (AXIA portal in many counties), in person, or by mail." },
      { step: "Attend your VAB hearing", detail: "A special magistrate (an independent real estate appraiser or attorney) will hear your case. Bring printed comparables, photos of your property, and any appraisal reports." },
    ],
  },
];

/* ─── Complaint Card ─────────────────────────────────────────── */

function ComplaintCard({ c, isTop }: { c: ComplaintOption; isTop: boolean }) {
  const [open, setOpen] = useState(isTop);
  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-200",
      isTop ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "border-border bg-card",
      open && "shadow-md"
    )}>
      <button
        className="w-full flex items-start gap-4 p-5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isTop ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
        )}>
          {isTop ? <Star className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif font-bold text-base text-foreground">{c.label}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", c.badgeColor)}>
              {c.badge}
            </span>
            {c.canCombine && (
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Can combine
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground mt-1">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> When to use this
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.whenToUse}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> How to prove it
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.howToProve}</p>
          </div>
          <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">{c.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step-by-step ───────────────────────────────────────────── */

function StepList({ steps }: { steps: { step: string; detail: string }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4 items-start">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{s.step}</p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

export function HowItWorks() {
  const [activeState, setActiveState] = useState<StateKey>("NY");
  const guide = GUIDES.find(g => g.state === activeState)!;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-20">

        {/* Page header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Designed for homeowners — no lawyer required
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            How to Appeal Your Property Taxes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tax grievance firms take up to 50% of your first year's savings — for a process most homeowners can complete in under two hours. Here's how to do it yourself.
          </p>
        </div>

        {/* Why DIY stats */}
        <WhyDIYSection />

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium px-2">Which complaint should you file?</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Complaint guide section ── */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
              Choosing the Right Grounds for Your Appeal
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every state uses different terminology, but the core idea is the same: you're telling the government
              your property was valued too high, or valued unequally compared to your neighbors. Here's exactly
              which box to check — and why.
            </p>
          </div>

          {/* State tabs */}
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {GUIDES.map(g => (
              <button
                key={g.state}
                onClick={() => setActiveState(g.state)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-semibold border transition-all",
                  activeState === g.state
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {g.flag} {g.name}
              </button>
            ))}
          </div>

          {/* Guide panel */}
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">

            {/* Header */}
            <div className="bg-secondary/40 border-b border-border px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-2xl text-foreground">
                    {guide.flag} {guide.name} — {guide.formName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Filed with: <strong>{guide.bodyName}</strong>
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-2.5 max-w-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{guide.intro}</p>
                </div>
              </div>
            </div>

            {/* Quick tip banner */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-3 flex items-center gap-3">
              <Star className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800">
                <strong>Quick pick:</strong> Start with the <span className="font-semibold">Most common</span> complaint below — it applies to the vast majority of homeowners. Expand any card to read the full guidance.
              </p>
            </div>

            {/* Complaint cards */}
            <div className="p-8 space-y-4">
              {guide.complaints.map(c => (
                <ComplaintCard key={c.id} c={c} isTop={c.id === guide.topPick} />
              ))}
            </div>

            {/* Can you combine? */}
            <div className="mx-8 mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-900 mb-1">Can you check more than one box?</p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Yes — for all four states, you can (and should) check multiple grounds when they apply.
                  The most powerful combination is <strong>overvaluation + unequal assessment</strong>. These
                  are independent legal arguments: the board must consider each one separately. Checking both
                  gives you two chances at a reduction even if one argument doesn't land.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium px-2">Step-by-step process</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Step-by-step for selected state */}
        <div>
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {GUIDES.map(g => (
              <button
                key={g.state}
                onClick={() => setActiveState(g.state)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-semibold border transition-all",
                  activeState === g.state
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {g.flag} {g.name}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
            <h3 className="font-serif font-bold text-2xl text-foreground mb-2">
              {guide.flag} {guide.name} — Filing Steps
            </h3>
            <p className="text-muted-foreground mb-8">
              Here's the exact sequence of steps to file your {guide.formName} appeal from start to finish.
            </p>
            <StepList steps={guide.steps} />
          </div>
        </div>

        {/* Warning callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Filing cannot raise your taxes</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              In all four states, filing an appeal or grievance cannot result in your assessment being increased.
              The worst outcome is that your appeal is denied and you stay at the current level. There is no risk
              to filing — only potential upside.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-primary text-primary-foreground p-10 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent rounded-full opacity-20 blur-3xl" />
          <h2 className="text-3xl font-serif font-bold mb-4 relative z-10">Ready to start your case?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto relative z-10">
            Use the free dashboard to track your property details, organize your comparables,
            and generate your pre-filled appeal form — ready to sign and submit.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-white relative z-10 font-bold px-8 shadow-lg shadow-black/20">
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

      </div>
    </AppLayout>
  );
}
