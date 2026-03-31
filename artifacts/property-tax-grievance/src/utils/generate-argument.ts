export interface ArgumentData {
  address?: string;
  assessedValue?: number | null;
  estimatedMarketValue?: number | null;
  county?: string;
  state?: string;
}

export interface CompForArgument {
  salePrice?: number | null;
}

export function generateAppealArgument(
  data: ArgumentData,
  comps: CompForArgument[]
): string {
  const assessed = Number(data.assessedValue) || 0;
  const market = Number(data.estimatedMarketValue) || 0;
  const state = (data.state || "NY").toUpperCase();
  const address = data.address || "the subject property";
  const county = data.county || "the subject municipality";

  const validComps = comps.filter((c) => Number(c.salePrice) > 0);
  const avgPrice =
    validComps.length > 0
      ? validComps.reduce((s, c) => s + Number(c.salePrice), 0) / validComps.length
      : market;

  const avg = avgPrice > 0 ? `$${Math.round(avgPrice).toLocaleString()}` : "current market levels";
  const assessedFmt = assessed > 0 ? `$${assessed.toLocaleString()}` : "the current assessed amount";
  const compNote = validComps.length > 0
    ? `Comparable properties in the area indicate an estimated market value of approximately ${avg}`
    : `Current market analysis suggests an estimated market value of approximately ${avg}`;

  if (state === "NY") {
    return `The property located at ${address} appears to be over-assessed relative to its fair market value. ${compNote}, while the current assessed value is ${assessedFmt}. This suggests the property exceeds its fair market value and warrants a reduction in assessment based on comparable sales and prevailing market conditions in ${county}.`;
  }

  if (state === "NJ") {
    return `The subject property at ${address} exceeds its true market value based on recent comparable sales. The average value of similar properties in the area is approximately ${avg}, while the assessed value is ${assessedFmt}. This discrepancy indicates the assessment may not comply with New Jersey's equalization standards and Chapter 123 ratio requirements, and should be adjusted accordingly to reflect true market value.`;
  }

  if (state === "TX") {
    return `The property located at ${address} appears to be unequally appraised when compared to similar properties in the area. Comparable homes in the same market area indicate a value of approximately ${avg}, while the current appraisal stands at ${assessedFmt}. This difference supports a claim of unequal appraisal under Texas Tax Code §41.43 and justifies a reduction in appraised value to reflect current market conditions.`;
  }

  if (state === "FL") {
    return `The just value of the property at ${address} appears to be overstated relative to current market conditions. Comparable properties in the area suggest a just market value of approximately ${avg}, while the assessed value is ${assessedFmt}. Based on Florida's just value standard under §193.011, F.S., and the evidence of comparable sales data, a reduction in the assessed value is warranted before the Value Adjustment Board.`;
  }

  return `The property located at ${address} appears to be over-assessed compared to similar properties. Comparable sales indicate a value near ${avg}, while the assessed value is ${assessedFmt}. A reduction in assessment is supported by current market data.`;
}

export function getStateStrategy(state: string): { title: string; description: string } {
  const s = (state || "NY").toUpperCase();
  if (s === "NY") return { title: "NY-Specific Valuation Challenge", description: "Argues over-assessment vs. fair market value under RPTL §305" };
  if (s === "NJ") return { title: "NJ Chapter 123 Ratio Challenge", description: "Challenges compliance with NJ equalization standards" };
  if (s === "TX") return { title: "TX Unequal Appraisal Challenge", description: "Claims unequal appraisal under Texas Tax Code §41.43" };
  if (s === "FL") return { title: "FL Just Value Challenge", description: "Challenges just value under Florida §193.011, F.S." };
  return { title: "Market Value Challenge", description: "Argues assessment exceeds current fair market value" };
}

export function calculateApprovalLikelihood(
  marketValue: number,
  assessedValue: number,
  compsCount: number
): { score: number; label: "High" | "Moderate" | "Low"; color: string } {
  if (!marketValue || !assessedValue) return { score: 0, label: "Low", color: "text-slate-600" };

  const gap = assessedValue - marketValue;
  const percentDiff = gap / marketValue;

  let score = 20;
  if (percentDiff > 0.2) score += 40;
  else if (percentDiff > 0.1) score += 25;
  else if (percentDiff > 0.05) score += 10;

  if (compsCount >= 3) score += 30;
  else if (compsCount >= 1) score += 15;

  score = Math.min(score, 95);

  if (score > 70) return { score, label: "High", color: "text-emerald-700" };
  if (score > 40) return { score, label: "Moderate", color: "text-amber-700" };
  return { score, label: "Low", color: "text-slate-600" };
}
