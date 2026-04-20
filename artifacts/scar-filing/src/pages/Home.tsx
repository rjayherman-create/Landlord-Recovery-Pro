import { useLocation } from "wouter";
import { Scale, FileText, MessageSquare, Sparkles, ArrowRight, Shield, Clock, CheckCircle } from "lucide-react";

const CLAIM_TYPES = [
  { icon: "📄", label: "Breach of Contract" },
  { icon: "🏠", label: "Security Deposit" },
  { icon: "🔨", label: "Property Damage" },
  { icon: "💼", label: "Unpaid Wages" },
  { icon: "🛒", label: "Consumer Dispute" },
  { icon: "🔑", label: "Landlord / Tenant" },
  { icon: "⚖️", label: "Negligence" },
  { icon: "📦", label: "Personal Property" },
];

const HOW_IT_WORKS = [
  { icon: Scale, step: "1", title: "Pick Your Claim Type", description: "Choose from 8 common small claims categories and select your state." },
  { icon: FileText, step: "2", title: "Enter Case Details", description: "Fill in information about you, the other party, and what happened." },
  { icon: MessageSquare, step: "3", title: "Get AI Guidance", description: "Chat with our AI assistant to strengthen your case and prepare for court." },
  { icon: Sparkles, step: "4", title: "Generate Your Statement", description: "Get a professional statement of claim ready to file at the courthouse." },
];

export function Home() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-gradient-to-br from-primary/5 via-background to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Scale className="w-3.5 h-3.5" />
            AI-Powered Small Claims Filing
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
            File Your Small Claims Case<br />
            <span className="text-primary">With Confidence</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Our AI assistant guides you through every step of filing a small claims court case — from organizing your facts to generating a professional statement of claim.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/file")}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Start Filing Now
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLocation("/guide")}
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-medium px-6 py-3 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
            >
              Learn How It Works
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-semibold text-foreground text-center mb-2">We Help With All Common Small Claims</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">Available for NY, NJ, FL, TX, CA and more states</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CLAIM_TYPES.map((ct) => (
            <div key={ct.label} className="bg-card border border-card-border rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-default">
              <div className="text-3xl mb-2">{ct.icon}</div>
              <div className="text-sm font-medium text-foreground">{ct.label}</div>
            </div>
          ))}
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

      <section className="max-w-4xl mx-auto px-4 py-12">
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
          <h2 className="font-serif text-2xl font-semibold mb-3">Ready to file your case?</h2>
          <p className="text-primary-foreground/80 text-sm mb-6">It's free and takes less than 15 minutes.</p>
          <button
            onClick={() => setLocation("/file")}
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors text-sm"
          >
            Start Your Case
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
