import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  MapPin, Building2, Clock, DollarSign, ExternalLink,
  Printer, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft,
  Phone, CreditCard, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const STATE_LABELS: Record<string, string> = {
  NY: "New York",
  IL: "Illinois",
  OH: "Ohio",
  PA: "Pennsylvania",
};

interface CourtResult {
  id: number;
  state: string;
  county: string;
  courtName: string;
  courtType: string;
  maxClaim: number;
  address: string;
  filingRoom?: string;
  filingHours?: string;
  phone?: string;
  filingFee?: number;
  serviceFeeMin?: number;
  serviceFeeMax?: number;
  filingFeeDisplay: string;
  serviceFeeDisplay: string;
  totalCostMin: number;
  totalCostMax: number;
  onlineFiling: boolean;
  onlineUrl?: string;
  paymentMethods?: string;
  notes?: string;
  fallback?: boolean;
  message?: string;
}

interface CountyOption {
  county: string;
  maxClaim: number;
}

export default function CourtLocator() {
  const [location] = useLocation();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const [selectedState, setSelectedState] = useState(params.get("state") || "NY");
  const [selectedCounty, setSelectedCounty] = useState(params.get("county") || "");
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [result, setResult] = useState<CourtResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [claimAmount, setClaimAmount] = useState<number>(
    params.get("amount") ? parseFloat(params.get("amount")!) : 0
  );

  useEffect(() => {
    if (!selectedState) return;
    setSelectedCounty("");
    setResult(null);
    setSearched(false);
    fetch(`/api/courts/counties?state=${selectedState}`)
      .then((r) => r.json())
      .then((d) => setCounties(d.counties || []))
      .catch(() => setCounties([]));
  }, [selectedState]);

  useEffect(() => {
    if (params.get("county")) {
      setSelectedCounty(params.get("county")!);
    }
  }, []);

  useEffect(() => {
    if (selectedCounty && !searched) {
      handleSearch();
    }
  }, [selectedCounty, counties]);

  async function handleSearch() {
    if (!selectedState || !selectedCounty) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/courts?state=${selectedState}&county=${encodeURIComponent(selectedCounty)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const overLimit = result && !result.fallback && claimAmount > 0 && claimAmount > result.maxClaim;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-1 text-muted-foreground" asChild>
          <a href="/landlord-recovery/cases">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cases
          </a>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Court Locator</h1>
        <p className="text-muted-foreground mt-1">
          Find the right small claims court for your case — with exact filing fees, hours, and instructions.
        </p>
      </div>

      {/* Lookup form */}
      <Card>
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-base">Find Your Court</CardTitle>
          <CardDescription>Select a state and county to get filing details.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATE_LABELS).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Select
                value={selectedCounty}
                onValueChange={setSelectedCounty}
                disabled={!selectedState || counties.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={counties.length === 0 ? "Select state first" : "Select county"} />
                </SelectTrigger>
                <SelectContent>
                  {counties.map((c) => (
                    <SelectItem key={c.county} value={c.county}>
                      {c.county} <span className="text-muted-foreground ml-1">(up to ${c.maxClaim.toLocaleString()})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Claim Amount (optional — for limit check)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                min={0}
                value={claimAmount || ""}
                onChange={(e) => setClaimAmount(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 3500"
                className="w-full pl-7 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={!selectedState || !selectedCounty || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Searching..." : "Find My Court"}
            {!loading && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {searched && !loading && result && (
        <div className="space-y-4">
          {result.fallback ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-5 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Court not found in directory</p>
                  <p className="text-sm text-amber-700 mt-1">{result.message}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Over-limit warning */}
              {overLimit && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 pb-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Claim exceeds court limit</p>
                      <p className="text-sm text-red-700 mt-0.5">
                        Your claim of <strong>${claimAmount.toLocaleString()}</strong> exceeds the{" "}
                        <strong>${result.maxClaim.toLocaleString()}</strong> small claims limit for{" "}
                        {result.county} County. You may need to reduce your claim or file in a higher court.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main court card */}
              <Card>
                <CardHeader className="pb-3 bg-muted/10 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{result.courtName}</CardTitle>
                      <CardDescription className="mt-0.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{result.courtType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Max claim: <strong>${result.maxClaim.toLocaleString()}</strong>
                        </span>
                      </CardDescription>
                    </div>
                    {result.onlineFiling ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 shrink-0">Online Filing Available</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">In-Person Filing</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">

                  {/* Where to file */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Where to File</h3>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{result.address}</span>
                    </div>
                    {result.filingRoom && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{result.filingRoom}</span>
                      </div>
                    )}
                    {result.filingHours && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{result.filingHours}</span>
                      </div>
                    )}
                    {result.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{result.phone}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Estimated costs */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estimated Costs</h3>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Court Filing Fee</span>
                        <span className="font-medium">{result.filingFeeDisplay}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service of Process</span>
                        <span className="font-medium">{result.serviceFeeDisplay}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Estimated Total</span>
                        <span className="text-primary">
                          {result.totalCostMin === result.totalCostMax
                            ? `$${result.totalCostMin}`
                            : `$${result.totalCostMin}–$${result.totalCostMax}`}
                        </span>
                      </div>
                    </div>
                    {result.paymentMethods && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" />
                        Payment accepted: {result.paymentMethods}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* How to file */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">How to File</h3>
                    {result.onlineFiling && result.onlineUrl ? (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-800 mb-1">Online filing is available for this court.</p>
                          <p className="text-xs text-green-700">You can submit your claim and pay the filing fee directly online without visiting the courthouse.</p>
                          <Button size="sm" className="mt-3 bg-green-700 hover:bg-green-800" asChild>
                            <a href={result.onlineUrl} target="_blank" rel="noopener noreferrer">
                              File Online <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                            </a>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" />
                          You can also file in person at the address above if preferred.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Printer className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">Print and file in person</p>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">What to bring:</p>
                            {[
                              "Completed small claims form (Plaintiff's Claim)",
                              "Government-issued photo ID",
                              `Filing fee (${result.filingFeeDisplay})`,
                              "Copy of demand letter and any supporting documents",
                              "Tenant's full name and last known address",
                            ].map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-800">
                          <strong>Plain-English Instructions:</strong> Go to {result.address} during {result.filingHours || "business hours"}.
                          Tell the clerk you want to file a small claims case. Hand them your completed form and pay the {result.filingFeeDisplay} filing fee.
                          They will schedule a hearing date and tell you how to serve the tenant.
                        </div>
                      </div>
                    )}
                  </div>

                  {result.notes && (
                    <>
                      <Separator />
                      <div className="flex gap-2 text-sm text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{result.notes}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {searched && !loading && !result && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-5 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">Could not retrieve court data. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
