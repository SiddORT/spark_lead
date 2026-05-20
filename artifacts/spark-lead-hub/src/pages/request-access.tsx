import { useState } from "react";
import { Zap, CheckCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function RequestAccess() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [form, setForm] = useState({ name: "", email: "", department: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);

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

  const fieldFocus = (name: string) => () => setFocusedField(name);
  const fieldBlur = () => setFocusedField(null);

  const inputStyle = (name: string): React.CSSProperties => {
    const focused = focusedField === name;
    if (isLight) {
      return {
        width: "100%",
        height: 52,
        padding: "0 16px",
        background: focused ? "#ffffff" : "#f8fbff",
        border: `1.5px solid ${focused ? "#0ea5e9" : "#cfe0f2"}`,
        borderRadius: 14,
        color: "#0f172a",
        fontSize: 15,
        fontWeight: 500,
        outline: "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
        boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 4px rgba(14, 165, 233, 0.12)" : "none",
        fontFamily: "var(--font-sans)",
      };
    }
    return {
      width: "100%",
      height: 52,
      padding: "0 16px",
      background: focused ? "hsl(222 22% 12% / 0.9)" : "hsl(222 22% 10% / 0.8)",
      border: `1.5px solid ${focused ? "var(--teal)" : "hsl(222 16% 22%)"}`,
      borderRadius: 14,
      color: "var(--text-primary)",
      fontSize: 15,
      fontWeight: 500,
      outline: "none",
      transition: "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
      boxSizing: "border-box",
      boxShadow: focused ? "0 0 0 3px hsl(196 100% 46% / 0.14), 0 0 10px hsl(196 100% 46% / 0.12)" : "none",
      fontFamily: "var(--font-sans)",
    };
  };

  const textareaStyle = (name: string): React.CSSProperties => ({
    ...inputStyle(name),
    height: "auto",
    minHeight: 140,
    padding: 16,
    borderRadius: 16,
    resize: "none" as const,
    lineHeight: 1.65,
  });

  const cardStyle: React.CSSProperties = isLight ? {
    background: "#ffffff",
    border: "1px solid #dbe7f3",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  } : {
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 32px 64px hsl(222 30% 2% / 0.7), 0 0 0 1px hsl(196 100% 46% / 0.06)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: isLight ? "#64748b" : "var(--text-secondary)",
    marginBottom: 7,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    marginTop: 4,
    background: isLight
      ? (loading ? "rgba(14,165,233,0.6)" : btnActive ? "linear-gradient(135deg, #0284c7, #0173ae)" : "linear-gradient(135deg, #0ea5e9, #0284c7)")
      : "var(--teal)",
    color: isLight ? "#ffffff" : "hsl(222 22% 6%)",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    transform: btnActive ? "scale(0.98)" : "scale(1)",
    boxShadow: isLight
      ? (btnHover && !loading ? "0 6px 20px rgba(14, 165, 233, 0.40)" : "0 2px 10px rgba(14, 165, 233, 0.22)")
      : (btnHover && !loading ? "0 0 20px hsl(196 100% 46% / 0.35)" : "none"),
    transition: "transform 120ms ease, box-shadow 180ms ease, opacity 150ms ease, background 150ms ease",
  };

  const dividerStyle: React.CSSProperties = {
    marginTop: 24,
    paddingTop: 20,
    borderTop: `1px solid ${isLight ? "#dbe7f3" : "rgba(255,255,255,0.07)"}`,
    textAlign: "center",
    fontSize: 14,
    color: isLight ? "#64748b" : "var(--text-muted)",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: isLight
        ? "linear-gradient(135deg, #eef5fb 0%, #f4f7fb 50%, #eaf2fb 100%)"
        : "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-5)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: 600, height: 600,
          background: `radial-gradient(ellipse at center, hsl(196 100% 46% / ${isLight ? "0.06" : "0.10"}) 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: 360, height: 360,
          background: `radial-gradient(ellipse at center, hsl(196 100% 46% / ${isLight ? "0.05" : "0.09"}) 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", right: "-80px",
          width: 360, height: 360,
          background: `radial-gradient(ellipse at center, hsl(258 89% 66% / ${isLight ? "0.05" : "0.09"}) 0%, transparent 70%)`,
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1, animation: "authFadeIn 0.4s ease both" }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52,
            background: isLight ? "rgba(14, 165, 233, 0.10)" : "hsl(196 100% 46% / 0.12)",
            border: `1px solid ${isLight ? "rgba(14, 165, 233, 0.25)" : "hsl(196 100% 46% / 0.3)"}`,
            borderRadius: "var(--radius-lg)",
            marginBottom: 14,
            boxShadow: isLight ? "0 4px 16px rgba(14, 165, 233, 0.12)" : "0 0 20px hsl(196 100% 46% / 0.18)",
          }}>
            <Zap size={22} style={{ color: "var(--teal)" }} />
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            color: isLight ? "#0f172a" : "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}>
            Request Access
          </div>
          <div style={{ fontSize: 14, color: isLight ? "#64748b" : "var(--text-secondary)" }}>
            Submit your details for team whitelisting.
          </div>
        </div>

        {submitted ? (
          <div style={{ ...cardStyle, textAlign: "center", animation: "authFadeIn 0.3s ease both" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 72, height: 72,
              background: isLight ? "rgba(14, 165, 233, 0.08)" : "hsl(196 100% 46% / 0.1)",
              borderRadius: "50%",
              margin: "0 auto 20px",
              boxShadow: isLight ? "0 4px 20px rgba(14, 165, 233, 0.15)" : "0 0 32px hsl(196 100% 46% / 0.3)",
            }}>
              <CheckCircle size={36} style={{ color: "var(--teal)" }} />
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: isLight ? "#0f172a" : "var(--text-primary)",
              marginBottom: 12,
            }}>
              Request Received
            </div>
            <div style={{
              fontSize: 14,
              color: isLight ? "#64748b" : "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: 340,
              margin: "0 auto 28px",
            }}>
              Our admin team will review your application and notify you via email once your access has been approved.
            </div>
            <a
              href="/auth"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                height: 48, padding: "0 28px",
                background: isLight ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "var(--teal)",
                color: isLight ? "#ffffff" : "hsl(222 22% 6%)",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: isLight ? "0 2px 10px rgba(14,165,233,0.25)" : "none",
                transition: "filter 150ms ease, box-shadow 150ms ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = "brightness(1.08)";
                e.currentTarget.style.boxShadow = isLight
                  ? "0 6px 20px rgba(14,165,233,0.40)"
                  : "0 0 20px hsl(196 100% 46% / 0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = isLight ? "0 2px 10px rgba(14,165,233,0.25)" : "none";
              }}
            >
              Back to Login
            </a>
          </div>
        ) : (
          <div style={cardStyle}>
            {error && (
              <div style={{
                marginBottom: 20, padding: "10px 14px",
                borderRadius: 12,
                background: isLight ? "rgba(239, 68, 68, 0.06)" : "hsl(0 75% 50% / 0.1)",
                border: `1px solid ${isLight ? "rgba(239, 68, 68, 0.20)" : "hsl(0 75% 50% / 0.3)"}`,
                color: "var(--danger)", fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Doe"
                    style={inputStyle("name")}
                    onFocus={fieldFocus("name")}
                    onBlur={fieldBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Work Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    style={inputStyle("email")}
                    onFocus={fieldFocus("email")}
                    onBlur={fieldBlur}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Department</label>
                <input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Sales, Marketing, etc."
                  style={inputStyle("department")}
                  onFocus={fieldFocus("department")}
                  onBlur={fieldBlur}
                />
              </div>

              <div>
                <label style={labelStyle}>Reason for Access</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Briefly describe why you need access to Spark Lead Hub…"
                  rows={4}
                  style={textareaStyle("reason")}
                  onFocus={fieldFocus("reason")}
                  onBlur={fieldBlur}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => { setBtnHover(false); setBtnActive(false); }}
                onMouseDown={() => setBtnActive(true)}
                onMouseUp={() => setBtnActive(false)}
                style={btnStyle}
              >
                {loading ? "Submitting…" : "Submit Access Request"}
              </button>
            </form>

            <div style={dividerStyle}>
              Already have access?{" "}
              <a
                href="/auth"
                style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 600, transition: "opacity 150ms ease" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
