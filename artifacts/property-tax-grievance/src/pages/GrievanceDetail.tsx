import { useRoute, Link } from "wouter";
import { useGrievance, useUpdateGrievance, useDeleteGrievance } from "@/hooks/use-grievances";
import { useComparables, useAddComparable, useDeleteComparable } from "@/hooks/use-comparables";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GrievanceForm } from "@/components/GrievanceForm";
import { RP524PrintForm } from "@/components/RP524PrintForm";
import { CompsReportPrintForm, COMPS_REPORT_PRINT_CSS } from "@/components/CompsReportPrintForm";
import { FormsPrepPanel } from "@/components/FormsPrepPanel";
import { ValidationPanel } from "@/components/ValidationPanel";
import { WhatHappensNext } from "@/components/WhatHappensNext";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { CompsResearch } from "@/components/CompsResearch";
import { useFormValidation } from "@/hooks/use-form-validation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  MapPin, Building, Calendar, DollarSign, Trash2, Edit, AlertCircle, ArrowLeft, ArrowDown,
  Printer, Search, ExternalLink, Plus, Phone, Mail, Home, Hash, TrendingDown, TrendingUp,
  CheckCircle2, Circle, ChevronRight, Sparkles, Bell, BellOff, Loader2, Info,
  FileText, Minus, Lock
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getFilingInfo, getGenericFilingInfo, getComputedDeadline } from "@/data/county-filing-instructions";
import { getTxFilingInfo } from "@/data/texas-filing-instructions";
import { getNjFilingInfo } from "@/data/nj-filing-instructions";
import { getFlFilingInfo } from "@/data/florida-filing-instructions";
import type { Grievance } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reduced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-red-50 text-red-700 border-red-200",
};

const compSchema = z.object({
  address: z.string().min(5, "Address is required"),
  salePrice: z.coerce.number().positive("Required"),
  saleDate: z.string().min(1, "Required"),
  squareFeet: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  assessedValue: z.coerce.number().optional(),
  lotSize: z.string().optional(),
  yearBuilt: z.coerce.number().optional(),
  distance: z.string().optional(),
  sourceUrl: z.string().optional(),
  notes: z.string().optional(),
});
type CompFormValues = z.infer<typeof compSchema>;

interface AutoComp {
  address: string;
  salePrice: number;
  saleDate: string;
  squareFeet?: number;
  assessedValue?: number;
  yearBuilt?: number;
  distance?: string;
  sourceUrl: string;
  notes: string;
}

interface PriorYearData {
  priorYear: number | null;
  priorAssessment: number | null;
  priorMarketValue: number | null;
  currentAssessment: number;
  currentMarketValue: number;
  assessmentDelta: number | null;
  marketValueDelta: number | null;
  source: string;
}

