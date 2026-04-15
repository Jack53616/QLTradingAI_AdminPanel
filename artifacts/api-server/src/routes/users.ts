import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql, ilike, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";
import {
  ListUsersQueryParams,
  GetUserParams,
  AdjustUserBalanceParams,
  AdjustUserBalanceBody,
  UpdateUserStatusParams,
  UpdateUserStatusBody,
} from "@workspace/api-zod";

export const usersRouter = Router();
usersRouter.use(requireAdmin);

usersRouter.get("/", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_params" });
    return;
  }

  const { search, status, limit = 50, offset = 0 } = parsed.data;

  try {
    let query = db.select().from(usersTable);

    const conditions = [];
    if (status) conditions.push(eq(usersTable.status, status));
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.username, `%${search}%`),
          ilike(usersTable.email, `%${search}%`)
        )!
      );
    }

    const whereQuery = conditions.length > 0
      ? query.where(conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`)
      : query;

    const users = await whereQuery.orderBy(sql`${usersTable.created_at} DESC`).limit(limit).offset(offset);

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
    const total = totalResult?.count ?? 0;

    res.json({ ok: true, users, total });
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});

usersRouter.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_id" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.id));
    if (!user) {
      res.status(404).json({ ok: false, error: "user_not_found" });
      return;
    }

    const [tradesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`trades WHERE user_id = ${user.id}`);

    const [withdrawalsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`withdrawals WHERE user_id = ${user.id}`);

    const [transfersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`transfers WHERE from_user_id = ${user.id} OR to_user_id = ${user.id}`);

    res.json({
      ok: true,
      user: {
        ...user,
        trades_count: tradesCount?.count ?? 0,
        withdrawals_count: withdrawalsCount?.count ?? 0,
        transfers_count: transfersCount?.count ?? 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});

usersRouter.post("/:id/balance", async (req, res): Promise<void> => {
  const paramsParsed = AdjustUserBalanceParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = AdjustUserBalanceBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ ok: false, error: "invalid_request" });
    return;
  }

  const { id } = paramsParsed.data;
  const { amount, operation } = bodyParsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ ok: false, error: "user_not_found" });
      return;
    }

    if (operation === "add") {
      await db
        .update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${amount}`, updated_at: new Date() })
        .where(eq(usersTable.id, id));
    } else {
      await db
        .update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${amount}`, updated_at: new Date() })
        .where(eq(usersTable.id, id));
    }

    res.json({ ok: true, message: `Balance ${operation === "add" ? "added" : "subtracted"} successfully` });
  } catch (err) {
    req.log.error({ err }, "Failed to adjust balance");
    res.status(500).json({ ok: false, error: "update_failed" });
  }
});

usersRouter.post("/:id/status", async (req, res): Promise<void> => {
  const paramsParsed = UpdateUserStatusParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateUserStatusBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ ok: false, error: "invalid_request" });
    return;
  }

  const { id } = paramsParsed.data;
  const { status, banDuration } = bodyParsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ ok: false, error: "user_not_found" });
      return;
    }

    let banUntil: Date | null = null;
    if (status === "temp_banned" && banDuration) {
      banUntil = new Date();
      const match = banDuration.match(/^(\d+)([hdw])$/);
      if (match) {
        const num = parseInt(match[1]!);
        const unit = match[2]!;
        if (unit === "h") banUntil.setHours(banUntil.getHours() + num);
        else if (unit === "d") banUntil.setDate(banUntil.getDate() + num);
        else if (unit === "w") banUntil.setDate(banUntil.getDate() + num * 7);
      }
    }

    await db
      .update(usersTable)
      .set({
        status: status === "temp_banned" ? "banned" : status,
        ban_until: banUntil,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, id));

    res.json({ ok: true, message: "Status updated successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to update user status");
    res.status(500).json({ ok: false, error: "update_failed" });
  }
});
