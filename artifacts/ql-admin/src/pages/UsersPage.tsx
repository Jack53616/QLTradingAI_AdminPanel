import { useState } from "react";
import { useLocation } from "wouter";
import { useListUsers, useAdjustUserBalance, useUpdateUserStatus, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";
import { Search, Plus, Minus, Ban, CheckCircle, Lock } from "lucide-react";

type AdjustDialogProps = {
  userId: number;
  userName: string;
  onClose: () => void;
};

function AdjustBalanceDialog({ userId, userName, onClose }: AdjustDialogProps) {
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const adjust = useAdjustUserBalance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        onClose();
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    adjust.mutate({ id: userId, data: { amount: amt, operation, note: note || undefined } });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Adjust Balance — {userName}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setOperation("add")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${operation === "add" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "border-border text-muted-foreground hover:border-border"}`} data-testid="button-add">
              <Plus className="w-4 h-4 inline mr-1" />Add
            </button>
            <button type="button" onClick={() => setOperation("subtract")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${operation === "subtract" ? "bg-red-500/15 border-red-500/30 text-red-400" : "border-border text-muted-foreground hover:border-border"}`} data-testid="button-subtract">
              <Minus className="w-4 h-4 inline mr-1" />Subtract
            </button>
          </div>
          <input type="number" step="0.01" min="0.01" placeholder="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" data-testid="input-amount" />
          <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" data-testid="input-note" />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors" data-testid="button-cancel">Cancel</button>
            <button type="submit" disabled={adjust.isPending} className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all" data-testid="button-confirm">
              {adjust.isPending ? "Saving..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type StatusDialogProps = {
  userId: number;
  userName: string;
  currentStatus: string;
  onClose: () => void;
};

function UpdateStatusDialog({ userId, userName, currentStatus, onClose }: StatusDialogProps) {
  const [status, setStatus] = useState(currentStatus);
  const [banDuration, setBanDuration] = useState("1d");
  const queryClient = useQueryClient();
  const updateStatus = useUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        onClose();
      },
    },
  });

  const statuses = [
    { value: "active", label: "Active" },
    { value: "frozen", label: "Frozen" },
    { value: "banned", label: "Permanently Banned" },
    { value: "temp_banned", label: "Temporary Ban" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateStatus.mutate({
      id: userId,
      data: {
        status: status as "active" | "frozen" | "banned" | "temp_banned",
        banDuration: status === "temp_banned" ? banDuration : undefined,
      },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Update Status — {userName}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            {statuses.map((s) => (
              <label key={s.value} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50" style={{ borderColor: status === s.value ? "hsl(var(--primary))" : "" }}>
                <input type="radio" name="status" value={s.value} checked={status === s.value} onChange={() => setStatus(s.value)} className="accent-primary" />
                <span className="text-sm text-foreground">{s.label}</span>
              </label>
            ))}
          </div>
          {status === "temp_banned" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Duration</label>
              <select value={banDuration} onChange={(e) => setBanDuration(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-ban-duration">
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors" data-testid="button-cancel">Cancel</button>
            <button type="submit" disabled={updateStatus.isPending} className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all" data-testid="button-confirm">
              {updateStatus.isPending ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<{ id: number; name: string } | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ id: number; name: string; status: string } | null>(null);

  const { data, isLoading } = useListUsers(
    { search: search || undefined, status: statusFilter || undefined, limit: 100 },
    { query: { queryKey: getListUsersQueryKey({ search, status: statusFilter }) } }
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              data-testid="input-search"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="select-status-filter"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Subscription</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data?.users?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td>
                  </tr>
                ) : (
                  data.users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-user-${user.id}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name ?? "—"}</p>
                          {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground" data-testid={`text-user-id-${user.id}`}>{user.tg_id ?? user.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono font-medium text-foreground" data-testid={`text-balance-${user.id}`}>{formatMoney(Number(user.balance))}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {user.sub_expires ? formatDate(user.sub_expires as unknown as string) : "No subscription"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{formatDate(user.created_at as unknown as string)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            data-testid={`button-view-${user.id}`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => setAdjustTarget({ id: user.id, name: user.name ?? "User" })}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Adjust Balance"
                            data-testid={`button-adjust-${user.id}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStatusTarget({ id: user.id, name: user.name ?? "User", status: user.status })}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Update Status"
                            data-testid={`button-status-${user.id}`}
                          >
                            {user.status === "active" ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                          {user.status === "active" && (
                            <button
                              onClick={() => setStatusTarget({ id: user.id, name: user.name ?? "User", status: user.status })}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Ban User"
                              data-testid={`button-ban-${user.id}`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {adjustTarget && (
          <AdjustBalanceDialog userId={adjustTarget.id} userName={adjustTarget.name} onClose={() => setAdjustTarget(null)} />
        )}
        {statusTarget && (
          <UpdateStatusDialog userId={statusTarget.id} userName={statusTarget.name} currentStatus={statusTarget.status} onClose={() => setStatusTarget(null)} />
        )}
      </div>
    </Layout>
  );
}
