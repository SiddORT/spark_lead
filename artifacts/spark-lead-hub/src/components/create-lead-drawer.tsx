import { useState, useEffect, useRef } from "react";
import {
  useCreateLead, useGetServices, useGetServiceCompanies,
  useGetTeamMembers, useCreateService, useLinkServiceCompanies,
  useGetCompanies,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, X } from "lucide-react";
import { StageStatusSelect } from "@/components/stage-status-select";
import { CustomSelect } from "@/components/custom-select";

function getDefaultFollowUpDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={{
    display: "block",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    marginBottom: 6,
  }}>
    {children}
    {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
  </label>
);

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  background: "var(--bg-subtle)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "var(--text-sm)",
  outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
};

const focusStyle: React.CSSProperties = {
  borderColor: "var(--teal)",
  boxShadow: "0 0 0 3px hsl(172 75% 48% / 0.12), 0 0 8px hsl(172 75% 48% / 0.1)",
};

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...fieldStyle, ...(focused ? focusStyle : {}), ...props.style }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...fieldStyle,
        height: "auto",
        padding: "10px 12px",
        resize: "none",
        ...(focused ? focusStyle : {}),
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function resetForm() {
  return {
    leadName: "",
    description: "",
    company: "",
    leadType: "cold",
    contactEmail: "",
    phone: "",
    serviceId: "",
    leadOwner: "",
    dealHandler: "",
    dealValue: "",
    nextAction: "",
    followUpDate: getDefaultFollowUpDate(),
    companyIds: [],
    pipelineStageId: "",
    pipelineStatusId: "",
  };
}

