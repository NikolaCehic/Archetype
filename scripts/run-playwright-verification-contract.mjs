import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "playwright-contract");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "generated-frontend");

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

const generate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "Playwright verification generation should succeed or warn.");

const contractPath = path.join(outputDir, "verification", "playwright-verification-contract.json");
const planPath = path.join(outputDir, "verification", "playwright-verification-plan.md");
const configPath = path.join(outputDir, "verification", "playwright.config.ts");
const specPath = path.join(outputDir, "verification", "playwright-verification.spec.ts");
const evidencePath = path.join(outputDir, "verification", "playwright-evidence.json");
const evidenceMarkdownPath = path.join(outputDir, "verification", "playwright-evidence.md");
for (const file of [contractPath, planPath, configPath, specPath, evidencePath, evidenceMarkdownPath]) {
  assert(existsSync(file), `Missing Playwright verification artifact: ${path.relative(outputDir, file)}`);
}

const contract = readJson(contractPath);
const routeMap = readJson(path.join(outputDir, "experience", "route-map.json"));
const screenSpecs = readJson(path.join(outputDir, "screens", "screen-specs.json"));
assert(contract.source_spec_path === "spec/archetype-spec.json", "Playwright contract must derive from canonical spec.");
assert(contract.source_test_first_contract_path === "test-first/test-first-contract.json", "Playwright contract must derive from test-first contract.");
assert(contract.lifecycle_gate === "verifying_with_playwright", "Playwright contract must bind to verifying_with_playwright.");
assert(contract.runner === "playwright", "Playwright contract must use playwright runner.");
assert(contract.required_target_command === "npm run archetype:playwright", "Playwright contract must define the target command.");
assert(contract.coverage.route_count === routeMap.routes.length, "Playwright route count must match route map.");
assert(contract.coverage.screen_count === screenSpecs.screens.length, "Playwright screen count must match screen specs.");
assert(contract.coverage.route_scenarios >= routeMap.routes.length, "Playwright contract must include route scenarios.");
assert(contract.coverage.state_scenarios > 0, "Playwright contract must include state scenarios.");
assert(contract.coverage.flow_scenarios > 0, "Playwright contract must include flow scenarios.");
assert(contract.coverage.responsive_scenarios >= routeMap.routes.length, "Playwright contract must include responsive scenarios.");
assert(contract.coverage.accessibility_scenarios >= routeMap.routes.length, "Playwright contract must include accessibility scenarios.");
assert(contract.coverage.visual_smoke_scenarios >= routeMap.routes.length, "Playwright contract must include visual-smoke scenarios.");
assert(contract.scenarios.length === contract.coverage.total_scenarios, "Playwright scenarios must match coverage total.");

const pendingEvidence = readJson(evidencePath);
assert(pendingEvidence.status === "pending", "Generated Playwright evidence should start pending.");
assert(pendingEvidence.source_contract === "verification/playwright-verification-contract.json", "Pending evidence must point to contract.");

const playwrightSpec = readFileSync(specPath, "utf8");
for (const expected of ["@playwright/test", "Archetype route verification", "Archetype screen-state verification", "Archetype flow verification", "Archetype responsive verification", "Archetype accessibility verification", "Archetype visual-smoke verification"]) {
  assert(playwrightSpec.includes(expected), `Playwright spec missing ${expected}.`);
}
const playwrightConfig = readFileSync(configPath, "utf8");
assert(playwrightConfig.includes("webServer"), "Playwright config must start the target web server.");
assert(playwrightConfig.includes("archetype-playwright-results.json"), "Playwright config must emit JSON evidence.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with pending Playwright artifacts.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target should pass.");
assert(existsSync(path.join(targetDir, "playwright.config.ts")), "target should include Playwright config.");
assert(existsSync(path.join(targetDir, "tests", "e2e", "archetype-route-smoke.spec.ts")), "target should include Playwright route smoke spec.");
const targetPackage = readJson(path.join(targetDir, "package.json"));
assert(targetPackage.scripts?.["archetype:playwright"] === "playwright test --config=playwright.config.ts", "target package must expose archetype:playwright.");
assert(targetPackage.devDependencies?.["@playwright/test"] === "1.59.1", "target package must include @playwright/test.");

const verify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(verify.status === "pass", "verify-target should pass.");
assert(verify.summary.install === "pass", "verify-target should install dependencies.");
assert(verify.summary.typecheck === "pass", "verify-target should typecheck.");
assert(verify.summary.build === "pass", "verify-target should build.");
assert(verify.summary.playwright === "pass", "verify-target should pass Playwright verification.");
assert(verify.repair.status === "pass", "verify-target should mark repair queue pass when Playwright passes.");
assert(verify.repair.taskCount === 0, "verify-target should not leave repair tasks when Playwright passes.");

const evidence = readJson(evidencePath);
assert(evidence.status === "pass", "Playwright evidence should be pass after verify-target.");
assert(evidence.summary.passed === contract.coverage.total_scenarios, "Playwright evidence pass count should match contract scenario count.");
assert(evidence.summary.failed === 0, "Playwright evidence should have zero failures.");
assert(evidence.coverage.total_scenarios === contract.coverage.total_scenarios, "Playwright evidence coverage should match contract.");
assert(existsSync(path.join(targetDir, "test-results", "archetype-playwright-results.json")), "target should contain Playwright JSON results.");
const repairQueue = readJson(path.join(outputDir, "10-revision", "repair-task-queue.json"));
assert(repairQueue.status === "pass", "repair task queue should be pass after Playwright verification.");
assert(repairQueue.task_count === 0, "repair task queue should be empty after passing verification.");
const screenshots = execFileSync("find", [path.join(targetDir, "test-results", "archetype-visual-smoke"), "-type", "f"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
assert(screenshots.length === contract.coverage.visual_smoke_scenarios, "visual-smoke screenshot count should match contract.");

const e2e = readJson(path.join(outputDir, "13-e2e", "e2e-results.json"));
for (const scenarioId of ["E2E-066", "E2E-067", "E2E-069"]) {
  const scenario = e2e.results.find((item) => item.scenario_id === scenarioId);
  assert(scenario?.status === "pass", `${scenarioId} should be marked pass after Playwright verification.`);
}

rmSync(contractPath);
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", outputDir]);
    return null;
  } catch (error) {
    return String(error.stderr ?? error.message ?? error);
  }
})();
assert(failedValidate !== null, "validate should fail when Playwright verification contract is missing.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  routeCount: contract.coverage.route_count,
  screenCount: contract.coverage.screen_count,
  scenarios: contract.coverage.total_scenarios,
  screenshots: screenshots.length,
  playwright: verify.summary.playwright
};
writeFileSync(path.join(workspace, "playwright-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
