import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { targetExecutionMarkdown } from "../modules/targetExecution";
import { playwrightEvidenceMarkdown } from "../modules/playwrightVerification";
import { updateRepairArtifactsFromLatest } from "../modules/revisionProtocol";
import { buildLifecycleExecutionStateArtifact, lifecycleExecutionStateMarkdown } from "../modules/lifecycleExecutionStates";
import { buildQaArtifactsFromRecords } from "../modules/qaTeam";
import { FORBIDDEN_TEST_PATTERNS } from "../modules/testQualityStandard";
import { finalReadinessReportMarkdown } from "../modules/requiredPackageArtifacts";

interface TargetVerifyOptions {
  skipInstall?: boolean;
}

interface CommandResult {
  id: string;
  command: string;
  status: "pending" | "pass" | "fail";
  exit_code: number | null;
  duration_ms: number | null;
  stdout: string;
  stderr: string;
}

export interface TargetVerificationResult {
  report_version: string;
  status: "pass" | "fail";
  generated_at: string;
  output_dir: string;
  target_dir: string;
  commands: CommandResult[];
  summary: {
    install: "pass" | "fail";
    typecheck: "pass" | "fail" | "pending";
    build: "pass" | "fail" | "pending";
    playwright: "pass" | "fail" | "pending";
  };
  blockers: string[];
  warnings: string[];
  proof_artifacts: string[];
  contract_fidelity: ContractFidelityAudit;
  repair: {
    status: "pending" | "pass" | "fail" | "warning";
    taskCount: number;
    artifacts: string[];
  };
}

interface ContractFidelityCheck {
  id: string;
  status: "pass" | "fail" | "warning";
  details: string;
  expected?: unknown;
  observed?: unknown;
}

export interface ContractFidelityAudit {
  audit_version: string;
  status: "pass" | "fail";
  generated_at: string;
  checks: ContractFidelityCheck[];
  summary: {
    manifest_files: number;
    missing_manifest_files: number;
    required_test_files: number;
    missing_required_test_files: number;
    required_test_ids: number;
    missing_required_test_ids: number;
    action_contracts: number;
    missing_action_test_refs: number;
    forbidden_stack_files: number;
  };
  blockers: string[];
  warnings: string[];
  proof_artifacts: string[];
}

function ensureDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath: string, value: unknown): void {
  ensureDir(filePath);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath: string, value: string): void {
  ensureDir(filePath);
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readJsonOrEmpty(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  try {
    return readJson<Record<string, unknown>>(filePath);
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function tail(value: string, max = 12000): string {
  return value.length > max ? value.slice(value.length - max) : value;
}

function runCommand(id: string, command: string, args: string[], cwd: string, env: Record<string, string> = {}): CommandResult {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      NEXT_TELEMETRY_DISABLED: "1",
      ...env
    }
  });
  const exitCode = typeof result.status === "number" ? result.status : 1;
  return {
    id,
    command: [command, ...args].join(" "),
    status: exitCode === 0 ? "pass" : "fail",
    exit_code: exitCode,
    duration_ms: Date.now() - started,
    stdout: tail(result.stdout ?? ""),
    stderr: tail(result.stderr ?? result.error?.message ?? "")
  };
}

function targetDependencyCacheEnv(): Record<string, string> {
  return {
    npm_config_cache: process.env.ARCHETYPE_TARGET_NPM_CACHE_DIR ?? path.join(process.cwd(), ".cache", "archetype-target-npm"),
    npm_config_audit: "false",
    npm_config_fund: "false"
  };
}

function allocatePlaywrightPort(): string {
  const script = [
    "const net = require('node:net');",
    "const server = net.createServer();",
    "server.unref();",
    "server.on('error', () => process.exit(1));",
    "server.listen(0, '127.0.0.1', () => {",
    "  const address = server.address();",
    "  if (!address || typeof address === 'string') process.exit(1);",
    "  process.stdout.write(String(address.port));",
    "  server.close(() => process.exit(0));",
    "});"
  ].join("\n");
  const result = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1"
    }
  });
  const port = Number(String(result.stdout ?? "").trim());
  return Number.isInteger(port) && port > 0 ? String(port) : "4177";
}

function auditTargetDependencies(targetDir: string): { blockers: string[]; warnings: string[] } {
  const result = spawnSync("npm", ["audit", "--json"], {
    cwd: targetDir,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1"
    }
  });
  if (!result.stdout) {
    return { blockers: [], warnings: ["npm audit did not return a parseable report."] };
  }
  try {
    const audit = JSON.parse(result.stdout) as {
      metadata?: {
        vulnerabilities?: {
          moderate?: number;
          high?: number;
          critical?: number;
          total?: number;
        };
      };
    };
    const vulnerabilities = audit.metadata?.vulnerabilities ?? {};
    const high = vulnerabilities.high ?? 0;
    const critical = vulnerabilities.critical ?? 0;
    const moderate = vulnerabilities.moderate ?? 0;
    const blockers = high + critical > 0
      ? [`npm audit reported ${high} high and ${critical} critical vulnerabilities in the generated target dependency tree.`]
      : [];
    const warnings = moderate > 0
      ? [`npm audit reported ${moderate} moderate vulnerabilities in the generated target dependency tree.`]
      : [];
    return { blockers, warnings };
  } catch {
    return { blockers: [], warnings: ["npm audit report could not be parsed."] };
  }
}

function listTargetTestFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTargetTestFiles(absolutePath);
    if (entry.isFile() && /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(entry.name)) return [absolutePath];
    return [];
  });
}

