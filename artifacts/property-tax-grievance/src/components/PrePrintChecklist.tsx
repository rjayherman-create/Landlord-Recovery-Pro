import { useState } from "react";
import { CheckSquare2, Square, AlertTriangle, ShieldCheck, FileSearch, KeyRound, XCircle, Check, Pencil } from "lucide-react";
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

function assessmentMatches(formValue: number, input: string): boolean {
  const norm = normalizeAssessment(input);
  if (!norm) return false;
  const num = parseFloat(norm);
  if (isNaN(num)) return false;
  return Math.abs(num - formValue) < 1;
}

function parcelMatches(formValue: string, input: string): boolean {
  if (!input.trim()) return false;
  return normalizeParcel(formValue) === normalizeParcel(input);
}

export function PrePrintChecklist({ grievance, onAllConfirmed }: PrePrintChecklistProps) {
  const parcelFormValue = grievance.parcelId ?? "";
  const assessmentFormRaw = grievance.currentAssessment;
  const assessmentFormDisplay = isMissingValue(assessmentFormRaw)
    ? ""
    : `$${Number(assessmentFormRaw).toLocaleString()}`;

  const parcelMissing = isMissingValue(grievance.parcelId);
  const assessmentMissing = isMissingValue(assessmentFormRaw);

  // Each typed field has: input value, confirmed flag, editing flag
  const [parcelInput, setParcelInput] = useState(parcelFormValue);
  const [parcelConfirmed, setParcelConfirmed] = useState(false);

  const [assessmentInput, setAssessmentInput] = useState(assessmentFormDisplay);
  const [assessmentConfirmed, setAssessmentConfirmed] = useState(false);

  const [clicked, setClicked] = useState<Record<string, boolean>>({});

  const parcelMismatch = !parcelMissing && !parcelConfirmed && !!parcelInput.trim() && !parcelMatches(parcelFormValue, parcelInput);
  const assessmentMismatch = !assessmentMissing && !assessmentConfirmed && !!assessmentInput.trim() && !assessmentMatches(assessmentFormRaw, assessmentInput);

  const hasMismatch = parcelMismatch || assessmentMismatch;

  const clickItems = [
    {
      id: "owner",
      label: "Owner / complainant name",
      value: displayValue(grievance.ownerName),
      missing: isMissingValue(grievance.ownerName),
      hint: "Must match the name on your deed and tax bill exactly",
    },
    {
      id: "address",
      label: "Property address",
      value: displayValue(grievance.propertyAddress),
      missing: isMissingValue(grievance.propertyAddress),
      hint: "Must match your tax bill exactly — including unit numbers",
    },
    {
      id: "taxyear",
      label: "Tax year being grieved",
      value: displayValue(grievance.taxYear),
      missing: isMissingValue(grievance.taxYear),
      hint: "Confirm this is the tax year on your bill",
    },
  ];

  function computeAllConfirmed(
    cl: Record<string, boolean>,
    pc: boolean,
    ac: boolean
  ): boolean {
    const clicksDone = clickItems.every((i) => i.missing || cl[i.id]);
    const parcelDone = parcelMissing || pc;
    const assessmentDone = assessmentMissing || ac;
    return clicksDone && parcelDone && assessmentDone;
  }

  const toggleClick = (id: string) => {
    const next = { ...clicked, [id]: !clicked[id] };
    setClicked(next);
    onAllConfirmed?.(computeAllConfirmed(next, parcelConfirmed, assessmentConfirmed));
  };

  const confirmParcel = () => {
    if (parcelMatches(parcelFormValue, parcelInput)) {
      setParcelConfirmed(true);
      onAllConfirmed?.(computeAllConfirmed(clicked, true, assessmentConfirmed));
    }
  };

  const confirmAssessment = () => {
    if (assessmentMatches(assessmentFormRaw, assessmentInput)) {
      setAssessmentConfirmed(true);
      onAllConfirmed?.(computeAllConfirmed(clicked, parcelConfirmed, true));
    }
  };

  const confirmedCount = (() => {
    let n = clickItems.filter((i) => !i.missing && clicked[i.id]).length;
    if (!parcelMissing && parcelConfirmed) n++;
    if (!assessmentMissing && assessmentConfirmed) n++;
    return n;
  })();

  const totalCount = (() => {
    let n = clickItems.filter((i) => !i.missing).length;
    if (!parcelMissing) n++;
    if (!assessmentMissing) n++;
    return n;
  })();

  const allConfirmed = confirmedCount === totalCount && totalCount > 0;
  const anyMissing = clickItems.some((i) => i.missing) || parcelMissing || assessmentMissing;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-start gap-3">
          <FileSearch className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif font-bold text-base">Before you print — verify against your tax bill</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Critical fields are pre-filled from your case. Compare each one against your actual tax bill and confirm before printing.
              Mismatches are a leading cause of grievance rejection at intake.
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
            <strong>Mismatch detected.</strong> The value in the field below doesn't match your form.
            If your tax bill shows a different number, click <strong>Edit</strong> on this case to correct the form before printing.
          </span>
        </div>
      )}

      {anyMissing && !hasMismatch && (
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
          <span>One or more fields are empty. Click <strong>Edit</strong> on this case to fill them in before printing.</span>
        </div>
      )}

      <div className="p-6 space-y-3">

        {/* ── Double-check: Parcel ID ── */}
        <DoubleCheckField
          id="parcel"
          label="Parcel ID / Tax Map Number (SBL)"
          formDisplayValue={parcelMissing ? null : parcelFormValue}
          inputValue={parcelInput}
          confirmed={parcelConfirmed}
          missing={parcelMissing}
          mismatch={parcelMismatch}
          matchesForm={!parcelMissing && parcelMatches(parcelFormValue, parcelInput)}
          hint="Find the Parcel ID (also called SBL or Tax Map Number) on your tax bill. It should match the value shown. If it does, click Confirm."
          placeholder={parcelFormValue || "e.g. 2089-123-456-789"}
          onInput={(val) => { setParcelInput(val); setParcelConfirmed(false); }}
          onConfirm={confirmParcel}
          onEdit={() => setParcelConfirmed(false)}
        />

        {/* ── Double-check: Assessed Value ── */}
        <DoubleCheckField
          id="assessment"
          label="Current assessed value"
          formDisplayValue={assessmentMissing ? null : assessmentFormDisplay}
          inputValue={assessmentInput}
          confirmed={assessmentConfirmed}
          missing={assessmentMissing}
          mismatch={assessmentMismatch}
          matchesForm={!assessmentMissing && assessmentMatches(assessmentFormRaw, assessmentInput)}
          hint="Find 'Total Assessed Value' on your tax bill — not the market value, not the land-only value. Compare it to the value shown, then click Confirm."
          placeholder={assessmentFormDisplay || "e.g. $450,000"}
          onInput={(val) => { setAssessmentInput(val); setAssessmentConfirmed(false); }}
          onConfirm={confirmAssessment}
          onEdit={() => setAssessmentConfirmed(false)}
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
          <span className="font-medium">All critical fields verified against your tax bill. Your form is ready to print.</span>
        </div>
      )}
    </div>
  );
}

