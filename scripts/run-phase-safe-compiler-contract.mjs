import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "phase-safe-compiler-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const canonicalOutputDir = path.join(workspace, "canonical-output");

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

function phaseMap(manifest) {
  return new Map((manifest.compilerPhases ?? manifest.compiler_phases ?? []).map((item) => [item.phase, item.status]));
}

function assertNoDraftLeak(outputDir) {
  for (const forbiddenPath of [
    "spec/archetype-spec.json",
    "spec/archetype-spec.md",
    "test-first/test-first-contract.json",
    "test-first/playwright-contract.spec.ts",
    "verification/playwright-verification-contract.json",
    "verification/playwright-evidence.json",
    "12-target-frontend/source-file-manifest.json",
    "13-e2e/e2e-scenarios.json",
    "14-target-execution/target-execution-report.json",
    "10-revision/verification-repair-contract.json"
  ]) {
    assert(!existsSync(path.join(outputDir, forbiddenPath)), `Draft output leaked ${forbiddenPath}.`);
  }
}

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "unapproved complete context should generate a draft package.");
assert(draftGenerate.readyForFrontendAgent === false, "draft package must not be frontend-agent ready.");
assertNoDraftLeak(draftOutputDir);

const draftManifest = readJson(path.join(draftOutputDir, "manifest.json"));
const draftInternalManifest = readJson(path.join(draftOutputDir, "00-manifest", "manifest.json"));
const draftTopPhases = phaseMap(draftManifest);
const draftInternalPhases = phaseMap(draftInternalManifest);
for (const phase of ["context", "draft", "approval"]) {
  assert(draftTopPhases.get(phase) === "constructed", `Draft top manifest should construct ${phase}.`);
  assert(draftInternalPhases.get(phase) === "constructed", `Draft internal manifest should construct ${phase}.`);
}
for (const phase of ["canonical", "test_first", "verification", "target", "qa", "repair"]) {
  assert(draftTopPhases.get(phase) === "skipped", `Draft top manifest should skip ${phase}.`);
  assert(draftInternalPhases.get(phase) === "skipped", `Draft internal manifest should skip ${phase}.`);
}

const draftTimeline = runJson(["data-plane", "timeline", "--out", draftOutputDir, "--run", draftGenerate.dataPlaneRunId]);
assert(!draftTimeline.timeline.some((event) => event.type === "verification.recorded"), "Draft data-plane timeline must not record verification events.");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Phase-safe compiler contract",
  approvedAt: "2026-05-08T00:00:00.000Z"
});
const canonicalGenerate = runJson(["generate", "--input", approvedInputPath, "--out", canonicalOutputDir]);
assert(canonicalGenerate.readyForFrontendAgent === true, "bound approval should generate a canonical package.");
const canonicalManifest = readJson(path.join(canonicalOutputDir, "manifest.json"));
const canonicalPhases = phaseMap(canonicalManifest);
for (const phase of ["context", "draft", "approval", "canonical", "test_first", "verification", "target", "qa", "repair"]) {
  assert(canonicalPhases.get(phase) === "constructed", `Canonical manifest should construct ${phase}.`);
}
for (const requiredPath of [
  "spec/archetype-spec.json",
  "test-first/test-first-contract.json",
  "verification/playwright-verification-contract.json",
  "12-target-frontend/source-file-manifest.json",
  "13-e2e/e2e-scenarios.json",
  "10-revision/verification-repair-contract.json"
]) {
  assert(existsSync(path.join(canonicalOutputDir, requiredPath)), `Canonical output missing ${requiredPath}.`);
}
const canonicalTimeline = runJson(["data-plane", "timeline", "--out", canonicalOutputDir, "--run", canonicalGenerate.dataPlaneRunId]);
assert(canonicalTimeline.timeline.some((event) => event.type === "verification.recorded"), "Canonical data-plane timeline should record verification events.");

const result = {
  status: "pass",
  draftOutputDir,
  canonicalOutputDir,
  draftSkipped: [...draftTopPhases.entries()].filter(([, status]) => status === "skipped").map(([phase]) => phase),
  canonicalConstructed: [...canonicalPhases.entries()].filter(([, status]) => status === "constructed").map(([phase]) => phase)
};
writeFileSync(path.join(workspace, "phase-safe-compiler-summary.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
