import { useState } from "react";
import { useGetLeads, useUpdateLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useUserMap } from "@/hooks/use-user-map";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { formatValue } from "@/lib/utils";
import { toast } from "sonner";
import { Kanban } from "lucide-react";

const STAGES = ["discovery", "qualification", "strategy", "resolution"] as const;

const TYPE_EMOJI: Record<string, string> = {
  hot: "🔥", warm: "☀️", cold: "🧊", ghosted: "👻",
};

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
    queryClient.setQueryData(getGetLeadsQueryKey(), (old: any) => {
      if (!old) return old;
      return old.map((l: any) => l.id === draggableId ? { ...l, stage: newStage } : l);
    });

    updateLead.mutate({ id: draggableId, data: { stage: newStage } }, {
      onError: () => {
        toast.error("Failed to move lead");
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
      },
    });
  };

  return (
    <div className="page" style={{ maxWidth: "none", overflowX: "hidden" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Kanban size={28} style={{ color: "var(--teal)" }} />
            Kanban Pipeline
          </h1>
          <p className="page-subtitle">Drag cards to move leads between stages</p>
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: "var(--space-4)" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-grid">
            {STAGES.map(stage => {
              const columnLeads = leads.filter(l => l.stage === stage);
              return (
                <Droppable droppableId={stage} key={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`kanban-column col-${stage}`}
                      style={snapshot.isDraggingOver ? { background: "var(--bg-subtle)" } : {}}
                    >
                      <div className="kanban-column-header">
                        <span className="kanban-column-title">{stage}</span>
                        <span className="kanban-column-count">{columnLeads.length}</span>
                      </div>

                      <div className="kanban-cards">
                        {columnLeads.map((lead, index) => (
                          <Draggable draggableId={lead.id} index={index} key={lead.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedLeadId(lead.id)}
                                className={`kanban-card${snapshot.isDragging ? " dragging" : ""}`}
                              >
                                <div className="kanban-card-header">
                                  <span className="kanban-card-name">{lead.leadName}</span>
                                  <span style={{ fontSize: "var(--text-base)", flexShrink: 0 }}>
                                    {TYPE_EMOJI[lead.leadType || "cold"] || "🧊"}
                                  </span>
                                </div>

                                <div className="kanban-card-company">{lead.company || "No company"}</div>

                                <div className="kanban-card-footer">
                                  <div style={{ display: "flex", gap: "-4px" }}>
                                    {lead.leadOwner && (
                                      <div
                                        className="avatar avatar-sm"
                                        title={`Owner: ${resolveName(lead.leadOwner)}`}
                                      >
                                        {resolveName(lead.leadOwner)[0]}
                                      </div>
                                    )}
                                    {lead.dealHandler && lead.dealHandler !== lead.leadOwner && (
                                      <div
                                        className="avatar avatar-sm avatar-purple"
                                        title={`Handler: ${resolveName(lead.dealHandler)}`}
                                        style={{ marginLeft: "-6px" }}
                                      >
                                        {resolveName(lead.dealHandler)[0]}
                                      </div>
                                    )}
                                  </div>
                                  {lead.dealValue && (
                                    <span className="kanban-card-value">
                                      {formatValue(Number(lead.dealValue))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {columnLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            minHeight: 80, color: "var(--text-muted)", fontSize: "var(--text-xs)",
                            border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-md)",
                            padding: "var(--space-4)",
                          }}>
                            Drop leads here
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onOpenChange={open => !open && setSelectedLeadId(null)}
      />
    </div>
  );
}