/* ── Sub-component: double-check field with pre-fill + confirm button ── */

interface DoubleCheckFieldProps {
  id: string;
  label: string;
  formDisplayValue: string | null;
  inputValue: string;
  confirmed: boolean;
  missing: boolean;
  mismatch: boolean;
  matchesForm: boolean;
  hint: string;
  placeholder: string;
  onInput: (val: string) => void;
  onConfirm: () => void;
  onEdit: () => void;
}

function DoubleCheckField({
  id, label, formDisplayValue, inputValue, confirmed, missing, mismatch, matchesForm, hint, placeholder, onInput, onConfirm, onEdit,
}: DoubleCheckFieldProps) {
  const borderColor = missing
    ? "border-red-200"
    : confirmed
    ? "border-emerald-300"
    : mismatch
    ? "border-red-300"
    : "border-primary/30";

  const bgColor = missing
    ? "bg-red-50"
    : confirmed
    ? "bg-emerald-50"
    : mismatch
    ? "bg-red-50/50"
    : "bg-primary/[0.02]";

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${bgColor} ${borderColor}`} data-testid={`preprint-typed-${id}`}>

      {/* Label row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <KeyRound className={`w-4 h-4 flex-shrink-0 ${confirmed ? "text-emerald-600" : mismatch ? "text-red-500" : "text-primary"}`} />
          <span className={`text-sm font-bold ${confirmed ? "text-emerald-800" : mismatch ? "text-red-700" : "text-foreground"}`}>
            {label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            Double-check
          </span>
        </div>
        <div className="flex-shrink-0">
          {confirmed && <CheckSquare2 className="w-5 h-5 text-emerald-600" />}
          {mismatch && <XCircle className="w-5 h-5 text-red-500" />}
          {!confirmed && !mismatch && missing && <AlertTriangle className="w-5 h-5 text-red-400" />}
        </div>
      </div>

      {missing ? (
        <p className="text-xs text-red-700 font-medium">Not filled in — click Edit on this case to add it before printing.</p>
      ) : confirmed ? (
        /* ── Confirmed state ── */
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Confirmed by you — matches your tax bill.
            </p>
            <p className="text-xs text-emerald-600 font-mono mt-0.5">{inputValue}</p>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
      ) : (
        /* ── Verification state ── */
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>

          <div className="flex gap-2">
            <input
              id={`typed-${id}`}
              data-testid={`preprint-input-${id}`}
              type="text"
              value={inputValue}
              onChange={(e) => onInput(e.target.value)}
              placeholder={placeholder}
              className={`flex-1 text-sm font-mono px-3 py-2 rounded-lg border bg-white transition-all outline-none focus:ring-2 ${
                mismatch
                  ? "border-red-300 focus:ring-red-200 text-red-800"
                  : matchesForm
                  ? "border-emerald-300 focus:ring-emerald-200 text-emerald-800"
                  : "border-border focus:ring-primary/20 text-foreground"
              }`}
            />
            <button
              data-testid={`preprint-confirm-${id}`}
              onClick={onConfirm}
              disabled={!matchesForm}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                matchesForm
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  : "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
              }`}
            >
              <Check className="w-4 h-4" /> Confirm
            </button>
          </div>

          {mismatch && (
            <p className="text-xs text-red-700 font-medium flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Doesn't match your form ({formDisplayValue}). If your tax bill shows a different value, click <strong>Edit</strong> to correct the form.
            </p>
          )}
          {matchesForm && !mismatch && (
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Matches your form — click <strong>Confirm</strong> to verify.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
