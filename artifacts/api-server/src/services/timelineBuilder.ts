import { EvidenceAnalysis } from "./evidenceAI";

export type TimelineEvent = { date: string; event: string };

export function buildTimeline(evidenceResults: EvidenceAnalysis[]): TimelineEvent[] {
  const all: TimelineEvent[] = [];

  for (const result of evidenceResults) {
    if (Array.isArray(result.timeline)) {
      all.push(...result.timeline);
    }
  }

  return all.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db2 = new Date(b.date).getTime();
    if (!isNaN(da) && !isNaN(db2)) return da - db2;
    return a.date.localeCompare(b.date);
  });
}

export function collectFacts(evidenceResults: EvidenceAnalysis[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of evidenceResults) {
    for (const f of r.facts ?? []) {
      const key = f.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(f);
      }
    }
  }
  return out;
}

export function collectAmounts(evidenceResults: EvidenceAnalysis[]) {
  return evidenceResults.flatMap((r) => r.amounts ?? []);
}
