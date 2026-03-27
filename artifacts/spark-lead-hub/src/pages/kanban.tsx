import { useState } from "react";
import { useGetLeads, useUpdateLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useUserMap } from "@/hooks/use-user-map";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { formatValue } from "@/lib/utils";
import { toast } from "sonner";
import { Kanban as KanbanIcon, AlertCircle, Lock } from "lucide-react";

const STAGES = ["discovery", "qualification", "strategy", "resolution"] as const;
type Stage = typeof STAGES[number];

const STAGE_META: Record<Stage, { label: string; color: string; glow: string }> = {
  discovery:     { label: "Discovery",     color: "var(--text-muted)",  glow: "none" },
  qualification: { label: "Qualification", color: "var(--warning)",     glow: "hsl(38 90% 54% / 0.2)" },
  strategy:      { label: "Strategy",      color: "var(--purple)",      glow: "hsl(262 65% 62% / 0.2)" },
  resolution:    { label: "Resolution",    color: "var(--success)",     glow: "hsl(152 60% 44% / 0.2)" },
};

const TYPE_EMOJI: Record<string, string> = {
  hot: "🔥", warm: "☀️", cold: "🧊", ghosted: "👻",
};

// Stage gate rules:
// discovery   → qualification  : always allowed
// any         → strategy       : requires emotionalState + decisionRole (qualify complete)
// any         → resolution     : requires emotionalState + decisionRole + strategicTier (strategy complete)
function checkStageForbidden(lead: any, targetStage: Stage): string | null {
  const qualifyDone = !!(lead?.emotionalState && lead?.decisionRole);
  const strategyDone = !!(lead?.strategicTier);

  if (targetStage === "resolution") {
    if (!qualifyDone) {
      return "Complete Qualification first — fill in Emotional State & Decision Role in the lead detail sheet.";
    }
    if (!strategyDone) {
      return "Complete Strategy details first — fill in the Strategic Tier before moving to Resolution.";
    }
  }

  if (targetStage === "strategy") {
    if (!qualifyDone) {
      return "Complete Qualification first — fill in Emotional State & Decision Role in the lead detail sheet.";
    }
  }

  return null; // allowed
}

