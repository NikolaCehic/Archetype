import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "test-quality-standard-contract");
const approvedInputPath = path.join(workspace, "approved-intake.json");
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

function runJsonMaybeFail(args) {
  const result = spawnSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    json: result.stdout ? JSON.parse(result.stdout) : null
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Test quality standard contract",
  approvedAt: "2026-05-06T00:00:00.000Z"
});

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "test quality standard generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "test quality standard fixture should be human-approved.");

const standardPath = path.join(outputDir, "test-first", "test-quality-standard.json");
const standardMarkdownPath = path.join(outputDir, "test-first", "test-quality-standard.md");
const playwrightContractPath = path.join(outputDir, "verification", "playwright-verification-contract.json");
const playwrightSpecPath = path.join(outputDir, "verification", "playwright-verification.spec.ts");
for (const file of [standardPath, standardMarkdownPath, playwrightContractPath, playwrightSpecPath]) {
  assert(existsSync(file), `Missing test quality artifact: ${path.relative(outputDir, file)}`);
}

const standard = readJson(standardPath);
const standardMarkdown = readFileSync(standardMarkdownPath, "utf8");
assert(standard.source_scope === "HL-11", "test quality standard must identify HL-11.");
assert(standard.rule === "Marker-only tests fail the verifier.", "test quality standard must encode marker-only verifier rule.");
assert(standard.marker_only_tests_fail_verifier === true, "test quality standard must force marker-only verifier failure.");
assert(Array.isArray(standard.forbidden_test_patterns) && standard.forbidden_test_patterns.length === 6, "test quality standard must expose all forbidden patterns.");
assert(Array.isArray(standard.required_test_behaviors) && standard.required_test_behaviors.length === 10, "test quality standard must expose all required behaviors.");
for (const expected of ["[data-archetype-screen]", "generic primary button", "visible controls unbound", "screenshot byte size", "Search filters real visible results", "CTA hover, focus-visible, active/pressed, disabled, loading, success, and error states", "Every visible interactive control", "Visual evidence covers desktop, tablet, and mobile"]) {
  assert(JSON.stringify(standard).includes(expected), `test quality standard missing ${expected}.`);
}
for (const section of ["## Forbidden Test Patterns", "## Required Test Behaviors", "## Exit Condition"]) {
  assert(standardMarkdown.includes(section), `test quality standard markdown missing ${section}.`);
}

const playwrightContract = readJson(playwrightContractPath);
assert(playwrightContract.test_quality_standard_path === "test-first/test-quality-standard.json", "Playwright contract must point to the test quality standard.");
assert(playwrightContract.marker_only_tests_fail_verifier === true, "Playwright contract must enforce marker-only failure.");
assert(playwrightContract.coverage.visual_smoke_scenarios === playwrightContract.coverage.route_count * 3, "visual-smoke scenarios must cover desktop, tablet, and mobile per route.");
const visualScenarios = playwrightContract.scenarios.filter((scenario) => scenario.type === "visual_smoke");
for (const scenario of visualScenarios) {
  assert(["mobile", "tablet", "desktop"].includes(scenario.viewport?.viewport_id), "visual scenario must name an expected viewport.");
  assert(String(scenario.screenshot_path).includes(`-${scenario.viewport.viewport_id}.png`), "visual screenshot path must include viewport id.");
}

const playwrightSpec = readFileSync(playwrightSpecPath, "utf8");
for (const signal of ["getByRole(\"heading\"", "innerText()", "getByRole(\"status\"", "getByRole(\"main\"", "keyboard.press", "setViewportSize", "boundingBox", "screenshot", "Archetype malformed-data verification"]) {
  assert(playwrightSpec.includes(signal), `Playwright spec missing non-marker behavior signal ${signal}.`);
}

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with the test quality standard present.");

const summarize = runJson(["summarize", "--out", outputDir]);
assert(summarize.entrypoints.includes("test-first/test-quality-standard.json"), "summarize should expose the test quality standard.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target should pass before marker-only sabotage.");

const markerOnlySpecPath = path.join(targetDir, "tests", "e2e", "archetype-route-smoke.spec.ts");
writeFileSync(markerOnlySpecPath, [
  "import { expect, test } from \"@playwright/test\";",
  "",
  "test(\"marker only\", async ({ page }) => {",
  "  await page.goto(\"/\");",
  "  await expect(page.locator(\"[data-archetype-screen]\").first()).toBeVisible();",
  "});",
  ""
].join("\n"));

const failedVerify = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(failedVerify.exitCode === 1, "verify-target should fail when target tests are marker-only.");
assert(failedVerify.json?.status === "fail", "verify-target JSON should report fail for marker-only tests.");
assert(failedVerify.json?.blockers?.some((blocker) => String(blocker).includes("Marker-only test file fails HL-11 verifier")), "verify-target should name the HL-11 marker-only blocker.");
assert(failedVerify.json?.summary?.playwright === "pending", "Playwright should not run after marker-only audit fails.");

const failedEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(failedEvidence.status === "fail", "Playwright evidence should fail when marker-only audit blocks verification.");
assert(failedEvidence.evidence_grades.runtime_overall === "fail", "Failed Playwright evidence should fail runtime grade.");
const failedQueue = readJson(path.join(outputDir, "10-revision", "repair-task-queue.json"));
assert(failedQueue.status === "fail", "repair queue should fail when marker-only tests are detected.");
assert(failedQueue.task_count > 0, "repair queue should contain tasks for marker-only verification failure.");

runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
const passingVerify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(passingVerify.status === "pass", "verify-target should pass after restoring behavior-rich generated tests.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  forbiddenPatterns: standard.forbidden_test_patterns.length,
  requiredBehaviors: standard.required_test_behaviors.length,
  visualScenarios: visualScenarios.length,
  markerOnlyBlocked: true
};
writeFileSync(path.join(workspace, "test-quality-standard-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
