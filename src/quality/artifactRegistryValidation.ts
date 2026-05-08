import { existsSync } from "node:fs";
import path from "node:path";

export function missingRequiredArtifacts(outputDir: string, requiredPaths: string[]): string[] {
  return requiredPaths.filter((relativePath) => !existsSync(path.join(outputDir, relativePath)));
}

export function presentForbiddenArtifacts(outputDir: string, forbiddenPaths: string[]): string[] {
  return forbiddenPaths.filter((relativePath) => existsSync(path.join(outputDir, relativePath)));
}

export function requiredManifestPaths(topManifest: { artifacts?: Array<{ path?: string; required?: boolean }> }): Set<string> {
  return new Set(
    (topManifest.artifacts ?? [])
      .filter((artifact): artifact is { path: string; required?: boolean } => artifact.required !== false && typeof artifact.path === "string")
      .map((artifact) => artifact.path)
  );
}

export function artifactIndexPaths(internalManifest: { artifact_index?: string[] }): Set<string> {
  return new Set(internalManifest.artifact_index ?? []);
}
