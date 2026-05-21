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

const IDLE_TIMEOUT     = 15 * 60 * 1000; // 15 min → auto logout (true inactivity)
const WARN_BEFORE      =  2 * 60 * 1000; // show popup 2 min before
const ACTIVITY_KEY     = 'slh_last_activity';
const ACTIVITY_THROTTLE_MS = 2_000;       // don't write to LS more than once / 2s
const TIMEOUT_POLL_MS  = 15_000;          // check idle status every 15s (reliable even on backgrounded tabs)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState(localStorage.getItem('slh_token'));
  const [, setLocation] = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(Math.floor(WARN_BEFORE / 1000));
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const countdownRef    = useRef<NodeJS.Timeout | null>(null);
  const pollRef         = useRef<NodeJS.Timeout | null>(null);
  const lastWriteRef    = useRef<number>(0);
  const tokenRef        = useRef(token);
  const prevPermsRef    = useRef<PermissionMap | undefined>();
  const activityChannel = useRef<BroadcastChannel | null>(null);
  const refreshingRef   = useRef(false);    // prevents idle-poll/countdown from logging the user out mid-refresh
  const showWarningRef  = useRef(false);    // mirror of showWarning for stale-closure-free reads inside the poll

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
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current)      clearInterval(pollRef.current);
    countdownRef.current = null;
    pollRef.current      = null;
  }, []);

  const signOut = useCallback((reason: 'inactivity' | 'manual' | 'expired' = 'manual') => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(Math.floor(WARN_BEFORE / 1000));
    setToken(null);
    try { localStorage.removeItem(ACTIVITY_KEY); } catch {}
    try { localStorage.setItem('slh_logout', String(Date.now())); } catch {}
    // Tag the redirect so /auth can show the right message
    const suffix = reason === 'inactivity' ? '?reason=inactivity' : reason === 'expired' ? '?reason=expired' : '';
    setLocation('/auth' + suffix);
  }, [clearAllTimers, setToken, setLocation]);

  // Register global 401 handler — any API call returning 401 triggers sign-out as "expired"
  useEffect(() => {
    setUnauthorizedHandler(() => signOut('expired'));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Only sign the user out on REAL auth failures from /me — not on transient
  // network/5xx errors, and NOT just because permissions were toggled.
  //   • 401 is already handled globally by setUnauthorizedHandler → signOut.
  //   • 404 means the user row no longer exists (account deleted) — sign out.
  // Everything else (500, network blips, etc.) is left alone so the user keeps
  // their session and the next 3-second poll can recover.
  useEffect(() => {
    const status = (error as any)?.response?.status;
    if (status === 404) {
      signOut('expired');
    }
  }, [error, signOut]);

  // Close modal if we ever lose the token (belt-and-suspenders)
  useEffect(() => {
    if (!token) {
      setShowWarning(false);
      clearAllTimers();
    }
  }, [token, clearAllTimers]);

  // Multi-tab sync: if another tab logs out, log out here too.
  // If another tab reports activity, treat it as activity here too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'slh_logout') signOut('manual');
      if (e.key === 'slh_token' && !e.newValue) signOut('manual');
      if (e.key === 'slh_token' && e.newValue && e.newValue !== tokenRef.current) {
        setTokenState(e.newValue);
        tokenRef.current = e.newValue;
      }
      if (e.key === ACTIVITY_KEY && e.newValue) {
        // Activity recorded in another tab — dismiss our warning if up
        setShowWarning(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [signOut]);

  // ── Centralized activity recorder ──────────────────────────────────────
  // Writes the wall-clock timestamp of the last user interaction to
  // localStorage (throttled to once / 2s so we don't thrash). All tabs share
  // the same key, so activity in any tab keeps every tab alive.
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) return;
    lastWriteRef.current = now;
    try { localStorage.setItem(ACTIVITY_KEY, String(now)); } catch {}
    // Broadcast to other tabs (storage event won't fire in the writing tab)
    try { activityChannel.current?.postMessage({ type: 'activity', ts: now }); } catch {}
    // If a warning is open and the user is interacting, dismiss it
    setShowWarning(prev => prev ? false : prev);
  }, []);

  // ── Activity listeners ─────────────────────────────────────────────────
  // We listen to a comprehensive set of events but cheaply (single throttled
  // handler). The handler is stable so React never re-attaches mid-session,
  // which was a major source of "logged out while typing" bugs.
  useEffect(() => {
    if (!token) return;

    // Seed the timestamp so a brand-new session doesn't immediately think it's idle
    try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch {}
    lastWriteRef.current = Date.now();

    // Open a BroadcastChannel for cross-tab activity (storage events handle the rest)
    try { activityChannel.current = new BroadcastChannel('slh-activity'); } catch {
      activityChannel.current = null;
    }
    if (activityChannel.current) {
      activityChannel.current.onmessage = (e) => {
        if (e.data?.type === 'activity' && typeof e.data.ts === 'number') {
          // Update local view of last-activity without re-writing to LS
          lastWriteRef.current = Math.max(lastWriteRef.current, e.data.ts);
          setShowWarning(prev => prev ? false : prev);
        }
      };
    }

    const EVENTS = [
      'mousedown', 'keydown', 'scroll', 'touchstart',
      'touchmove', 'click', 'pointermove', 'wheel',
    ];
    EVENTS.forEach(e => window.addEventListener(e, recordActivity, { passive: true }));
    // Window focus also counts as activity (user returned to the tab)
    window.addEventListener('focus', recordActivity);

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, recordActivity));
      window.removeEventListener('focus', recordActivity);
      try { activityChannel.current?.close(); } catch {}
      activityChannel.current = null;
    };
  }, [token, recordActivity]);

  // ── Idle poll ──────────────────────────────────────────────────────────
  // Instead of one giant setTimeout (unreliable on backgrounded tabs that may
  // be throttled or suspended for minutes at a time), we poll every 15 s and
  // compare wall-clock time vs the last activity timestamp. This is reliable
  // because the check runs whenever the tab regains the event loop — even
  // after long backgrounding.
  useEffect(() => {
    if (!token) return;

    const evaluate = () => {
      // Don't auto-logout while a "Stay Logged In" refresh is in flight —
      // the user has explicitly asked to keep the session.
      if (refreshingRef.current) return;
      const last = Number(localStorage.getItem(ACTIVITY_KEY) || '0') || lastWriteRef.current;
      const idleMs = Date.now() - last;
      if (idleMs >= IDLE_TIMEOUT) {
        signOut('inactivity');
        return;
      }
      const remaining = IDLE_TIMEOUT - idleMs;
      if (remaining <= WARN_BEFORE) {
        const secsLeft = Math.max(1, Math.ceil(remaining / 1000));
        setCountdown(secsLeft);
        if (!showWarningRef.current) setShowWarning(true);
      } else if (showWarningRef.current) {
        setShowWarning(false);
      }
    };

    // Validate immediately on mount / token change / tab visibility
    evaluate();
    pollRef.current = setInterval(evaluate, TIMEOUT_POLL_MS);

    const onVisibility = () => { if (!document.hidden) evaluate(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token, signOut]);

  // Keep showWarningRef in sync so the poll's evaluate() never reads a stale
  // value from its closure.
  useEffect(() => { showWarningRef.current = showWarning; }, [showWarning]);

  // ── Per-second countdown while warning is visible ──────────────────────
  useEffect(() => {
    if (!showWarning) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = null;
      return;
    }
    countdownRef.current = setInterval(() => {
      // Same refresh guard as evaluate() — never log out while refreshing.
      if (refreshingRef.current) return;
      const last = Number(localStorage.getItem(ACTIVITY_KEY) || '0') || lastWriteRef.current;
      const remaining = IDLE_TIMEOUT - (Date.now() - last);
      if (remaining <= 0) {
        signOut('inactivity');
        return;
      }
      setCountdown(Math.max(1, Math.ceil(remaining / 1000)));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = null;
    };
  }, [showWarning, signOut]);

  const handleStayLoggedIn = useCallback(async () => {
    if (refreshing) return;
    // Bump activity FIRST so any concurrent poll tick treats us as fresh,
    // then raise the refresh guard so neither poll nor countdown can call
    // signOut('inactivity') while the network request is in flight.
    const nowStart = Date.now();
    try { localStorage.setItem(ACTIVITY_KEY, String(nowStart)); } catch {}
    lastWriteRef.current = nowStart;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      const currentToken = tokenRef.current;
      if (!currentToken) { signOut('expired'); return; }

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (!res.ok) {
        signOut('expired');
        return;
      }

      const { token: newToken } = await res.json();
      setToken(newToken);
      // Final fresh stamp so the next poll considers us active.
      const now = Date.now();
      try { localStorage.setItem(ACTIVITY_KEY, String(now)); } catch {}
      lastWriteRef.current = now;
      setShowWarning(false);
    } catch {
      signOut('expired');
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [refreshing, signOut, setToken]);

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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="slh-session-warning-title"
          aria-describedby="slh-session-warning-desc"
          style={{
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
            <div aria-hidden="true" style={{
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
              <h2 id="slh-session-warning-title" style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}>
                Session Expiring Soon
              </h2>
              <p id="slh-session-warning-desc" style={{
                marginTop: 8, fontSize: "var(--text-sm)",
                color: "var(--text-secondary)", lineHeight: 1.5,
              }}>
                You'll be logged out due to inactivity.
              </p>
            </div>

            {/* Countdown ring */}
            <div
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`${countdown} seconds remaining before automatic logout`}
              style={{
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
                onClick={() => signOut('manual')}
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
  const { token, loading, isWhitelisted, signOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !token) {
      setLocation('/auth');
    } else if (!loading && token && isWhitelisted === false) {
      // Whitelist was revoked mid-session (or the account was disabled).
      // This IS an authentication failure: clear the session, then land
      // on the access-denied page so the user sees the proper reason.
      signOut();
      setLocation('/access-denied?reason=deactivated');
    }
  }, [loading, token, isWhitelisted, setLocation, signOut]);

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
