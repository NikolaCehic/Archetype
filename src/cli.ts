#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildPackageSummary } from "./agent-context/packageSummary";
import { readConsumerPlane } from "./consumer-plane";
import { runArchetypeCompiler } from "./core/pipeline";
import { createDraftApproval } from "./approval/draftApproval";
import { exportPackage } from "./output/exportPackage";
import { exportClarificationPackage } from "./output/exportClarificationPackage";
import { exportDraftPackage } from "./output/exportDraftPackage";
import { writeTargetFrontendSource } from "./output/writeTargetFrontend";
import { verifyTargetFrontendExecution } from "./output/verifyTargetFrontend";
import { updateRepairArtifactsFromLatest } from "./modules/revisionProtocol";
import { applyClarificationAnswer } from "./modules/clarificationUx";
import { assessContextGate } from "./modules/contextGate";
import { runLifecycle } from "./lifecycle/runLifecycle";
import { installAgentPlugins, type InstallTarget } from "./install/pluginInstaller";
import { runReleaseDoctor } from "./release/doctor";
import { validateExportedPackage } from "./quality/validatePackage";
import { simulateExportedPackage } from "./quality/simulatePackage";
import { createPhasePackage } from "./progressive";
import { submitReviewDecision, type ReviewDecisionKind } from "./review";
import {
  DataPlaneError,
  FileDataPlane,
  isDataPlaneError,
  mergeManifestArtifacts,
  queryDataPlaneArtifact,
  queryDataPlaneArtifacts,
  queryDataPlaneLifecycle,
  queryDataPlaneReplay,
  queryDataPlaneStatus,
  queryDataPlaneTimeline,
  recordClarificationPackage,
  recordCompiledPackage,
  recordExportedArtifacts
} from "./data-plane";
import type { DataPlaneArtifactType, DataPlaneEventType, DataPlanePhase } from "./data-plane";
import type { ArchetypeInput } from "./core/types";
import type { AgentContextPhaseId } from "./agent-context/phaseBundles";

type CommandStatus = "success" | "warning" | "error";

const VALID_COMMANDS = new Set(["doctor", "install", "init", "run", "generate", "review", "approve-draft", "answer-clarification", "validate", "summarize", "next-action", "phase-package", "simulate", "write-target", "verify-target", "repair", "data-plane"]);
const TEMPLATE_FILES: Record<string, string> = {
  "saas-dashboard": "saas-dashboard-intake.json",
  fintech: "fintech-intake.json",
  "marketplace-admin": "marketplace-admin-intake.json"
};

function usage(exitCode = 1): never {
  console.log("Archetype generates frontend implementation contracts for AI coding agents.");
  console.log("");
  console.log("Usage:");
  console.log("  archetype doctor");
  console.log("  archetype install [--target codex|claude|all] [--home <dir>] [--dry-run] [--json]");
  console.log("  archetype init --out <intake.json> [--template saas-dashboard|fintech|marketplace-admin] [--force]");
  console.log("  archetype run \"<brief>\" [--out <output-dir>] [--intake <intake.json>] [--material <path>] [--force]");
  console.log("  archetype run --intake <intake.json> --out <output-dir> --question-id <id> --answer <text> [--force]");
  console.log("  archetype run --intake <intake.json> --out <output-dir> --approve --approved-by <name> [--force]");
  console.log("  archetype generate --input <intake.json> --out <output-dir> [--force]");
  console.log("  archetype review --draft <draft-output-dir> --input <intake.json> --decision approve|request_changes|reject --reviewer <name> [--feedback <text>] [--out <output-dir>] [--approved-input <approved-intake.json>] [--force]");
  console.log("  archetype approve-draft --draft <draft-output-dir> --input <intake.json> --out <approved-intake.json> --approved-by <name> [--force]");
  console.log("  archetype answer-clarification --input <intake.json> --out <next-intake.json> --question-id <id> --answer <text> [--answered-by <name>]");
  console.log("  archetype validate --out <output-dir>");
  console.log("  archetype summarize --out <output-dir> [--compact]");
  console.log("  archetype next-action --out <output-dir>");
  console.log("  archetype phase-package --out <output-dir> --phase <phase> --target <phase-output-dir> [--force]");
  console.log("  archetype simulate --out <output-dir>");
  console.log("  archetype write-target --out <output-dir> --target <target-dir> [--force]");
  console.log("  archetype verify-target --out <output-dir> --target <target-dir> [--skip-install]");
  console.log("  archetype repair --out <output-dir> [--target <target-dir>]");
  console.log("  archetype data-plane status --out <output-dir> [--json]");
  console.log("  archetype data-plane timeline --out <output-dir> --run <run-id> [--json]");
  console.log("  archetype data-plane artifacts --out <output-dir> --run <run-id> [--phase <phase>] [--type <type>] [--priority <hot|warm|cold>] [--limit <n>] [--json]");
  console.log("  archetype data-plane read-artifact --out <output-dir> --artifact <artifact-id> [--run <run-id>] [--json]");
  console.log("  archetype data-plane lifecycle --out <output-dir> --run <run-id> [--json]");
  console.log("  archetype data-plane replay --out <output-dir> --run <run-id> [--json]");
  console.log("");
  console.log("Add --json to return parseable command results.");
  process.exit(exitCode);
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getArgs(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1]);
  }
  return values;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function positionalBrief(): string | undefined {
  const args = process.argv.slice(3);
  const flagsWithValues = new Set([
    "--intake",
    "--input",
    "--out",
    "--material",
    "--question-id",
    "--answer",
    "--approved-by",
    "--approved-input",
    "--approved-assumption-ids",
    "--draft",
    "--decision",
    "--reviewer",
    "--feedback",
    "--project-name"
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value.startsWith("--")) {
      if (flagsWithValues.has(value)) index += 1;
      continue;
    }
    return value;
  }
  return undefined;
}

