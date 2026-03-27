import { useGetPermissions, useUpdatePermission, useGetAuditLog, useSendTestActivityEmail, useSendTestPasswordEmail } from "@workspace/api-client-react";
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Switch, Button } from "@/components/ui";
import { format } from "date-fns";
import { ShieldAlert, FileText, Mail, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";

export function Permissions() {
  const { user } = useAuth();
  const { data: permissions = [] } = useGetPermissions();
  const updatePermission = useUpdatePermission();
  const sendActivity = useSendTestActivityEmail();
  const sendPassword = useSendTestPasswordEmail();

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-muted-foreground">You don't have access to this page.</div>;
  }

  // Group by resource
  const grouped = permissions.reduce((acc: any, p) => {
    if (!acc[p.resource]) acc[p.resource] = {};
    if (!acc[p.resource][p.action]) acc[p.resource][p.action] = {};
    acc[p.resource][p.action][p.roleName] = p;
    return acc;
  }, {});

  const roles = ['lead_owner', 'deal_handler', 'manager', 'member'];

  const handleToggle = (perm: any) => {
    updatePermission.mutate({ data: { ...perm, allowed: !perm.allowed } }, {
      onSuccess: () => toast.success("Permission updated")
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-slide-in">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <ShieldAlert className="text-primary" /> Role Permissions
        </h1>
        <p className="text-muted-foreground mt-2">Granular access control per resource. Admin role always has full access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(grouped).map(([resource, actions]: [string, any]) => (
          <Card key={resource} className="glass-strong overflow-hidden border-primary/20">
            <div className="p-4 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary neon-glow-sm" />
              <h3 className="font-semibold capitalize text-foreground">{resource}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Action</TableHead>
                  <TableHead className="text-center text-xs">Admin</TableHead>
                  {roles.map(r => <TableHead key={r} className="text-center text-xs capitalize">{r.replace('_', ' ')}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(actions).map(([action, rolePerms]: [string, any]) => (
                  <TableRow key={action}>
                    <TableCell className="font-medium text-xs capitalize text-muted-foreground">{action}</TableCell>
                    <TableCell className="text-center"><Switch checked disabled /></TableCell>
                    {roles.map(r => {
                      const perm = rolePerms[r];
                      if (!perm) return <TableCell key={r} className="text-center opacity-30">-</TableCell>;
                      return (
                        <TableCell key={r} className="text-center">
                          <Switch checked={perm.allowed} onCheckedChange={() => handleToggle(perm)} />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))}
      </div>

      <Card className="glass mt-12 border-border/50">
        <div className="p-6">
          <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2"><Activity className="text-accent" /> System Diagnostics</h3>
          <p className="text-sm text-muted-foreground mb-6">Test the email integration by triggering sample emails to your admin address.</p>
          <div className="flex gap-4">
            <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10" onClick={() => sendPassword.mutate(undefined, { onSuccess: () => toast.success("Test password email sent") })}>
              <Mail size={16} className="mr-2" /> Test Password Email
            </Button>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" onClick={() => sendActivity.mutate(undefined, { onSuccess: () => toast.success("Test activity email sent") })}>
              <Activity size={16} className="mr-2" /> Test Activity Alert
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AuditLog() {
  const { data: logs = [] } = useGetAuditLog();

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('reject')) return 'text-destructive';
    if (action.includes('permission') || action.includes('role')) return 'text-warning';
    return 'text-primary';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <FileText className="text-muted-foreground" /> System Audit Log
        </h1>
      </div>

      <Card className="glass-strong overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id} className="font-mono text-xs">
                <TableCell className="text-muted-foreground whitespace-nowrap">{format(new Date(log.createdAt), 'MMM d, yy HH:mm:ss')}</TableCell>
                <TableCell className="font-sans font-medium text-foreground">{log.actorName}</TableCell>
                <TableCell className={getActionColor(log.action)}>{log.action}</TableCell>
                <TableCell className="text-muted-foreground">{log.resource} <span className="opacity-50">{log.resourceId}</span></TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate" title={JSON.stringify(log.details)}>
                  {log.details ? JSON.stringify(log.details) : '-'}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8">No audit logs found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
