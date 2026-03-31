import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Download, ExternalLink, Mail, MapPin, Phone, Printer, FileText, AlertCircle, Send, ChevronDown, ChevronUp, CheckSquare, Lock, ShieldCheck, XCircle, Footprints, Star } from "lucide-react";
import type { Grievance, Comparable } from "@workspace/api-client-react";
import { getFilingInfo, getGenericFilingInfo } from "@/data/county-filing-instructions";
import { getTxFilingInfo } from "@/data/texas-filing-instructions";
import { getNjFilingInfo } from "@/data/nj-filing-instructions";
import { getFlFilingInfo } from "@/data/florida-filing-instructions";
import { PrePrintChecklist } from "@/components/PrePrintChecklist";
import { FilingAttestation } from "@/components/FilingAttestation";

interface FormsPrepPanelProps {
  grievance: Grievance;
  comparables: Comparable[];
  onPrint: () => void;
  onPrintComps?: () => void;
  isAttested: boolean;
  onAttest: () => void;
}

interface FormField {
  label: string;
  value: string | number | null | undefined;
  required: boolean;
  hint?: string;
}

function fieldFilled(v: string | number | null | undefined): boolean {
  return v != null && String(v).trim() !== "";
}

const NYC_COUNTIES = ["Kings", "Queens", "New York", "Bronx", "Richmond"];

function getFormsRequired(county: string, state?: string): { name: string; description: string; url?: string; isAlternate?: boolean }[] {
  if (state === "TX") {
    const txInfo = getTxFilingInfo(county);
    return [
      {
        name: txInfo.formName,
        description: `File with ${txInfo.cadName} by ${txInfo.filingDeadline}. Online filing via the CAD portal is strongly recommended for a clear record.`,
        url: txInfo.onlinePortal?.url,
      },
    ];
  }
  if (state === "FL") {
    const flInfo = getFlFilingInfo(county);
    return [
      {
        name: "DR-486 — Petition to Value Adjustment Board",
        description: `File with the ${flInfo.filingBody} by ${flInfo.filingDeadline}. A $15 filing fee is required per petition. File online via AXIA if your county supports it.`,
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Petition.aspx",
      },
    ];
  }
  if (state === "NJ") {
    const njInfo = getNjFilingInfo(county);
    return [
      {
        name: "A-1 — County Board of Taxation Petition of Appeal",
        description: `File with the ${njInfo.filingBody} by ${njInfo.filingDeadline}. For properties assessed at $1M+, you may also file directly with the NJ Tax Court (Form A-3).`,
        url: "https://www.nj.gov/treasury/taxation/lpt/tax_board_directory.shtml",
      },
      {
        name: "A-3 — NJ Tax Court Direct Filing (Properties ≥ $1M)",
        description: "If your assessed value is $1 million or more, you can bypass the County Board and file directly with the NJ Tax Court.",
        url: "https://www.njcourts.gov/courts/tax/index.html",
        isAlternate: true,
      },
    ];
  }
  if (county === "Nassau") {
    return [
      {
        name: "AR-1 — Nassau County Grievance Form",
        description: "Required by Nassau County Assessment Review Commission. File online via AROW (preferred) or mail the paper form.",
        url: "https://www.nassaucountyny.gov/agencies/Assessor/ARBReview.html",
      },
      {
        name: "RP-524 — NYS Complaint on Real Property Assessment",
        description: "Optional fallback if AROW portal is unavailable. Nassau ARC may accept RP-524 by mail.",
        isAlternate: true,
      },
    ];
  }
  if (NYC_COUNTIES.includes(county)) {
    return [
      {
        name: "TC101 — Application for Correction of Assessed Value (Class 1)",
        description: "For 1-, 2-, and 3-family homes. File with NYC Tax Commission by March 15.",
        url: "https://www.nyc.gov/site/taxcommission/forms/apply.page",
      },
      {
        name: "TC201 — Application for Correction (Class 2 / Commercial)",
        description: "For co-ops, condos, and commercial property. File with NYC Tax Commission by March 1.",
        url: "https://www.nyc.gov/site/taxcommission/forms/apply.page",
        isAlternate: true,
      },
    ];
  }
  return [
    {
      name: "RP-524 — Complaint on Real Property Assessment",
      description: "The standard NYS form used in all counties except Nassau and NYC. File with your local Board of Assessment Review.",
      url: "https://www.tax.ny.gov/pit/property/default.htm",
    },
  ];
}

