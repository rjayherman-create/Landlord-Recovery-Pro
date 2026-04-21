import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Download,
  ArrowRight,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  Receipt,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CURRENT_PLAN = {
  key: "guided",
  name: "Guided",
  price: 199,
  purchaseDate: "March 12, 2025",
  receiptId: "pi_3Qx8Kj2eZvKYlo2C1a0b2c3d",
  features: [
    "Pre-filled state appeal form (RP-524)",
    "Printable comparable sales report",
    "Case confidence score & over-assessment analysis",
    "Step-by-step county filing instructions",
    "Deadline reminders for your state",
    "Detailed review checklist before you file",
    "County-specific filing portal walkthrough",
    "Priority email support (48-hour response)",
    "Tips to strengthen your comparable sales evidence",
  ],
};

const PAYMENT_HISTORY = [
  {
    id: "pi_3Qx8Kj2eZvKYlo2C1a0b2c3d",
    date: "March 12, 2025",
    description: "Guided Plan — 2025 Appeal Season",
    amount: 199.0,
    status: "paid",
  },
];

const UPGRADE_PLAN = {
  key: "concierge",
  name: "Concierge",
  price: 299,
  highlight: "Best Value",
  description: "We review your case personally before you submit.",
  additionalFeatures: [
    "Expert review of your comparable sales selection",
    "Form review before filing — we flag any issues",
    "30-minute video call with a property tax specialist",
    "Strategy advice tailored to your county and board",
  ],
};

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    basic: "bg-slate-100 text-slate-700 border-slate-200",
    guided: "bg-primary/10 text-primary border-primary/20",
    concierge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colors[plan] ?? colors.basic}`}
    >
      <Star className="w-3 h-3" />
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

export default function BillingPage() {
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  function handleUpgrade() {
    setUpgradeLoading(true);
    setTimeout(() => setUpgradeLoading(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Billing &amp; Plan
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Manage your subscription, download receipts, and upgrade your plan.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="plan">
          <TabsList className="mb-6">
            <TabsTrigger value="plan">Current Plan</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
          </TabsList>

          {/* ── Current Plan ── */}
          <TabsContent value="plan" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      {CURRENT_PLAN.name} Plan
                    </CardTitle>
                    <CardDescription>
                      Purchased {CURRENT_PLAN.purchaseDate} · One-time fee
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PlanBadge plan={CURRENT_PLAN.key} />
                    <Badge
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 bg-emerald-50"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Price summary */}
                <div className="flex items-center justify-between bg-secondary/40 rounded-xl p-4 border border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Amount paid
                    </p>
                    <p className="text-2xl font-extrabold text-foreground">
                      ${CURRENT_PLAN.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Billing type
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      One-time
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No renewals · No commissions
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Included features */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">
                    What&apos;s included
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CURRENT_PLAN.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-snug">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="gap-3 flex-wrap">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download Receipt
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Manage via Stripe
                </Button>
              </CardFooter>
            </Card>

            {/* Trust strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Safe to file",
                  body: "Filing cannot raise your taxes — guaranteed by law in all 4 states.",
                },
                {
                  icon: Zap,
                  title: "Quick workflow",
                  body: "Most cases completed in under 2 hours with our guided steps.",
                },
                {
                  icon: Clock,
                  title: "No expiry",
                  body: "Your plan stays active for the full 2025 appeal season.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 bg-secondary/30 rounded-xl p-4 border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-0.5">
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Payment History ── */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  All payments are processed securely by Stripe.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAYMENT_HISTORY.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          <div>{payment.description}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {payment.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground whitespace-nowrap">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
                            <Download className="w-3 h-3" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Need a VAT invoice or have a billing question?{" "}
              <button className="underline underline-offset-2 hover:text-foreground transition-colors">
                Contact support
              </button>
            </p>
          </TabsContent>

          {/* ── Upgrade ── */}
          <TabsContent value="upgrade" className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                Upgrade to Concierge
              </h2>
              <p className="text-muted-foreground text-sm">
                You&apos;re currently on the <strong>Guided</strong> plan. Upgrade for a
                personal expert review of your case before you file.
              </p>
            </div>

            <Card className="border-emerald-400 shadow-lg shadow-emerald-500/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-emerald-600">
                {UPGRADE_PLAN.highlight}
              </div>
              <CardHeader className="pb-4 pt-8">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {UPGRADE_PLAN.name} Plan
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {UPGRADE_PLAN.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-foreground">
                      ${UPGRADE_PLAN.price}
                    </p>
                    <p className="text-xs text-muted-foreground">one-time</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Everything in Guided, plus:
                  </p>
                  <ul className="space-y-2.5">
                    {UPGRADE_PLAN.additionalFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 leading-relaxed">
                  <strong>Why upgrade?</strong> Our Concierge clients see a higher
                  reduction rate because an expert flags weak comparables and form
                  errors before the board ever sees the filing.
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  size="lg"
                  className="w-full font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                >
                  {upgradeLoading ? (
                    "Redirecting to checkout…"
                  ) : (
                    <>
                      Upgrade to Concierge — $
                      {UPGRADE_PLAN.price - CURRENT_PLAN.price} more
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure checkout via Stripe · 100% of your savings stay with you
              <ChevronRight className="w-3 h-3" />
              No commissions
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
