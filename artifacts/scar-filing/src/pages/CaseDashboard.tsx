import { useState, useEffect, lazy, Suspense } from "react";
const CollectionToolkit = lazy(() => import("./CollectionToolkit").then(m => ({ default: m.CollectionToolkit })));
import { useLocation, useRoute } from "wouter";
import {
  CheckCircle, Clock, AlertCircle, Download, FileText, ArrowLeft,
  Scale, ExternalLink, Calendar, Gavel, DollarSign, Users, ChevronDown, ChevronUp,
  Edit2, Check, X
} from "lucide-react";

const API_BASE = "";

// ── Status configuration ──────────────────────────────────────────────────
type StatusKey = string;

const STATUS_CONFIG: Record<StatusKey, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof CheckCircle;
  description: string;
}> = {
  draft:              { label: "Draft",              color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",  icon: Clock,         description: "Case is being prepared." },
  ready:              { label: "Ready to File",      color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200", icon: CheckCircle,   description: "Your documents are ready to submit at the courthouse." },
  filed:              { label: "Filed",              color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",  icon: FileText,      description: "Your claim has been filed with the court." },
  served:             { label: "Defendant Served",   color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200",icon: Users,         description: "The defendant has been officially notified." },
  waiting:            { label: "Waiting for Response",color:"text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200", icon: Clock,         description: "The defendant has time to respond or pay." },
  settled:            { label: "Settled",            color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200", icon: CheckCircle,   description: "The case was resolved through settlement." },
  hearing_scheduled:  { label: "Hearing Scheduled",  color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200",icon: Calendar,      description: "A court date has been scheduled." },
  judgment_awarded:   { label: "Judgment Awarded",   color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200", icon: Gavel,         description: "The court has issued a judgment in your favor." },
  closed:             { label: "Closed",             color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",  icon: CheckCircle,   description: "This case has been closed." },
  dismissed:          { label: "Dismissed",          color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",  icon: AlertCircle,   description: "The case was dismissed by the court." },
  won:                { label: "Won",                color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200", icon: CheckCircle,   description: "You won your case." },
  lost:               { label: "Closed / Lost",      color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",  icon: AlertCircle,   description: "The case was decided in favor of the defendant." },
};

const NEXT_STEPS: Record<StatusKey, { action: string; tip: string }> = {
  draft:             { action: "Complete your case details and generate your statement of claim.", tip: "Go to File a Case to finish your filing." },
  ready:             { action: "Take your filing documents to your local small claims courthouse.", tip: "Bring 3 copies, a photo ID, and cash or money order for the filing fee." },
  filed:             { action: "Wait for the court to serve the defendant (usually 1–10 days).", tip: "You will receive a notification or case number from the court." },
  served:            { action: "The defendant has been notified. Many defendants pay or settle now.", tip: "If they contact you, be prepared to negotiate. See the After Filing guide for scripts." },
  waiting:           { action: "Most cases resolve here. Watch for payment or communication.", tip: "If there is no response after the deadline, you may be able to request a default judgment." },
  settled:           { action: "Confirm you have received full payment and keep all documentation.", tip: "File a dismissal with the court to close the case officially." },
  hearing_scheduled: { action: "Prepare your evidence and timeline. Bring everything to court.", tip: "Bring: this filing, your evidence, copies for the judge, and arrive 15 minutes early." },
  judgment_awarded:  { action: "If the defendant doesn't pay voluntarily, you can pursue collection.", tip: "Options include wage garnishment, bank levy, or payment plan enforcement." },
  closed:            { action: "Your case is closed. Keep all documentation for your records.", tip: "" },
  dismissed:         { action: "Review the dismissal reason and consult with a legal advisor if needed.", tip: "" },
  won:               { action: "If not already paid, pursue collection enforcement options.", tip: "Options include wage garnishment, bank levy, or property liens." },
  lost:              { action: "Review the court's decision. You may have limited appeal options.", tip: "Consult a licensed attorney in your jurisdiction for advice on next steps." },
};

const STATUS_ORDER = ["draft","ready","filed","served","waiting","hearing_scheduled","judgment_awarded","settled","closed"];

const CLAIM_TYPE_LABELS: Record<string, string> = {
  breach_of_contract: "Breach of Contract", security_deposit: "Security Deposit",
  property_damage: "Property Damage", unpaid_wages: "Unpaid Wages",
  consumer_dispute: "Consumer Dispute", landlord_tenant: "Landlord / Tenant",
  negligence: "Negligence", personal_property: "Personal Property",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function StatusCard({ caseData, onStatusUpdate }: { caseData: any; onStatusUpdate: () => void }) {
  const cfg = STATUS_CONFIG[caseData.status] ?? STATUS_CONFIG.draft;
  const [showUpdate, setShowUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState(caseData.status);
  const [note, setNote] = useState("");
  const [hearingDate, setHearingDate] = useState(caseData.hearingDate ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/cases/${caseData.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, lastUpdate: note || undefined, hearingDate: hearingDate || undefined }),
      });
      onStatusUpdate();
      setShowUpdate(false);
      setNote("");
    } finally { setSaving(false); }
  };

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5 mb-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current Status</p>
          <StatusBadge status={caseData.status} />
          <p className={`text-sm mt-2 ${cfg.color} leading-relaxed`}>{cfg.description}</p>
          {caseData.hearingDate && (
            <div className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${cfg.color}`}>
              <Calendar className="w-3.5 h-3.5" />
              Hearing: {caseData.hearingDate}
            </div>
          )}
          {caseData.lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2 italic">Note: {caseData.lastUpdate}</p>
          )}
        </div>
        <button
          onClick={() => setShowUpdate(v => !v)}
          className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 bg-background hover:bg-secondary/50 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Update
        </button>
      </div>

      {showUpdate && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">New Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
              ))}
              <option value="settled">Settled</option>
              <option value="dismissed">Dismissed</option>
              <option value="won">Won</option>
              <option value="lost">Closed / Lost</option>
            </select>
          </div>
          {newStatus === "hearing_scheduled" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hearing Date</label>
              <input
                type="text"
                placeholder="e.g. May 15, 2026 at 9:00 AM"
                value={hearingDate}
                onChange={e => setHearingDate(e.target.value)}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Add a note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Defendant served on April 20, settlement offered"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded-md hover:bg-secondary/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NextSteps({ status }: { status: string }) {
  const step = NEXT_STEPS[status] ?? NEXT_STEPS.draft;
  const [, setLocation] = useLocation();
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">What to Do Next</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{step.action}</p>
      {step.tip && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-800 leading-relaxed">
          💡 {step.tip}
        </div>
      )}
      <button
        onClick={() => setLocation("/what-happens-next")}
        className="mt-3 text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        Full post-filing guide <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}

function Timeline({ events }: { events: { date: string; event: string; type: string }[] }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Case Timeline</h3>
      <div className="space-y-0">
        {[...events].reverse().map((ev, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${ev.type === "paid" ? "bg-green-500" : ev.type === "update" ? "bg-blue-500" : "bg-primary"}`} />
              {i < events.length - 1 && <div className="w-px flex-1 bg-border my-1" style={{ minHeight: 16 }} />}
            </div>
            <div className={`pb-4 ${i === events.length - 1 ? "pb-0" : ""}`}>
              <p className="text-sm text-foreground">{ev.event}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceList({ files }: { files: any[] }) {
  const [open, setOpen] = useState(true);
  if (!files || files.length === 0) return null;
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-semibold text-foreground">Your Evidence ({files.length} file{files.length !== 1 ? "s" : ""})</h3>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {files.map((f: any, i: number) => (
            <li key={f.id ?? i} className="flex items-center gap-2 text-sm">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-foreground truncate flex-1">{f.fileName}</span>
              <span className="text-xs text-muted-foreground shrink-0">{f.mimeType?.split("/")[1] ?? "file"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DownloadSection({ caseData }: { caseData: any }) {
  const isPaid = !!caseData.paidAt;
  const [, setLocation] = useLocation();

  if (!isPaid) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Court Filing Document</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Complete payment to unlock and download your professionally formatted court filing document.
        </p>
        <button
          onClick={() => setLocation("/file")}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          Continue Filing
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Court Filing Document</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Your document is ready. Download it to print and bring to court.
      </p>
      <a
        href={`${API_BASE}/api/small-claims/download/${caseData.id}`}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Download Court PDF
      </a>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function CaseDashboard() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/cases/:id");
  const caseId = params?.id ? Number(params.id) : null;
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/dashboard`);
      if (!res.ok) throw new Error("not_found");
      setDashData(await res.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [caseId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted/40 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (error || !dashData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground">Case not found.</p>
        <button onClick={() => setLocation("/cases")} className="mt-4 text-sm text-primary hover:underline">
          Back to My Cases
        </button>
      </div>
    );
  }

  const { case: c, evidence, timeline } = dashData;
  const claimTypeLabel = CLAIM_TYPE_LABELS[c.claimType] ?? c.claimType;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => setLocation("/cases")}
          className="mt-1 p-1.5 text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              {claimTypeLabel} — vs. {c.defendantName}
            </h1>
            {c.paidAt && (() => {
              const plan = c.plan ?? "basic";
              const planCfg = {
                basic:    { label: "Basic",    cls: "bg-blue-50 border-blue-200 text-blue-700" },
                standard: { label: "Standard", cls: "bg-primary/10 border-primary/30 text-primary" },
                premium:  { label: "Premium",  cls: "bg-amber-50 border-amber-300 text-amber-700" },
              }[plan] ?? { label: plan, cls: "bg-muted border-border text-muted-foreground" };
              return (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${planCfg.cls}`}>
                  {planCfg.label}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {c.state}</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${Number(c.claimAmount).toLocaleString()} claimed</span>
            {c.caseNumber && <span>Case #{c.caseNumber}</span>}
            <span>Filed {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Main sections */}
      <StatusCard caseData={c} onStatusUpdate={load} />
      <NextSteps status={c.status} />

      {/* Evidence Analysis — Standard & Premium only */}
      {c.paidAt && (() => {
        const plan = c.plan ?? "basic";
        const hasAnalysis = plan === "standard" || plan === "premium";
        if (!hasAnalysis) {
          return (
            <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Evidence Checklist & Analysis</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get a tailored evidence checklist and AI analysis of what documents strengthen your case.
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-primary/10 border-primary/30 text-primary uppercase tracking-wide">Standard+</span>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                Upgrade to Standard ($49) or Premium ($79) to unlock evidence analysis, filing timeline builder, and post-filing guidance.
              </div>
            </div>
          );
        }
        return (
          <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Evidence Checklist</h3>
            <p className="text-xs text-muted-foreground mb-3">Documents that typically strengthen a {c.claimType?.replace(/_/g, " ")} case.</p>
            <ul className="space-y-1.5">
              {[
                "Contracts or written agreements",
                "Invoices, receipts, or payment records",
                "Photos or video evidence",
                "Correspondence (emails, texts, letters)",
                "Witness statements or contact info",
                "Any prior attempts to resolve the dispute",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 w-4 h-4 rounded border border-border flex items-center justify-center shrink-0 text-muted-foreground/60 text-xs">☐</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 italic">Organize these in the order events occurred. Courts respond well to clear timelines.</p>
          </div>
        );
      })()}

      {/* Collection Toolkit — Premium only */}
      {c.paidAt && (() => {
        const plan = c.plan ?? "basic";
        if (plan !== "premium") {
          return (
            <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Post-Judgment Collection Toolkit</h3>
                  <p className="text-xs text-muted-foreground">
                    Demand letter templates, wage garnishment guides, and bank levy instructions to collect after you win.
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 border-amber-300 text-amber-700 uppercase tracking-wide">Premium</span>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 mt-3 text-xs text-muted-foreground">
                Upgrade to Premium ($79) to unlock the full collection toolkit.
              </div>
            </div>
          );
        }
        return (
          <Suspense fallback={null}>
            <CollectionToolkit caseData={c} />
          </Suspense>
        );
      })()}

      <Timeline events={timeline} />
      <EvidenceList files={evidence} />
      <DownloadSection caseData={c} />
    </div>
  );
}
