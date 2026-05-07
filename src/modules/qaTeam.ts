import type { ArchetypePackage } from "../core/types";

type JsonRecord = Record<string, unknown>;

export const QA_AGENT_ROLES = [
  "qa-lead.md",
  "playwright-e2e-engineer.md",
  "ui-state-qa.md",
  "malformed-data-qa.md",
  "accessibility-qa.md",
  "visual-regression-qa.md",
  "contract-drift-qa.md"
];

export const REQUIRED_QA_ARTIFACTS = [
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "qa/malformed-data-results.json",
  "qa/accessibility-results.md",
  "qa/visual-regression-report.md",
  "qa/contract-drift-report.md",
  "10-revision/repair-task-queue.json"
];

export interface QaArtifacts {
  scenarioCatalog: JsonRecord;
  playwrightResults: JsonRecord;
  malformedDataResults: JsonRecord;
  accessibilityResultsMarkdown: string;
  visualRegressionReportMarkdown: string;
  contractDriftReportMarkdown: string;
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function records(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  if (Array.isArray(record.scenarios)) return record.scenarios.map(asRecord);
  if (Array.isArray(record.tests)) return record.tests.map(asRecord);
  if (Array.isArray(record.items)) return record.items.map(asRecord);
  return Object.values(record).filter((item) => typeof item === "object" && item !== null).map(asRecord);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function statusValue(value: unknown): "pending" | "pass" | "fail" | "warning" {
  return value === "pass" || value === "fail" || value === "warning" ? value : "pending";
}

function qaOwnerForScenario(type: string): string {
  const owners: Record<string, string> = {
    route: "playwright-e2e-engineer.md",
    flow: "playwright-e2e-engineer.md",
    responsive: "ui-state-qa.md",
    screen_state: "ui-state-qa.md",
    malformed_data: "malformed-data-qa.md",
    accessibility: "accessibility-qa.md",
    visual_smoke: "visual-regression-qa.md",
    contract_drift: "contract-drift-qa.md"
  };
  return owners[type] ?? "qa-lead.md";
}

function scenarioStatus(evidenceStatus: string): string {
  if (evidenceStatus === "pass") return "pass";
  if (evidenceStatus === "fail") return "fail";
  return "pending";
}

function buildMalformedScenarios(testFirstContract: JsonRecord): JsonRecord[] {
  const suites = records(testFirstContract.suites);
  const integrationTests: JsonRecord[] = suites.flatMap((suite) =>
    records(suite.tests).map((test): JsonRecord => ({ ...test, suite_type: suite.suite_type ?? test.suite_type }))
  ).filter((test) => String(test.suite_type) === "integration");
  const sourceTests: JsonRecord[] = integrationTests.length > 0 ? integrationTests : suites.flatMap((suite) => records(suite.tests)).slice(0, 6);
  return sourceTests.slice(0, 12).map((test, index) => ({
    scenario_id: `QA-MALFORMED-${String(index + 1).padStart(3, "0")}`,
    type: "malformed_data",
    owner_agent: "malformed-data-qa.md",
    source_test_id: stringValue(test.test_id, `test_${index + 1}`),
    target_file: stringValue(test.target_file, "tests/integration/archetype-contracts.spec.ts"),
    malformed_cases: [
      "missing_required_value",
      "invalid_identifier",
      "empty_payload",
      "permission_denied_fixture",
      "stale_or_conflicting_payload"
    ],
    evidence_artifact: "qa/malformed-data-results.json",
    evidence_artifacts: [
      "qa/malformed-data-results.json",
      "test-first/test-first-contract.json",
      "06-frontend-agent-contract/form-contracts.json",
      "06-frontend-agent-contract/data-operation-contracts.json"
    ],
    status: "pending"
  }));
}

function buildScenarioCatalog(input: {
  playwrightContract: JsonRecord;
  testFirstContract: JsonRecord;
  playwrightEvidence: JsonRecord;
}): JsonRecord {
  const evidenceStatus = statusValue(input.playwrightEvidence.status);
  const playwrightScenarios = records(input.playwrightContract.scenarios).map((scenario) => {
    const type = stringValue(scenario.type, "unknown");
    return {
      scenario_id: stringValue(scenario.scenario_id, "unknown"),
      type,
      owner_agent: qaOwnerForScenario(type),
      source_contract: "verification/playwright-verification-contract.json",
      route: scenario.route,
      screen_id: scenario.screen_id,
      state: scenario.state,
      evidence_artifacts: [
        "qa/playwright-results.json",
        "verification/playwright-evidence.json",
        ...(type === "accessibility" ? ["qa/accessibility-results.md"] : []),
        ...(type === "visual_smoke" ? ["qa/visual-regression-report.md"] : [])
      ],
      status: scenarioStatus(evidenceStatus)
    };
  });
  const malformedScenarios = buildMalformedScenarios(input.testFirstContract);
  return {
    artifact_version: "1.0",
    source_scope: "HL-10",
    lifecycle_phase: "qa_verification",
    rule: "QA produces evidence, not vibes.",
    qa_agents: QA_AGENT_ROLES,
    required_artifacts: REQUIRED_QA_ARTIFACTS,
    scenarios: [...playwrightScenarios, ...malformedScenarios],
    coverage: {
      playwright_scenarios: playwrightScenarios.length,
      malformed_data_scenarios: malformedScenarios.length,
      total_scenarios: playwrightScenarios.length + malformedScenarios.length
    },
    blockers: playwrightScenarios.length === 0 ? ["No Playwright QA scenarios were generated."] : [],
    warnings: evidenceStatus === "pending" ? ["QA scenario execution is pending until verify-target runs."] : []
  };
}

function buildPlaywrightResults(input: {
  playwrightContract: JsonRecord;
  playwrightEvidence: JsonRecord;
  targetExecution: JsonRecord;
}): JsonRecord {
  const evidenceStatus = statusValue(input.playwrightEvidence.status);
  const summary = asRecord(input.playwrightEvidence.summary);
  return {
    artifact_version: "1.0",
    source_scope: "HL-10",
    lifecycle_phase: "qa_verification",
    owner_agent: "playwright-e2e-engineer.md",
    rule: "QA produces evidence, not vibes.",
    status: evidenceStatus,
    source_contract: "verification/playwright-verification-contract.json",
    source_evidence: "verification/playwright-evidence.json",
    source_target_execution: "14-target-execution/target-execution-report.json",
    command: input.playwrightEvidence.command ?? "npm run archetype:playwright",
    coverage: input.playwrightEvidence.coverage ?? input.playwrightContract.coverage ?? {},
    summary,
    scenario_count: records(input.playwrightContract.scenarios).length,
    target_execution_status: input.targetExecution.status ?? "pending",
    proof_artifacts: [
      "qa/playwright-results.json",
      "verification/playwright-evidence.json",
      "verification/playwright-evidence.md",
      "target:test-results/archetype-playwright-results.json",
      "target:playwright-report"
    ],
    blockers: asArray(input.playwrightEvidence.blockers),
    warnings: asArray(input.playwrightEvidence.warnings)
  };
}

function buildMalformedDataResults(input: {
  scenarioCatalog: JsonRecord;
  targetExecution: JsonRecord;
}): JsonRecord {
  const scenarios = records(input.scenarioCatalog.scenarios).filter((scenario) => scenario.type === "malformed_data");
  const executed = input.targetExecution.status === "pass" && String(asRecord(input.targetExecution.summary).playwright) === "pass";
  return {
    artifact_version: "1.0",
    source_scope: "HL-10",
    lifecycle_phase: "qa_verification",
    owner_agent: "malformed-data-qa.md",
    rule: "QA produces evidence, not vibes.",
    status: executed ? "warning" : "pending",
    source_contract: "test-first/test-first-contract.json",
    scenarios,
    results: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      status: "pending",
      evidence: "Defined from test-first integration obligations; runtime malformed-data execution is not complete until a target test runner records results.",
      required_evidence_artifact: "qa/malformed-data-results.json"
    })),
    proof_artifacts: [
      "qa/malformed-data-results.json",
      "test-first/test-first-contract.json",
      "06-frontend-agent-contract/form-contracts.json",
      "06-frontend-agent-contract/data-operation-contracts.json"
    ],
    blockers: scenarios.length === 0 ? ["No malformed-data scenarios were generated from test-first obligations."] : [],
    warnings: ["Malformed-data QA is evidence-tracked but remains pending until the target executes the generated malformed data tests."]
  };
}

