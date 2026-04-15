import { Router } from "express";
import { db, tradesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";
import { ListTradesQueryParams } from "@workspace/api-zod";

export const tradesRouter = Router();
tradesRouter.use(requireAdmin);

tradesRouter.get("/", async (req, res): Promise<void> => {
  const parsed = ListTradesQueryParams.safeParse({
    ...req.query,
    userId: req.query.userId ? Number(req.query.userId) : undefined,
  });

  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_params" });
    return;
  }

  const { userId, status, limit = 50 } = parsed.data;

  try {
    const trades = await db
      .select({
        id: tradesTable.id,
        user_id: tradesTable.user_id,
        symbol: tradesTable.symbol,
        side: tradesTable.side,
        amount: tradesTable.amount,
        entry_price: tradesTable.entry_price,
        tp: tradesTable.tp,
        sl: tradesTable.sl,
        status: tradesTable.status,
        profit: tradesTable.profit,
        opened_at: tradesTable.opened_at,
        closed_at: tradesTable.closed_at,
        user_name: usersTable.name,
      })
      .from(tradesTable)
      .leftJoin(usersTable, eq(tradesTable.user_id, usersTable.id))
      .where(
        userId && status
          ? sql`${tradesTable.user_id} = ${userId} AND ${tradesTable.status} = ${status}`
          : userId
            ? eq(tradesTable.user_id, userId)
            : status
              ? eq(tradesTable.status, status)
              : undefined
      )
      .orderBy(sql`${tradesTable.opened_at} DESC`)
      .limit(limit);

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(tradesTable);
    const total = totalResult?.count ?? 0;

    res.json({
      ok: true,
      trades: trades.map((t) => ({
        ...t,
        amount: Number(t.amount),
        entry_price: Number(t.entry_price),
        tp: t.tp != null ? Number(t.tp) : null,
        sl: t.sl != null ? Number(t.sl) : null,
        profit: t.profit != null ? Number(t.profit) : null,
      })),
      total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list trades");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});
