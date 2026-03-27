import { useLocation } from "wouter";
import { ShieldAlert } from "lucide-react";

export function AccessDenied() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason");

  const handleSignOut = () => {
    localStorage.removeItem("slh_token");
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-destructive/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-destructive/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md animate-slide-in relative z-10 text-center">
        <div className="glass-strong rounded-2xl p-10 shadow-2xl border border-destructive/30">
          <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-6 border border-destructive/30">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-3">Access Denied</h1>

          <p className="text-muted-foreground mb-8">
            {reason === "deactivated"
              ? "Your account has been deactivated. Please contact your administrator."
              : "You don't have permission to access Spark Lead Hub. Contact your administrator for access."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 text-sm font-medium transition-colors"
            >
              Request Access
            </a>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg border border-border hover:bg-muted/50 text-sm font-medium transition-colors text-muted-foreground"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
