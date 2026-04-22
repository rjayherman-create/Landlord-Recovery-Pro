import { useMemo, useState } from "react";
import { useGetLandlordStats, useListLandlordCases } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  PlusCircle, TrendingUp, AlertCircle, CheckCircle2, ArrowRight,
  Briefcase, Trophy, DollarSign, Clock, ChevronRight, X, FileText, Map, BookOpen, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CaseStatusBadge, ClaimTypeBadge } from "@/components/shared/CaseStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// ── Status → next action mapping ─────────────────────────────────────────────
const NEXT_ACTION: Record<string, { label: string; urgency: "high" | "medium" | "low" }> = {
  draft:              { label: "Send demand letter",       urgency: "medium" },
  demand_sent:        { label: "Follow up — await reply",  urgency: "low"    },
  no_response:        { label: "File in court",            urgency: "high"   },
  filed:              { label: "Serve tenant (Required)",  urgency: "high"   },
  hearing_scheduled:  { label: "Prepare for hearing",      urgency: "medium" },
  judgment:           { label: "Begin collection",         urgency: "medium" },
  collection:         { label: "Track payments",           urgency: "low"    },
  closed:             { label: "Closed",                   urgency: "low"    },
};

const URGENCY_STYLE = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low:    "bg-gray-100 text-gray-600 border-gray-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
  "bg-rose-100 text-rose-800",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

