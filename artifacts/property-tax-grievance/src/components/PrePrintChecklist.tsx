import { useState } from "react";
import { CheckSquare2, Square, AlertTriangle, ShieldCheck, FileSearch } from "lucide-react";
import type { Grievance } from "@workspace/api-client-react";

interface CheckItem {
  id: string;
  label: string;
  value: string;
  sourceLabel: string;
  critical: boolean;
}

interface PrePrintChecklistProps {
  grievance: Grievance;
  onAllConfirmed?: (confirmed: boolean) => void;
}

function fmt(v: string | number | null | undefined, prefix = ""): string {
  if (v == null || String(v).trim() === "") return "Not filled in — click Edit";
  return prefix + String(v);
}

export function PrePrintChecklist({ grievance, onAllConfirmed }: PrePrintChecklistProps) {
  const items: CheckItem[] = [
    {
      id: "owner",
      label: "Owner / complainant name",
      value: fmt(grievance.ownerName),
      sourceLabel: "Must match the name on your deed and property tax bill exactly",
      critical: true,
    },
    {
      id: "address",
      label: "Property address",
      value: fmt(grievance.propertyAddress),
      sourceLabel: "Must match your tax bill exactly — including any unit numbers",
      critical: true,
    },
    {
      id: "parcel",
      label: "Parcel ID / Tax Map Number (SBL)",
      value: fmt(grievance.parcelId),
      sourceLabel: "Find this on your tax bill — reject risk is high if this is wrong or missing",
      critical: true,
    },
    {
      id: "assessment",
      label: "Current assessed value",
      value: fmt(grievance.currentAssessment, "$"),
      sourceLabel: "This must match the assessed value on your current tax bill — not the market value",
      critical: true,
    },
    {
      id: "taxyear",
      label: "Tax year being grieved",
      value: fmt(grievance.taxYear),
      sourceLabel: "Confirm this is the year shown on your tax bill",
      critical: true,
    },
  ];

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = items.every((item) => checked[item.id]);
  const checkedCount = items.filter((item) => checked[item.id]).length;

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    onAllConfirmed?.(items.every((item) => next[item.id]));
  };

  const anyMissing = items.some(
    (item) => item.value === "Not filled in — click Edit"
  );

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-start gap-3">
          <FileSearch className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif font-bold text-base">Before you print — verify against your tax bill</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              These values will appear on your form exactly as shown. A mismatch with your tax bill is the most common reason a grievance is rejected before it reaches the reviewer. Check each one against your actual tax bill.
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
            allChecked
              ? "bg-emerald-100 text-emerald-700"
              : checkedCount > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-secondary text-muted-foreground"
          }`}>
            {checkedCount}/{items.length} confirmed
          </span>
        </div>
      </div>

      {anyMissing && (
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
          <span>One or more required fields are empty. Click <strong>Edit</strong> on the case to fill them before printing.</span>
        </div>
      )}

      <div className="p-6 space-y-2">
        {items.map((item) => {
          const isConfirmed = !!checked[item.id];
          const isMissing = item.value === "Not filled in — click Edit";
          return (
            <button
              key={item.id}
              data-testid={`preprint-check-${item.id}`}
              onClick={() => !isMissing && toggle(item.id)}
              disabled={isMissing}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                isMissing
                  ? "bg-red-50 border-red-200 cursor-not-allowed opacity-80"
                  : isConfirmed
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-card border-border hover:bg-secondary/40 hover:border-primary/30 cursor-pointer"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isConfirmed
                  ? <CheckSquare2 className="w-5 h-5 text-emerald-600" />
                  : isMissing
                  ? <AlertTriangle className="w-5 h-5 text-red-400" />
                  : <Square className="w-5 h-5 text-muted-foreground/40" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-sm font-semibold ${
                    isMissing ? "text-red-700" : isConfirmed ? "text-emerald-800" : "text-foreground"
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-sm font-mono font-bold flex-shrink-0 max-w-[220px] truncate ${
                    isMissing ? "text-red-500 italic font-sans font-normal" : isConfirmed ? "text-emerald-700" : "text-foreground"
                  }`}>
                    {item.value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-left">{item.sourceLabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {allChecked && (
        <div className="mx-6 mb-6 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-medium">All critical fields confirmed. Your form is ready to print.</span>
        </div>
      )}
    </div>
  );
}
