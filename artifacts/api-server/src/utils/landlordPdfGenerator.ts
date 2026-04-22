import PDFDocument from "pdfkit";

const NAVY = "#1a2d44";
const GOLD = "#c9a231";
const GRAY = "#6b7a8d";
const LIGHT = "#f0f4f8";

const STATE_FILING_GUIDE: Record<string, { limit: string; fee: string; steps: string[] }> = {
  NY: {
    limit: "$10,000",
    fee: "$15 – $30",
    steps: [
      "File at your county's City Civil Court or District Court (NOT Supreme Court).",
      "Complete form 'Small Claims Complaint' — available at the clerk's window or online.",
      "Pay the filing fee ($15 for claims up to $1,000; $30 for claims over $1,000).",
      "The court will mail a notice to the defendant scheduling the hearing (usually 5–6 weeks out).",
      "Bring this demand letter, lease agreement, payment records, and any written communications.",
      "If you win, request an 'Information Subpoena' to locate the tenant's assets or wages.",
    ],
  },
  NJ: {
    limit: "$5,000",
    fee: "$35 – $50",
    steps: [
      "File at the Special Civil Part (Small Claims division) in your county's Superior Court.",
      "Complete form 'Complaint for Small Claims' (SC-001) — available at the clerk's office.",
      "Pay the filing fee (approximately $35–$50 depending on claim amount).",
      "Serve the defendant: the court may mail notice, or you may need to arrange process service.",
      "Hearing is typically scheduled 4–8 weeks after filing.",
      "Bring signed lease, invoices, receipts, and this demand letter to court.",
    ],
  },
  TX: {
    limit: "$20,000",
    fee: "$54 – $100",
    steps: [
      "File at your county's Justice of the Peace (JP) Court (Precinct 1–4 depending on address).",
      "Complete the 'Original Petition' form — available at the JP clerk's office or online.",
      "Pay the filing fee ($54 for claims up to $10,000; higher for larger claims).",
      "The court will issue a citation and arrange service on the defendant.",
      "Hearing is typically scheduled 2–4 weeks after service is completed.",
      "Bring lease, move-out inspection report, receipts, and this demand letter.",
    ],
  },
  FL: {
    limit: "$8,000",
    fee: "$55 – $300",
    steps: [
      "File at your county's County Court (Small Claims division) or Clerk of Courts office.",
      "Complete form 'Statement of Claim' (available at the clerk's office).",
      "Pay the filing fee (varies by county: $55 for claims under $100; up to $300 for larger claims).",
      "Arrange for service of process on the defendant (sheriff or certified process server).",
      "A pretrial conference is usually scheduled first; then a final hearing if not settled.",
      "Bring lease agreement, move-out photos, payment records, and this demand letter.",
    ],
  },
};

function getFilingGuide(state: string) {
  return (
    STATE_FILING_GUIDE[state] ?? {
      limit: "Varies by state",
      fee: "Varies by state",
      steps: [
        "Contact your local county courthouse to locate the Small Claims division.",
        "Request the standard 'Statement of Claim' or complaint form.",
        "Pay the applicable filing fee and retain the receipt.",
        "Arrange for proper legal service on the defendant.",
        "Attend the hearing with all supporting documentation.",
      ],
    }
  );
}

export interface LandlordCasePDFInput {
  landlordName: string;
  landlordCompany?: string | null;
  landlordAddress?: string | null;
  landlordEmail?: string | null;
  tenantName: string;
  tenantAddress?: string | null;
  propertyAddress: string;
  claimType: string;
  claimAmount: number;
  description: string;
  demandLetterText?: string | null;
  state: string;
  monthlyRent?: number | null;
  monthsOwed?: number | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  watermark?: string;
}

