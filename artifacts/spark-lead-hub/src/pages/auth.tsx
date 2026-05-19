import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { BrandBlock } from "@/components/brand-logo";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token, setToken, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);

  const isLight = theme === "light";

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
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: isLight ? "#f4f6fa" : "hsl(228,16%,6%)" }}>
        <div style={{ width: 36, height: 36, border: `3px solid #00AEEC`, borderTopColor: "transparent", borderRadius: "50%", animation: "sl-spin 0.75s linear infinite" }} />
      </div>
    );
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    height: 50,
    padding: "0 16px",
    background: isLight
      ? focused ? "#ffffff" : "rgba(0,0,0,0.03)"
      : focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
    border: `1.5px solid ${focused
      ? "#00AEEC"
      : isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.10)"}`,
    borderRadius: 12,
    color: isLight ? "#0d0d0d" : "#f0f4f8",
    fontSize: 15,
    outline: "none",
    transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
    boxSizing: "border-box",
    boxShadow: focused ? "0 0 0 4px rgba(0,174,236,0.12)" : "none",
    fontFamily: "var(--font-body)",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: isLight
        ? "linear-gradient(135deg, #eef5fb 0%, #f8fafc 50%, #eef2fb 100%)"
        : "radial-gradient(circle at 50% 0%, rgba(0,174,236,0.12), transparent 40%), #040816",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isLight ? "Switch to dark mode" : "Switch to light mode"}
        style={{
          position: "absolute", top: 20, right: 20, zIndex: 10,
          width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${isLight ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 10,
          color: isLight ? "#555" : "#8899aa",
          cursor: "pointer",
          transition: "all 150ms ease",
        }}
      >
        {isLight ? <Moon size={15} /> : <Sun size={15} />}
      </button>

      {/* Background ambient glow (dark only) */}
      {!isLight && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute",
            top: "30%", left: "50%", transform: "translate(-50%, -50%)",
            width: 700, height: 500,
            background: "radial-gradient(ellipse at center, rgba(0,174,236,0.08) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 400, height: 400,
            background: "radial-gradient(ellipse at bottom right, rgba(0,149,217,0.06) 0%, transparent 65%)",
          }} />
        </div>
      )}

      {/* Main content */}
      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1, animation: "sl-fadein 0.45s cubic-bezier(0.16,1,0.3,1) both" }}>

        {/* Brand block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22, gap: 8, overflow: "visible" }}>
          <BrandBlock layout="vertical" ortHeight={42} nameSize={34} gap={4} />
          <p style={{
            margin: "2px 0 0",
            fontSize: 14,
            fontWeight: 500,
            color: "#7f8da3",
            letterSpacing: "0.2px",
            fontFamily: "var(--font-body)",
          }}>
            SparkLead — Team Access Only
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: isLight
            ? "rgba(255,255,255,0.92)"
            : "rgba(8,14,28,0.92)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${isLight ? "rgba(0,174,236,0.14)" : "rgba(0,174,236,0.16)"}`,
          borderRadius: 24,
          padding: "42px",
          boxShadow: isLight
            ? "0 20px 60px rgba(0,0,0,0.10)"
            : "0 20px 60px rgba(0,0,0,0.45), 0 0 40px rgba(0,174,236,0.08)",
        }}>
          <h1 style={{
            margin: "0 0 28px",
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            textAlign: "center",
            color: isLight ? "#0d0d0d" : "#f0f4f8",
            letterSpacing: "-0.02em",
          }}>
            Welcome back
          </h1>

          {error && (
            <div style={{
              marginBottom: 20,
              padding: "11px 16px",
              borderRadius: 10,
              background: "rgba(220,50,50,0.08)",
              border: "1px solid rgba(220,50,50,0.22)",
              color: "hsl(0,70%,58%)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{
                display: "block", marginBottom: 7,
                fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.38)",
                fontFamily: "var(--font-body)",
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={inputStyle(emailFocused)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </div>

            <div>
              <label style={{
                display: "block", marginBottom: 7,
                fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.38)",
                fontFamily: "var(--font-body)",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle(passFocused), paddingRight: 48 }}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: "absolute", top: "50%", right: 14,
                    transform: "translateY(-50%)",
                    background: "none", border: "none", padding: 4,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)",
                    transition: "color 150ms ease",
                    lineHeight: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#00AEEC")}
                  onMouseLeave={e => (e.currentTarget.style.color = isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)")}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
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
                width: "100%", height: 50,
                marginTop: 6,
                background: "linear-gradient(135deg, #00AEEC 0%, #0095D9 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transform: btnActive ? "scale(0.98)" : "scale(1)",
                boxShadow: btnHover && !loading
                  ? "0 6px 24px rgba(0,174,236,0.40), 0 2px 8px rgba(0,149,217,0.30)"
                  : "0 2px 10px rgba(0,174,236,0.20)",
                transition: "transform 120ms ease, box-shadow 180ms ease, opacity 150ms ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                letterSpacing: "-0.01em",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", animation: "sl-spin 0.7s linear infinite" }} />
                  Signing in…
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div style={{
            marginTop: 28, paddingTop: 22,
            borderTop: `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)"}`,
            textAlign: "center",
            fontSize: 14,
            color: isLight ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.32)",
            fontFamily: "var(--font-body)",
          }}>
            Don't have access?{" "}
            <a
              href="/request-access"
              style={{ color: "#00AEEC", textDecoration: "none", fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              Request Access
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sl-fadein {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sl-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
