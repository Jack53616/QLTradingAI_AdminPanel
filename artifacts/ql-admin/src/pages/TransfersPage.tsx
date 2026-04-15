import { useState } from "react";
import { useListTransfers, useApproveTransfer, useRejectTransfer, getListTransfersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";
import { CheckCircle, XCircle } from "lucide-react";

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "">("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useListTransfers(
    { status: statusFilter || undefined, limit: 100 },
    { query: { queryKey: getListTransfersQueryKey({ status: statusFilter || undefined }) } }
  );

  const approve = useApproveTransfer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransfersQueryKey() });
      },
    },
  });

  const reject = useRejectTransfer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransfersQueryKey() });
        setRejectingId(null);
        setRejectReason("");
      },
    },
  });

  const pendingCount = data?.transfers?.filter((t) => t.status === "pending").length ?? 0;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-foreground">Transfers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount > 0 ? (
              <span className="text-amber-400">{pendingCount} pending approval</span>
            ) : (
              `${data?.total ?? 0} total transfers`
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">From</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">To</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Requested</th>
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
                ) : !data?.transfers?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No transfers found</td>
                  </tr>
                ) : (
                  data.transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-transfer-${transfer.id}`}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground">#{transfer.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-foreground">{transfer.from_user_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">ID: {transfer.from_user_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-foreground">{transfer.to_user_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">ID: {transfer.to_user_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono font-semibold text-primary" data-testid={`text-amount-${transfer.id}`}>{formatMoney(transfer.amount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={transfer.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{formatDate(transfer.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {transfer.status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approve.mutate({ id: transfer.id })}
                              disabled={approve.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                              data-testid={`button-approve-${transfer.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(transfer.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                              data-testid={`button-reject-${transfer.id}`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                        {transfer.status !== "pending" && (
                          <span className="text-xs text-muted-foreground">{formatDate(transfer.processed_at)}</span>
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
              <h3 className="text-sm font-semibold text-foreground mb-3">Reject Transfer #{rejectingId}</h3>
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
