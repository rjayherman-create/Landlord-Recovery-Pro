import { openai } from "@workspace/integrations-openai-ai-server";
import { TimelineEvent } from "./timelineBuilder";

export async function buildCaseNarrative(params: {
  timeline: TimelineEvent[];
  facts: string[];
  amount: number | string;
  claimType?: string;
  state?: string;
}): Promise<string> {
  const timelineText = params.timeline.length
    ? params.timeline.map((t) => `${t.date}: ${t.event}`).join("\n")
    : "No dated events provided.";

  const factsText = params.facts.length
    ? params.facts.map((f, i) => `${i + 1}. ${f}`).join("\n")
    : "No specific facts provided.";

  const prompt = `You are a legal writing assistant helping someone file a small claims court case${params.state ? ` in ${params.state}` : ""}.

Build a strong, court-ready statement using the evidence below.

TIMELINE:
${timelineText}

KEY FACTS:
${factsText}

AMOUNT IN DISPUTE: $${params.amount}${params.claimType ? `\nCLAIM TYPE: ${params.claimType}` : ""}

Rules:
- Write in first person (I, me, my)
- Present events in chronological order
- State only verifiable facts — no speculation or emotion
- Clearly explain the cause of damages and the amount owed
- 150-250 words maximum
- Court-ready tone: professional and concise

Return only the statement text, no preamble.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content?.trim() ?? "";
}