function markdownReport(title: string, lines: string[]): string {
  return [title, "", ...lines].join("\n");
}

function buildAccessibilityResults(input: { playwrightContract: JsonRecord; playwrightEvidence: JsonRecord }): string {
  const accessibilityScenarios = records(input.playwrightContract.scenarios).filter((scenario) => scenario.type === "accessibility");
  const status = statusValue(input.playwrightEvidence.status);
  return markdownReport("# QA Accessibility Results", [
    `Status: ${status}`,
    "Source scope: HL-10",
    "Owner agent: accessibility-qa.md",
    "Rule: QA produces evidence, not vibes.",
    "",
    "## Evidence",
    "",
    "- `qa/accessibility-results.md`",
    "- `verification/playwright-evidence.json`",
    "- `verification/playwright-verification-contract.json`",
    "- `target:test-results/archetype-playwright-results.json`",
    "",
    "## Scenario Count",
    "",
    String(accessibilityScenarios.length),
    "",
    "## Result",
    "",
    status === "pass"
      ? "Playwright accessibility scenarios passed for the generated target evidence."
      : "Accessibility QA is pending or failed until Playwright evidence passes."
  ]);
}

function buildVisualRegressionReport(input: { playwrightContract: JsonRecord; playwrightEvidence: JsonRecord }): string {
  const visualScenarios = records(input.playwrightContract.scenarios).filter((scenario) => scenario.type === "visual_smoke");
  const status = statusValue(input.playwrightEvidence.status);
  return markdownReport("# QA Visual Regression Report", [
    `Status: ${status}`,
    "Source scope: HL-10",
    "Owner agent: visual-regression-qa.md",
    "Rule: QA produces evidence, not vibes.",
    "",
    "## Evidence",
    "",
    "- `qa/visual-regression-report.md`",
    "- `verification/playwright-evidence.json`",
    "- `target:test-results/archetype-visual-smoke/`",
    "- `target:playwright-report/`",
    "",
    "## Screenshot Obligations",
    "",
    ...visualScenarios.map((scenario) => `- ${String(scenario.scenario_id)}: ${String(scenario.screenshot_path ?? "screenshot required")}`),
    "",
    "## Result",
    "",
    status === "pass"
      ? "Visual-smoke screenshots were captured as browser evidence."
      : "Visual regression QA is pending or failed until screenshot evidence exists."
  ]);
}

