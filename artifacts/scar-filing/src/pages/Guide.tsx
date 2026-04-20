import { Link } from "wouter";
import { ArrowRight, AlertCircle } from "lucide-react";

const sections = [
  {
    title: "What is SCAR?",
    content: `The Small Claims Assessment Review (SCAR) is a simplified judicial proceeding in New York State that allows property owners to challenge their tax assessment after a grievance has been denied by the Board of Assessment Review (BAR). It is governed by Article 7 of the Real Property Tax Law.

Unlike a formal Tax Certiorari proceeding, SCAR was specifically designed to be used without an attorney. A hearing officer — a licensed real estate professional appointed by the court — hears your case and makes a binding decision.`,
  },
  {
    title: "Eligibility requirements",
    content: `To file a SCAR petition, all of the following must be true:

• Your property is a one, two, or three-family residence used primarily for residential purposes.
• You filed a timely grievance with the Board of Assessment Review (BAR) or Assessment Review Commission.
• The BAR denied your grievance or reduced it by less than you requested.
• You are filing within 30 days of the final date the BAR was required to mail its determination.
• The property is located in New York State.

Note: Owners of commercial or rental property with more than 3 units are not eligible for SCAR but may file a formal Tax Certiorari proceeding.`,
  },
  {
    title: "The 30-day deadline",
    content: `This is the most important date in the entire process. The SCAR petition must be filed within 30 days of the date the Board of Assessment Review was required to mail its final determination (not the date you received it).

This deadline is strict and courts typically will not accept late filings. Mark the date you received your BAR denial and count forward 30 days immediately. Do not wait.`,
  },
  {
    title: "What to bring to your hearing",
    content: `The hearing is informal but you should come prepared. Bring:

• Your completed SCAR petition (the court will give you a hearing date after filing)
• Photos of your property — exterior and interior showing any condition issues
• Your most recent tax bill and assessment notice
• Sales data for 3-5 comparable properties that sold near your home in the past 1-2 years
• Any appraisal or inspection reports you have
• Documentation of any condition issues (water damage, structural problems, etc.)
• Your BAR denial letter

You do not need a lawyer. The hearing officer will ask questions and guide the proceeding.`,
  },
  {
    title: "What are comparable sales?",
    content: `Your strongest argument is usually comparable sales — recent sales of homes similar to yours at prices lower than your assessed value would imply.

A good comparable has:
• Similar square footage (within 15-20%)
• Similar style (ranch, colonial, split-level, etc.)
• Similar lot size and age
• In the same neighborhood or nearby
• Sold within the past 1-2 years

If comparables sold for less than your assessed value × equalization rate, you have a strong case. The hearing officer looks at price per square foot.`,
  },
  {
    title: "How the hearing works",
    content: `After you file, the court will schedule a hearing, typically 3-6 months later. The hearing is informal:

1. You and a representative from the assessor's office both present your cases.
2. The hearing officer may ask questions of both parties.
3. There is no jury. The hearing officer makes the decision.
4. The decision is mailed to you, usually 2-4 weeks after the hearing.
5. If your petition is granted, your assessment is reduced and you'll receive a refund for any taxes already paid on the excess amount.

The hearing typically takes 20-30 minutes. Most homeowners who come prepared with good comparables are successful.`,
  },
  {
    title: "Fees",
    content: `The court filing fee is $30. There are no other required fees.

You do not need to hire an attorney, appraiser, or tax consultant to file SCAR. That said, if your case is complex or your assessment is very high, you may choose to hire a professional — but for most residential cases, the DIY approach works well.`,
  },
];

export function Guide() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">How SCAR Works</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A plain-English guide to the Small Claims Assessment Review process in New York State.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 mb-10">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          This guide is for general informational purposes only and is not legal advice. For complex situations, consult with a licensed attorney or property tax professional.
        </p>
      </div>

      <div className="space-y-10">
        {sections.map((section, i) => (
          <div key={i} className="border-b border-border pb-10 last:border-0">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{section.title}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">{section.content}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-2">Ready to file?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Our step-by-step wizard will help you prepare your SCAR petition in about 15 minutes.
        </p>
        <Link
          href="/file"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          Start Filing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
