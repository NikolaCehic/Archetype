import type { ArchetypePackage, PlaywrightVerificationArtifacts } from "../core/types";
import { FORBIDDEN_TEST_PATTERNS, REQUIRED_TEST_BEHAVIORS } from "./testQualityStandard";

type PlaywrightInput = Omit<ArchetypePackage, "playwright">;
type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function records(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  if (Array.isArray(record.flows)) return record.flows.map(asRecord);
  if (Array.isArray(record.items)) return record.items.map(asRecord);
  return Object.values(record).filter((item) => typeof item === "object" && item !== null).map(asRecord);
}

function routeUrl(route: string): string {
  return route
    .split("/")
    .map((part) => part.startsWith(":") ? `fixture-${part.slice(1)}` : part)
    .join("/") || "/";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildContractJson(pkg: PlaywrightInput): JsonRecord {
  const spec = pkg.spec.specJson;
  const experience = asRecord(spec.experience);
  const routes = records(experience.routes);
  const screens = records(experience.screens);
  const screenById = new Map(screens.map((screen) => [String(screen.screen_id ?? ""), screen]));
  const actionContracts = records(asRecord(pkg.frontendContract.actionContracts).actions);
  const flows = records(experience.flows);
  const routeScenarios = routes.map((route, index) => {
    const routePath = String(route.route ?? "/");
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    return {
      scenario_id: `PW-ROUTE-${String(index + 1).padStart(3, "0")}`,
      type: "route",
      route: routePath,
      resolved_route: routeUrl(routePath),
      screen_id: screenId,
      selector: `[data-archetype-screen="${screenId}"]`,
      assertions: [
        "Route returns a browser-rendered page.",
        "Declared screen root is visible.",
        "Rendered route does not expose an undeclared screen id."
      ]
    };
  });
  const stateScenarios = screens.flatMap((screen, screenIndex) => {
    const screenId = String(screen.screen_id ?? `screen_${screenIndex + 1}`);
    const route = String(screen.route ?? "/");
    return Object.entries(asRecord(screen.states))
      .filter(([, state]) => asRecord(state).required === true)
      .map(([state], stateIndex) => ({
        scenario_id: `PW-STATE-${String(screenIndex + 1).padStart(3, "0")}-${String(stateIndex + 1).padStart(2, "0")}`,
        type: "screen_state",
        route,
        resolved_route: `${routeUrl(route)}?archetype_state=${encodeURIComponent(state)}`,
        screen_id: screenId,
        state,
        selector: `[data-archetype-state="${state}"]`,
        assertions: [
          "Required screen state is browser-observable.",
          "State marker is visible inside the declared screen.",
          "State can be forced with the deterministic archetype_state query parameter."
        ]
      }));
  });
  const flowScenarios = flows.map((flow, index) => {
    const screenRefs = unique(asArray(flow.screen_refs).map(String));
    const routesFromScreens = screenRefs.map((screenId) => String(screenById.get(screenId)?.route ?? "")).filter(Boolean);
    const routeRefs = unique([...asArray(flow.route_refs).map(String), ...routesFromScreens]);
    return {
      scenario_id: `PW-FLOW-${String(index + 1).padStart(3, "0")}`,
      type: "flow",
      flow_id: String(flow.flow_id ?? `flow_${index + 1}`),
      title: String(flow.name ?? `Flow ${index + 1}`),
      route_refs: routeRefs,
      resolved_routes: routeRefs.map(routeUrl),
      screen_refs: screenRefs,
      assertions: [
        "Every referenced flow route renders in a browser.",
        "Every referenced flow screen is browser-observable.",
        "The flow does not require an undeclared route."
      ]
    };
  });
  const viewports = [
    { viewport_id: "mobile", width: 390, height: 844 },
    { viewport_id: "tablet", width: 768, height: 1024 },
    { viewport_id: "desktop", width: 1440, height: 960 }
  ];
  const responsiveScenarios = routes.flatMap((route, routeIndex) =>
    viewports.map((viewport) => {
      const routePath = String(route.route ?? "/");
      const screenId = String(route.screen_id ?? `screen_${routeIndex + 1}`);
      return {
        scenario_id: `PW-RESP-${String(routeIndex + 1).padStart(3, "0")}-${viewport.viewport_id}`,
        type: "responsive",
        route: routePath,
        resolved_route: routeUrl(routePath),
        screen_id: screenId,
        viewport,
        assertions: [
          "Screen root remains visible at the viewport.",
          "Document has no horizontal overflow beyond a small tolerance.",
          "Primary screen content has measurable layout bounds."
        ]
      };
    })
  );
  const accessibilityScenarios = routes.map((route, index) => {
    const routePath = String(route.route ?? "/");
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    return {
      scenario_id: `PW-A11Y-${String(index + 1).padStart(3, "0")}`,
      type: "accessibility",
      route: routePath,
      resolved_route: routeUrl(routePath),
      screen_id: screenId,
      assertions: [
        "Page contains exactly one visible h1.",
        "Interactive elements have accessible names when present.",
        "Screen root is reachable in browser DOM."
      ]
    };
  });
  const interactionStateScenarios = routes.map((route, index) => {
    const routePath = String(route.route ?? "/");
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    return {
      scenario_id: `PW-INTERACTION-${String(index + 1).padStart(3, "0")}`,
      type: "interaction_state",
      route: routePath,
      resolved_route: routeUrl(routePath),
      screen_id: screenId,
      assertions: [
        "Primary interactive controls are keyboard-focusable when present.",
        "Focused controls expose a visible focus indicator.",
        "Pressed or active control state is browser-observable when a CTA is present.",
        "Disabled and loading CTA states are represented by deterministic fixtures or component state contracts."
      ]
    };
  });
  const actionScenarios = actionContracts.map((action, index) => {
    const routePath = String(action.route ?? screenById.get(String(action.screen_id ?? ""))?.route ?? "/");
    const actionId = String(action.action_id ?? `action_${index + 1}`);
    return {
      scenario_id: `PW-ACTION-${String(index + 1).padStart(3, "0")}`,
      type: "action",
      route: routePath,
      resolved_route: routeUrl(routePath),
      screen_id: String(action.screen_id ?? `screen_${index + 1}`),
      action_id: actionId,
      label: String(action.label ?? actionId),
      selector: String(action.required_selector ?? `[data-archetype-action="${actionId}"]`),
      result_selector: String(action.result_selector ?? `[data-archetype-action-result="${actionId}"]`),
      assertions: [
        "Declared action control is visible.",
        "Declared action control has an accessible name and keyboard focus.",
        "Clicking the action produces browser-observable runtime proof.",
        "The control is not visual-only or inert."
      ]
    };
  });
  const visibleControlPolicyScenarios = routes.map((route, index) => {
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    const routePath = String(route.route ?? "/");
    return {
      scenario_id: `PW-CONTROLS-${String(index + 1).padStart(3, "0")}`,
      type: "visible_control_policy",
      route: routePath,
      resolved_route: routeUrl(routePath),
      screen_id: screenId,
      action_ids: actionContracts
        .filter((action) => String(action.screen_id ?? "") === screenId)
        .map((action) => String(action.action_id ?? ""))
        .filter(Boolean),
      assertions: [
        "Every visible button-like control inside the screen is declared.",
        "Declared controls use action, form, route-link, or explicit control-contract markers.",
        "No visual-only priority chip, export button, run button, filter, or CTA is left inert."
      ]
    };
  });
  const actionStatePolicyScenarios = routes.map((route, index) => {
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    const routePath = String(route.route ?? "/");
    const terminalState = "success_confirmation";
    return {
      scenario_id: `PW-ACTION-STATE-${String(index + 1).padStart(3, "0")}`,
      type: "action_state_policy",
      route: routePath,
      resolved_route: `${routeUrl(routePath)}?archetype_state=${encodeURIComponent(terminalState)}`,
      screen_id: screenId,
      terminal_state: terminalState,
      action_ids: actionContracts
        .filter((action) => String(action.screen_id ?? "") === screenId)
        .map((action) => String(action.action_id ?? ""))
        .filter(Boolean),
      assertions: [
        "Terminal states hide or disable active action controls.",
        "Visible terminal-state action controls expose disabled, aria-disabled=true, or data-archetype-action-unavailable.",
        "Resolve, handoff, rerun, cancel, run, create, update, delete, export, and filter controls are not active after terminal completion."
      ]
    };
  });
  const visualScenarios = routes.flatMap((route, index) =>
    viewports.map((viewport) => {
      const routePath = String(route.route ?? "/");
      const screenId = String(route.screen_id ?? `screen_${index + 1}`);
      return {
        scenario_id: `PW-VISUAL-${String(index + 1).padStart(3, "0")}-${viewport.viewport_id}`,
        type: "visual_smoke",
        route: routePath,
        resolved_route: routeUrl(routePath),
        screen_id: screenId,
        viewport,
        screenshot_path: `test-results/archetype-visual-smoke/${screenId}-${viewport.viewport_id}.png`,
        assertions: [
          "Screenshot can be captured at the declared viewport.",
          "Screen root bounding box is non-empty.",
          "Screenshot is attached as visual-smoke evidence; byte size alone is not treated as quality."
        ]
      };
    })
  );
  const visualContract = asRecord(asRecord(pkg.ingestion.visualEvidence.aggregate).visual_contract);
  const visualAssertions = records(asRecord(pkg.ingestion.visualEvidence.aggregate).verification_assertions);
  const visualReferenceRequired = visualContract.required === true && visualAssertions.length > 0;
  const visualReferenceScenarios = visualReferenceRequired
    ? routes.map((route, index) => {
      const routePath = String(route.route ?? "/");
      const screenId = String(route.screen_id ?? `screen_${index + 1}`);
      return {
        scenario_id: `PW-VISREF-${String(index + 1).padStart(3, "0")}`,
        type: "visual_reference",
        route: routePath,
        resolved_route: routeUrl(routePath),
        screen_id: screenId,
        viewport: { viewport_id: "desktop", width: 1440, height: 960 },
        screenshot_path: `test-results/archetype-visual-smoke/${screenId}-visual-reference.png`,
        visual_contract: {
          source_ids: asArray(visualContract.source_ids).map(String),
          density_profile: String(visualContract.density_profile ?? "unknown"),
          navigation_patterns: asArray(visualContract.navigation_patterns).map(String),
          layout_patterns: asArray(visualContract.layout_patterns).map(String),
          component_candidates: asArray(visualContract.component_candidates).map(String),
          interaction_states: asArray(visualContract.interaction_states).map(String),
          verification_assertions: visualAssertions,
          assertion_count: Number(visualContract.assertion_count ?? visualAssertions.length)
        },
        assertion_ids: visualAssertions.map((assertion) => String(assertion.assertion_id ?? "")).filter(Boolean),
        assertions: [
          "Supplied visual references are represented as source-bound browser assertions.",
          "Screen root exposes visual density, layout, component, and state obligations.",
          "Required layout and component signals are visible in the target DOM.",
          "Screenshot proof is captured for the visual-reference assertion pass."
        ]
      };
    })
    : [];
  const malformedDataScenarios = routes.map((route, index) => {
    const routePath = String(route.route ?? "/");
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    return {
      scenario_id: `PW-MALFORMED-${String(index + 1).padStart(3, "0")}`,
      type: "malformed_data",
      route: routePath,
      resolved_route: `${routeUrl(routePath)}?archetype_state=__malformed__&archetype_payload=%7Bnot-json`,
      screen_id: screenId,
      malformed_case: "invalid_state_and_malformed_payload",
      assertions: [
        "Route still renders when malformed query data is supplied.",
        "Invalid forced state does not become the active screen state.",
        "Status feedback remains visible after malformed input."
      ]
    };
  });
  const scenarios = [
    ...routeScenarios,
    ...stateScenarios,
    ...flowScenarios,
    ...responsiveScenarios,
    ...accessibilityScenarios,
    ...interactionStateScenarios,
    ...actionScenarios,
    ...visibleControlPolicyScenarios,
    ...actionStatePolicyScenarios,
    ...visualScenarios,
    ...visualReferenceScenarios,
    ...malformedDataScenarios
  ];

  return {
    contract_version: "1.0",
    source_spec_path: "spec/archetype-spec.json",
    source_test_first_contract_path: "test-first/test-first-contract.json",
    test_quality_standard_path: "test-first/test-quality-standard.json",
    marker_only_tests_fail_verifier: true,
    forbidden_test_patterns: FORBIDDEN_TEST_PATTERNS,
    required_test_behaviors: REQUIRED_TEST_BEHAVIORS,
    lifecycle_gate: "verifying_with_playwright",
    runner: "playwright",
    base_url_env: "ARCHETYPE_PLAYWRIGHT_BASE_URL",
    required_target_command: "npm run archetype:playwright",
    required_evidence_paths: [
      "verification/playwright-evidence.json",
      "verification/playwright-evidence.md",
      "test-results/archetype-playwright-results.json",
      "test-results/archetype-visual-smoke/",
      "playwright-report/"
    ],
    scenarios,
    coverage: {
      route_count: routes.length,
      screen_count: screens.length,
      route_scenarios: routeScenarios.length,
      state_scenarios: stateScenarios.length,
      flow_scenarios: flowScenarios.length,
      responsive_scenarios: responsiveScenarios.length,
      accessibility_scenarios: accessibilityScenarios.length,
      interaction_state_scenarios: interactionStateScenarios.length,
      action_scenarios: actionScenarios.length,
      visible_control_policy_scenarios: visibleControlPolicyScenarios.length,
      action_state_policy_scenarios: actionStatePolicyScenarios.length,
      visual_smoke_scenarios: visualScenarios.length,
      visual_reference_scenarios: visualReferenceScenarios.length,
      visual_reference_assertions: visualAssertions.length,
      malformed_data_scenarios: malformedDataScenarios.length,
      total_scenarios: scenarios.length,
      viewports
    },
    pass_criteria: [
      "Install, typecheck, and production build pass.",
      "Playwright route, state, flow, responsive, accessibility, interaction-state, action, visible-control, action-state, malformed-data, visual-smoke, and visual-reference scenarios pass.",
      "Evidence JSON and markdown are written back into archetype-output.",
      "Every warning that remains is named as external production confirmation or target limitation."
    ],
    blockers: scenarios.length > 0 ? [] : ["No Playwright scenarios were generated."],
    warnings: ["Playwright evidence is pending until `archetype verify-target` runs against a materialized target frontend."]
  };
}

function buildPlanMarkdown(contract: JsonRecord): string {
  const coverage = asRecord(contract.coverage);
  return [
    "# Playwright Verification Plan",
    "",
    "This plan verifies the implemented target frontend against browser-observable obligations derived from the canonical spec.",
    "",
    "## Source",
    "",
    "- Canonical spec: `spec/archetype-spec.json`",
    "- Test-first contract: `test-first/test-first-contract.json`",
    "- Playwright contract: `verification/playwright-verification-contract.json`",
    "",
    "## Required Command",
    "",
    "`npm run archetype:playwright`",
    "",
    "## Coverage",
    "",
    `- Route scenarios: ${String(coverage.route_scenarios ?? 0)}`,
    `- State scenarios: ${String(coverage.state_scenarios ?? 0)}`,
    `- Flow scenarios: ${String(coverage.flow_scenarios ?? 0)}`,
    `- Responsive scenarios: ${String(coverage.responsive_scenarios ?? 0)}`,
    `- Accessibility scenarios: ${String(coverage.accessibility_scenarios ?? 0)}`,
    `- Interaction-state scenarios: ${String(coverage.interaction_state_scenarios ?? 0)}`,
    `- Action scenarios: ${String(coverage.action_scenarios ?? 0)}`,
    `- Visible-control policy scenarios: ${String(coverage.visible_control_policy_scenarios ?? 0)}`,
    `- Action-state policy scenarios: ${String(coverage.action_state_policy_scenarios ?? 0)}`,
    `- Visual-smoke scenarios: ${String(coverage.visual_smoke_scenarios ?? 0)}`,
    `- Visual-reference scenarios: ${String(coverage.visual_reference_scenarios ?? 0)}`,
    `- Visual-reference assertions: ${String(coverage.visual_reference_assertions ?? 0)}`,
    `- Malformed-data scenarios: ${String(coverage.malformed_data_scenarios ?? 0)}`,
    `- Total scenarios: ${String(coverage.total_scenarios ?? 0)}`,
    "",
    "## Evidence",
    "",
    "- `verification/playwright-evidence.json`",
    "- `verification/playwright-evidence.md`",
    "- `test-results/archetype-playwright-results.json`",
    "- `test-results/archetype-visual-smoke/`",
    "- `playwright-report/`",
    "",
    "Do not declare completion until the evidence is pass or every remaining warning is named."
  ].join("\n");
}

function buildConfigSource(contract: JsonRecord): string {
  const firstRoute = String(asRecord(records(contract.scenarios).find((scenario) => scenario.type === "route")).resolved_route ?? "/");
  return [
    "import { defineConfig } from \"@playwright/test\";",
    "",
    "const port = Number(process.env.ARCHETYPE_PLAYWRIGHT_PORT ?? 4177);",
    "const baseURL = process.env.ARCHETYPE_PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;",
    `const readinessPath = ${JSON.stringify(firstRoute)};`,
    "",
    "export default defineConfig({",
    "  testDir: \"./tests\",",
    "  testMatch: [\"**/archetype-route-smoke.spec.ts\"],",
    "  timeout: 30000,",
    "  expect: { timeout: 10000 },",
    "  reporter: [",
    "    [\"json\", { outputFile: \"test-results/archetype-playwright-results.json\" }],",
    "    [\"html\", { outputFolder: \"playwright-report\", open: \"never\" }],",
    "    [\"list\"]",
    "  ],",
    "  use: {",
    "    baseURL,",
    "    trace: \"retain-on-failure\",",
    "    screenshot: \"only-on-failure\"",
    "  },",
    "  webServer: {",
    "    command: `npx next start -H 127.0.0.1 -p ${port}`,",
    "    url: `${baseURL}${readinessPath}`,",
    "    reuseExistingServer: !process.env.CI,",
    "    timeout: 120000",
    "  }",
    "});"
  ].join("\n");
}

function specData(contract: JsonRecord, type: string): JsonRecord[] {
  return records(contract.scenarios).filter((scenario) => scenario.type === type);
}

function buildSpecSource(contract: JsonRecord): string {
  const routeScenarios = specData(contract, "route");
  const stateScenarios = specData(contract, "screen_state");
  const flowScenarios = specData(contract, "flow");
  const responsiveScenarios = specData(contract, "responsive");
  const accessibilityScenarios = specData(contract, "accessibility");
  const interactionStateScenarios = specData(contract, "interaction_state");
  const actionScenarios = specData(contract, "action");
  const visibleControlPolicyScenarios = specData(contract, "visible_control_policy");
  const actionStatePolicyScenarios = specData(contract, "action_state_policy");
  const visualScenarios = specData(contract, "visual_smoke");
  const visualReferenceScenarios = specData(contract, "visual_reference");
  const malformedDataScenarios = specData(contract, "malformed_data");
  return [
    "import { expect, test } from \"@playwright/test\";",
    "import { mkdir } from \"node:fs/promises\";",
    "",
    "type ArchetypeScenario = Record<string, any>;",
    "",
    "const routeScenarios = " + JSON.stringify(routeScenarios, null, 2) + " as ArchetypeScenario[];",
    "const stateScenarios = " + JSON.stringify(stateScenarios, null, 2) + " as ArchetypeScenario[];",
    "const flowScenarios = " + JSON.stringify(flowScenarios, null, 2) + " as ArchetypeScenario[];",
    "const responsiveScenarios = " + JSON.stringify(responsiveScenarios, null, 2) + " as ArchetypeScenario[];",
    "const accessibilityScenarios = " + JSON.stringify(accessibilityScenarios, null, 2) + " as ArchetypeScenario[];",
    "const interactionStateScenarios = " + JSON.stringify(interactionStateScenarios, null, 2) + " as ArchetypeScenario[];",
    "const actionScenarios = " + JSON.stringify(actionScenarios, null, 2) + " as ArchetypeScenario[];",
    "const visibleControlPolicyScenarios = " + JSON.stringify(visibleControlPolicyScenarios, null, 2) + " as ArchetypeScenario[];",
    "const actionStatePolicyScenarios = " + JSON.stringify(actionStatePolicyScenarios, null, 2) + " as ArchetypeScenario[];",
    "const visualScenarios = " + JSON.stringify(visualScenarios, null, 2) + " as ArchetypeScenario[];",
    "const visualReferenceScenarios = " + JSON.stringify(visualReferenceScenarios, null, 2) + " as ArchetypeScenario[];",
    "const malformedDataScenarios = " + JSON.stringify(malformedDataScenarios, null, 2) + " as ArchetypeScenario[];",
    "",
    "test.describe(\"Archetype route verification\", () => {",
    "  for (const scenario of routeScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      await expect(page.locator(scenario.selector)).toBeVisible();",
    "      await expect(page.locator(\"[data-archetype-screen]\")).toHaveAttribute(\"data-archetype-screen\", scenario.screen_id);",
    "      await expect(page.getByRole(\"heading\", { level: 1 })).toBeVisible();",
    "      const visibleText = (await page.locator(scenario.selector).innerText()).trim();",
    "      expect(visibleText.length).toBeGreaterThan(8);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype screen-state verification\", () => {",
    "  for (const scenario of stateScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      await expect(page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`)).toBeVisible();",
    "      await expect(page.locator(scenario.selector).first()).toBeVisible();",
    "      await expect(page.getByRole(\"status\")).toContainText(String(scenario.state).replace(/[_-]/g, \" \"));",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype flow verification\", () => {",
    "  for (const scenario of flowScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      for (const route of scenario.resolved_routes) {",
    "        await page.goto(route);",
    "        await expect(page.locator(\"[data-archetype-screen]\").first()).toBeVisible();",
    "        await expect(page.getByRole(\"heading\", { level: 1 })).toBeVisible();",
    "        expect(new URL(page.url()).pathname).toBe(new URL(route, page.url()).pathname);",
    "      }",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype responsive verification\", () => {",
    "  for (const scenario of responsiveScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.setViewportSize({ width: scenario.viewport.width, height: scenario.viewport.height });",
    "      await page.goto(scenario.resolved_route);",
    "      const root = page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`);",
    "      await expect(root).toBeVisible();",
    "      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);",
    "      expect(overflow).toBeLessThanOrEqual(4);",
    "      const box = await root.boundingBox();",
    "      expect(box?.width ?? 0).toBeGreaterThan(0);",
    "      expect(box?.height ?? 0).toBeGreaterThan(0);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype accessibility verification\", () => {",
    "  for (const scenario of accessibilityScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      await expect(page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`)).toBeVisible();",
    "      await expect(page.getByRole(\"main\")).toBeVisible();",
    "      await expect(page.locator(\"h1\")).toHaveCount(1);",
    "      await expect(page.getByRole(\"status\")).toBeVisible();",
    "      await page.keyboard.press(\"Tab\");",
    "      const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? \"\");",
    "      expect(focusedTag.length).toBeGreaterThan(0);",
    "      const unnamedButtons = await page.locator(\"button\").evaluateAll((buttons) => buttons.filter((button) => !button.textContent?.trim() && !button.getAttribute(\"aria-label\")).length);",
    "      expect(unnamedButtons).toBe(0);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype interaction-state verification\", () => {",
    "  for (const scenario of interactionStateScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      await expect(page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`)).toBeVisible();",
    "      const controls = page.locator('button, [role=\"button\"], a[href], input, select, textarea');",
    "      const count = await controls.count();",
    "      if (count > 0) {",
    "        const first = controls.first();",
    "        await first.focus();",
    "        await expect(first).toBeFocused();",
    "        const focusVisible = await first.evaluate((element) => {",
    "          const style = window.getComputedStyle(element);",
    "          return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || style.borderColor !== 'rgba(0, 0, 0, 0)';",
    "        });",
    "        expect(focusVisible).toBe(true);",
    "      }",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype action verification\", () => {",
    "  for (const scenario of actionScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      await expect(page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`)).toBeVisible();",
    "      const control = page.locator(scenario.selector).first();",
    "      await expect(control).toBeVisible();",
    "      await expect(control).toHaveAttribute(\"data-archetype-action\", scenario.action_id);",
    "      await expect(control).toBeEnabled();",
    "      await control.focus();",
    "      await expect(control).toBeFocused();",
    "      const beforeUrl = page.url();",
    "      const beforeStatus = await page.getByRole(\"status\").first().innerText().catch(() => \"\");",
    "      await control.click();",
    "      const result = page.locator(scenario.result_selector).first();",
    "      const resultVisible = await result.isVisible().catch(() => false);",
    "      const afterUrl = page.url();",
    "      const afterStatus = await page.getByRole(\"status\").first().innerText().catch(() => \"\");",
    "      expect(resultVisible || afterUrl !== beforeUrl || afterStatus !== beforeStatus).toBe(true);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype visible-control policy\", () => {",
    "  for (const scenario of visibleControlPolicyScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      const root = page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`);",
    "      await expect(root).toBeVisible();",
    "      const unbound = await root.locator('button, [role=\"button\"], input, select, textarea, a[href]').evaluateAll((elements, declaredActionIds) => {",
    "        const declared = Array.isArray(declaredActionIds) ? declaredActionIds.map(String) : [];",
    "        const isVisible = (element: Element) => {",
    "          const rect = element.getBoundingClientRect();",
    "          const style = window.getComputedStyle(element);",
    "          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';",
    "        };",
    "        return elements.filter(isVisible).filter((element) => {",
    "          const tag = element.tagName.toLowerCase();",
    "          const actionId = element.getAttribute('data-archetype-action');",
    "          if (actionId) return !declared.includes(actionId);",
    "          if (tag === 'a' && element.getAttribute('href')) return false;",
    "          if (element.getAttribute('data-archetype-control-contract')) return false;",
    "          if (element.getAttribute('data-archetype-form-field')) return false;",
    "          if (element.closest('[data-archetype-form]')) return false;",
    "          return true;",
    "        }).map((element) => `${element.tagName.toLowerCase()}:${(element.textContent ?? element.getAttribute('aria-label') ?? '').trim()}`);",
    "      }, scenario.action_ids);",
    "      expect(unbound).toEqual([]);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype action-state policy\", () => {",
    "  for (const scenario of actionStatePolicyScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      const root = page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`);",
    "      await expect(root).toBeVisible();",
    "      await expect(root).toHaveAttribute(\"data-state\", scenario.terminal_state);",
    "      const activeTerminalActions = await root.locator('[data-archetype-action]').evaluateAll((elements, declaredActionIds) => {",
    "        const declared = Array.isArray(declaredActionIds) ? declaredActionIds.map(String) : [];",
    "        const isVisible = (element: Element) => {",
    "          const rect = element.getBoundingClientRect();",
    "          const style = window.getComputedStyle(element);",
    "          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';",
    "        };",
    "        return elements.filter(isVisible).filter((element) => {",
    "          const actionId = element.getAttribute('data-archetype-action');",
    "          if (!actionId || !declared.includes(actionId)) return false;",
    "          const disabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true' || element.hasAttribute('data-archetype-action-unavailable');",
    "          return !disabled;",
    "        }).map((element) => `${element.getAttribute('data-archetype-action') ?? 'unknown'}:${(element.textContent ?? '').trim()}`);",
    "      }, scenario.action_ids);",
    "      expect(activeTerminalActions).toEqual([]);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype malformed-data verification\", () => {",
    "  for (const scenario of malformedDataScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      const root = page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`);",
    "      await expect(root).toBeVisible();",
    "      await expect(page.getByRole(\"status\")).toBeVisible();",
    "      const activeState = await root.getAttribute(\"data-state\");",
    "      expect(activeState).not.toBe(\"__malformed__\");",
    "      const statusText = (await page.getByRole(\"status\").innerText()).trim();",
    "      expect(statusText.length).toBeGreaterThan(0);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype visual-smoke verification\", () => {",
    "  for (const scenario of visualScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.setViewportSize({ width: scenario.viewport.width, height: scenario.viewport.height });",
    "      await page.goto(scenario.resolved_route);",
    "      const root = page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`);",
    "      await expect(root).toBeVisible();",
    "      const box = await root.boundingBox();",
    "      expect(box?.width ?? 0).toBeGreaterThan(0);",
    "      expect(box?.height ?? 0).toBeGreaterThan(0);",
    "      await mkdir(\"test-results/archetype-visual-smoke\", { recursive: true });",
    "      await page.screenshot({ path: scenario.screenshot_path, fullPage: true });",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype visual-reference verification\", () => {",
    "  for (const scenario of visualReferenceScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.setViewportSize({ width: scenario.viewport.width, height: scenario.viewport.height });",
    "      await page.goto(scenario.resolved_route);",
    "      const root = page.locator(`[data-archetype-screen=\"${scenario.screen_id}\"]`);",
    "      await expect(root).toBeVisible();",
    "      const feature = root.locator(\"[data-archetype-feature-screen]\").first();",
    "      await expect(feature).toBeVisible();",
    "      const contract = scenario.visual_contract ?? {};",
    "      const density = String(contract.density_profile ?? \"unknown\");",
    "      if (density !== \"unknown\") {",
    "        await expect(feature).toHaveAttribute(\"data-archetype-visual-density\", density);",
    "      }",
    "      const assertionCount = Number(contract.assertion_count ?? 0);",
    "      const assertions = Array.isArray(contract.verification_assertions) ? contract.verification_assertions : [];",
    "      const renderedAssertionCount = Number(await feature.getAttribute(\"data-archetype-visual-assertion-count\") ?? \"0\");",
    "      expect(assertions.length).toBe(assertionCount);",
    "      expect(renderedAssertionCount).toBeGreaterThanOrEqual(assertionCount);",
    "      for (const assertion of assertions) {",
    "        const assertionId = String(assertion.assertion_id ?? \"\");",
    "        expect(assertionId.length).toBeGreaterThan(0);",
    "        const proof = root.locator(`[data-archetype-visual-assertion=\"${assertionId}\"]`).first();",
    "        await expect(proof, String(assertion.failure_message ?? `Missing visual assertion ${assertionId}`)).toBeVisible();",
    "        await expect(proof).toHaveAttribute(\"data-archetype-visual-category\", String(assertion.category ?? \"\"));",
    "      }",
    "      for (const navigation of contract.navigation_patterns ?? []) {",
    "        const region = root.locator(`[data-archetype-visual-navigation=\"${navigation}\"]`).first();",
    "        await expect(region).toBeVisible();",
    "      }",
    "      for (const layout of contract.layout_patterns ?? []) {",
    "        const region = root.locator(`[data-archetype-visual-layout=\"${layout}\"]`).first();",
    "        await expect(region).toBeVisible();",
    "        const box = await region.boundingBox();",
    "        expect(box?.width ?? 0).toBeGreaterThan(0);",
    "        expect(box?.height ?? 0).toBeGreaterThan(0);",
    "      }",
    "      for (const component of contract.component_candidates ?? []) {",
    "        const surface = root.locator(`[data-archetype-visual-component=\"${component}\"]`).first();",
    "        await expect(surface).toBeVisible();",
    "      }",
    "      for (const state of contract.interaction_states ?? []) {",
    "        await expect(feature).toHaveAttribute(\"data-archetype-visual-states\", new RegExp(`(^| )${state}( |$)`));",
    "      }",
    "      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);",
    "      expect(overflow).toBeLessThanOrEqual(4);",
    "      await mkdir(\"test-results/archetype-visual-smoke\", { recursive: true });",
    "      await page.screenshot({ path: scenario.screenshot_path, fullPage: true });",
    "    });",
    "  }",
    "});"
  ].join("\n");
}

function buildEvidenceMarkdown(evidence: JsonRecord): string {
  const coverage = asRecord(evidence.coverage);
  return [
    "# Playwright Evidence",
    "",
    `Status: ${String(evidence.status ?? "pending")}`,
    `Generated: ${String(evidence.generated_at ?? "pending")}`,
    "",
    "## Coverage",
    "",
    `- Routes: ${String(coverage.route_count ?? 0)}`,
    `- Screens: ${String(coverage.screen_count ?? 0)}`,
    `- Total scenarios: ${String(coverage.total_scenarios ?? 0)}`,
    `- Malformed-data scenarios: ${String(coverage.malformed_data_scenarios ?? 0)}`,
    `- Evidence grade: ${String(asRecord(evidence.evidence_grades).overall ?? "pending")}`,
    `- Runtime grade: ${String(asRecord(evidence.evidence_grades).runtime_overall ?? "pending")}`,
    `- Production integration: ${String(asRecord(evidence.evidence_grades).production_integrated ?? "pending")}`,
    "",
    "## Evidence Artifacts",
    "",
    ...asArray(evidence.proof_artifacts).map((artifact) => `- ${String(artifact)}`),
    "",
    "## Scenario Results",
    "",
    ...asArray(evidence.scenario_results).slice(0, 20).map((scenario) => {
      const record = asRecord(scenario);
      return `- ${String(record.scenario_id ?? "unknown")}: ${String(record.status ?? "pending")} (${String(record.type ?? "unknown")})`;
    }),
    "",
    "## Notes",
    "",
    ...asArray(evidence.warnings).map((warning) => `- ${String(warning)}`)
  ].join("\n");
}

function pendingEvidence(contract: JsonRecord): JsonRecord {
  const coverage = asRecord(contract.coverage);
  return {
    evidence_version: "1.0",
    status: "pending",
    generated_at: null,
    source_contract: "verification/playwright-verification-contract.json",
    command: String(contract.required_target_command ?? "npm run archetype:playwright"),
    coverage,
    summary: {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: Number(coverage.total_scenarios ?? 0)
    },
    scenario_summary: {
      contract_scenarios: Number(coverage.total_scenarios ?? 0),
      raw_specs: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      missing: Number(coverage.total_scenarios ?? 0)
    },
    visual_screenshot_summary: [],
    evidence_grades: {
      scaffold_verified: "pending",
      browser_smoke_verified: "pending",
      behavior_verified: "pending",
      interaction_state_verified: "pending",
      actions_verified: "pending",
      visible_controls_verified: "pending",
      accessibility_verified: "pending",
      visual_verified: "pending",
      visual_reference_verified: "pending",
      malformed_data_verified: "pending",
      scenario_coverage: "pending",
      runtime_overall: "pending",
      manual_reviewed: "pending",
      production_integrated: "pending",
      overall: "pending"
    },
    scenario_results: [],
    readiness_boundary: {
      runtime_verification: "pending",
      production_readiness: "pending",
      manual_reviewed: "pending",
      production_integrated: "pending",
      note: "Runtime evidence is pending and cannot certify production readiness."
    },
    proof_artifacts: asArray(contract.required_evidence_paths),
    blockers: [],
    warnings: ["Playwright verification has not run against a target frontend yet."]
  };
}

export function buildPlaywrightVerificationArtifacts(pkg: PlaywrightInput): PlaywrightVerificationArtifacts {
  const contractJson = buildContractJson(pkg);
  const evidenceJson = pendingEvidence(contractJson);
  return {
    contractJson,
    planMarkdown: buildPlanMarkdown(contractJson),
    configSource: buildConfigSource(contractJson),
    specSource: buildSpecSource(contractJson),
    evidenceJson,
    evidenceMarkdown: buildEvidenceMarkdown(evidenceJson)
  };
}

export function playwrightEvidenceMarkdown(evidence: JsonRecord): string {
  return buildEvidenceMarkdown(evidence);
}
