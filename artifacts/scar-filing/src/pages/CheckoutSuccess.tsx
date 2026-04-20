import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Download, Loader2, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("caseId");
  const sessionId = params.get("session_id");
  const [downloading, setDownloading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    if (caseId && sessionId) {
      setDownloadReady(true);
    }
  }, [caseId, sessionId]);

  const handleDownload = () => {
    if (!caseId || !sessionId) return;
    setDownloading(true);
    const url = `${API_BASE}/api/small-claims/download/${caseId}?session_id=${sessionId}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `small-claims-case-${caseId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-3">Payment confirmed!</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Your court filing form is ready. Download it below, bring it to your local courthouse, and you're on your way.
      </p>

      {downloadReady && (
        <div className="space-y-3 mb-8">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Preparing download...</>
            ) : (
              <><Download className="w-4 h-4" /> Download Court PDF</>
            )}
          </button>
          <p className="text-xs text-muted-foreground">
            Your download link is saved — you can also access it from My Cases anytime.
          </p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-1">Next steps:</p>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Download and print your completed court form</li>
          <li>Visit your local small claims court clerk's office</li>
          <li>Submit the form with your filing fee</li>
          <li>Serve the defendant with a copy</li>
          <li>Appear on your hearing date</li>
        </ol>
      </div>

      <button
        onClick={() => setLocation("/cases")}
        className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-6 py-2.5 rounded-md hover:bg-secondary/50 transition-colors"
      >
        View My Cases <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
        SmallClaims AI provides self-help tools and general information only. It is not a law firm and does not
        provide legal advice or representation. You are responsible for reviewing and filing your documents.
        Laws and procedures vary by jurisdiction — verify current requirements with your local courthouse.{" "}
        <a href="../disclaimer" className="underline hover:text-foreground transition-colors">Full Disclaimer</a>
      </p>
    </div>
  );
}
