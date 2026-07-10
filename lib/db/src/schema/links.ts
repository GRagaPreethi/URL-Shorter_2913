import {
  pgTable,
  text,
  serial,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const linksTable = pgTable("links", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalUrl: text("original_url").notNull(),
  shortCode: text("short_code").notNull().unique(),
  customAlias: text("custom_alias"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertLinkSchema = createInsertSchema(linksTable).omit({
  id: true,
  shortCode: true,
  isActive: true,
  deletedAt: true,
  clickCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof linksTable.$inferSelect;