function getRp524Fields(grievance: Grievance, comparables: Comparable[]): FormField[] {
  return [
    { label: "Tax Year", value: grievance.taxYear, required: true },
    { label: "Municipality (City/Town/Village)", value: grievance.municipality, required: true },
    { label: "School District", value: grievance.schoolDistrict, required: false, hint: "Optional but helpful" },
    { label: "Property Street Address", value: grievance.propertyAddress, required: true },
    { label: "Tax Map Number (Parcel ID / SBL)", value: grievance.parcelId, required: true, hint: "Found on your tax bill" },
    { label: "Property Classification Code", value: grievance.propertyClass, required: false, hint: "e.g. 210 for single-family" },
    { label: "Lot Size / Acreage", value: grievance.lotSize, required: false },
    { label: "Year Built", value: grievance.yearBuilt, required: false },
    { label: "Owner / Complainant Name", value: grievance.ownerName, required: true },
    { label: "Telephone Number", value: grievance.ownerPhone, required: true },
    { label: "Mailing Address", value: grievance.ownerMailingAddress ?? grievance.propertyAddress, required: true },
    { label: "Email Address", value: grievance.ownerEmail, required: true },
    { label: "Current Assessed Valuation", value: grievance.currentAssessment, required: true },
    { label: "Equalization Rate", value: grievance.equalizationRate, required: false, hint: "From your town's assessment roll" },
    { label: "Your Estimated Full Market Value", value: grievance.estimatedMarketValue, required: true },
    { label: "Requested Assessment", value: grievance.requestedAssessment, required: true },
    { label: "Basis of Complaint", value: grievance.basisOfComplaint, required: true, hint: "Overvaluation, Unequal, Excessive, or Unlawful" },
    { label: "Comparable Sales Evidence", value: comparables.length > 0 ? `${comparables.length} comparable${comparables.length !== 1 ? "s" : ""} added` : null, required: false, hint: "3–6 comps strongly recommended" },
  ];
}

function getNycFields(grievance: Grievance, comparables: Comparable[]): FormField[] {
  return [
    { label: "Tax Year", value: grievance.taxYear, required: true },
    { label: "Borough (County)", value: grievance.county, required: true },
    { label: "Property Address", value: grievance.propertyAddress, required: true },
    { label: "Block / Lot Number", value: grievance.parcelId, required: true, hint: "From your NYC property tax bill" },
    { label: "Owner Name", value: grievance.ownerName, required: true },
    { label: "Owner Phone", value: grievance.ownerPhone, required: true },
    { label: "Owner Email", value: grievance.ownerEmail, required: true },
    { label: "Mailing Address", value: grievance.ownerMailingAddress ?? grievance.propertyAddress, required: true },
    { label: "Current Assessed Value (Total)", value: grievance.currentAssessment, required: true },
    { label: "Market Value (Your Estimate)", value: grievance.estimatedMarketValue, required: true },
    { label: "Basis for Correction", value: grievance.basisOfComplaint, required: true },
    { label: "Supporting Comparable Sales", value: comparables.length > 0 ? `${comparables.length} added` : null, required: false },
  ];
}

function getNassauFields(grievance: Grievance, comparables: Comparable[]): FormField[] {
  return [
    { label: "Assessment Year", value: grievance.taxYear, required: true },
    { label: "Property Address", value: grievance.propertyAddress, required: true },
    { label: "Section / Block / Lot", value: grievance.parcelId, required: true, hint: "From your Nassau tax bill" },
    { label: "Owner Name", value: grievance.ownerName, required: true },
    { label: "Owner Phone", value: grievance.ownerPhone, required: true },
    { label: "Owner Email", value: grievance.ownerEmail, required: true },
    { label: "Current Assessed Value", value: grievance.currentAssessment, required: true },
    { label: "Market Value (Your Estimate)", value: grievance.estimatedMarketValue, required: true },
    { label: "Requested Assessed Value", value: grievance.requestedAssessment, required: true },
    { label: "Comparable Sales (3–6 recommended)", value: comparables.length > 0 ? `${comparables.length} added` : null, required: false },
  ];
}

