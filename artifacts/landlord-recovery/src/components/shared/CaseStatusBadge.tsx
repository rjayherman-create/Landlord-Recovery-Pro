import { Badge } from "@/components/ui/badge";

type StatusType = "draft" | "demand_sent" | "no_response" | "filed" | "hearing_scheduled" | "judgment" | "collection" | "closed";

const STATUS_MAP: Record<StatusType, { label: string, variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  draft: { label: "Draft", variant: "secondary" },
  demand_sent: { label: "Demand Sent", variant: "info" },
  no_response: { label: "No Response", variant: "warning" },
  filed: { label: "Filed in Court", variant: "default" },
  hearing_scheduled: { label: "Hearing Scheduled", variant: "default" },
  judgment: { label: "Judgment Received", variant: "success" },
  collection: { label: "In Collection", variant: "warning" },
  closed: { label: "Closed", variant: "outline" },
};

// Add custom variants via Tailwind classes if needed
const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "text-foreground border border-input",
  destructive: "bg-destructive text-destructive-foreground",
  success: "bg-green-600 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-600 text-white",
};

export function CaseStatusBadge({ status, className = "" }: { status: StatusType | string, className?: string }) {
  const config = STATUS_MAP[status as StatusType] || { label: status, variant: "secondary" };
  const variantClass = VARIANT_CLASSES[config.variant] || VARIANT_CLASSES.secondary;
  
  return (
    <Badge className={`font-medium ${variantClass} ${className}`} variant="outline">
      {config.label}
    </Badge>
  );
}

export function ClaimTypeBadge({ type }: { type: string }) {
  const formatType = (t: string) =>
    t.trim().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const types = (type ?? "").split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="flex flex-wrap gap-1">
      {types.map(t => (
        <Badge key={t} variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
          {formatType(t)}
        </Badge>
      ))}
    </div>
  );
}
