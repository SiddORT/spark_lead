import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="glass-strong rounded-2xl p-10 text-center max-w-md w-full border border-border shadow-2xl animate-slide-in">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" style={{ filter: "drop-shadow(0 0 10px hsl(var(--destructive)))" }} />
        <h1 className="text-4xl font-display font-bold text-foreground mb-3">404</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/" className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
