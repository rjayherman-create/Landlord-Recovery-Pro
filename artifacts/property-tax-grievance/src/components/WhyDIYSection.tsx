import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line, ReferenceLine, Legend
} from "recharts";
import {
  ShieldCheck, TrendingDown, DollarSign, Clock, CheckCircle2,
  AlertTriangle, Scale, Zap, Award, Users
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────── */

const successRateData = [
  { label: "Nassau DIY\n(2024)", rate: 80, fill: "#16a34a" },
  { label: "Suffolk DIY", rate: 68, fill: "#2563eb" },
  { label: "Westchester DIY", rate: 65, fill: "#7c3aed" },
  { label: "NYC DIY", rate: 62, fill: "#0891b2" },
  { label: "Pro Firms", rate: 85, fill: "#94a3b8" },
];

// 5-year cumulative savings: DIY vs. hiring a firm
// Assumptions: $1,800/year savings, firm takes 50% of year 1 only
const savingsData = [
  { year: "Year 1", diy: 1800, firm: 900 },
  { year: "Year 2", diy: 3600, firm: 2700 },
  { year: "Year 3", diy: 5400, firm: 4500 },
  { year: "Year 4", diy: 7200, firm: 6300 },
  { year: "Year 5", diy: 9000, firm: 8100 },
];

const costComparisonData = [
  { name: "DIY Filing", cost: 0, label: "FREE", color: "#16a34a" },
  { name: "SCAR (if needed)", cost: 30, label: "$30", color: "#0891b2" },
  { name: "Professional Firm", cost: 900, label: "~$900*", color: "#ef4444" },
];

const riskData = [
  { name: "Assessment stays the same", value: 20, fill: "#94a3b8" },
  { name: "Assessment is reduced", value: 80, fill: "#16a34a" },
];

/* ─── Custom Tooltip ─────────────────────────────────── */

const SavingsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>${p.value.toLocaleString()}</strong>
        </p>
      ))}
      {payload.length === 2 && (
        <p className="mt-1 pt-1 border-t border-border text-emerald-600 font-semibold">
          DIY advantage: +${(payload[0].value - payload[1].value).toLocaleString()}
        </p>
      )}
    </div>
  );
};

const SuccessTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold">{payload[0].payload.label}</p>
      <p className="text-emerald-600">Success rate: <strong>{payload[0].value}%</strong></p>
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────── */

