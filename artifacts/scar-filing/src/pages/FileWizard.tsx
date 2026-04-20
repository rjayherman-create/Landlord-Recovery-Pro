import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateGrievance,
  useUpdateGrievance,
  useGetGrievance,
  useListComparables,
  getGetGrievanceQueryKey,
  getListComparablesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";

const NY_COUNTIES = [
  "Albany", "Allegany", "Bronx", "Broome", "Cattaraugus", "Cayuga",
  "Chautauqua", "Chemung", "Chenango", "Clinton", "Columbia", "Cortland",
  "Delaware", "Dutchess", "Erie", "Essex", "Franklin", "Fulton", "Genesee",
  "Greene", "Hamilton", "Herkimer", "Jefferson", "Kings", "Lewis", "Livingston",
  "Madison", "Monroe", "Montgomery", "Nassau", "New York", "Niagara", "Oneida",
  "Onondaga", "Ontario", "Orange", "Orleans", "Oswego", "Otsego", "Putnam",
  "Queens", "Rensselaer", "Richmond", "Rockland", "St. Lawrence", "Saratoga",
  "Schenectady", "Schoharie", "Schuyler", "Seneca", "Steuben", "Suffolk",
  "Sullivan", "Tioga", "Tompkins", "Ulster", "Warren", "Washington", "Wayne",
  "Westchester", "Wyoming", "Yates",
];

const BASIS_OPTIONS = [
  { value: "overvalued", label: "Overvalued — property assessed above market value" },
  { value: "unequal", label: "Unequal — assessed at higher ratio than comparable properties" },
  { value: "exempt", label: "Exempt — property should be fully or partially exempt" },
  { value: "unlawfully_assessed", label: "Unlawfully assessed — procedural or legal error" },
];

const STEPS = [
  { id: 1, label: "Check" },
  { id: 2, label: "Details" },
  { id: 3, label: "Review" },
  { id: 4, label: "Submit" },
];

type EligibilityAnswers = {
  wasDenied: boolean | null;
  isNY: boolean | null;
  withinDeadline: boolean | null;
  isResidential: boolean | null;
};

type FormData = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerMailingAddress: string;
  propertyAddress: string;
  county: string;
  municipality: string;
  parcelId: string;
  taxYear: number;
  currentAssessment: number;
  estimatedMarketValue: number;
  requestedAssessment: number;
  basisOfComplaint: string;
  notes: string;
};

