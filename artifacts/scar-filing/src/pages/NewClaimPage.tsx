import { FormEvent, useState } from "react";
import { Scale, CheckCircle, Clock, AlertCircle, FileText, DollarSign } from "lucide-react";

const API_BASE = "";

const CLAIM_TYPE_LABELS: Record<string, string> = {
  unpaid_rent: "Unpaid Rent",
  damages: "Property Damage",
  utilities: "Utilities",
  resident_balance: "Resident Balance",
};

interface ClaimForm {
  claimType: string;
  claimantName: string;
  businessName: string;
  propertyName: string;
  unitLabel: string;
  subjectName: string;
  guarantorName: string;
  lastKnownAddress: string;
  moveOutDate: string;
  amountOwed: string;
  rentOwed: string;
  damageOwed: string;
  utilityOwed: string;
  otherOwed: string;
  notes: string;
}

interface AnalysisResult {
  timeline: { date: string; event: string }[];
  facts: string[];
  amounts: { label: string; amount: number }[];
  narrative: string;
}

const DEFAULT_FORM: ClaimForm = {
  claimType: "unpaid_rent",
  claimantName: "",
  businessName: "",
  propertyName: "",
  unitLabel: "",
  subjectName: "",
  guarantorName: "",
  lastKnownAddress: "",
  moveOutDate: "",
  amountOwed: "",
  rentOwed: "",
  damageOwed: "",
  utilityOwed: "",
  otherOwed: "",
  notes: "",
};

export function NewClaimPage() {
  const [form, setForm] = useState<ClaimForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ClaimForm>(key: K, value: ClaimForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setResult(null);
    setForm(DEFAULT_FORM);
  }
    e.preventDefault();
    setSaving(true);
    setError(null);
    setResult(null);

    const breakdown: string[] = [];
    if (form.rentOwed) breakdown.push(`Unpaid rent: $${form.rentOwed}`);
    if (form.damageOwed) breakdown.push(`Property damage: $${form.damageOwed}`);
    if (form.utilityOwed) breakdown.push(`Utilities: $${form.utilityOwed}`);
    if (form.otherOwed) breakdown.push(`Other charges: $${form.otherOwed}`);

    const description = [
      `${CLAIM_TYPE_LABELS[form.claimType] ?? form.claimType} claim`,
      `by ${form.claimantName}${form.businessName ? ` (${form.businessName})` : ""}`,
      `against ${form.subjectName}${form.guarantorName ? ` / Guarantor: ${form.guarantorName}` : ""}`,
      form.propertyName ? `at ${form.propertyName}${form.unitLabel ? `, Unit ${form.unitLabel}` : ""}` : "",
      form.moveOutDate ? `Move-out / End Date: ${form.moveOutDate}` : "",
      `Total owed: $${form.amountOwed}`,
    ]
      .filter(Boolean)
      .join(". ");

    const supportingFacts = [
      ...breakdown,
      form.lastKnownAddress ? `Last known address: ${form.lastKnownAddress}` : "",
      form.notes ? `Notes: ${form.notes}` : "",
    ]
      .filter(Boolean)
      .join(". ");

    try {
      const res = await fetch(`${API_BASE}/api/analyze-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimType: form.claimType,
          amount: Number(form.amountOwed) || 0,
          description,
          supportingFacts,
        }),
      });
      if (!res.ok) throw new Error("Analysis request failed");
      setResult(await res.json());
    } catch {
      setError("Failed to analyze case. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">New Recovery Claim</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Enter the details below. Our AI will analyze the case and generate a court-ready narrative.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-card-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Claim Type</span>
          <select
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.claimType}
            onChange={(e) => update("claimType", e.target.value)}
            required
          >
            <option value="unpaid_rent">Unpaid Rent</option>
            <option value="damages">Property Damage</option>
            <option value="utilities">Utilities</option>
            <option value="resident_balance">Resident Balance</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Claimant Name</span>
          <input
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.claimantName}
            onChange={(e) => update("claimantName", e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Business Name</span>
          <input
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Property / Facility</span>
          <input
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.propertyName}
            onChange={(e) => update("propertyName", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Unit / Room</span>
          <input
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.unitLabel}
            onChange={(e) => update("unitLabel", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Subject Name</span>
          <input
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.subjectName}
            onChange={(e) => update("subjectName", e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Guarantor Name</span>
          <input
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.guarantorName}
            onChange={(e) => update("guarantorName", e.target.value)}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Last Known Address</span>
          <textarea
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={3}
            value={form.lastKnownAddress}
            onChange={(e) => update("lastKnownAddress", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Move-out / End Date</span>
          <input
            type="date"
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.moveOutDate}
            onChange={(e) => update("moveOutDate", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Total Amount Owed</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.amountOwed}
            onChange={(e) => update("amountOwed", e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Rent Owed</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.rentOwed}
            onChange={(e) => update("rentOwed", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Damage Owed</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.damageOwed}
            onChange={(e) => update("damageOwed", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Utility Owed</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.utilityOwed}
            onChange={(e) => update("utilityOwed", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Other Owed</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={form.otherOwed}
            onChange={(e) => update("otherOwed", e.target.value)}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            className="w-full rounded-xl border border-border p-3 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </label>

        <div className="md:col-span-2 flex justify-end">
          <button
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-white text-sm font-medium disabled:opacity-60 hover:bg-slate-800 transition-colors"
          >
            {saving ? "Analyzing..." : "Analyze Case"}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-6 flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Analysis results */}
      {result && (
        <div className="mt-8 space-y-6">
          <h2 className="font-serif text-xl font-semibold text-foreground">Case Analysis</h2>

          {/* Narrative */}
          {result.narrative && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-sm text-foreground">Court-Ready Narrative</h3>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.narrative}</p>
            </div>
          )}

          {/* Facts */}
          {result.facts.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-sm text-foreground">Key Facts</h3>
              </div>
              <ul className="space-y-1.5">
                {result.facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline */}
          {result.timeline.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-medium text-sm text-foreground">Timeline</h3>
              </div>
              <div className="space-y-2">
                {result.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-medium text-muted-foreground shrink-0 w-28">{event.date}</span>
                    <span className="text-foreground">{event.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amounts */}
          {result.amounts.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-sm text-foreground">Identified Amounts</h3>
              </div>
              <div className="space-y-1.5">
                {result.amounts.map((amt, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{amt.label}</span>
                    <span className="font-semibold text-foreground">${Number(amt.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={resetForm}
              className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2.5 hover:bg-secondary/50 transition-colors"
            >
              Start New Claim
            </button>
            <a
              href="/file"
              className="text-sm bg-primary text-primary-foreground rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity font-medium"
            >
              Continue to Full Filing →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
