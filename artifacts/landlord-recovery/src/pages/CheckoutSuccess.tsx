import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Download, Loader2, FileText } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("caseId");
  const sessionId = params.get("session_id");

  const isFilingKit = !!(caseId && sessionId);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (isFilingKit && !downloaded) {
      handleDownload();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const url = `/api/landlord/pdf/${caseId}/download?session_id=${encodeURIComponent(sessionId!)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Download failed. Please try again.");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `filing-kit-case-${caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      setDownloaded(true);
    } catch (err: any) {
      alert(err.message ?? "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  if (isFilingKit) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Payment Successful</h1>
            <p className="text-muted-foreground text-lg">
              Your filing kit is ready. Your demand letter and court filing guide are downloading now.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3 text-left">
            <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Filing Kit includes:</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                <li>Formal demand letter (ready to print and send)</li>
                <li>Small claims court filing guide for your state</li>
                <li>Evidence checklist and filing instructions</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button onClick={handleDownload} disabled={downloading} className="bg-primary">
              {downloading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Preparing PDF...</>
              ) : downloaded ? (
                <><Download className="h-4 w-4 mr-2" />Download Again</>
              ) : (
                <><Download className="h-4 w-4 mr-2" />Download Filing Kit</>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/cases/${caseId}`}>
                Back to Case <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          {downloaded && (
            <p className="text-sm text-muted-foreground">
              You can re-download this kit at any time from the case Documents tab.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Payment Successful</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to Recovery Pro. You now have full access to AI demand letters,
            premium document exports, and court-specific filing instructions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-primary">
            <Link to="/dashboard">
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/cases/new">Start a New Case</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
