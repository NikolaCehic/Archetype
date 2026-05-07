#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runArchetypeCompiler } from "./core/pipeline";
import { exportPackage } from "./output/exportPackage";
import { exportClarificationPackage } from "./output/exportClarificationPackage";
import { exportDraftPackage } from "./output/exportDraftPackage";
import { writeTargetFrontendSource } from "./output/writeTargetFrontend";
import { verifyTargetFrontendExecution } from "./output/verifyTargetFrontend";
import { updateRepairArtifactsFromLatest } from "./modules/revisionProtocol";
import { applyClarificationAnswer } from "./modules/clarificationUx";
import { assessContextGate } from "./modules/contextGate";
import { installAgentPlugins, type InstallTarget } from "./install/pluginInstaller";
import { runReleaseDoctor } from "./release/doctor";
import { validateExportedPackage } from "./quality/validatePackage";
import { simulateExportedPackage } from "./quality/simulatePackage";
import {
  DataPlaneError,
  FileDataPlane,
  isDataPlaneError,
  mergeManifestArtifacts,
  queryDataPlaneArtifact,
  queryDataPlaneArtifacts,
  queryDataPlaneReplay,
  queryDataPlaneStatus,
  queryDataPlaneTimeline,
  recordClarificationPackage,
  recordCompiledPackage,
  recordExportedArtifacts
} from "./data-plane";
import type { ArchetypeInput } from "./core/types";

type CommandStatus = "success" | "warning" | "error";

