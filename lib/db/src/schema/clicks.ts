import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { linksTable } from "./links";

export const clicksTable = pgTable("clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id")
    .notNull()
    .references(() => linksTable.id),
  clickedAt: timestamp("clicked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  browser: text("browser").notNull(),
  operatingSystem: text("operating_system").notNull(),
  device: text("device").notNull(),
  country: text("country").notNull(),
  referrer: text("referrer").notNull(),
  ipAddress: text("ip_address").notNull(),
});

export const insertClickSchema = createInsertSchema(clicksTable).omit({
  id: true,
  clickedAt: true,
});
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicksTable.$inferSelect;
