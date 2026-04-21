import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landlordCases = pgTable("landlord_cases", {
  id: serial("id").primaryKey(),
  claimType: varchar("claim_type", { length: 60 }).notNull(),
  state: varchar("state", { length: 10 }).notNull().default("NY"),
  landlordName: varchar("landlord_name", { length: 255 }).notNull(),
  landlordEmail: varchar("landlord_email", { length: 255 }),
  landlordPhone: varchar("landlord_phone", { length: 50 }),
  tenantName: varchar("tenant_name", { length: 255 }).notNull(),
  tenantEmail: varchar("tenant_email", { length: 255 }),
  tenantPhone: varchar("tenant_phone", { length: 50 }),
  tenantAddress: text("tenant_address"),
  propertyAddress: text("property_address").notNull(),
  monthlyRent: numeric("monthly_rent", { precision: 12, scale: 2 }),
  claimAmount: numeric("claim_amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  leaseStartDate: date("lease_start_date"),
  leaseEndDate: date("lease_end_date"),
  moveOutDate: date("move_out_date"),
  demandLetterText: text("demand_letter_text"),
  status: varchar("status", { length: 60 }).notNull().default("draft"),
  courtDate: date("court_date"),
  judgmentAmount: numeric("judgment_amount", { precision: 12, scale: 2 }),
  recoveredAmount: numeric("recovered_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLandlordCaseSchema = createInsertSchema(landlordCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateLandlordCaseSchema = insertLandlordCaseSchema.partial();

export type InsertLandlordCase = z.infer<typeof insertLandlordCaseSchema>;
export type LandlordCase = typeof landlordCases.$inferSelect;