function getNumberArg(name: string): number | undefined {
  const value = getArg(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getDataPlanePhaseArg(name: string): DataPlanePhase | undefined {
  const value = getArg(name);
  return value ? value as DataPlanePhase : undefined;
}

function getDataPlaneEventTypeArg(name: string): DataPlaneEventType | undefined {
  const value = getArg(name);
  return value ? value as DataPlaneEventType : undefined;
}

function getDataPlaneArtifactTypeArg(name: string): DataPlaneArtifactType | undefined {
  const value = getArg(name);
  return value ? value as DataPlaneArtifactType : undefined;
}

function writeJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function commandStatus(blockers: string[], warnings: string[]): CommandStatus {
  if (blockers.length > 0 || warnings.length > 0) return "warning";
  return "success";
}

function artifactType(filePath: string): "json" | "markdown" | "text" {
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".md")) return "markdown";
  return "text";
}

function dataPlaneForOutput(outputDir: string): FileDataPlane {
  return new FileDataPlane({ rootDir: path.join(outputDir, "data-plane") });
}

function dataPlaneRootForOutput(outputDir: string): string {
  return path.join(outputDir, "data-plane");
}

function packageRoot(): string {
  return path.resolve(__dirname, "..");
}

function installTarget(): InstallTarget {
  const target = getArg("--target") ?? "all";
  if (target === "codex" || target === "claude" || target === "all") return target;
  throw new Error(`Unknown install target "${target}". Expected codex, claude, or all.`);
}

function templatePath(template: string): string {
  const fileName = TEMPLATE_FILES[template];
  if (!fileName) {
    throw new Error(`Unknown template "${template}". Expected one of: ${Object.keys(TEMPLATE_FILES).join(", ")}.`);
  }
  return path.join(packageRoot(), "examples", fileName);
}

function resultOutput(result: unknown, jsonMode: boolean, humanLines: string[]): void {
  if (jsonMode) {
    writeJson(result);
    return;
  }
  for (const line of humanLines) console.log(line);
}

function errorExit(message: string, jsonMode: boolean): never {
  if (jsonMode) {
    writeJson({ status: "error", message });
  } else {
    console.error(message);
  }
  process.exit(1);
}

