import React from "react";
import { Check } from "lucide-react";
import { usePipelineStages, type PipelineStage } from "@/hooks/use-pipeline";
import { CustomSelect } from "./custom-select";

interface StageStatusSelectProps {
  stageId?: string | null;
  statusId?: string | null;
  onStageChange: (stageId: string) => void;
  onStatusChange: (statusId: string) => void;
  disabled?: boolean;
}

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
        <div style={{ height: 42, background: "var(--bg-subtle)", borderRadius: "var(--r-md)", animation: "pulse 2s ease infinite" }} />
        <div style={{ height: 42, background: "var(--bg-subtle)", borderRadius: "var(--r-md)", animation: "pulse 2s ease infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <CustomSelect
        value={stageId ?? null}
        placeholder="Select stage…"
        disabled={disabled}
        onChange={(v) => {
          onStageChange(v);
          onStatusChange("");
        }}
        options={stages.filter((s) => s.isActive).map((s) => ({
          value: s.id,
          label: s.displayName,
          color: s.color,
        }))}
      />
      <CustomSelect
        value={statusId ?? null}
        placeholder={!stageId ? "Pick stage first…" : "Select status…"}
        disabled={disabled || !stageId}
        onChange={onStatusChange}
        options={availableStatuses.map((s) => ({
          value: s.id,
          label: s.displayName,
          color: s.color,
        }))}
      />
    </div>
  );
}

/* ─── Pipeline Progress Bar — compact dot+connector design ─── */
interface PipelineProgressBarProps {
  stages: PipelineStage[];
  currentStageId?: string | null;
  currentStatusId?: string | null;
}

export function PipelineProgressBar({
  stages,
  currentStageId,
  currentStatusId,
}: PipelineProgressBarProps) {
  const activeStages = stages.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = activeStages.findIndex((s) => s.id === currentStageId);

  return (
    <div className="pipeline-bar" role="progressbar">
      {activeStages.map((stage, i) => {
        const isPast    = i < currentIndex;
        const isCurrent = stage.id === currentStageId;
        const isFuture  = i > currentIndex;
        const isLast    = i === activeStages.length - 1;
        const currentStatus = isCurrent
          ? stage.statuses.find((s) => s.id === currentStatusId)
          : null;

        return (
          <React.Fragment key={stage.id}>
            {/* ── Step block ── */}
            <div className={`pb-step ${isPast ? "past" : ""} ${isCurrent ? "current" : ""} ${isFuture ? "future" : ""}`}>
              <div
                className="pb-dot"
                style={isCurrent || isPast ? { background: stage.color, borderColor: stage.color } : {}}
              >
                {isPast && <Check size={9} strokeWidth={3} />}
              </div>
              <div className="pb-label">
                <span className="pb-stage-name">{stage.displayName}</span>
                {isCurrent && currentStatus && (
                  <span className="pb-status-name" style={{ color: stage.color }}>
                    {currentStatus.displayName}
                  </span>
                )}
              </div>
            </div>

            {/* ── Connector between steps ── */}
            {!isLast && (
              <div
                className={`pb-connector ${isPast ? "filled" : ""}`}
                style={isPast ? { background: stage.color } : {}}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
