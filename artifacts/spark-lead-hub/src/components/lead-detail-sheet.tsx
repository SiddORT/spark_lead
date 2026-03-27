import { useState, useEffect } from "react";
import { 
  useGetLead, useUpdateLead, useGetLeadNotes, useAddLeadNote, 
  useDeleteLeadNote, useUpdateLeadNote, useGetLeadActivities, 
  useGetServices, useGetServiceCompanies, getGetLeadsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, Tabs, TabsList, TabsTrigger, TabsContent, Input, Select, Badge, Button, Textarea } from "./ui";
import { formatValue } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Lock, Send, Clock, Trash2, Edit2, X, AlertCircle } from "lucide-react";
import { useUserMap } from "@/hooks/use-user-map";
import { useAuth, PermissionCheck } from "./auth-provider";
import { toast } from "sonner";

export function LeadDetailSheet({ leadId, open, onOpenChange }: { leadId: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: lead } = useGetLead(leadId || "", { query: { enabled: !!leadId } });
  const { resolveName, users } = useUserMap();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateLeadMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}`] });
        toast.success("Lead updated successfully");
      }
    }
  });

  const isQualifyComplete = !!(lead?.emotionalState && lead?.decisionRole);
  const isStrategyComplete = !!(lead?.strategicTier);
  const isResolveComplete = !!(lead?.outcome);

  const [proceededStages, setProceededStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (lead) {
      const set = new Set(proceededStages);
      if (isQualifyComplete && lead.strategicTier) set.add('strategy');
      if (isStrategyComplete && lead.outcome) set.add('resolve');
      setProceededStages(set);
    }
  }, [lead]);

  const handleUpdate = (field: string, value: any) => {
    if (!lead || lead[field as keyof typeof lead] === value) return;
    
    let targetStage = lead.stage;
    const stages = ['discovery', 'qualification', 'strategy', 'resolution'];
    const merged = { ...lead, [field]: value };
    
    const qualify = !!(merged.emotionalState && merged.decisionRole);
    const strategy = !!(merged.strategicTier);
    const resolve = !!(merged.outcome);
    
    if (resolve) targetStage = 'resolution';
    else if (strategy) targetStage = 'strategy';
    else if (qualify) targetStage = 'qualification';

    const updates: any = { [field]: value };
    if (stages.indexOf(targetStage) > stages.indexOf(lead.stage)) {
      updates.stage = targetStage;
    }
    
    if (field === 'outcome' && value !== 'wip' && !lead.resolvedAt) {
      updates.resolvedAt = new Date().toISOString();
    }

    updateLeadMutation.mutate({ id: lead.id, data: updates });
  };

  if (!lead) return <Sheet open={open} onOpenChange={onOpenChange}><div className="p-8 text-center">Loading...</div></Sheet>;

  const strategyLocked = !isQualifyComplete || !proceededStages.has('strategy');
  const resolveLocked = !isStrategyComplete || !proceededStages.has('resolve');

  return (
    <Sheet open={open} onOpenChange={onOpenChange} className="w-full sm:w-[600px] md:w-[700px] max-w-full">
      <div className="flex flex-col h-full bg-background/50">
        
        {/* Header & Milestone */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex justify-between items-start mb-6 pr-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">{lead.leadName}</h2>
              <div className="flex gap-2 mt-2 items-center">
                <Badge variant="outline" className="uppercase tracking-wider">{lead.stage}</Badge>
                {lead.dealValue && <span className="text-sm font-medium text-accent">{formatValue(Number(lead.dealValue))}</span>}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between mt-8 px-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full" />
            <div className="absolute top-1/2 left-0 h-1 bg-primary neon-glow -z-10 -translate-y-1/2 rounded-full transition-all duration-500" 
              style={{ width: isResolveComplete ? '100%' : isStrategyComplete ? '50%' : isQualifyComplete ? '25%' : '0%' }} 
            />
            
            {[
              { id: 'qualify', label: 'Qualify', complete: isQualifyComplete },
              { id: 'strategy', label: 'Strategy', complete: isStrategyComplete },
              { id: 'resolve', label: 'Resolve', complete: isResolveComplete },
            ].map((step, i) => (
              <div key={step.id} className="bg-card px-2 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step.complete ? "border-success text-success bg-success/10 neon-glow-sm" : "border-muted text-muted-foreground bg-card"}`}>
                  {step.complete ? <Check size={16} /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <span className={`text-xs mt-2 font-medium ${step.complete ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="details">
            <TabsList className="w-full flex mb-6 p-1 bg-card border border-border">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="qualify">Qualify {isQualifyComplete && <Check size={14} className="ml-1 text-success"/>}</TabsTrigger>
              <TabsTrigger value="strategy" disabled={strategyLocked} className="data-[disabled]:opacity-50">Strategy {strategyLocked && <Lock size={14} className="ml-1"/>}</TabsTrigger>
              <TabsTrigger value="resolve" disabled={resolveLocked} className="data-[disabled]:opacity-50">Resolve {resolveLocked && <Lock size={14} className="ml-1"/>}</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Lead Name</label>
                  <Input defaultValue={lead.leadName} onBlur={(e) => handleUpdate('leadName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Lead Type</label>
                  <Select value={lead.leadType || ""} onChange={(e) => handleUpdate('leadType', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">☀️ Warm</option>
                    <option value="cold">🧊 Cold</option>
                    <option value="ghosted">👻 Ghosted</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Contact Email</label>
                  <Input type="email" defaultValue={lead.contactEmail || ""} onBlur={(e) => handleUpdate('contactEmail', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
                  <Input type="tel" defaultValue={lead.phone || ""} onBlur={(e) => handleUpdate('phone', e.target.value)} />
                </div>
                
                <ServiceCompanySelectors lead={lead} handleUpdate={handleUpdate} />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Lead Owner</label>
                  <Select value={lead.leadOwner || ""} onChange={(e) => handleUpdate('leadOwner', e.target.value)}>
                    <option value="">Unassigned</option>
                    {users.filter(u => ['admin', 'lead_owner'].includes(u.role)).map(u => (
                      <option key={u.id} value={u.id}>{u.displayName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Deal Handler</label>
                  <Select value={lead.dealHandler || ""} onChange={(e) => handleUpdate('dealHandler', e.target.value)}>
                    <option value="">Unassigned</option>
                    {users.filter(u => ['admin', 'deal_handler'].includes(u.role)).map(u => (
                      <option key={u.id} value={u.id}>{u.displayName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Deal Value (₹)</label>
                  <Input type="number" defaultValue={lead.dealValue || ""} onBlur={(e) => handleUpdate('dealValue', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Follow-up Date</label>
                  <Input type="date" defaultValue={lead.followUpDate ? lead.followUpDate.split('T')[0] : ""} onBlur={(e) => handleUpdate('followUpDate', new Date(e.target.value).toISOString())} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Next Action</label>
                <Textarea defaultValue={lead.nextAction || ""} onBlur={(e) => handleUpdate('nextAction', e.target.value)} className="min-h-[60px]" />
              </div>

              <ActivityLog leadId={lead.id} />
            </TabsContent>

            <TabsContent value="qualify" className="space-y-6">
              <div className="bg-card border border-border p-5 rounded-xl glass">
                <h3 className="font-display font-semibold mb-4 text-primary flex items-center gap-2">
                  Qualification Assessment
                  {isQualifyComplete && <Badge variant="outline" className="border-success text-success bg-success/10 ml-auto">✅ Completed</Badge>}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Emotional State *</label>
                    <Select value={lead.emotionalState || ""} onChange={(e) => handleUpdate('emotionalState', e.target.value)}>
                      <option value="">Select...</option>
                      <option value="skeptical">Skeptical</option>
                      <option value="enthusiastic">Enthusiastic</option>
                      <option value="frustrated">Frustrated</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Decision Role *</label>
                    <Select value={lead.decisionRole || ""} onChange={(e) => handleUpdate('decisionRole', e.target.value)}>
                      <option value="">Select...</option>
                      <option value="champion">Champion</option>
                      <option value="gatekeeper">Gatekeeper</option>
                      <option value="economic_buyer">Economic Buyer</option>
                    </Select>
                  </div>
                </div>
                {isQualifyComplete && !proceededStages.has('strategy') && (
                  <Button className="w-full mt-6" onClick={() => setProceededStages(new Set(proceededStages).add('strategy'))}>
                    Proceed to Strategy &rarr;
                  </Button>
                )}
              </div>
              <NotesSection leadId={lead.id} stageContext="qualify" />
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6">
              {strategyLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
                  <Lock size={40} className="mb-4 opacity-50" />
                  <p>Complete Qualification phase to unlock Strategy.</p>
                </div>
              ) : (
                <>
                  <div className="bg-card border border-border p-5 rounded-xl glass">
                    <h3 className="font-display font-semibold mb-4 text-accent">Strategy Formulation</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Strategic Tier *</label>
                        <Select value={lead.strategicTier || ""} onChange={(e) => handleUpdate('strategicTier', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="high">High Priority</option>
                          <option value="med">Medium</option>
                          <option value="low">Low Priority</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Custom Hook (1-sentence pitch)</label>
                        <Textarea defaultValue={lead.customHook || ""} onBlur={(e) => handleUpdate('customHook', e.target.value)} placeholder="What's our angle?" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Known Objections</label>
                        <Input defaultValue={lead.objection || ""} onBlur={(e) => handleUpdate('objection', e.target.value)} />
                      </div>
                    </div>
                    {isStrategyComplete && !proceededStages.has('resolve') && (
                      <Button className="w-full mt-6" onClick={() => setProceededStages(new Set(proceededStages).add('resolve'))}>
                        Proceed to Resolve &rarr;
                      </Button>
                    )}
                  </div>
                  <NotesSection leadId={lead.id} stageContext="strategy" />
                </>
              )}
            </TabsContent>

            <TabsContent value="resolve" className="space-y-6">
              {resolveLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
                  <Lock size={40} className="mb-4 opacity-50" />
                  <p>Complete Strategy phase to unlock Resolution.</p>
                </div>
              ) : (
                <>
                  <div className="bg-card border border-border p-5 rounded-xl glass">
                    <h3 className="font-display font-semibold mb-4 text-warning">Outcome Resolution</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Outcome *</label>
                        <Select value={lead.outcome || ""} onChange={(e) => handleUpdate('outcome', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="closed">Closed Won</option>
                          <option value="lost">Closed Lost</option>
                          <option value="wip">Work in Progress</option>
                          <option value="delayed">Delayed</option>
                        </Select>
                      </div>
                      {lead.outcome === 'lost' && (
                        <div className="space-y-2 animate-slide-in">
                          <label className="text-xs font-semibold text-muted-foreground">Kill Reason</label>
                          <Select value={lead.killReason || ""} onChange={(e) => handleUpdate('killReason', e.target.value)}>
                            <option value="">Select...</option>
                            <option value="feature_gap">Feature Gap</option>
                            <option value="price">Price</option>
                            <option value="ghosted">Ghosted</option>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Friction Point</label>
                        <Select value={lead.frictionPoint || ""} onChange={(e) => handleUpdate('frictionPoint', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="scaling">Scaling</option>
                          <option value="tech_debt">Tech Debt</option>
                          <option value="budget">Budget</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Internal Rating (1-10)</label>
                        <Input type="number" min="1" max="10" defaultValue={lead.internalRating || ""} onBlur={(e) => handleUpdate('internalRating', parseInt(e.target.value))} />
                      </div>
                    </div>
                  </div>
                  <NotesSection leadId={lead.id} stageContext="resolve" />
                </>
              )}
            </TabsContent>

            <TabsContent value="notes">
              <NotesSection leadId={lead.id} stageContext={null} />
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </Sheet>
  );
}

function ServiceCompanySelectors({ lead, handleUpdate }: { lead: any, handleUpdate: any }) {
  const { data: services } = useGetServices();
  const { data: companies } = useGetServiceCompanies(lead.serviceId || "", { query: { enabled: !!lead.serviceId } });
  
  return (
    <>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Service</label>
        <Select value={lead.serviceId || ""} onChange={(e) => {
          handleUpdate('serviceId', e.target.value);
          handleUpdate('companyIds', []); // reset companies on service change
        }}>
          <option value="">Select...</option>
          {services?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Linked Companies</label>
        {lead.serviceId ? (
          <div className="border border-border bg-card/50 p-2 rounded-md max-h-32 overflow-y-auto space-y-1">
            {companies?.map(c => {
              const isChecked = lead.companies?.some((lc: any) => lc.id === c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-muted/50 rounded">
                  <input type="checkbox" checked={isChecked} onChange={(e) => {
                    const currentIds = lead.companies?.map((lc: any) => lc.id) || [];
                    const newIds = e.target.checked ? [...currentIds, c.id] : currentIds.filter((id: string) => id !== c.id);
                    handleUpdate('companyIds', newIds);
                  }} className="rounded border-border bg-card text-primary accent-primary" />
                  {c.name}
                </label>
              );
            })}
            {!companies?.length && <div className="text-xs text-muted-foreground text-center py-2">No companies linked to this service.</div>}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground p-2 border border-border border-dashed rounded text-center">Select a service first</div>
        )}
      </div>
    </>
  )
}

function NotesSection({ leadId, stageContext }: { leadId: string, stageContext: string | null }) {
  const { data: notes } = useGetLeadNotes(leadId);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  
  const addMutation = useAddLeadNote({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] }); setNewNote(""); }});
  const deleteMutation = useDeleteLeadNote({ onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/notes`] })});

  const filteredNotes = notes?.filter(n => stageContext ? n.stageContext === stageContext : true) || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea 
          placeholder="Type a new note..." 
          value={newNote} 
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px]"
        />
        <Button className="h-auto self-stretch" onClick={() => {
          if(newNote.trim()) addMutation.mutate({ id: leadId, data: { content: newNote, stageContext } });
        }}>
          <Send size={18} />
        </Button>
      </div>
      
      <div className="space-y-3 mt-6">
        {filteredNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
        ) : (
          filteredNotes.map(n => (
            <div key={n.id} className="bg-card border border-border p-4 rounded-lg flex flex-col gap-2 shadow-sm animate-slide-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{n.authorName}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12}/> {format(new Date(n.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                {n.userId === user?.id && (
                  <button onClick={() => deleteMutation.mutate({ id: leadId, noteId: n.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{n.content}</p>
              {n.stageContext && !stageContext && (
                <Badge variant="secondary" className="w-fit mt-1 text-[10px]">{n.stageContext}</Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ActivityLog({ leadId }: { leadId: string }) {
  const { data: activities } = useGetLeadActivities(leadId);
  if (!activities?.length) return null;
  
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-4 tracking-wider">Activity Log</h4>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {activities.map(a => (
          <div key={a.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <span className="text-[10px] font-bold text-muted-foreground">{a.actorName[0]}</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded border border-border bg-card shadow-sm glass">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-primary text-xs">{a.action}</div>
                <time className="text-[10px] font-medium text-muted-foreground">{format(new Date(a.createdAt), 'MMM d, HH:mm')}</time>
              </div>
              <div className="text-xs text-foreground/80">
                {a.fieldName && <span>Updated <strong className="text-foreground">{a.fieldName}</strong> from <em className="opacity-70">{a.oldValue || 'none'}</em> to <strong className="text-accent">{a.newValue}</strong></span>}
                {!a.fieldName && <span>{a.actorName} created the lead</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
