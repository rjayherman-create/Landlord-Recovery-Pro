import { Link } from "wouter";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-primary" />
          <h1 className="font-serif font-bold text-3xl">Terms of Service</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">Last Updated: March 2026</p>

        <div className="space-y-7 text-foreground">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to TaxAppeal DIY. By accessing or using this service, you agree to the following terms.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">1. Nature of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              TaxAppeal DIY provides a software platform that assists users in preparing property tax appeal
              documents using user-provided information and publicly available data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are not a law firm and do not provide legal advice, legal representation, or professional services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">2. No Attorney-Client Relationship</h2>
            <p className="text-muted-foreground leading-relaxed">
              Use of this service does not create an attorney-client relationship. Nothing on this platform
              should be interpreted as legal advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">3. User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">You are responsible for:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Providing accurate and complete information</li>
              <li>Reviewing all generated documents before submission</li>
              <li>Submitting your appeal to the appropriate authority</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We are not responsible for errors resulting from incorrect or incomplete information provided by users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">4. No Guarantee of Results</h2>
            <p className="text-muted-foreground leading-relaxed">We do not guarantee:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Approval of any tax appeal</li>
              <li>Reduction in property taxes</li>
              <li>Accuracy of third-party data</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Results vary based on local jurisdictions, assessors, and market conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">5. Payments</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>All payments are one-time fees unless otherwise stated.</li>
              <li>By purchasing, you agree to the pricing displayed at checkout.</li>
              <li>Refunds are only provided in accordance with our stated refund policy.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, software, and materials provided through this service are owned by TaxAppeal DIY
              and may not be copied, redistributed, or resold.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, TaxAppeal DIY shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Any financial loss</li>
              <li>Missed filing deadlines</li>
              <li>Denied appeals</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms at any time. Continued use of the service constitutes acceptance
              of updated terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions, contact:{" "}
              <a href="mailto:support@taxappealdiy.com" className="text-primary underline">
                support@taxappealdiy.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4">
          <Link href="/disclaimer">
            <Button variant="outline" size="sm">View Disclaimer</Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline" size="sm">View Privacy Policy</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
