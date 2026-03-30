import { useState } from "react";
import {
  usePipelineStages, useCreateStage, useUpdateStage, useDeleteStage,
  useCreateStatus, useUpdateStatus, useDeleteStatus,
  type PipelineStage, type PipelineStatus,
} from "@/hooks/use-pipeline";
import { toast } from "sonner";
import { GitBranch, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Trophy, AlertCircle } from "lucide-react";

// ─── Small color swatch input ────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="color"
        value={value || "#6b7a9a"}
        onChange={e => onChange(e.target.value)}
        style={{ width: 36, height: 36, padding: 2, border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-subtle)", cursor: "pointer" }}
      />
      <input
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder="hsl(…)"
        style={{
          flex: 1, height: 36, padding: "0 10px",
          background: "var(--bg-subtle)", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)", color: "var(--text-primary)",
          fontSize: "var(--text-sm)", fontFamily: "monospace", outline: "none",
        }}
      />
    </div>
  );
}

// ─── Inline edit form for Stage ──────────────────────
function StageForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<PipelineStage>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [displayName, setDisplayName] = useState(initial?.displayName || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [color, setColor] = useState(initial?.color || "hsl(212, 78%, 58%)");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, background: "var(--bg-overlay)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
      <input
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        placeholder="Stage name (e.g. Discovery)"
        style={{ height: 36, padding: "0 10px", background: "var(--bg-subtle)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--text-sm)", outline: "none" }}
      />
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        style={{ height: 36, padding: "0 10px", background: "var(--bg-subtle)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--text-sm)", outline: "none" }}
      />
      <ColorInput value={color} onChange={setColor} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={() => displayName.trim() && onSave({ displayName: displayName.trim(), description: description.trim() || null, color })}
          style={{ padding: "6px 14px", background: "var(--teal)", color: "hsl(222 22% 6%)", border: "none", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer" }}>
          <Check size={13} style={{ display: "inline", marginRight: 4 }} />Save
        </button>
      </div>
    </div>
  );
}

// ─── Inline edit form for Status ─────────────────────
function StatusForm({
  stageId, initial, onSave, onCancel,
}: {
  stageId: string;
  initial?: Partial<PipelineStatus>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [displayName, setDisplayName] = useState(initial?.displayName || "");
  const [color, setColor] = useState(initial?.color || "hsl(212, 78%, 58%)");
  const [isWon, setIsWon] = useState(initial?.isWon || false);
  const [isLost, setIsLost] = useState(initial?.isLost || false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginTop: 6 }}>
      <input
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        placeholder="Status name (e.g. Proposal Sent)"
        style={{ height: 34, padding: "0 10px", background: "var(--bg-subtle)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--text-xs)", outline: "none" }}
      />
      <ColorInput value={color} onChange={setColor} />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={isWon} onChange={e => { setIsWon(e.target.checked); if (e.target.checked) setIsLost(false); }} style={{ accentColor: "var(--success)" }} />
          <Trophy size={12} style={{ color: "var(--success)" }} /> Won
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={isLost} onChange={e => { setIsLost(e.target.checked); if (e.target.checked) setIsWon(false); }} style={{ accentColor: "var(--danger)" }} />
          <AlertCircle size={12} style={{ color: "var(--danger)" }} /> Lost
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={onCancel} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontSize: "var(--text-xs)", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => displayName.trim() && onSave({ stageId, displayName: displayName.trim(), color, isWon, isLost })}
            style={{ padding: "4px 10px", background: "var(--teal)", color: "hsl(222 22% 6%)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer" }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function PipelineMaster() {
  const { data: stages = [], isLoading } = usePipelineStages();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const createStatus = useCreateStatus();
  const updateStatus = useUpdateStatus();
  const deleteStatus = useDeleteStatus();

  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [addingStage, setAddingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [addingStatusForStage, setAddingStatusForStage] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "stage" | "status"; id: string } | null>(null);

  const toggleExpand = (id: string) => setExpandedStages(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const activeStages = stages.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <GitBranch size={24} style={{ color: "var(--teal)" }} /> Pipeline Configuration
          </h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 64, background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", animation: "pulse 2s ease infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <GitBranch size={24} style={{ color: "var(--teal)" }} /> Pipeline Configuration
          </h1>
          <p className="page-subtitle">Manage stages and statuses in your sales pipeline</p>
        </div>
        <button
          onClick={() => setAddingStage(true)}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
        >
          <Plus size={15} /> Add Stage
        </button>
      </div>

      {/* Add Stage Form */}
      {addingStage && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <StageForm
            onSave={async (data) => {
              await createStage.mutateAsync({ ...data, sortOrder: activeStages.length + 1 });
              setAddingStage(false);
              toast.success("Stage created");
            }}
            onCancel={() => setAddingStage(false)}
          />
        </div>
      )}

      {/* Stage list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {activeStages.map((stage, stageIdx) => {
          const expanded = expandedStages.has(stage.id);
          const activeStatuses = stage.statuses.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

          return (
            <div key={stage.id} style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}>
              {/* Stage header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "var(--space-3)",
                padding: "var(--space-4) var(--space-5)",
                borderLeft: `4px solid ${stage.color}`,
              }}>
                <button onClick={() => toggleExpand(stage.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                    {stage.displayName}
                    {stage.isTerminal && (
                      <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 6px", background: "hsl(152 58% 43% / 0.15)", color: "var(--success)", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
                        Terminal
                      </span>
                    )}
                  </div>
                  {stage.description && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                      {stage.description}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {activeStatuses.length} status{activeStatuses.length !== 1 ? "es" : ""}
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    onClick={() => setEditingStageId(stage.id)}
                    className="btn btn-ghost btn-icon"
                    title="Edit stage"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ type: "stage", id: stage.id })}
                    className="btn btn-ghost btn-icon"
                    style={{ color: "var(--danger)" }}
                    title="Delete stage"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Edit stage form */}
              {editingStageId === stage.id && (
                <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
                  <StageForm
                    initial={stage}
                    onSave={async (data) => {
                      await updateStage.mutateAsync({ id: stage.id, data });
                      setEditingStageId(null);
                      toast.success("Stage updated");
                    }}
                    onCancel={() => setEditingStageId(null)}
                  />
                </div>
              )}

              {/* Statuses */}
              {expanded && (
                <div style={{ padding: "0 var(--space-5) var(--space-4)", borderTop: "1px solid var(--border-subtle)" }}>
                  {activeStatuses.length === 0 && !addingStatusForStage && (
                    <div style={{ padding: "var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center" }}>
                      No statuses yet — add one below
                    </div>
                  )}
                  {activeStatuses.map((status) => (
                    <div key={status.id}>
                      {editingStatusId === status.id ? (
                        <StatusForm
                          stageId={stage.id}
                          initial={status}
                          onSave={async (data) => {
                            await updateStatus.mutateAsync({ id: status.id, data });
                            setEditingStatusId(null);
                            toast.success("Status updated");
                          }}
                          onCancel={() => setEditingStatusId(null)}
                        />
                      ) : (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "var(--space-3)",
                          padding: "var(--space-2) 0",
                          borderBottom: "1px solid var(--border-faint)",
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: status.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                            {status.displayName}
                          </span>
                          {status.isWon && (
                            <span style={{ fontSize: 10, padding: "1px 6px", background: "hsl(152 58% 43% / 0.15)", color: "var(--success)", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
                              Won
                            </span>
                          )}
                          {status.isLost && (
                            <span style={{ fontSize: 10, padding: "1px 6px", background: "hsl(4 68% 58% / 0.15)", color: "var(--danger)", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
                              Lost
                            </span>
                          )}
                          <button onClick={() => setEditingStatusId(status.id)} className="btn btn-ghost btn-icon" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: "status", id: status.id })} className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingStatusForStage === stage.id ? (
                    <StatusForm
                      stageId={stage.id}
                      onSave={async (data) => {
                        await createStatus.mutateAsync({ ...data, sortOrder: activeStatuses.length + 1 });
                        setAddingStatusForStage(null);
                        toast.success("Status added");
                      }}
                      onCancel={() => setAddingStatusForStage(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingStatusForStage(stage.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--teal)", fontSize: "var(--text-xs)", fontWeight: 600,
                        padding: "var(--space-2) 0", marginTop: "var(--space-1)",
                      }}
                    >
                      <Plus size={13} /> Add Status
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeStages.length === 0 && !addingStage && (
          <div style={{
            textAlign: "center", padding: "var(--space-12)",
            color: "var(--text-muted)", background: "var(--bg-elevated)",
            borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-subtle)",
          }}>
            <GitBranch size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No pipeline stages configured</div>
            <div style={{ fontSize: "var(--text-xs)" }}>Click "Add Stage" to get started</div>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "hsl(222 22% 3% / 0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmDelete(null)}>
          <div
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xl)", padding: "var(--space-8)",
              maxWidth: 400, width: "90%",
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 var(--space-3)", color: "var(--text-primary)", fontSize: "var(--text-base)", fontWeight: 700 }}>
              Confirm Delete
            </h3>
            <p style={{ margin: "0 0 var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              This will permanently remove this {confirmDelete.type}. Leads currently in use cannot have their {confirmDelete.type} deleted.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">Cancel</button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    if (confirmDelete.type === "stage") await deleteStage.mutateAsync(confirmDelete.id);
                    else await deleteStatus.mutateAsync(confirmDelete.id);
                    toast.success(`${confirmDelete.type === "stage" ? "Stage" : "Status"} deleted`);
                    setConfirmDelete(null);
                  } catch (err: any) {
                    toast.error(err.message || "Delete failed");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .btn-danger { background: var(--danger); color: white; border: none; padding: 0 20px; height: 38px; border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 700; cursor: pointer; font-family: var(--font-sans); }
        .btn-danger:hover { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}