function getTxFields(grievance: Grievance, comparables: Comparable[]): FormField[] {
  return [
    { label: "Tax Year", value: grievance.taxYear, required: true },
    { label: "County (Appraisal District)", value: grievance.county, required: true },
    { label: "Property Address", value: grievance.propertyAddress, required: true },
    { label: "Appraisal District Account Number", value: grievance.parcelId, required: true, hint: "From your Notice of Appraised Value" },
    { label: "Property Type", value: grievance.propertyClass, required: false },
    { label: "Owner / Complainant Name", value: grievance.ownerName, required: true },
    { label: "Owner Phone", value: grievance.ownerPhone, required: true },
    { label: "Owner Email", value: grievance.ownerEmail, required: true },
    { label: "Mailing Address", value: grievance.ownerMailingAddress ?? grievance.propertyAddress, required: true },
    { label: "CAD Appraised Value", value: grievance.currentAssessment, required: true },
    { label: "Your Opinion of Market Value", value: grievance.estimatedMarketValue, required: true },
    { label: "Requested Appraised Value", value: grievance.requestedAssessment, required: true },
    { label: "Ground(s) for Protest", value: grievance.basisOfComplaint, required: true },
    { label: "Comparable Sales Evidence", value: comparables.length > 0 ? `${comparables.length} comparable${comparables.length !== 1 ? "s" : ""} added` : null, required: false, hint: "3–6 comps strongly recommended" },
  ];
}

function getNjFields(grievance: Grievance, comparables: Comparable[]): FormField[] {
  return [
    { label: "Tax Year", value: grievance.taxYear, required: true },
    { label: "County", value: grievance.county, required: true },
    { label: "Municipality (City/Township)", value: grievance.municipality, required: true },
    { label: "Property Address", value: grievance.propertyAddress, required: true },
    { label: "Block / Lot Number", value: grievance.parcelId, required: true, hint: "From your tax bill or assessment notice" },
    { label: "Property Class", value: grievance.propertyClass, required: false, hint: "e.g. Class 2 for residential" },
    { label: "Owner / Complainant Name", value: grievance.ownerName, required: true },
    { label: "Owner Phone", value: grievance.ownerPhone, required: true },
    { label: "Owner Email", value: grievance.ownerEmail, required: true },
    { label: "Mailing Address", value: grievance.ownerMailingAddress ?? grievance.propertyAddress, required: true },
    { label: "Current Assessed Value", value: grievance.currentAssessment, required: true },
    { label: "Equalization Ratio (Chapter 123)", value: grievance.equalizationRate, required: false, hint: "Set by NJ Division of Taxation" },
    { label: "Your Estimated True Value", value: grievance.estimatedMarketValue, required: true },
    { label: "Requested Assessment", value: grievance.requestedAssessment, required: true },
    { label: "Basis of Appeal", value: grievance.basisOfComplaint, required: true },
    { label: "Comparable Sales Evidence", value: comparables.length > 0 ? `${comparables.length} comparable${comparables.length !== 1 ? "s" : ""} added` : null, required: false, hint: "3–6 comps strongly recommended" },
  ];
}

