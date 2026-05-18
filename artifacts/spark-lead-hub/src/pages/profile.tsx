import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Camera, User, Mail, Shield, Save, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function resizeImageToBase64(file: File, size = 96): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDirty = displayName.trim() !== (user?.displayName ?? "") || avatarChanged;

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    try {
      const b64 = await resizeImageToBase64(file, 96);
      setAvatarPreview(b64);
      setAvatarChanged(true);
    } catch {
      toast.error("Failed to process image");
    }
  }, []);

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarChanged(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error("Display name cannot be empty"); return; }
    if (displayName.trim().length < 2) { toast.error("Display name must be at least 2 characters"); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem("slh_token");
      const body: Record<string, any> = { displayName: displayName.trim() };
      if (avatarChanged) body.avatarUrl = avatarPreview;

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setAvatarChanged(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const ACCENT = "hsl(196 100% 46%)";
  const BADGE_BG: Record<string, string> = {
    superadmin: "hsl(280 70% 50% / 0.15)",
    admin:      "hsl(36 88% 52% / 0.15)",
    member:     "hsl(196 100% 46% / 0.12)",
  };
  const BADGE_COLOR: Record<string, string> = {
    superadmin: "hsl(280 70% 68%)",
    admin:      "hsl(36 88% 58%)",
    member:     "var(--teal)",
  };
  const role = user?.role ?? "member";

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      padding: "var(--space-8) var(--space-6)",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Back */}
      <div style={{ width: "100%", maxWidth: 560, marginBottom: "var(--space-5)" }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "var(--text-sm)",
            fontFamily: "var(--font-sans)", padding: 0,
            transition: "color 150ms ease",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 560,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "0 24px 48px hsl(222 22% 3% / 0.4)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "var(--space-6) var(--space-8)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: "var(--space-3)",
        }}>
          <div style={{ width: 4, height: 28, background: ACCENT, borderRadius: 2, boxShadow: `0 0 12px ${ACCENT}80`, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              My Profile
            </h1>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
              Manage your display name and profile photo
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--space-8)" }}>
          {/* Avatar section */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-5)", marginBottom: "var(--space-8)" }}>
            {/* Avatar ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: avatarPreview ? "transparent" : "hsl(196 100% 46% / 0.15)",
                border: `2px solid ${ACCENT}`,
                boxShadow: `0 0 0 4px hsl(196 100% 46% / 0.12)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", fontSize: 28, fontWeight: 700,
                color: ACCENT, fontFamily: "var(--font-display)",
              }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials(displayName || user?.displayName)
                }
              </div>
              {/* Camera button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                title="Change photo"
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: "50%",
                  background: ACCENT, border: "2px solid var(--bg-elevated)",
                  color: "hsl(222 22% 6%)", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "filter 150ms ease",
                }}
                onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.15)"}
                onMouseLeave={e => e.currentTarget.style.filter = "none"}
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Avatar actions */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                Profile Photo
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 10 }}>
                JPG, PNG or WebP · max 5 MB · cropped to square
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    height: 32, padding: "0 14px",
                    background: "hsl(196 100% 46% / 0.1)",
                    border: "1px solid hsl(196 100% 46% / 0.3)",
                    borderRadius: "var(--radius-sm)", color: ACCENT,
                    fontSize: "var(--text-xs)", fontWeight: 600,
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "hsl(196 100% 46% / 0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "hsl(196 100% 46% / 0.1)"}
                >
                  <Camera size={12} /> Upload Photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    style={{
                      height: 32, padding: "0 14px",
                      background: "transparent",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-sm)", color: "var(--text-muted)",
                      fontSize: "var(--text-xs)", fontWeight: 500,
                      fontFamily: "var(--font-sans)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                      transition: "color 150ms ease, border-color 150ms ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  >
                    <X size={11} /> Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {/* Display Name */}
            <div>
              <label style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6,
              }}>
                <User size={12} /> Display Name
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Your name"
                style={{
                  width: "100%", height: 42, padding: "0 12px",
                  background: "var(--bg-subtle)", border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)", color: "var(--text-primary)",
                  fontSize: "var(--text-sm)", fontFamily: "var(--font-sans)", outline: "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px hsl(196 100% 46% / 0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Email — read only */}
            <div>
              <label style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6,
              }}>
                <Mail size={12} /> Email Address
              </label>
              <div style={{
                height: 42, padding: "0 12px",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)", color: "var(--text-muted)",
                fontSize: "var(--text-sm)", fontFamily: "var(--font-sans)",
                display: "flex", alignItems: "center",
                userSelect: "none",
              }}>
                {user?.email}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                Email address cannot be changed
              </p>
            </div>

            {/* Role — read only */}
            <div>
              <label style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6,
              }}>
                <Shield size={12} /> Role
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  height: 28, padding: "0 12px",
                  background: BADGE_BG[role] ?? "hsl(196 100% 46% / 0.12)",
                  color: BADGE_COLOR[role] ?? ACCENT,
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  textTransform: "capitalize",
                }}>
                  {role.replace("_", " ")}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Role is managed by an administrator
                </span>
              </div>
            </div>
          </div>

          {/* Save */}
          <div style={{
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "flex-end", gap: "var(--space-3)",
          }}>
            <button
              type="button"
              onClick={() => { setDisplayName(user?.displayName ?? ""); setAvatarPreview(user?.avatarUrl ?? null); setAvatarChanged(false); }}
              disabled={!isDirty || saving}
              style={{
                height: 42, padding: "0 20px",
                background: "transparent", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)", color: "var(--text-secondary)",
                fontSize: "var(--text-sm)", fontWeight: 500, fontFamily: "var(--font-sans)",
                cursor: (!isDirty || saving) ? "not-allowed" : "pointer",
                opacity: (!isDirty || saving) ? 0.5 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || !displayName.trim() || saving}
              style={{
                height: 42, padding: "0 28px",
                background: (!isDirty || saving) ? "hsl(196 100% 46% / 0.5)" : ACCENT,
                color: "hsl(222 22% 6%)", border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)", fontWeight: 700, fontFamily: "var(--font-sans)",
                cursor: (!isDirty || saving) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "var(--space-2)",
                transition: "background 150ms ease, filter 150ms ease",
              }}
              onMouseEnter={e => { if (isDirty && !saving) e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
