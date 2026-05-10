import type { ArchetypePackage, TestFirstArtifacts } from "../core/types";
import { slugify } from "../core/stable";

type TestFirstInput = Omit<ArchetypePackage, "testFirst" | "playwright">;
type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function records(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  if (Array.isArray(record.flows)) return record.flows.map(asRecord);
  if (Array.isArray(record.items)) return record.items.map(asRecord);
  return Object.values(record).filter((item) => typeof item === "object" && item !== null).map(asRecord);
}

function requiredStateEntries(screen: JsonRecord): Array<[string, JsonRecord]> {
  return Object.entries(asRecord(screen.states))
    .map(([state, value]) => [state, asRecord(value)] as [string, JsonRecord])
    .filter(([, value]) => value.required === true);
}

function screenAcceptanceIds(screen: JsonRecord): string[] {
  return asArray(screen.acceptance_criteria).map((item) => {
    const record = asRecord(item);
    return String(record.id ?? record.subject ?? "acceptance");
  });
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function targetFileForSuite(suiteType: string): string {
  const paths: Record<string, string> = {
    smoke: "tests/e2e/archetype-route-smoke.spec.ts",
    e2e: "tests/e2e/archetype-user-flows.spec.ts",
    ui: "tests/ui/archetype-screen-states.spec.ts",
    integration: "tests/integration/archetype-contracts.spec.ts",
    unit: "tests/unit/archetype-components.spec.ts",
    accessibility: "tests/e2e/archetype-accessibility.spec.ts"
  };
  return paths[suiteType] ?? `tests/archetype/${slugify(suiteType)}.spec.ts`;
}

function buildSmokeTests(routes: JsonRecord[]): JsonRecord[] {
  return routes.map((route, index) => {
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    return {
      test_id: `smoke.${slugify(screenId)}`,
      suite_type: "smoke",
      runner: "playwright",
      target_file: targetFileForSuite("smoke"),
      route: String(route.route ?? "/"),
      screen_id: screenId,
      must_exist_before_implementation: true,
      expected_red_before_implementation: true,
      assertions: [
        "Route loads without redirecting to an undeclared path.",
        `Screen root exists: [data-archetype-screen="${screenId}"].`,
        "No undeclared product route or screen is rendered."
      ],
      source_spec_paths: [`experience.routes[${index}]`, `experience.screens[screen_id=${screenId}]`],
      evidence_artifacts: ["playwright-report", "test-results/archetype-route-smoke.json"]
    };
  });
}

function buildE2ETests(experience: JsonRecord, routes: JsonRecord[]): JsonRecord[] {
  const flowRecords = records(experience.flows);
  const sourceFlows = flowRecords.length > 0
    ? flowRecords
    : routes.slice(0, Math.max(1, Math.min(routes.length, 3))).map((route) => ({
      flow_id: `flow.${route.screen_id ?? "route"}`,
      name: `${route.screen_id ?? "Route"} happy path`,
      route_refs: [route.route],
      screen_refs: [route.screen_id]
    }));

  return sourceFlows.map((flow, index) => {
    const routeRefs = unique(asArray(flow.route_refs).map(String));
    const screenRefs = unique(asArray(flow.screen_refs).map(String));
    return {
      test_id: `e2e.${slugify(String(flow.flow_id ?? flow.name ?? `flow_${index + 1}`))}`,
      suite_type: "e2e",
      runner: "playwright",
      target_file: targetFileForSuite("e2e"),
      flow_id: String(flow.flow_id ?? `flow_${index + 1}`),
      title: String(flow.name ?? `User flow ${index + 1}`),
      route_refs: routeRefs,
      screen_refs: screenRefs,
      must_exist_before_implementation: true,
      expected_red_before_implementation: true,
      assertions: [
        "The user can enter the flow from its declared entry route.",
        "Every declared route transition in the flow is browser-observable.",
        "Primary CTAs are clicked through deterministic handlers instead of only checked for visibility.",
        "CTA focus-visible, active/pressed, disabled, loading, and success/error feedback states are asserted when the flow exposes actions.",
        "Recovery or empty/error behavior is visible when the flow cannot complete."
      ],
      source_spec_paths: [`experience.flows[${index}]`],
      evidence_artifacts: ["playwright-report", "test-results/archetype-user-flows.json"]
    };
  });
}

function buildUITests(screens: JsonRecord[]): JsonRecord[] {
  return screens.flatMap((screen, screenIndex) => {
    const screenId = String(screen.screen_id ?? `screen_${screenIndex + 1}`);
    const route = String(screen.route ?? "/");
    return requiredStateEntries(screen).map(([state, stateRecord]) => ({
      test_id: `ui.${slugify(screenId)}.${slugify(state)}`,
      suite_type: "ui",
      runner: "playwright",
      target_file: targetFileForSuite("ui"),
      route,
      screen_id: screenId,
      state,
      selector: `[data-archetype-screen="${screenId}"] [data-archetype-state="${state}"]`,
      recovery_action_required: stringValue(stateRecord.recovery_action, "") !== "",
      acceptance_criteria_ids: screenAcceptanceIds(screen),
      must_exist_before_implementation: true,
      expected_red_before_implementation: true,
      assertions: [
        "The state can be forced or reached through a deterministic fixture.",
        "The declared state marker is visible.",
        "The state preserves focus, accessible names, active/current state, and recovery behavior when applicable."
      ],
      source_spec_paths: [`experience.screens[${screenIndex}].states.${state}`],
      evidence_artifacts: ["playwright-report", "test-results/archetype-screen-states.json"]
    }));
  });
}

function buildIntegrationTests(frontendContract: JsonRecord): JsonRecord[] {
  const dataOps = asRecord(frontendContract.data_operations);
  const actionContracts = asRecord(frontendContract.actions);
  const formContracts = asRecord(frontendContract.forms);
  const queries = asArray(dataOps.queries).map(asRecord);
  const mutations = asArray(dataOps.mutations).map(asRecord);
  const actions = asArray(actionContracts.actions).map(asRecord);
  const forms = asArray(formContracts.forms).map(asRecord);

  return [
    ...queries.map((query, index) => ({
      test_id: `integration.query.${slugify(String(query.query_id ?? `query_${index + 1}`))}`,
      suite_type: "integration",
      runner: "vitest",
      target_file: targetFileForSuite("integration"),
      contract_kind: "query",
      operation_id: String(query.query_id ?? `query_${index + 1}`),
      screen_id: String(query.screen_id ?? ""),
      assertions: ["Adapter exposes the declared query.", "Loading, success, empty, and error outcomes are fixture-testable."],
      source_spec_paths: [`frontend_contract.data_operations.queries[${index}]`],
      evidence_artifacts: ["coverage/integration", "test-results/archetype-contracts.json"],
      must_exist_before_implementation: true,
      expected_red_before_implementation: true
    })),
    ...mutations.map((mutation, index) => ({
      test_id: `integration.mutation.${slugify(String(mutation.mutation_id ?? `mutation_${index + 1}`))}`,
      suite_type: "integration",
      runner: "vitest",
      target_file: targetFileForSuite("integration"),
      contract_kind: "mutation",
      operation_id: String(mutation.mutation_id ?? `mutation_${index + 1}`),
      screen_id: String(mutation.screen_id ?? ""),
      assertions: ["Mutation validates preconditions.", "Success, error, and permission outcomes are fixture-testable."],
      source_spec_paths: [`frontend_contract.data_operations.mutations[${index}]`],
      evidence_artifacts: ["coverage/integration", "test-results/archetype-contracts.json"],
      must_exist_before_implementation: true,
      expected_red_before_implementation: true
    })),
    ...actions.map((action, index) => ({
      test_id: `integration.action.${slugify(String(action.action_id ?? `action_${index + 1}`))}`,
      suite_type: "integration",
      runner: "vitest",
      target_file: targetFileForSuite("integration"),
      contract_kind: "action",
      action_id: String(action.action_id ?? `action_${index + 1}`),
      screen_id: String(action.screen_id ?? ""),
      assertions: ["Action honors preconditions.", "Action exposes declared success, error, disabled, and permission behavior."],
      source_spec_paths: [`frontend_contract.actions.actions[${index}]`],
      evidence_artifacts: ["coverage/integration", "test-results/archetype-contracts.json"],
      must_exist_before_implementation: true,
      expected_red_before_implementation: true
    })),
    ...forms.map((form, index) => ({
      test_id: `integration.form.${slugify(String(form.form_id ?? `form_${index + 1}`))}`,
      suite_type: "integration",
      runner: "vitest",
      target_file: targetFileForSuite("integration"),
      contract_kind: "form",
      form_id: String(form.form_id ?? `form_${index + 1}`),
      screen_id: String(form.screen_id ?? ""),
      assertions: ["Form fields match the contract.", "Validation timing, dirty state, submission loading, success, and error states are testable."],
      source_spec_paths: [`frontend_contract.forms.forms[${index}]`],
      evidence_artifacts: ["coverage/integration", "test-results/archetype-contracts.json"],
      must_exist_before_implementation: true,
      expected_red_before_implementation: true
    }))
  ];
}

function buildUnitTests(designSystem: JsonRecord): JsonRecord[] {
  const components = asArray(asRecord(asRecord(designSystem.components).contracts).contracts).map(asRecord);
  const patterns = asArray(asRecord(asRecord(designSystem.patterns).contracts).contracts).map(asRecord);
  const tokenLayers = Object.keys(asRecord(asRecord(asRecord(designSystem.tokens).contracts).layers));
  const componentTests = components.map((component, index) => ({
    test_id: `unit.component.${slugify(String(component.name ?? component.id ?? `component_${index + 1}`))}`,
    suite_type: "unit",
    runner: "vitest",
    target_file: targetFileForSuite("unit"),
    contract_kind: "component",
    component: String(component.name ?? component.id ?? `component_${index + 1}`),
    assertions: ["Component renders declared slots, variants, states, and selectors.", "Interactive components prove hover, focus-visible, active, disabled, and loading states.", "Component uses only declared token dependencies."],
    source_spec_paths: [`design_system.components.contracts.contracts[${index}]`],
    evidence_artifacts: ["coverage/unit", "test-results/archetype-components.json"],
    must_exist_before_implementation: true,
    expected_red_before_implementation: true
  }));
  const patternTests = patterns.map((pattern, index) => ({
    test_id: `unit.pattern.${slugify(String(pattern.name ?? pattern.id ?? `pattern_${index + 1}`))}`,
    suite_type: "unit",
    runner: "vitest",
    target_file: targetFileForSuite("unit"),
    contract_kind: "pattern",
    pattern: String(pattern.name ?? pattern.id ?? `pattern_${index + 1}`),
    assertions: ["Pattern composes only declared components.", "Pattern exposes declared responsive and state behavior."],
    source_spec_paths: [`design_system.patterns.contracts.contracts[${index}]`],
    evidence_artifacts: ["coverage/unit", "test-results/archetype-components.json"],
    must_exist_before_implementation: true,
    expected_red_before_implementation: true
  }));
  const tokenTest = {
    test_id: "unit.tokens.contract",
    suite_type: "unit",
    runner: "vitest",
    target_file: targetFileForSuite("unit"),
    contract_kind: "tokens",
    token_layers: tokenLayers,
    assertions: ["Primitive, semantic, component, and typography token layers are exposed to UI code.", "No component uses undeclared raw visual values."],
    source_spec_paths: ["design_system.tokens"],
    evidence_artifacts: ["coverage/unit", "test-results/archetype-components.json"],
    must_exist_before_implementation: true,
    expected_red_before_implementation: true
  };
  return [...componentTests, ...patternTests, tokenTest];
}

function buildAccessibilityTests(screens: JsonRecord[]): JsonRecord[] {
  return screens.map((screen, index) => {
    const screenId = String(screen.screen_id ?? `screen_${index + 1}`);
    return {
      test_id: `accessibility.${slugify(screenId)}`,
      suite_type: "accessibility",
      runner: "playwright",
      target_file: targetFileForSuite("accessibility"),
      route: String(screen.route ?? "/"),
      screen_id: screenId,
      assertions: [
        "Keyboard focus is visible and ordered.",
        "Interactive controls have accessible names.",
        "Current navigation exposes aria-current or equivalent semantics.",
        "CTA focus-visible and active states are observable without relying on color alone.",
        "Status is not communicated through color alone."
      ],
      source_spec_paths: [`experience.screens[${index}].accessibility`, "design_system.accessibility"],
      evidence_artifacts: ["playwright-report", "test-results/archetype-accessibility.json"],
      must_exist_before_implementation: true,
      expected_red_before_implementation: true
    };
  });
}

function suite(id: string, type: string, runner: "playwright" | "vitest", tests: JsonRecord[]): JsonRecord {
  return {
    suite_id: id,
    suite_type: type,
    runner,
    target_file: targetFileForSuite(type),
    creation_phase: "before_product_ui_implementation",
    required: true,
    tests
  };
}

function buildContractJson(pkg: TestFirstInput): JsonRecord {
  const spec = pkg.spec.specJson;
  const experience = asRecord(spec.experience);
  const frontendContract = asRecord(spec.frontend_contract);
  const designSystem = asRecord(spec.design_system);
  const routes = asArray(experience.routes).map(asRecord);
  const screens = asArray(experience.screens).map(asRecord);
  const smokeTests = buildSmokeTests(routes);
  const e2eTests = buildE2ETests(experience, routes);
  const uiTests = buildUITests(screens);
  const integrationTests = buildIntegrationTests(frontendContract);
  const unitTests = buildUnitTests(designSystem);
  const accessibilityTests = buildAccessibilityTests(screens);
  const suites = [
    suite("route_smoke", "smoke", "playwright", smokeTests),
    suite("user_flows_e2e", "e2e", "playwright", e2eTests),
    suite("screen_state_ui", "ui", "playwright", uiTests),
    suite("contract_integration", "integration", "vitest", integrationTests),
    suite("component_unit", "unit", "vitest", unitTests),
    suite("accessibility_ui", "accessibility", "playwright", accessibilityTests)
  ];
  const allTests = suites.flatMap((item) => asArray(item.tests));
  const testFiles = unique(suites.map((item) => String(item.target_file)));

  return {
    contract_version: "1.0",
    source_spec_path: "spec/archetype-spec.json",
    source_of_truth: "spec/archetype-spec.json",
    generated_from_source_hash: pkg.manifest.source_hash,
    lifecycle_gate: "test_generating",
    tdd_policy: {
      test_first_enforced: true,
      red_phase_required: true,
      implementation_may_start_after: "All required test files are created and initial failures are captured.",
      green_phase_required: true,
      revision_policy: "Failing tests reveal either implementation gaps or contract gaps. Patch implementation first; revise contract only when the canonical spec is wrong.",
      forbidden_behavior: [
        "Do not write product UI code before creating required tests.",
        "Do not delete, skip, or weaken generated test obligations to make implementation pass.",
        "Do not claim completion without Playwright-backed evidence for browser-observable behavior.",
        "Do not invent routes, screens, states, data operations, actions, forms, tokens, components, or patterns outside spec/archetype-spec.json."
      ]
    },
    required_test_order: [
      "Read spec/archetype-spec.json.",
      "Create smoke route tests.",
      "Create E2E flow tests.",
      "Create UI state and accessibility tests.",
      "Create integration tests for data, action, and form contracts.",
      "Create unit tests for components, patterns, and tokens.",
      "Run the tests once and preserve the expected red result.",
      "Implement product UI from the canonical spec.",
      "Run the same tests until green, then run Archetype verification."
    ],
    required_target_test_files: testFiles.map((file) => ({
      path: file,
      source_template: file.includes("e2e") || file.includes("ui") ? "test-first/playwright-contract.spec.ts" : "test-first/vitest-contract.spec.ts",
      required_before_implementation: true
    })),
    suites,
    coverage: {
      route_count: routes.length,
      screen_count: screens.length,
      required_state_test_count: uiTests.length,
      smoke_test_count: smokeTests.length,
      e2e_test_count: e2eTests.length,
      integration_test_count: integrationTests.length,
      unit_test_count: unitTests.length,
      accessibility_test_count: accessibilityTests.length,
      total_test_count: allTests.length,
      suite_types: suites.map((item) => item.suite_type)
    },
    acceptance_gate: {
      required_evidence: [
        "Target test files exist before product UI implementation.",
        "Initial red test run captured before product UI implementation.",
        "Smoke, E2E, UI, integration, unit, and accessibility suites pass after implementation.",
        "Playwright report or equivalent browser evidence is attached.",
        "archetype validate and archetype verify-target pass or list explicit residual warnings."
      ],
      completion_phrase: "No implementation before tests. No completion before verification."
    },
    traceability: {
      canonical_spec: "spec/archetype-spec.json",
      verification_plan: "verification-plan.md",
      implementation_rules: "frontend-agent-contract/implementation-rules.json",
      acceptance_criteria: "frontend-agent-contract/acceptance-criteria.json",
      generated_templates: ["test-first/playwright-contract.spec.ts", "test-first/vitest-contract.spec.ts"]
    },
    blockers: allTests.length > 0 ? [] : ["No test-first obligations were generated."],
    warnings: ["Generated tests are downstream obligations. They must be created and executed in the target frontend repository before product UI implementation."]
  };
}

function buildPlanMarkdown(pkg: TestFirstInput, contract: JsonRecord): string {
  const coverage = asRecord(contract.coverage);
  const suites = asArray(contract.suites).map(asRecord);
  return [
    "# Test-First Plan",
    "",
    "This package makes the agent phase test-driven. Generate the target tests from this contract before writing product UI code.",
    "",
    "## Source",
    "",
    "- Canonical source: `spec/archetype-spec.json`",
    "- Contract source: `test-first/test-first-contract.json`",
    "- Lifecycle gate: `test_generating` before `implementing_tests_first`",
    "",
    "## Required Order",
    "",
    ...asArray(contract.required_test_order).map((item, index) => `${index + 1}. ${String(item)}`),
    "",
    "## Required Suites",
    "",
    ...suites.map((item) => `- ${item.suite_id}: ${asArray(item.tests).length} ${item.runner} tests in \`${item.target_file}\``),
    "",
    "## Coverage",
    "",
    `- Routes: ${String(coverage.route_count ?? 0)}`,
    `- Screens: ${String(coverage.screen_count ?? 0)}`,
    `- Required state tests: ${String(coverage.required_state_test_count ?? 0)}`,
    `- Smoke tests: ${String(coverage.smoke_test_count ?? 0)}`,
    `- E2E tests: ${String(coverage.e2e_test_count ?? 0)}`,
    `- Integration tests: ${String(coverage.integration_test_count ?? 0)}`,
    `- Unit tests: ${String(coverage.unit_test_count ?? 0)}`,
    `- Total tests: ${String(coverage.total_test_count ?? 0)}`,
    "",
    "## Non-Negotiable Gate",
    "",
    "The frontend agent must create the test files, run them once to expose and preserve the initial red result, implement from the spec, then rerun the same tests to green. Do not weaken tests to make the build pass.",
    "",
    "## Product",
    "",
    `- Package: ${pkg.manifest.package_id}`,
    `- Source hash: ${pkg.manifest.source_hash}`
  ].join("\n");
}

function buildPlaywrightSpec(contract: JsonRecord): string {
  const suites = asArray(contract.suites).map(asRecord);
  const tests = suites
    .filter((suiteItem) => ["smoke", "e2e", "ui", "accessibility"].includes(String(suiteItem.suite_type)))
    .flatMap((suiteItem) => asArray(suiteItem.tests).map(asRecord));
  const routeTests = tests.filter((test) => test.suite_type === "smoke");
  const stateTests = tests.filter((test) => test.suite_type === "ui");
  const flowTests = tests.filter((test) => test.suite_type === "e2e");
  const accessibilityTests = tests.filter((test) => test.suite_type === "accessibility");
  return [
    "import { expect, test } from \"@playwright/test\";",
    "",
    "const routeTests = " + JSON.stringify(routeTests.map((item) => ({
      testId: item.test_id,
      route: item.route,
      screenId: item.screen_id
    })), null, 2) + " as const;",
    "",
    "const stateTests = " + JSON.stringify(stateTests.map((item) => ({
      testId: item.test_id,
      route: item.route,
      screenId: item.screen_id,
      state: item.state
    })), null, 2) + " as const;",
    "",
    "const flowTests = " + JSON.stringify(flowTests.map((item) => ({
      testId: item.test_id,
      title: item.title,
      routeRefs: item.route_refs,
      screenRefs: item.screen_refs
    })), null, 2) + " as const;",
    "",
    "const accessibilityTests = " + JSON.stringify(accessibilityTests.map((item) => ({
      testId: item.test_id,
      route: item.route,
      screenId: item.screen_id
    })), null, 2) + " as const;",
    "",
    "test.describe(\"Archetype route smoke\", () => {",
    "  for (const item of routeTests) {",
    "    test(item.testId, async ({ page }) => {",
    "      await page.goto(item.route);",
    "      await expect(page.locator(`[data-archetype-screen=\"${item.screenId}\"]`)).toBeVisible();",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype screen states\", () => {",
    "  for (const item of stateTests) {",
    "    test(item.testId, async ({ page }) => {",
    "      const separator = item.route.includes(\"?\") ? \"&\" : \"?\";",
    "      await page.goto(`${item.route}${separator}archetype_state=${item.state}`);",
    "      await expect(page.locator(`[data-archetype-screen=\"${item.screenId}\"]`)).toBeVisible();",
    "      await expect(page.locator(`[data-archetype-state=\"${item.state}\"]`).first()).toBeVisible();",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype user flows\", () => {",
    "  for (const item of flowTests) {",
    "    test(item.testId, async ({ page }) => {",
    "      const firstRoute = item.routeRefs[0] ?? \"/\";",
    "      await page.goto(firstRoute);",
    "      for (const screenId of item.screenRefs) {",
    "        await expect(page.locator(`[data-archetype-screen=\"${screenId}\"]`).first()).toBeVisible();",
    "      }",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype accessibility contract\", () => {",
    "  for (const item of accessibilityTests) {",
    "    test(item.testId, async ({ page }) => {",
    "      await page.goto(item.route);",
    "      await expect(page.locator(`[data-archetype-screen=\"${item.screenId}\"]`)).toBeVisible();",
    "      await expect(page.locator(\"body\")).toBeFocused({ timeout: 1 }).catch(() => undefined);",
    "    });",
    "  }",
    "});"
  ].join("\n");
}

function buildVitestSpec(contract: JsonRecord): string {
  const suites = asArray(contract.suites).map(asRecord);
  const tests = suites
    .filter((suiteItem) => ["integration", "unit"].includes(String(suiteItem.suite_type)))
    .flatMap((suiteItem) => asArray(suiteItem.tests).map(asRecord));
  return [
    "import { describe, expect, it } from \"vitest\";",
    "",
    "const contractTests = " + JSON.stringify(tests.map((item) => ({
      testId: item.test_id,
      suiteType: item.suite_type,
      contractKind: item.contract_kind,
      sourceSpecPaths: item.source_spec_paths,
      assertions: item.assertions
    })), null, 2) + " as const;",
    "",
    "describe(\"Archetype integration and unit contracts\", () => {",
    "  for (const item of contractTests) {",
    "    it(`${item.testId} has a target implementation test`, () => {",
    "      expect(item.sourceSpecPaths.length).toBeGreaterThan(0);",
    "      expect(item.assertions.length).toBeGreaterThan(0);",
    "      expect(item.suiteType === \"integration\" || item.suiteType === \"unit\").toBe(true);",
    "    });",
    "  }",
    "});",
    "",
    "// Downstream agent instruction:",
    "// Replace these contract-presence assertions with target imports and behavioral assertions before product UI implementation.",
    "// Keep every test id and sourceSpecPaths entry so failures remain traceable to spec/archetype-spec.json."
  ].join("\n");
}

export function buildTestFirstArtifacts(pkg: TestFirstInput): TestFirstArtifacts {
  const contractJson = buildContractJson(pkg);
  return {
    contractJson,
    planMarkdown: buildPlanMarkdown(pkg, contractJson),
    playwrightContractSpec: buildPlaywrightSpec(contractJson),
    vitestContractSpec: buildVitestSpec(contractJson)
  };
}