function dataPlaneErrorExit(error: unknown, jsonMode: boolean): never {
  if (isDataPlaneError(error) && jsonMode) {
    writeJson({
      status: "error",
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    process.exit(1);
  }
  errorExit(error instanceof Error ? error.message : String(error), jsonMode);
}

function initCommand(jsonMode: boolean): void {
  const outPath = path.resolve(getArg("--out") ?? "archetype.intake.json");
  const template = getArg("--template") ?? "saas-dashboard";
  if (existsSync(outPath) && !hasFlag("--force")) {
    errorExit(`Intake file already exists: ${outPath}. Use --force to overwrite.`, jsonMode);
  }

  const sourcePath = templatePath(template);
  const intake = readJson<ArchetypeInput>(sourcePath);
  writeFileSync(outPath, `${JSON.stringify(intake, null, 2)}\n`);

  const result = {
    status: "success",
    intakePath: outPath,
    template,
    missingInputs: [],
    riskFlags: [],
    nextCommand: `archetype generate --input ${outPath} --out archetype-output`
  };
  resultOutput(result, jsonMode, [
    `Archetype intake created: ${outPath}`,
    `Template: ${template}`,
    `Next: ${result.nextCommand}`
  ]);
}

function generateCommand(jsonMode: boolean): void {
  const inputPath = getArg("--input");
  const outDir = getArg("--out");
  if (!inputPath || !outDir) usage();

  const absoluteInput = path.resolve(inputPath);
  const absoluteOut = path.resolve(outDir);
  const force = hasFlag("--force");
  const input = readJson<ArchetypeInput>(absoluteInput);
  const contextGate = assessContextGate(input);

  if (contextGate.status === "needs_clarification") {
    const clarificationPackage = exportClarificationPackage(input, contextGate, absoluteOut, absoluteInput, { force });
    const dataPlaneRun = recordClarificationPackage(dataPlaneForOutput(absoluteOut), input, contextGate, clarificationPackage, {
      outputDir: absoluteOut,
      sourcePath: absoluteInput
    });
    const artifacts = clarificationPackage.artifacts.map((artifact) => ({
      id: artifact.id,
      path: path.join(absoluteOut, artifact.path),
      type: artifact.type,
      required: artifact.required
    }));
    const result = {
      status: "warning" as const,
      outputDir: absoluteOut,
      packageType: "clarification",
      readinessScore: clarificationPackage.readiness.score,
      readinessTier: clarificationPackage.readiness.readinessTier,
      readyForFrontendAgent: false,
      blockers: contextGate.blockers,
      warnings: contextGate.warnings,
      nextQuestion: contextGate.questions[0]?.question ?? null,
      dataPlaneRunId: dataPlaneRun.run_id,
      artifacts
    };

    resultOutput(result, jsonMode, [
      `Archetype clarification package generated: ${absoluteOut}`,
      "Full contract package generated: false",
      `Readiness score: ${clarificationPackage.readiness.score}`,
      `Readiness tier: ${clarificationPackage.readiness.readinessTier}`,
      "Ready for frontend agent: false",
      ...(contextGate.questions[0] ? [`Next question: ${contextGate.questions[0].question}`] : []),
      "Blockers:",
      ...contextGate.blockers.map((blocker) => `- ${blocker}`)
    ]);
    return;
  }

  const compiled = runArchetypeCompiler(input, {
    sourcePath: absoluteInput,
    outputDir: absoluteOut
  });

  if (compiled.manifest.implementation_authorized !== true) {
    const draftPackage = exportDraftPackage(compiled, absoluteOut, { force });
    const dataPlane = dataPlaneForOutput(absoluteOut);
    const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, {
      outputDir: absoluteOut,
      sourcePath: absoluteInput
    });
    recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, absoluteOut, draftPackage);
    const artifacts = draftPackage.artifacts.map((artifact) => ({
      id: artifact.id,
      path: path.join(absoluteOut, artifact.path),
      type: artifact.type,
      required: artifact.required
    }));
    const blockers = compiled.quality.readiness.blockers;
    const warnings = compiled.quality.readiness.warnings;
    const result = {
      status: "warning" as const,
      outputDir: absoluteOut,
      packageType: "draft_contract",
      readinessScore: compiled.quality.readiness.score,
      readinessTier: "ready_for_contract_approval",
      readyForFrontendAgent: false,
      blockers,
      warnings,
      dataPlaneRunId: dataPlaneRun.run_id,
      artifacts
    };

    resultOutput(result, jsonMode, [
      `Archetype draft contract package generated: ${absoluteOut}`,
      "Canonical spec generated: false",
      `Readiness score: ${compiled.quality.readiness.score}`,
      "Readiness tier: ready_for_contract_approval",
      "Ready for frontend agent: false",
      ...(blockers.length > 0 ? ["Blockers:", ...blockers.map((blocker) => `- ${blocker}`)] : []),
      ...(warnings.length > 0 ? ["Warnings:", ...warnings.map((warning) => `- ${warning}`)] : [])
    ]);
    return;
  }

  exportPackage(compiled, absoluteOut, { force });
  const topManifest = readJson<{
    artifacts?: Array<{ id?: string; path: string; type?: string; required?: boolean }>;
  }>(path.join(absoluteOut, "manifest.json"));
  const dataPlane = dataPlaneForOutput(absoluteOut);
  const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, {
    outputDir: absoluteOut,
    sourcePath: absoluteInput
  });
  recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, absoluteOut, {
    artifacts: mergeManifestArtifacts(topManifest.artifacts ?? [], compiled.manifest.artifact_index),
    manifest: topManifest
  });
  const artifacts = (topManifest.artifacts ?? []).map((artifact) => ({
    id: artifact.id,
    path: path.join(absoluteOut, artifact.path),
    type: artifact.type ?? artifactType(artifact.path),
    required: artifact.required ?? true
  }));
  const blockers = compiled.quality.readiness.blockers;
  const warnings = compiled.quality.readiness.warnings;
  const result = {
    status: commandStatus(blockers, warnings),
    outputDir: absoluteOut,
    readinessScore: compiled.quality.readiness.score,
    readinessTier: compiled.manifest.readiness_tier,
    readyForFrontendAgent: compiled.quality.readiness.readyForFrontendAgent,
    blockers,
    warnings,
    dataPlaneRunId: dataPlaneRun.run_id,
    artifacts
  };

  resultOutput(result, jsonMode, [
    `Archetype package generated: ${absoluteOut}`,
    `Readiness score: ${compiled.quality.readiness.score}`,
    `Readiness tier: ${compiled.manifest.readiness_tier}`,
    `Ready for frontend agent: ${compiled.quality.readiness.readyForFrontendAgent}`,
    ...(blockers.length > 0 ? ["Blockers:", ...blockers.map((blocker) => `- ${blocker}`)] : []),
    ...(warnings.length > 0 ? ["Warnings:", ...warnings.map((warning) => `- ${warning}`)] : [])
  ]);
}

