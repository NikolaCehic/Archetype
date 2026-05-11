import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "visual-reference-contract");
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
  try {
    return { exitCode: 0, json: runJson(args), stderr: "" };
  } catch (error) {
    const stdout = String(error.stdout ?? "");
    return {
      exitCode: typeof error.status === "number" ? error.status : 1,
      json: stdout.trim().length > 0 ? JSON.parse(stdout) : null,
      stderr: String(error.stderr ?? error.message ?? "")
    };
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeText(filePath, value) {
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

createApprovedIntakeFixture({ root, workspace, approvedInputPath, approvedBy: "Visual reference contract" });

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "Visual reference fixture generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "Visual reference fixture should be implementation-authorized.");

const visualEvidence = readJson(path.join(outputDir, "01-evidence", "visual-evidence-extraction.json"));
const visualReference = readJson(path.join(outputDir, "04-design-system", "visual-reference-contract.json"));
const playwrightContract = readJson(path.join(outputDir, "verification", "playwright-verification-contract.json"));
const playwrightSpec = readFileSync(path.join(outputDir, "verification", "playwright-verification.spec.ts"), "utf8");

assert(visualEvidence.source_count > 0, "Fixture must include screenshot/reference evidence.");
assert(visualEvidence.aggregate?.verification_assertions?.length > 0, "Visual evidence must create source-bound verification assertions.");
assert(visualReference.required === true, "Visual reference contract must be required when visual sources exist.");
assert(visualReference.assertion_count === visualEvidence.aggregate.verification_assertions.length, "Visual reference contract must preserve assertion count.");
assert(playwrightContract.coverage.visual_reference_scenarios >= playwrightContract.coverage.route_count, "Playwright contract must include one visual-reference scenario per route.");
assert(playwrightContract.coverage.visual_reference_assertions === visualReference.assertion_count, "Playwright contract must preserve visual-reference assertion count.");
assert(playwrightContract.scenarios.some((scenario) => scenario.type === "visual_reference"), "Playwright scenario list must include visual_reference scenarios.");
for (const expected of ["Archetype visual-reference verification", "data-archetype-visual-density", "data-archetype-visual-assertion", "data-archetype-visual-navigation", "data-archetype-visual-layout", "data-archetype-visual-component", "data-archetype-visual-states"]) {
  assert(playwrightSpec.includes(expected), `Playwright spec missing visual-reference proof signal: ${expected}`);
}

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "Validate must pass with visual-reference contract present.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target must materialize visual-reference obligations.");

const passingVerify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(passingVerify.status === "pass", "Generated target must pass visual-reference verification.");
const passingEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(passingEvidence.evidence_grades?.visual_reference_verified === "pass", "Passing evidence must mark visual-reference verification pass.");
assert(passingEvidence.scenario_results.some((result) => result.type === "visual_reference" && result.status === "pass"), "Evidence must include passing visual-reference runtime results.");

const sourceManifest = readJson(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"));
const screenFile = sourceManifest.files.find((file) => file.kind === "screen")?.path;
assert(screenFile, "Source manifest must include a screen file to sabotage.");
const screenPath = path.join(targetDir, screenFile);
assert(existsSync(screenPath), "Generated screen file must exist.");
const originalScreen = readFileSync(screenPath, "utf8");
writeText(
  screenPath,
  originalScreen
    .replaceAll("data-archetype-visual-assertion=", "data-archetype-visual-assertion-missing=")
    .replaceAll("data-archetype-visual-navigation=", "data-archetype-visual-navigation-missing=")
    .replaceAll("data-archetype-visual-layout=", "data-archetype-visual-layout-missing=")
    .replaceAll("data-archetype-visual-component=", "data-archetype-visual-component-missing=")
);

const failedVerify = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", targetDir, "--skip-install"]);
assert(failedVerify.exitCode === 1, "verify-target must fail when visual-reference DOM proof is removed.");
assert(failedVerify.json?.status === "fail", "Failed visual-reference verification must report fail.");
const failingEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(failingEvidence.evidence_grades?.visual_reference_verified === "fail", "Failing evidence must mark visual-reference verification fail.");
assert(failingEvidence.blockers.some((blocker) => String(blocker).includes("Visual-reference assertions")), "Failing evidence must explain visual-reference assertion failure.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  visualSources: visualEvidence.source_count,
  visualAssertions: visualReference.assertion_count,
  visualReferenceScenarios: playwrightContract.coverage.visual_reference_scenarios
};
writeText(path.join(workspace, "visual-reference-contract-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
