import { useState, useMemo, useEffect } from "react";
import {
  useGetLeads, useGetAnalyticsStats, useGetLeadTrend,
  useGetServices, useGetCompanies,
} from "@workspace/api-client-react";
import { usePipelineStages } from "@/hooks/use-pipeline";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/skeleton";
import { useUserMap } from "@/hooks/use-user-map";
import { useDebounce } from "@/hooks/use-debounce";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { TablePagination } from "@/components/table-pagination";
import { FilterSelect } from "@/components/filter-select";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from "recharts";
import { formatValue } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search, X, Download, Users, Flame, CheckCircle2,
  Activity, TrendingUp, LayoutDashboard,
} from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";

const PAGE_SIZE = 10;

const STAGE_COLORS: Record<string, string> = {
  discovery:     "hsl(210, 15%, 48%)",
  qualification: "hsl(36, 88%, 52%)",
  strategy:      "hsl(258, 62%, 62%)",
  resolution:    "hsl(152, 58%, 43%)",
};

const TYPE_CONFIG: Record<string, { emoji: string; label: string; cls: string }> = {
  hot:     { emoji: "🔥", label: "Hot",     cls: "badge-hot" },
  warm:    { emoji: "☀️", label: "Warm",    cls: "badge-warm" },
  cold:    { emoji: "🧊", label: "Cold",    cls: "badge-cold" },
  ghosted: { emoji: "👻", label: "Ghosted", cls: "badge-ghosted" },
};

const STAGE_BADGE: Record<string, string> = {
  discovery:     "badge-discovery",
  qualification: "badge-qualification",
  strategy:      "badge-strategy",
  resolution:    "badge-resolution",
};

const LEAD_TYPE_OPTIONS = [
  { value: "hot",     label: "🔥 Hot" },
  { value: "warm",    label: "☀️ Warm" },
  { value: "cold",    label: "🧊 Cold" },
  { value: "ghosted", label: "👻 Ghosted" },
];

const tooltipStyle = {
  background: "hsl(222, 18%, 12%)",
  border: "1px solid hsl(222, 15%, 26%)",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "DM Sans, sans-serif",
  color: "hsl(210, 30%, 95%)",
  boxShadow: "0 8px 32px hsla(222, 22%, 2%, 0.6)",
};

const STAGE_LABELS: Record<string, string> = {
  discovery:     "Discovery",
  qualification: "Qualification",
  strategy:      "Strategy",
  resolution:    "Resolution",
};

// ─── Custom Pipeline Tooltip ──────────────────────────
function PipelineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value ?? 0;
  const color = payload[0]?.payload?.fill ?? "var(--teal)";
  return (
    <div style={{
      background: "hsl(222, 20%, 11%)",
      border: "1px solid hsl(222, 15%, 26%)",
      borderRadius: 10,
      padding: "8px 14px",
      boxShadow: "0 8px 32px hsla(222, 22%, 2%, 0.65)",
      fontFamily: "DM Sans, sans-serif",
      minWidth: 140,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(210, 30%, 92%)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontSize: 13, color: "hsl(210, 20%, 68%)", fontWeight: 500 }}>
          {count} {count === 1 ? "Lead" : "Leads"}
        </span>
      </div>
    </div>
  );
}

