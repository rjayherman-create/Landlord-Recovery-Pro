import { Link } from "wouter";
import { useGrievances } from "@/hooks/use-grievances";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { GrievanceForm } from "@/components/GrievanceForm";
import { FileText, Plus, ArrowRight, TrendingDown, Clock, ShieldCheck, DollarSign, AlertTriangle, Award, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format, parseISO, isValid, isFuture } from "date-fns";
import { getComputedDeadline } from "@/data/county-filing-instructions";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reduced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-red-50 text-red-700 border-red-200",
};

export function Dashboard() {
  const { data: grievances, isLoading } = useGrievances();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalCases = grievances?.length || 0;
  const reducedCases = grievances?.filter(g => g.status === 'reduced').length || 0;

  function resolveDeadline(g: { filingDeadline?: string | null; county: string; state?: string | null }): Date | null {
    const src = g.filingDeadline || getComputedDeadline(g.county, g.state ?? undefined);
    if (!src) return null;
    try { const d = parseISO(src); return isValid(d) ? d : null; } catch { return null; }
  }

  const upcomingCount = grievances?.filter(g => {
    if (["submitted","pending","reduced","denied"].includes(g.status)) return false;
    const d = resolveDeadline(g);
    return d ? isFuture(d) : false;
  }).length || 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 shadow-xl shadow-primary/10">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Decorative background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>File your own grievance and save 50% commission</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight text-white">
              Take Control of Your <br/><span className="text-accent">Property Taxes</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
              Filing a grievance is your legal right and cannot increase your taxes. Build your case, track comparables, and submit with confidence.
            </p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform">
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Create New Grievance Case</DialogTitle>
                  <DialogDescription>
                    Enter the basic details from your Notice of Tentative Assessment.
                  </DialogDescription>
                </DialogHeader>
                <GrievanceForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
              <h3 className="text-3xl font-bold font-serif">{totalCases}</h3>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Successful Reductions</p>
              <h3 className="text-3xl font-bold font-serif">{reducedCases}</h3>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</p>
              <h3 className="text-3xl font-bold font-serif">{upcomingCount}</h3>
            </div>
          </div>
        </div>

        {/* Confidence Teaser */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">Why file yourself?</h2>
              <p className="text-sm text-muted-foreground mt-0.5">The facts that make this a no-brainer</p>
            </div>
            <Link href="/how-it-works">
              <Button variant="outline" size="sm" className="font-medium gap-1.5">
                Full breakdown <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            {[
              { icon: Award,         value: "~80%",  label: "DIY success rate",         sub: "Nassau County, 2024",            color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: DollarSign,    value: "$0",    label: "Cost to file",             sub: "No fee unless you go to SCAR ($30)", color: "text-blue-600",    bg: "bg-blue-50"   },
              { icon: AlertTriangle, value: "$0",    label: "Risk of filing",           sub: "Taxes cannot go up",             color: "text-amber-600",   bg: "bg-amber-50"  },
              { icon: TrendingDown,  value: "50%",   label: "Commission saved",         sub: "vs. hiring a firm",              color: "text-violet-600",  bg: "bg-violet-50" },
            ].map(({ icon: Icon, value, label, sub, color, bg }) => (
              <div key={label} className="flex flex-col items-center text-center p-5 gap-2 hover:bg-secondary/30 transition-colors">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-extrabold font-serif ${color}`}>{value}</div>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-tight">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2 text-sm text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>New York law guarantees:</strong> filing a grievance cannot raise your assessment. The worst outcome is no change.
            </span>
          </div>
        </div>

        {/* Case List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-foreground">Your Cases</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-secondary/50 animate-pulse rounded-2xl border border-border"></div>
              ))}
            </div>
          ) : grievances?.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No cases yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Start by creating a grievance case for your property to begin tracking assessment details and comparables.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="font-medium">
                Create First Case
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grievances?.map((g) => (
                <Link key={g.id} href={`/grievances/${g.id}`}>
                  <div className="group bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {g.propertyAddress}
                        </h3>
                        <p className="text-sm text-muted-foreground">{g.municipality}, {g.county} County</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const s = (g as any).state;
                          if (!s || s === "NY") return null;
                          const badgeClass =
                            s === "TX" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            s === "FL" ? "bg-green-100 text-green-700 border border-green-200" :
                            "bg-cyan-100 text-cyan-700 border border-cyan-200";
                          return (
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${badgeClass}`}>
                              {s}
                            </span>
                          );
                        })()}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${STATUS_COLORS[g.status as keyof typeof STATUS_COLORS]}`}>
                          {g.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 my-4 bg-secondary/30 p-4 rounded-xl">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Assessment</p>
                        <p className="font-semibold">${g.currentAssessment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Requested</p>
                        <p className="font-semibold text-emerald-600">${g.requestedAssessment.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          const d = resolveDeadline(g);
                          if (!d) return 'No deadline set';
                          const isPast = !isFuture(d);
                          return (
                            <span className={isPast ? 'text-red-600 font-medium' : ''}>
                              {isPast ? 'Deadline passed · ' : ''}{format(d, 'MMM d, yyyy')}
                              {!g.filingDeadline && <span className="ml-1 text-xs opacity-60">(county standard)</span>}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-primary font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                        Manage Case <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
