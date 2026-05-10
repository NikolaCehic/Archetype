import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, readSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDraftApproval } from "../approval/draftApproval";
import { readConsumerPlane, type ConsumerPlaneReport } from "../consumer-plane";
import { hashContent, slugify, stableId } from "../core/stable";
import type { ArchetypeInput, SourceMaterialInput, SourceMaterialType } from "../core/types";
import {
  FileDataPlane,
  byteSize,
  mergeManifestArtifacts,
  recordClarificationPackage,
  recordCompiledPackage,
  recordExportedArtifacts,
  sha256File,
  writeReplayConsistentProjections
} from "../data-plane";
import type { DataPlanePhase } from "../data-plane";
import { runArchetypeCompiler } from "../core/pipeline";
import { applyClarificationAnswer } from "../modules/clarificationUx";
import { assessContextGate } from "../modules/contextGate";
import { exportClarificationPackage } from "../output/exportClarificationPackage";
import { exportDraftPackage } from "../output/exportDraftPackage";
import { exportPackage } from "../output/exportPackage";
import { createPhasePackage } from "../progressive";
import { assertSafeGeneratedOutputDirectory } from "../safety/pathSafety";

const MAX_TEXT_MATERIAL_BYTES = 64 * 1024;
const MAX_MATERIAL_BYTES = 20 * 1024 * 1024;
const MAX_DIRECTORY_ENTRIES = 80;

export interface RunLifecycleMaterialInput {
  path?: string;
  label?: string;
  type?: SourceMaterialType;
  content?: string;
  notes?: string;
}

export interface RunLifecycleOptions {
  brief?: string;
  inputPath?: string;
  outputDir?: string;
  materialPaths?: string[];
  materials?: RunLifecycleMaterialInput[];
  questionId?: string;
  answer?: string;
  approve?: boolean;
  approvedBy?: string;
  approvedInputPath?: string;
  approvedAssumptionIds?: string[];
  projectName?: string;
  overwrite?: boolean;
  host?: "cli" | "mcp";
}

export type LifecyclePackageType = "clarification" | "draft_contract" | "canonical_contract";
export type LifecycleNextActionType =
  | "ask_clarification"
  | "review_draft"
  | "implement_tests_first"
  | "blocked";

export interface MaterialGraphNode {
  material_id: string;
  label: string;
  source_type: SourceMaterialType;
  declared_path: string | null;
  resolved_path: string | null;
  kind: "file" | "directory" | "inline";
  sha256: string;
  bytes: number;
  content_bytes: number;
  truncated: boolean;
  status: "ingested" | "summarized";
  notes: string[];
}

export interface SourceGraphArtifact {
  artifact_version: "1.0";
  source_scope: "phase-08-natural-language-lifecycle";
  created_at: string;
  brief_sha256: string;
  material_count: number;
  materials: MaterialGraphNode[];
  warnings: string[];
  blockers: string[];
}

export interface LifecycleRunStateArtifact {
  artifact_version: "1.0";
  source_scope: "phase-08-natural-language-lifecycle";
  command: "archetype run";
  host: "cli" | "mcp";
  package_type: LifecyclePackageType;
  readiness_tier: string;
  ready_for_frontend_agent: boolean;
  data_plane_run_id: string;
  input_path: string;
  approved_input_path: string | null;
  output_dir: string;
  source_graph_path: "lifecycle/source-graph.json";
  next_action: LifecycleNextAction;
}

export interface LifecycleNextAction {
  type: LifecycleNextActionType;
  summary: string;
  question_id?: string | null;
  question?: string | null;
  design_system_preview?: string | null;
  approval_request?: string | null;
  phase_bundle?: string | null;
  command?: string | null;
}

export interface RunLifecycleResult {
  status: "success" | "warning";
  outputDir: string;
  inputPath: string;
  approvedInputPath: string | null;
  packageType: LifecyclePackageType;
  readinessScore: number;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  blockers: string[];
  warnings: string[];
  dataPlaneRunId: string;
  sourceGraphPath: string;
  runStatePath: string;
  consumerPlanePath: string;
  consumerPlane: ConsumerPlaneReport;
  materialCount: number;
  nextQuestion: string | null;
  nextQuestionId: string | null;
  designSystemPreviewPath: string | null;
  approvalRequestPath: string | null;
  nextAction: LifecycleNextAction;
  artifacts: Array<{
    id?: string;
    path: string;
    type?: string;
    required?: boolean;
  }>;
}

