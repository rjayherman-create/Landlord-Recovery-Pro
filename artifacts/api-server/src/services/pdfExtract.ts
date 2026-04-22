import fs from "fs";
// Static import from internal lib path — skips pdf-parse/index.js test side-effect
// and lets esbuild bundle it at build time rather than resolve at runtime
// @ts-ignore — no types for the internal subpath
import pdfParseRaw from "pdf-parse/lib/pdf-parse.js";
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = pdfParseRaw;

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text as string).trim();
}
