import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tenantLeads = pgTable("tenant_leads", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  value: text("value").notNull(),
  source: text("source"),
  status: varchar("status", { length: 20 }).notNull().default("unverified"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tenantContactAttempts = pgTable("tenant_contact_attempts", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  method: varchar("method", { length: 40 }).notNull(),
  result: text("result"),
  contactedAt: timestamp("contacted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTenantLeadSchema = createInsertSchema(tenantLeads).omit({ id: true, createdAt: true });
export const insertTenantContactSchema = createInsertSchema(tenantContactAttempts).omit({ id: true, createdAt: true });

export type TenantLead = typeof tenantLeads.$inferSelect;
export type TenantContactAttempt = typeof tenantContactAttempts.$inferSelect;
export type InsertTenantLead = z.infer<typeof insertTenantLeadSchema>;
export type InsertTenantContact = z.infer<typeof insertTenantContactSchema>;
