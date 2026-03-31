import { Router, type IRouter } from "express";
import { db, grievancesTable, comparablesTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { stripeStorage } from "../stripeStorage";
import { generateAppealPDF } from "../utils/generatePdf";

const router: IRouter = Router();

router.get("/download/:id", async (req, res) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    if (isNaN(caseId)) {
      return res.status(400).json({ error: "bad_request", message: "Invalid case ID" });
    }

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "unauthorized", message: "Sign in required" });
    }

    const userId = req.user.id;

    const user = await stripeStorage.getUser(userId);
    if (!user?.plan) {
      return res.status(403).json({ error: "payment_required", message: "Payment required to download" });
    }

    const [grievance] = await db
      .select()
      .from(grievancesTable)
      .where(and(eq(grievancesTable.id, caseId), eq(grievancesTable.userId, userId)));

    if (!grievance) {
      return res.status(404).json({ error: "not_found", message: "Case not found" });
    }

    const comparablesRows = await db
      .select()
      .from(comparablesTable)
      .where(eq(comparablesTable.grievanceId, caseId));

    const comparables = comparablesRows.map((c) => ({
      ...c,
      salePrice: Number(c.salePrice),
      squareFeet: c.squareFeet != null ? Number(c.squareFeet) : null,
      assessedValue: c.assessedValue != null ? Number(c.assessedValue) : null,
    }));

    const gData = {
      ...grievance,
      currentAssessment: Number(grievance.currentAssessment),
      equalizationRate: grievance.equalizationRate != null ? Number(grievance.equalizationRate) : null,
      estimatedMarketValue: Number(grievance.estimatedMarketValue),
      requestedAssessment: Number(grievance.requestedAssessment),
      livingArea: grievance.livingArea != null ? Number(grievance.livingArea) : null,
    };

    const stateRaw = (grievance as any).state ?? null;
    if (stateRaw) {
      (gData as any).state = stateRaw;
    } else {
      const countyLower = (grievance.county || "").toLowerCase();
      (gData as any).state =
        ["nassau", "suffolk", "westchester", "albany", "erie", "monroe", "onondaga", "dutchess", "rockland", "orange", "putnam"].some(c => countyLower.includes(c)) ? "NY"
        : ["hudson", "bergen", "essex", "morris", "monmouth", "ocean", "union", "camden", "passaic", "middlesex"].some(c => countyLower.includes(c)) ? "NJ"
        : ["harris", "dallas", "tarrant", "bexar", "travis", "collin", "denton", "el paso", "hidalgo", "fort bend"].some(c => countyLower.includes(c)) ? "TX"
        : ["miami-dade", "broward", "palm beach", "hillsborough", "orange", "pinellas", "duval", "lee", "polk", "brevard"].some(c => countyLower.includes(c)) ? "FL"
        : "NY";
    }

    const pdfBuffer = await generateAppealPDF({ grievance: gData, comparables });

    const stateName = (gData as any).state || "NY";
    const STATE_FORM: Record<string, string> = { NY: "RP-524", NJ: "A-1", TX: "notice-of-protest", FL: "DR-486" };
    const formSlug = STATE_FORM[stateName] ?? "appeal";
    const filename = `taxappeal-${formSlug}-${grievance.parcelId || caseId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    req.log.error({ err }, "Failed to generate PDF");
    res.status(500).json({ error: "internal_error", message: "Failed to generate PDF" });
  }
});

export default router;
