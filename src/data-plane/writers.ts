import type { DataPlane } from "./ports";
import type { DataPlaneEvent, JsonObject } from "./types";

interface RecordSignalInput {
  runId: string;
  status: string;
  summary: string;
  artifactRefs?: string[];
  metadata?: JsonObject;
  occurredAt?: string;
  actor?: string;
  dedupe?: boolean;
}

function payload(input: RecordSignalInput, defaults: JsonObject = {}): JsonObject {
  return {
    ...defaults,
    summary: input.summary,
    status: input.status,
    artifact_refs: input.artifactRefs ?? [],
    metadata: input.metadata ?? {}
  };
}

function appendSignal(dataPlane: DataPlane, input: RecordSignalInput, event: Omit<Parameters<DataPlane["appendEvent"]>[0], "runId" | "payload" | "occurredAt" | "actor"> & { payload: JsonObject }): DataPlaneEvent {
  if (input.dedupe !== false) {
    const existing = dataPlane.listEvents(input.runId).find((candidate) =>
      candidate.type === event.type
      && candidate.phase === event.phase
      && candidate.payload.summary === event.payload.summary
    );
    if (existing) return existing;
  }
  return dataPlane.appendEvent({
    runId: input.runId,
    type: event.type,
    phase: event.phase,
    actor: input.actor ?? "archetype",
    occurredAt: input.occurredAt,
    payload: event.payload
  });
}

export function recordVerificationSignal(dataPlane: DataPlane, input: RecordSignalInput & { evidenceGrade?: string }): DataPlaneEvent {
  return appendSignal(dataPlane, input, {
    type: "verification.recorded",
    phase: "verification",
    payload: payload(input, {
      evidence_grade: input.evidenceGrade ?? "contract"
    })
  });
}

export function recordQaSignal(dataPlane: DataPlane, input: RecordSignalInput & { scenarioCount?: number }): DataPlaneEvent {
  return appendSignal(dataPlane, input, {
    type: "qa.recorded",
    phase: "qa",
    payload: payload(input, {
      scenario_count: input.scenarioCount ?? 0
    })
  });
}

export function recordRepairSignal(dataPlane: DataPlane, input: RecordSignalInput & { taskCount?: number }): DataPlaneEvent {
  return appendSignal(dataPlane, input, {
    type: "repair.recorded",
    phase: "repair",
    payload: payload(input, {
      task_count: input.taskCount ?? 0
    })
  });
}
