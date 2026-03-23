import { Router, type IRouter } from "express";
import multer from "multer";
import OpenAI from "openai";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif|heic|heif)|application\/pdf$/.test(file.mimetype);
    cb(null, ok);
  },
});

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert OCR assistant specializing in New York State property tax documents.
Your job is to extract key property information from uploaded images of tax bills, assessment notices,
tax records, or any NY property document.

Return ONLY a JSON object — no markdown, no explanation. Use null for fields you cannot find.

Fields to extract:
{
  "ownerName": "Full name of property owner(s)",
  "propertyAddress": "Full street address of the property",
  "parcelId": "Tax Map Number, SBL (Section-Block-Lot), or Parcel ID — look for labels like 'Tax Map #', 'Parcel ID', 'SBL', 'Section/Block/Lot', 'Print Key'",
  "county": "County name (e.g. Nassau, Suffolk, Westchester)",
  "municipality": "Town, city, or village (e.g. Town of Hempstead, Glen Cove, Oyster Bay)",
  "schoolDistrict": "School district name",
  "propertyClass": "Property classification code (e.g. 210, 220) — may be labeled 'Class', 'Property Class', or 'Use Code'",
  "yearBuilt": "Year the building was constructed — look for 'Year Built', 'Built', 'Construction Year'",
  "livingArea": "Living area or gross square footage as a number — look for 'Living Area', 'GBA', 'Gross Building Area', 'Floor Area', 'Sq Ft', 'Square Feet'",
  "lotSize": "Lot size description — look for 'Lot Size', 'Lot Area', 'Acreage', 'Frontage', dimensions like '60x120'",
  "landAssessment": "Assessed value of the land only — look for 'Land AV', 'Land Assessment', 'Land Value'",
  "totalAssessment": "Total assessed value of land + improvements — look for 'Total AV', 'Total Assessment', 'Assessed Value', 'Full Value'",
  "estimatedMarketValue": "Full market value — look for 'Market Value', 'Full Market Value', 'Appraised Value'",
  "taxYear": "Tax year or assessment year — look for 'Tax Year', 'Assessment Year', 'Roll Year'",
  "filingDeadline": "Grievance filing deadline if shown — look for 'Grievance Day', 'Deadline', 'File By'",
  "exemptions": "Any exemptions listed (e.g. STAR, Senior, Veterans)",
  "rawText": "A brief summary (1-2 sentences) of what type of document this appears to be"
}

Important extraction tips:
- NY SBL format is typically like: 09-C-32 or 064.00-04-001.000 or 21-24.-3
- Living area is usually in square feet, a number like 1,200 or 2,400
- Year built is a 4-digit year like 1965
- Total assessment in Nassau is often labeled "Total AV" and may be in thousands
- Look carefully at all text including headers, tables, and fine print`;

router.post("/ocr-tax-record", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Please upload a photo or scan of your tax bill." });
    return;
  }

  const { buffer, mimetype } = req.file;

  try {
    let imageContent: OpenAI.Chat.ChatCompletionContentPartImage;

    if (mimetype === "application/pdf") {
      // PDFs aren't directly supported as base64 images by the vision API.
      // Return a helpful message asking for an image instead.
      res.status(422).json({
        error: "PDF upload not yet supported. Please take a photo or screenshot of your tax bill and upload that instead (JPG or PNG).",
      });
      return;
    }

    const b64 = buffer.toString("base64");
    const mediaType = (mimetype.includes("heic") || mimetype.includes("heif"))
      ? "image/jpeg"   // OpenAI doesn't support HEIC natively; treat as JPEG
      : mimetype as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    imageContent = {
      type: "image_url",
      image_url: { url: `data:${mediaType};base64,${b64}`, detail: "high" },
    };

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            imageContent,
            { type: "text", text: "Please extract all property information from this document." },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";

    // Strip any accidental markdown code fences
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

    let extracted: Record<string, any>;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      res.status(422).json({ error: "Could not parse document. Please try a clearer photo with good lighting." });
      return;
    }

    // Build the list of fields that were actually found
    const fieldsFound: string[] = [];
    const MAPPABLE = [
      "ownerName", "propertyAddress", "parcelId", "county", "municipality",
      "schoolDistrict", "propertyClass", "yearBuilt", "livingArea", "lotSize",
      "landAssessment", "totalAssessment", "estimatedMarketValue", "taxYear", "filingDeadline",
    ];
    for (const key of MAPPABLE) {
      if (extracted[key] !== null && extracted[key] !== undefined && extracted[key] !== "") {
        fieldsFound.push(key);
      }
    }

    // Coerce numeric types
    if (extracted.yearBuilt) extracted.yearBuilt = parseInt(String(extracted.yearBuilt).replace(/\D/g, "")) || null;
    if (extracted.livingArea) extracted.livingArea = parseInt(String(extracted.livingArea).replace(/,/g, "").replace(/\D/g, "")) || null;
    if (extracted.totalAssessment) extracted.totalAssessment = parseFloat(String(extracted.totalAssessment).replace(/[$,]/g, "")) || null;
    if (extracted.estimatedMarketValue) extracted.estimatedMarketValue = parseFloat(String(extracted.estimatedMarketValue).replace(/[$,]/g, "")) || null;
    if (extracted.taxYear) extracted.taxYear = parseInt(String(extracted.taxYear).replace(/\D/g, "")) || null;

    res.json({
      source: "AI Document OCR",
      confidence: fieldsFound.length >= 4 ? "high" : fieldsFound.length >= 2 ? "partial" : "low",
      fieldsFound,
      ...extracted,
    });
  } catch (err: any) {
    console.error("OCR error:", err?.message ?? err);
    res.status(500).json({ error: "OCR service temporarily unavailable. Please enter details manually." });
  }
});

export default router;
