import type { Grievance, Comparable } from "@workspace/api-client-react";

/* ─── Helpers ────────────────────────────────────────────────── */

const fmt$ = (n?: number | null) =>
  n != null ? `$${Number(n).toLocaleString()}` : "—";

const fmtSf = (n?: number | null) =>
  n != null ? `${Number(n).toLocaleString()} sq ft` : "—";

const fmtPsf = (price?: number | null, sqft?: number | null) =>
  price != null && sqft != null && sqft > 0
    ? `$${Math.round(price / sqft).toLocaleString()}/sf`
    : "—";

const psfNum = (price?: number | null, sqft?: number | null) =>
  price != null && sqft != null && sqft > 0
    ? Math.round(price / sqft)
    : null;

function dateRange(comps: Comparable[]): string {
  const dates = comps.map(c => c.saleDate).filter(Boolean).sort();
  if (dates.length === 0) return "—";
  if (dates.length === 1) return dates[0];
  return `${dates[0]} – ${dates[dates.length - 1]}`;
}

/* ─── State terminology ──────────────────────────────────────── */

function valueLabel(state: string) {
  if (state === "TX") return "Appraised Value";
  if (state === "FL") return "Just Value";
  return "Assessed Value";
}

function formLabel(state: string) {
  if (state === "TX") return "Notice of Protest";
  if (state === "NJ") return "A-1 Petition";
  if (state === "FL") return "DR-486 Petition";
  return "RP-524 Grievance";
}

function bodyLabel(state: string) {
  if (state === "TX") return "Appraisal Review Board (ARB)";
  if (state === "NJ") return "County Board of Taxation";
  if (state === "FL") return "Value Adjustment Board (VAB)";
  return "Board of Assessment Review (BAR)";
}

function basisDisplay(basis: string | null | undefined, state: string): string {
  const map: Record<string, string> = {
    overvaluation: state === "TX" ? "Incorrect Appraised Value" : state === "FL" ? "Overvaluation of Just Value" : state === "NJ" ? "Overassessment" : "Overvaluation",
    unequal: "Unequal Assessment / Unequal Appraisal",
    market_value: "Incorrect Appraised Value",
    exemption: "Exemption Denial",
    portability: "Portability / Save Our Homes Cap Error",
    excessive: "Excessive Assessment",
    unlawful: "Unlawful Assessment",
    classification: "Agricultural / Other Classification Denial",
  };
  return map[basis ?? ""] ?? (basis ?? "Overvaluation");
}

/* ─── CSS for the print window ───────────────────────────────── */

