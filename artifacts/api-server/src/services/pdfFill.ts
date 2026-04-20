import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

// ── State configurations ────────────────────────────────────────────────────
type StateConfig = {
  courtName: string;
  courtSubtitle: string;
  filingFeeRange: string;
  claimLimit: string;
  filingInstructions: string[];
};

export const formMap: Record<string, StateConfig> = {
  NY: {
    courtName: "New York State Unified Court System",
    courtSubtitle: "Small Claims Court",
    claimLimit: "$10,000",
    filingFeeRange: "$15–$20",
    filingInstructions: [
      "File this form at your local City Court, District Court, or Justice Court.",
      "Bring two copies — one for the court and one for your records.",
      "Pay the filing fee ($15–$20 depending on amount claimed).",
      "The court will serve the defendant by certified mail.",
      "Bring this form and all evidence to your hearing date.",
    ],
  },
  CA: {
    courtName: "Superior Court of California",
    courtSubtitle: "Small Claims Division (SC-100)",
    claimLimit: "$12,500 (individuals) / $6,250 (businesses)",
    filingFeeRange: "$30–$100",
    filingInstructions: [
      "File this form at your county's Superior Court Small Claims division.",
      "Individuals may claim up to $12,500; businesses up to $6,250.",
      "Pay the filing fee ($30–$100 based on amount).",
      "You are responsible for serving the defendant — use certified mail or a process server.",
      "Attend your hearing with this form and all supporting evidence.",
    ],
  },
  NJ: {
    courtName: "New Jersey Superior Court",
    courtSubtitle: "Special Civil Part — Small Claims Section",
    claimLimit: "$5,000",
    filingFeeRange: "$35–$50",
    filingInstructions: [
      "File this form at the Special Civil Part office in your county courthouse.",
      "Claims must not exceed $5,000.",
      "Pay the filing fee ($35–$50).",
      "The court will serve the defendant via certified mail.",
      "Bring this completed form and all evidence to your scheduled hearing.",
    ],
  },
  FL: {
    courtName: "Florida County Court",
    courtSubtitle: "Small Claims Division",
    claimLimit: "$8,000",
    filingFeeRange: "$55–$300",
    filingInstructions: [
      "File this form at the Clerk of Courts office in the county where the defendant lives or where the incident occurred.",
      "Claims must not exceed $8,000.",
      "Pay the filing fee (varies by amount — typically $55–$300).",
      "The clerk will serve the defendant via certified mail.",
      "Arrive early on your hearing date with all evidence and copies of this form.",
    ],
  },
  TX: {
    courtName: "Texas Justice Court",
    courtSubtitle: "Small Claims Proceeding",
    claimLimit: "$20,000",
    filingFeeRange: "$46–$100",
    filingInstructions: [
      "File this form at the Justice Court (JP Court) in the precinct where the defendant resides or where the contract was performed.",
      "Claims must not exceed $20,000.",
      "Pay the filing fee (typically $46–$100).",
      "You are responsible for serving the defendant — ask the court clerk for options.",
      "Bring this form and all evidence to your hearing.",
    ],
  },
  PA: {
    courtName: "Pennsylvania Magisterial District Court",
    courtSubtitle: "Civil Action — Small Claims",
    claimLimit: "$12,000",
    filingFeeRange: "$50–$100",
    filingInstructions: [
      "File this form at the Magisterial District Court in the district where the defendant lives or where the transaction occurred.",
      "Claims must not exceed $12,000.",
      "Pay the filing fee (approximately $50–$100).",
      "The court will serve the defendant.",
      "Bring this form and all supporting documentation to your hearing.",
    ],
  },
  IL: {
    courtName: "Illinois Circuit Court",
    courtSubtitle: "Small Claims Division",
    claimLimit: "$10,000",
    filingFeeRange: "$50–$150",
    filingInstructions: [
      "File this form at the Clerk of the Circuit Court in the county where the defendant lives or where the incident occurred.",
      "Claims must not exceed $10,000.",
      "Pay the filing fee (varies by county — typically $50–$150).",
      "You are responsible for serving the defendant via sheriff or certified mail.",
      "Attend your hearing with all evidence and this completed form.",
    ],
  },
  OH: {
    courtName: "Ohio Municipal / County Court",
    courtSubtitle: "Small Claims Division",
    claimLimit: "$6,000",
    filingFeeRange: "$30–$75",
    filingInstructions: [
      "File this form at your local Municipal Court or County Court Small Claims division.",
      "Claims must not exceed $6,000.",
      "Pay the filing fee (approximately $30–$75).",
      "The court will serve the defendant.",
      "Bring this form and all evidence to your scheduled hearing.",
    ],
  },
  GA: {
    courtName: "Georgia Magistrate Court",
    courtSubtitle: "Small Claims Division",
    claimLimit: "$15,000",
    filingFeeRange: "$50–$100",
    filingInstructions: [
      "File this form at the Magistrate Court in the county where the defendant lives or where the incident occurred.",
      "Claims must not exceed $15,000.",
      "Pay the filing fee (approximately $50–$100).",
      "The court will serve the defendant via certified mail.",
      "Bring this form and all evidence to your hearing date.",
    ],
  },
  NC: {
    courtName: "North Carolina District Court",
    courtSubtitle: "Small Claims Division (Magistrate's Court)",
    claimLimit: "$10,000",
    filingFeeRange: "$96",
    filingInstructions: [
      "File this form at the Clerk of Superior Court office in the county where the defendant lives.",
      "Claims must not exceed $10,000.",
      "Pay the filing fee (approximately $96).",
      "The court will serve the defendant via certified mail.",
      "Bring this completed form and all evidence to your magistrate hearing.",
    ],
  },
};

