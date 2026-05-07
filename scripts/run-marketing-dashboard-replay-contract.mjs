import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MARKETING_DASHBOARD_REPLAY } from "../dist/modules/marketingDashboardReplay.js";

const root = process.cwd();
const workspace = path.join(root, "tmp", "marketing-dashboard-replay-contract");
const outputDir = path.join(workspace, "archetype-output");
const fixturePath = path.join(root, "examples", "vague-marketing-dashboard-intake.json");

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

const fixture = readJson(fixturePath);
assert(fixture.context === MARKETING_DASHBOARD_REPLAY.context, "Replay fixture must preserve the exact Scope 14 context.");

const generate = runJson(["generate", "--input", fixturePath, "--out", outputDir]);
assert(generate.status === "warning", "Marketing dashboard replay must stop with a warning clarification package.");
assert(generate.packageType === "clarification", "Marketing dashboard replay must produce a clarification package.");
assert(generate.readinessTier === MARKETING_DASHBOARD_REPLAY.expected_state, "Marketing dashboard replay must stay ready_for_clarification.");
assert(generate.readyForFrontendAgent === false, "Marketing dashboard replay must not be ready for a frontend agent.");
assert(generate.nextQuestion === MARKETING_DASHBOARD_REPLAY.correct_next_question, "Marketing dashboard replay must ask the exact next question.");

const manifest = readJson(path.join(outputDir, "manifest.json"));
assert(manifest.packageType === "clarification", "Replay manifest must identify a clarification package.");
assert(manifest.readinessTier === MARKETING_DASHBOARD_REPLAY.expected_state, "Replay manifest must stay ready_for_clarification.");
assert(manifest.readyForFrontendAgent === false && manifest.implementationAuthorized === false, "Replay manifest must block implementation.");

const startRequest = readJson(path.join(outputDir, "lifecycle", "start-request.json"));
assert(startRequest.input.captured_intent === MARKETING_DASHBOARD_REPLAY.context, "Replay start request must capture the exact prompt context.");
assert(startRequest.input.request_type === "natural_language_idea", "Replay input must be a natural-language idea.");

const contextMatrix = readJson(path.join(outputDir, "lifecycle", "context-matrix.json"));
assert(contextMatrix.status === "needs_clarification", "Replay context matrix must need clarification.");
assert(contextMatrix.readiness_tier === MARKETING_DASHBOARD_REPLAY.expected_state, "Replay context matrix must stay ready_for_clarification.");
assert(contextMatrix.next_question.question === MARKETING_DASHBOARD_REPLAY.correct_next_question, "Replay context matrix must name the correct next question.");

const decisions = new Map(contextMatrix.decisions.map((decision) => [decision.id, decision]));
assert(decisions.get("product_outcome")?.status === "confirmed", "Replay must confirm only the product outcome from the prompt.");
for (const blocker of MARKETING_DASHBOARD_REPLAY.missing_blockers) {
  assert(decisions.get(blocker)?.status === "missing", `Replay must keep ${blocker} missing.`);
  assert(decisions.get(blocker)?.can_become_canonical === false, `Replay missing blocker ${blocker} must not be canonical.`);
}

const clarificationTurn = readJson(path.join(outputDir, "lifecycle", "clarification-turn.json"));
const clarificationQuestions = readJson(path.join(outputDir, "lifecycle", "clarification-questions.json"));
assert(clarificationTurn.question_count === 1, "Replay must ask exactly one question.");
assert(clarificationQuestions.length === 1, "Replay clarification questions must contain exactly one question.");
assert(clarificationTurn.current_question.question === MARKETING_DASHBOARD_REPLAY.correct_next_question, "Replay clarification turn must ask the correct next question.");
assert(clarificationTurn.selection.selected_decision_id === "primary_users", "Replay must select primary_users as the first blocker.");

const clarificationState = readJson(path.join(outputDir, "lifecycle", "clarification-state.json"));
assert(clarificationState.context_status === "needs_clarification", "Replay clarification state must need clarification.");
assert(clarificationState.hard_blockers_remaining === true, "Replay clarification state must retain hard blockers.");
for (const blocker of MARKETING_DASHBOARD_REPLAY.missing_blockers) {
  assert(clarificationState.missing_decisions.includes(blocker), `Replay clarification state missing ${blocker}.`);
}

const evidence = readJson(path.join(outputDir, "01-evidence", "evidence-ledger.json"));
assert(evidence.known_facts.some((fact) => String(fact.claim).includes("admin dashboard")), "Replay evidence must preserve admin dashboard as a fact.");
assert(evidence.inferences.some((item) => String(item.claim).includes("B2B SaaS analytics dashboard") && item.can_become_canonical === false), "Replay domain inference must stay non-canonical.");
for (const expectedDecision of ["decision_primary_dashboard", "decision_campaign_overview_required", "decision_report_builder_required"]) {
  assert(evidence.decisions.some((decision) => decision.id === expectedDecision && decision.status === "candidate"), `Replay candidate assumption missing ${expectedDecision}.`);
}

for (const forbiddenPath of MARKETING_DASHBOARD_REPLAY.forbidden_output_paths) {
  assert(!existsSync(path.join(outputDir, forbiddenPath)), `Replay must not produce ${forbiddenPath}.`);
}

const readme = readFileSync(path.join(outputDir, "README.md"), "utf8");
assert(readme.includes("Archetype stopped because the provided context would require unapproved invention."), "Replay README must explain the weak-context stop.");
assert(!readme.includes("Vite"), "Replay README must not be a default Vite README.");

const summary = {
  status: "pass",
  outputDir,
  fixture: path.relative(root, fixturePath),
  expectedState: MARKETING_DASHBOARD_REPLAY.expected_state,
  nextQuestion: generate.nextQuestion,
  missingBlockers: MARKETING_DASHBOARD_REPLAY.missing_blockers.length,
  forbiddenOutputsChecked: MARKETING_DASHBOARD_REPLAY.forbidden_output_paths.length
};
writeFileSync(path.join(workspace, "marketing-dashboard-replay-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
