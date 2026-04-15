import { Router } from "express";
import { db, usersTable, tradesTable, withdrawalsTable, transfersTable } from "@workspace/db";
import { sql, eq, count, sum } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

export const dashboardRouter = Router();
dashboardRouter.use(requireAdmin);

dashboardRouter.get("/stats", async (req, res): Promise<void> => {
  try {
    const [userStats] = await db
      .select({
        totalUsers: count(usersTable.id),
        totalBalance: sum(usersTable.balance),
      })
      .from(usersTable);

    const [activeUsers] = await db
      .select({ count: count(usersTable.id) })
      .from(usersTable)
      .where(eq(usersTable.status, "active"));

    const [bannedUsers] = await db
      .select({ count: count(usersTable.id) })
      .from(usersTable)
      .where(eq(usersTable.status, "banned"));

    const [pendingWithdrawals] = await db
      .select({
        count: count(withdrawalsTable.id),
        total: sum(withdrawalsTable.amount),
      })
      .from(withdrawalsTable)
      .where(eq(withdrawalsTable.status, "pending"));

    const [pendingTransfers] = await db
      .select({ count: count(transfersTable.id) })
      .from(transfersTable)
      .where(eq(transfersTable.status, "pending"));

    const [openTrades] = await db
      .select({ count: count(tradesTable.id) })
      .from(tradesTable)
      .where(eq(tradesTable.status, "open"));

    const [totalProfit] = await db
      .select({ total: sum(tradesTable.profit) })
      .from(tradesTable)
      .where(eq(tradesTable.status, "closed"));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayReg] = await db
      .select({ count: count(usersTable.id) })
      .from(usersTable)
      .where(sql`${usersTable.created_at} >= ${todayStart}`);

    res.json({
      ok: true,
      totalUsers: Number(userStats?.totalUsers ?? 0),
      activeUsers: Number(activeUsers?.count ?? 0),
      bannedUsers: Number(bannedUsers?.count ?? 0),
      totalBalance: Number(userStats?.totalBalance ?? 0),
      pendingWithdrawals: Number(pendingWithdrawals?.count ?? 0),
      pendingWithdrawalsAmount: Number(pendingWithdrawals?.total ?? 0),
      pendingTransfers: Number(pendingTransfers?.count ?? 0),
      openTrades: Number(openTrades?.count ?? 0),
      totalProfit: Number(totalProfit?.total ?? 0),
      todayRegistrations: Number(todayReg?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});

dashboardRouter.get("/recent-activity", async (req, res): Promise<void> => {
  try {
    const activities: Array<{
      id: string;
      type: string;
      description: string;
      user_name: string | null;
      amount: number | null;
      status: string | null;
      created_at: string;
    }> = [];

    const recentWithdrawals = await db
      .select({
        id: withdrawalsTable.id,
        user_id: withdrawalsTable.user_id,
        amount: withdrawalsTable.amount,
        status: withdrawalsTable.status,
        created_at: withdrawalsTable.created_at,
        name: usersTable.name,
      })
      .from(withdrawalsTable)
      .leftJoin(usersTable, eq(withdrawalsTable.user_id, usersTable.id))
      .orderBy(sql`${withdrawalsTable.created_at} DESC`)
      .limit(10);

    recentWithdrawals.forEach((w) => {
      activities.push({
        id: `wd-${w.id}`,
        type: "withdrawal",
        description: `Withdrawal request for $${Number(w.amount).toFixed(2)}`,
        user_name: w.name,
        amount: Number(w.amount),
        status: w.status,
        created_at: w.created_at.toISOString(),
      });
    });

    const recentTransfers = await db
      .select({
        id: transfersTable.id,
        from_user_id: transfersTable.from_user_id,
        amount: transfersTable.amount,
        status: transfersTable.status,
        created_at: transfersTable.created_at,
        name: usersTable.name,
      })
      .from(transfersTable)
      .leftJoin(usersTable, eq(transfersTable.from_user_id, usersTable.id))
      .orderBy(sql`${transfersTable.created_at} DESC`)
      .limit(10);

    recentTransfers.forEach((t) => {
      activities.push({
        id: `tr-${t.id}`,
        type: "transfer",
        description: `Transfer request of $${Number(t.amount).toFixed(2)}`,
        user_name: t.name,
        amount: Number(t.amount),
        status: t.status,
        created_at: t.created_at.toISOString(),
      });
    });

    const recentUsers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .orderBy(sql`${usersTable.created_at} DESC`)
      .limit(5);

    recentUsers.forEach((u) => {
      activities.push({
        id: `usr-${u.id}`,
        type: "user_registered",
        description: `New user registered`,
        user_name: u.name,
        amount: null,
        status: null,
        created_at: u.created_at.toISOString(),
      });
    });

    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ ok: true, activities: activities.slice(0, 20) });
  } catch (err) {
    req.log.error({ err }, "Failed to get recent activity");
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});
