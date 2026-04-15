import { pgTable, serial, bigint, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminLogsTable = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  admin_id: bigint("admin_id", { mode: "number" }),
  target_user_id: bigint("target_user_id", { mode: "number" }),
  action: text("action").notNull(),
  details: jsonb("details"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminLogSchema = createInsertSchema(adminLogsTable).omit({ id: true, created_at: true });
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogsTable.$inferSelect;
