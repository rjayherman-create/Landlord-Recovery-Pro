import { useState } from "react";
import { CheckSquare2, Square, AlertTriangle, ShieldCheck, FileSearch, KeyRound, XCircle } from "lucide-react";
import type { Grievance } from "@workspace/api-client-react";

interface PrePrintChecklistProps {
  grievance: Grievance;
  onAllConfirmed?: (confirmed: boolean) => void;
}

function isMissingValue(v: string | number | null | undefined): boolean {
  return v == null || String(v).trim() === "";
}

function displayValue(v: string | number | null | undefined, prefix = ""): string {
  if (isMissingValue(v)) return "";
  return prefix + String(v);
}

function normalizeParcel(s: string): string {
  return s.replace(/[\s\-\.\/]/g, "").toLowerCase();
}

function normalizeAssessment(s: string): string {
  return s.replace(/[\$,\s]/g, "").trim();
}

function assessmentMatches(formValue: number, typed: string): boolean {
  const norm = normalizeAssessment(typed);
  if (!norm) return false;
  const num = parseFloat(norm);
  if (isNaN(num)) return false;
  return Math.abs(num - formValue) < 1;
}

function parcelMatches(formValue: string, typed: string): boolean {
  if (!typed.trim()) return false;
  return normalizeParcel(formValue) === normalizeParcel(typed);
}

type TypedState = "empty" | "match" | "mismatch";

export function PrePrintChecklist({ grievance, onAllConfirmed }: PrePrintChecklistProps) {
  const [clicked, setClicked] = useState<Record<string, boolean>>({});
  const [parcelInput, setParcelInput] = useState("");
  const [assessmentInput, setAssessmentInput] = useState("");

  const parcelFormValue = grievance.parcelId ?? "";
  const assessmentFormValue = grievance.currentAssessment;

  const parcelMissing = isMissingValue(grievance.parcelId);
  const assessmentMissing = isMissingValue(grievance.currentAssessment);

  const parcelState: TypedState = parcelMissing
    ? "empty"
    : !parcelInput.trim()
    ? "empty"
    : parcelMatches(parcelFormValue, parcelInput)
    ? "match"
    : "mismatch";

  const assessmentState: TypedState = assessmentMissing
    ? "empty"
    : !assessmentInput.trim()
    ? "empty"
    : assessmentMatches(assessmentFormValue, assessmentInput)
    ? "match"
    : "mismatch";

  const clickItems = [
    {
      id: "owner",
      label: "Owner / complainant name",
      value: displayValue(grievance.ownerName),
      missing: isMissingValue(grievance.ownerName),
      hint: "Must match the name on your deed and property tax bill exactly",
    },
    {
      id: "address",
      label: "Property address",
      value: displayValue(grievance.propertyAddress),
      missing: isMissingValue(grievance.propertyAddress),
      hint: "Must match your tax bill exactly — including any unit numbers",
    },
    {
      id: "taxyear",
      label: "Tax year being grieved",
      value: displayValue(grievance.taxYear),
      missing: isMissingValue(grievance.taxYear),
      hint: "Confirm this is the tax year shown on your bill",
    },
  ];

  const toggleClick = (id: string) => {
    const next = { ...clicked, [id]: !clicked[id] };
    setClicked(next);
    const allDone = isAllConfirmed(next, parcelState, assessmentState);
    onAllConfirmed?.(allDone);
  };

  function isAllConfirmed(
    cl: Record<string, boolean>,
    ps: TypedState,
    as: TypedState
  ): boolean {
    const clicksDone = clickItems.every((item) => item.missing || cl[item.id]);
    const parcelDone = parcelMissing || ps === "match";
    const assessmentDone = assessmentMissing || as === "match";
    return clicksDone && parcelDone && assessmentDone;
  }

  const confirmedCount = (() => {
    let n = 0;
    clickItems.forEach((item) => { if (!item.missing && clicked[item.id]) n++; });
    if (!parcelMissing && parcelState === "match") n++;
    if (!assessmentMissing && assessmentState === "match") n++;
    return n;
  })();

  const totalCount = (() => {
    let n = 0;
    clickItems.forEach((item) => { if (!item.missing) n++; });
    if (!parcelMissing) n++;
    if (!assessmentMissing) n++;
    return n;
  })();

  const allConfirmed = confirmedCount === totalCount && totalCount > 0;
  const anyMissing = clickItems.some((i) => i.missing) || parcelMissing || assessmentMissing;
  const hasMismatch = parcelState === "mismatch" || assessmentState === "mismatch";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-start gap-3">
          <FileSearch className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif font-bold text-base">Before you print — verify against your tax bill</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              A mismatch with your tax bill is the most common reason a grievance is rejected before it reaches a reviewer.
              The two most important fields require you to type in the value from your bill as a double-check.
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
            allConfirmed
              ? "bg-emerald-100 text-emerald-700"
              : confirmedCount > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-secondary text-muted-foreground"
          }`}>
            {confirmedCount}/{totalCount} confirmed
          </span>
        </div>
      </div>

      {/* Mismatch alert */}
      {hasMismatch && (
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
          <span>
            <strong>Mismatch detected.</strong> The value you typed from your tax bill doesn't match what's on your form.
            Click <strong>Edit</strong> on this case to correct the form value before printing.
          </span>
        </div>
      )}

      {anyMissing && !hasMismatch && (
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
          <span>One or more fields are empty. Click <strong>Edit</strong> to fill them in before printing.</span>
        </div>
      )}

      <div className="p-6 space-y-3">

        {/* ── Typed double-check: Parcel ID ── */}
        <DoubleCheckField
          id="parcel"
          label="Parcel ID / Tax Map Number (SBL)"
          formValue={parcelMissing ? null : parcelFormValue}
          inputValue={parcelInput}
          state={parcelState}
          missing={parcelMissing}
          hint="Find the Parcel ID (also called SBL or Tax Map Number) on your tax bill. Type it here exactly as it appears."
          placeholder="e.g. 2089-123-456-789 or 09-A-0012"
          onInput={setParcelInput}
        />

        {/* ── Typed double-check: Assessed Value ── */}
        <DoubleCheckField
          id="assessment"
          label="Current assessed value"
          formValue={assessmentMissing ? null : `$${Number(assessmentFormValue).toLocaleString()}`}
          inputValue={assessmentInput}
          state={assessmentState}
          missing={assessmentMissing}
          hint="Find the 'Total Assessed Value' on your tax bill — not the market value, not the land value alone. Type it here."
          placeholder="e.g. 450000 or $450,000"
          onInput={setAssessmentInput}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Also confirm</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Click-to-confirm fields ── */}
        {clickItems.map((item) => {
          const isConfirmed = !!clicked[item.id];
          return (
            <button
              key={item.id}
              data-testid={`preprint-check-${item.id}`}
              onClick={() => !item.missing && toggleClick(item.id)}
              disabled={item.missing}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                item.missing
                  ? "bg-red-50 border-red-200 cursor-not-allowed opacity-70"
                  : isConfirmed
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-card border-border hover:bg-secondary/40 hover:border-primary/30 cursor-pointer"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.missing
                  ? <AlertTriangle className="w-5 h-5 text-red-400" />
                  : isConfirmed
                  ? <CheckSquare2 className="w-5 h-5 text-emerald-600" />
                  : <Square className="w-5 h-5 text-muted-foreground/40" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-sm font-semibold ${
                    item.missing ? "text-red-700" : isConfirmed ? "text-emerald-800" : "text-foreground"
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-sm font-mono font-bold flex-shrink-0 max-w-[220px] truncate ${
                    item.missing ? "text-red-400 italic font-sans font-normal" : isConfirmed ? "text-emerald-700" : "text-foreground"
                  }`}>
                    {item.missing ? "Not filled in — click Edit" : item.value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-left">{item.hint}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* All confirmed banner */}
      {allConfirmed && (
        <div className="mx-6 mb-6 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-medium">All critical fields verified. Your form matches your tax bill — ready to print.</span>
        </div>
      )}
    </div>
  );
}

