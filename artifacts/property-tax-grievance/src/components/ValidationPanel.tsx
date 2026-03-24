import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, Lightbulb, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ValidationIssue, ValidationSeverity } from "@/hooks/use-form-validation";

interface ValidationPanelProps {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  isReadyToFile: boolean;
  onFix: (issue: ValidationIssue) => void;
}

const SEV_CONFIG: Record<
  ValidationSeverity,
  {
    icon: React.ElementType;
    label: string;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  error: {
    icon: XCircle,
    label: "Blocker",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    iconColor: "text-red-500",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  suggestion: {
    icon: Lightbulb,
    label: "Suggestion",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-900",
    iconColor: "text-blue-500",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
};

function IssueRow({ issue, onFix }: { issue: ValidationIssue; onFix: (i: ValidationIssue) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEV_CONFIG[issue.severity];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
      <button
        className="w-full flex items-start gap-3 p-3.5 text-left"
        onClick={() => setExpanded((v) => !v)}
        type="button"
      >
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${cfg.text} leading-snug`}>{issue.title}</p>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{issue.description}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-wide ${cfg.badgeBg} ${cfg.badgeText}`}>
          {cfg.label}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className={`px-4 pb-4 border-t ${cfg.border}`}>
          <p className={`text-xs leading-relaxed mt-3 ${cfg.text}`}>{issue.description}</p>
          {issue.fixLabel && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-7 text-xs gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onFix(issue);
              }}
            >
              {issue.fixLabel} →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  issues,
  severity,
  defaultOpen,
  onFix,
}: {
  title: string;
  issues: ValidationIssue[];
  severity: ValidationSeverity;
  defaultOpen: boolean;
  onFix: (i: ValidationIssue) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (issues.length === 0) return null;
  const cfg = SEV_CONFIG[severity];
  const Icon = cfg.icon;

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full text-left mb-2"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg} ${cfg.badgeText}`}>{issues.length}</span>
        <span className="ml-auto">{open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} onFix={onFix} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ValidationPanel({ errors, warnings, suggestions, isReadyToFile, onFix }: ValidationPanelProps) {
  const total = errors.length + warnings.length + suggestions.length;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-border ${isReadyToFile ? "bg-emerald-50 border-emerald-100" : errors.length > 0 ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
        <div className="flex items-center gap-3">
          {isReadyToFile ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          ) : errors.length > 0 ? (
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3 className="font-serif font-bold text-lg">
              {isReadyToFile ? "Form is ready to file" : errors.length > 0 ? `${errors.length} issue${errors.length > 1 ? "s" : ""} must be fixed before filing` : "Form can be filed — review warnings first"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isReadyToFile
                ? "No blockers or warnings found. Download your PDF and file with confidence."
                : `${errors.length} blocker${errors.length !== 1 ? "s" : ""}, ${warnings.length} warning${warnings.length !== 1 ? "s" : ""}, ${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""} found.`}
            </p>
          </div>
          {isReadyToFile && (
            <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          )}
        </div>

        {/* Score bar */}
        {!isReadyToFile && (
          <div className="mt-3 flex gap-1">
            {errors.length > 0 && (
              <div
                className="h-2 rounded-full bg-red-400"
                style={{ flex: errors.length }}
                title={`${errors.length} blockers`}
              />
            )}
            {warnings.length > 0 && (
              <div
                className="h-2 rounded-full bg-amber-400"
                style={{ flex: warnings.length }}
                title={`${warnings.length} warnings`}
              />
            )}
            {suggestions.length > 0 && (
              <div
                className="h-2 rounded-full bg-blue-300"
                style={{ flex: suggestions.length }}
                title={`${suggestions.length} suggestions`}
              />
            )}
            <div
              className="h-2 rounded-full bg-emerald-300"
              style={{ flex: Math.max(0, 6 - total) }}
            />
          </div>
        )}
      </div>

      {/* Issue list */}
      {!isReadyToFile && (
        <div className="p-6 space-y-5">
          <Section
            title="Blockers — must fix before filing"
            issues={errors}
            severity="error"
            defaultOpen={true}
            onFix={onFix}
          />
          <Section
            title="Warnings — review before filing"
            issues={warnings}
            severity="warning"
            defaultOpen={true}
            onFix={onFix}
          />
          <Section
            title="Suggestions — would strengthen your case"
            issues={suggestions}
            severity="suggestion"
            defaultOpen={false}
            onFix={onFix}
          />
        </div>
      )}

      {isReadyToFile && suggestions.length > 0 && (
        <div className="p-6">
          <Section
            title="Suggestions — optional improvements"
            issues={suggestions}
            severity="suggestion"
            defaultOpen={false}
            onFix={onFix}
          />
        </div>
      )}
    </div>
  );
}
