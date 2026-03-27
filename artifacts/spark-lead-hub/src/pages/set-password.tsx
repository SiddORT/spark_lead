import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

export function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(false);
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid token. Please use the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setProgress(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Wait for progress bar animation
      await new Promise((r) => setTimeout(r, 1500));
      setSuccess(true);
      setTimeout(() => setLocation("/auth"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to set password");
      setProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md animate-slide-in relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 neon-glow">
              <Zap className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Set Your Password</h1>
          <p className="text-muted-foreground mt-2 text-sm">Create a secure password to activate your account</p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-primary/20">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-success mx-auto" style={{ filter: "drop-shadow(0 0 12px hsl(var(--success)))" }} />
              <h2 className="text-xl font-display font-bold">Password Set!</h2>
              <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {!token && (
                <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
                  Invalid or missing token. Please use the link from your invitation email.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>

                {/* Progress bar */}
                {progress && (
                  <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full animate-validate-bar" style={{ animationDuration: "1.5s" }} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 neon-glow transition-all disabled:opacity-50"
                >
                  {loading ? "Setting password..." : "Set Password & Activate Account"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
