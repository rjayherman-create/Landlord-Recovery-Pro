import { useState } from "react";
import {
  Search, MapPin, Phone, Briefcase, Users, Plus, Trash2, CheckCircle2,
  Clock, AlertCircle, ChevronDown, ChevronRight, RefreshCw, MessageSquare,
  Info, Sparkles, Loader2, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  id: number;
  caseId: number;
  type: string;
  value: string;
  source?: string;
  status: "unverified" | "verified" | "dead";
  notes?: string;
  createdAt: string;
}

interface ContactAttempt {
  id: number;
  caseId: number;
  method: string;
  result?: string;
  contactedAt: string;
}

// ─── Lead type config ────────────────────────────────────────────────────────
const LEAD_TYPES = [
  { value: "address", label: "Address", icon: <MapPin className="h-3.5 w-3.5" /> },
  { value: "phone", label: "Phone", icon: <Phone className="h-3.5 w-3.5" /> },
  { value: "employer", label: "Employer", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: "relative", label: "Relative / Contact", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "social", label: "Social Media", icon: <Search className="h-3.5 w-3.5" /> },
  { value: "other", label: "Other", icon: <Info className="h-3.5 w-3.5" /> },
];

const CONTACT_METHODS = [
  { value: "call", label: "Phone Call" },
  { value: "text", label: "Text Message" },
  { value: "email", label: "Email" },
  { value: "visit", label: "In-Person Visit" },
  { value: "certified_mail", label: "Certified Mail" },
  { value: "neighbor", label: "Spoke to Neighbor" },
  { value: "relative", label: "Spoke to Relative" },
];

const STATUS_STYLE: Record<string, string> = {
  verified: "bg-green-100 text-green-800 border-green-200",
  unverified: "bg-amber-100 text-amber-800 border-amber-200",
  dead: "bg-gray-100 text-gray-500 border-gray-200",
};

// ─── Search playbook steps ────────────────────────────────────────────────────
const SEARCH_STEPS = [
  {
    title: "Review the original lease application",
    detail: "Check references, employer, emergency contacts, and co-signer details already on file.",
  },
  {
    title: "Search online rental listings",
    detail: "Look on Facebook Marketplace, Craigslist, and Zillow for listings with matching name, phone, or employer.",
  },
  {
    title: "Run a Google search",
    detail: 'Try "[Tenant Name] [City, State]", their phone number, and variations of their name in quotation marks.',
  },
  {
    title: "Check social media",
    detail: "Search Facebook, LinkedIn, and Instagram. Look for location tags, employer info, or recent activity in your area.",
  },
  {
    title: "Contact emergency contacts and references",
    detail: "Use any numbers from the original lease application. Be professional — do not reveal the debt situation to third parties.",
  },
  {
    title: "Visit the last known address",
    detail: "Check the mailbox for forwarding address. Ask neighbors if the tenant left a new address. Check with building management.",
  },
  {
    title: "Send certified mail to last known address",
    detail: "Even if they moved, mail may be forwarded. The USPS forwarding record may reveal a new address.",
  },
  {
    title: "Consider a licensed skip tracing service",
    detail: "Professional skip tracers charge $30–$150 and can often provide current employer and address data. Use only licensed services.",
  },
];

