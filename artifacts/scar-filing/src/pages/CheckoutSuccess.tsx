import { Link } from "wouter";
import { CheckCircle, ArrowRight } from "lucide-react";

export function CheckoutSuccess() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-3">Payment successful</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Your payment has been processed. You can now download your completed SCAR petition document and file it with the court.
      </p>
      <Link
        href="/cases"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
      >
        Go to My Cases
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
