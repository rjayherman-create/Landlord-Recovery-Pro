import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");

fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

const states = [
  {
    file: "ny-small-claims.pdf",
    title: "SMALL CLAIMS COURT",
    subtitle: "State of New York",
    fields: [
      { name: "PlaintiffName", label: "Plaintiff (Claimant) Name", y: 560, width: 300, height: 20 },
      { name: "PlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "DefendantName", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "DefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "ClaimAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "IncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "ClaimDescription", label: "Statement of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "DesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "ca-sc-100.pdf",
    title: "PLAINTIFF'S CLAIM AND ORDER TO GO TO SMALL CLAIMS COURT",
    subtitle: "California SC-100",
    fields: [
      { name: "SC100_Plaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "SC100_PlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "SC100_Defendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "SC100_DefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "SC100_Amount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "SC100_IncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "SC100_Reason", label: "Why do you claim the defendant owes you money?", y: 270, width: 440, height: 110, multiline: true },
      { name: "SC100_DesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "nj-small-claims.pdf",
    title: "SMALL CLAIMS COMPLAINT",
    subtitle: "State of New Jersey — Special Civil Part",
    prefix: "NJ",
    fields: [
      { name: "NJPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "NJPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "NJDefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "NJDefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "NJAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "NJIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "NJDescription", label: "Basis of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "NJDesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "fl-small-claims.pdf",
    title: "STATEMENT OF CLAIM — SMALL CLAIMS",
    subtitle: "State of Florida — County Court",
    fields: [
      { name: "FLPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "FLPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "FLDefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "FLDefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "FLAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "FLIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "FLDescription", label: "Nature of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "FLDesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "tx-small-claims.pdf",
    title: "PETITION — SMALL CLAIMS COURT",
    subtitle: "State of Texas — Justice Court",
    fields: [
      { name: "TXPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "TXPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "TXDefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "TXDefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "TXAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "TXIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "TXDescription", label: "Statement of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "TXDesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "pa-small-claims.pdf",
    title: "CIVIL COMPLAINT — SMALL CLAIMS",
    subtitle: "Commonwealth of Pennsylvania — Magisterial District Court",
    fields: [
      { name: "PAPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "PAPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "PADefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "PADefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "PAAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "PAIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "PADescription", label: "Basis of Complaint", y: 270, width: 440, height: 110, multiline: true },
      { name: "PADesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "il-small-claims.pdf",
    title: "SMALL CLAIMS COMPLAINT",
    subtitle: "State of Illinois — Circuit Court",
    fields: [
      { name: "ILPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "ILPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "ILDefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "ILDefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "ILAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "ILIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "ILDescription", label: "Statement of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "ILDesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "oh-small-claims.pdf",
    title: "SMALL CLAIMS COMPLAINT",
    subtitle: "State of Ohio — Municipal / County Court",
    fields: [
      { name: "OHPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "OHPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "OHDefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "OHDefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "OHAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "OHIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "OHDescription", label: "Statement of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "OHDesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "ga-small-claims.pdf",
    title: "MAGISTRATE COURT CLAIM",
    subtitle: "State of Georgia — Magistrate Court",
    fields: [
      { name: "GAPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "GAPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "GADefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "GADefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "GAAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "GAIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "GADescription", label: "Basis of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "GADesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
  {
    file: "nc-small-claims.pdf",
    title: "SMALL CLAIM COMPLAINT",
    subtitle: "State of North Carolina — District Court",
    fields: [
      { name: "NCPlaintiff", label: "Plaintiff Name", y: 560, width: 300, height: 20 },
      { name: "NCPlaintiffAddress", label: "Plaintiff Address", y: 520, width: 300, height: 20 },
      { name: "NCDefendant", label: "Defendant Name", y: 480, width: 300, height: 20 },
      { name: "NCDefendantAddress", label: "Defendant Address", y: 440, width: 300, height: 20 },
      { name: "NCAmount", label: "Amount Claimed ($)", y: 400, width: 150, height: 20 },
      { name: "NCIncidentDate", label: "Date of Incident", y: 400, width: 120, height: 20, x: 380 },
      { name: "NCDescription", label: "Statement of Claim", y: 270, width: 440, height: 110, multiline: true },
      { name: "NCDesiredOutcome", label: "Relief Requested", y: 200, width: 440, height: 50, multiline: true },
    ],
  },
];

async function createTemplate(state) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const darkBlue = rgb(0.05, 0.2, 0.4);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);

  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: darkBlue });

  page.drawText(state.title, {
    x: 40, y: height - 45,
    font: helveticaBold, size: 14, color: white,
  });
  page.drawText(state.subtitle, {
    x: 40, y: height - 65,
    font: helvetica, size: 10, color: rgb(0.8, 0.9, 1),
  });
  page.drawText("GENERATED BY SMALLCLAIMS AI — NOT A SUBSTITUTE FOR OFFICIAL COURT FORMS", {
    x: 40, y: height - 82,
    font: helvetica, size: 7, color: rgb(0.6, 0.7, 0.8),
  });

  page.drawText("IMPORTANT: This document is a draft for reference only. Please obtain official court forms from", {
    x: 40, y: height - 115, font: helvetica, size: 7.5, color: rgb(0.6, 0.2, 0.1),
  });
  page.drawText("your local courthouse or court website before filing.", {
    x: 40, y: height - 126, font: helvetica, size: 7.5, color: rgb(0.6, 0.2, 0.1),
  });

  const form = pdfDoc.getForm();

  for (const field of state.fields) {
    const x = field.x ?? 80;
    const y = field.y;
    const w = field.width;
    const h = field.height;

    page.drawText(field.label, {
      x, y: y + h + 4,
      font: helvetica, size: 8.5, color: gray,
    });

    page.drawRectangle({
      x, y, width: w, height: h,
      color: white,
      borderColor: rgb(0.7, 0.75, 0.82),
      borderWidth: 0.8,
    });

    if (field.multiline) {
      const tf = form.createTextField(field.name);
      tf.setText("");
      tf.addToPage(page, {
        x, y, width: w, height: h,
        textColor: black,
        backgroundColor: white,
        borderColor: rgb(0.7, 0.75, 0.82),
        borderWidth: 0.8,
        font: helvetica,
        fontSize: 9,
      });
      tf.enableMultiline();
    } else {
      const tf = form.createTextField(field.name);
      tf.setText("");
      tf.addToPage(page, {
        x, y, width: w, height: h,
        textColor: black,
        backgroundColor: white,
        borderColor: rgb(0.7, 0.75, 0.82),
        borderWidth: 0.8,
        font: helvetica,
        fontSize: 10,
      });
    }
  }

  page.drawText("Plaintiff Signature: _______________________________   Date: ___________", {
    x: 80, y: 130, font: helvetica, size: 10, color: black,
  });

  page.drawLine({ start: { x: 80, y: 80 }, end: { x: 530, y: 80 }, thickness: 0.5, color: lightGray });
  page.drawText("SmallClaims AI — For reference only. Not a licensed attorney. Not official court paper.", {
    x: 80, y: 65, font: helvetica, size: 7, color: gray,
  });

  const bytes = await pdfDoc.save();
  const outPath = path.join(TEMPLATES_DIR, state.file);
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${state.file}`);
}

console.log("Generating PDF templates...");
for (const state of states) {
  await createTemplate(state);
}
console.log(`Done — ${states.length} templates created in ${TEMPLATES_DIR}`);
