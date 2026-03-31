import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCounties } from "@/hooks/use-counties";
import { Map, ExternalLink, CalendarDays, FileCheck, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TX_COUNTY_FILING } from "@/data/texas-filing-instructions";
import { NJ_COUNTY_FILING } from "@/data/nj-filing-instructions";
import { FL_COUNTY_FILING } from "@/data/florida-filing-instructions";

type StateTab = "NY" | "NJ" | "TX" | "FL";

const STATE_META: Record<StateTab, { label: string; flag: string; headline: string; subhead: string; form: string; body: string; deadline: string; next: string }> = {
  NY: {
    label: "New York",
    flag: "🗽",
    headline: "New York County Guide",
    subhead: "Property tax grievance procedures vary by county and municipality. Find your county below for forms, deadlines, and filing portals.",
    form: "RP-524 (or county-specific variant)",
    body: "Board of Assessment Review (BAR)",
    deadline: "Grievance Day — varies by county (March–May)",
    next: "Small Claims Assessment Review (SCAR) court",
  },
  NJ: {
    label: "New Jersey",
    flag: "🔵",
    headline: "New Jersey County Guide",
    subhead: "File Form A-1 with your County Board of Taxation by April 1 each year. For properties assessed at $1M+, you may file directly with the NJ Tax Court (Form A-3).",
    form: "A-1 — County Board of Taxation Petition of Appeal",
    body: "County Board of Taxation",
    deadline: "April 1 (or 45 days from mailing of assessment notice)",
    next: "NJ Tax Court (within 45 days of Board judgment)",
  },
  TX: {
    label: "Texas",
    flag: "⭐",
    headline: "Texas County Guide",
    subhead: "File a Notice of Protest with your County Appraisal District (CAD) by May 15 each year. Your case is heard by the Appraisal Review Board (ARB).",
    form: "Notice of Protest (Form 50-132 or county online portal)",
    body: "County Appraisal District (CAD) / Appraisal Review Board (ARB)",
    deadline: "May 15 (or 30 days after appraisal notice, whichever is later)",
    next: "Binding Arbitration or State District Court",
  },
  FL: {
    label: "Florida",
    flag: "🌴",
    headline: "Florida County Guide",
    subhead: "File Form DR-486 (Petition to Value Adjustment Board) with your County VAB by September 18. A $15 filing fee applies. The VAB is independent from the Property Appraiser.",
    form: "DR-486 — Petition to Value Adjustment Board",
    body: "County Value Adjustment Board (VAB)",
    deadline: "September 18 (or 25 days after TRIM notice mailing)",
    next: "Florida Circuit Court (within 60 days of VAB Final Decision)",
  },
};

