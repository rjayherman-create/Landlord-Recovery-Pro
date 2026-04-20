import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateCase,
  useUpdateCase,
  useCreateOpenaiConversation,
  generateCaseStatement,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  Lock,
  Scale,
  MessageSquare,
  FileText,
  Send,
  Sparkles,
  User,
  Bot,
  ChevronRight,
  Wand2,
  Paperclip,
  Trash2,
  Upload,
  X,
  FileImage,
} from "lucide-react";

const CLAIM_TYPES = [
  { value: "breach_of_contract", label: "Breach of Contract", description: "Someone didn't fulfill their end of an agreement", icon: "📄" },
  { value: "security_deposit", label: "Security Deposit", description: "Landlord withheld your security deposit", icon: "🏠" },
  { value: "property_damage", label: "Property Damage", description: "Your property was damaged by another party", icon: "🔨" },
  { value: "unpaid_wages", label: "Unpaid Wages", description: "Your employer didn't pay wages owed", icon: "💼" },
  { value: "consumer_dispute", label: "Consumer Dispute", description: "Defective product or service not rendered", icon: "🛒" },
  { value: "landlord_tenant", label: "Landlord / Tenant", description: "Disputes over rent, repairs, or lease terms", icon: "🔑" },
  { value: "negligence", label: "Negligence", description: "Someone's carelessness caused you harm or loss", icon: "⚖️" },
  { value: "personal_property", label: "Personal Property", description: "Lost or stolen personal belongings", icon: "📦" },
];

const STATES = [
  { value: "NY", label: "New York" },
  { value: "NJ", label: "New Jersey" },
  { value: "FL", label: "Florida" },
  { value: "TX", label: "Texas" },
  { value: "CA", label: "California" },
  { value: "PA", label: "Pennsylvania" },
  { value: "IL", label: "Illinois" },
  { value: "OH", label: "Ohio" },
  { value: "GA", label: "Georgia" },
  { value: "NC", label: "North Carolina" },
];

const STATE_LIMITS: Record<string, number> = {
  NY: 10000, NJ: 3000, FL: 8000, TX: 20000, CA: 12500, PA: 12000, IL: 10000, OH: 6000, GA: 15000, NC: 10000,
};

type CourtEntry = {
  filingFee: string;
  serviceFee: string;
  methods: ("online" | "in_person" | "mail")[];
  courtName: string;
  filingNote: string;
};

const COURT_DATA: Record<string, CourtEntry> = {
  NY: {
    filingFee: "$15–$20",
    serviceFee: "$10–$50",
    methods: ["in_person", "mail"],
    courtName: "Small Claims Part, Civil Court",
    filingNote: "File at your county's Civil Court clerk. NYC residents can file at the nearest borough courthouse.",
  },
  NJ: {
    filingFee: "$35–$75",
    serviceFee: "$30–$50",
    methods: ["in_person"],
    courtName: "Special Civil Part, Superior Court",
    filingNote: "File at the Special Civil Part clerk in the county where the defendant lives or does business.",
  },
  FL: {
    filingFee: "$55–$100",
    serviceFee: "$40–$60",
    methods: ["in_person", "mail"],
    courtName: "Small Claims Court, County Court",
    filingNote: "File at the County Court clerk. Some counties accept online filing — check your county clerk's website.",
  },
  TX: {
    filingFee: "$46–$100",
    serviceFee: "$75–$100",
    methods: ["in_person"],
    courtName: "Justice of the Peace Court",
    filingNote: "File at your local Justice of the Peace (JP) court in the precinct where the defendant lives or where the dispute occurred.",
  },
  CA: {
    filingFee: "$30–$75",
    serviceFee: "$40–$75",
    methods: ["in_person", "online"],
    courtName: "Small Claims Court, Superior Court",
    filingNote: "Many California courts offer online filing at www.courts.ca.gov. Otherwise file at the courthouse in the county where the defendant is located.",
  },
  PA: {
    filingFee: "$35–$75",
    serviceFee: "$25–$60",
    methods: ["in_person", "mail"],
    courtName: "Magisterial District Court",
    filingNote: "File at your local Magisterial District Court. Find your district at the Pennsylvania Courts website.",
  },
  IL: {
    filingFee: "$50–$100",
    serviceFee: "$30–$55",
    methods: ["in_person"],
    courtName: "Small Claims Division, Circuit Court",
    filingNote: "File at the Circuit Court clerk's office in the county where the defendant lives or the dispute occurred.",
  },
  OH: {
    filingFee: "$35–$65",
    serviceFee: "$25–$50",
    methods: ["in_person", "mail"],
    courtName: "Small Claims Division, Municipal Court",
    filingNote: "File at your local Municipal or County Court's small claims division.",
  },
  GA: {
    filingFee: "$45–$75",
    serviceFee: "$25–$50",
    methods: ["in_person"],
    courtName: "Magistrate Court",
    filingNote: "File at the Magistrate Court in the county where the defendant lives or the business is located.",
  },
  NC: {
    filingFee: "$36–$50",
    serviceFee: "$30–$50",
    methods: ["in_person"],
    courtName: "Small Claims Court, Magistrate Court",
    filingNote: "File at the magistrate's office in the county where the defendant lives. A magistrate will hear your case, usually within 30 days.",
  },
};

