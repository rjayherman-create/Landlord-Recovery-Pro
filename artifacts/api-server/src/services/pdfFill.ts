import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

const TEMPLATES_DIR = path.resolve(process.cwd(), "templates");

type FieldMap = {
  plaintiff: string;
  defendant: string;
  amount: string;
  description: string;
  plaintiffAddress?: string;
  defendantAddress?: string;
  incidentDate?: string;
  desiredOutcome?: string;
};

type StateConfig = {
  template: string;
  courtName: string;
  fields: FieldMap;
};

export const formMap: Record<string, StateConfig> = {
  NY: {
    template: "ny-small-claims.pdf",
    courtName: "New York Small Claims Court",
    fields: {
      plaintiff: "PlaintiffName",
      defendant: "DefendantName",
      amount: "ClaimAmount",
      description: "ClaimDescription",
      plaintiffAddress: "PlaintiffAddress",
      defendantAddress: "DefendantAddress",
      incidentDate: "IncidentDate",
      desiredOutcome: "DesiredOutcome",
    },
  },
  CA: {
    template: "ca-sc-100.pdf",
    courtName: "California Small Claims Court (SC-100)",
    fields: {
      plaintiff: "SC100_Plaintiff",
      defendant: "SC100_Defendant",
      amount: "SC100_Amount",
      description: "SC100_Reason",
      plaintiffAddress: "SC100_PlaintiffAddress",
      defendantAddress: "SC100_DefendantAddress",
      incidentDate: "SC100_IncidentDate",
      desiredOutcome: "SC100_DesiredOutcome",
    },
  },
  NJ: {
    template: "nj-small-claims.pdf",
    courtName: "New Jersey Special Civil Part - Small Claims",
    fields: {
      plaintiff: "NJPlaintiff",
      defendant: "NJDefendant",
      amount: "NJAmount",
      description: "NJDescription",
      plaintiffAddress: "NJPlaintiffAddress",
      defendantAddress: "NJDefendantAddress",
      incidentDate: "NJIncidentDate",
      desiredOutcome: "NJDesiredOutcome",
    },
  },
  FL: {
    template: "fl-small-claims.pdf",
    courtName: "Florida County Court - Small Claims",
    fields: {
      plaintiff: "FLPlaintiff",
      defendant: "FLDefendant",
      amount: "FLAmount",
      description: "FLDescription",
      plaintiffAddress: "FLPlaintiffAddress",
      defendantAddress: "FLDefendantAddress",
      incidentDate: "FLIncidentDate",
      desiredOutcome: "FLDesiredOutcome",
    },
  },
  TX: {
    template: "tx-small-claims.pdf",
    courtName: "Texas Justice Court - Small Claims",
    fields: {
      plaintiff: "TXPlaintiff",
      defendant: "TXDefendant",
      amount: "TXAmount",
      description: "TXDescription",
      plaintiffAddress: "TXPlaintiffAddress",
      defendantAddress: "TXDefendantAddress",
      incidentDate: "TXIncidentDate",
      desiredOutcome: "TXDesiredOutcome",
    },
  },
  PA: {
    template: "pa-small-claims.pdf",
    courtName: "Pennsylvania Magisterial District Court",
    fields: {
      plaintiff: "PAPlaintiff",
      defendant: "PADefendant",
      amount: "PAAmount",
      description: "PADescription",
      plaintiffAddress: "PAPlaintiffAddress",
      defendantAddress: "PADefendantAddress",
      incidentDate: "PAIncidentDate",
      desiredOutcome: "PADesiredOutcome",
    },
  },
  IL: {
    template: "il-small-claims.pdf",
    courtName: "Illinois Circuit Court - Small Claims",
    fields: {
      plaintiff: "ILPlaintiff",
      defendant: "ILDefendant",
      amount: "ILAmount",
      description: "ILDescription",
      plaintiffAddress: "ILPlaintiffAddress",
      defendantAddress: "ILDefendantAddress",
      incidentDate: "ILIncidentDate",
      desiredOutcome: "ILDesiredOutcome",
    },
  },
  OH: {
    template: "oh-small-claims.pdf",
    courtName: "Ohio Municipal/County Court - Small Claims",
    fields: {
      plaintiff: "OHPlaintiff",
      defendant: "OHDefendant",
      amount: "OHAmount",
      description: "OHDescription",
      plaintiffAddress: "OHPlaintiffAddress",
      defendantAddress: "OHDefendantAddress",
      incidentDate: "OHIncidentDate",
      desiredOutcome: "OHDesiredOutcome",
    },
  },
  GA: {
    template: "ga-small-claims.pdf",
    courtName: "Georgia Magistrate Court - Small Claims",
    fields: {
      plaintiff: "GAPlaintiff",
      defendant: "GADefendant",
      amount: "GAAmount",
      description: "GADescription",
      plaintiffAddress: "GAPlaintiffAddress",
      defendantAddress: "GADefendantAddress",
      incidentDate: "GAIncidentDate",
      desiredOutcome: "GADesiredOutcome",
    },
  },
  NC: {
    template: "nc-small-claims.pdf",
    courtName: "North Carolina District Court - Small Claims",
    fields: {
      plaintiff: "NCPlaintiff",
      defendant: "NCDefendant",
      amount: "NCAmount",
      description: "NCDescription",
      plaintiffAddress: "NCPlaintiffAddress",
      defendantAddress: "NCDefendantAddress",
      incidentDate: "NCIncidentDate",
      desiredOutcome: "NCDesiredOutcome",
    },
  },
};

