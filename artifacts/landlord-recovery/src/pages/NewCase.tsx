import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateLandlordCase } from "@workspace/api-client-react";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowLeft, ArrowRight, CheckCircle2, Building, User, FileText, ChevronLeft, ChevronRight, Sparkles, Loader2, Info, Check, AlertCircle, ChevronsUpDown, Lock } from "lucide-react";
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

const STEPS = [
  { id: "type", title: "Claim Basics", icon: FileText },
  { id: "parties", title: "Parties Info", icon: User },
  { id: "property", title: "Property & Lease", icon: Building },
  { id: "review", title: "Review", icon: CheckCircle2 },
];

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

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (step === 0) fieldsToValidate = ['claimType', 'state', 'claimAmount', 'description'];
    if (step === 1) fieldsToValidate = ['landlordName', 'tenantName', 'landlordEmail', 'tenantEmail', 'landlordPhone', 'tenantPhone', 'tenantAddress'];
    if (step === 2) fieldsToValidate = ['propertyAddress', 'monthlyRent', 'leaseStartDate', 'leaseEndDate', 'moveOutDate'];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(s => Math.min(STEPS.length - 1, s + 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(0, s - 1));
    window.scrollTo(0, 0);
  };

  const onSubmit = (data: FormValues) => {
    const { filingAsLLC: _filingAsLLC, ...rest } = data;
    const submitData = {
      ...rest,
      claimType: Array.isArray(data.claimType) ? data.claimType.join(",") : data.claimType,
    };
    createCase.mutate({ data: submitData as any }, {
      onSuccess: (newCase) => {
        toast({
          title: "Case Created",
          description: "Your case has been saved successfully.",
        });
        setLocation(`/cases/${newCase.id}`);
      },
      onError: (error) => {
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
                    {step === 0 && "Define what you are claiming and where."}
                    {step === 1 && "Information about you and the tenant."}
                    {step === 2 && "Details about the property and lease agreement."}
                    {step === 3 && "Review the details before saving the case."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              {/* STEP 0: BASICS */}
              {step === 0 && (
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

              {/* STEP 1: PARTIES */}
              {step === 1 && (
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

              {/* STEP 2: PROPERTY & LEASE */}
              {step === 2 && (
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

              {/* STEP 3: REVIEW */}
              {step === 3 && (
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
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-muted/20 border-t border-border flex flex-col gap-3 p-6">
              <div className="flex justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={step === 0 || createCase.isPending}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                
                {step < STEPS.length - 1 ? (
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
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Your case will be saved as a draft. You can return and edit it at any time from My Cases.
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
