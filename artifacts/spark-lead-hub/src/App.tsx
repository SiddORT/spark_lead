import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute, useAuth } from "@/components/auth-provider";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Dashboard } from "@/pages/dashboard";
import { KanbanBoard } from "@/pages/kanban";
import { NewLead } from "@/pages/leads-new";
import { Analytics } from "@/pages/analytics";
import { Team } from "@/pages/team";
import { Companies, Services } from "@/pages/master-data";
import { PipelineMaster } from "@/pages/pipeline-master";
import { Permissions, AuditLog } from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { AuthPage } from "@/pages/auth";
import { RequestAccess } from "@/pages/request-access";
import { AccessDenied } from "@/pages/access-denied";
import { SetPassword } from "@/pages/set-password";
import { Profile } from "@/pages/profile";
import { FollowUp } from "@/pages/follow-up";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AccessDeniedView() {
  return (
    <div className="page">
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: "var(--space-4)",
        padding: "var(--space-12)",
        textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "hsl(0 72% 51% / 0.08)",
          border: "1px solid hsl(0 72% 51% / 0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          🔒
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}>
          Access Denied
        </div>
        <div style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-muted)",
          maxWidth: 360,
          lineHeight: 1.7,
        }}>
          You don't have permission to access this section.
          Contact your administrator to request access.
        </div>
      </div>
    </div>
  );
}

// Friendly labels for permission-revoked toasts. Falls back to title-casing the
// resource key if no explicit label is registered.
const RESOURCE_LABELS: Record<string, string> = {
  reports: "Analytics",
  leads: "Leads",
  team: "Team Management",
  companies: "Companies",
  services: "Services",
  pipeline: "Pipeline",
  audit: "Audit Log",
  admin: "Admin Settings",
};

function labelFor(resource: string | undefined, adminOnly: boolean): string {
  if (adminOnly) return "Admin Settings";
  if (!resource) return "this section";
  return RESOURCE_LABELS[resource] ?? resource.charAt(0).toUpperCase() + resource.slice(1);
}

function PermissionRoute({
  resource,
  action,
  adminOnly = false,
  children,
}: {
  resource?: string;
  action?: string;
  adminOnly?: boolean;
  children: React.ReactNode;
}) {
  const { hasPermission, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const wasAllowedRef = useRef<boolean | null>(null);

  const allowed =
    adminOnly
      ? user?.role === "admin"
      : resource && action
      ? hasPermission(resource, action)
      : true;

  // Live transition: when permission is revoked WHILE the user is actively
  // viewing this page, show a toast explaining what happened and send them to
  // the dashboard — NOT to /access-denied (which is the whitelist-rejection
  // page and would falsely suggest the account itself was disabled).
  //
  // For deep-links to a page the user never had access to, we fall through to
  // the inline <AccessDeniedView /> below — they stay inside the app shell,
  // still logged in, and the sidebar/nav remain intact.
  useEffect(() => {
    if (loading || !user) return;
    const prevAllowed = wasAllowedRef.current;
    if (prevAllowed === true && !allowed) {
      toast.error(
        `Your access to ${labelFor(resource, adminOnly)} has been revoked by the administrator.`
      );
      setLocation("/");
    }
    wasAllowedRef.current = allowed;
  }, [allowed, loading, user, setLocation, adminOnly, resource]);

  if (!allowed) return <AccessDeniedView />;
  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/request-access" component={RequestAccess} />
      <Route path="/access-denied" component={AccessDenied} />
      <Route path="/set-password" component={SetPassword} />

      <Route path="/profile">
        <ProtectedLayout><Profile /></ProtectedLayout>
      </Route>

      {/* ── Always-accessible protected pages ── */}
      <Route path="/">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/kanban">
        <ProtectedLayout><KanbanBoard /></ProtectedLayout>
      </Route>
      <Route path="/follow-up">
        <ProtectedLayout><FollowUp /></ProtectedLayout>
      </Route>

      {/* ── Permission-guarded pages ── */}
      <Route path="/leads/new">
        <ProtectedLayout>
          <PermissionRoute resource="leads" action="create">
            <NewLead />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/analytics">
        <ProtectedLayout>
          <PermissionRoute resource="reports" action="read">
            <Analytics />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/team">
        <ProtectedLayout>
          <PermissionRoute resource="team" action="read">
            <Team />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/master/companies">
        <ProtectedLayout>
          <PermissionRoute resource="companies" action="read">
            <Companies />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/master/services">
        <ProtectedLayout>
          <PermissionRoute resource="services" action="read">
            <Services />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/master/pipeline">
        <ProtectedLayout>
          <PermissionRoute resource="pipeline" action="read">
            <PipelineMaster />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/settings/permissions">
        <ProtectedLayout>
          <PermissionRoute adminOnly>
            <Permissions />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>
      <Route path="/audit">
        <ProtectedLayout>
          <PermissionRoute resource="audit" action="read">
            <AuditLog />
          </PermissionRoute>
        </ProtectedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster
          position="bottom-center"
          richColors
          gap={8}
          toastOptions={{
            style: {
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              boxShadow: "var(--shadow-lg)",
            },
            classNames: {
              success: "toast-success",
              error: "toast-error",
              warning: "toast-warning",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
