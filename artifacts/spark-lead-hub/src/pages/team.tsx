import { useState, useMemo, useEffect } from "react";
import {
  useGetTeamMembers, useUpdateTeamMember, useDeleteTeamMember,
  useInviteUser, useGetAccessRequests, useApproveAccessRequest, useRejectAccessRequest,
  useResendPasswordLink, useGeneratePasswordLink,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch, Dialog } from "@/components/ui";
import { CustomSelect } from "@/components/custom-select";
import { TablePagination } from "@/components/table-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import {
  PlusCircle, Search, Mail, CheckCircle, XCircle, Trash2,
  Users, ShieldCheck, UserCheck, Bell, X, Copy, Link2, KeyRound, Loader2, ClipboardCopy,
} from "lucide-react";
import { useAuth, PermissionCheck } from "@/components/auth-provider";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "admin",   label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member",  label: "Member" },
];

const ROLE_BADGE: Record<string, string> = {
  admin:        "badge-admin",
  manager:      "badge-teal",
  member:       "badge-muted",
  lead_owner:   "badge-lead-owner",
  deal_handler: "badge-deal-handler",
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
  const resendLink = useResendPasswordLink();
  const generateLink = useGeneratePasswordLink();

  const [activeTab, setActiveTab] = useState<"members" | "requests">("members");
  const [searchRaw, setSearchRaw] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "manager" });
  const [pendingLink, setPendingLink] = useState<{ url: string; email: string; emailSent: boolean } | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const search = useDebounce(searchRaw, 300);
  const hasFilters = !!(searchRaw || roleFilter);

  useEffect(() => { setPage(1); }, [search, roleFilter, activeTab]);

  const filteredMembers = useMemo(() =>
    members.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || m.displayName.toLowerCase().includes(q)
        || m.email.toLowerCase().includes(q);
      const matchRole = !roleFilter || m.role === roleFilter;
      return matchSearch && matchRole;
    }),
    [members, search, roleFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const paginatedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const emailBeingInvited = inviteData.email;
    inviteUser.mutate({ data: inviteData as any }, {
      onSuccess: (res: any) => {
        setInviteOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
        if (res?.setPasswordUrl) {
          setPendingLink({ url: res.setPasswordUrl, email: emailBeingInvited, emailSent: !!res.emailSent });
        } else {
          toast.success("User invited successfully");
        }
        setInviteData({ email: "", role: "deal_handler" });
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

  const handleResendLink = (id: string, email: string) => {
    setResendingId(id);
    resendLink.mutate({ id }, {
      onSuccess: (res: any) => {
        setResendingId(null);
        if (res?.emailSent) {
          toast.success("Password setup link sent successfully");
        } else {
          setPendingLink({ url: res?.setPasswordUrl || "", email, emailSent: false });
        }
      },
      onError: () => {
        setResendingId(null);
        toast.error("Failed to send reset link. Please try again.");
      },
    });
  };

  const handleCopyLink = (id: string) => {
    setCopyingId(id);
    generateLink.mutate({ id }, {
      onSuccess: async (res: any) => {
        setCopyingId(null);
        const url: string = res?.setPasswordUrl || "";
        if (!url) { toast.error("Failed to generate link"); return; }
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Password setup link copied to clipboard");
        } catch {
          setPendingLink({ url, email: "", emailSent: false });
        }
      },
      onError: () => {
        setCopyingId(null);
        toast.error("Failed to generate link. Please try again.");
      },
    });
  };

  const handleRequestAction = (id: string, action: "approve" | "reject", userEmail?: string) => {
    const mutation = action === "approve" ? approveRequest : rejectRequest;
    mutation.mutate({ id }, {
      onSuccess: (res: any) => {
        queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
        if (action === "approve" && res?.setPasswordUrl) {
          setPendingLink({ url: res.setPasswordUrl, email: userEmail || "", emailSent: !!res.emailSent });
        } else {
          toast.success(`Request ${action}d`);
        }
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
        <TeamStatCard label="Managers" value={members.filter(m => m.role === "manager").length} icon={<UserCheck size={16} />} iconClass="stat-icon-success" />
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
            <div className="search-input-wrapper" style={{ flex: "1 1 200px" }}>
              <Search size={15} />
              <input
                className="input"
                placeholder="Search members…"
                value={searchRaw}
                onChange={e => setSearchRaw(e.target.value)}
              />
            </div>
            <CustomSelect
              value={roleFilter || null}
              onChange={val => setRoleFilter(val)}
              placeholder="All Roles"
              options={ROLE_OPTIONS}
              className="cselect-filter"
            />
            {hasFilters && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearchRaw(""); setRoleFilter(""); }}
                style={{ color: "var(--danger)", border: "1px solid var(--danger-dim)" }}
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>

          <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                {isAdmin && <th style={{ width: 130 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map(m => (
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
                      <CustomSelect
                        value={m.role}
                        onChange={val => handleRoleChange(m.id, val)}
                        options={ROLE_OPTIONS}
                        className="cselect-sm"
                      />
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
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Resend password setup link"
                          disabled={resendingId === m.id}
                          onClick={() => handleResendLink(m.id, m.email)}
                          style={{ color: "var(--teal)" }}
                        >
                          {resendingId === m.id
                            ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                            : <KeyRound size={15} />
                          }
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Copy password setup link"
                          disabled={copyingId === m.id}
                          onClick={() => handleCopyLink(m.id)}
                          style={{ color: "var(--text-muted)" }}
                        >
                          {copyingId === m.id
                            ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                            : <ClipboardCopy size={15} />
                          }
                        </button>
                        {m.id !== user?.id && (
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Delete member"
                            onClick={() => handleDelete(m.id)}
                            style={{ color: "var(--danger)" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedMembers.length === 0 && (
                <tr style={{ cursor: "default" }}>
                  <td colSpan={isAdmin ? 5 : 4}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><Users size={20} /></div>
                      <div className="empty-state-title">No members found</div>
                      <div className="empty-state-desc">
                        {hasFilters ? "No members match your filters." : "Invite team members to get started."}
                      </div>
                      {hasFilters && (
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={() => { setSearchRaw(""); setRoleFilter(""); }}>
                          <X size={13} /> Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <TablePagination
            page={page}
            totalPages={totalPages}
            total={filteredMembers.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      )}

      {/* Access requests */}
      {activeTab === "requests" && isAdmin && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Department</th>
                <th>Reason</th>
                <th>Requested</th>
                <th style={{ width: 200 }}>Actions</th>
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
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRequestAction(r.id, "approve", r.email)}>
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
        </div>
      )}

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <div className="modal-head">
          <div className="modal-head-left">
            <div className="modal-head-icon teal"><Users size={16} /></div>
            <div>
              <div className="modal-title">Invite User</div>
              <div className="modal-subtitle">Send a setup link to add them to the workspace</div>
            </div>
          </div>
          <button className="modal-close" onClick={() => setInviteOpen(false)}><X size={15} /></button>
        </div>
        <form onSubmit={handleInvite}>
          <div className="modal-body">
            <div className="form-field">
              <label className="field-label">Email Address <span className="req">*</span></label>
              <input
                className="field-input"
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteData.email}
                onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
              />
              <span className="field-helper">An invitation email with a password setup link will be sent</span>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Initial Role</label>
              <CustomSelect
                value={inviteData.role}
                onChange={val => setInviteData({ ...inviteData, role: val })}
                options={ROLE_OPTIONS}
              />
              <span className="field-helper">This can be changed later from Team Management</span>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={inviteUser.isPending}>
              {inviteUser.isPending ? <><div className="spinner-sm" /> Sending…</> : <><Mail size={15} /> Send Invite</>}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Set-password link dialog */}
      <Dialog open={!!pendingLink} onOpenChange={() => setPendingLink(null)}>
        <div className="modal-head">
          <div className="modal-head-left">
            <div className={`modal-head-icon ${pendingLink?.emailSent ? "success" : "warning"}`}>
              {pendingLink?.emailSent ? <CheckCircle size={16} /> : <Link2 size={16} />}
            </div>
            <div>
              <div className="modal-title">{pendingLink?.emailSent ? "Invitation Sent!" : "Share Set-Password Link"}</div>
              <div className="modal-subtitle">
                {pendingLink?.emailSent
                  ? `Email dispatched to ${pendingLink?.email}`
                  : `Share this link with ${pendingLink?.email}`}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={() => setPendingLink(null)}><X size={15} /></button>
        </div>
        <div className="modal-body">
          {!pendingLink?.emailSent && (
            <div style={{
              background: "var(--warning-dim)", border: "1px solid hsla(36, 88%, 52%, 0.3)",
              borderRadius: "var(--r-md)", padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-4)",
            }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--warning)", margin: 0, lineHeight: 1.5 }}>
                Email delivery failed — share this link directly via Slack, WhatsApp, or any channel.
              </p>
            </div>
          )}
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--sp-3)", lineHeight: 1.65 }}>
            You can also share the setup link directly if the email doesn't arrive:
          </p>
          <div className="invite-link-box">
            <code className="invite-link-url">{pendingLink?.url || ""}</code>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => { navigator.clipboard.writeText(pendingLink?.url || ""); toast.success("Link copied!"); }}
              title="Copy link"
            >
              <Copy size={13} />
            </button>
          </div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4, marginTop: "var(--sp-2)" }}>
            🕐 This link expires in 24 hours
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setPendingLink(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => {
            navigator.clipboard.writeText(pendingLink?.url || "");
            toast.success("Link copied!");
            setPendingLink(null);
          }}>
            <Copy size={14} /> Copy Link &amp; Close
          </button>
        </div>
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
