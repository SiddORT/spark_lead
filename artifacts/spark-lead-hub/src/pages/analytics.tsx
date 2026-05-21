import {
  useGetAnalyticsStats, useGetLeadTrend, useGetKillReasons, useGetWeeklyConversion
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { BarChart3, Target, Clock, Layers, XCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function useClosureBreakdown() {
  return useQuery({
    queryKey: ["analytics", "closure-breakdown"],
    queryFn: async () => {
      const token = localStorage.getItem("slh_token");
      const res = await fetch("/api/analytics/closure-breakdown", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Array<{ status: string; color: string; isWon: boolean; isLost: boolean; count: number }>>;
    },
    staleTime: 0,
  });
}

function useStageDistribution() {
  return useQuery({
    queryKey: ["analytics", "stage-distribution"],
    queryFn: async () => {
      const token = localStorage.getItem("slh_token");
      const res = await fetch("/api/analytics/stage-distribution", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Array<{ stage: string; stageName: string; color: string; count: number }>>;
    },
    staleTime: 0,
  });
}

function useClosureTrend(range: number) {
  return useQuery({
    queryKey: ["analytics", "closure-trend", range],
    queryFn: async () => {
      const token = localStorage.getItem("slh_token");
      const res = await fetch(`/api/analytics/closure-trend?range=${range}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Array<{ date: string; won: number; lost: number; postponed: number }>>;
    },
    staleTime: 0,
  });
}

const KILL_REASON_LABELS: Record<string, string> = {
  feature_gap: "Feature Gap",
  price:       "Price",
  ghosted:     "Ghosted",
};

const tooltipStyle = {
  backgroundColor: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "var(--text-xs)",
};
const tooltipLabelStyle  = { color: "var(--text-secondary)", fontSize: "var(--text-xs)", marginBottom: 2 };
const tooltipItemStyle   = { color: "var(--text-primary)", fontSize: "var(--text-xs)" };
const tooltipWrapperStyle = { outline: "none" };

export function Analytics() {
  const queryClient = useQueryClient();
  const { data: stats } = useGetAnalyticsStats();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: killReasons = [] } = useGetKillReasons();
  const { data: weeklyConversion = [] } = useGetWeeklyConversion();
  const { data: closureBreakdown = [] } = useClosureBreakdown();
  const { data: stageDistribution = [] } = useStageDistribution();
  const [trendRange, setTrendRange] = useState<7 | 30>(30);
  const { data: closureTrend = [] } = useClosureTrend(trendRange);

  const totalLeadsInPipeline = stageDistribution.reduce((sum, s) => sum + s.count, 0);

  // Always fetch fresh data when the analytics page is opened
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["getAnalyticsStats"] });
    queryClient.invalidateQueries({ queryKey: ["getLeadTrend"] });
    queryClient.invalidateQueries({ queryKey: ["getKillReasons"] });
    queryClient.invalidateQueries({ queryKey: ["getWeeklyConversion"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["getAnalyticsStats"] });
    queryClient.invalidateQueries({ queryKey: ["getLeadTrend"] });
    queryClient.invalidateQueries({ queryKey: ["getKillReasons"] });
    queryClient.invalidateQueries({ queryKey: ["getWeeklyConversion"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  // Derived: check if any closure trend data has non-zero values
  const hasClosureTrendData = closureTrend.some(d => d.won > 0 || d.lost > 0 || d.postponed > 0);

  const avgDays = stats?.avgConversionDays;
  const avgDisplay = avgDays == null
    ? "N/A"
    : avgDays < 1
    ? "< 1d"
    : `${Math.round(avgDays)}d`;

  const formattedKillReasons = killReasons.map(r => ({
    ...r,
    label: KILL_REASON_LABELS[r.reason] || r.reason,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <BarChart3 size={28} style={{ color: "var(--teal)" }} />
            Analytics & Reporting
          </h1>
          <p className="page-subtitle">Pipeline performance and conversion insights</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="analytics-stats-grid">
        <AnalyticStatCard label="Win Rate" value={`${Math.round(stats?.winRate || 0)}%`} sub="Leads marked Won / Total" icon={<Target size={16} />} iconClass="stat-icon-success" />
        <AnalyticStatCard label="Avg Conversion" value={avgDisplay} sub="Avg days to Won/Lost status" icon={<Clock size={16} />} iconClass="stat-icon-teal" />
        <AnalyticStatCard label="Active Pipeline" value={stats?.activePipelineCount ?? 0} sub="Leads without Won/Lost status" icon={<Layers size={16} />} iconClass="stat-icon-purple" />
        <AnalyticStatCard label="Lost Deals" value={stats?.lostCount ?? 0} sub="Leads marked Lost" icon={<XCircle size={16} />} iconClass="stat-icon-danger" />
      </div>

      {/* Charts grid */}
      <div className="analytics-charts-grid">
        <div className="chart-card analytics-chart" style={{ display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Lead Volume Trend (30 Days)</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(196 100% 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(196 100% 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} wrapperStyle={tooltipWrapperStyle} cursor={{ stroke: "var(--border-default)" }} />
              <Area type="monotone" dataKey="count" stroke="hsl(196 100% 46%)" strokeWidth={2.5} fillOpacity={1} fill="url(#tealFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card analytics-chart" style={{ display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Weekly Conversion Rate (8 Weeks)</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyConversion}>
              <defs>
                <linearGradient id="purpleFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(262 65% 62%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(262 65% 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={38} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} wrapperStyle={tooltipWrapperStyle} formatter={(v: any) => [`${v}%`, "Conversion Rate"]} cursor={{ stroke: "var(--border-default)" }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(262 65% 62%)" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline Stage Distribution — full width */}
      <div className="chart-card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-5)" }}>
        <div className="chart-title" style={{ marginBottom: "var(--space-4)" }}>Pipeline Stage Distribution</div>
        {totalLeadsInPipeline === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8) 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            No leads in the pipeline yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {stageDistribution.map((stage) => {
              const pct = totalLeadsInPipeline > 0 ? (stage.count / totalLeadsInPipeline) * 100 : 0;
              return (
                <div key={stage.stageName} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div style={{ width: 130, flexShrink: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {stage.stage}
                  </div>
                  <div style={{ flex: 1, height: 24, background: "var(--bg-subtle)", borderRadius: "var(--radius-full)", overflow: "hidden", position: "relative" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.max(pct, 0)}%`,
                      background: `linear-gradient(90deg, ${stage.color.replace("hsl(", "hsla(").replace(")", ", 0.9)")}, ${stage.color.replace("hsl(", "hsla(").replace(")", ", 0.55)")})`,
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.6s ease",
                      minWidth: stage.count > 0 ? 8 : 0,
                    }} />
                  </div>
                  <div style={{
                    width: 60, flexShrink: 0, textAlign: "right",
                    fontSize: "var(--text-xs)", color: stage.count > 0 ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: stage.count > 0 ? 700 : 400,
                  }}>
                    {stage.count} lead{stage.count !== 1 ? "s" : ""}
                  </div>
                  <div style={{
                    width: 42, flexShrink: 0, textAlign: "right",
                    fontSize: 10, color: "var(--text-muted)",
                  }}>
                    {pct > 0 ? `${Math.round(pct)}%` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="analytics-charts-grid">
        <div className="chart-card analytics-chart analytics-chart-sm" style={{ display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Deal Kill Reasons</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedKillReasons} layout="vertical" margin={{ left: 16, right: 16 }}>
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} wrapperStyle={tooltipWrapperStyle} cursor={{ fill: "hsl(0 70% 58% / 0.06)" }} formatter={(v: any) => [v, "Deals lost"]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                {formattedKillReasons.map((_, i) => (
                  <Cell key={i} fill="hsl(0 70% 58%)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Closure Breakdown</div>
          {(() => {
            const total = closureBreakdown.reduce((s, c) => s + c.count, 0);
            const pieData = closureBreakdown.filter(c => c.count > 0);
            if (total === 0) {
              return (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--text-sm)", padding: "var(--space-8) 0" }}>
                  No closed deals yet
                </div>
              );
            }
            return (
              <>
                {/* Donut chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={46}
                      paddingAngle={pieData.length > 1 ? 3 : 0}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                      wrapperStyle={tooltipWrapperStyle}
                      formatter={(v: any, name: any) => {
                        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                        return [`${v} lead${v !== 1 ? "s" : ""} (${pct}%)`, name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  padding: "var(--space-3) var(--space-1) var(--space-1)",
                  borderTop: "1px solid var(--border-subtle)",
                  marginTop: "var(--space-2)",
                }}>
                  {closureBreakdown.map((entry, i) => {
                    const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                        <span style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: entry.color, flexShrink: 0,
                          boxShadow: `0 0 6px ${entry.color.replace("hsl(", "hsla(").replace(")", ", 0.4)")}`,
                        }} />
                        <span style={{ color: "var(--text-secondary)", flex: 1 }}>{entry.status}</span>
                        <span style={{ color: entry.count > 0 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: entry.count > 0 ? 700 : 400 }}>
                          {entry.count} lead{entry.count !== 1 ? "s" : ""}
                        </span>
                        <span style={{ color: "var(--text-muted)", width: 36, textAlign: "right" }}>
                          {entry.count > 0 ? `${pct}%` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </div>
      {/* ─── Closure Performance Trend ─── */}
      <div className="chart-card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-5)" }}>
        {/* Header row with title + range toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>Closure Performance Over Time</div>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: 3 }}>
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTrendRange(r)}
                style={{
                  height: 28, padding: "0 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none", cursor: "pointer",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  background: trendRange === r ? "var(--bg-elevated)" : "transparent",
                  color: trendRange === r ? "var(--teal)" : "var(--text-muted)",
                  boxShadow: trendRange === r ? "0 1px 3px hsl(0 0% 0% / 0.3)" : "none",
                  transition: "all 150ms ease",
                }}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {!hasClosureTrendData ? (
          <div style={{ textAlign: "center", padding: "var(--space-8) 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            No closed leads in this period — try a wider range or mark some leads as Won / Lost / Postponed
          </div>
        ) : (
          <>
            {/* Legend */}
            <div style={{ display: "flex", gap: "var(--space-5)", marginBottom: "var(--space-3)" }}>
              {[
                { label: "Won",       color: "hsl(152, 58%, 43%)" },
                { label: "Lost",      color: "hsl(4, 68%, 58%)"   },
                { label: "Postponed", color: "hsl(36, 88%, 52%)"  },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                  <span style={{ width: 24, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />
                  {label}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={closureTrend} margin={{ left: 0, right: 8 }}>
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={trendRange === 7 ? 0 : Math.floor(closureTrend.length / 6)}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  wrapperStyle={tooltipWrapperStyle}
                  formatter={(v: any, name: any) => [v === 1 ? "1 lead" : `${v} leads`, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Line type="monotone" dataKey="won"       stroke="hsl(152, 58%, 43%)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="lost"      stroke="hsl(4, 68%, 58%)"   strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="postponed" stroke="hsl(36, 88%, 52%)"  strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}

function AnalyticStatCard({
  label, value, sub, icon, iconClass
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-sub">{sub}</div>
    </div>
  );
}