function getFlFields(grievance: Grievance, comparables: Comparable[]): FormField[] {
  return [
    { label: "Tax Year", value: grievance.taxYear, required: true },
    { label: "County", value: grievance.county, required: true },
    { label: "Property Address", value: grievance.propertyAddress, required: true },
    { label: "Parcel ID / RE Number", value: grievance.parcelId, required: true, hint: "From your TRIM notice or property tax bill" },
    { label: "Property Type", value: grievance.propertyClass, required: false, hint: "e.g. Single-Family, Condo" },
    { label: "Owner / Petitioner Name", value: grievance.ownerName, required: true },
    { label: "Owner Phone", value: grievance.ownerPhone, required: true },
    { label: "Owner Email", value: grievance.ownerEmail, required: true },
    { label: "Mailing Address", value: grievance.ownerMailingAddress ?? grievance.propertyAddress, required: true },
    { label: "Current Just Value (Property Appraiser)", value: grievance.currentAssessment, required: true },
    { label: "Your Estimated Just Value", value: grievance.estimatedMarketValue, required: true },
    { label: "Requested Just Value", value: grievance.requestedAssessment, required: true },
    { label: "Ground(s) for Petition", value: grievance.basisOfComplaint, required: true },
    { label: "$15 Filing Fee", value: "Required — pay when filing", required: true, hint: "Credit card, check, or money order" },
    { label: "Comparable Sales Evidence", value: comparables.length > 0 ? `${comparables.length} comparable${comparables.length !== 1 ? "s" : ""} added` : null, required: false, hint: "3–6 comps strongly recommended" },
  ];
}

function getFormFields(county: string, grievance: Grievance, comparables: Comparable[], state?: string): FormField[] {
  if (state === "TX") return getTxFields(grievance, comparables);
  if (state === "NJ") return getNjFields(grievance, comparables);
  if (state === "FL") return getFlFields(grievance, comparables);
  if (county === "Nassau") return getNassauFields(grievance, comparables);
  if (NYC_COUNTIES.includes(county)) return getNycFields(grievance, comparables);
  return getRp524Fields(grievance, comparables);
}

