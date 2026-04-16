import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: 99.99,
    highlight: null,
    description: "Everything you need to file your own appeal — start to finish.",
    features: [
      "Pre-filled state form (RP-524, A-1, Notice of Protest, or DR-486)",
      "Printable comparable sales report",
      "Case confidence score & over-assessment analysis",
      "Step-by-step filing instructions for your county",
      "Deadline reminders for your state",
    ],
    cta: "Get Started",
    ctaVariant: "outline" as const,
  },
  {
    key: "guided",
    name: "Guided",
    price: 199,
    highlight: "Most Popular",
    description: "Everything in Basic, plus expert-level filing support.",
    features: [
      "Everything in Basic",
      "Detailed review checklist before you file",
      "County-specific filing portal walkthrough",
      "Priority email support (48-hour response)",
      "Tips to strengthen your comparable sales evidence",
    ],
    cta: "Get Guided Filing",
    ctaVariant: "default" as const,
  },
  {
    key: "concierge",
    name: "Concierge",
    price: 299,
    highlight: "Best Value",
    description: "We review your case personally before you submit.",
    features: [
      "Everything in Guided",
      "Expert review of your comparable sales selection",
      "Form review before filing — we flag any issues",
      "30-minute video call with a property tax specialist",
      "Strategy advice tailored to your county and board",
    ],
    cta: "Get Concierge Review",
    ctaVariant: "default" as const,
  },
];

const GUARANTEE = [
  { icon: ShieldCheck, text: "Filing cannot raise your taxes — guaranteed by law in all 4 states." },
  { icon: Zap, text: "Most cases completed in under 2 hours with our guided workflow." },
  { icon: Users, text: "~80% of DIY filers get a reduction across NY, NJ, TX & FL." },
];

export function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planKey: string) {
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/products");
      if (!res.ok) throw new Error("Could not load products");
      const { data } = await res.json() as { data: any[] };

      const product = data.find((p: any) =>
        p.metadata?.plan === planKey || p.name?.toLowerCase().includes(planKey)
      );

      if (!product || !product.prices?.[0]?.id) {
        alert("This plan is not yet available. Please check back soon.");
        return;
      }

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: product.prices[0].id }),
        credentials: "include",
      });

      if (!checkoutRes.ok) throw new Error("Checkout failed");
      const { url } = await checkoutRes.json() as { url: string };
      window.location.href = url;
    } catch (err: any) {
      alert(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-16">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            A lawyer charges $700–$1,200. We charge $99. You keep the rest.
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            One-Time Filing Fee.<br />Keep Every Dollar You Save.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tax appeal firms take 50% of your first year's savings as their commission — typically $700–$1,200 on a winning case. TaxAppeal DIY is a flat fee. Every dollar of your reduction is yours, this year and every year after.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const isPopular = plan.highlight === "Most Popular";
            const isBest = plan.highlight === "Best Value";
            return (
              <div
                key={plan.key}
                className={cn(
                  "relative rounded-3xl border bg-card shadow-sm flex flex-col",
                  isPopular && "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20",
                  isBest && "border-emerald-500 shadow-lg shadow-emerald-500/10"
                )}
              >
                {plan.highlight && (
                  <div className={cn(
                    "absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white",
                    isPopular ? "bg-primary" : "bg-emerald-600"
                  )}>
                    {plan.highlight}
                  </div>
                )}

                <div className="p-7 flex-1 flex flex-col">
                  <h2 className="font-serif font-bold text-xl text-foreground mb-1">{plan.name}</h2>
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">one-time</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    variant={plan.ctaVariant}
                    className={cn(
                      "w-full font-semibold gap-2",
                      isPopular && "bg-primary text-primary-foreground hover:bg-primary/90",
                      isBest && "bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                    )}
                    onClick={() => handleCheckout(plan.key)}
                    disabled={loading === plan.key}
                  >
                    {loading === plan.key ? "Loading..." : plan.cta}
                    {loading !== plan.key && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GUARANTEE.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3 bg-secondary/40 rounded-2xl p-5 border border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl font-serif font-bold text-center mb-8">Common Questions</h2>
          {[
            {
              q: "What's the difference between these plans?",
              a: "Basic gives you everything to file on your own — forms, comps report, and instructions. Guided adds expert review checklists and email support. Concierge includes a personal review of your comparables and a 30-minute call with a specialist."
            },
            {
              q: "Is this a one-time fee or a subscription?",
              a: "One-time per appeal season. You pay once, file your grievance, and keep everything you save. No commissions, no annual fees."
            },
            {
              q: "What if my appeal is denied?",
              a: "Filing is always free to appeal further in all four states. Our forms give you all four grounds for complaint (overvaluation, unequal assessment, etc.), and denial at one level doesn't prevent you from appealing further."
            },
            {
              q: "Do you file on my behalf?",
              a: "No — you file yourself, which is exactly why you keep 100% of the savings instead of paying 50% commission. We provide the tools, forms, guidance, and (in Concierge) expert review of your evidence."
            },
          ].map(({ q, a }, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-2">{q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
