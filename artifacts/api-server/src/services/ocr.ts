import Tesseract from "tesseract.js";

export async function extractTextFromImage(filePath: string): Promise<string> {
  const result = await Tesseract.recognize(filePath, "eng");
  return result.data.text.trim();
}
