import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDraftApproval } from "../approval/draftApproval";
import { runArchetypeCompiler } from "../core/pipeline";
import { hashContent, stableId } from "../core/stable";
import type { ArchetypeInput, SourceMaterialInput } from "../core/types";
import { FileDataPlane, mergeManifestArtifacts, recordCompiledPackage, recordExportedArtifacts } from "../data-plane";
import { exportDraftPackage } from "../output/exportDraftPackage";
import { exportPackage } from "../output/exportPackage";

export type ReviewDecisionKind = "approve" | "request_changes" | "reject";

export interface SubmitReviewDecisionInput {
  draftDir: string;
  inputPath: string;
  outputDir?: string;
  approvedInputPath?: string;
  decision: ReviewDecisionKind;
  reviewer: string;
  feedback?: string;
  approvedAssumptionIds?: string[];
  selectedDecisionIds?: string[];
  force?: boolean;
}

export interface ReviewDecisionResult {
  status: "success" | "warning";
  decision: ReviewDecisionKind;
  draftDir: string;
  inputPath: string;
  outputDir: string;
  approvedInputPath: string | null;
  approvalArtifactPath: string | null;
  packageType: "canonical_contract" | "draft_contract" | "rejected";
  implementationAuthorized: boolean;
  reviewDecisionPath: string;
  revisionRequestPath: string | null;
  nextAction: string;
  dataPlaneRunId?: string;
}

