import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Building, User, Save, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_PROFILE_KEY, type CompanyProfile, loadCompanyProfile, saveCompanyProfile } from "@/lib/companyProfile";

const EMPTY_PROFILE: CompanyProfile = {
  filingAsLLC: false,
  landlordName: "",
  landlordCompany: "",
  landlordAddress: "",
  landlordEmail: "",
  landlordPhone: "",
};

export default function CompanyProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const existing = loadCompanyProfile();
    if (existing) {
      setProfile(existing);
      setHasExisting(true);
    }
  }, []);

  const handleSave = () => {
    saveCompanyProfile(profile);
    setHasExisting(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast({
      title: "Profile saved",
      description: "Your plaintiff info will auto-fill on all new cases.",
    });
  };

  const handleClear = () => {
    localStorage.removeItem(COMPANY_PROFILE_KEY);
    setProfile(EMPTY_PROFILE);
    setHasExisting(false);
    toast({ title: "Profile cleared" });
  };

  const set = (key: keyof CompanyProfile, value: string | boolean) =>
    setProfile(p => ({ ...p, [key]: value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Company Profile</h1>
        <p className="text-muted-foreground mt-1">
          Save your plaintiff information once — it auto-fills every new case you create.
        </p>
      </div>

      {hasExisting && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Profile saved — new cases will auto-fill from this information.
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filing Capacity</CardTitle>
          <CardDescription>How do you typically file — as an individual or as a company?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => set("filingAsLLC", false)}
              className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm font-medium transition-all text-left ${!profile.filingAsLLC ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
            >
              <User className="h-4 w-4 shrink-0" />
              As an Individual
            </button>
            <button
              type="button"
              onClick={() => set("filingAsLLC", true)}
              className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm font-medium transition-all text-left ${profile.filingAsLLC ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
            >
              <Building className="h-4 w-4 shrink-0" />
              As an LLC / Company
            </button>
          </div>

          {profile.filingAsLLC && (
            <div>
              <Label htmlFor="company">
                LLC / Company Name{" "}
                <span className="text-xs text-muted-foreground font-normal">(appears as plaintiff on all documents)</span>
              </Label>
              <Input
                id="company"
                className="mt-1.5"
                placeholder="Doe Properties LLC"
                value={profile.landlordCompany}
                onChange={(e) => set("landlordCompany", e.target.value)}
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className={profile.filingAsLLC ? "md:col-span-2" : ""}>
              <Label htmlFor="name">
                {profile.filingAsLLC ? "Authorized Representative (First & Last Name)" : "Your Full Legal Name"}
              </Label>
              <Input
                id="name"
                className="mt-1.5"
                placeholder="John Doe"
                value={profile.landlordName}
                onChange={(e) => set("landlordName", e.target.value)}
              />
            </div>

            {!profile.filingAsLLC && (
              <div>
                <Label htmlFor="companyOpt">
                  Company Name{" "}
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="companyOpt"
                  className="mt-1.5"
                  placeholder="Doe Properties LLC"
                  value={profile.landlordCompany}
                  onChange={(e) => set("landlordCompany", e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="address">
              Mailing Address{" "}
              <span className="text-xs text-muted-foreground font-normal">(appears on all letters)</span>
            </Label>
            <Input
              id="address"
              className="mt-1.5"
              placeholder="123 Main St, Brooklyn, NY 11201"
              value={profile.landlordAddress}
              onChange={(e) => set("landlordAddress", e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">
                Email{" "}
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-1.5"
                placeholder="john@example.com"
                value={profile.landlordEmail}
                onChange={(e) => set("landlordEmail", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">
                Phone{" "}
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                className="mt-1.5"
                placeholder="(555) 123-4567"
                value={profile.landlordPhone}
                onChange={(e) => set("landlordPhone", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Stored in your browser. Available offline.</p>
            <div className="flex items-center gap-2">
              {hasExisting && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
              <Button onClick={handleSave} className="gap-2" disabled={saved}>
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium text-foreground mb-1">How auto-fill works</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>When you start a new case, your saved info pre-fills the plaintiff fields.</li>
          <li>You can still edit the fields in any individual case — changes only apply to that case.</li>
          <li>To update your profile permanently, edit here and click Save Profile.</li>
        </ul>
      </div>
    </div>
  );
}
