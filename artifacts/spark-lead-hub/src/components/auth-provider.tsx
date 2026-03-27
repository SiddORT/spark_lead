import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem('slh_token'));
  const [, setLocation] = useLocation();

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

  const signOut = () => {
    localStorage.removeItem('slh_token');
    setToken(null);
    setLocation('/auth');
  };

  // Inactivity timeout
  useEffect(() => {
    if (!token) return;
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
         signOut();
      }, 900000); // 15 mins
    };
    
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimeout));
    resetTimeout();
    
    return () => events.forEach(e => window.removeEventListener(e, resetTimeout));
  }, [token]);

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
