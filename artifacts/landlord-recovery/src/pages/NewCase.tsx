import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateLandlordCase } from "@workspace/api-client-react";
import { useSubscription, startUnlockCheckout, startSubscriptionCheckout } from "@/hooks/useSubscription";
import { ArrowLeft, ArrowRight, CheckCircle2, Building, User, FileText, ChevronLeft, ChevronRight, Sparkles, Loader2, Info, Check, AlertCircle, ChevronsUpDown, Lock, Paperclip, X, ImageIcon, FileIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { STATE_REQUIREMENTS } from "@/data/stateRequirements";

const DRAFT_KEY = "landlord_recovery_case_draft";

const STEPS = [
  { id: "parties", title: "Parties Info", icon: User },
  { id: "type", title: "Claim Basics", icon: FileText },
  { id: "evidence", title: "Evidence", icon: Paperclip },
  { id: "property", title: "Property & Lease", icon: Building },
  { id: "review", title: "Review", icon: CheckCircle2 },
];

const EVIDENCE_CATEGORIES = [
  { value: "lease", label: "Lease Agreement" },
  { value: "ledger", label: "Rent Ledger / Payment Records" },
  { value: "photo", label: "Photographs" },
  { value: "notice", label: "Notice to Quit / Vacate" },
  { value: "correspondence", label: "Correspondence" },
  { value: "court", label: "Court Filing" },
  { value: "other", label: "Other" },
];

interface EvidenceItem {
  id: string;
  file: File;
  label: string;
  category: string;
  previewUrl: string | null;
}

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC","Other"
];

