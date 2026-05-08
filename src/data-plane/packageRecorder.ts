import { existsSync } from "node:fs";
import path from "node:path";
import { artifactPhaseForRegistryPath, artifactReadPriorityForPath, artifactRegistryEntryForPath, artifactTypeForRegistryPath } from "../artifacts/registry";
import { hashContent, slugify, stableId } from "../core/stable";
import type { ArchetypeInput, ArchetypePackage } from "../core/types";
import type { ContextGateAssessment } from "../modules/contextGate";
import { artifactIdForPath, artifactPhaseForPath, artifactTypeForPath, assertRelativeArtifactPath, byteSize, sha256File } from "./artifacts";
import { isDataPlaneError } from "./errors";
import { dataPlaneRunId } from "./state";
import { recordQaSignal, recordRepairSignal, recordVerificationSignal } from "./writers";
import type { DataPlane } from "./ports";
import type { AgentRun, DataPlaneArtifactType, JsonObject, WriteArtifactInput } from "./types";

export interface ManifestArtifact {
  id?: string;
  path: string;
  type?: string;
  required?: boolean;
}

export interface ExportLike {
  artifacts: ManifestArtifact[];
  manifest: Record<string, unknown>;
}

export interface RecordPackageOptions {
  outputDir?: string;
  sourcePath?: string;
}

function asArtifactType(value: string | undefined, relativePath: string): DataPlaneArtifactType {
  if (value === "json" || value === "markdown" || value === "html" || value === "text" || value === "yaml" || value === "typescript") return value;
  return artifactTypeForRegistryPath(relativePath) ?? artifactTypeForPath(relativePath);
}

function ensureRun(dataPlane: DataPlane, run: AgentRun): AgentRun {
  try {
    return dataPlane.getRun(run.run_id);
  } catch (error) {
    if (!isDataPlaneError(error) || error.code !== "RUN_NOT_FOUND") throw error;
  }
  return dataPlane.createRun({
    runId: run.run_id,
    projectSlug: run.project_slug,
    packageId: run.package_id,
    sourceHash: run.source_hash,
    outputDir: run.output_dir,
    status: run.status,
    metadata: run.metadata,
    createdAt: run.created_at
  });
}

