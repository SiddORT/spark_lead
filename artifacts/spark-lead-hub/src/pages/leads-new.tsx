import { useState, useEffect } from "react";
import {
  useCreateLead, useGetServices, useGetServiceCompanies,
  useGetTeamMembers, useCreateService, useLinkServiceCompanies,
  useGetCompanies,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PlusCircle, ArrowLeft, X, Building2 } from "lucide-react";
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

export function NewLead() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createLead = useCreateLead();
  const createService = useCreateService();
  const linkServiceCompanies = useLinkServiceCompanies();
  const { data: teamMembers = [] } = useGetTeamMembers();
  const whitelistedUsers = (teamMembers as any[]).filter((m: any) => m.whitelistStatus === "active");
  const { data: services = [] } = useGetServices();
  const { data: allCompanies = [] } = useGetCompanies();
  const [primaryHover, setPrimaryHover] = useState(false);

  // "Add New Service" modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCompanyIds, setNewServiceCompanyIds] = useState<string[]>([]);
  const [savingService, setSavingService] = useState(false);

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

      // 1. Optimistically add the new service into the React Query cache so
      //    the dropdown option exists BEFORE we update selectedService.
      const linkedCompanyObjs = (allCompanies as any[]).filter((c: any) => newServiceCompanyIds.includes(c.id));
      const newSvcEntry = { ...(newSvc as any), companies: linkedCompanyObjs };
      queryClient.setQueryData(["/api/services"], (old: any) =>
        Array.isArray(old) ? [...old, newSvcEntry] : [newSvcEntry]
      );

      // 2. Also trigger a background refetch for eventual consistency.
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });

      // 3. Also invalidate service-companies cache for the new id (used by
      //    the Link Companies section below the dropdown).
      queryClient.invalidateQueries({ queryKey: [`/api/services/${(newSvc as any).id}/companies`] });

      // 4. Update form: select the new service and clear companyIds (the
      //    company checkboxes will re-render once useGetServiceCompanies resolves).
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

  const [isDuplicate, setIsDuplicate] = useState(false);
  const [formData, setFormData] = useState<any>({
    leadName: "",
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
  });

  // Pre-fill form when duplicating an existing lead
  useEffect(() => {
    const raw = sessionStorage.getItem("slh_duplicate_lead");
    if (!raw) return;
    sessionStorage.removeItem("slh_duplicate_lead");
    try {
      const src = JSON.parse(raw);
      setFormData((prev: any) => ({
        ...prev,
        leadName:        src.leadName ? `${src.leadName} (Copy)` : "",
        company:         src.company        ?? "",
        leadType:        src.leadType       ?? "cold",
        contactEmail:    src.contactEmail   ?? "",
        phone:           src.phone          ?? "",
        serviceId:       src.serviceId      ?? "",
        leadOwner:       src.leadOwner      ?? "",
        dealHandler:     src.dealHandler    ?? "",
        dealValue:       src.dealValue      ?? "",
        pipelineStageId: src.pipelineStageId ?? "",
        companyIds:      Array.isArray(src.companyIds) ? src.companyIds : [],
      }));
      setIsDuplicate(true);
    } catch {
      // malformed sessionStorage value — ignore
    }
  }, []);

  const { data: companies } = useGetServiceCompanies(formData.serviceId, {
    query: { enabled: !!formData.serviceId },
  });

  const set = (key: string, value: any) => setFormData((f: any) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadName) { toast.error("Lead name is required"); return; }
    createLead.mutate({ data: formData }, {
      onSuccess: () => { toast.success("Lead created successfully"); setLocation("/"); },
      onError: (err: any) => toast.error(err.message || "Failed to create lead"),
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      padding: "var(--space-8) var(--space-6)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Back link */}
      <div style={{ width: "100%", maxWidth: 720, marginBottom: "var(--space-5)" }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "var(--text-sm)",
            fontFamily: "var(--font-sans)", transition: "color 150ms ease", padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      </div>

      {/* Duplicate banner */}
      {isDuplicate && (
        <div style={{
          width: "100%",
          maxWidth: 720,
          marginBottom: "var(--space-4)",
          padding: "var(--space-3) var(--space-4)",
          borderRadius: "var(--radius-lg)",
          background: "hsla(47, 96%, 53%, 0.10)",
          border: "1px solid hsla(47, 96%, 53%, 0.30)",
          color: "hsl(47, 96%, 65%)",
          fontSize: "var(--text-sm)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}>
          <span style={{ fontSize: "1rem" }}>📄</span>
          Duplicating lead — review the pre-filled details and make any changes before creating.
        </div>
      )}

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 720,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "0 24px 48px hsl(222 22% 3% / 0.4)",
        overflow: "hidden",
      }}>
        {/* Card header */}
        <div style={{
          padding: "var(--space-6) var(--space-8)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}>
          <div style={{
            width: 4, height: 28,
            background: "var(--teal)",
            borderRadius: 2,
            boxShadow: "0 0 12px hsl(172 75% 48% / 0.5)",
            flexShrink: 0,
          }} />
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}>
              Create New Lead
            </h1>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
              Fill in the details below to add a lead to the pipeline
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "var(--space-8)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {/* Lead Name — full width */}
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

            {/* Lead Reference — full width */}
            <div>
              <FieldLabel>Lead Reference</FieldLabel>
              <StyledInput
                value={formData.company}
                onChange={e => set("company", e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>

            {/* 2-col: Lead Type + Deal Value */}
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
                  onChange={e => set("dealValue", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Pipeline Stage + Status */}
            <div>
              <FieldLabel>Pipeline Stage &amp; Status</FieldLabel>
              <StageStatusSelect
                stageId={formData.pipelineStageId}
                statusId={formData.pipelineStatusId}
                onStageChange={(stageId) => { set("pipelineStageId", stageId); set("pipelineStatusId", ""); }}
                onStatusChange={(statusId) => set("pipelineStatusId", statusId)}
              />
            </div>

            {/* 2-col: Contact Email + Phone */}
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

            {/* Service — full width with inline "Add" button */}
            <div>
              <FieldLabel>Service</FieldLabel>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CustomSelect
                    value={formData.serviceId || null}
                    onChange={val => { set("serviceId", val); set("companyIds", []); }}
                    placeholder="Select service…"
                    options={(services as any[]).map((s: any) => ({ value: s.id, label: s.name }))}
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

            {/* 2-col: Lead Owner + Deal Handler */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div>
                <FieldLabel>Lead Owner</FieldLabel>
                <CustomSelect
                  value={formData.leadOwner || null}
                  onChange={val => set("leadOwner", val)}
                  placeholder="Unassigned"
                  options={whitelistedUsers
                    .map((u: any) => ({ value: u.id, label: u.displayName || u.email }))}
                />
              </div>
              <div>
                <FieldLabel>Deal Handler</FieldLabel>
                <CustomSelect
                  value={formData.dealHandler || null}
                  onChange={val => set("dealHandler", val)}
                  placeholder="Unassigned"
                  options={whitelistedUsers
                    .map((u: any) => ({ value: u.id, label: u.displayName || u.email }))}
                />
              </div>
            </div>

            {/* Link Companies — conditional */}
            {formData.serviceId && companies && companies.length > 0 && (
              <div style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
              }}>
                <FieldLabel>Link Companies</FieldLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginTop: 4 }}>
                  {companies.map(c => (
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

            {/* 2-col: Follow-Up Date + Next Action / Notes header */}
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

          {/* Button row — right aligned */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid var(--border-subtle)",
          }}>
            <button
              type="button"
              onClick={() => setLocation("/")}
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
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.background = "var(--bg-subtle)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
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
        </form>
      </div>

      {/* ── Add New Service Modal ── */}
      {showServiceModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowServiceModal(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "hsl(222 22% 3% / 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <div style={{
            width: "100%", maxWidth: 480,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 32px 64px hsl(222 22% 3% / 0.6), 0 0 0 1px hsl(172 75% 48% / 0.08)",
            overflow: "hidden",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "var(--space-5) var(--space-6)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--radius-md)",
                  background: "hsl(172 75% 48% / 0.12)",
                  border: "1px solid hsl(172 75% 48% / 0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Building2 size={15} style={{ color: "var(--teal)" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                    Add New Service
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 1 }}>
                    Create and link to companies in one step
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                style={{
                  width: 30, height: 30, borderRadius: "var(--radius-sm)",
                  background: "transparent", border: "1px solid var(--border-default)",
                  color: "var(--text-muted)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "var(--space-6)" }}>
              {/* Service Name */}
              <div style={{ marginBottom: "var(--space-5)" }}>
                <FieldLabel required>Service Name</FieldLabel>
                <StyledInput
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="e.g. Cloud Migration"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateService(); } }}
                  autoFocus
                />
              </div>

              {/* Link Companies */}
              <div>
                <FieldLabel required>Link to Companies</FieldLabel>
                <p style={{ margin: "0 0 10px", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  Select at least one company this service applies to
                </p>
                {(allCompanies as any[]).length === 0 ? (
                  <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--text-sm)", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                    No companies found — add companies first
                  </div>
                ) : (
                  <div style={{
                    maxHeight: 220, overflowY: "auto",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-2)",
                  }}>
                    {(allCompanies as any[]).map((c: any) => {
                      const checked = newServiceCompanyIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "var(--space-3)",
                            padding: "8px 10px", borderRadius: "var(--radius-sm)",
                            cursor: "pointer", transition: "background 120ms ease",
                            background: checked ? "hsl(172 75% 48% / 0.08)" : "transparent",
                          }}
                          onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = checked ? "hsl(172 75% 48% / 0.08)" : "transparent"; }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => setNewServiceCompanyIds(prev =>
                              e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                            )}
                            style={{ accentColor: "var(--teal)", width: 15, height: 15, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {newServiceCompanyIds.length > 0 && (
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--teal)" }}>
                    {newServiceCompanyIds.length} {newServiceCompanyIds.length === 1 ? "company" : "companies"} selected
                  </p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: "var(--space-4) var(--space-6)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex", justifyContent: "flex-end", gap: "var(--space-3)",
            }}>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                disabled={savingService}
                style={{
                  height: 38, padding: "0 18px",
                  background: "transparent", border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)", color: "var(--text-secondary)",
                  fontSize: "var(--text-sm)", fontWeight: 500, fontFamily: "var(--font-sans)",
                  cursor: savingService ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateService}
                disabled={savingService}
                style={{
                  height: 38, padding: "0 24px",
                  background: savingService ? "hsl(172 75% 48% / 0.6)" : "var(--teal)",
                  color: "hsl(222 22% 6%)", border: "none",
                  borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)",
                  fontWeight: 700, fontFamily: "var(--font-sans)",
                  cursor: savingService ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                }}
              >
                <PlusCircle size={14} />
                {savingService ? "Saving…" : "Save Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
