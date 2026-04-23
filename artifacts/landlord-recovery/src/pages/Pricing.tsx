import { useState } from "react";
import { Check, Loader2, ArrowRight, Shield, MapPin, Home, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { startSubscriptionCheckout, startUnlockCheckout } from "@/hooks/useSubscription";

type ActiveDialog = "case" | "starter" | "pro" | null;

export default function Pricing() {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const openDialog = (dialog: ActiveDialog) => {
    setEmail("");
    setLoading(false);
    setActiveDialog(dialog);
  };

  const handleCaseUnlock = async () => {
    setLoading(true);
    try {
      await startUnlockCheckout(email || undefined);
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleStarter = async () => {
    setLoading(true);
    try {
      await startSubscriptionCheckout(email || undefined);
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handlePro = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/landlord/subscription/create-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        throw new Error(json.error || "Checkout unavailable");
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">

      {/* ── SECTION 1: Hero ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-background border-b">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-5 leading-tight">
            Recover unpaid rent without hiring a lawyer
          </h1>
          <p className="text-xl text-muted-foreground">
            Create court-ready cases in minutes and only pay when you need it.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: Primary — $29 per case ──────────────────────── */}
      <section className="py-16 bg-primary/[0.03]">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-2xl border-2 border-primary bg-background shadow-xl overflow-hidden">
            <div className="bg-primary px-8 py-4 text-center">
              <span className="text-primary-foreground text-sm font-semibold uppercase tracking-widest">
                No subscription required
              </span>
            </div>
            <div className="px-8 py-10 text-center">
              <div className="mb-2">
                <span className="text-7xl font-bold text-primary">$29</span>
                <span className="text-2xl text-muted-foreground ml-2">per case</span>
              </div>
              <p className="text-muted-foreground mt-2 mb-8">Pay once and use immediately.</p>

              <ul className="text-left space-y-4 mb-10 max-w-sm mx-auto">
                {[
                  "Full case summary (court-ready)",
                  "Filing instructions for your state",
                  "Downloadable documents",
                  "Works immediately after payment",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="w-full max-w-sm h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                onClick={() => openDialog("case")}
              >
                Start Your Case — $29
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Secured by Stripe. No subscription. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Monthly plans (smaller) ─────────────────────── */}
      <section className="py-14 bg-background border-t">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">Monthly plans for repeat landlords</h2>
            <p className="text-muted-foreground text-sm">Save vs paying per case when you have multiple properties.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Starter $49/mo */}
            <div className="rounded-xl border bg-background p-6 flex flex-col">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Starter Plan</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  "Includes 2 cases per month",
                  "All $29 case features included",
                  "Save vs paying individually",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full h-11 border-primary text-primary hover:bg-primary/5"
                onClick={() => openDialog("starter")}
              >
                Get Starter Plan
              </Button>
            </div>

            {/* Pro $79/mo */}
            <div className="rounded-xl border bg-background p-6 flex flex-col">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Pro Plan</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground">$79</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  "Unlimited cases",
                  "All $29 case features included",
                  "Best for active landlords",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full h-11 border-primary text-primary hover:bg-primary/5"
                onClick={() => openDialog("pro")}
              >
                Get Pro Plan
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Trust ────────────────────────────────────────── */}
      <section className="py-14 bg-muted/40 border-t">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-serif font-semibold text-center mb-10">Why landlords use this</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: <DollarSign className="h-5 w-5 text-green-600" />, text: "Avoid $500–$2,000 legal fees" },
              { icon: <Home className="h-5 w-5 text-blue-600" />, text: "Handle small claims yourself" },
              { icon: <Shield className="h-5 w-5 text-purple-600" />, text: "Designed for rental property owners" },
              { icon: <MapPin className="h-5 w-5 text-orange-600" />, text: "Works in all 50 states" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-4 bg-background rounded-xl border p-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {icon}
                </div>
                <span className="font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-background border border-green-200 p-6 text-center">
            <p className="font-semibold text-foreground text-base">No subscription required to get started</p>
            <p className="text-muted-foreground text-sm mt-1">Pay once and use immediately.</p>
          </div>
        </div>
      </section>

      {/* ── Footer note ─────────────────────────────────────────────── */}
      <section className="py-8 border-t bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center text-xs text-muted-foreground">
          Prices do not include court filing fees, process server fees, or other direct costs associated with small claims court.
        </div>
      </section>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      <CheckoutDialog
        open={activeDialog === "case"}
        onClose={() => setActiveDialog(null)}
        title="Start Your Case — $29"
        description="One-time payment. Court-ready documents available immediately after checkout."
        buttonLabel="Pay $29 — Start Now"
        email={email}
        onEmailChange={setEmail}
        loading={loading}
        onConfirm={handleCaseUnlock}
      />
      <CheckoutDialog
        open={activeDialog === "starter"}
        onClose={() => setActiveDialog(null)}
        title="Starter Plan — $49/month"
        description="Includes 2 cases per month. Cancel any time."
        buttonLabel="Subscribe — $49/mo"
        email={email}
        onEmailChange={setEmail}
        loading={loading}
        onConfirm={handleStarter}
      />
      <CheckoutDialog
        open={activeDialog === "pro"}
        onClose={() => setActiveDialog(null)}
        title="Pro Plan — $79/month"
        description="Unlimited cases. Best for active landlords. Cancel any time."
        buttonLabel="Subscribe — $79/mo"
        email={email}
        onEmailChange={setEmail}
        loading={loading}
        onConfirm={handlePro}
      />
    </div>
  );
}

function CheckoutDialog({
  open, onClose, title, description, buttonLabel,
  email, onEmailChange, loading, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonLabel: string;
  email: string;
  onEmailChange: (v: string) => void;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="checkout-email">
              Email address <span className="text-muted-foreground font-normal">(optional — for your receipt)</span>
            </Label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button className="flex-1 bg-primary" onClick={onConfirm} disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</>
                : buttonLabel
              }
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Secured by Stripe. Your card details are never stored on our servers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
