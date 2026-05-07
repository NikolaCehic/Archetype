import { stableId } from "../core/stable";
import { stableSha256, timelineSummary } from "./state";
import type {
  AgentRun,
  ArtifactRecord,
  DataPlaneEvent,
  DataPlaneProjection,
  DataPlaneReplay,
  DataPlaneTimelineItem,
  JsonObject,
  ProjectionName
} from "./types";

function projection(runId: string, projectionName: ProjectionName, events: DataPlaneEvent[], data: JsonObject): DataPlaneProjection {
  const updatedAt = events.at(-1)?.occurred_at ?? new Date(0).toISOString();
  return {
    projection_name: projectionName,
    run_id: runId,
    updated_at: updatedAt,
    event_count: events.length,
    checksum: stableSha256(data),
    data
  };
}

function mergePayload(previous: JsonObject, payload: JsonObject): JsonObject {
  return {
    ...previous,
    ...payload
  };
}

export function eventId(input: { runId: string; sequence: number; type: string; payload: JsonObject }): string {
  return stableId("event", input.runId, input.sequence, input.type, input.payload);
}

export function buildTimeline(events: DataPlaneEvent[]): DataPlaneTimelineItem[] {
  return events.map((event) => ({
    event_id: event.event_id,
    sequence: event.sequence,
    type: event.type,
    phase: event.phase,
    occurred_at: event.occurred_at,
    actor: event.actor,
    summary: timelineSummary(event.payload)
  }));
}

export function replayDataPlaneRun(run: AgentRun, events: DataPlaneEvent[], artifacts: ArtifactRecord[]): DataPlaneReplay {
  let lifecycle: JsonObject = {
    state: "unknown",
    readiness_tier: "unknown",
    implementation_authorized: false,
    ready_for_frontend_agent: false,
    blockers: [],
    warnings: []
  };
  let evidence: JsonObject = {
    evidence_events: 0,
    sources: [],
    records: []
  };
  let contracts: JsonObject = {
    draft: null,
    canonical: null,
    test_first: null,
    verification: null,
    artifact_refs: []
  };
  let verification: JsonObject = {
    status: "pending",
    evidence_grade: "none",
    repair_status: "pending",
    records: []
  };
  let readiness: JsonObject = {
    readiness_tier: "unknown",
    readiness_score: 0,
    ready_for_frontend_agent: false,
    implementation_authorized: false,
    blockers: [],
    warnings: []
  };

  for (const event of events) {
    if (event.type === "lifecycle.gate_evaluated") lifecycle = mergePayload(lifecycle, event.payload);
    if (event.type === "evidence.recorded") {
      evidence = {
        ...evidence,
        evidence_events: Number(evidence.evidence_events ?? 0) + 1,
        records: [...(Array.isArray(evidence.records) ? evidence.records : []), event.payload]
      };
    }
    if (event.type === "contract.draft_recorded") contracts = { ...contracts, draft: event.payload };
    if (event.type === "contract.canonical_recorded") contracts = { ...contracts, canonical: event.payload };
    if (event.type === "artifact.recorded") {
      contracts = {
        ...contracts,
        artifact_refs: [...(Array.isArray(contracts.artifact_refs) ? contracts.artifact_refs : []), event.payload]
      };
    }
    if (event.type === "verification.recorded") {
      verification = {
        ...verification,
        ...event.payload,
        records: [...(Array.isArray(verification.records) ? verification.records : []), event.payload]
      };
    }
    if (event.type === "repair.recorded") verification = { ...verification, repair_status: event.payload.status ?? "pending" };
    if (event.type === "readiness.evaluated") readiness = mergePayload(readiness, event.payload);
  }

  return {
    run,
    events,
    artifacts,
    projections: {
      lifecycle: projection(run.run_id, "lifecycle", events, lifecycle),
      evidence: projection(run.run_id, "evidence", events, evidence),
      contracts: projection(run.run_id, "contracts", events, contracts),
      verification: projection(run.run_id, "verification", events, verification),
      readiness: projection(run.run_id, "readiness", events, readiness)
    },
    timeline: buildTimeline(events)
  };
}
