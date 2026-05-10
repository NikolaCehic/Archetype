import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  asRecord,
  booleanValue,
  readJsonFile,
  resolveDeclaredPath,
  resolveInside,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

const DEFAULT_MAX_BYTES = 6000;
const MAX_BYTES_CEILING = 60000;

interface ConsumerReadPlan {
  first_reads?: string[];
  current_phase_bundle?: string;
  allowed_full_artifacts_now?: string[];
  defer_until_needed?: string[];
}

interface ConsumerPlane {
  read_plan?: ConsumerReadPlan;
}

function numberValue(record: JsonRecord, key: string, fallback: number): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function boundedByteSlice(content: string, offset: number, maxBytes: number): { content: string; bytesRead: number; nextOffset: number | null; truncated: boolean } {
  const bytes = Buffer.from(content, "utf8");
  const safeOffset = Math.min(offset, bytes.length);
  const safeMaxBytes = Math.min(Math.max(maxBytes, 0), MAX_BYTES_CEILING);
  const end = Math.min(safeOffset + safeMaxBytes, bytes.length);
  const chunk = bytes.subarray(safeOffset, end).toString("utf8");
  return {
    content: chunk,
    bytesRead: Buffer.byteLength(chunk, "utf8"),
    nextOffset: end < bytes.length ? end : null,
    truncated: end < bytes.length
  };
}

function allowedReadPaths(outputDir: string): string[] | null {
  const consumerPlanePath = path.join(outputDir, "agent-context", "consumer-plane.json");
  if (!existsSync(consumerPlanePath)) return null;
  const consumerPlane = readJsonFile<ConsumerPlane>(consumerPlanePath);
  const readPlan = consumerPlane.read_plan;
  if (!readPlan) return null;
  return [
    ...(readPlan.first_reads ?? []),
    readPlan.current_phase_bundle ?? "",
    ...(readPlan.allowed_full_artifacts_now ?? [])
  ].filter((item) => item.trim().length > 0);
}

export const readArtifactTool: McpToolDefinition = {
  name: "archetype_read_artifact",
  description: "Read one known generated artifact by artifact ID from manifest.json with bounded content by default.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      artifactId: {
        type: "string",
        description: "Artifact ID from manifest.json, such as implementation-contract or route-map."
      },
      maxBytes: {
        type: "number",
        description: "Optional maximum UTF-8 bytes to return. Defaults to 6000 and is capped at 60000."
      },
      offset: {
        type: "number",
        description: "Optional UTF-8 byte offset for continuing a truncated read."
      },
      includeContent: {
        type: "boolean",
        description: "Set false to return metadata only."
      },
      allowDeferred: {
        type: "boolean",
        description: "Set true only when the current phase bundle explicitly justifies reading a deferred artifact."
      }
    },
    required: ["outputDir", "artifactId"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    const artifactId = stringValue(record, "artifactId");
    if (!artifactId) throw new Error("artifactId is required.");

    const manifest = readJsonFile<{
      artifacts?: Array<{ id?: string; path?: string; type?: string; required?: boolean }>;
    }>(path.join(outputDir, "manifest.json"));
    const artifacts = manifest.artifacts ?? [];
    const artifact = artifacts.find((item) => item.id === artifactId);
    if (!artifact?.path) {
      throw new Error(`Unknown artifactId "${artifactId}". Known IDs: ${artifacts.map((item) => item.id).filter(Boolean).join(", ")}`);
    }

    const artifactPath = resolveInside(outputDir, artifact.path, "artifact path");
    const content = readFileSync(artifactPath, "utf8");
    const includeContent = booleanValue(record, "includeContent", true);
    const allowDeferred = booleanValue(record, "allowDeferred", false);
    const allowedPaths = allowedReadPaths(outputDir);
    if (includeContent && !allowDeferred && allowedPaths && !allowedPaths.includes(artifact.path)) {
      throw new Error(`Artifact "${artifactId}" is deferred by the consumer-plane read plan for the current phase. Start at agent-context/consumer-plane.json and pass allowDeferred only with phase-bundle justification.`);
    }
    const maxBytes = numberValue(record, "maxBytes", DEFAULT_MAX_BYTES);
    const offset = numberValue(record, "offset", 0);
    const slice = includeContent ? boundedByteSlice(content, offset, maxBytes) : null;
    return {
      status: "success",
      artifactId,
      path: artifactPath,
      type: artifact.type ?? "text",
      bytes: Buffer.byteLength(content, "utf8"),
      bounded: true,
      readPlanEnforced: true,
      allowDeferred,
      includeContent,
      maxBytes: Math.min(maxBytes, MAX_BYTES_CEILING),
      offset,
      bytesRead: slice?.bytesRead ?? 0,
      truncated: slice?.truncated ?? false,
      nextOffset: slice?.nextOffset ?? null,
      content: slice?.content ?? "",
      nextRead: slice?.nextOffset !== null && slice?.nextOffset !== undefined
        ? {
          artifactId,
          offset: slice.nextOffset,
          maxBytes: Math.min(maxBytes, MAX_BYTES_CEILING)
        }
        : null
    };
  }
};
