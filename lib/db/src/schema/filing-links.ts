import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const filingLinksTable = pgTable("filing_links", {
  id: serial("id").primaryKey(),
  state: varchar("state", { length: 2 }).notNull(),
  county: text("county").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
});

export type FilingLink = typeof filingLinksTable.$inferSelect;
