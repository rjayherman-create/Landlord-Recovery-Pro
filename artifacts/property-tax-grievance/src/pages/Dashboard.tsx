import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGrievances } from "@/hooks/use-grievances";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { GrievanceForm } from "@/components/GrievanceForm";
import { FileText, Plus, ArrowRight, TrendingDown, Clock, ShieldCheck, DollarSign, AlertTriangle, Award, ChevronRight, Calculator, Sparkles, CheckCircle, MapPin } from "lucide-react";
import { useGooglePlaces } from "@/hooks/use-google-places";
import { calculateApprovalLikelihood } from "@/utils/generate-argument";
import { format, parseISO, isValid, isFuture } from "date-fns";
import { getComputedDeadline } from "@/data/county-filing-instructions";
import { usePreferredState, STATE_META, type AppState } from "@/hooks/use-preferred-state";
import { useAuth } from "@workspace/replit-auth-web";

const STATE_TAX_RATES: Record<string, number> = { NY: 0.020, NJ: 0.025, TX: 0.022, FL: 0.018 };

function calcSavings(marketValue: number, assessedValue: number, state: string): number {
  if (!marketValue || !assessedValue || assessedValue <= marketValue) return 0;
  const overAssessment = assessedValue - marketValue;
  const rate = STATE_TAX_RATES[state] ?? 0.020;
  return Math.round(overAssessment * rate);
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reduced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-red-50 text-red-700 border-red-200",
};

