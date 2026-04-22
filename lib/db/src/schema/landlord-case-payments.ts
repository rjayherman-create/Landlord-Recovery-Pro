import {
  pgTable,
  serial,
  integer,
  numeric,
  varchar,
  text,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landlordCasePayments = pgTable("landlord_case_payments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  method: varchar("method", { length: 80 }).notNull().default("other"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLandlordCasePaymentSchema = createInsertSchema(landlordCasePayments).omit({
  id: true,
  createdAt: true,
});

export type InsertLandlordCasePayment = z.infer<typeof insertLandlordCasePaymentSchema>;
export type LandlordCasePayment = typeof landlordCasePayments.$inferSelect;
