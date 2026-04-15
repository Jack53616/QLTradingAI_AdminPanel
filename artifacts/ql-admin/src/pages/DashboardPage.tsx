import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { formatMoney, timeAgo } from "@/lib/format";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Users,
  TrendingUp,
  Download,
  ArrowLeftRight,
  DollarSign,
  UserCheck,
  UserX,
  Activity,
  AlertTriangle,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-xl p-5 ${alert ? "border-amber-500/40" : "border-card-border"}`}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${accent ? "bg-primary/15" : alert ? "bg-amber-500/10" : "bg-muted"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-primary" : alert ? "text-amber-400" : "text-muted-foreground"}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className={`text-xs mt-0.5 font-medium ${alert ? "text-amber-400" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <Layout>
      <div className="p-6 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform overview and pending actions</p>
        </div>

        {/* Alerts */}
        {!statsLoading && ((stats?.pendingWithdrawals ?? 0) > 0 || (stats?.pendingTransfers ?? 0) > 0) && (
          <div className="mb-5 flex flex-wrap gap-3">
            {(stats?.pendingWithdrawals ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg" data-testid="alert-pending-withdrawals">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">
                  {stats?.pendingWithdrawals} withdrawal{stats?.pendingWithdrawals !== 1 ? "s" : ""} pending — {formatMoney(stats?.pendingWithdrawalsAmount)}
                </span>
              </div>
            )}
            {(stats?.pendingTransfers ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg" data-testid="alert-pending-transfers">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">
                  {stats?.pendingTransfers} transfer{stats?.pendingTransfers !== 1 ? "s" : ""} awaiting approval
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {statsLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg mb-3" />
                <div className="h-7 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : (
            <>
              <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} sub={`+${stats?.todayRegistrations ?? 0} today`} />
              <StatCard icon={UserCheck} label="Active Users" value={stats?.activeUsers ?? 0} accent />
              <StatCard icon={UserX} label="Banned Users" value={stats?.bannedUsers ?? 0} />
              <StatCard icon={DollarSign} label="Platform Balance" value={formatMoney(stats?.totalBalance)} accent />
              <StatCard icon={TrendingUp} label="Total Profit" value={formatMoney(stats?.totalProfit)} />
              <StatCard icon={Activity} label="Open Trades" value={stats?.openTrades ?? 0} />
              <StatCard
                icon={Download}
                label="Pending Withdrawals"
                value={stats?.pendingWithdrawals ?? 0}
                sub={formatMoney(stats?.pendingWithdrawalsAmount)}
                alert={(stats?.pendingWithdrawals ?? 0) > 0}
              />
              <StatCard
                icon={ArrowLeftRight}
                label="Pending Transfers"
                value={stats?.pendingTransfers ?? 0}
                alert={(stats?.pendingTransfers ?? 0) > 0}
              />
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-card-border rounded-xl">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {activityLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-muted rounded w-1/2 mb-1.5" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : !activity?.activities?.length ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No recent activity</div>
            ) : (
              activity.activities.map((item) => {
                const icon =
                  item.type === "withdrawal" ? Download :
                  item.type === "transfer" ? ArrowLeftRight :
                  Users;
                const Icon = icon;

                return (
                  <div key={item.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors" data-testid={`activity-${item.id}`}>
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.description}</p>
                      {item.user_name && (
                        <p className="text-xs text-muted-foreground">{item.user_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.amount != null && (
                        <span className="text-sm font-mono font-medium text-foreground">{formatMoney(item.amount)}</span>
                      )}
                      {item.status && <StatusBadge status={item.status} />}
                      <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