const STEPS = [
  { id: 1, label: "Claim Type", icon: Scale },
  { id: 2, label: "Details", icon: FileText },
  { id: 3, label: "AI Assistant", icon: MessageSquare },
  { id: 4, label: "Statement", icon: Sparkles },
];

type FormData = {
  claimType: string;
  state: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantAddress: string;
  zip: string;
  defendantName: string;
  defendantAddress: string;
  defendantEmail: string;
  defendantPhone: string;
  claimAmount: number;
  claimDescription: string;
  claimBasis: string;
  incidentDate: string;
  desiredOutcome: string;
  supportingFacts: string;
  agreement: string;
  problem: string;
  emailReminders: boolean;
  smsReminders: boolean;
};

const defaultForm: FormData = {
  claimType: "",
  state: "NY",
  claimantName: "",
  claimantEmail: "",
  claimantPhone: "",
  claimantAddress: "",
  zip: "",
  defendantName: "",
  defendantAddress: "",
  defendantEmail: "",
  defendantPhone: "",
  claimAmount: 0,
  claimDescription: "",
  claimBasis: "",
  incidentDate: "",
  desiredOutcome: "",
  supportingFacts: "",
  agreement: "",
  problem: "",
  emailReminders: true,
  smsReminders: false,
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const inputClass =
  "w-full border border-input rounded-md px-3 py-2 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

function FieldRow({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step.id === current
                  ? "bg-primary text-primary-foreground"
                  : step.id < current
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {step.id < current ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`w-4 h-4 mx-0.5 shrink-0 ${step.id < current ? "text-primary" : "text-muted-foreground/40"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1ClaimType({ form, setForm, onNext }: { form: FormData; setForm: (f: FormData) => void; onNext: () => void }) {
  const selectedState = STATES.find((s) => s.value === form.state);
  const limit = STATE_LIMITS[form.state] ?? 10000;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">What type of claim do you have?</h2>
      <p className="text-muted-foreground text-sm mb-6">Select your claim type and state to get started.</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">State *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {STATES.map((s) => (
            <button
              key={s.value}
              onClick={() => setForm({ ...form, state: s.value })}
              className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                form.state === s.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-foreground hover:bg-secondary/50"
              }`}
            >
              {s.value}
            </button>
          ))}
        </div>
        {selectedState && (
          <p className="text-xs text-muted-foreground mt-2">
            Small claims limit in {selectedState.label}: <span className="font-semibold text-foreground">${limit.toLocaleString()}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {CLAIM_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setForm({ ...form, claimType: ct.value })}
            className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
              form.claimType === ct.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/40 hover:bg-secondary/30"
            }`}
          >
            <span className="text-2xl shrink-0">{ct.icon}</span>
            <div>
              <div className="font-medium text-sm text-foreground">{ct.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{ct.description}</div>
            </div>
            {form.claimType === ct.value && <CheckCircle className="w-4 h-4 text-primary shrink-0 ml-auto mt-0.5" />}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!form.claimType || !form.state}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to Details
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

type EvidenceFile = { id: number; fileName: string; fileUrl: string; mimeType: string | null; fileSize: number | null };

function EvidenceUpload({
  caseId,
  onTextExtracted,
}: {
  caseId: number | null;
  onTextExtracted?: (text: string, fileName: string) => void;
}) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const loadFiles = async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`${baseUrl}/api/cases/${caseId}/evidence`);
      if (res.ok) setFiles(await res.json());
    } catch {}
  };

  useEffect(() => { loadFiles(); }, [caseId]);

  const uploadFile = async (file: File) => {
    if (!caseId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${baseUrl}/api/cases/${caseId}/evidence`, { method: "POST", body: fd });
      if (res.ok) {
        await loadFiles();
        if (onTextExtracted && (file.type.startsWith("image/") || file.type === "application/pdf" || file.type.startsWith("text/"))) {
          setParsing(file.name);
          try {
            const parseFormData = new FormData();
            parseFormData.append("file", file);
            const parseRes = await fetch(`${baseUrl}/api/parse`, { method: "POST", body: parseFormData });
            if (parseRes.ok) {
              const { text } = await parseRes.json();
              if (text) onTextExtracted(text, file.name);
            }
          } catch {} finally {
            setParsing(null);
          }
        }
      }
    } catch {} finally {
      setUploading(false);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  };

  const deleteFile = async (id: number) => {
    try {
      await fetch(`${baseUrl}/api/evidence/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch {}
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const iconForType = (mime: string | null) => {
    if (!mime) return <FileImage className="w-4 h-4" />;
    if (mime.startsWith("image/")) return <span className="text-sm">🖼</span>;
    if (mime === "application/pdf") return <span className="text-sm">📄</span>;
    return <span className="text-sm">📎</span>;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supporting Evidence</p>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {!caseId ? (
        <div className="border border-dashed border-border rounded-md p-4 text-center">
          <Paperclip className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-sm text-muted-foreground">Save this step first to upload evidence</p>
          <p className="text-xs text-muted-foreground mt-0.5">Contracts, receipts, photos, messages, etc.</p>
        </div>
      ) : (
        <>
          <div
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading || parsing ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {parsing ? `Reading "${parsing}"…` : "Uploading…"}
              </div>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Images, PDFs, documents — up to 20 MB each</p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2">
                  {iconForType(f.mimeType)}
                  <a
                    href={`${baseUrl}${f.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-foreground hover:text-primary hover:underline truncate"
                    title={f.fileName}
                  >
                    {f.fileName}
                  </a>
                  {f.fileSize && (
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.fileSize)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteFile(f.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Upload contracts, receipts, photos, screenshots, or any proof related to your claim.
          </p>
        </>
      )}
    </div>
  );
}

function Step2Details({ form, setForm, onNext, onBack, saving, caseId }: {
  form: FormData; setForm: (f: FormData) => void; onNext: () => void; onBack: () => void; saving: boolean; caseId: number | null;
}) {
  const limit = STATE_LIMITS[form.state] ?? 10000;
  const claimType = CLAIM_TYPES.find((c) => c.value === form.claimType);
  const [building, setBuilding] = useState(false);
  const [extractedTexts, setExtractedTexts] = useState<{ text: string; fileName: string }[]>([]);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const guidedReady = (form.agreement ?? "").trim().length > 0 && (form.problem ?? "").trim().length > 0;
  const canProceed =
    form.claimantName && form.defendantName && form.claimAmount > 0 && form.claimDescription;
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const buildStatement = async () => {
    if (!guidedReady) return;
    setBuilding(true);
    try {
      const claimTypeLabel = CLAIM_TYPES.find((c) => c.value === form.claimType)?.label ?? form.claimType;
      const res = await fetch(`${baseUrl}/api/build-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: claimTypeLabel,
          agreement: form.agreement,
          problem: form.problem,
          date: form.incidentDate,
          amount: form.claimAmount,
          state: form.state,
        }),
      });
      const data = await res.json();
      if (data.text) setForm({ ...form, claimDescription: data.text });
    } catch {
    } finally {
      setBuilding(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{claimType?.icon}</span>
        <h2 className="font-serif text-2xl font-semibold text-foreground">{claimType?.label} — Case Details</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Fill in the parties and claim information.</p>

      <div className="space-y-6">
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Information (Claimant)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Your full name" required>
              <input type="text" className={inputClass} placeholder="Jane Smith" value={form.claimantName}
                onChange={(e) => setForm({ ...form, claimantName: e.target.value })} />
            </FieldRow>
            <FieldRow label="Your email">
              <input type="email" className={inputClass} placeholder="jane@example.com" value={form.claimantEmail}
                onChange={(e) => setForm({ ...form, claimantEmail: e.target.value })} />
            </FieldRow>
            <FieldRow label="Your phone">
              <input type="tel" className={inputClass} placeholder="(555) 555-5555" value={form.claimantPhone}
                onChange={(e) => setForm({ ...form, claimantPhone: e.target.value })} />
            </FieldRow>
            <FieldRow label="Your address">
              <input type="text" className={inputClass} placeholder="123 Main St, City, ST 12345" value={form.claimantAddress}
                onChange={(e) => setForm({ ...form, claimantAddress: e.target.value })} />
            </FieldRow>
            <FieldRow label="Your ZIP code" hint="Used to find your exact courthouse">
              <input type="text" className={inputClass} placeholder="e.g. 10001" maxLength={5}
                value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })} />
            </FieldRow>
          </div>
          <div className="border-t border-border/50 pt-3 mt-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Case update reminders</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.emailReminders}
                  onChange={(e) => setForm({ ...form, emailReminders: e.target.checked })}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-foreground">
                  Email reminders — follow-up tips at 3, 10, and 30 days after filing
                  <span className="text-xs text-muted-foreground ml-1">(recommended)</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.smsReminders}
                  onChange={(e) => setForm({ ...form, smsReminders: e.target.checked })}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-foreground">
                  SMS reminders — text updates to your phone number above
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Party (Defendant)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Defendant's full name or business" required>
              <input type="text" className={inputClass} placeholder="John Doe or ACME Corp" value={form.defendantName}
                onChange={(e) => setForm({ ...form, defendantName: e.target.value })} />
            </FieldRow>
            <FieldRow label="Defendant's email">
              <input type="email" className={inputClass} placeholder="defendant@example.com" value={form.defendantEmail}
                onChange={(e) => setForm({ ...form, defendantEmail: e.target.value })} />
            </FieldRow>
            <FieldRow label="Defendant's address" hint="Required to serve the defendant">
              <input type="text" className={inputClass} placeholder="456 Other St, City, ST 12345" value={form.defendantAddress}
                onChange={(e) => setForm({ ...form, defendantAddress: e.target.value })} />
            </FieldRow>
            <FieldRow label="Defendant's phone">
              <input type="tel" className={inputClass} placeholder="(555) 555-5555" value={form.defendantPhone}
                onChange={(e) => setForm({ ...form, defendantPhone: e.target.value })} />
            </FieldRow>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Claim Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Amount claiming ($)" required hint={`Maximum in your state: $${limit.toLocaleString()}`}>
              <input type="number" className={inputClass} placeholder="0.00" min={0} max={limit}
                value={form.claimAmount || ""} onChange={(e) => setForm({ ...form, claimAmount: Number(e.target.value) })} />
            </FieldRow>
            <FieldRow label="Date of incident">
              <input type="date" className={inputClass} value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} />
            </FieldRow>
          </div>
          {/* Guided inputs */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Tell us what happened — we'll write your statement
              </p>
              <p className="text-sm text-muted-foreground mb-3">Answer a few quick questions and we'll build your court-ready case.</p>
            </div>
            <FieldRow label="What was the agreement or situation?" required>
              <input
                type="text"
                className={inputClass}
                placeholder={claimType?.value === "unpaid_rent" ? "e.g. Tenant agreed to pay $1,000/month rent" : "e.g. I agreed to pay for web design services in full"}
                value={form.agreement ?? ""}
                onChange={(e) => setForm({ ...form, agreement: e.target.value })}
              />
            </FieldRow>
            <FieldRow label="What went wrong?" required>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. They never delivered the work and stopped responding"
                value={form.problem ?? ""}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
              />
            </FieldRow>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={buildStatement}
                disabled={building || !guidedReady}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {building ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Building your statement…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Build My Statement</>
                )}
              </button>
            </div>
          </div>

          {/* Generated / manual statement */}
          {(form.claimDescription || showManualEdit) ? (
            <div className="border border-primary/30 rounded-lg overflow-hidden">
              <div className="bg-primary/5 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">Court Statement Generated</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualEdit((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showManualEdit ? "Collapse" : "Edit manually"}
                </button>
              </div>
              {showManualEdit ? (
                <textarea
                  className={`${inputClass} h-36 resize-none rounded-none border-0 border-t border-border`}
                  value={form.claimDescription}
                  onChange={(e) => setForm({ ...form, claimDescription: e.target.value })}
                />
              ) : (
                <p className="px-3 py-3 text-sm text-foreground leading-relaxed">{form.claimDescription}</p>
              )}
            </div>
          ) : (
            !guidedReady && (
              <p className="text-xs text-muted-foreground">
                Fill the two fields above and click <strong>Build My Statement</strong>, or{" "}
                <button type="button" onClick={() => setShowManualEdit(true)} className="text-primary underline">
                  type it yourself
                </button>
                .
              </p>
            )
          )}
          <FieldRow label="What outcome do you want?">
            <input type="text" className={inputClass}
              placeholder="e.g. Repayment of $2,500 security deposit plus interest"
              value={form.desiredOutcome} onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })} />
          </FieldRow>
          <FieldRow label="Supporting facts (text)">
            <textarea className={`${inputClass} h-20 resize-none`}
              placeholder="List any key facts, dates, or details that support your claim..."
              value={form.supportingFacts} onChange={(e) => setForm({ ...form, supportingFacts: e.target.value })} />
          </FieldRow>
        </div>

        <EvidenceUpload
          caseId={caseId}
          onTextExtracted={(text, fileName) =>
            setExtractedTexts((prev) => [...prev.filter((e) => e.fileName !== fileName), { text, fileName }])
          }
        />

        <CaseAnalysisPanel
          form={form}
          caseId={caseId}
          autoTexts={extractedTexts}
          onUseNarrative={(narrative) => setForm({ ...form, claimDescription: narrative })}
        />
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} disabled={!canProceed || saving}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (<>Save & Continue <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </div>
    </motion.div>
  );
}

type AnalysisResult = {
  timeline: { date: string; event: string }[];
  facts: string[];
  amounts: { description: string; amount: string }[];
  narrative: string;
};

function CaseAnalysisPanel({
  form,
  caseId,
  autoTexts = [],
  onUseNarrative,
}: {
  form: FormData;
  caseId: number | null;
  autoTexts?: { text: string; fileName: string }[];
  onUseNarrative: (narrative: string) => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoLabel, setAutoLabel] = useState<string | null>(null);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (autoTexts.length === 0) return;
    const latestFile = autoTexts[autoTexts.length - 1].fileName;
    setAutoLabel(latestFile);
    analyze(autoTexts.map((e) => e.text));
  }, [autoTexts.length]);

  const analyze = async (extraTexts?: string[]) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${baseUrl}/api/analyze-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseId ?? undefined,
          evidenceTexts: extraTexts ?? [],
          description: form.claimDescription,
          supportingFacts: form.supportingFacts,
          amount: form.claimAmount,
          claimType: form.claimType,
          state: form.state,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Analysis failed");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Could not reach the analysis service.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Case Analysis</span>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={analyzing || (!form.claimDescription.trim() && !form.supportingFacts.trim())}
          className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Analyze Case</>
          )}
        </button>
      </div>

      {!result && !analyzing && !error && (
        <div className="px-4 py-4 text-sm text-muted-foreground">
          {autoLabel
            ? <>Extracted text from <strong>{autoLabel}</strong>. Click <strong>Analyze Case</strong> to build your timeline and court statement.</>
            : <>Paste or type your description and supporting facts above, then click <strong>Analyze Case</strong> to extract a timeline, key facts, and a draft court statement.</>
          }
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm text-destructive bg-destructive/5 border-t border-destructive/20">
          {error}
        </div>
      )}

      {result && (
        <div className="divide-y divide-border">
          {result.timeline.length > 0 && (
            <div className="px-4 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</p>
              <ol className="space-y-2">
                {result.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 font-medium text-muted-foreground w-28">{t.date}</span>
                    <span className="text-foreground">{t.event}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.facts.length > 0 && (
            <div className="px-4 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Facts</p>
              <ul className="space-y-1.5">
                {result.facts.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.amounts.length > 0 && (
            <div className="px-4 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial Amounts</p>
              <ul className="space-y-1.5">
                {result.amounts.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-mono font-semibold text-green-700">{a.amount}</span>
                    <span className="text-muted-foreground">{a.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.narrative && (
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Court-Ready Statement</p>
                <button
                  type="button"
                  onClick={() => onUseNarrative(result.narrative)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Use as description ↑
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-md p-3">
                {result.narrative}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step3Chat({ form, caseId, conversationId, setConversationId, onNext, onBack }: {
  form: FormData; caseId: number | null; conversationId: number | null; setConversationId: (id: number) => void;
  onNext: () => void; onBack: () => void;
}) {
  const claimType = CLAIM_TYPES.find((c) => c.value === form.claimType);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [convoId, setConvoId] = useState<number | null>(conversationId);
  const createConvo = useCreateOpenaiConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (convoId === null && caseId !== null) {
      createConvo.mutate(
        { title: `${claimType?.label} case #${caseId}` },
        {
          onSuccess: (data) => {
            setConvoId(data.id);
            setConversationId(data.id);
            const greeting = `Hello! I'm your AI legal assistant. I've reviewed your ${claimType?.label} case details.

Here's a quick summary:
- **Claimant**: ${form.claimantName}  
- **Defendant**: ${form.defendantName}  
- **Amount**: $${form.claimAmount.toLocaleString()}  
- **State**: ${form.state}

I'm here to help you prepare the strongest possible case. You can ask me things like:
- "What evidence do I need for a ${claimType?.label?.toLowerCase()} case?"
- "How do I serve the defendant?"
- "What should I say to the judge?"
- "What are the filing fees in ${form.state}?"

What would you like to know?`;
            setMessages([{ role: "assistant", content: greeting }]);
          },
        }
      );
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || streaming || !convoId) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    const systemPrompt = `You are a helpful legal assistant specializing in small claims court.
The user has a ${claimType?.label} case:
- Claimant: ${form.claimantName}
- Defendant: ${form.defendantName}
- State: ${form.state}
- Amount: $${form.claimAmount}
- Description: ${form.claimDescription}
- Incident date: ${form.incidentDate || "not specified"}
- Desired outcome: ${form.desiredOutcome || "not specified"}
- Evidence: ${form.supportingFacts || "not specified"}

Help them prepare for small claims court. Be specific, practical, and concise.
Note: You are not a licensed attorney and they should consult one for complex matters.`;

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const response = await fetch(`${baseUrl}/api/openai/conversations/${convoId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg, systemPrompt }),
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantContent, streaming: true };
                  return next;
                });
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: assistantContent, streaming: false };
        return next;
      });
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "Sorry, I encountered an error. Please try again.", streaming: false };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">AI Legal Assistant</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Get personalized guidance for your {claimType?.label?.toLowerCase()} case. Ask any questions about evidence, procedures, or strategy.
      </p>

      <div className="border border-border rounded-lg overflow-hidden mb-4">
        <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Case Assistant</span>
          <span className="ml-auto text-xs text-muted-foreground">Not a substitute for legal advice</span>
        </div>

        <div className="h-72 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Starting your session...</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-muted border border-border"}`}>
                {msg.role === "user" ? <User className="w-4 h-4 text-primary-foreground" /> : <Bot className="w-4 h-4 text-foreground" />}
              </div>
              <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
              }`}>
                {msg.content.split("\n").map((line, j) => (
                  <span key={j}>
                    {line.startsWith("- ") ? <span>• {line.slice(2)}</span> : line.startsWith("**") && line.endsWith("**") ? <strong>{line.slice(2, -2)}</strong> : line}
                    {j < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
                {msg.streaming && <span className="inline-block w-1 h-4 bg-current ml-0.5 animate-pulse" />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-3 flex gap-2 bg-background">
          <input
            type="text"
            className={`${inputClass} flex-1`}
            placeholder="Ask about evidence, procedures, deadlines..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={streaming || !convoId}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim() || !convoId}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity">
          Generate Statement <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

const WIZARD_API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function Step4Statement({ form, caseId, conversationId, onBack }: {
  form: FormData; caseId: number | null; conversationId: number | null; onBack: () => void;
}) {
  const [, setLocation] = useLocation();
  const claimType = CLAIM_TYPES.find((c) => c.value === form.claimType);
  const [statement, setStatement] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const updateCase = useUpdateCase();
  const [checkingOut, setCheckingOut] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "standard" | "premium">("standard");
  const [courtInfo, setCourtInfo] = useState<any>(null);
  const [courtLoading, setCourtLoading] = useState(false);

  useEffect(() => {
    const zip = (form.zip ?? "").trim();
    if (zip.length === 5 && form.state) {
      setCourtLoading(true);
      fetch(`/api/court?state=${encodeURIComponent(form.state)}&zip=${encodeURIComponent(zip)}`)
        .then((r) => r.json())
        .then((data) => setCourtInfo(data))
        .catch(() => setCourtInfo(null))
        .finally(() => setCourtLoading(false));
    }
  }, [form.zip, form.state]);

  const generate = async () => {
    if (!caseId) return;
    setGenerating(true);
    try {
      const result = await generateCaseStatement(caseId);
      setStatement(result.statement);
      setGenerated(true);
    } catch {
      setStatement("Error generating statement. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const previewPDF = () => {
    if (!caseId) return;
    window.open(`${WIZARD_API_BASE}/api/cases/${caseId}/preview`, "_blank");
  };

  const checkout = async (plan?: "basic" | "standard" | "premium") => {
    if (!caseId) return;
    setCheckingOut(true);
    const usePlan = plan ?? selectedPlan;
    try {
      const res = await fetch(`${WIZARD_API_BASE}/api/cases/${caseId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: usePlan }),
      });
      const data = await res.json();
      if (data.alreadyPaid) {
        window.open(`${WIZARD_API_BASE}/api/small-claims/download/${caseId}`, "_blank");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
    } finally {
      setCheckingOut(false);
    }
  };

  const submit = async () => {
    if (!caseId) return;
    setSubmitting(true);
    try {
      await updateCase.mutateAsync({
        id: caseId,
        data: {
          status: "ready",
          generatedStatement: statement,
          conversationId: conversationId ?? undefined,
        },
      });
      setSubmitted(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Case Ready to File!</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Your small claims case has been saved and your statement of claim is ready. Take it to your local courthouse to file.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6 max-w-md mx-auto">
            <p className="text-sm font-semibold text-amber-800 mb-1">Next steps:</p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Visit your local small claims court clerk</li>
              <li>Bring this statement, ID, and filing fee</li>
              <li>Serve the defendant with notice of the hearing</li>
              <li>Gather and organize your evidence</li>
              <li>Appear on your hearing date</li>
            </ol>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setLocation("/cases")}
              className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors"
            >
              View My Cases
            </button>
            {caseId && (
              <button
                onClick={checkout}
                disabled={checkingOut}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {checkingOut ? "Redirecting…" : "Unlock & Download — $29"}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Print Statement
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Statement of Claim</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Generate an AI-powered statement of claim for your {claimType?.label?.toLowerCase()} case.
      </p>

      <div className="bg-card border border-card-border rounded-lg p-5 mb-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
          <div><dt className="text-muted-foreground">Claim type</dt><dd className="font-medium">{claimType?.label}</dd></div>
          <div><dt className="text-muted-foreground">State</dt><dd className="font-medium">{form.state}</dd></div>
          <div><dt className="text-muted-foreground">Claimant</dt><dd className="font-medium">{form.claimantName}</dd></div>
          <div><dt className="text-muted-foreground">Defendant</dt><dd className="font-medium">{form.defendantName}</dd></div>
          <div><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold text-primary">${form.claimAmount.toLocaleString()}</dd></div>
          <div><dt className="text-muted-foreground">Incident date</dt><dd>{form.incidentDate || "—"}</dd></div>
        </div>
      </div>

      {!generated ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center mb-4">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Click below to generate a personalized statement of claim using AI</p>
          <button
            onClick={generate}
            disabled={generating || !caseId}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {generating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>) : (<><Sparkles className="w-4 h-4" /> Generate Statement</>)}
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Statement of Claim</label>
            <button
              onClick={generate}
              disabled={generating}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Regenerate
            </button>
          </div>
          <textarea
            className={`${inputClass} h-48 resize-y font-serif text-sm`}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">You can edit the statement above before submitting.</p>
        </div>
      )}

      {generated && (
        <div className="mb-4 border border-border rounded-lg p-4 bg-muted/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground leading-snug">
              I agree to the{" "}
              <a href="terms" className="underline hover:text-foreground transition-colors">Terms of Service</a>
              {" "}and understand this service provides self-help guidance only and is{" "}
              <strong className="text-foreground">not legal advice</strong>. I am responsible for reviewing,
              verifying, and filing my documents. No attorney-client relationship is created.{" "}
              <a href="disclaimer" className="underline hover:text-foreground transition-colors text-xs">
                Full Disclaimer
              </a>
            </span>
          </label>
        </div>
      )}

      {generated && (() => {
        const court = COURT_DATA[form.state] ?? COURT_DATA.NY;
        const METHOD_LABELS = {
          online: { label: "Online", icon: "🌐", tip: "Fastest option" },
          in_person: { label: "At courthouse", icon: "🏛️", tip: "Bring 2 copies" },
          mail: { label: "By mail", icon: "📬", tip: "Send certified mail" },
        };
        return (
          <div className="mb-4 rounded-xl border border-border overflow-hidden">
            {/* Cost breakdown */}
            <div className="bg-muted/30 px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Total Cost Breakdown</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground">SmallClaims AI — {selectedPlan === "basic" ? "Basic" : selectedPlan === "standard" ? "Standard" : "Premium"} plan</span>
                  <span className="font-semibold text-foreground">{selectedPlan === "basic" ? "$29.00" : selectedPlan === "standard" ? "$49.00" : "$79.00"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Court filing fee ({form.state})</span>
                  <span className="text-muted-foreground">{court.filingFee}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Service of process (sheriff/process server)</span>
                  <span className="text-muted-foreground">{court.serviceFee}</span>
                </div>
                <div className="border-t border-border/60 pt-1.5 flex justify-between items-center text-sm font-semibold">
                  <span>Estimated total (all fees)</span>
                  <span className="text-primary">{selectedPlan === "basic" ? "$29" : selectedPlan === "standard" ? "$49" : "$79"} + {court.filingFee} + {court.serviceFee}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Court and service fees are paid separately to the court — <strong>not</strong> to us.
              </p>
            </div>

            {/* Filing court — dynamic lookup */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Where to File in {form.state}
              </p>
              {courtLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Looking up your courthouse…
                </div>
              ) : courtInfo && !courtInfo.fallback ? (
                <>
                  <p className="text-sm font-semibold text-foreground mb-0.5">{courtInfo.name}</p>
                  <p className="text-xs text-muted-foreground mb-1">{courtInfo.address}</p>
                  {courtInfo.phone && (
                    <p className="text-xs text-muted-foreground mb-1">📞 {courtInfo.phone}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(courtInfo.filingMethods ?? []).map((m: string) => {
                      const ml = METHOD_LABELS[m as keyof typeof METHOD_LABELS];
                      if (!ml) return null;
                      return (
                        <span key={m} className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">
                          {ml.icon} {ml.label}<span className="text-green-500">· {ml.tip}</span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {courtInfo.filingLink && (
                      <a href={courtInfo.filingLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary underline hover:opacity-80">File Online →</a>
                    )}
                    {courtInfo.clerkLink && (
                      <a href={courtInfo.clerkLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary underline hover:opacity-80">Court Website →</a>
                    )}
                  </div>
                </>
              ) : courtInfo?.fallback ? (
                <>
                  <p className="text-sm font-medium text-foreground mb-1">{court.courtName}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1">{court.filingNote}</p>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    {courtInfo.message}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {court.methods.map(m => {
                      const ml = METHOD_LABELS[m];
                      return (
                        <span key={m} className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">
                          {ml.icon} {ml.label}<span className="text-green-500">· {ml.tip}</span>
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-1">{court.courtName}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{court.filingNote}</p>
                  {!form.zip && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Add your ZIP code in Step 2 to find your exact courthouse.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {court.methods.map(m => {
                      const ml = METHOD_LABELS[m];
                      return (
                        <span key={m} className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">
                          {ml.icon} {ml.label}<span className="text-green-500">· {ml.tip}</span>
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Next steps */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Next Steps After Payment</p>
              <ol className="space-y-1.5">
                {[
                  "Download your completed court filing document",
                  `Go to ${(courtInfo && !courtInfo.fallback ? courtInfo.name : null) ?? court.courtName} and pay the ${court.filingFee} filing fee`,
                  "Submit your documents — ask the clerk for a case number and your hearing date",
                  "Have the defendant officially served (court arranges this or you hire a process server)",
                  "Wait for your hearing date notice in the mail (usually 30–60 days)",
                  "Show up prepared with your evidence and this document",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      })()}

      {/* 3-tier pricing selector — shown after statement is generated */}
      {generated && (() => {
        const plans = [
          {
            id: "basic" as const,
            name: "Basic",
            price: "$29",
            badge: null,
            color: "border-border",
            selectedColor: "border-blue-400 ring-1 ring-blue-400",
            features: [
              { text: "Court-ready filing document (PDF)", included: true },
              { text: "AI-generated statement of claim", included: true },
              { text: "Step-by-step filing instructions", included: true },
              { text: "Evidence checklist & analysis", included: false },
              { text: "Post-judgment collection toolkit", included: false },
            ],
          },
          {
            id: "standard" as const,
            name: "Standard",
            price: "$49",
            badge: "Most Popular",
            color: "border-primary/40",
            selectedColor: "border-primary ring-1 ring-primary",
            features: [
              { text: "Court-ready filing document (PDF)", included: true },
              { text: "AI-generated statement of claim", included: true },
              { text: "Step-by-step filing instructions", included: true },
              { text: "Evidence checklist & analysis", included: true },
              { text: "Post-judgment collection toolkit", included: false },
            ],
          },
          {
            id: "premium" as const,
            name: "Premium",
            price: "$79",
            badge: "Full Suite",
            color: "border-border",
            selectedColor: "border-amber-500 ring-1 ring-amber-500",
            features: [
              { text: "Court-ready filing document (PDF)", included: true },
              { text: "AI-generated statement of claim", included: true },
              { text: "Step-by-step filing instructions", included: true },
              { text: "Evidence checklist & analysis", included: true },
              { text: "Post-judgment collection toolkit", included: true },
            ],
          },
        ] as const;
        return (
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Choose Your Plan</p>
            <div className="grid grid-cols-3 gap-2.5">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left rounded-xl border-2 px-3 py-3 transition-all hover:shadow-sm ${selectedPlan === plan.id ? plan.selectedColor + " bg-background shadow-sm" : plan.color + " bg-muted/20 hover:bg-muted/40"}`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${plan.id === "standard" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"}`}>
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{plan.name}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === plan.id ? (plan.id === "standard" ? "border-primary bg-primary" : plan.id === "premium" ? "border-amber-500 bg-amber-500" : "border-blue-400 bg-blue-400") : "border-muted-foreground/40"}`}>
                      {selectedPlan === plan.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-foreground mb-2">{plan.price}</div>
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className={`text-[11px] mt-0.5 shrink-0 ${f.included ? "text-green-600" : "text-muted-foreground/40"}`}>{f.included ? "✓" : "✗"}</span>
                        <span className={`text-[11px] leading-tight ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
              {["Pay once. No subscription.", "Court-ready format", "No legal experience needed"].map(t => (
                <span key={t} className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="text-green-500 text-xs">✓</span> {t}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {generated && (
          <button
            onClick={previewPDF}
            disabled={!caseId}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors disabled:opacity-40"
            title="Open a watermarked preview"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        )}
        {generated ? (
          <button
            onClick={() => checkout()}
            disabled={checkingOut || !caseId || !disclaimerAccepted}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            title={!disclaimerAccepted ? "Please accept the disclaimer above to continue" : undefined}
          >
            {checkingOut ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
            ) : (
              <><Lock className="w-4 h-4" /> {selectedPlan === "basic" ? "Get Basic — $29" : selectedPlan === "standard" ? "Get Standard — $49" : "Get Premium — $79"}</>
            )}
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!generated || submitting || !statement.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (<><CheckCircle className="w-4 h-4" /> Mark as Ready to File</>)}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function FileWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [caseId, setCaseId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();

  const saveCase = async (): Promise<boolean> => {
    try {
      if (!caseId) {
        const created = await createCase.mutateAsync({
          claimType: form.claimType,
          state: form.state,
          claimantName: form.claimantName,
          claimantEmail: form.claimantEmail || undefined,
          claimantPhone: form.claimantPhone || undefined,
          claimantAddress: form.claimantAddress || undefined,
          defendantName: form.defendantName,
          defendantAddress: form.defendantAddress || undefined,
          defendantEmail: form.defendantEmail || undefined,
          defendantPhone: form.defendantPhone || undefined,
          claimAmount: form.claimAmount,
          claimDescription: form.claimDescription,
          claimBasis: form.claimBasis || undefined,
          incidentDate: form.incidentDate || undefined,
          desiredOutcome: form.desiredOutcome || undefined,
          supportingFacts: form.supportingFacts || undefined,
          emailReminders: form.emailReminders ? "true" : "false",
          smsReminders: form.smsReminders ? "true" : "false",
        });
        setCaseId(created.id);
      } else {
        await updateCase.mutateAsync({
          id: caseId,
          data: {
            claimType: form.claimType,
            state: form.state,
            claimantName: form.claimantName,
            claimantEmail: form.claimantEmail || undefined,
            claimantPhone: form.claimantPhone || undefined,
            claimantAddress: form.claimantAddress || undefined,
            defendantName: form.defendantName,
            defendantAddress: form.defendantAddress || undefined,
            defendantEmail: form.defendantEmail || undefined,
            defendantPhone: form.defendantPhone || undefined,
            claimAmount: form.claimAmount,
            claimDescription: form.claimDescription,
            claimBasis: form.claimBasis || undefined,
            incidentDate: form.incidentDate || undefined,
            desiredOutcome: form.desiredOutcome || undefined,
            supportingFacts: form.supportingFacts || undefined,
            emailReminders: form.emailReminders ? "true" : "false",
            smsReminders: form.smsReminders ? "true" : "false",
          },
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <StepIndicator current={step} />
      <div className="mb-4 px-3 py-2.5 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground flex items-start gap-2">
        <span className="shrink-0 mt-0.5">ℹ️</span>
        <span>
          SmallClaims AI provides self-help tools only. It is not a law firm and does not provide legal advice.
          {" "}<a href="disclaimer" className="underline hover:text-foreground transition-colors">Full Disclaimer</a>
        </span>
      </div>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step1ClaimType key="step1" form={form} setForm={setForm} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2Details
            key="step2"
            form={form}
            setForm={setForm}
            caseId={caseId}
            saving={createCase.isPending || updateCase.isPending}
            onBack={() => setStep(1)}
            onNext={async () => {
              const ok = await saveCase();
              if (ok) setStep(3);
            }}
          />
        )}
        {step === 3 && (
          <Step3Chat
            key="step3"
            form={form}
            caseId={caseId}
            conversationId={conversationId}
            setConversationId={setConversationId}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4Statement
            key="step4"
            form={form}
            caseId={caseId}
            conversationId={conversationId}
            onBack={() => setStep(3)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