function approveDraftCommand(jsonMode: boolean): void {
  const draftDir = getArg("--draft");
  const inputPath = getArg("--input");
  const outPath = getArg("--out");
  const approvedBy = getArg("--approved-by");
  if (!draftDir || !inputPath || !outPath || !approvedBy) usage();

  const absoluteInput = path.resolve(inputPath);
  const absoluteOut = path.resolve(outPath);
  if (existsSync(absoluteOut) && !hasFlag("--force")) {
    errorExit(`Approved intake already exists: ${absoluteOut}. Use --force to overwrite.`, jsonMode);
  }
  const intake = readJson<ArchetypeInput>(absoluteInput);
  const approvedAssumptionIds = (getArg("--approved-assumption-ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const result = createDraftApproval({
    intake,
    intakePath: absoluteInput,
    draftDir: path.resolve(draftDir),
    approvedInputPath: absoluteOut,
    approvedBy,
    approvedAt: getArg("--approved-at"),
    approvedAssumptionIds
  });

  const output = {
    status: "success" as const,
    approvedInputPath: absoluteOut,
    approvalArtifactPath: result.approvalArtifactPath,
    draftPackageId: result.approvalProof.draft_package_id,
    sourceHash: result.approvalProof.draft_source_hash,
    packageChecksum: result.approvalProof.draft_package_checksum,
    approvalDigest: result.approvalProof.approval_digest,
    artifactRefs: result.approvalProof.approved_artifact_refs
  };
  resultOutput(output, jsonMode, [
    `Archetype draft approved: ${absoluteOut}`,
    `Approval proof: ${result.approvalArtifactPath}`,
    `Draft package: ${result.approvalProof.draft_package_id}`,
    `Source hash: ${result.approvalProof.draft_source_hash}`
  ]);
}

function reviewDecisionArg(value: string | undefined): ReviewDecisionKind {
  if (value === "approve" || value === "request_changes" || value === "reject") return value;
  throw new Error('Review --decision must be one of "approve", "request_changes", or "reject".');
}

