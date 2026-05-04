import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

interface PackageValidationResult {
  status: "pass" | "fail";
  outputDir: string;
  checkedFiles: number;
  blockers: string[];
  warnings: string[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readJsonSafe<T>(filePath: string, blockers: string[], description: string): T | null {
  try {
    return readJson<T>(filePath);
  } catch (error) {
    blockers.push(`${description} is not parseable JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export function validateExportedPackage(outputDir: string): PackageValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const topManifestPath = path.join(outputDir, "manifest.json");
  const agentsPath = path.join(outputDir, "AGENTS.md");
  const claudePath = path.join(outputDir, "CLAUDE.md");
  const canonicalSpecMarkdownPath = path.join(outputDir, "spec", "archetype-spec.md");
  const canonicalSpecJsonPath = path.join(outputDir, "spec", "archetype-spec.json");
  const testFirstContractPath = path.join(outputDir, "test-first", "test-first-contract.json");
  const testFirstPlanPath = path.join(outputDir, "test-first", "test-first-plan.md");
  const testFirstPlaywrightPath = path.join(outputDir, "test-first", "playwright-contract.spec.ts");
  const testFirstVitestPath = path.join(outputDir, "test-first", "vitest-contract.spec.ts");
  const implementationContractPath = path.join(outputDir, "implementation-contract.md");
  const verificationPlanPath = path.join(outputDir, "verification-plan.md");
  const lifecycleStateMachinePath = path.join(outputDir, "lifecycle", "state-machine.json");
  const contextCompletionPath = path.join(outputDir, "lifecycle", "context-completion.json");
  const clarificationQuestionsPath = path.join(outputDir, "lifecycle", "clarification-questions.json");
  const lifecycleReportPath = path.join(outputDir, "lifecycle", "lifecycle-report.md");
  const manifestPath = path.join(outputDir, "00-manifest", "manifest.json");
  const readinessPath = path.join(outputDir, "00-manifest", "implementation-readiness.json");
  const schemaReportPath = path.join(outputDir, "00-manifest", "schema-validation-report.json");
  const dsagPath = path.join(outputDir, "03-experience-architecture", "dsag.json");
  const productModelPath = path.join(outputDir, "product", "product-model.json");
  const userRolesPath = path.join(outputDir, "product", "user-roles.json");
  const routeMapPath = path.join(outputDir, "experience", "route-map.json");
  const userFlowsPath = path.join(outputDir, "experience", "user-flows.json");
  const tokensPath = path.join(outputDir, "design-system", "tokens.json");
  const componentContractsPath = path.join(outputDir, "design-system", "component-contracts.json");
  const screenInventoryPath = path.join(outputDir, "screens", "screen-inventory.json");
  const screenSpecsPath = path.join(outputDir, "screens", "screen-specs.json");
  const frontendAgentInstructionsPath = path.join(outputDir, "frontend-agent-contract", "frontend-agent-instructions.md");
  const acceptanceCriteriaPath = path.join(outputDir, "frontend-agent-contract", "acceptance-criteria.json");
  const implementationRulesPath = path.join(outputDir, "frontend-agent-contract", "implementation-rules.json");
  const packageValidationPath = path.join(outputDir, "validation", "package-validation.json");
  const simulationReportPath = path.join(outputDir, "validation", "simulation-report.md");

  if (!existsSync(topManifestPath)) blockers.push("Missing manifest.json.");
  if (!existsSync(agentsPath)) blockers.push("Missing AGENTS.md.");
  if (!existsSync(claudePath)) blockers.push("Missing CLAUDE.md.");
  if (!existsSync(canonicalSpecMarkdownPath)) blockers.push("Missing spec/archetype-spec.md.");
  if (!existsSync(canonicalSpecJsonPath)) blockers.push("Missing spec/archetype-spec.json.");
  if (!existsSync(testFirstContractPath)) blockers.push("Missing test-first/test-first-contract.json.");
  if (!existsSync(testFirstPlanPath)) blockers.push("Missing test-first/test-first-plan.md.");
  if (!existsSync(testFirstPlaywrightPath)) blockers.push("Missing test-first/playwright-contract.spec.ts.");
  if (!existsSync(testFirstVitestPath)) blockers.push("Missing test-first/vitest-contract.spec.ts.");
  if (!existsSync(implementationContractPath)) blockers.push("Missing implementation-contract.md.");
  if (!existsSync(verificationPlanPath)) blockers.push("Missing verification-plan.md.");
  if (!existsSync(lifecycleStateMachinePath)) blockers.push("Missing lifecycle/state-machine.json.");
  if (!existsSync(contextCompletionPath)) blockers.push("Missing lifecycle/context-completion.json.");
  if (!existsSync(clarificationQuestionsPath)) blockers.push("Missing lifecycle/clarification-questions.json.");
  if (!existsSync(lifecycleReportPath)) blockers.push("Missing lifecycle/lifecycle-report.md.");
  if (!existsSync(manifestPath)) blockers.push("Missing 00-manifest/manifest.json.");
  if (!existsSync(readinessPath)) blockers.push("Missing 00-manifest/implementation-readiness.json.");
  if (!existsSync(schemaReportPath)) blockers.push("Missing 00-manifest/schema-validation-report.json.");
  if (!existsSync(dsagPath)) blockers.push("Missing 03-experience-architecture/dsag.json.");
  if (!existsSync(productModelPath)) blockers.push("Missing product/product-model.json.");
  if (!existsSync(userRolesPath)) blockers.push("Missing product/user-roles.json.");
  if (!existsSync(routeMapPath)) blockers.push("Missing experience/route-map.json.");
  if (!existsSync(userFlowsPath)) blockers.push("Missing experience/user-flows.json.");
  if (!existsSync(tokensPath)) blockers.push("Missing design-system/tokens.json.");
  if (!existsSync(componentContractsPath)) blockers.push("Missing design-system/component-contracts.json.");
  if (!existsSync(screenInventoryPath)) blockers.push("Missing screens/screen-inventory.json.");
  if (!existsSync(screenSpecsPath)) blockers.push("Missing screens/screen-specs.json.");
  if (!existsSync(frontendAgentInstructionsPath)) blockers.push("Missing frontend-agent-contract/frontend-agent-instructions.md.");
  if (!existsSync(acceptanceCriteriaPath)) blockers.push("Missing frontend-agent-contract/acceptance-criteria.json.");
  if (!existsSync(implementationRulesPath)) blockers.push("Missing frontend-agent-contract/implementation-rules.json.");
  if (!existsSync(packageValidationPath)) blockers.push("Missing validation/package-validation.json.");
  if (!existsSync(simulationReportPath)) blockers.push("Missing validation/simulation-report.md.");
  if (blockers.length > 0) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  const topManifest = readJsonSafe<{
    artifacts?: Array<{ id?: string; path?: string; required?: boolean }>;
  }>(topManifestPath, blockers, "Top-level manifest");
  const manifest = readJsonSafe<{
    artifact_index?: string[];
    ready_for_frontend_agent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(manifestPath, blockers, "Internal manifest");
  const readiness = readJsonSafe<{
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
    score?: number;
  }>(readinessPath, blockers, "Readiness report");
  const schemaReport = readJsonSafe<{
    status?: string;
    blockers?: string[];
  }>(schemaReportPath, blockers, "Schema validation report");
  const dsag = readJsonSafe<{
    integrity?: {
      status?: string;
      blockers?: string[];
    };
  }>(dsagPath, blockers, "DSAG graph");
  const routeMap = readJsonSafe<{ routes?: unknown[] }>(routeMapPath, blockers, "Route map");
  const screenInventory = readJsonSafe<{ screens?: unknown[] }>(screenInventoryPath, blockers, "Screen inventory");
  const screenSpecs = readJsonSafe<{ screens?: unknown[] }>(screenSpecsPath, blockers, "Screen specs");
  const componentContracts = readJsonSafe<{ contracts?: unknown[] }>(componentContractsPath, blockers, "Component contracts");
  const implementationRules = readJsonSafe<Record<string, unknown>>(implementationRulesPath, blockers, "Implementation rules");
  const canonicalSpec = readJsonSafe<{
    source_of_truth?: boolean;
    lifecycle?: { default_entrypoint?: string };
    product?: unknown;
    experience?: { route_count?: number; screen_count?: number; routes?: unknown[]; screens?: unknown[] };
    design_system?: unknown;
    frontend_contract?: unknown;
    verification?: { required_evidence?: unknown[] };
  }>(canonicalSpecJsonPath, blockers, "Canonical spec");
  const testFirstContract = readJsonSafe<{
    source_spec_path?: string;
    tdd_policy?: { test_first_enforced?: boolean; red_phase_required?: boolean };
    required_target_test_files?: unknown[];
    suites?: Array<{ suite_type?: string; tests?: unknown[] }>;
    coverage?: {
      route_count?: number;
      screen_count?: number;
      total_test_count?: number;
      smoke_test_count?: number;
      e2e_test_count?: number;
      integration_test_count?: number;
      unit_test_count?: number;
      required_state_test_count?: number;
      suite_types?: unknown[];
    };
    acceptance_gate?: { required_evidence?: unknown[] };
    traceability?: { canonical_spec?: string };
  }>(testFirstContractPath, blockers, "Test-first contract");
  const lifecycleStateMachine = readJsonSafe<{
    states?: Array<{ state?: string }>;
    default_entrypoint?: string;
    principle?: string;
  }>(lifecycleStateMachinePath, blockers, "Lifecycle state machine");
  const contextCompletion = readJsonSafe<{
    status?: string;
    current_state?: string;
    next_state?: string;
    questions?: unknown[];
  }>(contextCompletionPath, blockers, "Context completion");

  if (!topManifest || !manifest || !readiness || !schemaReport || !dsag || !routeMap || !screenInventory || !screenSpecs || !componentContracts || !implementationRules || !canonicalSpec || !testFirstContract || !lifecycleStateMachine || !contextCompletion) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  const routes = Array.isArray(routeMap.routes) ? routeMap.routes : [];
  const screens = Array.isArray(screenInventory.screens) ? screenInventory.screens : [];
  const specs = Array.isArray(screenSpecs.screens) ? screenSpecs.screens : [];
  if (routes.length === 0) {
    blockers.push("Route map has no parseable routes.");
  }
  if (screens.length === 0) {
    blockers.push("Screen inventory has no parseable screens.");
  }
  if (specs.length === 0) {
    blockers.push("Screen specs have no parseable screens.");
  }
  if (!Array.isArray(componentContracts.contracts) || componentContracts.contracts.length === 0) {
    blockers.push("Component contracts have no parseable contracts.");
  }
  if (!implementationRules.routing || !implementationRules.dataContracts || !implementationRules.actionContracts || !implementationRules.formContracts) {
    blockers.push("Implementation rules must expose routing, data, action, and form contracts.");
  }
  if (canonicalSpec.source_of_truth !== true) {
    blockers.push("Canonical spec must declare source_of_truth: true.");
  }
  if (canonicalSpec.lifecycle?.default_entrypoint !== "/archetype \"project idea\"") {
    blockers.push("Canonical spec must include the /archetype natural-language default entrypoint.");
  }
  if (!canonicalSpec.product || !canonicalSpec.experience || !canonicalSpec.design_system || !canonicalSpec.frontend_contract) {
    blockers.push("Canonical spec must include product, experience, design_system, and frontend_contract sections.");
  }
  if (canonicalSpec.experience?.route_count !== routes.length) {
    blockers.push("Canonical spec route count must match route map.");
  }
  if (canonicalSpec.experience?.screen_count !== specs.length) {
    blockers.push("Canonical spec screen count must match screen specs.");
  }
  if (!Array.isArray(canonicalSpec.verification?.required_evidence) || canonicalSpec.verification.required_evidence.length === 0) {
    blockers.push("Canonical spec must define required verification evidence.");
  }
  if (testFirstContract.source_spec_path !== "spec/archetype-spec.json") {
    blockers.push("Test-first contract must be derived from spec/archetype-spec.json.");
  }
  if (testFirstContract.traceability?.canonical_spec !== "spec/archetype-spec.json") {
    blockers.push("Test-first traceability must point at the canonical spec.");
  }
  if (testFirstContract.tdd_policy?.test_first_enforced !== true || testFirstContract.tdd_policy?.red_phase_required !== true) {
    blockers.push("Test-first contract must enforce red-first test-driven development.");
  }
  const suiteTypes = new Set((testFirstContract.suites ?? []).map((suite) => suite.suite_type));
  for (const requiredSuite of ["smoke", "e2e", "ui", "integration", "unit"]) {
    if (!suiteTypes.has(requiredSuite)) blockers.push(`Test-first contract missing ${requiredSuite} suite.`);
  }
  if ((testFirstContract.coverage?.route_count ?? -1) !== routes.length) {
    blockers.push("Test-first contract route count must match route map.");
  }
  if ((testFirstContract.coverage?.screen_count ?? -1) !== specs.length) {
    blockers.push("Test-first contract screen count must match screen specs.");
  }
  if ((testFirstContract.coverage?.smoke_test_count ?? 0) < routes.length) {
    blockers.push("Test-first contract must include at least one smoke test per route.");
  }
  if ((testFirstContract.coverage?.required_state_test_count ?? 0) === 0) {
    blockers.push("Test-first contract must include UI state tests.");
  }
  if ((testFirstContract.coverage?.integration_test_count ?? 0) === 0) {
    blockers.push("Test-first contract must include integration tests.");
  }
  if ((testFirstContract.coverage?.unit_test_count ?? 0) === 0) {
    blockers.push("Test-first contract must include unit tests.");
  }
  if ((testFirstContract.coverage?.total_test_count ?? 0) <= routes.length) {
    blockers.push("Test-first contract total test count must exceed route count.");
  }
  if (!Array.isArray(testFirstContract.required_target_test_files) || testFirstContract.required_target_test_files.length < 5) {
    blockers.push("Test-first contract must define required target test files.");
  }
  if (!Array.isArray(testFirstContract.acceptance_gate?.required_evidence) || testFirstContract.acceptance_gate.required_evidence.length === 0) {
    blockers.push("Test-first contract must define required test evidence.");
  }
  const lifecycleStates = new Set((lifecycleStateMachine.states ?? []).map((item) => item.state));
  for (const requiredState of ["clarifying", "waiting_for_optional_materials", "spec_generating", "test_generating", "implementing_tests_first", "verifying_with_playwright", "revising", "done"]) {
    if (!lifecycleStates.has(requiredState)) blockers.push(`Lifecycle state machine missing ${requiredState}.`);
  }
  if (lifecycleStateMachine.default_entrypoint !== "/archetype \"project idea\"") {
    blockers.push("Lifecycle state machine must define /archetype natural-language default entrypoint.");
  }
  if (!String(lifecycleStateMachine.principle ?? "").includes("No code before contract")) {
    blockers.push("Lifecycle state machine must include the spec/test/verification principle.");
  }
  if (!["complete", "needs_clarification"].includes(String(contextCompletion.status))) {
    blockers.push("Context completion status must be complete or needs_clarification.");
  }
  if (!Array.isArray(contextCompletion.questions)) {
    blockers.push("Context completion must expose clarification questions.");
  }

  const artifactIndex = manifest.artifact_index ?? [];
  let checkedFiles = 0;
  for (const artifact of artifactIndex) {
    if (artifact.includes("*")) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact))) {
      blockers.push(`Manifest artifact missing: ${artifact}`);
    }
  }
  for (const artifact of topManifest.artifacts ?? []) {
    if (artifact.required === false || !artifact.path) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact.path))) {
      blockers.push(`Top-level manifest artifact missing: ${artifact.path}`);
    }
  }

  if (manifest.ready_for_frontend_agent !== readiness.readyForFrontendAgent) {
    blockers.push("Manifest readiness and readiness report disagree.");
  }
  if (readiness.readyForFrontendAgent && (readiness.blockers?.length ?? 0) > 0) {
    blockers.push("Readiness report marks package ready while blockers exist.");
  }
  if (schemaReport.status === "fail" || (schemaReport.blockers?.length ?? 0) > 0) {
    blockers.push("Schema validation report contains blockers.");
  }
  if (dsag.integrity?.status === "fail" || (dsag.integrity?.blockers?.length ?? 0) > 0) {
    blockers.push("DSAG integrity report contains blockers.");
  }
  if ((readiness.score ?? 0) < 75) {
    blockers.push("Readiness score is below frontend-agent threshold.");
  }

  warnings.push(...(manifest.warnings ?? []));
  warnings.push(...(readiness.warnings ?? []));

  return {
    status: blockers.length > 0 ? "fail" : "pass",
    outputDir,
    checkedFiles,
    blockers,
    warnings: [...new Set(warnings)]
  };
}
