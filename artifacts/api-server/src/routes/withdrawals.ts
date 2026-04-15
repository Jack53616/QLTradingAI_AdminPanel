import { Router } from "express";
import { db, withdrawalsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";
import {
  ListWithdrawalsQueryParams,
  ApproveWithdrawalParams,
  RejectWithdrawalParams,
  RejectWithdrawalBody,
} from "@workspace/api-zod";

export const withdrawalsRouter = Router();
withdrawalsRouter.use(requireAdmin);

withdrawalsRouter.get("/", async (req, res): Promise<void> => {
  const parsed = ListWithdrawalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_params" });
    return;
  }

  const { status, limit = 50 } = parsed.data;

  try {
    const withdrawals = await db
      .select({
        id: withdrawalsTable.id,
        user_id: withdrawalsTable.user_id,
        amount: withdrawalsTable.amount,
        fee: withdrawalsTable.fee,
        net_amount: withdrawalsTable.net_amount,
        method: withdrawalsTable.method,
        address: withdrawalsTable.address,
        status: withdrawalsTable.status,
        reason: withdrawalsTable.reason,
        created_at: withdrawalsTable.created_at,
        processed_at: withdrawalsTable.processed_at,
        user_name: usersTable.name,
      })
      .from(withdrawalsTable)
      .leftJoin(usersTable, eq(withdrawalsTable.user_id, usersTable.id))
      .where(status ? eq(withdrawalsTable.status, status) : undefined)
      .orderBy(sql`${withdrawalsTable.created_at} DESC`)
      .limit(limit);

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(withdrawalsTable);
    const total = totalResult?.count ?? 0;

    res.json({
      ok: true,
      withdrawals: withdrawals.map((w) => ({
        ...w,
        amount: Number(w.amount),
        fee: Number(w.fee),
        net_amount: Number(w.net_amount),
      })),
      total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list withdrawals");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});

withdrawalsRouter.post("/:id/approve", async (req, res): Promise<void> => {
  const parsed = ApproveWithdrawalParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_id" });
    return;
  }

  try {
    const [withdrawal] = await db
      .select()
      .from(withdrawalsTable)
      .where(eq(withdrawalsTable.id, parsed.data.id));

    if (!withdrawal) {
      res.status(404).json({ ok: false, error: "withdrawal_not_found" });
      return;
    }

    if (withdrawal.status !== "pending") {
      res.status(400).json({ ok: false, error: "already_processed" });
      return;
    }

    await db
      .update(withdrawalsTable)
      .set({ status: "approved", processed_at: new Date() })
      .where(eq(withdrawalsTable.id, parsed.data.id));

    res.json({ ok: true, message: "Withdrawal approved" });
  } catch (err) {
    req.log.error({ err }, "Failed to approve withdrawal");
    res.status(500).json({ ok: false, error: "approve_failed" });
  }
});

withdrawalsRouter.post("/:id/reject", async (req, res): Promise<void> => {
  const paramsParsed = RejectWithdrawalParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = RejectWithdrawalBody.safeParse(req.body);

  if (!paramsParsed.success) {
    res.status(400).json({ ok: false, error: "invalid_id" });
    return;
  }

  const reason = bodyParsed.success ? bodyParsed.data.reason : undefined;

  try {
    const [withdrawal] = await db
      .select()
      .from(withdrawalsTable)
      .where(eq(withdrawalsTable.id, paramsParsed.data.id));

    if (!withdrawal) {
      res.status(404).json({ ok: false, error: "withdrawal_not_found" });
      return;
    }

    if (withdrawal.status !== "pending") {
      res.status(400).json({ ok: false, error: "already_processed" });
      return;
    }

    await db
      .update(withdrawalsTable)
      .set({ status: "rejected", reason: reason ?? null, processed_at: new Date() })
      .where(eq(withdrawalsTable.id, paramsParsed.data.id));

    res.json({ ok: true, message: "Withdrawal rejected" });
  } catch (err) {
    req.log.error({ err }, "Failed to reject withdrawal");
    res.status(500).json({ ok: false, error: "reject_failed" });
  }
});
