import { useState } from "react";
import {
  useGetPermissions, useUpdatePermission,
  useGetAuditLog, useSendTestActivityEmail, useSendTestPasswordEmail,
  getGetPermissionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui";
import { format } from "date-fns";
import { ShieldCheck, ScrollText, Mail, Activity, Settings, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";

// Actions that depend on "read" being enabled — if read is OFF these must also be blocked
const READ_DEPENDENTS = ["create", "update", "delete", "export"];

export function Permissions() {
  const { user } = useAuth();
  const { data: permissions = [], isLoading } = useGetPermissions();
  const updatePermission = useUpdatePermission();
  const queryClient = useQueryClient();
  const sendPassword = useSendTestPasswordEmail();
  const sendActivity = useSendTestActivityEmail();

  // Track which specific perm is in-flight: "roleName::resource::action"
  const [saving, setSaving] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-desc" style={{ color: "var(--text-muted)" }}>Loading permissions…</div>
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

  // Returns true if "read" for this role+resource is currently OFF
  const isReadBlocked = (resource: string, roleName: string): boolean => {
    const readPerm = grouped[resource]?.["read"]?.[roleName];
    return readPerm ? !readPerm.allowed : false;
  };

  const handleToggle = (perm: any) => {
    const key = `${perm.roleName}::${perm.resource}::${perm.action}`;
    if (saving) return; // prevent concurrent saves
    setSaving(key);

    const newAllowed = !perm.allowed;

    updatePermission.mutate(
      { data: { ...perm, allowed: newAllowed } },
      {
        onSuccess: () => {
          toast.success(
            `${perm.resource}.${perm.action} ${newAllowed ? "enabled" : "disabled"} for ${perm.roleName}`
          );
          // Invalidate the admin's own permission list
          queryClient.invalidateQueries({ queryKey: getGetPermissionsQueryKey() });

          // ── Instant live-sync to affected sessions ───────────────────────
          // 1. Other tabs in the same browser via BroadcastChannel
          try {
            const ch = new BroadcastChannel("rbac-sync");
            ch.postMessage({
              type: "permissions-updated",
              resource: perm.resource,
              action: perm.action,
              role: perm.roleName,
              allowed: newAllowed,
              timestamp: Date.now(),
            });
            ch.close();
          } catch { /* BroadcastChannel not available */ }
          // 2. Same tab (if the admin is also the affected user)
          window.dispatchEvent(new CustomEvent("permissions-updated", {
            detail: { resource: perm.resource, action: perm.action, role: perm.roleName, allowed: newAllowed },
          }));
        },
        onError: () => {
          toast.error("Failed to update permission. Please try again.");
        },
        onSettled: () => setSaving(null),
      }
    );
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

      {/* Info banner */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "var(--space-2)",
        background: "hsl(196 100% 46% / 0.07)",
        border: "1px solid hsl(196 100% 46% / 0.2)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3) var(--space-4)",
        marginBottom: "var(--space-5)",
        fontSize: "var(--text-sm)",
        color: "var(--text-secondary)",
      }}>
        <Info size={15} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 1 }} />
        <span>
          Changes take effect <strong style={{ color: "var(--text-primary)" }}>instantly</strong> — permission toggles broadcast to all open sessions in real-time via live sync.
          Protected routes, menus, buttons, and data queries update without refresh or re-login.
        </span>
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
                      <Switch checked disabled title="Admin always has full access" />
                    </td>
                    {roles.map(r => {
                      const perm = rolePerms[r];
                      if (!perm) return <td key={r} style={{ textAlign: "center", color: "var(--text-muted)" }}>—</td>;

                      const key = `${r}::${resource}::${action}`;
                      const isSaving = saving === key;

                      // Dependency rule: write/delete/export requires read to be ON
                      const readBlocked = READ_DEPENDENTS.includes(action) && isReadBlocked(resource, r);
                      const isDisabled = isSaving || !!saving || readBlocked;

                      return (
                        <td key={r} style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                            <Switch
                              checked={perm.allowed}
                              onCheckedChange={() => handleToggle(perm)}
                              disabled={isDisabled}
                              title={
                                readBlocked
                                  ? `Enable Read permission for ${r} first`
                                  : isSaving
                                  ? "Saving…"
                                  : undefined
                              }
                              style={{
                                opacity: isSaving ? 0.6 : readBlocked ? 0.35 : 1,
                                transition: "opacity 150ms ease",
                              }}
                            />
                            {readBlocked && (
                              <Lock
                                size={11}
                                style={{ color: "var(--text-muted)", flexShrink: 0 }}
                                title={`Enable Read permission for ${r} first`}
                              />
                            )}
                          </div>
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
            Audit Log
          </h1>
          <p className="page-subtitle">Complete history of all actions performed in the system</p>
        </div>
      </div>
      <div className="table-wrapper">
        <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="empty-state">
                  <div className="empty-state-icon"><ScrollText size={20} /></div>
                  <div className="empty-state-title">No audit logs yet</div>
                  <div className="empty-state-desc">System actions will appear here as they happen</div>
                </div>
              </td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id}>
                <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                  {format(new Date(log.createdAt), "MMM d, HH:mm")}
                </td>
                <td style={{ fontWeight: 500 }}>{log.userEmail || log.userId?.slice(0, 8)}</td>
                <td style={{ color: getActionColor(log.action), fontFamily: "monospace", fontSize: "var(--text-xs)" }}>{log.action}</td>
                <td>
                  {log.resource}
                  {log.resourceId && <span style={{ opacity: 0.5, marginLeft: "var(--space-1)" }}>{log.resourceId.slice(0, 8)}…</span>}
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.details ? JSON.stringify(log.details) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
