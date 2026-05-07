import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "lifecycle-contract");
const richOutputDir = path.join(workspace, "rich-output");
const sparseInputPath = path.join(workspace, "sparse-intake.json");
const sparseOutputDir = path.join(workspace, "sparse-output");
const marketingWeakInputPath = path.join(workspace, "marketing-weak-intake.json");
const marketingWeakOutputDir = path.join(workspace, "marketing-weak-output");

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
const richContextMatrix = readJson(path.join(richOutputDir, "lifecycle", "context-matrix.json"));
const richReadinessTiers = readJson(path.join(richOutputDir, "lifecycle", "readiness-tiers.json"));
const richImplementationPhases = readJson(path.join(richOutputDir, "lifecycle", "implementation-phases.json"));
assert(richContext.status === "complete", "rich example context should be complete enough to proceed.");
assert(richContext.readiness_tier === "ready_for_contract_draft", "rich context completion should be ready for contract draft.");
assert(richContext.current_state === "clarifying", "context completion must model clarify as the current context-completion state.");
assert(["intaking", "waiting_for_optional_materials"].includes(richContext.next_state), "complete context should move toward intake or optional materials.");
assert(String(richContext.optional_material_prompt).includes("SPEC.md"), "context completion should ask for optional spec/PRD/design materials.");
assert(richContextMatrix.status === richContext.status, "context matrix and context completion must agree.");
assert(richContextMatrix.source_scope === "HL-03", "context matrix must identify Scope 03.");
assert(richContextMatrix.weak_context_definition === "The next artifact would depend on unapproved invention.", "context matrix must define weak context.");
for (const dimension of ["product_outcome", "primary_users", "must_have_flows", "target_stack", "data_auth_boundary", "design_direction", "test_execution_permission", "assumption_approval", "safety_constraints"]) {
  assert((richContextMatrix.required_dimensions ?? []).includes(dimension), `context matrix missing required dimension ${dimension}.`);
  assert((richContextMatrix.decisions ?? []).some((item) => item.id === dimension), `context matrix missing decision for ${dimension}.`);
}
assert((richContextMatrix.readiness_tiers ?? []).length === 7, "context matrix must expose seven readiness tiers.");
assert(Array.isArray(richContextMatrix.decisions) && richContextMatrix.decisions.length > 0, "context matrix must expose decision rows.");
assert(richReadinessTiers.current_tier === "ready_for_contract_approval", "exported rich package should be waiting for contract approval.");
assert((richReadinessTiers.gates ?? []).length === 7, "readiness tiers artifact must expose seven gates.");
assert((richReadinessTiers.artifact_backed_claims ?? []).every((claim) => claim.artifact_refs.length > 0), "readiness tier claims must point to artifacts.");
assert(richImplementationPhases.source_scope === "HL-15", "implementation phases artifact must identify Scope 15.");
assert(richImplementationPhases.implementation_readiness_gate.status === "blocked", "draft implementation phases must block implementation readiness.");

const manifest = readJson(path.join(richOutputDir, "manifest.json"));
assert(manifest.packageType === "draft_contract", "rich but unapproved lifecycle package should be a draft contract.");
for (const artifactId of ["lifecycle-state-machine", "lifecycle-contract-state", "start-request", "context-completion", "context-matrix", "readiness-tiers", "implementation-phases", "clarification-turn", "clarification-state", "clarification-transcript", "clarification-questions", "lifecycle-report", "product-model-draft", "frontend-contract-draft"]) {
  assert((manifest.artifacts ?? []).some((artifact) => artifact.id === artifactId), `top-level manifest missing ${artifactId}.`);
}
assert(!existsSync(path.join(richOutputDir, "AGENTS.md")), "draft package must not emit implementation agent instructions.");
assert(!existsSync(path.join(richOutputDir, "spec", "archetype-spec.json")), "draft package must not emit canonical spec.");
const contractState = readJson(path.join(richOutputDir, "lifecycle", "contract-state.json"));
assert(contractState.current_state === "contract_approval", "draft lifecycle should wait at contract approval.");

const validate = runJson(["validate", "--out", richOutputDir]);
assert(validate.status === "pass", "validate should pass with lifecycle artifacts.");