function reviewCommand(jsonMode: boolean): void {
  const draftDir = getArg("--draft");
  const inputPath = getArg("--input");
  const reviewer = getArg("--reviewer") ?? getArg("--approved-by");
  const decision = reviewDecisionArg(getArg("--decision"));
  if (!draftDir || !inputPath || !reviewer) usage();
  const approvedAssumptionIds = (getArg("--approved-assumption-ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const result = submitReviewDecision({
    draftDir,
    inputPath,
    outputDir: getArg("--out"),
    approvedInputPath: getArg("--approved-input"),
    decision,
    reviewer,
    feedback: getArg("--feedback"),
    approvedAssumptionIds,
    force: hasFlag("--force") || hasFlag("--overwrite")
  });
  resultOutput(result, jsonMode, [
    `Archetype review decision: ${result.decision}`,
    `Package type: ${result.packageType}`,
    `Output: ${result.outputDir}`,
    `Implementation authorized: ${result.implementationAuthorized}`,
    `Next action: ${result.nextAction}`
  ]);
}

function answerClarificationCommand(jsonMode: boolean): void {
  const inputPath = getArg("--input");
  const outPath = getArg("--out");
  const questionId = getArg("--question-id");
  const answer = getArg("--answer");
  const answeredBy = getArg("--answered-by") ?? "user";
  if (!inputPath || !outPath || !questionId || !answer) usage();

  const absoluteInput = path.resolve(inputPath);
  const absoluteOut = path.resolve(outPath);
  const input = readJson<ArchetypeInput>(absoluteInput);
  const applied = applyClarificationAnswer({
    intake: input,
    questionId,
    answer,
    answeredBy
  });
  writeFileSync(absoluteOut, `${JSON.stringify(applied.updatedInput, null, 2)}\n`);
  const result = {
    status: applied.status,
    inputPath: absoluteInput,
    outputPath: absoluteOut,
    answeredQuestion: applied.answeredQuestion?.question ?? null,
    answeredQuestionId: applied.answeredQuestion?.id ?? questionId,
    contextStatus: applied.contextStatus,
    readinessTier: applied.readinessTier,
    nextQuestion: applied.nextQuestion?.question ?? null,
    nextQuestionId: applied.nextQuestion?.id ?? null,
    clarificationTurn: applied.clarificationTurn
  };

  resultOutput(result, jsonMode, [
    `Archetype clarification answer applied: ${absoluteOut}`,
    `Context status: ${applied.contextStatus}`,
    `Readiness tier: ${applied.readinessTier}`,
    ...(applied.nextQuestion ? [`Next question: ${applied.nextQuestion.question}`] : ["Next question: none"])
  ]);
}

