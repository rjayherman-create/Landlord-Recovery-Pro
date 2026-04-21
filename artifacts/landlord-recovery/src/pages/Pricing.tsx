import { Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pricing() {
  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">Simple, transparent pricing.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recover what's yours without paying thousands in legal fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="border-border shadow-sm flex flex-col">
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-serif mb-2">Basic Tracker</CardTitle>
              <CardDescription>Organize your cases for free.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$0</span>
                <span className="text-muted-foreground ml-2">forever</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span>Unlimited case tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span>Basic status updates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                  <span>State resource directory</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Check className="h-5 w-5 text-transparent shrink-0 mr-3" />
                  <span>AI Demand Letter Generation</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Check className="h-5 w-5 text-transparent shrink-0 mr-3" />
                  <span>Document exports</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8">
              <Button variant="outline" className="w-full h-12 text-base" asChild>
                <Link href="/dashboard">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="border-primary shadow-md flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Recommended
            </div>
            <CardHeader className="text-center pb-8 pt-8 bg-primary/5">
              <CardTitle className="text-2xl font-serif mb-2">Recovery Pro</CardTitle>
              <CardDescription>Everything you need to execute.</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">$99</span>
                <span className="text-muted-foreground ml-2">flat fee / year</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Everything in Basic Tracker</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Unlimited AI Demand Letters</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Premium PDF Exports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Court-specific filing instructions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-accent shrink-0 mr-3" />
                  <span className="font-medium">Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8 bg-primary/5">
              <Button className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" asChild>
                <Link href="/dashboard">Upgrade to Pro</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Prices do not include court filing fees, process server fees, or other direct costs associated with small claims court.</p>
        </div>
      </div>
    </div>
  );
}
