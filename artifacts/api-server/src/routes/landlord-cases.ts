import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, landlordCases, landlordCaseAttachments, landlordCasePayments } from "@workspace/db";
import { eq, desc, sum } from "drizzle-orm";
import {
  CreateLandlordCaseBody,
  UpdateLandlordCaseBody,
  GetLandlordCaseParams,
  UpdateLandlordCaseParams,
  DeleteLandlordCaseParams,
  UpdateLandlordCaseStatusParams,
  UpdateLandlordCaseStatusBody,
} from "@workspace/api-zod";
import OpenAI from "openai";
import { generateCaseDescription } from "../services/ai";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `lc-${unique}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed. Upload images, PDFs, or documents."));
  },
});

const router = Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function serializeCase(c: typeof landlordCases.$inferSelect) {
  return {
    ...c,
    monthlyRent: c.monthlyRent ? Number(c.monthlyRent) : null,
    claimAmount: Number(c.claimAmount),
    monthsOwed: c.monthsOwed ?? null,
    judgmentAmount: c.judgmentAmount ? Number(c.judgmentAmount) : null,
    recoveredAmount: c.recoveredAmount ? Number(c.recoveredAmount) : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/landlord-cases/stats", async (req, res) => {
  try {
    const cases = await db.select().from(landlordCases).orderBy(desc(landlordCases.createdAt));
    const totalCases = cases.length;
    const activeCases = cases.filter((c) =>
      ["demand_sent", "no_response", "filed", "hearing_scheduled", "judgment", "collection"].includes(c.status)
    ).length;
    const totalClaimed = cases.reduce((sum, c) => sum + Number(c.claimAmount), 0);
    const totalRecovered = cases.reduce((sum, c) => sum + (c.recoveredAmount ? Number(c.recoveredAmount) : 0), 0);
    const wonCases = cases.filter((c) => c.status === "closed" && c.recoveredAmount && Number(c.recoveredAmount) > 0).length;
    const pendingCases = cases.filter((c) => ["filed", "hearing_scheduled", "judgment"].includes(c.status)).length;
    res.json({ totalCases, activeCases, totalClaimed, totalRecovered, wonCases, pendingCases });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats", message: String(err) });
  }
});

router.get("/landlord-cases", async (req, res) => {
  try {
    const cases = await db.select().from(landlordCases).orderBy(desc(landlordCases.createdAt));
    res.json(cases.map(serializeCase));
  } catch (err) {
    res.status(500).json({ error: "Failed to list cases", message: String(err) });
  }
});

router.post("/landlord-cases", async (req, res) => {
  try {
    const body = CreateLandlordCaseBody.parse(req.body);
    const [created] = await db
      .insert(landlordCases)
      .values({
        claimType: body.claimType,
        state: body.state,
        landlordName: body.landlordName,
        landlordCompany: (body as any).landlordCompany ?? null,
        landlordAddress: (body as any).landlordAddress ?? null,
        landlordEmail: body.landlordEmail ?? null,
        landlordPhone: body.landlordPhone ?? null,
        tenantName: body.tenantName,
        tenantEmail: body.tenantEmail ?? null,
        tenantPhone: body.tenantPhone ?? null,
        tenantAddress: body.tenantAddress ?? null,
        propertyAddress: body.propertyAddress,
        monthlyRent: body.monthlyRent?.toString() ?? null,
        claimAmount: body.claimAmount.toString(),
        monthsOwed: (body as any).monthsOwed ?? null,
        rentPeriod: (body as any).rentPeriod ?? null,
        description: body.description,
        leaseStartDate: body.leaseStartDate ?? null,
        leaseEndDate: body.leaseEndDate ?? null,
        moveOutDate: body.moveOutDate ?? null,
        notes: body.notes ?? null,
        status: "draft",
      })
      .returning();
    res.status(201).json(serializeCase(created));
  } catch (err) {
    res.status(400).json({ error: "Failed to create case", message: String(err) });
  }
});

router.get("/landlord-cases/:id", async (req, res) => {
  try {
    const { id } = GetLandlordCaseParams.parse({ id: Number(req.params.id) });
    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, id));
    if (!found) return res.status(404).json({ error: "not_found", message: "Case not found" });
    res.json(serializeCase(found));
  } catch (err) {
    res.status(500).json({ error: "Failed to get case", message: String(err) });
  }
});

router.put("/landlord-cases/:id", async (req, res) => {
  try {
    const { id } = UpdateLandlordCaseParams.parse({ id: Number(req.params.id) });
    const body = UpdateLandlordCaseBody.parse(req.body);
    const updateData: Partial<typeof landlordCases.$inferInsert> = {};
    if (body.claimType !== undefined) updateData.claimType = body.claimType;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.landlordName !== undefined) updateData.landlordName = body.landlordName;
    if ((body as any).landlordCompany !== undefined) updateData.landlordCompany = (body as any).landlordCompany ?? null;
    if ((body as any).landlordAddress !== undefined) updateData.landlordAddress = (body as any).landlordAddress ?? null;
    if (body.landlordEmail !== undefined) updateData.landlordEmail = body.landlordEmail ?? null;
    if (body.landlordPhone !== undefined) updateData.landlordPhone = body.landlordPhone ?? null;
    if (body.tenantName !== undefined) updateData.tenantName = body.tenantName;
    if (body.tenantEmail !== undefined) updateData.tenantEmail = body.tenantEmail ?? null;
    if (body.tenantPhone !== undefined) updateData.tenantPhone = body.tenantPhone ?? null;
    if (body.tenantAddress !== undefined) updateData.tenantAddress = body.tenantAddress ?? null;
    if (body.propertyAddress !== undefined) updateData.propertyAddress = body.propertyAddress;
    if (body.monthlyRent !== undefined) updateData.monthlyRent = body.monthlyRent?.toString() ?? null;
    if (body.claimAmount !== undefined) updateData.claimAmount = body.claimAmount.toString();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.leaseStartDate !== undefined) updateData.leaseStartDate = body.leaseStartDate ?? null;
    if (body.leaseEndDate !== undefined) updateData.leaseEndDate = body.leaseEndDate ?? null;
    if (body.moveOutDate !== undefined) updateData.moveOutDate = body.moveOutDate ?? null;
    if (body.demandLetterText !== undefined) updateData.demandLetterText = body.demandLetterText ?? null;
    if (body.status !== undefined) updateData.status = body.status;
    if ((body as any).serviceMethod !== undefined) updateData.serviceMethod = (body as any).serviceMethod ?? null;
    if ((body as any).serviceDate !== undefined) updateData.serviceDate = (body as any).serviceDate ?? null;
    if ((body as any).serviceNotes !== undefined) updateData.serviceNotes = (body as any).serviceNotes ?? null;
    if (body.courtDate !== undefined) updateData.courtDate = body.courtDate ?? null;
    if (body.judgmentAmount !== undefined) updateData.judgmentAmount = body.judgmentAmount?.toString() ?? null;
    if (body.recoveredAmount !== undefined) updateData.recoveredAmount = body.recoveredAmount?.toString() ?? null;
    if (body.notes !== undefined) updateData.notes = body.notes ?? null;
    if ((body as any).monthsOwed !== undefined) (updateData as any).monthsOwed = (body as any).monthsOwed ?? null;
    if ((body as any).rentPeriod !== undefined) (updateData as any).rentPeriod = (body as any).rentPeriod ?? null;
    if ((body as any).archived !== undefined) (updateData as any).archived = (body as any).archived;
    updateData.updatedAt = new Date();
    const [updated] = await db.update(landlordCases).set(updateData).where(eq(landlordCases.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found", message: "Case not found" });
    res.json(serializeCase(updated));
  } catch (err) {
    res.status(400).json({ error: "Failed to update case", message: String(err) });
  }
});

router.delete("/landlord-cases/:id", async (req, res) => {
  try {
    const { id } = DeleteLandlordCaseParams.parse({ id: Number(req.params.id) });
    await db.delete(landlordCases).where(eq(landlordCases.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete case", message: String(err) });
  }
});

router.post("/landlord-cases/generate-description", async (req, res) => {
  try {
    const {
      claimType, state, claimAmount, monthlyRent, rentPeriod,
      tenantName, propertyAddress, leaseStartDate, moveOutDate,
    } = req.body as any;

    if (!claimType || !state || !claimAmount) {
      return res.status(400).json({ error: "claimType, state, and claimAmount are required" });
    }

    const description = await generateCaseDescription({
      claimType,
      state,
      claimAmount: Number(claimAmount),
      monthlyRent: monthlyRent ? Number(monthlyRent) : null,
      rentPeriod: rentPeriod || null,
      tenantName: tenantName || null,
      propertyAddress: propertyAddress || null,
      leaseStartDate: leaseStartDate || null,
      moveOutDate: moveOutDate || null,
    });

    res.json({ description });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate description", message: String(err) });
  }
});

router.post("/landlord-cases/:id/generate-letter", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [found] = await db.select().from(landlordCases).where(eq(landlordCases.id, id));
    if (!found) return res.status(404).json({ error: "not_found", message: "Case not found" });

    const claimTypeLabel: Record<string, string> = {
      unpaid_rent: "unpaid rent",
      property_damage: "property damage",
      security_deposit: "security deposit refusal",
      lease_break: "lease termination",
      other: "breach of lease",
    };

    const landlordLine = (found as any).landlordCompany
      ? `${found.landlordName} / ${(found as any).landlordCompany}`
      : found.landlordName;
    const prompt = `You are a legal document assistant. Write a formal demand letter from a landlord to a tenant. Be professional, firm, and clear.

