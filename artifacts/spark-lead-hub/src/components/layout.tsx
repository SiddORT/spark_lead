import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, PermissionCheck } from "./auth-provider";
import { useGetLeads, useGetCompanies, useGetServices } from "@workspace/api-client-react";
import { CreateLeadDrawer } from "./create-lead-drawer";
import { useTheme } from "./theme-provider";
import {
  LayoutDashboard, Kanban, PlusCircle, Building2,
  Briefcase, BarChart3, Users, ShieldCheck, ScrollText,
  LogOut, Zap, ChevronLeft, ChevronRight, Menu, X, GitBranch, CalendarClock,
  Sun, Moon
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const { user, token, signOut, hasPermission } = useAuth();

  // Section visibility — hide entire group when none of its items are accessible
  const hasMasterDataSection = hasPermission("companies", "read") ||
                               hasPermission("services",  "read") ||
                               hasPermission("settings",  "read");
  const hasAdminSection      = hasPermission("reports",  "read") ||
                               hasPermission("team",     "read") ||
                               hasPermission("settings", "read") ||
                               hasPermission("audit",    "read");
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  // ── Sidebar count badges ──────────────────────────────
  const enabled = !!token;
  const { data: allLeads = [] }     = useGetLeads({ query: { enabled, staleTime: 60_000 } });
  const { data: allCompanies = [] } = useGetCompanies({ query: { enabled, staleTime: 60_000 } });
  const { data: allServices = [] }  = useGetServices({ query: { enabled, staleTime: 60_000 } });

  const followUpCount = (allLeads as any[]).filter((l: any) => {
    if (!l.activeFollowUpDate) return false;
    const d = new Date(l.activeFollowUpDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d <= today;
  }).length;

  const companiesCount = (allCompanies as any[]).length;
  const servicesCount  = (allServices as any[]).length;

  const fmtBadge = (n: number) => n > 99 ? "99+" : String(n);

  const NavItem = ({ href, icon: Icon, label, badge }: { href: string; icon: any; label: string; badge?: number }) => {
    const active = location === href || (href !== "/" && location.startsWith(href));
    return (
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : "var(--space-3)",
          padding: collapsed ? "var(--space-3)" : "var(--space-2) var(--space-3)",
          borderRadius: active ? "0 var(--radius-md) var(--radius-md) 0" : "var(--radius-md)",
          textDecoration: "none",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          fontFamily: "var(--font-sans)",
          color: active ? "var(--teal)" : "var(--text-secondary)",
          background: active ? "hsl(172 75% 48% / 0.08)" : "transparent",
          borderLeft: active ? "2px solid var(--teal)" : "2px solid transparent",
          marginLeft: active ? 0 : 0,
          transition: "background 150ms ease, color 150ms ease",
          position: "relative",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = theme === "light" ? "hsl(210 16% 90%)" : "hsl(222 16% 16%)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        <span style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          color: active ? "var(--teal)" : "var(--text-secondary)",
        }}>
          <Icon size={18} />
        </span>
        {!collapsed && (
          <>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {label}
            </span>
            {!!badge && badge > 0 && (
              <span style={{
                flexShrink: 0,
                minWidth: 20,
                height: 18,
                padding: "0 6px",
                borderRadius: 999,
                background: "hsl(172 75% 48% / 0.12)",
                border: "1px solid hsl(172 75% 48% / 0.3)",
                color: "var(--teal)",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}>
                {fmtBadge(badge)}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  const SectionLabel = ({ title }: { title: string }) => (
    collapsed ? (
      <div style={{
        height: 1,
        background: "var(--border-subtle)",
        margin: "var(--space-2) var(--space-3)",
      }} />
    ) : (
      <div style={{
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        padding: "var(--space-3) var(--space-3) var(--space-1)",
        fontFamily: "var(--font-sans)",
      }}>
        {title}
      </div>
    )
  );

  const initials = (name?: string | null) =>
    name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`} style={{ padding: 0, display: "flex", flexDirection: "column" }}>
        {/* Brand */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : "var(--space-3)",
          padding: collapsed ? "var(--space-4) var(--space-3)" : "var(--space-4) var(--space-4)",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "hsl(172 75% 48% / 0.12)",
            border: "1px solid hsl(172 75% 48% / 0.3)",
            borderRadius: "var(--radius-md)",
            flexShrink: 0,
          }}>
            <Zap size={16} style={{ color: "var(--teal)" }} />
          </div>
          {!collapsed && (
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-base)",
              fontWeight: 800,
              color: "var(--teal)",
              letterSpacing: "-0.01em",
              filter: "drop-shadow(0 0 8px hsl(172 75% 48% / 0.35))",
            }}>
              LeadFlow
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-3) var(--space-2)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          <SectionLabel title="Main" />
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/kanban" icon={Kanban} label="Kanban Board" />
          <PermissionCheck resource="leads" action="create">
            <NavItem href="/leads/new" icon={PlusCircle} label="New Lead" />
          </PermissionCheck>
          <NavItem href="/follow-up" icon={CalendarClock} label="Follow Up" badge={followUpCount} />

          {hasMasterDataSection && (
            <>
              <SectionLabel title="Master Data" />
              <PermissionCheck resource="companies" action="read">
                <NavItem href="/master/companies" icon={Building2} label="Companies" badge={companiesCount} />
              </PermissionCheck>
              <PermissionCheck resource="services" action="read">
                <NavItem href="/master/services" icon={Briefcase} label="Services" badge={servicesCount} />
              </PermissionCheck>
              <PermissionCheck resource="settings" action="read">
                <NavItem href="/master/pipeline" icon={GitBranch} label="Pipeline" />
              </PermissionCheck>
            </>
          )}

          {hasAdminSection && (
            <>
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
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border-subtle)",
          padding: "var(--space-3) var(--space-3)",
        }}>
          {!collapsed ? (
            <>
              <Link href="/profile" style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "var(--space-2)",
                textDecoration: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px",
                margin: "-4px -4px var(--space-2) -4px",
                transition: "background 150ms ease",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "hsl(172 75% 48% / 0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                title="View profile"
              >
                <div className="avatar" style={{ flexShrink: 0 }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : initials(user?.displayName)
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {user?.displayName}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {user?.email}
                  </div>
                </div>
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span className={`badge badge-admin`} style={{ textTransform: "none", flex: 1, justifyContent: "center" }}>
                  {user?.role?.replace("_", " ")}
                </span>
                <button
                  onClick={toggleTheme}
                  className="btn btn-ghost btn-icon"
                  title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                  style={{ width: 28, height: 28 }}
                >
                  {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                </button>
                <button
                  onClick={() => setCollapsed(true)}
                  className="btn btn-ghost btn-icon"
                  title="Collapse sidebar"
                  style={{ width: 28, height: 28 }}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={signOut}
                  className="btn btn-ghost btn-icon"
                  title="Sign out"
                  style={{ color: "var(--danger)", width: 28, height: 28 }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
              <Link href="/profile" title="View profile" style={{ textDecoration: "none" }}>
                <div className="avatar avatar-sm" style={{ cursor: "pointer", transition: "box-shadow 150ms ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px hsl(172 75% 48% / 0.5)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                >
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : initials(user?.displayName)
                  }
                </div>
              </Link>
              <button
                onClick={toggleTheme}
                className="btn btn-ghost btn-icon"
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
              </button>
              <button
                onClick={() => setCollapsed(false)}
                className="btn btn-ghost btn-icon"
                title="Expand sidebar"
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={signOut}
                className="btn btn-ghost btn-icon"
                title="Sign out"
                style={{ color: "var(--danger)" }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile-only sticky header */}
        <header className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "var(--text-base)",
              color: "var(--teal)",
              letterSpacing: "-0.01em",
            }}>
              LeadFlow
            </span>
          </div>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
            {user?.displayName?.[0] ?? "?"}
          </div>
        </header>
        {children}
      </main>

      {/* Floating Action Button — create lead from any page */}
      <PermissionCheck resource="leads" action="create">
        <button
          onClick={() => setFabOpen(true)}
          title="Create Lead"
          aria-label="Create Lead"
          style={{
            position: "fixed",
            bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
            right: "calc(24px + env(safe-area-inset-right, 0px))",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--teal)",
            color: "hsl(222 22% 6%)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 24px hsl(172 75% 48% / 0.45), 0 2px 8px hsl(222 22% 3% / 0.4)",
            zIndex: 9990,
            transition: "transform 150ms ease, box-shadow 150ms ease, filter 150ms ease",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 6px 32px hsl(172 75% 48% / 0.6), 0 2px 12px hsl(222 22% 3% / 0.5)";
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 24px hsl(172 75% 48% / 0.45), 0 2px 8px hsl(222 22% 3% / 0.4)";
            e.currentTarget.style.filter = "none";
          }}
        >
          <PlusCircle size={24} />
        </button>
      </PermissionCheck>

      <CreateLeadDrawer open={fabOpen} onClose={() => setFabOpen(false)} />
    </div>
  );
}
