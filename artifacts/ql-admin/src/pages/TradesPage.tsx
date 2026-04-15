import { useListTrades, getListTradesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";
import { useState } from "react";

export default function TradesPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useListTrades(
    { status: statusFilter || undefined, limit: 100 },
    { query: { queryKey: getListTradesQueryKey({ status: statusFilter || undefined }) } }
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-foreground">Trades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total trades</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {["", "open", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Side</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Entry</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">P&amp;L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Opened</th>
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
                ) : !data?.trades?.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No trades found</td>
                  </tr>
                ) : (
                  data.trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-trade-${trade.id}`}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground">#{trade.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{trade.user_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {trade.user_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-foreground">{trade.symbol}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trade.side} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono text-foreground">{formatMoney(trade.amount)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-mono text-muted-foreground">{trade.entry_price.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {trade.profit != null ? (
                          <span className={`text-sm font-mono font-medium ${trade.profit >= 0 ? "text-emerald-400" : "text-red-400"}`} data-testid={`text-profit-${trade.id}`}>
                            {trade.profit >= 0 ? "+" : ""}{formatMoney(trade.profit)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trade.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{formatDate(trade.opened_at)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
