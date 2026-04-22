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

export async function generateCaseDescription(params: {
  claimType: string;
  state: string;
  claimAmount: number;
  monthlyRent?: number | null;
  rentPeriod?: string | null;
  tenantName?: string | null;
  propertyAddress?: string | null;
  leaseStartDate?: string | null;
  moveOutDate?: string | null;
}): Promise<string> {
  const claimLabel = params.claimType.replace(/_/g, " ");
  const lines = [
    `Claim type: ${claimLabel}`,
    `State: ${params.state}`,
    `Amount claimed: $${params.claimAmount.toFixed(2)}`,
    params.monthlyRent ? `Monthly rent: $${params.monthlyRent.toFixed(2)}` : null,
    params.rentPeriod ? `Rent owed for: ${params.rentPeriod}` : null,
    params.tenantName ? `Tenant: ${params.tenantName}` : null,
    params.propertyAddress ? `Property: ${params.propertyAddress}` : null,
    params.leaseStartDate ? `Lease started: ${params.leaseStartDate}` : null,
    params.moveOutDate ? `Tenant moved out: ${params.moveOutDate}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are a legal assistant helping a landlord document a small claims case.
Write a concise, factual case description (2–4 sentences, under 120 words) from the landlord's perspective based on these facts:

${lines}

Rules:
- Write in first person (I, my, the tenant)
- State only facts, no legal arguments or emotional language
- Clearly state what happened and how much is owed
- Do not include headers, labels, or preamble — return only the description text`;

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
