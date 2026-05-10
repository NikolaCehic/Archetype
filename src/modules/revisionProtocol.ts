import type {
  DSAGGraph,
  EvidenceLedger,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  ProductArtifacts,
  RevisionArtifacts
} from "../core/types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildLifecycleExecutionStateArtifact, lifecycleExecutionStateMarkdown } from "./lifecycleExecutionStates";

type JsonRecord = Record<string, unknown>;

const ARTIFACTS = {
  evidence: "01-evidence/evidence-ledger.json",
  productModel: "02-product-model/product-model.json",
  userModel: "02-product-model/user-model.json",
  entityModel: "02-product-model/entity-model.json",
  routeMap: "03-experience-architecture/route-map.json",
  screenInventory: "03-experience-architecture/screen-inventory.json",
  screenSpecs: "05-screen-specs/*.yaml",
  designSystem: "04-design-system",
  tokenContracts: "04-design-system/tokens/token-contracts.json",
  typographySystem: "04-design-system/tokens/typography-system.json",
  componentContracts: "04-design-system/components/component-contracts.json",
  componentRegistry: "04-design-system/components/component-registry.json",
  patternContracts: "04-design-system/patterns/pattern-contracts.json",
  patternRegistry: "04-design-system/patterns/pattern-registry.json",
  dataContracts: "06-frontend-agent-contract/data-contracts.json",
  dataOperationContracts: "06-frontend-agent-contract/data-operation-contracts.json",
  actionContracts: "06-frontend-agent-contract/action-contracts.json",
  formContracts: "06-frontend-agent-contract/form-contracts.json",
  verificationContracts: "06-frontend-agent-contract/verification-contracts.json",
  productionIntegrationContracts: "06-frontend-agent-contract/production-integration-contracts.json",
  targetFrontend: "12-target-frontend",
  frontendContract: "06-frontend-agent-contract",
  dsag: "03-experience-architecture/dsag.json",
  readiness: "00-manifest/implementation-readiness.json"
} as const;

const REPAIR_CONTRACT_PATH = "10-revision/verification-repair-contract.json";
const REPAIR_TASK_QUEUE_PATH = "10-revision/repair-task-queue.json";
const REPAIR_PLAN_PATH = "10-revision/repair-plan.md";
const DRIFT_REPORT_PATH = "10-revision/drift-report.json";
const DRIFT_REPORT_MARKDOWN_PATH = "10-revision/drift-report.md";

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function routeToAppPath(route: string): string {
  const routePath = route.split("?")[0]?.split("#")[0] ?? route;
  if (routePath === "/") return "src/app/page.tsx";
  const parts = routePath
    .split("/")
    .filter(Boolean)
    .map((part) => part.startsWith(":") ? `[${part.slice(1)}]` : part);
  return `src/app/${parts.join("/")}/page.tsx`;
}

function readJsonSafe(filePath: string): JsonRecord {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as JsonRecord;
  } catch {
    return {};
  }
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath: string, value: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

