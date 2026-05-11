import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useListLandlordCases } from "@workspace/api-client-react";
import { useClerkEnabled } from "@/context/ClerkEnabled";
import { useSubscription } from "@/hooks/useSubscription";
import {
  FileText, CheckCircle2, AlertTriangle, Lock, ArrowRight,
  Upload, Clock3, DollarSign, User, Home, PlusCircle,
  ChevronDown, Download, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkflowStep {
  label: string;
  complete: boolean;
}

interface RecommendedDoc {
  title: string;
  status: "ready" | "needs-info" | "locked";
  description: string;
  actionLabel: string;
  href: string;
}

// ─── Demo data (shown to logged-out users / empty accounts) ─────────────────

const DEMO_CASE = {
  id: null as null,
  propertyAddress: "145 Oak Street, Unit 2B",
  tenantName: "John Smith",
  claimAmount: 4850,
  status: "draft" as const,
  claimType: "unpaid_rent,property_damage",
  stepsComplete: 3,
  totalSteps: 5,
};

const DEMO_STEPS: WorkflowStep[] = [
  { label: "Property & Tenant Information", complete: true },
  { label: "Rent Owed & Lease Violations", complete: true },
  { label: "Upload Evidence", complete: true },
  { label: "Generate Notices", complete: false },
  { label: "Prepare Court Filing", complete: false },
];

const DEMO_DOCS: RecommendedDoc[] = [
  { title: "7-Day Pay or Quit Notice", status: "ready", description: "Generated from unpaid rent information.", actionLabel: "Open", href: "/documents" },
  { title: "Security Deposit Deduction Letter", status: "needs-info", description: "Requires damage photos and repair costs.", actionLabel: "Complete", href: "/documents" },
  { title: "Small Claims Filing Packet", status: "locked", description: "Unlock with Pro to download your court-ready PDF.", actionLabel: "Unlock", href: "/pricing" },
  { title: "Service Instructions", status: "ready", description: "Instructions for serving the tenant properly.", actionLabel: "Open", href: "/documents" },
  { title: "Evidence Checklist", status: "ready", description: "Recommended evidence for your claim type.", actionLabel: "Open", href: "/documents" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STAGES = ["draft", "demand_sent", "no_response", "filed", "hearing_scheduled", "judgment", "collection", "closed"];

function stageIndex(status: string) {
  return STATUS_STAGES.indexOf(status);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function getStageBadgeLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Pre-Filing Stage",
    demand_sent: "Demand Sent",
    no_response: "No Response",
    filed: "Filed",
    hearing_scheduled: "Hearing Scheduled",
    judgment: "Judgment Obtained",
    collection: "Collection",
    closed: "Closed",
  };
  return labels[status] ?? status;
}

function getStageBadgeColor(status: string) {
  if (status === "draft" || status === "demand_sent") return "bg-red-50 text-red-700 border-red-200";
  if (status === "no_response" || status === "filed") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "hearing_scheduled") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function buildWorkflowSteps(c: any): WorkflowStep[] {
  const stage = stageIndex(c.status);
  return [
    { label: "Property & Tenant Information", complete: !!(c.tenantName && c.propertyAddress) },
    { label: "Rent Owed & Lease Violations",  complete: !!(c.claimAmount && c.claimAmount > 0 && c.claimType) },
    { label: "Upload Evidence",               complete: false },
    { label: "Generate Notices",              complete: stage >= stageIndex("demand_sent") },
    { label: "Prepare Court Filing",          complete: stage >= stageIndex("filed") },
  ];
}

function buildRecommendedDocs(c: any, isPro: boolean): RecommendedDoc[] {
  const caseHref = `/cases/${c.id}`;
  const hasRent = (c.claimType ?? "").includes("unpaid_rent");
  const hasDamage = (c.claimType ?? "").includes("property_damage") || (c.claimType ?? "").includes("security_deposit");
  const hasParties = !!(c.tenantName && c.propertyAddress && c.claimAmount);

  return [
    {
      title: "Demand / Pay or Quit Notice",
      status: hasParties ? "ready" : "needs-info",
      description: hasParties
        ? "Generated from your case information — ready to view and send."
        : "Complete tenant and property info to generate this notice.",
      actionLabel: hasParties ? "Open" : "Complete",
      href: caseHref,
    },
    {
      title: "Security Deposit Deduction Letter",
      status: hasDamage ? "needs-info" : "ready",
      description: hasDamage
        ? "Add damage photos and repair cost receipts to finalize this letter."
        : "Available based on your claim type.",
      actionLabel: hasDamage ? "Add Evidence" : "Open",
      href: caseHref,
    },
    {
      title: "Small Claims Filing Packet",
      status: isPro ? (hasParties ? "ready" : "needs-info") : "locked",
      description: isPro
        ? "Complete your case info to download a court-ready PDF packet."
        : "Upgrade to Pro to download a court-ready PDF filing packet.",
      actionLabel: isPro ? "Open" : "Unlock",
      href: isPro ? caseHref : "/pricing",
    },
    {
      title: "Service Instructions",
      status: hasParties ? "ready" : "needs-info",
      description: "Step-by-step instructions for serving the defendant properly.",
      actionLabel: hasParties ? "Open" : "Complete",
      href: caseHref,
    },
    {
      title: "Evidence Checklist",
      status: "ready",
      description: "Recommended evidence items for your claim type and state.",
      actionLabel: "Open",
      href: caseHref,
    },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocStatusBadge({ status }: { status: RecommendedDoc["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </span>
    );
  }
  if (status === "needs-info") {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full">
        <AlertTriangle className="h-3 w-3" /> Needs Info
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border text-xs font-semibold px-2 py-0.5 rounded-full">
      <Lock className="h-3 w-3" /> Locked
    </span>
  );
}

function DocActionButton({ doc }: { doc: RecommendedDoc }) {
  const base = "px-4 py-2 rounded-xl text-sm font-medium transition-colors";
  if (doc.status === "ready") {
    return (
      <Link href={doc.href}>
        <button className={`${base} bg-foreground hover:opacity-90 text-background`}>{doc.actionLabel}</button>
      </Link>
    );
  }
  if (doc.status === "needs-info") {
    return (
      <Link href={doc.href}>
        <button className={`${base} bg-amber-500 hover:bg-amber-600 text-white`}>{doc.actionLabel}</button>
      </Link>
    );
  }
  return (
    <Link href={doc.href}>
      <button className={`${base} bg-muted text-muted-foreground hover:bg-muted/80`}>{doc.actionLabel}</button>
    </Link>
  );
}

// ─── Main workspace ──────────────────────────────────────────────────────────

interface WorkspaceProps {
  propertyAddress: string;
  tenantName: string;
  claimAmount: number;
  status: string;
  steps: WorkflowStep[];
  docs: RecommendedDoc[];
  caseId: number | null;
  isDemo?: boolean;
}

function RecoveryWorkspace({ propertyAddress, tenantName, claimAmount, status, steps, docs, caseId, isDemo }: WorkspaceProps) {
  const [, navigate] = useLocation();
  const completedSteps = steps.filter(s => s.complete).length;
  const pct = Math.round((completedSteps / steps.length) * 100);
  const readyCount = docs.filter(d => d.status === "ready").length;

  const quickActions = caseId
    ? [
        { icon: Upload,     label: "Upload Move-Out Photos",     href: `/cases/${caseId}` },
        { icon: FileText,   label: "Add Repair Invoices",        href: `/cases/${caseId}` },
        { icon: DollarSign, label: "Enter Additional Charges",   href: `/cases/${caseId}` },
      ]
    : [
        { icon: Upload,     label: "Upload Move-Out Photos",     href: "/cases/new" },
        { icon: FileText,   label: "Add Repair Invoices",        href: "/cases/new" },
        { icon: DollarSign, label: "Enter Additional Charges",   href: "/cases/new" },
      ];

  return (
    <div className="space-y-6">
      {/* Demo banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <span className="text-amber-800">
            <strong>Preview mode.</strong> Sign in and create a case to see your real documents and workflow.
          </span>
          <div className="flex gap-2 shrink-0">
            <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-foreground text-background hover:opacity-90">
              <Link href="/cases/new">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                New Case
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Case header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border mb-3 ${getStageBadgeColor(status)}`}>
              {getStageBadgeLabel(status)}
            </span>
            <h2 className="text-2xl font-serif font-bold text-foreground">{propertyAddress}</h2>
            <div className="flex flex-wrap gap-6 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><User className="h-4 w-4" /> {tenantName}</span>
              <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Owed: {formatCurrency(claimAmount)}</span>
            </div>
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Case Completion</span>
              <span className="text-sm font-bold text-foreground">{pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div className="bg-foreground h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedSteps} of {steps.length} workflow steps complete.
            </p>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* Left panel */}
        <div className="space-y-5">

          {/* Recovery steps */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-5">Recovery Workflow</h3>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    step.complete ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {step.complete ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-snug">{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.complete ? "Completed" : "Pending"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {quickActions.map(({ icon: Icon, label, href }) => (
                <Link key={label} href={href}>
                  <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors rounded-xl px-4 py-3.5 text-left">
                    <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — documents */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="border-b border-border px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recommended Documents</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically suggested based on your case type.</p>
            </div>
            {caseId && (
              <Button
                size="sm"
                className="bg-foreground text-background hover:opacity-90"
                onClick={() => navigate(`/cases/${caseId}`)}
              >
                Open Case
              </Button>
            )}
          </div>

          <div className="divide-y divide-border">
            {docs.map((doc, i) => (
              <div key={i} className="px-6 py-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <h4 className="text-sm font-semibold text-foreground">{doc.title}</h4>
                        <DocStatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <DocActionButton doc={doc} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/30 border-t border-border px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Filing Packet Progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">{readyCount} of {docs.length} documents are ready.</p>
            </div>
            {caseId ? (
              <Button
                className="bg-foreground text-background hover:opacity-90"
                onClick={() => navigate(`/cases/${caseId}`)}
              >
                Continue Recovery Process
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button asChild className="bg-foreground text-background hover:opacity-90">
                <Link href="/cases/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Start a Real Case
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Documents() {
  const clerkEnabled = useClerkEnabled();
  const { data: subscription } = useSubscription();
  const isPro = subscription?.isPro ?? false;
  const { data: cases, isLoading } = useListLandlordCases();
  const activeCases = useMemo(() => (cases ?? []).filter((c: any) => !c.archived), [cases]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  const selectedCase = useMemo(() => {
    if (!activeCases.length) return null;
    const id = selectedCaseId ? Number(selectedCaseId) : activeCases[0].id;
    return activeCases.find((c: any) => c.id === id) ?? activeCases[0];
  }, [activeCases, selectedCaseId]);

  const steps = useMemo(() => selectedCase ? buildWorkflowSteps(selectedCase) : DEMO_STEPS, [selectedCase]);
  const docs  = useMemo(() => selectedCase ? buildRecommendedDocs(selectedCase, isPro) : DEMO_DOCS, [selectedCase, isPro]);

  const isDemo = !isLoading && !selectedCase;

  const activeData = selectedCase
    ? {
        propertyAddress: selectedCase.propertyAddress,
        tenantName: selectedCase.tenantName,
        claimAmount: selectedCase.claimAmount,
        status: selectedCase.status,
        caseId: selectedCase.id as number,
      }
    : {
        propertyAddress: DEMO_CASE.propertyAddress,
        tenantName: DEMO_CASE.tenantName,
        claimAmount: DEMO_CASE.claimAmount,
        status: DEMO_CASE.status,
        caseId: null,
      };

  return (
    <div className="py-10 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Recovery Workspace</h1>
            <p className="text-muted-foreground mt-1">
              Track your case progress and access documents at every stage of recovery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeCases.length > 1 && (
              <Select
                value={selectedCaseId || String(activeCases[0]?.id ?? "")}
                onValueChange={setSelectedCaseId}
              >
                <SelectTrigger className="w-56 bg-background">
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent>
                  {activeCases.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.propertyAddress.length > 32 ? c.propertyAddress.slice(0, 32) + "…" : c.propertyAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/cases/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Case
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            Loading your cases...
          </div>
        ) : (
          <RecoveryWorkspace
            {...activeData}
            steps={steps}
            docs={docs}
            isDemo={isDemo}
          />
        )}

      </div>
    </div>
  );
}
