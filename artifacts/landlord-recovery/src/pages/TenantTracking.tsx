import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Search, AlertCircle, Phone, Car, Building2, User,
  MapPin, FileText, DollarSign, Users, Globe, Save,
} from "lucide-react";

const DRAFT_KEY = "tenant_tracking_draft";

interface FormData {
  tenantName: string; dob: string; ssnLast4: string; driversLicense: string;
  primaryPhone: string; secondaryPhone: string; email: string;
  employerName: string; employerPhone: string; employerAddress: string;
  emergencyContact: string; emergencyPhone: string;
  coSignerName: string; coSignerPhone: string;
  vehicleMake: string; vehicleModel: string; vehicleColor: string; licensePlate: string;
  lastKnownAddress: string; forwardingAddress: string; possibleNewAddress: string;
  utilities: string; bankName: string;
  facebook: string; instagram: string; linkedin: string; tiktok: string;
  rentOwed: string; damagesOwed: string; utilityBalance: string;
  moveOutDate: string; lastPaymentDate: string;
  knownRelatives: string; knownFriends: string; knownHangouts: string;
  workplaceClues: string; notes: string;
}

const EMPTY: FormData = {
  tenantName: "", dob: "", ssnLast4: "", driversLicense: "",
  primaryPhone: "", secondaryPhone: "", email: "",
  employerName: "", employerPhone: "", employerAddress: "",
  emergencyContact: "", emergencyPhone: "",
  coSignerName: "", coSignerPhone: "",
  vehicleMake: "", vehicleModel: "", vehicleColor: "", licensePlate: "",
  lastKnownAddress: "", forwardingAddress: "", possibleNewAddress: "",
  utilities: "", bankName: "",
  facebook: "", instagram: "", linkedin: "", tiktok: "",
  rentOwed: "", damagesOwed: "", utilityBalance: "",
  moveOutDate: "", lastPaymentDate: "",
  knownRelatives: "", knownFriends: "", knownHangouts: "",
  workplaceClues: "", notes: "",
};

function loadDraft(): FormData {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch { return EMPTY; }
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <h3 className="font-serif font-semibold text-lg text-foreground">{title}</h3>
    </div>
  );
}

