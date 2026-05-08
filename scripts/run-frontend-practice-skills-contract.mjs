import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "frontend-practice-skills-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedOutputDir = path.join(workspace, "approved-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");

const requiredSkills = [
  "frontend-architecture",
  "react-practices",
  "typescript-strictness",
  "design-system-practices",
  "accessibility-practices",
  "forms-and-validation",
  "data-contract-practices",
  "responsive-practices",
  "performance-practices",
  "visual-polish-practices",
  "testing-practices"
];

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

function practicePath(skill) {
  return path.join("specialist-gate", "frontend-practices", `${skill}.json`);
}

function assertPracticePackage(outputDir, packageLabel) {
  const artifactPath = path.join(outputDir, "governance", "frontend-practice-skills.json");
  const reportPath = path.join(outputDir, "governance", "frontend-practice-skills.md");
  const specialistReviewPath = path.join(outputDir, "draft", "specialist-review.json");
  assert(existsSync(artifactPath), `${packageLabel} missing governance/frontend-practice-skills.json.`);
  assert(existsSync(reportPath), `${packageLabel} missing governance/frontend-practice-skills.md.`);
  assert(existsSync(specialistReviewPath), `${packageLabel} missing draft/specialist-review.json.`);

  const artifact = readJson(artifactPath);
  assert(artifact.source_scope === "HL-08", `${packageLabel} frontend practice artifact must identify HL-08.`);
  assert(artifact.enforcement_rule.includes("not optional recommendations"), `${packageLabel} must encode non-optional enforcement.`);
  assert(artifact.specialist_gate.status === "pass", `${packageLabel} specialist gate should pass when every practice definition exists.`);
  assert(artifact.specialist_gate.pass_fail === true, `${packageLabel} specialist gate must be pass/fail.`);
  assert(artifact.required_skills.length === requiredSkills.length, `${packageLabel} must list every required skill.`);
  for (const skill of requiredSkills) {
    assert(artifact.required_skills.includes(skill), `${packageLabel} missing required skill ${skill}.`);
    const practice = artifact.practices.find((item) => item.skill === skill);
    assert(practice, `${packageLabel} missing practice ${skill}.`);
    assert(practice.owner, `${packageLabel} practice ${skill} missing owner.`);
    assert(Array.isArray(practice.blocker_list) && practice.blocker_list.length > 0, `${packageLabel} practice ${skill} missing blocker list.`);
    assert(practice.output_artifact === practicePath(skill), `${packageLabel} practice ${skill} must name its output artifact.`);
    assert(practice.status === "pass", `${packageLabel} practice ${skill} should pass structural gate.`);
    assert(existsSync(path.join(outputDir, practice.output_artifact)), `${packageLabel} missing practice output artifact ${practice.output_artifact}.`);
    const individual = readJson(path.join(outputDir, practice.output_artifact));
    assert(individual.skill === skill, `${packageLabel} individual artifact for ${skill} must name the skill.`);
    assert(individual.owner === practice.owner, `${packageLabel} individual artifact for ${skill} must preserve owner.`);
    assert(Array.isArray(individual.blocker_list) && individual.blocker_list.length > 0, `${packageLabel} individual artifact for ${skill} must preserve blockers.`);
  }

  const specialistReview = readJson(specialistReviewPath);
  const gate = specialistReview.frontend_practice_gate;
  assert(gate.source_scope === "HL-08", `${packageLabel} specialist review must include HL-08 frontend practice gate.`);
  assert(gate.status === "pass", `${packageLabel} specialist review frontend practice gate must pass.`);
  assert(gate.enforcement_rule.includes("pass/fail checks"), `${packageLabel} specialist review must state pass/fail enforcement.`);
  assert(gate.checks.length === requiredSkills.length, `${packageLabel} specialist review must include every practice check.`);
  for (const skill of requiredSkills) {
    const check = gate.checks.find((item) => item.skill === skill);
    assert(check, `${packageLabel} specialist review missing check ${skill}.`);
    assert(check.owner, `${packageLabel} specialist review check ${skill} missing owner.`);
    assert(Array.isArray(check.blocker_list) && check.blocker_list.length > 0, `${packageLabel} specialist review check ${skill} missing blockers.`);
    assert(check.output_artifact === practicePath(skill), `${packageLabel} specialist review check ${skill} missing output artifact.`);
  }

  const summary = runJson(["summarize", "--out", outputDir]);
  assert(summary.entrypoints.includes("governance/frontend-practice-skills.json"), `${packageLabel} summarize must expose frontend practice skills.`);
  assert(runJson(["validate", "--out", outputDir]).status === "pass", `${packageLabel} must validate with frontend practice artifacts.`);

  rmSync(path.join(outputDir, practicePath("testing-practices")));
  const failedValidate = (() => {
    try {
      runJson(["validate", "--out", outputDir]);
      return null;
    } catch (error) {
      return String(error.stderr ?? error.message ?? error);
    }
  })();
  assert(failedValidate !== null, `${packageLabel} validation must fail when a practice output artifact is missing.`);
}

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "unapproved complete context should generate a draft contract.");
assertPracticePackage(draftOutputDir, "draft package");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Scope 08 Frontend Practice Test",
  approvedAt: "2026-05-06T00:00:00.000Z"
});
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "approved context should generate a canonical package.");
assertPracticePackage(approvedOutputDir, "approved package");

const report = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  practiceCount: requiredSkills.length
};
writeFileSync(path.join(workspace, "frontend-practice-skills-summary.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
