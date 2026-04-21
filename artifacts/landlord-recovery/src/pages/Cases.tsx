import { useState, useMemo } from "react";
import { useListLandlordCases, useDeleteLandlordCase } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { PlusCircle, Search, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseStatusBadge, ClaimTypeBadge } from "@/components/shared/CaseStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Cases() {
  const { data: cases, isLoading } = useListLandlordCases();
  const deleteCase = useDeleteLandlordCase();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter(c => {
      const matchesSearch = c.tenantName.toLowerCase().includes(search.toLowerCase()) || 
                            c.propertyAddress.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesType = typeFilter === "all" || c.claimType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [cases, search, statusFilter, typeFilter]);

  const pendingDeleteCase = cases?.find(c => c.id === pendingDeleteId);

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    deleteCase.mutate({ id: pendingDeleteId }, {
      onSuccess: () => {
        toast({ title: "Case Deleted" });
        queryClient.invalidateQueries({ queryKey: ["listLandlordCases"] });
        setPendingDeleteId(null);
        setDeletingId(null);
      },
      onError: () => {
        toast({ title: "Delete Failed", variant: "destructive" });
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">My Cases</h1>
          <p className="text-muted-foreground mt-1">Manage and track your recovery claims.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <Link href="/cases/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tenant or address..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="demand_sent">Demand Sent</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
              <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
              <SelectItem value="judgment">Judgment</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Claim Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="unpaid_rent">Unpaid Rent</SelectItem>
              <SelectItem value="property_damage">Property Damage</SelectItem>
              <SelectItem value="security_deposit">Security Deposit</SelectItem>
              <SelectItem value="lease_break">Lease Break</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-4 border-border shadow-sm">
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </>
        ) : filteredCases.length > 0 ? (
          filteredCases.map((caseItem, idx) => (
            <Card
              key={caseItem.id}
              className="p-5 border-border shadow-sm hover-elevate cursor-pointer transition-all group animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 30}ms` }}
              onClick={() => navigate(`/cases/${caseItem.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-primary group-hover:text-accent transition-colors">{caseItem.tenantName}</h3>
                    <CaseStatusBadge status={caseItem.status} />
                    <ClaimTypeBadge type={caseItem.claimType} />
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span>{caseItem.propertyAddress}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Created {new Date(caseItem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="font-bold text-xl text-foreground">{formatCurrency(caseItem.claimAmount)}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{caseItem.state}</div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Edit case"
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete case"
                      disabled={deletingId === caseItem.id}
                      onClick={() => setPendingDeleteId(caseItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="mt-8">
            <EmptyState 
              title="No cases found" 
              description={cases?.length === 0 ? "You haven't created any cases yet." : "No cases match your current filters."}
              actionLabel={cases?.length === 0 ? "Start a New Case" : undefined}
              actionHref={cases?.length === 0 ? "/cases/new" : undefined}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pendingDeleteId} onOpenChange={open => !open && setPendingDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Case?</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the case for <strong>{pendingDeleteCase?.tenantName}</strong> at {pendingDeleteCase?.propertyAddress}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={!!deletingId}>
              {deletingId ? "Deleting..." : "Delete Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
