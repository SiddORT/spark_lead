import { useState, useMemo, useEffect, useRef } from "react";
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
  BarChart, Bar, Cell, CartesianGrid, Legend,
} from "recharts";
import { formatValue } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search, X, Download, Users, Flame, CheckCircle2,
  Activity, TrendingUp, LayoutDashboard,
  ChevronUp, ChevronDown, ChevronsUpDown, Layers,
} from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
function StackedPipelineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const meta: Record<string, { count: number; value: number; displayName: string; color: string }> =
    payload[0]?.payload?.__meta ?? {};
  const entries = Object.entries(meta).filter(([, v]) => v.count > 0);
  const total = entries.reduce((s, [, v]) => s + v.count, 0);
  return (
    <div style={{
      background: "hsl(222, 20%, 11%)",
      border: "1px solid hsl(222, 15%, 26%)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 8px 32px hsla(222, 22%, 2%, 0.65)",
      fontFamily: "DM Sans, sans-serif",
      minWidth: 180,
      maxWidth: 260,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(210, 30%, 92%)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "hsl(210, 14%, 50%)", marginBottom: 8 }}>
        {total} {total === 1 ? "lead" : "leads"} total
      </div>
      {entries.map(([key, v]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "hsl(210, 18%, 65%)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {v.displayName}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(210, 30%, 88%)", flexShrink: 0 }}>
            {v.count}
          </span>
          {v.value > 0 && (
            <span style={{ fontSize: 11, color: "hsl(172, 65%, 48%)", flexShrink: 0, marginLeft: 4 }}>
              ₹{(v.value / 10_000_000).toFixed(2)}Cr
            </span>
          )}
        </div>
      ))}
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "hsl(210, 14%, 45%)" }}>No leads</div>
      )}
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

  // ─── Stacked Pipeline Chart Data ───────────────────────────
  const stageChartData = useMemo(() => {
    const activeStages = (pipelineStages as any[])
      .filter((s: any) => s.isActive)
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    return activeStages.map((stage: any) => {
      const stageLeads = (leads as any[]).filter((l: any) => l.pipelineStageId === stage.id);
      const stageStatuses = (stage.statuses as any[])
        .filter((st: any) => st.isActive)
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder);

      const row: any = {
        stage: stage.displayName,
        stageColor: stage.color,
        __meta: {} as Record<string, { count: number; value: number; displayName: string; color: string }>,
      };

      for (const status of stageStatuses) {
        const statusLeads = stageLeads.filter((l: any) => l.pipelineStatusId === status.id);
        const count = statusLeads.length;
        const value = statusLeads.reduce((s: number, l: any) => s + Number(l.dealValue || 0), 0);
        row[status.id] = count;
        row.__meta[status.id] = { count, value, displayName: status.displayName, color: status.color };
      }

      return row;
    });
  }, [pipelineStages, leads]);

  // All unique status keys in display order (for rendering a <Bar> per status)
  // Only includes statuses defined in Pipeline Master — no hardcoded extras
  const stackedStatusKeys = useMemo(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const row of stageChartData) {
      for (const key of Object.keys(row)) {
        if (["stage", "stageColor", "__meta"].includes(key)) continue;
        if (!seen.has(key)) { seen.add(key); keys.push(key); }
      }
    }
    return keys;
  }, [stageChartData]);

  // Map: status ID → { displayName, color } — sourced purely from Pipeline Master
  const statusMetaById = useMemo(() => {
    const map = new Map<string, { displayName: string; color: string }>();
    for (const stage of (pipelineStages as any[])) {
      for (const st of (stage.statuses ?? [])) {
        map.set(st.id, { displayName: st.displayName, color: st.color });
      }
    }
    return map;
  }, [pipelineStages]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showLegendPopover, setShowLegendPopover] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const legendBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLegendPopover) return;
    const handler = (e: MouseEvent) => {
      if (legendBtnRef.current && !legendBtnRef.current.contains(e.target as Node)) {
        setShowLegendPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLegendPopover]);

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
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = Number(localStorage.getItem("slh_rows_per_page"));
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 10;
  });

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

  // Sort state — default: most recently updated first
  type SortKey = "leadName" | "leadType" | "serviceName" | "company" | "dealValue" | "stageSortOrder" | "updatedAt";
  type SortDir = "asc" | "desc";
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc"); // always reset to asc when switching column
    }
    setPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ color: "var(--teal)" }} />
      : <ChevronDown size={12} style={{ color: "var(--teal)" }} />;
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
  // A lead is Won if EITHER the new pipeline statusIsWon flag OR the legacy outcome === "closed"
  // A lead is Lost if EITHER the new pipeline statusIsLost flag OR the legacy outcome === "lost"
  const isWon  = (l: any) => l.statusIsWon  === true || l.outcome === "closed";
  const isLost = (l: any) => l.statusIsLost === true || l.outcome === "lost";
  const isTerminal = (l: any) => isWon(l) || isLost(l);

  const hotCount       = filteredLeads.filter((l: any) => l.leadType === "hot").length;
  const closedCount    = filteredLeads.filter(isWon).length;
  const pipelineValue  = filteredLeads.reduce(
    (s: number, l: any) => s + Number(l.dealValue || 0), 0
  );
  const activePipeline = filteredLeads.filter((l: any) => !isTerminal(l)).length;

  const formatCrores = (rupees: number) =>
    `₹${(rupees / 10_000_000).toFixed(2)}Cr`;

  // Dynamic column sort (default: newest first)
  const sortedLeads = useMemo(() => {
    const TYPE_ORDER: Record<string, number> = { hot: 0, warm: 1, cold: 2, ghosted: 3 };
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredLeads].sort((a: any, b: any) => {
      switch (sortKey) {
        case "leadName":
          return dir * (a.leadName || "").localeCompare(b.leadName || "");
        case "leadType":
          return dir * ((TYPE_ORDER[a.leadType] ?? 4) - (TYPE_ORDER[b.leadType] ?? 4));
        case "serviceName":
          return dir * (a.serviceName || "").localeCompare(b.serviceName || "");
        case "company": {
          const an = (a.companies || []).find((c: any) => c?.name)?.name || "";
          const bn = (b.companies || []).find((c: any) => c?.name)?.name || "";
          return dir * an.localeCompare(bn);
        }
        case "dealValue":
          return dir * (Number(a.dealValue || 0) - Number(b.dealValue || 0));
        case "stageSortOrder":
          return dir * ((a.stageSortOrder ?? 999) - (b.stageSortOrder ?? 999));
        case "updatedAt":
        default:
          return dir * (new Date(a.updatedAt || a.createdAt || 0).getTime() - new Date(b.updatedAt || b.createdAt || 0).getTime());
      }
    });
  }, [filteredLeads, sortKey, sortDir]);

  // Pagination
  const totalPages     = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const paginatedLeads = sortedLeads.slice((page - 1) * pageSize, page * pageSize);

  // Compute tbody rows outside JSX to avoid nested-ternary parse issues
  let tbodyRows: React.ReactNode;
  if (leadsLoading) {
    tbodyRows = Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />);
  } else if (paginatedLeads.length > 0) {
    tbodyRows = paginatedLeads.map((lead: any) => {
      const tc = TYPE_CONFIG[lead.leadType || "cold"] || TYPE_CONFIG.cold;
      return (
        <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)}>
          <td>
            <div
              style={{
                fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
              title={lead.leadName}
            >
              {lead.leadName}
            </div>
          </td>
          <td>
            <span className={`badge ${tc.cls}`}>{tc.emoji} {tc.label}</span>
          </td>
          <td title={lead.serviceName || undefined} style={{
            color: "var(--text-muted)", fontSize: "var(--text-xs)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{lead.serviceName || "—"}</td>
          {(() => {
            const validCompanies = (lead.companies || []).filter((c: any) => c && c.name);
            return (
              <td
                style={{ fontSize: "var(--text-xs)" }}
                title={validCompanies.length > 0 ? validCompanies.map((c: any) => c.name).join(", ") : undefined}
              >
                {validCompanies.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "nowrap", gap: 3, overflow: "hidden" }}>
                    <span
                      className="company-pill"
                      style={{
                        display: "inline-block",
                        padding: "1px 7px",
                        background: "hsl(172 75% 48% / 0.1)",
                        border: "1px solid hsl(172 75% 48% / 0.25)",
                        borderRadius: "var(--radius-full)",
                        color: "var(--teal)",
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "calc(100% - 36px)",
                      }}
                    >
                      {validCompanies[0].name}
                    </span>
                    {validCompanies.length > 1 && (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "1px 6px",
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "var(--radius-full)",
                          color: "var(--text-muted)",
                          fontSize: 10, fontWeight: 500, lineHeight: 1.6,
                          flexShrink: 0,
                        }}
                      >
                        +{validCompanies.length - 1}
                      </span>
                    )}
                  </div>
                ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
              </td>
            );
          })()}
          <td style={{ fontFamily: "monospace", fontSize: "var(--text-xs)", color: "var(--teal)", fontWeight: 600 }}>
            {lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString("en-IN")}` : "—"}
          </td>
          <td>
            {lead.dealHandler ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", overflow: "hidden" }}>
                <div className="avatar avatar-sm avatar-purple" style={{ flexShrink: 0 }}>{resolveName(lead.dealHandler)[0]}</div>
                <span style={{
                  fontSize: "var(--text-xs)", color: "var(--text-secondary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }} title={resolveName(lead.dealHandler)}>
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
          <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}
              title={`Last updated: ${format(new Date(lead.updatedAt || lead.createdAt), "MMM d, yyyy, h:mm a")}`}>
            {format(new Date(lead.updatedAt || lead.createdAt), "MMM d, yyyy")}
          </td>
        </tr>
      );
    });
  } else {
    tbodyRows = (
      <tr style={{ cursor: "default" }}>
        <td colSpan={8}>
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
            <StatCard label="Pipeline Value" value={formatCrores(pipelineValue)} icon={<TrendingUp size={16} />} iconClass="stat-icon-teal" sub="Total deal value" />
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
        <div className="chart-card" style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
            <div className="chart-title" style={{ margin: 0 }}>Pipeline by Stage</div>

            {/* Legend popover trigger */}
            <div ref={legendBtnRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowLegendPopover(v => !v)}
                title="View Status Legend"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 10px",
                  background: showLegendPopover ? "hsl(172 75% 48% / 0.12)" : "transparent",
                  border: `1px solid ${showLegendPopover ? "hsl(172 75% 48% / 0.4)" : "var(--border-default)"}`,
                  borderRadius: "var(--radius-md)",
                  color: showLegendPopover ? "var(--teal)" : "var(--text-muted)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  if (!showLegendPopover) {
                    e.currentTarget.style.background = "hsl(172 75% 48% / 0.06)";
                    e.currentTarget.style.borderColor = "hsl(172 75% 48% / 0.25)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={e => {
                  if (!showLegendPopover) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                <Layers size={12} />
                Legend
              </button>

              {/* Floating legend popover */}
              {showLegendPopover && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: 220,
                  maxHeight: 280,
                  overflowY: "auto",
                  background: "hsl(222, 20%, 11%)",
                  border: "1px solid hsl(222, 15%, 26%)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  boxShadow: "0 8px 32px hsl(222 22% 3% / 0.65)",
                  zIndex: 200,
                }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "hsl(210, 14%, 45%)",
                    marginBottom: 8,
                    fontFamily: "var(--font-sans)",
                  }}>
                    Status Index
                  </div>
                  {stackedStatusKeys.length === 0 ? (
                    <div style={{ fontSize: 12, color: "hsl(210, 14%, 45%)" }}>No statuses configured</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {stackedStatusKeys.map(key => {
                        const meta = statusMetaById.get(key) ?? { displayName: key, color: "hsl(210,14%,38%)" };
                        const isActive = activeStatus === key;
                        return (
                          <div
                            key={key}
                            onMouseEnter={() => setActiveStatus(key)}
                            onMouseLeave={() => setActiveStatus(null)}
                            onClick={() => setActiveStatus(prev => prev === key ? null : key)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "4px 6px",
                              borderRadius: 6,
                              cursor: "pointer",
                              background: isActive ? `${meta.color}22` : "transparent",
                              border: `1px solid ${isActive ? `${meta.color}55` : "transparent"}`,
                              transition: "background 150ms ease, border-color 150ms ease",
                            }}
                          >
                            <span style={{
                              width: 10, height: 10,
                              borderRadius: "50%",
                              background: meta.color,
                              flexShrink: 0,
                              display: "inline-block",
                              boxShadow: isActive ? `0 0 8px ${meta.color}` : `0 0 4px ${meta.color}50`,
                              transition: "box-shadow 150ms ease",
                            }} />
                            <span style={{
                              fontSize: 12,
                              color: isActive ? "hsl(210, 30%, 90%)" : "hsl(210, 22%, 68%)",
                              fontFamily: "var(--font-sans)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: isActive ? 600 : 400,
                              transition: "color 150ms ease, font-weight 150ms ease",
                            }}>
                              {meta.displayName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={activeStatus ?? "__all"}
                data={stageChartData}
                margin={{ top: 6, right: 16, left: -10, bottom: 0 }}
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
                  content={<StackedPipelineTooltip />}
                />
                {stackedStatusKeys.map((key, idx) => {
                  const meta = statusMetaById.get(key) ?? { displayName: key, color: "hsl(210,14%,38%)" };
                  const isLast = idx === stackedStatusKeys.length - 1;
                  const dimmed = activeStatus !== null && activeStatus !== key;
                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="pipeline"
                      fill={meta.color}
                      fillOpacity={dimmed ? 0.28 : 0.88}
                      maxBarSize={64}
                      radius={isLast ? [5, 5, 0, 0] : [0, 0, 0, 0]}
                      name={meta.displayName}
                      stroke={activeStatus === key ? "#fff" : "none"}
                      strokeWidth={activeStatus === key ? 0.8 : 0}
                      isAnimationActive={false}
                    />
                  );
                })}
                {stackedStatusKeys.length === 0 && (
                  <Bar dataKey="__empty" stackId="pipeline" fill="transparent" maxBarSize={64} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

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
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                {([
                  { key: "leadName",      label: "Lead Name", sortable: true  },
                  { key: null,            label: "Type",      sortable: false },
                  { key: "serviceName",   label: "Service",   sortable: true  },
                  { key: "company",       label: "Company",   sortable: true  },
                  { key: "dealValue",     label: "Value",     sortable: true  },
                  { key: null,            label: "Handler",   sortable: false },
                  { key: "stageSortOrder",label: "Stage",     sortable: true  },
                  { key: "updatedAt",     label: "Updated On", sortable: true  },
                ] as Array<{ key: SortKey | null; label: string; sortable: boolean }>).map(col => (
                  col.sortable && col.key ? (
                    <th
                      key={col.label}
                      onClick={() => handleSort(col.key!)}
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                        color: sortKey === col.key ? "var(--teal)" : undefined,
                        transition: "color 120ms ease",
                      }}
                      onMouseEnter={e => { if (sortKey !== col.key) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                      onMouseLeave={e => { if (sortKey !== col.key) (e.currentTarget as HTMLElement).style.color = ""; }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {col.label}
                        {getSortIcon(col.key)}
                      </span>
                    </th>
                  ) : (
                    <th key={col.label}>{col.label}</th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {tbodyRows}
            </tbody>
          </table>
          </div> {/* table-scroll-wrapper */}
        </div> {/* relative wrapper */}

        {/* Pagination row — rows-per-page selector + page navigator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)", padding: "0 var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPageSize(val);
                setPage(1);
                localStorage.setItem("slh_rows_per_page", String(val));
              }}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "var(--text-xs)",
                padding: "3px 8px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>entries</span>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={sortedLeads.length}
            pageSize={pageSize}
            onChange={setPage}
          />
        </div>
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
