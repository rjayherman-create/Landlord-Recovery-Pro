import { AppLayout } from "@/components/layout/AppLayout";
import { Calendar, Clock, Download, AlertTriangle, CheckCircle2, ChevronRight, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

/* ─── Date helpers ──────────────────────────────────────────── */

function getNthTuesdayOfMonth(year: number, month: number, n: number): Date {
  // month is 0-indexed
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay(); // 0=Sun, 2=Tue
  const offset = (2 - dayOfWeek + 7) % 7; // days until first Tuesday
  const firstTuesday = 1 + offset;
  return new Date(year, month, firstTuesday + (n - 1) * 7);
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function fmt(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function generateICS(title: string, date: Date, description: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const stamp = `${y}${m}${d}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TaxAppeal DIY//FilingCalendar//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${stamp}`,
    `DTEND;VALUE=DATE:${stamp}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${title} is in 7 days`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:TOMORROW: ${title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(title: string, date: Date, description: string) {
  const content = generateICS(title, date, description);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Timeline month ────────────────────────────────────────── */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const monthActivities: Record<number, { label: string; color: string; type: "action" | "deadline" | "info" }[]> = {
  0: [{ label: "NY: Assessment rolls published (Nassau & NYC)", color: "blue", type: "info" }, { label: "TX: Appraisal notices begin mailing", color: "amber", type: "info" }],
  1: [{ label: "Nassau AROW portal opens", color: "blue", type: "action" }, { label: "Start gathering comparable sales", color: "green", type: "action" }],
  2: [{ label: "Nassau deadline: March 1", color: "red", type: "deadline" }, { label: "NYC deadline: March 15", color: "red", type: "deadline" }],
  3: [{ label: "NJ: Appeal deadline April 1", color: "red", type: "deadline" }, { label: "Assessment rolls published (upstate & Long Island towns)", color: "blue", type: "info" }],
  4: [{ label: "TX: Protest deadline May 15", color: "red", type: "deadline" }, { label: "Suffolk Grievance Day: 3rd Tuesday", color: "red", type: "deadline" }, { label: "Westchester / Rockland / Upstate: 4th Tuesday", color: "red", type: "deadline" }],
  5: [{ label: "NY: BAR decisions typically mailed", color: "blue", type: "info" }, { label: "NJ: Board hearings begin (June–October)", color: "blue", type: "info" }],
  6: [{ label: "NY: SCAR petition window (30 days after BAR decision)", color: "amber", type: "action" }, { label: "TX: ARB hearing scheduled within 45 days", color: "amber", type: "info" }, { label: "FL: Gather comparable sales — TRIM notices mailing soon", color: "green", type: "action" }],
  7: [{ label: "NY: SCAR hearings typically scheduled", color: "blue", type: "info" }, { label: "TX: ARB decisions issued", color: "blue", type: "info" }, { label: "FL: TRIM notices mailed by Aug 24", color: "green", type: "info" }],
  8: [{ label: "FL: Petition deadline September 18", color: "red", type: "deadline" }, { label: "FL: File DR-486 with County VAB by Sept 18", color: "red", type: "deadline" }],
  9: [{ label: "NJ: Board hearings typically completed", color: "blue", type: "info" }, { label: "FL: VAB hearings begin (Oct–Feb)", color: "green", type: "info" }],
  10: [{ label: "FL: VAB hearings ongoing", color: "green", type: "info" }],
};

/* ─── Component ─────────────────────────────────────────────── */

export function FilingCalendar() {
  const year = new Date().getFullYear();

  const deadlines = useMemo(() => {
    const nassau = new Date(year, 2, 1);          // March 1
    const nyc    = new Date(year, 2, 15);          // March 15
    const nj     = new Date(year, 3, 1);           // April 1
    const tx     = new Date(year, 4, 15);          // May 15
    const suffolk  = getNthTuesdayOfMonth(year, 4, 3); // 3rd Tue May
    const westchester = getNthTuesdayOfMonth(year, 4, 4); // 4th Tue May
    const scapWindow = new Date(suffolk);
    scapWindow.setDate(scapWindow.getDate() + 30);

    return [
      {
        id: "nassau",
        county: "Nassau County (NY)",
        deadline: nassau,
        form: "AR-1 (AROW portal)",
        portal: "https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html",
        region: "NY — Long Island",
        color: "blue",
        note: "File online via the AROW portal. No paper form needed.",
      },
      {
        id: "nyc",
        county: "New York City (NY)",
        deadline: nyc,
        form: "TC101 / TC201",
        portal: "https://www.nyc.gov/site/taxcommission/index.page",
        region: "NY — NYC",
        color: "purple",
        note: "Class 1 residential properties. File via NYC Tax Commission portal.",
      },
      {
        id: "nj",
        county: "All NJ Counties",
        deadline: nj,
        form: "A-1 Petition of Appeal",
        portal: "https://www.nj.gov/treasury/taxation/lpt/tax_board_directory.shtml",
        region: "New Jersey",
        color: "cyan",
        note: "File with your County Board of Taxation by April 1. Properties ≥$1M may file directly with NJ Tax Court (Form A-3).",
      },
      {
        id: "suffolk",
        county: "Suffolk County Towns (NY)",
        deadline: suffolk,
        form: "RP-524",
        portal: null,
        region: "NY — Long Island",
        color: "green",
        note: "Islip, Huntington, Brookhaven, Smithtown. File with your Town Assessor.",
      },
      {
        id: "tx",
        county: "All Texas Counties",
        deadline: tx,
        form: "Notice of Protest (Form 50-132)",
        portal: "https://comptroller.texas.gov/taxes/property-tax/",
        region: "Texas",
        color: "orange",
        note: "File Notice of Protest with your County Appraisal District (CAD) by May 15 or within 30 days of your appraisal notice, whichever is later.",
      },
      {
        id: "westchester",
        county: "Westchester, Rockland & Upstate NY",
        deadline: westchester,
        form: "RP-524",
        portal: "https://www.tax.ny.gov/pit/property/grievance/",
        region: "NY — Westchester / Upstate",
        color: "amber",
        note: "Most municipalities. Some cities may differ — confirm with your local assessor.",
      },
      {
        id: "fl",
        county: "All Florida Counties",
        deadline: new Date(year, 8, 18),   // September 18
        form: "DR-486 — Petition to VAB",
        portal: "https://floridarevenue.com/property/Pages/Taxpayers_Petition.aspx",
        region: "Florida",
        color: "green",
        note: "File with your County Value Adjustment Board (VAB) by September 18, or 25 days after your TRIM notice mailing. $15 filing fee required.",
      },
    ];
  }, [year]);

  const sorted = [...deadlines].sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const upcoming = sorted.filter(d => daysUntil(d.deadline) >= 0);
  const next = upcoming[0];

  const colorMap: Record<string, string> = {
    blue:   "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
    green:  "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:  "border-amber-200 bg-amber-50 text-amber-700",
    red:    "border-red-200 bg-red-50 text-red-700",
    cyan:   "border-cyan-200 bg-cyan-50 text-cyan-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  };

  const accentMap: Record<string, string> = {
    blue:   "bg-blue-600",
    purple: "bg-violet-600",
    green:  "bg-emerald-600",
    amber:  "bg-amber-500",
    cyan:   "bg-cyan-500",
    orange: "bg-orange-500",
  };

  const timelineTypeColor: Record<string, string> = {
    deadline: "bg-red-100 text-red-700 border border-red-200",
    action:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
    info:     "bg-slate-100 text-slate-600 border border-slate-200",
  };

  /* Monthly action checklist */
  const monthlyActions = [
    { month: "January–February", icon: "📋", action: "NY: Receive tentative assessment notice. TX: Appraisal notices begin arriving. Compare to your estimate of market value." },
    { month: "February (NY — Nassau)", icon: "💻", action: "Nassau AROW portal opens. Log in and search comparable sales using the built-in Sales Locator." },
    { month: "March 1 (NY — Nassau)", icon: "🚨", action: "Nassau filing deadline. Submit your AR-1 online via AROW before midnight." },
    { month: "March 15 (NY — NYC)", icon: "🚨", action: "NYC Tax Commission deadline. File TC101 (1-3 family) or TC201 (4+ units) via the NYC portal." },
    { month: "April 1 (NJ — Statewide)", icon: "🚨", action: "NJ filing deadline. Submit Form A-1 to your County Board of Taxation. Properties ≥$1M may file A-3 directly with NJ Tax Court." },
    { month: "April–Early May", icon: "🔍", action: "NY Suffolk / Westchester / Upstate: gather your 3–6 comparable sales. TX filers: gather appraisal evidence and protest grounds." },
    { month: "May 15 (TX — Statewide)", icon: "🚨", action: "Texas protest deadline. File Notice of Protest (Form 50-132) with your County Appraisal District online or in person." },
    { month: "3rd Tuesday May (NY — Suffolk)", icon: "📝", action: "Suffolk County Grievance Day. Submit RP-524 + comparable sales evidence to your Town Assessor." },
    { month: "4th Tuesday May (NY — Upstate)", icon: "📝", action: "Westchester / Rockland / Upstate Grievance Day. File RP-524 with your local Town Assessor." },
    { month: "June–July (NY)", icon: "📬", action: "NY BAR decisions mailed. If denied or insufficient, consider SCAR (30-day window, $30 fee)." },
    { month: "June–October (NJ)", icon: "📬", action: "NJ County Board hearings. Attend your hearing and present comparable sales evidence." },
    { month: "Within 45 days (TX)", icon: "⚖️", action: "TX ARB hearing scheduled. Present your comparable sales evidence. If denied, consider binding arbitration or district court." },
    { month: "August 24 (FL)", icon: "📬", action: "FL: TRIM (Truth in Millage) notices mailed by your county Property Appraiser. Review your Just Value carefully." },
    { month: "September 18 (FL — Statewide)", icon: "🚨", action: "Florida VAB petition deadline. File Form DR-486 with your County Value Adjustment Board. $15 filing fee required." },
    { month: "October–February (FL)", icon: "⚖️", action: "FL: VAB hearing scheduled before an independent special magistrate. Present comparable sales and condition evidence." },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-16">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" />
            {year} Filing Season
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Property Tax Filing Calendar
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Deadlines vary by state and county. Miss yours and you wait another full year. NY, NJ, TX, and FL deadlines are all tracked here.
          </p>
        </div>

        {/* Next Deadline Countdown */}
        {next && (
          <div className={`rounded-3xl border-2 p-8 ${colorMap[next.color]} relative overflow-hidden`}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 bg-current" />
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="text-7xl font-extrabold font-serif leading-none">
                  {Math.max(0, daysUntil(next.deadline))}
                </div>
                <div className="text-sm font-semibold uppercase tracking-widest mt-1 opacity-80">
                  {daysUntil(next.deadline) === 0 ? "TODAY" : daysUntil(next.deadline) === 1 ? "day left" : "days left"}
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Next Deadline</div>
                <h2 className="text-2xl font-serif font-bold mb-1">{next.county}</h2>
                <p className="text-lg font-semibold mb-1">{fmt(next.deadline)}</p>
                <p className="text-sm opacity-80 mb-4">{next.note}</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 font-medium border-current bg-white/60 hover:bg-white"
                    onClick={() => downloadICS(
                      `${next.county} Property Tax Grievance Deadline`,
                      next.deadline,
                      `File your property tax grievance for ${next.county} by today.\nForm: ${next.form}\n${next.note}`
                    )}
                  >
                    <Download className="w-4 h-4" />
                    Add to Calendar
                  </Button>
                  {next.portal && (
                    <a href={next.portal} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="gap-2 font-medium border-current bg-white/60 hover:bg-white">
                        <FileText className="w-4 h-4" />
                        Filing Portal
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!next && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-2">All {year} deadlines have passed</h2>
            <p className="text-emerald-800">The next filing season begins in January {year + 1}. Check back then for updated deadlines.</p>
          </div>
        )}

        {/* All Deadlines Grid */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6">All {year} Deadlines at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sorted.map((d) => {
              const days = daysUntil(d.deadline);
              const isPast = days < 0;
              const isUrgent = days >= 0 && days <= 14;
              const isComingUp = days > 14 && days <= 45;

              return (
                <div
                  key={d.id}
                  className={`rounded-2xl border shadow-sm p-6 flex flex-col gap-4 transition-all ${
                    isPast
                      ? "bg-slate-50 border-slate-200 opacity-60"
                      : isUrgent
                      ? "bg-red-50 border-red-200"
                      : isComingUp
                      ? "bg-amber-50 border-amber-200"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${accentMap[d.color]}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{d.region}</span>
                      </div>
                      <h3 className="font-serif font-bold text-lg text-foreground">{d.county}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {isPast ? (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Passed</span>
                      ) : isUrgent ? (
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {days === 0 ? "Today!" : `${days}d left`}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                          {days} days away
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/70 rounded-xl p-3 border border-border/50">
                      <div className="text-xs text-muted-foreground mb-0.5">Deadline</div>
                      <div className="font-bold text-foreground">{fmt(d.deadline)}</div>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 border border-border/50">
                      <div className="text-xs text-muted-foreground mb-0.5">Form Required</div>
                      <div className="font-bold text-foreground text-sm">{d.form}</div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{d.note}</p>

                  <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
                    {!isPast && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs font-medium flex-1"
                        onClick={() => downloadICS(
                          `${d.county} Tax Grievance Deadline`,
                          d.deadline,
                          `File your property tax grievance for ${d.county}.\nForm: ${d.form}\n${d.note}`
                        )}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Add to Calendar
                      </Button>
                    )}
                    {d.portal && (
                      <a href={d.portal} target="_blank" rel="noreferrer" className={isPast ? "flex-1" : ""}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-medium w-full">
                          <FileText className="w-3.5 h-3.5" />
                          Filing Portal
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year Timeline */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">The Full {year} Timeline</h2>
          <p className="text-muted-foreground mb-8">What happens month by month across the filing season.</p>

          <div className="relative">
            {/* Month grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-px bg-border rounded-2xl overflow-hidden border border-border">
              {MONTHS.map((mo, idx) => {
                const activities = monthActivities[idx] || [];
                const hasDeadline = activities.some(a => a.type === "deadline");
                const hasAction = activities.some(a => a.type === "action");
                const isCurrentMonth = idx === new Date().getMonth() && year === new Date().getFullYear();

                return (
                  <div
                    key={mo}
                    className={`bg-card p-3 flex flex-col gap-2 min-h-[120px] ${
                      isCurrentMonth ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isCurrentMonth ? "text-primary" : "text-muted-foreground"}`}>
                        {mo}
                      </span>
                      {hasDeadline && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      {activities.map((a, i) => (
                        <div
                          key={i}
                          className={`text-[9px] leading-tight px-1 py-0.5 rounded font-medium ${timelineTypeColor[a.type]}`}
                        >
                          {a.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                <span className="text-muted-foreground">Filing deadline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
                <span className="text-muted-foreground">Action to take</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                <span className="text-muted-foreground">For your information</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded ring-2 ring-primary/30 bg-primary/5" />
                <span className="text-muted-foreground">Current month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Action Checklist */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Your Month-by-Month Action Plan</h2>
          <p className="text-muted-foreground mb-8">Exactly what to do and when — so you never miss a deadline.</p>

          <div className="space-y-3">
            {monthlyActions.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-card rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl flex-shrink-0 w-10 text-center">{item.icon}</div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.month}</div>
                  <p className="text-sm text-foreground leading-relaxed">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Warning */}
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-serif font-bold text-amber-900 mb-2">Missing the deadline means waiting a full year</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Unlike most legal filings, there are <strong>no extensions</strong> for property tax grievance deadlines. 
              If you miss Grievance Day, you must wait until the following year's filing window. 
              Add these dates to your phone calendar today — the "Add to Calendar" buttons above create .ics files 
              that work with Google Calendar, Apple Calendar, and Outlook.
            </p>
          </div>
        </div>

        {/* SCAR Note */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-violet-50 rounded-xl flex-shrink-0">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-foreground mb-2">What if my municipality isn't listed?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Most NY municipalities follow the state standard: <strong>4th Tuesday in May</strong> for Grievance Day, using Form RP-524. 
                If your town or city isn't covered above, contact your local Town or City Assessor directly. 
                Some cities (like Albany and Buffalo) have different deadlines set by local law.
              </p>
              <a
                href="https://www.tax.ny.gov/pit/property/grievance/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Find your local assessor on the NYS Tax website
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
