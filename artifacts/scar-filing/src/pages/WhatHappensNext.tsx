import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Clock, CheckCircle, AlertCircle, Scale, DollarSign,
  MessageSquare, FileText, ChevronDown, ChevronUp, ArrowRight,
  Gavel, Users, TrendingUp
} from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Bell,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "Defendant Is Notified",
    subtitle: "Service of Process",
    timeline: "1–10 days after filing",
    body: "The court or a process server delivers your claim to the defendant. Once served, they are officially aware of the case and the clock starts.",
    callout: "This is when the pressure begins — many defendants reach out to settle at this stage.",
  },
  {
    number: "2",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Response Period",
    subtitle: "Wait & Watch",
    timeline: "10–30 days (varies by state)",
    body: "During this window, one of three things will happen. Most cases resolve here without ever going to a hearing.",
    callout: null,
    outcomes: true,
  },
  {
    number: "3",
    icon: Scale,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    title: "Hearing (if needed)",
    subtitle: "Your Day in Court",
    timeline: "2–8 weeks after filing",
    body: "If the defendant disputes the claim, a short, informal hearing is scheduled. You present your timeline and evidence. The defendant responds. The judge decides.",
    callout: "Most small claims hearings last only 10–15 minutes. No lawyers required.",
  },
  {
    number: "4",
    icon: Gavel,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    title: "Judgment",
    subtitle: "The Court's Decision",
    timeline: "Same day as hearing",
    body: "The court issues its decision. If you win, a judgment is entered in your favor for the amount awarded — this is a legally enforceable order.",
    callout: null,
  },
  {
    number: "5",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    title: "Collection",
    subtitle: "Getting Paid",
    timeline: "After judgment",
    body: "Winning a judgment is the start of getting paid — not always the end. If the defendant doesn't pay voluntarily, you have enforcement options.",
    bullets: [
      "Wage garnishment — court orders their employer to withhold pay",
      "Bank levy — court orders funds removed from their account",
      "Payment plan — structured court-ordered installments",
      "Liens — attached to their property until paid",
    ],
    callout: "Most defendants pay voluntarily once a judgment is issued.",
  },
];

const outcomes = [
  {
    emoji: "🟢",
    label: "They Pay or Settle",
    tag: "Most Common",
    tagColor: "bg-green-100 text-green-700",
    description: "The defendant contacts you and offers payment or negotiation. This is the best outcome and happens more often than you'd expect.",
    guidance: true,
    guidanceKey: "settle",
  },
  {
    emoji: "🟡",
    label: "They Ignore It",
    tag: "Common",
    tagColor: "bg-amber-100 text-amber-700",
    description: "No response, no court appearance. You can file a motion for default judgment — the court may rule in your favor automatically.",
    guidance: true,
    guidanceKey: "default",
  },
  {
    emoji: "🔴",
    label: "They Dispute It",
    tag: "Less Common",
    tagColor: "bg-red-100 text-red-700",
    description: "They respond and a hearing is scheduled. This is the scenario most people fear — but small claims hearings are short and informal.",
    guidance: true,
    guidanceKey: "dispute",
  },
];

