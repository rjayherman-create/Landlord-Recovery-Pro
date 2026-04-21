import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface CaseContext {
  id: number;
  tenantName: string;
  landlordName: string;
  propertyAddress: string;
  state: string;
  claimType: string;
  claimAmount: number;
  status: string;
  description?: string | null;
  monthlyRent?: number | null;
  monthsOwed?: number | null;
  moveOutDate?: string | null;
  leaseStartDate?: string | null;
}

const CLAIM_LABELS: Record<string, string> = {
  unpaid_rent: "unpaid rent",
  property_damage: "property damage",
  security_deposit: "security deposit",
  lease_break: "lease break / early termination",
  other: "other breach of lease",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft (not yet sent)",
  demand_sent: "Demand letter sent",
  no_response: "No response to demand",
  filed: "Filed in small claims court",
  hearing_scheduled: "Hearing scheduled",
  judgment: "Judgment received",
  collection: "Collecting judgment",
  closed: "Closed",
};

const STARTER_PROMPTS = [
  "What evidence should I gather for my case?",
  "What are the next steps I should take?",
  "How do I serve the tenant with court papers?",
  "What should I say at the hearing?",
  "How do I collect after winning a judgment?",
];

function buildSystemPrompt(c: CaseContext): string {
  return `You are a knowledgeable, practical landlord recovery advisor with expertise in small claims court. You are helping ${c.landlordName} with a specific case.

CASE DETAILS:
- Tenant (Defendant): ${c.tenantName}
- Property: ${c.propertyAddress}
- State: ${c.state}
- Claim Type: ${CLAIM_LABELS[c.claimType] || c.claimType}
- Amount Claimed: $${c.claimAmount.toLocaleString()}
- Case Status: ${STATUS_LABELS[c.status] || c.status}
${c.description ? `- Description: ${c.description}` : ""}
${c.monthlyRent ? `- Monthly Rent: $${c.monthlyRent.toLocaleString()}` : ""}
${c.monthsOwed ? `- Months Unpaid: ${c.monthsOwed}` : ""}
${c.moveOutDate ? `- Move-Out Date: ${c.moveOutDate}` : ""}
${c.leaseStartDate ? `- Lease Start: ${c.leaseStartDate}` : ""}

YOUR ROLE:
- Give specific, actionable advice tailored to THIS case and ${c.state} law
- Help with evidence gathering, next steps, court preparation, and judgment collection
- Be direct and practical — the user is a landlord handling this without an attorney
- When relevant, reference ${c.state}-specific small claims limits, procedures, or forms
- Keep responses focused and well-organized (use short paragraphs or bullet points)
- Always note when a situation is complex enough to warrant consulting a local attorney

You are NOT providing legal advice in a formal attorney-client context. Remind the user of this only once if the situation is particularly complex.`;
}

export function CaseAdvisorChat({ caseData }: { caseData: CaseContext }) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Create a conversation on mount
  useEffect(() => {
    let cancelled = false;
    setIsCreating(true);
    fetch("/api/openai/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Case: ${caseData.tenantName} — ${caseData.propertyAddress}` }),
    })
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setConversationId(data.id);
          setIsCreating(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not start conversation. Please try again.");
          setIsCreating(false);
        }
      });
    return () => { cancelled = true; };
  }, [caseData.tenantName, caseData.propertyAddress]);

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationId || isLoading || !text.trim()) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Placeholder for streaming AI message
    const assistantPlaceholder: Message = { role: "assistant", content: "", streaming: true };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          systemPrompt: buildSystemPrompt(caseData),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: accumulated, streaming: true };
                  return updated;
                });
              }
            } catch {
              // ignore parse errors for individual chunks
            }
          }
        }
      }

      // Finalize — remove streaming flag
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: accumulated, streaming: false };
        return updated;
      });
    } catch {
      setMessages(prev => prev.slice(0, -1)); // remove placeholder
      setError("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, caseData, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (isCreating) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Starting AI advisor...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-card">
        <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Case Advisor</h3>
          <p className="text-xs text-muted-foreground">Tailored guidance for your case in {caseData.state}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Ask anything about your case</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                I know the details of your case against {caseData.tenantName}. Ask me about evidence, next steps, court prep, or judgment collection.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTER_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-sm px-3 py-2 rounded-full border border-border bg-card hover:bg-accent/5 hover:border-accent/30 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-card border border-border text-foreground rounded-bl-sm"
            }`}>
              {msg.content
                ? msg.content.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))
                : <span className="text-muted-foreground text-xs">Thinking...</span>
              }
              {msg.streaming && (
                <span className="inline-block w-1.5 h-4 bg-accent/60 ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
            <Button variant="ghost" size="sm" className="ml-auto text-destructive h-7 px-2" onClick={() => setError(null)}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-card">
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about evidence, next steps, court prep..."
            className="min-h-[52px] max-h-36 resize-none text-sm"
            disabled={isLoading || !conversationId}
            rows={1}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim() || !conversationId}
            className="h-[52px] w-[52px] shrink-0 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI guidance only — not legal advice. Press Enter to send, Shift+Enter for new line.
        </p>
      </form>
    </div>
  );
}
