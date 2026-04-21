import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCases, deleteCase, SmallClaimsCase } from "../lib/api";
import {
  Scale,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Trash2,
} from "lucide-react";

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

const CLAIM_TYPE_ICONS: Record<string, string> = {
  breach_of_contract: "📄",
  security_deposit: "🏠",
  property_damage: "🔨",
  unpaid_wages: "💼",
  consumer_dispute: "🛒",
  landlord_tenant: "🔑",
  negligence: "⚖️",
  personal_property: "📦",
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  draft:             { label: "Draft",               icon: Clock,         color: "text-muted-foreground bg-muted" },
  ready:             { label: "Ready to File",        icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  filed:             { label: "Filed",                icon: FileText,      color: "text-blue-700 bg-blue-50 border border-blue-200" },
  served:            { label: "Defendant Served",     icon: CheckCircle,   color: "text-purple-700 bg-purple-50 border border-purple-200" },
  waiting:           { label: "Waiting for Response", icon: Clock,         color: "text-amber-700 bg-amber-50 border border-amber-200" },
  settled:           { label: "Settled",              icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  hearing_scheduled: { label: "Hearing Scheduled",    icon: AlertCircle,   color: "text-orange-700 bg-orange-50 border border-orange-200" },
  judgment_awarded:  { label: "Judgment Awarded",     icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  closed:            { label: "Closed",               icon: AlertCircle,   color: "text-muted-foreground bg-muted" },
  won:               { label: "Won",                  icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  lost:              { label: "Closed / Lost",         icon: AlertCircle,   color: "text-muted-foreground bg-muted" },
  dismissed:         { label: "Dismissed",            icon: AlertCircle,   color: "text-muted-foreground bg-muted" },
};

export default function CaseListPage() {
  const [cases, setCases] = useState<SmallClaimsCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadCases() {
    setLoading(true);
    setError(false);
    getCases()
      .then(setCases)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCases();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this case? This cannot be undone.")) return;
    try {
      await deleteCase(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setCases((prev) => prev); // keep existing state; error surfaced via no change
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Failed to load cases. Please try again.</p>
        <button
          onClick={loadCases}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">My Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {cases.length > 0
              ? `${cases.length} case${cases.length !== 1 ? "s" : ""}`
              : "No cases yet"}
          </p>
        </div>
        <Link
          href="/file"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <Scale className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">No cases yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Start by filing your first small claims case. Our AI will guide you through the entire
            process.
          </p>
          <Link
            href="/file"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Start My First Case
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            return (
              <Link key={c.id} href={`/cases/${c.id}`}>
                <div className="bg-card border border-card-border rounded-lg p-4 hover:border-primary/30 transition-colors group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl shrink-0 mt-0.5">
                      {CLAIM_TYPE_ICONS[c.claimType] ?? "⚖️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-sm text-foreground">
                            {CLAIM_TYPE_LABELS[c.claimType] ?? c.claimType} — vs. {c.defendantName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.claimantName} · {c.state} · ${Number(c.claimAmount).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {c.claimDescription && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {c.claimDescription}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <div className="flex items-center gap-3">
                          {c.status === "draft" && (
                            <span className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                              Continue <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                          {c.generatedStatement && (
                            <span className="text-xs text-green-700 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Statement ready
                            </span>
                          )}
                          {c.paidAt && (
                            <a
                              href={`/api/small-claims/download/${c.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                              title="Download court PDF"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </a>
                          )}
                          <span className="text-xs text-primary inline-flex items-center gap-1">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
