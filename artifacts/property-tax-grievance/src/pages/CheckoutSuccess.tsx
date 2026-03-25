import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function CheckoutSuccess() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          You're all set!
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Your payment was successful. Head to the Dashboard to start building your case — your forms and comparable sales report are ready to go.
        </p>
        <Link href="/">
          <Button size="lg" className="gap-2 font-semibold mt-4">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
}
