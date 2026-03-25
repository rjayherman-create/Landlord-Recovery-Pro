import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, TrendingDown, ExternalLink, MessageSquare, ChevronRight } from "lucide-react";
import type { AfterFilingInfo } from "@/data/county-filing-instructions";

interface WhatHappensNextProps {
  county: string;
  state?: string;
  afterFiling: AfterFilingInfo;
  currentStatus: string;
  filedDate?: string | null;
}

const STATUS_STEP_MAP: Record<string, number> = {
  draft: -1,
  submitted: 0,
  pending: 1,
  reduced: 3,
  denied: 3,
};

function stepIsComplete(stepIndex: number, currentStepIndex: number, status: string): boolean {
  if (status === "reduced" || status === "denied") return stepIndex < 3;
  return stepIndex < currentStepIndex;
}

function stepIsCurrent(stepIndex: number, currentStepIndex: number, status: string): boolean {
  if (status === "reduced" || status === "denied") return stepIndex === 3;
  return stepIndex === currentStepIndex;
}

const STATE_GUARANTEE: Record<string, { heading: string; body: string }> = {
  NY: {
    heading: "Filing cannot increase your taxes — it's NY law",
    body: "Under New York Real Property Tax Law §525, the Board of Assessment Review may only grant or deny your request. They cannot raise your assessment as a result of your grievance. The worst possible outcome is that nothing changes.",
  },
  NJ: {
    heading: "Filing cannot increase your taxes — it's NJ law",
    body: "Under New Jersey law, the County Board of Taxation may only grant or deny your appeal. Filing an appeal cannot result in a higher assessment. The worst possible outcome is that your assessment stays the same.",
  },
  TX: {
    heading: "Filing cannot increase your taxes — it's Texas law",
    body: "Under Texas Tax Code §41.41, the Appraisal Review Board may only grant or deny your protest. They cannot raise your appraised value as a result of filing. The worst possible outcome is no change.",
  },
  FL: {
    heading: "Filing cannot increase your taxes — it's Florida law",
    body: "Under Florida law §194.011, the Value Adjustment Board may only grant or deny your petition. They cannot raise your Just Value as a result of filing. The worst possible outcome is that nothing changes. The $15 filing fee is non-refundable.",
  },
};

export function WhatHappensNext({ county, state = "NY", afterFiling, currentStatus, filedDate }: WhatHappensNextProps) {
  const currentStepIndex = STATUS_STEP_MAP[currentStatus] ?? 0;
  const isResolved = currentStatus === "reduced" || currentStatus === "denied";
  const isGranted = currentStatus === "reduced";
  const isDenied = currentStatus === "denied";

  const guarantee = STATE_GUARANTEE[state] ?? STATE_GUARANTEE.NY;
  const isTX = state === "TX";
  const isNJ = state === "NJ";
  const isFL = state === "FL";

  const deniedByBody = isTX
    ? "Appraisal Review Board"
    : isNJ
    ? "County Board of Taxation"
    : isFL
    ? "Special Magistrate / VAB"
    : county === "Nassau"
    ? "ARC"
    : county === "Kings" || county === "Queens" || county === "New York" || county === "Bronx" || county === "Richmond"
    ? "Tax Commission"
    : "BAR";

  return (
    <div className="space-y-5">

      {/* Nothing to lose — most important trust signal */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-900 text-sm">{guarantee.heading}</p>
          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">{guarantee.body}</p>
        </div>
      </div>

      {/* Normal silence reassurance — shown when submitted/pending */}
      {(currentStatus === "submitted" || currentStatus === "pending") && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Silence is normal — here's why</p>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">{afterFiling.normalSilence}</p>
          </div>
        </div>
      )}

      {/* Outcome panels — shown when resolved */}
      {isGranted && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Grievance granted — what happens now</p>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">{afterFiling.ifReduced}</p>
          </div>
        </div>
      )}

      {isDenied && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Denied — but you still have options</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              A denial from the {deniedByBody} is not final. You can appeal to {afterFiling.ifDenied.appealName} within {afterFiling.ifDenied.deadline}.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-primary" />
          What happens step by step
        </h4>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />

          <div className="space-y-1">
            {afterFiling.steps.map((step, i) => {
              const complete = stepIsComplete(i, currentStepIndex, currentStatus);
              const current = stepIsCurrent(i, currentStepIndex, currentStatus);

              return (
                <div key={i} className="relative flex gap-4">
                  {/* Node */}
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    complete
                      ? "bg-emerald-500 border-emerald-500"
                      : current
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}>
                    {complete
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : current
                      ? <span className="text-primary-foreground font-bold text-sm">{i + 1}</span>
                      : <span className="text-muted-foreground/50 font-bold text-sm">{i + 1}</span>
                    }
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-6 ${i === afterFiling.steps.length - 1 ? "pb-0" : ""}`}>
                    <div className={`rounded-xl border p-4 transition-all ${
                      complete
                        ? "bg-emerald-50/50 border-emerald-100"
                        : current
                        ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
                        : "bg-card border-border"
                    }`}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className={`font-semibold text-sm ${complete ? "text-emerald-800" : current ? "text-primary" : "text-foreground"}`}>
                          {step.title}
                        </p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          complete
                            ? "bg-emerald-100 text-emerald-700"
                            : current
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {step.timeframe}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                      {step.tip && current && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-primary/80 bg-primary/5 rounded-lg px-2.5 py-2">
                          <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span>{step.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* If denied — SCAR section */}
      <div className={`rounded-2xl border p-5 space-y-3 ${isDenied ? "bg-amber-50 border-amber-200" : "bg-secondary/30 border-border"}`}>
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${isDenied ? "text-amber-600" : "text-muted-foreground"}`} />
          If {isDenied ? "you were" : "you are"} denied: {afterFiling.ifDenied.appealName}
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-xl p-3 border border-border/50">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">Appeal deadline</p>
            <p className="text-sm font-semibold text-foreground">{afterFiling.ifDenied.deadline}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 border border-border/50">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">Filing fee</p>
            <p className="text-sm font-semibold text-foreground">{afterFiling.ifDenied.fee}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{afterFiling.ifDenied.description}</p>

        {afterFiling.ifDenied.url && (
          <a
            href={afterFiling.ifDenied.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {afterFiling.ifDenied.appealName} information →
          </a>
        )}
      </div>

    </div>
  );
}
