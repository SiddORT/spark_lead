import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useGetLead, useUpdateLead, useGetLeadNotes, useAddLeadNote,
  useDeleteLeadNote, useGetLeadActivities, useDeleteLead,
  useGetServices, useGetServiceCompanies, getGetLeadsQueryKey,
  getGetLeadActivitiesQueryKey, getGetLeadQueryKey,
  useGetTeamMembers, useGetCompanies,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, addDays } from "date-fns";
import { formatFullDate } from "@/lib/utils";
import {
  Check, Send, Clock, Trash2, X, ChevronDown,
  FileText, MessageSquare, History, Copy, CalendarClock, Search, AlertTriangle,
  TrendingUp, Folder,
} from "lucide-react";
import { DocumentsTab } from "./documents-tab";
import { useLocation } from "wouter";
import { useUserMap } from "@/hooks/use-user-map";
import { useAuth, PermissionCheck } from "./auth-provider";
import { toast } from "sonner";
import { usePipelineStages } from "@/hooks/use-pipeline";
import { PipelineProgressBar } from "./stage-status-select";
import { CustomSelect } from "./custom-select";
import { LeadTypeBadge } from "./lead-type-badge";
import { leadTypeSelectOptions } from "@/lib/lead-type-config";

// ─── Helpers ──────────────────────────────────────────
function getDefaultFollowUpDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const raw = typeof val === "string" ? parseFloat(val.replace(/[^0-9.]/g, "")) : val;
  if (isNaN(raw)) return String(val);
  const num = Math.round(raw);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}


// ─── Timeline field-label & value-resolution helpers ──
const FIELD_LABELS: Record<string, string> = {
  dealHandler:      "Deal Handler",
  leadOwner:        "Lead Owner",
  serviceId:        "Service",
  company:          "Company",
  companyId:        "Company",
  pipelineStatusId: "Status",
  pipelineStageId:  "Stage",
  dealValue:        "Deal Value",
  leadType:         "Lead Type",
  leadName:         "Lead Name",
  leadReference:    "Lead Reference",
  followUpDate:     "Follow-up Date",
  notes:            "Notes",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
}

