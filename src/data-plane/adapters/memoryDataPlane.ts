import { stableId } from "../../core/stable";
import { artifactIdForPath } from "../artifacts";
import { DataPlaneError } from "../errors";
import { eventId, buildTimeline, replayDataPlaneRun } from "../events";
import { stableSha256 } from "../state";
import type { DataPlane } from "../ports";
import type {
  AgentRun,
  AppendEventInput,
  ArtifactRecord,
  CreateRunInput,
  DataPlaneEvent,
  DataPlaneProjection,
  DataPlaneReplay,
  DataPlaneTimelineItem,
  ProjectionName,
  WriteArtifactInput,
  WriteProjectionInput
} from "../types";

export class MemoryDataPlane implements DataPlane {
  private readonly runs = new Map<string, AgentRun>();
  private readonly events = new Map<string, DataPlaneEvent[]>();
  private readonly artifacts = new Map<string, Map<string, ArtifactRecord>>();
  private readonly projections = new Map<string, Map<ProjectionName, DataPlaneProjection>>();

  createRun(input: CreateRunInput): AgentRun {
    const now = input.createdAt ?? new Date().toISOString();
    const runId = input.runId ?? stableId("run", input.projectSlug, input.sourceHash ?? now);
    if (this.runs.has(runId)) {
      throw new DataPlaneError("RUN_ALREADY_EXISTS", `Data-plane run already exists: ${runId}`, { runId });
    }
    const run: AgentRun = {
      run_id: runId,
      schema_version: "1.0",
      project_slug: input.projectSlug,
      package_id: input.packageId ?? null,
      source_hash: input.sourceHash ?? null,
      output_dir: input.outputDir ?? null,
      status: input.status ?? "created",
      created_at: now,
      updated_at: now,
      sessions: input.session ? [input.session] : [],
      metadata: input.metadata ?? {}
    };
    this.runs.set(runId, run);
    this.events.set(runId, []);
    this.artifacts.set(runId, new Map());
    this.projections.set(runId, new Map());
    this.appendEvent({
      runId,
      type: "run.created",
      phase: "intake",
      actor: "archetype",
      occurredAt: now,
      payload: {
        summary: "Agent Data Plane run created.",
        project_slug: input.projectSlug
      }
    });
    return this.getRun(runId);
  }

  getRun(runId: string): AgentRun {
    const run = this.runs.get(runId);
    if (!run) throw new DataPlaneError("RUN_NOT_FOUND", `Data-plane run not found: ${runId}`, { runId });
    return run;
  }

  listRuns(): AgentRun[] {
    return [...this.runs.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.run_id.localeCompare(b.run_id));
  }

  appendEvent(input: AppendEventInput): DataPlaneEvent {
    const run = this.getRun(input.runId);
    const events = this.events.get(input.runId) ?? [];
    const sequence = events.length + 1;
    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const payload = input.payload ?? {};
    const event: DataPlaneEvent = {
      event_id: eventId({ runId: input.runId, sequence, type: input.type, payload }),
      run_id: input.runId,
      sequence,
      type: input.type,
      occurred_at: occurredAt,
      actor: input.actor ?? "archetype",
      phase: input.phase ?? "unknown",
      payload
    };
    events.push(event);
    this.events.set(input.runId, events);
    this.runs.set(input.runId, {
      ...run,
      updated_at: occurredAt,
      status: run.status === "created" ? "running" : run.status
    });
    return event;
  }

  listEvents(runId: string): DataPlaneEvent[] {
    this.getRun(runId);
    return [...(this.events.get(runId) ?? [])].sort((a, b) => a.sequence - b.sequence);
  }

  writeArtifact(input: WriteArtifactInput): ArtifactRecord {
    this.getRun(input.runId);
    const artifactId = input.artifactId ?? artifactIdForPath(input.path, input.sha256 ?? null);
    const event = this.appendEvent({
      runId: input.runId,
      type: "artifact.recorded",
      phase: input.sourcePhase,
      actor: input.producer,
      occurredAt: input.createdAt,
      payload: {
        summary: `Artifact recorded: ${input.path}`,
        artifact_id: artifactId,
        path: input.path,
        type: input.type
      }
    });
    const record: ArtifactRecord = {
      artifact_id: artifactId,
      run_id: input.runId,
      ref: {
        artifact_id: artifactId,
        path: input.path,
        sha256: input.sha256 ?? null
      },
      type: input.type,
      source_phase: input.sourcePhase,
      producer: input.producer,
      bytes: input.bytes ?? 0,
      lineage_event_ids: [...(input.lineageEventIds ?? []), event.event_id],
      created_at: input.createdAt ?? event.occurred_at,
      metadata: input.metadata ?? {}
    };
    const runArtifacts = this.artifacts.get(input.runId) ?? new Map<string, ArtifactRecord>();
    runArtifacts.set(artifactId, record);
    this.artifacts.set(input.runId, runArtifacts);
    return record;
  }

  readArtifact(artifactId: string, runId?: string): ArtifactRecord {
    const runs = runId ? [runId] : this.listRuns().map((run) => run.run_id);
    for (const candidateRunId of runs) {
      const record = this.artifacts.get(candidateRunId)?.get(artifactId);
      if (record) return record;
    }
    throw new DataPlaneError("ARTIFACT_NOT_FOUND", `Data-plane artifact not found: ${artifactId}`, { artifactId, runId: runId ?? null });
  }

  listArtifacts(runId: string): ArtifactRecord[] {
    this.getRun(runId);
    return [...(this.artifacts.get(runId)?.values() ?? [])].sort((a, b) => a.ref.path.localeCompare(b.ref.path));
  }

  writeProjection(input: WriteProjectionInput): DataPlaneProjection {
    this.getRun(input.runId);
    const updatedAt = input.updatedAt ?? new Date().toISOString();
    const checksum = stableSha256(input.data);
    this.appendEvent({
      runId: input.runId,
      type: "projection.updated",
      phase: input.projectionName === "readiness" ? "readiness" : "unknown",
      actor: "archetype",
      occurredAt: updatedAt,
      payload: {
        summary: `Projection updated: ${input.projectionName}`,
        projection_name: input.projectionName,
        checksum
      }
    });
    const eventCount = input.eventCount ?? this.listEvents(input.runId).length;
    const projection: DataPlaneProjection = {
      projection_name: input.projectionName,
      run_id: input.runId,
      updated_at: updatedAt,
      event_count: eventCount,
      checksum,
      data: input.data
    };
    const runProjections = this.projections.get(input.runId) ?? new Map<ProjectionName, DataPlaneProjection>();
    runProjections.set(input.projectionName, projection);
    this.projections.set(input.runId, runProjections);
    return projection;
  }

  getProjection(runId: string, projectionName: ProjectionName): DataPlaneProjection {
    this.getRun(runId);
    const projection = this.projections.get(runId)?.get(projectionName);
    if (!projection) {
      throw new DataPlaneError("PROJECTION_NOT_FOUND", `Data-plane projection not found: ${projectionName}`, { runId, projectionName });
    }
    return projection;
  }

  getTimeline(runId: string): DataPlaneTimelineItem[] {
    return buildTimeline(this.listEvents(runId));
  }

  replayRun(runId: string): DataPlaneReplay {
    return replayDataPlaneRun(this.getRun(runId), this.listEvents(runId), this.listArtifacts(runId));
  }
}
