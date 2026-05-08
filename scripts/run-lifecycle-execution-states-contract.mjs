import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "lifecycle-execution-states-contract");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const outputDir = path.join(workspace, "archetype-output");

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

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Scope 07 Execution State Test",
  approvedAt: "2026-05-06T00:00:00.000Z"
});

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "Scope 07 fixture generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "Scope 07 fixture must be approved for frontend implementation.");

const executionPath = path.join(outputDir, "lifecycle", "execution-state.json");
const executionMarkdownPath = path.join(outputDir, "lifecycle", "execution-state.md");
assert(existsSync(executionPath), "canonical package must include lifecycle/execution-state.json.");
assert(existsSync(executionMarkdownPath), "canonical package must include lifecycle/execution-state.md.");

const execution = readJson(executionPath);
assert(execution.source_scope === "HL-07", "execution state must identify HL-07.");
assert(execution.current_state === "test_first_authoring", "fresh canonical package should begin at test-first authoring.");
assert(execution.implementation_authorized === true, "execution state must mirror implementation authorization.");
assert(execution.ready_for_completion === false, "fresh canonical package must not claim completion.");
assert(execution.exit_condition === "`ready_for_completion` is true.", "execution state must encode the Scope 07 exit condition.");

const expectedStates = [
  [9, "test_first_authoring"],
  [10, "implementation"],
  [11, "qa_verification"],
  [12, "repair_or_revision"],
  [13, "completion"]
];
for (const [id, state] of expectedStates) {
  const item = execution.states.find((candidate) => candidate.id === id && candidate.state === state);
  assert(item, `execution state missing ${id} ${state}.`);
  assert(Array.isArray(item.allowed) && item.allowed.length > 0, `${state} must expose allowed operations.`);
  assert(Array.isArray(item.forbidden) && item.forbidden.length > 0, `${state} must expose forbidden operations.`);
  assert(Array.isArray(item.outputs) && item.outputs.length > 0, `${state} must expose outputs.`);
}

const testFirst = execution.states.find((item) => item.state === "test_first_authoring");
assert(testFirst.allowed.includes("Generate smoke, E2E, UI, accessibility, integration, and unit test obligations."), "test-first state must allow all required suite obligations.");
assert(testFirst.allowed.includes("Materialize tests before product UI."), "test-first state must require tests before UI.");
assert(testFirst.allowed.includes("Preserve initial red tests."), "test-first state must preserve red tests.");
assert(testFirst.forbidden.includes("Write product UI before tests."), "test-first state must forbid UI before tests.");
assert(testFirst.forbidden.includes("Generate tests that only prove generated markers exist."), "test-first state must forbid marker-only tests.");
assert(testFirst.forbidden.includes("Weaken tests to make implementation pass."), "test-first state must forbid weakened tests.");

const implementation = execution.states.find((item) => item.state === "implementation");
assert(implementation.allowed.includes("Build from the canonical contract."), "implementation state must build from canonical contract.");
assert(implementation.allowed.includes("Stay inside target architecture and file manifest."), "implementation state must stay inside target manifest.");
assert(implementation.forbidden.includes("Invent routes, screens, actions, entities, visual systems, or data behavior outside spec."), "implementation state must forbid scope invention.");
assert(implementation.forbidden.includes("Use untyped escape hatches."), "implementation state must forbid untyped escape hatches.");

const qa = execution.states.find((item) => item.state === "qa_verification");
assert(qa.allowed.includes("Run Playwright."), "QA state must allow Playwright.");
assert(qa.allowed.includes("Test malformed data, edge states, accessibility, responsiveness, and visual evidence."), "QA state must cover edge, a11y, responsive, and visual evidence.");
assert(qa.allowed.includes("Detect contract drift."), "QA state must detect contract drift.");
assert(qa.forbidden.includes("Treat passing smoke tests as sufficient QA."), "QA state must forbid smoke-only QA.");
assert(qa.forbidden.includes("Ignore visual or behavioral drift because selectors exist."), "QA state must forbid selector-only drift blindness.");

const repair = execution.states.find((item) => item.state === "repair_or_revision");
assert(repair.allowed.includes("Patch implementation drift first."), "repair state must patch implementation first.");
assert(repair.allowed.includes("Revise contract only with approved new evidence."), "repair state must require approved evidence for contract revision.");
assert(repair.forbidden.includes("Revise contract to excuse bad implementation."), "repair state must forbid excusing bad implementation.");
assert(repair.forbidden.includes("Close with unresolved repair queue."), "repair state must forbid unresolved closure.");

const completion = execution.states.find((item) => item.state === "completion");
assert(completion.allowed.includes("Produce final report."), "completion state must allow final report.");
assert(completion.forbidden.includes("Claim production readiness without evidence."), "completion state must forbid unevidenced production readiness.");
assert(completion.forbidden.includes("Claim accessibility compliance without review."), "completion state must forbid unevidenced accessibility claims.");

for (const state of expectedStates.map(([, state]) => state)) {
  assert(execution.gates.some((gate) => gate.state === state), `execution gates missing ${state}.`);
}
const testFirstGate = execution.gates.find((gate) => gate.state === "test_first_authoring");
assert(testFirstGate.evidence.marker_only_tests_forbidden === true, "test-first gate must mark marker-only tests forbidden.");
assert(testFirstGate.evidence.red_phase_required === true, "test-first gate must require red phase.");
for (const proof of ["test-first/test-first-contract.json", "test-first/test-quality-standard.json", "verification/playwright-verification-contract.json", "verification/playwright-evidence.json", "14-target-execution/target-execution-report.json", "10-revision/repair-task-queue.json"]) {
  assert(execution.proof_artifacts.includes(proof), `execution state missing proof artifact ${proof}.`);
}

const manifest = readJson(path.join(outputDir, "manifest.json"));
const internalManifest = readJson(path.join(outputDir, "00-manifest", "manifest.json"));
assert(manifest.artifacts.some((artifact) => artifact.id === "lifecycle-execution-state"), "top-level manifest must include lifecycle execution state.");
assert(manifest.artifacts.some((artifact) => artifact.id === "lifecycle-execution-state-report"), "top-level manifest must include lifecycle execution state report.");
assert(internalManifest.artifact_index.includes("lifecycle/execution-state.json"), "internal manifest must index lifecycle execution state.");
assert(internalManifest.artifact_index.includes("lifecycle/execution-state.md"), "internal manifest must index lifecycle execution state report.");

const summary = runJson(["summarize", "--out", outputDir]);
assert(summary.entrypoints.includes("lifecycle/execution-state.json"), "summarize must expose lifecycle execution state.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with Scope 07 execution state artifacts.");

rmSync(executionPath);
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", outputDir]);
    return null;
  } catch (error) {
    return String(error.stderr ?? error.message ?? error);
  }
})();
assert(failedValidate !== null, "validate should fail when lifecycle/execution-state.json is missing.");

const report = {
  status: "pass",
  outputDir,
  currentState: execution.current_state,
  readyForCompletion: execution.ready_for_completion,
  states: expectedStates.map(([, state]) => state)
};
writeFileSync(path.join(workspace, "lifecycle-execution-states-summary.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
