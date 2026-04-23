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
  FileOutput, RefreshCw, Save, Trash2, Paperclip, Upload, X, FileImage, File, Library, Pencil, Archive, ArchiveRestore, Sparkles, Loader2, MapPin, TrendingUp, Search, ChevronRight,
  Eye, Download, Lock, BookmarkPlus, FolderOpen, PenLine, ChevronDown, Copy, ClipboardPaste
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DocumentLibrary } from "@/components/shared/DocumentLibrary";
import { CaseAdvisorChat } from "@/components/shared/CaseAdvisorChat";
import JudgmentRecovery from "@/pages/JudgmentRecovery";
import TenantLocator from "@/pages/TenantLocator";
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

function generatePresetLetter(c: {
  landlordName: string;
  landlordCompany?: string | null;
  landlordAddress?: string | null;
  landlordPhone?: string | null;
  tenantName: string;
  tenantAddress?: string | null;
  propertyAddress: string;
  claimType: string;
  claimAmount: number;
  state: string;
  rentPeriod?: string | null;
  monthlyRent?: number | null;
  moveOutDate?: string | null;
  description?: string | null;
}): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const claimLabels: Record<string, string> = {
    unpaid_rent: "unpaid rent",
    property_damage: "property damage",
    security_deposit: "security deposit withholding",
    lease_break: "early lease termination",
    other: "breach of lease agreement",
  };
  const types = (c.claimType || "").split(",").map(t => t.trim()).filter(Boolean);
  const claimDesc = types.map(t => claimLabels[t] || t).join(" and ");
  const amount = `$${Number(c.claimAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const plaintiff = c.landlordCompany || c.landlordName;
  const fromBlock = [
    c.landlordCompany ? c.landlordCompany : c.landlordName,
    c.landlordCompany ? `c/o ${c.landlordName}` : null,
    c.landlordAddress || null,
    c.landlordPhone || null,
  ].filter(Boolean).join("\n");

  const toBlock = [
    c.tenantName,
    c.tenantAddress || c.propertyAddress,
  ].filter(Boolean).join("\n");

  const rentInfo = c.monthlyRent
    ? `\nMonthly Rent: $${Number(c.monthlyRent).toLocaleString()}`
    : "";
  const periodInfo = c.rentPeriod ? `\nPeriod: ${c.rentPeriod}` : "";
  const moveInfo = c.moveOutDate ? `\nMove-Out Date: ${c.moveOutDate}` : "";

  const descPara = c.description
    ? `${c.description.trim()}\n\n`
    : "";

  return `${fromBlock}

${today}

RE: FORMAL DEMAND FOR PAYMENT — ${claimDesc.toUpperCase()}

To: ${toBlock}

Property Address: ${c.propertyAddress}${rentInfo}${periodInfo}${moveInfo}

Dear ${c.tenantName},

This letter serves as formal notice that you owe the total amount of ${amount} to ${plaintiff} in connection with the above-referenced property located at ${c.propertyAddress}, ${c.state}.

${descPara}You are hereby demanded to pay the full outstanding balance of ${amount} within ten (10) days of receipt of this letter. Payment should be made in full directly to the address listed above.

If payment is not received within ten (10) days, ${plaintiff} will have no choice but to pursue all available legal remedies, including filing a claim in ${c.state} Small Claims Court to recover the full amount owed, plus any applicable court costs and filing fees.

This letter may be used as evidence of your failure to respond to a lawful demand for payment.

Sincerely,

