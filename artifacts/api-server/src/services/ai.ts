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
