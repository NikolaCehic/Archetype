import type { ArchetypePackage } from "../core/types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function status(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value : "pending";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function suiteTypes(contract: JsonRecord): string[] {
  return asArray(contract.suites).map((suite) => String(asRecord(suite).suite_type ?? "")).filter(Boolean);
}

function hasRequiredTestSuites(contract: JsonRecord): boolean {
  const suites = new Set(suiteTypes(contract));
  return ["smoke", "e2e", "ui", "accessibility", "integration", "unit"].every((suite) => suites.has(suite));
}

function hasPlaywrightCoverage(contract: JsonRecord): boolean {
  const coverage = asRecord(contract.coverage);
  return numberValue(coverage.route_scenarios) > 0 &&
    numberValue(coverage.state_scenarios) > 0 &&
    numberValue(coverage.flow_scenarios) > 0 &&
    numberValue(coverage.responsive_scenarios) > 0 &&
    numberValue(coverage.accessibility_scenarios) > 0 &&
    numberValue(coverage.visual_smoke_scenarios) > 0;
}

function currentExecutionState(input: {
  implementationAuthorized: boolean;
  testFirstContract: JsonRecord;
  playwrightContract: JsonRecord;
  playwrightEvidence: JsonRecord;
  targetExecution: JsonRecord;
  repairTaskQueue: JsonRecord;
}): string {
  if (!input.implementationAuthorized) return "test_first_authoring";
  const repairStatus = status(input.repairTaskQueue.status);
  const targetStatus = status(input.targetExecution.status);
  const playwrightStatus = status(input.playwrightEvidence.status);
  const taskCount = numberValue(input.repairTaskQueue.task_count);
  if (repairStatus === "fail" || taskCount > 0 || targetStatus === "fail" || playwrightStatus === "fail") {
    return "repair_or_revision";
  }
  if (targetStatus === "pass" && playwrightStatus === "pass" && repairStatus === "pass") {
    return "completion";
  }
  if (targetStatus === "pending" && playwrightStatus === "pending") return "test_first_authoring";
  if (targetStatus !== "pending" || playwrightStatus !== "pending") return "qa_verification";
  return hasRequiredTestSuites(input.testFirstContract) && hasPlaywrightCoverage(input.playwrightContract)
    ? "implementation"
    : "test_first_authoring";
}

function gateStatus(condition: boolean, pending = false): string {
  if (condition) return "satisfied";
  return pending ? "pending" : "blocked";
}

