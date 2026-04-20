import { pgTable, serial, text, numeric, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smallClaimsCasesTable = pgTable("small_claims_cases", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),

  claimType: text("claim_type").notNull(),
  state: text("state").notNull().default("NY"),
  county: text("county"),
  courtLocation: text("court_location"),

  claimantName: text("claimant_name").notNull(),
  claimantEmail: text("claimant_email"),
  claimantPhone: text("claimant_phone"),
  claimantAddress: text("claimant_address"),

  defendantName: text("defendant_name").notNull(),
  defendantAddress: text("defendant_address"),
  defendantEmail: text("defendant_email"),
  defendantPhone: text("defendant_phone"),

  claimAmount: numeric("claim_amount", { precision: 12, scale: 2 }).notNull(),
  claimDescription: text("claim_description").notNull(),
  claimBasis: text("claim_basis"),
  incidentDate: text("incident_date"),
  desiredOutcome: text("desired_outcome"),
  supportingFacts: text("supporting_facts"),

  generatedStatement: text("generated_statement"),
  conversationId: integer("conversation_id"),

  status: text("status").notNull().default("draft"),
  lastUpdate: text("last_update"),
  filingDeadline: text("filing_deadline"),
  hearingDate: text("hearing_date"),
  caseNumber: text("case_number"),
  notes: text("notes"),

  stripeSessionId: text("stripe_session_id"),
  paidAt: timestamp("paid_at"),

  emailReminders: text("email_reminders").default("true"),
  smsReminders: text("sms_reminders").default("false"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const remindersTable = pgTable("reminders", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => smallClaimsCasesTable.id, { onDelete: "cascade" }),
  message: text("message"),
  sendAt: timestamp("send_at"),
  sent: text("sent").default("false"),
  type: text("type"), // "email" | "sms"
});

export const insertSmallClaimsSchema = createInsertSchema(smallClaimsCasesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSmallClaimsSchema = insertSmallClaimsSchema.partial();

export type InsertSmallClaimsCase = z.infer<typeof insertSmallClaimsSchema>;
export type SmallClaimsCase = typeof smallClaimsCasesTable.$inferSelect;
