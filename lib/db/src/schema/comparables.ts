import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const comparablesTable = pgTable("comparables", {
  id: serial("id").primaryKey(),
  grievanceId: integer("grievance_id").notNull(),
  address: text("address").notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
  saleDate: text("sale_date").notNull(),
  squareFeet: numeric("square_feet", { precision: 10, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 4, scale: 1 }),
  assessedValue: numeric("assessed_value", { precision: 12, scale: 2 }),
  lotSize: text("lot_size"),
  yearBuilt: integer("year_built"),
  distance: text("distance"),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertComparableSchema = createInsertSchema(comparablesTable).omit({ id: true, createdAt: true });
export const updateComparableSchema = insertComparableSchema.partial();

export type InsertComparable = z.infer<typeof insertComparableSchema>;
export type Comparable = typeof comparablesTable.$inferSelect;
