import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Download, ExternalLink, Mail, MapPin, Phone, Printer, FileText, AlertCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import type { Grievance, Comparable } from "@workspace/api-client-react";
import { getFilingInfo, getGenericFilingInfo } from "@/data/county-filing-instructions";
import { PrePrintChecklist } from "@/components/PrePrintChecklist";

interface FormsPrepPanelProps {
  grievance: Grievance;
  comparables: Comparable[];
  onPrint: () => void;
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

function getFormsRequired(county: string): { name: string; description: string; url?: string; isAlternate?: boolean }[] {
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
    { label: "Telephone Number", value: grievance.ownerPhone, required: false },
    { label: "Mailing Address", value: grievance.ownerMailingAddress ?? grievance.propertyAddress, required: true },
    { label: "Email Address", value: grievance.ownerEmail, required: false },
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
    { label: "Owner Phone", value: grievance.ownerPhone, required: false },
    { label: "Owner Email", value: grievance.ownerEmail, required: false },
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
    { label: "Owner Phone", value: grievance.ownerPhone, required: false },
    { label: "Owner Email", value: grievance.ownerEmail, required: false },
    { label: "Current Assessed Value", value: grievance.currentAssessment, required: true },
    { label: "Market Value (Your Estimate)", value: grievance.estimatedMarketValue, required: true },
    { label: "Requested Assessed Value", value: grievance.requestedAssessment, required: true },
    { label: "Comparable Sales (3–6 recommended)", value: comparables.length > 0 ? `${comparables.length} added` : null, required: false },
  ];
}

function getFormFields(county: string, grievance: Grievance, comparables: Comparable[]): FormField[] {
  if (county === "Nassau") return getNassauFields(grievance, comparables);
  if (NYC_COUNTIES.includes(county)) return getNycFields(grievance, comparables);
  return getRp524Fields(grievance, comparables);
}

export function FormsPrepPanel({ grievance, comparables, onPrint }: FormsPrepPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  const filingInfo = getFilingInfo(grievance.county) ?? getGenericFilingInfo(grievance.county);
  const formsRequired = getFormsRequired(grievance.county);
  const formFields = getFormFields(grievance.county, grievance, comparables);

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

  const mailtoSubject = encodeURIComponent(`Property Tax Grievance — ${grievance.propertyAddress} — Tax Year ${grievance.taxYear}`);
  const mailtoBody = encodeURIComponent(
    `Dear ${filingInfo.filingBody},\n\nPlease find attached my completed RP-524 Complaint on Real Property Assessment for:\n\nProperty: ${grievance.propertyAddress}\nOwner: ${grievance.ownerName}\nTax Year: ${grievance.taxYear}\nCurrent Assessment: $${grievance.currentAssessment.toLocaleString()}\nRequested Assessment: $${grievance.requestedAssessment.toLocaleString()}\n\nThank you,\n${grievance.ownerName}`
  );

  return (
    <div className="space-y-6">
      {/* Forms Required */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-secondary/40 px-6 py-4 border-b border-border">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Forms Required for {grievance.county} County
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Based on your county, here are the exact forms you need to complete and file.
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

      {/* Download & Print Actions */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="font-serif font-bold text-lg mb-1">Prepare Your Document</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your form is pre-filled with all case data. Download the PDF to attach to an email, or print for hand delivery.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
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

        {(isNyc || isNassau) && (
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