const VALID_COMMANDS = new Set(["doctor", "install", "init", "generate", "answer-clarification", "validate", "summarize", "simulate", "write-target", "verify-target", "repair", "data-plane"]);
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
  console.log("  archetype generate --input <intake.json> --out <output-dir>");
  console.log("  archetype answer-clarification --input <intake.json> --out <next-intake.json> --question-id <id> --answer <text> [--answered-by <name>]");
  console.log("  archetype validate --out <output-dir>");
  console.log("  archetype summarize --out <output-dir>");
  console.log("  archetype simulate --out <output-dir>");
  console.log("  archetype write-target --out <output-dir> --target <target-dir> [--force]");
  console.log("  archetype verify-target --out <output-dir> --target <target-dir> [--skip-install]");
  console.log("  archetype repair --out <output-dir> [--target <target-dir>]");
  console.log("  archetype data-plane status --out <output-dir> [--json]");
  console.log("  archetype data-plane timeline --out <output-dir> --run <run-id> [--json]");
  console.log("  archetype data-plane artifacts --out <output-dir> --run <run-id> [--json]");
  console.log("  archetype data-plane read-artifact --out <output-dir> --artifact <artifact-id> [--run <run-id>] [--json]");
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

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
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
  const input = readJson<ArchetypeInput>(absoluteInput);
  const contextGate = assessContextGate(input);

  if (contextGate.status === "needs_clarification") {
    const clarificationPackage = exportClarificationPackage(input, contextGate, absoluteOut, absoluteInput);
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
    const draftPackage = exportDraftPackage(compiled, absoluteOut);
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

  exportPackage(compiled, absoluteOut);
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
      const result = queryDataPlaneTimeline(dataPlane, outputDir, getArg("--run"));
      resultOutput(result, jsonMode, [
        `Run: ${result.runId}`,
        `Events: ${result.eventCount}`,
        ...result.timeline.map((item) => `${item.sequence}. ${item.type} [${item.phase}] ${item.summary}`)
      ]);
      return;
    }
    if (action === "artifacts") {
      const result = queryDataPlaneArtifacts(dataPlane, outputDir, getArg("--run"));
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

function summarizePackage(outputDir: string): Record<string, unknown> {
  const topManifest = readJson<{
    packageType?: string;
    productName?: string;
    readinessScore?: number;
    readinessTier?: string;
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(path.join(outputDir, "manifest.json"));
  const isDraft = topManifest.packageType === "draft_contract";
  const productModel = isDraft
    ? readJson<{ product_model?: { product_name?: string; product_type?: string; product_category?: string } }>(path.join(outputDir, "draft", "product-model.draft.json")).product_model ?? {}
    : readJson<{ product_name?: string; product_type?: string; product_category?: string }>(path.join(outputDir, "product", "product-model.json"));
  const draftExperience = isDraft
    ? readJson<{ routes?: Array<{ route?: string; screen_id?: string }>; screens?: Array<{ screen_id?: string; route?: string; states?: Record<string, { required?: boolean }> }> }>(path.join(outputDir, "draft", "experience-architecture.draft.json"))
    : null;
  const routeMap = isDraft
    ? { routes: draftExperience?.routes ?? [] }
    : readJson<{ routes?: Array<{ route?: string; screen_id?: string }> }>(path.join(outputDir, "experience", "route-map.json"));
  const screenInventory = isDraft
    ? {
      screens: (draftExperience?.screens ?? []).map((screen) => ({
        ...screen,
        required_states: Object.entries(screen.states ?? {})
          .filter(([, state]) => state.required === true)
          .map(([state]) => state)
      }))
    }
    : readJson<{ screens?: Array<{ screen_id?: string; route?: string; required_states?: string[] }> }>(path.join(outputDir, "screens", "screen-inventory.json"));

  const routes = routeMap.routes ?? [];
  const screens = screenInventory.screens ?? [];
  const requiredStates = [
    ...new Set(screens.flatMap((screen) => screen.required_states ?? []))
  ].sort();

  return {
    status: commandStatus(topManifest.blockers ?? [], topManifest.warnings ?? []),
    outputDir,
    product: productModel.product_name ?? topManifest.productName ?? "Unknown product",
    productType: productModel.product_type ?? "Unknown product type",
    productCategory: productModel.product_category ?? "Unknown category",
    routes: routes.length,
    screens: screens.length,
    routeMap: routes.map((route) => ({ route: route.route, screenId: route.screen_id })),
    requiredStates,
    readinessScore: topManifest.readinessScore ?? 0,
    readinessTier: topManifest.readinessTier ?? "unknown",
    readyForFrontendAgent: topManifest.readyForFrontendAgent ?? false,
    blockers: topManifest.blockers ?? [],
    warnings: topManifest.warnings ?? [],
    entrypoints: [
      "lifecycle/start-request.json",
      "lifecycle/context-completion.json",
      "lifecycle/context-matrix.json",
      "lifecycle/readiness-tiers.json",
      "lifecycle/implementation-phases.json",
      "lifecycle/clarification-turn.json",
      "lifecycle/clarification-state.json",
      "lifecycle/clarification-transcript.md",
      "lifecycle/approval-request.md",
      "lifecycle/approval-decision.json",
      "01-evidence/evidence-ledger.json",
      "01-evidence/missing-context.md",
      ...(isDraft ? [
        "lifecycle/contract-state.json",
        "draft/product-model.draft.json",
        "draft/experience-architecture.draft.json",
        "draft/design-system.draft.json",
        "draft/design-system-preview.html",
        "draft/design-system-review.md",
        "draft/frontend-contract.draft.json",
        "draft/assumption-ledger.md",
        "draft/contract-approval-request.json"
      ] : []),
      "governance/non-negotiable-principles.json",
      "governance/evidence-decision-model.json",
      "governance/forbidden-behaviors.json",
      "governance/convergence-standard.json",
      "governance/frontend-practice-skills.json",
      "lifecycle/lifecycle-report.md",
      ...(!isDraft ? [
        "lifecycle/contract-state.json",
        "lifecycle/execution-state.json",
        "lifecycle/final-readiness-report.md",
        "draft/design-system-preview.html",
        "draft/design-system-review.md",
        "spec/archetype-spec.md",
        "spec/archetype-spec.json",
        "test-first/test-first-contract.json",
        "test-first/test-first-plan.md",
        "test-first/test-quality-standard.json",
        "test-results/initial-red-test-run.md",
        "verification/playwright-verification-contract.json",
        "verification/playwright-evidence.json",
        "qa/scenario-catalog.json",
        "qa/playwright-results.json",
        "qa/malformed-data-results.json",
        "qa/accessibility-results.md",
        "qa/visual-regression-report.md",
        "qa/contract-drift-report.md",
        "reviews/specialist-review-summary.md",
        "10-revision/repair-task-queue.json",
        "10-revision/repair-plan.md",
        "AGENTS.md",
        "CLAUDE.md",
        "implementation-contract.md",
        "verification-plan.md"
      ] : []),
      "manifest.json"
    ]
  };
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

  if (command === "data-plane") {
    dataPlaneCommand(jsonMode);
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
    const result = summarizePackage(path.resolve(outDir));
    writeJson(result);
    if (result.status === "error") process.exit(1);
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
