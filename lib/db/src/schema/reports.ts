import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  wasteType: text("waste_type").notNull(),
  location: text("location").notNull(),
  area: text("area").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status").notNull().default("pending"),
  severity: text("severity").notNull().default("medium"),
  description: text("description"),
  imageBase64: text("image_base64"),
  reporterName: text("reporter_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
