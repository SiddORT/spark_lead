import { useState } from "react";
import { useGetLeads, useUpdateLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useUserMap } from "@/hooks/use-user-map";
import { Badge } from "@/components/ui";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { formatValue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGES = ['discovery', 'qualification', 'strategy', 'resolution'] as const;

export function KanbanBoard() {
  const { data: leads = [] } = useGetLeads();
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();
  const { resolveName } = useUserMap();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStage = destination.droppableId as any;
    
    // Optimistic update
    queryClient.setQueryData(getGetLeadsQueryKey(), (old: any) => {
      if (!old) return old;
      return old.map((l: any) => l.id === draggableId ? { ...l, stage: newStage } : l);
    });

    updateLead.mutate({ id: draggableId, data: { stage: newStage } }, {
      onError: () => {
        toast.error("Failed to move lead");
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
      }
    });
  };

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'discovery': return 'hsl(var(--muted-foreground))';
      case 'qualification': return 'hsl(var(--primary))';
      case 'strategy': return 'hsl(var(--accent))';
      case 'resolution': return 'hsl(var(--success))';
      default: return 'hsl(var(--border))';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto overflow-hidden animate-slide-in">
      <h1 className="text-3xl font-display font-bold mb-6">Kanban Pipeline</h1>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max px-2">
            {STAGES.map(stage => {
              const columnLeads = leads.filter(l => l.stage === stage);
              return (
                <Droppable droppableId={stage} key={stage}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className={cn(
                        "w-[340px] flex flex-col glass-strong rounded-2xl border border-border/50 transition-colors duration-300 relative overflow-hidden",
                        snapshot.isDraggingOver && "bg-primary/5 border-primary/30"
                      )}
                    >
                      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: getStageColor(stage) }} />
                      <div className="p-4 border-b border-border/30 flex justify-between items-center bg-card/50">
                        <h3 className="font-display font-semibold uppercase tracking-wider text-sm" style={{ color: getStageColor(stage) }}>{stage}</h3>
                        <Badge variant="secondary" className="bg-background text-xs">{columnLeads.length}</Badge>
                      </div>
                      
                      <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar custom-scroll">
                        {columnLeads.map((lead, index) => (
                          <Draggable draggableId={lead.id} index={index} key={lead.id}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                {...provided.dragHandleProps} 
                                onClick={() => setSelectedLeadId(lead.id)}
                                className={cn(
                                  "bg-card border p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing transition-all hover:border-primary/50 relative overflow-hidden group",
                                  snapshot.isDragging ? "border-primary neon-glow rotate-2 z-50 scale-105" : "border-border"
                                )}
                              >
                                {lead.leadType === 'hot' && <div className="absolute -top-6 -right-6 w-12 h-12 bg-destructive/20 blur-xl rounded-full" />}
                                
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-sm text-foreground pr-4 line-clamp-2">{lead.leadName}</h4>
                                  <span className="text-xs">{lead.leadType === 'hot' ? '🔥' : lead.leadType === 'warm' ? '☀️' : lead.leadType === 'cold' ? '🧊' : '👻'}</span>
                                </div>
                                
                                <div className="text-xs text-muted-foreground mb-3">{lead.company || 'No company'}</div>
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                                  <div className="flex -space-x-2">
                                    {lead.leadOwner && (
                                      <div className="w-6 h-6 rounded-full border border-card bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary" title={`Owner: ${resolveName(lead.leadOwner)}`}>
                                        {resolveName(lead.leadOwner)[0]}
                                      </div>
                                    )}
                                    {lead.dealHandler && lead.dealHandler !== lead.leadOwner && (
                                      <div className="w-6 h-6 rounded-full border border-card bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent" title={`Handler: ${resolveName(lead.dealHandler)}`}>
                                        {resolveName(lead.dealHandler)[0]}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {lead.dealValue && (
                                    <span className="text-xs font-mono font-medium text-foreground">{formatValue(Number(lead.dealValue))}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      <LeadDetailSheet leadId={selectedLeadId} open={!!selectedLeadId} onOpenChange={(open) => !open && setSelectedLeadId(null)} />
    </div>
  );
}