// ── Onboarding Checklist steps ────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { icon: <FileText className="h-4 w-4 text-accent" />, label: "Create your first case", href: "/cases/new", done: (cases: any[]) => cases.length > 0 },
  { icon: <Scale className="h-4 w-4 text-accent" />, label: "Send a formal demand letter", href: null, done: (cases: any[]) => cases.some((c: any) => c.status !== "draft") },
  { icon: <Map className="h-4 w-4 text-accent" />, label: "Locate your small claims court", href: "/how-it-works", done: (_: any[]) => false },
  { icon: <BookOpen className="h-4 w-4 text-accent" />, label: "Review your state's filing limits", href: "/resources", done: (_: any[]) => false },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetLandlordStats();
  const { data: cases, isLoading: casesLoading } = useListLandlordCases();
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem("lr_onboarding_dismissed") === "true"; } catch { return false; }
  });
  const dismissOnboarding = () => {
    try { localStorage.setItem("lr_onboarding_dismissed", "true"); } catch {}
    setOnboardingDismissed(true);
  };

  const totalClaimed   = stats?.totalClaimed   ?? 0;
  const totalRecovered = stats?.totalRecovered ?? 0;
  const activeCases    = stats?.activeCases    ?? 0;
  const wonCases       = stats?.wonCases       ?? 0;
  const outstanding    = Math.max(0, totalClaimed - totalRecovered);
  const recoveryRate   = totalClaimed > 0 ? Math.round((totalRecovered / totalClaimed) * 100) : 0;

  const recentCases = useMemo(() => (cases ?? []).slice(0, 5), [cases]);

  const nextActionCases = useMemo(() =>
    (cases ?? [])
      .filter((c) => c.status !== "closed")
      .map((c) => ({ ...c, action: NEXT_ACTION[c.status] ?? NEXT_ACTION.draft }))
      .filter((c) => c.action.urgency !== "low" || (cases?.filter(x => x.status !== "closed").length ?? 0) < 4)
      .slice(0, 3),
    [cases]
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your recovery efforts.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2">
          <Link href="/cases/new">
            <PlusCircle className="h-4 w-4" /> New Case
          </Link>
        </Button>
      </div>

      {/* ── Stats Row (5 cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Claimed"
          value={statsLoading ? null : formatCurrency(totalClaimed)}
          sub="All time"
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Total Recovered"
          value={statsLoading ? null : formatCurrency(totalRecovered)}
          sub="All time"
          icon={<DollarSign className="h-4 w-4 text-green-500" />}
          valueClass="text-green-600"
        />
        <StatCard
          label="Outstanding"
          value={statsLoading ? null : formatCurrency(outstanding)}
          sub="All time"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Active Cases"
          value={statsLoading ? null : String(activeCases)}
          sub="Currently open"
          icon={<Briefcase className="h-4 w-4 text-accent" />}
          isMoney={false}
        />
        <StatCard
          label="Won Cases"
          value={statsLoading ? null : String(wonCases)}
          sub="All time"
          icon={<Trophy className="h-4 w-4 text-accent" />}
          isMoney={false}
        />
      </div>

      {/* ── Onboarding Checklist ── */}
      {!onboardingDismissed && !casesLoading && (
        <Card className="border-accent/30 bg-accent/5 shadow-sm">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-3">Get started — your recovery roadmap</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ONBOARDING_STEPS.map((step, i) => {
                    const isDone = step.done(cases ?? []);
                    return (
                      <div key={i} className={`flex items-center gap-2.5 text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? "bg-green-500 border-green-500" : "border-accent/50 bg-background"}`}>
                          {isDone ? <CheckCircle2 className="h-3 w-3 text-white" /> : <span className="text-[9px] font-bold text-accent">{i + 1}</span>}
                        </div>
                        {step.href && !isDone ? (
                          <Link href={step.href} className="hover:text-primary hover:underline transition-colors">
                            {step.label}
                          </Link>
                        ) : (
                          <span>{step.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={dismissOnboarding}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recovery Rate ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Recovery Rate</span>
              {statsLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <span className="text-2xl font-bold text-primary">{recoveryRate}%</span>
              )}
              {!statsLoading && totalClaimed > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(totalRecovered)} of {formatCurrency(totalClaimed)} recovered
                </span>
              )}
            </div>
            {!statsLoading && totalClaimed > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
                Keep going — every payment counts
              </div>
            )}
          </div>
          {statsLoading ? (
            <Skeleton className="h-2 w-full" />
          ) : (
            <Progress value={recoveryRate} className="h-2.5" />
          )}
        </CardContent>
      </Card>

      {/* ── Next Actions ── */}
      {!casesLoading && nextActionCases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Next Actions
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/cases">
                View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <Card className="border-border shadow-sm divide-y divide-border">
            {nextActionCases.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.id)}`}>
                  {initials(c.tenantName)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.tenantName}</p>
                  <p className="text-xs text-muted-foreground truncate">{(c as any).propertyAddress || c.state}</p>
                </div>
                {/* Action badge */}
                <span className={`hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${URGENCY_STYLE[c.action.urgency]}`}>
                  {c.action.label}
                </span>
                {/* Continue */}
                <Button size="sm" variant="outline" asChild className="shrink-0 gap-1 text-xs">
                  <Link href={`/cases/${c.id}`}>
                    Continue <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── Recent Cases ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Recent Cases</h2>
          {cases && cases.length > 0 && (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/cases">
                View All Cases <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {casesLoading ? (
          <Card className="border-border shadow-sm">
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ) : recentCases.length > 0 ? (
          <Card className="border-border shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_120px_90px_80px_120px] items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Case</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Amount</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Updated</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</p>
            </div>
            <div className="divide-y divide-border">
              {recentCases.map((c, idx) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_90px_80px_120px] items-center gap-3 px-4 py-4 hover:bg-muted/20 transition-colors animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Case info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.id)}`}>
                      {initials(c.tenantName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{c.tenantName}</p>
                      <p className="text-xs text-muted-foreground truncate">{(c as any).propertyAddress || c.state}</p>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="md:block">
                    <CaseStatusBadge status={c.status} />
                  </div>
                  {/* Type */}
                  <div className="hidden md:block">
                    <ClaimTypeBadge type={c.claimType} />
                  </div>
                  {/* Amount */}
                  <div className="md:text-right">
                    <p className="font-semibold text-sm">{formatCurrency(Number(c.claimAmount))}</p>
                  </div>
                  {/* Last updated */}
                  <div className="hidden md:block text-right">
                    <p className="text-xs text-muted-foreground">{timeAgo((c as any).updatedAt || (c as any).createdAt)}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 md:justify-end">
                    <Button variant="ghost" size="sm" asChild className="text-xs h-8 text-muted-foreground">
                      <Link href={`/cases/${c.id}`}>View</Link>
                    </Button>
                    <Button size="sm" asChild className="text-xs h-8 gap-1">
                      <Link href={`/cases/${c.id}`}>
                        Continue <ChevronRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {cases && cases.length > 5 && (
              <div className="px-4 py-3 border-t border-border bg-muted/10 text-center">
                <p className="text-xs text-muted-foreground">
                  Showing 5 of {cases.length} cases.{" "}
                  <Link href="/cases" className="text-primary hover:underline font-medium">View all →</Link>
                </p>
              </div>
            )}
          </Card>
        ) : (
          <EmptyState
            title="No cases yet"
            description="Start recovering your losses by documenting your first case and sending a formal demand letter."
            actionLabel="Start a New Case"
            actionHref="/cases/new"
          />
        )}
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, valueClass = "", isMoney = true,
}: {
  label: string;
  value: string | null;
  sub?: string;
  icon: React.ReactNode;
  valueClass?: string;
  isMoney?: boolean;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        {value === null ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <p className={`text-xl font-bold tracking-tight ${valueClass || "text-foreground"}`}>{value}</p>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
