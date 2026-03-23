import { useRoute, Link } from "wouter";
import { useGrievance, useUpdateGrievance, useDeleteGrievance } from "@/hooks/use-grievances";
import { useComparables, useAddComparable, useDeleteComparable } from "@/hooks/use-comparables";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GrievanceForm } from "@/components/GrievanceForm";
import { RP524PrintForm } from "@/components/RP524PrintForm";
import { CompsResearch } from "@/components/CompsResearch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  MapPin, Building, Calendar, DollarSign, Trash2, Edit, AlertCircle, ArrowLeft, ArrowDown,
  Printer, Search, ExternalLink, Plus, Phone, Mail, Home, Hash, Ruler
} from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reduced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-red-50 text-red-700 border-red-200",
};

const compSchema = z.object({
  address: z.string().min(5, "Address is required"),
  salePrice: z.coerce.number().positive("Required"),
  saleDate: z.string().min(1, "Required"),
  squareFeet: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  assessedValue: z.coerce.number().optional(),
  lotSize: z.string().optional(),
  yearBuilt: z.coerce.number().optional(),
  distance: z.string().optional(),
  sourceUrl: z.string().optional(),
  notes: z.string().optional(),
});

type CompFormValues = z.infer<typeof compSchema>;

export function GrievanceDetail() {
  const [, params] = useRoute("/grievances/:id");
  const id = parseInt(params?.id || "0");

  const { data: grievance, isLoading } = useGrievance(id);
  const { data: comparables = [] } = useComparables(id);
  const updateMutation = useUpdateGrievance();
  const deleteGrievanceMutation = useDeleteGrievance();
  const addCompMutation = useAddComparable(id);
  const deleteCompMutation = useDeleteComparable(id);

  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const compForm = useForm<CompFormValues>({ resolver: zodResolver(compSchema) });

  const onStatusChange = async (newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: newStatus as any } });
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const onAddComp = async (data: CompFormValues) => {
    try {
      await addCompMutation.mutateAsync({ data: { grievanceId: id, ...data } });
      toast({ title: "Comparable added" });
      setIsAddCompOpen(false);
      compForm.reset();
    } catch {
      toast({ title: "Error adding comparable", variant: "destructive" });
    }
  };

  const handleDeleteComp = async (compId: number) => {
    if (confirm("Remove this comparable?")) {
      await deleteCompMutation.mutateAsync({ id: compId });
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("rp524-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RP-524 — ${grievance?.propertyAddress}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; background: #fff; }
            @media print { body { margin: 0; } @page { margin: 0.5in; size: letter; } }
            .border { border-width: 1px; border-style: solid; }
            .border-gray-400 { border-color: #9ca3af; }
            .border-gray-800 { border-color: #1f2937; }
            .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
            .border-t { border-top-width: 1px; border-top-style: solid; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-50 { background-color: #f9fafb; }
            .text-white { color: #fff; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-900 { color: #111827; }
            .text-gray-500 { color: #6b7280; }
            .text-red-700 { color: #b91c1c; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 800; }
            .font-mono { font-family: monospace; }
            .font-medium { font-weight: 500; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .uppercase { text-transform: uppercase; }
            .tracking-wide { letter-spacing: 0.025em; }
            .italic { font-style: italic; }
            .leading-tight { line-height: 1.25; }
            .leading-relaxed { line-height: 1.625; }
            .leading-none { line-height: 1; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .gap-px { gap: 1px; }
            .gap-4 { gap: 16px; }
            .gap-6 { gap: 24px; }
            .gap-8 { gap: 32px; }
            .gap-1 { gap: 4px; }
            .gap-1\\.5 { gap: 6px; }
            .gap-2 { gap: 8px; }
            .flex { display: flex; }
            .flex-1 { flex: 1; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .mb-0\\.5 { margin-bottom: 2px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-0\\.5 { margin-top: 2px; }
            .pt-0\\.5 { padding-top: 2px; }
            .pt-1 { padding-top: 4px; }
            .pt-2 { padding-top: 8px; }
            .px-1 { padding-left: 4px; padding-right: 4px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .p-1 { padding: 4px; }
            .p-2 { padding: 8px; }
            .pb-1 { padding-bottom: 4px; }
            .col-span-2 { grid-column: span 2; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #9ca3af; padding: 2px 4px; }
            th { background-color: #f3f4f6; font-weight: 700; }
            .w-3\\.5 { width: 14px; }
            .h-3\\.5 { height: 14px; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (isLoading) return <AppLayout><div className="animate-pulse h-96 bg-secondary/50 rounded-2xl" /></AppLayout>;
  if (!grievance) return <AppLayout><div className="text-center py-20">Case not found</div></AppLayout>;

  const avgCompPrice = comparables.length > 0
    ? Math.round(comparables.reduce((a, b) => a + b.salePrice, 0) / comparables.length)
    : null;

  const equalizationRate = grievance.equalizationRate ?? 1;
  const impliedFullValue = equalizationRate > 0
    ? Math.round(grievance.currentAssessment / (equalizationRate / 100))
    : grievance.currentAssessment;

  return (
    <AppLayout>
      {/* Hidden print content */}
      <div className="hidden">
        <div ref={printRef}>
          <RP524PrintForm grievance={grievance} comparables={comparables} />
        </div>
      </div>

      {/* Back + Header */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {grievance.propertyAddress}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {grievance.municipality}, {grievance.county}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Tax Year {grievance.taxYear}</span>
              {grievance.parcelId && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Hash className="w-4 h-4" /> SBL: {grievance.parcelId}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={grievance.status} onValueChange={onStatusChange}>
              <SelectTrigger className={`w-[140px] border-2 font-medium uppercase text-xs tracking-wider ${STATUS_COLORS[grievance.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["draft","submitted","pending","reduced","denied"].map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-border shadow-sm gap-2"
            >
              <Printer className="w-4 h-4" />
              Print RP-524
            </Button>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-border shadow-sm gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Edit Grievance</DialogTitle>
                </DialogHeader>
                <GrievanceForm initialData={grievance} onSuccess={() => setIsEditOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Alert: print RP-524 */}
      {grievance.status === "draft" && (
        <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Printer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Ready to file?</strong> Click <strong>Print RP-524</strong> above to generate your pre-filled legal complaint form.
            For Nassau County, use the <a href="https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html" target="_blank" rel="noopener noreferrer" className="underline">AROW portal</a> (AR-1 form).
            For NYC, use the <a href="https://www.nyc.gov/site/taxcommission/index.page" target="_blank" rel="noopener noreferrer" className="underline">NYC Tax Commission</a>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Case Details */}
        <div className="lg:col-span-1 space-y-5">
          {/* Owner Info */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-serif font-bold text-base mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" /> Owner / Complainant
            </h3>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Name</dt>
                <dd className="font-medium">{grievance.ownerName}</dd>
              </div>
              {grievance.ownerPhone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{grievance.ownerPhone}</span>
                </div>
              )}
              {grievance.ownerEmail && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span>{grievance.ownerEmail}</span>
                </div>
              )}
              {grievance.ownerMailingAddress && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Mailing Address</dt>
                  <dd className="text-muted-foreground text-xs">{grievance.ownerMailingAddress}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Property Info */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-serif font-bold text-base mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Property Details
            </h3>
            <dl className="space-y-2.5 text-sm">
              {grievance.schoolDistrict && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">School District</dt>
                  <dd className="font-medium">{grievance.schoolDistrict}</dd>
                </div>
              )}
              {grievance.parcelId && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Parcel ID (SBL)</dt>
                  <dd className="font-mono text-xs bg-secondary/50 px-2 py-1 rounded">{grievance.parcelId}</dd>
                </div>
              )}
              {grievance.propertyClass && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Property Class</dt>
                  <dd className="font-medium">{grievance.propertyClass}</dd>
                </div>
              )}
              <div className="flex gap-4">
                {grievance.yearBuilt && (
                  <div>
                    <dt className="text-muted-foreground text-xs mb-0.5">Year Built</dt>
                    <dd className="font-medium">{grievance.yearBuilt}</dd>
                  </div>
                )}
                {grievance.livingArea && (
                  <div>
                    <dt className="text-muted-foreground text-xs mb-0.5">Living Area</dt>
                    <dd className="font-medium">{grievance.livingArea.toLocaleString()} sq ft</dd>
                  </div>
                )}
              </div>
              {grievance.lotSize && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Lot Size</dt>
                  <dd className="font-medium">{grievance.lotSize}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Assessment */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-serif font-bold text-base mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Assessment Figures
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Current Assessment</dt>
                <dd className="font-bold text-lg">${grievance.currentAssessment.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Equalization Rate</dt>
                <dd className="font-medium">{grievance.equalizationRate != null ? `${grievance.equalizationRate}%` : "N/A"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Implied Full Market Value</dt>
                <dd className="font-medium">${impliedFullValue.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Your Est. Market Value</dt>
                <dd className="font-bold text-base">${grievance.estimatedMarketValue.toLocaleString()}</dd>
              </div>
              <div className="bg-emerald-50 -mx-5 px-5 py-3 border-y border-emerald-100 mt-1">
                <dt className="text-emerald-700 font-medium text-xs mb-0.5">Requested Assessment</dt>
                <dd className="font-extrabold text-emerald-800 text-xl">${grievance.requestedAssessment.toLocaleString()}</dd>
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowDown className="w-3 h-3" />
                  Reduction of ${Math.max(0, grievance.currentAssessment - grievance.requestedAssessment).toLocaleString()}
                </div>
              </div>
              {grievance.basisOfComplaint && (
                <div className="pt-1">
                  <dt className="text-muted-foreground text-xs mb-0.5">Basis of Complaint</dt>
                  <dd className="capitalize font-medium text-xs bg-secondary/60 px-2 py-1 rounded">{grievance.basisOfComplaint}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">Filing Deadline</dt>
                <dd className="font-medium flex items-center gap-2">
                  {grievance.filingDeadline
                    ? format(new Date(grievance.filingDeadline), "MMMM d, yyyy")
                    : "Not specified"}
                  {grievance.filingDeadline && new Date(grievance.filingDeadline) < new Date() && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">PASSED</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {grievance.notes && (
            <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5">
              <h3 className="font-serif font-bold text-amber-900 text-base mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Property Notes
              </h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{grievance.notes}</p>
            </div>
          )}
        </div>

        {/* Right column: Comps + Research */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="comps">
            <TabsList className="mb-4">
              <TabsTrigger value="comps" className="gap-2">
                <MapPin className="w-4 h-4" />
                Comparable Sales
                {comparables.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 ml-1 font-bold">
                    {comparables.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="research" className="gap-2">
                <Search className="w-4 h-4" />
                Find Comps
              </TabsTrigger>
              <TabsTrigger value="print" className="gap-2">
                <Printer className="w-4 h-4" />
                Print Form
              </TabsTrigger>
            </TabsList>

            {/* Tab: Comparables List */}
            <TabsContent value="comps">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg">Comparable Sales</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Properties similar to yours that sold recently for less than your assessed value implies. Aim for 3–6 comps.
                    </p>
                  </div>
                  <Dialog open={isAddCompOpen} onOpenChange={setIsAddCompOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 shadow-md">
                        <Plus className="w-4 h-4" /> Add Comp
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Add Comparable Sale</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                          Enter a property that sold recently for less than your assessed value implies.
                        </p>
                      </DialogHeader>
                      <form onSubmit={compForm.handleSubmit(onAddComp)} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label>Property Address *</Label>
                          <Input {...compForm.register("address")} placeholder="456 Neighbor Ave, Town, NY 11000" />
                          {compForm.formState.errors.address && (
                            <p className="text-xs text-destructive">{compForm.formState.errors.address.message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Sale Price ($) *</Label>
                            <Input type="number" {...compForm.register("salePrice")} placeholder="480000" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Sale Date *</Label>
                            <Input type="date" {...compForm.register("saleDate")} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label>Sq Ft</Label>
                            <Input type="number" {...compForm.register("squareFeet")} placeholder="1800" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Beds</Label>
                            <Input type="number" {...compForm.register("bedrooms")} placeholder="3" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Baths</Label>
                            <Input type="number" step="0.5" {...compForm.register("bathrooms")} placeholder="2" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Assessed Value ($)</Label>
                            <Input type="number" {...compForm.register("assessedValue")} placeholder="11000" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Year Built</Label>
                            <Input type="number" {...compForm.register("yearBuilt")} placeholder="1975" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Lot Size</Label>
                            <Input {...compForm.register("lotSize")} placeholder="0.25 acres" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Distance from your property</Label>
                            <Input {...compForm.register("distance")} placeholder="0.3 miles" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Source URL</Label>
                          <Input type="url" {...compForm.register("sourceUrl")} placeholder="https://www.zillow.com/..." />
                          <p className="text-xs text-muted-foreground">Link to Zillow, ACRIS, or county record where you found this sale.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Notes</Label>
                          <Input {...compForm.register("notes")} placeholder="Similar colonial, corner lot, same school district" />
                        </div>
                        <Button type="submit" className="w-full" disabled={addCompMutation.isPending}>
                          {addCompMutation.isPending ? "Saving..." : "Save Comparable"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {comparables.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-muted-foreground font-medium">No comparables yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Add 3–6 nearby properties that sold recently for less than your implied market value. 
                      Use the "Find Comps" tab to locate good candidates.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/50 text-muted-foreground text-xs">
                        <tr>
                          <th className="px-3 py-2.5 rounded-tl-lg font-medium">Address</th>
                          <th className="px-3 py-2.5 font-medium">Sale Price</th>
                          <th className="px-3 py-2.5 font-medium">Date</th>
                          <th className="px-3 py-2.5 font-medium">Details</th>
                          <th className="px-3 py-2.5 font-medium">Source</th>
                          <th className="px-3 py-2.5 rounded-tr-lg text-right font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparables.map((comp) => (
                          <tr key={comp.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                            <td className="px-3 py-3 font-medium text-foreground">
                              <div>{comp.address}</div>
                              {comp.distance && <div className="text-xs text-muted-foreground">{comp.distance} away</div>}
                            </td>
                            <td className="px-3 py-3 font-bold text-emerald-700">${comp.salePrice.toLocaleString()}</td>
                            <td className="px-3 py-3 text-muted-foreground text-xs">{comp.saleDate}</td>
                            <td className="px-3 py-3 text-muted-foreground text-xs">
                              {comp.squareFeet && <span>{comp.squareFeet.toLocaleString()} sqft</span>}
                              {comp.bedrooms && <span> · {comp.bedrooms}bd</span>}
                              {comp.bathrooms && <span>/{comp.bathrooms}ba</span>}
                              {comp.yearBuilt && <span> · {comp.yearBuilt}</span>}
                            </td>
                            <td className="px-3 py-3">
                              {comp.sourceUrl && (
                                <a href={comp.sourceUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 text-xs">
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteComp(comp.id)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {comparables.length > 0 && (
                  <div className="mt-5 p-4 bg-primary text-primary-foreground rounded-xl">
                    <h4 className="font-serif font-bold flex items-center gap-2 mb-2 text-sm">
                      <DollarSign className="w-4 h-4" /> Case Strength Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="opacity-80 text-xs mb-0.5">Avg Comparable Sale</div>
                        <div className="font-bold text-lg">${avgCompPrice?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="opacity-80 text-xs mb-0.5">Your Assessed Full Value</div>
                        <div className="font-bold text-lg">${impliedFullValue.toLocaleString()}</div>
                      </div>
                    </div>
                    {avgCompPrice && avgCompPrice < impliedFullValue ? (
                      <p className="text-xs mt-2 opacity-90 leading-relaxed">
                        ✓ <strong>Strong case.</strong> Comparable sales average ${avgCompPrice.toLocaleString()}, which is ${(impliedFullValue - avgCompPrice).toLocaleString()} less than your assessed full value of ${impliedFullValue.toLocaleString()}. 
                        This demonstrates overvaluation.
                      </p>
                    ) : (
                      <p className="text-xs mt-2 opacity-80 leading-relaxed">
                        Add more comparables with lower sale prices to strengthen your case.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Research */}
            <TabsContent value="research">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <CompsResearch county={grievance.county} />
              </div>
            </TabsContent>

            {/* Tab: Print Preview */}
            <TabsContent value="print">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                  <div>
                    <h3 className="font-semibold text-base">RP-524 — Pre-filled Legal Complaint Form</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review your form below, then click Print to send to your printer or save as PDF.
                    </p>
                  </div>
                  <Button onClick={handlePrint} className="gap-2 shadow-md">
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </Button>
                </div>

                {/* Nassau-specific note */}
                {grievance.county === "Nassau" && (
                  <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Nassau County:</strong> File using the{" "}
                      <a href="https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html" target="_blank" rel="noopener noreferrer" className="underline">
                        AROW portal
                      </a>{" "}
                      with the AR-1 form instead. This RP-524 is useful for Suffolk, Westchester, and upstate NY.
                    </span>
                  </div>
                )}
                {grievance.county === "New York City" && (
                  <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>NYC:</strong> File using the{" "}
                      <a href="https://www.nyc.gov/site/taxcommission/index.page" target="_blank" rel="noopener noreferrer" className="underline">
                        NYC Tax Commission
                      </a>{" "}
                      TC101/TC201 form. The RP-524 below is for reference.
                    </span>
                  </div>
                )}

                <div className="p-4 overflow-auto bg-gray-100" style={{ minHeight: 400 }}>
                  <div className="bg-white shadow-md rounded" style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "117%" }}>
                    <RP524PrintForm grievance={grievance} comparables={comparables} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
