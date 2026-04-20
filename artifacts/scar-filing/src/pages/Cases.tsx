import { Link } from "wouter";
import { useListGrievances } from "@workspace/api-client-react";
import { ArrowRight, FileText, Plus } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700" },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  reduced: { label: "Reduced", color: "bg-green-100 text-green-700" },
  denied: { label: "Denied", color: "bg-red-100 text-red-700" },
};

export function Cases() {
  const grievances = useListGrievances();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-2">My Cases</h1>
          <p className="text-muted-foreground">Track and resume your SCAR filings.</p>
        </div>
        <Link
          href="/file"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Filing
        </Link>
      </div>

      {grievances.isPending && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {grievances.isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          Failed to load cases. Please refresh to try again.
        </div>
      )}

      {grievances.data && grievances.data.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-1">No cases yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Start a new SCAR filing to get started.</p>
          <Link
            href="/file"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Start Filing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {grievances.data && grievances.data.length > 0 && (
        <div className="space-y-3">
          {grievances.data.map((g, i) => {
            const statusInfo = STATUS_LABELS[g.status] ?? STATUS_LABELS.draft;
            const savings = g.estimatedMarketValue - (g.requestedAssessment ?? g.currentAssessment);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-card-border rounded-lg p-5 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tax year {g.taxYear} · {g.county} County
                    </span>
                  </div>
                  <div className="font-medium text-foreground truncate">{g.propertyAddress}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Assessment: ${g.currentAssessment.toLocaleString()} · Requested: ${g.requestedAssessment.toLocaleString()}
                    {savings > 0 && (
                      <span className="text-green-600 ml-2">· Save ~${savings.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/file?id=${g.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  View
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
