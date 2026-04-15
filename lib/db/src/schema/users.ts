import { pgTable, bigserial, bigint, text, boolean, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  tg_id: bigint("tg_id", { mode: "number" }).unique(),
  email: text("email").unique(),
  name: text("name"),
  username: text("username"),
  status: text("status").notNull().default("active"),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  sub_expires: timestamp("sub_expires", { withTimezone: true }),
  ban_until: timestamp("ban_until", { withTimezone: true }),
  verified: boolean("verified").notNull().default(false),
  sub_days: integer("sub_days").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
