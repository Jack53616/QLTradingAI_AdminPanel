import { pgTable, serial, bigint, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transfersTable = pgTable("transfers", {
  id: serial("id").primaryKey(),
  from_user_id: bigint("from_user_id", { mode: "number" }).notNull(),
  to_user_id: bigint("to_user_id", { mode: "number" }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processed_at: timestamp("processed_at", { withTimezone: true }),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, created_at: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
