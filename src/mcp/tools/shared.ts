import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

export type ToolStatus = "success" | "warning" | "pass" | "fail" | "error";
export type JsonRecord = Record<string, unknown>;

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonRecord;
  run(args: unknown): Promise<JsonRecord> | JsonRecord;
}

export function asRecord(value: unknown): JsonRecord {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as JsonRecord;
  return {};
}

export function stringValue(record: JsonRecord, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : fallback;
}

export function booleanValue(record: JsonRecord, key: string, fallback: boolean): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
}

export function arrayValue(record: JsonRecord, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function statusFromReadiness(blockers: string[], warnings: string[]): "success" | "warning" {
  return blockers.length > 0 || warnings.length > 0 ? "warning" : "success";
}

export function resolveDeclaredPath(value: unknown, fallback: string, label: string): string {
  const raw = typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
  if (!raw) throw new Error(`${label} is required.`);
  if (raw.includes("\0")) throw new Error(`${label} contains an invalid null byte.`);
  const resolved = path.resolve(raw);
  if (resolved === path.parse(resolved).root) throw new Error(`${label} cannot resolve to a filesystem root.`);
  return resolved;
}

export function assertSafeOutputDirectory(outputDir: string, label: string): void {
  const resolved = path.resolve(outputDir);
  const forbiddenExact = [
    path.resolve(process.cwd()),
    process.env.HOME ? path.resolve(process.env.HOME) : "",
    path.parse(resolved).root
  ].filter(Boolean);
  if (forbiddenExact.includes(resolved)) {
    throw new Error(`${label} must be a dedicated output directory, not ${resolved}.`);
  }
  if (!existsSync(resolved)) return;
  if (!statSync(resolved).isDirectory()) throw new Error(`${label} exists but is not a directory: ${resolved}`);

  const projectMarkers = [".git", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "src", "node_modules", "tsconfig.json"];
  const presentMarkers = projectMarkers.filter((marker) => existsSync(path.join(resolved, marker)));
  if (presentMarkers.length > 0) {
    throw new Error(`${label} must not replace an existing project directory. Found: ${presentMarkers.join(", ")}.`);
  }
}

export function resolveInside(baseDir: string, relativePath: string, label: string): string {
  if (path.isAbsolute(relativePath)) throw new Error(`${label} must be a manifest-relative path.`);
  if (relativePath.includes("\0")) throw new Error(`${label} contains an invalid null byte.`);
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, relativePath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} resolves outside outputDir.`);
  }
  return resolvedTarget;
}

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function ensureExists(filePath: string, label: string): void {
  if (!existsSync(filePath)) throw new Error(`${label} does not exist: ${filePath}`);
}

export function artifactType(filePath: string): "json" | "markdown" | "text" {
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".md")) return "markdown";
  return "text";
}
