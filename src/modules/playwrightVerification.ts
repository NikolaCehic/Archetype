import type { ArchetypePackage, PlaywrightVerificationArtifacts } from "../core/types";

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
  const visualScenarios = routes.map((route, index) => {
    const routePath = String(route.route ?? "/");
    const screenId = String(route.screen_id ?? `screen_${index + 1}`);
    return {
      scenario_id: `PW-VISUAL-${String(index + 1).padStart(3, "0")}`,
      type: "visual_smoke",
      route: routePath,
      resolved_route: routeUrl(routePath),
      screen_id: screenId,
      screenshot_path: `test-results/archetype-visual-smoke/${screenId}.png`,
      assertions: [
        "Screenshot can be captured.",
        "Screen root bounding box is non-empty.",
        "Screenshot is attached as visual-smoke evidence."
      ]
    };
  });
  const scenarios = [
    ...routeScenarios,
    ...stateScenarios,
    ...flowScenarios,
    ...responsiveScenarios,
    ...accessibilityScenarios,
    ...visualScenarios
  ];

  return {
    contract_version: "1.0",
    source_spec_path: "spec/archetype-spec.json",
    source_test_first_contract_path: "test-first/test-first-contract.json",
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
      visual_smoke_scenarios: visualScenarios.length,
      total_scenarios: scenarios.length,
      viewports
    },
    pass_criteria: [
      "Install, typecheck, and production build pass.",
      "Playwright route, state, flow, responsive, accessibility, and visual-smoke scenarios pass.",
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
    `- Visual-smoke scenarios: ${String(coverage.visual_smoke_scenarios ?? 0)}`,
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
    "  testMatch: [",
    "    \"**/archetype-route-smoke.spec.ts\",",
    "    \"**/archetype-user-flows.spec.ts\",",
    "    \"**/archetype-screen-states.spec.ts\",",
    "    \"**/archetype-accessibility.spec.ts\"",
    "  ],",
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
  const visualScenarios = specData(contract, "visual_smoke");
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
    "const visualScenarios = " + JSON.stringify(visualScenarios, null, 2) + " as ArchetypeScenario[];",
    "",
    "test.describe(\"Archetype route verification\", () => {",
    "  for (const scenario of routeScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
    "      await page.goto(scenario.resolved_route);",
    "      await expect(page.locator(scenario.selector)).toBeVisible();",
    "      await expect(page.locator(\"[data-archetype-screen]\")).toHaveAttribute(\"data-archetype-screen\", scenario.screen_id);",
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
    "      await expect(page.locator(\"h1\")).toHaveCount(1);",
    "      const unnamedButtons = await page.locator(\"button\").evaluateAll((buttons) => buttons.filter((button) => !button.textContent?.trim() && !button.getAttribute(\"aria-label\")).length);",
    "      expect(unnamedButtons).toBe(0);",
    "    });",
    "  }",
    "});",
    "",
    "test.describe(\"Archetype visual-smoke verification\", () => {",
    "  for (const scenario of visualScenarios) {",
    "    test(scenario.scenario_id, async ({ page }) => {",
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
    "",
    "## Evidence Artifacts",
    "",
    ...asArray(evidence.proof_artifacts).map((artifact) => `- ${String(artifact)}`),
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