// ─── Custom Area Tooltip ──────────────────────────────
function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "hsl(222, 20%, 11%)",
      border: "1px solid hsl(222, 15%, 26%)",
      borderRadius: 10,
      padding: "8px 14px",
      boxShadow: "0 8px 32px hsla(222, 22%, 2%, 0.65)",
      fontFamily: "DM Sans, sans-serif",
    }}>
      <div style={{ fontSize: 12, color: "hsl(210, 14%, 50%)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(172, 72%, 50%)" }}>
        {payload[0]?.value} Leads
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: leads = [], isLoading: leadsLoading } = useGetLeads();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: pipelineStages = [] } = usePipelineStages();
  const { data: services = [] } = useGetServices();
  const { data: allCompanies = [] } = useGetCompanies();
  const { resolveName } = useUserMap();

  // Compute chart data from pipeline stages + leads
  const stageChartData = useMemo(() =>
    pipelineStages
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((stage) => ({
        stage: stage.displayName,
        count: leads.filter((l: any) => l.pipelineStageId === stage.id).length,
        fill: stage.color,
      })),
    [pipelineStages, leads]
  );

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const handleExportCsv = async () => {
    const token = localStorage.getItem("slh_token");
    const res = await fetch("/api/leads/export/csv", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter state
  const [searchRaw, setSearchRaw] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [page, setPage] = useState(1);

  const search = useDebounce(searchRaw, 300);
  const isDebouncing = searchRaw !== search;
  const hasFilters = !!(searchRaw || serviceFilter || companyFilter || typeFilter || stageFilter);
  const activeFilterCount = [searchRaw, serviceFilter, companyFilter, typeFilter, stageFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchRaw("");
    setServiceFilter("");
    setCompanyFilter("");
    setTypeFilter("");
    setStageFilter("");
    setPage(1);
  };

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, serviceFilter, companyFilter, typeFilter, stageFilter]);

  // Cascade: clear invalid company when service changes
  useEffect(() => {
    if (!serviceFilter) return;
    const svc = services.find((s: any) => s.id === serviceFilter);
    const valid = new Set((svc?.companies || []).map((c: any) => c.name));
    if (companyFilter && !valid.has(companyFilter)) setCompanyFilter("");
  }, [serviceFilter]);

  // Available companies (cascades from service selection)
  const availableCompanies = useMemo(() => {
    if (!serviceFilter) return allCompanies;
    const svc = services.find((s: any) => s.id === serviceFilter);
    if (!svc) return allCompanies;
    const linked = new Set((svc.companies || []).map((c: any) => c.name));
    return allCompanies.filter((c: any) => linked.has(c.name));
  }, [serviceFilter, services, allCompanies]);

  const serviceOptions = services.map((s: any) => ({ value: s.id, label: s.name }));
  const companyOptions = availableCompanies.map((c: any) => ({ value: c.name, label: c.name }));

  // Filtered leads
  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l: any) => {
      const companyNames: string[] = (l.companies || []).map((c: any) => c.name as string);
      const matchSearch = !q
        || l.leadName.toLowerCase().includes(q)
        || companyNames.some(n => n.toLowerCase().includes(q));
      const matchService = !serviceFilter || l.serviceId === serviceFilter;
      const matchCompany = !companyFilter || companyNames.some(n => n === companyFilter);
      const matchType = !typeFilter || l.leadType === typeFilter;
      const matchStage = !stageFilter || l.pipelineStageId === stageFilter;
      return matchSearch && matchService && matchCompany && matchType && matchStage;
    });
  }, [leads, search, serviceFilter, companyFilter, typeFilter, stageFilter]);

  // Stats from filtered data
  const hotCount       = filteredLeads.filter((l: any) => l.leadType === "hot").length;
  const closedCount    = filteredLeads.filter((l: any) => l.outcome === "closed").length;
  const pipelineValue  = filteredLeads.reduce(
    (s: number, l: any) => s + (l.outcome !== "closed" && l.outcome !== "lost" ? Number(l.dealValue || 0) : 0), 0
  );
  const activePipeline = filteredLeads.filter(
    (l: any) => !l.outcome || (l.outcome !== "closed" && l.outcome !== "lost")
  ).length;

  // Pagination
  const totalPages     = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const paginatedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Compute tbody rows outside JSX to avoid nested-ternary parse issues
  let tbodyRows: React.ReactNode;
  if (leadsLoading) {
    tbodyRows = Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={9} />);
  } else if (paginatedLeads.length > 0) {
    tbodyRows = paginatedLeads.map((lead: any) => {
      const tc = TYPE_CONFIG[lead.leadType || "cold"] || TYPE_CONFIG.cold;
      return (
        <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)}>
          <td>
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "var(--text-sm)" }}>
              {lead.leadName}
            </span>
            {lead.company && (
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 1 }}>
                {lead.company}
              </div>
            )}
          </td>
          <td>
            <span className={`badge ${tc.cls}`}>{tc.emoji} {tc.label}</span>
          </td>
          <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{lead.serviceName || "—"}</td>
          <td style={{ fontSize: "var(--text-xs)" }}>
            {lead.companies && lead.companies.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {lead.companies.slice(0, 2).map((c: any) => (
                  <span key={c.id} style={{
                    display: "inline-block",
                    padding: "1px 6px",
                    background: "hsl(172 75% 48% / 0.08)",
                    border: "1px solid hsl(172 75% 48% / 0.2)",
                    borderRadius: "var(--radius-full)",
                    color: "var(--teal)",
                    fontSize: 10,
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: "nowrap",
                  }}>{c.name}</span>
                ))}
                {lead.companies.length > 2 && (
                  <span style={{
                    display: "inline-block",
                    padding: "1px 6px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-full)",
                    color: "var(--text-muted)",
                    fontSize: 10,
                    fontWeight: 500,
                    lineHeight: 1.6,
                  }}>+{lead.companies.length - 2}</span>
                )}
              </div>
            ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
          </td>
          <td style={{ fontFamily: "monospace", fontSize: "var(--text-xs)", color: "var(--teal)", fontWeight: 600 }}>
            {lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString("en-IN")}` : "—"}
          </td>
          <td>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <div className="avatar avatar-sm">{resolveName(lead.leadOwner)[0]}</div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                {resolveName(lead.leadOwner)}
              </span>
            </div>
          </td>
          <td>
            {lead.dealHandler ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div className="avatar avatar-sm avatar-purple">{resolveName(lead.dealHandler)[0]}</div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                  {resolveName(lead.dealHandler)}
                </span>
              </div>
            ) : <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>—</span>}
          </td>
          <td>
            {lead.stageName ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 8px",
                background: `${lead.stageColor || "var(--teal)"}18`,
                border: `1px solid ${lead.stageColor || "var(--teal)"}30`,
                borderRadius: "var(--radius-full)",
                color: lead.stageColor || "var(--teal)",
                fontSize: "var(--text-xs)", fontWeight: 600, whiteSpace: "nowrap",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: lead.stageColor || "var(--teal)", flexShrink: 0 }} />
                {lead.stageName}
              </span>
            ) : (
              <span className={`badge ${STAGE_BADGE[lead.stage || "discovery"] || "badge-muted"}`}>
                {lead.stage}
              </span>
            )}
          </td>
          <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
            {format(new Date(lead.createdAt), "MMM d, yyyy")}
          </td>
        </tr>
      );
    });
  } else {
    tbodyRows = (
      <tr style={{ cursor: "default" }}>
        <td colSpan={9}>
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={22} /></div>
            <div className="empty-state-title">No leads found</div>
            <div className="empty-state-desc">
              No leads match your current filters. Try adjusting your search criteria.
            </div>
            {hasFilters && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "var(--space-3)" }}
                onClick={clearFilters}
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <LayoutDashboard size={28} style={{ color: "var(--teal)" }} />
            Dashboard
          </h1>
          <p className="page-subtitle">Pipeline overview — filtered in real-time</p>
        </div>
        <div className="page-actions">
          <PermissionCheck resource="leads" action="export">
            <button className="btn btn-secondary" onClick={handleExportCsv}>
              <Download size={15} /> Export CSV
            </button>
          </PermissionCheck>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "var(--space-4)",
        marginBottom: "var(--space-5)",
      }}>
        {leadsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Leads" value={filteredLeads.length} icon={<Users size={16} />} iconClass="stat-icon-teal" sub={hasFilters ? "Matching filters" : "All leads"} />
            <StatCard label="Hot Leads" value={hotCount} icon={<Flame size={16} />} iconClass="stat-icon-warning" sub="High priority" />
            <StatCard label="Closed Deals" value={closedCount} icon={<CheckCircle2 size={16} />} iconClass="stat-icon-success" sub="Won opportunities" />
            <StatCard label="Active Pipeline" value={activePipeline} icon={<Activity size={16} />} iconClass="stat-icon-purple" sub="In progress" />
            <StatCard label="Pipeline Value" value={formatValue(pipelineValue)} icon={<TrendingUp size={16} />} iconClass="stat-icon-teal" sub="Active deals" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom: "var(--space-5)" }}>
        <div className="chart-card" style={{ height: 280, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Lead Volume (30 Days)</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(172 75% 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(172 75% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <Tooltip
                cursor={{ stroke: "var(--border-default)" }}
                content={<AreaTooltip />}
              />
              <Area type="monotone" dataKey="count" stroke="hsl(172 75% 48%)" strokeWidth={2.5} fillOpacity={1} fill="url(#tealGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card" style={{ height: 280, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Pipeline by Stage</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stageChartData}
              margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 20%)" vertical={false} />
              <XAxis
                dataKey="stage"
                tick={{ fill: "hsl(210, 18%, 55%)", fontSize: 12, fontFamily: "DM Sans, sans-serif" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickFormatter={(val: string) => val.length > 14 ? val.slice(0, 13) + "…" : val}
              />
              <YAxis
                tick={{ fill: "hsl(210, 14%, 45%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "hsla(222, 15%, 25%, 0.4)" }}
                content={<PipelineTooltip />}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {stageChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    fillOpacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Standalone filter bar ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        marginBottom: "var(--space-3)",
      }}>
        {/* Search — takes all remaining space on the left */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
              flexShrink: 0,
            }}
          />
          <input
            value={searchRaw}
            onChange={e => setSearchRaw(e.target.value)}
            placeholder="Search leads or companies…"
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 38,
              paddingRight: searchRaw ? 34 : "var(--space-3)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
              outline: "none",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
              boxSizing: "border-box",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "var(--teal)";
              e.currentTarget.style.boxShadow   = "0 0 0 3px hsl(172 75% 48% / 0.12), 0 0 8px hsl(172 75% 48% / 0.12)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow   = "none";
            }}
          />
          {/* Live debounce spinner */}
          {isDebouncing && (
            <span style={{
              position: "absolute", right: searchRaw ? 34 : 10,
              top: "50%", transform: "translateY(-50%)",
              fontSize: 10, color: "var(--text-muted)", pointerEvents: "none",
            }}>●</span>
          )}
          {searchRaw && !isDebouncing && (
            <button
              onClick={() => setSearchRaw("")}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", display: "flex", alignItems: "center",
                padding: 2, borderRadius: "var(--radius-sm)",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Custom dropdowns — right side, gap-3 between them */}
        <FilterSelect
          value={serviceFilter}
          onChange={v => { setServiceFilter(v); setCompanyFilter(""); }}
          options={serviceOptions}
          placeholder="All Services"
          width={165}
        />
        <FilterSelect
          value={companyFilter}
          onChange={setCompanyFilter}
          options={companyOptions}
          placeholder="All Companies"
          width={165}
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={LEAD_TYPE_OPTIONS}
          placeholder="All Types"
          width={145}
        />
        <FilterSelect
          value={stageFilter}
          onChange={setStageFilter}
          options={(pipelineStages as any[])
            .filter((s: any) => s.isActive)
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            .map((s: any) => ({ value: s.id, label: s.displayName }))}
          placeholder="All Stages"
          width={175}
        />

        {/* Clear button + active count */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 40, padding: "0 var(--space-3)",
              background: "hsl(0 75% 50% / 0.06)",
              border: "1px solid hsl(0 75% 50% / 0.25)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 120ms ease",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <X size={13} />
            Clear
            <span style={{
              background: "var(--danger)",
              color: "#fff",
              borderRadius: 100,
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 6px",
              lineHeight: 1.5,
            }}>
              {activeFilterCount}
            </span>
          </button>
        )}
      </div>

      {/* ─── Leads table card ─── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Debounce overlay */}
        <div style={{ position: "relative" }}>
          {isDebouncing && (
            <div style={{
              position: "absolute", inset: 0,
              background: "hsl(222 20% 9% / 0.35)",
              backdropFilter: "blur(2px)",
              zIndex: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "var(--text-sm)", color: "var(--text-muted)",
            }}>
              Searching…
            </div>
          )}

          <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Type</th>
                <th>Service</th>
                <th>Company</th>
                <th>Value</th>
                <th>Owner</th>
                <th>Handler</th>
                <th>Stage</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tbodyRows}
            </tbody>
          </table>
          </div> {/* table-scroll-wrapper */}
        </div> {/* relative wrapper */}

        {/* Pagination — natural base of the table */}
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={filteredLeads.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onOpenChange={open => !open && setSelectedLeadId(null)}
      />
    </div>
  );
}

function StatCard({
  label, value, icon, iconClass, sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass: string;
  sub?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
