import { useState } from "react";
import { Shield, CheckSquare, Square, Lock, Unlock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilingAttestationProps {
  ownerName: string | null | undefined;
  propertyAddress: string;
  taxYear: number;
  onAttest: () => void;
}

const DECLARATIONS = [
  {
    id: "accuracy",
    text: "I have personally reviewed every field in this filing and verified the values against my official property tax bill and county assessment records. I confirm all information is correct.",
  },
  {
    id: "truthful",
    text: "The information I am submitting is truthful, accurate, and complete to the best of my knowledge. I am not making any false or misleading statements.",
  },
  {
    id: "responsibility",
    text: "I understand that NY Property Tax Grievance Assistant provides self-help guidance only and does not constitute legal advice. I am solely responsible for the accuracy, completeness, and timeliness of my own filing.",
  },
  {
    id: "consequences",
    text: "I acknowledge that filing a fraudulent or materially false complaint may result in rejection of my application, personal liability, and other legal consequences under New York law.",
  },
];

export function FilingAttestation({ ownerName, propertyAddress, taxYear, onAttest }: FilingAttestationProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = DECLARATIONS.every((d) => checked[d.id]);
  const checkedCount = DECLARATIONS.filter((d) => checked[d.id]).length;

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="bg-card rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-amber-900">Filer Sign-Off Required</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              You must read and confirm each statement below before printing or downloading.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <p>
            <strong>This is a legal filing.</strong> The completed form you print will be submitted to a government
            body as an official complaint. By signing off below, you are confirming the accuracy of your filing and
            accepting full personal responsibility for its contents.
          </p>
        </div>

        <div className="space-y-3">
          {DECLARATIONS.map((decl) => {
            const isChecked = !!checked[decl.id];
            return (
              <button
                key={decl.id}
                type="button"
                data-testid={`declaration-${decl.id}`}
                onClick={() => toggle(decl.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                  isChecked
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-secondary/30 border-border hover:border-amber-300 hover:bg-amber-50/40"
                }`}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                </span>
                <span className={`text-sm leading-relaxed ${isChecked ? "text-emerald-900" : "text-foreground"}`}>
                  {decl.text}
                </span>
              </button>
            );
          })}
        </div>

        {allChecked && (
          <div className="p-4 bg-secondary/40 rounded-xl border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">Declaration summary</p>
            <p>
              <strong>Filer:</strong> {ownerName || "Property owner"}
            </p>
            <p>
              <strong>Property:</strong> {propertyAddress}
            </p>
            <p>
              <strong>Tax Year:</strong> {taxYear}
            </p>
            <p>
              <strong>Date of attestation:</strong> {today}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <div className="flex-1">
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-amber-400 transition-all duration-300"
                style={{ width: `${(checkedCount / DECLARATIONS.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {checkedCount} of {DECLARATIONS.length} declarations confirmed
            </p>
          </div>

          <Button
            data-testid="signoff-btn"
            onClick={onAttest}
            disabled={!allChecked}
            className={`gap-2 flex-shrink-0 transition-all duration-200 ${
              allChecked
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {allChecked ? (
              <>
                <Unlock className="w-4 h-4" />
                Sign Off &amp; Unlock Print
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Confirm all {DECLARATIONS.length} statements
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
