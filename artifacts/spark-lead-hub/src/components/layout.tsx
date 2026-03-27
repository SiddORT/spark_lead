import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth, PermissionCheck } from "./auth-provider";
import { 
  LayoutDashboard, Kanban, PlusCircle, Building, 
  Briefcase, BarChart2, Users, ShieldAlert, FileText, 
  LogOut, Zap, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Badge, Button } from "./ui";

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const active = location === href || (href !== '/' && location.startsWith(href));
    return (
      <Link href={href} className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/50",
        active ? "bg-primary/10 text-primary font-medium neon-glow-sm" : "text-muted-foreground",
        collapsed && "justify-center px-0"
      )}>
        <Icon size={20} className={cn("flex-shrink-0", active && "text-primary")} />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-4">
      {!collapsed && <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className={cn("glass-strong border-r border-border transition-all duration-300 flex flex-col z-40 relative", collapsed ? "w-[72px]" : "w-[260px]")}>
        <div className="p-5 flex items-center gap-3 border-b border-border/50 h-16">
          <Zap className="h-6 w-6 text-primary neon-glow flex-shrink-0" />
          {!collapsed && <span className="font-display font-bold text-xl tracking-wider">LeadFlow</span>}
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 flex flex-col px-3 hide-scrollbar">
          <NavSection title="Main">
            <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/kanban" icon={Kanban} label="Kanban Board" />
            <PermissionCheck resource="leads" action="create">
              <NavItem href="/leads/new" icon={PlusCircle} label="New Lead" />
            </PermissionCheck>
          </NavSection>

          <NavSection title="Master Data">
            <PermissionCheck resource="companies" action="read">
              <NavItem href="/master/companies" icon={Building} label="Companies" />
            </PermissionCheck>
            <PermissionCheck resource="services" action="read">
              <NavItem href="/master/services" icon={Briefcase} label="Services" />
            </PermissionCheck>
          </NavSection>

          <NavSection title="Administration">
            <PermissionCheck resource="reports" action="read">
              <NavItem href="/analytics" icon={BarChart2} label="Analytics" />
            </PermissionCheck>
            <PermissionCheck resource="team" action="read">
              <NavItem href="/team" icon={Users} label="Team" />
            </PermissionCheck>
            <PermissionCheck resource="settings" action="read">
              <NavItem href="/settings/permissions" icon={ShieldAlert} label="Permissions" />
            </PermissionCheck>
            <PermissionCheck resource="audit" action="read">
              <NavItem href="/audit" icon={FileText} label="Audit Log" />
            </PermissionCheck>
          </NavSection>
        </div>

        <div className="p-4 border-t border-border/50 flex flex-col gap-4 bg-card/30">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center p-2 rounded-md hover:bg-border/50 transition-colors self-end w-full">
            {collapsed ? <ChevronRight size={18} className="text-muted-foreground" /> : <ChevronLeft size={18} className="text-muted-foreground" />}
          </button>
          
          {!collapsed && (
            <div className="flex flex-col gap-3 animate-slide-in">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold border border-primary/30 flex-shrink-0">
                  {user?.displayName?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate">{user?.displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-accent text-accent bg-accent/10">{user?.role?.replace('_', ' ')}</Badge>
                <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Sign Out">
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="absolute inset-0 bg-background/95 -z-10" />
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] -z-10 rounded-full mix-blend-screen" />
        {children}
      </main>
    </div>
  );
}