export function Dashboard() {
  const { data: grievances, isLoading } = useGrievances();
  const [isDialogOpen, setIsDialogOpen] = useState(() => {
    try { return !!localStorage.getItem("pendingCase"); } catch { return false; }
  });
  const { preferredState, setPreferredState, meta } = usePreferredState();
  const [dialogState, setDialogState] = useState(preferredState);
  const dialogMeta = STATE_META[dialogState as keyof typeof STATE_META] ?? meta;
  useAuth();

  const totalCases = grievances?.length || 0;
  const reducedCases = grievances?.filter(g => g.status === 'reduced').length || 0;

  // Savings estimator state
  const [estAddress, setEstAddress] = useState("");
  const [estMarketValue, setEstMarketValue] = useState("");
  const [estAssessedValue, setEstAssessedValue] = useState("");
  const [estCounty, setEstCounty] = useState("");
  const [countyList, setCountyList] = useState<{ county: string; tax_rate: number }[]>([]);
  const [realTaxRate, setRealTaxRate] = useState<number | null>(null);
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  const [prefillData, setPrefillData] = useState<{
    propertyAddress?: string; county?: string; state?: string;
    currentAssessment?: number; estimatedMarketValue?: number; requestedAssessment?: number; estimatedSavings?: number;
  } | undefined>(undefined);

  useEffect(() => {
    setEstCounty("");
    setRealTaxRate(null);
    fetch(`/api/county-data?state=${preferredState}`)
      .then(r => r.json())
      .then((rows: { county: string; tax_rate: number }[]) => setCountyList(Array.isArray(rows) ? rows : []))
      .catch(() => setCountyList([]));
  }, [preferredState]);

  useEffect(() => {
    if (!estCounty) { setRealTaxRate(null); return; }
    fetch(`/api/county-data?state=${preferredState}&county=${encodeURIComponent(estCounty)}`)
      .then(r => r.json())
      .then((row: { tax_rate: number } | null) => setRealTaxRate(row?.tax_rate ?? null))
      .catch(() => setRealTaxRate(null));
  }, [estCounty, preferredState]);

  // Auto-detect county from address text (fallback when no Places API)
  useEffect(() => {
    if (!estAddress || countyList.length === 0) return;
    const lower = estAddress.toLowerCase();
    const match = countyList.find(c => lower.includes(c.county.toLowerCase().replace(" county", "")) || lower.includes(c.county.toLowerCase()));
    if (match && match.county !== estCounty) setEstCounty(match.county);
  }, [estAddress, countyList]);

  // Google Places autocomplete — fires when user picks a suggestion
  const { inputRef: addressInputRef, isEnabled: placesEnabled } = useGooglePlaces(({ address, county, state }) => {
    setEstAddress(address);
    if (state && Object.keys(STATE_META).includes(state)) setPreferredState(state as AppState);
    if (county) {
      const norm = county.replace(/ county$/i, "").trim();
      const match = countyList.find(c =>
        c.county.toLowerCase().includes(norm.toLowerCase()) ||
        norm.toLowerCase().includes(c.county.toLowerCase().replace(" county", "").toLowerCase())
      );
      if (match) setEstCounty(match.county);
    }
  });

  // Progressive reveal — show value inputs once address is entered
  const showValueFields = estAddress.length > 5 || estCounty.length > 0 || estMarketValue.length > 0;

  const activeRate = realTaxRate ?? STATE_TAX_RATES[preferredState];

  useEffect(() => {
    const mv = parseFloat(estMarketValue.replace(/[^0-9.]/g, ""));
    const av = parseFloat(estAssessedValue.replace(/[^0-9.]/g, ""));
    if (!mv || !av || av <= mv) { setEstimatedSavings(0); return; }
    setEstimatedSavings(Math.round((av - mv) * activeRate));
  }, [estMarketValue, estAssessedValue, activeRate]);

  function resolveDeadline(g: { filingDeadline?: string | null; county: string; state?: string | null }): Date | null {
    const src = g.filingDeadline || getComputedDeadline(g.county, g.state ?? undefined);
    if (!src) return null;
    try { const d = parseISO(src); return isValid(d) ? d : null; } catch { return null; }
  }

  const upcomingCount = grievances?.filter(g => {
    if (["submitted","pending","reduced","denied"].includes(g.status)) return false;
    const d = resolveDeadline(g);
    return d ? isFuture(d) : false;
  }).length || 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/10">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Decorative background" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 p-8 md:p-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm">
              <DollarSign className="w-4 h-4 text-accent" />
              <span>Lawyers charge 50% commission. We charge $99 flat.</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight text-white">
              Stop Paying 50% Commission<br/><span className="text-accent">to Lower Your Property Taxes</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-6 max-w-xl leading-relaxed">
              Tax appeal firms charge <strong className="text-white">50% of your first year's savings</strong> — typically $700–$1,200 on a winning case. TaxAppeal DIY pre-fills your official {meta.form}, finds comparable sales, and delivers a ready-to-file appeal package. <strong className="text-white">$99 flat. You keep 100% of every dollar saved — this year and every year after.</strong>
            </p>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setDialogState(preferredState); setPrefillData(undefined); } }}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform">
                  <Plus className="w-5 h-5 mr-2" />
                  Start New {preferredState} Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">New {dialogMeta.name} Tax Appeal</DialogTitle>
                  <DialogDescription>
                    Select your state, then enter your property details to build your {dialogMeta.verb} case using {dialogMeta.form}.
                  </DialogDescription>
                </DialogHeader>
                <GrievanceForm onSuccess={() => setIsDialogOpen(false)} initialState={prefillData?.state ?? preferredState} onStateChange={setDialogState} prefill={prefillData} />
              </DialogContent>
            </Dialog>

            {/* Trust signals under CTA */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-accent shrink-0" /> Ready to file in 10 minutes</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" /> ~80% of DIY filers get a reduction</span>
              <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-accent shrink-0" /> $99 flat — no commission, ever</span>
            </div>
          </div>

          {/* State selector strip */}
          <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm px-8 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider mr-1">Your state:</span>
              {(Object.entries(STATE_META) as [AppState, typeof STATE_META[AppState]][]).map(([code, s]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setPreferredState(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    preferredState === code
                      ? "bg-accent text-accent-foreground shadow-sm scale-105"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10"
                  }`}
                >
                  <span>{s.flag}</span>
                  <span>{code}</span>
                </button>
              ))}
              <span className="text-white/40 text-xs ml-2 hidden sm:inline">
                {meta.flag} {meta.name} · {meta.form} · {meta.body}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
              <h3 className="text-3xl font-bold font-serif">{totalCases}</h3>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Successful Reductions</p>
              <h3 className="text-3xl font-bold font-serif">{reducedCases}</h3>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</p>
              <h3 className="text-3xl font-bold font-serif">{upcomingCount}</h3>
            </div>
          </div>
        </div>

        {/* ── How We Compare ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <h2 className="text-xl font-serif font-bold text-foreground">Why $99 Instead of $0 or $900?</h2>
            <p className="text-sm text-muted-foreground mt-1">We sit in the sweet spot: the preparation a lawyer does, without the commission. Better than staring at a blank form, cheaper than giving away half your savings.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-44">Feature</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="text-red-600">Tax Lawyer / Firm</span>
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="text-slate-500">Plain DIY</span>
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide bg-primary/5 border-x border-primary/20">
                    <span className="text-primary">TaxAppeal DIY</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  { feature: "Cost", lawyer: "50% commission (~$700–$1,200)", diy: "Free (form only)", us: "$99 flat — one time", usGood: true },
                  { feature: "Official form pre-filled", lawyer: "✓", diy: "You fill it manually", us: "✓ Auto-filled from your data", usGood: true },
                  { feature: "Comparable sales", lawyer: "✓ Found by firm", diy: "You research manually (1–3 hrs)", us: "✓ Found & formatted for you", usGood: true },
                  { feature: "Time to file", lawyer: "2–4 weeks (you wait)", diy: "3–6 hours of research", us: "Under 30 minutes", usGood: true },
                  { feature: "Success rate", lawyer: "~85%", diy: "~65–80%", us: "~80% (comparable)", usGood: true },
                  { feature: "You keep future savings", lawyer: "100% — after year 1 fee", diy: "100%", us: "100% — every year", usGood: true },
                  { feature: "Covers all 4 states", lawyer: "County specialists only", diy: "Forms vary by state", us: "✓ NY · NJ · TX · FL", usGood: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground text-xs">{row.feature}</td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground text-xs">{row.lawyer}</td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground text-xs">{row.diy}</td>
                    <td className={`px-5 py-3.5 text-center font-semibold text-xs bg-primary/5 border-x border-primary/20 ${row.usGood ? "text-emerald-700" : "text-muted-foreground"}`}>{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm text-emerald-800 flex-1">
              <strong>Bottom line:</strong> A tax firm does two things — fills out your form and finds comparable sales. TaxAppeal DIY does both, in minutes, for $99. The difference is that they take 50% of your first year's savings; we don't touch it.
            </p>
          </div>
        </div>

        {/* ── Instant Savings Estimator ── */}
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-amber-900">How much are you overpaying?</h2>
                <p className="text-sm text-amber-700 mt-0.5">
                  Enter your numbers below — see your potential savings instantly.
                </p>
              </div>
            </div>

            {/* STEP 1 — Address (always visible, anchors the whole flow) */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Property Address
                {placesEnabled && <span className="text-amber-500 font-normal normal-case">— type to autocomplete</span>}
                {!placesEnabled && <span className="text-amber-500 font-normal normal-case">— include county name for best results</span>}
              </label>
              <input
                ref={addressInputRef}
                type="text"
                placeholder={`e.g. 123 Main St, Nassau County, ${preferredState}`}
                value={estAddress}
                onChange={e => setEstAddress(e.target.value)}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm font-medium placeholder:text-muted-foreground/40 transition shadow-sm"
              />
              {estCounty && estAddress ? (
                <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <strong>{estCounty}</strong> detected — {(activeRate * 100).toFixed(2)}% effective tax rate loaded
                </p>
              ) : !showValueFields ? (
                <p className="text-xs text-amber-600/70 mt-1.5">
                  Enter your address above to see your potential savings ↓
                </p>
              ) : null}
            </div>

            {/* STEP 2 — County + Values (revealed after address entry) */}
            {showValueFields && (
              <div className="space-y-3 mb-4">
                {/* County fallback — only shown when not auto-detected */}
                {!estCounty && countyList.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5 block">
                      Your County <span className="text-amber-500 font-normal normal-case">(select to load real tax rate)</span>
                    </label>
                    <select
                      value={estCounty}
                      onChange={e => setEstCounty(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm font-medium text-foreground transition appearance-none"
                    >
                      <option value="">Select county…</option>
                      {countyList.map(c => (
                        <option key={c.county} value={c.county}>
                          {c.county} — {(c.tax_rate * 100).toFixed(2)}% effective rate
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5 block">
                      Your Estimated Market Value
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-semibold text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 550,000"
                        value={estMarketValue}
                        onChange={e => setEstMarketValue(e.target.value)}
                        className="w-full pl-7 pr-4 py-3 border-2 border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm font-medium placeholder:text-muted-foreground/50 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5 block">
                      Current Assessed Value
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-semibold text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 700,000"
                        value={estAssessedValue}
                        onChange={e => setEstAssessedValue(e.target.value)}
                        className="w-full pl-7 pr-4 py-3 border-2 border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm font-medium placeholder:text-muted-foreground/50 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {estimatedSavings > 0 ? (
              <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Potential annual savings</p>
                  </div>
                  <p className="text-3xl font-extrabold font-serif text-emerald-700">{fmt(estimatedSavings)}<span className="text-lg font-semibold text-emerald-600">/year</span></p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {estCounty
                      ? <>Based on <strong>{estCounty}</strong> tax rate ({(activeRate * 100).toFixed(2)}%) and your assessment gap of {fmt(parseFloat(estAssessedValue.replace(/[^0-9.]/g,"")) - parseFloat(estMarketValue.replace(/[^0-9.]/g,"")))}</>
                      : <>Based on {preferredState} statewide rate ({(activeRate * 100).toFixed(1)}%) — select your county above for a more accurate figure</>
                    }
                  </p>
                  {(() => {
                    const mv = parseFloat(estMarketValue.replace(/[^0-9.]/g, ""));
                    const av = parseFloat(estAssessedValue.replace(/[^0-9.]/g, ""));
                    const lik = calculateApprovalLikelihood(mv, av, 0);
                    return (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-emerald-800">Approval Likelihood</span>
                          <span className={`text-sm font-extrabold ${lik.color}`}>{lik.score}%</span>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden mb-1">
                          <div className={`h-1.5 rounded-full ${lik.label === "High" ? "bg-emerald-500" : lik.label === "Moderate" ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${lik.score}%` }} />
                        </div>
                        <p className={`text-xs font-semibold ${lik.color}`}>Confidence Level: {lik.label}</p>
                        {lik.label === "High" && (
                          <p className="text-xs text-red-600 font-medium mt-1">High-confidence cases are best filed before the deadline</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:min-w-[180px]">
                  <Button
                    onClick={() => {
                      const mv = parseFloat(estMarketValue.replace(/[^0-9.]/g, ""));
                      const av = parseFloat(estAssessedValue.replace(/[^0-9.]/g, ""));
                      setPrefillData({
                        propertyAddress: estAddress || undefined,
                        county: estCounty || undefined,
                        state: preferredState,
                        currentAssessment: av || undefined,
                        estimatedMarketValue: mv || undefined,
                        requestedAssessment: mv || undefined,
                        estimatedSavings: estimatedSavings || undefined,
                      });
                      setIsDialogOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Start Filing Now
                  </Button>
                  <p className="text-center text-xs text-emerald-600">One-time $99 · Pays for itself in days</p>
                </div>
              </div>
            ) : estMarketValue && estAssessedValue ? (
              <div className="bg-white border border-border rounded-2xl p-4 text-sm text-muted-foreground">
                {parseFloat(estAssessedValue.replace(/[^0-9.]/g,"")) <= parseFloat(estMarketValue.replace(/[^0-9.]/g,""))
                  ? <p>Your assessment appears to be at or below market value. You may still have a case if comparable sales are lower — <button className="text-primary underline" onClick={() => setIsDialogOpen(true)}>start a case to check</button>.</p>
                  : <p>Enter both values to see your estimate.</p>
                }
              </div>
            ) : (
              <div className="text-xs text-amber-700/70 flex items-center gap-1.5">
                <span>Results update live as you type ·</span>
                <span className="font-medium">
                  {estCounty ? `Using ${estCounty} rate of ${(activeRate * 100).toFixed(2)}%` : `Select county above or using ${preferredState} rate of ${(activeRate * 100).toFixed(1)}%`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confidence Teaser */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">Why file yourself?</h2>
              <p className="text-sm text-muted-foreground mt-0.5">The facts that make this a no-brainer</p>
            </div>
            <Link href="/how-it-works">
              <Button variant="outline" size="sm" className="font-medium gap-1.5">
                Full breakdown <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            {[
              { icon: Award,         value: "~80%",  label: "DIY success rate",  sub: "Homeowners who file and follow up",  color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: DollarSign,    value: "$0",    label: "Cost to file",      sub: "Free in NY, NJ, TX · $15 in FL",    color: "text-blue-600",    bg: "bg-blue-50"   },
              { icon: AlertTriangle, value: "$0",    label: "Risk of filing",    sub: "Taxes cannot go up in any state",   color: "text-amber-600",   bg: "bg-amber-50"  },
              { icon: TrendingDown,  value: "50%",   label: "Commission saved",  sub: "vs. hiring a professional firm",    color: "text-violet-600",  bg: "bg-violet-50" },
            ].map(({ icon: Icon, value, label, sub, color, bg }) => (
              <div key={label} className="flex flex-col items-center text-center p-5 gap-2 hover:bg-secondary/30 transition-colors">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-extrabold font-serif ${color}`}>{value}</div>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-tight">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2 text-sm text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>All 4 states guarantee:</strong> filing an appeal cannot raise your assessment. The worst outcome is no change.
            </span>
          </div>
        </div>

        {/* Case List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-foreground">Your Cases</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-secondary/50 animate-pulse rounded-2xl border border-border"></div>
              ))}
            </div>
          ) : grievances?.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No cases yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Start by creating a grievance case for your property to begin tracking assessment details and comparables.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="font-medium">
                Create First Case
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grievances?.map((g) => (
                <Link key={g.id} href={`/grievances/${g.id}`}>
                  <div className="group bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {g.propertyAddress}
                        </h3>
                        <p className="text-sm text-muted-foreground">{g.municipality}, {g.county} County</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const s = (g as any).state;
                          if (!s || s === "NY") return null;
                          const badgeClass =
                            s === "TX" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            s === "FL" ? "bg-green-100 text-green-700 border border-green-200" :
                            "bg-cyan-100 text-cyan-700 border border-cyan-200";
                          return (
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${badgeClass}`}>
                              {s}
                            </span>
                          );
                        })()}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${STATUS_COLORS[g.status as keyof typeof STATUS_COLORS]}`}>
                          {g.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 my-4 bg-secondary/30 p-4 rounded-xl">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Assessment</p>
                        <p className="font-semibold">${g.currentAssessment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Requested</p>
                        <p className="font-semibold text-emerald-600">${g.requestedAssessment.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          const d = resolveDeadline(g);
                          if (!d) return 'No deadline set';
                          const isPast = !isFuture(d);
                          return (
                            <span className={isPast ? 'text-red-600 font-medium' : ''}>
                              {isPast ? 'Deadline passed · ' : ''}{format(d, 'MMM d, yyyy')}
                              {!g.filingDeadline && <span className="ml-1 text-xs opacity-60">(county standard)</span>}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-primary font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                        Manage Case <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