interface GenerationResult {
  packageType: LifecyclePackageType;
  readinessScore: number;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  blockers: string[];
  warnings: string[];
  dataPlaneRunId: string;
  artifacts: Array<{
    id?: string;
    path: string;
    type?: string;
    required?: boolean;
  }>;
  nextQuestion: string | null;
  nextQuestionId: string | null;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function dataPlaneForOutput(outputDir: string): FileDataPlane {
  return new FileDataPlane({ rootDir: path.join(outputDir, "data-plane") });
}

function outputDir(options: RunLifecycleOptions): string {
  return path.resolve(options.outputDir ?? "archetype-output");
}

function intakePath(options: RunLifecycleOptions): string {
  return path.resolve(options.inputPath ?? "archetype.intake.json");
}

function approvedInputPath(options: RunLifecycleOptions, sourceInputPath: string): string {
  if (options.approvedInputPath) return path.resolve(options.approvedInputPath);
  const parsed = path.parse(sourceInputPath);
  return path.join(parsed.dir, `${parsed.name}.approved${parsed.ext || ".json"}`);
}

function firstSentence(value: string): string {
  const trimmed = value.trim();
  const sentence = trimmed.split(/[.!?]\s/u)[0]?.trim();
  return sentence || trimmed || "Archetype Project";
}

function mentionsAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function inferUsersFromBrief(brief: string): string[] {
  const users: string[] = [];
  const normalized = brief.toLowerCase();
  const forMatch = normalized.match(/\bfor ([^.]+?)(?:\.| with | using | use | must | that |$)/u);
  const userPhrase = forMatch?.[1] ?? "";
  if (userPhrase.includes("marketing manager") || userPhrase.includes("marketing managers")) users.push("Marketing manager");
  if (userPhrase.includes("growth analyst") || userPhrase.includes("growth analysts")) users.push("Growth analyst");
  if (userPhrase.includes("workspace admin") || userPhrase.includes("workspace admins")) users.push("Workspace admin");
  if (userPhrase.includes("patient")) users.push("Patient");
  if (userPhrase.includes("clinician") || userPhrase.includes("doctor")) users.push("Clinician");
  if (userPhrase.includes("customer")) users.push("Customer");
  return [...new Set(users)];
}

function inferStackFromBrief(brief: string): ArchetypeInput["stack"] | undefined {
  const normalized = brief.toLowerCase();
  const stack: NonNullable<ArchetypeInput["stack"]> = {};
  if (normalized.includes("next")) {
    stack.framework = "React";
    stack.routing = "Next.js App Router";
  } else if (normalized.includes("react")) {
    stack.framework = "React";
    stack.routing = normalized.includes("router") ? "React Router or target router" : "App router chosen by target project";
  } else if (normalized.includes("vue")) {
    stack.framework = "Vue";
  } else if (normalized.includes("svelte")) {
    stack.framework = "Svelte";
  }
  if (normalized.includes("typescript") || /\bts\b/u.test(normalized)) stack.language = "TypeScript";
  if (normalized.includes("tailwind")) stack.styling = "Tailwind CSS";
  if (normalized.includes("css") && !stack.styling) stack.styling = "CSS variables";
  return Object.keys(stack).length > 0 ? stack : undefined;
}

function inferBrandFromBrief(brief: string): ArchetypeInput["brand"] | undefined {
  const attributes = [
    mentionsAny(brief, ["premium"]) ? "premium" : "",
    mentionsAny(brief, ["dense", "compact"]) ? "dense" : "",
    mentionsAny(brief, ["dark"]) ? "dark" : "",
    mentionsAny(brief, ["monochrome", "monochromatic"]) ? "monochromatic" : "",
    mentionsAny(brief, ["enterprise", "b2b"]) ? "enterprise" : "",
    mentionsAny(brief, ["polished"]) ? "polished" : ""
  ].filter(Boolean);
  if (attributes.length === 0) return undefined;
  return {
    attributes,
    tone: attributes.join(", ")
  };
}

function inferDataBoundaryFromBrief(brief: string): ArchetypeInput["dataBoundary"] | undefined {
  const normalized = brief.toLowerCase();
  const hasBoundary = mentionsAny(normalized, [
    "mock data",
    "mocked data",
    "mock fixtures",
    "fixture data",
    "deterministic fixtures",
    "deterministic data",
    "use mock",
    "local mock",
    "no backend",
    "no production backend",
    "existing api",
    "backend api",
    "api integration",
    "use api",
    "real api",
    "target repo",
    "existing repo",
    "repository data",
    "database-backed",
    "connect to database",
    "mock auth",
    "mock authenticated",
    "auth boundary",
    "role-based access",
    "rbac",
    "permissions represented",
    "permission model"
  ]);
  if (!hasBoundary) return undefined;
  const apiMode = mentionsAny(normalized, ["existing api", "backend api", "api integration", "use api", "real api", "database-backed", "connect to database"]);
  const boundary: NonNullable<ArchetypeInput["dataBoundary"]> = {
    mode: normalized.includes("hybrid") ? "hybrid" : apiMode && !normalized.includes("mock") ? "api" : "mock",
    notes: "Inferred from natural-language lifecycle brief; remains evidence-backed and reviewable."
  };
  if (mentionsAny(normalized, ["mock", "fixture", "deterministic data"])) {
    boundary.dataSource = "Deterministic mock fixtures from the brief.";
  }
  if (mentionsAny(normalized, ["mock auth", "mock authenticated", "auth boundary"])) {
    boundary.auth = "Authentication behavior described in the brief.";
  }
  if (mentionsAny(normalized, ["permission model", "permissions represented", "role-based access", "rbac"])) {
    boundary.permissions = "Role and permission behavior described in the brief.";
  }
  return boundary;
}

function inferTestExecutionFromBrief(brief: string): ArchetypeInput["testExecution"] | undefined {
  const normalized = brief.toLowerCase();
  if (!mentionsAny(normalized, [
    "allow playwright",
    "use playwright",
    "run playwright",
    "playwright-backed",
    "verify with playwright",
    "run tests",
    "run the tests",
    "write tests",
    "generate tests",
    "require tests",
    "test-first",
    "tests first",
    "smoke test",
    "e2e test",
    "end-to-end test",
    "unit test",
    "integration test",
    "ui test",
    "accessibility test"
  ])) return undefined;
  const testTypes = [
    mentionsAny(normalized, ["smoke"]) ? "smoke" : "",
    mentionsAny(normalized, ["e2e", "end-to-end"]) ? "e2e" : "",
    mentionsAny(normalized, ["ui"]) ? "ui" : "",
    mentionsAny(normalized, ["integration"]) ? "integration" : "",
    mentionsAny(normalized, ["unit"]) ? "unit" : "",
    mentionsAny(normalized, ["accessibility", "a11y"]) ? "accessibility" : ""
  ].filter(Boolean);
  return {
    playwrightAllowed: mentionsAny(normalized, ["playwright", "e2e", "browser"]),
    commandsAllowed: mentionsAny(normalized, ["run", "write tests", "generate tests", "require tests", "test-first", "tests first", "allow"]),
    testTypes: testTypes.length > 0 ? testTypes : ["smoke", "e2e", "ui", "integration", "unit", "accessibility"],
    notes: "Inferred from natural-language lifecycle brief."
  };
}

function inferAssumptionApprovalFromBrief(brief: string): ArchetypeInput["assumptionApproval"] | undefined {
  if (!mentionsAny(brief, ["you may propose", "may propose", "approve assumptions", "candidate assumptions", "assumptions for draft"])) return undefined;
  return {
    approvedForDraft: true,
    approvedBy: "natural-language lifecycle brief",
    notes: "The user explicitly allowed candidate assumptions for draft review."
  };
}

function inferMaterialIntakeFromBrief(brief: string, materials: SourceMaterialInput[]): ArchetypeInput["materialIntake"] | undefined {
  if (materials.length > 0) {
    return {
      status: "provided",
      requestedTypes: ["SPEC", "SOP", "PRD", "screenshots", "wireframes", "design_docs", "api_docs", "route_maps", "repo_files"],
      notes: "Source materials were supplied during lifecycle intake."
    };
  }
  const normalized = brief.toLowerCase();
  if (mentionsAny(normalized, ["no spec", "no sop", "no prd", "no screenshots", "no wireframes", "no design docs", "no api docs", "no route map", "no materials"])) {
    return {
      status: "none",
      requestedTypes: ["SPEC", "SOP", "PRD", "screenshots", "wireframes", "design_docs", "api_docs", "route_maps", "repo_files"],
      notes: "The brief explicitly says there are no source materials to attach."
    };
  }
  return undefined;
}

function inferSafetyConstraintsFromBrief(brief: string): string[] {
  const constraints: string[] = [];
  if (mentionsAny(brief, ["no financial", "no compliance", "no production", "mock data only", "no claims"])) {
    constraints.push("Do not make financial, compliance, or production integration claims.");
  }
  if (mentionsAny(brief, ["privacy", "pii", "patient", "healthcare", "financial", "billing"])) {
    constraints.push("Require human review for sensitive or regulated-domain claims.");
  }
  return [...new Set(constraints)];
}

function initialInput(options: RunLifecycleOptions, materials: SourceMaterialInput[]): ArchetypeInput {
  const brief = options.brief?.trim();
  if (!brief) throw new Error('archetype run requires a brief or --intake <intake.json>.');
  return {
    projectName: options.projectName?.trim() || firstSentence(brief).slice(0, 80),
    context: brief,
    goals: ["Generate a deterministic frontend implementation contract for AI coding agents."],
    users: inferUsersFromBrief(brief),
    brand: inferBrandFromBrief(brief),
    stack: inferStackFromBrief(brief),
    dataBoundary: inferDataBoundaryFromBrief(brief),
    testExecution: inferTestExecutionFromBrief(brief),
    assumptionApproval: inferAssumptionApprovalFromBrief(brief),
    materialIntake: inferMaterialIntakeFromBrief(brief, materials),
    safetyConstraints: inferSafetyConstraintsFromBrief(brief),
    operatingMode: "full_architecture",
    materials
  };
}

function mergeMaterials(existing: SourceMaterialInput[] | undefined, incoming: SourceMaterialInput[]): SourceMaterialInput[] {
  const merged = new Map<string, SourceMaterialInput>();
  for (const material of [...(existing ?? []), ...incoming]) {
    const key = `${material.path ?? ""}|${material.label}|${material.type}`;
    merged.set(key, material);
  }
  return [...merged.values()];
}

function safeResolveMaterialPath(value: string): string {
  if (value.includes("\0")) throw new Error("material path contains an invalid null byte.");
  const resolved = path.resolve(value);
  if (resolved === path.parse(resolved).root) throw new Error("material path cannot be a filesystem root.");
  if (!existsSync(resolved)) throw new Error(`material path does not exist: ${resolved}`);
  return resolved;
}

function materialTypeForPath(filePath: string, isDirectory: boolean): SourceMaterialType {
  if (isDirectory) return "code";
  const ext = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"].includes(ext)) return "screenshot";
  if ([".fig", ".sketch", ".design"].includes(ext)) return "design_file";
  if ([".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".html", ".vue", ".svelte", ".json"].includes(ext)) return "code";
  if ([".md", ".mdx", ".txt", ".pdf", ".docx", ".csv", ".yaml", ".yml"].includes(ext)) return "document";
  return "other";
}

function isTextLike(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".md", ".mdx", ".txt", ".json", ".yaml", ".yml", ".csv", ".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".html", ".xml"].includes(ext);
}

function readPrefix(filePath: string, size: number): string {
  const bytesToRead = Math.min(size, MAX_TEXT_MATERIAL_BYTES);
  const buffer = Buffer.alloc(bytesToRead);
  const fd = openSync(filePath, "r");
  try {
    const bytesRead = readSync(fd, buffer, 0, bytesToRead, 0);
    return buffer.subarray(0, bytesRead).toString("utf8");
  } finally {
    closeSync(fd);
  }
}

function materialId(label: string, sha256: string): string {
  return stableId("material", slugify(label, "material"), sha256.slice(0, 12));
}

function sha256Buffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function ingestFileMaterial(filePath: string, declaredPath: string, input: RunLifecycleMaterialInput | undefined): {
  material: SourceMaterialInput;
  node: MaterialGraphNode;
} {
  const stats = statSync(filePath);
  if (stats.size > MAX_MATERIAL_BYTES) {
    throw new Error(`material file is too large for safe ingestion (${stats.size} bytes): ${filePath}`);
  }
  const contentBuffer = readFileSync(filePath);
  const sha256 = sha256Buffer(contentBuffer);
  const textLike = isTextLike(filePath);
  const content = textLike ? readPrefix(filePath, stats.size) : undefined;
  const truncated = textLike && stats.size > MAX_TEXT_MATERIAL_BYTES;
  const label = input?.label?.trim() || `@${declaredPath}`;
  const type = input?.type ?? materialTypeForPath(filePath, false);
  const notes = [
    input?.notes?.trim() ?? "",
    `Safe material ingestion: file hash ${sha256}.`,
    truncated ? `Content excerpt truncated to ${MAX_TEXT_MATERIAL_BYTES} bytes.` : ""
  ].filter(Boolean);
  const node: MaterialGraphNode = {
    material_id: materialId(label, sha256),
    label,
    source_type: type,
    declared_path: declaredPath,
    resolved_path: filePath,
    kind: "file",
    sha256,
    bytes: stats.size,
    content_bytes: content ? Buffer.byteLength(content) : 0,
    truncated,
    status: content ? "ingested" : "summarized",
    notes
  };
  return {
    material: {
      id: node.material_id,
      label,
      type,
      content,
      notes: notes.join(" "),
      path: filePath
    },
    node
  };
}

function ingestDirectoryMaterial(directoryPath: string, declaredPath: string, input: RunLifecycleMaterialInput | undefined): {
  material: SourceMaterialInput;
  node: MaterialGraphNode;
} {
  const entries = readdirSync(directoryPath)
    .filter((entry) => entry !== "node_modules" && entry !== ".git")
    .sort()
    .slice(0, MAX_DIRECTORY_ENTRIES);
  const summary = entries.join("\n");
  const sha256 = hashContent({ directoryPath, entries });
  const label = input?.label?.trim() || `@${declaredPath}`;
  const type = input?.type ?? "code";
  const truncated = readdirSync(directoryPath).length > entries.length;
  const notes = [
    input?.notes?.trim() ?? "",
    `Safe material ingestion: directory listing hash ${sha256}.`,
    truncated ? `Directory listing limited to ${MAX_DIRECTORY_ENTRIES} entries.` : ""
  ].filter(Boolean);
  const node: MaterialGraphNode = {
    material_id: materialId(label, sha256),
    label,
    source_type: type,
    declared_path: declaredPath,
    resolved_path: directoryPath,
    kind: "directory",
    sha256,
    bytes: Buffer.byteLength(summary),
    content_bytes: Buffer.byteLength(summary),
    truncated,
    status: "summarized",
    notes
  };
  return {
    material: {
      id: node.material_id,
      label,
      type,
      content: `Directory listing:\n${summary}`,
      notes: notes.join(" "),
      path: directoryPath
    },
    node
  };
}

function ingestInlineMaterial(input: RunLifecycleMaterialInput, index: number): {
  material: SourceMaterialInput;
  node: MaterialGraphNode;
} {
  const content = input.content?.trim() ?? input.notes?.trim() ?? "";
  if (!content) throw new Error("inline material requires content or notes.");
  const clipped = content.length > MAX_TEXT_MATERIAL_BYTES ? content.slice(0, MAX_TEXT_MATERIAL_BYTES) : content;
  const sha256 = hashContent(content);
  const label = input.label?.trim() || `Inline material ${index + 1}`;
  const type = input.type ?? "other";
  const truncated = clipped.length < content.length;
  const notes = [
    input.notes?.trim() ?? "",
    `Safe material ingestion: inline content hash ${sha256}.`,
    truncated ? `Inline content truncated to ${MAX_TEXT_MATERIAL_BYTES} characters.` : ""
  ].filter(Boolean);
  const node: MaterialGraphNode = {
    material_id: materialId(label, sha256),
    label,
    source_type: type,
    declared_path: input.path?.trim() || null,
    resolved_path: null,
    kind: "inline",
    sha256,
    bytes: Buffer.byteLength(content),
    content_bytes: Buffer.byteLength(clipped),
    truncated,
    status: "ingested",
    notes
  };
  return {
    material: {
      id: node.material_id,
      label,
      type,
      content: clipped,
      notes: notes.join(" "),
      path: input.path?.trim() || undefined
    },
    node
  };
}

function ingestMaterials(options: RunLifecycleOptions): {
  materials: SourceMaterialInput[];
  nodes: MaterialGraphNode[];
  warnings: string[];
} {
  const materials: SourceMaterialInput[] = [];
  const nodes: MaterialGraphNode[] = [];
  const warnings: string[] = [];
  const inlineMaterials = options.materials ?? [];
  const declaredPaths = [...(options.materialPaths ?? []), ...inlineMaterials.map((item) => item.path).filter((item): item is string => typeof item === "string" && item.trim().length > 0)];

  for (const declaredPath of [...new Set(declaredPaths)]) {
    const matchingInput = inlineMaterials.find((item) => item.path === declaredPath);
    const resolved = safeResolveMaterialPath(declaredPath);
    const stats = lstatSync(resolved);
    if (stats.isSymbolicLink()) {
      throw new Error(`material path cannot be a symbolic link: ${resolved}`);
    }
    const ingested = stats.isDirectory()
      ? ingestDirectoryMaterial(resolved, declaredPath, matchingInput)
      : ingestFileMaterial(resolved, declaredPath, matchingInput);
    materials.push(ingested.material);
    nodes.push(ingested.node);
  }

  inlineMaterials
    .filter((item) => !item.path)
    .forEach((item, index) => {
      const ingested = ingestInlineMaterial(item, index);
      materials.push(ingested.material);
      nodes.push(ingested.node);
    });

  if (materials.length === 0) warnings.push("No optional materials were ingested for this lifecycle run.");
  return { materials, nodes, warnings };
}

function buildSourceGraph(input: ArchetypeInput, nodes: MaterialGraphNode[], warnings: string[], blockers: string[]): SourceGraphArtifact {
  return {
    artifact_version: "1.0",
    source_scope: "phase-08-natural-language-lifecycle",
    created_at: new Date().toISOString(),
    brief_sha256: hashContent(input.context),
    material_count: nodes.length,
    materials: nodes,
    warnings,
    blockers
  };
}

function packageArtifacts(
  outputDirValue: string,
  artifacts: Array<{ id?: string; path: string; type?: string; required?: boolean }>
): Array<{ id?: string; path: string; type?: string; required?: boolean }> {
  return artifacts.map((artifact) => ({
    ...artifact,
    path: path.join(outputDirValue, artifact.path)
  }));
}

function artifactTypeForPath(filePath: string): "json" | "markdown" | "html" | "text" {
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".html")) return "html";
  return "text";
}

function phasePackageArtifacts(paths: string[]): Array<{ id?: string; path: string; type?: string; required?: boolean }> {
  return paths.map((artifactPath) => ({
    id: slugify(artifactPath.replace(/\.[^.]+$/u, ""), "artifact"),
    path: artifactPath,
    type: artifactTypeForPath(artifactPath),
    required: true
  }));
}

function generateLifecyclePackage(input: ArchetypeInput, inputFilePath: string, outDir: string, overwrite: boolean): GenerationResult {
  assertSafeGeneratedOutputDirectory(outDir, { force: overwrite });
  const contextGate = assessContextGate(input);
  if (contextGate.status === "needs_clarification") {
    const clarificationPackage = exportClarificationPackage(input, contextGate, outDir, inputFilePath, { force: overwrite });
    const dataPlaneRun = recordClarificationPackage(dataPlaneForOutput(outDir), input, contextGate, clarificationPackage, {
      outputDir: outDir,
      sourcePath: inputFilePath
    });
    return {
      packageType: "clarification",
      readinessScore: clarificationPackage.readiness.score,
      readinessTier: clarificationPackage.readiness.readinessTier,
      readyForFrontendAgent: false,
      blockers: contextGate.blockers,
      warnings: contextGate.warnings,
      dataPlaneRunId: dataPlaneRun.run_id,
      artifacts: clarificationPackage.artifacts,
      nextQuestion: contextGate.questions[0]?.question ?? null,
      nextQuestionId: contextGate.questions[0]?.id ?? null
    };
  }

  const compiled = runArchetypeCompiler(input, {
    sourcePath: inputFilePath,
    outputDir: outDir
  });
  if (compiled.manifest.implementation_authorized !== true) {
    const stagingDir = `${outDir}.__draft-staging`;
    exportDraftPackage(compiled, stagingDir, { force: true });
    const phasePackage = createPhasePackage({
      sourceOutputDir: stagingDir,
      targetDir: outDir,
      phaseId: "draft_review",
      force: overwrite
    });
    rmSync(stagingDir, { recursive: true, force: true });
    const artifacts = phasePackageArtifacts(phasePackage.includedArtifacts);
    const dataPlane = dataPlaneForOutput(outDir);
    const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, {
      outputDir: outDir,
      sourcePath: inputFilePath
    });
    recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, outDir, {
      artifacts,
      manifest: {
        packageType: "draft_contract",
        progressivePackage: true,
        phasePackage
      }
    });
    return {
      packageType: "draft_contract",
      readinessScore: compiled.quality.readiness.score,
      readinessTier: "ready_for_contract_approval",
      readyForFrontendAgent: false,
      blockers: compiled.quality.readiness.blockers,
      warnings: compiled.quality.readiness.warnings,
      dataPlaneRunId: dataPlaneRun.run_id,
      artifacts,
      nextQuestion: null,
      nextQuestionId: null
    };
  }

  exportPackage(compiled, outDir, { force: overwrite });
  const topManifest = readJson<{
    artifacts?: Array<{ id?: string; path: string; type?: string; required?: boolean }>;
  }>(path.join(outDir, "manifest.json"));
  const dataPlane = dataPlaneForOutput(outDir);
  const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, {
    outputDir: outDir,
    sourcePath: inputFilePath
  });
  recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, outDir, {
    artifacts: mergeManifestArtifacts(topManifest.artifacts ?? [], compiled.manifest.artifact_index),
    manifest: topManifest
  });
  return {
    packageType: "canonical_contract",
    readinessScore: compiled.quality.readiness.score,
    readinessTier: compiled.manifest.readiness_tier,
    readyForFrontendAgent: compiled.quality.readiness.readyForFrontendAgent,
    blockers: compiled.quality.readiness.blockers,
    warnings: compiled.quality.readiness.warnings,
    dataPlaneRunId: dataPlaneRun.run_id,
    artifacts: topManifest.artifacts ?? [],
    nextQuestion: null,
    nextQuestionId: null
  };
}

