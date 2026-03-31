import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateGrievance, useUpdateGrievance } from "@/hooks/use-grievances";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, CheckCircle2, AlertTriangle, Info, Sparkles, LocateFixed, Camera, X, Lock } from "lucide-react";
import type { Grievance } from "@workspace/api-client-react";
import { PropertyRecordCard } from "@/components/PropertyRecordCard";
import type { LookupResult } from "@/components/PropertyRecordCard";
import { TX_COUNTY_NAMES, TX_BASIS_OPTIONS, TX_PROPERTY_CLASS_OPTIONS } from "@/data/texas-filing-instructions";
import { NJ_COUNTY_NAMES, NJ_BASIS_OPTIONS, NJ_PROPERTY_CLASS_OPTIONS } from "@/data/nj-filing-instructions";
import { FL_COUNTY_NAMES, FL_BASIS_OPTIONS, FL_PROPERTY_CLASS_OPTIONS } from "@/data/florida-filing-instructions";

/* ─── Schema ────────────────────────────────────────── */

const grievanceSchema = z.object({
  state: z.string().default("NY"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().optional(),
  ownerMailingAddress: z.string().optional(),
  propertyAddress: z.string().min(5, "Property address is required"),
  county: z.string().min(2, "County is required"),
  municipality: z.string().min(2, "City/Municipality is required"),
  schoolDistrict: z.string().optional(),
  parcelId: z.string().optional(),
  propertyClass: z.string().optional(),
  yearBuilt: z.coerce.number().min(1600).max(2030).optional(),
  livingArea: z.coerce.number().positive().optional(),
  lotSize: z.string().optional(),
  taxYear: z.coerce.number().min(2020).max(2030),
  currentAssessment: z.coerce.number().positive("Must be a positive number"),
  equalizationRate: z.coerce.number().min(0).max(100).optional(),
  estimatedMarketValue: z.coerce.number().positive("Must be a positive number"),
  requestedAssessment: z.coerce.number().positive("Must be a positive number"),
  basisOfComplaint: z.string().optional(),
  filingDeadline: z.string().optional(),
  notes: z.string().optional(),
});

type GrievanceFormValues = z.infer<typeof grievanceSchema>;

/* ─── Constants ─────────────────────────────────────── */

const BASIS_OPTIONS = [
  { value: "overvaluation", label: "Overvaluation — Market value is lower than assessment implies" },
  { value: "unequal", label: "Unequal Assessment — Assessment is too high compared to similar properties" },
  { value: "excessive", label: "Excessive Assessment — Exceeds statutory or constitutional limits" },
  { value: "unlawful", label: "Unlawful Assessment — Property is exempt or assessment is otherwise improper" },
];

const COUNTY_OPTIONS = [
  "Nassau", "Suffolk", "Westchester", "Rockland", "New York City", "Albany", "Erie", "Monroe", "Onondaga", "Other"
];

const PROPERTY_CLASS_OPTIONS = [
  { value: "210", label: "210 — One-Family Residential" },
  { value: "220", label: "220 — Two-Family Residential" },
  { value: "230", label: "230 — Three-Family Residential" },
  { value: "240", label: "240 — Rural Residential" },
  { value: "250", label: "250 — Estate" },
  { value: "281", label: "281 — Multiple Residence (Large)" },
  { value: "311", label: "311 — Residential Vacant Land" },
  { value: "400", label: "400 — Commercial" },
];

const FIELD_LABELS: Record<string, string> = {
  county: "County",
  municipality: "Municipality",
  schoolDistrict: "School District",
  parcelId: "Parcel ID",
  propertyClass: "Property Class",
  yearBuilt: "Year Built",
  livingArea: "Living Area",
  lotSize: "Lot Size",
  estimatedMarketValue: "Est. Market Value",
};

/* ─── Props ─────────────────────────────────────────── */

interface EstimatorPrefill {
  propertyAddress?: string;
  county?: string;
  currentAssessment?: number;
  estimatedMarketValue?: number;
  requestedAssessment?: number;
  state?: string;
  estimatedSavings?: number;
}

interface GrievanceFormProps {
  initialData?: Grievance;
  onSuccess?: () => void;
  initialState?: string;
  onStateChange?: (state: string) => void;
  prefill?: EstimatorPrefill;
}

/* ─── Component ─────────────────────────────────────── */

export function GrievanceForm({ initialData, onSuccess, initialState = "NY", onStateChange, prefill }: GrievanceFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateGrievance();
  const updateMutation = useUpdateGrievance();

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Payment gate
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.plan) setUserPlan(data.plan); })
      .catch(() => {});
  }, []);

  // Restore any form data saved before Stripe redirect
  useEffect(() => {
    if (isEditing) return;
    try {
      const saved = localStorage.getItem("pendingCase");
      if (saved) {
        const parsed = JSON.parse(saved);
        form.reset(parsed, { keepErrors: false });
        localStorage.removeItem("pendingCase");
        return;
      }
    } catch {}
    // Apply estimator prefill when no pending case
    if (prefill && !isEditing) {
      const current = form.getValues();
      form.reset({
        ...current,
        state: prefill.state ?? current.state,
        propertyAddress: prefill.propertyAddress ?? current.propertyAddress,
        county: prefill.county ?? current.county,
        currentAssessment: prefill.currentAssessment ?? current.currentAssessment,
        estimatedMarketValue: prefill.estimatedMarketValue ?? current.estimatedMarketValue,
        requestedAssessment: prefill.requestedAssessment ?? current.requestedAssessment,
      }, { keepErrors: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userHasPaid = !!userPlan;

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const productsRes = await fetch("/api/stripe/products");
      if (!productsRes.ok) throw new Error("Could not load products");
      const { data: products } = await productsRes.json() as { data: any[] };

      const product = products.find((p: any) =>
        p.metadata?.plan === "basic" || p.name?.toLowerCase().includes("basic")
      );

      if (!product || !product.prices?.[0]?.id) {
        toast({ title: "Plan unavailable", description: "Please try again shortly.", variant: "destructive" });
        return;
      }

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: product.prices[0].id }),
      });

      if (!checkoutRes.ok) throw new Error("Checkout failed");
      const { url } = await checkoutRes.json();
      // Save form data so it can be restored after returning from Stripe
      try { localStorage.setItem("pendingCase", JSON.stringify(form.getValues())); } catch {}
      window.location.href = url;
    } catch (err) {
      toast({ title: "Checkout error", description: "Could not start checkout. Please try again.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Lookup state
  const [lookupAddress, setLookupAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const [isOcring, setIsOcring] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: initialData
      ? {
          state: (initialData as any).state ?? "NY",
          ownerName: initialData.ownerName,
          ownerPhone: initialData.ownerPhone ?? undefined,
          ownerEmail: initialData.ownerEmail ?? undefined,
          ownerMailingAddress: initialData.ownerMailingAddress ?? undefined,
          propertyAddress: initialData.propertyAddress,
          county: initialData.county,
          municipality: initialData.municipality,
          schoolDistrict: initialData.schoolDistrict ?? undefined,
          parcelId: initialData.parcelId ?? undefined,
          propertyClass: initialData.propertyClass ?? undefined,
          yearBuilt: initialData.yearBuilt ?? undefined,
          livingArea: initialData.livingArea ?? undefined,
          lotSize: initialData.lotSize ?? undefined,
          taxYear: initialData.taxYear,
          currentAssessment: initialData.currentAssessment,
          equalizationRate: initialData.equalizationRate ?? undefined,
          estimatedMarketValue: initialData.estimatedMarketValue,
          requestedAssessment: initialData.requestedAssessment,
          basisOfComplaint: initialData.basisOfComplaint ?? undefined,
          filingDeadline: initialData.filingDeadline ?? undefined,
          notes: initialData.notes ?? undefined,
        }
      : {
          state: initialState,
          taxYear: new Date().getFullYear(),
          county: initialState === "TX" ? "Harris" : initialState === "NJ" ? "Bergen" : initialState === "FL" ? "Miami-Dade" : "Nassau",
          basisOfComplaint: initialState === "TX" ? "market_value" : "overvaluation",
        },
  });

  const selectedState = form.watch("state") ?? "NY";
  const isTX = selectedState === "TX";
  const isNJ = selectedState === "NJ";
  const isFL = selectedState === "FL";

  const currentCountyOptions = isTX ? TX_COUNTY_NAMES : isNJ ? NJ_COUNTY_NAMES : isFL ? FL_COUNTY_NAMES : COUNTY_OPTIONS;
  const currentBasisOptions = isTX ? TX_BASIS_OPTIONS : isNJ ? NJ_BASIS_OPTIONS : isFL ? FL_BASIS_OPTIONS : BASIS_OPTIONS;
  const currentPropertyClassOptions = isTX ? TX_PROPERTY_CLASS_OPTIONS : isNJ ? NJ_PROPERTY_CLASS_OPTIONS : isFL ? FL_PROPERTY_CLASS_OPTIONS : PROPERTY_CLASS_OPTIONS;

  /* ── Property lookup ── */
  const runLookup = async (addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/property-lookup?address=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        setLookupError(data.error || "Address not found. Try including your town and state — e.g. '123 Main St, Garden City, NY'.");
        return;
      }

      const result = data as LookupResult;
      setLookupResult(result);

      // Build merged values — start from current form values, overlay lookup results
      const current = form.getValues();
      const filled = new Set<string>();
      const merged: GrievanceFormValues = { ...current };

      // Always set the address
      merged.propertyAddress = trimmed;
      filled.add("propertyAddress");

      if (result.county)              { merged.county              = result.county;              filled.add("county"); }
      if (result.municipality)        { merged.municipality        = result.municipality;        filled.add("municipality"); }
      if (result.schoolDistrict)      { merged.schoolDistrict      = result.schoolDistrict;      filled.add("schoolDistrict"); }
      if (result.parcelId)            { merged.parcelId            = result.parcelId;            filled.add("parcelId"); }
      if (result.propertyClass)       { merged.propertyClass       = result.propertyClass;       filled.add("propertyClass"); }
      if (result.yearBuilt)           { merged.yearBuilt           = result.yearBuilt;           filled.add("yearBuilt"); }
      if (result.livingArea)          { merged.livingArea          = result.livingArea;          filled.add("livingArea"); }
      if (result.lotSize)             { merged.lotSize             = result.lotSize;             filled.add("lotSize"); }
      if (result.estimatedMarketValue){ merged.estimatedMarketValue= result.estimatedMarketValue;filled.add("estimatedMarketValue"); }

      // form.reset with merged values atomically updates ALL Controller-managed fields
      form.reset(merged, { keepErrors: false, keepIsSubmitted: false });

      setAutoFilledFields(filled);

    } catch (err) {
      setLookupError("Could not reach lookup service. Please enter details manually.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleLookup = () => runLookup(lookupAddress);

  /* ── Use device location ── */
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLookupError("Location access is not supported by this browser.");
      return;
    }
    setIsLocating(true);
    setLookupError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
          const res = await fetch(`${BASE}/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (!res.ok) {
            setLookupError(data.error || "Could not determine your address. Please type it manually.");
            setIsLocating(false);
            return;
          }
          const addr = data.formattedAddress as string;
          setLookupAddress(addr);
          setIsLocating(false);
          // Automatically run the lookup with the detected address
          await runLookup(addr);
        } catch {
          setLookupError("Could not determine your address. Please type it manually.");
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLookupError("Location access was denied. Please type your address or allow location in your browser settings.");
        } else {
          setLookupError("Could not get your location. Please type your address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  /* ── OCR upload ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setOcrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsOcring(true);
    setOcrError(null);
    setLookupError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/ocr-tax-record`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setOcrError(data.error || "Could not read the document. Try a clearer photo.");
        return;
      }

      // Merge OCR results into the form exactly like a property lookup
      const current = form.getValues();
      const filled = new Set<string>(autoFilledFields);
      const merged: GrievanceFormValues = { ...current };

      const str = (v: any) => (v != null && v !== "" ? String(v) : undefined);
      const num = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v) : undefined);

      if (data.propertyAddress) { merged.propertyAddress = data.propertyAddress; filled.add("propertyAddress"); }
      if (data.county)          { merged.county          = data.county;          filled.add("county"); }
      if (data.municipality)    { merged.municipality    = data.municipality;    filled.add("municipality"); }
      if (data.schoolDistrict)  { merged.schoolDistrict  = data.schoolDistrict;  filled.add("schoolDistrict"); }
      if (data.parcelId)        { merged.parcelId        = data.parcelId;        filled.add("parcelId"); }
      if (data.propertyClass)   { merged.propertyClass   = data.propertyClass;   filled.add("propertyClass"); }
      if (num(data.yearBuilt))  { merged.yearBuilt       = num(data.yearBuilt);  filled.add("yearBuilt"); }
      if (num(data.livingArea)) { merged.livingArea      = num(data.livingArea); filled.add("livingArea"); }
      if (data.lotSize)         { merged.lotSize         = data.lotSize;         filled.add("lotSize"); }
      if (num(data.estimatedMarketValue)) { merged.estimatedMarketValue = num(data.estimatedMarketValue)!; filled.add("estimatedMarketValue"); }
      if (num(data.totalAssessment))      { merged.currentAssessment   = num(data.totalAssessment)!;      filled.add("currentAssessment"); }
      if (num(data.taxYear))              { merged.taxYear             = num(data.taxYear)!;              filled.add("taxYear"); }
      if (data.ownerName && !current.ownerName) { merged.ownerName = data.ownerName; filled.add("ownerName"); }
      if (data.filingDeadline) { merged.filingDeadline = str(data.filingDeadline); filled.add("filingDeadline"); }

      form.reset(merged, { keepErrors: false, keepIsSubmitted: false });
      setAutoFilledFields(filled);

      // Also fill the address bar if we got an address
      if (data.propertyAddress) setLookupAddress(data.propertyAddress);

    } catch {
      setOcrError("Could not connect to the scanning service. Please try again.");
    } finally {
      setIsOcring(false);
      // Reset the input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isAutoFilled = (field: string) => autoFilledFields.has(field);
  const autoFillClass = (field: string) =>
    isAutoFilled(field) ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-300" : "";

  /* ── Savings estimate ── */
  const watchedAssessment = form.watch("currentAssessment");
  const watchedRequested = form.watch("requestedAssessment");
  const estimatedSavings = (() => {
    const over = Number(watchedAssessment) - Number(watchedRequested);
    if (!over || over <= 0) return null;
    const low = Math.round(over * 0.015);
    const high = Math.round(over * 0.025);
    return { low, high };
  })();

  /* ── Submit ── */
  const onSubmit = async (data: GrievanceFormValues) => {
    if (!isEditing && !userHasPaid) {
      setShowPaymentModal(true);
      return;
    }
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data });
        toast({ title: "Grievance updated successfully" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Case created — add comparables to strengthen your filing" });
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error saving",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="border-b border-border pb-2 mb-4">
      <h4 className="font-semibold text-base text-foreground">{title}</h4>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );

  const STATE_TILES = [
    { value: "NY", flag: "🗽", name: "New York",   form: "RP-524",           body: "Board of Assessment Review" },
    { value: "NJ", flag: "🔵", name: "New Jersey", form: "Form A-1",         body: "County Board of Taxation" },
    { value: "TX", flag: "⭐", name: "Texas",      form: "Notice of Protest", body: "Appraisal Review Board" },
    { value: "FL", flag: "🌴", name: "Florida",    form: "DR-486 Petition",   body: "Value Adjustment Board" },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-2">

      {/* ── Step Progress Bar ── */}
      {!isEditing && (
        <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-secondary/30 text-xs font-semibold">
          {[
            { n: 1, label: "Property" },
            { n: 2, label: "Values" },
            { n: 3, label: "Review" },
            { n: 4, label: "Submit & Pay" },
          ].map(({ n, label }, i, arr) => (
            <div
              key={n}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 ${
                n === 4
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              } ${i < arr.length - 1 ? "border-r border-border" : ""}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                n === 4 ? "bg-white/20 text-white" : "bg-secondary border border-border text-foreground"
              }`}>{n}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── State Selector — always first ── */}
      {!isEditing && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Which state is your property in?</p>
          <div className="grid grid-cols-2 gap-3">
            {STATE_TILES.map(({ value, flag, name, form: formName, body }) => {
              const active = selectedState === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    form.setValue("state", value);
                    const defaultCounty = value === "TX" ? "Harris" : value === "NJ" ? "Bergen" : value === "FL" ? "Miami-Dade" : "Nassau";
                    const defaultBasis = value === "TX" ? "market_value" : "overvaluation";
                    form.setValue("county", defaultCounty);
                    form.setValue("basisOfComplaint", defaultBasis);
                    onStateChange?.(value);
                  }}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-white hover:border-primary/40 hover:bg-secondary/30"
                  }`}
                >
                  <span className="text-2xl leading-none mt-0.5">{flag}</span>
                  <div>
                    <div className={`font-bold text-sm leading-tight ${active ? "text-primary" : "text-foreground"}`}>{name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formName}</div>
                    <div className="text-xs text-muted-foreground">{body}</div>
                  </div>
                  {active && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Auto-fill lookup panel ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-primary">Auto-fill from Public Records</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Type your address and tap <strong>Look Up</strong>, use your location, or <strong>scan your tax bill</strong> — we'll extract county, parcel ID, year built, living area, and more automatically.
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="123 Main St, Garden City, NY 11530"
              value={lookupAddress}
              onChange={(e) => setLookupAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLookup())}
              className="flex-1 bg-white"
              autoComplete="street-address"
              inputMode="text"
            />
            <Button
              type="button"
              onClick={handleLookup}
              disabled={isLookingUp || isLocating || isOcring || !lookupAddress.trim()}
              className="gap-2 shrink-0"
            >
              {isLookingUp
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Looking up…</>
                : <><Search className="w-4 h-4" /> Look Up</>
              }
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseLocation}
              disabled={isLocating || isLookingUp || isOcring}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              {isLocating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting…</>
                : <><LocateFixed className="w-4 h-4" /> Use My Location</>
              }
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isOcring || isLookingUp || isLocating}
              className="gap-2 border-amber-400/60 text-amber-700 hover:bg-amber-50"
            >
              {isOcring
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
                : <><Camera className="w-4 h-4" /> Scan Tax Bill</>
              }
            </Button>
          </div>
        </div>

        {/* OCR image preview + status */}
        {ocrPreview && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <img
              src={ocrPreview}
              alt="Tax bill preview"
              className="w-16 h-16 object-cover rounded-md border border-amber-300 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              {isOcring ? (
                <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reading your tax bill with AI — this takes a few seconds…
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Document scanned — fields filled below
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Review each auto-filled field and correct anything that doesn't look right.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setOcrPreview(null); setOcrError(null); }}
              className="text-muted-foreground hover:text-foreground p-0.5 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* OCR error */}
        {ocrError && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{ocrError}</span>
          </div>
        )}

        {/* Error */}
        {lookupError && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{lookupError}</span>
          </div>
        )}

        {/* Success result */}
        {lookupResult && (
          <div className="space-y-3">
            {/* Quick summary badge row */}
            <div className={`rounded-lg border p-3 text-sm space-y-2 ${
              lookupResult.confidence === "high"
                ? "border-emerald-200 bg-emerald-50"
                : lookupResult.confidence === "partial"
                ? "border-amber-200 bg-amber-50"
                : "border-blue-200 bg-blue-50"
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {lookupResult.confidence === "high"
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <Info className="w-4 h-4 text-amber-600" />
                }
                <span>
                  {lookupResult.confidence === "high"
                    ? `Found via ${lookupResult.source}`
                    : lookupResult.confidence === "partial"
                    ? `Partial data from ${lookupResult.source}`
                    : `Location confirmed via ${lookupResult.source}`
                  }
                </span>
              </div>

              {lookupResult.fieldsFound.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">
                    Fields auto-filled ({lookupResult.fieldsFound.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lookupResult.fieldsFound.map(f => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
                        ✓ {FIELD_LABELS[f] || f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Full property record card */}
            <PropertyRecordCard result={lookupResult} />
          </div>
        )}
      </div>

      {/* ---- Part 1A: Owner / Complainant ---- */}
      <div>
        <SectionHeader
          title="Part 1A — Complainant (Owner) Information"
          subtitle={isTX
            ? "This information goes onto your Notice of Protest filing with the County Appraisal District."
            : "This information goes directly onto your RP-524 filing."
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ownerName">Full Owner Name *</Label>
            <Input id="ownerName" placeholder="Jane M. Doe" {...form.register("ownerName")} />
            {form.formState.errors.ownerName && (
              <p className="text-xs text-destructive">{form.formState.errors.ownerName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerPhone">Phone Number</Label>
            <Input id="ownerPhone" type="tel" placeholder="(516) 555-0100" {...form.register("ownerPhone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerEmail">Email Address</Label>
            <Input id="ownerEmail" type="email" placeholder="jane@example.com" {...form.register("ownerEmail")} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="ownerMailingAddress">
              Mailing Address <span className="text-muted-foreground text-xs">(if different from property)</span>
            </Label>
            <Input id="ownerMailingAddress" placeholder="P.O. Box 123, Town, NY 11000" {...form.register("ownerMailingAddress")} />
          </div>
        </div>
      </div>

      {/* ---- Part 1B: Property Identification ---- */}
      <div>
        <SectionHeader
          title="Part 1B — Property Identification"
          subtitle={isTX
            ? "Use the auto-fill above or enter from your Notice of Appraised Value (appraisal notice)."
            : "Use the auto-fill above to populate these fields, or enter them manually from your tax bill."
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="propertyAddress">
              Property Street Address *
              {isAutoFilled("propertyAddress") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <Input
                  id="propertyAddress"
                  placeholder={isTX ? "123 Main St, Houston, TX 77001" : "123 Main Street, Town, NY 11000"}
                  className={autoFillClass("propertyAddress")}
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
            {form.formState.errors.propertyAddress && (
              <p className="text-xs text-destructive">{form.formState.errors.propertyAddress.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="county">
              County *
              {isAutoFilled("county") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="county"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger id="county" className={autoFillClass("county")}>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCountyOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {isTX && <p className="text-xs text-muted-foreground">Select your County Appraisal District (CAD)</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="municipality">
              {isTX ? "City" : "Municipality / Town"} *
              {isAutoFilled("municipality") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="municipality"
              render={({ field }) => (
                <Input
                  id="municipality"
                  placeholder={isTX ? "Houston" : "Town of Hempstead"}
                  className={autoFillClass("municipality")}
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
          </div>

          {!isTX && (
            <div className="space-y-1.5">
              <Label htmlFor="schoolDistrict">
                School District
                {isAutoFilled("schoolDistrict") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
              </Label>
              <Controller
                control={form.control}
                name="schoolDistrict"
                render={({ field }) => (
                  <Input
                    id="schoolDistrict"
                    placeholder="Garden City UFSD"
                    className={autoFillClass("schoolDistrict")}
                    {...field}
                    value={field.value ?? ""}
                  />
                )}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="parcelId">
              {isTX ? "Appraisal District Account Number" : "Tax Map Number / Parcel ID (SBL)"}
              {isAutoFilled("parcelId") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="parcelId"
              render={({ field }) => (
                <Input
                  id="parcelId"
                  placeholder={isTX ? "e.g. 0651580000001" : "e.g. 0400-056.00-01.00-001.000"}
                  className={autoFillClass("parcelId")}
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              {isTX ? "Found on your Notice of Appraised Value or CAD website" : "Found on your tax bill under \"Section/Block/Lot\""}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="propertyClass">
              {isTX ? "Property Type" : "Property Classification Code"}
              {isAutoFilled("propertyClass") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="propertyClass"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger id="propertyClass" className={autoFillClass("propertyClass")}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPropertyClassOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yearBuilt">
              Year Built
              {isAutoFilled("yearBuilt") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="yearBuilt"
              render={({ field }) => (
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="1978"
                  className={autoFillClass("yearBuilt")}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="livingArea">
              Living Area (sq ft)
              {isAutoFilled("livingArea") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="livingArea"
              render={({ field }) => (
                <Input
                  id="livingArea"
                  type="number"
                  placeholder="1850"
                  className={autoFillClass("livingArea")}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lotSize">
              Lot Size
              {isAutoFilled("lotSize") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="lotSize"
              render={({ field }) => (
                <Input
                  id="lotSize"
                  placeholder="0.25 acres / 10,890 sq ft"
                  className={autoFillClass("lotSize")}
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* ---- Part 2: Basis of Complaint ---- */}
      <div>
        <SectionHeader
          title={isTX ? "Part 2 — Grounds for Protest" : "Part 2 — Basis of Complaint"}
          subtitle={isTX
            ? "Select the ground(s) for your protest. Most homeowners use Incorrect Appraised Value or Unequal Appraisal."
            : "Select the legal basis for your grievance. Most homeowners use Overvaluation."
          }
        />
        <div className="space-y-2">
          {currentBasisOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                form.watch("basisOfComplaint") === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-secondary/30"
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                {...form.register("basisOfComplaint")}
                className="mt-0.5 accent-primary"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ---- Part 3: Assessment Details ---- */}
      <div>
        <SectionHeader
          title="Part 3 — Statement of Value"
          subtitle={isTX
            ? "Enter figures from your Notice of Appraised Value and your opinion of true market value."
            : isNJ
            ? "Enter figures from your property tax card / assessment notice and your estimate of true value."
            : "Enter figures from your tax bill and your estimate of fair market value."
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="taxYear">Tax Year *</Label>
            <Input id="taxYear" type="number" {...form.register("taxYear")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currentAssessment">
              {isTX ? "Current Appraised Value ($) *" : "Current Assessment ($) *"}
            </Label>
            <Input id="currentAssessment" type="number" placeholder={isTX ? "425000" : "12500"} {...form.register("currentAssessment")} />
            <p className="text-xs text-muted-foreground">
              {isTX
                ? "From your Notice of Appraised Value (the CAD's number)"
                : isNJ
                ? "From your assessment notice or tax bill (assessed value)"
                : "From your tax bill (assessed value)"
              }
            </p>
            {form.formState.errors.currentAssessment && (
              <p className="text-xs text-destructive">{form.formState.errors.currentAssessment.message}</p>
            )}
          </div>
          {!isTX && (
            <div className="space-y-1.5">
              <Label htmlFor="equalizationRate">
                {isNJ ? "Equalization Ratio (Chapter 123) (%)" : "Equalization Rate (%)"}
              </Label>
              <Input id="equalizationRate" type="number" step="0.01" placeholder={isNJ ? "84.5" : "1.0"} {...form.register("equalizationRate")} />
              <p className="text-xs text-muted-foreground">
                {isNJ
                  ? "Set annually by NJ Division of Taxation for your municipality"
                  : "Found on your tax bill or NYS Dept. of Tax"
                }
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="estimatedMarketValue">
              {isTX ? "Your Opinion of Market Value ($) *" : "Your Est. Market Value ($) *"}
              {isAutoFilled("estimatedMarketValue") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Controller
              control={form.control}
              name="estimatedMarketValue"
              render={({ field }) => (
                <Input
                  id="estimatedMarketValue"
                  type="number"
                  placeholder="550000"
                  className={autoFillClass("estimatedMarketValue")}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              {isTX ? "What you believe the property is truly worth (market value)" : "What you believe your home is worth"}
            </p>
            {form.formState.errors.estimatedMarketValue && (
              <p className="text-xs text-destructive">{form.formState.errors.estimatedMarketValue.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requestedAssessment">
              {isTX ? "Requested Appraised Value ($) *" : "Requested Assessment ($) *"}
            </Label>
            <Input id="requestedAssessment" type="number" placeholder={isTX ? "380000" : "11000"} {...form.register("requestedAssessment")} />
            <p className="text-xs text-muted-foreground">
              {isTX
                ? "Your requested value — typically your opinion of market value"
                : isNJ
                ? "Typically: Est. Market Value × (Equalization Ratio ÷ 100)"
                : "Typically: Est. Market Value × (Eq. Rate ÷ 100)"
              }
            </p>
            {form.formState.errors.requestedAssessment && (
              <p className="text-xs text-destructive">{form.formState.errors.requestedAssessment.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filingDeadline">Filing Deadline</Label>
            <Input id="filingDeadline" type="date" {...form.register("filingDeadline")} />
          </div>
        </div>
      </div>

      {/* ---- Notes ---- */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional Notes / Property Condition Issues</Label>
        <Textarea
          id="notes"
          placeholder="Describe any conditions that reduce value: needed repairs, flooding issues, outdated kitchen, proximity to commercial, etc."
          className="min-h-20"
          {...form.register("notes")}
        />
        <p className="text-xs text-muted-foreground">
          {isTX
            ? "These notes support your protest grounds on the Notice of Protest."
            : isNJ
            ? "These notes will support your A-1 petition and can be presented at the County Board hearing."
            : "These notes will appear on the printed RP-524 under \"Other Information\"."
          }
        </p>
      </div>

      {/* ── Savings estimate + submit ── */}
      <div className="pt-4 border-t border-border space-y-3">
        {!isEditing && estimatedSavings && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-green-700 font-semibold text-sm">
              💰 Estimated savings: ${estimatedSavings.low.toLocaleString()}–${estimatedSavings.high.toLocaleString()}/year
            </p>
            <p className="text-green-600 text-xs mt-0.5">
              Based on your over-assessment amount and typical local tax rates.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-lg shadow-primary/20 gap-2"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : isEditing ? (
              "Save Changes"
            ) : userHasPaid ? (
              "Create Case"
            ) : (
              <><Lock className="w-4 h-4" /> Generate My Appeal ($99)</>
            )}
          </Button>
        </div>

        {!isEditing && !userHasPaid && (
          <p className="text-sm text-muted-foreground text-right">
            If you don't save money, you don't pay again next year.
          </p>
        )}
      </div>

      {/* ── Payment Modal ── */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Unlock Your Tax Appeal Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-muted-foreground">
              We've prepared your filing. Complete payment to generate your pre-filled form, comparable sales report, and step-by-step county instructions.
            </p>
            {estimatedSavings && (
              <p className="text-green-700 font-semibold">
                💰 Your estimated savings: ${estimatedSavings.low.toLocaleString()}–${estimatedSavings.high.toLocaleString()}/year
              </p>
            )}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✔ Pre-filled state form (RP-524, A-1, Notice of Protest, or DR-486)</p>
              <p>✔ Printable comparable sales report</p>
              <p>✔ County-specific filing instructions &amp; portal link</p>
              <p>✔ Step-by-step guidance to avoid common mistakes</p>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 gap-2"
            >
              {checkoutLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Opening Checkout…</>
                : "Pay $99 — Generate My Appeal"
              }
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              One-time payment · No subscription · Secured by Stripe.
            </p>
            <p className="text-xs text-center text-muted-foreground">
              If you don't save, you don't pay again next year.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
