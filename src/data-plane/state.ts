import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stableId } from "../core/stable";
import { DataPlaneError } from "./errors";
import type {
  AgentRun,
  ArtifactRecord,
  DataPlaneEvent,
  DataPlaneProjection,
  JsonObject,
  ProjectionName
} from "./types";

export const PROJECTION_NAMES: ProjectionName[] = ["lifecycle", "evidence", "contracts", "verification", "readiness"];

export function dataPlaneRunId(projectSlug: string, sourceHash: string | null): string {
  return stableId("run", projectSlug, sourceHash ?? "no-source-hash");
}

export function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .filter((key) => record[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`)
      .join(",")}}`;
  }
  return "null";
}

export function stableSha256(value: unknown): string {
  return createHash("sha256").update(stableJsonStringify(value)).digest("hex");
}

export function ensureParentDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeDeterministicJson(filePath: string, value: unknown): void {
  ensureParentDir(filePath);
  writeFileSync(filePath, `${stableJsonStringify(value)}\n`);
}

export function appendDeterministicJsonLine(filePath: string, value: unknown): void {
  ensureParentDir(filePath);
  writeFileSync(filePath, `${stableJsonStringify(value)}\n`, { flag: "a" });
}

export function readJsonUnknown(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    throw new DataPlaneError("CORRUPT_DATA_PLANE_RECORD", `${filePath} is not parseable JSON.`, {
      filePath,
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

export function readJsonLines(filePath: string): unknown[] {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line) as unknown;
      } catch (error) {
        throw new DataPlaneError("CORRUPT_DATA_PLANE_RECORD", `${filePath}:${index + 1} is not parseable JSON.`, {
          filePath,
          line: index + 1,
          detail: error instanceof Error ? error.message : String(error)
        });
      }
    });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertAgentRun(value: unknown, label: string): AgentRun {
  if (!isJsonObject(value)
    || typeof value.run_id !== "string"
    || value.schema_version !== "1.0"
    || typeof value.project_slug !== "string"
    || typeof value.status !== "string"
    || typeof value.created_at !== "string"
    || typeof value.updated_at !== "string"
    || !Array.isArray(value.sessions)
    || !isJsonObject(value.metadata)) {
    throw new DataPlaneError("INVALID_DATA_PLANE_RECORD", `${label} is not a valid AgentRun.`);
  }
  return value as unknown as AgentRun;
}

export function assertDataPlaneEvent(value: unknown, label: string): DataPlaneEvent {
  if (!isJsonObject(value)
    || typeof value.event_id !== "string"
    || typeof value.run_id !== "string"
    || typeof value.sequence !== "number"
    || typeof value.type !== "string"
    || typeof value.occurred_at !== "string"
    || typeof value.actor !== "string"
    || typeof value.phase !== "string"
    || !isJsonObject(value.payload)) {
    throw new DataPlaneError("INVALID_DATA_PLANE_RECORD", `${label} is not a valid DataPlaneEvent.`);
  }
  return value as unknown as DataPlaneEvent;
}

export function assertArtifactRecord(value: unknown, label: string): ArtifactRecord {
  if (!isJsonObject(value)
    || typeof value.artifact_id !== "string"
    || typeof value.run_id !== "string"
    || !isJsonObject(value.ref)
    || typeof value.ref.artifact_id !== "string"
    || typeof value.ref.path !== "string"
    || typeof value.type !== "string"
    || typeof value.source_phase !== "string"
    || typeof value.producer !== "string"
    || typeof value.bytes !== "number"
    || !isStringArray(value.lineage_event_ids)
    || typeof value.created_at !== "string"
    || !isJsonObject(value.metadata)) {
    throw new DataPlaneError("INVALID_DATA_PLANE_RECORD", `${label} is not a valid ArtifactRecord.`);
  }
  return value as unknown as ArtifactRecord;
}

export function assertProjection(value: unknown, label: string): DataPlaneProjection {
  if (!isJsonObject(value)
    || typeof value.projection_name !== "string"
    || typeof value.run_id !== "string"
    || typeof value.updated_at !== "string"
    || typeof value.event_count !== "number"
    || typeof value.checksum !== "string"
    || !isJsonObject(value.data)) {
    throw new DataPlaneError("INVALID_DATA_PLANE_RECORD", `${label} is not a valid DataPlaneProjection.`);
  }
  return value as unknown as DataPlaneProjection;
}

export function assertEventContinuity(events: DataPlaneEvent[], runId: string, label: string): DataPlaneEvent[] {
  for (const [index, event] of events.entries()) {
    const expectedSequence = index + 1;
    if (event.run_id !== runId) {
      throw new DataPlaneError("EVENT_SEQUENCE_CORRUPT", `${label} contains an event for another run.`, {
        runId,
        eventRunId: event.run_id,
        sequence: event.sequence
      });
    }
    if (event.sequence !== expectedSequence) {
      throw new DataPlaneError("EVENT_SEQUENCE_CORRUPT", `${label} has non-contiguous event sequence.`, {
        runId,
        expectedSequence,
        actualSequence: event.sequence
      });
    }
  }
  return events;
}

export function timelineSummary(payload: JsonObject): string {
  const summary = payload.summary;
  if (typeof summary === "string" && summary.trim().length > 0) return summary;
  const artifactPath = payload.path;
  if (typeof artifactPath === "string" && artifactPath.trim().length > 0) return artifactPath;
  const state = payload.state;
  if (typeof state === "string" && state.trim().length > 0) return state;
  return "No summary provided.";
}
