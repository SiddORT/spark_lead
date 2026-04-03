import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useGetMe, useGetPermissions } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: any;
  token: string | null;
  setToken: (token: string | null) => void;
  loading: boolean;
  role?: string;
  permissions?: any[];
  hasPermission: (resource: string, action: string) => boolean;
  isWhitelisted?: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const IDLE_TIMEOUT  = 15 * 60 * 1000; // 15 min → auto logout
const WARN_BEFORE   =  1 * 60 * 1000; // show popup 1 min before

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem('slh_token'));
  const [, setLocation] = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const idleTimer    = useRef<NodeJS.Timeout | null>(null);
  const warnTimer    = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const { data: user, isLoading: loadingUser, error } = useGetMe({
    query: { enabled: !!token, retry: false }
  });

  const { data: permissions } = useGetPermissions({
    query: { enabled: !!user && user.role !== 'admin', retry: false }
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem('slh_token');
      setToken(null);
    }
  }, [error]);

  const signOut = useCallback(() => {
    localStorage.removeItem('slh_token');
    setToken(null);
    setLocation('/auth');
  }, [setLocation]);

  const clearAllTimers = useCallback(() => {
    if (idleTimer.current)    clearTimeout(idleTimer.current);
    if (warnTimer.current)    clearTimeout(warnTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(60);

    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARN_BEFORE);

    idleTimer.current = setTimeout(() => {
      signOut();
    }, IDLE_TIMEOUT);
  }, [clearAllTimers, signOut]);

  // Activity listeners + visibility-change handler
  useEffect(() => {
    if (!token) return;

    const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    const onVisibility = () => { if (!document.hidden) resetTimer(); };
    document.addEventListener('visibilitychange', onVisibility);

    resetTimer();

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', onVisibility);
      clearAllTimers();
    };
  }, [token, resetTimer, clearAllTimers]);

  const handleStayLoggedIn = () => {
    resetTimer();
  };

  const hasPermission = (resource: string, action: string) => {
    if (user?.role === 'admin') return true;
    return permissions?.some((p: any) => p.resource === resource && p.action === action && p.allowed) || false;
  };

  return (
    <AuthContext.Provider value={{
      user, token, setToken, loading: loadingUser && !!token,
      role: user?.role, permissions, hasPermission,
      isWhitelisted: user?.isWhitelisted, signOut
    }}>
      {children}

      {/* ── Session timeout warning popup ── */}
      {showWarning && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "hsl(222 22% 3% / 0.75)",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-8)",
            width: 360,
            boxShadow: "0 24px 64px hsl(222 22% 3% / 0.6), 0 0 0 1px hsl(172 75% 48% / 0.08)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-4)",
          }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "hsl(38 92% 60% / 0.12)",
              border: "1px solid hsl(38 92% 60% / 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>
              ⏱
            </div>

            {/* Title */}
            <div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}>
                Session Expiring Soon
              </h2>
              <p style={{
                marginTop: 8, fontSize: "var(--text-sm)",
                color: "var(--text-secondary)", lineHeight: 1.5,
              }}>
                You'll be logged out due to inactivity.
              </p>
            </div>

            {/* Countdown ring */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: countdown <= 10
                ? "hsl(0 72% 51% / 0.12)"
                : "hsl(172 75% 48% / 0.1)",
              border: `2px solid ${countdown <= 10 ? "hsl(0 72% 51% / 0.5)" : "hsl(172 75% 48% / 0.4)"}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transition: "background 400ms ease, border-color 400ms ease",
            }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                fontWeight: 800,
                color: countdown <= 10 ? "hsl(0 72% 60%)" : "var(--teal)",
                lineHeight: 1,
              }}>
                {countdown}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>sec</span>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "var(--space-3)", width: "100%" }}>
              <button
                onClick={handleStayLoggedIn}
                style={{
                  flex: 1, height: 42,
                  background: "var(--teal)",
                  color: "hsl(222 22% 6%)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  transition: "filter 150ms ease",
                }}
                onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
                onMouseLeave={e => e.currentTarget.style.filter = "none"}
              >
                Stay Logged In
              </button>
              <button
                onClick={signOut}
                style={{
                  flex: 1, height: 42,
                  background: "hsl(0 72% 51% / 0.08)",
                  color: "hsl(0 72% 60%)",
                  border: "1px solid hsl(0 72% 51% / 0.25)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "hsl(0 72% 51% / 0.16)"}
                onMouseLeave={e => e.currentTarget.style.background = "hsl(0 72% 51% / 0.08)"}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading, isWhitelisted } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !token) {
      setLocation('/auth');
    } else if (!loading && token && isWhitelisted === false) {
      setLocation('/access-denied');
    }
  }, [loading, token, isWhitelisted, setLocation]);

  if (loading || !token || isWhitelisted === false) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin neon-glow"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export function PermissionCheck({ resource, action, children, fallback = null }: { resource: string, action: string, children: ReactNode, fallback?: ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(resource, action)) return <>{fallback}</>;
  return <>{children}</>;
}
