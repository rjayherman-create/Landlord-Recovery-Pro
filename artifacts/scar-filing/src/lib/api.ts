const API_BASE = "";

export interface CaseDashboardData {
  case: SmallClaimsCase;
  evidence: { id: number; fileName: string; mimeType: string }[];
  timeline: { date: string; event: string; type: string }[];
}

export interface SmallClaimsCase {
  id: number;
  userId?: string | null;
  claimType: string;
  state: string;
  county?: string | null;
  courtLocation?: string | null;
  claimantName: string;
  claimantEmail?: string | null;
  claimantPhone?: string | null;
  claimantAddress?: string | null;
  defendantName: string;
  defendantAddress?: string | null;
  defendantEmail?: string | null;
  defendantPhone?: string | null;
  claimAmount: number;
  claimDescription: string;
  claimBasis?: string | null;
  incidentDate?: string | null;
  desiredOutcome?: string | null;
  supportingFacts?: string | null;
  generatedStatement?: string | null;
  conversationId?: number | null;
  status: "draft" | "ready" | "filed" | "dismissed" | "won" | "lost" | string;
  filingDeadline?: string | null;
  caseNumber?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  hearingDate?: string | null;
  lastUpdate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCases(): Promise<SmallClaimsCase[]> {
  const res = await fetch(`${API_BASE}/api/cases`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function deleteCase(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/cases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete case");
}

export async function getCase(id: string): Promise<CaseDashboardData> {
  const res = await fetch(`${API_BASE}/api/cases/${id}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch case");
  return res.json();
}

export async function updateCaseStatus(
  id: string,
  status: string
): Promise<{ case: SmallClaimsCase }> {
  const res = await fetch(`${API_BASE}/api/cases/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update case status");
  const updated: SmallClaimsCase = await res.json();
  return { case: updated };
}

export function getCourtSummaryUrl(id: string): string {
  return `${API_BASE}/api/small-claims/download/${id}`;
}

export function getDemandLetterUrl(id: string): string {
  return `${API_BASE}/api/cases/${id}/collection/demand-letter`;
}
