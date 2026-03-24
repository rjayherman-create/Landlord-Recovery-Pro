import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const grievancesTable = pgTable("grievances", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone"),
  ownerEmail: text("owner_email"),
  ownerMailingAddress: text("owner_mailing_address"),
  propertyAddress: text("property_address").notNull(),
  county: text("county").notNull(),
  municipality: text("municipality").notNull(),
  schoolDistrict: text("school_district"),
  parcelId: text("parcel_id"),
  propertyClass: text("property_class"),
  yearBuilt: integer("year_built"),
  livingArea: numeric("living_area", { precision: 10, scale: 2 }),
  lotSize: text("lot_size"),
  taxYear: integer("tax_year").notNull(),
  currentAssessment: numeric("current_assessment", { precision: 12, scale: 2 }).notNull(),
  equalizationRate: numeric("equalization_rate", { precision: 8, scale: 4 }),
  estimatedMarketValue: numeric("estimated_market_value", { precision: 12, scale: 2 }).notNull(),
  requestedAssessment: numeric("requested_assessment", { precision: 12, scale: 2 }).notNull(),
  basisOfComplaint: text("basis_of_complaint"),
  status: text("status").notNull().default("draft"),
  filingDeadline: text("filing_deadline"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGrievanceSchema = createInsertSchema(grievancesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const updateGrievanceSchema = insertGrievanceSchema.partial();

export type InsertGrievance = z.infer<typeof insertGrievanceSchema>;
export type Grievance = typeof grievancesTable.$inferSelect;
