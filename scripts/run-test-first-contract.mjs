import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "test-first-contract");
const outputDir = path.join(workspace, "archetype-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args) {
  return execFileSync("node", ["dist/cli.js", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function runJson(args) {
  return JSON.parse(run([...args, "--json"]));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

createApprovedIntakeFixture({ root, workspace, approvedInputPath, approvedBy: "Test-first contract test" });
const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "test-first contract generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "test-first contract generation requires approved canonical spec.");

const contractPath = path.join(outputDir, "test-first", "test-first-contract.json");
const planPath = path.join(outputDir, "test-first", "test-first-plan.md");
const playwrightPath = path.join(outputDir, "test-first", "playwright-contract.spec.ts");
const vitestPath = path.join(outputDir, "test-first", "vitest-contract.spec.ts");
for (const file of [contractPath, planPath, playwrightPath, vitestPath]) {
  assert(existsSync(file), `Missing test-first artifact: ${path.relative(outputDir, file)}`);
}

const contract = readJson(contractPath);
const spec = readJson(path.join(outputDir, "spec", "archetype-spec.json"));
const routeMap = readJson(path.join(outputDir, "experience", "route-map.json"));
const screenSpecs = readJson(path.join(outputDir, "screens", "screen-specs.json"));

assert(contract.source_spec_path === "spec/archetype-spec.json", "test-first contract must derive from canonical spec.");
assert(contract.traceability?.canonical_spec === "spec/archetype-spec.json", "test-first traceability must point to canonical spec.");
assert(contract.tdd_policy?.test_first_enforced === true, "test-first policy must enforce tests before implementation.");
assert(contract.tdd_policy?.red_phase_required === true, "test-first policy must require a red phase.");
assert(contract.coverage.route_count === routeMap.routes.length, "test-first route count must match route map.");
assert(contract.coverage.screen_count === screenSpecs.screens.length, "test-first screen count must match screen specs.");
assert(contract.coverage.route_count === spec.experience.route_count, "test-first route count must match canonical spec.");
assert(contract.coverage.screen_count === spec.experience.screen_count, "test-first screen count must match canonical spec.");
assert(contract.coverage.smoke_test_count >= routeMap.routes.length, "test-first contract must include one smoke test per route.");
assert(contract.coverage.e2e_test_count > 0, "test-first contract must include E2E tests.");
assert(contract.coverage.required_state_test_count > 0, "test-first contract must include UI state tests.");
assert(contract.coverage.integration_test_count > 0, "test-first contract must include integration tests.");
assert(contract.coverage.unit_test_count > 0, "test-first contract must include unit tests.");
assert(contract.coverage.total_test_count > routeMap.routes.length, "test-first contract must generate meaningful test coverage.");

const suiteTypes = new Set((contract.suites ?? []).map((suite) => suite.suite_type));
for (const suiteType of ["smoke", "e2e", "ui", "integration", "unit", "accessibility"]) {
  assert(suiteTypes.has(suiteType), `test-first contract missing ${suiteType} suite.`);
}

for (const suite of contract.suites ?? []) {
  assert(suite.creation_phase === "before_product_ui_implementation", `${suite.suite_id} must be created before implementation.`);
  assert((suite.tests ?? []).length > 0, `${suite.suite_id} must include tests.`);
}

const targetFiles = new Set((contract.required_target_test_files ?? []).map((file) => file.path));
for (const file of [
  "tests/e2e/archetype-route-smoke.spec.ts",
  "tests/e2e/archetype-user-flows.spec.ts",
  "tests/ui/archetype-screen-states.spec.ts",
  "tests/integration/archetype-contracts.spec.ts",
  "tests/unit/archetype-components.spec.ts"
]) {
  assert(targetFiles.has(file), `required target test files missing ${file}.`);
}

const plan = readFileSync(planPath, "utf8");
for (const expected of ["# Test-First Plan", "spec/archetype-spec.json", "initial red", "Smoke tests", "E2E tests", "Integration tests", "Unit tests"]) {
  assert(plan.includes(expected), `test-first plan missing ${expected}.`);
}

const playwrightTemplate = readFileSync(playwrightPath, "utf8");
for (const expected of ["@playwright/test", "Archetype route smoke", "Archetype screen states", "data-archetype-screen", "data-archetype-state"]) {
  assert(playwrightTemplate.includes(expected), `Playwright template missing ${expected}.`);
}

const vitestTemplate = readFileSync(vitestPath, "utf8");
for (const expected of ["vitest", "Archetype integration and unit contracts", "sourceSpecPaths"]) {
  assert(vitestTemplate.includes(expected), `Vitest template missing ${expected}.`);
}

const agents = readFileSync(path.join(outputDir, "AGENTS.md"), "utf8");
const claude = readFileSync(path.join(outputDir, "CLAUDE.md"), "utf8");
assert(agents.includes("test-first/test-first-contract.json"), "AGENTS.md must point to the test-first contract.");
assert(agents.includes("test-first/test-quality-standard.json"), "AGENTS.md must point to the test quality standard.");
assert(claude.includes("test-first/test-first-contract.json"), "CLAUDE.md must point to the test-first contract.");
assert(claude.includes("test-first/test-quality-standard.json"), "CLAUDE.md must point to the test quality standard.");

const implementationRules = readJson(path.join(outputDir, "frontend-agent-contract", "implementation-rules.json"));
assert(implementationRules.testFirstContract?.path === "test-first/test-first-contract.json", "implementation rules must point to the test-first contract.");

const codegenTasks = readJson(path.join(outputDir, "12-target-frontend", "codegen-tasks.json"));
const taskOrder = Object.fromEntries((codegenTasks.tasks ?? []).map((task) => [task.task_id, task.order]));
assert(taskOrder.create_verification_tests < taskOrder.create_shared_ui_and_layout, "target codegen must create tests before shared UI and layout.");
assert(taskOrder.create_verification_tests < taskOrder.create_feature_screens, "target codegen must create tests before feature screens.");
assert(taskOrder.create_feature_screens < taskOrder.wire_app_routes, "target codegen must create feature screens before app route wiring.");

const sourceManifest = readJson(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"));
assert(sourceManifest.architecture?.style === "feature_shared_design_system", "source manifest must declare feature/shared/design-system architecture.");
assert(sourceManifest.coverage?.screens === sourceManifest.coverage?.routes, "source manifest must create one feature screen per route.");
assert((sourceManifest.files ?? []).some((file) => String(file.path).startsWith("src/features/") && file.kind === "screen"), "source manifest must include feature screen files.");
assert((sourceManifest.files ?? []).some((file) => String(file.path).startsWith("src/shared/ui/") && file.kind === "component"), "source manifest must include shared UI component files.");
const targetTestFiles = (sourceManifest.files ?? []).filter((file) => file.kind === "test");
assert(targetTestFiles.length > 0, "source manifest must include target test files.");
assert(targetTestFiles.every((file) => (file.reads ?? []).includes("test-first/test-first-contract.json")), "target test files must read the test-first contract.");
assert(targetTestFiles.every((file) => (file.reads ?? []).includes("test-first/test-quality-standard.json")), "target test files must read the test quality standard.");

const manifest = readJson(path.join(outputDir, "manifest.json"));
for (const artifactId of ["test-first-contract", "test-first-plan", "test-quality-standard", "test-quality-standard-report", "test-first-playwright-template", "test-first-vitest-template"]) {
  assert((manifest.artifacts ?? []).some((artifact) => artifact.id === artifactId), `top-level manifest missing ${artifactId}.`);
}

const summarize = runJson(["summarize", "--out", outputDir]);
assert(summarize.entrypoints.includes("test-first/test-first-contract.json"), "summarize should include test-first contract entrypoint.");
assert(summarize.entrypoints.includes("test-first/test-quality-standard.json"), "summarize should include test quality standard entrypoint.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with test-first artifacts.");

rmSync(contractPath);
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", outputDir]);
    return null;
  } catch (error) {
    return String(error.stderr ?? error.message ?? error);
  }
})();
assert(failedValidate !== null, "validate should fail when test-first contract is missing.");

const summary = {
  status: "pass",
  outputDir,
  suites: [...suiteTypes].sort(),
  routeCount: contract.coverage.route_count,
  screenCount: contract.coverage.screen_count,
  totalTests: contract.coverage.total_test_count
};
writeFileSync(path.join(workspace, "test-first-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
