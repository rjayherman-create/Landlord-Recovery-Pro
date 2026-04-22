import { useState } from "react";
import { Check, Loader2, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const FALLBACK_PRICE_ID = "price_1TOzGmAYpygKlmLIeC4dB0oM";

async function fetchProPrice(): Promise<{ priceId: string; unitAmount: number }> {
  try {
    const res = await fetch("/api/stripe/products");
    if (!res.ok) throw new Error("api error");
    const { data } = await res.json();
    const pro = (data as any[]).find((p: any) =>
      p.name?.toLowerCase().includes("recovery pro") || p.name?.toLowerCase().includes("pro")
    );
    const price = pro?.prices?.[0];
    if (price?.id) return { priceId: price.id, unitAmount: price.unit_amount };
  } catch {}
  return { priceId: FALLBACK_PRICE_ID, unitAmount: 9900 };
}

export default function Pricing() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: priceData } = useQuery({
    queryKey: ["stripe-pro-price"],
    queryFn: fetchProPrice,
    retry: false,
  });

  const handleUpgrade = async () => {
    if (!priceData?.priceId) {
      toast({ title: "Checkout unavailable", description: "Please try again shortly.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: priceData.priceId, email: email || undefined }),
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

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">Simple, transparent pricing.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recover what's yours without paying thousands in legal fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="border-border shadow-sm flex flex-col">
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-serif mb-2">Basic Tracker</CardTitle>
              <CardDescription>Organize your cases for free.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$0</span>
                <span className="text-muted-foreground ml-2">forever</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span>Unlimited case tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span>Basic status updates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span>State resource directory</span>
                </li>
                <li className="flex items-start opacity-40">
                  <Check className="h-5 w-5 text-transparent shrink-0 mr-3" />
                  <span>AI Demand Letter Generation</span>
                </li>
                <li className="flex items-start opacity-40">
                  <Check className="h-5 w-5 text-transparent shrink-0 mr-3" />
                  <span>Document exports</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8">
              <Button variant="outline" className="w-full h-12 text-base" asChild>
                <Link to="/dashboard">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="border-primary shadow-md flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Recommended
            </div>
            <CardHeader className="text-center pb-8 pt-8 bg-primary/5">
              <CardTitle className="text-2xl font-serif mb-2">Recovery Pro</CardTitle>
              <CardDescription>Everything you need to execute.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$99</span>
                <span className="text-muted-foreground ml-2">flat fee / year</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Everything in Basic Tracker</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Unlimited AI Demand Letters</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Premium PDF Exports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Court-specific filing instructions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8 bg-primary/5">
              <Button
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                onClick={() => setDialogOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Upgrade to Recovery Pro
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Prices do not include court filing fees, process server fees, or other direct costs associated with small claims court.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Upgrade to Recovery Pro</DialogTitle>
            <DialogDescription>
              One-time payment of $99 — includes a full year of access to all pro features.
              You'll be redirected to our secure checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email address <span className="text-muted-foreground font-normal">(optional — for your receipt)</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary" onClick={handleUpgrade} disabled={loading}>
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
