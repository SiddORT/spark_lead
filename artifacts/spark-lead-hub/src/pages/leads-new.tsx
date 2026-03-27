import { useState } from "react";
import { useCreateLead } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, Input, Select, Button, Textarea } from "@/components/ui";
import { useGetServices, useGetServiceCompanies } from "@workspace/api-client-react";
import { useUserMap } from "@/hooks/use-user-map";
import { toast } from "sonner";

export function NewLead() {
  const [, setLocation] = useLocation();
  const createLead = useCreateLead();
  const { users } = useUserMap();
  const { data: services } = useGetServices();

  const [formData, setFormData] = useState<any>({
    leadName: '',
    leadType: 'cold',
    contactEmail: '',
    phone: '',
    serviceId: '',
    leadOwner: '',
    dealValue: '',
    nextAction: ''
  });

  const { data: companies } = useGetServiceCompanies(formData.serviceId, { query: { enabled: !!formData.serviceId } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadName) {
      toast.error("Lead name is required");
      return;
    }

    createLead.mutate({ data: formData }, {
      onSuccess: () => {
        toast.success("Lead created successfully");
        setLocation("/");
      },
      onError: (err: any) => toast.error(err.message || "Failed to create lead")
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-slide-in">
      <Card className="glass-strong border-primary/20 shadow-2xl shadow-primary/5">
        <CardHeader className="border-b border-border/50 bg-card/50">
          <CardTitle className="text-2xl text-primary flex items-center gap-3">
            <div className="w-2 h-8 bg-primary rounded-full neon-glow" />
            Create New Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Lead Name <span className="text-destructive">*</span></label>
                <Input required value={formData.leadName} onChange={e => setFormData({...formData, leadName: e.target.value})} placeholder="e.g. Acme Corp Expansion" className="h-12 text-lg focus-visible:ring-primary/50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Lead Type</label>
                <Select value={formData.leadType} onChange={e => setFormData({...formData, leadType: e.target.value})}>
                  <option value="hot">🔥 Hot</option>
                  <option value="warm">☀️ Warm</option>
                  <option value="cold">🧊 Cold</option>
                  <option value="ghosted">👻 Ghosted</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Deal Value (₹)</label>
                <Input type="number" value={formData.dealValue} onChange={e => setFormData({...formData, dealValue: e.target.value})} placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                <Input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} placeholder="john@acme.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Service</label>
                <Select value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value, companyIds: []})}>
                  <option value="">Select Service...</option>
                  {services?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Lead Owner</label>
                <Select value={formData.leadOwner} onChange={e => setFormData({...formData, leadOwner: e.target.value})}>
                  <option value="">Unassigned</option>
                  {users.filter(u => ['admin', 'lead_owner'].includes(u.role)).map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </Select>
              </div>
            </div>

            {formData.serviceId && companies && companies.length > 0 && (
              <div className="space-y-2 border border-border p-4 rounded-lg bg-card/50">
                <label className="text-sm font-medium text-muted-foreground">Link Companies</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {companies.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="rounded border-border bg-background text-primary accent-primary" 
                        onChange={(e) => {
                          const ids = formData.companyIds || [];
                          setFormData({...formData, companyIds: e.target.checked ? [...ids, c.id] : ids.filter((id: string) => id !== c.id)});
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Next Action / Notes</label>
              <Textarea value={formData.nextAction} onChange={e => setFormData({...formData, nextAction: e.target.value})} placeholder="Initial thoughts..." />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
              <Button type="button" variant="ghost" onClick={() => setLocation("/")}>Cancel</Button>
              <Button type="submit" disabled={createLead.isPending} className="min-w-[120px]">
                {createLead.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
