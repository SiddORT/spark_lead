import { useState } from "react";
import {
  useGetTeamMembers, useUpdateTeamMember, useDeleteTeamMember,
  useInviteUser, useGetAccessRequests, useApproveAccessRequest, useRejectAccessRequest,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch, Dialog } from "@/components/ui";
import { format } from "date-fns";
import {
  PlusCircle, Search, Mail, CheckCircle, XCircle, Trash2,
  Users, ShieldCheck, UserCheck, Bell,
} from "lucide-react";
import { useAuth, PermissionCheck } from "@/components/auth-provider";
import { toast } from "sonner";

const ROLE_BADGE: Record<string, string> = {
  admin:        "badge-admin",
  lead_owner:   "badge-lead-owner",
  deal_handler: "badge-deal-handler",
  manager:      "badge-teal",
  member:       "badge-muted",
};

export function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const { data: members = [] } = useGetTeamMembers();
  const { data: pendingRequests = [] } = useGetAccessRequests({ status: "pending" }, { query: { enabled: isAdmin } });

  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const inviteUser = useInviteUser();
  const approveRequest = useApproveAccessRequest();
  const rejectRequest = useRejectAccessRequest();

  const [activeTab, setActiveTab] = useState<"members" | "requests">("members");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "deal_handler" });

  const filteredMembers = members.filter(m =>
    (m.displayName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || m.role === roleFilter)
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate({ data: inviteData as any }, {
      onSuccess: () => {
        toast.success("User invited successfully");
        setInviteOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleRoleChange = (id: string, role: string) => {
    updateMember.mutate({ id, data: { role: role as any } }, {
      onSuccess: () => { toast.success("Role updated"); queryClient.invalidateQueries({ queryKey: ["/api/team/members"] }); },
    });
  };

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    updateMember.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => { toast.success(`User ${newStatus}`); queryClient.invalidateQueries({ queryKey: ["/api/team/members"] }); },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently delete user? This cannot be undone.")) {
      deleteMember.mutate({ id }, {
        onSuccess: () => { toast.success("User deleted"); queryClient.invalidateQueries({ queryKey: ["/api/team/members"] }); },
        onError: (err: any) => toast.error(err.message),
      });
    }
  };

  const handleRequestAction = (id: string, action: "approve" | "reject") => {
    const mutation = action === "approve" ? approveRequest : rejectRequest;
    mutation.mutate({ id }, {
      onSuccess: () => {
        toast.success(`Request ${action}d`);
        queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      },
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Users size={28} style={{ color: "var(--teal)" }} />
            Team Management
          </h1>
          <p className="page-subtitle">Manage users, roles and access requests</p>
        </div>
        <div className="page-actions">
          <PermissionCheck resource="team" action="create">
            <button className="btn btn-primary" onClick={() => setInviteOpen(true)}>
              <PlusCircle size={15} /> Invite User
            </button>
          </PermissionCheck>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <TeamStatCard label="Total Members" value={members.length} icon={<Users size={16} />} iconClass="stat-icon-teal" />
        <TeamStatCard label="Admins" value={members.filter(m => m.role === "admin").length} icon={<ShieldCheck size={16} />} iconClass="stat-icon-purple" />
        <TeamStatCard label="Lead Owners" value={members.filter(m => m.role === "lead_owner").length} icon={<UserCheck size={16} />} iconClass="stat-icon-success" />
        {isAdmin && (
          <TeamStatCard label="Pending Requests" value={pendingRequests.length} icon={<Bell size={16} />} iconClass="stat-icon-warning" />
        )}
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="page-tabs">
          <button className={`page-tab${activeTab === "members" ? " active" : ""}`} onClick={() => setActiveTab("members")}>
            Members ({members.length})
          </button>
          <button className={`page-tab${activeTab === "requests" ? " active" : ""}`} onClick={() => setActiveTab("requests")}>
            Access Requests
            {pendingRequests.length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: "var(--space-2)" }}>{pendingRequests.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Members table */}
      {activeTab === "members" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={15} />
              <input
                className="input"
                placeholder="Search members…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input"
              style={{ width: 160 }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="lead_owner">Lead Owner</option>
              <option value="deal_handler">Deal Handler</option>
              <option value="member">Member</option>
            </select>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                {isAdmin && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => (
                <tr key={m.id} style={{ cursor: "default" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <div className="avatar">{m.displayName[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{m.displayName}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Mail size={10} /> {m.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {isAdmin && m.id !== user?.id ? (
                      <select
                        className="input"
                        style={{ height: 30, fontSize: "var(--text-xs)", width: 140 }}
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="lead_owner">Lead Owner</option>
                        <option value="deal_handler">Deal Handler</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className={`badge ${ROLE_BADGE[m.role] || "badge-muted"}`}>
                        {m.role.replace("_", " ")}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span className={`badge ${m.whitelistStatus === "active" ? "badge-success" : "badge-danger"}`}>
                        {m.whitelistStatus}
                      </span>
                      {isAdmin && m.id !== user?.id && (
                        <Switch
                          checked={m.whitelistStatus === "active"}
                          onCheckedChange={() => handleStatusToggle(m.id, m.whitelistStatus)}
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {format(new Date(m.joinedAt), "MMM d, yyyy")}
                  </td>
                  {isAdmin && (
                    <td>
                      {m.id !== user?.id && (
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => handleDelete(m.id)}
                          style={{ color: "var(--danger)" }}
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr style={{ cursor: "default" }}>
                  <td colSpan={isAdmin ? 5 : 4}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><Users size={20} /></div>
                      <div className="empty-state-title">No members found</div>
                      <div className="empty-state-desc">Adjust your search or invite team members</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Access requests */}
      {activeTab === "requests" && isAdmin && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Department</th>
                <th>Reason</th>
                <th>Requested</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map(r => (
                <tr key={r.id} style={{ cursor: "default" }}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{r.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{r.email}</div>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{r.department || "—"}</td>
                  <td style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.reason || "—"}
                  </td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRequestAction(r.id, "approve")}>
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRequestAction(r.id, "reject")}>
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr style={{ cursor: "default" }}>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><CheckCircle size={20} /></div>
                      <div className="empty-state-title">All clear</div>
                      <div className="empty-state-desc">No pending access requests</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <div className="modal-title">Invite User</div>
        <div className="modal-desc">Send an invitation email to add them to the whitelist.</div>
        <form onSubmit={handleInvite}>
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input
              className="input"
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteData.email}
              onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="input-label">Initial Role</label>
            <select
              className="input select-field"
              value={inviteData.role}
              onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="lead_owner">Lead Owner</option>
              <option value="deal_handler">Deal Handler</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={inviteUser.isPending}>
              <Mail size={15} /> Send Invite
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function TeamStatCard({ label, value, icon, iconClass }: { label: string; value: number; icon: React.ReactNode; iconClass: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
