import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated, getToken } from "@/lib/auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import TransfersPage from "@/pages/TransfersPage";
import WithdrawalsPage from "@/pages/WithdrawalsPage";
import TradesPage from "@/pages/TradesPage";
import SettingsPage from "@/pages/SettingsPage";

// Configure the API client to always send the stored JWT
setAuthTokenGetter(() => getToken());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number };
        if (err?.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  void location;
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  if (isAuthenticated()) {
    return <Redirect to="/" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={LoginPage} />} />
      <Route path="/" component={() => <PrivateRoute component={DashboardPage} />} />
      <Route path="/users" component={() => <PrivateRoute component={UsersPage} />} />
      <Route path="/transfers" component={() => <PrivateRoute component={TransfersPage} />} />
      <Route path="/withdrawals" component={() => <PrivateRoute component={WithdrawalsPage} />} />
      <Route path="/trades" component={() => <PrivateRoute component={TradesPage} />} />
      <Route path="/settings" component={() => <PrivateRoute component={SettingsPage} />} />
      <Route>
        {() => <Redirect to="/" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
