import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const evidenceTable = pgTable("small_claims_evidence", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export type Evidence = typeof evidenceTable.$inferSelect;
export type InsertEvidence = typeof evidenceTable.$inferInsert;