export function FormsPrepPanel({ grievance, comparables, onPrint, onPrintComps, isAttested, onAttest }: FormsPrepPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  const grievanceState: string = (grievance as any).state ?? "NY";
  const isTX = grievanceState === "TX";
  const isNJ = grievanceState === "NJ";
  const isFL = grievanceState === "FL";

  const filingInfo = isTX
    ? getTxFilingInfo(grievance.county) as any
    : isNJ
    ? getNjFilingInfo(grievance.county) as any
    : isFL
    ? getFlFilingInfo(grievance.county) as any
    : (getFilingInfo(grievance.county) ?? getGenericFilingInfo(grievance.county));

  const formsRequired = getFormsRequired(grievance.county, grievanceState);
  const formFields = getFormFields(grievance.county, grievance, comparables, grievanceState);

  const requiredFields = formFields.filter((f) => f.required);
  const optionalFields = formFields.filter((f) => !f.required);
  const filledRequired = requiredFields.filter((f) => fieldFilled(f.value)).length;
  const totalRequired = requiredFields.length;
  const completionPct = totalRequired > 0 ? Math.round((filledRequired / totalRequired) * 100) : 0;

  const isNyc = NYC_COUNTIES.includes(grievance.county);
  const isNassau = grievance.county === "Nassau";

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const el = document.getElementById("rp524-print");
      if (!el) throw new Error("Form element not found");

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = imgW / usableW;
      const scaledH = imgH / ratio;

      if (scaledH <= usableH) {
        pdf.addImage(imgData, "PNG", margin, margin, usableW, scaledH);
      } else {
        let yPos = 0;
        let page = 0;
        while (yPos < imgH) {
          if (page > 0) pdf.addPage();
          const sliceH = Math.min(usableH * ratio, imgH - yPos);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = imgW;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, -yPos);
          pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, margin, usableW, sliceH / ratio);
          yPos += sliceH;
          page++;
        }
      }

      const fileName = `RP524-${grievance.propertyAddress.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}-${grievance.taxYear}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formDisplayName = isTX ? "Notice of Protest" : isNJ ? "A-1 Petition of Appeal" : isFL ? "DR-486 Petition to Value Adjustment Board" : "RP-524";
  const assessmentLabel = isTX ? "Appraised Value" : isFL ? "Just Value" : "Assessment";
  const mailtoSubject = encodeURIComponent(`Property Tax ${isTX ? "Protest" : isFL ? "VAB Petition" : "Grievance"} — ${grievance.propertyAddress} — Tax Year ${grievance.taxYear}`);
  const mailtoBody = encodeURIComponent(
    `Dear ${filingInfo.filingBody},\n\nPlease find attached my completed ${formDisplayName} for:\n\nProperty: ${grievance.propertyAddress}\nOwner: ${grievance.ownerName}\nTax Year: ${grievance.taxYear}\nCurrent ${assessmentLabel}: $${grievance.currentAssessment.toLocaleString()}\nRequested ${assessmentLabel}: $${grievance.requestedAssessment.toLocaleString()}\n\nThank you,\n${grievance.ownerName}`
  );

  return (
    <div className="space-y-6">
      {/* Forms Required */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-secondary/40 px-6 py-4 border-b border-border">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Forms Required — {grievance.county} County{isTX ? " (Texas)" : isNJ ? " (New Jersey)" : isFL ? " (Florida)" : ""}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isTX
              ? "File your Notice of Protest with the County Appraisal District (CAD) by May 15."
              : isNJ
              ? "File Form A-1 with your County Board of Taxation by April 1."
              : isFL
              ? "File DR-486 Petition with your County Value Adjustment Board (VAB) by September 18. A $15 fee applies."
              : "Based on your county, here are the exact forms you need to complete and file."
            }
          </p>
        </div>

        <div className="p-6 space-y-4">
          {formsRequired.map((form, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border ${form.isAlternate ? "bg-secondary/20 border-dashed border-border" : "bg-primary/5 border-primary/20"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${form.isAlternate ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                {form.isAlternate ? "Alt" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${form.isAlternate ? "text-muted-foreground" : "text-foreground"}`}>{form.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{form.description}</p>
              </div>
              {form.url && (
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Official form
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Field Completion Checklist */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif font-bold text-lg">Form Fields — Completion Status</h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${completionPct === 100 ? "bg-emerald-100 text-emerald-700" : completionPct >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
              {filledRequired}/{totalRequired} required
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-emerald-500" : completionPct >= 70 ? "bg-amber-500" : "bg-red-400"}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {completionPct < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              Missing fields will appear blank on your form. Click <strong>Edit</strong> to fill them in.
            </p>
          )}
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Required fields</p>
          {requiredFields.map((field, i) => (
            <div key={i} className={`flex items-start gap-3 py-2 px-3 rounded-lg ${!fieldFilled(field.value) ? "bg-red-50 border border-red-100" : "hover:bg-secondary/30"}`}>
              {fieldFilled(field.value)
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                : <Circle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${!fieldFilled(field.value) ? "text-red-700" : "text-foreground"}`}>{field.label}</span>
                {field.hint && <span className="text-xs text-muted-foreground ml-2">({field.hint})</span>}
              </div>
              <span className={`text-xs font-mono flex-shrink-0 max-w-[200px] truncate ${fieldFilled(field.value) ? "text-muted-foreground" : "text-red-400 italic"}`}>
                {fieldFilled(field.value) ? String(field.value) : "Missing"}
              </span>
            </div>
          ))}

          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-3 pt-3 border-t border-border w-full"
            onClick={() => setShowAllFields((v) => !v)}
          >
            {showAllFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAllFields ? "Hide" : "Show"} optional fields ({optionalFields.length})
          </button>

          {showAllFields && (
            <div className="space-y-1 pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Optional fields</p>
              {optionalFields.map((field, i) => (
                <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-secondary/30">
                  {fieldFilled(field.value)
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    {field.hint && <span className="text-xs text-muted-foreground ml-2">({field.hint})</span>}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground flex-shrink-0 max-w-[200px] truncate">
                    {fieldFilled(field.value) ? String(field.value) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pre-print verification checklist */}
      <PrePrintChecklist grievance={grievance} />

      {/* Filer Sign-Off Attestation */}
      {!isAttested ? (
        <FilingAttestation
          ownerName={grievance.ownerName}
          propertyAddress={grievance.propertyAddress}
          taxYear={grievance.taxYear}
          onAttest={onAttest}
        />
      ) : (
        <div data-testid="attestation-complete-banner" className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Filer sign-off complete</p>
            <p className="text-xs text-emerald-700">All accuracy declarations confirmed. Print and download are unlocked.</p>
          </div>
        </div>
      )}

      {/* Download & Print Actions */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="font-serif font-bold text-lg mb-1">Prepare Your Document</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your form is pre-filled with all case data. Download the PDF to attach to an email, or print for hand delivery.
        </p>

        {!isAttested ? (
          <div data-testid="print-locked-message" className="flex items-center gap-3 p-4 bg-secondary/50 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Complete the filer sign-off above to unlock print and download.
          </div>
        ) : (
          <div data-testid="print-unlocked-actions" className="flex flex-wrap gap-3">
            <Button
              data-testid="download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Generating PDF…" : "Download PDF"}
            </Button>
            <Button variant="outline" onClick={onPrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </Button>
          </div>
        )}

        {(isNyc || isNassau) && isAttested && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>
              {isNassau
                ? "Nassau County strongly prefers the AROW online portal (AR-1 form). Only use the RP-524 PDF as a backup."
                : "NYC uses TC101/TC201 forms filed through the NYC Tax Commission e-filing portal — the PDF below is for reference only."}
            </span>
          </div>
        )}
      </div>

      {/* Comparable Sales Report */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-secondary/40 px-6 py-4 border-b border-border">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Comparable Sales Analysis Report
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            A formal PDF attachment showing your comparable sales evidence — required by all four states.
            Attach this to your {isTX ? "Notice of Protest" : isNJ ? "Form A-1" : isFL ? "DR-486" : "RP-524"} when filing.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {comparables.length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">No comparable sales added yet</p>
                <p className="text-xs mt-0.5">Add 3–6 comparable sales from the Comps tab to generate your report. The report includes a full analysis table, price-per-square-foot comparison, analyst narrative, and certification signature block.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-secondary/40 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">{comparables.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Comp{comparables.length !== 1 ? "s" : ""} included</div>
                </div>
                <div className="p-3 bg-secondary/40 rounded-xl text-center">
                  <div className="text-lg font-bold text-primary">
                    ${Math.round(comparables.reduce((s, c) => s + c.salePrice, 0) / comparables.length).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Avg sale price</div>
                </div>
                <div className="p-3 bg-secondary/40 rounded-xl text-center">
                  <div className="text-lg font-bold text-emerald-600">
                    ${(grievance.currentAssessment - Math.round(comparables.reduce((s, c) => s + c.salePrice, 0) / comparables.length)).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Over-assessment</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                The report includes: property summary, valuation analysis, full comp table with price-per-sq-ft, 
                analyst narrative, and a certification block for your signature.
              </div>
              <Button onClick={onPrintComps} className="gap-2 w-full" variant="outline">
                <Printer className="w-4 h-4" /> Print / Save Comparable Sales Report as PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Where to Send */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-secondary/40 px-6 py-4 border-b border-border">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> Where to Send Your Form
          </h3>
          <p className="text-xs text-muted-foreground mt-1">File with: <strong>{filingInfo.filingBody}</strong></p>
        </div>

        <div className="p-6 space-y-4">
          {filingInfo.onlinePortal && (
            <div className="flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-xl">
              <ExternalLink className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">File Online (Preferred)</p>
                <p className="text-xs opacity-80">{filingInfo.onlinePortal.label}</p>
              </div>
              <a
                href={filingInfo.onlinePortal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Open Portal
              </a>
            </div>
          )}

          {filingInfo.mailingAddress && (
            <div className="flex items-start gap-3 p-4 border border-border rounded-xl">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Mail or Hand Deliver To</p>
                <p className="font-semibold text-sm">{filingInfo.mailingAddress}</p>
              </div>
              <a
                href={`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline flex-shrink-0"
              >
                <Mail className="w-3.5 h-3.5" /> Compose email
              </a>
            </div>
          )}

          {!filingInfo.mailingAddress && !filingInfo.onlinePortal && (
            <div className="flex items-start gap-3 p-4 border border-border rounded-xl bg-secondary/30">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">File With</p>
                <p className="font-semibold text-sm">{filingInfo.filingBody}</p>
                <p className="text-xs text-muted-foreground mt-1">Contact your local assessor's office for the exact address and submission method.</p>
              </div>
            </div>
          )}

          {filingInfo.phone && (
            <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <a href={`tel:${filingInfo.phone}`} className="font-semibold text-sm text-primary hover:underline">{filingInfo.phone}</a>
              </div>
            </div>
          )}

          {/* How to Submit — Delivery Method Guide */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary/40 px-4 py-3 border-b border-border flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm">How to Submit — Recommended Method</p>
            </div>
            <div className="divide-y divide-border">

              {filingInfo.onlinePortal && (
                <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50/40">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mt-0.5">
                    <Star className="w-3 h-3 text-emerald-700" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800">Option 1 — File online (Best)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Go to <strong>{filingInfo.onlinePortal.label}</strong> and submit electronically. The portal timestamps your filing instantly and sends a confirmation — no stamp, no envelope, no guesswork.
                    </p>
                    <a
                      href={filingInfo.onlinePortal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Open {filingInfo.onlinePortal.label}
                    </a>
                  </div>
                </div>
              )}

              {filingInfo.mailingAddress && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mt-0.5">
                    <Footprints className="w-3 h-3 text-emerald-700" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800">
                      Option {filingInfo.onlinePortal ? "2" : "1"} — Walk it in (Highly recommended)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bring <strong>two printed copies</strong> in person to:
                    </p>
                    <div className="mt-1.5 px-3 py-2 bg-secondary/60 rounded-lg border border-border text-xs">
                      <p className="font-bold text-foreground">{filingInfo.filingBody}</p>
                      <p className="text-muted-foreground mt-0.5">{filingInfo.mailingAddress}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Ask the clerk to <strong>date-stamp your second copy</strong> and return it to you. That stamped copy is your legal proof of timely filing — keep it in a safe place.
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(filingInfo.mailingAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <MapPin className="w-3 h-3" /> Get directions
                    </a>
                  </div>
                </div>
              )}

              {filingInfo.mailingAddress && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mt-0.5">
                    <Mail className="w-3 h-3 text-amber-700" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      Option {filingInfo.onlinePortal ? "3" : "2"} — Certified Mail + Return Receipt (Good)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mail your form to:
                    </p>
                    <div className="mt-1.5 px-3 py-2 bg-secondary/60 rounded-lg border border-border text-xs">
                      <p className="font-bold text-foreground">{filingInfo.filingBody}</p>
                      <p className="text-muted-foreground mt-0.5">{filingInfo.mailingAddress}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      At the post office ask for <strong>Certified Mail</strong> (USPS Form 3800) <em>and</em> a <strong>Return Receipt</strong> (PS Form 3811 — the green postcard). The signed postcard mails back to you and proves the office received your form before the deadline. Cost: roughly $8–10.
                    </p>
                  </div>
                </div>
              )}

              {!filingInfo.mailingAddress && !filingInfo.onlinePortal && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mt-0.5">
                    <Footprints className="w-3 h-3 text-emerald-700" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Contact {filingInfo.filingBody} for address</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your county's filing address isn't in our database yet. Call or visit the {filingInfo.filingBody} website to get the correct address, then hand-deliver or send via certified mail with return receipt.
                    </p>
                    {filingInfo.phone && (
                      <a href={`tel:${filingInfo.phone}`} className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-primary hover:underline">
                        <Phone className="w-3 h-3" /> Call {filingInfo.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 px-4 py-3 bg-red-50/50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 border border-red-300 flex items-center justify-center mt-0.5">
                  <XCircle className="w-3 h-3 text-red-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Do not use regular first-class mail</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No tracking, no proof of delivery. If it arrives a day late or gets lost in the mail, your grievance is dismissed and you have no recourse. Always use certified mail if you're mailing.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>Typical deadline:</strong> {filingInfo.filingDeadline}
              {grievance.filingDeadline && (
                <> — Your deadline: <strong>{new Date(grievance.filingDeadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
