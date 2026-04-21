import { useState, useRef, useEffect, useCallback } from "react";
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
  FileOutput, RefreshCw, Save, Trash2, Paperclip, Upload, X, FileImage, File
} from "lucide-react";
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

  const currentStatusIndex = STATUS_PROGRESS.findIndex(s => s.id === caseData.status);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
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
      </div>

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
  );
}
