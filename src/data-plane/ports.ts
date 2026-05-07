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
} from "./types";

export interface RunStore {
  createRun(input: CreateRunInput): AgentRun;
  getRun(runId: string): AgentRun;
  listRuns(): AgentRun[];
}

export interface EventStore {
  appendEvent(input: AppendEventInput): DataPlaneEvent;
  listEvents(runId: string): DataPlaneEvent[];
}

export interface ArtifactStore {
  writeArtifact(input: WriteArtifactInput): ArtifactRecord;
  readArtifact(artifactId: string, runId?: string): ArtifactRecord;
  listArtifacts(runId: string): ArtifactRecord[];
}

export interface ProjectionStore {
  writeProjection(input: WriteProjectionInput): DataPlaneProjection;
  getProjection(runId: string, projectionName: ProjectionName): DataPlaneProjection;
}

export interface DataPlaneReader {
  getRun(runId: string): AgentRun;
  listRuns(): AgentRun[];
  listEvents(runId: string): DataPlaneEvent[];
  readArtifact(artifactId: string, runId?: string): ArtifactRecord;
  listArtifacts(runId: string): ArtifactRecord[];
  getTimeline(runId: string): DataPlaneTimelineItem[];
  getProjection(runId: string, projectionName: ProjectionName): DataPlaneProjection;
  replayRun(runId: string): DataPlaneReplay;
}

export interface DataPlaneWriter {
  createRun(input: CreateRunInput): AgentRun;
  appendEvent(input: AppendEventInput): DataPlaneEvent;
  writeArtifact(input: WriteArtifactInput): ArtifactRecord;
  writeProjection(input: WriteProjectionInput): DataPlaneProjection;
}

export interface DataPlane extends DataPlaneReader, DataPlaneWriter, RunStore, EventStore, ArtifactStore, ProjectionStore {}
