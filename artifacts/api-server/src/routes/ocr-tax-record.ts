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

const SYSTEM_PROMPT = `You are an expert OCR assistant specializing in property tax documents from all US states,
with deep expertise in NY, NJ, TX, and FL assessment notices, tax bills, and grievance forms.

Your job: extract key property information from uploaded images of any official tax or assessment document.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Use null for fields you cannot find.

Fields to extract:
{
  "state": "Two-letter state code detected from the document (NY, NJ, TX, FL, or other)",
  "ownerName": "Full name of property owner(s) as printed",
  "propertyAddress": "Full street address of the property including city, state, zip if shown",
  "parcelId": "The official parcel/account ID. In NY: SBL or Tax Map # (e.g. 064.00-04-001.000). In NJ: Block/Lot (e.g. Block 42, Lot 7). In TX: Account Number or Appraisal District Number. In FL: Parcel ID or Folio Number.",
  "county": "County name (e.g. Nassau, Middlesex, Harris, Miami-Dade)",
  "municipality": "Town, city, township, or village (e.g. Town of Hempstead, Township of Edison, City of Houston)",
  "schoolDistrict": "School district name if shown",
  "propertyClass": "Classification code or land use code — NY: 210/220/etc; NJ: Class 2; TX: A1/A2; FL: 0100/0101/etc",
  "yearBuilt": "Year constructed — look for 'Year Built', 'Yr Built', 'Built', 'Construction Year'",
  "livingArea": "Gross living area in sq ft (number only) — look for 'Living Area', 'GBA', 'Gross Building Area', 'Sq Ft', 'Heated Area', 'Under Air'",
  "lotSize": "Lot size — dimensions, acreage, or sq ft (e.g. '60x120', '0.25 acres', '7,500 sq ft')",
  "landAssessment": "Land-only assessed value — 'Land AV', 'Land Value', 'Land Assessment', 'Site Value'",
  "totalAssessment": "CRITICAL: The total assessed value used for tax calculation. NY: 'Total AV' or 'Assessed Value'. NJ: 'Total Assessment'. TX: 'Assessed Value' (may differ from 'Appraised Value' due to cap). FL: 'Assessed Value' (after SOH cap). This is the value the homeowner wants to challenge.",
  "estimatedMarketValue": "Full market/appraised value before any caps or exemptions. NY: 'Full Market Value'. NJ: true market value. TX: 'Appraised Value' or 'Market Value'. FL: 'Just Value' or 'Market Value'. This is what the assessor thinks the property is worth.",
  "taxYear": "Assessment or tax year as a 4-digit number — 'Tax Year', 'Assessment Year', 'Roll Year', 'For Year'",
  "filingDeadline": "Appeal/protest/grievance filing deadline if printed — 'Grievance Day', 'Protest Deadline', 'File By', 'ARB Hearing'",
  "exemptions": "List any exemptions shown (e.g. STAR, Homestead Exemption, Senior, Veterans, Disability, Agricultural)",
  "rawText": "One sentence describing the document type (e.g. 'NY Nassau County 2024 Property Assessment Notice')"
}

State-specific extraction tips:
NEW YORK (NY):
- SBL (Section-Block-Lot) is the parcel ID, format like 064.00-04-001.000 or 09-C-32
- 'Total AV' = Assessed Value to challenge; 'Full Market Value' = estimated market value
- Nassau County often shows values in full dollars; other counties may show in thousands
- STAR exemption reduces the taxable assessed value — note it separately

NEW JERSEY (NJ):
- Block and Lot number is the parcel ID (e.g. Block 42, Lot 7, Qualifier C0001)
- 'Total Assessment' = assessed value; NJ assesses at a county-specific ratio of market value
- 'Average Ratio' or 'Equalization Ratio' may be shown — extract it if present
- Look for 'Land', 'Improvements', 'Total' columns

TEXAS (TX):
- Account Number is the parcel ID (sometimes called Appraisal District Number)
- 'Market Value' or 'Appraised Value' = full appraised value
- 'Assessed Value' = value after any homestead/agricultural cap (may be lower)
- '10% cap', 'HS Cap', or 'Ag Val' indicate value limitations
- Homestead exemption amounts should be noted

FLORIDA (FL):
- Parcel ID or Folio Number is the identifier (format varies by county, e.g. 12-3456-789-0010)
- 'Just Value' = full market value (what to compare against comps)
- 'Assessed Value' = value after Save Our Homes (SOH) cap — may be much lower than Just Value
- 'Taxable Value' = after all exemptions are applied
- Homestead Exemption ($25,000 + $25,000) should be noted

General tips:
- Prioritize tables and clearly labeled fields over running text
- Dollar signs and commas are common — strip them from numeric values
- If values appear in thousands (e.g. a note says "values in thousands"), multiply by 1000
- Always read carefully — assessors use many different label names for the same concept`;

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
