import { extractTextFromImage } from "./ocr";
import { extractTextFromPDF } from "./pdfExtract";
import fs from "fs";

export async function parseDocument(file: {
  path: string;
  mimetype: string;
  originalname: string;
}): Promise<string> {
  const { path: filePath, mimetype } = file;

  try {
    if (mimetype.startsWith("image/")) {
      return await extractTextFromImage(filePath);
    }

    if (mimetype === "application/pdf") {
      return await extractTextFromPDF(filePath);
    }

    if (
      mimetype === "text/plain" ||
      mimetype.startsWith("text/") ||
      file.originalname.endsWith(".txt")
    ) {
      return fs.readFileSync(filePath, "utf-8").trim();
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
}
