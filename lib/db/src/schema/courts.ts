import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courts = pgTable("courts", {
  id: serial("id").primaryKey(),

  state: varchar("state", { length: 10 }).notNull(),
  county: varchar("county", { length: 100 }).notNull(),

  courtName: text("court_name").notNull(),
  courtType: varchar("court_type", { length: 80 }).notNull().default("Small Claims"),

  maxClaim: integer("max_claim").notNull(),

  address: text("address").notNull(),
  filingRoom: text("filing_room"),
  filingHours: text("filing_hours"),
  phone: varchar("phone", { length: 50 }),

  filingFee: integer("filing_fee"),
  serviceFeeMin: integer("service_fee_min"),
  serviceFeeMax: integer("service_fee_max"),

  onlineFiling: boolean("online_filing").notNull().default(false),
  onlineUrl: text("online_url"),

  paymentMethods: text("payment_methods"),
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCourtSchema = createInsertSchema(courts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courts.$inferSelect;
