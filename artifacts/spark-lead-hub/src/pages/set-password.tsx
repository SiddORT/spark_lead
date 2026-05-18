import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Zap, CheckCircle, AlertCircle, Eye, EyeOff, ChevronLeft, Check } from "lucide-react";

function getPasswordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, Math.ceil((score / 5) * 4));
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score: clamped, label: labels[clamped] };
}

const SEG_CLASSES = ["", "s-weak", "s-fair", "s-good", "s-strong"];

export function SetPassword() {
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [progress, setProgress] = useState(false);
  const [, setLocation]         = useLocation();

  const params = new URLSearchParams(window.location.search);
  const token  = params.get("token");

  const { score, label } = getPasswordStrength(password);
  const passwordsMatch   = password.length > 0 && confirm.length > 0 && password === confirm;
  const confirmMismatch  = confirm.length > 0 && password !== confirm;
  const canSubmit        = !!token && displayName.trim().length >= 2 && password.length >= 8 && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Invalid token. Please use the link from your invitation email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    setProgress(true);
    try {
      const res  = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await new Promise(r => setTimeout(r, 1200));
      setSuccess(true);
      setTimeout(() => setLocation("/auth"), 2200);
    } catch (err: any) {
      setError(err.message || "Failed to set password");
      setProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow-1" />
      <div className="auth-bg-glow-2" />

      <div className="auth-card animate-slide-in">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Zap size={22} />
          </div>
          {theme === "light" ? (
            <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="SparkLead" style={{ height: 28, width: "auto", display: "block" }} />
          ) : (
            <><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-xl)", color: "#ffffff", letterSpacing: "-0.02em" }}>
              SparkLead
            </span><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-xl)", color: "#00AEEC", letterSpacing: "-0.02em" }}>_</span></>
          )}
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "var(--sp-8) 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--sp-4)" }}>
              <CheckCircle size={56} style={{ color: "var(--success)", filter: "drop-shadow(0 0 12px var(--success))" }} />
            </div>
            <div className="auth-title" style={{ fontSize: "var(--text-xl)" }}>Password Set!</div>
            <p className="auth-subtitle">Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <div className="auth-title">Activate Your Account</div>
            <p className="auth-subtitle">Choose a display name and create a secure password</p>

            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "var(--sp-2)",
                padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-4)",
                background: "var(--danger-dim)", border: "1px solid hsla(4,68%,58%,0.35)",
                borderRadius: "var(--r-md)", color: "var(--danger)", fontSize: "var(--text-sm)",
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {!token && (
              <div style={{
                padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-4)",
                background: "var(--warning-dim)", border: "1px solid hsla(36,88%,52%,0.35)",
                borderRadius: "var(--r-md)", color: "var(--warning)", fontSize: "var(--text-sm)",
              }}>
                Invalid or missing token. Please use the link from your invitation email.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Display Name */}
              <div className="form-field">
                <label className="field-label">Display Name <span className="req">*</span></label>
                <input
                  className="field-input"
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="How you'll appear to your team"
                  autoComplete="name"
                  autoFocus
                />
                {displayName.trim().length > 0 && displayName.trim().length < 2 && (
                  <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>
                    At least 2 characters required
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="form-field">
                <label className="field-label">New Password <span className="req">*</span></label>
                <div className="field-password-wrap">
                  <input
                    className="field-input"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" className="field-password-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <>
                    <div className="pw-strength">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`pw-strength-seg ${i <= score ? SEG_CLASSES[score] : ""}`}
                        />
                      ))}
                    </div>
                    {label && <div className="pw-strength-label">{label}</div>}
                  </>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-field">
                <label className="field-label">Confirm Password <span className="req">*</span></label>
                <div className="field-password-wrap">
                  <input
                    className="field-input"
                    type={showCf ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="field-password-toggle" onClick={() => setShowCf(v => !v)} tabIndex={-1}>
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordsMatch  && <div className="pw-match-ok"><Check size={12} /> Passwords match</div>}
                {confirmMismatch && <div className="pw-match-err"><AlertCircle size={12} /> Passwords don't match</div>}
              </div>

              {/* Progress bar during submit */}
              {progress && (
                <div style={{ marginBottom: "var(--sp-4)" }}>
                  <div style={{ height: 3, background: "var(--bg-muted)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                    <div
                      className="animate-validate-bar"
                      style={{
                        height: "100%",
                        background: "var(--teal)",
                        borderRadius: "var(--r-full)",
                        animationDuration: "1.5s",
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: "var(--sp-2)" }}
              >
                {loading
                  ? <><div className="spinner-sm" /> Setting password…</>
                  : "Set Password & Activate Account"
                }
              </button>
            </form>

            <a href="/auth" className="auth-back-link">
              <ChevronLeft size={15} /> Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
