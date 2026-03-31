import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, FileText, BarChart2, MapPin } from "lucide-react";
import { Link } from "wouter";

export function CheckoutSuccess() {
  const hasPending = (() => {
    try { return !!localStorage.getItem("pendingCase"); } catch { return false; }
  })();

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Payment successful!
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {hasPending
            ? "Your account is now unlocked and your form data has been saved. Click below to pick up right where you left off."
            : "Your account is now unlocked. Head to the Dashboard to create your appeal case — forms, comps report, and county instructions are all ready."
          }
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2.5">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">What's unlocked</p>
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <FileText className="w-4 h-4 shrink-0" />
            Pre-filled state appeal form (RP-524 / A-1 / Notice of Protest / DR-486)
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <BarChart2 className="w-4 h-4 shrink-0" />
            Printable comparable sales report
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <MapPin className="w-4 h-4 shrink-0" />
            Step-by-step county filing instructions &amp; portal link
          </div>
        </div>

        <Link href="/">
          <Button size="lg" className="gap-2 font-semibold mt-4 bg-emerald-600 hover:bg-emerald-700">
            {hasPending ? "Continue My Appeal" : "Go to Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">A receipt has been sent to your email by Stripe.</p>
      </div>
    </AppLayout>
  );
}
