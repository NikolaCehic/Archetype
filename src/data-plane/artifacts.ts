import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stableId } from "../core/stable";
import type { DataPlaneArtifactType, DataPlanePhase } from "./types";

export function artifactIdForPath(relativePath: string, sha256: string | null = null): string {
  return stableId("artifact", relativePath, sha256 ?? "unhashed");
}

export function artifactTypeForPath(relativePath: string): DataPlaneArtifactType {
  if (relativePath.endsWith(".json")) return "json";
  if (relativePath.endsWith(".md")) return "markdown";
  if (relativePath.endsWith(".html")) return "html";
  if (relativePath.endsWith(".yaml") || relativePath.endsWith(".yml")) return "yaml";
  if (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx")) return "typescript";
  if (relativePath.endsWith(".txt")) return "text";
  return "other";
}

export function artifactPhaseForPath(relativePath: string): DataPlanePhase {
  if (relativePath.startsWith("lifecycle/")) return "clarification";
  if (relativePath.startsWith("01-evidence/")) return "evidence";
  if (relativePath.startsWith("draft/")) return "draft_contract";
  if (relativePath.startsWith("spec/")) return "canonical_spec";
  if (relativePath.startsWith("test-first/") || relativePath.startsWith("test-results/")) return "test_first";
  if (relativePath.startsWith("verification/")) return "verification";
  if (relativePath.startsWith("qa/")) return "qa";
  if (relativePath.startsWith("10-revision/")) return "repair";
  if (relativePath.startsWith("00-manifest/") || relativePath === "manifest.json" || relativePath === "readiness-report.md") return "readiness";
  return "unknown";
}

export function sha256File(filePath: string): string | null {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function byteSize(filePath: string): number {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return 0;
  return statSync(filePath).size;
}

export function assertRelativeArtifactPath(relativePath: string): void {
  if (path.isAbsolute(relativePath) || relativePath.includes("\0") || path.normalize(relativePath).startsWith("..")) {
    throw new Error(`Artifact path must be package-relative: ${relativePath}`);
  }
}
