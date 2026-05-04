import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "lifecycle-contract");
const richOutputDir = path.join(workspace, "rich-output");
const sparseInputPath = path.join(workspace, "sparse-intake.json");
const sparseOutputDir = path.join(workspace, "sparse-output");

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

function readJson(relativeOrAbsolutePath) {
  return JSON.parse(readFileSync(relativeOrAbsolutePath, "utf8"));
}

const richGenerate = runJson([
  "generate",
  "--input",
  "examples/saas-dashboard-intake.json",
  "--out",
  richOutputDir
]);
assert(["success", "warning"].includes(richGenerate.status), "rich lifecycle generate should succeed or warn.");

const stateMachine = readJson(path.join(richOutputDir, "lifecycle", "state-machine.json"));
assert(stateMachine.default_entrypoint === "/archetype \"project idea\"", "lifecycle must expose the natural-language /archetype entrypoint.");
assert(
  stateMachine.principle === "No code before contract. No implementation before tests. No completion before verification.",
  "lifecycle must encode spec-driven and test-driven principles."
);
const states = new Set((stateMachine.states ?? []).map((item) => item.state));
for (const state of ["clarifying", "waiting_for_optional_materials", "intaking", "spec_generating", "test_generating", "implementing_tests_first", "verifying_with_playwright", "revising", "done"]) {
  assert(states.has(state), `lifecycle is missing ${state}.`);
}

const richContext = readJson(path.join(richOutputDir, "lifecycle", "context-completion.json"));
assert(richContext.status === "complete", "rich example context should be complete enough to proceed.");
assert(richContext.current_state === "clarifying", "context completion must model clarify as the current context-completion state.");
assert(["intaking", "waiting_for_optional_materials"].includes(richContext.next_state), "complete context should move toward intake or optional materials.");
assert(String(richContext.optional_material_prompt).includes("SPEC.md"), "context completion should ask for optional spec/PRD/design materials.");

const manifest = readJson(path.join(richOutputDir, "manifest.json"));
for (const artifactId of ["lifecycle-state-machine", "context-completion", "clarification-questions", "lifecycle-report"]) {
  assert((manifest.artifacts ?? []).some((artifact) => artifact.id === artifactId), `top-level manifest missing ${artifactId}.`);
}

const agents = readFileSync(path.join(richOutputDir, "AGENTS.md"), "utf8");
assert(agents.includes("spec-driven development"), "AGENTS.md must describe the spec-driven lifecycle.");
assert(agents.includes("test-driven development"), "AGENTS.md must describe the test-driven agent phase.");

const validate = runJson(["validate", "--out", richOutputDir]);
assert(validate.status === "pass", "validate should pass with lifecycle artifacts.");

writeFileSync(sparseInputPath, `${JSON.stringify({
  projectName: "LooseIdea",
  context: "I want a helpful frontend for a new product.",
  operatingMode: "full_architecture"
}, null, 2)}\n`);

const sparseGenerate = runJson(["generate", "--input", sparseInputPath, "--out", sparseOutputDir]);
assert(["success", "warning"].includes(sparseGenerate.status), "sparse lifecycle generate should succeed or warn.");
const sparseContext = readJson(path.join(sparseOutputDir, "lifecycle", "context-completion.json"));
assert(sparseContext.status === "needs_clarification", "sparse context should require clarification.");
const questionIds = new Set((sparseContext.questions ?? []).map((item) => item.id));
for (const questionId of ["primary_users", "target_stack", "must_have_flows"]) {
  assert(questionIds.has(questionId), `sparse context should ask ${questionId}.`);
}

const summary = {
  status: "pass",
  richOutputDir,
  sparseOutputDir,
  lifecycleStates: [...states].sort(),
  sparseQuestions: [...questionIds].sort()
};
writeFileSync(path.join(workspace, "lifecycle-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
