import { Router, type IRouter } from "express";
import { db, smallClaimsCasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const router: IRouter = Router();

// ── Helper: fetch and validate case ─────────────────────────────────────────
async function getCase(id: number) {
  const [found] = await db.select().from(smallClaimsCasesTable).where(eq(smallClaimsCasesTable.id, id));
  return found ?? null;
}

// ── 1. AI Demand Letter ──────────────────────────────────────────────────────
router.post("/cases/:id/collection/demand-letter", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const c = await getCase(id);
    if (!c) { res.status(404).json({ error: "not_found" }); return; }

    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: `Write a firm, professional post-judgment demand letter for a small claims case.

Plaintiff (Claimant): ${c.claimantName}
Plaintiff Address: ${c.claimantAddress ?? ""}
Defendant: ${c.defendantName}
Defendant Address: ${c.defendantAddress ?? ""}
Judgment Amount: $${c.claimAmount}
Case Type: ${c.claimType}
Claim Summary: ${c.claimDescription}
Today's Date: ${today}
Payment Deadline: ${deadline}

The letter should:
- Be addressed from ${c.claimantName} to ${c.defendantName}
- Reference the court judgment
- Demand full payment of $${c.claimAmount} by ${deadline}
- Warn that failure to pay will result in wage garnishment, bank levy, or property lien enforcement
- Remain professional and factual
- End with contact instructions

Return only the letter text, formatted with proper spacing.`,
        },
      ],
    });

    const letter = response.choices[0]?.message?.content ?? "";
    res.json({ letter });
  } catch (err) {
    console.error("[collection] demand-letter error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── 2. Payment Plan ──────────────────────────────────────────────────────────
router.post("/cases/:id/collection/payment-plan", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const c = await getCase(id);
    if (!c) { res.status(404).json({ error: "not_found" }); return; }

    const { months = 3 } = req.body as { months?: number };
    const total = Number(c.claimAmount);
    const perMonth = Math.ceil((total / months) * 100) / 100;

    const schedule = Array.from({ length: months }, (_, i) => {
      const due = new Date();
      due.setMonth(due.getMonth() + i + 1);
      return {
        installment: i + 1,
        due: due.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        amount: i < months - 1 ? perMonth : Math.round((total - perMonth * (months - 1)) * 100) / 100,
      };
    });

    res.json({
      total,
      months,
      perMonth,
      schedule,
      defendant: c.defendantName,
      claimant: c.claimantName,
    });
  } catch (err) {
    console.error("[collection] payment-plan error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── Shared PDF helpers ────────────────────────────────────────────────────────
function addPageWithHeader(doc: PDFDocument, title: string, font: any, boldFont: any) {
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: rgb(0.18, 0.29, 0.38) });
  page.drawText(title, { x: 40, y: height - 40, size: 16, font: boldFont, color: rgb(1, 1, 1) });
  return { page, width, height };
}

function drawField(page: any, label: string, value: string, x: number, y: number, labelFont: any, valueFont: any) {
  page.drawText(label + ":", { x, y, size: 9, font: labelFont, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(value || "____________________", { x, y: y - 14, size: 11, font: valueFont, color: rgb(0, 0, 0) });
}

// ── 3. Wage Garnishment Form ─────────────────────────────────────────────────
router.post("/cases/:id/collection/garnishment", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const c = await getCase(id);
    if (!c) { res.status(404).json({ error: "not_found" }); return; }

    const { employer = "", employerAddress = "" } = req.body as { employer?: string; employerAddress?: string };
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const { page, height } = addPageWithHeader(doc, "WAGE GARNISHMENT — EARNINGS WITHHOLDING ORDER", font, boldFont);
    let y = height - 90;

    const gap = 50;
    const fields: [string, string][] = [
      ["Date", today],
      ["Court Case / Judgment", `${c.claimantName} v. ${c.defendantName}`],
      ["Judgment Creditor (Plaintiff)", c.claimantName],
      ["Creditor Address", c.claimantAddress ?? ""],
      ["Judgment Debtor (Defendant)", c.defendantName],
      ["Debtor Address", c.defendantAddress ?? ""],
      ["Total Judgment Amount", `$${c.claimAmount}`],
      ["Employer / Garnishee", employer],
      ["Employer Address", employerAddress],
    ];

    for (const [label, val] of fields) {
      drawField(page, label, val, 50, y, font, boldFont);
      y -= gap;
    }

    y -= 20;
    page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;
    page.drawText("INSTRUCTIONS TO EMPLOYER", { x: 50, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    y -= 20;
    const instructions = [
      "1. You are ordered to withhold 25% of the debtor's disposable earnings per pay period (or the",
      "   maximum allowed under your state's law, whichever is less).",
      "2. Remit withheld amounts to the judgment creditor at the address above.",
      "3. Continue withholding until the full judgment amount is satisfied or a court orders you to stop.",
      "4. Notify the creditor immediately if the debtor is no longer employed.",
    ];
    for (const line of instructions) {
      page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 14;
    }

    y -= 30;
    page.drawText("Creditor Signature: _________________________    Date: ________________", {
      x: 50, y, size: 10, font, color: rgb(0, 0, 0),
    });
    y -= 30;
    page.drawText("LEGAL NOTICE: Serve this form on the employer along with a copy of the court judgment.", {
      x: 50, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await doc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="wage-garnishment-${c.defendantName.replace(/[^a-z0-9]/gi, "_")}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("[collection] garnishment error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── 4. Bank Levy Form ────────────────────────────────────────────────────────
router.post("/cases/:id/collection/bank-levy", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const c = await getCase(id);
    if (!c) { res.status(404).json({ error: "not_found" }); return; }

    const { bank = "", bankAddress = "", accountType = "" } = req.body as { bank?: string; bankAddress?: string; accountType?: string };
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const { page, height } = addPageWithHeader(doc, "BANK LEVY — WRIT OF EXECUTION (FINANCIAL INSTITUTION)", font, boldFont);
    let y = height - 90;

    const gap = 50;
    const fields: [string, string][] = [
      ["Date", today],
      ["Court Case / Judgment", `${c.claimantName} v. ${c.defendantName}`],
      ["Judgment Creditor (Plaintiff)", c.claimantName],
      ["Creditor Address", c.claimantAddress ?? ""],
      ["Judgment Debtor (Defendant)", c.defendantName],
      ["Debtor Address", c.defendantAddress ?? ""],
      ["Total Judgment Amount", `$${c.claimAmount}`],
      ["Financial Institution (Bank)", bank],
      ["Bank Address", bankAddress],
      ["Account Type (if known)", accountType || "Checking / Savings"],
    ];

    for (const [label, val] of fields) {
      drawField(page, label, val, 50, y, font, boldFont);
      y -= gap;
    }

    y -= 20;
    page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;
    page.drawText("INSTRUCTIONS TO FINANCIAL INSTITUTION", { x: 50, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    y -= 20;
    const instructions = [
      "1. You are ordered to freeze all accounts held by the judgment debtor listed above.",
      "2. Withhold and remit funds up to the total judgment amount to the judgment creditor.",
      "3. Notify the creditor of the account balance at the time of levy.",
      "4. This levy remains in effect until the judgment is satisfied or a court orders its release.",
    ];
    for (const line of instructions) {
      page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 14;
    }

    y -= 30;
    page.drawText("Creditor Signature: _________________________    Date: ________________", {
      x: 50, y, size: 10, font, color: rgb(0, 0, 0),
    });
    y -= 30;
    page.drawText("LEGAL NOTICE: File with the court clerk and serve on the financial institution with a copy of the judgment.", {
      x: 50, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await doc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="bank-levy-${c.defendantName.replace(/[^a-z0-9]/gi, "_")}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("[collection] bank-levy error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── 5. Smart "Next Step" recommendation ─────────────────────────────────────
router.get("/cases/:id/collection/next-step", async (req, res) => {
  const { employer, bank } = req.query as { employer?: string; bank?: string };
  if (employer) { res.json({ recommendation: "garnishment", reason: "Since you know the defendant's employer, wage garnishment is the most direct route to getting paid." }); return; }
  if (bank) { res.json({ recommendation: "levy", reason: "Since you know the defendant's bank, a bank levy can freeze their account and collect payment quickly." }); return; }
  res.json({ recommendation: "discovery", reason: "You can file a post-judgment discovery request with the court to find out where the defendant works and banks." });
});

export default router;