const STATE_EXTRA_NAMES: Record<string, string> = {
  DC: "District of Columbia",
  Other: "Other / Out of State",
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CLAIM_TYPE_VALUES = ["unpaid_rent", "property_damage", "security_deposit", "lease_break", "other"] as const;
type ClaimTypeValue = typeof CLAIM_TYPE_VALUES[number];

const CLAIM_TYPES: { value: ClaimTypeValue; label: string }[] = [
  { value: "unpaid_rent",       label: "Unpaid Rent" },
  { value: "property_damage",   label: "Property Damage" },
  { value: "security_deposit",  label: "Security Deposit Dispute" },
  { value: "lease_break",       label: "Lease Break Fees" },
  { value: "other",             label: "Other" },
];

interface EvidenceSuggestion {
  name: string;
  why: string;
  category: string;
}

const EVIDENCE_SUGGESTIONS: Record<string, EvidenceSuggestion[]> = {
  unpaid_rent: [
    { name: "Signed lease or rental agreement", why: "Proves the agreed rent amount and due dates", category: "lease" },
    { name: "Rent payment ledger or history", why: "Shows exactly what was paid and what balance remains", category: "financial" },
    { name: "Bank statements", why: "Confirms payments received — or confirms they never came", category: "financial" },
    { name: "Written demand letters", why: "Demonstrates you formally notified the tenant of the debt", category: "correspondence" },
    { name: "Texts or emails about unpaid rent", why: "Contemporaneous proof the issue was raised in real time", category: "correspondence" },
    { name: "Late fee notices", why: "Documents the escalation timeline", category: "correspondence" },
  ],
  property_damage: [
    { name: "Move-in inspection report", why: "Establishes the baseline condition before tenant moved in", category: "inspection" },
    { name: "Move-in photos or video", why: "Visual proof of original condition", category: "photo" },
    { name: "Move-out photos or video", why: "Documents the damage left behind", category: "photo" },
    { name: "Repair estimates", why: "Shows the projected cost of the damage", category: "financial" },
    { name: "Paid contractor invoices", why: "Proves the money you actually spent repairing the unit", category: "financial" },
    { name: "Texts or emails about the damage", why: "Shows the tenant was aware of the damage claims", category: "correspondence" },
  ],
  security_deposit: [
    { name: "Signed lease with deposit clause", why: "Confirms the deposit terms and amount required", category: "lease" },
    { name: "Proof of deposit payment", why: "Shows the tenant paid and how much is held", category: "financial" },
    { name: "Move-out inspection report", why: "Documents the condition the unit was returned in", category: "inspection" },
    { name: "Written demand for deposit return", why: "Proves you followed up and received no response", category: "correspondence" },
    { name: "Move-in photos", why: "Establishes original condition to compare against move-out", category: "photo" },
    { name: "Itemized deduction statement (if any)", why: "Shows how the landlord applied the deposit — or failed to", category: "financial" },
  ],
  lease_break: [
    { name: "Signed lease with term dates", why: "Establishes the binding commitment that was broken", category: "lease" },
    { name: "Tenant's vacate notice (if given)", why: "Documents when they notified you — or confirms they didn't", category: "correspondence" },
    { name: "Proof of vacant unit", why: "Shows they actually left before the term ended", category: "photo" },
    { name: "Re-listing or advertising receipts", why: "Shows your reasonable efforts to mitigate the loss", category: "financial" },
    { name: "New tenant's move-in date", why: "Determines the exact period of unpaid rent you can claim", category: "lease" },
    { name: "Texts or emails about early departure", why: "Contemporaneous proof of the breach", category: "correspondence" },
  ],
  other: [
    { name: "Written lease or agreement", why: "Any written agreement is the foundation of your claim", category: "lease" },
    { name: "Relevant correspondence", why: "Emails, texts, and letters establish the timeline", category: "correspondence" },
    { name: "Receipts and invoices", why: "Quantify your financial loss with documentary proof", category: "financial" },
    { name: "Photos or video", why: "Visual evidence is compelling and hard to dispute", category: "photo" },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  lease: "Lease",
  financial: "Financial",
  photo: "Photo / Video",
  inspection: "Inspection",
  correspondence: "Correspondence",
};

const CATEGORY_COLORS: Record<string, string> = {
  lease: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  financial: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  photo: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  inspection: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  correspondence: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const DESCRIPTION_TEMPLATES: Record<string, string> = {
  unpaid_rent:
    "Tenant has failed to pay rent as required under the lease agreement. Despite multiple requests for payment, the outstanding balance remains unpaid. Plaintiff seeks recovery of all unpaid rent, plus any applicable late fees, filing fees, and court costs.",
  property_damage:
    "Tenant caused damage to the rental property beyond normal wear and tear during their tenancy. The cost to repair the damage exceeds the security deposit held. Plaintiff seeks recovery of all repair costs and any additional losses resulting from the tenant's negligence or misconduct.",
  security_deposit:
    "Landlord has failed to return the security deposit as required by state law following the end of the tenancy. Despite written demand, the deposit has not been returned or properly itemized. Plaintiff seeks return of the full deposit plus any applicable statutory damages and interest.",
  lease_break:
    "Tenant vacated the rental property before the end of the lease term without proper notice, in breach of the lease agreement. Plaintiff seeks recovery of unpaid rent for the remaining lease term, re-letting costs, and any other losses resulting from the early termination.",
  other:
    "Describe what happened, when it occurred, and what you are seeking to recover. Include any relevant dates, amounts, and steps you have already taken to resolve the matter.",
};

function formatRentPeriod(months: string[]): string {
  if (months.length === 0) return "";
  const sorted = [...months].sort();
  const byYear: Record<string, string[]> = {};
  for (const m of sorted) {
    const [y, mo] = m.split("-");
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(MONTH_NAMES[parseInt(mo) - 1]);
  }
  const parts: string[] = [];
  for (const [year, names] of Object.entries(byYear)) {
    if (names.length === 1) parts.push(`${names[0]} ${year}`);
    else {
      const last = names[names.length - 1];
      parts.push(`${names.slice(0, -1).join(", ")}, and ${last} ${year}`);
    }
  }
  return parts.join("; ");
}

const newCaseSchema = z.object({
  claimType: z.array(z.enum(CLAIM_TYPE_VALUES)).min(1, "Select at least one claim type"),
  state: z.string().min(2, "State is required"),
  claimAmount: z.coerce.number().min(1, "Claim amount must be greater than 0"),
  monthlyRent: z.coerce.number().optional(),
  monthsOwed: z.coerce.number().min(0).optional(),
  rentPeriod: z.string().optional(),
  description: z.string().min(10, "Please provide a brief description"),
  
  landlordName: z.string()
    .min(2, "Your name is required")
    .refine(v => v.trim().split(/\s+/).filter(Boolean).length >= 2, "Please enter your full legal name (first and last)"),
  landlordCompany: z.string().optional(),
  filingAsLLC: z.boolean().optional(),
  landlordAddress: z.string().optional(),
  landlordEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  landlordPhone: z.string().optional(),
  
  tenantName: z.string()
    .min(2, "Tenant name is required")
    .refine(v => {
      const parts = v.split(',').map(s => s.trim()).filter(Boolean);
      return parts.every(p => p.split(/\s+/).filter(Boolean).length >= 2);
    }, "Each tenant must have a first and last name (e.g. Jane Smith, or Jane Smith, Robert Smith)"),
  tenantEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  tenantPhone: z.string().optional(),
  tenantAddress: z.string().optional(),
  
  propertyAddress: z.string().min(5, "Property address is required"),
  leaseStartDate: z.string().optional(),
  leaseEndDate: z.string().optional(),
  moveOutDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof newCaseSchema>;

export default function NewCase() {
  const [step, setStep] = useState(0);
  const [paywallLoading, setPaywallLoading] = useState<"unlock" | "subscribe" | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createCase = useCreateLandlordCase();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      claimType: [],
      state: "",
      claimAmount: '' as any,
      monthlyRent: undefined,
      monthsOwed: 0,
      rentPeriod: "",
      description: "",
      landlordName: "",
      landlordCompany: "",
      filingAsLLC: false,
      landlordAddress: "",
      landlordEmail: "",
      landlordPhone: "",
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      tenantAddress: "",
      propertyAddress: "",
      leaseStartDate: "",
      leaseEndDate: "",
      moveOutDate: "",
      notes: "",
    },
    mode: "onChange",
  });

  const watchedClaimType = useWatch({ control: form.control, name: "claimType" });
  const watchedMonthlyRent = useWatch({ control: form.control, name: "monthlyRent" });
  const watchedState = useWatch({ control: form.control, name: "state" });
  const watchedClaimAmount = useWatch({ control: form.control, name: "claimAmount" });
  const stateInfo = watchedState ? STATE_REQUIREMENTS[watchedState] : null;
  const stateLimit = stateInfo?.smallClaimsLimit ?? null;
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const { data: subscription } = useSubscription();
  const isPro = subscription?.isPro ?? false;
  const filingAsLLC = useWatch({ control: form.control, name: "filingAsLLC" });

  // Currency display state for claim amount
  const [claimDisplay, setClaimDisplay] = useState("");

  // Sync claimDisplay when the underlying form value changes externally (e.g. auto-calc from rent)
  useEffect(() => {
    const val = watchedClaimAmount;
    if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
      setClaimDisplay(Number(val).toFixed(2));
    }
  }, [watchedClaimAmount]);

  // Track the last auto-generated description so manual edits are not overwritten
  const lastAutoGenDesc = useRef<string>("");

  // Auto-update description whenever claim types change, but only if it hasn't been manually edited
  useEffect(() => {
    const types = watchedClaimType;
    const combined = types?.length
      ? types.map(t => DESCRIPTION_TEMPLATES[t as string]).filter(Boolean).join(" ")
      : "";
    const current = form.getValues("description");
    // Update if: description is empty, or it still matches the previous auto-generated value
    if (!current || current === lastAutoGenDesc.current) {
      form.setValue("description", combined, { shouldValidate: false });
      lastAutoGenDesc.current = combined;
    }
  }, [JSON.stringify(watchedClaimType)]);

  const handleGenerateDesc = async () => {
    const vals = form.getValues();
    if (!vals.claimType?.length || !vals.state || !vals.claimAmount) return;
    setGeneratingDesc(true);
    try {
      const resp = await fetch("/api/landlord-cases/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimType: Array.isArray(vals.claimType) ? vals.claimType.join(",") : vals.claimType,
          state: vals.state,
          claimAmount: vals.claimAmount,
          monthlyRent: vals.monthlyRent || null,
          rentPeriod: vals.rentPeriod || null,
          tenantName: vals.tenantName || null,
          propertyAddress: vals.propertyAddress || null,
          leaseStartDate: vals.leaseStartDate || null,
          moveOutDate: vals.moveOutDate || null,
        }),
      });
      const data = await resp.json();
      if (data.description) {
        form.setValue("description", data.description, { shouldValidate: true });
        toast({ title: "Description generated", description: "Review and edit as needed." });
      }
    } catch {
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setGeneratingDesc(false);
    }
  };

  // ─── Draft autosave ──────────────────────────────────────────────────────────

  // On mount: auto-restore any saved draft immediately
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft?.savedAt || !draft?.values) return;
      // Restore form values and step
      form.reset(draft.values);
      if (typeof draft.step === "number") setStep(draft.step);
      setHasDraft(true);
      setDraftSavedAt(draft.savedAt);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave whenever form values or step change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          const values = form.getValues();
          // Only save if at least one meaningful field has been filled
          const hasContent = values.landlordName || values.tenantName || values.claimAmount || values.description;
          if (!hasContent) return;
          const draft = {
            step,
            values,
            evidenceMetadata: evidenceItems.map(i => ({ id: i.id, label: i.label, category: i.category, fileName: i.file.name, fileSize: i.file.size })),
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {}
      }, 700);
    });
    return () => {
      subscription.unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [form, step, evidenceItems]);

  // Also save when step changes even if no form field changed
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const values = form.getValues();
        const hasContent = values.landlordName || values.tenantName || values.claimAmount || values.description;
        if (!hasContent) return;
        const draft = {
          step,
          values,
          evidenceMetadata: evidenceItems.map(i => ({ id: i.id, label: i.label, category: i.category, fileName: i.file.name, fileSize: i.file.size })),
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {}
    }, 300);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [step]);

  const resumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      form.reset(draft.values);
      if (typeof draft.step === "number") setStep(draft.step);
      setHasDraft(false);
      toast({ title: "Draft Restored", description: "Pick up right where you left off." });
    } catch {
      toast({ title: "Could not restore draft", variant: "destructive" });
    }
  };

  const discardDraft = (resetForm = true) => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setDraftSavedAt(null);
    if (resetForm) {
      form.reset();
      setStep(0);
      setEvidenceItems([]);
    }
  };

  const clearDraftOnSuccess = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const formatDraftDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch { return "recently"; }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (key: string) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const count = selectedMonths.size;
    form.setValue("monthsOwed", count, { shouldValidate: false });
    form.setValue("rentPeriod", formatRentPeriod([...selectedMonths]), { shouldValidate: false });
    if (watchedClaimType?.includes("unpaid_rent") && watchedMonthlyRent && count > 0) {
      const total = Number(watchedMonthlyRent) * count;
      const capped = stateLimit ? Math.min(total, stateLimit) : total;
      if (capped > 0) form.setValue("claimAmount", capped, { shouldValidate: true });
    }
  }, [selectedMonths, watchedMonthlyRent, watchedClaimType, stateLimit]);

  const scrollTop = () => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (step === 0) fieldsToValidate = ['landlordName', 'tenantName', 'landlordEmail', 'tenantEmail', 'landlordPhone', 'tenantPhone', 'tenantAddress'];
    if (step === 1) fieldsToValidate = ['claimType', 'state', 'claimAmount', 'description'];
    if (step === 2) fieldsToValidate = [];
    if (step === 3) fieldsToValidate = isPro ? ['propertyAddress', 'monthlyRent', 'leaseStartDate', 'leaseEndDate', 'moveOutDate'] : [];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(s => Math.min(STEPS.length - 1, s + 1));
      scrollTop();
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(0, s - 1));
    scrollTop();
  };

  const addEvidenceFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","image/heic","application/pdf","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const newItems: EvidenceItem[] = fileArray
      .filter(f => allowed.includes(f.type))
      .map(f => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        label: f.name.replace(/\.[^/.]+$/, ""),
        category: f.type.startsWith("image/") ? "photo" : "other",
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      }));
    setEvidenceItems(prev => [...prev, ...newItems]);
  };

  const removeEvidenceItem = (id: string) => {
    setEvidenceItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const onSubmit = async (data: FormValues) => {
    const { filingAsLLC: _filingAsLLC, ...rest } = data;
    const submitData = {
      ...rest,
      claimType: Array.isArray(data.claimType) ? data.claimType.join(",") : data.claimType,
    };
    createCase.mutate({ data: submitData as any }, {
      onSuccess: async (newCase) => {
        if (evidenceItems.length > 0) {
          await Promise.allSettled(
            evidenceItems.map(async (item) => {
              const fd = new FormData();
              fd.append("file", item.file);
              fd.append("category", item.category);
              fd.append("notes", item.label);
              await fetch(`/api/landlord-cases/${newCase.id}/attachments`, { method: "POST", body: fd });
            })
          );
        }
        clearDraftOnSuccess();
        toast({
          title: "Case Created",
          description: "Your case has been saved successfully.",
        });
        setLocation(`/cases/${newCase.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create case. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const CurrentStepIcon = STEPS[step].icon;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground" onClick={() => setLocation("/cases")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
        </Button>
        <h1 className="text-3xl font-serif font-bold text-foreground">Create New Case</h1>
        <p className="text-muted-foreground mt-1">Start recovering your losses by documenting the facts.</p>
      </div>

      {/* Draft restored notification */}
      {hasDraft && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-800 dark:text-green-200">
              <span className="font-semibold">Draft restored</span> — last saved {draftSavedAt ? formatDraftDate(draftSavedAt) : "recently"}.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-xs text-green-700 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-2 transition-colors"
            onClick={discardDraft}
          >
            Discard
          </button>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0 hidden sm:block"></div>
        <div className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 hidden sm:block transition-all duration-300" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}></div>
        
        <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-4 sm:gap-0">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isCurrent = i === step;
            
            return (
              <div key={s.id} className="flex items-center sm:flex-col sm:items-center gap-3 sm:gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2
                  ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                    isCurrent ? 'bg-background border-primary text-primary' : 
                    'bg-background border-muted text-muted-foreground'}`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-md">
                  <CurrentStepIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
                  <CardDescription>
                    {step === 0 && "Information about you and the tenant."}
                    {step === 1 && "Define what you are claiming and where."}
                    {step === 2 && "Attach photos and documents to support your case."}
                    {step === 3 && "Details about the property and lease agreement."}
                    {step === 4 && "Review the details before saving the case."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              {/* STEP 1: BASICS */}
              {step === 1 && (
                <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="claimType"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>
                            Claim Type{" "}
                            <span className="text-xs font-normal text-muted-foreground">(select all that apply)</span>
                          </FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                            {CLAIM_TYPES.map(({ value, label }) => {
                              const isChecked = (field.value as string[])?.includes(value);
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => {
                                    const current = (field.value as string[]) || [];
                                    field.onChange(
                                      isChecked
                                        ? current.filter(v => v !== value)
                                        : [...current, value]
                                    );
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-all ${
                                    isChecked
                                      ? "border-accent bg-accent/10 text-accent-foreground font-medium"
                                      : "border-border hover:border-primary/40 hover:bg-muted text-foreground"
                                  }`}
                                >
                                  <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${isChecked ? "bg-accent border-accent" : "border-muted-foreground/40"}`}>
                                    {isChecked && <Check className="h-3 w-3 text-accent-foreground" />}
                                  </div>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>State</FormLabel>
                          <Popover open={stateOpen} onOpenChange={setStateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={stateOpen}
                                  className="justify-between font-normal text-left"
                                >
                                  {field.value
                                    ? (() => {
                                        const name = STATE_REQUIREMENTS[field.value]?.name ?? STATE_EXTRA_NAMES[field.value] ?? field.value;
                                        return `${field.value}${name !== field.value ? ` — ${name}` : ""}`;
                                      })()
                                    : <span className="text-muted-foreground">Type a state code or name…</span>
                                  }
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Type state code or name (e.g. NY)" />
                                <CommandList className="max-h-60 overflow-y-auto">
                                  <CommandEmpty>No state found.</CommandEmpty>
                                  <CommandGroup>
                                    {STATES.map(code => {
                                      const fullName = STATE_REQUIREMENTS[code]?.name ?? STATE_EXTRA_NAMES[code] ?? code;
                                      return (
                                        <CommandItem
                                          key={code}
                                          value={`${code} ${fullName}`}
                                          onSelect={() => {
                                            field.onChange(code);
                                            setStateOpen(false);
                                          }}
                                        >
                                          <Check className={`mr-2 h-4 w-4 ${field.value === code ? "opacity-100" : "opacity-0"}`} />
                                          <span className="font-mono font-medium w-8 shrink-0">{code}</span>
                                          <span className="text-muted-foreground">{fullName}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* State small claims limit callout */}
                  {stateLimit && (
                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-blue-900">{stateInfo?.name} small claims limit: ${stateLimit.toLocaleString()}</span>
                        <span className="text-blue-700"> — your total claim cannot exceed this amount in small claims court.</span>
                      </div>
                    </div>
                  )}

                  {watchedClaimType?.includes("unpaid_rent") ? (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="monthlyRent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Rent ($)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 2400" className="max-w-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Month / Year Picker */}
                      <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Months Owed</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Click each month rent was <span className="font-medium text-foreground">not paid</span>. Selected months turn gold. Click again to deselect. Use the arrows to switch years if rent was owed across multiple years.
                          </p>
                        </div>

                        {/* Year Navigation */}
                        <div className="flex items-center justify-between max-w-xs">
                          <Button
                            type="button" variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setSelectedYear(y => y - 1)}
                            disabled={selectedYear <= today.getFullYear() - 3}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="font-semibold text-sm tabular-nums">{selectedYear}</span>
                          <Button
                            type="button" variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setSelectedYear(y => y + 1)}
                            disabled={selectedYear >= today.getFullYear()}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-4 gap-2">
                          {MONTH_SHORT.map((name, idx) => {
                            const monthNum = String(idx + 1).padStart(2, "0");
                            const key = `${selectedYear}-${monthNum}`;
                            const isFuture = selectedYear === today.getFullYear() && idx > today.getMonth();
                            const isSelected = selectedMonths.has(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={isFuture}
                                onClick={() => toggleMonth(key)}
                                className={`rounded-md border px-2 py-2 text-sm font-medium transition-all
                                  ${isFuture ? "opacity-30 cursor-not-allowed border-border text-muted-foreground" :
                                    isSelected
                                      ? "border-accent bg-accent text-accent-foreground shadow-sm"
                                      : "border-border hover:border-primary/50 hover:bg-muted text-foreground"
                                  }`}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>

                        {selectedMonths.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedMonths(new Set())}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>

                      {/* Calculation Summary */}
                      {selectedMonths.size > 0 && watchedMonthlyRent && Number(watchedMonthlyRent) > 0 ? (
                        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                          <div className="text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wider">Rent Breakdown</div>
                          <div className="text-xs text-muted-foreground mb-2 leading-relaxed">
                            {formatRentPeriod([...selectedMonths])}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              ${Number(watchedMonthlyRent).toLocaleString()} &times; {selectedMonths.size} month{selectedMonths.size !== 1 ? "s" : ""}
                            </div>
                            <div className={`text-xl font-bold ${stateLimit && Number(watchedMonthlyRent) * selectedMonths.size > stateLimit ? "text-amber-600" : "text-foreground"}`}>
                              ${(Number(watchedMonthlyRent) * selectedMonths.size).toLocaleString()}
                            </div>
                          </div>
                          {stateLimit && Number(watchedMonthlyRent) * selectedMonths.size > stateLimit ? (
                            <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                              <span>This exceeds the {stateInfo?.name} small claims limit of ${stateLimit.toLocaleString()}. Your claim will be capped at that amount.</span>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground mt-1">This becomes your total claim amount</div>
                          )}
                        </div>
                      ) : selectedMonths.size > 0 ? (
                        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                          {selectedMonths.size} month{selectedMonths.size !== 1 ? "s" : ""} selected — enter monthly rent above to calculate total.
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                          Select the months rent was not paid above.
                        </div>
                      )}
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="claimAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Claim Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">$</span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                className="pl-7"
                                placeholder={stateLimit ? `0.00  (max ${stateLimit.toLocaleString()})` : "0.00"}
                                value={claimDisplay}
                                onChange={(e) => {
                                  // Allow digits and at most one decimal point
                                  const raw = e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*$/, "$1");
                                  setClaimDisplay(raw);
                                  const num = parseFloat(raw);
                                  if (!isNaN(num)) {
                                    const capped = stateLimit ? Math.min(num, stateLimit) : num;
                                    field.onChange(capped);
                                  } else {
                                    field.onChange(undefined);
                                  }
                                }}
                                onBlur={() => {
                                  const num = parseFloat(claimDisplay);
                                  if (!isNaN(num) && num > 0) {
                                    const capped = stateLimit ? Math.min(num, stateLimit) : num;
                                    setClaimDisplay(capped.toFixed(2));
                                    field.onChange(capped);
                                  } else {
                                    setClaimDisplay("");
                                    field.onChange(undefined);
                                  }
                                }}
                              />
                            </div>
                          </FormControl>
                          {stateLimit && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Capped at ${stateLimit.toLocaleString()} — the {stateInfo?.name} small claims court limit
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Brief Description</FormLabel>
                          <div className="flex items-center gap-1">
                            {watchedClaimType?.length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  const combined = (watchedClaimType as string[])
                                    .map(t => DESCRIPTION_TEMPLATES[t])
                                    .filter(Boolean)
                                    .join(" ");
                                  form.setValue("description", combined, { shouldValidate: true });
                                  lastAutoGenDesc.current = combined;
                                }}
                              >
                                Use template
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                form.setValue("description", "", { shouldValidate: false });
                                lastAutoGenDesc.current = "";
                              }}
                            >
                              Clear
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              disabled={generatingDesc || !form.getValues("claimType")?.length || !form.getValues("state") || !form.getValues("claimAmount")}
                              onClick={handleGenerateDesc}
                            >
                              {generatingDesc
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                                : <><Sparkles className="h-3 w-3" /> Generate with AI</>
                              }
                            </Button>
                          </div>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Select claim types above to auto-load a starter template — then edit freely, paste from a document, or write your own description from scratch."
                            className="min-h-[120px]"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Mark as manually edited so auto-update stops overwriting
                              lastAutoGenDesc.current = "__manual__";
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          You can type directly, paste copied text, or copy and paste the contents of a Word or text document into this box.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 0: PARTIES */}
              {step === 0 && (
                <div className="grid gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Landlord */}
                  <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Your Information (Plaintiff)</h3>

                    {/* Filing capacity toggle */}
                    <div className="mb-5">
                      <Label className="text-sm font-medium mb-2 block">How are you filing this case?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => form.setValue("filingAsLLC", false, { shouldValidate: false })}
                          className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm font-medium transition-all text-left ${!filingAsLLC ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                        >
                          <User className="h-4 w-4 shrink-0" />
                          <span>As an Individual</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => form.setValue("filingAsLLC", true, { shouldValidate: false })}
                          className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm font-medium transition-all text-left ${filingAsLLC ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                        >
                          <Building className="h-4 w-4 shrink-0" />
                          <span>As an LLC / Company</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* LLC Name field — shown prominently when filing as LLC */}
                      {filingAsLLC && (
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="landlordCompany"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LLC / Company Name * <span className="text-muted-foreground font-normal text-xs">(appears as plaintiff on all documents)</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe Properties LLC" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="landlordName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{filingAsLLC ? "Authorized Representative (First & Last Name) *" : "Your Full Legal Name *"}</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {!filingAsLLC && (
                        <FormField
                          control={form.control}
                          name="landlordCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Doe Properties LLC" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="landlordAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Mailing Address <span className="text-muted-foreground font-normal">(appears on all letters)</span></FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, Brooklyn, NY 11201" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="landlordEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="landlordPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Tenant */}
                  <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Tenant Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="tenantName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant Full Legal Name(s) * <span className="text-muted-foreground font-normal text-xs">(appears on all documents)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Smith" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">For multiple tenants: Jane Smith, Robert Smith</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tenantEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jane@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tenantPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 987-6543" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="tenantAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forwarding Address (If known)</FormLabel>
                          <FormControl>
                            <Input placeholder="123 New St, City, ST 12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: EVIDENCE */}
              {step === 2 && (
                <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">

                  {/* Suggested evidence checklist */}
                  {(() => {
                    const claimTypes = Array.isArray(watchedClaimType) ? watchedClaimType : [];
                    const seen = new Set<string>();
                    const suggestions: (EvidenceSuggestion & { claimLabel: string })[] = [];
                    for (const ct of claimTypes) {
                      const items = EVIDENCE_SUGGESTIONS[ct] ?? [];
                      for (const item of items) {
                        if (!seen.has(item.name)) {
                          seen.add(item.name);
                          suggestions.push({ ...item, claimLabel: CLAIM_TYPES.find(c => c.value === ct)?.label ?? ct });
                        }
                      }
                    }
                    if (suggestions.length === 0) return null;
                    return (
                      <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-foreground">Suggested Evidence for Your Claim</p>
                          <span className="ml-auto text-xs text-muted-foreground">{suggestions.length} item{suggestions.length !== 1 ? "s" : ""}</span>
                        </div>
                        <ul className="divide-y divide-border">
                          {suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                              <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground leading-snug">{s.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{s.why}</p>
                              </div>
                              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${CATEGORY_COLORS[s.category] ?? "bg-muted text-muted-foreground"}`}>
                                {CATEGORY_LABELS[s.category] ?? s.category}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="px-4 py-2.5 border-t border-border bg-muted/20">
                          <p className="text-xs text-muted-foreground">Upload what you have — you can always add more from the case detail page later.</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Drop zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                    onClick={() => evidenceFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) addEvidenceFiles(e.dataTransfer.files); }}
                  >
                    <input
                      ref={evidenceFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => { if (e.target.files) { addEvidenceFiles(e.target.files); e.target.value = ""; } }}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-muted p-4">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Drag and drop files here, or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">Images, PDFs, and documents up to 25 MB each</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); evidenceFileInputRef.current?.click(); }}>
                        <Paperclip className="mr-2 h-4 w-4" /> Add Files
                      </Button>
                    </div>
                  </div>

                  {/* Evidence items list */}
                  {evidenceItems.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">{evidenceItems.length} file{evidenceItems.length !== 1 ? "s" : ""} attached</p>
                      {evidenceItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 border border-border rounded-lg p-3 bg-muted/20">
                          {/* Thumbnail or icon */}
                          <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
                            {item.previewUrl ? (
                              <img src={item.previewUrl} alt={item.label} className="w-full h-full object-cover" />
                            ) : item.file.type === "application/pdf" ? (
                              <FileIcon className="h-6 w-6 text-red-500" />
                            ) : (
                              <FileIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Fields */}
                          <div className="flex-1 grid gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Evidence Label</Label>
                              <Input
                                value={item.label}
                                onChange={(e) => setEvidenceItems(prev => prev.map(i => i.id === item.id ? { ...i, label: e.target.value } : i))}
                                placeholder="e.g. Front door damage — July 2023"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
                              <select
                                value={item.category}
                                onChange={(e) => setEvidenceItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                                className="w-full h-8 text-sm border border-input rounded-md bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                {EVIDENCE_CATEGORIES.map(cat => (
                                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                              </select>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.file.name} · {(item.file.size / 1024).toFixed(0)} KB</p>
                          </div>

                          {/* Remove */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeEvidenceItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {evidenceItems.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground">Evidence is optional. You can also add documents later from the case detail page.</p>
                  )}
                </div>
              )}

              {/* STEP 3: PROPERTY & LEASE */}
              {step === 3 && !isPro && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
                      <Lock className="h-7 w-7 text-accent" />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-foreground mb-1">Unlock to Continue</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Complete your case file and generate court-ready documents by unlocking full access.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2.5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What you get</h3>
                    {[
                      "Property & lease details step",
                      "Court-ready demand letter (print & send)",
                      "Step-by-step small claims filing guide",
                      "Downloadable case documents",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-accent" />
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border-2 border-accent bg-accent/5 p-5">
                    <div className="text-center mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">Best Option</p>
                      <p className="text-2xl font-bold text-foreground">$29 <span className="text-base font-normal text-muted-foreground">one-time</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">Full access to this case, forever</p>
                    </div>
                    <Button
                      type="button"
                      className="w-full h-11 text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                      disabled={!!paywallLoading}
                      onClick={async () => {
                        setPaywallLoading("unlock");
                        try {
                          await startUnlockCheckout(form.getValues("landlordEmail") || undefined);
                        } catch {
                          toast({ title: "Checkout unavailable", description: "Please try again.", variant: "destructive" });
                          setPaywallLoading(null);
                        }
                      }}
                    >
                      {paywallLoading === "unlock"
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to checkout…</>
                        : "Unlock Full Case — $29"}
                    </Button>
                    <div className="flex justify-center gap-5 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> One-time payment</span>
                      <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> No subscription</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-sm font-medium text-foreground mb-1">Need multiple cases?</p>
                    <p className="text-xs text-muted-foreground mb-3">Unlimited cases and documents for one flat rate.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/5"
                      disabled={!!paywallLoading}
                      onClick={async () => {
                        setPaywallLoading("subscribe");
                        try {
                          await startSubscriptionCheckout(form.getValues("landlordEmail") || undefined);
                        } catch {
                          toast({ title: "Checkout unavailable", description: "Please try again.", variant: "destructive" });
                          setPaywallLoading(null);
                        }
                      }}
                    >
                      {paywallLoading === "subscribe"
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</>
                        : "Subscribe — $49/month · Cancel anytime"}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    Secured by Stripe. Your payment info is never stored on our servers.
                  </p>
                </div>
              )}

              {step === 3 && isPro && (
                <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rental Property Address</FormLabel>
                        <FormControl>
                          <Input placeholder="456 Rental Ave, Apt 2B, City, ST 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Rent ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 1500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="leaseStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lease Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="leaseEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lease End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="moveOutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Move Out Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any other relevant details for your own records." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 4: REVIEW */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                  {/* Case Summary — always visible but description blurred for free users */}
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <h3 className="font-semibold text-lg mb-4 text-primary">Case Summary</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Claim Type</dt>
                        <dd className="font-medium">
                          {(Array.isArray(form.getValues().claimType) ? form.getValues().claimType : [form.getValues().claimType])
                            .filter(Boolean)
                            .map(t => t.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
                            .join(', ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Claim Amount</dt>
                        <dd className="font-medium font-mono text-base">${Number(form.getValues().claimAmount).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">State</dt>
                        <dd className="font-medium">{form.getValues().state}</dd>
                      </div>
                      {form.getValues().rentPeriod && (
                        <div className="md:col-span-2">
                          <dt className="text-muted-foreground">Rent Period</dt>
                          <dd className="font-medium mt-1">{form.getValues().rentPeriod}</dd>
                        </div>
                      )}
                      <div className="md:col-span-2 relative">
                        <dt className="text-muted-foreground">Description</dt>
                        <dd
                          className={`font-medium mt-1 transition-all ${!isPro ? "blur-sm select-none pointer-events-none" : ""}`}
                          aria-hidden={!isPro}
                        >
                          {form.getValues().description}
                        </dd>
                        {!isPro && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border shadow-sm">
                              <Lock className="h-3 w-3" /> Subscribe to view
                            </span>
                          </div>
                        )}
                      </div>
                    </dl>
                  </div>

                  {/* Paywall banner for non-subscribers */}
                  {!isPro && (
                    <div className="rounded-xl border-2 border-accent bg-accent/5 p-6 text-center space-y-3">
                      <div className="flex justify-center">
                        <div className="rounded-full bg-accent/15 p-3">
                          <Lock className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg">Save This Case — Unlock Pro to Continue</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Your information is ready. Choose a plan to save this case, generate your demand letter, and access all court documents.
                      </p>
                      <Button
                        type="button"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 px-8"
                        onClick={() => setLocation("/pricing")}
                      >
                        View Plans & Pricing
                      </Button>
                      <p className="text-xs text-muted-foreground">Monthly subscription or one-time annual payment</p>
                    </div>
                  )}

                  {/* Parties & Property — blurred for free users */}
                  <div className={`grid md:grid-cols-2 gap-6 transition-all ${!isPro ? "blur-sm select-none pointer-events-none" : ""}`} aria-hidden={!isPro}>
                    <div className="border border-border p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Parties</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Landlord</dt>
                          <dd className="font-medium">{form.getValues().landlordName}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Tenant</dt>
                          <dd className="font-medium">{form.getValues().tenantName}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="border border-border p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Property</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Address</dt>
                          <dd className="font-medium">{form.getValues().propertyAddress}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Monthly Rent</dt>
                          <dd className="font-medium">{form.getValues().monthlyRent ? `$${form.getValues().monthlyRent}` : 'Not specified'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Evidence summary */}
                  <div className="border border-border p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" /> Evidence Attached
                      <span className="ml-auto text-sm font-normal text-muted-foreground">{evidenceItems.length} file{evidenceItems.length !== 1 ? "s" : ""}</span>
                    </h4>
                    {evidenceItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No files attached. You can add evidence from the case detail page after saving.</p>
                    ) : (
                      <ul className="space-y-2">
                        {evidenceItems.map((item) => (
                          <li key={item.id} className="flex items-center gap-3 text-sm">
                            <div className="shrink-0 w-8 h-8 rounded overflow-hidden border border-border bg-muted flex items-center justify-center">
                              {item.previewUrl ? (
                                <img src={item.previewUrl} alt={item.label} className="w-full h-full object-cover" />
                              ) : (
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.label || item.file.name}</p>
                              <p className="text-xs text-muted-foreground">{EVIDENCE_CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="sticky bottom-0 z-20 bg-background border-t border-border flex flex-col gap-3 p-6 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={step === 0 || createCase.isPending}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                
                {step === 3 && !isPro ? null : step < STEPS.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="bg-primary text-primary-foreground">
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : isPro ? (
                  <Button 
                    type="submit" 
                    disabled={createCase.isPending}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {createCase.isPending ? "Creating Case..." : "Save Case & Continue"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setLocation("/pricing")}
                  >
                    <Lock className="mr-2 h-4 w-4" /> View Plans to Save
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Progress is saved automatically — you can log out and resume later.
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
                  onClick={() => {
                    discardDraft(true);
                    toast({ title: "Draft discarded", description: "The form has been cleared." });
                  }}
                >
                  Discard draft
                </button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
