import { useState } from "react";
import { useGetTeamMembers, useUpdateTeamMember, useDeleteTeamMember, useInviteUser, useGetAccessRequests, useApproveAccessRequest, useRejectAccessRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Select, Dialog, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Switch } from "@/components/ui";
import { format } from "date-fns";
import { PlusCircle, Search, Mail, ShieldAlert, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useAuth, PermissionCheck } from "@/components/auth-provider";
import { toast } from "sonner";

export function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  const { data: members = [] } = useGetTeamMembers();
  const { data: pendingRequests = [] } = useGetAccessRequests({ status: 'pending' }, { query: { enabled: isAdmin } });
  const { data: historyRequests = [] } = useGetAccessRequests({ status: 'approved' }, { query: { enabled: isAdmin } }); 
  // Normally would merge approved/rejected, skipping for brevity or rely on backend to allow multiple status / fetch all

  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const inviteUser = useInviteUser();
  const approveRequest = useApproveAccessRequest();
  const rejectRequest = useRejectAccessRequest();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'deal_handler' });

  const filteredMembers = members.filter(m => {
    return (m.displayName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) &&
           (!roleFilter || m.role === roleFilter);
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate({ data: inviteData as any }, {
      onSuccess: () => {
        toast.success("User invited successfully");
        setInviteOpen(false);
        queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  const handleRoleChange = (id: string, role: string) => {
    updateMember.mutate({ id, data: { role: role as any } }, {
      onSuccess: () => {
        toast.success("Role updated");
        queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
      }
    });
  };

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    updateMember.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast.success(`User access ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently delete user? This cascades and deletes everything except leads they created.")) {
      deleteMember.mutate({ id }, {
        onSuccess: () => {
          toast.success("User deleted");
          queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
        },
        onError: (err: any) => toast.error(err.message)
      });
    }
  };

  const handleRequestAction = (id: string, action: 'approve' | 'reject') => {
    const mutation = action === 'approve' ? approveRequest : rejectRequest;
    mutation.mutate({ id }, {
      onSuccess: () => {
        toast.success(`Request ${action}d`);
        queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
        queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-slide-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold">Team Management</h1>
        <PermissionCheck resource="team" action="create">
          <Button onClick={() => setInviteOpen(true)} className="gap-2"><PlusCircle size={16}/> Invite User</Button>
        </PermissionCheck>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 glass"><div className="text-sm text-muted-foreground">Total Members</div><div className="text-2xl font-bold">{members.length}</div></Card>
        <Card className="p-4 glass"><div className="text-sm text-muted-foreground">Admins</div><div className="text-2xl font-bold">{members.filter(m => m.role === 'admin').length}</div></Card>
        <Card className="p-4 glass"><div className="text-sm text-muted-foreground">Lead Owners</div><div className="text-2xl font-bold text-primary">{members.filter(m => m.role === 'lead_owner').length}</div></Card>
        {isAdmin && <Card className="p-4 glass border-warning/30"><div className="text-sm text-warning">Pending Requests</div><div className="text-2xl font-bold">{pendingRequests.length}</div></Card>}
      </div>

      <Tabs defaultValue="members" className="glass-strong rounded-xl border border-border/50 overflow-hidden">
        <div className="border-b border-border/50 bg-card/50 p-4 pb-0">
          <TabsList className="bg-transparent border-none p-0 flex gap-4 h-auto">
            <TabsTrigger value="members" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:neon-glow-none rounded-none pb-3 px-1">Members</TabsTrigger>
            {isAdmin && <TabsTrigger value="requests" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:neon-glow-none rounded-none pb-3 px-1">Access Requests {pendingRequests.length > 0 && <Badge className="ml-2 bg-warning text-warning-foreground py-0 h-5">{pendingRequests.length}</Badge>}</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="members" className="p-0 m-0">
          <div className="p-4 flex gap-4 bg-card/30">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50" />
            </div>
            <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-40 bg-background/50">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="lead_owner">Lead Owner</option>
              <option value="deal_handler">Deal Handler</option>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead className="w-[120px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{m.displayName[0]}</div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{m.displayName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10}/> {m.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin && m.id !== user?.id ? (
                      <Select value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)} className="h-8 text-xs py-1 w-32 border-border bg-card">
                        <option value="admin">Admin</option>
                        <option value="lead_owner">Lead Owner</option>
                        <option value="deal_handler">Deal Handler</option>
                        <option value="member">Member</option>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="border-accent/30 text-accent">{m.role.replace('_', ' ')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.whitelistStatus === 'active' ? 'default' : 'secondary'} className={m.whitelistStatus === 'active' ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-muted text-muted-foreground'}>
                        {m.whitelistStatus}
                      </Badge>
                      {isAdmin && m.id !== user?.id && (
                        <Switch checked={m.whitelistStatus === 'active'} onCheckedChange={() => handleStatusToggle(m.id, m.whitelistStatus)} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(m.joinedAt), 'MMM d, yyyy')}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      {m.id !== user?.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="requests" className="p-0 m-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Requester</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{r.name}</span>
                        <span className="text-xs text-muted-foreground">{r.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.department || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={r.reason || ''}>{r.reason || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(r.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 px-2 border-success/30 text-success hover:bg-success/10" onClick={() => handleRequestAction(r.id, 'approve')}><CheckCircle size={14} className="mr-1"/> Approve</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10" onClick={() => handleRequestAction(r.id, 'reject')}><XCircle size={14} className="mr-1"/> Reject</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingRequests.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending requests.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">Invite User</h2>
          <p className="text-sm text-muted-foreground mt-1">Send an invitation email to add them to the whitelist.</p>
        </div>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input type="email" required value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} placeholder="colleague@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Role</label>
            <Select value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})}>
              <option value="admin">Admin</option>
              <option value="lead_owner">Lead Owner</option>
              <option value="deal_handler">Deal Handler</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={inviteUser.isPending} className="gap-2 bg-primary text-primary-foreground"><Mail size={16}/> Send Invite</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