export function CountyGuide() {
  const [activeState, setActiveState] = useState<StateTab>("NY");
  const { data: nyCounties, isLoading: nyLoading } = useCounties();
  const [links, setLinks] = useState<{ id: number; state: string; county: string; label: string; url: string }[]>([]);

  useEffect(() => {
    fetch(`/api/links?state=${activeState}`)
      .then(res => res.json())
      .then(data => setLinks(data))
      .catch(err => console.error(err));
  }, [activeState]);

  const meta = STATE_META[activeState];

  const txCounties = Object.values(TX_COUNTY_FILING).filter(c => c.county !== "Other");
  const njCounties = Object.values(NJ_COUNTY_FILING).filter(c => c.county !== "Other");
  const flCounties = Object.values(FL_COUNTY_FILING).filter(c => c.county !== "Other");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Hero CTA Banner */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold text-blue-900">
            File Your Property Tax Appeal
          </h2>
          <p className="mt-2 text-blue-800">
            We guide you step-by-step and help you avoid costly mistakes — so you keep more of what you save.
          </p>
          <a href="/pricing">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4 font-semibold hover:bg-blue-700 transition-colors">
              Start Filing ($99)
            </button>
          </a>
          <p className="text-sm mt-3 text-blue-700">
            ✔ Used by NY, NJ, TX &amp; FL homeowners &nbsp;·&nbsp; ✔ Step-by-step guidance &nbsp;·&nbsp; ✔ Avoid common filing mistakes
          </p>
          <p className="text-red-600 mt-2 text-sm font-medium">
            ⚠ Filing deadlines are strict — don't miss your window.
          </p>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-3">{meta.flag} {meta.headline}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{meta.subhead}</p>
        </div>

        {/* State Tabs */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {(["NY", "NJ", "TX", "FL"] as StateTab[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveState(s)}
              className={`px-6 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeState === s
                  ? "bg-primary text-primary-foreground border-primary shadow"
                  : "bg-card border-border text-foreground hover:border-primary/40"
              }`}
            >
              {STATE_META[s].flag} {STATE_META[s].label}
            </button>
          ))}
        </div>

        {/* State-level info banner */}
        <div className="bg-secondary/40 rounded-2xl border border-border p-5 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <FileCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1">Required Form</p>
              <p className="text-muted-foreground">{meta.form}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1">Filing Body</p>
              <p className="text-muted-foreground">{meta.body}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-muted-foreground">{meta.deadline}</p>
            </div>
          </div>
        </div>

        {/* NY Counties */}
        {activeState === "NY" && (
          nyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-card rounded-2xl border border-border animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nyCounties?.map((county) => (
                <div key={county.id} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-primary">{county.name}</h2>
                      <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded mt-1">
                        {county.region} Region
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                      <Map className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-4 flex-grow my-4">
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Required Form</p>
                        <p className="text-sm text-muted-foreground">{county.formRequired}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Deadline / Grievance Day</p>
                        <p className="text-sm text-muted-foreground">{county.deadline || county.grievanceDay || "Varies by municipality"}</p>
                      </div>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/80 mt-2 border border-border/50">
                      {county.notes}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border mt-auto">
                    {county.filingPortal ? (
                      <a href={county.filingPortal} target="_blank" rel="noreferrer" className="w-full block">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                          Access Filing Portal <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    ) : (
                      <p className="text-xs text-center text-muted-foreground italic">
                        Paper filing required or check specific municipality website.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* NJ Counties */}
        {activeState === "NJ" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {njCounties.map((info) => (
              <div key={info.county} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-primary">{info.county}</h2>
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded mt-1 border border-blue-200">
                      {info.filingBody}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Map className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-3 flex-grow my-3">
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{info.formName}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{info.filingDeadline}</p>
                  </div>
                  {info.mailingAddress && (
                    <div className="flex items-start gap-2">
                      <Map className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{info.mailingAddress}</p>
                    </div>
                  )}
                  {info.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{info.phone}</p>
                    </div>
                  )}
                  {info.notes && (
                    <div className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/80 border border-border/50">
                      {info.notes}
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border mt-auto">
                  <a
                    href="https://www.nj.gov/treasury/taxation/lpt/tax_board_directory.shtml"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full block"
                  >
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                      NJ Tax Board Directory <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TX Counties */}
        {activeState === "TX" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {txCounties.map((info) => (
              <div key={info.county} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-primary">{info.county}</h2>
                    <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded mt-1 border border-amber-200">
                      {info.cadName}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Map className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-3 flex-grow my-3">
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{info.formName}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{info.filingDeadline}</p>
                  </div>
                  {info.mailingAddress && (
                    <div className="flex items-start gap-2">
                      <Map className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{info.mailingAddress}</p>
                    </div>
                  )}
                  {info.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{info.phone}</p>
                    </div>
                  )}
                  {info.notes && (
                    <div className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/80 border border-border/50">
                      {info.notes}
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border mt-auto">
                  {info.onlinePortal ? (
                    <a href={info.onlinePortal.url} target="_blank" rel="noreferrer" className="w-full block">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                        {info.onlinePortal.label} <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <p className="text-xs text-center text-muted-foreground italic">
                      File in person at the appraisal district office.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* FL Counties */}
        {activeState === "FL" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flCounties.map((info) => (
              <div key={info.county} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-primary">{info.county}</h2>
                    <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded mt-1 border border-green-200">
                      {info.vabName}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Map className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-3 flex-grow my-3">
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{info.formName}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{info.filingDeadline}</p>
                  </div>
                  {info.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{info.phone}</p>
                    </div>
                  )}
                  {info.notes && (
                    <div className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/80 border border-border/50">
                      {info.notes}
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border mt-auto">
                  {info.onlinePortal ? (
                    <a href={info.onlinePortal.url} target="_blank" rel="noreferrer" className="w-full block">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                        {info.onlinePortal.label} <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <a
                      href="https://floridarevenue.com/property/Pages/Taxpayers_Petition.aspx"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full block"
                    >
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                        FL DR-486 Instructions <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filing Portals — live from database */}
        {links.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-1">File Directly (Advanced Users)</h2>
            <p className="text-sm text-muted-foreground mb-4">These are the official government portals. Filing on your own without guidance increases your risk of errors.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.map((item) => (
                <div key={item.id} className="mb-2 p-4 border border-border rounded-xl bg-card flex items-center justify-between gap-4">
                  <div className="font-semibold text-sm text-foreground">{item.county}</div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                  >
                    Filing Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