Landlord: ${landlordLine}
${(found as any).landlordAddress ? `Landlord Address: ${(found as any).landlordAddress}` : ""}
Tenant: ${found.tenantName}
Property: ${found.propertyAddress}
Claim Type: ${claimTypeLabel[found.claimType] || found.claimType}
Amount Owed: $${Number(found.claimAmount).toLocaleString()}
${found.description ? `Details: ${found.description}` : ""}
${found.moveOutDate ? `Move-Out Date: ${found.moveOutDate}` : ""}

Write a demand letter (3-4 paragraphs) requesting payment within 10 days or the landlord will pursue small claims court action. Include a reference to the state: ${found.state}. Use the landlord's full name and address in the letter header. Do not include placeholders — write the full letter.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const letter = completion.choices[0]?.message?.content ?? "";
    await db.update(landlordCases).set({ demandLetterText: letter, updatedAt: new Date() }).where(eq(landlordCases.id, id));
    res.json({ letter });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate letter", message: String(err) });
  }
});

router.put("/landlord-cases/:id/status", async (req, res) => {
  try {
    const { id } = UpdateLandlordCaseStatusParams.parse({ id: Number(req.params.id) });
    const body = UpdateLandlordCaseStatusBody.parse(req.body);
    const [updated] = await db
      .update(landlordCases)
      .set({ status: body.status, notes: body.notes ?? undefined, updatedAt: new Date() })
      .where(eq(landlordCases.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "not_found", message: "Case not found" });
    res.json(serializeCase(updated));
  } catch (err) {
    res.status(400).json({ error: "Failed to update status", message: String(err) });
  }
});

