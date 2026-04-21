import { useGetLandlordStats, useListLandlordCases } from "@workspace/api-client-react";
import { Link } from "wouter";
import { PlusCircle, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge, ClaimTypeBadge } from "@/components/shared/CaseStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetLandlordStats();
  const { data: cases, isLoading: casesLoading } = useListLandlordCases();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const recentCases = cases?.slice(0, 5) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your recovery efforts.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <Link href="/cases/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Claimed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.totalClaimed || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recovered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalRecovered || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Cases</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats?.activeCases || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Won Cases</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats?.wonCases || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Cases</h2>
          {cases && cases.length > 0 && (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/cases">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {casesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 border-border shadow-sm">
                <Skeleton className="h-12 w-full" />
              </Card>
            ))}
          </div>
        ) : recentCases.length > 0 ? (
          <div className="grid gap-3">
            {recentCases.map((caseItem, idx) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className="p-4 border-border shadow-sm hover-elevate cursor-pointer transition-all animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-primary">{caseItem.tenantName}</h3>
                        <CaseStatusBadge status={caseItem.status} />
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{caseItem.propertyAddress}</span>
                        <span>•</span>
                        <ClaimTypeBadge type={caseItem.claimType} />
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-bold text-lg text-foreground">{formatCurrency(caseItem.claimAmount)}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{caseItem.state}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No cases yet" 
            description="Start recovering your losses by documenting your first case and sending a formal demand letter."
            actionLabel="Start a New Case"
            actionHref="/cases/new"
          />
        )}
      </div>
    </div>
  );
}
