import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { HL16_CONVERGENCE_QUESTIONS } from "../dist/modules/convergenceStandard.js";

const root = process.cwd();
const workspace = path.join(root, "tmp", "convergence-standard-contract");
const weakOutputDir = path.join(workspace, "weak-output");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const approvedOutputDir = path.join(workspace, "approved-output");

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

function assertConvergence(outputDir, expected) {
  const artifactPath = path.join(outputDir, "governance", "convergence-standard.json");
  const markdownPath = path.join(outputDir, "governance", "convergence-standard.md");
  assert(existsSync(artifactPath), `${expected.label} must include governance/convergence-standard.json.`);
  assert(existsSync(markdownPath), `${expected.label} must include governance/convergence-standard.md.`);
  const artifact = readJson(artifactPath);
  assert(artifact.source_scope === "HL-16", `${expected.label} convergence standard must identify HL-16.`);
  assert(artifact.required_answer === "No.", `${expected.label} convergence standard required answer must be No.`);
  assert(artifact.exit_condition === "All convergence questions answer no through automated and documented evidence.", `${expected.label} convergence standard exit condition mismatch.`);
  assert(artifact.current_package?.package_type === expected.packageType, `${expected.label} convergence package type mismatch.`);
  assert(artifact.current_package?.readiness_tier === expected.readinessTier, `${expected.label} convergence readiness tier mismatch.`);
  assert(artifact.current_package?.ready_for_frontend_agent === expected.readyForFrontendAgent, `${expected.label} convergence frontend readiness mismatch.`);
  assert(artifact.current_package?.implementation_authorized === expected.implementationAuthorized, `${expected.label} convergence authorization mismatch.`);
  assert(JSON.stringify(artifact.convergence_questions.map((item) => item.question)) === JSON.stringify([...HL16_CONVERGENCE_QUESTIONS]), `${expected.label} must expose the exact HL-16 questions.`);
  for (const [index, question] of artifact.convergence_questions.entries()) {
    assert(question.id === `HL16-Q${String(index + 1).padStart(2, "0")}`, `${expected.label} question id mismatch.`);
    assert(question.answer === "No.", `${expected.label} question must answer No.`);
    assert(question.status === "evidence_backed_no", `${expected.label} question must be evidence-backed.`);
    assert(Array.isArray(question.automated_evidence) && question.automated_evidence.length > 0, `${expected.label} question missing automated evidence.`);
    assert(Array.isArray(question.documented_evidence) && question.documented_evidence.length > 0, `${expected.label} question missing documented evidence.`);
    assert(Array.isArray(question.lifecycle_artifacts) && question.lifecycle_artifacts.length > 0, `${expected.label} question missing lifecycle artifacts.`);
  }
  for (const required of ["npm test", "npm run marketing-replay:contract", "npm run test-quality:contract", "npm run qa-team:contract", "npm run repair:contract"]) {
    assert(artifact.automated_evidence_summary.includes(required), `${expected.label} automated evidence summary missing ${required}.`);
  }
  for (const required of ["README.md", "docs/agent-lifecycle.md", "governance/convergence-standard.md"]) {
    assert(artifact.documented_evidence_summary.includes(required), `${expected.label} documented evidence summary missing ${required}.`);
  }
  const markdown = readFileSync(markdownPath, "utf8");
  for (const token of ["Source scope: HL-16", "Required answer: No.", "## Questions", "## Automated Evidence", "## Documented Evidence", "## Exit Condition"]) {
    assert(markdown.includes(token), `${expected.label} markdown missing ${token}.`);
  }
  const manifest = readJson(path.join(outputDir, "manifest.json"));
  assert(manifest.artifacts.some((artifactRef) => artifactRef.id === "convergence-standard"), `${expected.label} top manifest missing convergence-standard.`);
  assert(manifest.artifacts.some((artifactRef) => artifactRef.id === "convergence-standard-report"), `${expected.label} top manifest missing convergence-standard-report.`);
  return artifact;
}

const weakGenerate = runJson(["generate", "--input", "examples/vague-marketing-dashboard-intake.json", "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "Weak replay should produce clarification.");
const weakConvergence = assertConvergence(weakOutputDir, {
  label: "weak replay",
  packageType: "clarification",
  readinessTier: "ready_for_clarification",
  readyForFrontendAgent: false,
  implementationAuthorized: false
});
assert(weakConvergence.convergence_questions[0].answer === "No.", "Weak context code question must answer No.");
for (const forbiddenPath of ["spec/archetype-spec.json", "test-first/test-first-contract.json", "implementation-contract.md"]) {
  assert(!existsSync(path.join(weakOutputDir, forbiddenPath)), `Weak replay must not produce ${forbiddenPath}.`);
}

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "Draft fixture should produce draft contract.");
assertConvergence(draftOutputDir, {
  label: "draft package",
  packageType: "draft_contract",
  readinessTier: "ready_for_contract_approval",
  readyForFrontendAgent: false,
  implementationAuthorized: false
});
assert(runJson(["validate", "--out", draftOutputDir]).status === "pass", "Draft package should validate with convergence standard.");

const baseInput = readJson(path.join(root, "examples", "saas-dashboard-intake.json"));
writeFileSync(approvedInputPath, `${JSON.stringify({
  ...baseInput,
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "Scope 16 Convergence Standard Test",
    approvedAt: "2026-05-07T00:00:00.000Z",
    artifactRefs: [
      "governance/convergence-standard.json",
      "spec/archetype-spec.json",
      "test-first/test-first-contract.json"
    ]
  }
}, null, 2)}\n`);
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "Approved fixture should be frontend-agent ready.");
assertConvergence(approvedOutputDir, {
  label: "approved package",
  packageType: "canonical",
  readinessTier: "ready_for_implementation",
  readyForFrontendAgent: true,
  implementationAuthorized: true
});
assert(runJson(["validate", "--out", approvedOutputDir]).status === "pass", "Approved package should validate with convergence standard.");

const convergencePath = path.join(approvedOutputDir, "governance", "convergence-standard.json");
const mutated = readJson(convergencePath);
mutated.convergence_questions[0].answer = "Yes.";
writeFileSync(convergencePath, `${JSON.stringify(mutated, null, 2)}\n`);
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", approvedOutputDir]);
    return null;
  } catch (error) {
    return String(error.stderr ?? error.message ?? error);
  }
})();
assert(failedValidate !== null, "Validate should fail when a convergence question answers Yes.");

const summary = {
  status: "pass",
  weakOutputDir,
  draftOutputDir,
  approvedOutputDir,
  questions: [...HL16_CONVERGENCE_QUESTIONS],
  requiredAnswer: "No."
};
writeFileSync(path.join(workspace, "convergence-standard-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
