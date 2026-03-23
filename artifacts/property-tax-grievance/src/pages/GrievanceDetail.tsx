import { useRoute } from "wouter";
import { useGrievance, useUpdateGrievance, useDeleteGrievance } from "@/hooks/use-grievances";
import { useComparables, useAddComparable, useDeleteComparable } from "@/hooks/use-comparables";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GrievanceForm } from "@/components/GrievanceForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { MapPin, Building, Calendar, DollarSign, Trash2, Edit, AlertCircle, ArrowLeft, ArrowDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reduced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-red-50 text-red-700 border-red-200",
};

const compSchema = z.object({
  address: z.string().min(5, "Address is required"),
  salePrice: z.coerce.number().positive(),
  saleDate: z.string(),
  squareFeet: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  assessedValue: z.coerce.number().optional(),
});

type CompFormValues = z.infer<typeof compSchema>;

export function GrievanceDetail() {
  const [, params] = useRoute("/grievances/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: grievance, isLoading } = useGrievance(id);
  const { data: comparables } = useComparables(id);
  const updateMutation = useUpdateGrievance();
  const deleteGrievanceMutation = useDeleteGrievance();
  const addCompMutation = useAddComparable(id);
  const deleteCompMutation = useDeleteComparable(id);
  
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);

  const compForm = useForm<CompFormValues>({
    resolver: zodResolver(compSchema),
  });

  const onStatusChange = async (newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: newStatus as any }
      });
      toast({ title: "Status updated" });
    } catch (e) {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const onAddComp = async (data: CompFormValues) => {
    try {
      await addCompMutation.mutateAsync({
        data: {
          grievanceId: id,
          ...data,
        }
      });
      toast({ title: "Comparable added" });
      setIsAddCompOpen(false);
      compForm.reset();
    } catch (e) {
      toast({ title: "Error adding comparable", variant: "destructive" });
    }
  };

  const handleDeleteComp = async (compId: number) => {
    if (confirm("Remove this comparable?")) {
      await deleteCompMutation.mutateAsync({ id: compId });
      toast({ title: "Comparable removed" });
    }
  };

  if (isLoading) return <AppLayout><div className="animate-pulse h-96 bg-secondary/50 rounded-2xl"></div></AppLayout>;
  if (!grievance) return <AppLayout><div className="text-center py-20">Case not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {grievance.propertyAddress}
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {grievance.municipality}, {grievance.county}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Tax Year {grievance.taxYear}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={grievance.status} onValueChange={onStatusChange}>
              <SelectTrigger className={`w-[140px] border-2 font-medium uppercase text-xs tracking-wider ${STATUS_COLORS[grievance.status as keyof typeof STATUS_COLORS]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reduced">Reduced</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-border shadow-sm">
                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Edit Grievance</DialogTitle>
                </DialogHeader>
                <GrievanceForm initialData={grievance} onSuccess={() => setIsEditOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> Case Details
            </h3>
            
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground mb-1">Owner Name</dt>
                <dd className="font-medium text-foreground">{grievance.ownerName}</dd>
              </div>
              <div className="pt-3 border-t border-border/50">
                <dt className="text-muted-foreground mb-1">Current Assessment</dt>
                <dd className="font-medium text-foreground text-lg">${grievance.currentAssessment.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Equalization Rate</dt>
                <dd className="font-medium text-foreground">{grievance.equalizationRate ? `${(grievance.equalizationRate * 100).toFixed(2)}%` : 'N/A'}</dd>
              </div>
              <div className="pt-3 border-t border-border/50">
                <dt className="text-muted-foreground mb-1">Estimated Market Value</dt>
                <dd className="font-medium text-foreground">${grievance.estimatedMarketValue.toLocaleString()}</dd>
              </div>
              <div className="bg-emerald-50/50 -mx-6 px-6 py-4 mt-4 border-y border-emerald-100">
                <dt className="text-emerald-700 font-medium mb-1">Requested Assessment</dt>
                <dd className="font-bold text-emerald-800 text-xl">${grievance.requestedAssessment.toLocaleString()}</dd>
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowDown className="w-3 h-3" /> 
                  Reduction of ${Math.max(0, grievance.currentAssessment - grievance.requestedAssessment).toLocaleString()}
                </div>
              </div>
              <div className="pt-2">
                <dt className="text-muted-foreground mb-1">Filing Deadline</dt>
                <dd className="font-medium text-foreground flex items-center gap-2">
                  {grievance.filingDeadline ? format(new Date(grievance.filingDeadline), 'MMMM d, yyyy') : 'Not specified'}
                  {grievance.filingDeadline && new Date(grievance.filingDeadline) < new Date() && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">PASSED</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {grievance.notes && (
            <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-6">
              <h3 className="font-serif font-bold text-amber-900 text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Notes
              </h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{grievance.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Comparables */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif font-bold text-xl flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Comparable Sales
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Properties similar to yours that sold recently for less than your implied market value.
                </p>
              </div>
              
              <Dialog open={isAddCompOpen} onOpenChange={setIsAddCompOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                    Add Comparable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Add Comparable Sale</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={compForm.handleSubmit(onAddComp)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input {...compForm.register("address")} placeholder="456 Neighbor St" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sale Price ($)</Label>
                        <Input type="number" {...compForm.register("salePrice")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Date</Label>
                        <Input type="date" {...compForm.register("saleDate")} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Sq Ft</Label>
                        <Input type="number" {...compForm.register("squareFeet")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Beds</Label>
                        <Input type="number" {...compForm.register("bedrooms")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Baths</Label>
                        <Input type="number" step="0.5" {...compForm.register("bathrooms")} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={addCompMutation.isPending}>
                      {addCompMutation.isPending ? "Adding..." : "Save Comparable"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {(!comparables || comparables.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No comparables added yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Aim for 3-5 recent sales of similar homes in your neighborhood.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg font-medium">Address</th>
                      <th className="px-4 py-3 font-medium">Sale Price</th>
                      <th className="px-4 py-3 font-medium">Sale Date</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparables.map((comp) => (
                      <tr key={comp.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-4 font-medium text-foreground">{comp.address}</td>
                        <td className="px-4 py-4 font-bold text-emerald-700">${comp.salePrice.toLocaleString()}</td>
                        <td className="px-4 py-4 text-muted-foreground">{format(new Date(comp.saleDate), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          {comp.squareFeet && `${comp.squareFeet} sqft`}
                          {comp.bedrooms && ` • ${comp.bedrooms}bd`}
                          {comp.bathrooms && `/${comp.bathrooms}ba`}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteComp(comp.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Analysis Box */}
            {comparables && comparables.length > 0 && (
              <div className="mt-6 p-4 bg-primary text-primary-foreground rounded-xl shadow-inner">
                <h4 className="font-serif font-bold flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-accent" /> Comparable Analysis
                </h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  Average sale price of comparables: <strong className="text-accent">${Math.round(comparables.reduce((a,b)=>a+b.salePrice,0)/comparables.length).toLocaleString()}</strong>. 
                  If this is significantly lower than your Estimated Market Value of ${grievance.estimatedMarketValue.toLocaleString()}, you have a strong case for reduction.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
