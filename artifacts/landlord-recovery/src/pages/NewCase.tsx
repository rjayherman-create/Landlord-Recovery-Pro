import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateLandlordCase } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, CheckCircle2, Building, User, FileText, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
  claimType: z.enum(["unpaid_rent", "property_damage", "security_deposit", "lease_break", "other"] as const, { error: "Please select a claim type" }),
  state: z.string().min(2, "State is required"),
  claimAmount: z.coerce.number().min(1, "Claim amount must be greater than 0"),
  monthlyRent: z.coerce.number().optional(),
  monthsOwed: z.coerce.number().min(0).optional(),
  rentPeriod: z.string().optional(),
  description: z.string().min(10, "Please provide a brief description"),
  
  landlordName: z.string().min(2, "Your name is required"),
  landlordEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  landlordPhone: z.string().optional(),
  
  tenantName: z.string().min(2, "Tenant name is required"),
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
      claimType: undefined,
      state: "",
      claimAmount: 0,
      monthlyRent: undefined,
      monthsOwed: 0,
      rentPeriod: "",
      description: "",
      landlordName: "",
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
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const handleGenerateDesc = async () => {
    const vals = form.getValues();
    if (!vals.claimType || !vals.state || !vals.claimAmount) return;
    setGeneratingDesc(true);
    try {
      const resp = await fetch("/api/landlord-cases/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimType: vals.claimType,
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
    if (watchedClaimType === "unpaid_rent" && watchedMonthlyRent && count > 0) {
      const total = Number(watchedMonthlyRent) * count;
      if (total > 0) form.setValue("claimAmount", total, { shouldValidate: true });
    }
  }, [selectedMonths, watchedMonthlyRent, watchedClaimType]);

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
    createCase.mutate({ data: data as any }, {
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
                        <FormItem>
                          <FormLabel>Claim Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unpaid_rent">Unpaid Rent</SelectItem>
                              <SelectItem value="property_damage">Property Damage</SelectItem>
                              <SelectItem value="security_deposit">Security Deposit Dispute</SelectItem>
                              <SelectItem value="lease_break">Lease Break Fees</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STATES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchedClaimType === "unpaid_rent" ? (
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
                        <Label className="text-sm font-medium">Months Owed — check each month rent was not paid</Label>

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
                            <div className="text-xl font-bold text-foreground">
                              ${(Number(watchedMonthlyRent) * selectedMonths.size).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">This becomes your total claim amount</div>
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
                          <FormLabel>Total Claim Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 2500" {...field} />
                          </FormControl>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            disabled={generatingDesc || !form.getValues("claimType") || !form.getValues("state") || !form.getValues("claimAmount")}
                            onClick={handleGenerateDesc}
                          >
                            {generatingDesc
                              ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                              : <><Sparkles className="h-3 w-3" /> Generate with AI</>
                            }
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe what happened, or click Generate with AI above to draft one from your case details." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
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
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Your Information (Landlord)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="landlordName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name / Company</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
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
                            <FormLabel>Tenant Name(s)</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Smith" {...field} />
                            </FormControl>
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
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <h3 className="font-semibold text-lg mb-4 text-primary">Case Summary</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Claim Type</dt>
                        <dd className="font-medium">{form.getValues().claimType?.replace('_', ' ').toUpperCase()}</dd>
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
                      <div className="md:col-span-2">
                        <dt className="text-muted-foreground">Description</dt>
                        <dd className="font-medium mt-1">{form.getValues().description}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
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
            
            <CardFooter className="bg-muted/20 border-t border-border flex justify-between p-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep} 
                disabled={step === 0 || createCase.isPending}
              >
                Back
              </Button>
              
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep} className="bg-primary text-primary-foreground">
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createCase.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {createCase.isPending ? "Creating Case..." : "Save Case & Continue"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
