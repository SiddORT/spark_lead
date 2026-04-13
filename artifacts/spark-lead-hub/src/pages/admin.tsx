import {
  useGetPermissions, useUpdatePermission,
  useGetAuditLog, useSendTestActivityEmail, useSendTestPasswordEmail,
} from "@workspace/api-client-react";
import { Switch } from "@/components/ui";
import { format } from "date-fns";
import { ShieldCheck, ScrollText, Mail, Activity, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";

export function Permissions() {
  const { user } = useAuth();
  const { data: permissions = [] } = useGetPermissions();
  const updatePermission = useUpdatePermission();
  const sendActivity = useSendTestActivityEmail();
  const sendPassword = useSendTestPasswordEmail();

  if (user?.role !== "admin") {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon"><ShieldCheck size={20} /></div>
          <div className="empty-state-title">Access Restricted</div>
          <div className="empty-state-desc">Only admins can view and manage permissions.</div>
        </div>
      </div>
    );
  }

  const grouped = permissions.reduce((acc: any, p) => {
    if (!acc[p.resource]) acc[p.resource] = {};
    if (!acc[p.resource][p.action]) acc[p.resource][p.action] = {};
    acc[p.resource][p.action][p.roleName] = p;
    return acc;
  }, {});

  const roles = ["manager", "member"];

  const handleToggle = (perm: any) => {
    updatePermission.mutate({ data: { ...perm, allowed: !perm.allowed } }, {
      onSuccess: () => toast.success("Permission updated"),
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <ShieldCheck size={28} style={{ color: "var(--teal)" }} />
            Role Permissions
          </h1>
          <p className="page-subtitle">Granular access control per resource. Admin role always has full access.</p>
        </div>
      </div>

      <div className="permissions-grid">
        {Object.entries(grouped).map(([resource, actions]: [string, any]) => (
          <div key={resource} className="permission-section">
            <div className="permission-section-header">
              <span className="permission-section-dot" />
              <span className="permission-section-title" style={{ textTransform: "capitalize" }}>{resource}</span>
            </div>
            <table className="permission-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Action</th>
                  <th>Admin</th>
                  {roles.map(r => (
                    <th key={r}>{r.replace("_", " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(actions).map(([action, rolePerms]: [string, any]) => (
                  <tr key={action}>
                    <td style={{ textAlign: "left", color: "var(--text-secondary)", textTransform: "capitalize", fontWeight: 500 }}>{action}</td>
                    <td style={{ textAlign: "center" }}>
                      <Switch checked disabled />
                    </td>
                    {roles.map(r => {
                      const perm = rolePerms[r];
                      if (!perm) return <td key={r} style={{ textAlign: "center", color: "var(--text-muted)" }}>—</td>;
                      return (
                        <td key={r} style={{ textAlign: "center" }}>
                          <Switch checked={perm.allowed} onCheckedChange={() => handleToggle(perm)} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="diagnostics-section">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
          <Settings size={18} style={{ color: "var(--teal)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)" }}>
            System Diagnostics
          </span>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>
          Test the email integration by triggering sample emails to your admin address.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            className="btn btn-secondary"
            onClick={() => sendPassword.mutate(undefined, { onSuccess: () => toast.success("Test password email sent") })}
          >
            <Mail size={15} /> Test Password Email
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => sendActivity.mutate(undefined, { onSuccess: () => toast.success("Test activity email sent") })}
          >
            <Activity size={15} /> Test Activity Alert
          </button>
        </div>
      </div>
    </div>
  );
}

const ACTION_COLOR: Record<string, string> = {
  delete: "var(--danger)",
  reject: "var(--danger)",
  permission: "var(--warning)",
  role: "var(--warning)",
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_COLOR)) {
    if (action.includes(key)) return color;
  }
  return "var(--teal)";
}

export function AuditLog() {
  const { data: logs = [] } = useGetAuditLog();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <ScrollText size={28} style={{ color: "var(--teal)" }} />
            System Audit Log
          </h1>
          <p className="page-subtitle">Complete history of all actions performed in the system</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ cursor: "default" }}>
                <td style={{ whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {format(new Date(log.createdAt), "MMM d, yy HH:mm:ss")}
                </td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{log.actorName}</td>
                <td style={{ color: getActionColor(log.action), fontFamily: "monospace", fontSize: "var(--text-xs)" }}>{log.action}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                  {log.resource}
                  {log.resourceId && <span style={{ opacity: 0.5, marginLeft: "var(--space-1)" }}>{log.resourceId.slice(0, 8)}…</span>}
                </td>
                <td style={{ color: "var(--text-muted)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-xs)" }}>
                  {log.details ? JSON.stringify(log.details) : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr style={{ cursor: "default" }}>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ScrollText size={20} /></div>
                    <div className="empty-state-title">No audit logs</div>
                    <div className="empty-state-desc">System actions will appear here as they happen</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
