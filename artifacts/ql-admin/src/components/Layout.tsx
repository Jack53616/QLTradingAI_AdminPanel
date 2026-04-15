import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Download,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useGetDashboardStats } from "@workspace/api-client-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/users", icon: Users, label: "Users" },
  { href: "/transfers", icon: ArrowLeftRight, label: "Transfers" },
  { href: "/withdrawals", icon: Download, label: "Withdrawals" },
  { href: "/trades", icon: TrendingUp, label: "Trades" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const { data: stats } = useGetDashboardStats();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r border-sidebar-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">QL Trading AI</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              const pendingCount =
                item.href === "/transfers"
                  ? (stats?.pendingTransfers ?? 0)
                  : item.href === "/withdrawals"
                    ? (stats?.pendingWithdrawals ?? 0)
                    : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    "group relative",
                    isActive
                      ? "bg-sidebar-accent text-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="flex-1">{item.label}</span>
                  {pendingCount > 0 && (
                    <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {pendingCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-primary" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