const guidance: Record<string, { title: string; icon: typeof MessageSquare; lines: { label: string; text: string }[] }> = {
  settle: {
    title: "If the Defendant Contacts You",
    icon: MessageSquare,
    lines: [
      {
        label: "Opening response",
        text: "\"I'm willing to resolve this. I'm open to a full settlement of $[amount] paid by [date]. Please confirm in writing.\"",
      },
      {
        label: "If they lowball",
        text: "\"I understand your position, but my documented losses are $[amount]. I'd like to settle for $[counter] by [date] to avoid further court proceedings.\"",
      },
      {
        label: "Once agreed",
        text: "\"Please send payment to [method]. Once received, I will file a dismissal with the court.\"",
      },
    ],
  },
  default: {
    title: "If There Is No Response",
    icon: FileText,
    lines: [
      {
        label: "What to do",
        text: "Contact your court clerk and request a Default Judgment. Explain that the defendant was properly served and did not respond.",
      },
      {
        label: "What to say to the clerk",
        text: "\"I filed a small claims case on [date]. The defendant was served on [date] and has not responded. I'd like to request a default judgment.\"",
      },
      {
        label: "Bring with you",
        text: "Your filing receipt, proof of service, and any documentation of your claim amount.",
      },
    ],
  },
  dispute: {
    title: "If a Hearing Is Scheduled",
    icon: Scale,
    lines: [
      {
        label: "Opening statement",
        text: "\"Your Honor, I am [name], the plaintiff. I am here to recover $[amount] from the defendant for [reason]. I have documentation and a timeline of events.\"",
      },
      {
        label: "What to bring",
        text: "Your AI-generated timeline, all evidence you uploaded, the original contract or agreement, receipts, photos, and any written communication with the defendant.",
      },
      {
        label: "Key tip",
        text: "Speak directly to the judge, not the defendant. Be factual and concise. Stick to dates, amounts, and documented facts.",
      },
    ],
  },
};

function OutcomeGuidance({ guidanceKey }: { guidanceKey: string }) {
  const [open, setOpen] = useState(false);
  const g = guidance[guidanceKey];
  if (!g) return null;
  const Icon = g.icon;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? "Hide guidance" : "Show smart guidance"}
      </button>
      {open && (
        <div className="mt-3 bg-white border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{g.title}</span>
          </div>
          {g.lines.map((line) => (
            <div key={line.label} className="space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{line.label}</p>
              <p className="text-sm text-foreground bg-muted/40 rounded p-2 border border-border leading-relaxed">
                {line.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhatHappensNext() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" />
          After You File
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">What Happens Next</h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
          Filing is just the beginning. Here's exactly what to expect — and how to handle every outcome.
        </p>
      </div>

      {/* Conversion reframe */}
      <div className="mb-8 bg-primary/5 border border-primary/20 rounded-xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Most cases never reach a courtroom</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The act of filing your claim creates real pressure. Many defendants pay or settle as soon as they receive
            notice — before any hearing is scheduled. You don't need to "win in court" to get paid.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0 mb-8">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex gap-4">
              {/* Left timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full ${step.bg} border ${step.border} flex items-center justify-center shrink-0 z-10`}>
                  <Icon className={`w-4.5 h-4.5 ${step.color}`} />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-border my-1" style={{ minHeight: 24 }} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 ${i === steps.length - 1 ? "pb-0" : ""} flex-1 min-w-0`}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-foreground text-base">{step.title}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{step.subtitle}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {step.timeline}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{step.body}</p>

                {step.bullets && (
                  <ul className="space-y-1 mb-2">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {step.callout && (
                  <div className={`text-xs ${step.bg} ${step.border} border rounded-md px-3 py-2 ${step.color} font-medium`}>
                    {step.callout}
                  </div>
                )}

                {step.outcomes && (
                  <div className="space-y-3 mt-3">
                    {outcomes.map((o) => (
                      <div key={o.label} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-lg leading-none mt-0.5">{o.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">{o.label}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.tagColor}`}>{o.tag}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{o.description}</p>
                            {o.guidance && <OutcomeGuidance guidanceKey={o.guidanceKey} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hearing prep CTA */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">If You Go to Court — What to Bring</span>
        </div>
        <ul className="space-y-1.5">
          {[
            "This completed court filing form (bring 3 copies)",
            "Your AI-generated case timeline and statement of claim",
            "All contracts, receipts, invoices, or agreements",
            "Text messages, emails, or written communications",
            "Photos or videos of any damage",
            "Any witness information",
            "A photo ID",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/cases")}
          className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground font-medium px-5 py-2.5 rounded-md hover:bg-secondary/50 transition-colors text-sm"
        >
          View My Cases
        </button>
        <button
          onClick={() => navigate("/guide")}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          Filing Guide <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