function auditTargetTestQuality(outputDir: string, targetDir: string): { blockers: string[]; warnings: string[] } {
  const standardPath = path.join(outputDir, "test-first", "test-quality-standard.json");
  if (!existsSync(standardPath)) {
    return { blockers: ["Missing test-first/test-quality-standard.json; target test quality cannot be verified."], warnings: [] };
  }
  const testFiles = listTargetTestFiles(path.join(targetDir, "tests"));
  if (testFiles.length === 0) {
    return { blockers: ["Target tests directory has no spec/test files; marker-only audit cannot pass."], warnings: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  for (const filePath of testFiles) {
    const source = readFileSync(filePath, "utf8");
    const relativePath = path.relative(targetDir, filePath);
    const usesOnlyMarkerSurface = /data-archetype-(screen|state)/.test(source);
    const behaviorSignals = [
      /getByRole\(["']heading/,
      /getByRole\(["']main/,
      /getByRole\(["']status/,
      /innerText\(/,
      /toContainText\(/,
      /toHaveURL\(/,
      /new URL\(page\.url\(\)\)/,
      /keyboard\.press\(/,
      /\.click\(/,
      /\.focus\(/,
      /toBeFocused\(/,
      /toHaveCSS\(/,
      /setViewportSize\(/,
      /boundingBox\(/,
      /screenshot\(/,
      /evaluate\(/
    ];
    const hasBehaviorEvidence = behaviorSignals.some((signal) => signal.test(source));
    if (usesOnlyMarkerSurface && !hasBehaviorEvidence) {
      blockers.push(`Marker-only test file fails HL-11 verifier: ${relativePath}. Forbidden patterns: ${FORBIDDEN_TEST_PATTERNS.join(" | ")}`);
    }
  }
  if (blockers.length === 0) {
    warnings.push("Target tests passed HL-11 marker-only audit; Playwright still needs to provide browser evidence.");
  }
  return { blockers, warnings };
}

function listTargetFiles(targetDir: string, directory = targetDir): string[] {
  if (!existsSync(directory)) return [];
  const ignored = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", "playwright-report", "test-results"]);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTargetFiles(targetDir, absolutePath);
    if (!entry.isFile()) return [];
    return [path.relative(targetDir, absolutePath).split(path.sep).join("/")];
  });
}

function readTargetText(targetDir: string, relativePath: string): string {
  const filePath = path.join(targetDir, relativePath);
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8");
}

function forbiddenPathMatches(pattern: string, filePath: string): boolean {
  if (pattern.endsWith("/**")) return filePath.startsWith(pattern.slice(0, -3));
  return filePath === pattern;
}

function checkRecord(id: string, condition: boolean, details: string, expected?: unknown, observed?: unknown): ContractFidelityCheck {
  return {
    id,
    status: condition ? "pass" : "fail",
    details,
    ...(expected === undefined ? {} : { expected }),
    ...(observed === undefined ? {} : { observed })
  };
}

function testIdsFromContract(testFirstContract: Record<string, unknown>): string[] {
  return asArray(testFirstContract.suites)
    .map(asRecord)
    .flatMap((suite) => asArray(suite.tests).map(asRecord))
    .map((test) => String(test.test_id ?? ""))
    .filter((value) => value.trim().length > 0);
}

function actionIdsFromContract(actionContracts: Record<string, unknown>): string[] {
  return asArray(actionContracts.actions)
    .map(asRecord)
    .map((action) => String(action.action_id ?? ""))
    .filter((value) => value.trim().length > 0);
}

function requiredTestFilesFromContract(testFirstContract: Record<string, unknown>): string[] {
  return asArray(testFirstContract.required_target_test_files)
    .map((item) => String(asRecord(item).path ?? item))
    .filter((value) => value.trim().length > 0);
}

function playwrightScenarioTypes(playwrightContract: Record<string, unknown>): Set<string> {
  return new Set(asArray(playwrightContract.scenarios).map((scenario) => String(asRecord(scenario).type ?? "")).filter(Boolean));
}

function concatTargetTestSource(targetDir: string, requiredFiles: string[]): string {
  return requiredFiles.map((filePath) => readTargetText(targetDir, filePath)).join("\n");
}

function emptyContractFidelityAudit(status: "pass" | "fail" = "fail", blocker = "Contract fidelity audit did not run."): ContractFidelityAudit {
  return {
    audit_version: "1.0",
    status,
    generated_at: new Date().toISOString(),
    checks: [],
    summary: {
      manifest_files: 0,
      missing_manifest_files: 0,
      required_test_files: 0,
      missing_required_test_files: 0,
      required_test_ids: 0,
      missing_required_test_ids: 0,
      action_contracts: 0,
      missing_action_test_refs: 0,
      forbidden_stack_files: 0
    },
    blockers: status === "pass" ? [] : [blocker],
    warnings: [],
    proof_artifacts: ["14-target-execution/target-execution-report.json"]
  };
}

export function auditTargetContractFidelity(outputDir: string, targetDir: string): ContractFidelityAudit {
  const sourceManifest = readJsonOrEmpty(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"));
  const routeComponentMap = readJsonOrEmpty(path.join(outputDir, "12-target-frontend", "route-component-map.json"));
  const testFirstContract = readJsonOrEmpty(path.join(outputDir, "test-first", "test-first-contract.json"));
  const playwrightContract = readJsonOrEmpty(path.join(outputDir, "verification", "playwright-verification-contract.json"));
  const actionContracts = readJsonOrEmpty(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"));
  const manifestFiles = asArray(sourceManifest.files).map(asRecord);
  const manifestPaths = manifestFiles.map((file) => String(file.path ?? "")).filter(Boolean);
  const targetFiles = listTargetFiles(targetDir);
  const targetFileSet = new Set(targetFiles);
  const missingManifestFiles = manifestPaths.filter((filePath) => !targetFileSet.has(filePath));
  const forbiddenPatterns = asArray(asRecord(sourceManifest.target_stack).forbidden_stack_files).map(String).filter(Boolean);
  const forbiddenStackFiles = targetFiles.filter((filePath) => forbiddenPatterns.some((pattern) => forbiddenPathMatches(pattern, filePath)));
  const routeEntries = asArray(routeComponentMap.routes).map(asRecord);
  const routeTraceFailures = routeEntries.filter((route) => {
    const routeFile = String(route.route_file ?? "");
    const screenId = String(route.screen_id ?? "");
    const screenFile = String(route.screen_file ?? "");
    const routeSource = readTargetText(targetDir, routeFile);
    return routeFile.length === 0 || routeSource.length === 0 || (!routeSource.includes(screenId) && !routeSource.includes(path.posix.basename(screenFile).replace(/\.(tsx|ts|jsx|js)$/u, "")));
  });
  const screenTraceFailures = manifestFiles.filter((file) => file.kind === "screen").filter((file) => {
    const filePath = String(file.path ?? "");
    const screenId = String(file.screen_id ?? "");
    const source = readTargetText(targetDir, filePath);
    return source.length === 0 || !source.includes("data-archetype-feature-screen") || !source.includes(screenId);
  });
  const componentTraceFailures = manifestFiles.filter((file) => file.kind === "component").filter((file) => {
    const source = readTargetText(targetDir, String(file.path ?? ""));
    return source.length === 0 || !source.includes("data-archetype-component");
  });
  const patternTraceFailures = manifestFiles.filter((file) => file.kind === "pattern").filter((file) => {
    const source = readTargetText(targetDir, String(file.path ?? ""));
    return source.length === 0 || !source.includes("data-archetype-pattern");
  });
  const requiredTestFiles = requiredTestFilesFromContract(testFirstContract);
  const missingRequiredTestFiles = requiredTestFiles.filter((filePath) => !targetFileSet.has(filePath));
  const targetTestSource = concatTargetTestSource(targetDir, requiredTestFiles);
  const requiredTestIds = testIdsFromContract(testFirstContract);
  const missingRequiredTestIds = requiredTestIds.filter((testId) => !targetTestSource.includes(testId));
  const actionIds = actionIdsFromContract(actionContracts);
  const missingActionTestRefs = actionIds.filter((actionId) => !targetTestSource.includes(actionId));
  const requiredScenarioTypes = ["route", "screen_state", "flow", "responsive", "accessibility", "interaction_state", "visual_smoke", "malformed_data"];
  const scenarioTypes = playwrightScenarioTypes(playwrightContract);
  const missingScenarioTypes = requiredScenarioTypes.filter((type) => !scenarioTypes.has(type));
  const checks = [
    checkRecord("source_manifest.present", manifestPaths.length > 0, "Source manifest contains target files.", "files.length > 0", manifestPaths.length),
    checkRecord("source_manifest.files_exist", missingManifestFiles.length === 0, "Every source-file-manifest path exists in the target.", [], missingManifestFiles),
    checkRecord("source_manifest.forbidden_stack_files_absent", forbiddenStackFiles.length === 0, "Target does not contain files forbidden by the resolved stack.", [], forbiddenStackFiles),
    checkRecord("route_component_map.route_traceability", routeTraceFailures.length === 0, "Every route file traces to its declared screen.", [], routeTraceFailures.map((item) => item.route_file)),
    checkRecord("source_manifest.screen_traceability", screenTraceFailures.length === 0, "Every feature screen file keeps the declared screen trace marker.", [], screenTraceFailures.map((item) => item.path)),
    checkRecord("source_manifest.component_traceability", componentTraceFailures.length === 0, "Every shared component file keeps its component trace marker.", [], componentTraceFailures.map((item) => item.path)),
    checkRecord("source_manifest.pattern_traceability", patternTraceFailures.length === 0, "Every feature pattern file keeps its pattern trace marker.", [], patternTraceFailures.map((item) => item.path)),
    checkRecord("test_first.required_files_exist", missingRequiredTestFiles.length === 0, "Every test-first required target test file exists.", [], missingRequiredTestFiles),
    checkRecord("test_first.required_test_ids_present", missingRequiredTestIds.length === 0, "Target tests preserve every generated test-first test id.", [], missingRequiredTestIds.slice(0, 25)),
    checkRecord("action_contracts.test_traceability", missingActionTestRefs.length === 0, "Target tests reference every declared action contract id.", [], missingActionTestRefs),
    checkRecord("playwright_contract.required_families", missingScenarioTypes.length === 0, "Playwright contract contains every required verification family.", [], missingScenarioTypes)
  ];
  const blockers = checks
    .filter((check) => check.status === "fail")
    .map((check) => `${check.id}: ${check.details}`);
  return {
    audit_version: "1.0",
    status: blockers.length > 0 ? "fail" : "pass",
    generated_at: new Date().toISOString(),
    checks,
    summary: {
      manifest_files: manifestPaths.length,
      missing_manifest_files: missingManifestFiles.length,
      required_test_files: requiredTestFiles.length,
      missing_required_test_files: missingRequiredTestFiles.length,
      required_test_ids: requiredTestIds.length,
      missing_required_test_ids: missingRequiredTestIds.length,
      action_contracts: actionIds.length,
      missing_action_test_refs: missingActionTestRefs.length,
      forbidden_stack_files: forbiddenStackFiles.length
    },
    blockers,
    warnings: blockers.length === 0 ? ["Contract fidelity audit passed source manifest, route map, test-first, action, and Playwright family checks."] : [],
    proof_artifacts: [
      "12-target-frontend/source-file-manifest.json",
      "12-target-frontend/route-component-map.json",
      "test-first/test-first-contract.json",
      "verification/playwright-verification-contract.json",
      "06-frontend-agent-contract/action-contracts.json",
      "14-target-execution/target-execution-report.json"
    ]
  };
}

function e2eFindingsMarkdown(results: Array<Record<string, unknown>>, summary: Record<string, unknown>): string {
  const warnings = results.filter((item) => item.status === "warning");
  const failures = results.filter((item) => item.status === "fail");
  const faults = [...new Set(warnings.map((item) => String(item.revealed_fault ?? "")).filter(Boolean))];
  return [
    "# E2E Findings",
    "",
    `Total scenarios: ${summary.total}`,
    `Pass: ${summary.pass}`,
    `Warning: ${summary.warning}`,
    `Fail: ${summary.fail}`,
    "",
    "## What Is Wrong",
    "",
    faults.length > 0 ? faults.map((fault) => `- ${fault}`).join("\n") : "No scenario exposed a current fault.",
    "",
    "## Failed Scenarios",
    "",
    failures.length > 0 ? failures.map((item) => `- ${item.scenario_id}: ${item.title}`).join("\n") : "None.",
    "",
    "## Warning Scenarios",
    "",
    warnings.length > 0 ? warnings.map((item) => `- ${item.scenario_id}: ${item.title} - ${item.fix_hint ?? "Fix plan required."}`).join("\n") : "None."
  ].join("\n");
}

function updateE2ETargetExecutionProof(outputDir: string, result: TargetVerificationResult): void {
  if (result.status !== "pass") return;
  const resultsPath = path.join(outputDir, "13-e2e", "e2e-results.json");
  const findingsPath = path.join(outputDir, "13-e2e", "e2e-findings.md");
  if (!existsSync(resultsPath)) return;
  const e2e = readJson<{
    result_version?: string;
    summary?: Record<string, unknown>;
    results?: Array<Record<string, unknown>>;
    revealed_faults?: unknown[];
    fix_plan?: unknown[];
  }>(resultsPath);
  const results = e2e.results ?? [];
  const scenario = results.find((item) =>
    item.scenario_id === "E2E-066" ||
    String(item.title ?? "").toLowerCase().includes("target stack execution proof")
  );
  if (scenario) {
    scenario.status = "pass";
    scenario.result = "Target stack execution proof passed: npm install, typecheck, production build, and Playwright verification completed in the generated target workspace.";
    scenario.revealed_fault = null;
    scenario.fix_hint = null;
  }
  if (result.summary.playwright === "pass") {
    for (const item of results) {
      const title = String(item.title ?? "").toLowerCase();
      if (item.scenario_id === "E2E-067" || title.includes("non-default state")) {
        item.status = "pass";
        item.result = "Playwright verified browser-visible route state rendering for generated target screens.";
        item.revealed_fault = null;
        item.fix_hint = null;
      }
      if (item.scenario_id === "E2E-069" || title.includes("visual regression proof")) {
        item.status = "pass";
        item.result = "Playwright visual-smoke screenshots were captured for generated target routes.";
        item.revealed_fault = null;
        item.fix_hint = null;
      }
    }
  }

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === "pass").length,
    warning: results.filter((item) => item.status === "warning").length,
    fail: results.filter((item) => item.status === "fail").length,
    happy_path: results.filter((item) => item.type === "happy_path").length,
    edge_case: results.filter((item) => item.type === "edge_case").length
  };
  const next = {
    ...e2e,
    summary,
    results,
    revealed_faults: [...new Set(results.map((item) => item.revealed_fault).filter(Boolean))],
    fix_plan: [...new Set(results.map((item) => item.fix_hint).filter(Boolean))]
  };
  writeJson(resultsPath, next);
  writeText(findingsPath, e2eFindingsMarkdown(results, summary));
}

function readPackageScripts(targetDir: string): Record<string, string> {
  const packageJsonPath = path.join(targetDir, "package.json");
  if (!existsSync(packageJsonPath)) return {};
  try {
    const pkg = readJson<{ scripts?: Record<string, string> }>(packageJsonPath);
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

function collectPlaywrightSummary(targetDir: string): {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  rawAvailable: boolean;
} {
  const resultPath = path.join(targetDir, "test-results", "archetype-playwright-results.json");
  if (!existsSync(resultPath)) return { passed: 0, failed: 0, skipped: 0, total: 0, rawAvailable: false };
  try {
    const raw = readJson<{
      stats?: { expected?: number; unexpected?: number; skipped?: number };
      suites?: unknown[];
    }>(resultPath);
    const passed = raw.stats?.expected ?? 0;
    const failed = raw.stats?.unexpected ?? 0;
    const skipped = raw.stats?.skipped ?? 0;
    return { passed, failed, skipped, total: passed + failed + skipped, rawAvailable: true };
  } catch {
    return { passed: 0, failed: 0, skipped: 0, total: 0, rawAvailable: false };
  }
}

interface PlaywrightScenarioResult {
  scenario_id: string;
  title: string;
  type: string;
  route?: string;
  screen_id?: string;
  status: "pass" | "fail" | "skipped" | "missing";
  duration_ms: number;
  error_messages: string[];
  attachments: string[];
  screenshot_path?: string;
  screenshot_bytes?: number;
}

interface PlaywrightEvidenceDetails {
  scenarioResults: PlaywrightScenarioResult[];
  grades: Record<string, "pass" | "fail" | "pending">;
  summary: {
    contract_scenarios: number;
    raw_specs: number;
    passed: number;
    failed: number;
    skipped: number;
    missing: number;
  };
  visualProof: Array<{ scenario_id: string; screenshot_path: string; screenshot_bytes: number }>;
  blockers: string[];
  warnings: string[];
}

interface RawPlaywrightSpecs {
  specs: Map<string, { status: PlaywrightScenarioResult["status"]; duration_ms: number; error_messages: string[]; attachments: string[] }>;
  rawAvailable: boolean;
  parseError?: string;
}

function collectRawPlaywrightSpecs(targetDir: string): RawPlaywrightSpecs {
  const resultPath = path.join(targetDir, "test-results", "archetype-playwright-results.json");
  const specs = new Map<string, { status: PlaywrightScenarioResult["status"]; duration_ms: number; error_messages: string[]; attachments: string[] }>();
  if (!existsSync(resultPath)) return { specs, rawAvailable: false };
  let raw: { suites?: unknown[] };
  try {
    raw = readJson<{ suites?: unknown[] }>(resultPath);
  } catch (error) {
    return {
      specs,
      rawAvailable: false,
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
  const visitSuite = (suite: unknown): void => {
    const record = typeof suite === "object" && suite !== null ? suite as Record<string, unknown> : {};
    for (const spec of Array.isArray(record.specs) ? record.specs : []) {
      const specRecord = typeof spec === "object" && spec !== null ? spec as Record<string, unknown> : {};
      const title = typeof specRecord.title === "string" ? specRecord.title : "";
      const tests = Array.isArray(specRecord.tests) ? specRecord.tests as Array<Record<string, unknown>> : [];
      const results = tests.flatMap((test) => Array.isArray(test.results) ? test.results as Array<Record<string, unknown>> : []);
      const failed = specRecord.ok === false || tests.some((test) => test.status === "unexpected" || test.status === "flaky");
      const skipped = tests.length > 0 && tests.every((test) => test.status === "skipped");
      const duration = results.reduce((total, result) => total + (typeof result.duration === "number" ? result.duration : 0), 0);
      const errors = results.flatMap((result) =>
        [
          ...(Array.isArray(result.errors) ? result.errors : []),
          ...(typeof result.error === "object" && result.error !== null ? [result.error] : [])
        ].map((error) => {
          const errorRecord = typeof error === "object" && error !== null ? error as Record<string, unknown> : {};
          return String(errorRecord.message ?? errorRecord.stack ?? "Unknown Playwright error.");
        })
      );
      const attachments = results.flatMap((result) =>
        (Array.isArray(result.attachments) ? result.attachments : []).map((attachment) => {
          const attachmentRecord = typeof attachment === "object" && attachment !== null ? attachment as Record<string, unknown> : {};
          return String(attachmentRecord.path ?? attachmentRecord.name ?? "attachment");
        })
      );
      if (title.trim().length > 0) {
        specs.set(title, {
          status: skipped ? "skipped" : failed ? "fail" : "pass",
          duration_ms: duration,
          error_messages: errors,
          attachments
        });
      }
    }
    for (const child of Array.isArray(record.suites) ? record.suites : []) visitSuite(child);
  };
  for (const suite of raw.suites ?? []) visitSuite(suite);
  return { specs, rawAvailable: true };
}

function scenarioTypeForId(scenarioId: string): string {
  if (scenarioId.startsWith("PW-ROUTE")) return "route";
  if (scenarioId.startsWith("PW-STATE")) return "screen_state";
  if (scenarioId.startsWith("PW-FLOW")) return "flow";
  if (scenarioId.startsWith("PW-RESP")) return "responsive";
  if (scenarioId.startsWith("PW-A11Y")) return "accessibility";
  if (scenarioId.startsWith("PW-VISUAL")) return "visual_smoke";
  if (scenarioId.startsWith("PW-MALFORMED")) return "malformed_data";
  return "unknown";
}

function screenshotProof(targetDir: string, scenario: Record<string, unknown>): { path?: string; bytes?: number } {
  if (typeof scenario.screenshot_path !== "string") return {};
  const screenshotPath = path.join(targetDir, scenario.screenshot_path);
  if (!existsSync(screenshotPath)) return { path: scenario.screenshot_path, bytes: 0 };
  return { path: scenario.screenshot_path, bytes: readFileSync(screenshotPath).byteLength };
}

function gradeScenarioType(results: PlaywrightScenarioResult[], type: string): "pass" | "fail" | "pending" {
  const scoped = results.filter((result) => result.type === type);
  if (scoped.length === 0) return "pending";
  if (scoped.every((result) => result.status === "pass")) return "pass";
  return "fail";
}

function gradeScenarioFamily(results: PlaywrightScenarioResult[], types: string[]): "pass" | "fail" | "pending" {
  const family = results.filter((result) => types.includes(result.type));
  if (family.length === 0) return "pending";
  if (family.every((result) => result.status === "pass")) return "pass";
  return "fail";
}

function collectPlaywrightEvidenceDetails(outputDir: string, targetDir: string): PlaywrightEvidenceDetails {
  const contractPath = path.join(outputDir, "verification", "playwright-verification-contract.json");
  if (!existsSync(contractPath)) {
    return {
      scenarioResults: [],
      grades: { overall: "fail" },
      summary: { contract_scenarios: 0, raw_specs: 0, passed: 0, failed: 0, skipped: 0, missing: 0 },
      visualProof: [],
      blockers: ["Missing verification/playwright-verification-contract.json."],
      warnings: []
    };
  }
  const contract = readJson<{ scenarios?: Array<Record<string, unknown>>; coverage?: Record<string, unknown> }>(contractPath);
  const rawSpecs = collectRawPlaywrightSpecs(targetDir);
  const scenarios = contract.scenarios ?? [];
  const scenarioResults = scenarios.map((scenario): PlaywrightScenarioResult => {
    const scenarioId = String(scenario.scenario_id ?? "unknown");
    const raw = rawSpecs.specs.get(scenarioId);
    const screenshot = screenshotProof(targetDir, scenario);
    return {
      scenario_id: scenarioId,
      title: typeof scenario.title === "string" ? scenario.title : scenarioId,
      type: String(scenario.type ?? scenarioTypeForId(scenarioId)),
      ...(typeof scenario.route === "string" ? { route: scenario.route } : {}),
      ...(typeof scenario.screen_id === "string" ? { screen_id: scenario.screen_id } : {}),
      status: raw?.status ?? "missing",
      duration_ms: raw?.duration_ms ?? 0,
      error_messages: raw?.error_messages ?? [`Missing Playwright result for ${scenarioId}.`],
      attachments: raw?.attachments ?? [],
      ...(screenshot.path ? { screenshot_path: screenshot.path } : {}),
      ...(typeof screenshot.bytes === "number" ? { screenshot_bytes: screenshot.bytes } : {})
    };
  });
  const behaviorTypes = ["route", "screen_state", "flow", "responsive", "interaction_state"];
  const visualResults = scenarioResults.filter((result) => result.type === "visual_smoke");
  const visualGrade = visualResults.length > 0 && visualResults.every((result) => result.status === "pass" && (result.screenshot_bytes ?? 0) > 0) ? "pass" : "fail";
  const summary = {
    contract_scenarios: scenarios.length,
    raw_specs: rawSpecs.specs.size,
    passed: scenarioResults.filter((result) => result.status === "pass").length,
    failed: scenarioResults.filter((result) => result.status === "fail").length,
    skipped: scenarioResults.filter((result) => result.status === "skipped").length,
    missing: scenarioResults.filter((result) => result.status === "missing").length
  };
  const executableGrades: Record<string, "pass" | "fail" | "pending"> = {
    scaffold_verified: existsSync(path.join(targetDir, "package.json")) ? "pass" : "fail",
    browser_smoke_verified: gradeScenarioType(scenarioResults, "route"),
    behavior_verified: gradeScenarioFamily(scenarioResults, behaviorTypes),
    interaction_state_verified: gradeScenarioType(scenarioResults, "interaction_state"),
    accessibility_verified: gradeScenarioType(scenarioResults, "accessibility"),
    visual_verified: visualGrade,
    malformed_data_verified: gradeScenarioType(scenarioResults, "malformed_data"),
    scenario_coverage: rawSpecs.rawAvailable && rawSpecs.specs.size >= scenarios.length && scenarioResults.every((result) => result.status !== "missing") ? "pass" : "fail"
  };
  executableGrades.runtime_overall = Object.values(executableGrades).every((grade) => grade === "pass") ? "pass" : "fail";
  const grades: Record<string, "pass" | "fail" | "pending"> = {
    ...executableGrades,
    manual_reviewed: "pending",
    production_integrated: "pending",
    overall: executableGrades.runtime_overall
  };
  const visualProof = visualResults.map((result) => ({
    scenario_id: result.scenario_id,
    screenshot_path: result.screenshot_path ?? "",
    screenshot_bytes: result.screenshot_bytes ?? 0
  }));
  const blockers = [
    ...(rawSpecs.rawAvailable ? [] : [`Playwright raw result JSON is missing or unreadable${rawSpecs.parseError ? `: ${rawSpecs.parseError}` : "."}`]),
    ...(grades.scenario_coverage === "pass" ? [] : ["Playwright raw results do not cover every verification scenario."]),
    ...(grades.browser_smoke_verified === "pass" ? [] : ["Browser route smoke scenarios did not all pass."]),
    ...(grades.behavior_verified === "pass" ? [] : ["Browser behavior scenarios did not all pass."]),
    ...(grades.interaction_state_verified === "pass" ? [] : ["Interaction-state scenarios did not all pass."]),
    ...(grades.accessibility_verified === "pass" ? [] : ["Accessibility scenarios did not all pass."]),
    ...(grades.visual_verified === "pass" ? [] : ["Visual-smoke screenshots are missing or failed."]),
    ...(grades.malformed_data_verified === "pass" ? [] : ["Malformed-data browser scenarios did not all pass."])
  ];
  return {
    scenarioResults,
    grades,
    summary,
    visualProof,
    blockers,
    warnings: [
      ...(rawSpecs.specs.size > scenarios.length ? ["Raw Playwright results include additional target tests beyond the contract scenario set."] : []),
      "Manual review and production integration grades remain pending; runtime verification is not a production launch approval."
    ]
  };
}

function auditPlaywrightEvidenceQuality(outputDir: string, targetDir: string, playwrightStatus: "pass" | "fail" | "pending"): { blockers: string[]; warnings: string[] } {
  if (playwrightStatus !== "pass") return { blockers: [], warnings: [] };
  const details = collectPlaywrightEvidenceDetails(outputDir, targetDir);
  return {
    blockers: details.blockers,
    warnings: details.warnings
  };
}

function writePlaywrightEvidence(outputDir: string, targetDir: string, report: TargetVerificationResult): void {
  const contractPath = path.join(outputDir, "verification", "playwright-verification-contract.json");
  if (!existsSync(contractPath)) return;
  const contract = readJson<{
    coverage?: Record<string, unknown>;
    required_evidence_paths?: unknown[];
  }>(contractPath);
  const playwrightSummary = collectPlaywrightSummary(targetDir);
  const playwrightCommand = report.commands.find((item) => item.id === "playwright");
  const details = collectPlaywrightEvidenceDetails(outputDir, targetDir);
  const status = playwrightCommand?.status === "pass" && details.grades.overall === "pass" && report.status === "pass" ? "pass" : "fail";
  const blockers = [
    ...(playwrightCommand?.status === "pass" ? [] : ["Playwright verification did not pass for the target frontend."]),
    ...details.blockers
  ];
  const evidence = {
    evidence_version: "1.0",
    status,
    generated_at: new Date().toISOString(),
    source_contract: "verification/playwright-verification-contract.json",
    command: playwrightCommand?.command ?? "npm run archetype:playwright",
    target_dir: targetDir,
    coverage: contract.coverage ?? {},
    summary: playwrightSummary,
    scenario_summary: details.summary,
    visual_screenshot_summary: details.visualProof,
    evidence_grades: details.grades,
    scenario_results: details.scenarioResults,
    readiness_boundary: {
      runtime_verification: details.grades.runtime_overall ?? "fail",
      production_readiness: details.grades.production_integrated === "pass" && details.grades.manual_reviewed === "pass" ? "pass" : "pending",
      manual_reviewed: details.grades.manual_reviewed,
      production_integrated: details.grades.production_integrated,
      note: "Passing runtime evidence proves browser contract adherence; it does not certify production backend, auth, content, compliance, or human launch review."
    },
    proof_artifacts: [
      "verification/playwright-evidence.json",
      "verification/playwright-evidence.md",
      "target:test-results/archetype-playwright-results.json",
      "target:test-results/archetype-visual-smoke",
      "target:playwright-report"
    ],
    blockers,
    warnings: status === "pass"
      ? ["Playwright verifies target behavior, malformed-data handling, accessibility, and visual-smoke evidence; production backend, auth, and final compliance review remain external confirmations.", ...details.warnings]
      : ["Inspect target:test-results/archetype-playwright-results.json and target:playwright-report for failing browser evidence.", ...details.warnings],
    raw_summary_available: playwrightSummary.rawAvailable
  };
  writeJson(path.join(outputDir, "verification", "playwright-evidence.json"), evidence);
  writeText(path.join(outputDir, "verification", "playwright-evidence.md"), playwrightEvidenceMarkdown(evidence));
}

function writeLifecycleExecutionState(outputDir: string, report: TargetVerificationResult): void {
  const topManifest = readJsonOrEmpty(path.join(outputDir, "manifest.json"));
  const internalManifest = readJsonOrEmpty(path.join(outputDir, "00-manifest", "manifest.json"));
  const testFirstContract = readJsonOrEmpty(path.join(outputDir, "test-first", "test-first-contract.json"));
  const playwrightContract = readJsonOrEmpty(path.join(outputDir, "verification", "playwright-verification-contract.json"));
  const playwrightEvidence = readJsonOrEmpty(path.join(outputDir, "verification", "playwright-evidence.json"));
  const repairTaskQueue = readJsonOrEmpty(path.join(outputDir, "10-revision", "repair-task-queue.json"));
  const sourceFileManifest = readJsonOrEmpty(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"));
  const artifact = buildLifecycleExecutionStateArtifact({
    implementationAuthorized: topManifest.implementationAuthorized === true || internalManifest.implementation_authorized === true,
    packageId: typeof internalManifest.package_id === "string" ? internalManifest.package_id : undefined,
    readinessTier: typeof internalManifest.readiness_tier === "string" ? internalManifest.readiness_tier : undefined,
    testFirstContract,
    playwrightContract,
    playwrightEvidence,
    targetExecution: report as unknown as Record<string, unknown>,
    repairTaskQueue,
    sourceFileManifest
  });
  writeJson(path.join(outputDir, "lifecycle", "execution-state.json"), artifact);
  writeText(path.join(outputDir, "lifecycle", "execution-state.md"), lifecycleExecutionStateMarkdown(artifact));
}

function writeQaArtifacts(outputDir: string, report: TargetVerificationResult): void {
  const qa = buildQaArtifactsFromRecords({
    playwrightContract: readJsonOrEmpty(path.join(outputDir, "verification", "playwright-verification-contract.json")),
    playwrightEvidence: readJsonOrEmpty(path.join(outputDir, "verification", "playwright-evidence.json")),
    testFirstContract: readJsonOrEmpty(path.join(outputDir, "test-first", "test-first-contract.json")),
    repairTaskQueue: readJsonOrEmpty(path.join(outputDir, "10-revision", "repair-task-queue.json")),
    driftReport: readJsonOrEmpty(path.join(outputDir, "10-revision", "drift-report.json")),
    targetExecution: report as unknown as Record<string, unknown>
  });
  writeJson(path.join(outputDir, "qa", "scenario-catalog.json"), qa.scenarioCatalog);
  writeJson(path.join(outputDir, "qa", "playwright-results.json"), qa.playwrightResults);
  writeJson(path.join(outputDir, "qa", "malformed-data-results.json"), qa.malformedDataResults);
  writeText(path.join(outputDir, "qa", "accessibility-results.md"), qa.accessibilityResultsMarkdown);
  writeText(path.join(outputDir, "qa", "visual-regression-report.md"), qa.visualRegressionReportMarkdown);
  writeText(path.join(outputDir, "qa", "contract-drift-report.md"), qa.contractDriftReportMarkdown);
}

function writeFinalReadinessReport(outputDir: string, report: TargetVerificationResult): void {
  writeText(path.join(outputDir, "lifecycle", "final-readiness-report.md"), finalReadinessReportMarkdown({
    manifest: readJsonOrEmpty(path.join(outputDir, "00-manifest", "manifest.json")),
    playwrightEvidence: readJsonOrEmpty(path.join(outputDir, "verification", "playwright-evidence.json")),
    targetExecution: report as unknown as Record<string, unknown>,
    repairTaskQueue: readJsonOrEmpty(path.join(outputDir, "10-revision", "repair-task-queue.json")),
    qaScenarioCatalog: readJsonOrEmpty(path.join(outputDir, "qa", "scenario-catalog.json"))
  }));
}

export function verifyTargetFrontendExecution(outputDir: string, targetDir: string, options: TargetVerifyOptions = {}): TargetVerificationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let contractFidelity = emptyContractFidelityAudit("fail");
  if (!existsSync(outputDir)) blockers.push(`Output directory does not exist: ${outputDir}`);
  if (!existsSync(targetDir)) blockers.push(`Target directory does not exist: ${targetDir}`);
  if (!existsSync(path.join(targetDir, "package.json"))) blockers.push("Target package.json is missing. Run write-target first.");
  const manifestPath = path.join(outputDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    blockers.push("Missing manifest.json.");
  } else {
    const manifest = readJson<{ implementationAuthorized?: boolean; contractApproval?: { status?: string } }>(manifestPath);
    if (manifest.implementationAuthorized !== true) {
      blockers.push(`Verification is not authorized before human contract approval. Contract approval status: ${manifest.contractApproval?.status ?? "unknown"}.`);
    }
  }

  const commands: CommandResult[] = [];
  if (blockers.length === 0) {
    if (options.skipInstall) {
      commands.push({
        id: "install",
        command: "npm install",
        status: "pass",
        exit_code: 0,
        duration_ms: 0,
        stdout: "Skipped by --skip-install.",
        stderr: ""
      });
    } else {
      commands.push(runCommand("install", "npm", ["install"], targetDir, targetDependencyCacheEnv()));
    }
    if (commands.every((item) => item.status === "pass")) commands.push(runCommand("typecheck", "npm", ["run", "typecheck"], targetDir));
    if (commands.every((item) => item.status === "pass")) commands.push(runCommand("build", "npm", ["run", "build"], targetDir));
    const scripts = readPackageScripts(targetDir);
    if (commands.every((item) => item.status === "pass")) {
      const testQuality = auditTargetTestQuality(outputDir, targetDir);
      blockers.push(...testQuality.blockers);
      warnings.push(...testQuality.warnings);
    }
    if (commands.every((item) => item.status === "pass") && blockers.length === 0) {
      contractFidelity = auditTargetContractFidelity(outputDir, targetDir);
      blockers.push(...contractFidelity.blockers);
      warnings.push(...contractFidelity.warnings);
    }
    if (commands.every((item) => item.status === "pass") && blockers.length === 0 && scripts["archetype:playwright"]) {
      commands.push(runCommand("playwright", "npm", ["run", "archetype:playwright"], targetDir, {
        ARCHETYPE_PLAYWRIGHT_PORT: allocatePlaywrightPort()
      }));
    } else if (commands.every((item) => item.status === "pass") && blockers.length === 0) {
      blockers.push("Target package.json is missing archetype:playwright script.");
    }
  }

  for (const command of commands.filter((item) => item.status === "fail")) {
    blockers.push(`${command.command} failed with exit code ${command.exit_code}.`);
  }
  if (commands.length > 0 && commands.every((item) => item.status === "pass")) {
    const audit = auditTargetDependencies(targetDir);
    blockers.push(...audit.blockers);
    warnings.push(...audit.warnings);
    warnings.push("Target source may still use fixture adapters until production backend and auth mappings are confirmed.");
  }

  const commandStatus = (id: string): "pass" | "fail" | "pending" => commands.find((item) => item.id === id)?.status ?? "pending";
  const proofAudit = auditPlaywrightEvidenceQuality(outputDir, targetDir, commandStatus("playwright"));
  blockers.push(...proofAudit.blockers);
  warnings.push(...proofAudit.warnings);

  const requiredCommandStatus = (id: string): "pass" | "fail" => {
    const status = commandStatus(id);
    return status === "pass" ? "pass" : "fail";
  };
  const report: TargetVerificationResult = {
    report_version: "1.0",
    status: blockers.length > 0 ? "fail" : "pass",
    generated_at: new Date().toISOString(),
    output_dir: outputDir,
    target_dir: targetDir,
    commands,
    summary: {
      install: requiredCommandStatus("install"),
      typecheck: commandStatus("typecheck"),
      build: commandStatus("build"),
      playwright: commandStatus("playwright")
    },
    blockers,
    warnings,
    proof_artifacts: [
      "14-target-execution/target-execution-report.json",
      "14-target-execution/target-execution-report.md",
      "14-target-execution/contract-fidelity-audit.json",
      "verification/playwright-evidence.json",
      "verification/playwright-evidence.md",
      "target:test-results/archetype-playwright-results.json",
      "target:test-results/archetype-visual-smoke",
      "target:playwright-report",
      "target:.next"
    ],
    contract_fidelity: contractFidelity,
    repair: {
      status: "pending",
      taskCount: 0,
      artifacts: [
        "10-revision/verification-repair-contract.json",
        "10-revision/repair-task-queue.json",
        "10-revision/repair-plan.md",
        "10-revision/drift-report.json",
        "10-revision/drift-report.md"
      ]
    }
  };

  const reportPath = path.join(outputDir, "14-target-execution", "target-execution-report.json");
  const markdownPath = path.join(outputDir, "14-target-execution", "target-execution-report.md");
  writeJson(path.join(outputDir, "14-target-execution", "contract-fidelity-audit.json"), contractFidelity);
  writeJson(reportPath, report);
  writeText(markdownPath, targetExecutionMarkdown(report as unknown as Record<string, unknown>));
  writePlaywrightEvidence(outputDir, targetDir, report);
  const repair = updateRepairArtifactsFromLatest(outputDir, targetDir);
  report.repair = {
    status: repair.status,
    taskCount: repair.taskCount,
    artifacts: repair.artifacts
  };
  writeJson(reportPath, report);
  writeText(markdownPath, targetExecutionMarkdown(report as unknown as Record<string, unknown>));
  writeQaArtifacts(outputDir, report);
  writeFinalReadinessReport(outputDir, report);
  writeLifecycleExecutionState(outputDir, report);
  updateE2ETargetExecutionProof(outputDir, report);
  return report;
}
