import { useGetAnalyticsStats, useGetLeadTrend, useGetKillReasons, useGetWeeklyConversion } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function Analytics() {
  const { data: stats } = useGetAnalyticsStats();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: killReasons = [] } = useGetKillReasons();
  const { data: weeklyConversion = [] } = useGetWeeklyConversion();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-slide-in">
      <h1 className="text-3xl font-display font-bold">Analytics & Reporting</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Win Rate" value={`${Math.round(stats?.winRate || 0)}%`} subtitle="Closed / Total" />
        <StatCard title="Avg Conversion" value={`${Math.round(stats?.avgConversionDays || 0)}`} subtitle="Days to close" />
        <StatCard title="Active Pipeline" value={stats?.activePipelineCount || 0} subtitle="Leads in progress" />
        <StatCard title="Lost Deals" value={stats?.lostCount || 0} subtitle="Missed opportunities" className="border-destructive/30" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 glass h-96 flex flex-col relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
          <h3 className="font-display font-semibold mb-6 text-foreground">Lead Volume Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="hsl(var(--background))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 glass h-96 flex flex-col relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
          <h3 className="font-display font-semibold mb-6 text-foreground">Weekly Conversion Rate (8 Weeks)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyConversion}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="hsl(var(--background))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(tick) => `${tick}%`} />
              <Tooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}} />
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 glass h-96 flex flex-col relative overflow-hidden lg:col-span-2">
          <h3 className="font-display font-semibold mb-6 text-foreground">Deal Kill Reasons</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={killReasons} layout="vertical" margin={{ left: 50 }}>
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="reason" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
              <Tooltip cursor={{fill: 'hsl(var(--muted)/0.5)'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}} />
              <Bar dataKey="count" fill="hsl(var(--destructive)/0.8)" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, className }: { title: string, value: string | number, subtitle: string, className?: string }) {
  return (
    <Card className={`p-5 glass relative overflow-hidden group transition-transform hover:-translate-y-1 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground tracking-wide mb-1">{title}</p>
      <h3 className="text-3xl font-display font-bold tracking-tight text-foreground">{value}</h3>
      <p className="text-xs text-muted-foreground mt-2 opacity-70">{subtitle}</p>
    </Card>
  );
}
