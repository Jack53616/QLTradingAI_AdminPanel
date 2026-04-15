import { Router } from "express";
import { db, transfersTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";
import {
  ListTransfersQueryParams,
  ApproveTransferParams,
  RejectTransferParams,
  RejectTransferBody,
} from "@workspace/api-zod";

export const transfersRouter = Router();
transfersRouter.use(requireAdmin);

const fromUser = db
  .select({ id: usersTable.id, name: usersTable.name })
  .from(usersTable)
  .as("from_user");

const toUser = db
  .select({ id: usersTable.id, name: usersTable.name })
  .from(usersTable)
  .as("to_user");

transfersRouter.get("/", async (req, res): Promise<void> => {
  const parsed = ListTransfersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_params" });
    return;
  }

  const { status, limit = 50 } = parsed.data;

  try {
    const transfers = await db
      .select({
        id: transfersTable.id,
        from_user_id: transfersTable.from_user_id,
        to_user_id: transfersTable.to_user_id,
        amount: transfersTable.amount,
        status: transfersTable.status,
        reason: transfersTable.reason,
        created_at: transfersTable.created_at,
        processed_at: transfersTable.processed_at,
        from_user_name: fromUser.name,
        to_user_name: toUser.name,
      })
      .from(transfersTable)
      .leftJoin(fromUser, eq(transfersTable.from_user_id, fromUser.id))
      .leftJoin(toUser, eq(transfersTable.to_user_id, toUser.id))
      .where(status ? eq(transfersTable.status, status) : undefined)
      .orderBy(sql`${transfersTable.created_at} DESC`)
      .limit(limit);

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(transfersTable);
    const total = totalResult?.count ?? 0;

    res.json({
      ok: true,
      transfers: transfers.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list transfers");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});

transfersRouter.post("/:id/approve", async (req, res): Promise<void> => {
  const parsed = ApproveTransferParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_id" });
    return;
  }

  try {
    const [transfer] = await db
      .select()
      .from(transfersTable)
      .where(eq(transfersTable.id, parsed.data.id));

    if (!transfer) {
      res.status(404).json({ ok: false, error: "transfer_not_found" });
      return;
    }

    if (transfer.status !== "pending") {
      res.status(400).json({ ok: false, error: "already_processed" });
      return;
    }

    const amount = Number(transfer.amount);

    const [fromUser2] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, transfer.from_user_id));

    if (!fromUser2 || Number(fromUser2.balance) < amount) {
      res.status(400).json({ ok: false, error: "insufficient_balance" });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({
          balance: sql`${usersTable.balance} - ${amount}`,
          updated_at: new Date(),
        })
        .where(eq(usersTable.id, transfer.from_user_id));

      await tx
        .update(usersTable)
        .set({
          balance: sql`${usersTable.balance} + ${amount}`,
          updated_at: new Date(),
        })
        .where(eq(usersTable.id, transfer.to_user_id));

      await tx
        .update(transfersTable)
        .set({ status: "approved", processed_at: new Date() })
        .where(eq(transfersTable.id, parsed.data.id));
    });

    res.json({ ok: true, message: "Transfer approved" });
  } catch (err) {
    req.log.error({ err }, "Failed to approve transfer");
    res.status(500).json({ ok: false, error: "approve_failed" });
  }
});

transfersRouter.post("/:id/reject", async (req, res): Promise<void> => {
  const paramsParsed = RejectTransferParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = RejectTransferBody.safeParse(req.body);

  if (!paramsParsed.success) {
    res.status(400).json({ ok: false, error: "invalid_id" });
    return;
  }

  const reason = bodyParsed.success ? bodyParsed.data.reason : undefined;

  try {
    const [transfer] = await db
      .select()
      .from(transfersTable)
      .where(eq(transfersTable.id, paramsParsed.data.id));

    if (!transfer) {
      res.status(404).json({ ok: false, error: "transfer_not_found" });
      return;
    }

    if (transfer.status !== "pending") {
      res.status(400).json({ ok: false, error: "already_processed" });
      return;
    }

    await db
      .update(transfersTable)
      .set({ status: "rejected", reason: reason ?? null, processed_at: new Date() })
      .where(eq(transfersTable.id, paramsParsed.data.id));

    res.json({ ok: true, message: "Transfer rejected" });
  } catch (err) {
    req.log.error({ err }, "Failed to reject transfer");
    res.status(500).json({ ok: false, error: "reject_failed" });
  }
});
