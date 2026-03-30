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

  const updateLeadMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
        toast.success("Lead updated");
      }
    }
  });

  const isQualifyComplete  = !!(lead?.emotionalState && lead?.decisionRole);
  const isStrategyComplete = !!(lead?.strategicTier);
  const isResolveComplete  = !!(lead?.outcome);

  const [proceededStages, setProceededStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (lead) {
      const set = new Set(proceededStages);
      if (isQualifyComplete  && lead.strategicTier) set.add("strategy");
      if (isStrategyComplete && lead.outcome)        set.add("resolve");
      setProceededStages(set);
    }
  }, [lead]);

  const handleUpdate = (field: string, value: any) => {
    if (!lead || lead[field as keyof typeof lead] === value) return;

    let targetStage = lead.stage;
    const stages    = ["discovery", "qualification", "strategy", "resolution"];
    const merged    = { ...lead, [field]: value };

    const qualify  = !!(merged.emotionalState && merged.decisionRole);
    const strategy = !!(merged.strategicTier);
    const resolve  = !!(merged.outcome);

    if (resolve)        targetStage = "resolution";
    else if (strategy)  targetStage = "strategy";
    else if (qualify)   targetStage = "qualification";

    const updates: any = { [field]: value };
    if (stages.indexOf(targetStage) > stages.indexOf(lead.stage)) updates.stage = targetStage;
    if (field === "outcome" && value !== "wip" && !lead.resolvedAt) updates.resolvedAt = new Date().toISOString();

    updateLeadMutation.mutate({ id: lead.id, data: updates });
  };

  if (!lead) return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div style={{ padding: "var(--sp-8)", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
    </Sheet>
  );

  const strategyLocked = !isQualifyComplete || !proceededStages.has("strategy");
  const resolveLocked  = !isStrategyComplete || !proceededStages.has("resolve");

  const milestoneSteps = [
    { id: "qualify",  label: "Qualify",   complete: isQualifyComplete },
    { id: "strategy", label: "Strategy",  complete: isStrategyComplete },
    { id: "resolve",  label: "Resolve",   complete: isResolveComplete },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} className="w-full sm:w-[600px] md:w-[700px] max-w-full">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-elevated)" }}>

        {/* ── Top bar ── */}
        <div className="sheet-topbar">
          <div>
            <div className="sheet-lead-name">{lead.leadName}</div>
            <div className="sheet-lead-meta">
              <span className={`badge badge-${lead.stage || "discovery"}`} style={{ textTransform: "capitalize" }}>
                {lead.stage || "Discovery"}
              </span>
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

        {/* ── Milestone bar ── */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border-faint)",
          background: "var(--bg-overlay)",
          flexShrink: 0,
          gap: 0,
        }}>
          {milestoneSteps.map((step, i) => {
            const circleClass = step.complete ? "done" : (i === 0 || milestoneSteps[i-1]?.complete ? "active" : "locked");
            return (
              <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div className={`milestone-circle ${circleClass}`}>
                    {step.complete ? <Check size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                    color: step.complete ? "var(--success)" : (circleClass === "active" ? "var(--teal)" : "var(--text-muted)"),
                    whiteSpace: "nowrap",
                  }}>
                    {step.label}
                  </span>
                </div>
                {i < milestoneSteps.length - 1 && (
                  <div style={{
                    flex: 1, height: "1.5px",
                    background: step.complete ? "var(--success)" : "var(--border-faint)",
                    margin: "0 var(--sp-2) 15px",
                    transition: "background var(--t-base)",
                  }} />
                )}
              </div>
            );
          })}
        </div>

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
              {["details", "qualify", "strategy", "resolve", "notes"].map(tab => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  disabled={(tab === "strategy" && strategyLocked) || (tab === "resolve" && resolveLocked)}
                  style={{ borderRadius: 0 }}
                >
                  {tab === "qualify" && isQualifyComplete && <Check size={12} style={{ color: "var(--success)", marginRight: 4 }} />}
                  {tab === "strategy" && strategyLocked && <Lock size={11} style={{ marginRight: 4 }} />}
                  {tab === "resolve"  && resolveLocked  && <Lock size={11} style={{ marginRight: 4 }} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* ── DETAILS TAB ── */}
              <TabsContent value="details" style={{ margin: 0, padding: "var(--sp-6)" }}>
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

              {/* ── QUALIFY TAB ── */}
              <TabsContent value="qualify" style={{ margin: 0, padding: "var(--sp-6)" }}>
                <div style={{
                  background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--r-lg)", padding: "var(--sp-5)", marginBottom: "var(--sp-5)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-4)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--teal)", margin: 0 }}>
                      Qualification Assessment
                    </h3>
                    {isQualifyComplete && (
                      <span className="badge badge-success"><Check size={11} /> Completed</span>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="field-label">Emotional State <span className="req">*</span></label>
                      <select className="field-select" value={lead.emotionalState || ""} onChange={e => handleUpdate("emotionalState", e.target.value)}>
                        <option value="">Select…</option>
                        <option value="skeptical">Skeptical</option>
                        <option value="enthusiastic">Enthusiastic</option>
                        <option value="frustrated">Frustrated</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Decision Role <span className="req">*</span></label>
                      <select className="field-select" value={lead.decisionRole || ""} onChange={e => handleUpdate("decisionRole", e.target.value)}>
                        <option value="">Select…</option>
                        <option value="champion">Champion</option>
                        <option value="gatekeeper">Gatekeeper</option>
                        <option value="economic_buyer">Economic Buyer</option>
                      </select>
                    </div>
                  </div>
                  {isQualifyComplete && !proceededStages.has("strategy") && (
                    <button
                      className="btn btn-primary btn-full"
                      style={{ marginTop: "var(--sp-4)" }}
                      onClick={() => setProceededStages(new Set(proceededStages).add("strategy"))}
                    >
                      Proceed to Strategy →
                    </button>
                  )}
                </div>
                <NotesSection leadId={lead.id} stageContext="qualify" />
              </TabsContent>

              {/* ── STRATEGY TAB ── */}
              <TabsContent value="strategy" style={{ margin: 0, padding: "var(--sp-6)" }}>
                {strategyLocked ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--sp-16) var(--sp-8)", gap: "var(--sp-3)", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" }}>
                      <Lock size={22} />
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-secondary)" }}>Strategy Locked</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", maxWidth: 240, lineHeight: 1.6 }}>Complete Qualification phase to unlock Strategy.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)", padding: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--purple)", marginBottom: "var(--sp-4)" }}>Strategy Formulation</h3>
                      <div className="form-field">
                        <label className="field-label">Strategic Tier <span className="req">*</span></label>
                        <select className="field-select" value={lead.strategicTier || ""} onChange={e => handleUpdate("strategicTier", e.target.value)}>
                          <option value="">Select…</option>
                          <option value="high">High Priority</option>
                          <option value="med">Medium</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="field-label">Custom Hook</label>
                        <textarea
                          className="field-textarea"
                          defaultValue={lead.customHook || ""}
                          onBlur={e => handleUpdate("customHook", e.target.value)}
                          placeholder="What's our angle?"
                          style={{ minHeight: 72 }}
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="field-label">Known Objections</label>
                        <input className="field-input" defaultValue={lead.objection || ""} onBlur={e => handleUpdate("objection", e.target.value)} />
                      </div>
                      {isStrategyComplete && !proceededStages.has("resolve") && (
                        <button className="btn btn-primary btn-full" style={{ marginTop: "var(--sp-4)" }} onClick={() => setProceededStages(new Set(proceededStages).add("resolve"))}>
                          Proceed to Resolve →
                        </button>
                      )}
                    </div>
                    <NotesSection leadId={lead.id} stageContext="strategy" />
                  </>
                )}
              </TabsContent>

              {/* ── RESOLVE TAB ── */}
              <TabsContent value="resolve" style={{ margin: 0, padding: "var(--sp-6)" }}>
                {resolveLocked ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--sp-16) var(--sp-8)", gap: "var(--sp-3)", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" }}>
                      <Lock size={22} />
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-secondary)" }}>Resolution Locked</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", maxWidth: 240, lineHeight: 1.6 }}>Complete Strategy phase to unlock Resolution.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)", padding: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--warning)", marginBottom: "var(--sp-4)" }}>Outcome Resolution</h3>
                      <div className="form-field">
                        <label className="field-label">Outcome <span className="req">*</span></label>
                        <select className="field-select" value={lead.outcome || ""} onChange={e => handleUpdate("outcome", e.target.value)}>
                          <option value="">Select…</option>
                          <option value="closed">Closed Won</option>
                          <option value="lost">Closed Lost</option>
                          <option value="wip">Work in Progress</option>
                          <option value="delayed">Delayed</option>
                        </select>
                      </div>
                      {lead.outcome === "lost" && (
                        <div className="form-field" style={{ animation: "slide-in 200ms ease both" }}>
                          <label className="field-label">Kill Reason</label>
                          <select className="field-select" value={lead.killReason || ""} onChange={e => handleUpdate("killReason", e.target.value)}>
                            <option value="">Select…</option>
                            <option value="feature_gap">Feature Gap</option>
                            <option value="price">Price</option>
                            <option value="ghosted">Ghosted</option>
                          </select>
                        </div>
                      )}
                      <div className="form-field">
                        <label className="field-label">Friction Point</label>
                        <select className="field-select" value={lead.frictionPoint || ""} onChange={e => handleUpdate("frictionPoint", e.target.value)}>
                          <option value="">Select…</option>
                          <option value="scaling">Scaling</option>
                          <option value="tech_debt">Tech Debt</option>
                          <option value="budget">Budget</option>
                        </select>
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="field-label">Internal Rating (1–10)</label>
                        <input className="field-input" type="number" min="1" max="10" defaultValue={lead.internalRating || ""} onBlur={e => handleUpdate("internalRating", parseInt(e.target.value))} />
                      </div>
                    </div>
                    <NotesSection leadId={lead.id} stageContext="resolve" />
                  </>
                )}
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
