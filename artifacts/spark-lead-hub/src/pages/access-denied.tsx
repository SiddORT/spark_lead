import { useLocation } from "wouter";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function AccessDenied() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason");

  const handleSignOut = () => {
    localStorage.removeItem("slh_token");
    setLocation("/auth");
  };

  const message = reason === "deactivated"
    ? "Your account has been deactivated by an administrator. Please reach out for reinstatement."
    : "Your email address is not whitelisted for Spark Lead Hub. Contact your administrator or request access below.";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-5)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow orbs — danger theme */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "40%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: 560, height: 560,
          background: "radial-gradient(ellipse at center, hsl(0 70% 58% / 0.10) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-100px", left: "-100px",
          width: 400, height: 400,
          background: "radial-gradient(ellipse at center, hsl(0 70% 58% / 0.07) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "-100px", right: "-100px",
          width: 400, height: 400,
          background: "radial-gradient(ellipse at center, hsl(258 89% 66% / 0.07) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{
        width: "100%",
        maxWidth: 460,
        position: "relative",
        zIndex: 1,
        animation: "accessDeniedIn 0.4s ease both",
        textAlign: "center",
      }}>
        {/* Glass card */}
        <div style={{
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid hsl(0 70% 58% / 0.25)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-10)",
          boxShadow: "0 32px 64px hsl(222 30% 2% / 0.7), 0 0 0 1px hsl(0 70% 58% / 0.05)",
        }}>
          {/* Icon */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80, height: 80,
            background: "hsl(0 70% 58% / 0.1)",
            border: "1px solid hsl(0 70% 58% / 0.3)",
            borderRadius: "50%",
            marginBottom: "var(--space-5)",
            boxShadow: "0 0 40px hsl(0 70% 58% / 0.25)",
          }}>
            <ShieldAlert size={38} style={{ color: "var(--danger)" }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "var(--space-3)",
          }}>
            Access Denied
          </h1>

          {/* Reason chip */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "4px 12px",
            background: "hsl(0 70% 58% / 0.1)",
            border: "1px solid hsl(0 70% 58% / 0.25)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--danger)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "var(--space-5)",
          }}>
            {reason === "deactivated" ? "Account Deactivated" : "Not Whitelisted"}
          </div>

          {/* Message */}
          <p style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "var(--space-8)",
            maxWidth: 340,
            margin: "0 auto var(--space-8)",
          }}>
            {message}
          </p>

          {/* Action buttons */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            alignItems: "stretch",
          }}>
            {reason !== "deactivated" && (
              <a
                href="/request-access"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  background: "hsl(0 70% 58% / 0.12)",
                  border: "1px solid hsl(0 70% 58% / 0.35)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--danger)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 150ms ease, box-shadow 150ms ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "hsl(0 70% 58% / 0.18)";
                  e.currentTarget.style.boxShadow = "0 0 16px hsl(0 70% 58% / 0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "hsl(0 70% 58% / 0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Request Access
              </a>
            )}

            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-2)",
                height: 44,
                background: "transparent",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 150ms ease, border-color 150ms ease, background 150ms ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.background = "var(--bg-subtle)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: "var(--space-5)",
          fontSize: "var(--text-xs)",
          color: "var(--text-muted)",
        }}>
          Need help? Contact your system administrator.
        </p>
      </div>

      <style>{`
        @keyframes accessDeniedIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
