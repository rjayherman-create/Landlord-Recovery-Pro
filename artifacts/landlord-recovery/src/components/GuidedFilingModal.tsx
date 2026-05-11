import { ExternalLink, CheckCircle2, FileText, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StateCourtEntry } from "@/data/stateCourtData";

interface Props {
  open: boolean;
  onClose: () => void;
  stateData: StateCourtEntry | null;
}

const PACKAGE_ITEMS = [
  "Complaint forms prepared",
  "Evidence packet organized",
  "Defendant information reviewed",
  "Filing checklist generated",
];

const AFTER_FILING_ITEMS = [
  "Service tracking",
  "Hearing preparation",
  "Judgment collection tools",
  "Tenant tracking workflow",
  "Deadline reminders",
];

export default function GuidedFilingModal({ open, onClose, stateData }: Props) {
  if (!open || !stateData) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl border border-border max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-foreground text-background p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-accent text-sm font-medium mb-1">Guided Filing Assistant</p>
              <h2 className="text-2xl font-serif font-bold">File in {stateData.state}</h2>
              <p className="text-background/70 mt-2 text-sm max-w-2xl">
                Landlord Recovery organizes your documents, evidence, deadlines, and recovery workflow.
                The official court site is only used to submit the filing.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-background/60 hover:text-background transition-colors shrink-0 mt-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto flex-1">

          {/* Left panel — steps + actions */}
          <div className="p-7 border-b lg:border-b-0 lg:border-r border-border">

            {/* Filing package ready */}
            <div className="bg-accent/8 border border-accent/20 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-base mb-3">Your Filing Package Is Ready</h3>
              <ul className="space-y-2.5">
                {PACKAGE_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Filing steps */}
            <div>
              <h3 className="text-base font-semibold mb-4">Filing Steps</h3>
              <div className="space-y-4">
                {stateData.filingSteps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground pt-1 leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => { window.location.href = "/landlord-recovery/cases"; }}
              >
                <Download className="h-4 w-4" />
                Download Filing Packet
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { window.location.href = "/landlord-recovery/cases"; }}
              >
                <FileText className="h-4 w-4" />
                Preview Documents
              </Button>
            </div>
          </div>

          {/* Right panel — court info + after filing */}
          <div className="bg-muted/30 p-7 space-y-5">

            {/* Court info card */}
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold mb-4">Official Court Filing Portal</h3>

              <div className="space-y-3 text-sm divide-y divide-border">
                <div className="flex justify-between pb-3">
                  <span className="text-muted-foreground">Maximum Claim</span>
                  <span className="font-bold text-foreground">{stateData.limit}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Filing Fee</span>
                  <span className="font-semibold">{stateData.filingFee}</span>
                </div>
                {stateData.notes && (
                  <div className="flex justify-between pt-3">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="font-medium text-right max-w-[60%]">{stateData.notes}</span>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <a
                  href={stateData.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-foreground hover:opacity-90 text-background rounded-xl px-5 py-3.5 flex items-center justify-center gap-2 font-semibold text-sm transition-opacity"
                >
                  Continue to Official Court Site
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="text-xs text-muted-foreground mt-3 text-center">
                You can return to your dashboard at any time to manage service, deadlines, and judgment recovery.
              </p>
            </div>

            {/* After filing */}
            <div className="bg-background border border-border rounded-xl p-5">
              <h3 className="font-semibold text-base mb-4">After Filing — What We Track</h3>
              <div className="space-y-2.5">
                {AFTER_FILING_ITEMS.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
