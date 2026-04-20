import fs from "fs";
// Import from the internal lib path to avoid pdf-parse running its own test
// file on module load (which crashes when the CWD lacks the test fixture).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text as string).trim();
}
