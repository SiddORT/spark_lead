import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from "react";
import { useGetMe, setUnauthorizedHandler } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

type PermissionMap = Record<string, Record<string, boolean>>;

interface AuthContextType {
  user: any;
  token: string | null;
  setToken: (token: string | null) => void;
  loading: boolean;
  role?: string;
  permissions?: PermissionMap;
  hasPermission: (resource: string, action: string) => boolean;
  refreshPermissions: () => void;
  isWhitelisted?: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

const IDLE_TIMEOUT  = 15 * 60 * 1000; // 15 min → auto logout
const WARN_BEFORE   =  1 * 60 * 1000; // show popup 1 min before

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState(localStorage.getItem('slh_token'));
  const [, setLocation] = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const idleTimer    = useRef<NodeJS.Timeout | null>(null);
  const warnTimer    = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef     = useRef(token);
  const prevPermsRef = useRef<PermissionMap | undefined>();

  const { data: user, isLoading: loadingUser, error, refetch: refetchMe } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      // Poll every 3 s for non-admin users.  Permissions are embedded in the
      // response, so DB changes propagate within 3 s.  The BroadcastChannel +
      // custom event below make changes from the admin panel instant (< 500 ms).
      refetchInterval: (query) => {
        const d = query.state.data as any;
        if (!d || d.role === 'admin') return false;
        return 3_000;
      },
      refetchOnWindowFocus: true,
      staleTime: 0, // always re-evaluate from the server — no stale permission cache
    }
  });

  // Permissions are returned directly by /api/auth/me — no separate API call needed.
  // getPermissionsForRole returns a nested map: { resource: { action: boolean } }
  const permissions = (user as any)?.permissions as PermissionMap | undefined;

  // ── Instant permission sync ──────────────────────────────────────────────
  // When the admin panel saves a permission toggle it fires:
  //   1. window CustomEvent "permissions-updated"  (same tab)
  //   2. BroadcastChannel "rbac-sync" message      (other open tabs)
  // Both immediately call refetchMe() so the UI updates in < 500 ms.
  const refreshPermissions = useCallback(() => { refetchMe(); }, [refetchMe]);

  useEffect(() => {
    if (!token) return;
    window.addEventListener('permissions-updated', refreshPermissions);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('rbac-sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'permissions-updated') refreshPermissions();
      };
    } catch { /* BroadcastChannel not available in some environments */ }
    return () => {
      window.removeEventListener('permissions-updated', refreshPermissions);
      channel?.close();
    };
  }, [token, refreshPermissions]);

  // ── Stale data purge on permission revocation ────────────────────────────
  // When a resource loses its read permission, immediately evict the cached
  // data for that resource so the UI never briefly shows data the user can
  // no longer access.
  useEffect(() => {
    const prev = prevPermsRef.current;
    const curr = permissions;
    if (prev && curr) {
      const lostRead = Object.keys(prev).filter(
        (r) => prev[r]?.read === true && curr[r]?.read !== true
      );
      if (lostRead.length) {
        queryClient.removeQueries({
          predicate: (q) => {
            const key = String(q.queryKey[0] ?? '');
            return lostRead.some((r) => key.toLowerCase().includes(r));
          },
        });
      }
    }
    prevPermsRef.current = curr;
  }, [permissions, queryClient]);

  // Keep tokenRef in sync so timers can read the latest value
  const setToken = useCallback((t: string | null) => {
    tokenRef.current = t;
    setTokenState(t);
    if (t) {
      localStorage.setItem('slh_token', t);
    } else {
      localStorage.removeItem('slh_token');
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    if (idleTimer.current)    clearTimeout(idleTimer.current);
    if (warnTimer.current)    clearTimeout(warnTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    idleTimer.current    = null;
    warnTimer.current    = null;
    countdownRef.current = null;
  }, []);

  const signOut = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(60);
    setToken(null);
    // Broadcast logout to other tabs
    try { localStorage.setItem('slh_logout', String(Date.now())); } catch {}
    setLocation('/auth');
  }, [clearAllTimers, setToken, setLocation]);

  // Register global 401 handler — any API call returning 401 triggers sign-out
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Close modal and redirect if auth error occurs (e.g. token rejected by /me)
  useEffect(() => {
    if (error) {
      signOut();
    }
  }, [error, signOut]);

  // Close modal if we ever lose the token (belt-and-suspenders)
  useEffect(() => {
    if (!token) {
      setShowWarning(false);
      clearAllTimers();
    }
  }, [token, clearAllTimers]);

  // Multi-tab sync: if another tab logs out, log out here too
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'slh_logout') signOut();
      if (e.key === 'slh_token' && !e.newValue) signOut();
      if (e.key === 'slh_token' && e.newValue && e.newValue !== tokenRef.current) {
        setTokenState(e.newValue);
        tokenRef.current = e.newValue;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [signOut]);

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
            countdownRef.current = null;
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

  const handleStayLoggedIn = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const currentToken = tokenRef.current;
      if (!currentToken) { signOut(); return; }

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (!res.ok) {
        signOut();
        return;
      }

      const { token: newToken } = await res.json();
      setToken(newToken);
      resetTimer();
    } catch {
      signOut();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, signOut, setToken, resetTimer]);

  const hasPermission = (resource: string, action: string) => {
    if (user?.role === 'admin') return true;
    // permissions is a nested map: { [resource]: { [action]: boolean } }
    return permissions?.[resource]?.[action] === true;
  };

  return (
    <AuthContext.Provider value={{
      user, token, setToken, loading: loadingUser && !!token,
      role: user?.role, permissions, hasPermission, refreshPermissions,
      isWhitelisted: user?.isWhitelisted, signOut
    }}>
      {children}

      {/* ── Session timeout warning popup ── */}
      {showWarning && !!token && (
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
            boxShadow: "0 24px 64px hsl(222 22% 3% / 0.6), 0 0 0 1px hsl(196 100% 46% / 0.08)",
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
                : "hsl(196 100% 46% / 0.1)",
              border: `2px solid ${countdown <= 10 ? "hsl(0 72% 51% / 0.5)" : "hsl(196 100% 46% / 0.4)"}`,
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
                disabled={refreshing}
                style={{
                  flex: 1, height: 42,
                  background: refreshing ? "hsl(196 100% 46% / 0.5)" : "var(--teal)",
                  color: "hsl(222 22% 6%)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  cursor: refreshing ? "not-allowed" : "pointer",
                  transition: "filter 150ms ease",
                }}
                onMouseEnter={e => { if (!refreshing) e.currentTarget.style.filter = "brightness(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
              >
                {refreshing ? "Refreshing…" : "Stay Logged In"}
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
