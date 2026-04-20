import { Link, useLocation } from "wouter";
import { useListCases, useDeleteCase, getListCasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileText, Plus, Scale, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const CLAIM_TYPE_LABELS: Record<string, string> = {
  breach_of_contract: "Breach of Contract",
  security_deposit: "Security Deposit",
  property_damage: "Property Damage",
  unpaid_wages: "Unpaid Wages",
  consumer_dispute: "Consumer Dispute",
  landlord_tenant: "Landlord / Tenant",
  negligence: "Negligence",
  personal_property: "Personal Property",
};

const CLAIM_TYPE_ICONS: Record<string, string> = {
  breach_of_contract: "📄",
  security_deposit: "🏠",
  property_damage: "🔨",
  unpaid_wages: "💼",
  consumer_dispute: "🛒",
  landlord_tenant: "🔑",
  negligence: "⚖️",
  personal_property: "📦",
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground bg-muted" },
  ready: { label: "Ready to File", icon: CheckCircle, color: "text-green-700 bg-green-50 border border-green-200" },
  filed: { label: "Filed", icon: AlertCircle, color: "text-blue-700 bg-blue-50 border border-blue-200" },
  won: { label: "Won", icon: CheckCircle, color: "text-green-700 bg-green-50 border border-green-200" },
  lost: { label: "Closed", icon: AlertCircle, color: "text-muted-foreground bg-muted" },
  dismissed: { label: "Dismissed", icon: AlertCircle, color: "text-muted-foreground bg-muted" },
};

export function Cases() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: cases, isLoading, error } = useListCases();
  const deleteCase = useDeleteCase();

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this case? This cannot be undone.")) return;
    await deleteCase.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          Failed to load cases. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">My Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {cases && cases.length > 0 ? `${cases.length} case${cases.length !== 1 ? "s" : ""}` : "No cases yet"}
          </p>
        </div>
        <button
          onClick={() => setLocation("/file")}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      {!cases || cases.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
            <Scale className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">No cases yet</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Start by filing your first small claims case. Our AI will guide you through the entire process.
            </p>
            <button
              onClick={() => setLocation("/file")}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Start My First Case
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {cases.map((c, i) => {
            const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="bg-card border border-card-border rounded-lg p-4 hover:border-primary/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl shrink-0 mt-0.5">
                      {CLAIM_TYPE_ICONS[c.claimType] ?? "⚖️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-sm text-foreground">
                            {CLAIM_TYPE_LABELS[c.claimType] ?? c.claimType} — vs. {c.defendantName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.claimantName} · {c.state} · ${Number(c.claimAmount).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {c.claimDescription && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.claimDescription}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {c.status === "draft" && (
                          <button
                            onClick={() => setLocation("/file")}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Continue <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {c.generatedStatement && (
                          <span className="text-xs text-green-700 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Statement ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
