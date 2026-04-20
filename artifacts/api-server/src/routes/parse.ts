import { Router, type IRouter } from "express";
import multer from "multer";
import os from "os";
import { parseDocument } from "../services/documentParser";

const router: IRouter = Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// POST /api/parse — accepts a single file, returns extracted text
router.post("/parse", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file uploaded." });
    return;
  }

  try {
    const text = await parseDocument({
      path: req.file.path,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });

    res.json({ text, fileName: req.file.originalname });
  } catch (err: any) {
    res.status(422).json({ error: "parse_failed", message: err.message });
  }
});

export default router;
