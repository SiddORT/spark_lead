import { useState, useMemo, useEffect } from "react";
import {
  useGetLeads, useGetAnalyticsStats, useGetLeadTrend,
  useGetStageDistribution, useGetServices, useGetCompanies,
} from "@workspace/api-client-react";
import { useUserMap } from "@/hooks/use-user-map";
import { useDebounce } from "@/hooks/use-debounce";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { TablePagination } from "@/components/table-pagination";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { formatValue } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search, X, Download, Users, Flame, CheckCircle2,
  Activity, TrendingUp, LayoutDashboard, Filter,
} from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";

const PAGE_SIZE = 10;

const STAGE_COLORS: Record<string, string> = {
  discovery:     "hsl(210 15% 45%)",
  qualification: "var(--warning)",
  strategy:      "var(--purple)",
  resolution:    "var(--success)",
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

const tooltipStyle = {
  backgroundColor: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "var(--text-xs)",
};

export function Dashboard() {
  const { data: leads = [], isFetching: leadsFetching } = useGetLeads();
  const { data: stats } = useGetAnalyticsStats();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: stageDist = [] } = useGetStageDistribution();
  const { data: services = [] } = useGetServices();
  const { data: allCompanies = [] } = useGetCompanies();
  const { resolveName } = useUserMap();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Filter state
  const [searchRaw, setSearchRaw] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const search = useDebounce(searchRaw, 300);
  const isDebouncing = searchRaw !== search;

  const hasFilters = !!(searchRaw || serviceFilter || companyFilter || typeFilter);

  const clearFilters = () => {
    setSearchRaw("");
    setServiceFilter("");
    setCompanyFilter("");
    setTypeFilter("");
    setPage(1);
  };

  // Reset to page 1 on any filter change
  useEffect(() => { setPage(1); }, [search, serviceFilter, companyFilter, typeFilter]);

  // Also reset company filter if it's no longer valid when service changes
  useEffect(() => {
    if (!serviceFilter) return;
    const svc = services.find(s => s.id === serviceFilter);
    const validCompanyNames = (svc?.companies || []).map((c: any) => c.name);
    if (companyFilter && !validCompanyNames.includes(companyFilter)) {
      setCompanyFilter("");
    }
  }, [serviceFilter]);

  // Determine available companies for the company dropdown
  const availableCompanies = useMemo(() => {
    if (!serviceFilter) return allCompanies;
    const svc = services.find(s => s.id === serviceFilter);
    if (!svc) return allCompanies;
    const linked = new Set((svc.companies || []).map((c: any) => c.name));
    return allCompanies.filter(c => linked.has(c.name));
  }, [serviceFilter, services, allCompanies]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch = !q
        || l.leadName.toLowerCase().includes(q)
        || (l.company || "").toLowerCase().includes(q);
      const matchService = !serviceFilter || l.serviceId === serviceFilter;
      const matchCompany = !companyFilter || (l.company || "") === companyFilter;
      const matchType = !typeFilter || l.leadType === typeFilter;
      return matchSearch && matchService && matchCompany && matchType;
    });
  }, [leads, search, serviceFilter, companyFilter, typeFilter]);

  // Stats from filtered leads
  const hotCount       = filteredLeads.filter(l => l.leadType === "hot").length;
  const closedCount    = filteredLeads.filter(l => l.outcome === "closed").length;
  const pipelineValue  = filteredLeads.reduce(
    (s, l) => s + (l.outcome !== "closed" && l.outcome !== "lost" ? Number(l.dealValue || 0) : 0),
    0
  );
  const activePipeline = filteredLeads.filter(l => !l.outcome || (l.outcome !== "closed" && l.outcome !== "lost")).length;

  // Pagination
  const totalPages    = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const paginatedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page">
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
            <button className="btn btn-secondary" onClick={() => window.open("/api/leads/export/csv", "_blank")}>
              <Download size={15} /> Export CSV
            </button>
          </PermissionCheck>
        </div>
      </div>

      {/* Stat Cards — reflect filtered data */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <StatCard label="Total Leads" value={filteredLeads.length} icon={<Users size={16} />} iconClass="stat-icon-teal" sub={hasFilters ? "Matching filters" : "All leads"} />
        <StatCard label="Hot Leads" value={hotCount} icon={<Flame size={16} />} iconClass="stat-icon-warning" sub="High priority" />
        <StatCard label="Closed Deals" value={closedCount} icon={<CheckCircle2 size={16} />} iconClass="stat-icon-success" sub="Won opportunities" />
        <StatCard label="Active Pipeline" value={activePipeline} icon={<Activity size={16} />} iconClass="stat-icon-purple" sub="In progress" />
        <StatCard label="Pipeline Value" value={formatValue(pipelineValue)} icon={<TrendingUp size={16} />} iconClass="stat-icon-teal" sub="Active deals" />
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom: "var(--space-6)" }}>
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
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border-default)" }} />
              <Area type="monotone" dataKey="count" stroke="hsl(172 75% 48%)" strokeWidth={2.5} fillOpacity={1} fill="url(#tealGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ height: 280, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Pipeline by Stage</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageDist}>
              <XAxis dataKey="stage" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(222 16% 14% / 0.6)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {stageDist.map((entry, i) => (
                  <Cell key={i} fill={STAGE_COLORS[entry.stage] || "var(--border-strong)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads Table with Full Filter Bar */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Filter Bar */}
        <div className="table-toolbar" style={{ flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
          {/* Search */}
          <div className="search-input-wrapper" style={{ minWidth: 220, flex: "1 1 220px" }}>
            <Search size={15} />
            <input
              className="input"
              placeholder="Search leads or companies…"
              value={searchRaw}
              onChange={e => setSearchRaw(e.target.value)}
            />
            {isDebouncing && (
              <span style={{
                position: "absolute", right: "var(--space-3)", top: "50%", transform: "translateY(-50%)",
                fontSize: "var(--text-xs)", color: "var(--text-muted)",
              }}>
                …
              </span>
            )}
          </div>

          {/* Service filter */}
          <select
            className="input select-field"
            style={{ width: 180, flexShrink: 0 }}
            value={serviceFilter}
            onChange={e => { setServiceFilter(e.target.value); setCompanyFilter(""); }}
          >
            <option value="">All Services</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Company filter — filtered by selected service */}
          <select
            className="input select-field"
            style={{ width: 180, flexShrink: 0 }}
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
          >
            <option value="">All Companies</option>
            {availableCompanies.map((c: any) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Lead Type filter */}
          <select
            className="input select-field"
            style={{ width: 150, flexShrink: 0 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">☀️ Warm</option>
            <option value="cold">🧊 Cold</option>
            <option value="ghosted">👻 Ghosted</option>
          </select>

          {/* Filter indicator + Clear */}
          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              style={{ color: "var(--danger)", border: "1px solid var(--danger-dim)", flexShrink: 0 }}
            >
              <X size={13} /> Clear Filters
            </button>
          )}

          {/* Active filter count badge */}
          {hasFilters && (
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              <Filter size={12} />
              {[searchRaw, serviceFilter, companyFilter, typeFilter].filter(Boolean).length} active
            </span>
          )}
        </div>

        {/* Table */}
        <div style={{ position: "relative" }}>
          {/* Loading overlay when debouncing */}
          {isDebouncing && (
            <div style={{
              position: "absolute", inset: 0,
              background: "hsl(222 20% 9% / 0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "var(--text-sm)", color: "var(--text-muted)",
            }}>
              Searching…
            </div>
          )}

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
              {paginatedLeads.length > 0 ? paginatedLeads.map(lead => {
                const tc = TYPE_CONFIG[lead.leadType || "cold"] || TYPE_CONFIG.cold;
                return (
                  <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)}>
                    <td>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "var(--text-sm)" }}>
                        {lead.leadName}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${tc.cls}`}>{tc.emoji} {tc.label}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{lead.serviceName || "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{lead.company || "—"}</td>
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
                      <span className={`badge ${STAGE_BADGE[lead.stage || "discovery"] || "badge-muted"}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                );
              }) : (
                <tr style={{ cursor: "default" }}>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Search size={22} />
                      </div>
                      <div className="empty-state-title">No leads found</div>
                      <div className="empty-state-desc">
                        No leads match your current filters. Try adjusting your search criteria.
                      </div>
                      {hasFilters && (
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={clearFilters}>
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

        {/* Pagination footer */}
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
  label, value, icon, iconClass, sub
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
