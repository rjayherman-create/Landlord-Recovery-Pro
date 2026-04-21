import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Scale,
  Gavel,
  Users,
  Calendar,
  Edit2,
  Check,
  X,
} from "lucide-react";
import {
  getCase,
  getCourtSummaryUrl,
  getDemandLetterUrl,
  updateCaseStatus,
  type SmallClaimsCase,
} from "../lib/api";

const CLAIM_TYPE_LABELS: Record<string, string> = {
  breach_of_contract: "Breach of Contract",
  security_deposit: "Security Deposit",
  property_damage: "Property Damage",
  unpaid_wages: "Unpaid Wages",
  consumer_dispute: "Consumer Dispute",
  landlord_tenant: "Landlord / Tenant",
  negligence: "Negligence",
  personal_property: "Personal Property",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle; description: string }
> = {
  draft:             { label: "Draft",               color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   icon: Clock,        description: "Case is being prepared." },
  ready:             { label: "Ready to File",        color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle,  description: "Your documents are ready to submit at the courthouse." },
  filed:             { label: "Filed",                color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   icon: FileText,     description: "Your claim has been filed with the court." },
  served:            { label: "Defendant Served",     color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200", icon: Users,        description: "The defendant has been officially notified." },
  waiting:           { label: "Waiting for Response", color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  icon: Clock,        description: "The defendant has time to respond or pay." },
  settled:           { label: "Settled",              color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle,  description: "The case was resolved through settlement." },
  hearing_scheduled: { label: "Hearing Scheduled",    color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", icon: Calendar,     description: "A court date has been scheduled." },
  judgment_awarded:  { label: "Judgment Awarded",     color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: Gavel,        description: "The court has issued a judgment in your favor." },
  closed:            { label: "Closed",               color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   icon: CheckCircle,  description: "This case has been closed." },
  dismissed:         { label: "Dismissed",            color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   icon: AlertCircle,  description: "The case was dismissed by the court." },
  won:               { label: "Won",                  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle,  description: "You won your case." },
  lost:              { label: "Closed / Lost",         color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   icon: AlertCircle,  description: "The case was decided in favor of the defendant." },
};

const STATUS_ORDER = [
  "draft", "ready", "filed", "served", "waiting",
  "hearing_scheduled", "judgment_awarded", "settled", "dismissed", "won", "lost", "closed",
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function StatusEditor({
  item,
  onSave,
}: {
  item: SmallClaimsCase;
  onSave: (status: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(newStatus);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 bg-background hover:bg-secondary/50 transition-colors"
      >
        <Edit2 className="w-3 h-3" />
        Update Status
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s]?.label ?? s}
              </option>
            ))}
          </select>
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
              onClick={() => setOpen(false)}
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

function DemandLetterButton({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(false);
    setLetter("");
    try {
      const res = await fetch(getDemandLetterUrl(caseId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLetter(data.letter ?? "");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 border border-border text-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-secondary/50 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {loading ? "Generating…" : "Generate Demand Letter"}
      </button>
      {error && (
        <p className="text-xs text-destructive mt-2">Failed to generate letter. Please try again.</p>
      )}
      {letter && (
        <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-200">
            <span className="text-xs font-semibold text-blue-800">Generated Demand Letter</span>
            <button
              onClick={copy}
              className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs font-mono text-foreground p-4 max-h-64 overflow-y-auto bg-white leading-relaxed">
            {letter}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function CaseResultPage() {
  const [, params] = useRoute("/cases/:id/result");
  const id = params?.id ?? "";
  const [, setLocation] = useLocation();
  const [item, setItem] = useState<SmallClaimsCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCase(id)
      .then((data) => setItem(data.case))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(status: string) {
    const res = await updateCaseStatus(id, status);
    setItem(res.case);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Case not found.</p>
        <button
          onClick={() => setLocation("/cases")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Back to My Cases
        </button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
  const claimTypeLabel = CLAIM_TYPE_LABELS[item.claimType] ?? item.claimType;
  const isPaid = !!item.paidAt;
  const isWon = item.status === "won" || item.status === "judgment_awarded";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => setLocation(`/cases/${id}`)}
          className="mt-1 p-1.5 text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {claimTypeLabel} — vs. {item.defendantName}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3" /> {item.state}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> ${Number(item.claimAmount).toLocaleString()} claimed
            </span>
            {item.caseNumber && <span>Case #{item.caseNumber}</span>}
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5 mb-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Case Result
            </p>
            <StatusBadge status={item.status} />
            <p className={`text-sm mt-2 ${cfg.color} leading-relaxed`}>{cfg.description}</p>
            {item.hearingDate && (
              <div className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${cfg.color}`}>
                <Calendar className="w-3.5 h-3.5" />
                Hearing: {item.hearingDate}
              </div>
            )}
            {item.lastUpdate && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: {item.lastUpdate}
              </p>
            )}
          </div>
          <StatusEditor item={item} onSave={changeStatus} />
        </div>
      </div>

      {/* Case details */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Case Details</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Claimant</p>
            <p className="font-medium text-foreground">{item.claimantName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Defendant</p>
            <p className="font-medium text-foreground">{item.defendantName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Claim Type</p>
            <p className="font-medium text-foreground">{claimTypeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount Claimed</p>
            <p className="font-medium text-foreground">
              ${Number(item.claimAmount).toLocaleString()}
            </p>
          </div>
          {item.incidentDate && (
            <div>
              <p className="text-xs text-muted-foreground">Incident Date</p>
              <p className="font-medium text-foreground">{item.incidentDate}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Filed</p>
            <p className="font-medium text-foreground">
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        {item.claimDescription && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{item.claimDescription}</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Documents</h3>

        {isPaid ? (
          <a
            href={getCourtSummaryUrl(id)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Download Court Filing PDF
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete payment to unlock your court filing document.
          </p>
        )}

        {isWon && (
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-2">
              You won — send a demand letter to collect your judgment.
            </p>
            <DemandLetterButton caseId={id} />
          </div>
        )}
      </div>

      {/* Notes */}
      {item.notes && (
        <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.notes}</p>
        </div>
      )}
    </div>
  );
}
