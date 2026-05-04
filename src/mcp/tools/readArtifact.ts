import { readFileSync } from "node:fs";
import path from "node:path";
import {
  asRecord,
  readJsonFile,
  resolveDeclaredPath,
  resolveInside,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const readArtifactTool: McpToolDefinition = {
  name: "archetype_read_artifact",
  description: "Read one known generated artifact by artifact ID from manifest.json.",
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
    return {
      status: "success",
      artifactId,
      path: artifactPath,
      type: artifact.type ?? "text",
      bytes: Buffer.byteLength(content, "utf8"),
      content
    };
  }
};
