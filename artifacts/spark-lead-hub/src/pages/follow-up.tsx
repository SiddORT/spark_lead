import { useState, useMemo, useEffect } from "react";
import { useGetLeads, useGetServices, useGetCompanies } from "@workspace/api-client-react";
import { usePipelineStages } from "@/hooks/use-pipeline";
import { TableRowSkeleton } from "@/components/skeleton";
import { useUserMap } from "@/hooks/use-user-map";
import { useDebounce } from "@/hooks/use-debounce";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { TablePagination } from "@/components/table-pagination";
import { FilterSelect } from "@/components/filter-select";
import { format, differenceInCalendarDays } from "date-fns";
import { CalendarClock, AlertCircle, Search, ChevronsUpDown, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";

// ─── Constants ────────────────────────────────────────
const LEAD_TYPE_OPTIONS = [
  { value: "hot",     label: "🔥 Hot" },
  { value: "warm",    label: "☀️ Warm" },
  { value: "cold",    label: "🧊 Cold" },
  { value: "ghosted", label: "👻 Ghosted" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const LEAD_TYPE_BADGE: Record<string, string> = {
  hot: "badge-danger", warm: "badge-warning", cold: "badge-info", ghosted: "badge-muted",
};
const LEAD_TYPE_EMOJI: Record<string, string> = {
  hot: "🔥", warm: "☀️", cold: "🧊", ghosted: "👻",
};

// ─── Overdue helpers ───────────────────────────────────
function getOverdueDays(followUpDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const follow = new Date(followUpDate);
  follow.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(today, follow);
}

function isDueToday(followUpDate: string): boolean {
  return getOverdueDays(followUpDate) === 0;
}

function isOverdue(followUpDate: string): boolean {
  return getOverdueDays(followUpDate) > 0;
}

// ─── Follow Up Page ────────────────────────────────────
export function FollowUp() {
  const { data: leads = [], isLoading: leadsLoading } = useGetLeads();
  const { data: services = [] }                        = useGetServices();
  const { data: allCompanies = [] }                    = useGetCompanies();
  const { data: stages = [] }                          = usePipelineStages();
  const { resolveName }                                = useUserMap();

  // Filters
  const [search, setSearch]           = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter]   = useState("");
  const [stageFilter, setStageFilter] = useState("");

  const debouncedSearch = useDebounce(search, 250);

  // Pagination
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const stored = localStorage.getItem("slh_rows_per_page");
    return stored ? Number(stored) : 10;
  });

  // Sorting
  type SortKey = "leadName" | "leadType" | "serviceName" | "company" | "dealValue" | "stageSortOrder" | "followUpDate";
  type SortDir = "asc" | "desc";
  const [sortKey, setSortKey] = useState<SortKey>("followUpDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ color: "var(--teal)" }} />
      : <ChevronDown size={12} style={{ color: "var(--teal)" }} />;
  };

  // Persist pageSize
  useEffect(() => {
    localStorage.setItem("slh_rows_per_page", String(pageSize));
  }, [pageSize]);

  // Reset page on filter changes
  useEffect(() => { setPage(1); }, [debouncedSearch, serviceFilter, companyFilter, typeFilter, stageFilter]);

  // Step 1: filter to follow-up leads (today + overdue)
  const followUpLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (leads as any[]).filter((l: any) => {
      if (!l.followUpDate) return false;
      const follow = new Date(l.followUpDate);
      follow.setHours(0, 0, 0, 0);
      return follow.getTime() <= today.getTime();
    });
  }, [leads]);

  // Step 2: apply user filters
  const filteredLeads = useMemo(() => {
    return followUpLeads.filter((l: any) => {
      const q = debouncedSearch.toLowerCase();
      if (q) {
        const nameMatch    = (l.leadName || "").toLowerCase().includes(q);
        const companyMatch = (l.companies || []).some((c: any) => (c?.name || "").toLowerCase().includes(q));
        if (!nameMatch && !companyMatch) return false;
      }
      if (serviceFilter && l.serviceId !== serviceFilter) return false;
      if (companyFilter && !(l.companies || []).some((c: any) => c?.id === companyFilter)) return false;
      if (typeFilter    && l.leadType !== typeFilter) return false;
      if (stageFilter   && l.pipelineStageId !== stageFilter && l.stageName !== stageFilter && l.stage !== stageFilter) return false;
      return true;
    });
  }, [followUpLeads, debouncedSearch, serviceFilter, companyFilter, typeFilter, stageFilter]);

  // Step 3: sort
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
        case "followUpDate":
        default:
          return dir * (new Date(a.followUpDate || 0).getTime() - new Date(b.followUpDate || 0).getTime());
      }
    });
  }, [filteredLeads, sortKey, sortDir]);

  const totalPages     = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const paginatedLeads = sortedLeads.slice((page - 1) * pageSize, page * pageSize);

  // Lead detail sheet state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen]           = useState(false);

  const openLead = (id: string) => { setSelectedLeadId(id); setSheetOpen(true); };
  const hasFilters = !!(search || serviceFilter || companyFilter || typeFilter || stageFilter);

  const clearFilters = () => {
    setSearch(""); setServiceFilter(""); setCompanyFilter(""); setTypeFilter(""); setStageFilter("");
  };

  // Build filter options
  const serviceOptions = (services as any[]).map((s: any) => ({ value: s.id, label: s.name }));
  const companyOptions = (allCompanies as any[]).map((c: any) => ({ value: c.id, label: c.name }));
  const stageOptions   = (stages as any[]).map((s: any) => ({ value: s.id, label: s.displayName || s.name }));

  // Stats
  const totalDue     = followUpLeads.length;
  const overdueCount = followUpLeads.filter((l: any) => l.followUpDate && isOverdue(l.followUpDate)).length;
  const todayCount   = followUpLeads.filter((l: any) => l.followUpDate && isDueToday(l.followUpDate)).length;

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────── */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <CalendarClock size={22} style={{ color: "var(--teal)" }} />
            Follow Up
          </h1>
          <p className="page-subtitle">
            {overdueCount > 0
              ? <span style={{ color: "var(--danger)" }}>{overdueCount} overdue</span>
              : <span style={{ color: "var(--teal)" }}>All caught up!</span>
            }
            {todayCount > 0 && <> · <span style={{ color: "var(--warning)" }}>{todayCount} due today</span></>}
          </p>
        </div>

        {/* Quick stat chips */}
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 12px",
            background: "hsl(172 75% 48% / 0.08)",
            border: "1px solid hsl(172 75% 48% / 0.2)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--teal)",
          }}>
            <CheckCircle2 size={12} /> {todayCount} today
          </div>
          {overdueCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 12px",
              background: "hsl(0 75% 50% / 0.08)",
              border: "1px solid hsl(0 75% 50% / 0.2)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--danger)",
            }}>
              <AlertCircle size={12} /> {overdueCount} overdue
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────── */}
      <div className="table-controls" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: "1 1 220px", minWidth: 160, display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "0 var(--space-3)", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", height: 36 }}>
          <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads or companies..."
            style={{ background: "transparent", border: "none", outline: "none", fontSize: "var(--text-sm)", color: "var(--text-primary)", width: "100%", fontFamily: "var(--font-body)" }}
          />
        </div>
        <FilterSelect value={serviceFilter} onChange={setServiceFilter} options={serviceOptions} placeholder="All Services" />
        <FilterSelect value={companyFilter} onChange={setCompanyFilter} options={companyOptions} placeholder="All Companies" />
        <FilterSelect value={typeFilter}    onChange={setTypeFilter}    options={LEAD_TYPE_OPTIONS} placeholder="All Types" />
        <FilterSelect value={stageFilter}   onChange={setStageFilter}   options={stageOptions} placeholder="All Stages" />
        {hasFilters && (
          <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", whiteSpace: "nowrap" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              {([
                { key: "leadName",      label: "Lead Name",    sortable: true  },
                { key: null,            label: "Type",         sortable: false },
                { key: "serviceName",   label: "Service",      sortable: true  },
                { key: "company",       label: "Company",      sortable: true  },
                { key: "dealValue",     label: "Value",        sortable: true  },
                { key: null,            label: "Handler",      sortable: false },
                { key: "stageSortOrder",label: "Stage",        sortable: true  },
                { key: "followUpDate",  label: "Follow-up",    sortable: true  },
              ] as Array<{ key: SortKey | null; label: string; sortable: boolean }>).map(col => (
                col.sortable && col.key ? (
                  <th
                    key={col.label}
                    onClick={() => handleSort(col.key as SortKey)}
                    style={{ cursor: "pointer", userSelect: "none", color: sortKey === col.key ? "var(--teal)" : undefined }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label} <SortIcon k={col.key as SortKey} />
                    </span>
                  </th>
                ) : (
                  <th key={col.label}>{col.label}</th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {leadsLoading
              ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
              : paginatedLeads.length === 0
              ? (
                <tr style={{ cursor: "default" }}>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ textAlign: "center", padding: "var(--space-10) 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
                      <CheckCircle2 size={36} style={{ color: "var(--teal)", opacity: 0.4 }} />
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {hasFilters ? "No leads match your filters" : "No follow-ups due! 🎉"}
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                        {hasFilters
                          ? "Try clearing filters to see all due follow-ups."
                          : "You're all caught up — no overdue or due-today follow-ups."
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              )
              : paginatedLeads.map((lead: any) => {
                const overdueDays   = lead.followUpDate ? getOverdueDays(lead.followUpDate) : 0;
                const leadIsOverdue = overdueDays > 0;
                const leadIsToday   = overdueDays === 0;
                const urgencyColor  = overdueDays >= 3 ? "hsl(0 80% 55%)" : "hsl(15 90% 55%)";
                const validCompanies = (lead.companies || []).filter((c: any) => c?.name);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => openLead(lead.id)}
                    style={{
                      borderLeft: leadIsOverdue
                        ? `3px solid ${urgencyColor}`
                        : leadIsToday
                        ? "3px solid var(--warning)"
                        : "3px solid transparent",
                      background: leadIsOverdue
                        ? "hsl(0 80% 55% / 0.04)"
                        : undefined,
                    }}
                  >
                    {/* Lead Name */}
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                        {lead.leadName}
                        {leadIsOverdue && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            marginLeft: 7,
                            padding: "1px 6px",
                            background: `${urgencyColor}18`,
                            border: `1px solid ${urgencyColor}35`,
                            borderRadius: "var(--radius-full)",
                            color: urgencyColor,
                            fontSize: 10, fontWeight: 700, lineHeight: 1.6,
                          }}>
                            <AlertCircle size={9} /> {overdueDays}d overdue
                          </span>
                        )}
                        {leadIsToday && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            marginLeft: 7,
                            padding: "1px 6px",
                            background: "hsl(38 90% 55% / 0.12)",
                            border: "1px solid hsl(38 90% 55% / 0.3)",
                            borderRadius: "var(--radius-full)",
                            color: "var(--warning)",
                            fontSize: 10, fontWeight: 700, lineHeight: 1.6,
                          }}>
                            Due today
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <span className={`badge ${LEAD_TYPE_BADGE[lead.leadType] || "badge-muted"}`} style={{ gap: 4 }}>
                        <span>{LEAD_TYPE_EMOJI[lead.leadType] || ""}</span>
                        <span>{lead.leadType ? lead.leadType.charAt(0).toUpperCase() + lead.leadType.slice(1) : "—"}</span>
                      </span>
                    </td>

                    {/* Service */}
                    <td style={{ color: "var(--text-secondary)", fontSize: "var(--text-xs)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={lead.serviceName}>
                      {lead.serviceName || "—"}
                    </td>

                    {/* Company */}
                    <td>
                      {validCompanies.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "nowrap", gap: 3, overflow: "hidden" }}>
                          <span className="company-pill" style={{
                            display: "inline-block", padding: "1px 7px",
                            background: "hsl(172 75% 48% / 0.1)",
                            border: "1px solid hsl(172 75% 48% / 0.25)",
                            borderRadius: "var(--radius-full)",
                            color: "var(--teal)", fontSize: 10, fontWeight: 600,
                            lineHeight: 1.8, whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis",
                            maxWidth: "calc(100% - 36px)",
                          }}>
                            {validCompanies[0].name}
                          </span>
                          {validCompanies.length > 1 && (
                            <span style={{
                              display: "inline-flex", alignItems: "center",
                              padding: "1px 6px",
                              background: "var(--bg-subtle)",
                              border: "1px solid var(--border-default)",
                              borderRadius: "var(--radius-full)",
                              color: "var(--text-muted)",
                              fontSize: 10, fontWeight: 500, lineHeight: 1.6, flexShrink: 0,
                            }}>
                              +{validCompanies.length - 1}
                            </span>
                          )}
                        </div>
                      ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>

                    {/* Value */}
                    <td style={{ fontFamily: "monospace", fontSize: "var(--text-xs)", color: "var(--teal)", fontWeight: 600 }}>
                      {lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString("en-IN")}` : "—"}
                    </td>

                    {/* Handler */}
                    <td>
                      {lead.dealHandler ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", overflow: "hidden" }}>
                          <div className="avatar avatar-sm avatar-purple" style={{ flexShrink: 0 }}>{resolveName(lead.dealHandler)[0]}</div>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                title={resolveName(lead.dealHandler)}>
                            {resolveName(lead.dealHandler)}
                          </span>
                        </div>
                      ) : <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>—</span>}
                    </td>

                    {/* Stage */}
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
                        <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>—</span>
                      )}
                    </td>

                    {/* Follow-up date */}
                    <td style={{ whiteSpace: "nowrap" }}
                        title={lead.followUpDate ? `Follow-up was due on ${format(new Date(lead.followUpDate), "MMM d, yyyy")}${leadIsOverdue ? ` (${overdueDays} days ago)` : ""}` : undefined}>
                      {lead.followUpDate ? (
                        <span style={{
                          color: leadIsOverdue ? urgencyColor : leadIsToday ? "var(--warning)" : "var(--text-muted)",
                          fontSize: "var(--text-xs)", fontWeight: leadIsOverdue || leadIsToday ? 600 : 400,
                        }}>
                          {format(new Date(lead.followUpDate), "MMM d, yyyy")}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────── */}
      {!leadsLoading && sortedLeads.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
            Show{" "}
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
                fontSize: "var(--text-xs)", padding: "2px 6px", cursor: "pointer",
              }}
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {" "}entries
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={sortedLeads.length}
            pageSize={pageSize}
            onChange={setPage}
          />
        </div>
      )}

      {/* ── Lead detail sheet ────────────────────────── */}
      <LeadDetailSheet
        leadId={selectedLeadId}
        open={sheetOpen}
        onOpenChange={open => {
          setSheetOpen(open);
          if (!open) setSelectedLeadId(null);
        }}
      />
    </div>
  );
}
