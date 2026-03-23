import { AppLayout } from "@/components/layout/AppLayout";
import { CheckCircle2, FileSearch, Scale, Building, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "1. Review Notice of Tentative Assessment",
    description: "In early spring, you will receive a notice showing your property's assessed value. Check the 'Estimated Market Value' listed. If you believe your home would sell for less than this amount, you have grounds for a grievance.",
    icon: FileSearch,
  },
  {
    title: "2. Gather Comparable Sales",
    description: "Find 3-5 homes in your immediate neighborhood that are similar to yours (style, square footage, age, condition) that sold recently (usually within the last year) for LESS than your estimated market value.",
    icon: Building,
  },
  {
    title: "3. File the Grievance Form (RP-524)",
    description: "Complete the state required form (or county specific portal) before Grievance Day. State your requested assessment based on your comparables. Attach evidence. Note: Filing cannot result in a tax increase.",
    icon: CheckCircle2,
  },
  {
    title: "4. Board of Assessment Review (BAR)",
    description: "The BAR will review your case. You may attend the hearing, but it's rarely required. They will mail you their decision. If they agree, your assessment is lowered.",
    icon: Scale,
  },
  {
    title: "5. Small Claims Assessment Review (SCAR)",
    description: "If the BAR denies your grievance or only partially reduces it, you can file a SCAR petition for $30. This is a hearing before a hearing officer, designed specifically for homeowners without lawyers.",
    icon: TrendingDown,
  },
];

export function HowItWorks() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-2xl mb-6">
            {/* Using stock Unsplash image for visual flavor */}
            {/* traditional stately government building architecture */}
            <img 
              src="https://pixabay.com/get/g334420ce66f611aff904a6740725aa1002c626ccbdc92c7fccb9c0ead39e4f647b88611a03a27a3f7c3e838c9f79b07362429b227db8db806c39299ebc53f954_1280.jpg" 
              alt="Architecture" 
              className="w-full h-48 object-cover rounded-xl shadow-md border border-border"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            The Do-It-Yourself Guide
          </h1>
          <p className="text-xl text-muted-foreground">
            Tax grievance firms take up to 50% of your first year's savings. 
            The process is actually designed for homeowners to do themselves. Here is how.
          </p>
        </div>

        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/20 before:to-transparent">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground border-4 border-background shadow-md shadow-primary/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm group-hover:shadow-md transition-shadow">
                  <h3 className="font-serif font-bold text-xl text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center bg-primary text-primary-foreground p-10 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent rounded-full opacity-20 blur-3xl"></div>
          <h2 className="text-3xl font-serif font-bold mb-4 relative z-10">Ready to start your case?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto relative z-10">
            Use our free dashboard to track your property details, organize your comparables, and keep track of deadlines.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-white relative z-10 font-bold px-8 shadow-lg shadow-black/20">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
