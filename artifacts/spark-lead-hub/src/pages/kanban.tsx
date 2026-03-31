import { useState } from "react";
import { useGetLeads, useUpdateLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useUserMap } from "@/hooks/use-user-map";
import { usePipelineStages } from "@/hooks/use-pipeline";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { formatValue } from "@/lib/utils";
import { toast } from "sonner";
import { Kanban as KanbanIcon, AlertCircle } from "lucide-react";

const TYPE_EMOJI: Record<string, string> = {
  hot: "🔥", warm: "☀️", cold: "🧊", ghosted: "👻",
};

function hexToRgba(color: string, alpha: number): string {
  return `${color.replace("hsl(", "hsla(").replace(")", `, ${alpha})`)}`;
}

export function KanbanBoard() {
  const { data: leads = [], isLoading: leadsLoading } = useGetLeads();
  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages();
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();
  const { resolveName } = useUserMap();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const isLoading = leadsLoading || stagesLoading;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStageId = destination.droppableId;
    const lead = (leads as any[]).find((l: any) => l.id === draggableId);
    if (!lead) return;

    // Get the first status of the target stage
    const targetStage = stages.find((s) => s.id === newStageId);
    const firstStatus = targetStage?.statuses[0];

    // Optimistic update
    queryClient.setQueryData(getGetLeadsQueryKey(), (old: any) => {
      if (!old) return old;
      return old.map((l: any) =>
        l.id === draggableId
          ? {
              ...l,
              pipelineStageId: newStageId,
              stageName: targetStage?.displayName,
              stageColor: targetStage?.color,
              pipelineStatusId: firstStatus?.id ?? null,
              statusName: firstStatus?.displayName ?? null,
            }
          : l
      );
    });

    updateLead.mutate(
      { id: draggableId, data: { pipelineStageId: newStageId, pipelineStatusId: firstStatus?.id ?? null } },
      {
        onError: () => {
          toast.error("Failed to move lead");
          queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        },
      }
    );
  };

  const activeStages = stages.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="page" style={{ maxWidth: "none" }}>
        <div className="page-header">
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <KanbanIcon size={28} style={{ color: "var(--teal)" }} />
            Kanban Pipeline
          </h1>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)", padding: "var(--space-4)", minHeight: 480,
            }}>
              <div style={{ height: 20, width: 100, background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-4)", animation: "pulse 2s ease infinite" }} />
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ height: 96, background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-3)", animation: "pulse 2s ease infinite", animationDelay: `${j * 0.1}s` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "none", overflowX: "hidden" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <KanbanIcon size={28} style={{ color: "var(--teal)" }} />
            Kanban Pipeline
          </h1>
          <p className="page-subtitle">Drag cards to move leads between stages</p>
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: "var(--space-4)" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${activeStages.length}, minmax(240px, 1fr))`,
            gap: "var(--space-4)",
            minWidth: activeStages.length * 240,
          }}>
            {activeStages.map((stage) => {
              const columnLeads = (leads as any[]).filter((l) => l.pipelineStageId === stage.id);
              const colValue = columnLeads.reduce((s: number, l: any) => s + Number(l.dealValue || 0), 0);
              const glow = hexToRgba(stage.color, 0.15);

              return (
                <Droppable droppableId={stage.id} key={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        background: snapshot.isDraggingOver ? "hsl(222 16% 14%)" : "var(--bg-elevated)",
                        border: `1px solid ${snapshot.isDraggingOver ? stage.color : "var(--border-subtle)"}`,
                        borderRadius: "var(--radius-lg)",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 480,
                        transition: "border-color 200ms ease, background 200ms ease",
                        boxShadow: snapshot.isDraggingOver ? `0 0 24px ${glow}` : "none",
                      }}
                    >
                      {/* Column header */}
                      <div style={{
                        padding: "var(--space-4) var(--space-4) var(--space-3)",
                        borderBottom: "1px solid var(--border-subtle)",
                        flexShrink: 0,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: stage.color,
                              boxShadow: `0 0 6px ${glow}`,
                            }} />
                            <span style={{
                              fontFamily: "var(--font-display)", fontWeight: 700,
                              fontSize: "var(--text-sm)", color: "var(--text-primary)",
                            }}>
                              {stage.displayName}
                            </span>
                          </div>
                          <span style={{
                            minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "var(--bg-subtle)", borderRadius: "var(--radius-full)",
                            fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-secondary)", padding: "0 6px",
                          }}>
                            {columnLeads.length}
                          </span>
                        </div>
                        {colValue > 0 && (
                          <div style={{ fontSize: "var(--text-xs)", color: stage.color, fontWeight: 600, opacity: 0.8 }}>
                            {formatValue(colValue)}
                          </div>
                        )}
                      </div>

                      {/* Cards */}
                      <div style={{
                        flex: 1, padding: "var(--space-3)",
                        display: "flex", flexDirection: "column", gap: "var(--space-2)", overflowY: "auto",
                      }}>
                        {columnLeads.map((lead: any, index: number) => (
                          <Draggable draggableId={lead.id} index={index} key={lead.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedLeadId(lead.id)}
                                style={{
                                  ...provided.draggableProps.style,
                                  background: snapshot.isDragging ? "var(--bg-overlay)" : "var(--bg-subtle)",
                                  border: `1px solid ${snapshot.isDragging ? stage.color : "var(--border-subtle)"}`,
                                  borderRadius: "var(--radius-md)",
                                  padding: "12px 14px",
                                  cursor: "grab",
                                  transition: snapshot.isDragging ? "none" : "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
                                  boxShadow: snapshot.isDragging
                                    ? `0 12px 32px hsl(222 22% 3% / 0.6), 0 0 16px ${glow}`
                                    : "none",
                                }}
                                onMouseEnter={e => {
                                  if (!snapshot.isDragging) {
                                    e.currentTarget.style.borderColor = "var(--border-default)";
                                    e.currentTarget.style.boxShadow = "0 4px 16px hsl(222 22% 3% / 0.4)";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!snapshot.isDragging) {
                                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }
                                }}
                              >
                                {/* Card header */}
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: lead.company ? 3 : 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35, flex: 1 }}>
                                    {lead.leadName}
                                  </span>
                                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                                    {TYPE_EMOJI[lead.leadType || "cold"] || "🧊"}
                                  </span>
                                </div>
                                {lead.company && (
                                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.3, fontWeight: 500 }}>
                                    {lead.company}
                                  </div>
                                )}

                                {/* Status badge */}
                                {lead.statusName && (
                                  <div style={{ marginBottom: "var(--space-2)" }}>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      background: `${lead.statusColor || stage.color}22`,
                                      border: `1px solid ${lead.statusColor || stage.color}45`,
                                      borderRadius: "var(--radius-full)",
                                      color: lead.statusColor || stage.color,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      lineHeight: 1.7,
                                    }}>
                                      {lead.statusName}
                                    </span>
                                  </div>
                                )}

                                {lead.companies && lead.companies.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "var(--space-2)" }}>
                                    {(lead.companies as any[]).slice(0, 2).map((c: any) => (
                                      <span key={c.id} style={{
                                        display: "inline-block", padding: "2px 7px",
                                        background: "hsl(172 75% 48% / 0.1)", border: "1px solid hsl(172 75% 48% / 0.25)",
                                        borderRadius: "var(--radius-full)", color: "var(--teal)",
                                        fontSize: 11, fontWeight: 500, lineHeight: 1.6, whiteSpace: "nowrap",
                                      }}>{c.name}</span>
                                    ))}
                                    {lead.companies.length > 2 && (
                                      <span style={{
                                        display: "inline-block", padding: "2px 7px",
                                        background: "var(--bg-muted)", border: "1px solid var(--border-subtle)",
                                        borderRadius: "var(--radius-full)", color: "var(--text-secondary)",
                                        fontSize: 11, fontWeight: 500, lineHeight: 1.6,
                                      }}>+{lead.companies.length - 2}</span>
                                    )}
                                  </div>
                                )}

                                {/* Pipeline stage dots */}
                                <div style={{ display: "flex", gap: 3, marginBottom: "var(--space-3)" }}>
                                  {activeStages.map((s, i) => {
                                    const currentIdx = activeStages.findIndex((st) => st.id === lead.pipelineStageId);
                                    const done = i <= currentIdx;
                                    return (
                                      <div key={s.id} title={s.displayName} style={{
                                        width: 6, height: 6, borderRadius: "50%",
                                        background: done ? s.color : "var(--bg-muted)",
                                        border: `1px solid ${done ? s.color : "var(--border-subtle)"}`,
                                        opacity: done ? 1 : 0.4,
                                      }} />
                                    );
                                  })}
                                </div>

                                {/* Card footer */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: -4 }}>
                                    {lead.leadOwner && (
                                      <div className="avatar avatar-sm" title={`Owner: ${resolveName(lead.leadOwner)}`} style={{ border: "1px solid var(--bg-elevated)" }}>
                                        {resolveName(lead.leadOwner)[0]}
                                      </div>
                                    )}
                                    {lead.dealHandler && lead.dealHandler !== lead.leadOwner && (
                                      <div className="avatar avatar-sm avatar-purple" title={`Handler: ${resolveName(lead.dealHandler)}`} style={{ marginLeft: -6, border: "1px solid var(--bg-elevated)" }}>
                                        {resolveName(lead.dealHandler)[0]}
                                      </div>
                                    )}
                                  </div>
                                  {lead.dealValue && (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", fontFamily: "monospace" }}>
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
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            minHeight: 100, border: `1px dashed ${stage.color}`, borderRadius: "var(--radius-md)",
                            opacity: 0.35, padding: "var(--space-4)", gap: "var(--space-2)",
                          }}>
                            <AlertCircle size={16} style={{ color: stage.color }} />
                            <span style={{ fontSize: "var(--text-xs)", color: stage.color }}>No leads here</span>
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

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
