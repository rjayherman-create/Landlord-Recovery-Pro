import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "Document Your Case",
    description: "Gather your lease agreement, communication records, photos of damages, and a ledger of unpaid rent. Organization is your strongest asset.",
  },
  {
    title: "Send a Demand Letter",
    description: "Before filing, most courts require you to formally demand payment. Use our AI tool to generate a professional, legally-sound letter based on your specific situation.",
  },
  {
    title: "File in Small Claims Court",
    description: "If the tenant doesn't respond to the demand letter within the specified timeframe, file your claim in the appropriate county court. We provide the links and limits for your state.",
  },
  {
    title: "Serve the Tenant",
    description: "The tenant must be legally notified of the lawsuit. This is usually done via certified mail or a process server, depending on your local court rules.",
  },
  {
    title: "Attend the Hearing",
    description: "Present your organized evidence clearly and concisely. Stick to the facts. Let the documentation speak for itself.",
  },
  {
    title: "Collect Your Judgment",
    description: "Winning is half the battle. If the tenant still refuses to pay, use tools like wage garnishment or bank levies to collect your court-ordered judgment.",
  }
];

export default function HowItWorks() {
  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">How It Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Navigating small claims court is a process. We break it down into manageable, actionable steps.
          </p>
        </div>

        <div className="relative border-l-2 border-primary/20 pl-8 ml-4 md:ml-0 md:pl-0 md:border-none space-y-12">
          {/* Timeline line for desktop */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary/20 -translate-x-1/2"></div>
          
          {STEPS.map((step, index) => (
            <div key={index} className={`relative md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:ml-0 md:text-right' : 'md:pl-16 md:ml-auto'}`}>
              {/* Timeline dot */}
              <div className={`absolute top-0 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary text-primary font-bold z-10
                -left-13 md:left-auto md:transform md:-translate-x-1/2 ${index % 2 === 0 ? 'md:-right-5' : 'md:-left-5'}`}>
                {index + 1}
              </div>
              
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary/50 mb-1">Step {index + 1}</p>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center bg-muted/50 p-10 rounded-2xl border border-border">
          <h2 className="text-2xl font-serif font-bold mb-4">Ready to start the process?</h2>
          <p className="text-muted-foreground mb-8">Create your case and generate your first demand letter today.</p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
