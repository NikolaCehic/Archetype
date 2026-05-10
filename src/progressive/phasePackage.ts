import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REQUIRED_DRAFT_APPROVAL_REFS } from "../approval/draftApproval";
import { prepareGeneratedOutputDirectory } from "../safety/pathSafety";
import type { AgentContextPhaseId } from "../agent-context/phaseBundles";

interface LazyPhase {
  phase_id?: string;
  status?: string;
  bundle?: string;
  required_now?: string[];
  optional_later?: string[];
}

interface LazyContractIndex {
  phases?: LazyPhase[];
}

interface ConsumerPlaneReadPlan {
  first_reads?: string[];
  current_phase_bundle?: string;
  allowed_full_artifacts_now?: string[];
}

interface ConsumerPlane {
  current_phase?: {
    phase_id?: string;
    status?: string;
  };
  read_plan?: ConsumerPlaneReadPlan;
}

interface SourceManifest {
  generatedAt?: string;
  packageKind?: string;
  packageType?: string;
  packageId?: string;
}

export interface PhasePackageResult {
  status: "pass";
  sourceOutputDir: string;
  targetDir: string;
  phaseId: AgentContextPhaseId;
  filesWritten: number;
  includedArtifacts: string[];
  deferredArtifacts: string[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readSourceManifest(sourceOutputDir: string): SourceManifest {
  const manifestPath = path.join(sourceOutputDir, "manifest.json");
  if (!existsSync(manifestPath)) return {};
  return readJson<SourceManifest>(manifestPath);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((item) => item.trim().length > 0))].sort();
}

function assertIndependentDirectories(sourceOutputDir: string, targetDir: string): void {
  const source = path.resolve(sourceOutputDir);
  const target = path.resolve(targetDir);
  const sourceToTarget = path.relative(source, target);
  const targetToSource = path.relative(target, source);
  if (source === target) {
    throw new Error("Phase package targetDir must be different from the source output directory.");
  }
  if (!sourceToTarget.startsWith("..") && !path.isAbsolute(sourceToTarget)) {
    throw new Error("Phase package targetDir must not be inside the source output directory.");
  }
  if (!targetToSource.startsWith("..") && !path.isAbsolute(targetToSource)) {
    throw new Error("Phase package targetDir must not contain the source output directory.");
  }
}