// ─── Next action engine ───────────────────────────────────────────────────────
function getNextAction(leads: Lead[], contacts: ContactAttempt[]): { label: string; detail: string; icon: React.ReactNode } {
  const verified = leads.filter((l) => l.status === "verified");
  const hasVerifiedAddress = verified.some((l) => l.type === "address");
  const hasVerifiedEmployer = verified.some((l) => l.type === "employer");
  const hasVerifiedPhone = verified.some((l) => l.type === "phone");
  const totalLeads = leads.length;
  const totalContacts = contacts.length;

  if (hasVerifiedAddress && hasVerifiedEmployer) {
    return {
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      label: "Ready to Act",
      detail: "You have a verified address and employer. Proceed with service of process or wage garnishment.",
    };
  }
  if (hasVerifiedAddress) {
    return {
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      label: "Address Confirmed — Serve Now",
      detail: "You have a verified address. Proceed with service of process to formally serve the tenant.",
    };
  }
  if (hasVerifiedEmployer) {
    return {
      icon: <Briefcase className="h-4 w-4 text-blue-600" />,
      label: "Employer Confirmed — Prepare Garnishment",
      detail: "You have a verified employer. Begin the wage garnishment process with the court marshal.",
    };
  }
  if (hasVerifiedPhone) {
    return {
      icon: <Phone className="h-4 w-4 text-blue-600" />,
      label: "Phone Confirmed — Make Contact",
      detail: "You have a verified phone number. Call or text to propose a payment arrangement.",
    };
  }
  if (totalLeads > 0 && totalContacts === 0) {
    return {
      icon: <Phone className="h-4 w-4 text-amber-600" />,
      label: "Try the Leads You Have",
      detail: "You have unverified leads. Start making contact attempts to confirm current location or employer.",
    };
  }
  if (totalContacts > 0 && totalLeads < 3) {
    return {
      icon: <Search className="h-4 w-4 text-amber-600" />,
      label: "Expand Your Search",
      detail: "Follow the search playbook below. Try online listings, social media, and emergency contacts.",
    };
  }
  return {
    icon: <Search className="h-4 w-4 text-muted-foreground" />,
    label: "Start the Search Playbook",
    detail: "No leads yet. Follow the step-by-step search guide below to systematically locate the tenant.",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  caseId: number;
  tenantName: string;
  tenantPhone?: string | null;
  tenantEmail?: string | null;
  tenantAddress?: string | null;
  state: string;
}

export default function TenantLocator({ caseId, tenantName, tenantPhone, tenantEmail, tenantAddress, state }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [leadForm, setLeadForm] = useState({ type: "address", value: "", source: "", status: "unverified", notes: "" });
  const [contactForm, setContactForm] = useState({
    method: "call",
    result: "",
    contactedAt: new Date().toISOString().slice(0, 16),
  });

  // ── Fetch leads
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["tenant-leads", caseId],
    queryFn: async () => {
      const r = await fetch(`/api/landlord-cases/${caseId}/leads`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  // ── Fetch contact attempts
  const { data: contacts = [] } = useQuery<ContactAttempt[]>({
    queryKey: ["tenant-contacts", caseId],
    queryFn: async () => {
      const r = await fetch(`/api/landlord-cases/${caseId}/contacts`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  // ── Mutations
  const addLead = useMutation({
    mutationFn: async (data: typeof leadForm) => {
      const r = await fetch(`/api/landlord-cases/${caseId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-leads", caseId] });
      setLeadDialogOpen(false);
      setLeadForm({ type: "address", value: "", source: "", status: "unverified", notes: "" });
      toast({ title: "Lead added" });
    },
    onError: () => toast({ title: "Failed to add lead", variant: "destructive" }),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: number; status: string }) => {
      const r = await fetch(`/api/landlord-cases/${caseId}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-leads", caseId] }),
  });

  const deleteLead = useMutation({
    mutationFn: async (leadId: number) => {
      const r = await fetch(`/api/landlord-cases/${caseId}/leads/${leadId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-leads", caseId] });
      toast({ title: "Lead removed" });
    },
  });

  const addContact = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      const r = await fetch(`/api/landlord-cases/${caseId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-contacts", caseId] });
      setContactDialogOpen(false);
      setContactForm({ method: "call", result: "", contactedAt: new Date().toISOString().slice(0, 16) });
      toast({ title: "Contact attempt logged" });
    },
    onError: () => toast({ title: "Failed to log contact", variant: "destructive" }),
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: number) => {
      const r = await fetch(`/api/landlord-cases/${caseId}/contacts/${contactId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-contacts", caseId] }),
  });

  // ── AI suggestions
  async function fetchAiSuggestions() {
    setAiLoading(true);
    setAiSuggestions(null);
    try {
      const r = await fetch(`/api/landlord-cases/${caseId}/locate/ai-suggest`, { method: "POST" });
      if (!r.ok) throw new Error("Failed");
      const data = await r.json();
      setAiSuggestions(data.suggestions);
    } catch {
      toast({ title: "Could not generate suggestions", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }

  const nextAction = getNextAction(leads, contacts);
  const verifiedCount = leads.filter((l) => l.status === "verified").length;
  const leadTypeIcon = (type: string) => LEAD_TYPES.find((t) => t.value === type)?.icon ?? <Info className="h-3.5 w-3.5" />;

  return (
    <div className="space-y-5">

      {/* ── Tenant summary ── */}
      <Card>
        <CardHeader className="pb-3 bg-muted/10 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> Tenant Locator
              </CardTitle>
              <CardDescription>Organize leads and track search progress for {tenantName}.</CardDescription>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{leads.length} lead{leads.length !== 1 ? "s" : ""} · {verifiedCount} verified</p>
              <p>{contacts.length} contact attempt{contacts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {/* Known info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/20 rounded-md px-3 py-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Last Known Address</p>
              <p className="font-medium">{tenantAddress || <span className="text-muted-foreground italic">Unknown</span>}</p>
            </div>
            <div className="bg-muted/20 rounded-md px-3 py-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Phone / Email on File</p>
              <p className="font-medium">{tenantPhone || tenantEmail || <span className="text-muted-foreground italic">None on file</span>}</p>
            </div>
          </div>

          {/* Next action */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-3">
            {nextAction.icon}
            <div>
              <p className="text-sm font-semibold text-blue-900">{nextAction.label}</p>
              <p className="text-xs text-blue-700 mt-0.5">{nextAction.detail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── AI search suggestions ── */}
      <Card>
        <CardHeader className="pb-3 bg-muted/10 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> AI Search Suggestions
              </CardTitle>
              <CardDescription className="text-xs">Get customized search queries and platform recommendations.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchAiSuggestions} disabled={aiLoading} className="gap-1.5">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {aiSuggestions ? "Refresh" : "Generate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {aiSuggestions ? (
            <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed bg-muted/20 rounded-lg p-3">
              {aiSuggestions}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Click Generate to get AI-powered search queries and platform suggestions based on this tenant's profile.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Leads ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/10 border-b">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Leads
            </CardTitle>
            <CardDescription>Any address, phone, employer, or contact information you've discovered.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setLeadDialogOpen(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {leads.length === 0 ? (
            <div className="text-center py-7 border-2 border-dashed rounded-md bg-muted/10">
              <Search className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No leads yet. Add any information you discover about the tenant's current location, phone, or employer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-start justify-between gap-2 py-2.5 px-3 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-primary mt-0.5 shrink-0">{leadTypeIcon(lead.type)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.value}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={`text-xs ${STATUS_STYLE[lead.status]}`}>
                          {lead.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{lead.type.replace("_", " ")}</span>
                        {lead.source && <span className="text-xs text-muted-foreground">· {lead.source}</span>}
                      </div>
                      {lead.notes && <p className="text-xs text-muted-foreground mt-0.5">{lead.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {lead.status !== "verified" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700 px-2"
                        onClick={() => updateLeadStatus.mutate({ leadId: lead.id, status: "verified" })}>
                        Verify
                      </Button>
                    )}
                    {lead.status !== "dead" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2"
                        onClick={() => updateLeadStatus.mutate({ leadId: lead.id, status: "dead" })}>
                        Dead
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteLead.mutate(lead.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Contact log ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/10 border-b">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Contact Log
            </CardTitle>
            <CardDescription>Record every attempt to reach the tenant or their contacts.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setContactDialogOpen(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Log Attempt
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {contacts.length === 0 ? (
            <div className="text-center py-7 border-2 border-dashed rounded-md bg-muted/10">
              <Clock className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No contact attempts logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 py-2.5 px-3 rounded-lg bg-muted/20 border border-border text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium capitalize">{c.method.replace(/_/g, " ")}</p>
                      {c.result && <p className="text-xs text-muted-foreground mt-0.5">{c.result}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(c.contactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteContact.mutate(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Search playbook ── */}
      <Card>
        <button className="w-full text-left" onClick={() => setPlaybookOpen(!playbookOpen)}>
          <CardHeader className="pb-3 bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronRight className={`h-4 w-4 text-primary transition-transform ${playbookOpen ? "rotate-90" : ""}`} />
                Step-by-Step Search Playbook
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{SEARCH_STEPS.length} steps</Badge>
            </div>
          </CardHeader>
        </button>
        {playbookOpen && (
          <CardContent className="pt-0 pb-5">
            <Separator className="mb-4" />
            <ol className="space-y-3">
              {SEARCH_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        )}
      </Card>

      {/* ── Legal disclaimer ── */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg p-3">
        <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
        <span>
          <strong>Organizational tool only.</strong> This feature helps you organize and track publicly available information.
          It does not access restricted databases or provide skip tracing services. You are responsible for complying with
          all applicable laws, including the Fair Debt Collection Practices Act (FDCPA), when attempting to locate individuals.
        </span>
      </div>

      {/* ── Add Lead Dialog ── */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Lead Type</Label>
              <Select value={leadForm.type} onValueChange={(v) => setLeadForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input
                placeholder={leadForm.type === "address" ? "e.g. 45 Oak St, Hempstead, NY" : leadForm.type === "phone" ? "e.g. (516) 555-1234" : leadForm.type === "employer" ? "e.g. ABC Construction" : "Enter value"}
                value={leadForm.value}
                onChange={(e) => setLeadForm((p) => ({ ...p, value: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source (optional)</Label>
              <Input
                placeholder="e.g. Craigslist listing, neighbor told me, lease application"
                value={leadForm.source}
                onChange={(e) => setLeadForm((p) => ({ ...p, source: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Status</Label>
              <Select value={leadForm.status} onValueChange={(v) => setLeadForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="dead">Dead End</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional context..."
                value={leadForm.notes}
                onChange={(e) => setLeadForm((p) => ({ ...p, notes: e.target.value }))}
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addLead.mutate(leadForm)}
              disabled={!leadForm.value.trim() || addLead.isPending}
            >
              {addLead.isPending ? "Saving..." : "Add Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Log Contact Dialog ── */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Contact Attempt</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={contactForm.method} onValueChange={(v) => setContactForm((p) => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={contactForm.contactedAt}
                onChange={(e) => setContactForm((p) => ({ ...p, contactedAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Result / Notes</Label>
              <Textarea
                placeholder="e.g. No answer. Voicemail left. / Neighbor said they moved to Queens 2 months ago."
                value={contactForm.result}
                onChange={(e) => setContactForm((p) => ({ ...p, result: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addContact.mutate(contactForm)}
              disabled={addContact.isPending}
            >
              {addContact.isPending ? "Saving..." : "Log Attempt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
