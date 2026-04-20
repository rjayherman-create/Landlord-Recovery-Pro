import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { db, evidenceTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Upload images, PDFs, or documents."));
    }
  },
});

const router: IRouter = Router();

// Upload a file for a case
router.post("/cases/:caseId/evidence", upload.single("file"), async (req: any, res: any) => {
  try {
    const caseId = Number(req.params.caseId);
    if (isNaN(caseId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid case ID" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "bad_request", message: "No file provided" });
      return;
    }

    const fileUrl = `/api/evidence/file/${file.filename}`;

    const [created] = await db
      .insert(evidenceTable)
      .values({
        caseId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      })
      .returning();

    res.status(201).json(created);
  } catch (err: any) {
    req.log?.error({ err }, "Evidence upload failed");
    res.status(500).json({ error: "upload_error", message: err.message });
  }
});

// List evidence for a case
router.get("/cases/:caseId/evidence", async (req: any, res: any) => {
  try {
    const caseId = Number(req.params.caseId);
    if (isNaN(caseId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid case ID" });
      return;
    }

    const files = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.caseId, caseId))
      .orderBy(evidenceTable.uploadedAt);

    res.json(files);
  } catch (err: any) {
    req.log?.error({ err }, "Failed to list evidence");
    res.status(500).json({ error: "list_error", message: err.message });
  }
});

// Delete a single evidence file
router.delete("/evidence/:id", async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db
      .delete(evidenceTable)
      .where(eq(evidenceTable.id, id))
      .returning();

    if (deleted) {
      const diskPath = path.join(UPLOADS_DIR, path.basename(deleted.fileUrl));
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    }

    res.status(204).send();
  } catch (err: any) {
    req.log?.error({ err }, "Failed to delete evidence");
    res.status(500).json({ error: "delete_error", message: err.message });
  }
});

// Serve uploaded files
router.use("/evidence/file", (req: any, res: any, next: any) => {
  const filename = path.basename(req.path);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.sendFile(filePath);
});

export default router;