function runLifecycleCommand(jsonMode: boolean): void {
  const result = runLifecycle({
    brief: positionalBrief(),
    inputPath: getArg("--intake") ?? getArg("--input"),
    outputDir: getArg("--out"),
    materialPaths: getArgs("--material"),
    questionId: getArg("--question-id"),
    answer: getArg("--answer"),
    approve: hasFlag("--approve"),
    approvedBy: getArg("--approved-by"),
    approvedInputPath: getArg("--approved-input"),
    approvedAssumptionIds: (getArg("--approved-assumption-ids") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    projectName: getArg("--project-name"),
    overwrite: hasFlag("--force") || hasFlag("--overwrite"),
    host: "cli"
  });

  resultOutput(result, jsonMode, [
    `Archetype lifecycle run: ${result.packageType}`,
    `Output: ${result.outputDir}`,
    `Input: ${result.inputPath}`,
    `Readiness tier: ${result.readinessTier}`,
    `Ready for frontend agent: ${result.readyForFrontendAgent}`,
    `Next action: ${result.nextAction.summary}`,
    ...(result.nextQuestion ? [`Question: ${result.nextQuestion}`] : []),
    ...(result.designSystemPreviewPath ? [`Design-system preview: ${result.designSystemPreviewPath}`] : []),
    ...(result.blockers.length > 0 ? ["Blockers:", ...result.blockers.map((blocker) => `- ${blocker}`)] : []),
    ...(result.warnings.length > 0 ? ["Warnings:", ...result.warnings.map((warning) => `- ${warning}`)] : [])
  ]);
}

function dataPlaneCommand(jsonMode: boolean): void {
  const action = process.argv[3];
  const outDir = getArg("--out");
  if (!action) usage();
  if (!outDir) {
    dataPlaneErrorExit(new DataPlaneError("INVALID_DATA_PLANE_ARGUMENT", "data-plane commands require --out <output-dir>.", { operation: action }), jsonMode);
  }
  const outputDir = path.resolve(outDir);
  const dataPlane = dataPlaneForOutput(outputDir);
  const dataPlaneRoot = dataPlaneRootForOutput(outputDir);
  try {
    if (action === "status") {
      const result = queryDataPlaneStatus(dataPlane, outputDir, dataPlaneRoot);
      resultOutput(result, jsonMode, [
        `Agent Data Plane: ${dataPlaneRoot}`,
        `Runs: ${result.runCount}`,
        `Latest run: ${result.latestRunId ?? "none"}`
      ]);
      return;
    }
    if (action === "timeline") {
      const result = queryDataPlaneTimeline(dataPlane, outputDir, getArg("--run"), {
        phase: getDataPlanePhaseArg("--phase"),
        type: getDataPlaneEventTypeArg("--type"),
        limit: getNumberArg("--limit")
      });
      resultOutput(result, jsonMode, [
        `Run: ${result.runId}`,
        `Events: ${result.eventCount}`,
        ...result.timeline.map((item) => `${item.sequence}. ${item.type} [${item.phase}] ${item.summary}`)
      ]);
      return;
    }
    if (action === "artifacts") {
      const result = queryDataPlaneArtifacts(dataPlane, outputDir, getArg("--run"), {
        phase: getDataPlanePhaseArg("--phase"),
        type: getDataPlaneArtifactTypeArg("--type"),
        readPriority: getArg("--priority"),
        limit: getNumberArg("--limit")
      });
      resultOutput(result, jsonMode, [
        `Run: ${result.runId}`,
        `Artifacts: ${result.artifactCount}`,
        ...result.artifacts.map((artifact) => `${artifact.artifact_id} ${artifact.ref.path}`)
      ]);
      return;
    }
    if (action === "read-artifact") {
      const result = queryDataPlaneArtifact(dataPlane, outputDir, getArg("--artifact"), getArg("--run"));
      resultOutput(result, jsonMode, [
        `Artifact: ${result.artifact.artifact_id}`,
        `Run: ${result.runId}`,
        `Path: ${result.artifact.ref.path}`,
        `SHA-256: ${result.artifact.ref.sha256 ?? "none"}`
      ]);
      return;
    }
    if (action === "lifecycle") {
      const result = queryDataPlaneLifecycle(dataPlane, outputDir, getArg("--run"));
      resultOutput(result, jsonMode, [
        `Run: ${result.runId}`,
        `Lifecycle checksum: ${result.lifecycle.checksum}`,
        `Readiness checksum: ${result.readiness?.checksum ?? "none"}`,
        `Projection consistency: ${result.projectionConsistency.matches ? "pass" : "fail"}`
      ]);
      return;
    }
    if (action === "replay") {
      const result = queryDataPlaneReplay(dataPlane, outputDir, getArg("--run"));
      resultOutput(result, jsonMode, [
        `Run: ${result.runId}`,
        `Events: ${result.replay.events.length}`,
        `Artifacts: ${result.replay.artifacts.length}`,
        `Timeline: ${result.replay.timeline.length}`
      ]);
      return;
    }
    dataPlaneErrorExit(new DataPlaneError("INVALID_DATA_PLANE_ARGUMENT", `Unknown data-plane command "${action}".`, { operation: action }), jsonMode);
  } catch (error) {
    dataPlaneErrorExit(error, jsonMode);
  }
}

async function main(): Promise<void> {
  if (hasFlag("--help") || hasFlag("-h")) usage(0);
  if (hasFlag("--version") || hasFlag("-v")) {
    const pkg = readJson<{ version: string }>(path.join(packageRoot(), "package.json"));
    console.log(pkg.version);
    return;
  }

  const command = process.argv[2];
  const jsonMode = hasFlag("--json");
  if (!command || !VALID_COMMANDS.has(command)) usage();

  if (command === "doctor") {
    const result = runReleaseDoctor(packageRoot());
    resultOutput(result, jsonMode, [
      `Archetype release readiness: ${result.status}`,
      `Package: ${result.package_name}@${result.package_version}`,
      `Mode: ${result.package_mode}`,
      "Current package quickstart:",
      ...result.quickstart.published_package.map((line) => `- ${line}`),
      "Plugin front doors:",
      `- Claude Code: ${result.plugin_setup.claude_code.front_door}`,
      `- Codex: ${result.plugin_setup.codex.front_door}`,
      ...(result.blockers.length > 0 ? ["Blockers:", ...result.blockers.map((blocker) => `- ${blocker}`)] : []),
      ...(result.warnings.length > 0 ? ["Warnings:", ...result.warnings.map((warning) => `- ${warning}`)] : [])
    ]);
    if (result.status === "fail") process.exit(1);
    return;
  }

  if (command === "install") {
    const result = installAgentPlugins({
      target: installTarget(),
      packageRoot: packageRoot(),
      homeDir: getArg("--home"),
      dryRun: hasFlag("--dry-run"),
      force: hasFlag("--force")
    });
    resultOutput(result, jsonMode, [
      `Archetype plugin install: ${result.status}`,
      `Targets: ${result.targets.join(", ")}`,
      `Home: ${result.home_dir}`,
      ...(result.dry_run ? ["Dry run: no files were written."] : []),
      "Front doors:",
      `- Codex: ${result.front_doors.codex}`,
      `- Claude Code: ${result.front_doors.claude_code}`,
      ...(result.blockers.length > 0 ? ["Blockers:", ...result.blockers.map((blocker) => `- ${blocker}`)] : []),
      ...(result.warnings.length > 0 ? ["Warnings:", ...result.warnings.map((warning) => `- ${warning}`)] : []),
      "Next:",
      ...result.next_steps.map((step) => `- ${step}`)
    ]);
    if (result.status === "fail") process.exit(1);
    return;
  }

  if (command === "init") {
    initCommand(jsonMode);
    return;
  }

  if (command === "run") {
    runLifecycleCommand(jsonMode);
    return;
  }

  if (command === "data-plane") {
    dataPlaneCommand(jsonMode);
    return;
  }

  if (command === "approve-draft") {
    approveDraftCommand(jsonMode);
    return;
  }

  if (command === "review") {
    reviewCommand(jsonMode);
    return;
  }

  if (command === "validate") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    const result = validateExportedPackage(path.resolve(outDir));
    writeJson(result);
    if (result.status === "fail") process.exit(1);
    return;
  }

  if (command === "answer-clarification") {
    answerClarificationCommand(jsonMode);
    return;
  }

  if (command === "summarize") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    const result = buildPackageSummary(path.resolve(outDir), hasFlag("--compact") ? "compact" : "compat");
    writeJson(result);
    if (result.status === "error") process.exit(1);
    return;
  }

  if (command === "next-action") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    writeJson(readConsumerPlane(path.resolve(outDir)));
    return;
  }

  if (command === "phase-package") {
    const outDir = getArg("--out");
    const targetDir = getArg("--target");
    const phase = getArg("--phase") as AgentContextPhaseId | undefined;
    if (!outDir || !targetDir || !phase) usage();
    writeJson(createPhasePackage({
      sourceOutputDir: path.resolve(outDir),
      targetDir: path.resolve(targetDir),
      phaseId: phase,
      force: hasFlag("--force")
    }));
    return;
  }

  if (command === "simulate") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    const result = simulateExportedPackage(path.resolve(outDir));
    writeJson(result);
    if (result.status === "fail") process.exit(1);
    return;
  }

  if (command === "write-target") {
    const outDir = getArg("--out");
    const targetDir = getArg("--target");
    if (!outDir || !targetDir) usage();
    const result = writeTargetFrontendSource(path.resolve(outDir), path.resolve(targetDir), {
      force: process.argv.includes("--force")
    });
    writeJson(result);
    if (result.status === "fail") process.exit(1);
    return;
  }

  if (command === "verify-target") {
    const outDir = getArg("--out");
    const targetDir = getArg("--target");
    if (!outDir || !targetDir) usage();
    const result = verifyTargetFrontendExecution(path.resolve(outDir), path.resolve(targetDir), {
      skipInstall: process.argv.includes("--skip-install")
    });
    writeJson(result);
    if (result.status === "fail") process.exit(1);
    return;
  }

  if (command === "repair") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    const targetDir = getArg("--target");
    const result = updateRepairArtifactsFromLatest(
      path.resolve(outDir),
      targetDir ? path.resolve(targetDir) : null
    );
    writeJson(result);
    return;
  }

  generateCommand(jsonMode);
}

main().catch((error) => {
  const jsonMode = hasFlag("--json");
  errorExit(error instanceof Error ? error.message : String(error), jsonMode);
  process.exit(1);
});
