import { readFileSync } from "node:fs";
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

const DEFAULT_MAX_BYTES = 12000;
const MAX_BYTES_CEILING = 60000;

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
        description: "Optional maximum UTF-8 bytes to return. Defaults to 12000 and is capped at 60000."
      },
      offset: {
        type: "number",
        description: "Optional UTF-8 byte offset for continuing a truncated read."
      },
      includeContent: {
        type: "boolean",
        description: "Set false to return metadata only."
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
