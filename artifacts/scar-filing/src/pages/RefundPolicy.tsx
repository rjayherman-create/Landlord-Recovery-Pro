import { ReceiptText } from "lucide-react";

export function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
          <ReceiptText className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Refund Policy</h1>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-5 text-sm text-muted-foreground leading-relaxed">
        <p>
          Due to the digital nature of this service, all purchases are final once documents have been generated
          or accessed.
        </p>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">When Refunds May Be Considered</h2>
          <p>
            Refunds may be considered only in cases of verified technical failure where the service was not
            delivered as intended — for example, if payment was charged but no document was generated and no
            download link was provided.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Refunds Are Not Provided For</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Case outcomes or court decisions</li>
            <li>Court rejection of filed documents</li>
            <li>User errors or incorrect information provided during the filing process</li>
            <li>Change of mind after document generation or download</li>
            <li>Dissatisfaction with AI-generated content</li>
            <li>Filing fee amounts charged by the court</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How to Request Support</h2>
          <p>
            If you believe you experienced a technical failure or were charged in error, please contact us at{" "}
            <a href="mailto:support@smallclaimsai.com" className="underline hover:text-foreground transition-colors">
              support@smallclaimsai.com
            </a>{" "}
            with your case ID and a description of the issue. We will review all requests promptly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Payment Processing</h2>
          <p>
            Payments are processed securely through Stripe. We do not store your payment card information.
            Refunds, if approved, will be returned to the original payment method within 5–10 business days.
          </p>
        </section>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Last updated: April 2026 &nbsp;·&nbsp; SmallClaims AI
      </p>
    </div>
  );
}