function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  accent,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  sublabel?: string;
  accent?: "green" | "blue" | "amber" | "red" | "purple";
}) {
  const colors: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
  };
  const cls = colors[accent ?? "blue"];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-3">
      <div className={`w-fit p-2.5 rounded-xl border ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-3xl font-extrabold font-serif text-foreground">{value}</div>
        <div className="text-sm font-semibold text-foreground mt-0.5">{label}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

/* ─── Bullet Point List ──────────────────────────────── */

const canDoPoints = [
  {
    icon: ShieldCheck,
    title: "New York law is on your side",
    body: "Every homeowner has a legal right to contest their assessment. Filing cannot raise your taxes — the worst outcome is no change.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Scale,
    title: "The BAR is designed for homeowners",
    body: "The Board of Assessment Review process requires no attorney. Hearing officers expect and routinely accommodate pro se (self-represented) filers.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Award,
    title: "Evidence wins — not credentials",
    body: "Cases are decided on comparable sales data, not legal arguments. If similar homes in your neighborhood sold for less than your assessed value, that is your case.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Users,
    title: "~80% of Nassau filers got a reduction in 2024",
    body: "The majority of homeowners who filed a grievance — with or without a firm — received some reduction. The key is filing with solid comparable sales evidence.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Zap,
    title: "The whole process takes under 2 hours",
    body: "Finding 3–6 comparable sales, filling out the RP-524 form, and submitting it typically takes less time than a trip to the DMV. This tool handles the form for you.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    icon: TrendingDown,
    title: "Reductions often last multiple years",
    body: "Once your assessment is reduced, it typically stays lower — meaning you capture the full savings every year, not just the one a firm charges you for.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

/* ─── Component ──────────────────────────────────────── */

export function WhyDIYSection() {
  return (
    <div className="space-y-16">

      {/* ── Section: Key Stats ── */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
            The Numbers Don't Lie
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            DIY appeals have a strong track record across NY, NJ, TX, and FL. Here's what the data shows.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Award}        value="~80%"  label="DIY Success Rate"       sublabel="Avg. across NY, NJ, TX & FL"   accent="green"  />
          <StatCard icon={DollarSign}   value="$0"    label="Cost to File"           sublabel="No fee in NY, NJ & TX"         accent="blue"   />
          <StatCard icon={AlertTriangle}value="$0"    label="Risk of Filing"         sublabel="Assessment cannot go up"       accent="amber"  />
          <StatCard icon={Clock}        value="~2 hrs" label="Time to Complete"      sublabel="Including finding comps"       accent="purple" />
        </div>
      </div>

      {/* ── Section: Success Rate Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
            Success Rates by County
          </h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            DIY filers achieve comparable results to professional firms — without paying the 50% commission. The slight edge firms show reflects their volume of filings, not any legal advantage unavailable to homeowners.
          </p>
          <div className="space-y-3">
            {successRateData.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground">{d.label.replace("\n", " ")}</span>
                  <span className="text-sm font-bold" style={{ color: d.fill }}>{d.rate}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.rate}%`, backgroundColor: d.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            * Professional firms may have slightly higher rates due to volume. DIY rates improve significantly with good comparable sales evidence.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-serif font-bold text-foreground mb-1">
            What Happens When You File?
          </h3>
          <p className="text-sm text-muted-foreground mb-5">NY, NJ, TX & FL — 2024 self-filed cases</p>
          <div className="flex items-center justify-center" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 justify-center mt-2">
            {riskData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-bold">{d.value}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 text-center font-medium">
            8 out of 10 homeowners who filed got a reduction
          </div>
        </div>
      </div>

      {/* ── Section: Cost Comparison ── */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
            What You Keep vs. What You Give Away
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional firms charge 50% of your <em>first year's</em> savings as their fee. That's a one-time commission — but your savings continue every year. This is what that looks like over 5 years.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Example assumes $1,800/year tax reduction (typical for a $500K home over-assessed by 15%).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {costComparisonData.map((d) => (
            <div
              key={d.name}
              className={`rounded-2xl border p-6 text-center shadow-sm ${
                d.cost === 0
                  ? "border-emerald-200 bg-emerald-50"
                  : d.cost === 30
                  ? "border-blue-200 bg-blue-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div
                className="text-5xl font-extrabold font-serif mb-2"
                style={{ color: d.color }}
              >
                {d.label}
              </div>
              <div className="font-semibold text-foreground">{d.name}</div>
              {d.cost === 0 && <div className="text-xs text-emerald-700 mt-1">Standard grievance filing</div>}
              {d.cost === 30 && <div className="text-xs text-blue-700 mt-1">Only if BAR denies you and you escalate</div>}
              {d.cost === 900 && <div className="text-xs text-red-700 mt-1">* 50% of first year's savings on a typical case</div>}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-serif font-bold text-foreground mb-1">Cumulative Savings Over 5 Years</h3>
          <p className="text-sm text-muted-foreground mb-5">
            DIY filers keep 100% of their savings every year. Firms charge only in year one — but that's still $900 you never get back.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={savingsData} barGap={4} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<SavingsTooltip />} />
              <Legend formatter={(v) => v === "diy" ? "DIY (you keep it all)" : "Professional Firm (after their fee)"} />
              <Bar dataKey="diy" name="diy" fill="#16a34a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="firm" name="firm" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              <ReferenceLine
                y={900}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: "Firm's $900 fee", position: "insideTopRight", fontSize: 11, fill: "#ef4444" }}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">
              <strong>5-year advantage of filing yourself: $900</strong> — that's the commission you keep. 
              After year one, both tracks are identical. The only difference is who gets that first year's cut.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section: Why You Can Do This ── */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
            Six Reasons You Can Do This Yourself
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The grievance process is specifically designed so homeowners can navigate it without professional help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {canDoPoints.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex items-start gap-4 bg-card rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className={`p-2.5 rounded-xl ${p.bg} flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{p.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section: Zero Risk Banner ── */}
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-serif font-bold text-emerald-900 mb-2">
            Zero Risk. Guaranteed by New York Law.
          </h3>
          <p className="text-emerald-800 leading-relaxed">
            New York Real Property Tax Law §524 guarantees that filing a grievance <strong>cannot result in an increase</strong> to your assessment. 
            The Board of Assessment Review can only leave your assessment the same or lower it. 
            There is no scenario in which filing costs you more in taxes.
          </p>
        </div>
        <div className="flex-shrink-0 text-center">
          <div className="text-5xl font-extrabold text-emerald-600 font-serif">$0</div>
          <div className="text-sm text-emerald-700 font-medium">maximum downside</div>
        </div>
      </div>

    </div>
  );
}