function appendOnce(dataPlane: DataPlane, input: Parameters<DataPlane["appendEvent"]>[0]): void {
  const existing = dataPlane.listEvents(input.runId);
  if (existing.some((event) => event.type === input.type && event.phase === (input.phase ?? "unknown") && event.payload.summary === input.payload?.summary)) return;
  dataPlane.appendEvent(input);
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function stringArrayField(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function lifecyclePhase(pkg: ArchetypePackage): "clarification" | "approval" | "canonical_spec" {
  if (pkg.lifecycle.contextCompletion.status === "needs_clarification") return "clarification";
  return pkg.manifest.implementation_authorized ? "canonical_spec" : "approval";
}

function packageRun(pkg: ArchetypePackage, options: RecordPackageOptions): AgentRun {
  const runId = dataPlaneRunId(pkg.manifest.project_slug, pkg.manifest.source_hash);
  const generatedAt = pkg.manifest.generated_at;
  return {
    run_id: runId,
    schema_version: "1.0",
    project_slug: pkg.manifest.project_slug,
    package_id: pkg.manifest.package_id,
    source_hash: pkg.manifest.source_hash,
    output_dir: options.outputDir ?? null,
    status: pkg.manifest.implementation_authorized ? "running" : "blocked",
    created_at: generatedAt,
    updated_at: generatedAt,
    sessions: [],
    metadata: {
      source_path: options.sourcePath ?? null,
      operating_mode: pkg.manifest.operating_mode,
      package_readiness_tier: pkg.manifest.readiness_tier
    }
  };
}

function clarificationRun(input: ArchetypeInput, assessment: ContextGateAssessment, options: RecordPackageOptions): AgentRun {
  const sourceHash = hashContent(input);
  const projectSlug = slugify(input.projectName ?? "archetype-clarification");
  const now = new Date().toISOString();
  return {
    run_id: dataPlaneRunId(projectSlug, sourceHash),
    schema_version: "1.0",
    project_slug: projectSlug,
    package_id: stableId("clarification-package", projectSlug, sourceHash),
    source_hash: sourceHash,
    output_dir: options.outputDir ?? null,
    status: "blocked",
    created_at: now,
    updated_at: now,
    sessions: [],
    metadata: {
      source_path: options.sourcePath ?? null,
      context_status: assessment.status,
      readiness_tier: assessment.readinessTier
    }
  };
}

function readinessPayload(pkg: ArchetypePackage): JsonObject {
  return {
    summary: `Readiness evaluated: ${pkg.manifest.readiness_tier}`,
    readiness_score: pkg.manifest.readiness_score,
    readiness_tier: pkg.manifest.readiness_tier,
    ready_for_frontend_agent: pkg.manifest.ready_for_frontend_agent,
    implementation_authorized: pkg.manifest.implementation_authorized,
    blockers: pkg.manifest.blockers,
    warnings: pkg.manifest.warnings
  };
}

function lifecyclePayload(pkg: ArchetypePackage): JsonObject {
  return {
    summary: `Lifecycle gate evaluated: ${pkg.lifecycle.contextCompletion.status}`,
    state: pkg.lifecycle.contextCompletion.next_state,
    context_status: pkg.lifecycle.contextCompletion.status,
    readiness_tier: pkg.manifest.readiness_tier,
    implementation_authorized: pkg.manifest.implementation_authorized,
    ready_for_frontend_agent: pkg.manifest.ready_for_frontend_agent,
    blockers: pkg.manifest.blockers,
    warnings: pkg.manifest.warnings
  };
}

function evidencePayload(pkg: ArchetypePackage): JsonObject {
  return {
    summary: "Evidence ledger recorded.",
    source_count: pkg.evidence.sources.length,
    known_fact_count: pkg.evidence.known_facts.length,
    observation_count: pkg.evidence.observations.length,
    assumption_count: pkg.evidence.assumptions.length,
    decision_count: pkg.evidence.decisions.length,
    missing_information_count: pkg.evidence.missing_information.length
  };
}

function contractsPayload(pkg: ArchetypePackage): JsonObject {
  return {
    summary: pkg.manifest.implementation_authorized ? "Canonical contracts recorded." : "Draft contracts recorded.",
    package_id: pkg.manifest.package_id,
    draft_refs: [
      "draft/product-model.draft.json",
      "draft/experience-architecture.draft.json",
      "draft/design-system.draft.json",
      "draft/frontend-contract.draft.json"
    ],
    canonical_refs: pkg.manifest.implementation_authorized
      ? ["spec/archetype-spec.json", "implementation-contract.md", "test-first/test-first-contract.json", "verification/playwright-verification-contract.json"]
      : [],
    implementation_authorized: pkg.manifest.implementation_authorized
  };
}

function approvalDecisionPayload(pkg: ArchetypePackage): JsonObject {
  const approval = pkg.manifest.contract_approval;
  return {
    summary: pkg.manifest.implementation_authorized ? "Human contract approval recorded." : "Contract approval is pending.",
    approved: pkg.manifest.implementation_authorized,
    status: stringField(approval, "status") ?? (pkg.manifest.implementation_authorized ? "approved" : "pending"),
    approved_by: stringField(approval, "approvedBy") ?? stringField(approval, "approved_by"),
    approver_type: stringField(approval, "approverType") ?? stringField(approval, "approver_type"),
    approved_at: stringField(approval, "approvedAt") ?? stringField(approval, "approved_at"),
    artifact_refs: stringArrayField(approval, "artifactRefs").length > 0 ? stringArrayField(approval, "artifactRefs") : stringArrayField(approval, "artifact_refs"),
    approval_artifact_path: stringField(approval, "approvalArtifactPath") ?? stringField(approval, "approval_artifact_path"),
    approval_digest: stringField(approval, "approvalDigest") ?? stringField(approval, "approval_digest"),
    draft_package_id: stringField(approval, "draftPackageId") ?? stringField(approval, "draft_package_id"),
    source_hash: stringField(approval, "sourceHash") ?? stringField(approval, "source_hash"),
    package_checksum: stringField(approval, "packageChecksum") ?? stringField(approval, "package_checksum")
  };
}

function verificationPayload(pkg: ArchetypePackage): JsonObject {
  if (!pkg.manifest.implementation_authorized) {
    return {
      summary: "Verification skipped before bound approval.",
      status: "skipped",
      reason: "Draft packages do not construct Playwright verification artifacts.",
      playwright_contract: null,
      playwright_evidence: null,
      repair_queue: null
    };
  }
  const status = typeof pkg.playwright.evidenceJson.status === "string" ? pkg.playwright.evidenceJson.status : "pending";
  return {
    summary: `Verification recorded: ${status}`,
    status,
    playwright_contract: "verification/playwright-verification-contract.json",
    playwright_evidence: "verification/playwright-evidence.json",
    repair_queue: "10-revision/repair-task-queue.json"
  };
}

export function writeReplayConsistentProjections(dataPlane: DataPlane, runId: string): void {
  const replay = dataPlane.replayRun(runId);
  const updatedAt = replay.events.at(-1)?.occurred_at ?? new Date(0).toISOString();
  for (const [projectionName, projection] of Object.entries(replay.projections)) {
    dataPlane.writeProjection({
      runId,
      projectionName: projectionName as keyof typeof replay.projections,
      data: projection.data,
      eventCount: replay.events.length,
      updatedAt,
      recordEvent: false
    });
  }
}

export function recordCompiledPackage(dataPlane: DataPlane, pkg: ArchetypePackage, options: RecordPackageOptions = {}): AgentRun {
  const run = ensureRun(dataPlane, packageRun(pkg, options));
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "intake.recorded",
    phase: "intake",
    actor: "archetype",
    payload: {
      summary: "Compiler source intake recorded.",
      source_hash: pkg.manifest.source_hash,
      source_path: options.sourcePath ?? null,
      operating_mode: pkg.manifest.operating_mode
    }
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "evidence.recorded",
    phase: "evidence",
    actor: "archetype",
    payload: evidencePayload(pkg)
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "lifecycle.gate_evaluated",
    phase: lifecyclePhase(pkg),
    actor: "archetype",
    payload: lifecyclePayload(pkg)
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "decision.recorded",
    phase: "approval",
    actor: "archetype",
    payload: approvalDecisionPayload(pkg)
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "contract.draft_recorded",
    phase: "draft_contract",
    actor: "archetype",
    payload: contractsPayload(pkg)
  });
  if (pkg.manifest.implementation_authorized) {
    appendOnce(dataPlane, {
      runId: run.run_id,
      type: "contract.canonical_recorded",
      phase: "canonical_spec",
      actor: "archetype",
      payload: contractsPayload(pkg)
    });
    recordVerificationSignal(dataPlane, {
      runId: run.run_id,
      summary: "Verification package evidence recorded.",
      status: String(verificationPayload(pkg).status ?? "pending"),
      evidenceGrade: "contract",
      artifactRefs: [
        "verification/playwright-verification-contract.json",
        "verification/playwright-evidence.json"
      ]
    });
    recordQaSignal(dataPlane, {
      runId: run.run_id,
      summary: "QA package evidence recorded.",
      status: "pending",
      scenarioCount: Array.isArray(pkg.e2e.scenarioCatalog.scenarios) ? pkg.e2e.scenarioCatalog.scenarios.length : 0,
      artifactRefs: [
        "qa/scenario-catalog.json",
        "qa/playwright-results.json",
        "qa/malformed-data-results.json",
        "qa/accessibility-results.md",
        "qa/visual-regression-report.md",
        "qa/contract-drift-report.md"
      ]
    });
    recordRepairSignal(dataPlane, {
      runId: run.run_id,
      summary: "Repair package state recorded.",
      status: String((pkg.revision.repairTaskQueue as JsonObject).status ?? "pending"),
      taskCount: Number((pkg.revision.repairTaskQueue as JsonObject).task_count ?? 0),
      artifactRefs: [
        "10-revision/verification-repair-contract.json",
        "10-revision/repair-task-queue.json",
        "10-revision/repair-plan.md",
        "10-revision/drift-report.json"
      ]
    });
  }
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "readiness.evaluated",
    phase: "readiness",
    actor: "archetype",
    payload: readinessPayload(pkg)
  });
  writeReplayConsistentProjections(dataPlane, run.run_id);
  return dataPlane.getRun(run.run_id);
}

