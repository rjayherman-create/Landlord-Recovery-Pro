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
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">1. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              TaxAppeal DIY is a document preparation and data assistance platform that helps property owners organize
              information and prepare forms related to property tax appeals. We do not provide legal advice,
              legal representation, or attorney services of any kind.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">2. Not Legal Advice</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nothing on this platform constitutes legal advice. TaxAppeal DIY is not a law firm and cannot
              represent you before any board, tribunal, or government body. The forms, data, and guidance
              provided are for informational and document preparation purposes only.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you require legal advice or representation, you should consult a licensed attorney in your
              jurisdiction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">3. No Guarantee of Outcome</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not guarantee any specific result from filing a property tax appeal. Appeal outcomes depend
              on local assessment practices, board decisions, evidence presented, market conditions, and many
              other factors outside our control. Use of this service does not guarantee a reduction in your
              property tax assessment or tax bill.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">4. User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Reviewing all documents before submission</li>
              <li>Verifying the accuracy of all property information entered</li>
              <li>Meeting your local filing deadlines</li>
              <li>Submitting your appeal to the correct authority</li>
              <li>Complying with all applicable local rules and requirements</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">5. Payment and Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Payment of $99 grants you a one-time license to generate and download your appeal documents for
              one property case. This is a one-time charge — there are no subscriptions or recurring fees.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you purchase the service but do not file your appeal, contact us at support@taxappealdiy.com
              within 30 days of purchase and we will issue a refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">6. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The information you enter is used solely to prepare your appeal documents. We do not sell your
              personal information to third parties. Property lookup data is sourced from publicly available
              government databases (NYC Open Data, NYS Assessment Roll, etc.).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              See our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> for full details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, TaxAppeal DIY shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of this service. Our total
              liability to you shall not exceed the amount you paid for the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. Continued use of the service after changes
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:support@taxappealdiy.com" className="text-primary underline">
                support@taxappealdiy.com
              </a>.
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
