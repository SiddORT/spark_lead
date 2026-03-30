import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PipelineStatus {
  id: string;
  stageId: string;
  name: string;
  displayName: string;
  description?: string | null;
  color: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
  isActive: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  sortOrder: number;
  isTerminal: boolean;
  isActive: boolean;
  statuses: PipelineStatus[];
}

function authHeaders() {
  const token = localStorage.getItem("slh_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function fetchStages(): Promise<PipelineStage[]> {
  const res = await fetch("/api/pipeline/stages", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load pipeline stages");
  return res.json();
}

async function createStage(data: any): Promise<PipelineStage> {
  const res = await fetch("/api/pipeline/stages", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create stage");
  return res.json();
}

async function updateStage(id: string, data: any): Promise<PipelineStage> {
  const res = await fetch(`/api/pipeline/stages/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update stage");
  return res.json();
}

async function deleteStage(id: string): Promise<void> {
  const res = await fetch(`/api/pipeline/stages/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete stage");
  }
}

async function createStatus(data: any): Promise<PipelineStatus> {
  const res = await fetch("/api/pipeline/statuses", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create status");
  return res.json();
}

async function updateStatus(id: string, data: any): Promise<PipelineStatus> {
  const res = await fetch(`/api/pipeline/statuses/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

async function deleteStatus(id: string): Promise<void> {
  const res = await fetch(`/api/pipeline/statuses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete status");
  }
}

export const PIPELINE_STAGES_KEY = ["pipeline", "stages"];

export function usePipelineStages() {
  return useQuery({ queryKey: PIPELINE_STAGES_KEY, queryFn: fetchStages, staleTime: 60_000 });
}

export function useCreateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStage,
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINE_STAGES_KEY }),
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateStage(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINE_STAGES_KEY }),
  });
}

export function useDeleteStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINE_STAGES_KEY }),
  });
}

export function useCreateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINE_STAGES_KEY }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINE_STAGES_KEY }),
  });
}

export function useDeleteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINE_STAGES_KEY }),
  });
}
