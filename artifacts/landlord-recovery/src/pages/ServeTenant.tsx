import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Upload, CheckCircle2, X, FileText, AlertTriangle, Loader2, Info } from "lucide-react";
import { useGetLandlordCase } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SERVICE_METHODS = [
  {
    value: "sheriff",
    label: "Sheriff / Marshal Service",
    description: "A county sheriff or city marshal delivers the papers in person. Most courts prefer this method.",
  },
  {
    value: "process_server",
    label: "Licensed Process Server",
    description: "A licensed private process server delivers the papers. Valid in all states — check your state's licensing requirements.",
  },
  {
    value: "certified_mail",
    label: "Certified Mail",
    description: "Papers are mailed via USPS Certified Mail with Return Receipt. Some states restrict or prohibit this method for small claims.",
  },
  {
    value: "constable",
    label: "Constable",
    description: "In states like Texas and Pennsylvania, a constable may serve papers instead of a sheriff.",
  },
];

export default function ServeTenant() {
  const { id } = useParams();
  const caseId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: caseData, isLoading: caseLoading } = useGetLandlordCase(caseId);

  const [method, setMethod] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMethod = SERVICE_METHODS.find(m => m.value === method);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setProofFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method || !date) return;
    setSaving(true);
    try {
      const updateResp = await fetch(`/api/landlord-cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceMethod: method,
          serviceDate: date,
          serviceNotes: notes || null,
          status: "hearing_scheduled",
        }),
      });
      if (!updateResp.ok) throw new Error("Failed to save service info");

      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        formData.append("label", "Proof of Service");
        await fetch(`/api/landlord-cases/${caseId}/attachments`, {
          method: "POST",
          body: formData,
        });
      }

      setSaved(true);
      toast({ title: "Service recorded", description: "The case status has been updated to Hearing Scheduled." });
    } catch (err) {
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center text-muted-foreground">Case not found.</div>
    );
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold">Service Recorded</h2>
        <p className="text-muted-foreground">
          Tenant service has been logged. The case is now marked as <strong>Hearing Scheduled</strong>.
          Your next step is to prepare your evidence and attend your scheduled court date.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" asChild>
            <Link to={`/cases/${caseId}`}>Back to Case</Link>
          </Button>
          <Button asChild>
            <Link to={`/cases/${caseId}`}>View Case</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link to={`/cases/${caseId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Case
        </Link>
        <h1 className="text-3xl font-serif font-bold">Record Tenant Service</h1>
        <p className="text-muted-foreground mt-1">
          Case against <span className="text-foreground font-medium">{caseData.tenantName}</span> —{" "}
          {caseData.propertyAddress}
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">Service of process is legally required</p>
              <p>
                The tenant must be officially notified of the lawsuit before the court can proceed.
                If service is improper or cannot be proven, the case may be dismissed. Keep all proof of service documents.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/10">
            <CardTitle className="text-base">Service Details</CardTitle>
            <CardDescription>How and when was the tenant served?</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">

            <div className="space-y-2">
              <Label>Service Method *</Label>
              <Select value={method} onValueChange={setMethod} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service method" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMethod && (
                <p className="text-xs text-muted-foreground flex gap-1.5 items-start pt-1">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {selectedMethod.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date Served *</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Textarea
                placeholder="Where was the tenant served? Who received the papers? Any issues encountered?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[90px]"
              />
            </div>

          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/10">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Proof of Service
            </CardTitle>
            <CardDescription>Upload the affidavit of service, return receipt, or server's statement.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {proofFile ? (
              <div className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3 border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{proofFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(proofFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => { setProofFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-muted/20 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload proof of service</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — max 10 MB</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to={`/cases/${caseId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={saving || !method || !date}
            className="bg-primary"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              : <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Service Record</>
            }
          </Button>
        </div>

      </form>
    </div>
  );
}
