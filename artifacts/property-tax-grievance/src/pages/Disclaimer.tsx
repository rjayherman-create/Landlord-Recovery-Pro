import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Disclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="font-serif font-bold text-3xl">Disclaimer</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <p className="text-amber-800 font-semibold text-sm mb-1">Important Notice</p>
          <p className="text-amber-700 text-sm leading-relaxed">
            TaxAppeal DIY is a document preparation tool, not a law firm. We are not licensed attorneys.
            Nothing on this platform constitutes legal advice.
          </p>
        </div>

        <div className="space-y-6 text-foreground">

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">Not a Law Firm</h2>
            <p className="text-muted-foreground leading-relaxed">
              TaxAppeal DIY is a technology platform — a document preparation tool and data-driven assistant.
              We are not a law firm, we do not employ attorneys on your behalf, and we do not provide legal
              representation before any assessment review board, tribunal, court, or government agency.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are:
            </p>
            <ul className="space-y-1 text-muted-foreground pl-2">
              <li className="flex items-center gap-2">✔ A document preparation tool</li>
              <li className="flex items-center gap-2">✔ A data-driven assistant</li>
              <li className="flex items-center gap-2">✔ A DIY platform for self-represented property owners</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We are not:
            </p>
            <ul className="space-y-1 text-muted-foreground pl-2">
              <li className="flex items-center gap-2 text-red-600">✗ A law firm or attorney</li>
              <li className="flex items-center gap-2 text-red-600">✗ A provider of legal advice</li>
              <li className="flex items-center gap-2 text-red-600">✗ A guarantor of appeal outcomes</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">No Guarantee of Success</h2>
            <p className="text-muted-foreground leading-relaxed">
              No guarantee of success is provided. The outcome of any property tax appeal depends on local
              assessment review board decisions, the evidence presented, applicable law, market conditions,
              and many other factors that are entirely outside our control.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Past reductions by other users do not guarantee a reduction for your property.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">Data Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Property data is retrieved from publicly available government sources (NYC Open Data / MapPLUTO,
              NYS Assessment Roll, OpenStreetMap). While we make every effort to present accurate data,
              we do not warrant the completeness or accuracy of any data displayed. You should verify all
              information against your official tax bill and assessment records.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using this service, you acknowledge that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>You are filing your appeal as a self-represented property owner</li>
              <li>You are responsible for reviewing all documents before submitting them</li>
              <li>You are responsible for meeting all applicable filing deadlines</li>
              <li>You should consult a licensed attorney if you need legal advice</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">Comparable Sales</h2>
            <p className="text-muted-foreground leading-relaxed">
              Comparable sales data displayed or included in generated reports is sourced from public
              databases and is provided for informational purposes. This data does not constitute a formal
              appraisal and should not be used as a substitute for a professional real estate appraisal.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4">
          <Link href="/terms">
            <Button variant="outline" size="sm">View Terms of Service</Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline" size="sm">View Privacy Policy</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
