import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/components/auth-provider";
import { Layout } from "@/components/layout";
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

      <Route path="/">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/kanban">
        <ProtectedLayout><KanbanBoard /></ProtectedLayout>
      </Route>
      <Route path="/leads/new">
        <ProtectedLayout><NewLead /></ProtectedLayout>
      </Route>
      <Route path="/follow-up">
        <ProtectedLayout><FollowUp /></ProtectedLayout>
      </Route>
      <Route path="/analytics">
        <ProtectedLayout><Analytics /></ProtectedLayout>
      </Route>
      <Route path="/team">
        <ProtectedLayout><Team /></ProtectedLayout>
      </Route>
      <Route path="/master/companies">
        <ProtectedLayout><Companies /></ProtectedLayout>
      </Route>
      <Route path="/master/services">
        <ProtectedLayout><Services /></ProtectedLayout>
      </Route>
      <Route path="/master/pipeline">
        <ProtectedLayout><PipelineMaster /></ProtectedLayout>
      </Route>
      <Route path="/settings/permissions">
        <ProtectedLayout><Permissions /></ProtectedLayout>
      </Route>
      <Route path="/audit">
        <ProtectedLayout><AuditLog /></ProtectedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
