import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { Zap } from "lucide-react";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token, setToken, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && token) {
      setLocation("/");
    }
  }, [token, authLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "deactivated") {
          setLocation("/access-denied?reason=deactivated");
          return;
        }
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("slh_token", data.token);
      setToken(data.token);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin neon-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[200px] rounded-full" />
      </div>

      <div className="w-full max-w-md animate-slide-in relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 neon-glow">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LeadFlow
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Spark Lead Hub — Team Access Only</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-primary/20">
          <h2 className="text-xl font-display font-semibold mb-6 text-center">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 neon-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have access?{" "}
              <a href="/request-access" className="text-primary hover:underline font-medium">Request Access</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