export const COMPS_REPORT_PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; background: #fff; }
  @media print {
    body { margin: 0; }
    @page { margin: 0.5in; size: letter; }
    .no-break { page-break-inside: avoid; }
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #9ca3af; padding: 4px 6px; vertical-align: top; }
  th { background: #1e3a5f; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; white-space: nowrap; }
  tr.alt { background: #f8fafc; }
  tr.highlight td { background: #eff6ff; font-weight: 700; }
  .page { max-width: 750px; margin: 0 auto; padding: 24px 0; }
  .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 18px; }
  .title { font-size: 18px; font-weight: 800; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.05em; }
  .subtitle { font-size: 11px; color: #4b5563; margin-top: 3px; }
  .section { margin-bottom: 20px; }
  .section-label { font-size: 9px; font-weight: 800; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #1e3a5f; padding-bottom: 3px; margin-bottom: 10px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .meta-cell { border: 1px solid #d1d5db; padding: 5px 7px; }
  .meta-cell .label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 2px; }
  .meta-cell .val { font-size: 11px; font-weight: 700; color: #111; }
  .narrative { border: 1px solid #d1d5db; background: #f9fafb; padding: 10px 12px; font-size: 10px; line-height: 1.6; color: #374151; border-left: 4px solid #1e3a5f; margin-bottom: 20px; }
  .narrative strong { color: #1e3a5f; }
  .summary-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 20px; }
  .summary-item { border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; }
  .summary-item .s-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  .summary-item .s-val { font-size: 13px; font-weight: 800; color: #1e3a5f; margin-top: 2px; }
  .summary-item.highlight { background: #eff6ff; border-color: #3b82f6; }
  .summary-item.alert { background: #fef2f2; border-color: #f87171; }
  .summary-item.alert .s-val { color: #b91c1c; }
  .comp-source { font-size: 8px; color: #2563eb; word-break: break-all; }
  .footer { border-top: 1px solid #d1d5db; margin-top: 24px; padding-top: 10px; font-size: 8px; color: #9ca3af; display: flex; justify-content: space-between; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .cert-block { border: 1px solid #d1d5db; padding: 10px 12px; margin-top: 20px; font-size: 9px; color: #374151; line-height: 1.6; }
  .cert-block .cert-label { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1e3a5f; margin-bottom: 6px; }
  .sig-line { border-bottom: 1px solid #9ca3af; margin-top: 20px; width: 260px; display: inline-block; }
  .sig-caption { font-size: 8px; color: #9ca3af; margin-top: 2px; }
`;

/* ─── Component ──────────────────────────────────────────────── */

interface Props {
  grievance: Grievance;
  comparables: Comparable[];
}

export function CompsReportPrintForm({ grievance, comparables }: Props) {
  const state: string = (grievance as any).state ?? "NY";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const comps = comparables.slice(0, 6);

  const avgPrice = comps.length > 0
    ? Math.round(comps.reduce((s, c) => s + c.salePrice, 0) / comps.length)
    : null;

  const subjectSqft = (grievance as any).squareFeet as number | undefined;

  const avgPsf = (() => {
    const items = comps.filter(c => c.squareFeet != null && c.squareFeet > 0);
    if (items.length === 0) return null;
    return Math.round(items.reduce((s, c) => s + c.salePrice / c.squareFeet!, 0) / items.length);
  })();

  const subjectPsf = subjectSqft && subjectSqft > 0
    ? Math.round(grievance.currentAssessment / subjectSqft)
    : null;

  const indicatedValue = avgPrice ?? grievance.estimatedMarketValue;
  const overassessment = indicatedValue != null
    ? grievance.currentAssessment - indicatedValue
    : null;
  const overPct = overassessment != null && indicatedValue != null && indicatedValue > 0
    ? Math.round((overassessment / indicatedValue) * 100)
    : null;

  const vlabel = valueLabel(state);
  const flabel = formLabel(state);
  const blabel = bodyLabel(state);

  const basisText = basisDisplay((grievance as any).basisOfComplaint, state);

  const narrative = (() => {
    const n = comps.length;
    if (n === 0) return "No comparable sales have been added. Please add 3–6 comparable sales to complete this report.";
    const range = dateRange(comps);
    const dist = comps.filter(c => c.distance).map(c => c.distance)[0];
    const distStr = dist ? ` within ${dist} of the subject property` : " in the subject market area";
    const psfStr = avgPsf ? ` at an average of ${fmt$(avgPsf)} per square foot` : "";
    const subjectStr = subjectSqft && avgPsf
      ? ` The subject property${subjectPsf ? ` is currently valued at ${fmt$(subjectPsf)}/sq ft, compared to the market median of ${fmt$(avgPsf)}/sq ft among the comparables.` : "."}`
      : "";
    const reductionStr = overassessment && overPct
      ? ` This analysis supports a ${vlabel.toLowerCase()} reduction of approximately ${fmt$(overassessment)} (${overPct}%).`
      : "";
    return `Based on ${n} comparable sale${n !== 1 ? "s" : ""} of similar properties${distStr}, sold between ${range}${psfStr}, the indicated market value of the subject property is approximately ${fmt$(indicatedValue)}. The current ${vlabel} is ${fmt$(grievance.currentAssessment)}.${subjectStr}${reductionStr}`;
  })();

  return (
    <div className="page">

      {/* Header */}
      <div className="header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="title">Comparable Sales Analysis</div>
            <div className="subtitle">
              Prepared in support of {flabel} — Tax Year {grievance.taxYear} &nbsp;|&nbsp; Filed with: {blabel}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#6b7280" }}>Generated</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{today}</div>
            {state !== "NY" && (
              <div className={`badge ${state === "TX" ? "badge-amber" : state === "FL" ? "badge-green" : "badge-blue"}`} style={{ marginTop: 4 }}>
                {state === "TX" ? "Texas" : state === "NJ" ? "New Jersey" : "Florida"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject property summary */}
      <div className="section no-break">
        <div className="section-label">Subject Property</div>
        <div className="meta-grid">
          <div className="meta-cell" style={{ gridColumn: "span 2" }}>
            <div className="label">Property Address</div>
            <div className="val">{grievance.propertyAddress}</div>
          </div>
          <div className="meta-cell">
            <div className="label">Tax Year</div>
            <div className="val">{grievance.taxYear}</div>
          </div>
          <div className="meta-cell">
            <div className="label">Owner / Petitioner</div>
            <div className="val">{grievance.ownerName}</div>
          </div>
          <div className="meta-cell">
            <div className="label">County</div>
            <div className="val">{grievance.county} County</div>
          </div>
          <div className="meta-cell">
            <div className="label">Parcel ID</div>
            <div className="val">{(grievance as any).parcelId || "—"}</div>
          </div>
          <div className="meta-cell">
            <div className="label">Current {vlabel}</div>
            <div className="val" style={{ color: "#b91c1c" }}>{fmt$(grievance.currentAssessment)}</div>
          </div>
          <div className="meta-cell">
            <div className="label">Requested {vlabel}</div>
            <div className="val" style={{ color: "#065f46" }}>{fmt$(grievance.requestedAssessment)}</div>
          </div>
          <div className="meta-cell">
            <div className="label">Basis of {state === "TX" ? "Protest" : "Complaint"}</div>
            <div className="val">{basisText}</div>
          </div>
          {subjectSqft && (
            <div className="meta-cell">
              <div className="label">Living Area</div>
              <div className="val">{fmtSf(subjectSqft)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="section no-break">
        <div className="section-label">Valuation Summary</div>
        <div className="summary-box">
          <div className="summary-item">
            <div className="s-label">Comparables Provided</div>
            <div className="s-val">{comps.length}</div>
          </div>
          <div className="summary-item">
            <div className="s-label">Avg Comp Sale Price</div>
            <div className="s-val">{fmt$(avgPrice)}</div>
          </div>
          {avgPsf && (
            <div className="summary-item">
              <div className="s-label">Avg Comp $/Sq Ft</div>
              <div className="s-val">{fmt$(avgPsf)}/sf</div>
            </div>
          )}
          {subjectPsf && (
            <div className={`summary-item ${subjectPsf > (avgPsf ?? 0) ? "alert" : ""}`}>
              <div className="s-label">Subject $/Sq Ft (current)</div>
              <div className="s-val">{fmt$(subjectPsf)}/sf</div>
            </div>
          )}
          <div className="summary-item highlight">
            <div className="s-label">Indicated Market Value</div>
            <div className="s-val">{fmt$(indicatedValue)}</div>
          </div>
          <div className="summary-item alert">
            <div className="s-label">Current {vlabel}</div>
            <div className="s-val">{fmt$(grievance.currentAssessment)}</div>
          </div>
          {overassessment != null && overassessment > 0 && (
            <div className="summary-item alert">
              <div className="s-label">Over-Assessment</div>
              <div className="s-val">{fmt$(overassessment)}{overPct ? ` (${overPct}%)` : ""}</div>
            </div>
          )}
          <div className="summary-item">
            <div className="s-label">Sale Date Range</div>
            <div className="s-val" style={{ fontSize: 9 }}>{dateRange(comps)}</div>
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div className="section no-break">
        <div className="section-label">Analyst Narrative</div>
        <div className="narrative">{narrative}</div>
      </div>

      {/* Comparables table */}
      <div className="section">
        <div className="section-label">Comparable Sales Detail ({comps.length} of up to 6)</div>
        {comps.length === 0 ? (
          <div style={{ padding: "16px", border: "1px solid #d1d5db", textAlign: "center", color: "#9ca3af", fontSize: 10 }}>
            No comparables have been added. Add comparable sales from the Case detail page.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 22 }}>#</th>
                <th>Address</th>
                <th style={{ width: 72 }}>Sale Date</th>
                <th style={{ width: 80 }}>Sale Price</th>
                <th style={{ width: 70 }}>Sq Ft</th>
                <th style={{ width: 68 }}>$/Sq Ft</th>
                <th style={{ width: 38 }}>Beds</th>
                <th style={{ width: 38 }}>Baths</th>
                <th style={{ width: 52 }}>Yr Built</th>
                <th style={{ width: 60 }}>Distance</th>
                <th style={{ width: 78 }}>Assessed Val</th>
              </tr>
            </thead>
            <tbody>
              {comps.map((c, i) => (
                <>
                  <tr key={`row-${i}`} className={i % 2 === 1 ? "alt" : ""}>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.address}</td>
                    <td>{c.saleDate || "—"}</td>
                    <td style={{ fontWeight: 700, color: "#1e3a5f" }}>{fmt$(c.salePrice)}</td>
                    <td>{c.squareFeet ? c.squareFeet.toLocaleString() : "—"}</td>
                    <td>{fmtPsf(c.salePrice, c.squareFeet)}</td>
                    <td style={{ textAlign: "center" }}>{c.bedrooms ?? "—"}</td>
                    <td style={{ textAlign: "center" }}>{c.bathrooms ?? "—"}</td>
                    <td style={{ textAlign: "center" }}>{c.yearBuilt ?? "—"}</td>
                    <td>{c.distance || "—"}</td>
                    <td>{fmt$(c.assessedValue)}</td>
                  </tr>
                  {(c.notes || c.sourceUrl) && (
                    <tr key={`notes-${i}`} className={i % 2 === 1 ? "alt" : ""}>
                      <td />
                      <td colSpan={10} style={{ paddingTop: 2, paddingBottom: 4 }}>
                        {c.notes && <div style={{ fontSize: 9, color: "#4b5563", fontStyle: "italic" }}>{c.notes}</div>}
                        {c.sourceUrl && (
                          <div className="comp-source">Source: {c.sourceUrl}</div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {/* Summary row */}
              {comps.length > 1 && (
                <tr className="highlight">
                  <td colSpan={2} style={{ fontWeight: 700, fontSize: 9 }}>AVERAGES / TOTALS ({comps.length} comps)</td>
                  <td />
                  <td style={{ fontWeight: 800, color: "#1e3a5f" }}>{fmt$(avgPrice)}</td>
                  <td style={{ fontSize: 9 }}>
                    {(() => {
                      const items = comps.filter(c => c.squareFeet);
                      return items.length > 0
                        ? Math.round(items.reduce((s, c) => s + c.squareFeet!, 0) / items.length).toLocaleString()
                        : "—";
                    })()}
                  </td>
                  <td style={{ fontWeight: 700 }}>{avgPsf ? `$${avgPsf.toLocaleString()}/sf` : "—"}</td>
                  <td colSpan={5} />
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Price-per-sq-ft comparison (if data available) */}
      {subjectSqft && avgPsf && (
        <div className="section no-break">
          <div className="section-label">Price-Per-Square-Foot Analysis</div>
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Value / Sale Price</th>
                <th>Living Area</th>
                <th>Value Per Sq Ft</th>
                <th>Vs. Market Median</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlight">
                <td style={{ fontWeight: 700 }}>Subject — {grievance.propertyAddress}</td>
                <td style={{ color: "#b91c1c", fontWeight: 700 }}>{fmt$(grievance.currentAssessment)} (current)</td>
                <td>{fmtSf(subjectSqft)}</td>
                <td style={{ fontWeight: 700 }}>{subjectPsf ? `$${subjectPsf.toLocaleString()}/sf` : "—"}</td>
                <td style={{ fontWeight: 700, color: subjectPsf && subjectPsf > avgPsf ? "#b91c1c" : "#065f46" }}>
                  {subjectPsf ? (subjectPsf > avgPsf ? `+$${(subjectPsf - avgPsf).toLocaleString()}/sf over market` : `$${(avgPsf - subjectPsf).toLocaleString()}/sf below market`) : "—"}
                </td>
              </tr>
              {comps.filter(c => c.squareFeet).map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? "alt" : ""}>
                  <td>Comp {i + 1} — {c.address}</td>
                  <td>{fmt$(c.salePrice)}</td>
                  <td>{fmtSf(c.squareFeet)}</td>
                  <td>{fmtPsf(c.salePrice, c.squareFeet)}</td>
                  <td style={{ color: "#4b5563" }}>
                    {psfNum(c.salePrice, c.squareFeet) != null
                      ? `${Math.round(((psfNum(c.salePrice, c.squareFeet)! / avgPsf) - 1) * 100) >= 0 ? "+" : ""}${Math.round(((psfNum(c.salePrice, c.squareFeet)! / avgPsf) - 1) * 100)}% vs avg`
                      : "—"}
                  </td>
                </tr>
              ))}
              <tr className="highlight">
                <td style={{ fontWeight: 700 }}>Comparable Sales Median</td>
                <td style={{ fontWeight: 700 }}>{fmt$(avgPrice)}</td>
                <td>—</td>
                <td style={{ fontWeight: 700 }}>${avgPsf.toLocaleString()}/sf</td>
                <td>Market Benchmark</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Certification block */}
      <div className="cert-block no-break">
        <div className="cert-label">Certification of Petitioner</div>
        <div>
          I, the undersigned, certify that the information presented in this Comparable Sales Analysis is true, accurate,
          and complete to the best of my knowledge and belief. All comparable sales were sourced from public records
          or licensed data sources and have been verified for accuracy. This report is submitted in support of my
          property tax {state === "TX" ? "protest" : "appeal"} for Tax Year {grievance.taxYear}.
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 20 }}>
          <div>
            <div className="sig-line" />
            <div className="sig-caption">Signature of Owner / Petitioner</div>
          </div>
          <div>
            <div className="sig-line" style={{ width: 120 }} />
            <div className="sig-caption">Date</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{grievance.ownerName}</div>
            <div className="sig-caption" style={{ marginTop: 4 }}>Printed Name</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div>Property Tax Appeal DIY &nbsp;|&nbsp; Not legal advice &nbsp;|&nbsp; Generated {today}</div>
        <div>{grievance.county} County {state} &nbsp;|&nbsp; Tax Year {grievance.taxYear} &nbsp;|&nbsp; {flabel}</div>
      </div>

    </div>
  );
}
