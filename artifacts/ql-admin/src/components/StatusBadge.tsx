import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  frozen: { label: "Frozen", className: "bg-amber-500/15 text-amber-400 border border-amber-500/25" },
  banned: { label: "Banned", className: "bg-red-500/15 text-red-400 border border-red-500/25" },
  temp_banned: { label: "Temp Banned", className: "bg-orange-500/15 text-orange-400 border border-orange-500/25" },
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-400 border border-amber-500/25" },
  approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  rejected: { label: "Rejected", className: "bg-red-500/15 text-red-400 border border-red-500/25" },
  open: { label: "Open", className: "bg-blue-500/15 text-blue-400 border border-blue-500/25" },
  closed: { label: "Closed", className: "bg-slate-500/15 text-slate-400 border border-slate-500/25" },
  buy: { label: "Buy", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  sell: { label: "Sell", className: "bg-red-500/15 text-red-400 border border-red-500/25" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-slate-500/15 text-slate-400 border border-slate-500/25" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide",
        config.className,
        className
      )}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </span>
  );
}
