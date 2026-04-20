import { useState } from "react";
import {
  DollarSign, FileText, Briefcase, Building2, ChevronDown, ChevronUp,
  Loader2, Download, Copy, Check, AlertTriangle, ArrowRight, Info
} from "lucide-react";

const API_BASE = "";

const COLLECTION_STATUS = ["judgment_awarded", "won"];

type Tool = "demand" | "plan" | "garnishment" | "levy" | null;

// ── Payment Plan Display ──────────────────────────────────────────────────────
function PaymentPlanCard({ plan }: { plan: any }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
      <p className="text-sm font-semibold text-green-800 mb-1">
        {plan.months}-Month Payment Schedule — Total: ${plan.total.toLocaleString()}
      </p>
      <div className="space-y-1.5 mt-2">
        {plan.schedule.map((s: any) => (
          <div key={s.installment} className="flex justify-between items-center text-sm bg-white rounded px-3 py-1.5 border border-green-100">
            <span className="text-muted-foreground">Installment {s.installment} — {s.due}</span>
            <span className="font-semibold text-green-700">${s.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-green-700 mt-2 italic">
        Share this schedule with {plan.defendant} as a settlement option. Get any agreement in writing.
      </p>
    </div>
  );
}

// ── Demand Letter Display ─────────────────────────────────────────────────────
function DemandLetterCard({ letter }: { letter: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-200">
        <span className="text-xs font-semibold text-blue-800">Generated Demand Letter</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-xs font-mono text-foreground p-4 max-h-64 overflow-y-auto bg-white leading-relaxed">
        {letter}
      </pre>
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
        <p className="text-xs text-amber-700">
          <strong>Next:</strong> Print, sign, and send this letter via certified mail (USPS) so you have proof of delivery.
        </p>
      </div>
    </div>
  );
}

// ── Garnishment / Levy form + download button ─────────────────────────────────
function EnforcementForm({
  type,
  caseId,
  onClose,
}: {
  type: "garnishment" | "levy";
  caseId: number;
  onClose: () => void;
}) {
  const isGarnishment = type === "garnishment";
  const [employer, setEmployer] = useState("");
  const [employerAddress, setEmployerAddress] = useState("");
  const [bank, setBank] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [accountType, setAccountType] = useState("");
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const endpoint = isGarnishment ? "garnishment" : "bank-levy";
      const body = isGarnishment
        ? { employer, employerAddress }
        : { bank, bankAddress, accountType };
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/collection/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isGarnishment ? `wage-garnishment.pdf` : `bank-levy.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="mt-3 bg-card border border-card-border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">
        {isGarnishment ? "Wage Garnishment Details" : "Bank Levy Details"}
      </h4>
      <div className="space-y-3">
        {isGarnishment ? (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Employer name</label>
              <input type="text" className={inputClass} placeholder="ACME Corp" value={employer} onChange={e => setEmployer(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Employer address</label>
              <input type="text" className={inputClass} placeholder="456 Corp Ave, New York, NY 10001" value={employerAddress} onChange={e => setEmployerAddress(e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bank name</label>
              <input type="text" className={inputClass} placeholder="Chase Bank" value={bank} onChange={e => setBank(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bank address or branch</label>
              <input type="text" className={inputClass} placeholder="123 Bank St, New York, NY 10001" value={bankAddress} onChange={e => setBankAddress(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Account type (optional)</label>
              <input type="text" className={inputClass} placeholder="Checking / Savings" value={accountType} onChange={e => setAccountType(e.target.value)} />
            </div>
          </>
        )}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-3 text-xs text-amber-800">
        <strong>Note:</strong> You may need to file this form with the court clerk first and pay a small fee before serving it.
        Check your state's post-judgment enforcement rules.
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={download}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Generating…" : "Download PDF"}
        </button>
        <button onClick={onClose} className="px-4 py-2 border border-border text-sm rounded-md hover:bg-secondary/50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Collection Toolkit ───────────────────────────────────────────────────
export function CollectionToolkit({ caseData }: { caseData: any }) {
  const [open, setOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [loading, setLoading] = useState(false);
  const [planMonths, setPlanMonths] = useState(3);

  // Results
  const [demandLetter, setDemandLetter] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<any>(null);

  if (!COLLECTION_STATUS.includes(caseData.status)) return null;

  const generateDemand = async () => {
    setActiveTool("demand");
    setDemandLetter("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseData.id}/collection/demand-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setDemandLetter(data.letter ?? "Failed to generate letter.");
    } catch {
      setDemandLetter("Failed to generate letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setActiveTool("plan");
    setPaymentPlan(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseData.id}/collection/payment-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: planMonths }),
      });
      setPaymentPlan(await res.json());
    } catch {
      setPaymentPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    {
      id: "demand" as Tool,
      icon: FileText,
      label: "Send Payment Request",
      description: "AI-written demand letter citing the judgment",
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      action: generateDemand,
    },
    {
      id: "plan" as Tool,
      icon: DollarSign,
      label: "Offer a Payment Plan",
      description: "Generate a 3–6 month installment schedule",
      color: "text-green-700",
      bg: "bg-green-50 border-green-200 hover:bg-green-100",
      action: generatePlan,
    },
    {
      id: "garnishment" as Tool,
      icon: Briefcase,
      label: "Wage Garnishment",
      description: "Court form to withhold pay from employer",
      color: "text-purple-700",
      bg: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      action: () => setActiveTool("garnishment"),
    },
    {
      id: "levy" as Tool,
      icon: Building2,
      label: "Bank Levy",
      description: "Freeze and seize funds from defendant's bank",
      color: "text-orange-700",
      bg: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      action: () => setActiveTool("levy"),
    },
  ];

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
      <button onClick={() => setOpen(v => !v)} className="flex items-center justify-between w-full text-left">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-foreground">Get Paid — Collection Toolkit</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">You won. Now collect your money.</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4 text-xs text-amber-800">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Start with a demand letter — many defendants pay voluntarily when they see formal enforcement is next. Escalate to garnishment or levy if they don't respond within 14 days.</span>
          </div>

          {/* Tool grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {tools.map(t => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={t.action}
                  disabled={loading && activeTool === t.id}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${t.bg} ${isActive ? "ring-2 ring-primary/30" : ""}`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${t.color}`} />
                  <div>
                    <p className={`text-xs font-semibold ${t.color}`}>{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active tool results */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </div>
          )}

          {activeTool === "demand" && !loading && demandLetter && (
            <DemandLetterCard letter={demandLetter} />
          )}

          {activeTool === "plan" && !loading && (
            <div>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-xs font-medium text-muted-foreground">Installments:</label>
                {[2, 3, 4, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => { setPlanMonths(n); setPaymentPlan(null); }}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${planMonths === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary/50"}`}
                  >
                    {n} months
                  </button>
                ))}
                <button
                  onClick={generatePlan}
                  className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" /> Calculate
                </button>
              </div>
              {paymentPlan && <PaymentPlanCard plan={paymentPlan} />}
            </div>
          )}

          {activeTool === "garnishment" && !loading && (
            <EnforcementForm type="garnishment" caseId={caseData.id} onClose={() => setActiveTool(null)} />
          )}

          {activeTool === "levy" && !loading && (
            <EnforcementForm type="levy" caseId={caseData.id} onClose={() => setActiveTool(null)} />
          )}

          {/* Escalation guide */}
          <div className="border-t border-border/40 pt-3 mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Escalation Path</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              {["Demand Letter", "→", "Payment Plan Offer", "→", "Wage Garnishment", "→", "Bank Levy"].map((s, i) => (
                <span key={i} className={s === "→" ? "text-border" : "px-2 py-0.5 bg-muted rounded-full"}>{s}</span>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground/60 mt-3 leading-relaxed">
            These tools generate self-help documents. Enforcement procedures vary by state — verify current rules with your local courthouse or a licensed attorney.
          </p>
        </div>
      )}
    </div>
  );
}
