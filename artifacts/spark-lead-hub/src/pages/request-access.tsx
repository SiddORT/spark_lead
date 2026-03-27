import { useState } from "react";
import { Zap, CheckCircle } from "lucide-react";

export function RequestAccess() {
  const [form, setForm] = useState({ name: "", email: "", department: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError("An access request with this email has already been submitted. Please check with your administrator.");
        } else {
          throw new Error(data.message);
        }
        return;
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-lg animate-slide-in relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 neon-glow">
              <Zap className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Request Access</h1>
          <p className="text-muted-foreground mt-2 text-sm">Submit your request to join Spark Lead Hub</p>
        </div>

        {submitted ? (
          <div className="glass-strong rounded-2xl p-8 text-center border border-success/30 shadow-2xl">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" style={{ filter: "drop-shadow(0 0 10px hsl(var(--success)))" }} />
            <h2 className="text-2xl font-display font-bold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your access request has been received. An administrator will review it and you'll receive an email with setup instructions.
            </p>
            <a href="/auth" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
              ← Back to Login
            </a>
          </div>
        ) : (
          <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-primary/20">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Doe"
                    className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Department</label>
                <input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Sales, Marketing, etc."
                  className="flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Reason for Access</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Briefly describe why you need access..."
                  rows={3}
                  className="flex w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 neon-glow transition-all disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Access Request"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <a href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
