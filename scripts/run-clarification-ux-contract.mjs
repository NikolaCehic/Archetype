import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "clarification-ux-contract");
const weakInputPath = path.join(workspace, "weak-marketing.intake.json");
const answeredInputPath = path.join(workspace, "answered-primary-user.intake.json");
const materialAnsweredInputPath = path.join(workspace, "answered-material-intake.intake.json");
const weakOutputDir = path.join(workspace, "weak-output");
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

writeFileSync(weakInputPath, `${JSON.stringify({
  projectName: "Marketing Admin",
  context: "I want to build a admin dashboard for a marketing team",
  operatingMode: "full_architecture"
}, null, 2)}\n`);

const weakGenerate = runJson(["generate", "--input", weakInputPath, "--out", weakOutputDir]);
assert(weakGenerate.status === "warning", "weak prompt should produce a warning clarification package.");
assert(weakGenerate.packageType === "clarification", "weak prompt should produce a clarification package.");
assert(weakGenerate.nextQuestion === "Who is the primary user of this marketing admin dashboard?", "weak marketing dashboard should ask the default first question.");
assert(existsSync(path.join(weakOutputDir, "lifecycle", "clarification-turn.json")), "clarification package must export clarification-turn.json.");
assert(existsSync(path.join(weakOutputDir, "lifecycle", "clarification-turn.md")), "clarification package must export clarification-turn.md.");

const turn = readJson(path.join(weakOutputDir, "lifecycle", "clarification-turn.json"));
const questions = readJson(path.join(weakOutputDir, "lifecycle", "clarification-questions.json"));
const matrix = readJson(path.join(weakOutputDir, "lifecycle", "context-matrix.json"));
assert(turn.source_scope === "HL-04", "clarification turn must identify HL-04.");
assert(turn.rule === "Clarification is not a bulk form.", "clarification turn must ban bulk forms.");
assert(turn.algorithm.length === 9, "clarification turn must expose the nine-step HL-04 algorithm.");
assert(turn.question_count === 1, "clarification turn must expose exactly one question.");
assert(questions.length === 1, "clarification questions artifact must contain exactly one question.");
assert(turn.current_question.question === questions[0].question, "current question must match clarification questions artifact.");
assert(turn.current_question.question === "Who is the primary user of this marketing admin dashboard?", "current question must be the default vague marketing dashboard question.");
assert(turn.current_question.source_scope === "HL-04", "question must carry HL-04 provenance.");
assert(turn.current_question.selection_rule.includes("highest-impact"), "question must explain highest-impact selection.");
assert(turn.current_question.answer_target.context_matrix_decision_id === "primary_users", "question must name the decision it updates.");
assert(turn.selection.selected_decision_id === "primary_users", "selection must choose primary users for the vague marketing prompt.");
assert(turn.selection.selected_impact === "critical", "selected blocker must be critical impact.");
assert(turn.selection.candidate_blockers.every((item) => ["missing", "conflicted", "blocked"].includes(item.status)), "candidate blockers must be missing, conflicted, or blocked.");
assert(turn.answer_protocol.user_experience.includes("Ask only current_question.question"), "answer protocol must forbid grouped questions.");
assert(turn.answer_protocol.update_behavior.includes("rebuild lifecycle/context-matrix.json"), "answer protocol must rebuild the context matrix after each answer.");
assert(turn.answer_protocol.final_pre_contract_step.includes("assumptions and candidate decisions"), "answer protocol must require assumption/candidate approval before contract generation.");
assert(matrix.next_question.id === turn.current_question.id, "context matrix next_question must match clarification turn.");

const applied = runJson([
  "answer-clarification",
  "--input", weakInputPath,
  "--out", answeredInputPath,
  "--question-id", "primary_users",
  "--answer", "Marketing operations manager",
  "--answered-by", "clarification-ux-contract"
]);
assert(applied.status === "warning", "one answer should update context but still warn while more required dimensions are missing.");
assert(applied.answeredQuestionId === "primary_users", "answer command must report the answered question id.");
assert(applied.nextQuestionId === "source_materials_review", "after answering primary user, the next blocker should be source-material intake.");
assert(applied.clarificationTurn.question_count === 1, "answer command must return the next single clarification turn.");
assert(existsSync(answeredInputPath), "answer command must write the updated intake.");

const answeredInput = readJson(answeredInputPath);
assert(answeredInput.users.includes("Marketing operations manager"), "answer command must update the intake users field.");
assert(answeredInput.context.includes("Clarification answer (primary_users"), "answer command must preserve answer provenance in context.");

const answeredGenerate = runJson(["generate", "--input", answeredInputPath, "--out", answeredOutputDir]);
assert(answeredGenerate.packageType === "clarification", "answered-but-incomplete intake should still produce clarification.");
assert(answeredGenerate.nextQuestion.includes("SPEC"), "regeneration must ask the source-material gate after the primary-user answer.");
const answeredTurn = readJson(path.join(answeredOutputDir, "lifecycle", "clarification-turn.json"));
assert(answeredTurn.question_count === 1, "regenerated clarification package must still ask one question.");
assert(answeredTurn.selection.selected_decision_id === "source_materials_review", "regenerated turn must move to source-material intake.");

const materialApplied = runJson([
  "answer-clarification",
  "--input", answeredInputPath,
  "--out", materialAnsweredInputPath,
  "--question-id", "source_materials_review",
  "--answer", "Proceed without source materials for this test.",
  "--answered-by", "clarification-ux-contract"
]);
assert(materialApplied.status === "warning", "material answer should still warn while other required dimensions are missing.");
assert(materialApplied.nextQuestionId === "target_stack", "after explicit no-materials decision, next blocker should be target stack.");
const materialAnsweredInput = readJson(materialAnsweredInputPath);
assert(materialAnsweredInput.materialIntake.status === "none", "explicit no-materials answer must be stored as materialIntake none.");
const materialAnsweredGenerate = runJson(["generate", "--input", materialAnsweredInputPath, "--out", materialAnsweredOutputDir]);
assert(materialAnsweredGenerate.packageType === "clarification", "material-answered intake should still clarify remaining context.");
const materialAnsweredTurn = readJson(path.join(materialAnsweredOutputDir, "lifecycle", "clarification-turn.json"));
assert(materialAnsweredTurn.selection.selected_decision_id === "target_stack", "source-material completion must unblock target stack.");

for (const relativePath of [
  "skills/archetype/SKILL.md",
  "plugins/codex/skills/archetype/SKILL.md",
  "plugins/claude-code/skills/archetype/SKILL.md"
]) {
  const text = readFileSync(path.join(root, relativePath), "utf8");
  assert(text.includes("Ask exactly one"), `${relativePath} must instruct one-question clarification.`);
  assert(text.includes("archetype_answer_clarification"), `${relativePath} must name the clarification answer tool.`);
  assert(!text.includes("Ask at most six"), `${relativePath} must not preserve grouped question wording.`);
}

console.log(JSON.stringify({
  status: "pass",
  weakOutputDir,
  answeredOutputDir,
  materialAnsweredOutputDir,
  firstQuestion: turn.current_question.question,
  nextQuestion: answeredTurn.current_question.question,
  afterMaterialQuestion: materialAnsweredTurn.current_question.question
}, null, 2));
