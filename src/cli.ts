#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runArchetypeCompiler } from "./core/pipeline";
import { exportPackage } from "./output/exportPackage";
import { writeTargetFrontendSource } from "./output/writeTargetFrontend";
import { verifyTargetFrontendExecution } from "./output/verifyTargetFrontend";
import { updateRepairArtifactsFromLatest } from "./modules/revisionProtocol";
import { installAgentPlugins, type InstallTarget } from "./install/pluginInstaller";
import { runReleaseDoctor } from "./release/doctor";
import { validateExportedPackage } from "./quality/validatePackage";
import { simulateExportedPackage } from "./quality/simulatePackage";
import type { ArchetypeInput } from "./core/types";

type CommandStatus = "success" | "warning" | "error";

const VALID_COMMANDS = new Set(["doctor", "install", "init", "generate", "validate", "summarize", "simulate", "write-target", "verify-target", "repair"]);
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
  console.log("  archetype validate --out <output-dir>");
  console.log("  archetype summarize --out <output-dir>");
  console.log("  archetype simulate --out <output-dir>");
  console.log("  archetype write-target --out <output-dir> --target <target-dir> [--force]");
  console.log("  archetype verify-target --out <output-dir> --target <target-dir> [--skip-install]");
  console.log("  archetype repair --out <output-dir> [--target <target-dir>]");
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
  const compiled = runArchetypeCompiler(input, {
    sourcePath: absoluteInput,
    outputDir: absoluteOut
  });

  exportPackage(compiled, absoluteOut);
  const topManifest = readJson<{
    artifacts?: Array<{ id: string; path: string; type?: string; required?: boolean }>;
  }>(path.join(absoluteOut, "manifest.json"));
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
    readyForFrontendAgent: compiled.quality.readiness.readyForFrontendAgent,
    blockers,
    warnings,
    artifacts
  };

  resultOutput(result, jsonMode, [
    `Archetype package generated: ${absoluteOut}`,
    `Readiness score: ${compiled.quality.readiness.score}`,
    `Ready for frontend agent: ${compiled.quality.readiness.readyForFrontendAgent}`,
    ...(blockers.length > 0 ? ["Blockers:", ...blockers.map((blocker) => `- ${blocker}`)] : []),
    ...(warnings.length > 0 ? ["Warnings:", ...warnings.map((warning) => `- ${warning}`)] : [])
  ]);
}

function summarizePackage(outputDir: string): Record<string, unknown> {
  const topManifest = readJson<{
    productName?: string;
    readinessScore?: number;
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(path.join(outputDir, "manifest.json"));
  const productModel = readJson<{
    product_name?: string;
    product_type?: string;
    product_category?: string;
  }>(path.join(outputDir, "product", "product-model.json"));
  const routeMap = readJson<{ routes?: Array<{ route?: string; screen_id?: string }> }>(
    path.join(outputDir, "experience", "route-map.json")
  );
  const screenInventory = readJson<{
    screens?: Array<{ screen_id?: string; route?: string; required_states?: string[] }>;
  }>(path.join(outputDir, "screens", "screen-inventory.json"));

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
    readyForFrontendAgent: topManifest.readyForFrontendAgent ?? false,
    blockers: topManifest.blockers ?? [],
    warnings: topManifest.warnings ?? [],
    entrypoints: [
      "lifecycle/context-completion.json",
      "lifecycle/lifecycle-report.md",
      "spec/archetype-spec.md",
      "spec/archetype-spec.json",
      "test-first/test-first-contract.json",
      "test-first/test-first-plan.md",
      "verification/playwright-verification-contract.json",
      "verification/playwright-evidence.json",
      "10-revision/repair-task-queue.json",
      "10-revision/repair-plan.md",
      "AGENTS.md",
      "CLAUDE.md",
      "implementation-contract.md",
      "verification-plan.md",
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

  if (command === "validate") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    const result = validateExportedPackage(path.resolve(outDir));
    writeJson(result);
    if (result.status === "fail") process.exit(1);
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
