import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { TrendingUp, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.ok && data.token) {
          setToken(data.token);
          navigate("/");
        } else {
          setError("Login failed. Please try again.");
        }
      },
      onError: () => {
        setError("Invalid password. Please try again.");
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Password is required.");
      return;
    }
    login.mutate({ data: { password } });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
            <TrendingUp className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">QL Trading AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Control Center</p>
        </div>

        {/* Login card */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-lg">
          <div className="mb-5">
            <h2 className="text-sm font-medium text-foreground">Sign in to continue</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Enter your admin credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-9 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                  autoComplete="current-password"
                  data-testid="input-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="text-error">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="button-submit"
            >
              {login.isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          QL Trading AI Admin Panel v3.0
        </p>
      </div>
    </div>
  );
}