function buildContractDriftReport(input: {
  playwrightEvidence: JsonRecord;
  repairTaskQueue: JsonRecord;
  driftReport: JsonRecord;
  targetExecution: JsonRecord;
}): string {
  const repairStatus = statusValue(input.repairTaskQueue.status);
  const taskCount = Number(input.repairTaskQueue.task_count ?? 0);
  const driftCount = Number(input.driftReport.drift_count ?? taskCount);
  return markdownReport("# QA Contract Drift Report", [
    `Status: ${repairStatus}`,
    "Source scope: HL-10",
    "Owner agent: contract-drift-qa.md",
    "Rule: QA produces evidence, not vibes.",
    "",
    "## Evidence",
    "",
    "- `qa/contract-drift-report.md`",
    "- `10-revision/repair-task-queue.json`",
    "- `10-revision/drift-report.json`",
    "- `14-target-execution/target-execution-report.json`",
    "- `verification/playwright-evidence.json`",
    "",
    "## Drift Summary",
    "",
    `- Target execution: ${String(input.targetExecution.status ?? "pending")}`,
    `- Playwright evidence: ${String(input.playwrightEvidence.status ?? "pending")}`,
    `- Repair queue status: ${repairStatus}`,
    `- Repair tasks: ${taskCount}`,
    `- Drift count: ${driftCount}`,
    "",
    "## Result",
    "",
    repairStatus === "pass" && taskCount === 0
      ? "No unresolved contract drift remains in the repair queue."
      : "Contract drift remains pending or failed until the repair queue is empty."
  ]);
}

export function buildQaArtifactsFromRecords(input: {
  playwrightContract: JsonRecord;
  playwrightEvidence: JsonRecord;
  testFirstContract: JsonRecord;
  repairTaskQueue?: JsonRecord;
  driftReport?: JsonRecord;
  targetExecution?: JsonRecord;
}): QaArtifacts {
  const targetExecution = input.targetExecution ?? {};
  const repairTaskQueue = input.repairTaskQueue ?? {};
  const driftReport = input.driftReport ?? {};
  const scenarioCatalog = buildScenarioCatalog({
    playwrightContract: input.playwrightContract,
    playwrightEvidence: input.playwrightEvidence,
    testFirstContract: input.testFirstContract
  });
  return {
    scenarioCatalog,
    playwrightResults: buildPlaywrightResults({
      playwrightContract: input.playwrightContract,
      playwrightEvidence: input.playwrightEvidence,
      targetExecution
    }),
    malformedDataResults: buildMalformedDataResults({ scenarioCatalog, targetExecution }),
    accessibilityResultsMarkdown: buildAccessibilityResults({
      playwrightContract: input.playwrightContract,
      playwrightEvidence: input.playwrightEvidence
    }),
    visualRegressionReportMarkdown: buildVisualRegressionReport({
      playwrightContract: input.playwrightContract,
      playwrightEvidence: input.playwrightEvidence
    }),
    contractDriftReportMarkdown: buildContractDriftReport({
      playwrightEvidence: input.playwrightEvidence,
      repairTaskQueue,
      driftReport,
      targetExecution
    })
  };
}

export function buildPendingQaArtifacts(pkg: ArchetypePackage): QaArtifacts {
  return buildQaArtifactsFromRecords({
    playwrightContract: pkg.playwright.contractJson,
    playwrightEvidence: pkg.playwright.evidenceJson,
    testFirstContract: pkg.testFirst.contractJson,
    repairTaskQueue: pkg.revision.repairTaskQueue,
    driftReport: pkg.revision.driftReport,
    targetExecution: pkg.targetExecution.executionReport
  });
}
