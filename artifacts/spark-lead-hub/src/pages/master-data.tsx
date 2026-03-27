import { useState } from "react";
import { useGetCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, useGetServices, useCreateService, useUpdateService, useDeleteService, useLinkServiceCompanies } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Dialog, Badge, Select } from "@/components/ui";
import { format } from "date-fns";
import { PlusCircle, Pencil, Trash2, Link as LinkIcon } from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";
import { toast } from "sonner";

export function Companies() {
  const { data: companies = [] } = useGetCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', industry: '', notes: '' });

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpen = (company?: any) => {
    if (company) {
      setEditingId(company.id);
      setFormData({ name: company.name, industry: company.industry || '', notes: company.notes || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', industry: '', notes: '' });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingId 
      ? updateMutation.mutateAsync({ id: editingId, data: formData })
      : createMutation.mutateAsync({ data: formData });
    
    action.then(() => {
      toast.success(`Company ${editingId ? 'updated' : 'created'}`);
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setIsOpen(false);
    }).catch(err => toast.error(err.message));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Company deleted");
          queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
        },
        onError: (err: any) => toast.error(err.message)
      });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Companies Master Data</h1>
        <Button onClick={() => handleOpen()} className="gap-2"><PlusCircle size={16}/> Add Company</Button>
      </div>

      <Card className="glass-strong">
        <div className="p-4 border-b border-border/50">
          <Input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.industry || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.services?.map((s: any) => <Badge key={s.id} variant="secondary" className="text-[10px] py-0">{s.name}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpen(c)} className="p-1 text-muted-foreground hover:text-primary"><Pencil size={14}/></button>
                    <PermissionCheck resource="companies" action="delete">
                      <button onClick={() => handleDelete(c.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14}/></button>
                    </PermissionCheck>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">{editingId ? 'Edit Company' : 'Add Company'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <Input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function Services() {
  const { data: services = [] } = useGetServices();
  const { data: allCompanies = [] } = useGetCompanies();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const linkMutation = useLinkServiceCompanies();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', description: '' });

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkingService, setLinkingService] = useState<any>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpen = (service?: any) => {
    if (service) {
      setEditingId(service.id);
      setFormData({ name: service.name, category: service.category || '', description: service.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: '', description: '' });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingId 
      ? updateMutation.mutateAsync({ id: editingId, data: formData })
      : createMutation.mutateAsync({ data: formData });
    
    action.then(() => {
      toast.success(`Service ${editingId ? 'updated' : 'created'}`);
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsOpen(false);
    }).catch(err => toast.error(err.message));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Service deleted");
          queryClient.invalidateQueries({ queryKey: ['/api/services'] });
        },
        onError: (err: any) => toast.error(err.message)
      });
    }
  };

  const openLinkDialog = (service: any) => {
    setLinkingService(service);
    setSelectedCompanies(service.companies?.map((c: any) => c.id) || []);
    setLinkOpen(true);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    linkMutation.mutate({ id: linkingService.id, data: { companyIds: selectedCompanies } }, {
      onSuccess: () => {
        toast.success("Companies linked");
        queryClient.invalidateQueries({ queryKey: ['/api/services'] });
        setLinkOpen(false);
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Services Master Data</h1>
        <Button onClick={() => handleOpen()} className="gap-2"><PlusCircle size={16}/> Add Service</Button>
      </div>

      <Card className="glass-strong">
        <div className="p-4 border-b border-border/50">
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Companies Linked</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.category || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.companies?.map((c: any) => <Badge key={c.id} variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">{c.name}</Badge>)}
                    {!s.companies?.length && <span className="text-xs text-muted-foreground opacity-50">None</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openLinkDialog(s)} className="p-1 text-primary hover:text-primary/80" title="Link Companies"><LinkIcon size={14}/></button>
                    <button onClick={() => handleOpen(s)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={14}/></button>
                    <PermissionCheck resource="services" action="delete">
                      <button onClick={() => handleDelete(s.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14}/></button>
                    </PermissionCheck>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">{editingId ? 'Edit Service' : 'Add Service'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2"><LinkIcon size={20} className="text-primary"/> Link Companies</h2>
          <p className="text-sm text-muted-foreground mt-1">Select companies to link to <strong>{linkingService?.name}</strong></p>
        </div>
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-background/50">
            {allCompanies.map(c => (
              <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedCompanies.includes(c.id)}
                  onChange={(e) => {
                    setSelectedCompanies(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id));
                  }}
                  className="rounded border-border bg-card accent-primary w-4 h-4"
                />
                <span className="text-sm text-foreground">{c.name}</span>
              </label>
            ))}
            {allCompanies.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">No companies available.</div>}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={linkMutation.isPending}>Save Links</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