export function KanbanBoard() {
  const { data: leads = [], isLoading } = useGetLeads();
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();
  const { resolveName } = useUserMap();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStage = destination.droppableId as Stage;
    const lead = (leads as any[]).find((l: any) => l.id === draggableId);

    // Stage gate check
    const blocked = checkStageForbidden(lead, newStage);
    if (blocked) {
      toast.error(blocked, {
        icon: "🔒",
        duration: 4000,
        style: {
          background: "var(--bg-elevated)",
          border: "1px solid hsl(0 70% 58% / 0.3)",
          color: "var(--text-primary)",
        },
      });
      return; // do NOT update — revert to original position
    }

    // Optimistic update
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

  if (isLoading) {
    return (
      <div className="page" style={{ maxWidth: "none" }}>
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <KanbanIcon size={28} style={{ color: "var(--teal)" }} />
              Kanban Pipeline
            </h1>
            <p className="page-subtitle">Loading pipeline…</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
          {STAGES.map(stage => (
            <div key={stage} style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-4)",
              minHeight: 480,
            }}>
              <div style={{ height: 20, width: 100, background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-4)", animation: "pulse 2s ease infinite" }} />
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 96, background: "var(--bg-subtle)", borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-3)", animation: "pulse 2s ease infinite",
                  animationDelay: `${i * 0.1}s`,
                }} />
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
        {/* Stage gate legend */}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--space-2)",
          padding: "6px 12px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-xs)",
          color: "var(--text-muted)",
        }}>
          <Lock size={12} style={{ color: "var(--warning)" }} />
          Stage gates enforced — qualify before advancing
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: "var(--space-4)" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(240px, 1fr))",
            gap: "var(--space-4)",
            minWidth: 960,
          }}>
            {STAGES.map(stage => {
              const meta = STAGE_META[stage];
              const columnLeads = (leads as any[]).filter(l => l.stage === stage);
              const colValue = columnLeads.reduce((s: number, l: any) => s + Number(l.dealValue || 0), 0);

              return (
                <Droppable droppableId={stage} key={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        background: snapshot.isDraggingOver
                          ? `hsl(222 16% 14%)` : "var(--bg-elevated)",
                        border: `1px solid ${snapshot.isDraggingOver ? meta.color : "var(--border-subtle)"}`,
                        borderRadius: "var(--radius-lg)",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 480,
                        transition: "border-color 200ms ease, background 200ms ease",
                        boxShadow: snapshot.isDraggingOver
                          ? `0 0 24px ${meta.glow}`
                          : "none",
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
                              background: meta.color,
                              boxShadow: `0 0 6px ${meta.glow}`,
                            }} />
                            <span style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: "var(--text-sm)",
                              color: "var(--text-primary)",
                              textTransform: "capitalize",
                            }}>
                              {meta.label}
                            </span>
                          </div>
                          <span style={{
                            minWidth: 22, height: 22,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "var(--bg-subtle)",
                            borderRadius: "var(--radius-full)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            padding: "0 6px",
                          }}>
                            {columnLeads.length}
                          </span>
                        </div>
                        {colValue > 0 && (
                          <div style={{
                            fontSize: "var(--text-xs)",
                            color: meta.color,
                            fontWeight: 600,
                            opacity: 0.8,
                          }}>
                            {formatValue(colValue)}
                          </div>
                        )}
                      </div>

                      {/* Cards */}
                      <div style={{
                        flex: 1, padding: "var(--space-3)",
                        display: "flex", flexDirection: "column", gap: "var(--space-2)",
                        overflowY: "auto",
                      }}>
                        {columnLeads.map((lead: any, index: number) => {
                          const qualifyDone = !!(lead.emotionalState && lead.decisionRole);
                          const stratDone = !!lead.strategicTier;
                          const isBlocked = (stage === "discovery" && !qualifyDone && columnLeads.length > 0);

                          return (
                            <Draggable draggableId={lead.id} index={index} key={lead.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedLeadId(lead.id)}
                                  style={{
                                    ...provided.draggableProps.style,
                                    background: snapshot.isDragging
                                      ? "var(--bg-overlay)"
                                      : "var(--bg-subtle)",
                                    border: `1px solid ${snapshot.isDragging ? meta.color : "var(--border-subtle)"}`,
                                    borderRadius: "var(--radius-md)",
                                    padding: "var(--space-3)",
                                    cursor: "grab",
                                    transition: snapshot.isDragging ? "none" : "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
                                    boxShadow: snapshot.isDragging
                                      ? `0 12px 32px hsl(222 22% 3% / 0.6), 0 0 16px ${meta.glow}`
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
                                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: 4 }}>
                                    <span style={{
                                      fontSize: "var(--text-sm)",
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      lineHeight: 1.3,
                                      flex: 1,
                                    }}>
                                      {lead.leadName}
                                    </span>
                                    <span style={{ fontSize: "var(--text-base)", flexShrink: 0 }}>
                                      {TYPE_EMOJI[lead.leadType || "cold"] || "🧊"}
                                    </span>
                                  </div>

                                  {lead.company && (
                                    <div style={{
                                      fontSize: "var(--text-xs)",
                                      color: "var(--text-muted)",
                                      marginBottom: "var(--space-3)",
                                    }}>
                                      {lead.company}
                                    </div>
                                  )}

                                  {/* Stage progress dots */}
                                  <div style={{ display: "flex", gap: 3, marginBottom: "var(--space-3)" }}>
                                    {[
                                      { done: true, label: "D" },
                                      { done: qualifyDone, label: "Q" },
                                      { done: stratDone, label: "S" },
                                      { done: !!lead.outcome, label: "R" },
                                    ].map(({ done, label }, i) => (
                                      <div key={i} title={label} style={{
                                        width: 6, height: 6,
                                        borderRadius: "50%",
                                        background: done ? meta.color : "var(--bg-muted)",
                                        border: `1px solid ${done ? meta.color : "var(--border-subtle)"}`,
                                        opacity: done ? 1 : 0.4,
                                      }} />
                                    ))}
                                  </div>

                                  {/* Card footer */}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: -4 }}>
                                      {lead.leadOwner && (
                                        <div
                                          className="avatar avatar-sm"
                                          title={`Owner: ${resolveName(lead.leadOwner)}`}
                                          style={{ border: "1px solid var(--bg-elevated)" }}
                                        >
                                          {resolveName(lead.leadOwner)[0]}
                                        </div>
                                      )}
                                      {lead.dealHandler && lead.dealHandler !== lead.leadOwner && (
                                        <div
                                          className="avatar avatar-sm avatar-purple"
                                          title={`Handler: ${resolveName(lead.dealHandler)}`}
                                          style={{ marginLeft: -6, border: "1px solid var(--bg-elevated)" }}
                                        >
                                          {resolveName(lead.dealHandler)[0]}
                                        </div>
                                      )}
                                    </div>
                                    {lead.dealValue && (
                                      <span style={{
                                        fontSize: "var(--text-xs)",
                                        fontWeight: 700,
                                        color: "var(--teal)",
                                        fontFamily: "monospace",
                                      }}>
                                        {formatValue(Number(lead.dealValue))}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}

                        {provided.placeholder}

                        {columnLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 100,
                            border: `1px dashed ${meta.color}`,
                            borderRadius: "var(--radius-md)",
                            opacity: 0.35,
                            padding: "var(--space-4)",
                            gap: "var(--space-2)",
                          }}>
                            <AlertCircle size={16} style={{ color: meta.color }} />
                            <span style={{ fontSize: "var(--text-xs)", color: meta.color }}>
                              No leads here
                            </span>
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
