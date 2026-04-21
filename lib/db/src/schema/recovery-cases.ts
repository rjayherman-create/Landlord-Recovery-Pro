import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  date,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recoveryCases = pgTable("recovery_cases", {
  id: uuid("id").defaultRandom().primaryKey(),

  appMode: varchar("app_mode", { length: 40 }).notNull().default("landlord"),
  caseType: varchar("case_type", { length: 60 }).notNull(),

  claimantName: varchar("claimant_name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),

  propertyName: varchar("property_name", { length: 255 }),
  unitLabel: varchar("unit_label", { length: 255 }),

  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  guarantorName: varchar("guarantor_name", { length: 255 }),

  lastKnownAddress: text("last_known_address"),
  subjectPhone: varchar("subject_phone", { length: 50 }),
  subjectEmail: varchar("subject_email", { length: 255 }),

  moveOutDate: date("move_out_date"),
  serviceStartDate: date("service_start_date"),
  serviceEndDate: date("service_end_date"),

  amountOwed: numeric("amount_owed", { precision: 12, scale: 2 }).notNull(),
  rentOwed: numeric("rent_owed", { precision: 12, scale: 2 }).default("0"),
  damageOwed: numeric("damage_owed", { precision: 12, scale: 2 }).default("0"),
  utilityOwed: numeric("utility_owed", { precision: 12, scale: 2 }).default("0"),
  otherOwed: numeric("other_owed", { precision: 12, scale: 2 }).default("0"),

  notes: text("notes"),
  sourceMeta: jsonb("source_meta").$type<Record<string, unknown>>(),

  generatedStatement: text("generated_statement"),
  conversationId: uuid("conversation_id"),
  userId: text("user_id"),

  status: varchar("status", { length: 60 }).notNull().default("draft"),

  stripeSessionId: text("stripe_session_id"),
  paidAt: timestamp("paid_at"),
  plan: text("plan").default("basic"),

  emailReminders: boolean("email_reminders").default(true),
  smsReminders: boolean("sms_reminders").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRecoveryCaseSchema = createInsertSchema(recoveryCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateRecoveryCaseSchema = insertRecoveryCaseSchema.partial();

export type InsertRecoveryCase = z.infer<typeof insertRecoveryCaseSchema>;
export type RecoveryCase = typeof recoveryCases.$inferSelect;
