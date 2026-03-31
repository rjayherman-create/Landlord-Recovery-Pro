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
        <p className="text-muted-foreground text-sm mb-8">Last Updated: March 2026</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <p className="text-amber-800 font-semibold text-sm">Important Notice</p>
          <p className="text-amber-700 text-sm leading-relaxed mt-1">
            TaxAppeal DIY is not a law firm and does not provide legal advice.
            All information and documents generated are for informational and self-service purposes only.
          </p>
        </div>

        <div className="space-y-7 text-foreground">

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Not Legal Advice</h2>
            <p className="text-muted-foreground leading-relaxed">
              TaxAppeal DIY is not a law firm and does not provide legal advice. All information and
              documents generated are for informational and self-service purposes only.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">No Guarantee of Outcome</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not guarantee any specific results, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Approval of a property tax appeal</li>
              <li>Reduction in assessed value</li>
              <li>Financial savings</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Outcomes depend on local tax authorities and factors beyond our control.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Data Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Property data, estimates, comparable sales, and valuations are derived from third-party
              sources and public data. We do not guarantee the accuracy, completeness, or timeliness
              of this information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">Users are solely responsible for:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Reviewing all generated documents</li>
              <li>Verifying accuracy</li>
              <li>Filing appeals correctly and on time</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">No Professional Relationship</h2>
            <p className="text-muted-foreground leading-relaxed">
              Use of this platform does not create any professional, legal, or advisory relationship.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under no circumstances shall TaxAppeal DIY be liable for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Denied appeals</li>
              <li>Financial losses</li>
              <li>Errors in filings</li>
              <li>Decisions made by tax authorities</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Use of this service is at your own risk.
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
