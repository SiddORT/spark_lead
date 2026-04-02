import { useState } from "react";
import { useCreateLead, useGetServices, useGetServiceCompanies } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useUserMap } from "@/hooks/use-user-map";
import { toast } from "sonner";
import { PlusCircle, ArrowLeft } from "lucide-react";
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
  const createLead = useCreateLead();
  const { users } = useUserMap();
  const { data: services } = useGetServices();
  const [primaryHover, setPrimaryHover] = useState(false);

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

            {/* Lead Company — full width */}
            <div>
              <FieldLabel>Lead Company</FieldLabel>
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

            {/* Service — full width */}
            <div>
              <FieldLabel>Service</FieldLabel>
              <CustomSelect
                value={formData.serviceId || null}
                onChange={val => set("serviceId", val)}
                placeholder="Select service…"
                options={(services || []).map(s => ({ value: s.id, label: s.name }))}
              />
            </div>

            {/* 2-col: Lead Owner + Deal Handler */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div>
                <FieldLabel>Lead Owner</FieldLabel>
                <CustomSelect
                  value={formData.leadOwner || null}
                  onChange={val => set("leadOwner", val)}
                  placeholder="Unassigned"
                  options={users
                    .filter(u => ["admin", "lead_owner"].includes(u.role))
                    .map(u => ({ value: u.id, label: u.displayName || u.email }))}
                />
              </div>
              <div>
                <FieldLabel>Deal Handler</FieldLabel>
                <CustomSelect
                  value={formData.dealHandler || null}
                  onChange={val => set("dealHandler", val)}
                  placeholder="Unassigned"
                  options={users
                    .filter(u => ["admin", "deal_handler"].includes(u.role))
                    .map(u => ({ value: u.id, label: u.displayName || u.email }))}
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
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StyledInput
                    type="date"
                    value={formData.followUpDate}
                    onChange={e => set("followUpDate", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    title="Set to today + 2 days"
                    onClick={() => set("followUpDate", getDefaultFollowUpDate())}
                    style={{
                      flexShrink: 0,
                      height: 42,
                      padding: "0 10px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--teal)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--teal)";
                      e.currentTarget.style.background = "var(--teal-dim)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border-default)";
                      e.currentTarget.style.background = "var(--bg-subtle)";
                    }}
                  >
                    +2 Days
                  </button>
                </div>
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
    </div>
  );
}
