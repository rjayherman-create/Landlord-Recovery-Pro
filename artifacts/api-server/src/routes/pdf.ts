import { Router, type IRouter } from "express";
import { db, smallClaimsCasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateCourtPDF, getStateConfig, getSupportedStates } from "../services/pdfFill";

const router: IRouter = Router();

router.get("/cases/:id/pdf", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db
      .select()
      .from(smallClaimsCasesTable)
      .where(eq(smallClaimsCasesTable.id, id));

    if (!found) {
      res.status(404).json({ error: "not_found", message: "Case not found" });
      return;
    }

    const config = getStateConfig(found.state);
    if (!config) {
      res.status(422).json({
        error: "unsupported_state",
        message: `PDF generation is not yet supported for state: ${found.state}. Supported states: ${getSupportedStates().join(", ")}`,
      });
      return;
    }

    const pdfBytes = await generateCourtPDF({
      state: found.state,
      claimantName: found.claimantName,
      claimantAddress: found.claimantAddress,
      defendantName: found.defendantName,
      defendantAddress: found.defendantAddress,
      claimAmount: Number(found.claimAmount),
      claimDescription: found.claimDescription,
      incidentDate: found.incidentDate,
      desiredOutcome: found.desiredOutcome,
    });

    const safeDefendant = found.defendantName.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
    const filename = `small-claims-${found.state.toLowerCase()}-vs-${safeDefendant}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    req.log.error({ err }, "Failed to generate PDF");
    res.status(500).json({ error: "pdf_error", message: err.message ?? "Failed to generate PDF" });
  }
});

router.get("/cases/pdf-states", async (_req, res) => {
  res.json({ states: getSupportedStates() });
});

export default router;
