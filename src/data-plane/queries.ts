import { DataPlaneError, isDataPlaneError } from "./errors";
import type { DataPlaneReader } from "./ports";
import { PROJECTION_NAMES } from "./state";
import type {
  AgentRun,
  ArtifactRecord,
  DataPlaneProjection,
  DataPlaneReplay,
  DataPlaneTimelineItem,
  JsonObject,
  ProjectionName
} from "./types";

export interface DataPlaneRunSummary {
  run_id: string;
  project_slug: string;
  package_id: string | null;
  source_hash: string | null;
  output_dir: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  event_count: number;
  artifact_count: number;
  projections: ProjectionName[];
  readiness: JsonObject | null;
}

export interface DataPlaneStatusResult {
  status: "success";
  outputDir: string;
  dataPlaneRoot: string;
  runCount: number;
  latestRunId: string | null;
  runs: DataPlaneRunSummary[];
}

export interface DataPlaneTimelineResult {
  status: "success";
  outputDir: string;
  runId: string;
  eventCount: number;
  timeline: DataPlaneTimelineItem[];
}

export interface DataPlaneArtifactsResult {
  status: "success";
  outputDir: string;
  runId: string;
  artifactCount: number;
  artifacts: ArtifactRecord[];
}

export interface DataPlaneArtifactResult {
  status: "success";
  outputDir: string;
  runId: string;
  artifact: ArtifactRecord;
}

export interface DataPlaneReplayResult {
  status: "success";
  outputDir: string;
  runId: string;
  replay: DataPlaneReplay;
}

function latestRunId(runs: AgentRun[]): string | null {
  return runs.at(-1)?.run_id ?? null;
}

function optionalProjection(dataPlane: DataPlaneReader, runId: string, projectionName: ProjectionName): DataPlaneProjection | null {
  try {
    return dataPlane.getProjection(runId, projectionName);
  } catch (error) {
    if (isDataPlaneError(error) && error.code === "PROJECTION_NOT_FOUND") return null;
    throw error;
  }
}

function runSummary(dataPlane: DataPlaneReader, run: AgentRun): DataPlaneRunSummary {
  const projections = PROJECTION_NAMES.filter((projectionName) => optionalProjection(dataPlane, run.run_id, projectionName) !== null);
  const readiness = optionalProjection(dataPlane, run.run_id, "readiness")?.data ?? null;
  return {
    run_id: run.run_id,
    project_slug: run.project_slug,
    package_id: run.package_id,
    source_hash: run.source_hash,
    output_dir: run.output_dir,
    status: run.status,
    created_at: run.created_at,
    updated_at: run.updated_at,
    event_count: dataPlane.listEvents(run.run_id).length,
    artifact_count: dataPlane.listArtifacts(run.run_id).length,
    projections,
    readiness
  };
}

function requireRunId(runId: string | undefined, operation: string): string {
  if (runId && runId.trim().length > 0) return runId.trim();
  throw new DataPlaneError("INVALID_DATA_PLANE_ARGUMENT", `${operation} requires --run <run-id>.`, { operation });
}

function requireArtifactId(artifactId: string | undefined): string {
  if (artifactId && artifactId.trim().length > 0) return artifactId.trim();
  throw new DataPlaneError("INVALID_DATA_PLANE_ARGUMENT", "read-artifact requires --artifact <artifact-id>.", { operation: "read-artifact" });
}

export function queryDataPlaneStatus(dataPlane: DataPlaneReader, outputDir: string, dataPlaneRoot: string): DataPlaneStatusResult {
  const runs = dataPlane.listRuns();
  return {
    status: "success",
    outputDir,
    dataPlaneRoot,
    runCount: runs.length,
    latestRunId: latestRunId(runs),
    runs: runs.map((run) => runSummary(dataPlane, run))
  };
}

export function queryDataPlaneTimeline(dataPlane: DataPlaneReader, outputDir: string, runId: string | undefined): DataPlaneTimelineResult {
  const resolvedRunId = requireRunId(runId, "timeline");
  const timeline = dataPlane.getTimeline(resolvedRunId);
  return {
    status: "success",
    outputDir,
    runId: resolvedRunId,
    eventCount: timeline.length,
    timeline
  };
}

export function queryDataPlaneArtifacts(dataPlane: DataPlaneReader, outputDir: string, runId: string | undefined): DataPlaneArtifactsResult {
  const resolvedRunId = requireRunId(runId, "artifacts");
  const artifacts = dataPlane.listArtifacts(resolvedRunId);
  return {
    status: "success",
    outputDir,
    runId: resolvedRunId,
    artifactCount: artifacts.length,
    artifacts
  };
}

export function queryDataPlaneArtifact(
  dataPlane: DataPlaneReader,
  outputDir: string,
  artifactId: string | undefined,
  runId?: string
): DataPlaneArtifactResult {
  const artifact = dataPlane.readArtifact(requireArtifactId(artifactId), runId?.trim() || undefined);
  return {
    status: "success",
    outputDir,
    runId: artifact.run_id,
    artifact
  };
}

export function queryDataPlaneReplay(dataPlane: DataPlaneReader, outputDir: string, runId: string | undefined): DataPlaneReplayResult {
  const resolvedRunId = requireRunId(runId, "replay");
  return {
    status: "success",
    outputDir,
    runId: resolvedRunId,
    replay: dataPlane.replayRun(resolvedRunId)
  };
}
