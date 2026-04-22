import fs from "fs";
import { createRequire } from "module";
// Import directly from the lib path to skip pdf-parse's own test-file side effect
const _require = createRequire(import.meta.url);
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = _require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text as string).trim();
}
