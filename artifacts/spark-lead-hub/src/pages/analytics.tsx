import {
  useGetAnalyticsStats, useGetLeadTrend, useGetKillReasons, useGetWeeklyConversion
} from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { BarChart3, Target, Clock, Layers, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function useClosureBreakdown() {
  return useQuery({
    queryKey: ["analytics", "closure-breakdown"],
    queryFn: async () => {
      const token = localStorage.getItem("slh_token");
      const res = await fetch("/api/analytics/closure-breakdown", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Array<{ status: string; color: string; isWon: boolean; isLost: boolean; count: number }>>;
    },
    staleTime: 30_000,
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

export function Analytics() {
  const { data: stats } = useGetAnalyticsStats();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: killReasons = [] } = useGetKillReasons();
  const { data: weeklyConversion = [] } = useGetWeeklyConversion();
  const { data: closureBreakdown = [] } = useClosureBreakdown();

  const avgDays = stats?.avgConversionDays;
  const avgDisplay = (avgDays != null && avgDays > 0) ? Math.round(avgDays) : "N/A";

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
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <AnalyticStatCard label="Win Rate" value={`${Math.round(stats?.winRate || 0)}%`} sub="Closed / Total leads" icon={<Target size={16} />} iconClass="stat-icon-success" />
        <AnalyticStatCard label="Avg Conversion" value={typeof avgDisplay === "number" ? `${avgDisplay}d` : avgDisplay} sub="Days to close" icon={<Clock size={16} />} iconClass="stat-icon-teal" />
        <AnalyticStatCard label="Active Pipeline" value={stats?.activePipelineCount ?? 0} sub="Leads in progress" icon={<Layers size={16} />} iconClass="stat-icon-purple" />
        <AnalyticStatCard label="Lost Deals" value={stats?.lostCount ?? 0} sub="Missed opportunities" icon={<XCircle size={16} />} iconClass="stat-icon-danger" />
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <div className="chart-card" style={{ height: 320, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Lead Volume Trend (30 Days)</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(172 75% 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(172 75% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border-default)" }} />
              <Area type="monotone" dataKey="count" stroke="hsl(172 75% 48%)" strokeWidth={2.5} fillOpacity={1} fill="url(#tealFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ height: 320, display: "flex", flexDirection: "column" }}>
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
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, "Conversion Rate"]} cursor={{ stroke: "var(--border-default)" }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(262 65% 62%)" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <div className="chart-card" style={{ height: 280, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Deal Kill Reasons</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedKillReasons} layout="vertical" margin={{ left: 16, right: 16 }}>
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(0 70% 58% / 0.06)" }} formatter={(v: any) => [v, "Deals lost"]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                {formattedKillReasons.map((_, i) => (
                  <Cell key={i} fill="hsl(0 70% 58%)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ height: 280, display: "flex", flexDirection: "column" }}>
          <div className="chart-title">Closure Breakdown</div>
          {closureBreakdown.filter(c => c.count > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={closureBreakdown.filter(c => c.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {closureBreakdown.filter(c => c.count > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, "Leads"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              No closed deals yet
            </div>
          )}
        </div>
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