interface CreateLeadDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CreateLeadDrawer({ open, onClose }: CreateLeadDrawerProps) {
  const queryClient = useQueryClient();
  const createLead = useCreateLead();
  const createService = useCreateService();
  const linkServiceCompanies = useLinkServiceCompanies();
  const { data: teamMembers = [] } = useGetTeamMembers();
  const whitelistedUsers = (teamMembers as any[]).filter((m: any) => m.whitelistStatus === "active");
  const { data: services = [] } = useGetServices();
  const { data: allCompanies = [] } = useGetCompanies();

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCompanyIds, setNewServiceCompanyIds] = useState<string[]>([]);
  const [savingService, setSavingService] = useState(false);
  const [primaryHover, setPrimaryHover] = useState(false);
  const [formData, setFormData] = useState<any>(resetForm());

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFormData(resetForm());
      setShowServiceModal(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (key: string, value: any) => setFormData((f: any) => ({ ...f, [key]: value }));

  const { data: companies } = useGetServiceCompanies(formData.serviceId, {
    query: { enabled: !!formData.serviceId },
  });

  const handleCreateService = async () => {
    const trimmed = newServiceName.trim();
    if (!trimmed) { toast.error("Service name is required"); return; }
    if ((services as any[]).some((s: any) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A service with this name already exists"); return;
    }
    if (newServiceCompanyIds.length === 0) { toast.error("Select at least one company"); return; }

    setSavingService(true);
    try {
      const newSvc = await createService.mutateAsync({ data: { name: trimmed } });
      await linkServiceCompanies.mutateAsync({ id: (newSvc as any).id, data: { companyIds: newServiceCompanyIds } });

      const linkedCompanyObjs = (allCompanies as any[]).filter((c: any) => newServiceCompanyIds.includes(c.id));
      const newSvcEntry = { ...(newSvc as any), companies: linkedCompanyObjs };
      queryClient.setQueryData(["/api/services"], (old: any) =>
        Array.isArray(old) ? [...old, newSvcEntry] : [newSvcEntry]
      );
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${(newSvc as any).id}/companies`] });

      set("serviceId", (newSvc as any).id);
      set("companyIds", []);
      setShowServiceModal(false);
      toast.success(`Service "${trimmed}" created and selected`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create service");
    } finally {
      setSavingService(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadName) { toast.error("Lead name is required"); return; }
    createLead.mutate({ data: formData }, {
      onSuccess: () => {
        toast.success("Lead created successfully");
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        onClose();
      },
      onError: (err: any) => toast.error(err.message || "Failed to create lead"),
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "hsl(222 22% 3% / 0.7)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
          animation: "fadeIn 150ms ease",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(760px, 100vw)",
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "-24px 0 80px hsl(222 22% 3% / 0.5)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-5) var(--space-6)",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 4, height: 28,
            background: "var(--teal)",
            borderRadius: 2,
            boxShadow: "0 0 12px hsl(172 75% 48% / 0.5)",
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}>
              Create New Lead
            </h2>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
              Fill in the details below to add a lead to the pipeline
            </p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "background 150ms ease, color 150ms ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6) var(--space-6)" }}>
          <form onSubmit={handleSubmit} id="fab-create-lead-form">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

              <div>
                <FieldLabel required>Lead Name</FieldLabel>
                <StyledInput
                  required
                  value={formData.leadName}
                  onChange={e => set("leadName", e.target.value)}
                  placeholder="e.g. Acme Corp Expansion"
                  style={{ height: 48, fontSize: "var(--text-base)" }}
                />
              </div>

              <div>
                <FieldLabel>Lead Reference</FieldLabel>
                <StyledInput
                  value={formData.company}
                  onChange={e => set("company", e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <FieldLabel>Lead Type</FieldLabel>
                  <CustomSelect
                    value={formData.leadType}
                    onChange={val => set("leadType", val)}
                    options={[
                      { value: "hot",     label: "Hot",     prefix: "🔥" },
                      { value: "warm",    label: "Warm",    prefix: "☀️" },
                      { value: "cold",    label: "Cold",    prefix: "🧊" },
                      { value: "ghosted", label: "Ghosted", prefix: "👻" },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel>Deal Value (₹)</FieldLabel>
                  <StyledInput
                    type="number"
                    value={formData.dealValue}
                    onChange={e => set("dealValue", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <StyledTextarea
                  value={formData.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Brief overview of this lead — context, source, or initial notes…"
                  rows={3}
                />
              </div>

              <div>
                <FieldLabel>Pipeline Stage &amp; Status</FieldLabel>
                <StageStatusSelect
                  stageId={formData.pipelineStageId}
                  statusId={formData.pipelineStatusId}
                  onStageChange={(stageId) => { set("pipelineStageId", stageId); set("pipelineStatusId", ""); }}
                  onStatusChange={(statusId) => set("pipelineStatusId", statusId)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <FieldLabel>Contact Email</FieldLabel>
                  <StyledInput
                    type="email"
                    value={formData.contactEmail}
                    onChange={e => set("contactEmail", e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <StyledInput
                    type="tel"
                    value={formData.phone}
                    onChange={e => set("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Service</FieldLabel>
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CustomSelect
                      value={formData.serviceId || null}
                      onChange={val => { set("serviceId", val); set("companyIds", []); }}
                      placeholder="Select service…"
                      options={(services as any[]).map((s: any) => ({ value: s.id, label: s.name }))}
                      searchable
                    />
                  </div>
                  <button
                    type="button"
                    title="Add new service"
                    onClick={() => { setNewServiceName(""); setNewServiceCompanyIds([]); setShowServiceModal(true); }}
                    style={{
                      height: 42, padding: "0 14px", flexShrink: 0,
                      background: "hsl(172 75% 48% / 0.08)",
                      border: "1px solid hsl(172 75% 48% / 0.3)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--teal)",
                      fontSize: "var(--text-sm)", fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer", whiteSpace: "nowrap",
                      transition: "background 150ms ease, border-color 150ms ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "hsl(172 75% 48% / 0.15)"; e.currentTarget.style.borderColor = "hsl(172 75% 48% / 0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "hsl(172 75% 48% / 0.08)"; e.currentTarget.style.borderColor = "hsl(172 75% 48% / 0.3)"; }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <FieldLabel>Lead Owner</FieldLabel>
                  <CustomSelect
                    value={formData.leadOwner || null}
                    onChange={val => set("leadOwner", val)}
                    placeholder="Unassigned"
                    options={whitelistedUsers.map((u: any) => ({ value: u.id, label: u.displayName || u.email }))}
                    searchable
                  />
                </div>
                <div>
                  <FieldLabel>Deal Handler</FieldLabel>
                  <CustomSelect
                    value={formData.dealHandler || null}
                    onChange={val => set("dealHandler", val)}
                    placeholder="Unassigned"
                    options={whitelistedUsers.map((u: any) => ({ value: u.id, label: u.displayName || u.email }))}
                    searchable
                  />
                </div>
              </div>

              {formData.serviceId && companies && companies.length > 0 && (
                <div style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                }}>
                  <FieldLabel>Link Companies</FieldLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginTop: 4 }}>
                    {companies.map((c: any) => (
                      <label key={c.id} style={{
                        display: "flex", alignItems: "center", gap: "var(--space-2)",
                        fontSize: "var(--text-sm)", color: "var(--text-secondary)",
                        cursor: "pointer", padding: "var(--space-1) 0",
                      }}>
                        <input
                          type="checkbox"
                          style={{ accentColor: "var(--teal)", width: 15, height: 15 }}
                          onChange={e => {
                            const ids = formData.companyIds || [];
                            set("companyIds", e.target.checked ? [...ids, c.id] : ids.filter((id: string) => id !== c.id));
                          }}
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <FieldLabel>Follow-Up Date</FieldLabel>
                  <StyledInput
                    type="date"
                    value={formData.followUpDate}
                    onChange={e => set("followUpDate", e.target.value)}
                  />
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                    Default: 2 days from today
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <FieldLabel>Next Action / Notes</FieldLabel>
                  <StyledTextarea
                    value={formData.nextAction}
                    onChange={e => set("nextAction", e.target.value)}
                    placeholder="Next steps or initial context…"
                    rows={3}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer with actions */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
          gap: "var(--space-3)",
          padding: "var(--space-4) var(--space-6)",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 42, padding: "0 20px",
              background: "transparent",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "color 150ms ease, border-color 150ms ease, background 150ms ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.background = "var(--bg-subtle)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.background = "transparent"; }}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="fab-create-lead-form"
            disabled={createLead.isPending}
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            style={{
              height: 42, padding: "0 32px",
              background: createLead.isPending ? "hsl(172 75% 48% / 0.6)" : "var(--teal)",
              color: "hsl(222 22% 6%)",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              cursor: createLead.isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              filter: primaryHover && !createLead.isPending ? "brightness(1.1)" : "none",
              boxShadow: primaryHover && !createLead.isPending ? "0 0 20px hsl(172 75% 48% / 0.3)" : "none",
              transition: "filter 150ms ease, box-shadow 150ms ease",
            }}
          >
            <PlusCircle size={15} />
            {createLead.isPending ? "Creating…" : "Create Lead"}
          </button>
        </div>
      </div>

      {/* Add New Service sub-modal */}
      {showServiceModal && (
        <>
          <div
            onClick={() => setShowServiceModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "hsl(222 22% 3% / 0.5)",
              zIndex: 10000,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(480px, 90vw)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 64px hsl(222 22% 3% / 0.6)",
            zIndex: 10001,
            padding: "var(--space-6)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Add New Service
              </h3>
              <button onClick={() => setShowServiceModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <FieldLabel required>Service Name</FieldLabel>
                <StyledInput
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="e.g. Cloud Hosting"
                  autoFocus
                />
              </div>
              {(allCompanies as any[]).length > 0 && (
                <div>
                  <FieldLabel required>Link Companies</FieldLabel>
                  <div style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-2) var(--space-3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}>
                    {(allCompanies as any[]).map((c: any) => (
                      <label key={c.id} style={{
                        display: "flex", alignItems: "center", gap: "var(--space-2)",
                        fontSize: "var(--text-sm)", color: "var(--text-secondary)",
                        cursor: "pointer", padding: "4px 0",
                      }}>
                        <input
                          type="checkbox"
                          style={{ accentColor: "var(--teal)", width: 14, height: 14 }}
                          checked={newServiceCompanyIds.includes(c.id)}
                          onChange={e => setNewServiceCompanyIds(ids =>
                            e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id)
                          )}
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
              <button
                onClick={() => setShowServiceModal(false)}
                style={{
                  height: 38, padding: "0 16px",
                  background: "transparent", border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)", color: "var(--text-secondary)",
                  fontSize: "var(--text-sm)", fontFamily: "var(--font-sans)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateService}
                disabled={savingService}
                style={{
                  height: 38, padding: "0 20px",
                  background: "var(--teal)", color: "hsl(222 22% 6%)",
                  border: "none", borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)", fontWeight: 700,
                  fontFamily: "var(--font-sans)", cursor: savingService ? "not-allowed" : "pointer",
                  opacity: savingService ? 0.7 : 1,
                }}
              >
                {savingService ? "Creating…" : "Create Service"}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
