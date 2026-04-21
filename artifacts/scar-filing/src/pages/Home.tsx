import { useLocation, Link } from "wouter";
import { Scale, FileText, MessageSquare, Sparkles, ArrowRight, Shield, Clock, CheckCircle, Building2, DollarSign, Zap } from "lucide-react";

const SUPPORTING_BULLETS = [
  { icon: Building2, text: "Designed for landlords and operators" },
  { icon: DollarSign, text: "Built for smaller balances your lawyer may not handle first" },
  { icon: Zap, text: "Generates usable next-step documents fast" },
];

const HOW_IT_WORKS = [
  { icon: Scale, step: "1", title: "Pick Your Claim Type", description: "Choose from 8 common small claims categories and select your state." },
  { icon: FileText, step: "2", title: "Enter Case Details", description: "Fill in information about you, the other party, and what happened." },
  { icon: MessageSquare, step: "3", title: "Get AI Guidance", description: "Chat with our AI assistant to strengthen your case and prepare for court." },
  { icon: Sparkles, step: "4", title: "Generate Your Statement", description: "Get a professional statement of claim ready to file at the courthouse." },
];

const WHAT_HAPPENS = [
  { emoji: "📬", label: "File", description: "Submit your claim at the courthouse." },
  { emoji: "⚡", label: "Pressure starts", description: "Defendant is officially notified — many pay here." },
  { emoji: "🟢", label: "Most cases settle", description: "Payment or negotiation before any hearing." },
  { emoji: "⚖️", label: "Hearing if needed", description: "Short, informal — usually 10–15 minutes." },
  { emoji: "💰", label: "Judgment", description: "Court awards your money. Enforcement options available." },
];

export function Home() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-gradient-to-br from-primary/5 via-background to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
            Recover tenant and resident balances faster.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Analyze the case, decide whether it is worth pursuing, and generate demand documents in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <button
              onClick={() => setLocation("/new-claim")}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Start a case
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <ul className="inline-flex flex-col items-start gap-3 text-sm text-muted-foreground">
            {SUPPORTING_BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl font-semibold text-foreground text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <div key={step}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {step}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion section: What Happens After You File */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">We Don't Just Help You File</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Most people fear going to court. Here's the truth: <strong>most small claims cases resolve before a hearing ever happens.</strong>{" "}
            Filing creates pressure — and we guide you through every step of what comes next.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-0 mb-4">
          {WHAT_HAPPENS.map((item, i) => (
            <div key={item.label} className="flex sm:flex-col flex-1 items-start sm:items-center gap-3 sm:gap-1 relative">
              {i < WHAT_HAPPENS.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-5 w-px h-full bg-border" style={{ width: "50%", height: 1, top: 20, right: "-25%" }} />
              )}
              <div className="text-2xl leading-none">{item.emoji}</div>
              <div className="sm:text-center">
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={() => setLocation("/what-happens-next")}
            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
          >
            See the full post-filing guide <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Legally Informed", description: "Our AI is trained on small claims procedures across multiple states and provides jurisdiction-specific guidance." },
            { icon: Clock, title: "Takes Under 15 Minutes", description: "From start to a ready-to-file statement of claim. No legal background required." },
            { icon: CheckCircle, title: "Free to Use", description: "Generate your case details and statement for free. Court filing fees vary by state and claim amount." },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold mb-3">Ready to recover your balance?</h2>
          <p className="text-primary-foreground/80 text-sm mb-6">It takes just a few minutes to get started.</p>
          <button
            onClick={() => setLocation("/new-claim")}
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors text-sm"
          >
            Start a case
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6 text-center border-t border-border mt-0">
        <p className="text-xs text-muted-foreground">
          SmallClaims AI provides self-help tools and general information only. It is not a law firm and does not provide legal advice or representation.
          Use of this service does not create an attorney-client relationship.{" "}
          <Link href="/disclaimer" className="underline hover:text-foreground transition-colors">Full Disclaimer</Link>
        </p>
      </div>
    </div>
  );
}
