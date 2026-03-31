export interface ArgumentData {
  address?: string;
  assessedValue?: number | string | null;
  estimatedMarketValue?: number | string | null;
  county?: string;
  state?: string;
}

export interface CompForArgument {
  address?: string;
  salePrice?: number | string | null;
}

export function generateAppealArgument(
  data: ArgumentData,
  comps: CompForArgument[]
): string {
  const assessed = Number(data.assessedValue) || 0;
  const market = Number(data.estimatedMarketValue) || 0;
  const location = [data.county, data.state].filter(Boolean).join(", ");
  const subject = data.address || "the subject property";

  const validComps = comps.filter((c) => Number(c.salePrice) > 0);
  const avgPrice =
    validComps.length > 0
      ? validComps.reduce((s, c) => s + Number(c.salePrice), 0) / validComps.length
      : 0;

  let arg = `The property located at ${subject}`;
  if (location) arg += ` in ${location}`;
  arg += ` appears to be over-assessed`;

  if (validComps.length >= 2 && avgPrice > 0) {
    arg += ` when compared to similar properties in the area. `;
    arg += `Recent comparable sales of ${validComps.length} nearby properties show an average market value of approximately $${Math.round(avgPrice).toLocaleString()}`;
    if (assessed > 0) {
      arg += `, while the current assessed value of $${assessed.toLocaleString()} exceeds this market-supported figure`;
      const overPct = (((assessed - avgPrice) / avgPrice) * 100).toFixed(1);
      if (assessed > avgPrice) {
        arg += ` by approximately ${overPct}%`;
      }
    }
    arg += `. `;
    arg += `This discrepancy between the assessed value and the evidence provided by arm's-length comparable sales indicates that the property is assessed above its fair market value. `;
  } else if (market > 0 && assessed > market) {
    arg += ` relative to current market conditions. `;
    arg += `The property's estimated fair market value of $${market.toLocaleString()} is below the current assessed value of $${assessed.toLocaleString()}, `;
    const diff = assessed - market;
    arg += `representing an over-assessment of $${diff.toLocaleString()}. `;
    arg += `Current local real estate market data does not support this level of assessment. `;
  } else {
    arg += ` based on the evidence presented herein. `;
  }

  arg += `Therefore, a reduction in the assessed value is respectfully requested based on current market conditions`;
  if (validComps.length >= 2) arg += ` and the comparable sales evidence presented`;
  arg += `.`;

  return arg;
}
