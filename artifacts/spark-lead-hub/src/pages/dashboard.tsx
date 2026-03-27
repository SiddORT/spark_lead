import { useState } from "react";
import { useGetLeads, useGetAnalyticsStats, useGetLeadTrend, useGetStageDistribution } from "@workspace/api-client-react";
import { useUserMap } from "@/hooks/use-user-map";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { formatValue } from "@/lib/utils";
import { format } from "date-fns";
import {
  Download, Search, Users, Flame, CheckCircle2, Activity,
  TrendingUp, LayoutDashboard
} from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";

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
  const { data: leads = [] } = useGetLeads();
  const { data: stats } = useGetAnalyticsStats();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: stageDist = [] } = useGetStageDistribution();
  const { resolveName } = useUserMap();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = l.leadName.toLowerCase().includes(q) || (l.company || "").toLowerCase().includes(q);
    const matchType = !typeFilter || l.leadType === typeFilter;
    return matchSearch && matchType;
  });

  const hotCount = leads.filter(l => l.leadType === "hot").length;
  const closedCount = leads.filter(l => l.outcome === "closed").length;
  const pipelineValue = leads.reduce(
    (s, l) => s + (l.outcome !== "closed" && l.outcome !== "lost" ? Number(l.dealValue || 0) : 0),
    0
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <LayoutDashboard size={28} style={{ color: "var(--teal)" }} />
            Dashboard
          </h1>
          <p className="page-subtitle">Overview of your sales pipeline</p>
        </div>
        <div className="page-actions">
          <PermissionCheck resource="leads" action="export">
            <button className="btn btn-secondary" onClick={() => window.open("/api/leads/export/csv", "_blank")}>
              <Download size={15} /> Export CSV
            </button>
          </PermissionCheck>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <StatCard label="Total Leads" value={leads.length} icon={<Users size={16} />} iconClass="stat-icon-teal" sub={`${filteredLeads.length} shown`} />
        <StatCard label="Hot Leads" value={hotCount} icon={<Flame size={16} />} iconClass="stat-icon-warning" sub="High priority" />
        <StatCard label="Closed Deals" value={closedCount} icon={<CheckCircle2 size={16} />} iconClass="stat-icon-success" sub="Won opportunities" />
        <StatCard label="In Progress" value={stats?.activePipelineCount ?? 0} icon={<Activity size={16} />} iconClass="stat-icon-purple" sub="Active leads" />
        <StatCard label="Pipeline Value" value={formatValue(pipelineValue)} icon={<TrendingUp size={16} />} iconClass="stat-icon-teal" sub="Active deals" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card" style={{ height: 300, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Lead Generation (30 Days)</div>
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

        <div className="chart-card" style={{ height: 300, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Pipeline Stages</div>
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

      {/* Leads Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              className="input"
              placeholder="Search leads or companies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ width: 140 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="hot">Hot 🔥</option>
            <option value="warm">Warm ☀️</option>
            <option value="cold">Cold 🧊</option>
            <option value="ghosted">Ghosted 👻</option>
          </select>
          {(search || typeFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setTypeFilter(""); }}>
              Clear
            </button>
          )}
        </div>

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
            {filteredLeads.slice(0, 12).map(lead => {
              const tc = TYPE_CONFIG[lead.leadType || "cold"] || TYPE_CONFIG.cold;
              return (
                <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "var(--text-sm)" }}>{lead.leadName}</span>
                    </div>
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
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{resolveName(lead.leadOwner)}</span>
                    </div>
                  </td>
                  <td>
                    {lead.dealHandler ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div className="avatar avatar-sm avatar-purple">{resolveName(lead.dealHandler)[0]}</div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{resolveName(lead.dealHandler)}</span>
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
            })}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Search size={20} /></div>
                    <div className="empty-state-title">No leads found</div>
                    <div className="empty-state-desc">Try adjusting your search or filter criteria</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