function ensureInside(baseDir: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) throw new Error(`Phase package path must be relative: ${relativePath}`);
  if (relativePath.includes("\0")) throw new Error(`Phase package path contains an invalid null byte: ${relativePath}`);
  const resolvedBase = path.resolve(baseDir);
  const target = path.resolve(resolvedBase, relativePath);
  const relative = path.relative(resolvedBase, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Phase package path resolves outside directory: ${relativePath}`);
  return target;
}

function copyArtifact(sourceDir: string, targetDir: string, relativePath: string): boolean {
  const source = ensureInside(sourceDir, relativePath);
  if (!existsSync(source)) return false;
  const target = ensureInside(targetDir, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source));
  return true;
}

function copyRequiredArtifact(sourceDir: string, targetDir: string, relativePath: string): string {
  if (!copyArtifact(sourceDir, targetDir, relativePath)) {
    throw new Error(`Phase package required artifact is missing: ${relativePath}`);
  }
  return relativePath;
}

function phaseById(index: LazyContractIndex, phaseId: AgentContextPhaseId): LazyPhase {
  const phase = (index.phases ?? []).find((item) => item.phase_id === phaseId);
  if (!phase) throw new Error(`Unknown phase "${phaseId}".`);
  return phase;
}

function requiredApprovalArtifacts(phaseId: AgentContextPhaseId): string[] {
  if (phaseId !== "draft_review" && phaseId !== "contract_approval") return [];
  return [
    "00-manifest/manifest.json",
    ...REQUIRED_DRAFT_APPROVAL_REFS
  ];
}

export function createPhasePackage(input: {
  sourceOutputDir: string;
  targetDir: string;
  phaseId: AgentContextPhaseId;
  force?: boolean;
  allowNonCurrent?: boolean;
}): PhasePackageResult {
  const sourceOutputDir = path.resolve(input.sourceOutputDir);
  const targetDir = path.resolve(input.targetDir);
  assertIndependentDirectories(sourceOutputDir, targetDir);
  const sourceManifest = readSourceManifest(sourceOutputDir);
  const lazyIndex = readJson<LazyContractIndex>(path.join(sourceOutputDir, "progressive", "lazy-contract-index.json"));
  const consumerPlane = readJson<ConsumerPlane>(path.join(sourceOutputDir, "agent-context", "consumer-plane.json"));
  const phase = phaseById(lazyIndex, input.phaseId);
  const currentPhaseId = consumerPlane.current_phase?.phase_id;
  if (input.allowNonCurrent !== true && currentPhaseId && currentPhaseId !== input.phaseId) {
    throw new Error(`Phase package can only be created for the current phase "${currentPhaseId}". Requested "${input.phaseId}".`);
  }
  if (phase.status !== "available" && phase.status !== "complete") {
    throw new Error(`Phase package cannot be created for blocked phase "${input.phaseId}".`);
  }
  prepareGeneratedOutputDirectory(targetDir, { force: input.force === true });

  const baseline = [
    "agent-context/consumer-plane.json",
    "agent-context/consumer-plane.md",
    "agent-context/context-summary.json",
    "agent-context/phase-bundles/index.json",
    "review-console/session.json",
    "review-console/index.html",
    "review-console/run-timeline.json",
    "progressive/generation-plan.json",
    "progressive/lazy-contract-index.json",
    "progressive/token-budget.json",
    "progressive/phase-package-plan.json",
    "mcp/current-phase-resources.json",
    "mcp/current-phase-prompts.json",
    "orchestration/host-permissions.json",
    "orchestration/team-handoffs.json",
    "orchestration/subagent-ownership.json",
    "attachments/source-materials.json",
    "attachments/source-materials.md",
    "lifecycle/blockers-explained.json",
    "lifecycle/blockers-explained.md",
    "governance/agent-control-plane.json",
    "governance/agent-control-plane.md"
  ];
  const included = unique([
    ...baseline,
    ...requiredApprovalArtifacts(input.phaseId),
    ...(consumerPlane.read_plan?.first_reads ?? []),
    consumerPlane.read_plan?.current_phase_bundle ?? "",
    phase.bundle ?? "",
    ...(phase.required_now ?? [])
  ]);
  const copied = included.map((artifact) => copyRequiredArtifact(sourceOutputDir, targetDir, artifact));
  const deferred = unique([
    ...(phase.optional_later ?? []),
    ...((lazyIndex.phases ?? []).filter((item) => item.phase_id !== input.phaseId).flatMap((item) => [...(item.required_now ?? []), ...(item.optional_later ?? [])]))
  ]);
  const manifest = {
    schemaVersion: "1.0",
    packageType: "phase_package",
    sourceOutputDir,
    sourcePackageKind: sourceManifest.packageKind ?? sourceManifest.packageType ?? "unknown",
    sourcePackageId: sourceManifest.packageId ?? "unknown",
    sourceGeneratedAt: sourceManifest.generatedAt ?? "unknown",
    phaseId: input.phaseId,
    includedArtifacts: copied,
    deferredArtifacts: deferred,
    rule: "This phase package is a small handoff surface. Read deferred artifacts only after the consumer plane or phase bundle requires them."
  };
  writeFileSync(path.join(targetDir, "phase-package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(targetDir, "README.md"), [
    `# Archetype ${input.phaseId} Phase Package`,
    "",
    "This is a progressive, phase-scoped handoff package.",
    "",
    "Start with:",
    "",
    "1. `agent-context/consumer-plane.json`",
    "2. `review-console/session.json`",
    `3. \`${phase.bundle ?? "agent-context/phase-bundles/index.json"}\``,
    "",
    "Do not read deferred artifacts until the phase bundle or consumer plane permits them."
  ].join("\n"));
  return {
    status: "pass",
    sourceOutputDir,
    targetDir,
    phaseId: input.phaseId,
    filesWritten: copied.length + 2,
    includedArtifacts: copied,
    deferredArtifacts: deferred
  };
}