function Field({
  label, field, placeholder, type = "text", data, onChange,
}: {
  label: string; field: keyof FormData; placeholder?: string;
  type?: string; data: FormData; onChange: (f: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Input
        type={type}
        value={data[field]}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function TenantTracking() {
  const { toast } = useToast();
  const [data, setData] = useState<FormData>(loadDraft);

  const update = (field: keyof FormData, value: string) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const totalOwed =
    (parseFloat(data.rentOwed.replace(/[^0-9.]/g, "")) || 0) +
    (parseFloat(data.damagesOwed.replace(/[^0-9.]/g, "")) || 0) +
    (parseFloat(data.utilityBalance.replace(/[^0-9.]/g, "")) || 0);

  const handleSave = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      toast({ title: "Recovery file saved", description: "Your data has been saved in this browser." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const handleClear = () => {
    setData(EMPTY);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    toast({ title: "File cleared" });
  };

  const f = (field: keyof FormData, label: string, placeholder?: string, type?: string) => (
    <Field key={field} label={label} field={field} placeholder={placeholder} type={type} data={data} onChange={update} />
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Search className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Tenant Tracking & Recovery</h1>
          </div>
          <p className="text-muted-foreground">
            Capture every piece of intelligence immediately after move-out. Recovery success drops sharply after 30–60 days.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleClear} className="text-muted-foreground">
            Clear form
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save className="h-4 w-4 mr-2" /> Save file
          </Button>
        </div>
      </div>

      {/* Urgency Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Act within the first 30 days</p>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Employers, phone numbers, social profiles, and forwarding information become much harder to trace over time.
          </p>
        </div>
      </div>

      {/* Total Owed Summary */}
      {totalOwed > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-5 py-3">
          <span className="text-sm text-muted-foreground font-medium">Total recovery target</span>
          <span className="text-2xl font-bold text-foreground">
            ${totalOwed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tenant Identity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionHeading icon={<User className="h-4 w-4" />} title="Tenant Identity" />
            <div className="grid gap-4">
              {f("tenantName", "Full Legal Name", "John Smith")}
              {f("dob", "Date of Birth", undefined, "date")}
              {f("ssnLast4", "Last 4 of SSN", "1234")}
              {f("driversLicense", "Driver License Number", "License Number")}
            </div>

            <Separator className="my-2" />
            <SectionHeading icon={<Phone className="h-4 w-4" />} title="Contact Information" />
            <div className="grid gap-4">
              {f("primaryPhone", "Primary Phone", "(555) 555-5555")}
              {f("secondaryPhone", "Secondary Phone", "Alternative number")}
              {f("email", "Email Address", "tenant@email.com")}
            </div>

            <Separator className="my-2" />
            <SectionHeading icon={<Building2 className="h-4 w-4" />} title="Employment" />
            <div className="grid gap-4">
              {f("employerName", "Employer Name", "Company Name")}
              {f("employerPhone", "Employer Phone", "(555) 555-5555")}
              {f("employerAddress", "Employer Address", "123 Business Pkwy")}
            </div>

            <Separator className="my-2" />
            <SectionHeading icon={<Users className="h-4 w-4" />} title="Guarantors & Emergency Contacts" />
            <div className="grid gap-4">
              {f("emergencyContact", "Emergency Contact Name", "Relative or friend")}
              {f("emergencyPhone", "Emergency Contact Phone", "(555) 555-5555")}
              {f("coSignerName", "Co-Signer Name", "Co-signer")}
              {f("coSignerPhone", "Co-Signer Phone", "(555) 555-5555")}
            </div>
          </CardContent>
        </Card>

        {/* Location & Vehicle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Location & Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionHeading icon={<Car className="h-4 w-4" />} title="Vehicle Information" />
            <div className="grid grid-cols-2 gap-4">
              {f("vehicleMake", "Make", "Honda")}
              {f("vehicleModel", "Model", "Civic")}
              {f("vehicleColor", "Color", "Black")}
              {f("licensePlate", "License Plate", "ABC-1234")}
            </div>

            <Separator className="my-2" />
            <SectionHeading icon={<MapPin className="h-4 w-4" />} title="Address Information" />
            <div className="grid gap-4">
              {f("lastKnownAddress", "Last Known Address", "123 Main St")}
              {f("forwardingAddress", "Forwarding Address", "If provided")}
              {f("possibleNewAddress", "Possible New Address", "Relocation clue")}
            </div>

            <Separator className="my-2" />
            <SectionHeading icon={<DollarSign className="h-4 w-4" />} title="Financial Recovery" />
            <div className="grid gap-4">
              {f("rentOwed", "Rent Owed", "3500")}
              {f("damagesOwed", "Damages Owed", "1200")}
              {f("utilityBalance", "Utility Balance", "400")}
            </div>

            <Separator className="my-2" />
            <SectionHeading icon={<FileText className="h-4 w-4" />} title="Key Dates" />
            <div className="grid grid-cols-2 gap-4">
              {f("moveOutDate", "Move-Out Date", undefined, "date")}
              {f("lastPaymentDate", "Last Payment Date", undefined, "date")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Recovery Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SectionHeading icon={<Globe className="h-4 w-4" />} title="Social Media" />
              {f("facebook", "Facebook", "facebook.com/profile")}
              {f("instagram", "Instagram", "@handle")}
              {f("linkedin", "LinkedIn", "LinkedIn profile URL")}
              {f("tiktok", "TikTok", "@handle")}
            </div>

            <div className="space-y-4">
              <SectionHeading icon={<Users className="h-4 w-4" />} title="Associates & Clues" />
              {f("knownRelatives", "Known Relatives", "Names / locations")}
              {f("knownFriends", "Known Friends / Associates", "Names / roommates")}
              {f("knownHangouts", "Known Hangouts", "Bars, gyms, job sites")}
              {f("workplaceClues", "Workplace Clues", "Uniforms, vehicles, job sites")}
            </div>

            <div className="space-y-4">
              <SectionHeading icon={<Building2 className="h-4 w-4" />} title="Financial Clues" />
              {f("utilities", "Utility Companies", "National Grid, Verizon, etc.")}
              {f("bankName", "Bank Name", "If known")}
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Additional Recovery Notes</Label>
            <p className="text-xs text-muted-foreground">
              Document any informal intelligence: neighbor tips, sightings, Cash App usernames, social media activity, etc.
            </p>
            <Textarea
              value={data.notes}
              onChange={e => update("notes", e.target.value)}
              rows={6}
              placeholder="Neighbor said tenant moved to another county… Saw tenant working construction in Nassau… Cash App username @…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pb-4">
        <Button variant="outline" onClick={handleClear} className="text-muted-foreground">
          Clear form
        </Button>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground px-8">
          <Save className="h-4 w-4 mr-2" /> Save Recovery File
        </Button>
      </div>
    </div>
  );
}