${plaintiff}${c.landlordCompany ? `\nBy: ${c.landlordName}, Authorized Representative` : ""}
${c.landlordAddress || ""}
${c.landlordPhone || ""}`.trim();
}

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
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "advisor" | "recovery" | "locate">("overview");

  // Filing Kit state
  const [filingKitCheckoutLoading, setFilingKitCheckoutLoading] = useState(false);
  const [filingKitDownloadLoading, setFilingKitDownloadLoading] = useState(false);

  async function handleFilingKitCheckout() {
    setFilingKitCheckoutLoading(true);
    try {
      const res = await fetch(`/api/landlord/pdf/${caseId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (data.alreadyPaid) {
        handleFilingKitDownload();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message ?? "Could not create checkout session.");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFilingKitCheckoutLoading(false);
    }
  }

  async function handleFilingKitDownload() {
    setFilingKitDownloadLoading(true);
    try {
      const res = await fetch(`/api/landlord/pdf/${caseId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Download failed.");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `filing-kit-case-${caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFilingKitDownloadLoading(false);
    }
  }

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
  const [isScratchMode, setIsScratchMode] = useState(false);
  const [letterText, setLetterText] = useState("");

  // Template state
  type LetterTemplate = { id: string; name: string; text: string; createdAt: string };
  const TEMPLATE_KEY = "landlord_letter_templates";
  const loadTemplates = (): LetterTemplate[] => {
    try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
  };
  const [templates, setTemplates] = useState<LetterTemplate[]>(() => loadTemplates());
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !letterText.trim()) return;
    const newTemplate: LetterTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      text: letterText,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTemplate, ...loadTemplates()];
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated));
    setTemplates(updated);
    setTemplateName("");
    setShowSaveTemplateDialog(false);
    toast({ title: "Template Saved", description: `"${newTemplate.name}" saved for future use.` });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updated = loadTemplates().filter(t => t.id !== templateId);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated));
    setTemplates(updated);
  };

  const handleApplyTemplate = (template: LetterTemplate) => {
    setLetterText(template.text);
    setShowLoadTemplateDialog(false);
    setIsEditingLetter(true);
    setIsScratchMode(false);
    toast({ title: "Template Loaded", description: `"${template.name}" applied. Edit as needed.` });
  };

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadLabel, setUploadLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState<number | null>(null);
  const [editingAttachmentId, setEditingAttachmentId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isSavingAttachment, setIsSavingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ATTACHMENT_CATEGORIES = [
    { value: "lease", label: "Lease Agreement" },
    { value: "ledger", label: "Rent Ledger / Payment Records" },
    { value: "photo", label: "Photographs" },
    { value: "notice", label: "Notice to Quit / Vacate" },
    { value: "5_day_notice", label: "5-Day Notice to Pay" },
    { value: "10_day_notice", label: "10-Day Notice" },
    { value: "14_day_notice", label: "14-Day Notice" },
    { value: "30_day_notice", label: "30-Day Notice to Vacate" },
    { value: "correspondence", label: "Correspondence" },
    { value: "court", label: "Court Filing" },
    { value: "other", label: "Other" },
  ];

  const fetchAttachments = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/landlord-cases/${caseId}/attachments`);
      if (res.ok) setAttachments(await res.json());
    } catch {}
  }, [caseId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      await Promise.allSettled(files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", uploadCategory);
        if (uploadLabel) fd.append("notes", uploadLabel);
        await fetch(`/api/landlord-cases/${caseId}/attachments`, { method: "POST", body: fd });
      }));
      toast({ title: files.length === 1 ? "File Uploaded" : `${files.length} Files Uploaded` });
      setUploadLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchAttachments();
    } catch {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const startEditAttachment = (att: any) => {
    setEditingAttachmentId(att.id);
    setEditLabel(att.notes || "");
    setEditCategory(att.category || "other");
  };

  const cancelEditAttachment = () => {
    setEditingAttachmentId(null);
    setEditLabel("");
    setEditCategory("");
  };

  const handleSaveAttachment = async (id: number) => {
    setIsSavingAttachment(true);
    try {
      const res = await fetch(`/api/landlord-cases/${caseId}/attachments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editCategory, notes: editLabel }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAttachments(prev => prev.map(a => a.id === id ? updated : a));
        toast({ title: "Evidence Updated" });
        cancelEditAttachment();
      } else {
        toast({ title: "Update Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setIsSavingAttachment(false);
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
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link href="/cases" className="hover:text-foreground transition-colors">My Cases</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground font-medium truncate max-w-[200px]">{caseData.tenantName}</span>
            </nav>
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
                    {editForm.claimType?.includes("unpaid_rent") && (
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
                      <Label className="text-sm mb-1 block">Full Legal Name(s) * <span className="text-muted-foreground font-normal text-xs">(first and last)</span></Label>
                      <Input placeholder="Jane Smith" value={editForm.tenantName || ""} onChange={e => setEditForm(f => ({ ...f, tenantName: e.target.value }))} />
                      <p className="text-xs text-muted-foreground mt-1">Multiple tenants: Jane Smith, Robert Smith</p>
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
                      <Label className="text-sm mb-1 block">Full Legal Name * <span className="text-muted-foreground font-normal text-xs">(first and last)</span></Label>
                      <Input placeholder="John Doe" value={editForm.landlordName || ""} onChange={e => setEditForm(f => ({ ...f, landlordName: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">LLC / Company Name <span className="text-muted-foreground font-normal text-xs">(plaintiff on docs if set)</span></Label>
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
          {["judgment", "collection", "closed"].includes(caseData.status) && (
            <button
              onClick={() => setActiveTab("recovery")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === "recovery"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4" /> Recovery
            </button>
          )}
          {["no_response", "filed", "hearing_scheduled", "judgment", "collection", "closed"].includes(caseData.status) && (
            <button
              onClick={() => setActiveTab("locate")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === "locate"
                  ? "border-orange-600 text-orange-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-4 w-4" /> Locate Tenant
            </button>
          )}
        </div>
      </div>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="flex-1 min-h-0 border-t border-border overflow-y-auto">
          {/* Filing Kit Card */}
          <div className="px-6 pt-6 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
              <div className="bg-[#1a2d44] px-5 py-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#c9a231]" />
                <span className="text-white font-semibold text-sm tracking-wide">Filing Kit</span>
                {(caseData as any).filingKitPaidAt && (
                  <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">Purchased</span>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Demand Letter + Court Filing Guide</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A two-page PDF: a print-ready formal demand letter addressed to{" "}
                      <span className="font-medium">{caseData.tenantName}</span>, plus a step-by-step{" "}
                      {caseData.state} small claims filing guide with fee schedules and a court checklist.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {[
                        "Formal demand letter (print, sign, send)",
                        `${caseData.state} small claims filing guide`,
                        "Evidence & document checklist",
                      ].map((item) => (
                        <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2 sm:min-w-[160px]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`/api/landlord/pdf/${caseId}/preview`, "_blank")}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                    {(caseData as any).filingKitPaidAt ? (
                      <Button
                        size="sm"
                        className="w-full bg-[#1a2d44] hover:bg-[#243d5e]"
                        onClick={handleFilingKitDownload}
                        disabled={filingKitDownloadLoading}
                      >
                        {filingKitDownloadLoading ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Downloading...</>
                        ) : (
                          <><Download className="h-3.5 w-3.5 mr-1.5" />Download PDF</>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full bg-[#c9a231] hover:bg-[#b8912a] text-white"
                        onClick={handleFilingKitCheckout}
                        disabled={filingKitCheckoutLoading}
                      >
                        {filingKitCheckoutLoading ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Loading...</>
                        ) : (
                          <><Lock className="h-3.5 w-3.5 mr-1.5" />Unlock — $29</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {/* Recovery Tab */}
      {activeTab === "recovery" && (
        <div className="flex-1 min-h-0 border-t border-border bg-background">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">Judgment Recovery</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track collection progress, choose a recovery strategy, and log every payment received.
              </p>
            </div>
            <JudgmentRecovery
              caseId={caseId}
              tenantName={caseData.tenantName}
              judgmentAmount={caseData.judgmentAmount ? Number(caseData.judgmentAmount) : Number(caseData.claimAmount)}
              state={caseData.state}
            />
          </div>
        </div>
      )}

      {/* Locate Tenant Tab */}
      {activeTab === "locate" && (
        <div className="flex-1 min-h-0 border-t border-border bg-background">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">Locate Tenant</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Organize leads, log contact attempts, and use the step-by-step search playbook to find {caseData.tenantName}.
              </p>
            </div>
            <TenantLocator
              caseId={caseId}
              tenantName={caseData.tenantName}
              tenantPhone={(caseData as any).tenantPhone}
              tenantEmail={(caseData as any).tenantEmail}
              tenantAddress={(caseData as any).tenantAddress}
              state={caseData.state}
            />
          </div>
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
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      Step {idx + 1}
                    </span>
                    <span className={`text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
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
            </CardHeader>
            <CardContent className="pt-6">
              {(isEditingLetter || isScratchMode) ? (
                <div className="space-y-3">
                  {/* Editing toolbar */}
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-md border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLoadTemplateDialog(true)}
                      disabled={templates.length === 0}
                    >
                      <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                      Load Template
                      {templates.length > 0 && (
                        <span className="ml-1.5 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {templates.length}
                        </span>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLetterText(generatePresetLetter({
                          landlordName: caseData.landlordName,
                          landlordCompany: (caseData as any).landlordCompany ?? null,
                          landlordAddress: (caseData as any).landlordAddress ?? null,
                          landlordPhone: caseData.landlordPhone ?? null,
                          tenantName: caseData.tenantName,
                          tenantAddress: caseData.tenantAddress ?? null,
                          propertyAddress: caseData.propertyAddress,
                          claimType: caseData.claimType,
                          claimAmount: caseData.claimAmount,
                          state: caseData.state,
                          rentPeriod: (caseData as any).rentPeriod ?? null,
                          monthlyRent: caseData.monthlyRent ?? null,
                          moveOutDate: caseData.moveOutDate ?? null,
                          description: caseData.description ?? null,
                        }));
                        toast({ title: "Template loaded", description: "Edit the letter below, then save." });
                      }}
                    >
                      <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" /> Load Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateLetter}
                      disabled={generateLetter.isPending}
                    >
                      {generateLetter.isPending
                        ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      }
                      {generateLetter.isPending ? "Generating..." : "AI Draft"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(letterText);
                        toast({ title: "Copied to clipboard" });
                      }}
                      disabled={!letterText.trim()}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                    <span className="ml-auto text-xs text-muted-foreground self-center">
                      {letterText.length} characters
                    </span>
                  </div>
                  <Textarea
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    placeholder="Write your demand letter here..."
                    className="min-h-[420px] font-mono text-sm leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-2 justify-between">
                    <Button variant="outline" onClick={() => {
                      setIsEditingLetter(false);
                      setIsScratchMode(false);
                      setLetterText(caseData.demandLetterText || "");
                    }}>
                      Cancel
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => { setTemplateName(""); setShowSaveTemplateDialog(true); }}
                        disabled={!letterText.trim()}
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" /> Save as Template
                      </Button>
                      <Button onClick={handleSaveLetter} disabled={updateCase.isPending || !letterText.trim()}>
                        <Save className="h-4 w-4 mr-2" /> Save Letter
                      </Button>
                    </div>
                  </div>
                </div>
              ) : letterText ? (
                <div>
                  <div className="bg-muted/20 border p-6 rounded-md font-serif text-sm leading-relaxed whitespace-pre-wrap h-[300px] overflow-y-auto">
                    {letterText}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingLetter(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Letter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(letterText);
                      toast({ title: "Copied to clipboard" });
                    }}>
                      Copy Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setTemplateName(""); setShowSaveTemplateDialog(true); }}
                    >
                      <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" /> Save as Template
                    </Button>
                    {caseData.status === 'draft' && (
                      <Button size="sm" onClick={() => handleStatusChange('demand_sent')} className="ml-auto bg-primary text-primary-foreground">
                        <Send className="h-4 w-4 mr-2" /> Mark as Sent
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-md bg-muted/10">
                  <FileOutput className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground mb-2">No demand letter yet.</p>
                  <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto">Start with a pre-filled template based on your case details, or write from scratch.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => {
                        setLetterText(generatePresetLetter({
                          landlordName: caseData.landlordName,
                          landlordCompany: (caseData as any).landlordCompany ?? null,
                          landlordAddress: (caseData as any).landlordAddress ?? null,
                          landlordPhone: caseData.landlordPhone ?? null,
                          tenantName: caseData.tenantName,
                          tenantAddress: caseData.tenantAddress ?? null,
                          propertyAddress: caseData.propertyAddress,
                          claimType: caseData.claimType,
                          claimAmount: caseData.claimAmount,
                          state: caseData.state,
                          rentPeriod: (caseData as any).rentPeriod ?? null,
                          monthlyRent: caseData.monthlyRent ?? null,
                          moveOutDate: caseData.moveOutDate ?? null,
                          description: caseData.description ?? null,
                        }));
                        setIsScratchMode(true);
                      }}
                    >
                      <ClipboardPaste className="h-4 w-4 mr-2" /> Use Letter Template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setLetterText(""); setIsScratchMode(true); }}
                    >
                      <PenLine className="h-4 w-4 mr-2" /> Write from Scratch
                    </Button>
                    {templates.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowLoadTemplateDialog(true)}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" /> Saved Templates
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save as Template Dialog */}
          <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Give this letter a name so you can reuse it in future cases.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <Label htmlFor="template-name" className="text-sm font-medium mb-1.5 block">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder='e.g. "Unpaid Rent — Standard"'
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); }}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                  <BookmarkPlus className="h-4 w-4 mr-2" /> Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Load Template Dialog */}
          <Dialog open={showLoadTemplateDialog} onOpenChange={setShowLoadTemplateDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Load a Template</DialogTitle>
                <DialogDescription>
                  Select a saved template to use as the starting point for this letter.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-80 overflow-y-auto py-1">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No templates saved yet.</p>
                ) : (
                  templates.map((t) => (
                    <div key={t.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 font-mono">{t.text.slice(0, 120)}...</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          Saved {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" onClick={() => handleApplyTemplate(t)}>
                          Use
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={() => handleDeleteTemplate(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLoadTemplateDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Court Locator */}
          {["no_response", "filed", "hearing_scheduled", "judgment", "collection", "closed"].includes(caseData.status) && (
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10 border-b">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    Find Your Court
                  </CardTitle>
                  <CardDescription>Locate the small claims court, filing fees, and exact instructions for your area.</CardDescription>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/court-locator?state=${encodeURIComponent(caseData.state)}&amount=${encodeURIComponent(caseData.claimAmount)}`}>
                    Find My Court
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">{caseData.state}</span>
                  <span>Get exact court address, filing fee, hours, and step-by-step instructions for filing your small claims case.</span>
                </div>
              </CardContent>
            </Card>
          )}

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
                        <dd className="font-medium">
                          {(caseData.claimType ?? "").split(',').filter(Boolean)
                            .map(t => t.trim().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
                            .join(', ')}
                        </dd>
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
                      {caseData.claimType?.includes("unpaid_rent") && caseData.monthsOwed && Number(caseData.monthsOwed) > 0 && (
                        <div className="flex justify-between border-b pb-1 border-border">
                          <dt className="text-muted-foreground">Months Unpaid</dt>
                          <dd className="font-medium">{caseData.monthsOwed}</dd>
                        </div>
                      )}
                    </dl>
                    {caseData.claimType?.includes("unpaid_rent") && caseData.monthlyRent && caseData.monthsOwed && Number(caseData.monthsOwed) > 0 && (
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
          {/* Evidence / Attachments Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 bg-muted/10 border-b">
              <CardTitle className="text-lg flex items-center">
                <Paperclip className="h-5 w-5 mr-2 text-primary" />
                Evidence &amp; Attachments
              </CardTitle>
              <CardDescription>Attach and label documents, photos, and notices for court presentation.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Upload area */}
              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Evidence Label</label>
                    <Input
                      placeholder="e.g. Signed lease — May 2022"
                      value={uploadLabel}
                      onChange={e => setUploadLabel(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={e => setUploadCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {ATTACHMENT_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.pdf,.txt,.doc,.docx"
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
                      {isUploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {isUploading ? "Uploading..." : "Add Files"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">PDF, Word, images (JPG, PNG, WEBP, HEIC). Up to 25 MB each. Multiple files at once supported.</p>
              </div>

              {/* File List */}
              {attachments.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No evidence attached yet. Add your lease, notices, photos, and supporting documents above.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {attachments.map((att: any) => {
                    const isImage = att.mimeType?.startsWith("image/");
                    const catLabel = ATTACHMENT_CATEGORIES.find(c => c.value === att.category)?.label ?? att.category;
                    const isEditing = editingAttachmentId === att.id;

                    return (
                      <li key={att.id} className="py-3 space-y-2">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="mt-0.5 text-muted-foreground shrink-0">
                            {isImage ? <FileImage className="h-5 w-5" /> : <File className="h-5 w-5" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Label as primary title */}
                            {att.notes ? (
                              <p className="text-sm font-semibold text-foreground truncate">{att.notes}</p>
                            ) : null}
                            {/* Filename as secondary link */}
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`hover:underline truncate block ${att.notes ? "text-xs text-primary mt-0.5" : "text-sm font-semibold text-primary"}`}
                            >
                              {att.fileName}
                            </a>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{catLabel}</span>
                              {att.fileSize && (
                                <span className="text-xs text-muted-foreground">{(att.fileSize / 1024).toFixed(0)} KB</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            {!isEditing && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => startEditAttachment(att)}
                                title="Edit label and category"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled={isDeletingAttachment === att.id}
                              onClick={() => handleDeleteAttachment(att.id)}
                            >
                              {isDeletingAttachment === att.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Inline edit form */}
                        {isEditing && (
                          <div className="ml-8 p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Evidence Label</label>
                                <Input
                                  value={editLabel}
                                  onChange={e => setEditLabel(e.target.value)}
                                  placeholder="e.g. Front door damage — July 2023"
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
                                <select
                                  value={editCategory}
                                  onChange={e => setEditCategory(e.target.value)}
                                  className="w-full h-8 text-sm rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                  {ATTACHMENT_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={cancelEditAttachment}>Cancel</Button>
                              <Button type="button" size="sm" className="h-7 text-xs" disabled={isSavingAttachment} onClick={() => handleSaveAttachment(att.id)}>
                                {isSavingAttachment ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
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
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Generate your demand letter and send it to the tenant via certified mail. Once sent, mark it below.</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('demand_sent')} disabled={updateStatus.isPending}>
                    Mark Demand as Sent
                  </Button>
                </>
              )}
              {caseData.status === 'demand_sent' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Wait for the deadline in your letter. If the tenant pays, mark closed. If they ignore it, mark no response.</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('no_response')} disabled={updateStatus.isPending}>
                      No Response — Proceed to Filing
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" onClick={() => handleStatusChange('closed')} disabled={updateStatus.isPending}>
                      Tenant Paid — Mark Closed
                    </Button>
                  </div>
                </>
              )}
              {caseData.status === 'no_response' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Time to file. Check the <Link href="/resources" className="text-accent underline hover:text-white">resources page</Link> for your local court link.</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('filed')} disabled={updateStatus.isPending}>
                    Mark as Filed
                  </Button>
                </>
              )}
              {caseData.status === 'filed' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Serve the tenant with the lawsuit papers according to your state's rules. Once served, record your hearing date.</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('hearing_scheduled')} disabled={updateStatus.isPending}>
                    Hearing Scheduled
                  </Button>
                </>
              )}
              {caseData.status === 'hearing_scheduled' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Attend your court hearing with all evidence. The judge will issue a judgment — record the outcome below.</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('judgment')} disabled={updateStatus.isPending}>
                      Judgment Received
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" onClick={() => handleStatusChange('closed')} disabled={updateStatus.isPending}>
                      Case Dismissed — Mark Closed
                    </Button>
                  </div>
                </>
              )}
              {caseData.status === 'judgment' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Use the Recovery tab to pursue wage garnishment, bank levies, or liens. Mark when you begin active collection.</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('collection')} disabled={updateStatus.isPending}>
                      Begin Collection
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" onClick={() => handleStatusChange('closed')} disabled={updateStatus.isPending}>
                      Tenant Paid — Mark Closed
                    </Button>
                  </div>
                </>
              )}
              {caseData.status === 'collection' && (
                <>
                  <p className="text-sm text-primary-foreground/80 mb-4">Continue collection efforts. Mark closed once the debt is recovered or you decide to stop pursuing it.</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange('closed')} disabled={updateStatus.isPending}>
                    Mark Closed
                  </Button>
                </>
              )}
              {caseData.status === 'closed' && (
                <p className="text-sm text-primary-foreground/80">This case is closed. You can reopen it by changing the status using the Edit Case button above.</p>
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