interface ReviewDecisionArtifact {
  artifact_version: "1.0";
  source_scope: "human-review-decision";
  decision_id: string;
  decision: ReviewDecisionKind;
  reviewer: string;
  reviewer_type: "human";
  feedback: string | null;
  selected_decision_ids: string[];
  approved_assumption_ids: string[];
  draft_dir: string;
  input_path: string;
  output_dir: string;
  implementation_authorized: boolean;
  next_action: string;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function requireReviewer(reviewer: string): string {
  const trimmed = reviewer.trim();
  if (!trimmed) throw new Error("A human reviewer is required for review decisions.");
  return trimmed;
}

function defaultApprovedInputPath(inputPath: string): string {
  return path.join(path.dirname(inputPath), `${path.basename(inputPath, ".json")}.approved.json`);
}

function defaultRevisionInputPath(inputPath: string): string {
  return path.join(path.dirname(inputPath), `${path.basename(inputPath, ".json")}.revision.json`);
}

function dataPlaneForOutput(outputDir: string): FileDataPlane {
  return new FileDataPlane({ rootDir: path.join(outputDir, "data-plane") });
}

function decisionArtifact(input: {
  decision: ReviewDecisionKind;
  reviewer: string;
  feedback: string | null;
  selectedDecisionIds: string[];
  approvedAssumptionIds: string[];
  draftDir: string;
  inputPath: string;
  outputDir: string;
  implementationAuthorized: boolean;
  nextAction: string;
}): ReviewDecisionArtifact {
  const withoutId = {
    artifact_version: "1.0" as const,
    source_scope: "human-review-decision" as const,
    decision: input.decision,
    reviewer: input.reviewer,
    reviewer_type: "human" as const,
    feedback: input.feedback,
    selected_decision_ids: input.selectedDecisionIds,
    approved_assumption_ids: input.approvedAssumptionIds,
    draft_dir: input.draftDir,
    input_path: input.inputPath,
    output_dir: input.outputDir,
    implementation_authorized: input.implementationAuthorized,
    next_action: input.nextAction
  };
  return {
    ...withoutId,
    decision_id: stableId("review", input.decision, hashContent(withoutId))
  };
}

function revisionMaterial(feedback: string): SourceMaterialInput {
  return {
    id: stableId("review-feedback", hashContent(feedback)),
    label: "Human review change request",
    type: "document",
    content: feedback,
    notes: "Captured from Archetype Review Console decision flow."
  };
}

function writeDecisionArtifacts(outputDir: string, decision: ReviewDecisionArtifact, revisionRequest?: Record<string, unknown>): {
  reviewDecisionPath: string;
  revisionRequestPath: string | null;
} {
  const reviewDecisionPath = path.join(outputDir, "lifecycle", "review-decision.json");
  writeJson(reviewDecisionPath, decision);
  if (!revisionRequest) return { reviewDecisionPath, revisionRequestPath: null };
  const revisionRequestPath = path.join(outputDir, "lifecycle", "revision-request.json");
  writeJson(revisionRequestPath, revisionRequest);
  return { reviewDecisionPath, revisionRequestPath };
}

export function submitReviewDecision(input: SubmitReviewDecisionInput): ReviewDecisionResult {
  const draftDir = path.resolve(input.draftDir);
  const inputPath = path.resolve(input.inputPath);
  const requestedOutputDir = input.outputDir ? path.resolve(input.outputDir) : null;
  const reviewer = requireReviewer(input.reviewer);
  const selectedDecisionIds = input.selectedDecisionIds ?? [];
  const approvedAssumptionIds = input.approvedAssumptionIds ?? [];
  if (!existsSync(inputPath)) throw new Error(`Review inputPath does not exist: ${inputPath}`);
  if (!existsSync(draftDir)) throw new Error(`Review draftDir does not exist: ${draftDir}`);
  const intake = readJson<ArchetypeInput>(inputPath);

  if (input.decision === "approve") {
    const outputDir = requestedOutputDir ?? path.join(path.dirname(draftDir), `${path.basename(draftDir)}-canonical`);
    const approvedInputPath = path.resolve(input.approvedInputPath ?? defaultApprovedInputPath(inputPath));
    const approval = createDraftApproval({
      intake,
      intakePath: inputPath,
      draftDir,
      approvedInputPath,
      approvedBy: reviewer,
      approvedAssumptionIds
    });
    const compiled = runArchetypeCompiler(approval.approvedInput, {
      sourcePath: approvedInputPath,
      outputDir
    });
    exportPackage(compiled, outputDir, { force: input.force === true });
    const topManifest = readJson<{ artifacts?: Array<{ id?: string; path: string; type?: string; required?: boolean }> }>(path.join(outputDir, "manifest.json"));
    const dataPlane = dataPlaneForOutput(outputDir);
    const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, { outputDir, sourcePath: approvedInputPath });
    recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, outputDir, {
      artifacts: mergeManifestArtifacts(topManifest.artifacts ?? [], compiled.manifest.artifact_index),
      manifest: topManifest
    });
    const decision = decisionArtifact({
      decision: input.decision,
      reviewer,
      feedback: input.feedback?.trim() || null,
      selectedDecisionIds,
      approvedAssumptionIds,
      draftDir,
      inputPath,
      outputDir,
      implementationAuthorized: true,
      nextAction: "Canonical package generated. Start test-first implementation from the consumer plane and test-first phase bundle."
    });
    const paths = writeDecisionArtifacts(outputDir, decision);
    return {
      status: "success",
      decision: input.decision,
      draftDir,
      inputPath,
      outputDir,
      approvedInputPath,
      approvalArtifactPath: approval.approvalArtifactPath,
      packageType: "canonical_contract",
      implementationAuthorized: true,
      reviewDecisionPath: paths.reviewDecisionPath,
      revisionRequestPath: null,
      nextAction: decision.next_action,
      dataPlaneRunId: dataPlaneRun.run_id
    };
  }

  if (input.decision === "request_changes") {
    const outputDir = requestedOutputDir ?? path.join(path.dirname(draftDir), `${path.basename(draftDir)}-revised`);
    const feedback = input.feedback?.trim();
    if (!feedback) throw new Error("request_changes requires feedback.");
    const revisionInputPath = path.resolve(input.approvedInputPath ?? defaultRevisionInputPath(inputPath));
    const material = revisionMaterial(feedback);
    const updatedInput: ArchetypeInput = {
      ...intake,
      contractApproval: undefined,
      materials: [...(intake.materials ?? []), material],
      materialIntake: {
        ...(intake.materialIntake ?? {}),
        status: "provided",
        respondedBy: reviewer,
        notes: "Human review requested draft changes before approval."
      }
    };
    writeJson(revisionInputPath, updatedInput);
    const compiled = runArchetypeCompiler(updatedInput, {
      sourcePath: revisionInputPath,
      outputDir
    });
    const draftPackage = exportDraftPackage(compiled, outputDir, { force: input.force === true });
    const dataPlane = dataPlaneForOutput(outputDir);
    const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, { outputDir, sourcePath: revisionInputPath });
    recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, outputDir, draftPackage);
    const decision = decisionArtifact({
      decision: input.decision,
      reviewer,
      feedback,
      selectedDecisionIds,
      approvedAssumptionIds,
      draftDir,
      inputPath,
      outputDir,
      implementationAuthorized: false,
      nextAction: "Draft regenerated from human review feedback. Present the Review Console again."
    });
    const revisionRequest = {
      artifact_version: "1.0",
      source_scope: "human-review-revision-request",
      decision_id: decision.decision_id,
      reviewer,
      feedback,
      revision_material_id: material.id,
      updated_input_path: revisionInputPath,
      status: "draft_regenerated"
    };
    const paths = writeDecisionArtifacts(outputDir, decision, revisionRequest);
    return {
      status: "warning",
      decision: input.decision,
      draftDir,
      inputPath: revisionInputPath,
      outputDir,
      approvedInputPath: null,
      approvalArtifactPath: null,
      packageType: "draft_contract",
      implementationAuthorized: false,
      reviewDecisionPath: paths.reviewDecisionPath,
      revisionRequestPath: paths.revisionRequestPath,
      nextAction: decision.next_action,
      dataPlaneRunId: dataPlaneRun.run_id
    };
  }

  const decision = decisionArtifact({
    decision: input.decision,
    reviewer,
    feedback: input.feedback?.trim() || null,
    selectedDecisionIds,
    approvedAssumptionIds,
    draftDir,
    inputPath,
    outputDir: draftDir,
    implementationAuthorized: false,
    nextAction: "Draft rejected. Implementation remains blocked until a new intake or revision is submitted."
  });
  const paths = writeDecisionArtifacts(draftDir, decision);
  return {
    status: "warning",
    decision: input.decision,
    draftDir,
    inputPath,
    outputDir: draftDir,
    approvedInputPath: null,
    approvalArtifactPath: null,
    packageType: "rejected",
    implementationAuthorized: false,
    reviewDecisionPath: paths.reviewDecisionPath,
    revisionRequestPath: null,
    nextAction: decision.next_action
  };
}
