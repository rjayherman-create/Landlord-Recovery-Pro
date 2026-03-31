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
        <p className="text-muted-foreground text-sm mb-8">Last Updated: March 2026</p>

        <div className="space-y-7 text-foreground">

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">We may collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Name, email, and contact information</li>
              <li>Property address and related details</li>
              <li>Usage data</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use this data to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Generate property tax appeal documents</li>
              <li>Improve our services</li>
              <li>Communicate with users</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may use third-party services (e.g., payment
              processors, APIs) to operate the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable safeguards to protect your information, but no system is 100% secure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">User Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may request deletion of your data by contacting us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif font-bold text-xl">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a href="mailto:support@taxappealdiy.com" className="text-primary underline">
                support@taxappealdiy.com
              </a>
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
