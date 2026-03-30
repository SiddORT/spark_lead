import { usePipelineStages, type PipelineStage, type PipelineStatus } from "@/hooks/use-pipeline";

interface StageStatusSelectProps {
  stageId?: string | null;
  statusId?: string | null;
  onStageChange: (stageId: string) => void;
  onStatusChange: (statusId: string) => void;
  disabled?: boolean;
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 32px 0 10px",
  background: "var(--bg-subtle)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "var(--text-sm)",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
};

export function StageStatusSelect({
  stageId,
  statusId,
  onStageChange,
  onStatusChange,
  disabled,
}: StageStatusSelectProps) {
  const { data: stages = [], isLoading } = usePipelineStages();

  const selectedStage = stages.find((s) => s.id === stageId) || null;
  const availableStatuses = selectedStage?.statuses.filter((st) => st.isActive) ?? [];

  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ height: 40, background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", animation: "pulse 2s ease infinite" }} />
        <div style={{ height: 40, background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", animation: "pulse 2s ease infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {/* Stage selector */}
      <div>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Stage
        </div>
        <div style={{ position: "relative" }}>
          {selectedStage && (
            <span style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: selectedStage.color,
              flexShrink: 0,
              zIndex: 1,
            }} />
          )}
          <select
            value={stageId || ""}
            onChange={(e) => {
              onStageChange(e.target.value);
              onStatusChange("");
            }}
            disabled={disabled}
            style={{
              ...selectStyle,
              paddingLeft: selectedStage ? 26 : 10,
            }}
          >
            <option value="">Select stage…</option>
            {stages.filter((s) => s.isActive).map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status selector */}
      <div>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Status
        </div>
        <div style={{ position: "relative" }}>
          {statusId && (
            <span style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: availableStatuses.find((s) => s.id === statusId)?.color ?? "var(--border-default)",
              flexShrink: 0,
              zIndex: 1,
            }} />
          )}
          <select
            value={statusId || ""}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={disabled || !stageId}
            style={{
              ...selectStyle,
              paddingLeft: statusId ? 26 : 10,
              opacity: !stageId ? 0.5 : 1,
            }}
          >
            <option value="">{!stageId ? "Pick stage first…" : "Select status…"}</option>
            {availableStatuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* Pipeline progress bar for lead detail sheet */
interface PipelineProgressBarProps {
  stages: PipelineStage[];
  currentStageId?: string | null;
  currentStatusId?: string | null;
}

export function PipelineProgressBar({ stages, currentStageId, currentStatusId }: PipelineProgressBarProps) {
  const activeStages = stages.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentStageIdx = activeStages.findIndex((s) => s.id === currentStageId);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {activeStages.map((stage, idx) => {
        const isActive = stage.id === currentStageId;
        const isPast = idx < currentStageIdx;
        const isLast = idx === activeStages.length - 1;
        const currentStatus = isActive
          ? stage.statuses.find((s) => s.id === currentStatusId)
          : null;

        return (
          <div key={stage.id} style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Segment bar */}
            <div style={{
              height: 4,
              background: isPast
                ? stage.color
                : isActive
                  ? stage.color
                  : "var(--bg-muted)",
              borderRadius: idx === 0
                ? "var(--radius-full) 0 0 var(--radius-full)"
                : isLast
                  ? "0 var(--radius-full) var(--radius-full) 0"
                  : 0,
              opacity: isActive ? 1 : isPast ? 0.6 : 0.25,
              position: "relative",
              overflow: "hidden",
            }}>
              {isActive && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(90deg, ${stage.color} 60%, transparent)`,
                  animation: "shimmer 2s ease infinite",
                }} />
              )}
            </div>

            {/* Dot + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4 }}>
              <div style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                borderRadius: "50%",
                background: isPast || isActive ? stage.color : "var(--bg-muted)",
                boxShadow: isActive ? `0 0 8px ${stage.color}` : "none",
                border: `2px solid ${isPast || isActive ? stage.color : "var(--border-subtle)"}`,
                transition: "all 250ms ease",
              }} />
              <span style={{
                fontSize: 9,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? stage.color : isPast ? "var(--text-secondary)" : "var(--text-muted)",
                marginTop: 2,
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: 64,
              }}>
                {stage.displayName}
              </span>
              {isActive && currentStatus && (
                <span style={{
                  fontSize: 8,
                  color: currentStatus.color,
                  fontWeight: 600,
                  marginTop: 1,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}>
                  {currentStatus.displayName}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
