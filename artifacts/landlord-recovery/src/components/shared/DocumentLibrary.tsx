import { useState, useMemo } from "react";
import { documentTemplates, CATEGORIES, type DocumentTemplate } from "@/data/documentTemplates";
import { STATE_REQUIREMENTS, STATES_WITH_REQUIREMENTS } from "@/data/stateRequirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, FileText, ChevronRight, Printer, RotateCcw, CheckCircle2, Info, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALL_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

const CATEGORY_COLORS: Record<string, string> = {
  notices: "bg-amber-50 text-amber-700 border-amber-200",
  demand_letters: "bg-blue-50 text-blue-700 border-blue-200",
  deposit: "bg-purple-50 text-purple-700 border-purple-200",
  termination: "bg-rose-50 text-rose-700 border-rose-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  notices: "Pay or Quit Notice",
  demand_letters: "Demand Letter",
  deposit: "Security Deposit",
  termination: "Termination",
};

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || `[${key.replace(/_/g, " ").toUpperCase()}]`);
}

function StateRequirementsCard({ stateCode }: { stateCode: string }) {
  const req = STATE_REQUIREMENTS[stateCode];
  if (!req) return null;
  return (
    <div className="mx-3 mb-3 rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-2">
      <div className="font-semibold text-foreground text-sm">{req.name} Requirements</div>
      <div className="grid grid-cols-1 gap-1.5">
        <div className="flex items-start gap-1.5">
          <span className="text-muted-foreground shrink-0 w-28">Notice Period</span>
          <span className="font-medium text-foreground">
            {typeof req.noticeDays === "number" ? `${req.noticeDays} days` : req.noticeDays}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-muted-foreground shrink-0 w-28">Deposit Return</span>
          <span className="font-medium text-foreground">{req.depositReturnDays} days</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-muted-foreground shrink-0 w-28">Small Claims Cap</span>
          <span className="font-medium text-foreground">{formatMoney(req.smallClaimsLimit)}</span>
        </div>
      </div>
      {(req.noticeNotes || req.depositNotes) && (
        <div className="border-t border-border pt-2 space-y-1">
          {req.noticeNotes && (
            <p className="text-muted-foreground leading-relaxed flex gap-1">
              <Info className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
              {req.noticeNotes}
            </p>
          )}
          {req.depositNotes && (
            <p className="text-muted-foreground leading-relaxed flex gap-1">
              <Info className="h-3 w-3 shrink-0 mt-0.5 text-purple-500" />
              {req.depositNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, isSelected, onClick, stateCode }: {
  template: DocumentTemplate;
  isSelected: boolean;
  onClick: () => void;
  stateCode: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[template.category]}`}>
              {CATEGORY_LABELS[template.category]}
            </span>
          </div>
          <h3 className="font-semibold text-sm text-foreground leading-tight">{template.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.subtitle}</p>
        </div>
        <ChevronRight className={`h-4 w-4 mt-1 shrink-0 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      {template.states && !stateCode && (
        <div className="mt-2 flex flex-wrap gap-1">
          {template.states.slice(0, 8).map(s => (
            <span key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{s}</span>
          ))}
          {template.states.length > 8 && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">+{template.states.length - 8}</span>
          )}
        </div>
      )}
    </button>
  );
}

function TemplateForm({ template, values, onChange }: {
  template: DocumentTemplate;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="space-y-4">
      {template.fields.map(field => (
        <div key={field.key}>
          <Label className="text-sm font-medium mb-1 block">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              value={values[field.key] || ""}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="min-h-[80px] text-sm"
            />
          ) : field.type === "state" ? (
            <Select value={values[field.key] || ""} onValueChange={val => onChange(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATES.map(s => (
                  <SelectItem key={s} value={s}>{s} — {STATE_REQUIREMENTS[s]?.name ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "date" ? (
            <Input
              type="date"
              onChange={e => {
                const d = e.target.value ? new Date(e.target.value + "T12:00:00") : null;
                const formatted = d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
                onChange(field.key, formatted);
              }}
              className="text-sm"
            />
          ) : (
            <Input
              type={field.type === "number" ? "number" : "text"}
              value={values[field.key] || ""}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm"
            />
          )}
          {field.type === "date" && values[field.key] && (
            <p className="text-xs text-muted-foreground mt-1">{values[field.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

interface DocumentLibraryProps {
  initialValues?: Record<string, string>;
}

export function DocumentLibrary({ initialValues = {} }: DocumentLibraryProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>(initialValues["state"] ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [copied, setCopied] = useState(false);

  const stateReq = stateFilter ? STATE_REQUIREMENTS[stateFilter] : null;

  const filtered = useMemo(() => {
    let templates = documentTemplates;
    if (activeCategory !== "all") {
      templates = templates.filter(t => t.category === activeCategory);
    }
    if (stateFilter) {
      templates = templates.filter(t =>
        !t.states || t.states.includes(stateFilter)
      );
    }
    return templates;
  }, [activeCategory, stateFilter]);

  const selected = documentTemplates.find(t => t.id === selectedId) ?? null;

  const currentValues = useMemo(() => {
    if (!selectedId || !selected) return {};
    const overrides = fieldValues[selectedId] ?? {};
    const merged: Record<string, string> = {};
    selected.fields.forEach(f => {
      if (f.key === "state") {
        merged[f.key] = overrides[f.key] ?? initialValues[f.key] ?? stateFilter ?? "";
      } else {
        merged[f.key] = overrides[f.key] ?? initialValues[f.key] ?? "";
      }
    });
    // Inject computed state-specific values
    const activeState = merged["state"] || stateFilter;
    if (activeState && STATE_REQUIREMENTS[activeState]) {
      const req = STATE_REQUIREMENTS[activeState];
      merged["deposit_deadline_days"] = String(req.depositReturnDays);
      merged["notice_period_days"] = typeof req.noticeDays === "number" ? String(req.noticeDays) : req.noticeDays as string;
    }
    return merged;
  }, [selectedId, selected, fieldValues, initialValues, stateFilter]);

  const preview = selected ? fillTemplate(selected.body, currentValues) : "";

  const handleFieldChange = (key: string, val: string) => {
    if (!selectedId) return;
    setFieldValues(prev => ({
      ...prev,
      [selectedId]: { ...(prev[selectedId] ?? {}), [key]: val },
    }));
  };

  const handleReset = () => {
    if (!selectedId) return;
    setFieldValues(prev => ({ ...prev, [selectedId]: {} }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      toast({ title: "Document Copied", description: "Paste it into Word, email, or a PDF editor." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${selected?.title ?? "Document"}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1.5in 1in; color: #000; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
      </style></head>
      <body><pre>${preview.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="flex h-full min-h-0" style={{ minHeight: "calc(100vh - 200px)" }}>
      {/* Left Panel — Library */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        {/* State Filter */}
        <div className="p-3 border-b border-border">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Filter by State</Label>
          <div className="relative">
            <Select value={stateFilter || "__all__"} onValueChange={v => {
              const next = v === "__all__" ? "" : v;
              setStateFilter(next);
              setSelectedId(null);
            }}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All states</SelectItem>
                {STATES_WITH_REQUIREMENTS.map(s => (
                  <SelectItem key={s} value={s}>{s} — {STATE_REQUIREMENTS[s].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* State Requirements Card */}
        {stateFilter && stateReq && (
          <div className="border-b border-border py-3">
            <StateRequirementsCard stateCode={stateFilter} />
          </div>
        )}

        {/* Category Filters */}
        <div className="p-3 border-b border-border space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground px-2">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No documents found for {stateReq?.name ?? "this state"} in this category.
            </div>
          ) : (
            filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                isSelected={selectedId === t.id}
                onClick={() => setSelectedId(t.id)}
                stateCode={stateFilter}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel — Form + Preview */}
      {selected ? (
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Form Column */}
          <div className="w-72 shrink-0 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border bg-muted/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-sm text-foreground leading-tight">{selected.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Reset fields" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
              {stateFilter && stateReq && (
                <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded px-2 py-1.5 leading-relaxed">
                  <strong>{stateReq.name}:</strong> {stateReq.depositReturnDays}-day deposit return window &middot; {typeof stateReq.noticeDays === "number" ? `${stateReq.noticeDays}-day` : stateReq.noticeDays} notice &middot; {formatMoney(stateReq.smallClaimsLimit)} small claims limit
                </div>
              )}
              {Object.keys(initialValues).length > 0 && (
                <p className="text-xs text-primary mt-2 bg-primary/5 border border-primary/20 rounded px-2 py-1">
                  Fields pre-filled from case data. Adjust as needed.
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TemplateForm template={selected} values={currentValues} onChange={handleFieldChange} />
            </div>
          </div>

          {/* Preview Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Document Preview</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print / Save PDF
                </Button>
                <Button size="sm" onClick={handleCopy} className="bg-primary text-primary-foreground">
                  {copied ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Copied</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Copy Text</>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white p-8">
              <div className="max-w-2xl mx-auto">
                <pre className="font-serif text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {preview}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/5">
          <div className="text-center max-w-sm px-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2">Select a Document</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stateFilter
                ? `Showing documents for ${stateReq?.name ?? stateFilter}. Select a template — state-specific requirements will be filled in automatically.`
                : Object.keys(initialValues).length > 0
                  ? "Choose a template and the form will be pre-filled with your case details. Adjust any fields and then copy or print."
                  : "Filter by your state to see only the documents that apply, then select a template to fill in your details."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-left">
              {filtered.slice(0, 4).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="text-left p-2 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <span className="font-medium text-foreground block leading-tight">{t.title}</span>
                  <span className="text-muted-foreground">{t.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
