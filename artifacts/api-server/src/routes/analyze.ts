import { Router, type IRouter } from "express";
import { analyzeEvidence } from "../services/evidenceAI";
import { buildTimeline, collectFacts, collectAmounts } from "../services/timelineBuilder";
import { buildCaseNarrative } from "../services/caseBuilder";
import { db, evidenceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function readTextFile(fileUrl: string): string | null {
  try {
    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return content.slice(0, 4000); // cap at 4k chars per file
  } catch {
    return null;
  }
}

// POST /api/analyze-case
// Body: { caseId?, evidenceTexts?, description?, supportingFacts?, amount, claimType?, state? }
router.post("/analyze-case", async (req: any, res: any) => {
  try {
    const { caseId, evidenceTexts = [], description, supportingFacts, amount, claimType, state } = req.body;

    const textsToAnalyze: string[] = [...evidenceTexts];

    // If caseId is provided, also read uploaded text files from disk
    if (caseId) {
      const dbFiles = await db
        .select()
        .from(evidenceTable)
        .where(eq(evidenceTable.caseId, Number(caseId)));

      for (const f of dbFiles) {
        const isText = f.mimeType?.startsWith("text/") || f.fileName.endsWith(".txt");
        if (isText) {
          const content = readTextFile(f.fileUrl);
          if (content) {
            textsToAnalyze.push(`[File: ${f.fileName}]\n${content}`);
          }
        }
      }
    }

    // Include the user's typed description as evidence
    if (description?.trim()) {
      textsToAnalyze.unshift(`[Case Description]\n${description}`);
    }
    if (supportingFacts?.trim()) {
      textsToAnalyze.push(`[Supporting Facts]\n${supportingFacts}`);
    }

    if (textsToAnalyze.length === 0) {
      res.status(400).json({ error: "no_evidence", message: "Provide at least a description or evidence text to analyze." });
      return;
    }

    // Analyze each piece of evidence in parallel
    const analysisResults = await Promise.all(
      textsToAnalyze.map((text) => analyzeEvidence(text))
    );

    // Build consolidated timeline and facts
    const timeline = buildTimeline(analysisResults);
    const facts = collectFacts(analysisResults);
    const amounts = collectAmounts(analysisResults);

    // Build the court-ready narrative
    const narrative = await buildCaseNarrative({
      timeline,
      facts,
      amount: amount ?? 0,
      claimType,
      state,
    });

    res.json({ timeline, facts, amounts, narrative });
  } catch (err: any) {
    req.log?.error({ err }, "Case analysis failed");
    res.status(500).json({ error: "analysis_failed", message: err.message });
  }
});

export default router;
