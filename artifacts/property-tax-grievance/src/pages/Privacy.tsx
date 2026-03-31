import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-serif font-bold text-3xl">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-foreground">

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you use TaxAppeal DIY, we collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li><strong>Account information:</strong> Name, email address, and authentication credentials</li>
              <li><strong>Property information:</strong> Address, assessment values, parcel ID, and other details you enter about your property</li>
              <li><strong>Payment information:</strong> Processed securely by Stripe — we do not store your payment card details</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and general analytics to improve the service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information you provide to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Prepare and generate your appeal documents</li>
              <li>Save your case data so you can return to it</li>
              <li>Process your payment through Stripe</li>
              <li>Respond to your support requests</li>
              <li>Improve the accuracy and functionality of our platform</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">3. Public Data Sources</h2>
            <p className="text-muted-foreground leading-relaxed">
              Property lookup data is retrieved from publicly available government databases, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>NYC Open Data — MapPLUTO (New York City properties)</li>
              <li>NYS Assessment Roll / ORPS (New York State properties)</li>
              <li>OpenStreetMap Nominatim (geocoding)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              This data is public record. We display it to help you understand your assessment, not to collect or redistribute it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share data with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>Infrastructure providers:</strong> For hosting and operating the platform</li>
              <li><strong>Law enforcement:</strong> When required by law</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your case data is retained for as long as your account is active, so you can return to it.
              You may request deletion of your data at any time by contacting us at{" "}
              <a href="mailto:support@taxappealdiy.com" className="text-primary underline">
                support@taxappealdiy.com
              </a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">6. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard security measures including HTTPS/TLS encryption for data transmission
              and secure database storage. Payment processing is handled entirely by Stripe, which is
              PCI-DSS compliant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use session cookies for authentication purposes. We do not use third-party tracking cookies
              or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about your privacy or data? Contact us at{" "}
              <a href="mailto:support@taxappealdiy.com" className="text-primary underline">
                support@taxappealdiy.com
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4">
          <Link href="/terms">
            <Button variant="outline" size="sm">View Terms of Service</Button>
          </Link>
          <Link href="/disclaimer">
            <Button variant="outline" size="sm">View Disclaimer</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