function calcConfidence(grievance: Grievance, compsCount: number): { label: string; pct: number; color: string; bgColor: string; description: string } {
  const equalizationRate = grievance.equalizationRate ?? 100;
  const impliedFullValue = equalizationRate > 0
    ? grievance.currentAssessment / (Number(equalizationRate) / 100)
    : grievance.currentAssessment;
  const estimatedMV = grievance.estimatedMarketValue;
  const overassessmentPct = estimatedMV > 0
    ? ((impliedFullValue - estimatedMV) / estimatedMV) * 100
    : 0;

  let baseScore = Math.min(Math.max(overassessmentPct * 3, 0), 60);
  const compsBonus = Math.min(compsCount * 8, 30);
  const totalScore = Math.min(Math.round(baseScore + compsBonus), 95);

  if (totalScore >= 70) {
    return { label: "Strong", pct: totalScore, color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", description: `Your property appears overassessed by ~${Math.round(overassessmentPct)}%. With ${compsCount} comparable${compsCount !== 1 ? "s" : ""}, you have a strong case.` };
  } else if (totalScore >= 40) {
    return { label: "Moderate", pct: totalScore, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", description: overassessmentPct > 5 ? `Your property may be overassessed by ~${Math.round(overassessmentPct)}%. Adding more comparables will strengthen your case.` : "Add comparable sales to build a stronger argument." };
  }
  return { label: "Building", pct: totalScore, color: "text-slate-600", bgColor: "bg-slate-50 border-slate-200", description: "Add comparable sales and verify your market value estimate to build your case." };
}

export function GrievanceDetail() {
  const [, params] = useRoute("/grievances/:id");
  const id = parseInt(params?.id || "0");

  const { data: grievance, isLoading } = useGrievance(id);
  const { data: comparables = [] } = useComparables(id);
  const updateMutation = useUpdateGrievance();
  const deleteGrievanceMutation = useDeleteGrievance();
  const addCompMutation = useAddComparable(id);
  const deleteCompMutation = useDeleteComparable(id);

  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [autoComps, setAutoComps] = useState<AutoComp[]>([]);
  const [isLoadingAutoComps, setIsLoadingAutoComps] = useState(false);
  const [autoCompsLoaded, setAutoCompsLoaded] = useState(false);

  const [priorYear, setPriorYear] = useState<PriorYearData | null>(null);
  const [priorYearLoading, setPriorYearLoading] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem(`reminder-${id}`) === "true";
  });

  const [activeTab, setActiveTab] = useState("comps");
  const [isAttested, setIsAttested] = useState(false);

  const compForm = useForm<CompFormValues>({ resolver: zodResolver(compSchema) });

  useEffect(() => {
    if (!id) return;
    setPriorYearLoading(true);
    fetch(`/api/prior-year/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.priorYear) setPriorYear(d); })
      .catch(() => {})
      .finally(() => setPriorYearLoading(false));
  }, [id]);

  const fetchAutoComps = async () => {
    setIsLoadingAutoComps(true);
    try {
      const res = await fetch(`/api/auto-comparables?grievanceId=${id}`, { credentials: "include" });
      const data = await res.json();
      setAutoComps(Array.isArray(data) ? data : []);
      setAutoCompsLoaded(true);
    } catch {
      toast({ title: "Could not fetch comparables", variant: "destructive" });
    } finally {
      setIsLoadingAutoComps(false);
    }
  };

  const addAutoComp = async (comp: AutoComp) => {
    try {
      await addCompMutation.mutateAsync({
        data: {
          grievanceId: id,
          address: comp.address,
          salePrice: comp.salePrice,
          saleDate: comp.saleDate,
          squareFeet: comp.squareFeet,
          assessedValue: comp.assessedValue,
          yearBuilt: comp.yearBuilt,
          distance: comp.distance,
          sourceUrl: comp.sourceUrl,
          notes: comp.notes,
        }
      });
      toast({ title: "Comparable added" });
      setAutoComps((prev) => prev.filter((c) => c.address !== comp.address));
    } catch {
      toast({ title: "Error adding comparable", variant: "destructive" });
    }
  };

  const onStatusChange = async (newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: newStatus as any } });
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const onAddComp = async (data: CompFormValues) => {
    try {
      await addCompMutation.mutateAsync({ data: { grievanceId: id, ...data } });
      toast({ title: "Comparable added" });
      setIsAddCompOpen(false);
      compForm.reset();
    } catch {
      toast({ title: "Error adding comparable", variant: "destructive" });
    }
  };

  const handleDeleteComp = async (compId: number) => {
    if (confirm("Remove this comparable?")) {
      await deleteCompMutation.mutateAsync({ id: compId });
    }
  };

  const toggleReminder = () => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    localStorage.setItem(`reminder-${id}`, String(next));
    toast({
      title: next ? "Reminder set" : "Reminder removed",
      description: next
        ? grievance?.filingDeadline
          ? `You'll be reminded before ${format(new Date(grievance.filingDeadline), "MMMM d, yyyy")}`
          : "We'll remind you when your filing deadline approaches"
        : undefined,
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById("rp524-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>RP-524 — ${grievance?.propertyAddress}</title><style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; background: #fff; } @media print { body { margin: 0; } @page { margin: 0.5in; size: letter; } } .border { border-width: 1px; border-style: solid; } .border-gray-400 { border-color: #9ca3af; } .border-gray-800 { border-color: #1f2937; } .border-b { border-bottom-width: 1px; border-bottom-style: solid; } .border-t { border-top-width: 1px; border-top-style: solid; } .bg-gray-800 { background-color: #1f2937; } .bg-gray-100 { background-color: #f3f4f6; } .bg-gray-50 { background-color: #f9fafb; } .text-white { color: #fff; } .text-gray-600 { color: #4b5563; } .text-gray-700 { color: #374151; } .text-gray-900 { color: #111827; } .text-gray-500 { color: #6b7280; } .text-red-700 { color: #b91c1c; } .font-bold { font-weight: 700; } .font-extrabold { font-weight: 800; } .font-mono { font-family: monospace; } .font-medium { font-weight: 500; } .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; } .uppercase { text-transform: uppercase; } .tracking-wide { letter-spacing: 0.025em; } .italic { font-style: italic; } .leading-tight { line-height: 1.25; } .leading-relaxed { line-height: 1.625; } .leading-none { line-height: 1; } .grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, 1fr); } .grid-cols-3 { grid-template-columns: repeat(3, 1fr); } .gap-px { gap: 1px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; } .gap-8 { gap: 32px; } .gap-1 { gap: 4px; } .gap-1\\.5 { gap: 6px; } .gap-2 { gap: 8px; } .flex { display: flex; } .flex-1 { flex: 1; } .items-start { align-items: flex-start; } .items-center { align-items: center; } .mb-0\\.5 { margin-bottom: 2px; } .mb-1 { margin-bottom: 4px; } .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; } .mb-4 { margin-bottom: 16px; } .mt-0\\.5 { margin-top: 2px; } .pt-0\\.5 { padding-top: 2px; } .pt-1 { padding-top: 4px; } .pt-2 { padding-top: 8px; } .px-1 { padding-left: 4px; padding-right: 4px; } .px-2 { padding-left: 8px; padding-right: 8px; } .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; } .py-1 { padding-top: 4px; padding-bottom: 4px; } .p-1 { padding: 4px; } .p-2 { padding: 8px; } .pb-1 { padding-bottom: 4px; } .col-span-2 { grid-column: span 2; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #9ca3af; padding: 2px 4px; } th { background-color: #f3f4f6; font-weight: 700; } .w-3\\.5 { width: 14px; } .h-3\\.5 { height: 14px; } .whitespace-pre-wrap { white-space: pre-wrap; }</style></head><body>${printContent.innerHTML}<script>window.onload = () => { window.print(); }<\/script></body></html>`);
    win.document.close();
  };

  const handlePrintGated = () => {
    if (isAttested) {
      handlePrint();
    } else {
      setActiveTab("forms");
    }
  };

  const validation = useFormValidation(grievance, comparables);

  const handleValidationFix = (issue: { fixAction?: "edit" | "add-comp" | "find-comps" }) => {
    if (issue.fixAction === "edit") {
      setIsEditOpen(true);
    } else if (issue.fixAction === "add-comp") {
      setActiveTab("comps");
      setIsAddCompOpen(true);
    } else if (issue.fixAction === "find-comps") {
      setActiveTab("suggest");
    }
  };

  if (isLoading) return <AppLayout><div className="animate-pulse h-96 bg-secondary/50 rounded-2xl" /></AppLayout>;
  if (!grievance) return <AppLayout><div className="text-center py-20">Case not found</div></AppLayout>;

  const grievanceState: string = (grievance as any).state ?? "NY";
  const isTX = grievanceState === "TX";
  const isNJ = grievanceState === "NJ";
  const isFL = grievanceState === "FL";

  const equalizationRate = grievance.equalizationRate ?? 100;
  const impliedFullValue = Number(equalizationRate) > 0
    ? Math.round(grievance.currentAssessment / (Number(equalizationRate) / 100))
    : grievance.currentAssessment;

  const avgCompPrice = comparables.length > 0
    ? Math.round(comparables.reduce((a, b) => a + b.salePrice, 0) / comparables.length)
    : null;

  const confidence = calcConfidence(grievance, comparables.length);

  const filingInfo = isTX
    ? getTxFilingInfo(grievance.county) as any
    : isNJ
    ? getNjFilingInfo(grievance.county) as any
    : isFL
    ? getFlFilingInfo(grievance.county) as any
    : (getFilingInfo(grievance.county) ?? getGenericFilingInfo(grievance.county));

  const formName = isTX ? "Notice of Protest" : isNJ ? "A-1 Petition" : isFL ? "DR-486 Petition" : "RP-524";
  const assessmentLabel = isTX ? "Appraised Value" : isFL ? "Just Value" : "Assessment";
  const filingBodyLabel = isTX ? "County Appraisal District (CAD)" : isNJ ? "County Board of Taxation" : isFL ? "Value Adjustment Board (VAB)" : filingInfo.filingBody;
  const parcelLabel = isTX ? "CAD Account Number" : isNJ ? "Block/Lot Number" : isFL ? "Parcel ID / RE Number" : "Parcel ID";

  // Step-by-step checklist
  const steps = [
    {
      n: 1, label: "Property info", done: !!(grievance.propertyAddress && grievance.county && grievance.currentAssessment && grievance.parcelId),
      detail: grievance.parcelId ? `Owner, address, ${assessmentLabel.toLowerCase()}, ${parcelLabel}` : `⚠ ${parcelLabel} required — edit your case`,
    },
    {
      n: 2, label: "Comparable sales", done: comparables.length >= 3,
      detail: `${comparables.length} added (3 minimum recommended)`,
    },
    {
      n: 3, label: "Review & print form", done: grievance.status !== "draft",
      detail: grievance.status === "draft" ? `Prepare your ${formName}` : `Status: ${grievance.status}`,
    },
    {
      n: 4, label: isTX ? "File with CAD" : isNJ ? "File with County Board" : isFL ? "File with VAB" : "File with county", done: ["submitted","pending","reduced","denied"].includes(grievance.status),
      detail: `File with ${filingBodyLabel}`,
    },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  const handlePrintCompsReport = () => {
    const printContent = document.getElementById("comps-report-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=960,height=750");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Comparable Sales Analysis — ${grievance?.propertyAddress}</title><style>${COMPS_REPORT_PRINT_CSS}</style></head><body>${printContent.innerHTML}<script>window.onload = () => { window.print(); }<\/script></body></html>`);
    win.document.close();
  };

  return (
    <AppLayout>
      <div className="hidden" id="rp524-print">
        <RP524PrintForm grievance={grievance} comparables={comparables} state={grievanceState} />
      </div>
      <div className="hidden" id="comps-report-print">
        <CompsReportPrintForm grievance={grievance} comparables={comparables} />
      </div>

      {/* Back */}
      <div className="mb-5">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-1">{grievance.propertyAddress}</h1>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {grievance.municipality}, {grievance.county}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Tax Year {grievance.taxYear}</span>
              {grievance.parcelId && (
                <><span>•</span><span className="flex items-center gap-1"><Hash className="w-4 h-4" /> {grievance.parcelId}</span></>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={grievance.status} onValueChange={onStatusChange}>
              <SelectTrigger className={`w-[140px] border-2 font-medium uppercase text-xs tracking-wider ${STATUS_COLORS[grievance.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["draft","submitted","pending","reduced","denied"].map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrintCompsReport} className="gap-2" disabled={comparables.length === 0} title={comparables.length === 0 ? "Add comparable sales first" : "Print Comparable Sales Analysis PDF"}>
              <FileText className="w-4 h-4" /> Print Comps Report
            </Button>
            <Button variant="outline" onClick={handlePrintGated} className="gap-2" title={!isAttested ? "Complete the filer sign-off in Forms & PDF to unlock" : undefined}>
              <Printer className="w-4 h-4" /> Print {formName}
              {!isAttested && <Lock className="w-3 h-3 opacity-50" />}
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Edit className="w-4 h-4" /> Edit</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Edit Grievance</DialogTitle>
                </DialogHeader>
                <GrievanceForm initialData={grievance} onSuccess={() => setIsEditOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ── Deadline banner ── */}
      <DeadlineBanner
        county={grievance.county}
        countyDeadlineText={filingInfo.filingDeadline}
        specificDate={grievance.filingDeadline || getComputedDeadline(grievance.county)}
        portalUrl={filingInfo.onlinePortal?.url}
        portalLabel={filingInfo.onlinePortal?.label}
        status={grievance.status}
      />

      {/* ── Step-by-step progress ── */}
      <div className="mb-6 bg-card rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Filing Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            return (
              <div key={step.n} className={`relative flex flex-col gap-2 p-3 rounded-xl border transition-all ${step.done ? "bg-emerald-50 border-emerald-200" : isActive ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20" : "bg-secondary/30 border-border"}`}>
                <div className="flex items-center gap-2">
                  {step.done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    : isActive
                    ? <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-primary">{step.n}</span></div>
                    : <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                  }
                  <span className={`text-xs font-semibold ${step.done ? "text-emerald-800" : isActive ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">{step.detail}</p>
                {isActive && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Next</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── What happens next — shown after filing ── */}
      {grievance.status !== "draft" && (
        <div className="mb-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base">What happens now</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your case is <span className="font-semibold capitalize">{grievance.status}</span> — here is exactly what to expect and when.
              </p>
            </div>
          </div>
          <div className="p-5">
            <WhatHappensNext
              county={grievance.county}
              state={grievanceState}
              afterFiling={filingInfo.afterFiling}
              currentStatus={grievance.status}
              filedDate={grievance.filingDeadline}
            />
          </div>
        </div>
      )}

      {/* ── Confidence score + Prior year row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Confidence Score */}
        <div className={`rounded-2xl border p-5 ${confidence.bgColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Case Strength
            </h3>
            <span className={`text-2xl font-extrabold font-serif ${confidence.color}`}>{confidence.pct}%</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${confidence.label === "Strong" ? "bg-emerald-500" : confidence.label === "Moderate" ? "bg-amber-500" : "bg-slate-400"}`}
              style={{ width: `${confidence.pct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`${confidence.color} border-current font-semibold`}>{confidence.label} case</Badge>
            {comparables.length > 0 && (
              <span className="text-xs text-muted-foreground">{comparables.length} comp{comparables.length !== 1 ? "s" : ""} added</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{confidence.description}</p>
          {impliedFullValue > grievance.estimatedMarketValue && (
            <div className="mt-3 pt-3 border-t border-current/10 text-xs flex items-center gap-1.5 font-medium">
              <TrendingDown className="w-3.5 h-3.5" />
              Assessment implies ${impliedFullValue.toLocaleString()} market value — you estimate ${grievance.estimatedMarketValue.toLocaleString()}
            </div>
          )}
        </div>

        {/* Prior Year Comparison */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-serif font-bold text-base flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" /> Year-over-Year
          </h3>
          {priorYearLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading prior year data…
            </div>
          ) : priorYear ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{priorYear.priorYear} Assessment</p>
                  <p className="font-bold">{priorYear.priorAssessment ? `$${priorYear.priorAssessment.toLocaleString()}` : "N/A"}</p>
                </div>
                <div className="bg-secondary/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{grievance.taxYear} Assessment</p>
                  <p className="font-bold">${grievance.currentAssessment.toLocaleString()}</p>
                </div>
              </div>
              {priorYear.assessmentDelta !== null && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${priorYear.assessmentDelta > 5 ? "bg-red-50 text-red-700 border border-red-200" : priorYear.assessmentDelta < 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-secondary/40 text-muted-foreground"}`}>
                  {priorYear.assessmentDelta > 0
                    ? <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    : priorYear.assessmentDelta < 0
                    ? <TrendingDown className="w-4 h-4 flex-shrink-0" />
                    : <Minus className="w-4 h-4 flex-shrink-0" />
                  }
                  Assessment {priorYear.assessmentDelta > 0 ? "increased" : priorYear.assessmentDelta < 0 ? "decreased" : "unchanged"} {Math.abs(priorYear.assessmentDelta)}% from {priorYear.priorYear}
                  {priorYear.assessmentDelta > 5 && (
                    <span className="ml-auto text-xs font-bold bg-red-100 px-1.5 py-0.5 rounded">Use this!</span>
                  )}
                </div>
              )}
              {priorYear.assessmentDelta !== null && priorYear.assessmentDelta > 5 && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  A jump of {priorYear.assessmentDelta}% in one year is a strong argument for overassessment — mention this in your complaint.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              {grievance.parcelId
                ? "No prior year data in our database for this parcel. Check your county assessor's website for historical assessment records."
                : "Add your Parcel ID (from your tax bill) to enable prior year comparison."}
            </p>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: property details */}
        <div className="lg:col-span-1 space-y-5">
          {/* Owner */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-serif font-bold text-base mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" /> Owner / Complainant
            </h3>
            <dl className="space-y-2.5 text-sm">
              <div><dt className="text-muted-foreground text-xs mb-0.5">Name</dt><dd className="font-medium">{grievance.ownerName}</dd></div>
              {grievance.ownerPhone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3 h-3" /><span>{grievance.ownerPhone}</span></div>}
              {grievance.ownerEmail && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3 h-3" /><span>{grievance.ownerEmail}</span></div>}
              {grievance.ownerMailingAddress && <div><dt className="text-muted-foreground text-xs mb-0.5">Mailing Address</dt><dd className="text-muted-foreground text-xs">{grievance.ownerMailingAddress}</dd></div>}
            </dl>
          </div>

          {/* Property */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-serif font-bold text-base mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Property Details
            </h3>
            <dl className="space-y-2.5 text-sm">
              {grievance.schoolDistrict && <div><dt className="text-muted-foreground text-xs mb-0.5">School District</dt><dd className="font-medium">{grievance.schoolDistrict}</dd></div>}
              {grievance.parcelId && <div><dt className="text-muted-foreground text-xs mb-0.5">{parcelLabel}</dt><dd className="font-mono text-xs bg-secondary/50 px-2 py-1 rounded">{grievance.parcelId}</dd></div>}
              {grievance.propertyClass && <div><dt className="text-muted-foreground text-xs mb-0.5">Property Class</dt><dd className="font-medium">{grievance.propertyClass}</dd></div>}
              <div className="flex gap-4">
                {grievance.yearBuilt && <div><dt className="text-muted-foreground text-xs mb-0.5">Year Built</dt><dd className="font-medium">{grievance.yearBuilt}</dd></div>}
                {grievance.livingArea && <div><dt className="text-muted-foreground text-xs mb-0.5">Living Area</dt><dd className="font-medium">{Number(grievance.livingArea).toLocaleString()} sq ft</dd></div>}
              </div>
              {grievance.lotSize && <div><dt className="text-muted-foreground text-xs mb-0.5">Lot Size</dt><dd className="font-medium">{grievance.lotSize}</dd></div>}
            </dl>
          </div>

          {/* Assessment figures */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-serif font-bold text-base mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Assessment Figures
            </h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground text-xs mb-0.5">{assessmentLabel}</dt><dd className="font-bold text-lg">${grievance.currentAssessment.toLocaleString()}</dd></div>
              {!isTX && !isFL && (
                <div><dt className="text-muted-foreground text-xs mb-0.5">Equalization Rate</dt><dd className="font-medium">{grievance.equalizationRate != null ? `${grievance.equalizationRate}%` : "N/A"}</dd></div>
              )}
              {!isTX && !isFL && (
                <div><dt className="text-muted-foreground text-xs mb-0.5">Implied Full Market Value</dt><dd className="font-medium">${impliedFullValue.toLocaleString()}</dd></div>
              )}
              <div><dt className="text-muted-foreground text-xs mb-0.5">{isTX ? "Your Est. Market Value" : isFL ? "Your Est. Just Value" : "Your Est. Market Value"}</dt><dd className="font-bold text-base">${grievance.estimatedMarketValue.toLocaleString()}</dd></div>
              <div className="bg-emerald-50 -mx-5 px-5 py-3 border-y border-emerald-100">
                <dt className="text-emerald-700 font-medium text-xs mb-0.5">{isTX ? "Requested Appraised Value" : isFL ? "Requested Just Value" : "Requested Assessment"}</dt>
                <dd className="font-extrabold text-emerald-800 text-xl">${grievance.requestedAssessment.toLocaleString()}</dd>
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowDown className="w-3 h-3" />
                  Reduction of ${Math.max(0, grievance.currentAssessment - grievance.requestedAssessment).toLocaleString()}
                </div>
              </div>
              {grievance.basisOfComplaint && (
                <div className="pt-1"><dt className="text-muted-foreground text-xs mb-0.5">Basis of Complaint</dt><dd className="capitalize font-medium text-xs bg-secondary/60 px-2 py-1 rounded">{grievance.basisOfComplaint}</dd></div>
              )}
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Filing Deadline</dt>
                <dd className="font-medium flex items-center gap-2">
                  {grievance.filingDeadline ? format(new Date(grievance.filingDeadline), "MMMM d, yyyy") : "Not specified"}
                  {grievance.filingDeadline && new Date(grievance.filingDeadline) < new Date() && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">PASSED</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Deadline reminder */}
          {grievance.filingDeadline && (
            <div className={`rounded-2xl border p-4 ${reminderEnabled ? "bg-blue-50 border-blue-200" : "bg-secondary/30 border-border"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {reminderEnabled ? <Bell className="w-4 h-4 text-blue-600" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-semibold">{reminderEnabled ? "Reminder set" : "Set a reminder"}</p>
                    <p className="text-xs text-muted-foreground">
                      {reminderEnabled
                        ? `Before ${format(new Date(grievance.filingDeadline), "MMM d, yyyy")}`
                        : "Don't miss your filing deadline"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={reminderEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleReminder}
                  className="gap-1.5 shrink-0"
                >
                  {reminderEnabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                  {reminderEnabled ? "Remove" : "Remind me"}
                </Button>
              </div>
            </div>
          )}

          {grievance.notes && (
            <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5">
              <h3 className="font-serif font-bold text-amber-900 text-base mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Property Notes
              </h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{grievance.notes}</p>
            </div>
          )}
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="comps" className="gap-2">
                <MapPin className="w-4 h-4" />
                My Comparables
                {comparables.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 ml-1 font-bold">{comparables.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="suggest" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Find Comps
              </TabsTrigger>
              <TabsTrigger value="research" className="gap-2">
                <Search className="w-4 h-4" />
                Research
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2">
                <FileText className="w-4 h-4" />
                How to File
              </TabsTrigger>
              <TabsTrigger value="print" className="gap-2">
                <Printer className="w-4 h-4" />
                Forms &amp; PDF
                {validation.errors.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{validation.errors.length}</span>
                )}
                {validation.errors.length === 0 && validation.warnings.length > 0 && (
                  <span className="bg-amber-400 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{validation.warnings.length}</span>
                )}
                {validation.isReadyToFile && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">✓</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab: My Comparables */}
            <TabsContent value="comps">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg">Comparable Sales</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Nearby properties that sold recently for less than your assessment implies. Aim for 3–6.</p>
                  </div>
                  <Dialog open={isAddCompOpen} onOpenChange={setIsAddCompOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 shadow-md"><Plus className="w-4 h-4" /> Add Comp</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Add Comparable Sale</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-1">Enter a property that sold recently for less than your assessed value implies.</p>
                      </DialogHeader>
                      <form onSubmit={compForm.handleSubmit(onAddComp)} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label>Property Address *</Label>
                          <Input {...compForm.register("address")} placeholder="456 Neighbor Ave, Town, NY 11000" />
                          {compForm.formState.errors.address && <p className="text-xs text-destructive">{compForm.formState.errors.address.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label>Sale Price ($) *</Label><Input type="number" {...compForm.register("salePrice")} placeholder="480000" /></div>
                          <div className="space-y-1.5"><Label>Sale Date *</Label><Input type="date" {...compForm.register("saleDate")} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5"><Label>Sq Ft</Label><Input type="number" {...compForm.register("squareFeet")} placeholder="1800" /></div>
                          <div className="space-y-1.5"><Label>Beds</Label><Input type="number" {...compForm.register("bedrooms")} placeholder="3" /></div>
                          <div className="space-y-1.5"><Label>Baths</Label><Input type="number" step="0.5" {...compForm.register("bathrooms")} placeholder="2" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label>Assessed Value ($)</Label><Input type="number" {...compForm.register("assessedValue")} placeholder="11000" /></div>
                          <div className="space-y-1.5"><Label>Year Built</Label><Input type="number" {...compForm.register("yearBuilt")} placeholder="1975" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label>Lot Size</Label><Input {...compForm.register("lotSize")} placeholder="0.25 acres" /></div>
                          <div className="space-y-1.5"><Label>Distance</Label><Input {...compForm.register("distance")} placeholder="0.3 miles" /></div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Source URL</Label>
                          <Input type="url" {...compForm.register("sourceUrl")} placeholder="https://www.zillow.com/..." />
                          <p className="text-xs text-muted-foreground">Link to Zillow, ACRIS, or county record.</p>
                        </div>
                        <div className="space-y-1.5"><Label>Notes</Label><Input {...compForm.register("notes")} placeholder="Similar colonial, corner lot" /></div>
                        <Button type="submit" className="w-full" disabled={addCompMutation.isPending}>{addCompMutation.isPending ? "Saving..." : "Save Comparable"}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {comparables.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-muted-foreground font-medium">No comparables yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto mb-4">Try the "Find Comps" tab to automatically pull nearby sales from public records.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/50 text-muted-foreground text-xs">
                        <tr>
                          <th className="px-3 py-2.5 rounded-tl-lg font-medium">Address</th>
                          <th className="px-3 py-2.5 font-medium">Sale Price</th>
                          <th className="px-3 py-2.5 font-medium">Date</th>
                          <th className="px-3 py-2.5 font-medium">Details</th>
                          <th className="px-3 py-2.5 font-medium">Source</th>
                          <th className="px-3 py-2.5 rounded-tr-lg text-right font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparables.map((comp) => (
                          <tr key={comp.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                            <td className="px-3 py-3 font-medium text-foreground">
                              <div>{comp.address}</div>
                              {comp.distance && <div className="text-xs text-muted-foreground">{comp.distance} away</div>}
                            </td>
                            <td className="px-3 py-3 font-bold text-emerald-700">${comp.salePrice.toLocaleString()}</td>
                            <td className="px-3 py-3 text-muted-foreground text-xs">{comp.saleDate}</td>
                            <td className="px-3 py-3 text-muted-foreground text-xs">
                              {comp.squareFeet && <span>{comp.squareFeet.toLocaleString()} sqft</span>}
                              {comp.bedrooms && <span> · {comp.bedrooms}bd</span>}
                              {comp.bathrooms && <span>/{comp.bathrooms}ba</span>}
                              {comp.yearBuilt && <span> · {comp.yearBuilt}</span>}
                            </td>
                            <td className="px-3 py-3">
                              {comp.sourceUrl && (
                                <a href={comp.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteComp(comp.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {comparables.length > 0 && avgCompPrice && (
                  <div className="mt-5 p-4 bg-primary text-primary-foreground rounded-xl">
                    <h4 className="font-serif font-bold flex items-center gap-2 mb-2 text-sm"><DollarSign className="w-4 h-4" /> Case Strength Analysis</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><div className="opacity-80 text-xs mb-0.5">Avg Comparable Sale</div><div className="font-bold text-lg">${avgCompPrice.toLocaleString()}</div></div>
                      <div><div className="opacity-80 text-xs mb-0.5">Your Assessed Full Value</div><div className="font-bold text-lg">${impliedFullValue.toLocaleString()}</div></div>
                    </div>
                    {avgCompPrice < impliedFullValue ? (
                      <p className="text-xs mt-2 opacity-90 leading-relaxed">✓ <strong>Strong case.</strong> Comparable sales average ${avgCompPrice.toLocaleString()}, which is ${(impliedFullValue - avgCompPrice).toLocaleString()} less than your assessed full value of ${impliedFullValue.toLocaleString()}. This demonstrates overvaluation.</p>
                    ) : (
                      <p className="text-xs mt-2 opacity-80 leading-relaxed">Add more comparables with lower sale prices to strengthen your case.</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Auto-suggest Comps */}
            <TabsContent value="suggest">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-serif font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Auto-Find Comparable Sales</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll search the NYS public sales database for recent sales in <strong>{grievance.municipality}</strong> that are similar in size to your property.
                    </p>
                  </div>
                </div>

                {!autoCompsLoaded ? (
                  <div className="text-center py-10 border-2 border-dashed border-border rounded-xl mt-4">
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-medium text-foreground mb-1">Ready to pull public sales data</p>
                    <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">Searches NYS Assessment Roll sales database — real transactions, no Zillow estimates.</p>
                    <Button onClick={fetchAutoComps} disabled={isLoadingAutoComps} className="gap-2">
                      {isLoadingAutoComps ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</> : <><Search className="w-4 h-4" /> Find Comparable Sales</>}
                    </Button>
                  </div>
                ) : autoComps.length === 0 ? (
                  <div className="text-center py-8 mt-4 bg-secondary/20 rounded-xl">
                    <p className="text-sm font-medium text-muted-foreground">No matching sales found in public records</p>
                    <p className="text-xs text-muted-foreground mt-1">Try the Research tab to search manually on Zillow or county portals.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchAutoComps}>Try again</Button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      {autoComps.length} comparable sale{autoComps.length !== 1 ? "s" : ""} found — click <strong>Add</strong> to include in your case
                    </p>
                    {autoComps.map((comp, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{comp.address}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="font-semibold text-emerald-700">${comp.salePrice.toLocaleString()}</span>
                            <span>{comp.saleDate}</span>
                            {comp.squareFeet && <span>{comp.squareFeet.toLocaleString()} sq ft</span>}
                            {comp.yearBuilt && <span>Built {comp.yearBuilt}</span>}
                          </div>
                          {comp.notes && <p className="text-xs text-muted-foreground mt-1">{comp.notes}</p>}
                        </div>
                        <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => addAutoComp(comp)} disabled={addCompMutation.isPending}>
                          <Plus className="w-3.5 h-3.5" /> Add
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={fetchAutoComps} disabled={isLoadingAutoComps} className="gap-2 text-muted-foreground">
                      <Search className="w-3.5 h-3.5" /> Refresh results
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Research */}
            <TabsContent value="research">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <CompsResearch county={grievance.county} />
              </div>
            </TabsContent>

            {/* Tab: How to File */}
            <TabsContent value="file">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1">How to File in {grievance.county} County</h3>
                  <p className="text-sm text-muted-foreground">Exact instructions for your county — no guesswork.</p>
                </div>

                <div className={`flex items-start gap-3 p-4 rounded-xl border ${filingInfo.county === grievance.county ? "bg-primary/5 border-primary/30" : "bg-secondary/30 border-border"}`}>
                  <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Form to use</p>
                    <p className="font-bold">{filingInfo.formName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">File with</p>
                    <p className="font-semibold text-sm">{filingInfo.filingBody}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${grievance.filingDeadline && new Date(grievance.filingDeadline) < new Date() ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                    <p className="text-xs text-muted-foreground mb-1">Typical deadline</p>
                    <p className="font-semibold text-sm">{filingInfo.filingDeadline}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-primary" /> Step-by-step instructions</h4>
                  <ol className="space-y-2">
                    {filingInfo.howToFile.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filingInfo.onlinePortal && (
                    <a href={filingInfo.onlinePortal.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm">
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      {filingInfo.onlinePortal.label}
                    </a>
                  )}
                  {filingInfo.mailingAddress && (
                    <div className="flex items-start gap-2 p-3 bg-secondary/40 rounded-xl text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Mailing address</p>
                        <p className="text-xs font-medium">{filingInfo.mailingAddress}</p>
                      </div>
                    </div>
                  )}
                  {filingInfo.phone && (
                    <div className="flex items-center gap-2 p-3 bg-secondary/40 rounded-xl text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                        <a href={`tel:${filingInfo.phone}`} className="text-primary hover:underline font-medium text-xs">{filingInfo.phone}</a>
                      </div>
                    </div>
                  )}
                </div>

                {filingInfo.notes && (
                  <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <p>{filingInfo.notes}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    After filing, change your case status to <strong>Submitted</strong> using the dropdown at the top of this page to unlock the step-by-step timeline below.
                  </p>
                </div>

                {/* After-filing timeline always shown in How to File tab */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-serif font-bold text-base mb-4">After you file — what to expect</h4>
                  <WhatHappensNext
                    county={grievance.county}
                    afterFiling={filingInfo.afterFiling}
                    currentStatus={grievance.status}
                    filedDate={grievance.filingDeadline}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Print */}
            <TabsContent value="print">
              <div className="space-y-6">
                <ValidationPanel
                  errors={validation.errors}
                  warnings={validation.warnings}
                  suggestions={validation.suggestions}
                  isReadyToFile={validation.isReadyToFile}
                  onFix={handleValidationFix}
                />

                <FormsPrepPanel
                  grievance={grievance}
                  comparables={comparables}
                  onPrint={handlePrint}
                  onPrintComps={handlePrintCompsReport}
                  isAttested={isAttested}
                  onAttest={() => setIsAttested(true)}
                />

                {/* Form preview */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                    <div>
                      <h3 className="font-semibold text-base">RP-524 — Pre-filled Form Preview</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">This is exactly what will be in your downloaded PDF.</p>
                    </div>
                    <Button onClick={handlePrintGated} variant="outline" className="gap-2">
                      <Printer className="w-4 h-4" /> Print
                      {!isAttested && <Lock className="w-3 h-3 opacity-50" />}
                    </Button>
                  </div>
                  <div className="p-4 overflow-auto bg-gray-100" style={{ minHeight: 400 }}>
                    <div className="bg-white shadow-md rounded" style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "117%" }}>
                      <RP524PrintForm grievance={grievance} comparables={comparables} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
