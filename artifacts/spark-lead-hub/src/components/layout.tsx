import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, PermissionCheck } from "./auth-provider";
import {
  LayoutDashboard, Kanban, PlusCircle, Building2,
  Briefcase, BarChart3, Users, ShieldCheck, ScrollText,
  LogOut, Zap, ChevronLeft, ChevronRight
} from "lucide-react";
import { Badge } from "./ui";

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = location === href || (href !== "/" && location.startsWith(href));
    return (
      <Link
        href={href}
        className={`nav-item${active ? " active" : ""}`}
      >
        <span className="nav-item-icon"><Icon size={16} /></span>
        <span className="nav-item-label">{label}</span>
      </Link>
    );
  };

  const SectionLabel = ({ title }: { title: string }) => (
    <div className="sidebar-section-label">{title}</div>
  );

  const initials = (name?: string | null) =>
    name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="app-shell">
      <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Zap size={18} />
          </div>
          {!collapsed && <span className="sidebar-brand-text">LeadFlow</span>}
        </div>

        <nav className="sidebar-nav">
          <SectionLabel title="Main" />
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/kanban" icon={Kanban} label="Kanban Board" />
          <PermissionCheck resource="leads" action="create">
            <NavItem href="/leads/new" icon={PlusCircle} label="New Lead" />
          </PermissionCheck>

          <SectionLabel title="Master Data" />
          <PermissionCheck resource="companies" action="read">
            <NavItem href="/master/companies" icon={Building2} label="Companies" />
          </PermissionCheck>
          <PermissionCheck resource="services" action="read">
            <NavItem href="/master/services" icon={Briefcase} label="Services" />
          </PermissionCheck>

          <SectionLabel title="Administration" />
          <PermissionCheck resource="reports" action="read">
            <NavItem href="/analytics" icon={BarChart3} label="Analytics" />
          </PermissionCheck>
          <PermissionCheck resource="team" action="read">
            <NavItem href="/team" icon={Users} label="Team" />
          </PermissionCheck>
          <PermissionCheck resource="settings" action="read">
            <NavItem href="/settings/permissions" icon={ShieldCheck} label="Permissions" />
          </PermissionCheck>
          <PermissionCheck resource="audit" action="read">
            <NavItem href="/audit" icon={ScrollText} label="Audit Log" />
          </PermissionCheck>
        </nav>

        <div className="sidebar-footer">
          {!collapsed ? (
            <>
              <div className="sidebar-user">
                <div className="avatar">{initials(user?.displayName)}</div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user?.displayName}</div>
                  <div className="sidebar-user-email">{user?.email}</div>
                </div>
              </div>
              <div className="sidebar-actions">
                <span className="badge badge-admin" style={{ textTransform: "none" }}>
                  {user?.role?.replace("_", " ")}
                </span>
                <button
                  onClick={() => setCollapsed(true)}
                  className="btn btn-ghost btn-icon"
                  title="Collapse sidebar"
                  style={{ marginLeft: "auto" }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={signOut}
                  className="btn btn-ghost btn-icon"
                  title="Sign out"
                  style={{ color: "var(--danger)" }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
              <div className="avatar avatar-sm">{initials(user?.displayName)}</div>
              <button
                onClick={() => setCollapsed(false)}
                className="btn btn-ghost btn-icon"
                title="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