const defaultForm: FormData = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerMailingAddress: "",
  propertyAddress: "",
  county: "",
  municipality: "",
  parcelId: "",
  taxYear: new Date().getFullYear(),
  currentAssessment: 0,
  estimatedMarketValue: 0,
  requestedAssessment: 0,
  basisOfComplaint: "",
  notes: "",
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              step.id === current
                ? "bg-primary text-primary-foreground"
                : step.id < current
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            {step.id < current ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <span className="w-4 h-4 flex items-center justify-center text-xs">{step.id}</span>
            )}
            {step.label}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-8 mx-1 transition-colors ${
                step.id < current ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function EligibilityQuestion({
  question,
  value,
  onChange,
}: {
  question: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="border border-border rounded-lg p-5">
      <p className="font-medium text-foreground mb-4">{question}</p>
      <div className="flex gap-3">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition-colors ${
            value === true
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-foreground hover:bg-secondary/50"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition-colors ${
            value === false
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "border-border text-foreground hover:bg-secondary/50"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function Step1Check({
  answers,
  setAnswers,
  onNext,
}: {
  answers: EligibilityAnswers;
  setAnswers: (a: EligibilityAnswers) => void;
  onNext: () => void;
}) {
  const allAnswered = Object.values(answers).every((v) => v !== null);
  const isEligible =
    answers.wasDenied === true &&
    answers.isNY === true &&
    answers.withinDeadline === true &&
    answers.isResidential === true;
  const hasDisqualifier = Object.values(answers).some((v) => v === false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Do you qualify to file?</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Answer four quick questions to check your eligibility.
      </p>

      <div className="space-y-4 mb-6">
        <EligibilityQuestion
          question="Was your property tax grievance denied by the Board of Assessment Review (BAR)?"
          value={answers.wasDenied}
          onChange={(v) => setAnswers({ ...answers, wasDenied: v })}
        />
        <EligibilityQuestion
          question="Is your property located in New York State?"
          value={answers.isNY}
          onChange={(v) => setAnswers({ ...answers, isNY: v })}
        />
        <EligibilityQuestion
          question="Are you within 30 days of the BAR's final determination?"
          value={answers.withinDeadline}
          onChange={(v) => setAnswers({ ...answers, withinDeadline: v })}
        />
        <EligibilityQuestion
          question="Is your property a 1-3 family residential property (primary residence)?"
          value={answers.isResidential}
          onChange={(v) => setAnswers({ ...answers, isResidential: v })}
        />
      </div>

      {allAnswered && hasDisqualifier && !isEligible && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 mb-6">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium mb-1">You may not be eligible for SCAR.</p>
            <p>
              SCAR is available only for NY residential properties within 30 days of a BAR denial. For commercial properties, Tax Certiorari may be an option. Consult an attorney for your situation.
            </p>
          </div>
        </div>
      )}

      {isEligible && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-medium">You appear to qualify for SCAR.</p>
            <p className="mt-0.5">Let's prepare your petition. It takes about 10 minutes.</p>
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!isEligible}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to Property Details
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-input rounded-md px-3 py-2 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

function Step2Details({
  form,
  setForm,
  onNext,
  onBack,
  saving,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const canProceed =
    form.ownerName &&
    form.propertyAddress &&
    form.county &&
    form.municipality &&
    form.currentAssessment > 0 &&
    form.estimatedMarketValue > 0 &&
    form.requestedAssessment > 0 &&
    form.basisOfComplaint;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Property & case details</h2>
      <p className="text-muted-foreground text-sm mb-6">
        This information will appear on your SCAR petition.
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Owner name" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Full legal name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="Email address">
            <input
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
            />
          </FieldRow>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Phone number">
            <input
              type="tel"
              className={inputClass}
              placeholder="(555) 555-5555"
              value={form.ownerPhone}
              onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="Mailing address">
            <input
              type="text"
              className={inputClass}
              placeholder="If different from property"
              value={form.ownerMailingAddress}
              onChange={(e) => setForm({ ...form, ownerMailingAddress: e.target.value })}
            />
          </FieldRow>
        </div>

        <FieldRow label="Property address" required>
          <input
            type="text"
            className={inputClass}
            placeholder="123 Main St, Springfield, NY 12345"
            value={form.propertyAddress}
            onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
          />
        </FieldRow>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="County" required>
            <select
              className={inputClass}
              value={form.county}
              onChange={(e) => setForm({ ...form, county: e.target.value })}
            >
              <option value="">Select county</option>
              {NY_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Municipality / Town" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Town of Springfield"
              value={form.municipality}
              onChange={(e) => setForm({ ...form, municipality: e.target.value })}
            />
          </FieldRow>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Parcel / Tax ID">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. 12-34-56-7.0"
              value={form.parcelId}
              onChange={(e) => setForm({ ...form, parcelId: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="Tax year" required>
            <input
              type="number"
              className={inputClass}
              value={form.taxYear}
              onChange={(e) => setForm({ ...form, taxYear: Number(e.target.value) })}
            />
          </FieldRow>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessment information</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="Current assessment ($)" required>
              <input
                type="number"
                className={inputClass}
                placeholder="0"
                value={form.currentAssessment || ""}
                onChange={(e) => setForm({ ...form, currentAssessment: Number(e.target.value) })}
              />
            </FieldRow>
            <FieldRow label="Est. market value ($)" required>
              <input
                type="number"
                className={inputClass}
                placeholder="0"
                value={form.estimatedMarketValue || ""}
                onChange={(e) => setForm({ ...form, estimatedMarketValue: Number(e.target.value) })}
              />
            </FieldRow>
            <FieldRow label="Requested assessment ($)" required>
              <input
                type="number"
                className={inputClass}
                placeholder="0"
                value={form.requestedAssessment || ""}
                onChange={(e) => setForm({ ...form, requestedAssessment: Number(e.target.value) })}
              />
            </FieldRow>
          </div>
          <p className="text-xs text-muted-foreground">
            The requested assessment is what you believe the fair assessed value should be, based on comparable sales.
          </p>
        </div>

        <FieldRow label="Basis of complaint" required>
          <select
            className={inputClass}
            value={form.basisOfComplaint}
            onChange={(e) => setForm({ ...form, basisOfComplaint: e.target.value })}
          >
            <option value="">Select basis</option>
            {BASIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Additional notes">
          <textarea
            className={`${inputClass} h-20 resize-none`}
            placeholder="Any additional details about the property condition, recent sale, or other factors..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </FieldRow>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed || saving}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save & Review
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function CaseStrength({ current, market, requested }: { current: number; market: number; requested: number }) {
  if (!current || !market) return null;
  const ratio = requested / market;
  let strength = "Weak";
  let color = "bg-red-400";
  let width = "20%";
  let description = "Your requested assessment is close to or above market value. Consider gathering stronger comparable sales.";

  if (ratio < 0.7) {
    strength = "Strong";
    color = "bg-green-500";
    width = "85%";
    description = "Your requested assessment is well below market value. You have a strong case if supported by comparable sales.";
  } else if (ratio < 0.85) {
    strength = "Moderate";
    color = "bg-amber-500";
    width = "55%";
    description = "Your case is reasonable. Supporting it with recent comparable sales will strengthen your position.";
  }

  return (
    <div className="bg-card border border-card-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Case strength</span>
        <span className="text-sm font-semibold text-foreground">{strength}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width }} />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function Step3Review({
  form,
  grievanceId,
  onNext,
  onBack,
}: {
  form: FormData;
  grievanceId: number | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const comparables = useListComparables(
    { grievanceId: grievanceId ?? 0 },
    { query: { enabled: !!grievanceId } }
  );

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Review your case</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Confirm your details and review what you'll present at the hearing.
      </p>

      <div className="space-y-5">
        {/* Property summary */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Property details</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="text-foreground font-medium">{form.ownerName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Property</dt>
              <dd className="text-foreground font-medium">{form.propertyAddress}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">County</dt>
              <dd className="text-foreground">{form.county}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Municipality</dt>
              <dd className="text-foreground">{form.municipality}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tax year</dt>
              <dd className="text-foreground">{form.taxYear}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Parcel ID</dt>
              <dd className="text-foreground">{form.parcelId || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Assessment summary */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Assessment comparison</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Current assessment</div>
              <div className="text-lg font-semibold text-foreground">${form.currentAssessment.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Est. market value</div>
              <div className="text-lg font-semibold text-foreground">${form.estimatedMarketValue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Requested assessment</div>
              <div className="text-lg font-semibold text-primary">${form.requestedAssessment.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <CaseStrength
          current={form.currentAssessment}
          market={form.estimatedMarketValue}
          requested={form.requestedAssessment}
        />

        {/* Comparables */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Comparable sales</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Comparable sales are the strongest evidence at your hearing. Bring 3-5 similar homes that sold for less than your assessment implies.
          </p>
          {comparables.data && comparables.data.length > 0 ? (
            <ul className="space-y-2">
              {comparables.data.map((c) => (
                <li key={c.id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                  <span className="text-foreground truncate">{c.address}</span>
                  <span className="text-muted-foreground shrink-0 ml-4">${c.salePrice.toLocaleString()} · {c.saleDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-4">
              No comparables saved yet. You can bring your own research to the hearing — look up recent sales on Zillow, Realtor.com, or your county's property search.
              {grievanceId && (
                <a
                  href={`${baseUrl}/api/auto-comparables?grievanceId=${grievanceId}`}
                  className="block mt-2 text-primary hover:underline inline-flex items-center gap-1"
                >
                  Find comparables automatically
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Basis */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Basis of complaint</h3>
          <p className="text-sm text-foreground">
            {BASIS_OPTIONS.find((o) => o.value === form.basisOfComplaint)?.label ?? form.basisOfComplaint}
          </p>
          {form.notes && (
            <p className="text-sm text-muted-foreground mt-2">{form.notes}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          Looks good — continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function Step4Submit({ form, grievanceId }: { form: FormData; grievanceId: number | null }) {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Your petition is ready</h2>
        <p className="text-muted-foreground text-sm">
          Download your documents and bring them to the small claims court in your county.
        </p>
      </div>

      <div className="space-y-4">
        {/* Download */}
        {grievanceId && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h3 className="font-semibold text-foreground mb-1">Download your petition</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your completed petition document is ready to download. Print it out and bring it to the court along with your supporting evidence.
            </p>
            <a
              href={`${baseUrl}/api/download/${grievanceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Download Petition PDF
            </a>
          </div>
        )}

        {/* What to do next */}
        <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Next steps</h3>
          <ol className="space-y-3">
            {[
              {
                title: "File at your local small claims court",
                detail: `Bring your petition to the small claims court in ${form.county} County. The filing fee is $30, payable at the clerk's office.`,
              },
              {
                title: "Submit within 30 days of your BAR denial",
                detail: "The deadline is strict. File as soon as possible to ensure you don't miss the window.",
              },
              {
                title: "Gather your comparable sales",
                detail: "Bring 3-5 recent sales of similar homes that sold for less than your current assessment implies. The court clerk can tell you when your hearing will be.",
              },
              {
                title: "Attend your hearing",
                detail: "The hearing is informal. Present your comparables, explain your basis, and the hearing officer will make a decision — usually within a few weeks.",
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium text-foreground">{step.title}</div>
                  <div className="text-muted-foreground mt-0.5">{step.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700">
              <strong>$30 filing fee</strong> — paid at the court clerk's office
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700">
              <strong>30-day deadline</strong> — from the date of your BAR determination
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FileWizard() {
  const [step, setStep] = useState(1);
  const [eligibility, setEligibility] = useState<EligibilityAnswers>({
    wasDenied: null,
    isNY: null,
    withinDeadline: null,
    isResidential: null,
  });
  const [form, setForm] = useState<FormData>(defaultForm);
  const [grievanceId, setGrievanceId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const createGrievance = useCreateGrievance();
  const updateGrievance = useUpdateGrievance();
  const queryClient = useQueryClient();

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const payload = {
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail || null,
        ownerPhone: form.ownerPhone || null,
        ownerMailingAddress: form.ownerMailingAddress || null,
        propertyAddress: form.propertyAddress,
        county: form.county,
        municipality: form.municipality,
        state: "NY",
        parcelId: form.parcelId || null,
        taxYear: form.taxYear,
        currentAssessment: form.currentAssessment,
        estimatedMarketValue: form.estimatedMarketValue,
        requestedAssessment: form.requestedAssessment,
        basisOfComplaint: form.basisOfComplaint || null,
        notes: form.notes || null,
        status: "draft" as const,
      };

      if (grievanceId) {
        await updateGrievance.mutateAsync({ id: grievanceId, data: payload });
        queryClient.invalidateQueries({ queryKey: getGetGrievanceQueryKey(grievanceId) });
      } else {
        const result = await createGrievance.mutateAsync({ data: payload });
        setGrievanceId(result.id);
      }
      setStep(3);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <StepIndicator current={step} total={4} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step1Check
            key="step1"
            answers={eligibility}
            setAnswers={setEligibility}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Details
            key="step2"
            form={form}
            setForm={setForm}
            onNext={handleSaveDetails}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
        {step === 3 && (
          <Step3Review
            key="step3"
            form={form}
            grievanceId={grievanceId}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Submit
            key="step4"
            form={form}
            grievanceId={grievanceId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
