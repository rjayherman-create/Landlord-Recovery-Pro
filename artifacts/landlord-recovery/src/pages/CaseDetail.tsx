import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetLandlordCase, 
  useUpdateLandlordCase, 
  useUpdateLandlordCaseStatus, 
  useDeleteLandlordCase, 
  useGenerateDemandLetter 
} from "@workspace/api-client-react";
import { 
  ArrowLeft, FileText, Send, AlertTriangle, Scale, CheckCircle2, 
  FileOutput, RefreshCw, Save, Trash2, Paperclip, Upload, X, FileImage, File, Library, Pencil, Archive, ArchiveRestore, Sparkles, Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DocumentLibrary } from "@/components/shared/DocumentLibrary";
import { CaseAdvisorChat } from "@/components/shared/CaseAdvisorChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CaseStatusBadge, ClaimTypeBadge } from "@/components/shared/CaseStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const STATUS_PROGRESS = [
  { id: "draft", label: "Draft" },
  { id: "demand_sent", label: "Demand Sent" },
  { id: "no_response", label: "No Response" },
  { id: "filed", label: "Filed" },
  { id: "hearing_scheduled", label: "Hearing" },
  { id: "judgment", label: "Judgment" },
  { id: "collection", label: "Collection" },
  { id: "closed", label: "Closed" }
];

