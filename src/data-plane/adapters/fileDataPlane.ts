import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stableId } from "../../core/stable";
import { artifactIdForPath } from "../artifacts";
import { DataPlaneError } from "../errors";
import { eventId, buildTimeline, replayDataPlaneRun } from "../events";
import type { DataPlane } from "../ports";
import {
  appendDeterministicJsonLine,
  assertAgentRun,
  assertArtifactRecord,
  assertDataPlaneEvent,
  assertProjection,
  ensureParentDir,
  readJsonLines,
  readJsonUnknown,
  stableSha256,
  writeDeterministicJson
} from "../state";
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

export interface FileDataPlaneOptions {
  rootDir: string;
}

export class FileDataPlane implements DataPlane {
  readonly rootDir: string;

  constructor(options: FileDataPlaneOptions) {
    this.rootDir = path.resolve(options.rootDir);
  }

  createRun(input: CreateRunInput): AgentRun {
    const now = input.createdAt ?? new Date().toISOString();
    const runId = input.runId ?? stableId("run", input.projectSlug, input.sourceHash ?? now);
    const directory = this.runDir(runId);
    if (existsSync(directory)) {
      throw new DataPlaneError("RUN_ALREADY_EXISTS", `Data-plane run already exists: ${runId}`, { runId });
    }
    mkdirSync(path.join(directory, "artifacts"), { recursive: true });
    mkdirSync(path.join(directory, "projections"), { recursive: true });
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
    this.writeRun(run);
    writeFileSync(this.eventsPath(runId), "");
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
    const filePath = this.runPath(runId);
    if (!existsSync(filePath)) throw new DataPlaneError("RUN_NOT_FOUND", `Data-plane run not found: ${runId}`, { runId });
    return assertAgentRun(readJsonUnknown(filePath), filePath);
  }

  listRuns(): AgentRun[] {
    const runsDir = path.join(this.rootDir, "runs");
    if (!existsSync(runsDir)) return [];
    return readdirSync(runsDir)
      .map((entry) => path.join(runsDir, entry, "run.json"))
      .filter((filePath) => existsSync(filePath) && statSync(filePath).isFile())
      .map((filePath) => assertAgentRun(readJsonUnknown(filePath), filePath))
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.run_id.localeCompare(b.run_id));
  }

  appendEvent(input: AppendEventInput): DataPlaneEvent {
    const run = this.getRun(input.runId);
    const sequence = this.listEvents(input.runId).length + 1;
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
    appendDeterministicJsonLine(this.eventsPath(input.runId), event);
    this.writeRun({
      ...run,
      updated_at: occurredAt,
      status: run.status === "created" ? "running" : run.status
    });
    return event;
  }

  listEvents(runId: string): DataPlaneEvent[] {
    this.getRun(runId);
    const filePath = this.eventsPath(runId);
    if (!existsSync(filePath)) return [];
    return readJsonLines(filePath)
      .map((value, index) => assertDataPlaneEvent(value, `${filePath}:${index + 1}`))
      .sort((a, b) => a.sequence - b.sequence);
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
    writeDeterministicJson(this.artifactPath(input.runId, artifactId), record);
    return record;
  }

  readArtifact(artifactId: string, runId?: string): ArtifactRecord {
    const runIds = runId ? [runId] : this.listRuns().map((run) => run.run_id);
    for (const candidateRunId of runIds) {
      const filePath = this.artifactPath(candidateRunId, artifactId);
      if (existsSync(filePath)) return assertArtifactRecord(readJsonUnknown(filePath), filePath);
    }
    throw new DataPlaneError("ARTIFACT_NOT_FOUND", `Data-plane artifact not found: ${artifactId}`, { artifactId, runId: runId ?? null });
  }

  listArtifacts(runId: string): ArtifactRecord[] {
    this.getRun(runId);
    const directory = path.join(this.runDir(runId), "artifacts");
    if (!existsSync(directory)) return [];
    return readdirSync(directory)
      .filter((entry) => entry.endsWith(".json"))
      .map((entry) => path.join(directory, entry))
      .map((filePath) => assertArtifactRecord(readJsonUnknown(filePath), filePath))
      .sort((a, b) => a.ref.path.localeCompare(b.ref.path));
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
    writeDeterministicJson(this.projectionPath(input.runId, input.projectionName), projection);
    return projection;
  }

  getProjection(runId: string, projectionName: ProjectionName): DataPlaneProjection {
    this.getRun(runId);
    const filePath = this.projectionPath(runId, projectionName);
    if (!existsSync(filePath)) {
      throw new DataPlaneError("PROJECTION_NOT_FOUND", `Data-plane projection not found: ${projectionName}`, { runId, projectionName });
    }
    return assertProjection(readJsonUnknown(filePath), filePath);
  }

  getTimeline(runId: string): DataPlaneTimelineItem[] {
    return buildTimeline(this.listEvents(runId));
  }

  replayRun(runId: string): DataPlaneReplay {
    return replayDataPlaneRun(this.getRun(runId), this.listEvents(runId), this.listArtifacts(runId));
  }

  private runDir(runId: string): string {
    return path.join(this.rootDir, "runs", runId);
  }

  private runPath(runId: string): string {
    return path.join(this.runDir(runId), "run.json");
  }

  private eventsPath(runId: string): string {
    return path.join(this.runDir(runId), "events.jsonl");
  }

  private artifactPath(runId: string, artifactId: string): string {
    return path.join(this.runDir(runId), "artifacts", `${encodeURIComponent(artifactId)}.json`);
  }

  private projectionPath(runId: string, projectionName: ProjectionName): string {
    return path.join(this.runDir(runId), "projections", `${projectionName}.json`);
  }

  private writeRun(run: AgentRun): void {
    const filePath = this.runPath(run.run_id);
    ensureParentDir(filePath);
    writeDeterministicJson(filePath, run);
  }
}
