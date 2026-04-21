import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getCases, SmallClaimsCase } from "../lib/api";
import {
  Scale,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Gavel,
  TrendingUp,
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
  draft:              { label: "Draft",               icon: Clock,         color: "text-muted-foreground bg-muted" },
  ready:              { label: "Ready to File",        icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  filed:              { label: "Filed",                icon: FileText,      color: "text-blue-700 bg-blue-50 border border-blue-200" },
  served:             { label: "Defendant Served",     icon: CheckCircle,   color: "text-purple-700 bg-purple-50 border border-purple-200" },
  waiting:            { label: "Waiting",              icon: Clock,         color: "text-amber-700 bg-amber-50 border border-amber-200" },
  settled:            { label: "Settled",              icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  hearing_scheduled:  { label: "Hearing Scheduled",    icon: AlertCircle,   color: "text-orange-700 bg-orange-50 border border-orange-200" },
  judgment_awarded:   { label: "Judgment Awarded",     icon: Gavel,         color: "text-green-700 bg-green-50 border border-green-200" },
  closed:             { label: "Closed",               icon: AlertCircle,   color: "text-muted-foreground bg-muted" },
  won:                { label: "Won",                  icon: CheckCircle,   color: "text-green-700 bg-green-50 border border-green-200" },
  lost:               { label: "Closed / Lost",        icon: AlertCircle,   color: "text-muted-foreground bg-muted" },
  dismissed:          { label: "Dismissed",            icon: AlertCircle,   color: "text-muted-foreground bg-muted" },
};

const ACTIVE_STATUSES = new Set(["draft", "ready", "filed", "served", "waiting", "hearing_scheduled"]);
const SUCCESS_STATUSES = new Set(["settled", "judgment_awarded", "won"]);

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Scale;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function DashboardPage() {
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

  useEffect(() => { loadCases(); }, []);

  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter((c) => ACTIVE_STATUSES.has(c.status)).length;
    const successful = cases.filter((c) => SUCCESS_STATUSES.has(c.status)).length;
    const totalAmount = cases.reduce((sum, c) => sum + Number(c.claimAmount), 0);
    const hearingsSoon = cases.filter((c) => c.status === "hearing_scheduled").length;
    return { total, active, successful, totalAmount, hearingsSoon };
  }, [cases]);

  const recentCases = useMemo(
    () =>
      [...cases]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [cases],
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Failed to load dashboard. Please try again.</p>
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
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your small claims cases</p>
        </div>
        <Link
          href="/file"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={Scale}
          label="Total Cases"
          value={stats.total}
          sub={stats.total === 1 ? "1 case filed" : `${stats.total} cases filed`}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Clock}
          label="Active"
          value={stats.active}
          sub="In progress"
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={TrendingUp}
          label="Won / Settled"
          value={stats.successful}
          sub="Successful outcomes"
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={DollarSign}
          label="Total Claimed"
          value={`$${stats.totalAmount.toLocaleString()}`}
          sub="Across all cases"
          color="bg-blue-100 text-blue-700"
        />
      </div>

      {stats.hearingsSoon > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-8 text-sm text-orange-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            You have <strong>{stats.hearingsSoon}</strong> hearing
            {stats.hearingsSoon !== 1 ? "s" : ""} scheduled. Make sure you are prepared.
          </span>
          <Link href="/cases" className="ml-auto text-orange-700 hover:underline font-medium whitespace-nowrap">
            View cases
          </Link>
        </div>
      )}

      {/* Recent Cases */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">Recent Cases</h2>
        {cases.length > 5 && (
          <Link href="/cases" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {cases.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <Scale className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No cases yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            File your first small claims case and track it here from start to resolution.
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
          {recentCases.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            return (
              <Link key={c.id} href={`/cases/${c.id}`}>
                <div className="bg-card border border-card-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl shrink-0 mt-0.5">
                      {CLAIM_TYPE_ICONS[c.claimType] ?? "⚖️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium text-sm text-foreground">
                          {CLAIM_TYPE_LABELS[c.claimType] ?? c.claimType} — vs. {c.defendantName}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusCfg.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {c.claimantName} · {c.state} · ${Number(c.claimAmount).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all cases <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
