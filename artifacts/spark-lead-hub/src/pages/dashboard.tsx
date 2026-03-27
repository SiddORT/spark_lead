import { useState } from "react";
import { useGetLeads, useGetAnalyticsStats, useGetLeadTrend, useGetStageDistribution } from "@workspace/api-client-react";
import { useUserMap } from "@/hooks/use-user-map";
import { Card, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Select, Button } from "@/components/ui";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatValue, cn } from "@/lib/utils";
import { format } from "date-fns";
import { Download, Search } from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";

export function Dashboard() {
  const { data: leads = [] } = useGetLeads();
  const { data: stats } = useGetAnalyticsStats();
  const { data: trendData = [] } = useGetLeadTrend();
  const { data: stageDist = [] } = useGetStageDistribution();
  const { resolveName } = useUserMap();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredLeads = leads.filter(l => {
    const matchSearch = l.leadName.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase());
    const matchService = !serviceFilter || l.serviceId === serviceFilter;
    const matchType = !typeFilter || l.leadType === typeFilter;
    return matchSearch && matchService && matchType;
  });

  const getLeadTypeBadge = (type?: string | null) => {
    const config: any = {
      hot: { icon: '🔥', text: 'Hot', className: 'text-destructive border-destructive/30 bg-destructive/10' },
      warm: { icon: '☀️', text: 'Warm', className: 'text-warning border-warning/30 bg-warning/10' },
      cold: { icon: '🧊', text: 'Cold', className: 'text-primary border-primary/30 bg-primary/10' },
      ghosted: { icon: '👻', text: 'Ghosted', className: 'text-muted-foreground border-border bg-muted' },
    };
    const c = type ? config[type] : config.cold;
    return <Badge variant="outline" className={`gap-1 px-2 ${c.className}`}>{c.icon} {c.text}</Badge>;
  };

  const handleExport = () => {
    window.open('/api/leads/export/csv', '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <PermissionCheck resource="leads" action="export">
          <Button variant="outline" onClick={handleExport} className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
            <Download size={16} /> Export CSV
          </Button>
        </PermissionCheck>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="Total Leads" value={leads.length} />
        <StatCard title="Hot Leads 🔥" value={leads.filter(l => l.leadType === 'hot').length} className="border-destructive/30 shadow-[0_0_15px_rgba(255,0,0,0.1)]" />
        <StatCard title="Closed Deals" value={leads.filter(l => l.outcome === 'closed').length} className="border-success/30" />
        <StatCard title="In Progress" value={stats?.activePipelineCount || 0} />
        <StatCard title="Pipeline Value" value={formatValue(leads.reduce((s, l) => s + (l.outcome !== 'closed' && l.outcome !== 'lost' ? Number(l.dealValue || 0) : 0), 0))} className="border-accent/30 text-accent col-span-2 lg:col-span-1" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4 flex flex-col h-80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          <h3 className="font-display font-semibold mb-4 text-muted-foreground">Lead Generation (30 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'}} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 flex flex-col h-80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
          <h3 className="font-display font-semibold mb-4 text-muted-foreground">Pipeline Stages</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageDist}>
              <Tooltip cursor={{fill: 'hsl(var(--muted)/0.5)'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="overflow-hidden glass-strong border-border/50 shadow-2xl">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search leads or companies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50 border-border/50" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full sm:w-36 bg-background/50">
              <option value="">All Types</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </Select>
            <Button variant="ghost" onClick={() => { setSearch(''); setTypeFilter(''); setServiceFilter(''); }} className="text-muted-foreground hover:text-foreground">Clear</Button>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Lead</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.slice(0, 10).map(lead => (
              <TableRow key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="cursor-pointer group">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-foreground group-hover:text-primary transition-colors">{lead.leadName}</span>
                    <span className="text-xs text-muted-foreground">{lead.company || 'No Company'}</span>
                  </div>
                </TableCell>
                <TableCell>{getLeadTypeBadge(lead.leadType)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{lead.serviceName || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{resolveName(lead.leadOwner)[0]}</div>
                    <span className="text-sm">{resolveName(lead.leadOwner)}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{lead.dealValue ? `₹${lead.dealValue}` : '-'}</TableCell>
                <TableCell><Badge variant="secondary" className="capitalize bg-muted border-none">{lead.stage}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
            {filteredLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No leads found matching your criteria.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <LeadDetailSheet leadId={selectedLeadId} open={!!selectedLeadId} onOpenChange={(open) => !open && setSelectedLeadId(null)} />
    </div>
  );
}

function StatCard({ title, value, className }: { title: string, value: string | number, className?: string }) {
  return (
    <Card className={cn("p-5 glass relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300", className)}>
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[slide-in_1s_ease-in-out] pointer-events-none" />
      <p className="text-sm font-medium text-muted-foreground tracking-wide mb-2">{title}</p>
      <h3 className="text-3xl font-display font-bold tracking-tight text-foreground">{value}</h3>
    </Card>
  );
}
