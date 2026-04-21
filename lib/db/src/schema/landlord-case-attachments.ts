import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const landlordCaseAttachments = pgTable("landlord_case_attachments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("other"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export type LandlordCaseAttachment = typeof landlordCaseAttachments.$inferSelect;
export type InsertLandlordCaseAttachment = typeof landlordCaseAttachments.$inferInsert;
