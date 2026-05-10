import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "lifecycle-intake-states-contract");
const richOutputDir = path.join(workspace, "rich-output");
const weakInputPath = path.join(workspace, "weak-marketing.intake.json");
const weakOutputDir = path.join(workspace, "weak-output");
const answeredInputPath = path.join(workspace, "answered-primary-user.intake.json");
const materialAnsweredInputPath = path.join(workspace, "answered-material-intake.intake.json");
const answeredOutputDir = path.join(workspace, "answered-output");
const materialAnsweredOutputDir = path.join(workspace, "material-answered-output");

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

function assertExists(outputDir, relativePath) {
  assert(existsSync(path.join(outputDir, relativePath)), `${outputDir} missing ${relativePath}`);
}

function assertStartRequest(startRequest) {
  assert(startRequest.source_scope === "HL-05", "start request must identify Scope 05.");
  assert(startRequest.state === "start", "start request must model the start state.");
  assert(["natural_language_idea", "change_request", "existing_repo_request"].includes(startRequest.input.request_type), "start request must classify request type.");
  assert(startRequest.output === "lifecycle/start-request.json", "start request must name its exact output.");
  assert(startRequest.allowed.includes("Capture intent."), "start request must allow intent capture.");
  assert(startRequest.allowed.includes("Detect imported files, screenshots, folders, and repo context."), "start request must allow context detection.");
  assert(startRequest.forbidden.includes("Generate spec."), "start request must forbid spec generation.");
  assert(startRequest.forbidden.includes("Generate tests."), "start request must forbid test generation.");
  assert(startRequest.forbidden.includes("Write product UI."), "start request must forbid product UI writes.");
  assert(Array.isArray(startRequest.detected_context.imported_files), "start request must expose imported files.");
  assert(Array.isArray(startRequest.detected_context.screenshots), "start request must expose screenshots.");
  assert(Array.isArray(startRequest.detected_context.folders), "start request must expose folders.");
  assert(Array.isArray(startRequest.detected_context.repo_context), "start request must expose repo context.");
  assert(Number.isInteger(startRequest.detected_context.material_count), "start request must expose material count.");
}

function assertClarificationState(state, contextMatrix) {
  assert(state.source_scope === "HL-05", "clarification state must identify Scope 05.");
  assert(state.state === "clarification", "clarification state must model clarification.");
  assert(state.context_status === contextMatrix.status, "clarification state must match context matrix status.");
  assert(state.outputs.length === 2, "clarification state must expose exactly two outputs.");
  assert(state.outputs.includes("lifecycle/clarification-state.json"), "clarification state must name clarification-state output.");
  assert(state.outputs.includes("lifecycle/clarification-transcript.md"), "clarification state must name transcript output.");
  assert(state.allowed.includes("Ask one question."), "clarification state must allow one question.");
  assert(state.allowed.includes("Update the context matrix after the answer."), "clarification state must allow context-matrix updates.");
  assert(state.forbidden.includes("Ask bulk question sets by default."), "clarification state must forbid bulk questions.");
  assert(state.forbidden.includes("Proceed to contract draft if a hard blocker remains."), "clarification state must forbid draft when hard blockers remain.");
  const blockers = contextMatrix.decisions.filter((decision) => decision.required && ["missing", "conflicted", "blocked"].includes(decision.status));
  assert(state.hard_blockers_remaining === (blockers.length > 0), "clarification state blocker flag must reflect context matrix blockers.");
  if (contextMatrix.status === "needs_clarification") {
    assert(state.current_question.id === contextMatrix.next_question.id, "clarification state current question must match context matrix next question.");
  }
}

function assertIntakeOutputs(outputDir) {
  for (const relativePath of [
    "lifecycle/start-request.json",
    "lifecycle/context-matrix.json",
    "01-evidence/evidence-ledger.json",
    "01-evidence/missing-context.md",
    "lifecycle/clarification-state.json",
    "lifecycle/clarification-transcript.md"
  ]) {
    assertExists(outputDir, relativePath);
  }
}

const richGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", richOutputDir]);
assert(["success", "warning"].includes(richGenerate.status), "rich package should generate.");
assertIntakeOutputs(richOutputDir);
const richStart = readJson(path.join(richOutputDir, "lifecycle", "start-request.json"));
const richMatrix = readJson(path.join(richOutputDir, "lifecycle", "context-matrix.json"));
const richClarificationState = readJson(path.join(richOutputDir, "lifecycle", "clarification-state.json"));
const richEvidence = readJson(path.join(richOutputDir, "01-evidence", "evidence-ledger.json"));
const richMissingContext = readFileSync(path.join(richOutputDir, "01-evidence", "missing-context.md"), "utf8");
const richTranscript = readFileSync(path.join(richOutputDir, "lifecycle", "clarification-transcript.md"), "utf8");
assertStartRequest(richStart);
assertClarificationState(richClarificationState, richMatrix);
assert(richMatrix.decisions.every((decision) => ["confirmed", "candidate", "missing", "conflicted", "blocked"].includes(decision.status)), "context matrix must only use Scope 05 decision statuses.");
assert(richEvidence.decisions.every((decision) => ["confirmed", "candidate", "missing", "conflicted", "blocked"].includes(decision.status)), "evidence ledger must only use Scope 05 decision statuses.");
assert(richMissingContext.includes("## Context Matrix Blockers"), "missing context report must include context matrix blockers.");
assert(richMissingContext.includes("## Evidence Ledger Missing Information"), "missing context report must include evidence missing information.");
assert(richMissingContext.includes("## Candidate Decisions"), "missing context report must include candidates.");
assert(richTranscript.includes("## Start"), "transcript must include start state.");
assert(richTranscript.includes("## Context Scan"), "transcript must include context scan.");
assert(richTranscript.includes("## Clarification"), "transcript must include clarification.");
assert(richTranscript.includes("## Optional Material Intake"), "transcript must include optional material intake.");
const richManifest = readJson(path.join(richOutputDir, "manifest.json"));
for (const artifactId of ["start-request", "clarification-state", "clarification-transcript"]) {
  assert(richManifest.artifacts.some((artifact) => artifact.id === artifactId), `top-level manifest missing ${artifactId}.`);
}
assert(runJson(["validate", "--out", richOutputDir]).status === "pass", "rich package must validate with Scope 05 artifacts.");

