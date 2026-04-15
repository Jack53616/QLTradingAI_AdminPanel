import { pgTable, serial, bigint, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  entry_price: numeric("entry_price", { precision: 18, scale: 8 }).notNull(),
  tp: numeric("tp", { precision: 18, scale: 8 }),
  sl: numeric("sl", { precision: 18, scale: 8 }),
  status: text("status").notNull().default("open"),
  profit: numeric("profit", { precision: 18, scale: 2 }),
  closed_price: numeric("closed_price", { precision: 18, scale: 8 }),
  metadata: jsonb("metadata").notNull().default({}),
  opened_at: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closed_at: timestamp("closed_at", { withTimezone: true }),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, opened_at: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
