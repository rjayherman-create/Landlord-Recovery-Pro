import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Scale, Clock, DollarSign, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden border-b border-primary-border pt-20 pb-32">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent rounded-full blur-[120px] transform translate-x-1/3 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent mb-6">
              <Shield className="h-4 w-4 mr-2" />
              Protect your property investments
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary-foreground tracking-tight leading-[1.1] mb-6">
              Recover unpaid rent.<br />
              <span className="text-accent">Without a lawyer.</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl leading-relaxed">
              A professional toolkit for landlords to handle small claims court, from sending the formal demand letter to collecting the judgment. 
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8 text-lg font-semibold rounded-md" asChild>
                <Link href="/dashboard">
                  Start Your Case
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 rounded-md" asChild>
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">The system works when you know how to use it.</h2>
            <p className="text-lg text-muted-foreground">
              We provide the step-by-step guidance, automated documents, and organizational tools you need to successfully navigate the small claims process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover-elevate transition-all">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Demand Letters</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate professional, legally-sound demand letters tailored to your specific situation and state requirements.
              </p>
            </div>
            
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover-elevate transition-all">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Scale className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Filing Guidance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Step-by-step instructions for filing in your local jurisdiction, including fee schedules and required forms.
              </p>
            </div>
            
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm hover-elevate transition-all">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Case Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Keep all your dates, documents, and notes organized in one place from filing through final judgment collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-serif font-bold text-primary mb-2">$10k+</div>
              <div className="text-sm font-medium text-muted-foreground">Typical Limit</div>
            </div>
            <div>
              <div className="text-4xl font-serif font-bold text-primary mb-2">50</div>
              <div className="text-sm font-medium text-muted-foreground">States Covered</div>
            </div>
            <div>
              <div className="text-4xl font-serif font-bold text-primary mb-2">DIY</div>
              <div className="text-sm font-medium text-muted-foreground">No Attorney Fees</div>
            </div>
            <div>
              <div className="text-4xl font-serif font-bold text-primary mb-2">100%</div>
              <div className="text-sm font-medium text-muted-foreground">Your Recovery</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Ready to recover your losses?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Stop writing off bad debts. Take control of your property management business with Landlord Recovery.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-lg rounded-md shadow-lg shadow-primary/20" asChild>
            <Link href="/dashboard">Create Your Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
