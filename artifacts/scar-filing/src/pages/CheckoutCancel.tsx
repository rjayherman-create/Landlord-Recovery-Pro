import { Link } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";

export function CheckoutCancel() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-3">Payment cancelled</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Your payment was not completed. No charges were made. You can go back and try again anytime.
      </p>
      <Link
        href="/cases"
        className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-6 py-3 rounded-md hover:bg-secondary/50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Cases
      </Link>
    </div>
  );
}
