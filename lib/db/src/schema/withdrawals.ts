import { pgTable, serial, bigint, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const withdrawalsTable = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 18, scale: 2 }).notNull().default("0"),
  net_amount: numeric("net_amount", { precision: 18, scale: 2 }).notNull(),
  method: text("method").notNull(),
  address: text("address"),
  status: text("status").notNull().default("pending"),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processed_at: timestamp("processed_at", { withTimezone: true }),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawalsTable).omit({ id: true, created_at: true });
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;
