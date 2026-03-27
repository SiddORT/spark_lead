import { useState } from "react";
import { Zap, CheckCircle } from "lucide-react";

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

const textareaBase: React.CSSProperties = {
  ...inputBase,
  height: "auto",
  padding: "12px 14px",
  resize: "none",
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
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function AuthTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...textareaBase,
        ...(focused ? {
          borderColor: "var(--teal)",
          boxShadow: "0 0 0 3px hsl(172 75% 48% / 0.14), 0 0 10px hsl(172 75% 48% / 0.12)",
          background: "hsl(222 22% 12% / 0.9)",
        } : {}),
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

const glassCard: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.65)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "var(--radius-lg)",
  padding: 40,
  boxShadow: "0 32px 64px hsl(222 30% 2% / 0.7), 0 0 0 1px hsl(172 75% 48% / 0.06)",
};

export function RequestAccess() {
  const [form, setForm] = useState({ name: "", email: "", department: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: 600, height: 600,
          background: "radial-gradient(ellipse at center, hsl(172 75% 48% / 0.10) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: 360, height: 360,
          background: "radial-gradient(ellipse at center, hsl(172 75% 48% / 0.09) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", right: "-80px",
          width: 360, height: 360,
          background: "radial-gradient(ellipse at center, hsl(258 89% 66% / 0.09) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1, animation: "authFadeIn 0.4s ease both" }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52,
            background: "hsl(172 75% 48% / 0.12)",
            border: "1px solid hsl(172 75% 48% / 0.3)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 14,
            boxShadow: "0 0 20px hsl(172 75% 48% / 0.18)",
          }}>
            <Zap size={22} style={{ color: "var(--teal)" }} />
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}>
            Request Access
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            Submit your details for team whitelisting.
          </div>
        </div>

        {submitted ? (
          // Success state
          <div style={{ ...glassCard, textAlign: "center", animation: "authFadeIn 0.3s ease both" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 72, height: 72,
              background: "hsl(172 75% 48% / 0.1)",
              borderRadius: "50%",
              margin: "0 auto 20px",
              boxShadow: "0 0 32px hsl(172 75% 48% / 0.3)",
            }}>
              <CheckCircle size={36} style={{ color: "var(--teal)" }} />
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}>
              Request Received
            </div>
            <div style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 28,
              maxWidth: 340,
              margin: "0 auto 28px",
            }}>
              Our admin team will review your application and notify you via email once your access has been approved.
            </div>
            <a
              href="/auth"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                height: 44, padding: "0 28px",
                background: "var(--teal)",
                color: "hsl(222 22% 6%)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                textDecoration: "none",
                transition: "filter 150ms ease, box-shadow 150ms ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = "brightness(1.12)";
                e.currentTarget.style.boxShadow = "0 0 20px hsl(172 75% 48% / 0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Back to Login
            </a>
          </div>
        ) : (
          // Form
          <div style={glassCard}>
            {error && (
              <div style={{
                marginBottom: 20, padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "hsl(0 75% 50% / 0.1)",
                border: "1px solid hsl(0 75% 50% / 0.3)",
                color: "var(--danger)", fontSize: "var(--text-sm)",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <FieldLabel>Full Name *</FieldLabel>
                  <AuthInput
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <FieldLabel>Work Email *</FieldLabel>
                  <AuthInput
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Department</FieldLabel>
                <AuthInput
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Sales, Marketing, etc."
                />
              </div>

              <div>
                <FieldLabel>Reason for Access</FieldLabel>
                <AuthTextarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Briefly describe why you need access to Spark Lead Hub…"
                  rows={4}
                />
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
                }}
              >
                {loading ? "Submitting…" : "Submit Access Request"}
              </button>
            </form>

            <div style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
              fontSize: "var(--text-sm)",
            }}>
              Already have access?{" "}
              <a
                href="/auth"
                style={{ color: "var(--text-muted)", textDecoration: "none", fontWeight: 500, transition: "color 150ms ease" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--teal)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
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
