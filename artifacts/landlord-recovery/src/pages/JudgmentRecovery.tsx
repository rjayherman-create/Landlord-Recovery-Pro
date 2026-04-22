import { useState } from "react";
import {
  DollarSign, TrendingUp, Briefcase, Building, Home, Users, Search,
  ChevronRight, ChevronDown, CheckCircle2, Clock, Plus, Trash2,
  AlertCircle, Info, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── State judgment validity rules ─────────────────────────────────────────
const STATE_JUDGMENT_RULES: Record<string, { years: number; note: string }> = {
  NY: { years: 20, note: "Judgment is valid for 20 years. Can be extended." },
  IL: { years: 7,  note: "Valid for 7 years, renewable for another 7." },
  OH: { years: 5,  note: "Valid for 5 years, renewable before expiration." },
  PA: { years: 5,  note: "Valid for 5 years, renewable." },
  CA: { years: 10, note: "Valid for 10 years, renewable for 10 more." },
  FL: { years: 20, note: "Valid for 20 years." },
  TX: { years: 10, note: "Valid for 10 years." },
  NJ: { years: 20, note: "Valid for 20 years." },
  CT: { years: 25, note: "Valid for 25 years — one of the longest in the US." },
  MA: { years: 20, note: "Valid for 20 years." },
  MI: { years: 10, note: "Valid for 10 years." },
  GA: { years: 7,  note: "Valid for 7 years." },
  WA: { years: 10, note: "Valid for 10 years." },
  CO: { years: 6,  note: "Valid for 6 years, renewable." },
  AZ: { years: 5,  note: "Valid for 5 years, renewable." },
};

// ─── Collection method playbooks ─────────────────────────────────────────────
type CollectionMethod = "wage_garnishment" | "bank_levy" | "property_lien" | "payment_plan" | "locate_tenant";

const PLAYBOOKS: Record<CollectionMethod, {
  label: string;
  icon: React.ReactNode;
  tagline: string;
  steps: string[];
  when: string;
  effectiveness: "high" | "medium" | "low";
}> = {
  wage_garnishment: {
    label: "Wage Garnishment",
    icon: <Briefcase className="h-5 w-5" />,
    tagline: "Most reliable long-term — automatically deducts from tenant's paycheck.",
    effectiveness: "high",
    when: "You know where the tenant works.",
    steps: [
      "Obtain a certified copy of the judgment from the court clerk.",
      "Complete an Income Execution form (available from the court clerk).",
      "Submit the form and judgment copy to the county marshal or sheriff.",
      "The marshal serves the employer directly — no further action needed.",
      "Employer withholds a portion of wages each pay period and remits to the marshal.",
      "Marshal forwards collected funds to you until the judgment is satisfied.",
    ],
  },
  bank_levy: {
    label: "Bank Levy",
    icon: <Building className="h-5 w-5" />,
    tagline: "Fast if you know the bank — freezes the account and collects funds directly.",
    effectiveness: "high",
    when: "You know the tenant's bank or financial institution.",
    steps: [
      "Obtain a certified copy of the judgment from the court clerk.",
      "File a Restraining Notice or Writ of Execution with the court marshal or sheriff.",
      "Provide the bank name and address to the marshal.",
      "The marshal serves the bank directly — the bank freezes the account.",
      "Funds up to the judgment amount are remitted to the marshal, then to you.",
      "This is a one-time levy — if the account is empty, you may need to repeat.",
    ],
  },
  property_lien: {
    label: "Property Lien",
    icon: <Home className="h-5 w-5" />,
    tagline: "Long-term play — tenant cannot sell or refinance without paying you first.",
    effectiveness: "medium",
    when: "The tenant owns real property in the same state.",
    steps: [
      "Obtain a certified copy of the judgment from the court clerk.",
      "File the judgment as a lien with the county clerk's office in the county where the tenant's property is located.",
      "The lien attaches to any real estate owned by the tenant.",
      "When the tenant sells or refinances their property, you must be paid first.",
      "Keep records — monitor for any real estate transactions in that county.",
      "Lien remains for the full duration of your state's judgment validity period.",
    ],
  },
  payment_plan: {
    label: "Negotiated Payment Plan",
    icon: <Users className="h-5 w-5" />,
    tagline: "Realistic for many cases — structured monthly payments with a written agreement.",
    effectiveness: "medium",
    when: "Tenant is cooperative or unable to pay a lump sum.",
    steps: [
      "Contact the tenant by phone or written notice — keep it professional and factual.",
      "Offer a structured plan: e.g., $200/month until the $2,400 balance is paid.",
      "Draft a written Payment Agreement specifying amount, due dates, and consequences for missed payments.",
      "Have both parties sign the agreement — keep a copy.",
      "Track every payment in this app. If a payment is missed, follow up immediately.",
      "If two or more payments are missed, escalate to wage garnishment or bank levy.",
    ],
  },
  locate_tenant: {
    label: "Locate Tenant",
    icon: <Search className="h-5 w-5" />,
    tagline: "Before you can collect, you need to find them.",
    effectiveness: "low",
    when: "Tenant has moved and their current address or employer is unknown.",
    steps: [
      "Send certified mail to the last known address — it may be forwarded.",
      "Search public records: voter registration, DMV, court records in the same county.",
      "Check social media accounts (Facebook, LinkedIn, Instagram) for location clues.",
      "Contact any co-signers, guarantors, or emergency contacts listed in the original lease.",
      "Consider a licensed skip tracing service — costs $30–$150 but provides employer and address data.",
      "Once located, immediately pursue wage garnishment or bank levy.",
    ],
  },
};

// ─── Decision engine ──────────────────────────────────────────────────────────
function recommendMethod(answers: {
  knowsEmployer: boolean | null;
  knowsBank: boolean | null;
  tenantMoved: boolean | null;
  tenantOwnsProperty: boolean | null;
}): CollectionMethod {
  if (answers.knowsEmployer) return "wage_garnishment";
  if (answers.knowsBank) return "bank_levy";
  if (answers.tenantMoved) return "locate_tenant";
  if (answers.tenantOwnsProperty) return "property_lien";
  return "payment_plan";
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Payment {
  id: number;
  caseId: number;
  amount: string;
  paymentDate: string;
  method: string;
  notes?: string;
}

interface Props {
  caseId: number;
  tenantName: string;
  judgmentAmount: number;
  state: string;
}

export default function JudgmentRecovery({ caseId, tenantName, judgmentAmount, state }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeMethod, setActiveMethod] = useState<CollectionMethod | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expandedPlaybook, setExpandedPlaybook] = useState<CollectionMethod | null>(null);

  // Decision wizard state
  const [answers, setAnswers] = useState<{
    knowsEmployer: boolean | null;
    knowsBank: boolean | null;
    tenantMoved: boolean | null;
    tenantOwnsProperty: boolean | null;
  }>({ knowsEmployer: null, knowsBank: null, tenantMoved: null, tenantOwnsProperty: null });
  const [recommendation, setRecommendation] = useState<CollectionMethod | null>(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "check", notes: "" });

  // Fetch payments
  const { data: paymentsData } = useQuery({
    queryKey: ["landlord-case-payments", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/landlord-cases/${caseId}/payments`);
      if (!res.ok) throw new Error("Failed to load payments");
      return res.json() as Promise<Payment[]>;
    },
  });

  const payments = paymentsData ?? [];
  const collected = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = Math.max(0, judgmentAmount - collected);
  const pctCollected = judgmentAmount > 0 ? Math.min(100, (collected / judgmentAmount) * 100) : 0;

  const stateRule = STATE_JUDGMENT_RULES[state] ?? { years: 10, note: "Check your state's statute for judgment validity period." };

  // Mutations
  const addPayment = useMutation({
    mutationFn: async (data: typeof paymentForm) => {
      const res = await fetch(`/api/landlord-cases/${caseId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-case-payments", caseId] });
      queryClient.invalidateQueries({ queryKey: ["landlord-case", caseId] });
      setPaymentDialogOpen(false);
      setPaymentForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "check", notes: "" });
      toast({ title: "Payment recorded" });
    },
    onError: () => toast({ title: "Failed to record payment", variant: "destructive" }),
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await fetch(`/api/landlord-cases/${caseId}/payments/${paymentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-case-payments", caseId] });
      queryClient.invalidateQueries({ queryKey: ["landlord-case", caseId] });
      toast({ title: "Payment removed" });
    },
  });

  function runWizard() {
    const rec = recommendMethod(answers);
    setRecommendation(rec);
    setActiveMethod(rec);
    setWizardOpen(false);
    setExpandedPlaybook(rec);
  }

  const effectivenessColor = {
    high: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-5">

      {/* ── Status tracker ── */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 bg-muted/10 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recovery Progress
              </CardTitle>
              <CardDescription>Judgment against {tenantName}</CardDescription>
            </div>
            <Badge className={remaining === 0 ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
              {remaining === 0 ? "Fully Collected" : "Uncollected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Judgment</p>
              <p className="text-xl font-bold">${judgmentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Collected</p>
              <p className="text-xl font-bold text-green-700">${collected.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Remaining</p>
              <p className="text-xl font-bold text-red-700">${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Collection progress</span>
              <span>{pctCollected.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${pctCollected}%` }}
              />
            </div>
          </div>

          {/* Judgment validity */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg p-3">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span><strong>{state}:</strong> {stateRule.note} You have time — persistence pays off.</span>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Record Payment
            </Button>
            <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)} className="gap-1.5">
              Start Collection Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Decision wizard ── */}
      {wizardOpen && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Collection Strategy Advisor</CardTitle>
            <CardDescription>Answer a few quick questions to get a recommendation.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {[
              { key: "knowsEmployer", question: "Do you know where the tenant currently works?" },
              { key: "knowsBank", question: "Do you know the tenant's bank or financial institution?" },
              { key: "tenantMoved", question: "Has the tenant moved and you don't have their current address?" },
              { key: "tenantOwnsProperty", question: "Does the tenant own real estate in your state?" },
            ].map(({ key, question }) => (
              <div key={key} className="space-y-1.5">
                <p className="text-sm font-medium">{question}</p>
                <div className="flex gap-2">
                  {["Yes", "No"].map((label) => {
                    const val = label === "Yes";
                    const isSelected = (answers as any)[key] === val;
                    return (
                      <Button
                        key={label}
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setAnswers((prev) => ({ ...prev, [key]: val }))}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={runWizard} disabled={Object.values(answers).some((v) => v === null)}>
                Get My Recommendation <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="ghost" onClick={() => setWizardOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recommended method ── */}
      {recommendation && activeMethod && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Recommended: {PLAYBOOKS[activeMethod].label}</p>
              <p className="text-sm text-green-700 mt-0.5">{PLAYBOOKS[activeMethod].tagline}</p>
              <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs text-green-800 px-0 hover:bg-transparent"
                onClick={() => setExpandedPlaybook(expandedPlaybook === activeMethod ? null : activeMethod)}>
                {expandedPlaybook === activeMethod ? "Hide playbook" : "View step-by-step playbook"}
                <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${expandedPlaybook === activeMethod ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Collection methods ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">All Collection Methods</h3>
        {(Object.entries(PLAYBOOKS) as [CollectionMethod, typeof PLAYBOOKS[CollectionMethod]][]).map(([key, pb]) => (
          <Card key={key} className={`border-border shadow-sm transition-all ${activeMethod === key ? "ring-2 ring-primary/30" : ""}`}>
            <button
              className="w-full text-left"
              onClick={() => setExpandedPlaybook(expandedPlaybook === key ? null : key)}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-primary">{pb.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{pb.label}</p>
                      <p className="text-xs text-muted-foreground">{pb.when}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${effectivenessColor[pb.effectiveness]}`}>
                      {pb.effectiveness === "high" ? "High success" : pb.effectiveness === "medium" ? "Moderate" : "Variable"}
                    </Badge>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedPlaybook === key ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </CardHeader>
            </button>
            {expandedPlaybook === key && (
              <CardContent className="pt-0 pb-4 px-4">
                <Separator className="mb-4" />
                <p className="text-sm text-muted-foreground mb-3 italic">{pb.tagline}</p>
                <ol className="space-y-2">
                  {pb.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => { setActiveMethod(key); setRecommendation(key); }}
                >
                  Use This Method
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* ── Payment history ── */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/10 border-b">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Payment History
            </CardTitle>
            <CardDescription>Track every payment received toward the judgment.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {payments.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-md bg-muted/10">
              <Clock className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Record each payment as you receive it.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20 border border-border text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium">${parseFloat(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.paymentDate} · {p.method.replace(/_/g, " ")}
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deletePayment.mutate(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Persistence nudge ── */}
      {remaining > 0 && (
        <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-100 rounded-lg p-4">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800">
            <strong>Stay persistent.</strong> Most judgments are not collected immediately — landlords who follow up consistently over months and years recover significantly more. Your judgment remains valid for <strong>{stateRule.years} years</strong> in {state}.
          </p>
        </div>
      )}

      {/* ── Add Payment Dialog ── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Amount Received</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="pl-7"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date Received</Label>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((p) => ({ ...p, method: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer / Zelle</SelectItem>
                  <SelectItem value="money_order">Money Order</SelectItem>
                  <SelectItem value="garnishment">Wage Garnishment</SelectItem>
                  <SelectItem value="levy">Bank Levy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g., First installment per payment agreement"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                className="min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addPayment.mutate(paymentForm)}
              disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || addPayment.isPending}
            >
              {addPayment.isPending ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