export type CourtPDFInput = {
  state: string;
  claimantName: string;
  claimantAddress?: string | null;
  claimantEmail?: string | null;
  claimantPhone?: string | null;
  defendantName: string;
  defendantAddress?: string | null;
  defendantEmail?: string | null;
  claimAmount: number;
  claimType?: string | null;
  claimDescription: string;
  incidentDate?: string | null;
  desiredOutcome?: string | null;
  evidenceFiles?: { fileName: string; mimeType?: string | null }[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function drawHRule(page: PDFPage, y: number, margin: number, width: number, color = rgb(0.75, 0.75, 0.75)) {
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color });
}

function drawSectionLabel(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  pageWidth: number,
  margin: number
) {
  page.drawRectangle({
    x: margin,
    y: y - 4,
    width: pageWidth - margin * 2,
    height: 16,
    color: rgb(0.93, 0.95, 0.99),
  });
  page.drawText(text.toUpperCase(), { x, y, size: 7.5, font, color: rgb(0.3, 0.3, 0.55) });
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + word).length > maxCharsPerLine) {
      if (line) lines.push(line.trimEnd());
      line = word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

// ── Main PDF generator ───────────────────────────────────────────────────────

export async function generateCourtPDF(data: CourtPDFInput): Promise<Uint8Array> {
  const config = formMap[data.state];
  if (!config) throw new Error(`No configuration for state: ${data.state}`);

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const M = 56; // margin
  const contentW = PAGE_W - M * 2;

  // ── PAGE 1: Court Filing Document ─────────────────────────────────────────
  const page1 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  // Header bar
  page1.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: rgb(0.13, 0.20, 0.45) });

  page1.drawText(config.courtName.toUpperCase(), {
    x: M, y: PAGE_H - 30, size: 10, font: boldFont, color: rgb(1, 1, 1),
  });
  page1.drawText(config.courtSubtitle, {
    x: M, y: PAGE_H - 46, size: 9, font: regularFont, color: rgb(0.78, 0.85, 1),
  });
  page1.drawText("SMALL CLAIMS COMPLAINT / NOTICE OF CLAIM", {
    x: M, y: PAGE_H - 62, size: 8, font: italicFont, color: rgb(0.78, 0.85, 1),
  });

  // Case number placeholder (right side)
  page1.drawText("Case No. ______________________", {
    x: PAGE_W - M - 160, y: PAGE_H - 40, size: 8, font: regularFont, color: rgb(0.85, 0.9, 1),
  });
  page1.drawText(`Filed: _____ / _____ / _____`, {
    x: PAGE_W - M - 160, y: PAGE_H - 54, size: 8, font: regularFont, color: rgb(0.85, 0.9, 1),
  });

  y = PAGE_H - 72 - 18;

  // ── VS BLOCK ──────────────────────────────────────────────────────────────
  const vsBoxY = y - 80;
  page1.drawRectangle({ x: M, y: vsBoxY, width: contentW, height: 80, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5, color: rgb(0.98, 0.98, 0.98) });

  page1.drawText("PLAINTIFF (You)", { x: M + 8, y: vsBoxY + 62, size: 7.5, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  page1.drawText(data.claimantName, { x: M + 8, y: vsBoxY + 46, size: 13, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  if (data.claimantAddress) {
    page1.drawText(data.claimantAddress, { x: M + 8, y: vsBoxY + 30, size: 9, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
  }

  // VS divider
  page1.drawLine({ start: { x: PAGE_W / 2, y: vsBoxY + 8 }, end: { x: PAGE_W / 2, y: vsBoxY + 72 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page1.drawText("v.", { x: PAGE_W / 2 - 8, y: vsBoxY + 36, size: 14, font: boldFont, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("DEFENDANT", { x: PAGE_W / 2 + 12, y: vsBoxY + 62, size: 7.5, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  page1.drawText(data.defendantName, { x: PAGE_W / 2 + 12, y: vsBoxY + 46, size: 13, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  if (data.defendantAddress) {
    page1.drawText(data.defendantAddress, { x: PAGE_W / 2 + 12, y: vsBoxY + 30, size: 9, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
  }

  y = vsBoxY - 16;

  // ── CLAIM SUMMARY BAR ─────────────────────────────────────────────────────
  page1.drawRectangle({ x: M, y: y - 28, width: contentW, height: 28, color: rgb(0.13, 0.20, 0.45) });
  page1.drawText(`AMOUNT CLAIMED:  $${data.claimAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, {
    x: M + 10, y: y - 18, size: 11, font: boldFont, color: rgb(1, 1, 1),
  });
  if (data.claimType) {
    const label = data.claimType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    page1.drawText(`Claim Type: ${label}`, {
      x: PAGE_W / 2, y: y - 18, size: 9, font: regularFont, color: rgb(0.78, 0.85, 1),
    });
  }
  y -= 44;

  // ── SECTION: PLAINTIFF INFO ───────────────────────────────────────────────
  drawSectionLabel(page1, "1. Plaintiff Information", M, y, boldFont, PAGE_W, M);
  y -= 18;

  const col1 = M, col2 = M + contentW / 2 + 8;
  const fieldGap = 18;

  const drawField = (label: string, value: string | null | undefined, x: number, cy: number, width = contentW / 2 - 16) => {
    page1.drawText(label, { x, y: cy, size: 7, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    page1.drawLine({ start: { x, y: cy - 2 }, end: { x: x + width, y: cy - 2 }, thickness: 0.3, color: rgb(0.7, 0.7, 0.7) });
    if (value) {
      page1.drawText(value.slice(0, 55), { x, y: cy - 13, size: 9, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    }
  };

  drawField("Full Name", data.claimantName, col1, y);
  drawField("Email", data.claimantEmail ?? "", col2, y);
  y -= fieldGap + 4;
  drawField("Address", data.claimantAddress ?? "", col1, y, contentW - 16);
  y -= fieldGap + 4;
  drawField("Phone", data.claimantPhone ?? "", col1, y);
  y -= fieldGap + 12;

  // ── SECTION: DEFENDANT INFO ───────────────────────────────────────────────
  drawSectionLabel(page1, "2. Defendant Information", M, y, boldFont, PAGE_W, M);
  y -= 18;

  drawField("Full Name / Business Name", data.defendantName, col1, y);
  y -= fieldGap + 4;
  drawField("Address", data.defendantAddress ?? "", col1, y, contentW - 16);
  if (data.defendantEmail) {
    drawField("Email", data.defendantEmail, col2, y - fieldGap - 4);
  }
  y -= fieldGap + 12;

  // ── SECTION: CLAIM DETAILS ────────────────────────────────────────────────
  drawSectionLabel(page1, "3. Claim Details", M, y, boldFont, PAGE_W, M);
  y -= 18;

  drawField("Amount Claimed ($)", `$${data.claimAmount.toLocaleString()}`, col1, y);
  if (data.incidentDate) {
    drawField("Date of Incident", data.incidentDate, col2, y);
  }
  y -= fieldGap + 4;

  if (data.desiredOutcome) {
    drawField("Desired Outcome", data.desiredOutcome, col1, y, contentW - 16);
    y -= fieldGap + 4;
  }
  y -= 4;

  // ── SECTION: STATEMENT ────────────────────────────────────────────────────
  drawSectionLabel(page1, "4. Statement of Claim", M, y, boldFont, PAGE_W, M);
  y -= 16;

  page1.drawText("Describe the facts of your claim in full:", {
    x: M, y, size: 8, font: italicFont, color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  // Statement box
  const stmtLines = wrapText(data.claimDescription, 90);
  const stmtBoxH = Math.max(stmtLines.length * 12 + 20, 100);
  page1.drawRectangle({
    x: M, y: y - stmtBoxH, width: contentW, height: stmtBoxH,
    borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.5, color: rgb(0.99, 0.99, 0.99),
  });

  let ty = y - 12;
  for (const line of stmtLines) {
    if (ty < y - stmtBoxH + 8) break;
    page1.drawText(line, { x: M + 8, y: ty, size: 9.5, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
    ty -= 12;
  }

  y -= stmtBoxH + 16;

  // ── SECTION: ATTESTATION ─────────────────────────────────────────────────
  if (y > 130) {
    drawHRule(page1, y, M, PAGE_W);
    y -= 14;

    page1.drawText("Certification / Attestation", { x: M, y, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    y -= 12;

    const attestText =
      "I certify under penalty of perjury that the information stated in this complaint is true and correct to the best of my knowledge, " +
      "information, and belief, and that I am the plaintiff named above or authorized to file on behalf of the plaintiff.";
    const attestLines = wrapText(attestText, 95);
    for (const line of attestLines) {
      page1.drawText(line, { x: M, y, size: 8, font: italicFont, color: rgb(0.4, 0.4, 0.4) });
      y -= 11;
    }
    y -= 10;

    page1.drawText("Signature: _____________________________________", { x: M, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page1.drawText("Date: ___________________", { x: M + 300, y, size: 9, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
    page1.drawText(`Printed Name: ${data.claimantName}`, { x: M, y, size: 9, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
  }

  // ── PAGE 2: Filing Instructions ───────────────────────────────────────────
  const page2 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y2 = PAGE_H - M;

  page2.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: rgb(0.13, 0.20, 0.45) });
  page2.drawText("FILING INSTRUCTIONS", { x: M, y: PAGE_H - 28, size: 12, font: boldFont, color: rgb(1, 1, 1) });
  page2.drawText(`${config.courtName} — ${config.courtSubtitle}`, { x: M, y: PAGE_H - 44, size: 8, font: regularFont, color: rgb(0.78, 0.85, 1) });

  y2 = PAGE_H - 60 - 20;

  // Quick-reference box
  page2.drawRectangle({ x: M, y: y2 - 60, width: contentW, height: 60, color: rgb(0.95, 0.97, 1), borderColor: rgb(0.13, 0.20, 0.45), borderWidth: 1 });
  page2.drawText("QUICK REFERENCE", { x: M + 10, y: y2 - 14, size: 8, font: boldFont, color: rgb(0.13, 0.20, 0.45) });
  page2.drawText(`Claim Limit: ${config.claimLimit}`, { x: M + 10, y: y2 - 28, size: 9, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
  page2.drawText(`Filing Fee: ${config.filingFeeRange}`, { x: M + 10, y: y2 - 42, size: 9, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
  page2.drawText(`Your Claim: $${data.claimAmount.toLocaleString()}`, { x: M + 200, y: y2 - 28, size: 9, font: boldFont, color: rgb(0.1, 0.3, 0.6) });
  page2.drawText(`Plaintiff: ${data.claimantName}`, { x: M + 200, y: y2 - 42, size: 9, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
  y2 -= 78;

  page2.drawText("Steps to File Your Small Claims Case", { x: M, y: y2, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  y2 -= 20;

  config.filingInstructions.forEach((step, i) => {
    // Step number circle
    page2.drawCircle({ x: M + 8, y: y2 - 2, size: 9, color: rgb(0.13, 0.20, 0.45) });
    page2.drawText(`${i + 1}`, { x: M + 5, y: y2 - 6, size: 8, font: boldFont, color: rgb(1, 1, 1) });

    const lines = wrapText(step, 85);
    lines.forEach((line, li) => {
      page2.drawText(line, { x: M + 24, y: y2 - li * 12, size: 9.5, font: li === 0 ? regularFont : regularFont, color: rgb(0.15, 0.15, 0.15) });
    });
    y2 -= lines.length * 12 + 16;
  });

  y2 -= 8;
  drawHRule(page2, y2, M, PAGE_W);
  y2 -= 16;

  page2.drawText("What to Bring to Court", { x: M, y: y2, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  y2 -= 16;

  const bringItems = [
    "This completed form (bring at least 3 copies)",
    "All contracts, receipts, invoices, or agreements related to the dispute",
    "Text messages, emails, or written communications as evidence",
    "Photos or videos of any damage or relevant items",
    "Any witness information (name and contact details)",
    "A photo ID",
    "Payment for the filing fee (cash or money order — check with your court)",
  ];

  for (const item of bringItems) {
    page2.drawText("✓", { x: M, y: y2, size: 10, font: boldFont, color: rgb(0.13, 0.20, 0.45) });
    page2.drawText(item, { x: M + 14, y: y2, size: 9.5, font: regularFont, color: rgb(0.15, 0.15, 0.15) });
    y2 -= 16;
  }

  y2 -= 8;
  drawHRule(page2, y2, M, PAGE_W);
  y2 -= 14;

  page2.drawText("Important Notes", { x: M, y: y2, size: 9, font: boldFont, color: rgb(0.4, 0.2, 0) });
  y2 -= 14;

  const notes = [
    "This document was prepared with AI assistance and is intended to help you organize your filing. It is not legal advice.",
    "Court requirements vary by county. Always verify current fees and procedures with your local courthouse.",
    `The claim limit in ${data.state} is ${config.claimLimit}. Claims above this limit must be filed in a higher court.`,
    "You do not need a lawyer for small claims court, but you may bring one if you choose.",
  ];

  for (const note of notes) {
    const noteLines = wrapText(note, 90);
    for (const line of noteLines) {
      page2.drawText(line, { x: M, y: y2, size: 8, font: italicFont, color: rgb(0.45, 0.35, 0.1) });
      y2 -= 11;
    }
    y2 -= 4;
  }

  // Footer
  const footerY = 30;
  page2.drawLine({ start: { x: M, y: footerY + 12 }, end: { x: PAGE_W - M, y: footerY + 12 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
  page2.drawText("Generated by SmallClaims AI — smallclaimsai.com  |  Not a law firm. This is not legal advice.", {
    x: M, y: footerY, size: 7, font: italicFont, color: rgb(0.6, 0.6, 0.6),
  });

  // ── PAGE 3: Evidence Index (if files uploaded) ────────────────────────────
  if (data.evidenceFiles && data.evidenceFiles.length > 0) {
    const page3 = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y3 = PAGE_H - M;

    page3.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: rgb(0.13, 0.20, 0.45) });
    page3.drawText("EXHIBIT INDEX — Supporting Evidence", { x: M, y: PAGE_H - 28, size: 12, font: boldFont, color: rgb(1, 1, 1) });
    page3.drawText(`${data.claimantName} v. ${data.defendantName}`, { x: M, y: PAGE_H - 44, size: 8, font: regularFont, color: rgb(0.78, 0.85, 1) });

    y3 = PAGE_H - 60 - 20;

    page3.drawText(
      "The following files were uploaded as supporting evidence for this case and should be brought to court:",
      { x: M, y: y3, size: 9, font: italicFont, color: rgb(0.4, 0.4, 0.4) }
    );
    y3 -= 20;

    drawHRule(page3, y3, M, PAGE_W, rgb(0.13, 0.20, 0.45));
    y3 -= 6;
    page3.drawText("Exhibit", { x: M, y: y3, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    page3.drawText("File Name", { x: M + 50, y: y3, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    page3.drawText("Type", { x: M + 350, y: y3, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    y3 -= 6;
    drawHRule(page3, y3, M, PAGE_W);
    y3 -= 14;

    data.evidenceFiles.forEach((f, i) => {
      if (i % 2 === 0) {
        page3.drawRectangle({ x: M, y: y3 - 4, width: contentW, height: 16, color: rgb(0.97, 0.97, 0.97) });
      }
      page3.drawText(`Exhibit ${i + 1}`, { x: M + 4, y: y3, size: 9, font: boldFont, color: rgb(0.13, 0.20, 0.45) });
      page3.drawText(f.fileName.slice(0, 50), { x: M + 50, y: y3, size: 9, font: regularFont, color: rgb(0.1, 0.1, 0.1) });
      page3.drawText(f.mimeType ?? "—", { x: M + 350, y: y3, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
      y3 -= 18;
    });

    y3 -= 16;
    page3.drawText(
      "Note: Bring physical or printed copies of all listed exhibits to court on your hearing date.",
      { x: M, y: y3, size: 8, font: italicFont, color: rgb(0.5, 0.5, 0.5) }
    );
  }

  return pdfDoc.save();
}

export function getStateConfig(state: string): StateConfig | null {
  return formMap[state] ?? null;
}

export function getSupportedStates(): string[] {
  return Object.keys(formMap);
}