export type CourtPDFInput = {
  state: string;
  claimantName: string;
  claimantAddress?: string | null;
  defendantName: string;
  defendantAddress?: string | null;
  claimAmount: number;
  claimDescription: string;
  incidentDate?: string | null;
  desiredOutcome?: string | null;
  evidenceFiles?: { fileName: string; mimeType?: string | null }[];
};

function safeSetField(form: ReturnType<PDFDocument["getForm"]>, fieldName: string, value: string) {
  try {
    const field = form.getTextField(fieldName);
    field.setText(value);
  } catch {
  }
}

export async function generateCourtPDF(data: CourtPDFInput): Promise<Uint8Array> {
  const config = formMap[data.state];
  if (!config) {
    throw new Error(`No PDF template configured for state: ${data.state}`);
  }

  const templatePath = path.join(TEMPLATES_DIR, config.template);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${config.template}`);
  }

  const bytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();

  safeSetField(form, config.fields.plaintiff, data.claimantName);
  safeSetField(form, config.fields.defendant, data.defendantName);
  safeSetField(form, config.fields.amount, `$${data.claimAmount.toLocaleString()}`);
  safeSetField(form, config.fields.description, data.claimDescription);

  if (config.fields.plaintiffAddress && data.claimantAddress) {
    safeSetField(form, config.fields.plaintiffAddress, data.claimantAddress);
  }
  if (config.fields.defendantAddress && data.defendantAddress) {
    safeSetField(form, config.fields.defendantAddress, data.defendantAddress);
  }
  if (config.fields.incidentDate && data.incidentDate) {
    safeSetField(form, config.fields.incidentDate, data.incidentDate);
  }
  if (config.fields.desiredOutcome && data.desiredOutcome) {
    safeSetField(form, config.fields.desiredOutcome, data.desiredOutcome);
  }

  form.flatten();

  // Append evidence list page if files were uploaded
  if (data.evidenceFiles && data.evidenceFiles.length > 0) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const evidencePage = pdfDoc.addPage([612, 792]);
    const { width } = evidencePage.getSize();

    evidencePage.drawText("EXHIBIT INDEX — Supporting Evidence", {
      x: 50,
      y: 740,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.3),
    });
    evidencePage.drawText(`Case: ${data.claimantName} v. ${data.defendantName}`, {
      x: 50,
      y: 718,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    evidencePage.drawLine({
      start: { x: 50, y: 708 },
      end: { x: width - 50, y: 708 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });

    let y = 688;
    data.evidenceFiles.forEach((f, i) => {
      const label = `${i + 1}.  ${f.fileName}`;
      const type = f.mimeType ? `  [${f.mimeType}]` : "";
      evidencePage.drawText(label + type, {
        x: 60,
        y,
        size: 10,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 20;
    });

    evidencePage.drawText(
      "Note: The files listed above were submitted as supporting evidence and should be brought to court.",
      { x: 50, y: y - 20, size: 8, font, color: rgb(0.5, 0.5, 0.5) }
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
