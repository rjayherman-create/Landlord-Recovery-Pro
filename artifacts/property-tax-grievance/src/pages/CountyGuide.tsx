import { AppLayout } from "@/components/layout/AppLayout";
import { useCounties } from "@/hooks/use-counties";
import { Map, ExternalLink, CalendarDays, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CountyGuide() {
  const { data: counties, isLoading } = useCounties();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">New York County Guide</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Property tax grievance procedures vary significantly by county and municipality in New York State. Find your county below to understand the specific forms, deadlines, and portals required.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-card rounded-2xl border border-border animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {counties?.map((county) => (
              <div key={county.id} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-primary">{county.name}</h2>
                    <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded mt-1">
                      {county.region} Region
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Map className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-4 flex-grow my-4">
                  <div className="flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Required Form</p>
                      <p className="text-sm text-muted-foreground">{county.formRequired}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Deadline / Grievance Day</p>
                      <p className="text-sm text-muted-foreground">{county.deadline || county.grievanceDay || "Varies by municipality"}</p>
                    </div>
                  </div>

                  <div className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/80 mt-2 border border-border/50">
                    {county.notes}
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-auto">
                  {county.filingPortal ? (
                    <a href={county.filingPortal} target="_blank" rel="noreferrer" className="w-full block">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                        Access Filing Portal <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <p className="text-xs text-center text-muted-foreground italic">
                      Paper filing required or check specific municipality website.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
