import { useState } from "react";
import { Check, Loader2, CreditCard, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { startSubscriptionCheckout } from "@/hooks/useSubscription";

const FALLBACK_ANNUAL_PRICE_ID = "price_1TOzGmAYpygKlmLIeC4dB0oM";

async function fetchAnnualPrice(): Promise<{ priceId: string; unitAmount: number }> {
  try {
    const res = await fetch("/api/stripe/products");
    if (!res.ok) throw new Error("api error");
    const { data } = await res.json();
    const pro = (data as any[]).find((p: any) =>
      (p.name?.toLowerCase().includes("recovery pro") || p.name?.toLowerCase().includes("pro")) &&
      !p.name?.toLowerCase().includes("monthly")
    );
    const price = pro?.prices?.[0];
    if (price?.id) return { priceId: price.id, unitAmount: price.unit_amount };
  } catch {}
  return { priceId: FALLBACK_ANNUAL_PRICE_ID, unitAmount: 9900 };
}

type Dialog = "annual" | "monthly" | null;

export default function Pricing() {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<Dialog>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: annualPriceData } = useQuery({
    queryKey: ["stripe-pro-annual-price"],
    queryFn: fetchAnnualPrice,
    retry: false,
  });

  const handleAnnualUpgrade = async () => {
    if (!annualPriceData?.priceId) {
      toast({ title: "Checkout unavailable", description: "Please try again shortly.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: annualPriceData.priceId, email: email || undefined }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        throw new Error(json.error || "No checkout URL returned");
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleMonthlyUpgrade = async () => {
    setLoading(true);
    try {
      await startSubscriptionCheckout(email || undefined);
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">Simple, transparent pricing.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recover what's yours without paying thousands in legal fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="border-border shadow-sm flex flex-col">
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-xl font-serif mb-2">Basic Tracker</CardTitle>
              <CardDescription>Organize your cases for free.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$0</span>
                <span className="text-muted-foreground ml-2">forever</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm">Unlimited case tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm">Basic status updates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm">State resource directory</span>
                </li>
                <li className="flex items-start opacity-35">
                  <Check className="h-4 w-4 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm">AI Demand Letter Generation</span>
                </li>
                <li className="flex items-start opacity-35">
                  <Check className="h-4 w-4 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm">Document exports</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8">
              <Button variant="outline" className="w-full h-11 text-sm" asChild>
                <Link to="/dashboard">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Monthly Subscription — featured */}
          <Card className="border-primary shadow-lg flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Most Popular
            </div>
            <CardHeader className="text-center pb-8 pt-8 bg-primary/5">
              <CardTitle className="text-xl font-serif mb-2">Recovery Pro</CardTitle>
              <CardDescription>Everything you need, month to month.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$49</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-accent shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Everything in Basic Tracker</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-accent shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Unlimited AI Demand Letters</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-accent shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Premium PDF Exports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-accent shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Court-specific filing instructions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-accent shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8 bg-primary/5">
              <Button
                className="w-full h-11 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow"
                onClick={() => { setEmail(""); setActiveDialog("monthly"); }}
              >
                <Zap className="h-4 w-4 mr-2" /> Start Monthly Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Annual One-Time */}
          <Card className="border-border shadow-sm flex flex-col">
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-xl font-serif mb-2">Recovery Pro Annual</CardTitle>
              <CardDescription>Best value for active landlords.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$99</span>
                <span className="text-muted-foreground ml-2">/ year</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
            </CardHeader>
            <CardContent className="flex-1 pt-2">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Everything in Recovery Pro</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Full year of access</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mr-3 mt-0.5" />
                  <span className="text-sm font-medium">Save ~$490 vs monthly</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8">
              <Button
                variant="outline"
                className="w-full h-11 text-sm border-primary text-primary hover:bg-primary/5"
                onClick={() => { setEmail(""); setActiveDialog("annual"); }}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Get Annual Plan
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Prices do not include court filing fees, process server fees, or other direct costs associated with small claims court.</p>
        </div>
      </div>

      {/* Monthly checkout dialog */}
      <Dialog open={activeDialog === "monthly"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Start Recovery Pro — $49/month</DialogTitle>
            <DialogDescription>
              Billed monthly. Cancel any time from your billing portal.
              You'll be redirected to secure checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email-monthly">Email address <span className="text-muted-foreground font-normal">(optional — for your receipt)</span></Label>
              <Input
                id="email-monthly"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setActiveDialog(null)} disabled={loading}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary" onClick={handleMonthlyUpgrade} disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</>
                  : <><Zap className="h-4 w-4 mr-2" /> Subscribe — $49/mo</>
                }
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Secured by Stripe. Your card details are never stored on our servers.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Annual checkout dialog */}
      <Dialog open={activeDialog === "annual"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Recovery Pro Annual — $99</DialogTitle>
            <DialogDescription>
              One-time payment of $99 — includes a full year of access to all pro features.
              You'll be redirected to secure checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email-annual">Email address <span className="text-muted-foreground font-normal">(optional — for your receipt)</span></Label>
              <Input
                id="email-annual"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setActiveDialog(null)} disabled={loading}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary" onClick={handleAnnualUpgrade} disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</>
                  : <><CreditCard className="h-4 w-4 mr-2" /> Proceed to Checkout</>
                }
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Secured by Stripe. Your card details are never stored on our servers.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
