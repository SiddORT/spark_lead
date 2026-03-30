import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { Zap, Eye, EyeOff } from "lucide-react";

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  background: "hsl(222 22% 10% / 0.8)",
  border: "1px solid hsl(222 16% 22%)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "var(--text-sm)",
  outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
  boxSizing: "border-box",
};

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputBase,
        ...(focused ? {
          borderColor: "var(--teal)",
          boxShadow: "0 0 0 3px hsl(172 75% 48% / 0.14), 0 0 10px hsl(172 75% 48% / 0.12)",
          background: "hsl(222 22% 12% / 0.9)",
        } : {}),
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: "block",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    marginBottom: 6,
  }}>
    {children}
  </label>
);

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token, setToken, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);
  const [eyeHover, setEyeHover] = useState(false);

  useEffect(() => {
    if (!authLoading && token) setLocation("/");
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
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--teal)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

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
      {/* Background glow orbs */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
      }}>
        {/* Teal center-behind-card glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: 600, height: 600,
          background: "radial-gradient(ellipse at center, hsl(172 75% 48% / 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Teal top-left */}
        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: 360, height: 360,
          background: "radial-gradient(ellipse at center, hsl(172 75% 48% / 0.1) 0%, transparent 70%)",
        }} />
        {/* Purple bottom-right */}
        <div style={{
          position: "absolute", bottom: "-80px", right: "-80px",
          width: 360, height: 360,
          background: "radial-gradient(ellipse at center, hsl(258 89% 66% / 0.09) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "authFadeIn 0.4s ease both" }}>
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56, height: 56,
            background: "hsl(172 75% 48% / 0.12)",
            border: "1px solid hsl(172 75% 48% / 0.3)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 16,
            boxShadow: "0 0 24px hsl(172 75% 48% / 0.2)",
          }}>
            <Zap size={26} style={{ color: "var(--teal)" }} />
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            fontWeight: 800,
            color: "var(--teal)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            filter: "drop-shadow(0 0 18px hsl(172 75% 48% / 0.45))",
            marginBottom: 8,
          }}>
            LeadFlow
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Spark Lead Hub — Team Access Only
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "var(--radius-lg)",
          padding: 40,
          boxShadow: "0 32px 64px hsl(222 30% 2% / 0.7), 0 0 0 1px hsl(172 75% 48% / 0.06)",
        }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            textAlign: "center",
            color: "var(--text-primary)",
            marginBottom: 28,
          }}>
            Sign In
          </h2>

          {error && (
            <div style={{
              marginBottom: 20,
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "hsl(0 75% 50% / 0.1)",
              border: "1px solid hsl(0 75% 50% / 0.3)",
              color: "var(--danger)",
              fontSize: "var(--text-sm)",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <AuthInput
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <FieldLabel>Password</FieldLabel>
              <div style={{ position: "relative" }}>
                <AuthInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(v => !v)}
                  onMouseEnter={() => setEyeHover(true)}
                  onMouseLeave={() => setEyeHover(false)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 12,
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: eyeHover ? "var(--teal)" : "var(--text-muted)",
                    transition: "color 150ms ease",
                    lineHeight: 0,
                  }}
                >
                  {showPassword
                    ? <EyeOff size={17} strokeWidth={1.8} />
                    : <Eye size={17} strokeWidth={1.8} />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => { setBtnHover(false); setBtnActive(false); }}
              onMouseDown={() => setBtnActive(true)}
              onMouseUp={() => setBtnActive(false)}
              style={{
                width: "100%",
                height: 44,
                marginTop: 4,
                background: "var(--teal)",
                color: "hsl(222 22% 6%)",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transform: btnActive ? "scale(0.97)" : "scale(1)",
                filter: btnHover && !loading ? "brightness(1.12)" : "none",
                boxShadow: btnHover && !loading ? "0 0 20px hsl(172 75% 48% / 0.35)" : "none",
                transition: "transform 120ms ease, filter 150ms ease, box-shadow 150ms ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 15, height: 15, border: "2px solid hsl(222 22% 6%)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Signing in…
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            textAlign: "center",
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}>
            Don't have access?{" "}
            <a
              href="/request-access"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontWeight: 500, transition: "color 150ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--teal)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Request Access
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