export default function CaseDetail() {
  const { id } = useParams();
  const caseId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useState(); // For redirect on delete
  
  const { data: caseData, isLoading } = useGetLandlordCase(caseId, { 
    query: { enabled: !!caseId } 
  });
  
  const updateCase = useUpdateLandlordCase();
  const updateStatus = useUpdateLandlordCaseStatus();
  const deleteCase = useDeleteLandlordCase();
  const generateLetter = useGenerateDemandLetter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "advisor">("overview");

  // Edit case dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [generatingEditDesc, setGeneratingEditDesc] = useState(false);

  const handleGenerateEditDesc = async () => {
    if (!editForm.claimType || !editForm.state || !editForm.claimAmount) return;
    setGeneratingEditDesc(true);
    try {
      const resp = await fetch("/api/landlord-cases/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimType: editForm.claimType,
          state: editForm.state,
          claimAmount: parseFloat(editForm.claimAmount),
          monthlyRent: editForm.monthlyRent ? parseFloat(editForm.monthlyRent) : null,
          rentPeriod: null,
          tenantName: editForm.tenantName || null,
          propertyAddress: editForm.propertyAddress || null,
          leaseStartDate: editForm.leaseStartDate || null,
          moveOutDate: editForm.moveOutDate || null,
        }),
      });
      const data = await resp.json();
      if (data.description) {
        setEditForm(f => ({ ...f, description: data.description }));
        toast({ title: "Description generated", description: "Review and edit as needed." });
      }
    } catch {
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setGeneratingEditDesc(false);
    }
  };

  const openEdit = () => {
    if (!caseData) return;
    setEditForm({
      tenantName: caseData.tenantName || "",
      tenantEmail: caseData.tenantEmail || "",
      tenantPhone: caseData.tenantPhone || "",
      tenantAddress: caseData.tenantAddress || "",
      landlordName: caseData.landlordName || "",
      landlordCompany: (caseData as any).landlordCompany || "",
      landlordAddress: (caseData as any).landlordAddress || "",
      landlordEmail: caseData.landlordEmail || "",
      landlordPhone: caseData.landlordPhone || "",
      propertyAddress: caseData.propertyAddress || "",
      state: caseData.state || "",
      claimType: caseData.claimType || "",
      claimAmount: caseData.claimAmount != null ? String(caseData.claimAmount) : "",
      monthlyRent: caseData.monthlyRent != null ? String(caseData.monthlyRent) : "",
      monthsOwed: caseData.monthsOwed != null ? String(caseData.monthsOwed) : "",
      description: caseData.description || "",
      leaseStartDate: caseData.leaseStartDate || "",
      moveOutDate: caseData.moveOutDate || "",
      courtDate: caseData.courtDate || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    const payload: Record<string, any> = {
      tenantName: editForm.tenantName,
      tenantEmail: editForm.tenantEmail || null,
      tenantPhone: editForm.tenantPhone || null,
      tenantAddress: editForm.tenantAddress || null,
      landlordName: editForm.landlordName,
      landlordCompany: editForm.landlordCompany || null,
      landlordAddress: editForm.landlordAddress || null,
      landlordEmail: editForm.landlordEmail || null,
      landlordPhone: editForm.landlordPhone || null,
      propertyAddress: editForm.propertyAddress,
      state: editForm.state,
      claimType: editForm.claimType,
      claimAmount: editForm.claimAmount ? parseFloat(editForm.claimAmount) : 0,
      monthlyRent: editForm.monthlyRent ? parseFloat(editForm.monthlyRent) : null,
      monthsOwed: editForm.monthsOwed ? parseInt(editForm.monthsOwed) : null,
      description: editForm.description || null,
      leaseStartDate: editForm.leaseStartDate || null,
      moveOutDate: editForm.moveOutDate || null,
      courtDate: editForm.courtDate || null,
    };
    updateCase.mutate({ id: caseId, data: payload as any }, {
      onSuccess: () => {
        setIsEditOpen(false);
        toast({ title: "Case Updated" });
        queryClient.invalidateQueries({ queryKey: ["getLandlordCase", String(caseId)] });
        queryClient.invalidateQueries({ queryKey: ["listLandlordCases"] });
      },
      onError: () => {
        toast({ title: "Update Failed", variant: "destructive" });
      }
    });
  };

  // Local state for edits
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [letterText, setLetterText] = useState("");

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadCategory, setUploadCategory] = useState("lease");
  const [uploadNotes, setUploadNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/landlord-cases/${caseId}/attachments`);
      if (res.ok) setAttachments(await res.json());
    } catch {}
  }, [caseId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", uploadCategory);
      if (uploadNotes) fd.append("notes", uploadNotes);
      const res = await fetch(`/api/landlord-cases/${caseId}/attachments`, { method: "POST", body: fd });
      if (res.ok) {
        toast({ title: "File Uploaded", description: file.name });
        setUploadNotes("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchAttachments();
      } else {
        const err = await res.json();
        toast({ title: "Upload Failed", description: err.message || "Unknown error", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    setIsDeletingAttachment(id);
    try {
      await fetch(`/api/landlord-cases/${caseId}/attachments/${id}`, { method: "DELETE" });
      setAttachments(prev => prev.filter(a => a.id !== id));
      toast({ title: "File Removed" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    } finally {
      setIsDeletingAttachment(null);
    }
  };
  
  const initRef = useRef<number | null>(null);

  useEffect(() => {
    if (caseData && initRef.current !== caseData.id) {
      initRef.current = caseData.id;
      setNotes(caseData.notes || "");
      setLetterText(caseData.demandLetterText || "");
      fetchAttachments();
    }
  }, [caseData, fetchAttachments]);

  const docInitialValues = useMemo(() => ({
    landlord_name: caseData?.landlordName || "",
    landlord_company: (caseData as any)?.landlordCompany || "",
    landlord_address: (caseData as any)?.landlordAddress || "",
    tenant_name: caseData?.tenantName || "",
    property_address: caseData?.propertyAddress || "",
    tenant_mailing_address: caseData?.tenantAddress || "",
    state: caseData?.state || "",
    rent_amount: caseData?.claimAmount ? String(caseData.claimAmount) : "",
    monthly_rent: caseData?.monthlyRent ? String(caseData.monthlyRent) : "",
    months_count: caseData?.monthsOwed ? String(caseData.monthsOwed) : "",
    total_owed: caseData?.claimAmount ? String(caseData.claimAmount) : "",
    net_owed: caseData?.claimAmount ? String(caseData.claimAmount) : "",
    repair_cost: caseData?.claimAmount ? String(caseData.claimAmount) : "",
    move_out_date: caseData?.moveOutDate || "",
  }), [caseData]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return <div className="p-8 text-center">Case not found.</div>;
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleStatusChange = (newStatus: any) => {
    updateStatus.mutate({ id: caseId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Status Updated" });
        queryClient.invalidateQueries({ queryKey: ["getLandlordCase", String(caseId)] });
      }
    });
  };

  const handleSaveNotes = () => {
    updateCase.mutate({ id: caseId, data: { notes } }, {
      onSuccess: () => {
        setIsEditingNotes(false);
        toast({ title: "Notes Saved" });
        queryClient.invalidateQueries({ queryKey: ["getLandlordCase", String(caseId)] });
      }
    });
  };

  const handleSaveLetter = () => {
    updateCase.mutate({ id: caseId, data: { demandLetterText: letterText } }, {
      onSuccess: () => {
        setIsEditingLetter(false);
        toast({ title: "Letter Saved" });
        queryClient.invalidateQueries({ queryKey: ["getLandlordCase", String(caseId)] });
      }
    });
  };

  const handleGenerateLetter = () => {
    generateLetter.mutate({ id: caseId }, {
      onSuccess: (data) => {
        setLetterText(data.letter);
        setIsEditingLetter(true);
        toast({ title: "Letter Generated", description: "Review and edit the generated letter before saving." });
      },
      onError: () => {
        toast({ title: "Generation Failed", description: "Could not generate letter.", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    deleteCase.mutate({ id: caseId }, {
      onSuccess: () => {
        toast({ title: "Case Deleted" });
        window.location.href = "/landlord-recovery/cases"; // hard redirect
      }
    });
  };

  const handleToggleArchive = () => {
    const isCurrentlyArchived = !!(caseData as any)?.archived;
    updateCase.mutate({ id: caseId, data: { archived: !isCurrentlyArchived } as any }, {
      onSuccess: () => {
        toast({ title: isCurrentlyArchived ? "Case Restored" : "Case Archived" });
        queryClient.invalidateQueries({ queryKey: ["getLandlordCase", String(caseId)] });
        queryClient.invalidateQueries({ queryKey: ["listLandlordCases"] });
        if (!isCurrentlyArchived) {
          window.location.href = "/landlord-recovery/cases";
        }
      }
    });
  };

  const currentStatusIndex = STATUS_PROGRESS.findIndex(s => s.id === caseData.status);

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500">
      {/* Case Header — always visible */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-0 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/cases">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-foreground">{caseData.tenantName}</h1>
              <CaseStatusBadge status={caseData.status} />
              <ClaimTypeBadge type={caseData.claimType} />
            </div>
            <p className="text-muted-foreground mt-1">{caseData.propertyAddress}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openEdit}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Case
            </Button>
            {(caseData as any).archived ? (
              <Button variant="outline" onClick={handleToggleArchive} disabled={updateCase.isPending}>
                <ArchiveRestore className="h-4 w-4 mr-2" /> Restore
              </Button>
            ) : (
              <Button variant="outline" onClick={handleToggleArchive} disabled={updateCase.isPending}>
                <Archive className="h-4 w-4 mr-2" /> Archive
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Case?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the case and all associated data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteCase.isPending}>
                    {deleteCase.isPending ? "Deleting..." : "Delete Case"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Case Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Case</DialogTitle>
                <DialogDescription>Update the case details below.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-2">
                {/* Claim Info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Claim Info</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm mb-1 block">Claim Type</Label>
                      <Select value={editForm.claimType || ""} onValueChange={v => setEditForm(f => ({ ...f, claimType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid_rent">Unpaid Rent</SelectItem>
                          <SelectItem value="property_damage">Property Damage</SelectItem>
                          <SelectItem value="security_deposit">Security Deposit</SelectItem>
                          <SelectItem value="lease_break">Lease Break</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">State</Label>
                      <Select value={editForm.state || ""} onValueChange={v => setEditForm(f => ({ ...f, state: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Claim Amount ($)</Label>
                      <Input type="number" value={editForm.claimAmount || ""} onChange={e => setEditForm(f => ({ ...f, claimAmount: e.target.value }))} />
                    </div>
                    {editForm.claimType === "unpaid_rent" && (
                      <>
                        <div>
                          <Label className="text-sm mb-1 block">Monthly Rent ($)</Label>
                          <Input type="number" value={editForm.monthlyRent || ""} onChange={e => setEditForm(f => ({ ...f, monthlyRent: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-sm mb-1 block">Months Unpaid</Label>
                          <Input type="number" min="1" max="24" value={editForm.monthsOwed || ""} onChange={e => {
                            const months = e.target.value;
                            const rent = parseFloat(editForm.monthlyRent || "0");
                            const calc = rent && months ? String(rent * parseInt(months)) : editForm.claimAmount;
                            setEditForm(f => ({ ...f, monthsOwed: months, claimAmount: calc }));
                          }} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-sm">Description</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        disabled={generatingEditDesc || !editForm.claimType || !editForm.state || !editForm.claimAmount}
                        onClick={handleGenerateEditDesc}
                      >
                        {generatingEditDesc
                          ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                          : <><Sparkles className="h-3 w-3" /> Generate with AI</>
                        }
                      </Button>
                    </div>
                    <Textarea value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="min-h-[70px] text-sm" placeholder="Describe the case, or click Generate with AI above." />
                  </div>
                </div>

                {/* Property */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Property</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-sm mb-1 block">Property Address</Label>
                      <Input value={editForm.propertyAddress || ""} onChange={e => setEditForm(f => ({ ...f, propertyAddress: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Lease Start Date</Label>
                      <Input value={editForm.leaseStartDate || ""} onChange={e => setEditForm(f => ({ ...f, leaseStartDate: e.target.value }))} placeholder="e.g. Jan 1, 2023" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Move-Out Date</Label>
                      <Input value={editForm.moveOutDate || ""} onChange={e => setEditForm(f => ({ ...f, moveOutDate: e.target.value }))} placeholder="e.g. March 31, 2025" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Court Date</Label>
                      <Input value={editForm.courtDate || ""} onChange={e => setEditForm(f => ({ ...f, courtDate: e.target.value }))} placeholder="e.g. May 15, 2025" />
                    </div>
                  </div>
                </div>

                {/* Tenant */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tenant (Defendant)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm mb-1 block">Full Name *</Label>
                      <Input value={editForm.tenantName || ""} onChange={e => setEditForm(f => ({ ...f, tenantName: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Email</Label>
                      <Input type="email" value={editForm.tenantEmail || ""} onChange={e => setEditForm(f => ({ ...f, tenantEmail: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Phone</Label>
                      <Input value={editForm.tenantPhone || ""} onChange={e => setEditForm(f => ({ ...f, tenantPhone: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Current Address</Label>
                      <Input value={editForm.tenantAddress || ""} onChange={e => setEditForm(f => ({ ...f, tenantAddress: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Landlord */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Landlord (Plaintiff)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm mb-1 block">Full Legal Name *</Label>
                      <Input value={editForm.landlordName || ""} onChange={e => setEditForm(f => ({ ...f, landlordName: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Company / LLC Name</Label>
                      <Input placeholder="Doe Properties LLC" value={editForm.landlordCompany || ""} onChange={e => setEditForm(f => ({ ...f, landlordCompany: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm mb-1 block">Mailing Address <span className="text-muted-foreground font-normal text-xs">(appears on all letters)</span></Label>
                      <Input placeholder="123 Main St, City, ST 12345" value={editForm.landlordAddress || ""} onChange={e => setEditForm(f => ({ ...f, landlordAddress: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Email</Label>
                      <Input type="email" value={editForm.landlordEmail || ""} onChange={e => setEditForm(f => ({ ...f, landlordEmail: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Phone</Label>
                      <Input value={editForm.landlordPhone || ""} onChange={e => setEditForm(f => ({ ...f, landlordPhone: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={updateCase.isPending}>
                  {updateCase.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Library className="h-4 w-4" /> Documents
          </button>
          <button
            onClick={() => setActiveTab("advisor")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "advisor"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-base leading-none">✦</span> AI Advisor
          </button>
        </div>
      </div>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="flex-1 min-h-0 border-t border-border">
          <DocumentLibrary initialValues={docInitialValues} />
        </div>
      )}

      {/* AI Advisor Tab */}
      {activeTab === "advisor" && (
        <div className="flex-1 min-h-0 border-t border-border">
          <CaseAdvisorChat caseData={{
            id: caseData.id,
            tenantName: caseData.tenantName,
            landlordName: caseData.landlordName,
            propertyAddress: caseData.propertyAddress,
            state: caseData.state,
            claimType: caseData.claimType,
            claimAmount: Number(caseData.claimAmount),
            status: caseData.status,
            description: caseData.description,
            monthlyRent: caseData.monthlyRent ? Number(caseData.monthlyRent) : null,
            monthsOwed: caseData.monthsOwed ?? null,
            moveOutDate: caseData.moveOutDate,
            leaseStartDate: caseData.leaseStartDate,
          }} />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-20">

      {/* Progress Tracker */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="bg-muted/30 px-6 py-4 border-b border-border">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Case Progress</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 md:gap-0 md:justify-between relative">
            <div className="hidden md:block absolute top-1/2 left-4 right-4 h-0.5 bg-muted -translate-y-1/2 z-0"></div>
            <div 
              className="hidden md:block absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `calc(${(Math.max(0, currentStatusIndex) / (STATUS_PROGRESS.length - 1)) * 100}% - 2rem)` }}
            ></div>
            
            {STATUS_PROGRESS.map((step, idx) => {
              const isPast = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStatusChange(step.id)}
                  disabled={updateStatus.isPending}
                  className={`relative z-10 flex flex-col items-center gap-2 group p-2 rounded-md transition-colors ${!isCurrent && !isPast ? 'hover:bg-muted/50' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2
                    ${isPast ? 'bg-primary border-primary text-primary-foreground' : 
                      isCurrent ? 'bg-background border-primary text-primary ring-4 ring-primary/20' : 
                      'bg-background border-muted text-muted-foreground group-hover:border-primary/50'}`}>
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column - Main Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Demand Letter Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10 border-b">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Demand Letter
                </CardTitle>
                <CardDescription>Formal request for payment before filing.</CardDescription>
              </div>
              {!isEditingLetter && !caseData.demandLetterText && (
                <Button 
                  size="sm" 
                  onClick={handleGenerateLetter} 
                  disabled={generateLetter.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {generateLetter.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileOutput className="h-4 w-4 mr-2" />}
                  Generate with AI
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {isEditingLetter ? (
                <div className="space-y-4">
                  <Textarea 
                    value={letterText} 
                    onChange={(e) => setLetterText(e.target.value)}
                    className="min-h-[400px] font-mono text-sm leading-relaxed"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => {
                      setIsEditingLetter(false);
                      setLetterText(caseData.demandLetterText || "");
                    }}>Cancel</Button>
                    <Button onClick={handleSaveLetter} disabled={updateCase.isPending}>
                      <Save className="h-4 w-4 mr-2" /> Save Letter
                    </Button>
                  </div>
                </div>
              ) : letterText ? (
                <div>
                  <div className="bg-muted/20 border p-6 rounded-md font-serif text-sm leading-relaxed whitespace-pre-wrap h-[300px] overflow-y-auto relative">
                    {letterText}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingLetter(true)}>
                      Edit Letter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(letterText);
                      toast({ title: "Copied to clipboard" });
                    }}>
                      Copy Text
                    </Button>
                    {caseData.status === 'draft' && (
                      <Button size="sm" onClick={() => handleStatusChange('demand_sent')} className="ml-auto bg-primary text-primary-foreground">
                        <Send className="h-4 w-4 mr-2" /> Mark as Sent
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-md bg-muted/10">
                  <FileOutput className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground mb-4">No demand letter generated yet.</p>
                  <Button 
                    variant="outline"
                    onClick={handleGenerateLetter} 
                    disabled={generateLetter.isPending}
                  >
                    {generateLetter.isPending ? "Generating..." : "Generate AI Demand Letter"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Serve Tenant */}
          {["filed", "hearing_scheduled", "judgment", "collection", "closed"].includes(caseData.status) && (
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10 border-b">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Send className="h-5 w-5 mr-2 text-primary" />
                    Service of Process
                  </CardTitle>
                  <CardDescription>Official notification of the lawsuit to the tenant.</CardDescription>
                </div>
                {!(caseData as any).serviceMethod && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/cases/${caseId}/serve-tenant`}>Record Service</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-5">
                {(caseData as any).serviceMethod ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Service recorded</p>
                        <p className="text-sm text-muted-foreground">
                          {(caseData as any).serviceMethod?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          {(caseData as any).serviceDate && ` — served on ${(caseData as any).serviceDate}`}
                        </p>
                        {(caseData as any).serviceNotes && (
                          <p className="text-sm text-muted-foreground mt-1">{(caseData as any).serviceNotes}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs h-7" asChild>
                      <Link to={`/cases/${caseId}/serve-tenant`}>Update Service Record</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-md bg-muted/10">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2 opacity-60" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Service has not been recorded. The tenant must be officially served before your hearing.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/cases/${caseId}/serve-tenant`}>Record Tenant Service</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fact Sheet */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 bg-muted/10 border-b">
              <CardTitle className="text-lg flex items-center">
                <Scale className="h-5 w-5 mr-2 text-primary" />
                Case Facts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-foreground leading-relaxed bg-muted/30 p-3 rounded border border-border">{caseData.description}</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Claim Details</h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-1 border-border">
                        <dt className="text-muted-foreground">Amount</dt>
                        <dd className="font-bold text-foreground">{formatCurrency(caseData.claimAmount)}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-1 border-border">
                        <dt className="text-muted-foreground">Type</dt>
                        <dd className="font-medium">{caseData.claimType.replace('_', ' ').toUpperCase()}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-1 border-border">
                        <dt className="text-muted-foreground">State</dt>
                        <dd className="font-medium">{caseData.state}</dd>
                      </div>
                      {caseData.monthlyRent && (
                        <div className="flex justify-between border-b pb-1 border-border">
                          <dt className="text-muted-foreground">Monthly Rent</dt>
                          <dd className="font-medium">{formatCurrency(caseData.monthlyRent)}</dd>
                        </div>
                      )}
                      {caseData.claimType === "unpaid_rent" && caseData.monthsOwed && Number(caseData.monthsOwed) > 0 && (
                        <div className="flex justify-between border-b pb-1 border-border">
                          <dt className="text-muted-foreground">Months Unpaid</dt>
                          <dd className="font-medium">{caseData.monthsOwed}</dd>
                        </div>
                      )}
                    </dl>
                    {caseData.claimType === "unpaid_rent" && caseData.monthlyRent && caseData.monthsOwed && Number(caseData.monthsOwed) > 0 && (
                      <div className="mt-3 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {formatCurrency(caseData.monthlyRent)} &times; {caseData.monthsOwed} month{Number(caseData.monthsOwed) !== 1 ? "s" : ""}
                          </span>
                          <span className="font-bold text-foreground text-base">{formatCurrency(caseData.claimAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Dates</h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-1 border-border">
                        <dt className="text-muted-foreground">Created</dt>
                        <dd className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</dd>
                      </div>
                      {caseData.leaseStartDate && (
                        <div className="flex justify-between border-b pb-1 border-border">
                          <dt className="text-muted-foreground">Lease Start</dt>
                          <dd className="font-medium">{caseData.leaseStartDate}</dd>
                        </div>
                      )}
                      {caseData.moveOutDate && (
                        <div className="flex justify-between border-b pb-1 border-border">
                          <dt className="text-muted-foreground">Move Out</dt>
                          <dd className="font-medium">{caseData.moveOutDate}</dd>
                        </div>
                      )}
                      {caseData.courtDate && (
                        <div className="flex justify-between border-b pb-1 border-border">
                          <dt className="text-muted-foreground text-accent font-semibold">Court Date</dt>
                          <dd className="font-bold">{caseData.courtDate}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Attachments Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 bg-muted/10 border-b">
              <CardTitle className="text-lg flex items-center">
                <Paperclip className="h-5 w-5 mr-2 text-primary" />
                Attachments
              </CardTitle>
              <CardDescription>Lease, notices, photos, and supporting documents.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Upload Row */}
              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={e => setUploadCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="lease">Lease Agreement</option>
                      <option value="5_day_notice">5-Day Notice to Pay</option>
                      <option value="10_day_notice">10-Day Notice</option>
                      <option value="14_day_notice">14-Day Notice</option>
                      <option value="30_day_notice">30-Day Notice to Vacate</option>
                      <option value="photos">Photos / Evidence</option>
                      <option value="correspondence">Correspondence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Notes (optional)</label>
                    <Input
                      placeholder="e.g. Signed lease from 2023"
                      value={uploadNotes}
                      onChange={e => setUploadNotes(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx"
                      onChange={handleUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9"
                    >
                      {isUploading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploading ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Supports PDF, Word, images (JPG, PNG, WEBP). Max 25 MB.</p>
              </div>

              {/* File List */}
              {attachments.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No files attached yet. Upload your lease, notices, and supporting documents above.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {attachments.map((att: any) => {
                    const isImage = att.mimeType?.startsWith("image/");
                    const categoryLabel: Record<string, string> = {
                      lease: "Lease", "5_day_notice": "5-Day Notice", "10_day_notice": "10-Day Notice",
                      "14_day_notice": "14-Day Notice", "30_day_notice": "30-Day Notice",
                      photos: "Photos", correspondence: "Correspondence", other: "Other"
                    };
                    return (
                      <li key={att.id} className="flex items-start gap-3 py-3">
                        <div className="mt-0.5 text-muted-foreground">
                          {isImage ? <FileImage className="h-5 w-5" /> : <File className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline truncate block"
                          >
                            {att.fileName}
                          </a>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {categoryLabel[att.category] || att.category}
                            </span>
                            {att.fileSize && (
                              <span className="text-xs text-muted-foreground">
                                {(att.fileSize / 1024).toFixed(0)} KB
                              </span>
                            )}
                            {att.notes && (
                              <span className="text-xs text-muted-foreground italic">{att.notes}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          disabled={isDeletingAttachment === att.id}
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          {isDeletingAttachment === att.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Parties */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 bg-muted/10 border-b">
              <CardTitle className="text-base">Parties</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Defendant (Tenant)</span>
                <div className="font-medium">{caseData.tenantName}</div>
                {caseData.tenantEmail && <div className="text-muted-foreground mt-0.5">{caseData.tenantEmail}</div>}
                {caseData.tenantPhone && <div className="text-muted-foreground mt-0.5">{caseData.tenantPhone}</div>}
                {caseData.tenantAddress && <div className="text-muted-foreground mt-0.5">{caseData.tenantAddress}</div>}
              </div>
              <div className="border-t border-border pt-4">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Plaintiff (Landlord)</span>
                <div className="font-medium">{caseData.landlordName}</div>
                {(caseData as any).landlordCompany && <div className="text-muted-foreground mt-0.5">{(caseData as any).landlordCompany}</div>}
                {(caseData as any).landlordAddress && <div className="text-muted-foreground mt-0.5">{(caseData as any).landlordAddress}</div>}
                {caseData.landlordEmail && <div className="text-muted-foreground mt-0.5">{caseData.landlordEmail}</div>}
                {caseData.landlordPhone && <div className="text-muted-foreground mt-0.5">{caseData.landlordPhone}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10 border-b">
              <CardTitle className="text-base">Private Notes</CardTitle>
              {!isEditingNotes && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsEditingNotes(true)}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {isEditingNotes ? (
                <div className="space-y-3">
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Log calls, emails, or thoughts here..."
                    className="min-h-[150px] text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => {
                      setIsEditingNotes(false);
                      setNotes(caseData.notes || "");
                    }}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveNotes} disabled={updateCase.isPending}>Save</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap min-h-[100px]">
                  {notes || <span className="text-muted-foreground italic">No notes added.</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Box based on Status */}
          <Card className="bg-primary text-primary-foreground shadow-md border-none">
            <CardContent className="p-5">
              <h3 className="font-semibold flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-accent" /> Next Steps
              </h3>
              
              {caseData.status === 'draft' && (
                <p className="text-sm text-primary-foreground/80 mb-4">Generate your demand letter and send it to the tenant via certified mail.</p>
              )}
              {caseData.status === 'demand_sent' && (
                <p className="text-sm text-primary-foreground/80 mb-4">Wait for the deadline specified in your letter. If they pay, mark closed. If not, mark 'No Response'.</p>
              )}
              {caseData.status === 'no_response' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Time to file. Check the <Link href="/resources" className="text-accent underline hover:text-white">resources page</Link> for your local court link.</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('filed')}>
                    Mark as Filed
                  </Button>
                </>
              )}
              {caseData.status === 'filed' && (
                <p className="text-sm text-primary-foreground/80 mb-4">You must legally 'serve' the tenant with the lawsuit papers according to local rules.</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      </div>
      )}
    </div>
  );
}