function artifactInput(runId: string, outDir: string, artifact: ManifestArtifact): WriteArtifactInput | null {
  assertRelativeArtifactPath(artifact.path);
  const resolvedOutDir = path.resolve(outDir);
  const absolutePath = path.resolve(resolvedOutDir, artifact.path);
  if (!absolutePath.startsWith(`${resolvedOutDir}${path.sep}`)) return null;
  if (!existsSync(absolutePath)) return null;
  const sha256 = sha256File(absolutePath);
  const registryEntry = artifactRegistryEntryForPath(artifact.path);
  const phase = registryEntry?.dataPlane.sourcePhase ?? artifactPhaseForRegistryPath(artifact.path) ?? artifactPhaseForPath(artifact.path);
  const artifactId = artifact.id ?? artifactIdForPath(artifact.path, sha256);
  return {
    runId,
    artifactId,
    path: artifact.path,
    type: asArtifactType(artifact.type, artifact.path),
    sourcePhase: phase,
    producer: "archetype-exporter",
    bytes: byteSize(absolutePath),
    sha256,
    metadata: {
      required: artifact.required !== false,
      package_path: artifact.path,
      registry_id: registryEntry?.id ?? null,
      read_priority: artifactReadPriorityForPath(artifact.path)
    }
  };
}

