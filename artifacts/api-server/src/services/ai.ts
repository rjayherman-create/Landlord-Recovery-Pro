import { openai } from "@workspace/integrations-openai-ai-server";

export async function improveClaim(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "Rewrite this into a strong small claims court statement.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}

export async function generateStatement(params: {
  claimType: string;
  state: string;
  county?: string | null;
  claimantName: string;
  defendantName: string;
  claimAmount: number;
  claimDescription: string;
  incidentDate?: string | null;
  claimBasis?: string | null;
  supportingFacts?: string | null;
  desiredOutcome?: string | null;
}): Promise<string> {
  const rawText = `
Claim type: ${params.claimType.replace(/_/g, " ")}
State: ${params.state}${params.county ? `, ${params.county} County` : ""}
Claimant: ${params.claimantName}
Defendant: ${params.defendantName}
Amount: $${params.claimAmount.toFixed(2)}
${params.incidentDate ? `Incident date: ${params.incidentDate}` : ""}
${params.claimBasis ? `Legal basis: ${params.claimBasis}` : ""}
What happened: ${params.claimDescription}
${params.supportingFacts ? `Evidence: ${params.supportingFacts}` : ""}
${params.desiredOutcome ? `Desired outcome: ${params.desiredOutcome}` : ""}
  `.trim();

  return improveClaim(rawText);
}

export async function buildCaseFromInputs(data: {
  caseType: string;
  agreement: string;
  problem: string;
  date: string;
  amount: string | number;
  state?: string;
}): Promise<string> {
  const prompt = `Build a concise small claims court statement (150-250 words) from these facts.

Case Type: ${data.caseType}
State: ${data.state ?? ""}
Agreement/Background: ${data.agreement}
What went wrong: ${data.problem}
When it happened: ${data.date}
Amount owed: $${data.amount}

Rules:
- Write in first person (I, me, my)
- Present in chronological order
- State only facts, no emotion or speculation
- Clearly tie the facts to the dollar amount claimed
- Court-ready, professional tone
- Return only the statement text, no preamble or labels`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content?.trim() ?? "";
}

export async function chatWithAssistant(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}): Promise<AsyncIterable<{ content: string }>> {
  const stream = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: params.messages,
    stream: true,
  });

  async function* generate() {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) yield { content: delta };
    }
  }

  return generate();
}
