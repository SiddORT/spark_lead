import { useState, useEffect, useRef } from "react";
import { 
  useGetLead, useUpdateLead, useGetLeadNotes, useAddLeadNote, 
  useDeleteLeadNote, useGetLeadActivities, 
  useGetServices, useGetServiceCompanies, getGetLeadsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, Textarea } from "./ui";
import { format, formatDistanceToNow } from "date-fns";
import { Check, Lock, Send, Clock, Trash2, X, AlertCircle, ChevronDown } from "lucide-react";
import { useUserMap } from "@/hooks/use-user-map";
import { useAuth, PermissionCheck } from "./auth-provider";
import { toast } from "sonner";
import { usePipelineStages } from "@/hooks/use-pipeline";
import { StageStatusSelect, PipelineProgressBar } from "./stage-status-select";

// ─── Currency formatter ───────────────────────────────
function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.]/g, "")) : val;
  if (isNaN(num)) return String(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

// ─── Chip-based company multi-select ─────────────────
function CompanyChipSelect({
  serviceId,
  selectedCompanyIds,
  onToggle,
}: {
  serviceId: string;
  selectedCompanyIds: string[];
  onToggle: (id: string, name: string) => void;
}) {
  const { data: companies = [] } = useGetServiceCompanies(serviceId, { query: { enabled: !!serviceId } });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedCompanies = companies.filter(c => selectedCompanyIds.includes(c.id));
  const unselected = companies.filter(c => !selectedCompanyIds.includes(c.id));

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
        onClick={() => companies.length > 0 && setOpen(v => !v)}
        style={{ cursor: companies.length > 0 ? "pointer" : "default" }}
      >
        {selectedCompanies.map(c => (
          <span key={c.id} className="company-chip">
            {c.name}
            <button
              className="company-chip-x"
              onClick={e => { e.stopPropagation(); onToggle(c.id, c.name); }}
              title={`Remove ${c.name}`}
            >
              ×
            </button>
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
            style={{ marginLeft: "auto", color: "var(--text-muted)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
          />
        )}
      </div>
      {open && companies.length > 0 && (
        <div className="company-select-dropdown" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0 }}>
          {companies.map(c => {
            const isSelected = selectedCompanyIds.includes(c.id);
            return (
              <button
                key={c.id}
                className={`company-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => onToggle(c.id, c.name)}
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

export function LeadDetailSheet({ leadId, open, onOpenChange }: { leadId: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: lead }           = useGetLead(leadId || "", { query: { enabled: !!leadId } });
  const { resolveName, users }   = useUserMap();
  const { user }                 = useAuth();
  const queryClient              = useQueryClient();
  const { data: pipelineStages = [] } = usePipelineStages();

  const updateLeadMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
        toast.success("Lead updated");
      }
    }
  });

  const handleUpdate = (field: string, value: any) => {
    if (!lead) return;
    if (lead[field as keyof typeof lead] === value) return;
    updateLeadMutation.mutate({ id: lead.id, data: { [field]: value } });
  };

  const handlePipelineChange = (stageId: string, statusId: string) => {
    if (!lead) return;
    const updates: any = {};
    if (stageId !== lead.pipelineStageId) updates.pipelineStageId = stageId || null;
    if (statusId !== lead.pipelineStatusId) updates.pipelineStatusId = statusId || null;
    if (Object.keys(updates).length > 0) {
      updateLeadMutation.mutate({ id: lead.id, data: updates });
    }
  };

  if (!lead) return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
    </Sheet>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} className="w-full sm:w-[600px] md:w-[700px] max-w-full">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-elevated)" }}>

        {/* ── Top bar ── */}
        <div className="sheet-topbar">
          <div>
            <div className="sheet-lead-name">{lead.leadName}</div>
            <div className="sheet-lead-meta">
              {lead.stageName && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "2px 8px",
                  background: `${lead.stageColor || "var(--teal)"}18`,
                  border: `1px solid ${lead.stageColor || "var(--teal)"}30`,
                  borderRadius: "var(--radius-full)",
                  color: lead.stageColor || "var(--teal)",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: lead.stageColor || "var(--teal)", flexShrink: 0 }} />
                  {lead.stageName}
                </span>
              )}
              {lead.statusName && (
                <span style={{
                  padding: "2px 8px",
                  background: `${lead.statusColor || "var(--border-default)"}18`,
                  border: `1px solid ${lead.statusColor || "var(--border-default)"}30`,
                  borderRadius: "var(--radius-full)",
                  color: lead.statusColor || "var(--text-muted)",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                }}>
                  {lead.statusName}
                </span>
              )}
              {lead.leadType && (
                <span className={`badge badge-${lead.leadType}`} style={{ textTransform: "capitalize" }}>
                  {lead.leadType}
                </span>
              )}
              {lead.dealValue && (
                <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--teal)" }}>
                  {formatCurrency(lead.dealValue)}
                </span>
              )}
            </div>
          </div>
          <button className="sheet-close" onClick={() => onOpenChange(false)}>
            <X size={16} />
          </button>
        </div>

        {/* ── Pipeline Progress Bar ── */}
        {pipelineStages.length > 0 && (
          <div style={{
            padding: "var(--sp-4) var(--sp-6) var(--sp-5)",
            borderBottom: "1px solid var(--border-faint)",
            background: "var(--bg-overlay)",
            flexShrink: 0,
          }}>
            <PipelineProgressBar
              stages={pipelineStages}
              currentStageId={lead.pipelineStageId}
              currentStatusId={lead.pipelineStatusId}
            />
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Tabs defaultValue="details" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <TabsList className="w-full flex p-0 bg-transparent border-0" style={{
              borderBottom: "1px solid var(--border-faint)",
              borderRadius: 0,
              padding: "0 var(--sp-6)",
              gap: 2,
              flexShrink: 0,
              background: "var(--bg-overlay)",
            }}>
              {["details", "notes"].map(tab => (
                <TabsTrigger key={tab} value={tab} style={{ borderRadius: 0 }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* ── DETAILS TAB ── */}
              <TabsContent value="details" style={{ margin: 0, padding: "var(--sp-6)" }}>
                {/* Pipeline Stage + Status */}
                <div className="form-field details-grid-full" style={{ marginBottom: "var(--sp-5)" }}>
                  <label className="field-label">Pipeline Stage &amp; Status</label>
                  <StageStatusSelect
                    stageId={lead.pipelineStageId}
                    statusId={lead.pipelineStatusId}
                    onStageChange={(stageId) => handlePipelineChange(stageId, "")}
                    onStatusChange={(statusId) => handlePipelineChange(lead.pipelineStageId || "", statusId)}
                  />
                </div>

                {/* Row 1: Lead Name — full width */}
                <div className="form-field details-grid-full">
                  <label className="field-label">Lead Name</label>
                  <input
                    className="field-input"
                    defaultValue={lead.leadName}
                    onBlur={e => handleUpdate("leadName", e.target.value)}
                  />
                </div>

                {/* Row 2: Lead Type | Deal Value */}
                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Lead Type</label>
                    <select
                      className="field-select"
                      value={lead.leadType || ""}
                      onChange={e => handleUpdate("leadType", e.target.value)}
                    >
                      <option value="">Select…</option>
                      <option value="hot">🔥 Hot</option>
                      <option value="warm">☀️ Warm</option>
                      <option value="cold">🧊 Cold</option>
                      <option value="ghosted">👻 Ghosted</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Deal Value (₹)</label>
                    <input
                      className="field-input"
                      type="number"
                      defaultValue={lead.dealValue || ""}
                      onBlur={e => handleUpdate("dealValue", e.target.value)}
                      placeholder="e.g. 500000"
                    />
                  </div>
                </div>

                {/* Row 3: Contact Email | Phone */}
                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Contact Email</label>
                    <input
                      className="field-input"
                      type="email"
                      defaultValue={lead.contactEmail || ""}
                      onBlur={e => handleUpdate("contactEmail", e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Phone</label>
                    <input
                      className="field-input"
                      type="tel"
                      defaultValue={lead.phone || ""}
                      onBlur={e => handleUpdate("phone", e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 4 + 5: Service then Companies (full width) */}
                <ServiceCompanySelectors lead={lead} handleUpdate={handleUpdate} />

                {/* Row 6: Lead Owner | Deal Handler */}
                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Lead Owner</label>
                    <select
                      className="field-select"
                      value={lead.leadOwner || ""}
                      onChange={e => handleUpdate("leadOwner", e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.filter(u => ["admin","lead_owner"].includes(u.role)).map(u => (
                        <option key={u.id} value={u.id}>{u.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Deal Handler</label>
                    <select
                      className="field-select"
                      value={lead.dealHandler || ""}
                      onChange={e => handleUpdate("dealHandler", e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.filter(u => ["admin","deal_handler"].includes(u.role)).map(u => (
                        <option key={u.id} value={u.id}>{u.displayName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 7: Follow-up Date | Next Action */}
                <div className="form-row">
                  <div className="form-field">
                    <label className="field-label">Follow-up Date</label>
                    <input
                      className="field-input"
                      type="date"
                      defaultValue={lead.followUpDate ? lead.followUpDate.split("T")[0] : ""}
                      onBlur={e => e.target.value && handleUpdate("followUpDate", new Date(e.target.value).toISOString())}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Next Action</label>
                    <input
                      className="field-input"
                      defaultValue={lead.nextAction || ""}
                      onBlur={e => handleUpdate("nextAction", e.target.value)}
                      placeholder="e.g. Follow up call"
                    />
                  </div>
                </div>

                {/* Activity Log */}
                <ActivityLog leadId={lead.id} />
              </TabsContent>

              {/* ── NOTES TAB ── */}
              <TabsContent value="notes" style={{ margin: 0, padding: "var(--sp-6)" }}>
                <NotesSection leadId={lead.id} stageContext={null} />
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Service + Company selectors ─────────────────────
function ServiceCompanySelectors({ lead, handleUpdate }: { lead: any; handleUpdate: any }) {
  const { data: services = [] } = useGetServices();

  const handleCompanyToggle = (companyId: string) => {
    const currentIds: string[] = lead.companies?.map((c: any) => c.id) || [];
    const newIds = currentIds.includes(companyId)
      ? currentIds.filter((id: string) => id !== companyId)
      : [...currentIds, companyId];
    handleUpdate("companyIds", newIds);
  };

  const selectedCompanyIds = lead.companies?.map((c: any) => c.id) || [];

  return (
    <>
      {/* Row 4: Service — full width */}
      <div className="form-field details-grid-full">
        <label className="field-label">Service</label>
        <select
          className="field-select"
          value={lead.serviceId || ""}
          onChange={e => {
            handleUpdate("serviceId", e.target.value);
            handleUpdate("companyIds", []);
          }}
        >
          <option value="">Select a service…</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Row 5: Companies — full width, chip-based */}
      <div className="form-field details-grid-full">
        <label className="field-label">Companies</label>
        <CompanyChipSelect
          serviceId={lead.serviceId || ""}
          selectedCompanyIds={selectedCompanyIds}
          onToggle={(id) => handleCompanyToggle(id)}
        />
      </div>
    </>
  );
}

// ─── Notes section ────────────────────────────────────
function NotesSection({ leadId, stageContext }: { leadId: string; stageContext: string | null }) {
  const { data: notes }   = useGetLeadNotes(leadId);
  const queryClient       = useQueryClient();
  const { user }          = useAuth();
  const [newNote, setNewNote] = useState("");

  const addMutation    = useAddLeadNote({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] }); setNewNote(""); }});
  const deleteMutation = useDeleteLeadNote({ onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] })});

  const filteredNotes = notes?.filter(n => stageContext ? n.stageContext === stageContext : true) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
        <Textarea
          placeholder="Type a new note…"
          value={newNote}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
          className="min-h-[80px]"
        />
        <Button
          style={{ height: "auto", alignSelf: "stretch" }}
          onClick={() => { if (newNote.trim()) addMutation.mutate({ id: leadId, data: { content: newNote, stageContext } }); }}
        >
          <Send size={16} />
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
        {filteredNotes.length === 0 ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", textAlign: "center", padding: "var(--sp-4) 0" }}>No notes yet.</p>
        ) : filteredNotes.map(n => (
          <div key={n.id} className="animate-slide-in" style={{
            background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
            borderRadius: "var(--r-md)", padding: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{n.authorName}</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={11} /> {format(new Date(n.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              {n.userId === user?.id && (
                <button
                  onClick={() => deleteMutation.mutate({ id: leadId, noteId: n.id })}
                  style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 2, transition: "color 120ms ease" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p style={{ fontSize: "var(--text-sm)", whiteSpace: "pre-wrap", color: "var(--text-secondary)", margin: 0 }}>{n.content}</p>
            {n.stageContext && !stageContext && (
              <span className="badge badge-muted" style={{ width: "fit-content", fontSize: 10 }}>{n.stageContext}</span>
            )}
          </div>
        ))}
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
      {activities.map(a => (
        <div key={a.id} className="activity-item">
          <div className="activity-avatar">
            {(a.actorName || "?")[0].toUpperCase()}
          </div>
          <div className="activity-content">
            <div className="activity-action">
              {a.fieldName ? (
                <>Updated <strong>{a.fieldName}</strong> from <em style={{ opacity: 0.7 }}>{a.oldValue || "none"}</em> → <span className="action-tag">{a.newValue}</span></>
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