// ─── Attachments ────────────────────────────────────────────────────────────

router.post("/landlord-cases/:id/attachments", upload.single("file"), async (req: any, res: any) => {
  try {
    const caseId = Number(req.params.id);
    if (isNaN(caseId)) return res.status(400).json({ error: "bad_request", message: "Invalid case ID" });
    const file = req.file;
    if (!file) return res.status(400).json({ error: "bad_request", message: "No file provided" });
    const category = req.body.category || "other";
    const notes = req.body.notes || null;
    const fileUrl = `/api/landlord-attachments/file/${file.filename}`;
    const [created] = await db
      .insert(landlordCaseAttachments)
      .values({ caseId, category, fileUrl, fileName: file.originalname, fileSize: file.size, mimeType: file.mimetype, notes })
      .returning();
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: "upload_error", message: err.message });
  }
});

router.get("/landlord-cases/:id/attachments", async (req: any, res: any) => {
  try {
    const caseId = Number(req.params.id);
    if (isNaN(caseId)) return res.status(400).json({ error: "bad_request", message: "Invalid case ID" });
    const files = await db.select().from(landlordCaseAttachments)
      .where(eq(landlordCaseAttachments.caseId, caseId))
      .orderBy(landlordCaseAttachments.uploadedAt);
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: "list_error", message: err.message });
  }
});