function nextAction(input: {
  generation: GenerationResult;
  intakeFilePath: string;
  outDir: string;
}): LifecycleNextAction {
  if (input.generation.packageType === "clarification") {
    return {
      type: "ask_clarification",
      summary: "Ask exactly one clarification question, then continue with archetype run.",
      question_id: input.generation.nextQuestionId,
      question: input.generation.nextQuestion,
      command: null
    };
  }
  if (input.generation.packageType === "draft_contract") {
    return {
      type: "review_draft",
      summary: "Open the design-system preview, review the draft contract, then approve or request edits.",
      design_system_preview: path.join(input.outDir, "draft/design-system-preview.html"),
      approval_request: path.join(input.outDir, "draft/contract-approval-request.json"),
      phase_bundle: path.join(input.outDir, "agent-context/phase-bundles/draft-review.json"),
      command: null
    };
  }
  return {
    type: "implement_tests_first",
    summary: "Canonical contract is ready. Read compact phase bundles, write tests first, then implement and verify.",
    phase_bundle: path.join(input.outDir, "agent-context/phase-bundles/test-first.json"),
    command: null
  };
}

function writeLifecyclePrimitiveArtifacts(input: {
  outDir: string;
  runId: string;
  sourceGraph: SourceGraphArtifact;
  runState: LifecycleRunStateArtifact;
}): void {
  const sourceGraphRelativePath = "lifecycle/source-graph.json";
  const runStateRelativePath = "lifecycle/run-state.json";
  const sourceGraphPath = path.join(input.outDir, sourceGraphRelativePath);
  const runStatePath = path.join(input.outDir, runStateRelativePath);
  writeJson(sourceGraphPath, input.sourceGraph);
  writeJson(runStatePath, input.runState);

  const dataPlane = dataPlaneForOutput(input.outDir);
  const sourceGraphEvent = dataPlane.appendEvent({
    runId: input.runId,
    type: "evidence.recorded",
    phase: "evidence",
    actor: "archetype-run",
    payload: {
      summary: "Natural-language lifecycle source graph recorded.",
      source_graph: sourceGraphRelativePath,
      material_count: input.sourceGraph.material_count
    }
  });
  dataPlane.writeArtifact({
    runId: input.runId,
    artifactId: "lifecycle-source-graph",
    path: sourceGraphRelativePath,
    type: "json",
    sourcePhase: "evidence",
    producer: "archetype-run",
    bytes: byteSize(sourceGraphPath),
    sha256: sha256File(sourceGraphPath),
    lineageEventIds: [sourceGraphEvent.event_id],
    metadata: {
      read_priority: "hot",
      source_scope: input.sourceGraph.source_scope
    }
  });
  const runStateEvent = dataPlane.appendEvent({
    runId: input.runId,
    type: "lifecycle.gate_evaluated",
    phase: phaseForPackage(input.runState.package_type),
    actor: "archetype-run",
    payload: {
      summary: `Natural-language lifecycle advanced: ${input.runState.next_action.type}`,
      package_type: input.runState.package_type,
      readiness_tier: input.runState.readiness_tier,
      ready_for_frontend_agent: input.runState.ready_for_frontend_agent,
      next_action: input.runState.next_action.type
    }
  });
  dataPlane.writeArtifact({
    runId: input.runId,
    artifactId: "lifecycle-run-state",
    path: runStateRelativePath,
    type: "json",
    sourcePhase: phaseForPackage(input.runState.package_type),
    producer: "archetype-run",
    bytes: byteSize(runStatePath),
    sha256: sha256File(runStatePath),
    lineageEventIds: [runStateEvent.event_id],
    metadata: {
      read_priority: "hot",
      source_scope: input.runState.source_scope
    }
  });
  writeReplayConsistentProjections(dataPlane, input.runId);
}