function resolveValue(
  field: string,
  raw: string | null | undefined,
  resolveName: (id?: string | null) => string,
  services: any[],
  companies: any[],
  allStatuses: any[],
  allStages: any[],
): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  switch (field) {
    case "dealHandler":
    case "leadOwner":
      return resolveName(raw);
    case "serviceId":
      return services.find((s: any) => s.id === raw)?.name || raw;
    case "company":
    case "companyId":
      return companies.find((c: any) => c.id === raw)?.name || raw;
    case "pipelineStatusId":
      return allStatuses.find((s: any) => s.id === raw)?.displayName || raw;
    case "pipelineStageId":
      return allStages.find((s: any) => s.id === raw)?.displayName || raw;
    case "dealValue": {
      const num = Number(raw);
      return isNaN(num) ? raw : formatCurrency(num);
    }
    default:
      return raw;
  }
}

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
  const { user, token } = useAuth();
  const [newNote, setNewNote]     = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const defaultFollowUpDate = format(addDays(new Date(), 2), "yyyy-MM-dd");
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUpDate);
  const submittingRef  = useRef(false);

  const addMutation = useAddLeadNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] });
        queryClient.invalidateQueries({ queryKey: getGetLeadActivitiesQueryKey(leadId) });
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(leadId) });
        setNewNote("");
        setFollowUpDate(defaultFollowUpDate);
      },
    },
  });
  const deleteMutation = useDeleteLeadNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] });
        queryClient.invalidateQueries({ queryKey: getGetLeadActivitiesQueryKey(leadId) });
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(leadId) });
      },
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim() || submittingRef.current || addMutation.isPending) return;
    submittingRef.current = true;
    addMutation.mutate(
      { id: leadId, data: { content: newNote, stageContext: null, followUpDate: followUpDate || null } as any },
      { onSettled: () => { submittingRef.current = false; } },
    );
  };

  const allNotes = (notes || []).slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filteredNotes = noteSearch.trim()
    ? allNotes.filter((n) => n.content.toLowerCase().includes(noteSearch.toLowerCase()))
    : allNotes;

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
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !addMutation.isPending) handleAddNote();
          }}
        />
        <div className="notes-input-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <CalendarClock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="date"
              className="field-input"
              style={{ fontSize: "var(--text-xs)", padding: "2px 6px", height: "auto", width: 140 }}
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              title={followUpDate ? formatFullDate(followUpDate) : "Follow-up date for this note"}
            />
            {followUpDate && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {formatFullDate(followUpDate)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginLeft: "auto" }}>
            <span className="notes-hint">⌘ + Enter to submit</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || addMutation.isPending}
              type="button"
            >
              <Send size={13} /> {addMutation.isPending ? "Adding…" : "Add Note"}
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {allNotes.length > 0 && (
        <div style={{ padding: "var(--sp-2) var(--sp-4)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              className="field-input"
              style={{ paddingLeft: 28, fontSize: "var(--text-xs)", height: 30 }}
              placeholder="Search notes…"
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--sp-10) var(--sp-6)" }}>
            <div className="empty-state-icon"><MessageSquare size={20} /></div>
            <div className="empty-state-title">{noteSearch ? "No matching notes" : "No notes yet"}</div>
            <div className="empty-state-desc">{noteSearch ? "Try a different search term" : "Add context, follow-up reminders, or any notes about this lead"}</div>
          </div>
        ) : (
          filteredNotes.map((n) => (
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
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  {(n as any).followUpDate && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: "var(--text-xs)", fontWeight: 600,
                      color: "hsl(30 95% 62%)",
                      background: "hsl(30 95% 62% / 0.12)",
                      border: "1px solid hsl(30 95% 62% / 0.25)",
                      borderRadius: 5, padding: "2px 8px",
                      whiteSpace: "nowrap",
                    }}>
                      <CalendarClock size={11} />
                      Follow-up: {formatFullDate((n as any).followUpDate)}
                    </span>
                  )}
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
  const { data: activities }       = useGetLeadActivities(leadId);
  const { resolveName }            = useUserMap();
  const { data: services = [] }    = useGetServices();
  const { data: companies = [] }   = useGetCompanies();
  const { data: stages = [] }      = usePipelineStages();
  const allStatuses                = (stages as any[]).flatMap((s: any) => s.statuses ?? []);

  const resolve = (field: string, raw: string | null | undefined) =>
    resolveValue(field, raw, resolveName, services, companies, allStatuses, stages);

  const uniqueActivities = activities
    ? Array.from(new Map(activities.filter((a) => a.id).map((a) => [a.id, a])).values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  if (!uniqueActivities.length) return null;

  return (
    <div className="activity-log">
      <div className="activity-log-title">Activity Log</div>
      {uniqueActivities.map((a) => (
        <div key={a.id} className="activity-item">
          <div className="activity-avatar">{(a.actorName || "?")[0].toUpperCase()}</div>
          <div className="activity-content">
            <div className="activity-action">
              {a.action === "note_added" ? (
                <>
                  <strong>{a.actorName}</strong> added a note
                  {a.noteContent && (
                    <div style={{ marginTop: 4, padding: "4px 8px", background: "hsl(220 20% 12%)", borderRadius: 4, fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.4 }}>
                      "{a.noteContent}"
                    </div>
                  )}
                  {a.newValue && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: "var(--text-xs)", background: "hsl(35 100% 50% / 0.12)", color: "hsl(35 100% 62%)", border: "1px solid hsl(35 100% 50% / 0.25)" }}>
                        📅 Follow-up: {format(new Date(a.newValue), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </>
              ) : a.fieldName ? (
                <>
                  Updated <strong>{fieldLabel(a.fieldName)}</strong> from{" "}
                  <em style={{ opacity: 0.7 }}>{resolve(a.fieldName, a.oldValue) || "none"}</em> →{" "}
                  <span className="action-tag">{resolve(a.fieldName, a.newValue)}</span>
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
  pendingLostStatusId,
  localKillReason,
  setLocalKillReason,
  killReasonError,
  onConfirmLost,
  onCancelPendingLost,
  onKillReasonSave,
}: any) {
  const { data: services = [] } = useGetServices();

  const selectedStage = stages.find((s: any) => s.id === localStageId) ?? null;
  const availableStatuses = selectedStage?.statuses?.filter((s: any) => s.isActive) ?? [];

  const isCurrentlyLost = lead.statusIsLost === true && !pendingLostStatusId;
  const showKillReason = isCurrentlyLost || !!pendingLostStatusId;

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

        {/* ── Kill Reason (shows when status is Lost or pending Lost) ── */}
        {showKillReason && (
          <div style={{
            marginTop: "var(--sp-3)",
            background: "hsl(0 70% 50% / 0.06)",
            border: `1px solid ${killReasonError ? "hsl(0 70% 55% / 0.6)" : "hsl(0 70% 55% / 0.25)"}`,
            borderRadius: 10,
            padding: "var(--sp-4)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em",
              color: "hsl(0 70% 60%)", textTransform: "uppercase",
              marginBottom: "var(--sp-2)",
            }}>
              <AlertTriangle size={12} />
              {pendingLostStatusId ? "Why is this lead being closed as lost?" : "Kill Reason"}
              {pendingLostStatusId && (
                <span style={{ color: "hsl(0 70% 60%)", marginLeft: 2 }}>*</span>
              )}
            </div>
            <textarea
              className="field-input"
              value={localKillReason}
              onChange={(e) => {
                setLocalKillReason(e.target.value);
              }}
              onBlur={isCurrentlyLost ? (e) => onKillReasonSave(e.target.value) : undefined}
              placeholder="e.g. Budget constraints, went with competitor, project cancelled…"
              rows={3}
              style={{
                resize: "vertical", minHeight: "68px",
                fontFamily: "inherit", lineHeight: 1.5,
                borderColor: killReasonError ? "hsl(0 70% 55% / 0.7)" : undefined,
              }}
            />
            {killReasonError && (
              <p style={{ fontSize: "var(--text-xs)", color: "hsl(0 70% 60%)", marginTop: "var(--sp-1)", marginBottom: 0 }}>
                A kill reason is required to close this lead as lost.
              </p>
            )}
            {pendingLostStatusId && (
              <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-3)" }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={onConfirmLost}
                  style={{ flex: 1 }}
                  type="button"
                >
                  Confirm Closed — Lost
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onCancelPendingLost}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Won Closure Panel ── */}
        {lead.statusIsWon && (
          <div style={{
            marginTop: "var(--sp-3)",
            background: "hsl(145 65% 42% / 0.07)",
            border: "1px solid hsl(145 65% 42% / 0.30)",
            borderRadius: 10,
            padding: "var(--sp-4)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em",
              color: "hsl(145 65% 52%)", textTransform: "uppercase",
              marginBottom: "var(--sp-3)",
            }}>
              <TrendingUp size={12} />
              Won — Closure Details
            </div>

            <div className="details-row" style={{ marginBottom: "var(--sp-3)" }}>
              <div className="form-field">
                <label className="field-label">Final Closed Value (₹)</label>
                <input
                  className="field-input"
                  type="number"
                  key={lead.id + "-finalValue"}
                  defaultValue={lead.finalValue ?? lead.dealValue ?? ""}
                  onBlur={(e) => handleUpdate("finalValue", e.target.value || null)}
                  placeholder="e.g. 480000"
                  style={{ borderColor: "hsl(145 65% 42% / 0.45)" }}
                />
                {lead.finalValue && lead.dealValue && Number(lead.finalValue) !== Number(lead.dealValue) && (
                  <div style={{
                    fontSize: "var(--text-xs)", marginTop: "var(--sp-1)",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>
                      Original: {formatCurrency(lead.dealValue)}
                    </span>
                    {Number(lead.finalValue) > Number(lead.dealValue) ? (
                      <span style={{ color: "hsl(145 65% 52%)", fontWeight: 700 }}>
                        ▲ {formatCurrency(lead.finalValue)}
                      </span>
                    ) : (
                      <span style={{ color: "hsl(35 90% 55%)", fontWeight: 700 }}>
                        ▼ {formatCurrency(lead.finalValue)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Closure Note</label>
              <textarea
                className="field-input"
                key={lead.id + "-closureNote"}
                defaultValue={lead.closureNote || ""}
                onBlur={(e) => handleUpdate("closureNote", e.target.value || null)}
                placeholder="Key success factors, next steps, referral potential…"
                rows={3}
                style={{
                  resize: "vertical", minHeight: "72px",
                  fontFamily: "inherit", lineHeight: 1.5,
                  borderColor: "hsl(145 65% 42% / 0.35)",
                }}
              />
            </div>
          </div>
        )}
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
          <div className="form-field">
            <label className="field-label">Lead Reference</label>
            <input
              className="field-input"
              defaultValue={lead.company || ""}
              onBlur={(e) => handleUpdate("company", e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="form-field">
            <label className="field-label">Description</label>
            <textarea
              className="field-input"
              key={lead.id + "-desc"}
              defaultValue={lead.description || ""}
              onBlur={(e) => handleUpdate("description", e.target.value)}
              placeholder="Brief overview of this lead — context, source, or initial notes…"
              rows={3}
              style={{ resize: "vertical", minHeight: "72px", fontFamily: "inherit", lineHeight: 1.5 }}
            />
          </div>
          <div className="details-row">
            <div className="form-field">
              <label className="field-label">Lead Type</label>
              <CustomSelect
                value={lead.leadType ?? null}
                placeholder="Select type…"
                onChange={(v) => handleUpdate("leadType", v)}
                options={leadTypeSelectOptions(14)}
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
              searchable
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
              searchable
              options={[
                { value: "", label: "Unassigned" },
                ...users
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
              searchable
              options={[
                { value: "", label: "Unassigned" },
                ...users
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
    </div>
  );
}

// ─── Timeline tab ─────────────────────────────────────
function TimelineTab({ leadId }: { leadId: string }) {
  const { data: activities }       = useGetLeadActivities(leadId);
  const { resolveName }            = useUserMap();
  const { data: services = [] }    = useGetServices();
  const { data: companies = [] }   = useGetCompanies();
  const { data: stages = [] }      = usePipelineStages();
  const allStatuses                = (stages as any[]).flatMap((s: any) => s.statuses ?? []);

  const resolve = (field: string, raw: string | null | undefined) =>
    resolveValue(field, raw, resolveName, services, companies, allStatuses, stages);

  // Deduplicate by id, then sort newest first
  const uniqueActivities = activities
    ? Array.from(new Map(activities.filter((a) => a.id).map((a) => [a.id, a])).values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  if (!uniqueActivities.length) {
    return (
      <div className="timeline-tab timeline-empty">
        <History size={32} style={{ opacity: 0.25 }} />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="timeline-tab">
      {uniqueActivities.map((a, idx) => (
        <div key={a.id} className="timeline-entry">
          <div className="timeline-left">
            <div className="timeline-avatar">{(a.actorName || "?")[0].toUpperCase()}</div>
            {idx < uniqueActivities.length - 1 && <div className="timeline-line" />}
          </div>
          <div className="timeline-body">
            <div className="timeline-action">
              {a.action === "note_added" ? (
                <>
                  <strong>{a.actorName}</strong>
                  <span style={{ color: "var(--text-secondary)" }}> added a note</span>
                  {a.noteContent && (
                    <div style={{ marginTop: 6, padding: "6px 10px", background: "hsl(220 20% 10%)", borderLeft: "2px solid hsl(196 100% 46% / 0.4)", borderRadius: "0 4px 4px 0", fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                      "{a.noteContent}"
                    </div>
                  )}
                  {a.newValue && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: "var(--text-xs)", background: "hsl(35 100% 50% / 0.12)", color: "hsl(35 100% 62%)", border: "1px solid hsl(35 100% 50% / 0.25)" }}>
                        📅 Follow-up: {format(new Date(a.newValue), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </>
              ) : a.fieldName ? (
                <>
                  <strong>{a.actorName}</strong> updated{" "}
                  <span className="timeline-field">{fieldLabel(a.fieldName)}</span>
                  <span className="timeline-arrow"> → </span>
                  <span className="timeline-new-val">{resolve(a.fieldName, a.newValue)}</span>
                  {a.oldValue && (
                    <span className="timeline-old-val"> (was: {resolve(a.fieldName, a.oldValue)})</span>
                  )}
                </>
              ) : (
                <>
                  <strong>{a.actorName}</strong>
                  <span className="timeline-created"> created this lead</span>
                </>
              )}
            </div>
            <div className="timeline-time">
              <Clock size={10} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
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
  const { token }                      = useAuth();
  const { data: lead }                 = useGetLead(leadId || "", { query: { enabled: !!leadId } });
  const { data: notesData }            = useGetLeadNotes(leadId || "", { query: { enabled: !!leadId } });
  const notesCount                     = (notesData as any[])?.length ?? 0;
  const { users }                      = useUserMap();
  const { data: teamMembers = [] }     = useGetTeamMembers();
  const whitelistedUsers               = (teamMembers as any[]).filter((m: any) => m.whitelistStatus === "active");
  const queryClient                    = useQueryClient();
  const { data: pipelineStages = [] }  = usePipelineStages();
  const [activeTab, setActiveTab]      = useState<"details" | "notes" | "timeline" | "documents">("details");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // ── Reset scroll to top whenever a new lead is loaded ──
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    setActiveTab("details");
  }, [leadId]);

  // ── Local pipeline state — sync on lead change ──
  const [localStageId,    setLocalStageId]    = useState<string | null>(null);
  const [localStatusId,   setLocalStatusId]   = useState<string | null>(null);
  const [localServiceId,  setLocalServiceId]  = useState<string | null>(null);
  const [localCompanyIds, setLocalCompanyIds] = useState<string[]>([]);

  // ── Kill reason state ──
  const [pendingLostStatusId, setPendingLostStatusId] = useState<string | null>(null);
  const [localKillReason,     setLocalKillReason]     = useState<string>("");
  const [killReasonError,     setKillReasonError]     = useState<boolean>(false);

  useEffect(() => {
    if (lead) {
      setLocalStageId(lead.pipelineStageId ?? null);
      setLocalStatusId(lead.pipelineStatusId ?? null);
      setLocalServiceId(lead.serviceId ?? null);
      setLocalCompanyIds(lead.companies?.map((c: any) => c.id) ?? []);
      setLocalKillReason((lead as any).leadKillReason ?? "");
      setPendingLostStatusId(null);
      setKillReasonError(false);
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
      // Always reset the drawer's own scroll to top
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
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
        queryClient.invalidateQueries({ queryKey: getGetLeadActivitiesQueryKey(leadId) });
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

  const [, setLocation] = useLocation();
  const handleDuplicate = () => {
    if (!lead) return;
    const payload = {
      leadName:       lead.leadName,
      company:        lead.company,
      leadType:       lead.leadType,
      contactEmail:   lead.contactEmail,
      phone:          lead.phone,
      serviceId:      lead.serviceId,
      leadOwner:      lead.leadOwner,
      dealHandler:    lead.dealHandler,
      dealValue:      lead.dealValue,
      pipelineStageId: lead.pipelineStageId,
      companyIds:     Array.isArray(lead.companies)
                        ? [...new Set(lead.companies.map((c: any) => c.id).filter(Boolean))]
                        : [],
    };
    sessionStorage.setItem("slh_duplicate_lead", JSON.stringify(payload));
    onOpenChange(false);
    setLocation("/leads/new");
  };

  const handleUpdate = (field: string, value: any) => {
    if (!lead) return;
    if (lead[field as keyof typeof lead] === value) return;
    updateLeadMutation.mutate({ id: lead.id, data: { [field]: value } });
  };

  const handleStageChange = (stageId: string) => {
    setLocalStageId(stageId || null);
    setLocalStatusId(null);
    setPendingLostStatusId(null);
    setKillReasonError(false);
    if (!lead) return;
    updateLeadMutation.mutate({
      id: lead.id,
      data: { pipelineStageId: stageId || null, pipelineStatusId: null },
    });
  };

  const handleStatusChange = (statusId: string) => {
    const selectedStatus = pipelineStages
      .flatMap((s: any) => s.statuses ?? [])
      .find((st: any) => st.id === statusId);

    if (selectedStatus?.isLost) {
      // Intercept — don't save until kill reason is provided
      setLocalStatusId(statusId || null);
      setPendingLostStatusId(statusId || null);
      setLocalKillReason((lead as any)?.leadKillReason ?? "");
      setKillReasonError(false);
      return;
    }

    // Non-lost status — clear pending state, save immediately
    setPendingLostStatusId(null);
    setKillReasonError(false);
    setLocalStatusId(statusId || null);
    if (!lead) return;
    updateLeadMutation.mutate({
      id: lead.id,
      data: { pipelineStatusId: statusId || null },
    });
  };

  const handleConfirmLost = () => {
    if (!localKillReason.trim()) {
      setKillReasonError(true);
      toast.error("A kill reason is required to close this lead as Lost");
      return;
    }
    if (!lead || !pendingLostStatusId) return;
    updateLeadMutation.mutate({
      id: lead.id,
      data: { pipelineStatusId: pendingLostStatusId, leadKillReason: localKillReason.trim() } as any,
    });
    setPendingLostStatusId(null);
    setKillReasonError(false);
  };

  const handleCancelPendingLost = () => {
    // Revert to previous status
    setLocalStatusId(lead?.pipelineStatusId ?? null);
    setPendingLostStatusId(null);
    setKillReasonError(false);
  };

  const handleKillReasonSave = (val: string) => {
    if (!lead) return;
    const existing = (lead as any).leadKillReason ?? "";
    if (val === existing) return;
    updateLeadMutation.mutate({
      id: lead.id,
      data: { leadKillReason: val || null } as any,
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

  if (!open || typeof document === "undefined" || !document.body) return null;

  return createPortal(
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
                  <LeadTypeBadge type={lead.leadType} size={13} />
                )}
                {(lead.dealValue || lead.finalValue) && (() => {
                  const isWon = lead.statusIsWon;
                  const hasFinal = isWon && lead.finalValue != null;
                  const differs = hasFinal && Number(lead.finalValue) !== Number(lead.dealValue);
                  if (!hasFinal) {
                    return (
                      <span className="sheet-value-chip">
                        {formatCurrency(lead.dealValue)}
                      </span>
                    );
                  }
                  if (!differs) {
                    return (
                      <span className="sheet-value-chip" style={{ background: "hsl(145 65% 42% / 0.15)", color: "hsl(145 65% 60%)", borderColor: "hsl(145 65% 42% / 0.35)" }}>
                        {formatCurrency(lead.finalValue)} Won
                      </span>
                    );
                  }
                  return (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{
                        fontSize: "var(--text-xs)", color: "var(--text-muted)",
                        textDecoration: "line-through", fontFamily: "var(--font-mono)",
                      }}>
                        {formatCurrency(lead.dealValue)}
                      </span>
                      <span className="sheet-value-chip" style={{ background: "hsl(145 65% 42% / 0.15)", color: "hsl(145 65% 60%)", borderColor: "hsl(145 65% 42% / 0.35)" }}>
                        {Number(lead.finalValue) > Number(lead.dealValue) ? "▲" : "▼"} {formatCurrency(lead.finalValue)} Won
                      </span>
                    </span>
                  );
                })()}
                {(() => {
                  const fup = (lead as any).activeFollowUpDate;
                  if (!fup) return null;
                  const today = new Date(); today.setHours(0,0,0,0);
                  const d = new Date(fup); d.setHours(0,0,0,0);
                  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
                  const isOverdue = diff < 0;
                  const isToday   = diff === 0;
                  const color = isOverdue ? "hsl(0 80% 58%)" : isToday ? "hsl(45 95% 55%)" : "var(--teal)";
                  const bg    = isOverdue ? "hsl(0 80% 58% / 0.12)" : isToday ? "hsl(45 95% 55% / 0.12)" : "var(--teal-dim)";
                  const border= isOverdue ? "hsl(0 80% 58% / 0.25)" : isToday ? "hsl(45 95% 55% / 0.25)" : "hsl(196 100% 46% / 0.35)";
                  const label = isOverdue
                    ? `${Math.abs(diff)}d overdue`
                    : isToday ? "Due today" : format(d, "MMM d, yyyy");
                  return (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: "var(--text-xs)", fontWeight: 600,
                      color, background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 6, padding: "3px 9px",
                      whiteSpace: "nowrap",
                    }}>
                      <CalendarClock size={11} />
                      {label}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Actions: duplicate + delete + close */}
          <div className="sheet-topbar-actions">
            {!confirmingDelete && (
              <button
                className="sheet-delete-btn"
                onClick={handleDuplicate}
                aria-label="Duplicate lead"
                title="Duplicate lead"
              >
                <Copy size={15} />
              </button>
            )}
            <PermissionCheck resource="leads" action="delete">
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
            </PermissionCheck>
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
            { id: "details",   label: "Details",       icon: <FileText size={13} /> },
            { id: "notes",     label: notesCount > 0 ? `Notes & Follow-Up (${notesCount})` : "Notes & Follow-Up", icon: <MessageSquare size={13} /> },
            { id: "timeline",  label: "Timeline",       icon: <History size={13} /> },
            { id: "documents", label: "Documents",      icon: <Folder size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sheet-tab ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id as "details" | "notes" | "timeline" | "documents")}
              type="button"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="sheet-body"
          ref={bodyRef}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
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
              users={whitelistedUsers}
              pendingLostStatusId={pendingLostStatusId}
              localKillReason={localKillReason}
              setLocalKillReason={setLocalKillReason}
              killReasonError={killReasonError}
              onConfirmLost={handleConfirmLost}
              onCancelPendingLost={handleCancelPendingLost}
              onKillReasonSave={handleKillReasonSave}
            />
          ) : activeTab === "timeline" ? (
            <TimelineTab leadId={lead.id} />
          ) : activeTab === "documents" ? (
            <DocumentsTab
              leadId={lead.id}
              leadStageName={(lead as any).stageName ?? null}
              leadStatusName={(lead as any).statusName ?? null}
              token={token ?? ""}
            />
          ) : (
            <NotesSection leadId={lead.id} />
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