writeFileSync(weakInputPath, `${JSON.stringify({
  projectName: "Marketing Admin",
  context: "I want to build a admin dashboard for a marketing team",
  operatingMode: "full_architecture"
}, null, 2)}\n`);
const weakGenerate = runJson(["generate", "--input", weakInputPath, "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "weak prompt must produce a clarification package.");
assertIntakeOutputs(weakOutputDir);
assert(!existsSync(path.join(weakOutputDir, "spec", "archetype-spec.json")), "weak clarification package must not generate spec.");
assert(!existsSync(path.join(weakOutputDir, "test-first", "test-first-contract.json")), "weak clarification package must not generate tests.");
assert(!existsSync(path.join(weakOutputDir, "implementation-contract.md")), "weak clarification package must not generate implementation contract.");
const weakStart = readJson(path.join(weakOutputDir, "lifecycle", "start-request.json"));
const weakMatrix = readJson(path.join(weakOutputDir, "lifecycle", "context-matrix.json"));
const weakClarificationState = readJson(path.join(weakOutputDir, "lifecycle", "clarification-state.json"));
const weakTranscript = readFileSync(path.join(weakOutputDir, "lifecycle", "clarification-transcript.md"), "utf8");
assertStartRequest(weakStart);
assert(weakStart.input.request_type === "natural_language_idea", "weak marketing prompt should be natural-language idea.");
assertClarificationState(weakClarificationState, weakMatrix);
assert(weakClarificationState.hard_blockers_remaining === true, "weak clarification state must keep hard blocker flag.");
assert(weakClarificationState.current_question.question === "Who is the primary user of this marketing admin dashboard?", "weak clarification state must ask the default first question.");
assert(weakTranscript.includes("Current question: Who is the primary user of this marketing admin dashboard?"), "weak transcript must record the current question.");

const applied = runJson([
  "answer-clarification",
  "--input", weakInputPath,
  "--out", answeredInputPath,
  "--question-id", "primary_users",
  "--answer", "Marketing operations manager",
  "--answered-by", "lifecycle-intake-states-contract"
]);
assert(applied.nextQuestionId === "source_materials_review", "after primary user answer, next Scope 05 clarification blocker should be source-material intake.");
const answeredGenerate = runJson(["generate", "--input", answeredInputPath, "--out", answeredOutputDir]);
assert(answeredGenerate.packageType === "clarification", "partially answered prompt should remain clarification.");
assertIntakeOutputs(answeredOutputDir);
const answeredClarificationState = readJson(path.join(answeredOutputDir, "lifecycle", "clarification-state.json"));
assert(answeredClarificationState.current_question.id === "source_materials_review", "answered clarification state must move to source-material intake.");

const materialApplied = runJson([
  "answer-clarification",
  "--input", answeredInputPath,
  "--out", materialAnsweredInputPath,
  "--question-id", "source_materials_review",
  "--answer", "Proceed without source materials.",
  "--answered-by", "lifecycle-intake-states-contract"
]);
assert(materialApplied.nextQuestionId === "target_stack", "after no-materials answer, next Scope 05 clarification blocker should be target stack.");
const materialAnsweredGenerate = runJson(["generate", "--input", materialAnsweredInputPath, "--out", materialAnsweredOutputDir]);
assert(materialAnsweredGenerate.packageType === "clarification", "material-answered prompt should remain clarification until remaining blockers are answered.");
assertIntakeOutputs(materialAnsweredOutputDir);
const materialAnsweredClarificationState = readJson(path.join(materialAnsweredOutputDir, "lifecycle", "clarification-state.json"));
assert(materialAnsweredClarificationState.current_question.id === "target_stack", "material completion must unblock target stack.");

const summary = {
  status: "pass",
  richOutputDir,
  weakOutputDir,
  answeredOutputDir,
  richRequestType: richStart.input.request_type,
  weakQuestion: weakClarificationState.current_question.question,
  answeredNextQuestion: answeredClarificationState.current_question.question,
  afterMaterialQuestion: materialAnsweredClarificationState.current_question.question
};
writeFileSync(path.join(workspace, "lifecycle-intake-states-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