function phaseForPackage(packageType: LifecyclePackageType): DataPlanePhase {
  if (packageType === "clarification") return "clarification";
  if (packageType === "draft_contract") return "draft_contract";
  return "canonical_spec";
}

function commandStatus(blockers: string[], warnings: string[]): "success" | "warning" {
  return blockers.length > 0 || warnings.length > 0 ? "warning" : "success";
}

function approvalAssumptionIds(options: RunLifecycleOptions): string[] {
  return options.approvedAssumptionIds?.filter((item) => item.trim().length > 0) ?? [];
}

export function runLifecycle(options: RunLifecycleOptions): RunLifecycleResult {
  const outDir = outputDir(options);
  const overwrite = options.overwrite ?? true;
  const sourceInputPath = intakePath(options);
  const materialIngestion = ingestMaterials(options);
  const inputExists = existsSync(sourceInputPath);
  let input = inputExists ? readJson<ArchetypeInput>(sourceInputPath) : initialInput(options, materialIngestion.materials);
  input = {
    ...input,
    materials: mergeMaterials(input.materials, materialIngestion.materials),
    materialIntake: materialIngestion.materials.length > 0
      ? {
        ...(input.materialIntake ?? {}),
        status: "provided",
        requestedTypes: ["SPEC", "SOP", "PRD", "screenshots", "wireframes", "design_docs", "api_docs", "route_maps", "repo_files"],
        notes: input.materialIntake?.notes ?? "Source materials were supplied during lifecycle intake."
      }
      : input.materialIntake
  };

  if (options.answer !== undefined || options.questionId !== undefined) {
    if (!options.questionId || !options.answer) throw new Error("--question-id and --answer must be provided together.");
    const applied = applyClarificationAnswer({
      intake: input,
      questionId: options.questionId,
      answer: options.answer,
      answeredBy: "user"
    });
    input = applied.updatedInput;
  }

  mkdirSync(path.dirname(sourceInputPath), { recursive: true });
  writeJson(sourceInputPath, input);

  let activeInputPath = sourceInputPath;
  let approvedPath: string | null = null;
  if (options.approve === true) {
    if (!options.approvedBy?.trim()) throw new Error("--approved-by is required when --approve is used.");
    approvedPath = approvedInputPath(options, sourceInputPath);
    const approval = createDraftApproval({
      intake: input,
      intakePath: sourceInputPath,
      draftDir: outDir,
      approvedInputPath: approvedPath,
      approvedBy: options.approvedBy,
      approvedAssumptionIds: approvalAssumptionIds(options)
    });
    input = approval.approvedInput;
    activeInputPath = approvedPath;
  }

  const generation = generateLifecyclePackage(input, activeInputPath, outDir, overwrite);
  const action = nextAction({
    generation,
    intakeFilePath: activeInputPath,
    outDir
  });
  const sourceGraph = buildSourceGraph(input, materialIngestion.nodes, materialIngestion.warnings, generation.blockers);
  const runState: LifecycleRunStateArtifact = {
    artifact_version: "1.0",
    source_scope: "phase-08-natural-language-lifecycle",
    command: "archetype run",
    host: options.host ?? "cli",
    package_type: generation.packageType,
    readiness_tier: generation.readinessTier,
    ready_for_frontend_agent: generation.readyForFrontendAgent,
    data_plane_run_id: generation.dataPlaneRunId,
    input_path: activeInputPath,
    approved_input_path: approvedPath,
    output_dir: outDir,
    source_graph_path: "lifecycle/source-graph.json",
    next_action: action
  };
  writeLifecyclePrimitiveArtifacts({
    outDir,
    runId: generation.dataPlaneRunId,
    sourceGraph,
    runState
  });
  const consumerPlanePath = path.join(outDir, "agent-context/consumer-plane.json");
  const consumerPlane = readConsumerPlane(outDir);

  return {
    status: commandStatus(generation.blockers, [...generation.warnings, ...materialIngestion.warnings]),
    outputDir: outDir,
    inputPath: activeInputPath,
    approvedInputPath: approvedPath,
    packageType: generation.packageType,
    readinessScore: generation.readinessScore,
    readinessTier: generation.readinessTier,
    readyForFrontendAgent: generation.readyForFrontendAgent,
    blockers: generation.blockers,
    warnings: [...generation.warnings, ...materialIngestion.warnings],
    dataPlaneRunId: generation.dataPlaneRunId,
    sourceGraphPath: path.join(outDir, "lifecycle/source-graph.json"),
    runStatePath: path.join(outDir, "lifecycle/run-state.json"),
    consumerPlanePath,
    consumerPlane,
    materialCount: materialIngestion.nodes.length,
    nextQuestion: generation.nextQuestion,
    nextQuestionId: generation.nextQuestionId,
    designSystemPreviewPath: generation.packageType === "draft_contract" ? path.join(outDir, "draft/design-system-preview.html") : null,
    approvalRequestPath: generation.packageType === "draft_contract" ? path.join(outDir, "draft/contract-approval-request.json") : null,
    nextAction: action,
    artifacts: packageArtifacts(outDir, generation.artifacts)
  };
}
