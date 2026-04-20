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
};

const defaultForm: FormData = {
  claimType: "",
  state: "NY",
  claimantName: "",
  claimantEmail: "",
  claimantPhone: "",
  claimantAddress: "",
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

function Step2Details({ form, setForm, onNext, onBack, saving }: {
  form: FormData; setForm: (f: FormData) => void; onNext: () => void; onBack: () => void; saving: boolean;
}) {
  const limit = STATE_LIMITS[form.state] ?? 10000;
  const claimType = CLAIM_TYPES.find((c) => c.value === form.claimType);
  const [improving, setImproving] = useState(false);
  const canProceed =
    form.claimantName && form.defendantName && form.claimAmount > 0 && form.claimDescription;
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const improveWithAI = async () => {
    if (!form.claimDescription.trim()) return;
    setImproving(true);
    try {
      const res = await fetch(`${baseUrl}/api/ai-improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.claimDescription, amount: form.claimAmount }),
      });
      const data = await res.json();
      if (data.text) setForm({ ...form, claimDescription: data.text });
    } catch {
    } finally {
      setImproving(false);
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Describe what happened <span className="text-destructive ml-0.5">*</span>
            </label>
            <textarea className={`${inputClass} h-28 resize-none`}
              placeholder={`Briefly describe your ${claimType?.label.toLowerCase()} claim...`}
              value={form.claimDescription} onChange={(e) => setForm({ ...form, claimDescription: e.target.value })} />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">Explain clearly — who, what, when, and how much</p>
              <button
                type="button"
                onClick={improveWithAI}
                disabled={improving || !form.claimDescription.trim()}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline font-medium"
              >
                {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {improving ? "Improving..." : "Improve with AI"}
              </button>
            </div>
          </div>
          <FieldRow label="What outcome do you want?">
            <input type="text" className={inputClass}
              placeholder="e.g. Repayment of $2,500 security deposit plus interest"
              value={form.desiredOutcome} onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })} />
          </FieldRow>
          <FieldRow label="Supporting facts or evidence">
            <textarea className={`${inputClass} h-20 resize-none`}
              placeholder="List any contracts, receipts, photos, text messages, or other evidence you have..."
              value={form.supportingFacts} onChange={(e) => setForm({ ...form, supportingFacts: e.target.value })} />
          </FieldRow>
        </div>
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

  const checkout = async () => {
    if (!caseId) return;
    setCheckingOut(true);
    try {
      const res = await fetch(`${WIZARD_API_BASE}/api/cases/${caseId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (data.alreadyPaid) {
        window.open(`${WIZARD_API_BASE}/api/download/${caseId}`, "_blank");
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
              <a
                href={`${WIZARD_API_BASE}/api/cases/${caseId}/pdf`}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Court PDF
              </a>
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
            onClick={checkout}
            disabled={checkingOut || !caseId}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {checkingOut ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
            ) : (
              <><Lock className="w-4 h-4" /> Unlock & Download — $29</>
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
      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step1ClaimType key="step1" form={form} setForm={setForm} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2Details
            key="step2"
            form={form}
            setForm={setForm}
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
