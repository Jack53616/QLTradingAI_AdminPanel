import { useState } from "react";
import { useListWithdrawals, useApproveWithdrawal, useRejectWithdrawal, getListWithdrawalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

export default function WithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "">("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useListWithdrawals(
    { status: statusFilter || undefined, limit: 100 },
    { query: { queryKey: getListWithdrawalsQueryKey({ status: statusFilter || undefined }) } }
  );

  const approve = useApproveWithdrawal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      },
    },
  });

  const reject = useRejectWithdrawal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        setRejectingId(null);
        setRejectReason("");
      },
    },
  });

  const pendingCount = data?.withdrawals?.filter((w) => w.status === "pending").length ?? 0;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-foreground">Withdrawals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount > 0 ? (
              <span className="text-amber-400">{pendingCount} pending approval</span>
            ) : (
              `${data?.total ?? 0} total withdrawals`
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {["", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as typeof statusFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
              data-testid={`filter-${s || "all"}`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Fee</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Net Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data?.withdrawals?.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No withdrawals found</td>
                  </tr>
                ) : (
                  data.withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-withdrawal-${w.id}`}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground">#{w.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-foreground">{w.user_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">ID: {w.user_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-xs font-medium text-foreground bg-muted px-2 py-1 rounded">{w.method}</span>
                          {w.address && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[120px]" title={w.address}>{w.address}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono text-foreground" data-testid={`text-amount-${w.id}`}>{formatMoney(w.amount)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono text-red-400" data-testid={`text-fee-${w.id}`}>-{formatMoney(w.fee)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-mono font-semibold text-emerald-400" data-testid={`text-net-${w.id}`}>{formatMoney(w.net_amount)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{formatDate(w.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {w.status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approve.mutate({ id: w.id })}
                              disabled={approve.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                              data-testid={`button-approve-${w.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(w.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                              data-testid={`button-reject-${w.id}`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                        {w.status !== "pending" && (
                          <div className="text-right">
                            {w.reason && <p className="text-xs text-muted-foreground truncate max-w-[100px]" title={w.reason}>{w.reason}</p>}
                            <span className="text-xs text-muted-foreground">{formatDate(w.processed_at)}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reject Dialog */}
        {rejectingId !== null && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setRejectingId(null)}>
            <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-foreground mb-3">Reject Withdrawal #{rejectingId}</h3>
              <textarea
                placeholder="Reason for rejection (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring h-20 resize-none"
                data-testid="input-reject-reason"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setRejectingId(null)} className="flex-1 py-2 px-3 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted transition-colors" data-testid="button-cancel">Cancel</button>
                <button
                  onClick={() => reject.mutate({ id: rejectingId, data: { reason: rejectReason || undefined } })}
                  disabled={reject.isPending}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-all"
                  data-testid="button-confirm-reject"
                >
                  {reject.isPending ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
