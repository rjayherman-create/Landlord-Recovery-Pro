import { Download, Printer, Building2, MapPin, DollarSign, Ruler, Calendar, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Types (mirrors backend) ───────────────────────── */

export interface PropertyRecord {
  address?: string;
  borough?: string;
  block?: string;
  lot?: string;
  bbl?: string;
  zipcode?: string;
  ownerName?: string;
  buildingClass?: string;
  yearBuilt?: number;
  yearAltered?: number;
  numBuildings?: number;
  numFloors?: number;
  unitCount?: number;
  buildingArea?: number;
  lotArea?: number;
  lotFrontage?: number;
  lotDepth?: number;
  residentialArea?: number;
  commercialArea?: number;
  landAssessment?: number;
  totalAssessment?: number;
  exemptTotal?: number;
  zoneDist?: string;
  landUse?: string;
  historicDistrict?: string;
  schoolDist?: string;
  councilDist?: string;
  dataVersion?: string;
  dataSource: string;
  retrievedAt: string;
}

export interface LookupResult {
  municipality?: string;
  county?: string;
  schoolDistrict?: string;
  parcelId?: string;
  propertyClass?: string;
  yearBuilt?: number;
  livingArea?: number;
  lotSize?: string;
  estimatedMarketValue?: number;
  currentAssessment?: number;
  landAssessment?: number;
  ownerName?: string;
  source: string;
  confidence: "high" | "partial" | "geocode-only";
  fieldsFound: string[];
  message?: string;
  rawRecord?: PropertyRecord;
  lookupAddress?: string;
  lookupDate?: string;
}

/* ─── Helpers ────────────────────────────────────────── */

const fmt$ = (n?: number) => n != null ? `$${n.toLocaleString()}` : "—";
const fmtSqft = (n?: number) => n != null ? `${n.toLocaleString()} sq ft` : "—";
const fmtNum = (n?: number | string) => (n != null && n !== "" ? String(n) : "—");

function Row({ label, value }: { label: string; value?: string | number }) {
  const display = (value != null && value !== "" && value !== 0) ? String(value) : "—";
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 font-medium pr-4 whitespace-nowrap">{label}</span>
      <span className="text-xs text-right font-semibold text-gray-800 break-words max-w-[60%]">{display}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{title}</h4>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-1 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

/* ─── Print function ─────────────────────────────────── */

function printRecord(result: LookupResult) {
  const r = result.rawRecord;
  const retrievedDate = result.lookupDate
    ? new Date(result.lookupDate).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })
    : new Date().toLocaleString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Property Record — ${result.lookupAddress || r?.address || "Unknown"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #111; background: white; padding: 0.75in; }
    .header { border-bottom: 3px solid #1a3a5c; pb: 8px; margin-bottom: 16px; }
    .title { font-size: 18pt; font-weight: bold; color: #1a3a5c; letter-spacing: 0.5px; }
    .subtitle { font-size: 10pt; color: #555; margin-top: 3px; }
    .address-bar { background: #f0f4f8; border: 1px solid #c8d8e8; border-radius: 4px; padding: 10px 14px; margin: 14px 0; }
    .address-bar .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #666; }
    .address-bar .value { font-size: 13pt; font-weight: bold; color: #1a3a5c; margin-top: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
    .section { break-inside: avoid; }
    .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1a3a5c; border-bottom: 1.5px solid #1a3a5c; padding-bottom: 3px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    td { padding: 3.5px 4px; vertical-align: top; }
    td:first-child { color: #555; width: 48%; }
    td:last-child { font-weight: 600; text-align: right; }
    tr:nth-child(even) { background: #f8fafc; }
    .source-box { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 8.5pt; color: #666; }
    .confidence-high { color: #15803d; font-weight: bold; }
    .confidence-partial { color: #b45309; font-weight: bold; }
    .watermark { text-align: center; margin-top: 18px; font-size: 8pt; color: #999; font-style: italic; border-top: 1px dashed #ddd; padding-top: 8px; }
    @media print { body { padding: 0.5in; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Property Tax Appeal DIY</div>
    <div class="subtitle">Public Property Record — Printed for Verification Purposes</div>
  </div>

  <div class="address-bar">
    <div class="label">Property Address Looked Up</div>
    <div class="value">${result.lookupAddress || r?.address || "—"}</div>
  </div>

  <div class="grid">

    <div class="section">
      <div class="section-title">Property Identity</div>
      <table>
        <tr><td>Address (on record)</td><td>${r?.address || "—"}</td></tr>
        <tr><td>Borough / Municipality</td><td>${result.municipality || r?.borough || "—"}</td></tr>
        <tr><td>County</td><td>${result.county || "—"}</td></tr>
        <tr><td>ZIP Code</td><td>${r?.zipcode || "—"}</td></tr>
        <tr><td>Block</td><td>${r?.block || "—"}</td></tr>
        <tr><td>Lot</td><td>${r?.lot || "—"}</td></tr>
        <tr><td>BBL (Borough-Block-Lot)</td><td>${r?.bbl || "—"}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Ownership & Classification</div>
      <table>
        <tr><td>Owner of Record</td><td>${r?.ownerName || "—"}</td></tr>
        <tr><td>Building Class</td><td>${r?.buildingClass || "—"}</td></tr>
        <tr><td>Land Use</td><td>${r?.landUse || "—"}</td></tr>
        <tr><td>Zoning District</td><td>${r?.zoneDist || "—"}</td></tr>
        <tr><td>Historic District</td><td>${r?.historicDistrict || "None"}</td></tr>
        <tr><td>School District</td><td>${result.schoolDistrict || r?.schoolDist || "—"}</td></tr>
        <tr><td>Council District</td><td>${r?.councilDist || "—"}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Physical Characteristics</div>
      <table>
        <tr><td>Year Built</td><td>${r?.yearBuilt || "—"}</td></tr>
        <tr><td>Year Last Altered</td><td>${r?.yearAltered || "—"}</td></tr>
        <tr><td>Number of Buildings</td><td>${r?.numBuildings || "—"}</td></tr>
        <tr><td>Number of Floors</td><td>${r?.numFloors || "—"}</td></tr>
        <tr><td>Total Units</td><td>${r?.unitCount || "—"}</td></tr>
        <tr><td>Building Area (total)</td><td>${r?.buildingArea ? r.buildingArea.toLocaleString() + " sq ft" : "—"}</td></tr>
        <tr><td>Residential Area</td><td>${r?.residentialArea ? r.residentialArea.toLocaleString() + " sq ft" : "—"}</td></tr>
        <tr><td>Commercial Area</td><td>${r?.commercialArea ? r.commercialArea.toLocaleString() + " sq ft" : "—"}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Lot & Assessment</div>
      <table>
        <tr><td>Lot Area</td><td>${r?.lotArea ? r.lotArea.toLocaleString() + " sq ft" : "—"}</td></tr>
        <tr><td>Lot Frontage</td><td>${r?.lotFrontage ? r.lotFrontage + " ft" : "—"}</td></tr>
        <tr><td>Lot Depth</td><td>${r?.lotDepth ? r.lotDepth + " ft" : "—"}</td></tr>
        <tr><td>Land Assessment</td><td>${r?.landAssessment ? "$" + r.landAssessment.toLocaleString() : "—"}</td></tr>
        <tr><td>Total Assessment</td><td>${r?.totalAssessment ? "$" + r.totalAssessment.toLocaleString() : "—"}</td></tr>
        <tr><td>Tax Exemptions</td><td>${r?.exemptTotal ? "$" + r.exemptTotal.toLocaleString() : "None"}</td></tr>
      </table>
    </div>

  </div>

  <div class="source-box">
    <strong>Data Source:</strong> ${r?.dataSource || result.source} &nbsp;|&nbsp;
    <strong>Confidence:</strong> <span class="confidence-${result.confidence}">${result.confidence.toUpperCase()}</span> &nbsp;|&nbsp;
    <strong>Dataset Version:</strong> ${r?.dataVersion || "N/A"} &nbsp;|&nbsp;
    <strong>Retrieved:</strong> ${retrievedDate}
    ${result.message ? `<br/><em>Note: ${result.message}</em>` : ""}
  </div>

  <div class="watermark">
    This record was retrieved from public data sources for informational purposes only.<br/>
    Confirm all details against your official tax bill before filing. &nbsp;|&nbsp; Property Tax Appeal DIY &nbsp;|&nbsp; Not legal advice.
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/* ─── Component ─────────────────────────────────────── */

interface PropertyRecordCardProps {
  result: LookupResult;
}

export function PropertyRecordCard({ result }: PropertyRecordCardProps) {
  const r = result.rawRecord;

  const retrievedDate = result.lookupDate
    ? new Date(result.lookupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Just now";

  const confidenceLabel = {
    high: { text: "High confidence — full public record", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    partial: { text: "Partial — location confirmed, details need verification", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    "geocode-only": { text: "Location only — details must be entered manually", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  }[result.confidence];

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-slate-50 overflow-hidden mt-2">
      {/* Card header */}
      <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="font-serif font-bold text-sm">Public Property Record</span>
          </div>
          <p className="text-xs text-primary-foreground/70 mt-0.5">
            Source: {result.source} &nbsp;·&nbsp; Retrieved {retrievedDate}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs h-8 bg-white/20 text-white border-white/30 hover:bg-white/30"
            onClick={() => printRecord(result)}
            type="button"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Confidence banner */}
      <div className={`px-5 py-2 text-xs font-medium border-b flex items-center gap-2 ${confidenceLabel.cls}`}>
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        {confidenceLabel.text}
        {result.message && <span className="opacity-75 ml-1">— {result.message}</span>}
      </div>

      {/* Address bar */}
      <div className="px-5 py-3 border-b border-border bg-white">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Address on Record</div>
        <div className="font-serif font-bold text-base text-foreground">
          {r?.address || result.lookupAddress || "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          {[result.municipality, result.county ? `${result.county} County` : null, r?.zipcode].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Data grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

        <Section title="Property Identity" icon={MapPin}>
          <Row label="Borough / Municipality" value={result.municipality || r?.borough} />
          <Row label="County" value={result.county} />
          <Row label="ZIP Code" value={r?.zipcode} />
          {r?.block && <Row label="Block" value={r.block} />}
          {r?.lot && <Row label="Lot" value={r.lot} />}
          {r?.bbl && <Row label="BBL (Borough-Block-Lot)" value={r.bbl} />}
        </Section>

        <Section title="Ownership & Classification" icon={Users}>
          <Row label="Owner of Record" value={r?.ownerName} />
          <Row label="Building Class" value={r?.buildingClass} />
          <Row label="Land Use" value={r?.landUse} />
          <Row label="Zoning" value={r?.zoneDist} />
          <Row label="Historic District" value={r?.historicDistrict || "None"} />
          <Row label="School District" value={result.schoolDistrict || r?.schoolDist} />
        </Section>

        <Section title="Physical Characteristics" icon={Ruler}>
          <Row label="Year Built" value={fmtNum(r?.yearBuilt)} />
          {r?.yearAltered && <Row label="Last Altered" value={fmtNum(r.yearAltered)} />}
          <Row label="Number of Buildings" value={fmtNum(r?.numBuildings)} />
          <Row label="Number of Floors" value={fmtNum(r?.numFloors)} />
          <Row label="Total Units" value={fmtNum(r?.unitCount)} />
          <Row label="Building Area" value={fmtSqft(r?.buildingArea)} />
          {(r?.residentialArea ?? 0) > 0 && <Row label="Residential Area" value={fmtSqft(r?.residentialArea)} />}
          {(r?.commercialArea ?? 0) > 0 && <Row label="Commercial Area" value={fmtSqft(r?.commercialArea)} />}
        </Section>

        <Section title="Lot & Assessment" icon={DollarSign}>
          <Row label="Lot Area" value={fmtSqft(r?.lotArea)} />
          {r?.lotFrontage && <Row label="Lot Frontage" value={`${r.lotFrontage} ft`} />}
          {r?.lotDepth && <Row label="Lot Depth" value={`${r.lotDepth} ft`} />}
          <Row label="Land Assessment" value={fmt$(r?.landAssessment)} />
          <Row label="Total Assessment" value={fmt$(r?.totalAssessment)} />
          {(r?.exemptTotal ?? 0) > 0 && <Row label="Tax Exemptions" value={fmt$(r?.exemptTotal)} />}
        </Section>

      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-border bg-white/60 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Dataset: {r?.dataVersion || "N/A"} &nbsp;·&nbsp; {r?.dataSource || result.source}</span>
        </div>
        <p className="italic text-right">Confirm all figures against your official tax bill before filing.</p>
      </div>
    </div>
  );
}
