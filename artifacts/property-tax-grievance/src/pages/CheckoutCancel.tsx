import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function CheckoutCancel() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Payment cancelled
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          No charge was made. You can return to pricing whenever you're ready — your case data is saved.
        </p>
        <Link href="/pricing">
          <Button size="lg" variant="outline" className="gap-2 font-semibold mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Pricing
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
}
