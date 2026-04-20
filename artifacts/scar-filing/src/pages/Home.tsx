import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, FileText, Scale, Clock, DollarSign, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Check Eligibility",
    description: "Confirm you received a denial from the Board of Assessment Review and are within the 30-day window.",
  },
  {
    number: "02",
    title: "Enter Property Details",
    description: "Provide your property information, current assessment, and what you believe the fair market value is.",
  },
  {
    number: "03",
    title: "Review Your Case",
    description: "We'll help you organize comparable sales and show you the strength of your case.",
  },
  {
    number: "04",
    title: "File in Small Claims Court",
    description: "Take your completed petition to the nearest small claims court with the $30 filing fee.",
  },
];

const facts = [
  { icon: DollarSign, label: "$30", description: "Filing fee to petition the court" },
  { icon: Clock, label: "30 days", description: "From BAR denial to file your petition" },
  { icon: Scale, label: "DIY", description: "No lawyer needed — represent yourself" },
  { icon: CheckCircle, label: "NY Only", description: "Available in all New York counties" },
];

export function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-block bg-accent/10 text-accent-foreground text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6 border border-accent/20">
              Small Claims Assessment Review
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-6">
              Fight your property tax assessment — without a lawyer.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              If the Board of Assessment Review denied your grievance, you have 30 days to file a SCAR petition in small claims court. We'll walk you through every step of the process for a $30 court fee.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/file"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
              >
                Start Filing Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-medium px-6 py-3 rounded-md hover:bg-secondary/50 transition-colors"
              >
                Learn How It Works
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Facts */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {facts.map((fact, i) => (
              <motion.div
                key={fact.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className="text-center"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <fact.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-serif text-2xl font-semibold text-foreground mb-1">{fact.label}</div>
                <div className="text-sm text-muted-foreground">{fact.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What is SCAR */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">What is SCAR?</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The Small Claims Assessment Review (SCAR) is a simplified court procedure in New York State that allows homeowners to challenge their property tax assessment without hiring an attorney.
                </p>
                <p>
                  After the Board of Assessment Review (BAR) denies your grievance, SCAR is your next step. You file a petition in small claims court, pay a $30 fee, and present your case to a hearing officer who will make a binding decision.
                </p>
                <p>
                  Hearing officers are real estate professionals appointed by the court. The process is informal and designed for homeowners to navigate on their own — you don't need a lawyer.
                </p>
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-foreground">You may qualify if:</h3>
              <ul className="space-y-3">
                {[
                  "Your property is your primary residence (1-3 unit residential)",
                  "You filed a grievance with the Board of Assessment Review (BAR)",
                  "The BAR denied or partially denied your grievance",
                  "You are within 30 days of receiving the BAR determination",
                  "Your property is in New York State",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border bg-secondary/10">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-10">How it works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 bg-card border border-card-border rounded-lg p-6"
              >
                <div className="font-mono text-3xl font-bold text-primary/20 leading-none shrink-0">{step.number}</div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">
            Ready to challenge your assessment?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            It takes about 15 minutes to prepare your petition. We'll guide you through every field.
          </p>
          <Link
            href="/file"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-8 py-3 rounded-md hover:opacity-90 transition-opacity text-lg"
          >
            Start Your SCAR Petition
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
