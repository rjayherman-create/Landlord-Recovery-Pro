import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGrievance, useUpdateGrievance } from "@/hooks/use-grievances";
import { useToast } from "@/hooks/use-toast";
import type { Grievance } from "@workspace/api-client-react";

const grievanceSchema = z.object({
  // Owner / Complainant
  ownerName: z.string().min(2, "Owner name is required"),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().optional(),
  ownerMailingAddress: z.string().optional(),
  // Property identification
  propertyAddress: z.string().min(5, "Property address is required"),
  county: z.string().min(2, "County is required"),
  municipality: z.string().min(2, "Municipality/Town is required"),
  schoolDistrict: z.string().optional(),
  parcelId: z.string().optional(),
  propertyClass: z.string().optional(),
  yearBuilt: z.coerce.number().min(1600).max(2030).optional(),
  livingArea: z.coerce.number().positive().optional(),
  lotSize: z.string().optional(),
  // Assessment
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

interface GrievanceFormProps {
  initialData?: Grievance;
  onSuccess?: () => void;
}

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

export function GrievanceForm({ initialData, onSuccess }: GrievanceFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateGrievance();
  const updateMutation = useUpdateGrievance();

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

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
          subtitle="Find your parcel ID (SBL / Section-Block-Lot) on your tax bill or county assessor's website."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="propertyAddress">Property Street Address *</Label>
            <Input id="propertyAddress" placeholder="123 Main Street, Town, NY 11000" {...form.register("propertyAddress")} />
            {form.formState.errors.propertyAddress && (
              <p className="text-xs text-destructive">{form.formState.errors.propertyAddress.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="county">County *</Label>
            <Select onValueChange={(v) => form.setValue("county", v)} defaultValue={form.getValues("county")}>
              <SelectTrigger id="county">
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
            <Label htmlFor="municipality">Municipality / Town *</Label>
            <Input id="municipality" placeholder="Town of Hempstead" {...form.register("municipality")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolDistrict">School District</Label>
            <Input id="schoolDistrict" placeholder="Garden City UFSD" {...form.register("schoolDistrict")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parcelId">Tax Map Number / Parcel ID (SBL)</Label>
            <Input id="parcelId" placeholder="e.g. 0400-056.00-01.00-001.000" {...form.register("parcelId")} />
            <p className="text-xs text-muted-foreground">Found on your tax bill under "Section/Block/Lot"</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="propertyClass">Property Classification Code</Label>
            <Select onValueChange={(v) => form.setValue("propertyClass", v)} defaultValue={form.getValues("propertyClass")}>
              <SelectTrigger id="propertyClass">
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
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input id="yearBuilt" type="number" placeholder="1978" {...form.register("yearBuilt")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="livingArea">Living Area (sq ft)</Label>
            <Input id="livingArea" type="number" placeholder="1850" {...form.register("livingArea")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lotSize">Lot Size</Label>
            <Input id="lotSize" placeholder="0.25 acres / 10,890 sq ft" {...form.register("lotSize")} />
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
            <Label htmlFor="estimatedMarketValue">Your Est. Market Value ($) *</Label>
            <Input id="estimatedMarketValue" type="number" placeholder="550000" {...form.register("estimatedMarketValue")} />
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