export function buildLifecycleExecutionStateArtifact(input: {
  implementationAuthorized: boolean;
  packageId?: string;
  readinessTier?: string;
  testFirstContract: JsonRecord;
  playwrightContract: JsonRecord;
  playwrightEvidence: JsonRecord;
  targetExecution: JsonRecord;
  repairTaskQueue: JsonRecord;
  sourceFileManifest?: JsonRecord;
}): JsonRecord {
  const targetStatus = status(input.targetExecution.status);
  const playwrightStatus = status(input.playwrightEvidence.status);
  const repairStatus = status(input.repairTaskQueue.status);
  const repairTaskCount = numberValue(input.repairTaskQueue.task_count);
  const testContractReady = hasRequiredTestSuites(input.testFirstContract);
  const playwrightReady = hasPlaywrightCoverage(input.playwrightContract);
  const readyForCompletion = input.implementationAuthorized &&
    targetStatus === "pass" &&
    playwrightStatus === "pass" &&
    repairStatus === "pass" &&
    repairTaskCount === 0;
  const currentState = currentExecutionState({
    implementationAuthorized: input.implementationAuthorized,
    testFirstContract: input.testFirstContract,
    playwrightContract: input.playwrightContract,
    playwrightEvidence: input.playwrightEvidence,
    targetExecution: input.targetExecution,
    repairTaskQueue: input.repairTaskQueue
  });

  return {
    artifact_version: "1.0",
    source_scope: "HL-07",
    package_id: input.packageId ?? null,
    current_state: currentState,
    readiness_tier: input.readinessTier ?? null,
    implementation_authorized: input.implementationAuthorized,
    ready_for_completion: readyForCompletion,
    exit_condition: "`ready_for_completion` is true.",
    states: [
      {
        id: 9,
        state: "test_first_authoring",
        allowed: [
          "Generate smoke, E2E, UI, accessibility, integration, and unit test obligations.",
          "Materialize tests before product UI.",
          "Preserve initial red tests."
        ],
        forbidden: [
          "Write product UI before tests.",
          "Generate tests that only prove generated markers exist.",
          "Weaken tests to make implementation pass."
        ],
        outputs: [
          "test-first/test-first-contract.json",
          "test-first/test-first-plan.md",
          "test-first/test-quality-standard.json",
          "test-first/test-quality-standard.md",
          "test-first/playwright-contract.spec.ts",
          "test-first/vitest-contract.spec.ts"
        ]
      },
      {
        id: 10,
        state: "implementation",
        allowed: [
          "Build from the canonical contract.",
          "Use approved specialist guidance.",
          "Stay inside target architecture and file manifest."
        ],
        forbidden: [
          "Invent routes, screens, actions, entities, visual systems, or data behavior outside spec.",
          "Replace real behavior with generic success panels.",
          "Use untyped escape hatches."
        ],
        outputs: [
          "12-target-frontend/source-file-manifest.json",
          "12-target-frontend/route-component-map.json",
          "12-target-frontend/codegen-tasks.json",
          "target frontend source files"
        ]
      },
      {
        id: 11,
        state: "qa_verification",
        allowed: [
          "Run Playwright.",
          "Generate scenario catalog.",
          "Test malformed data, edge states, accessibility, responsiveness, and visual evidence.",
          "Detect contract drift."
        ],
        forbidden: [
          "Treat passing smoke tests as sufficient QA.",
          "Ignore visual or behavioral drift because selectors exist."
        ],
        outputs: [
          "13-e2e/e2e-scenarios.json",
          "13-e2e/e2e-results.json",
          "13-e2e/e2e-findings.md",
          "verification/playwright-verification-contract.json",
          "verification/playwright-evidence.json",
          "verification/playwright-evidence.md",
          "qa/scenario-catalog.json",
          "qa/playwright-results.json",
          "qa/malformed-data-results.json",
          "qa/accessibility-results.md",
          "qa/visual-regression-report.md",
          "qa/contract-drift-report.md",
          "14-target-execution/target-execution-report.json"
        ]
      },
      {
        id: 12,
        state: "repair_or_revision",
        allowed: [
          "Patch implementation drift first.",
          "Revise contract only with approved new evidence."
        ],
        forbidden: [
          "Revise contract to excuse bad implementation.",
          "Close with unresolved repair queue."
        ],
        outputs: [
          "10-revision/verification-repair-contract.json",
          "10-revision/repair-task-queue.json",
          "10-revision/repair-plan.md",
          "10-revision/drift-report.json"
        ]
      },
      {
        id: 13,
        state: "completion",
        allowed: ["Produce final report."],
        forbidden: [
          "Claim production readiness without evidence.",
          "Claim accessibility compliance without review."
        ],
        outputs: [
          "lifecycle/execution-state.json",
          "lifecycle/execution-state.md",
          "14-target-execution/target-execution-report.md",
          "verification/playwright-evidence.md",
          "10-revision/repair-task-queue.json"
        ]
      }
    ],
    gates: [
      {
        state: "test_first_authoring",
        status: gateStatus(testContractReady, true),
        evidence: {
          contract_path: "test-first/test-first-contract.json",
          required_suites: ["smoke", "e2e", "ui", "accessibility", "integration", "unit"],
          present_suites: suiteTypes(input.testFirstContract),
          red_phase_required: asRecord(input.testFirstContract.tdd_policy).red_phase_required === true,
          marker_only_tests_forbidden: true
        }
      },
      {
        state: "implementation",
        status: gateStatus(input.implementationAuthorized && targetStatus !== "pending", input.implementationAuthorized),
        evidence: {
          canonical_spec: "spec/archetype-spec.json",
          source_file_manifest: "12-target-frontend/source-file-manifest.json",
          target_execution_status: targetStatus,
          source_file_count: numberValue(input.sourceFileManifest?.file_count)
        }
      },
      {
        state: "qa_verification",
        status: gateStatus(playwrightStatus === "pass" && targetStatus === "pass", targetStatus === "pending" && playwrightStatus === "pending"),
        evidence: {
          playwright_contract: "verification/playwright-verification-contract.json",
          playwright_evidence: "verification/playwright-evidence.json",
          target_execution: "14-target-execution/target-execution-report.json",
          target_status: targetStatus,
          playwright_status: playwrightStatus,
          browser_scenarios: numberValue(asRecord(input.playwrightContract.coverage).total_scenarios),
          visual_smoke_scenarios: numberValue(asRecord(input.playwrightContract.coverage).visual_smoke_scenarios)
        }
      },
      {
        state: "repair_or_revision",
        status: repairStatus === "pass" ? "satisfied" : repairStatus === "fail" ? "blocked" : "pending",
        evidence: {
          repair_task_queue: "10-revision/repair-task-queue.json",
          repair_status: repairStatus,
          task_count: repairTaskCount,
          next_lifecycle_state: input.repairTaskQueue.next_lifecycle_state ?? null
        }
      },
      {
        state: "completion",
        status: readyForCompletion ? "satisfied" : "blocked",
        evidence: {
          ready_for_completion: readyForCompletion,
          required_conditions: [
            "implementation_authorized is true",
            "target execution status is pass",
            "Playwright evidence status is pass",
            "repair queue status is pass",
            "repair queue task_count is 0"
          ]
        }
      }
    ],
    proof_artifacts: [
      "test-first/test-first-contract.json",
      "test-first/test-quality-standard.json",
      "verification/playwright-verification-contract.json",
      "verification/playwright-evidence.json",
      "qa/scenario-catalog.json",
      "qa/playwright-results.json",
      "qa/malformed-data-results.json",
      "qa/accessibility-results.md",
      "qa/visual-regression-report.md",
      "qa/contract-drift-report.md",
      "14-target-execution/target-execution-report.json",
      "10-revision/repair-task-queue.json"
    ],
    blockers: readyForCompletion
      ? []
      : [
          ...(!input.implementationAuthorized ? ["Implementation is not authorized."] : []),
          ...(!testContractReady ? ["Test-first obligations are incomplete."] : []),
          ...(!playwrightReady ? ["Playwright verification coverage is incomplete."] : []),
          ...(repairStatus === "fail" || repairTaskCount > 0 ? ["Repair queue contains unresolved drift."] : [])
        ],
    warnings: readyForCompletion
      ? ["Production backend, auth, compliance, and final content review remain external confirmations."]
      : ["Completion remains blocked until implementation, Playwright evidence, and repair queue all pass."]
  };
}

