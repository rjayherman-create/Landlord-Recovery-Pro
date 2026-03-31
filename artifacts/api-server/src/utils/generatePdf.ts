import PDFDocument from "pdfkit";

const STATE_FORM: Record<string, string> = {
  NY: "RP-524",
  NJ: "A-1",
  TX: "Notice of Protest",
  FL: "DR-486",
};

const FILING_BODY: Record<string, string> = {
  NY: "Board of Assessment Review (BAR) / SCAR",
  NJ: "County Board of Taxation",
  TX: "Appraisal Review Board (ARB)",
  FL: "Value Adjustment Board (VAB)",
};

const DEADLINE: Record<string, string> = {
  NY: "Grievance Day (4th Tuesday in May for most counties)",
  NJ: "April 1 (or April 30 for most counties)",
  TX: "May 15 (or 30 days after Notice of Appraised Value)",
  FL: "September 18 (25 days after TRIM notice)",
};

function fmt(n: number | string | null | undefined): string {
  if (n == null || n === "") return "N/A";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return String(n);
  return "$" + num.toLocaleString("en-US");
}

function line(doc: PDFDocument, startX: number, startY: number, endX: number) {
  doc.moveTo(startX, startY).lineTo(endX, startY).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
}

function sectionHeader(doc: PDFDocument, text: string, y: number) {
  doc.rect(72, y, 468, 18).fill("#1e3a5f");
  doc.fill("white").fontSize(9).font("Helvetica-Bold").text(text.toUpperCase(), 80, y + 4);
  doc.fill("black");
}

function row(doc: PDFDocument, label: string, value: string, x: number, y: number, halfWidth = false) {
  const w = halfWidth ? 220 : 460;
  doc.font("Helvetica").fontSize(8).fill("#64748b").text(label, x, y);
  doc.font("Helvetica-Bold").fontSize(9).fill("#1e293b").text(value, x, y + 11, { width: w });
}