router.delete("/landlord-cases/:caseId/attachments/:attachmentId", async (req: any, res: any) => {
  try {
    const attachmentId = Number(req.params.attachmentId);
    const [deleted] = await db.delete(landlordCaseAttachments)
      .where(eq(landlordCaseAttachments.id, attachmentId))
      .returning();
    if (deleted) {
      const diskPath = path.join(UPLOADS_DIR, path.basename(deleted.fileUrl));
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "delete_error", message: err.message });
  }
});

router.use("/landlord-attachments/file", (req: any, res: any) => {
  const filename = path.basename(req.path);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "not_found" });
  res.sendFile(filePath);
});

// ── Judgment Payments ─────────────────────────────────────────────────────────

router.get("/landlord-cases/:id/payments", async (req, res) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    if (!caseId) return res.status(400).json({ error: "invalid_id" });
    const rows = await db
      .select()
      .from(landlordCasePayments)
      .where(eq(landlordCasePayments.caseId, caseId))
      .orderBy(desc(landlordCasePayments.paymentDate));
    res.json(rows.map((r) => ({ ...r, amount: String(r.amount) })));
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.post("/landlord-cases/:id/payments", async (req, res) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    if (!caseId) return res.status(400).json({ error: "invalid_id" });

    const { amount, paymentDate, method, notes } = req.body as {
      amount: string; paymentDate: string; method: string; notes?: string;
    };
    if (!amount || !paymentDate) return res.status(400).json({ error: "amount and paymentDate required" });

    const [inserted] = await db
      .insert(landlordCasePayments)
      .values({ caseId, amount, paymentDate, method: method ?? "other", notes: notes ?? null })
      .returning();

    // Recalculate and update recoveredAmount on the case
    const [agg] = await db
      .select({ total: sum(landlordCasePayments.amount) })
      .from(landlordCasePayments)
      .where(eq(landlordCasePayments.caseId, caseId));
    const newTotal = String(agg?.total ?? "0");

    await db
      .update(landlordCases)
      .set({ recoveredAmount: newTotal, updatedAt: new Date() })
      .where(eq(landlordCases.id, caseId));

    res.status(201).json({ ...inserted, amount: String(inserted.amount) });
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.delete("/landlord-cases/:id/payments/:paymentId", async (req, res) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const paymentId = parseInt(req.params.paymentId, 10);

    await db
      .delete(landlordCasePayments)
      .where(eq(landlordCasePayments.id, paymentId));

    // Recalculate recovered amount
    const [agg] = await db
      .select({ total: sum(landlordCasePayments.amount) })
      .from(landlordCasePayments)
      .where(eq(landlordCasePayments.caseId, caseId));
    const newTotal = String(agg?.total ?? "0");

    await db
      .update(landlordCases)
      .set({ recoveredAmount: newTotal, updatedAt: new Date() })
      .where(eq(landlordCases.id, caseId));

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