export function buildLifecycleExecutionStateArtifacts(pkg: ArchetypePackage): {
  executionState: JsonRecord;
  executionStateMarkdown: string;
} {
  const executionState = buildLifecycleExecutionStateArtifact({
    implementationAuthorized: pkg.manifest.implementation_authorized,
    packageId: pkg.manifest.package_id,
    readinessTier: pkg.manifest.readiness_tier,
    testFirstContract: pkg.testFirst.contractJson,
    playwrightContract: pkg.playwright.contractJson,
    playwrightEvidence: pkg.playwright.evidenceJson,
    targetExecution: pkg.targetExecution.executionReport,
    repairTaskQueue: pkg.revision.repairTaskQueue,
    sourceFileManifest: pkg.targetFrontend.sourceFileManifest
  });
  return {
    executionState,
    executionStateMarkdown: lifecycleExecutionStateMarkdown(executionState)
  };
}

export function lifecycleExecutionStateMarkdown(artifact: JsonRecord): string {
  const states = asArray(artifact.states).map(asRecord);
  const gates = asArray(artifact.gates).map(asRecord);
  const blockers = asArray(artifact.blockers).map(String);
  const warnings = asArray(artifact.warnings).map(String);
  return [
    "# Lifecycle Execution State",
    "",
    `Source scope: ${String(artifact.source_scope ?? "unknown")}`,
    `Current state: ${String(artifact.current_state ?? "unknown")}`,
    `Ready for completion: ${String(artifact.ready_for_completion ?? false)}`,
    `Exit condition: ${String(artifact.exit_condition ?? "`ready_for_completion` is true.")}`,
    "",
    "## States",
    "",
    ...states.map((state) => `${String(state.id)}. ${String(state.state)} -> outputs: ${asArray(state.outputs).map(String).join(", ")}`),
    "",
    "## Gates",
    "",
    ...gates.map((gate) => `- ${String(gate.state)}: ${String(gate.status)}`),
    "",
    "## Blockers",
    "",
    ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker}`) : ["- None."]),
    "",
    "## Warnings",
    "",
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ["- None."])
  ].join("\n");
}