function writeLifecycleExecutionStateFromLatest(outputDir: string, targetExecution: JsonRecord, repairTaskQueue: JsonRecord): void {
  const topManifest = readJsonSafe(path.join(outputDir, "manifest.json"));
  const internalManifest = readJsonSafe(path.join(outputDir, "00-manifest", "manifest.json"));
  const artifact = buildLifecycleExecutionStateArtifact({
    implementationAuthorized: topManifest.implementationAuthorized === true || internalManifest.implementation_authorized === true,
    packageId: typeof internalManifest.package_id === "string" ? internalManifest.package_id : undefined,
    readinessTier: typeof internalManifest.readiness_tier === "string" ? internalManifest.readiness_tier : undefined,
    testFirstContract: readJsonSafe(path.join(outputDir, "test-first", "test-first-contract.json")),
    playwrightContract: readJsonSafe(path.join(outputDir, "verification", "playwright-verification-contract.json")),
    playwrightEvidence: readJsonSafe(path.join(outputDir, "verification", "playwright-evidence.json")),
    targetExecution,
    repairTaskQueue,
    sourceFileManifest: readJsonSafe(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"))
  });
  writeJson(path.join(outputDir, "lifecycle", "execution-state.json"), artifact);
  writeText(path.join(outputDir, "lifecycle", "execution-state.md"), lifecycleExecutionStateMarkdown(artifact));
}

function buildRepairContract(): JsonRecord {
  return {
    contract_version: "1.0",
    lifecycle_gate: "revising",
    source_spec_path: "spec/archetype-spec.json",
    source_test_first_contract_path: "test-first/test-first-contract.json",
    source_playwright_contract_path: "verification/playwright-verification-contract.json",
    source_playwright_evidence_path: "verification/playwright-evidence.json",
    source_target_execution_path: "14-target-execution/target-execution-report.json",
    output_paths: {
      task_queue: REPAIR_TASK_QUEUE_PATH,
      plan: REPAIR_PLAN_PATH,
      drift_report: DRIFT_REPORT_PATH,
      drift_report_markdown: DRIFT_REPORT_MARKDOWN_PATH
    },
    policy: {
      default_action: "Patch implementation first.",
      contract_revision_allowed_when: [
        "The canonical spec is contradicted by new user-approved evidence.",
        "A generated route, screen, state, flow, data contract, or acceptance criterion is proven wrong.",
        "The target stack cannot support a generated obligation without changing the spec."
      ],
      forbidden_behavior: [
        "Do not delete failing tests to make verification pass.",
        "Do not revise the spec to hide implementation drift.",
        "Do not claim completion while repair-task-queue.json contains unresolved blocker tasks."
      ],
      rerun_commands: [
        "npm run typecheck",
        "npm run build",
        "npm run archetype:playwright",
        "archetype verify-target --out <archetype-output> --target <target-frontend>"
      ]
    },
    classifiers: [
      { match: "install", classification: "dependency_or_install_failure", default_owner: "implementation_agent" },
      { match: "typecheck", classification: "type_contract_drift", default_owner: "implementation_agent" },
      { match: "build", classification: "build_runtime_drift", default_owner: "implementation_agent" },
      { match: "PW-ROUTE", classification: "route_rendering_drift", default_owner: "implementation_agent" },
      { match: "PW-STATE", classification: "screen_state_drift", default_owner: "implementation_agent" },
      { match: "PW-FLOW", classification: "flow_traceability_drift", default_owner: "implementation_agent" },
      { match: "PW-RESP", classification: "responsive_drift", default_owner: "implementation_agent" },
      { match: "PW-A11Y", classification: "accessibility_drift", default_owner: "implementation_agent" },
      { match: "PW-VISUAL", classification: "visual_smoke_drift", default_owner: "implementation_agent" },
      { match: "contract", classification: "contract_revision_review", default_owner: "human_or_architect" }
    ],
    evidence_paths: [
      "verification/playwright-evidence.json",
      "verification/playwright-evidence.md",
      "14-target-execution/target-execution-report.json",
      "target:test-results/archetype-playwright-results.json",
      "target:playwright-report"
    ],
    blockers: [],
    warnings: ["Repair tasks are pending until target verification runs."]
  };
}

function scenarioById(contract: JsonRecord): Map<string, JsonRecord> {
  return new Map(asArray(contract.scenarios).map((scenario) => {
    const record = asRecord(scenario);
    return [String(record.scenario_id ?? ""), record] as const;
  }).filter(([id]) => id.length > 0));
}

function classificationForScenario(scenarioId: string): string {
  if (scenarioId.startsWith("PW-ROUTE")) return "route_rendering_drift";
  if (scenarioId.startsWith("PW-STATE")) return "screen_state_drift";
  if (scenarioId.startsWith("PW-FLOW")) return "flow_traceability_drift";
  if (scenarioId.startsWith("PW-RESP")) return "responsive_drift";
  if (scenarioId.startsWith("PW-A11Y")) return "accessibility_drift";
  if (scenarioId.startsWith("PW-VISUAL")) return "visual_smoke_drift";
  return "playwright_drift";
}

function actionForClassification(classification: string): string {
  const actions: Record<string, string> = {
    dependency_or_install_failure: "Repair target dependencies or package metadata, then rerun installation.",
    type_contract_drift: "Patch TypeScript/component/data contract drift in the target implementation.",
    build_runtime_drift: "Patch production build or runtime assumptions without weakening generated contracts.",
    route_rendering_drift: "Patch the route file so the declared screen renders at the declared route.",
    screen_state_drift: "Patch state rendering so the required state is browser-observable.",
    flow_traceability_drift: "Patch referenced routes/screens so the generated user flow is complete.",
    responsive_drift: "Patch layout constraints so the screen has no horizontal overflow at required viewports.",
    accessibility_drift: "Patch headings and accessible names without removing the declared UI.",
    visual_smoke_drift: "Patch rendering so the screen has a non-empty visual surface and screenshot proof.",
    contract_revision_review: "Review whether new user-approved evidence requires regenerating the contract package."
  };
  return actions[classification] ?? "Patch implementation drift first; revise the contract only with approved source evidence.";
}

function targetFilesForScenario(scenario: JsonRecord, sourceFileManifest: JsonRecord): string[] {
  const route = String(scenario.route ?? asArray(scenario.route_refs)[0] ?? "");
  const routes = unique([
    route,
    ...asArray(scenario.route_refs).map(String),
    ...asArray(scenario.resolved_routes).map(String)
  ]);
  const routeEntries = asArray(sourceFileManifest.files).map(asRecord).filter((file) => file.kind === "route");
  const routeFileByRoute = new Map(routeEntries.map((file) => [String(file.route ?? ""), String(file.path ?? "")]));
  const routeFiles = routes
    .filter(Boolean)
    .map((routePath) => routeFileByRoute.get(routePath) ?? routeToAppPath(routePath))
    .filter((filePath) => filePath.trim().length > 0);
  const screenId = String(scenario.screen_id ?? "");
  const screenEntries = asArray(sourceFileManifest.files).map(asRecord).filter((file) => file.kind === "screen");
  const screenFileById = new Map(screenEntries.map((file) => [String(file.screen_id ?? ""), String(file.path ?? "")]));
  const screenFiles = screenId
    ? [
        screenFileById.get(screenId) ?? "",
        `05-screen-specs/${screenId.replace(/[.]/g, "-")}.yaml`
      ]
    : [];
  return unique([...routeFiles, ...screenFiles]);
}

function collectFailedPlaywrightTests(
  value: unknown,
  failures: Array<{ title: string; message: string }> = [],
  inheritedTitle = ""
): Array<{ title: string; message: string }> {
  if (Array.isArray(value)) {
    for (const item of value) collectFailedPlaywrightTests(item, failures, inheritedTitle);
    return failures;
  }
  if (typeof value !== "object" || value === null) return failures;
  const record = asRecord(value);
  const title = typeof record.title === "string" ? record.title : inheritedTitle;
  const results = asArray(record.results).map(asRecord);
  const failedResults = results.filter((result) => {
    const status = String(result.status ?? "");
    return status && !["passed", "skipped", "expected"].includes(status);
  });
  if (failedResults.length > 0 && title) {
    const errorMessages = failedResults.flatMap((result) =>
      asArray(result.errors).map((error) => String(asRecord(error).message ?? "")).filter(Boolean)
    );
    failures.push({
      title,
      message: errorMessages[0] ?? "Playwright scenario failed."
    });
  }
  for (const key of ["suites", "specs", "tests"]) collectFailedPlaywrightTests(record[key], failures, title);
  return failures;
}

function commandRepairTasks(report: JsonRecord): JsonRecord[] {
  const commands = asArray(report.commands).map(asRecord);
  return commands
    .filter((command) => command.status === "fail")
    .map((command, index) => {
      const id = String(command.id ?? `command_${index + 1}`);
      const classification = id === "install"
        ? "dependency_or_install_failure"
        : id === "typecheck"
          ? "type_contract_drift"
          : id === "build"
            ? "build_runtime_drift"
            : id === "playwright"
              ? "playwright_drift"
              : "target_execution_failure";
      return {
        task_id: `REPAIR-CMD-${String(index + 1).padStart(3, "0")}`,
        severity: "blocker",
        source: "target_execution",
        classification,
        action_type: "implementation_patch",
        summary: `${String(command.command ?? id)} failed.`,
        evidence: {
          command: command.command,
          exit_code: command.exit_code,
          stdout_tail: command.stdout,
          stderr_tail: command.stderr
        },
        source_artifacts: ["14-target-execution/target-execution-report.json"],
        target_files: id === "install" ? ["package.json", "package-lock.json"] : ["target implementation files named in the command output"],
        recommended_action: actionForClassification(classification),
        rerun_commands: ["npm run typecheck", "npm run build", "npm run archetype:playwright", "archetype verify-target --out <archetype-output> --target <target-frontend>"]
      };
    });
}

function playwrightRepairTasks(targetDir: string | null, contract: JsonRecord, sourceFileManifest: JsonRecord): JsonRecord[] {
  if (!targetDir) return [];
  const resultPath = path.join(targetDir, "test-results", "archetype-playwright-results.json");
  if (!existsSync(resultPath)) return [];
  const failures = collectFailedPlaywrightTests(readJsonSafe(resultPath));
  const scenarios = scenarioById(contract);
  return failures.map((failure, index) => {
    const scenarioId = failure.title.match(/PW-[A-Z]+-[A-Za-z0-9-]+/)?.[0] ?? failure.title;
    const scenario = scenarios.get(scenarioId) ?? {};
    const classification = classificationForScenario(scenarioId);
    return {
      task_id: `REPAIR-PW-${String(index + 1).padStart(3, "0")}`,
      severity: "blocker",
      source: "playwright",
      classification,
      action_type: "implementation_patch",
      scenario_id: scenarioId,
      summary: `${scenarioId} failed browser verification.`,
      evidence: {
        title: failure.title,
        message: failure.message,
        route: scenario.route ?? scenario.resolved_route ?? null,
        screen_id: scenario.screen_id ?? null,
        state: scenario.state ?? null
      },
      source_artifacts: [
        "verification/playwright-verification-contract.json",
        "verification/playwright-evidence.json",
        "target:test-results/archetype-playwright-results.json"
      ],
      target_files: targetFilesForScenario(scenario, sourceFileManifest),
      recommended_action: actionForClassification(classification),
      rerun_commands: ["npm run archetype:playwright", "archetype verify-target --out <archetype-output> --target <target-frontend>"]
    };
  });
}

function blockerRepairTasks(report: JsonRecord, existingCount: number): JsonRecord[] {
  return asArray(report.blockers).map(String).filter(Boolean).map((blocker, index) => {
    const lower = blocker.toLowerCase();
    const missingScript = lower.includes("archetype:playwright");
    const classification = missingScript ? "playwright_script_missing" : "target_execution_blocker";
    return {
      task_id: `REPAIR-BLOCKER-${String(existingCount + index + 1).padStart(3, "0")}`,
      severity: "blocker",
      source: "target_execution",
      classification,
      action_type: "implementation_patch",
      summary: blocker,
      evidence: { blocker },
      source_artifacts: ["14-target-execution/target-execution-report.json"],
      target_files: missingScript ? ["package.json"] : ["target implementation files named by blocker"],
      recommended_action: missingScript
        ? "Add the generated npm script `archetype:playwright` and keep it mapped to `playwright test --config=playwright.config.ts`."
        : "Patch the named target blocker, then rerun verification.",
      rerun_commands: ["archetype repair --out <archetype-output> --target <target-frontend>", "archetype verify-target --out <archetype-output> --target <target-frontend>"]
    };
  });
}

function buildRepairTaskQueue(input: {
  status: "pending" | "pass" | "fail" | "warning";
  generatedAt: string | null;
  outputDir: string | null;
  targetDir: string | null;
  targetExecution: JsonRecord;
  playwrightEvidence: JsonRecord;
  playwrightContract: JsonRecord;
  sourceFileManifest: JsonRecord;
}): JsonRecord {
  const tasks = input.status === "fail"
    ? [
        ...commandRepairTasks(input.targetExecution),
        ...playwrightRepairTasks(input.targetDir, input.playwrightContract, input.sourceFileManifest)
      ]
    : [];
  if (input.status === "fail") tasks.push(...blockerRepairTasks(input.targetExecution, tasks.length));
  const dedupedTasks = tasks.filter((task, index, list) => {
    const key = JSON.stringify([task.source, task.classification, task.summary, task.scenario_id ?? ""]);
    return list.findIndex((candidate) => JSON.stringify([candidate.source, candidate.classification, candidate.summary, candidate.scenario_id ?? ""]) === key) === index;
  });
  const nextState = input.status === "fail" ? "revising" : input.status === "pass" ? "done" : "verifying_with_playwright";
  return {
    queue_version: "1.0",
    status: input.status,
    generated_at: input.generatedAt,
    output_dir: input.outputDir,
    target_dir: input.targetDir,
    source_contract: REPAIR_CONTRACT_PATH,
    source_target_execution: "14-target-execution/target-execution-report.json",
    source_playwright_evidence: "verification/playwright-evidence.json",
    next_lifecycle_state: nextState,
    task_count: dedupedTasks.length,
    tasks: dedupedTasks,
    traceability: {
      canonical_spec: "spec/archetype-spec.json",
      test_first_contract: "test-first/test-first-contract.json",
      playwright_contract: "verification/playwright-verification-contract.json",
      playwright_evidence: "verification/playwright-evidence.json",
      target_execution: "14-target-execution/target-execution-report.json"
    },
    completion_gate: input.status === "fail"
      ? "Do not declare completion until every blocker task is resolved and verify-target writes passing evidence."
      : input.status === "pass"
        ? "No repair tasks remain after verify-target wrote passing evidence. Completion may proceed if external production warnings are named."
        : "Run verify-target to produce repair tasks or completion evidence.",
    blockers: input.status === "fail" && dedupedTasks.length === 0 ? ["Verification failed but no repair tasks could be classified. Inspect target execution and Playwright evidence manually."] : [],
    warnings: input.status === "pass"
      ? ["Production backend, auth, compliance, and final content review remain external confirmations."]
      : input.status === "pending"
        ? ["Repair queue is pending until target verification runs."]
        : []
  };
}

function driftReportMarkdown(report: JsonRecord): string {
  const drifts = asArray(report.drifts).map(asRecord);
  return [
    "# Drift Report",
    "",
    `Status: ${String(report.status ?? "pending")}`,
    `Generated: ${String(report.generated_at ?? "pending")}`,
    `Next lifecycle state: ${String(report.next_lifecycle_state ?? "verifying_with_playwright")}`,
    "",
    "## Drift Summary",
    "",
    `- Drift count: ${String(report.drift_count ?? 0)}`,
    `- Implementation patch count: ${String(report.implementation_patch_count ?? 0)}`,
    `- Contract revision review count: ${String(report.contract_revision_review_count ?? 0)}`,
    "",
    "## Drifts",
    "",
    drifts.length > 0
      ? drifts.map((drift) => `- ${String(drift.task_id)}: ${String(drift.classification)} - ${String(drift.summary)}`).join("\n")
      : "None.",
    "",
    "## Rule",
    "",
    "Patch implementation drift first. Revise the contract only when approved source evidence proves the canonical spec is wrong."
  ].join("\n");
}

function buildDriftReport(queue: JsonRecord): JsonRecord {
  const tasks = asArray(queue.tasks).map(asRecord);
  const implementationTasks = tasks.filter((task) => task.action_type === "implementation_patch");
  const contractTasks = tasks.filter((task) => task.action_type === "contract_revision_review");
  return {
    drift_report_version: "1.0",
    status: queue.status,
    generated_at: queue.generated_at,
    source_task_queue: REPAIR_TASK_QUEUE_PATH,
    next_lifecycle_state: queue.next_lifecycle_state,
    drift_count: tasks.length,
    implementation_patch_count: implementationTasks.length,
    contract_revision_review_count: contractTasks.length,
    drifts: tasks.map((task) => ({
      task_id: task.task_id,
      classification: task.classification,
      action_type: task.action_type,
      summary: task.summary,
      source_artifacts: task.source_artifacts,
      target_files: task.target_files
    })),
    traceability: queue.traceability,
    blockers: queue.blockers ?? [],
    warnings: queue.warnings ?? []
  };
}

function repairPlanMarkdown(queue: JsonRecord): string {
  const tasks = asArray(queue.tasks).map(asRecord);
  return [
    "# Repair Plan",
    "",
    `Status: ${String(queue.status ?? "pending")}`,
    `Generated: ${String(queue.generated_at ?? "pending")}`,
    `Next lifecycle state: ${String(queue.next_lifecycle_state ?? "verifying_with_playwright")}`,
    "",
    "## Policy",
    "",
    "- Patch implementation first.",
    "- Revise the canonical spec only when user-approved evidence proves the contract is wrong.",
    "- Keep failing tests and Playwright evidence until the same checks pass.",
    "",
    "## Tasks",
    "",
    tasks.length > 0
      ? tasks.map((task) => [
          `### ${String(task.task_id)} - ${String(task.classification)}`,
          "",
          `Severity: ${String(task.severity ?? "blocker")}`,
          `Action type: ${String(task.action_type ?? "implementation_patch")}`,
          `Summary: ${String(task.summary ?? "")}`,
          "",
          "Target files:",
          ...asArray(task.target_files).map((file) => `- ${String(file)}`),
          "",
          `Recommended action: ${String(task.recommended_action ?? "")}`,
          "",
          "Rerun:",
          ...asArray(task.rerun_commands).map((command) => `- \`${String(command)}\``)
        ].join("\n")).join("\n\n")
      : "No repair tasks.",
    "",
    "## Completion Gate",
    "",
    String(queue.completion_gate ?? "Run verify-target before completion.")
  ].join("\n");
}

export function buildRevisionArtifacts(input: {
  evidence: EvidenceLedger;
  product: ProductArtifacts;
  experience: ExperienceArtifacts;
  frontendContract: FrontendContractArtifacts;
  dsag: DSAGGraph;
}): RevisionArtifacts {
  const artifactDependencyGraph = {
    graph_version: "1.0",
    nodes: Object.entries(ARTIFACTS).map(([id, path]) => ({ id, path })),
    edges: [
      { from: "evidence", to: "productModel", reason: "Product model derives from evidence." },
      { from: "evidence", to: "userModel", reason: "User model derives from evidence." },
      { from: "productModel", to: "routeMap", reason: "Routes depend on product workflows and jobs." },
      { from: "productModel", to: "entityModel", reason: "Entities derive from product domain." },
      { from: "routeMap", to: "screenInventory", reason: "Screen inventory mirrors route architecture." },
      { from: "screenInventory", to: "screenSpecs", reason: "Screen specs implement screen inventory." },
      { from: "screenSpecs", to: "componentContracts", reason: "Component contracts must cover required screen composition." },
      { from: "tokenContracts", to: "componentContracts", reason: "Component contracts depend on token availability." },
      { from: "typographySystem", to: "componentContracts", reason: "Components consume typography roles." },
      { from: "componentContracts", to: "componentRegistry", reason: "Registry entries summarize deterministic component contracts." },
      { from: "screenSpecs", to: "patternContracts", reason: "Pattern contracts must cover product-specific screen needs." },
      { from: "patternContracts", to: "patternRegistry", reason: "Registry entries summarize deterministic pattern contracts." },
      { from: "entityModel", to: "dataContracts", reason: "Data contracts expose product entities." },
      { from: "dataContracts", to: "dataOperationContracts", reason: "Operations depend on declared entity data contracts." },
      { from: "screenSpecs", to: "actionContracts", reason: "Actions depend on screen actions, states, and permissions." },
      { from: "screenSpecs", to: "formContracts", reason: "Forms depend on screen workflow and entity requirements." },
      { from: "screenSpecs", to: "frontendContract", reason: "Frontend contract must build declared screens." },
      { from: "componentContracts", to: "frontendContract", reason: "Frontend contract constrains component APIs and usage." },
      { from: "patternContracts", to: "frontendContract", reason: "Frontend contract constrains pattern composition and usage." },
      { from: "dataOperationContracts", to: "frontendContract", reason: "Frontend build needs query and mutation behavior." },
      { from: "actionContracts", to: "frontendContract", reason: "Frontend build needs action preconditions and results." },
      { from: "formContracts", to: "frontendContract", reason: "Frontend build needs form validation behavior." },
      { from: "frontendContract", to: "verificationContracts", reason: "Verification contracts prove the frontend contract was implemented." },
      { from: "dataOperationContracts", to: "productionIntegrationContracts", reason: "Production integration maps generated operations to backend adapter contracts." },
      { from: "actionContracts", to: "productionIntegrationContracts", reason: "Production integration maps actions to auth and permission guards." },
      { from: "formContracts", to: "productionIntegrationContracts", reason: "Production integration maps forms to production validation alignment." },
      { from: "verificationContracts", to: "productionIntegrationContracts", reason: "Production integration declares target-stack proof work from verification contracts." },
      { from: "frontendContract", to: "targetFrontend", reason: "Target frontend source manifest depends on the frontend build contract." },
      { from: "componentContracts", to: "targetFrontend", reason: "Target component files derive from component contracts." },
      { from: "patternContracts", to: "targetFrontend", reason: "Target pattern files derive from pattern contracts." },
      { from: "productionIntegrationContracts", to: "targetFrontend", reason: "Target adapter files derive from production integration contracts." },
      { from: "targetFrontend", to: "readiness", reason: "Readiness includes deterministic source generation coverage." },
      { from: "productionIntegrationContracts", to: "readiness", reason: "Readiness reports require explicit production confirmation gates." },
      { from: "verificationContracts", to: "readiness", reason: "Readiness depends on implementation proof coverage." },
      { from: "frontendContract", to: "dsag", reason: "DSAG validates implementation graph coherence." },
      { from: "dsag", to: "readiness", reason: "Readiness depends on graph integrity." }
    ]
  };

  const invalidationRules = {
    rules: [
      {
        trigger: "evidence_changed",
        invalidates: ["productModel", "userModel", "entityModel", "routeMap", "screenInventory", "screenSpecs", "designSystem", "frontendContract", "targetFrontend", "dsag", "readiness"],
        reason: "Evidence changes can alter all downstream architecture decisions."
      },
      {
        trigger: "product_model_changed",
        invalidates: ["routeMap", "screenInventory", "screenSpecs", "designSystem", "frontendContract", "targetFrontend", "dsag", "readiness"],
        reason: "Product and workflow changes alter UX architecture and contracts."
      },
      {
        trigger: "route_map_changed",
        invalidates: ["screenInventory", "screenSpecs", "frontendContract", "targetFrontend", "dsag", "readiness"],
        reason: "Routes determine screen inventory and build contract."
      },
      {
        trigger: "screen_spec_changed",
        invalidates: ["componentContracts", "componentRegistry", "patternContracts", "patternRegistry", "dataOperationContracts", "actionContracts", "formContracts", "frontendContract", "verificationContracts", "productionIntegrationContracts", "targetFrontend", "dsag", "readiness"],
        reason: "Screen composition determines system and contract requirements."
      },
      {
        trigger: "component_registry_changed",
        invalidates: ["targetFrontend", "frontendContract", "dsag", "readiness"],
        reason: "Contract and graph must reflect component availability."
      },
      {
        trigger: "token_contract_changed",
        invalidates: ["componentContracts", "componentRegistry", "patternContracts", "patternRegistry", "frontendContract", "targetFrontend", "dsag", "readiness"],
        reason: "Token changes alter component, pattern, and frontend style contracts."
      },
      {
        trigger: "pattern_contract_changed",
        invalidates: ["patternRegistry", "frontendContract", "targetFrontend", "dsag", "readiness"],
        reason: "Pattern contract changes alter reusable product-specific composition."
      },
      {
        trigger: "data_contract_changed",
        invalidates: ["screenSpecs", "dataOperationContracts", "actionContracts", "formContracts", "frontendContract", "verificationContracts", "productionIntegrationContracts", "targetFrontend", "dsag", "readiness"],
        reason: "Data shape changes affect UI states, fixtures, and build expectations."
      },
      {
        trigger: "production_integration_changed",
        invalidates: ["dataOperationContracts", "actionContracts", "formContracts", "verificationContracts", "frontendContract", "targetFrontend", "readiness"],
        reason: "Backend, auth, copy, validation, or target-stack changes alter integration contracts and proof obligations."
      },
      {
        trigger: "accessibility_rule_changed",
        invalidates: ["screenSpecs", "componentContracts", "componentRegistry", "patternContracts", "patternRegistry", "frontendContract", "targetFrontend", "readiness"],
        reason: "Accessibility rules constrain screens, components, and export readiness."
      }
    ]
  };

  const initialChangeSet = {
    change_set_id: "initial_generation",
    change_type: "initial_generation",
    summary: "Initial compiler-generated package.",
    changed_decisions: input.evidence.decisions.map((decision) => decision.id),
    generated_routes: input.experience.routeMap.routes.map((route) => route.route),
    generated_screens: input.experience.screenSpecs.map((screen) => screen.screen_id),
    generated_contract_routes: (input.frontendContract.buildManifest.entry_routes as string[] | undefined) ?? [],
    dsag_nodes: input.dsag.nodes.length,
    dsag_edges: input.dsag.edges.length,
    invalidated_artifacts: [],
    regenerated_artifacts: Object.values(ARTIFACTS)
  };

  const approvalGates = {
    gates: [
      {
        id: "gate_product_understanding",
        label: "Product Understanding Approval",
        required_artifacts: [ARTIFACTS.evidence, ARTIFACTS.productModel, ARTIFACTS.userModel, ARTIFACTS.entityModel],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_ux_architecture",
        label: "UX Architecture Approval",
        required_artifacts: [ARTIFACTS.routeMap, ARTIFACTS.screenInventory],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_design_system",
        label: "Design System Direction Approval",
        required_artifacts: [ARTIFACTS.tokenContracts, ARTIFACTS.typographySystem, ARTIFACTS.componentContracts, ARTIFACTS.componentRegistry, ARTIFACTS.patternContracts, ARTIFACTS.patternRegistry],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_frontend_contract",
        label: "Frontend Contract Approval",
        required_artifacts: [ARTIFACTS.frontendContract, ARTIFACTS.dataContracts, ARTIFACTS.dataOperationContracts, ARTIFACTS.actionContracts, ARTIFACTS.formContracts, ARTIFACTS.verificationContracts, ARTIFACTS.productionIntegrationContracts],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_target_frontend_source",
        label: "Target Frontend Source Manifest Approval",
        required_artifacts: [ARTIFACTS.targetFrontend, ARTIFACTS.frontendContract, ARTIFACTS.productionIntegrationContracts],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_production_integration",
        label: "Production Integration Approval",
        required_artifacts: [ARTIFACTS.productionIntegrationContracts, ARTIFACTS.readiness],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_export",
        label: "Export Approval",
        required_artifacts: [ARTIFACTS.dsag, ARTIFACTS.readiness],
        approval_state: "pending_human_review"
      }
    ]
  };
  const repairContract = buildRepairContract();
  const repairTaskQueue = buildRepairTaskQueue({
    status: "pending",
    generatedAt: null,
    outputDir: null,
    targetDir: null,
    targetExecution: {},
    playwrightEvidence: {},
    playwrightContract: {},
    sourceFileManifest: {}
  });
  const driftReport = buildDriftReport(repairTaskQueue);

  return {
    revisionProtocol: [
      "# Revision Protocol",
      "",
      "Archetype revisions must preserve evidence traceability and artifact coherence.",
      "",
      "Process:",
      "",
      "1. Capture feedback as a revision request.",
      "2. Classify changed evidence, product decisions, UX architecture, design-system decisions, or frontend contract rules.",
      "3. Mark affected decisions as confirmed, candidate, missing, conflicted, or blocked.",
      "4. Use invalidation rules to mark stale artifacts.",
      "5. Regenerate only affected artifacts and their dependents.",
      "6. Rebuild DSAG and readiness reports.",
      "7. Produce a diff summary before export."
    ].join("\n"),
    artifactDependencyGraph,
    invalidationRules,
    initialChangeSet,
    approvalGates,
    decisionDiffPolicy: [
      "# Decision Diff Policy",
      "",
      "- Decision diffs compare decision ID, status, confidence, evidence refs, and decision text.",
      "- Candidate decisions must remain non-canonical until stronger evidence or explicit user approval exists.",
      "- Conflicted decisions must include the competing evidence refs and the reason they cannot both be true.",
      "- Low-confidence decisions may be confirmed only with canonical evidence or explicit user approval.",
      "- Diff summaries must list affected artifacts and validation changes."
    ].join("\n"),
    artifactInvalidationReport: [
      "# Artifact Invalidation Report",
      "",
      "Current revision: initial_generation",
      "",
      "No stale artifacts exist in the initial generated package.",
      "",
      "Future revisions must apply invalidation rules before export."
    ].join("\n"),
    repairContract,
    repairTaskQueue,
    repairPlan: repairPlanMarkdown(repairTaskQueue),
    driftReport,
    driftReportMarkdown: driftReportMarkdown(driftReport)
  };
}

export function updateRepairArtifactsFromLatest(outputDir: string, targetDir?: string | null): {
  status: "pending" | "pass" | "fail" | "warning";
  outputDir: string;
  targetDir: string | null;
  taskCount: number;
  artifacts: string[];
  blockers: string[];
  warnings: string[];
} {
  const targetExecutionPath = path.join(outputDir, "14-target-execution", "target-execution-report.json");
  const playwrightEvidencePath = path.join(outputDir, "verification", "playwright-evidence.json");
  const playwrightContractPath = path.join(outputDir, "verification", "playwright-verification-contract.json");
  const sourceFileManifestPath = path.join(outputDir, "12-target-frontend", "source-file-manifest.json");
  const targetExecution = readJsonSafe(targetExecutionPath);
  const playwrightEvidence = readJsonSafe(playwrightEvidencePath);
  const playwrightContract = readJsonSafe(playwrightContractPath);
  const sourceFileManifest = readJsonSafe(sourceFileManifestPath);
  const reportStatus = String(targetExecution.status ?? playwrightEvidence.status ?? "pending");
  const status: "pending" | "pass" | "fail" | "warning" =
    reportStatus === "pass" ? "pass" : reportStatus === "fail" ? "fail" : reportStatus === "warning" ? "warning" : "pending";
  const generatedAt = status === "pending" ? null : new Date().toISOString();
  const queue = buildRepairTaskQueue({
    status,
    generatedAt,
    outputDir,
    targetDir: targetDir ?? (typeof targetExecution.target_dir === "string" ? targetExecution.target_dir : null),
    targetExecution,
    playwrightEvidence,
    playwrightContract,
    sourceFileManifest
  });
  const drift = buildDriftReport(queue);
  const artifacts = [
    REPAIR_CONTRACT_PATH,
    REPAIR_TASK_QUEUE_PATH,
    REPAIR_PLAN_PATH,
    DRIFT_REPORT_PATH,
    DRIFT_REPORT_MARKDOWN_PATH
  ];
  writeJson(path.join(outputDir, REPAIR_CONTRACT_PATH), buildRepairContract());
  writeJson(path.join(outputDir, REPAIR_TASK_QUEUE_PATH), queue);
  writeText(path.join(outputDir, REPAIR_PLAN_PATH), repairPlanMarkdown(queue));
  writeJson(path.join(outputDir, DRIFT_REPORT_PATH), drift);
  writeText(path.join(outputDir, DRIFT_REPORT_MARKDOWN_PATH), driftReportMarkdown(drift));
  if (existsSync(path.join(outputDir, "lifecycle"))) {
    writeLifecycleExecutionStateFromLatest(outputDir, targetExecution, queue);
  }
  return {
    status,
    outputDir,
    targetDir: targetDir ?? (typeof targetExecution.target_dir === "string" ? targetExecution.target_dir : null),
    taskCount: Number(queue.task_count ?? 0),
    artifacts,
    blockers: asArray(queue.blockers).map(String),
    warnings: asArray(queue.warnings).map(String)
  };
}
