import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ARCHETYPE_OUTPUT_MARKER = ".archetype-output-marker";
export const ARCHETYPE_TARGET_MARKER = ".archetype-target-marker";

export interface PrepareGeneratedDirectoryOptions {
  force?: boolean;
}

const PROJECT_MARKERS = [
  ".git",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "src",
  "node_modules",
  "tsconfig.json"
];

function nonEmptyDirectory(directory: string): boolean {
  return readdirSync(directory).some((entry) => entry !== ".DS_Store");
}

function homeDirectory(): string | null {
  return process.env.HOME ? path.resolve(process.env.HOME) : null;
}

function forbiddenExactPaths(resolved: string): string[] {
  const home = homeDirectory();
  return [
    path.parse(resolved).root,
    path.resolve(process.cwd()),
    home,
    home ? path.join(home, "Desktop") : null,
    home ? path.join(home, "Documents") : null
  ].filter((item): item is string => typeof item === "string" && item.length > 0);
}

function projectMarkersIn(directory: string): string[] {
  return PROJECT_MARKERS.filter((marker) => existsSync(path.join(directory, marker)));
}

function assertPathCanBePrepared(directory: string, label: string, markerFile: string, options: PrepareGeneratedDirectoryOptions): void {
  const resolved = path.resolve(directory);
  if (resolved.includes("\0")) throw new Error(`${label} contains an invalid null byte.`);
  if (forbiddenExactPaths(resolved).includes(resolved)) {
    throw new Error(`${label} must be a dedicated generated directory, not ${resolved}.`);
  }
  if (!existsSync(resolved)) return;
  if (!statSync(resolved).isDirectory()) throw new Error(`${label} exists but is not a directory: ${resolved}`);

  const markers = projectMarkersIn(resolved);
  const hasGeneratedMarker = existsSync(path.join(resolved, markerFile));
  if (markers.length > 0 && !hasGeneratedMarker) {
    throw new Error(`${label} must not replace an existing project directory. Found: ${markers.join(", ")}.`);
  }
  if (nonEmptyDirectory(resolved) && !hasGeneratedMarker) {
    throw new Error(`${label} already exists and is not marked as an Archetype-generated directory.`);
  }
  if (nonEmptyDirectory(resolved) && !options.force) {
    throw new Error(`${label} already exists and is not empty. Use --force to replace a marked generated directory.`);
  }
}

export function assertSafeGeneratedOutputDirectory(directory: string, options: PrepareGeneratedDirectoryOptions = {}): void {
  assertPathCanBePrepared(directory, "outputDir", ARCHETYPE_OUTPUT_MARKER, options);
}

export function prepareGeneratedOutputDirectory(directory: string, options: PrepareGeneratedDirectoryOptions = {}): void {
  const resolved = path.resolve(directory);
  assertSafeGeneratedOutputDirectory(resolved, options);
  rmSync(resolved, { recursive: true, force: true });
  mkdirSync(resolved, { recursive: true });
  writeFileSync(path.join(resolved, ARCHETYPE_OUTPUT_MARKER), "archetype-output\n");
}

export function prepareGeneratedTargetDirectory(directory: string, options: PrepareGeneratedDirectoryOptions = {}): void {
  const resolved = path.resolve(directory);
  assertPathCanBePrepared(resolved, "targetDir", ARCHETYPE_TARGET_MARKER, options);
  rmSync(resolved, { recursive: true, force: true });
  mkdirSync(resolved, { recursive: true });
  writeFileSync(path.join(resolved, ARCHETYPE_TARGET_MARKER), "archetype-target\n");
}