/* ── Sub-component: typed double-check field ── */

interface DoubleCheckFieldProps {
  id: string;
  label: string;
  formValue: string | null;
  inputValue: string;
  state: TypedState;
  missing: boolean;
  hint: string;
  placeholder: string;
  onInput: (val: string) => void;
}

function DoubleCheckField({ id, label, formValue, inputValue, state, missing, hint, placeholder, onInput }: DoubleCheckFieldProps) {
  const borderColor =
    missing || state === "empty"
      ? "border-border"
      : state === "match"
      ? "border-emerald-300"
      : "border-red-300";

  const bgColor =
    missing
      ? "bg-red-50"
      : state === "match"
      ? "bg-emerald-50"
      : state === "mismatch"
      ? "bg-red-50"
      : "bg-card";

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${bgColor} ${borderColor}`} data-testid={`preprint-typed-${id}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <KeyRound className={`w-4 h-4 flex-shrink-0 ${
            state === "match" ? "text-emerald-600" : state === "mismatch" ? "text-red-500" : "text-primary"
          }`} />
          <span className={`text-sm font-bold ${
            state === "match" ? "text-emerald-800" : state === "mismatch" ? "text-red-700" : "text-foreground"
          }`}>
            {label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            Double-check
          </span>
        </div>
        <div className="flex-shrink-0">
          {state === "match" && <CheckSquare2 className="w-5 h-5 text-emerald-600" />}
          {state === "mismatch" && <XCircle className="w-5 h-5 text-red-500" />}
          {state === "empty" && !missing && <Square className="w-5 h-5 text-muted-foreground/30" />}
          {missing && <AlertTriangle className="w-5 h-5 text-red-400" />}
        </div>
      </div>

      {/* On-form value */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">On your form:</span>
        <span className={`text-sm font-mono font-bold ${missing ? "text-red-500 italic font-sans font-normal" : "text-foreground"}`}>
          {missing ? "Not filled in — click Edit" : formValue}
        </span>
      </div>

      {/* Input */}
      {!missing && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor={`typed-${id}`}>
            Type the value from your tax bill:
          </label>
          <input
            id={`typed-${id}`}
            data-testid={`preprint-input-${id}`}
            type="text"
            value={inputValue}
            onChange={(e) => onInput(e.target.value)}
            placeholder={placeholder}
            className={`w-full text-sm font-mono px-3 py-2 rounded-lg border bg-white transition-all outline-none focus:ring-2 ${
              state === "match"
                ? "border-emerald-300 focus:ring-emerald-200 text-emerald-800"
                : state === "mismatch"
                ? "border-red-300 focus:ring-red-200 text-red-800"
                : "border-border focus:ring-primary/20 text-foreground"
            }`}
          />
          {state === "match" && (
            <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
              <CheckSquare2 className="w-3 h-3" /> Confirmed — matches your form.
            </p>
          )}
          {state === "mismatch" && (
            <p className="text-xs font-medium text-red-700 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Doesn't match. Your form shows <span className="font-mono font-bold">{formValue}</span>. Click Edit to correct it.
            </p>
          )}
          {state === "empty" && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
}
