import { openai } from "@workspace/integrations-openai-ai-server";

export type EvidenceAnalysis = {
  facts: string[];
  timeline: { date: string; event: string }[];
  amounts: { description: string; amount: string }[];
  summary: string;
};

export async function analyzeEvidence(evidenceText: string): Promise<EvidenceAnalysis> {
  const prompt = `Analyze the following evidence and extract structured information.

Return ONLY valid JSON with this exact shape:
{
  "facts": ["string"],
  "timeline": [{ "date": "string", "event": "string" }],
  "amounts": [{ "description": "string", "amount": "string" }],
  "summary": "string"
}

Rules:
- facts: concrete, verifiable statements extracted from the evidence
- timeline: dated events; use ISO dates if possible, or descriptive dates like "March 2026"
- amounts: any dollar amounts or financial figures mentioned
- summary: 1-2 sentence description of what this evidence shows

Evidence:
${evidenceText}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0].message.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      facts: parsed.facts ?? [],
      timeline: parsed.timeline ?? [],
      amounts: parsed.amounts ?? [],
      summary: parsed.summary ?? "",
    };
  } catch {
    return { facts: [], timeline: [], amounts: [], summary: raw.slice(0, 200) };
  }
}