export function generateLandlordCasePDF(input: LandlordCasePDFInput): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 60, size: "LETTER" });
  const buffers: Buffer[] = [];

  doc.on("data", (b: Buffer) => buffers.push(b));

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ── PAGE 1: FORMAL DEMAND LETTER ────────────────────────────────────────

    // Navy header bar
    doc.rect(0, 0, 612, 80).fill(NAVY);
    doc.fillColor("white").fontSize(18).font("Helvetica-Bold").text("FORMAL DEMAND LETTER", 60, 22, { align: "left" });
    doc.fillColor(GOLD).fontSize(10).font("Helvetica").text("Landlord Recovery Filing Kit", 60, 48);

    doc.fillColor(NAVY);

    // Sender block (landlord)
    doc.y = 110;
    doc.fontSize(10).font("Helvetica-Bold").text(input.landlordName, 60);
    if (input.landlordCompany) {
      doc.font("Helvetica").text(input.landlordCompany);
    }
    if (input.landlordAddress) {
      doc.font("Helvetica").text(input.landlordAddress);
    }
    if (input.landlordEmail) {
      doc.font("Helvetica").text(input.landlordEmail);
    }

    doc.moveDown(0.5);
    doc.font("Helvetica").text(today);

    doc.moveDown(1.5);

    // Recipient block (tenant)
    doc.font("Helvetica-Bold").text("SENT TO:");
    doc.font("Helvetica-Bold").text(input.tenantName);
    doc.font("Helvetica").text("Last Known Address: " + (input.tenantAddress || input.propertyAddress));

    doc.moveDown(1);

    // Subject line
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text(`RE: FORMAL DEMAND FOR PAYMENT — ${input.propertyAddress}`, { underline: true });

    doc.fillColor(NAVY).fontSize(10).font("Helvetica");
    doc.moveDown(0.8);

    // Letter body
    const letterBody =
      input.demandLetterText ||
      `Dear ${input.tenantName},\n\n` +
        `This letter constitutes a formal demand for payment of monies owed to ${input.landlordName} ` +
        `in connection with your tenancy at the property located at ${input.propertyAddress}.\n\n` +
        `The basis for this demand is as follows:\n\n` +
        `${input.description}\n\n` +
        `TOTAL AMOUNT DUE: $${input.claimAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n\n` +
        `You are hereby demanded to remit payment of the full amount within THIRTY (30) days of the date ` +
        `of this letter. Failure to do so will result in the filing of a claim in Small Claims Court ` +
        `without further notice.\n\n` +
        `This letter will be submitted as evidence of your failure to cure the debt prior to litigation. ` +
        `Filing a small claims action may result in a judgment against you, which can affect your credit ` +
        `and be used to garnish wages or levy bank accounts.\n\n` +
        `This letter does not constitute legal advice. If you believe this demand is in error, contact ` +
        `${input.landlordName} immediately to discuss resolution before a court date is set.`;

    doc.text(letterBody, { lineGap: 3 });

    doc.moveDown(2);
    doc.font("Helvetica-Bold").text("Sincerely,");
    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").text(input.landlordName);
    if (input.landlordCompany) {
      doc.font("Helvetica").text(input.landlordCompany);
    }
    if (input.landlordEmail) {
      doc.font("Helvetica").text(input.landlordEmail);
    }

    // Amount box
    doc.roundedRect(60, doc.y + 20, 492, 55, 6).fillAndStroke(LIGHT, NAVY);
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        `AMOUNT CLAIMED: $${input.claimAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        70,
        doc.y + 28
      );
    doc
      .fillColor(GRAY)
      .font("Helvetica")
      .fontSize(9)
      .text(`Claim Type: ${input.claimType} · State: ${input.state}`, 70, doc.y + 4);

    // ── Watermark ────────────────────────────────────────────────────────────
    if (input.watermark) {
      doc.save();
      doc
        .fillColor("#aaaaaa")
        .opacity(0.25)
        .fontSize(52)
        .font("Helvetica-Bold")
        .rotate(35, { origin: [306, 400] })
        .text(input.watermark, 80, 300, { lineBreak: false });
      doc.restore();
    }

    // ── PAGE 2: FILING GUIDE ─────────────────────────────────────────────────
    doc.addPage();

    const guide = getFilingGuide(input.state);

    // Header bar
    doc.rect(0, 0, 612, 80).fill(NAVY);
    doc.fillColor("white").fontSize(18).font("Helvetica-Bold").text("SMALL CLAIMS FILING GUIDE", 60, 22);
    doc
      .fillColor(GOLD)
      .fontSize(10)
      .font("Helvetica")
      .text(`${input.state} · ${input.propertyAddress}`, 60, 48);

    doc.fillColor(NAVY);
    doc.y = 110;

    // Key facts row
    doc
      .roundedRect(60, doc.y, 148, 52, 4)
      .fillAndStroke(LIGHT, NAVY)
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("CLAIM LIMIT", 70, doc.y + 10)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(guide.limit, 70, doc.y + 4);

    doc.y = 110;
    doc
      .roundedRect(224, doc.y, 148, 52, 4)
      .fillAndStroke(LIGHT, NAVY)
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("FILING FEE", 234, doc.y + 10)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(guide.fee, 234, doc.y + 4);

    doc.y = 110;
    doc
      .roundedRect(388, doc.y, 164, 52, 4)
      .fillAndStroke(LIGHT, NAVY)
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("YOUR CLAIM", 398, doc.y + 10)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(
        `$${input.claimAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
        398,
        doc.y + 4
      );

    doc.y = 180;

    // Steps
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("HOW TO FILE YOUR CLAIM", 60, doc.y);
    doc.moveDown(0.5);

    guide.steps.forEach((step, i) => {
      doc.y += 6;
      // Step number circle
      doc.circle(72, doc.y + 7, 9).fillAndStroke(NAVY, NAVY);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(8).text(String(i + 1), 69, doc.y + 3);
      doc.fillColor(NAVY).font("Helvetica").fontSize(10).text(step, 90, doc.y, { width: 460, lineGap: 2 });
      doc.y += 20;
    });

    doc.moveDown(1.5);

    // Checklist title
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12).text("WHAT TO BRING TO COURT", 60);
    doc.moveDown(0.4);

    const checklist = [
      "This demand letter (printed copy, signed)",
      "Signed lease or rental agreement",
      "Payment records showing amounts owed",
      "Move-out photos or inspection report (if applicable)",
      "Any written communications with tenant (texts, emails, letters)",
      "Your government-issued photo ID",
      "Receipts for repairs, cleaning, or unpaid utilities (if applicable)",
    ];

    checklist.forEach((item) => {
      doc.y += 4;
      doc.rect(63, doc.y + 2, 9, 9).stroke(NAVY);
      doc.fillColor(NAVY).font("Helvetica").fontSize(10).text(item, 82, doc.y, { lineGap: 1 });
      doc.y += 6;
    });

    doc.moveDown(1.5);

    // Footer disclaimer
    doc
      .rect(60, doc.y, 492, 1)
      .fill(NAVY);
    doc.y += 10;
    doc
      .fillColor(GRAY)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This filing kit is for informational purposes only and does not constitute legal advice. " +
          "Court rules, fees, and procedures vary by county and may change. Verify current requirements " +
          "with your local courthouse before filing. Generated by Landlord Recovery.",
        60,
        doc.y,
        { width: 492, lineGap: 2 }
      );

    // Watermark on page 2 as well
    if (input.watermark) {
      doc.save();
      doc
        .fillColor("#aaaaaa")
        .opacity(0.25)
        .fontSize(52)
        .font("Helvetica-Bold")
        .rotate(35, { origin: [306, 400] })
        .text(input.watermark, 80, 300, { lineBreak: false });
      doc.restore();
    }

    doc.end();
  });
}