export function recordExportedArtifacts(dataPlane: DataPlane, runId: string, outDir: string, exported: ExportLike): void {
  for (const artifact of exported.artifacts) {
    const input = artifactInput(runId, outDir, artifact);
    if (input) dataPlane.writeArtifact(input);
  }
  writeReplayConsistentProjections(dataPlane, runId);
}

export function mergeManifestArtifacts(artifacts: ManifestArtifact[], artifactIndex: string[]): ManifestArtifact[] {
  const byPath = new Map<string, ManifestArtifact>();
  for (const artifact of artifacts) {
    byPath.set(artifact.path, artifact);
  }
  for (const artifactPath of artifactIndex) {
    if (!byPath.has(artifactPath)) {
      byPath.set(artifactPath, {
        path: artifactPath,
        required: true
      });
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export function recordClarificationPackage(
  dataPlane: DataPlane,
  input: ArchetypeInput,
  assessment: ContextGateAssessment,
  exported: ExportLike,
  options: RecordPackageOptions = {}
): AgentRun {
  const run = ensureRun(dataPlane, clarificationRun(input, assessment, options));
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "intake.recorded",
    phase: "intake",
    actor: "archetype",
    payload: {
      summary: "Clarification intake recorded.",
      source_hash: run.source_hash,
      source_path: options.sourcePath ?? null
    }
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "evidence.recorded",
    phase: "evidence",
    actor: "archetype",
    payload: {
      summary: "Clarification evidence recorded.",
      known_fact_count: assessment.knownFacts.length,
      missing_decision_count: assessment.missingDecisions.length,
      assumption_count: assessment.assumptions.length
    }
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "lifecycle.gate_evaluated",
    phase: "clarification",
    actor: "archetype",
    payload: {
      summary: `Clarification gate evaluated: ${assessment.status}`,
      state: assessment.nextState,
      context_status: assessment.status,
      readiness_tier: assessment.readinessTier,
      implementation_authorized: false,
      ready_for_frontend_agent: false,
      blockers: assessment.blockers,
      warnings: assessment.warnings
    }
  });
  appendOnce(dataPlane, {
    runId: run.run_id,
    type: "readiness.evaluated",
    phase: "readiness",
    actor: "archetype",
    payload: {
      summary: `Readiness evaluated: ${assessment.readinessTier}`,
      readiness_score: Math.min(assessment.confidenceScore, 49),
      readiness_tier: assessment.readinessTier,
      ready_for_frontend_agent: false,
      implementation_authorized: false,
      blockers: assessment.blockers,
      warnings: assessment.warnings
    }
  });
  recordExportedArtifacts(dataPlane, run.run_id, options.outputDir ?? "", exported);
  return dataPlane.getRun(run.run_id);
}
