import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGrievance, useUpdateGrievance } from "@/hooks/use-grievances";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, CheckCircle2, AlertTriangle, Info, Sparkles } from "lucide-react";
import type { Grievance } from "@workspace/api-client-react";
import { PropertyRecordCard } from "@/components/PropertyRecordCard";
import type { LookupResult } from "@/components/PropertyRecordCard";

/* ─── Schema ────────────────────────────────────────── */

const grievanceSchema = z.object({
  ownerName: z.string().min(2, "Owner name is required"),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().optional(),
  ownerMailingAddress: z.string().optional(),
  propertyAddress: z.string().min(5, "Property address is required"),
  county: z.string().min(2, "County is required"),
  municipality: z.string().min(2, "Municipality/Town is required"),
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

interface GrievanceFormProps {
  initialData?: Grievance;
  onSuccess?: () => void;
}

/* ─── Component ─────────────────────────────────────── */

export function GrievanceForm({ initialData, onSuccess }: GrievanceFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateGrievance();
  const updateMutation = useUpdateGrievance();

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Lookup state
  const [lookupAddress, setLookupAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const form = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: initialData
      ? {
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
          taxYear: new Date().getFullYear(),
          county: "Nassau",
          basisOfComplaint: "overvaluation",
        },
  });

  /* ── Property lookup ── */
  const handleLookup = async () => {
    if (!lookupAddress.trim()) return;
    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/property-lookup?address=${encodeURIComponent(lookupAddress)}`);
      const data = await res.json();

      if (!res.ok) {
        setLookupError(data.error || "Lookup failed. Please enter details manually.");
        return;
      }

      const result = data as LookupResult;
      setLookupResult(result);

      // Auto-fill form fields
      const filled = new Set<string>();
      if (result.county) { form.setValue("county", result.county); filled.add("county"); }
      if (result.municipality) { form.setValue("municipality", result.municipality); filled.add("municipality"); }
      if (result.schoolDistrict) { form.setValue("schoolDistrict", result.schoolDistrict); filled.add("schoolDistrict"); }
      if (result.parcelId) { form.setValue("parcelId", result.parcelId); filled.add("parcelId"); }
      if (result.propertyClass) { form.setValue("propertyClass", result.propertyClass); filled.add("propertyClass"); }
      if (result.yearBuilt) { form.setValue("yearBuilt", result.yearBuilt); filled.add("yearBuilt"); }
      if (result.livingArea) { form.setValue("livingArea", result.livingArea); filled.add("livingArea"); }
      if (result.lotSize) { form.setValue("lotSize", result.lotSize); filled.add("lotSize"); }
      if (result.estimatedMarketValue) { form.setValue("estimatedMarketValue", result.estimatedMarketValue); filled.add("estimatedMarketValue"); }

      // Auto-fill address if blank
      if (!form.getValues("propertyAddress")) {
        form.setValue("propertyAddress", lookupAddress);
        filled.add("propertyAddress");
      }

      setAutoFilledFields(filled);

    } catch (err) {
      setLookupError("Could not reach lookup service. Please enter details manually.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const isAutoFilled = (field: string) => autoFilledFields.has(field);
  const autoFillClass = (field: string) =>
    isAutoFilled(field) ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-300" : "";

  /* ── Submit ── */
  const onSubmit = async (data: GrievanceFormValues) => {
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-2">

      {/* ── Auto-fill lookup panel ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-primary">Auto-fill from Public Records</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the property address and we'll look up county, municipality, year built, living area, and more from public tax records. You can edit anything afterwards.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="123 Main St, Garden City, NY 11530"
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLookup())}
            className="flex-1 bg-white"
          />
          <Button
            type="button"
            onClick={handleLookup}
            disabled={isLookingUp || !lookupAddress.trim()}
            className="gap-2 shrink-0"
          >
            {isLookingUp
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Looking up…</>
              : <><Search className="w-4 h-4" /> Look Up</>
            }
          </Button>
        </div>

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
          subtitle="This information goes directly onto your RP-524 filing."
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
          subtitle="Use the auto-fill above to populate these fields, or enter them manually from your tax bill."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="propertyAddress">
              Property Street Address *
              {isAutoFilled("propertyAddress") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="propertyAddress"
              placeholder="123 Main Street, Town, NY 11000"
              className={autoFillClass("propertyAddress")}
              {...form.register("propertyAddress")}
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
            <Select
              onValueChange={(v) => form.setValue("county", v)}
              value={form.watch("county")}
            >
              <SelectTrigger id="county" className={autoFillClass("county")}>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {COUNTY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="municipality">
              Municipality / Town *
              {isAutoFilled("municipality") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="municipality"
              placeholder="Town of Hempstead"
              className={autoFillClass("municipality")}
              {...form.register("municipality")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="schoolDistrict">
              School District
              {isAutoFilled("schoolDistrict") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="schoolDistrict"
              placeholder="Garden City UFSD"
              className={autoFillClass("schoolDistrict")}
              {...form.register("schoolDistrict")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parcelId">
              Tax Map Number / Parcel ID (SBL)
              {isAutoFilled("parcelId") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="parcelId"
              placeholder="e.g. 0400-056.00-01.00-001.000"
              className={autoFillClass("parcelId")}
              {...form.register("parcelId")}
            />
            <p className="text-xs text-muted-foreground">Found on your tax bill under "Section/Block/Lot"</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="propertyClass">
              Property Classification Code
              {isAutoFilled("propertyClass") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Select
              onValueChange={(v) => form.setValue("propertyClass", v)}
              value={form.watch("propertyClass")}
            >
              <SelectTrigger id="propertyClass" className={autoFillClass("propertyClass")}>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_CLASS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yearBuilt">
              Year Built
              {isAutoFilled("yearBuilt") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="yearBuilt"
              type="number"
              placeholder="1978"
              className={autoFillClass("yearBuilt")}
              {...form.register("yearBuilt")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="livingArea">
              Living Area (sq ft)
              {isAutoFilled("livingArea") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="livingArea"
              type="number"
              placeholder="1850"
              className={autoFillClass("livingArea")}
              {...form.register("livingArea")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lotSize">
              Lot Size
              {isAutoFilled("lotSize") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="lotSize"
              placeholder="0.25 acres / 10,890 sq ft"
              className={autoFillClass("lotSize")}
              {...form.register("lotSize")}
            />
          </div>
        </div>
      </div>

      {/* ---- Part 2: Basis of Complaint ---- */}
      <div>
        <SectionHeader
          title="Part 2 — Basis of Complaint"
          subtitle="Select the legal basis for your grievance. Most homeowners use Overvaluation."
        />
        <div className="space-y-2">
          {BASIS_OPTIONS.map((opt) => (
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
          subtitle="Enter figures from your tax bill and your estimate of fair market value."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="taxYear">Tax Year *</Label>
            <Input id="taxYear" type="number" {...form.register("taxYear")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currentAssessment">Current Assessment ($) *</Label>
            <Input id="currentAssessment" type="number" placeholder="12500" {...form.register("currentAssessment")} />
            <p className="text-xs text-muted-foreground">From your tax bill (assessed value)</p>
            {form.formState.errors.currentAssessment && (
              <p className="text-xs text-destructive">{form.formState.errors.currentAssessment.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equalizationRate">Equalization Rate (%)</Label>
            <Input id="equalizationRate" type="number" step="0.01" placeholder="1.0" {...form.register("equalizationRate")} />
            <p className="text-xs text-muted-foreground">Found on your tax bill or NYS Dept. of Tax</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimatedMarketValue">
              Your Est. Market Value ($) *
              {isAutoFilled("estimatedMarketValue") && <span className="ml-2 text-xs text-emerald-600 font-medium">✓ auto-filled</span>}
            </Label>
            <Input
              id="estimatedMarketValue"
              type="number"
              placeholder="550000"
              className={autoFillClass("estimatedMarketValue")}
              {...form.register("estimatedMarketValue")}
            />
            <p className="text-xs text-muted-foreground">What you believe your home is worth</p>
            {form.formState.errors.estimatedMarketValue && (
              <p className="text-xs text-destructive">{form.formState.errors.estimatedMarketValue.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requestedAssessment">Requested Assessment ($) *</Label>
            <Input id="requestedAssessment" type="number" placeholder="11000" {...form.register("requestedAssessment")} />
            <p className="text-xs text-muted-foreground">
              Typically: Est. Market Value × (Eq. Rate ÷ 100)
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
        <p className="text-xs text-muted-foreground">These notes will appear on the printed RP-524 under "Other Information".</p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-lg shadow-primary/20"
        >
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Case"}
        </Button>
      </div>
    </form>
  );
}