export async function generateAppealPDF(data: {
  grievance: Record<string, any>;
  comparables: Record<string, any>[];
}): Promise<Buffer> {
  const g = data.grievance;
  const comps = data.comparables;
  const state: string = (g.state || g.county?.slice(-2) || "NY").toUpperCase();
  const formName = STATE_FORM[state] || "Appeal Form";
  const filingBody = FILING_BODY[state] || "Assessment Review Board";
  const deadline = DEADLINE[state] || "Check your local jurisdiction";

  const doc = new PDFDocument({ size: "LETTER", margin: 72, info: { Title: `${formName} — TaxAppeal DIY`, Author: g.ownerName } });
  const buffers: Buffer[] = [];
  doc.on("data", (b: Buffer) => buffers.push(b));

  const generated = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  const pageW = 612 - 144;
  const midX = 72 + pageW / 2 + 8;

  // ── HEADER BANNER ──────────────────────────────────────────────────────────
  doc.rect(0, 0, 612, 90).fill("#0f172a");
  doc.fill("white").fontSize(22).font("Helvetica-Bold").text("TaxAppeal DIY", 72, 22);
  doc.font("Helvetica").fontSize(10).fill("#94a3b8").text("Professional Property Tax Appeal Document", 72, 50);
  doc.fill("#38bdf8").fontSize(11).font("Helvetica-Bold").text(formName, 72, 66);
  doc.fill("#94a3b8").fontSize(9).font("Helvetica").text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 400, 70, { align: "right", width: 140 });
  doc.fill("black");

  let y = 108;

  // ── FILING INFORMATION ─────────────────────────────────────────────────────
  sectionHeader(doc, "Filing Information", y);
  y += 26;
  row(doc, "State Form", formName, 72, y, true);
  row(doc, "File With", filingBody, midX, y, true);
  y += 36;
  row(doc, "Typical Deadline", deadline, 72, y);
  y += 36;
  line(doc, 72, y, 540); y += 8;

  // ── PROPERTY OWNER ─────────────────────────────────────────────────────────
  sectionHeader(doc, "Property Owner / Complainant", y);
  y += 26;
  row(doc, "Owner Name", g.ownerName || "N/A", 72, y, true);
  row(doc, "Phone", g.ownerPhone || "N/A", midX, y, true);
  y += 36;
  row(doc, "Email", g.ownerEmail || "N/A", 72, y, true);
  row(doc, "Tax Year", String(g.taxYear || new Date().getFullYear()), midX, y, true);
  y += 36;
  row(doc, "Mailing Address", g.ownerMailingAddress || g.propertyAddress || "N/A", 72, y);
  y += 36;
  line(doc, 72, y, 540); y += 8;

  // ── PROPERTY DETAILS ───────────────────────────────────────────────────────
  sectionHeader(doc, "Property Information", y);
  y += 26;
  row(doc, "Property Address", g.propertyAddress || "N/A", 72, y);
  y += 36;
  row(doc, "County", g.county || "N/A", 72, y, true);
  row(doc, "Municipality / Town", g.municipality || "N/A", midX, y, true);
  y += 36;
  row(doc, "Parcel ID / SBL", g.parcelId || "N/A", 72, y, true);
  row(doc, "Property Class", g.propertyClass || "N/A", midX, y, true);
  y += 36;
  row(doc, "School District", g.schoolDistrict || "N/A", 72, y, true);
  row(doc, "Year Built", g.yearBuilt ? String(g.yearBuilt) : "N/A", midX, y, true);
  y += 36;
  row(doc, "Living Area (sq ft)", g.livingArea ? `${Number(g.livingArea).toLocaleString()} sq ft` : "N/A", 72, y, true);
  row(doc, "Lot Size", g.lotSize || "N/A", midX, y, true);
  y += 36;
  line(doc, 72, y, 540); y += 8;

  // ── ASSESSMENT FIGURES ─────────────────────────────────────────────────────
  sectionHeader(doc, "Assessment & Value", y);
  y += 26;

  const currentAV = Number(g.currentAssessment) || 0;
  const eqRate = Number(g.equalizationRate) || 100;
  const impliedMV = eqRate > 0 && eqRate < 100 ? currentAV / (eqRate / 100) : currentAV;
  const estimatedMV = Number(g.estimatedMarketValue) || 0;
  const requestedAV = Number(g.requestedAssessment) || 0;
  const reduction = currentAV - requestedAV;
  const pctReduction = currentAV > 0 ? ((reduction / currentAV) * 100).toFixed(1) : "0";

  row(doc, "Current Assessed Value", fmt(currentAV), 72, y, true);
  row(doc, "Equalization Rate", eqRate < 100 ? `${eqRate}%` : "100% (full value)", midX, y, true);
  y += 36;
  row(doc, "Implied Market Value (current AV ÷ eq. rate)", fmt(impliedMV), 72, y, true);
  row(doc, "Your Estimated Market Value", fmt(estimatedMV), midX, y, true);
  y += 36;
  row(doc, "Requested Assessed Value", fmt(requestedAV), 72, y, true);
  row(doc, "Requested Reduction", `${fmt(reduction)} (${pctReduction}%)`, midX, y, true);
  y += 36;
  line(doc, 72, y, 540); y += 8;

  // ── BASIS OF COMPLAINT ─────────────────────────────────────────────────────
  sectionHeader(doc, "Basis of Complaint", y);
  y += 26;
  const basisMap: Record<string, string> = {
    overassessment: "Unequal Assessment / Overassessment — Property is assessed above market value",
    excessive: "Excessive Assessment — Assessment exceeds full market value",
    unequal: "Unequal Assessment — Assessed at higher percentage than comparable properties",
    unlawful: "Unlawful Assessment — Property is exempt or assessment is otherwise unlawful",
    misclassified: "Misclassification — Property is placed in wrong tax class",
  };
  const basisText = basisMap[g.basisOfComplaint] || g.basisOfComplaint || "Overassessment";
  doc.font("Helvetica").fontSize(9).fill("#1e293b").text(basisText, 72, y, { width: 468 });
  y += 30;
  if (g.notes) {
    doc.font("Helvetica-Oblique").fontSize(8.5).fill("#475569").text(`Supporting notes: ${g.notes}`, 72, y, { width: 468 });
    y += doc.heightOfString(g.notes, { width: 468 }) + 10;
  }
  line(doc, 72, y, 540); y += 8;

  // ── COMPARABLE SALES ───────────────────────────────────────────────────────
  if (comps && comps.length > 0) {
    if (y > 580) { doc.addPage(); y = 72; }
    sectionHeader(doc, `Comparable Sales (${comps.length} properties)`, y);
    y += 26;

    const colW = [180, 60, 55, 60, 70, 55];
    const headers = ["Address", "Sale Date", "Sale Price", "Sq Ft", "$/Sq Ft", "Assessed"];
    const colX = [72, 252, 312, 367, 427, 487];

    doc.rect(72, y, 468, 16).fill("#f1f5f9");
    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").fontSize(7.5).fill("#475569").text(h, colX[i], y + 4, { width: colW[i] });
    });
    doc.fill("black");
    y += 18;

    comps.forEach((c, idx) => {
      if (y > 680) { doc.addPage(); y = 72; }
      if (idx % 2 === 0) doc.rect(72, y, 468, 22).fill("#fafafa");
      const pricePerSqFt = c.squareFeet && c.salePrice ? (Number(c.salePrice) / Number(c.squareFeet)).toFixed(0) : "—";
      const vals = [
        c.address || "—",
        c.saleDate ? new Date(c.saleDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—",
        fmt(c.salePrice),
        c.squareFeet ? Number(c.squareFeet).toLocaleString() : "—",
        pricePerSqFt !== "—" ? `$${pricePerSqFt}` : "—",
        fmt(c.assessedValue),
      ];
      vals.forEach((v, i) => {
        doc.font("Helvetica").fontSize(8).fill("#1e293b").text(String(v), colX[i], y + 5, { width: colW[i] - 4 });
      });
      doc.fill("black");
      y += 24;
    });

    const avgPrice = comps.reduce((s, c) => s + (Number(c.salePrice) || 0), 0) / comps.length;
    y += 6;
    doc.font("Helvetica-Bold").fontSize(8.5).fill("#1e293b")
      .text(`Average comparable sale price: ${fmt(avgPrice)}`, 72, y);
    y += 18;

    if (estimatedMV < avgPrice) {
      doc.font("Helvetica").fontSize(8.5).fill("#16a34a")
        .text(`✓ Your estimated market value (${fmt(estimatedMV)}) is BELOW the comparable average — supporting your appeal.`, 72, y, { width: 468 });
      y += 20;
    } else if (avgPrice > 0) {
      doc.font("Helvetica").fontSize(8.5).fill("#dc2626")
        .text(`Your estimated market value (${fmt(estimatedMV)}) exceeds the comparable average. Consider revising your estimate or adding stronger comparables.`, 72, y, { width: 468 });
      y += 20;
    }
    line(doc, 72, y, 540); y += 8;
  } else {
    if (y > 680) { doc.addPage(); y = 72; }
    sectionHeader(doc, "Comparable Sales", y);
    y += 26;
    doc.font("Helvetica-Oblique").fontSize(9).fill("#94a3b8")
      .text("No comparable sales were added. Adding 3–6 recent sales below your assessment will strengthen your case.", 72, y, { width: 468 });
    y += 30;
    line(doc, 72, y, 540); y += 8;
  }

  // ── DECLARATION / SIGNATURE ────────────────────────────────────────────────
  if (y > 620) { doc.addPage(); y = 72; }
  sectionHeader(doc, "Complainant Declaration", y);
  y += 26;
  const declaration = state === "NY"
    ? "I hereby certify that the statements made herein are true, and that this complaint is not made for purposes of delay. I understand that making false statements herein is punishable as a Class A misdemeanor pursuant to Penal Law § 210.45."
    : state === "NJ"
    ? "I hereby certify that the foregoing statements made by me are true. I am aware that if any of the foregoing statements made by me are willfully false, I am subject to punishment."
    : state === "TX"
    ? "I swear or affirm that the information provided in this Notice of Protest is true and correct to the best of my knowledge and belief."
    : "Under penalties of perjury, I declare that I have read the foregoing petition and the facts alleged are true and correct.";
  doc.font("Helvetica").fontSize(8.5).fill("#475569").text(declaration, 72, y, { width: 468 });
  y += doc.heightOfString(declaration, { width: 468 }) + 20;

  doc.font("Helvetica").fontSize(8.5).fill("#1e293b").text("Signature: _________________________________", 72, y);
  doc.text(`Date: _________________`, 350, y);
  y += 28;
  doc.text(`Print Name: ${g.ownerName || "_________________________________"}`, 72, y);
  y += 40;
  line(doc, 72, y, 540); y += 10;

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  doc.font("Helvetica").fontSize(7.5).fill("#94a3b8")
    .text(
      "Generated by TaxAppeal DIY · taxappealdiy.com · This document does not constitute legal advice. Consult a licensed attorney or tax professional for specific guidance.",
      72, y, { width: 468, align: "center" }
    );

  doc.end();
  return generated;
}
