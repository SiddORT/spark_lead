import { useState, useEffect, useRef } from "react";
import {
  useGetLead, useUpdateLead, useGetLeadNotes, useAddLeadNote,
  useDeleteLeadNote, useGetLeadActivities, useDeleteLead,
  useGetServices, useGetServiceCompanies, getGetLeadsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Check, Send, Clock, Trash2, X, ChevronDown,
  FileText, MessageSquare,
} from "lucide-react";
import { useUserMap } from "@/hooks/use-user-map";
import { useAuth } from "./auth-provider";
import { toast } from "sonner";
import { usePipelineStages } from "@/hooks/use-pipeline";
import { PipelineProgressBar } from "./stage-status-select";
import { CustomSelect } from "./custom-select";

// ─── Helpers ──────────────────────────────────────────
function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.]/g, "")) : val;
  if (isNaN(num)) return String(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const LEAD_TYPE_EMOJI: Record<string, string> = {
  hot: "🔥", warm: "☀️", cold: "🧊", ghosted: "👻",
};

// ─── Company chip multi-select ────────────────────────
function CompanyChipSelect({
  serviceId,
  selectedCompanyIds,
  onToggle,
}: {
  serviceId: string;
  selectedCompanyIds: string[];
  onToggle: (id: string) => void;
}) {
  const { data: companies = [] } = useGetServiceCompanies(serviceId, {
    query: { enabled: !!serviceId },
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedCompanies = companies.filter((c) => selectedCompanyIds.includes(c.id));
  const unselected = companies.filter((c) => !selectedCompanyIds.includes(c.id));

  if (!serviceId) {
    return (
      <div className="company-chip-select" style={{ cursor: "default" }}>
        <span className="company-chip-empty">Select a service first</span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className={`company-chip-select ${open ? "open" : ""}`}
        onClick={() => companies.length > 0 && setOpen((v) => !v)}
        style={{ cursor: companies.length > 0 ? "pointer" : "default" }}
      >
        {selectedCompanies.map((c) => (
          <span key={c.id} className="company-chip">
            {c.name}
            <button
              className="company-chip-x"
              onClick={(e) => { e.stopPropagation(); onToggle(c.id); }}
              title={`Remove ${c.name}`}
            >×</button>
          </span>
        ))}
        {selectedCompanies.length === 0 && (
          <span className="company-chip-empty">
            {companies.length === 0 ? "No companies linked to this service" : "Click to select companies…"}
          </span>
        )}
        {companies.length > 0 && (
          <ChevronDown
            size={14}
            style={{
              marginLeft: "auto",
              color: "var(--text-muted)",
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 150ms ease",
            }}
          />
        )}
      </div>
      {open && companies.length > 0 && (
        <div className="company-select-dropdown" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0 }}>
          {companies.map((c) => {
            const isSelected = selectedCompanyIds.includes(c.id);
            return (
              <button
                key={c.id}
                className={`company-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => onToggle(c.id)}
              >
                {c.name}
                {isSelected && <Check size={13} style={{ marginLeft: "auto", flexShrink: 0 }} />}
              </button>
            );
          })}
          {unselected.length === 0 && selectedCompanies.length === companies.length && (
            <div style={{ padding: "8px 10px", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center" }}>
              All companies selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notes section ────────────────────────────────────
function NotesSection({ leadId }: { leadId: string }) {
  const { data: notes } = useGetLeadNotes(leadId);
  const queryClient    = useQueryClient();
  const { user }       = useAuth();
  const [newNote, setNewNote] = useState("");

  const addMutation = useAddLeadNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] });
      setNewNote("");
    },
  });
  const deleteMutation = useDeleteLeadNote({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] }),
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addMutation.mutate({ id: leadId, data: { content: newNote, stageContext: null } });
  };

  const allNotes = notes || [];

  return (
    <div className="notes-tab">
      {/* Input area */}
      <div className="notes-input-wrap">
        <textarea
          className="notes-textarea"
          placeholder="Type a new note…"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
          }}
        />
        <div className="notes-input-footer">
          <span className="notes-hint">⌘ + Enter to submit</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            type="button"
          >
            <Send size={13} /> Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="notes-list">
        {allNotes.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--sp-10) var(--sp-6)" }}>
            <div className="empty-state-icon"><MessageSquare size={20} /></div>
            <div className="empty-state-title">No notes yet</div>
            <div className="empty-state-desc">Add context, follow-up reminders, or any notes about this lead</div>
          </div>
        ) : (
          allNotes.map((n) => (
            <div key={n.id} className="note-item">
              <div className="note-header">
                <div className="note-author">
                  <div className="avatar avatar-sm">{(n.authorName || "?")[0].toUpperCase()}</div>
                  <span className="note-author-name">{n.authorName}</span>
                  <span className="note-time">
                    <Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                    {format(new Date(n.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                {n.userId === user?.id && (
                  <div className="note-actions">
                    <button
                      className="icon-btn"
                      onClick={() => deleteMutation.mutate({ id: leadId, noteId: n.id })}
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <p className="note-content">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Activity log ─────────────────────────────────────
function ActivityLog({ leadId }: { leadId: string }) {
  const { data: activities } = useGetLeadActivities(leadId);
  if (!activities?.length) return null;

  return (
    <div className="activity-log">
      <div className="activity-log-title">Activity Log</div>
      {activities.map((a) => (
        <div key={a.id} className="activity-item">
          <div className="activity-avatar">{(a.actorName || "?")[0].toUpperCase()}</div>
          <div className="activity-content">
            <div className="activity-action">
              {a.fieldName ? (
                <>
                  Updated <strong>{a.fieldName}</strong> from{" "}
                  <em style={{ opacity: 0.7 }}>{a.oldValue || "none"}</em> →{" "}
                  <span className="action-tag">{a.newValue}</span>
                </>
              ) : (
                <><strong>{a.actorName}</strong> created this lead</>
              )}
            </div>
            <div className="activity-time">
              <Clock size={10} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Details tab ──────────────────────────────────────
function DetailsTab({
  lead,
  localStageId,
  localStatusId,
  localServiceId,
  localCompanyIds,
  onStageChange,
  onStatusChange,
  onServiceChange,
  onCompanyToggle,
  handleUpdate,
  stages,
  users,
}: any) {
  const { data: services = [] } = useGetServices();

  const selectedStage = stages.find((s: any) => s.id === localStageId) ?? null;
  const availableStatuses = selectedStage?.statuses?.filter((s: any) => s.isActive) ?? [];

  return (
    <div className="details-section">

      {/* ── Section: Pipeline ── */}
      <div>
        <div className="details-section-label">Pipeline Stage &amp; Status</div>
        <div className="details-row">
          <div className="form-field">
            <label className="field-label">Stage</label>
            <CustomSelect
              value={localStageId}
              placeholder="Select stage…"
              onChange={onStageChange}
              options={stages.filter((s: any) => s.isActive).map((s: any) => ({
                value: s.id,
                label: s.displayName,
                color: s.color,
              }))}
            />
          </div>
          <div className="form-field">
            <label className="field-label">Status</label>
            <CustomSelect
              value={localStatusId}
              placeholder={localStageId ? "Select status…" : "Pick stage first…"}
              disabled={!localStageId}
              onChange={onStatusChange}
              options={availableStatuses.map((s: any) => ({
                value: s.id,
                label: s.displayName,
                color: s.color,
              }))}
            />
          </div>
        </div>
      </div>

      <hr className="details-divider" />

      {/* ── Section: Lead Info ── */}
      <div>
        <div className="details-section-label">Lead Information</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          <div className="form-field">
            <label className="field-label">Lead Name</label>
            <input
              className="field-input"
              defaultValue={lead.leadName}
              onBlur={(e) => handleUpdate("leadName", e.target.value)}
            />
          </div>
          <div className="details-row">
            <div className="form-field">
              <label className="field-label">Lead Type</label>
              <CustomSelect
                value={lead.leadType ?? null}
                placeholder="Select type…"
                onChange={(v) => handleUpdate("leadType", v)}
                options={[
                  { value: "hot",     label: "Hot",     prefix: "🔥" },
                  { value: "warm",    label: "Warm",    prefix: "☀️" },
                  { value: "cold",    label: "Cold",    prefix: "🧊" },
                  { value: "ghosted", label: "Ghosted", prefix: "👻" },
                ]}
              />
            </div>
            <div className="form-field">
              <label className="field-label">Deal Value (₹)</label>
              <input
                className="field-input"
                type="number"
                defaultValue={lead.dealValue || ""}
                onBlur={(e) => handleUpdate("dealValue", e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
          </div>
          <div className="details-row">
            <div className="form-field">
              <label className="field-label">Contact Email</label>
              <input
                className="field-input"
                type="email"
                defaultValue={lead.contactEmail || ""}
                onBlur={(e) => handleUpdate("contactEmail", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="field-label">Phone</label>
              <input
                className="field-input"
                type="tel"
                defaultValue={lead.phone || ""}
                onBlur={(e) => handleUpdate("phone", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="details-divider" />

      {/* ── Section: Service & Companies ── */}
      <div>
        <div className="details-section-label">Service &amp; Companies</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          <div className="form-field">
            <label className="field-label">Service</label>
            <CustomSelect
              value={localServiceId ?? null}
              placeholder="Select a service…"
              onChange={onServiceChange}
              options={services.map((s: any) => ({ value: s.id, label: s.name }))}
            />
          </div>
          <div className="form-field">
            <label className="field-label">Companies</label>
            <CompanyChipSelect
              serviceId={localServiceId || ""}
              selectedCompanyIds={localCompanyIds}
              onToggle={onCompanyToggle}
            />
          </div>
        </div>
      </div>

      <hr className="details-divider" />

      {/* ── Section: Assignment ── */}
      <div>
        <div className="details-section-label">Assignment</div>
        <div className="details-row">
          <div className="form-field">
            <label className="field-label">Lead Owner</label>
            <CustomSelect
              value={lead.leadOwner ?? null}
              placeholder="Unassigned"
              onChange={(v) => handleUpdate("leadOwner", v || null)}
              options={[
                { value: "", label: "Unassigned" },
                ...users
                  .filter((u: any) => ["admin", "lead_owner", "superadmin"].includes(u.role))
                  .map((u: any) => ({
                    value: u.id,
                    label: u.displayName || u.email,
                    prefix: (
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "var(--teal-dim)", color: "var(--teal)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(u.displayName || u.email)[0].toUpperCase()}
                      </span>
                    ),
                  })),
              ]}
            />
          </div>
          <div className="form-field">
            <label className="field-label">Deal Handler</label>
            <CustomSelect
              value={lead.dealHandler ?? null}
              placeholder="Unassigned"
              onChange={(v) => handleUpdate("dealHandler", v || null)}
              options={[
                { value: "", label: "Unassigned" },
                ...users
                  .filter((u: any) => ["admin", "deal_handler", "superadmin"].includes(u.role))
                  .map((u: any) => ({
                    value: u.id,
                    label: u.displayName || u.email,
                    prefix: (
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "var(--teal-dim)", color: "var(--teal)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(u.displayName || u.email)[0].toUpperCase()}
                      </span>
                    ),
                  })),
              ]}
            />
          </div>
        </div>
        <div className="details-row" style={{ marginTop: "var(--sp-4)" }}>
          <div className="form-field">
            <label className="field-label">Follow-up Date</label>
            <input
              className="field-input"
              type="date"
              defaultValue={lead.followUpDate ? lead.followUpDate.split("T")[0] : ""}
              onBlur={(e) => e.target.value && handleUpdate("followUpDate", new Date(e.target.value).toISOString())}
            />
          </div>
          <div className="form-field">
            <label className="field-label">Next Action</label>
            <input
              className="field-input"
              defaultValue={lead.nextAction || ""}
              onBlur={(e) => handleUpdate("nextAction", e.target.value)}
              placeholder="e.g. Follow up call"
            />
          </div>
        </div>
      </div>

      <hr className="details-divider" />

      {/* Activity Log */}
      <ActivityLog leadId={lead.id} />
    </div>
  );
}

// ─── Main sheet component ─────────────────────────────
export function LeadDetailSheet({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: lead }                 = useGetLead(leadId || "", { query: { enabled: !!leadId } });
  const { users }                      = useUserMap();
  const queryClient                    = useQueryClient();
  const { data: pipelineStages = [] }  = usePipelineStages();
  const [activeTab, setActiveTab]      = useState<"details" | "notes">("details");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // ── Local pipeline state — sync on lead change ──
  const [localStageId,    setLocalStageId]    = useState<string | null>(null);
  const [localStatusId,   setLocalStatusId]   = useState<string | null>(null);
  const [localServiceId,  setLocalServiceId]  = useState<string | null>(null);
  const [localCompanyIds, setLocalCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    if (lead) {
      setLocalStageId(lead.pipelineStageId ?? null);
      setLocalStatusId(lead.pipelineStatusId ?? null);
      setLocalServiceId(lead.serviceId ?? null);
      setLocalCompanyIds(lead.companies?.map((c: any) => c.id) ?? []);
    }
  }, [lead?.id, lead?.pipelineStageId, lead?.pipelineStatusId, lead?.serviceId]);

  // ── Body scroll lock + reset confirmation on close ──
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top      = `-${scrollY}px`;
      document.body.style.width    = "100%";
      document.body.style.overflow = "hidden";
    } else {
      setConfirmingDelete(false);
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top      = "";
      document.body.style.width    = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top      = "";
      document.body.style.width    = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  const updateLeadMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
        toast.success("Lead updated");
      },
    },
  });

  const deleteLeadMutation = useDeleteLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        toast.success("Lead deleted");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to delete lead");
        setConfirmingDelete(false);
      },
    },
  });

  const handleDeleteConfirm = () => {
    if (!lead) return;
    deleteLeadMutation.mutate({ id: lead.id });
  };

  const handleUpdate = (field: string, value: any) => {
    if (!lead) return;
    if (lead[field as keyof typeof lead] === value) return;
    updateLeadMutation.mutate({ id: lead.id, data: { [field]: value } });
  };

  const handleStageChange = (stageId: string) => {
    setLocalStageId(stageId || null);
    setLocalStatusId(null);
    if (!lead) return;
    updateLeadMutation.mutate({
      id: lead.id,
      data: { pipelineStageId: stageId || null, pipelineStatusId: null },
    });
  };

  const handleStatusChange = (statusId: string) => {
    setLocalStatusId(statusId || null);
    if (!lead) return;
    updateLeadMutation.mutate({
      id: lead.id,
      data: { pipelineStatusId: statusId || null },
    });
  };

  const handleServiceChange = (serviceId: string) => {
    setLocalServiceId(serviceId || null);
    setLocalCompanyIds([]);
    handleUpdate("serviceId", serviceId || null);
    handleUpdate("companyIds", []);
  };

  const handleCompanyToggle = (companyId: string) => {
    const currentIds = localCompanyIds;
    const newIds = currentIds.includes(companyId)
      ? currentIds.filter((id) => id !== companyId)
      : [...currentIds, companyId];
    setLocalCompanyIds(newIds);
    handleUpdate("companyIds", newIds);
  };

  if (!open) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="lead-sheet-backdrop"
        onClick={() => onOpenChange(false)}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* ── Sheet panel ── */}
      <div className="lead-sheet">

        {/* ── Top bar ── */}
        <div className="sheet-topbar">
          <div className="sheet-lead-identity">
            <h2 className="sheet-lead-name">
              {lead ? lead.leadName : "Loading…"}
            </h2>
            {lead && (
              <div className="sheet-lead-meta">
                {lead.stageName && (
                  <span
                    className="sheet-badge sheet-badge-stage"
                    style={{ "--c": lead.stageColor ?? "var(--teal)" } as React.CSSProperties}
                  >
                    <span className="sheet-badge-dot" />
                    {lead.stageName}
                  </span>
                )}
                {lead.statusName && (
                  <span
                    className="sheet-badge sheet-badge-status"
                    style={{ "--c": lead.statusColor ?? "var(--text-muted)" } as React.CSSProperties}
                  >
                    <span className="sheet-badge-dot" />
                    {lead.statusName}
                  </span>
                )}
                {lead.leadType && (
                  <span className="sheet-badge sheet-badge-type">
                    {LEAD_TYPE_EMOJI[lead.leadType]} {capitalize(lead.leadType)}
                  </span>
                )}
                {lead.dealValue && (
                  <span className="sheet-value-chip">
                    {formatCurrency(lead.dealValue)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions: delete + close */}
          <div className="sheet-topbar-actions">
            {confirmingDelete ? (
              <>
                <span className="sheet-delete-confirm-label">Delete this lead?</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLeadMutation.isPending}
                >
                  {deleteLeadMutation.isPending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleteLeadMutation.isPending}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="sheet-delete-btn"
                onClick={() => setConfirmingDelete(true)}
                aria-label="Delete lead"
                title="Delete lead"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              className="sheet-close-btn"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Pipeline Progress Bar ── */}
        {lead && pipelineStages.length > 0 && (
          <PipelineProgressBar
            stages={pipelineStages}
            currentStageId={localStageId}
            currentStatusId={localStatusId}
          />
        )}

        {/* ── Tabs ── */}
        <div className="sheet-tabs">
          {[
            { id: "details", label: "Details", icon: <FileText size={13} /> },
            { id: "notes",   label: "Notes",   icon: <MessageSquare size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sheet-tab ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id as "details" | "notes")}
              type="button"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="sheet-body">
          {!lead ? (
            <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--text-muted)" }}>
              Loading…
            </div>
          ) : activeTab === "details" ? (
            <DetailsTab
              lead={lead}
              localStageId={localStageId}
              localStatusId={localStatusId}
              localServiceId={localServiceId}
              localCompanyIds={localCompanyIds}
              onStageChange={handleStageChange}
              onStatusChange={handleStatusChange}
              onServiceChange={handleServiceChange}
              onCompanyToggle={handleCompanyToggle}
              handleUpdate={handleUpdate}
              stages={pipelineStages}
              users={users}
            />
          ) : (
            <NotesSection leadId={lead.id} />
          )}
        </div>
      </div>
    </>
  );
}