writeFileSync(sparseInputPath, `${JSON.stringify({
  projectName: "LooseIdea",
  context: "I want a helpful frontend for a new product.",
  operatingMode: "full_architecture"
}, null, 2)}\n`);
writeFileSync(marketingWeakInputPath, `${JSON.stringify({
  projectName: "MarketingAdminWeakPrompt",
  context: "I want to build a admin dashboard for a marketing team",
  operatingMode: "full_architecture"
}, null, 2)}\n`);

const sparseGenerate = runJson(["generate", "--input", sparseInputPath, "--out", sparseOutputDir]);
assert(sparseGenerate.status === "warning", "sparse lifecycle generate should stop with a warning clarification package.");
assert(sparseGenerate.packageType === "clarification", "sparse lifecycle generate should produce a clarification package.");
assert(sparseGenerate.readyForFrontendAgent === false, "sparse lifecycle package must not be ready for a frontend agent.");
const sparseContext = readJson(path.join(sparseOutputDir, "lifecycle", "context-completion.json"));
const sparseContextMatrix = readJson(path.join(sparseOutputDir, "lifecycle", "context-matrix.json"));
const sparseReadinessTiers = readJson(path.join(sparseOutputDir, "lifecycle", "readiness-tiers.json"));
assert(sparseContext.status === "needs_clarification", "sparse context should require clarification.");
assert(sparseContext.readiness_tier === "ready_for_clarification", "sparse context should only be ready for clarification.");
assert(sparseContext.questions.length === 1, "sparse context should ask exactly one question.");
assert(sparseContextMatrix.status === "needs_clarification", "sparse context matrix should require clarification.");
assert(sparseReadinessTiers.current_tier === "ready_for_clarification", "sparse readiness tiers should be ready for clarification.");
assert((sparseReadinessTiers.gates ?? []).find((item) => item.tier === "ready_for_contract_draft")?.status === "blocked", "sparse readiness tiers should block contract draft.");
assert(!existsSync(path.join(sparseOutputDir, "spec", "archetype-spec.json")), "clarification package must not generate a canonical spec.");
assert(!existsSync(path.join(sparseOutputDir, "test-first", "test-first-contract.json")), "clarification package must not generate test-first contracts.");
assert(!existsSync(path.join(sparseOutputDir, "implementation-contract.md")), "clarification package must not generate an implementation contract.");
const questionIds = new Set((sparseContext.questions ?? []).map((item) => item.id));
assert(questionIds.has("primary_users"), "sparse context should ask the highest-impact primary user question first.");

const marketingWeakGenerate = runJson(["generate", "--input", marketingWeakInputPath, "--out", marketingWeakOutputDir]);
assert(marketingWeakGenerate.status === "warning", "marketing weak prompt should stop with a warning clarification package.");
assert(marketingWeakGenerate.packageType === "clarification", "marketing weak prompt should produce a clarification package.");
assert(marketingWeakGenerate.nextQuestion === "Who is the primary user of this marketing admin dashboard?", "marketing weak prompt should ask the default Scope 00 question.");
assert(!existsSync(path.join(marketingWeakOutputDir, "spec", "archetype-spec.json")), "marketing weak prompt must not generate a canonical spec.");
assert(!existsSync(path.join(marketingWeakOutputDir, "test-first", "test-first-contract.json")), "marketing weak prompt must not generate test-first contracts.");
assert(!existsSync(path.join(marketingWeakOutputDir, "implementation-contract.md")), "marketing weak prompt must not generate an implementation contract.");
const marketingWeakMatrix = readJson(path.join(marketingWeakOutputDir, "lifecycle", "context-matrix.json"));
assert(marketingWeakMatrix.status === "needs_clarification", "marketing weak context matrix should require clarification.");
assert((marketingWeakMatrix.decisions ?? []).some((item) => item.id === "primary_users" && item.status === "missing"), "marketing weak context matrix should mark primary users as missing.");

const summary = {
  status: "pass",
  richOutputDir,
  sparseOutputDir,
  marketingWeakOutputDir,
  lifecycleStates: [...states].sort(),
  sparseQuestions: [...questionIds].sort(),
  sparsePackageType: sparseGenerate.packageType,
  marketingWeakNextQuestion: marketingWeakGenerate.nextQuestion
};
writeFileSync(path.join(workspace, "lifecycle-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
