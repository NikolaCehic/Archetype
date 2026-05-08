import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "forbidden-behaviors-contract");
const weakInputPath = path.join(workspace, "weak-intake.json");
const weakOutputDir = path.join(workspace, "weak-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const outputDir = path.join(workspace, "archetype-output");

const forbiddenBehaviors = [
  "Generate code from weak context.",
  "Treat inferred routes as accepted routes.",
  "Treat warnings as readiness.",
  "Ask bulk questions when one-question clarification is possible.",
  "Hide assumptions inside product copy or route names.",
  "Generate a default Vite README as the final project README.",
  "Claim production-grade output from mock-only interactions.",
  "Replace real workflows with generic success states.",
  "Generate tests that only validate its own markers.",
  "Let implementation mutate the contract without approved evidence.",
  "Let QA pass without Playwright evidence."
];

const acceptanceCriteria = [
  "Vague prompts stop at clarification.",
  "Inferred routes remain candidates.",
  "Approved assumptions are recorded.",
  "Shallow tests fail.",
  "Implementation drift creates repair tasks.",
  "Completion requires a clean repair queue."
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

function runJsonMaybeFail(args) {
  const result = spawnSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    json: result.stdout ? JSON.parse(result.stdout) : null
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

writeFileSync(weakInputPath, `${JSON.stringify({
  projectName: "MarketingAdminWeakPrompt",
  context: "I want to build an admin dashboard for a marketing team.",
  operatingMode: "full_architecture"
}, null, 2)}\n`);

const weakGenerate = runJson(["generate", "--input", weakInputPath, "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "Weak prompt must stop at clarification.");
assert(weakGenerate.readyForFrontendAgent === false, "Weak prompt must not be frontend-agent ready.");
assert(!existsSync(path.join(weakOutputDir, "spec", "archetype-spec.json")), "Weak prompt must not generate a canonical spec.");
assert(!existsSync(path.join(weakOutputDir, "frontend-agent-contract", "implementation-rules.json")), "Weak prompt must not generate implementation rules.");
const weakTurn = readJson(path.join(weakOutputDir, "lifecycle", "clarification-turn.json"));
const weakQuestions = readJson(path.join(weakOutputDir, "lifecycle", "clarification-questions.json"));
assert(weakTurn.question_count === 1, "Weak prompt must ask exactly one clarification question.");
assert(weakQuestions.length === 1, "Weak prompt clarification questions artifact must contain exactly one question.");
assert(existsSync(path.join(weakOutputDir, "governance", "forbidden-behaviors.json")), "Clarification package must include the forbidden behavior contract.");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Forbidden behavior contract",
  approvedAt: "2026-05-06T00:00:00.000Z"
});

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(generate.readyForFrontendAgent === true, "Approved fixture should be implementation-authorized.");

const contractPath = path.join(outputDir, "governance", "forbidden-behaviors.json");
const contractMarkdownPath = path.join(outputDir, "governance", "forbidden-behaviors.md");
assert(existsSync(contractPath), "Complete package missing governance/forbidden-behaviors.json.");
assert(existsSync(contractMarkdownPath), "Complete package missing governance/forbidden-behaviors.md.");
const contract = readJson(contractPath);
const contractMarkdown = readFileSync(contractMarkdownPath, "utf8");
assert(contract.source_scope === "HL-13", "Forbidden behavior contract must identify HL-13.");
assert(contract.rule === "Forbidden behaviors are encoded as tests or validators.", "Forbidden behavior contract must encode the Scope 13 rule.");
assert(contract.exit_condition === "Forbidden behaviors are encoded as tests or validators.", "Forbidden behavior contract must preserve the exit condition.");
assert(contract.forbidden_behaviors.length === forbiddenBehaviors.length, "Forbidden behavior contract must contain all forbidden behaviors.");
assert(contract.acceptance_criteria.length === acceptanceCriteria.length, "Forbidden behavior contract must contain all acceptance criteria.");
for (const behavior of forbiddenBehaviors) {
  const item = contract.forbidden_behaviors.find((candidate) => candidate.behavior === behavior);
  assert(item, `Forbidden behavior contract missing ${behavior}`);
  assert(item.status === "encoded", `${behavior} must be encoded.`);
  assert(["validator", "contract_test", "lifecycle_gate"].includes(item.encoded_as), `${behavior} must use a valid enforcement kind.`);
  assert(item.validator_or_test, `${behavior} must name a validator or test.`);
  assert(Array.isArray(item.evidence_artifacts) && item.evidence_artifacts.length > 0, `${behavior} must name evidence artifacts.`);
}
for (const criterion of acceptanceCriteria) {
  assert(contract.acceptance_criteria.some((item) => item.criterion === criterion && item.encoded_as === "contract_test_or_validator"), `Acceptance criterion missing ${criterion}`);
}
for (const expected of ["Source scope: HL-13", "## Forbidden Behaviors", "## Acceptance Criteria", "## Exit Condition"]) {
  assert(contractMarkdown.includes(expected), `Forbidden behavior report missing ${expected}.`);
}

const byBehavior = new Map(contract.forbidden_behaviors.map((item) => [item.behavior, item]));
assert(byBehavior.get("Generate tests that only validate its own markers.").validator_or_test === "scripts/run-test-quality-standard-contract.mjs", "Marker-only tests must be enforced by the test quality contract.");
assert(byBehavior.get("Let implementation mutate the contract without approved evidence.").validator_or_test === "scripts/run-repair-contract.mjs", "Contract mutation must be enforced by the repair contract.");
assert(byBehavior.get("Ask bulk questions when one-question clarification is possible.").validator_or_test === "scripts/run-clarification-ux-contract.mjs", "Bulk clarification must be enforced by the clarification UX contract.");
const qaEvidence = byBehavior.get("Let QA pass without Playwright evidence.").evidence_artifacts;
assert(qaEvidence.includes("qa/playwright-results.json") && qaEvidence.includes("verification/playwright-evidence.json"), "QA forbidden behavior must require Playwright evidence.");

const topManifest = readJson(path.join(outputDir, "manifest.json"));
const internalManifest = readJson(path.join(outputDir, "00-manifest", "manifest.json"));
assert(topManifest.artifacts.some((artifact) => artifact.id === "forbidden-behaviors" && artifact.path === "governance/forbidden-behaviors.json"), "Top manifest must list the forbidden behavior contract.");
assert((internalManifest.artifact_index ?? []).includes("governance/forbidden-behaviors.json"), "Internal manifest must index the forbidden behavior contract.");

const implementationRules = readJson(path.join(outputDir, "frontend-agent-contract", "implementation-rules.json"));
assert(implementationRules.forbiddenBehaviorAcceptance?.path === "governance/forbidden-behaviors.json", "Implementation rules must point to the forbidden behavior contract.");
const readme = readFileSync(path.join(outputDir, "README.md"), "utf8");
assert(readme.includes("Archetype Package"), "Final package README must be Archetype-specific.");
assert(!readme.includes("Vite"), "Final package README must not be a default Vite README.");

const lifecycleExecution = readJson(path.join(outputDir, "lifecycle", "execution-state.json"));
const forbiddenExecution = lifecycleExecution.states.flatMap((state) => state.forbidden ?? []);
for (const expected of ["Replace real behavior with generic success panels.", "Close with unresolved repair queue.", "Claim production readiness without evidence."]) {
  assert(forbiddenExecution.includes(expected), `Lifecycle execution state missing ${expected}`);
}
const repairQueue = readJson(path.join(outputDir, "10-revision", "repair-task-queue.json"));
assert(String(repairQueue.completion_gate).includes("verify-target"), "Completion must require the verify-target repair gate.");
const qaPlaywright = readJson(path.join(outputDir, "qa", "playwright-results.json"));
assert(qaPlaywright.source_evidence === "verification/playwright-evidence.json", "QA Playwright results must trace Playwright evidence.");

const summarize = runJson(["summarize", "--out", outputDir]);
assert(summarize.entrypoints.includes("governance/forbidden-behaviors.json"), "Summarize must expose forbidden behavior contract.");
const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "Validate must pass when forbidden behaviors are encoded.");

const removed = readFileSync(contractPath, "utf8");
rmSync(contractPath);
const failedValidate = runJsonMaybeFail(["validate", "--out", outputDir]);
assert(failedValidate.exitCode === 1, "Validate must fail when forbidden behavior contract is missing.");
assert(failedValidate.json?.blockers?.some((blocker) => String(blocker).includes("governance/forbidden-behaviors.json")), "Validate failure must name the missing forbidden behavior contract.");
writeFileSync(contractPath, removed);

const summary = {
  status: "pass",
  weakOutputDir,
  outputDir,
  forbiddenBehaviors: contract.forbidden_behaviors.length,
  acceptanceCriteria: contract.acceptance_criteria.length,
  weakStoppedAtClarification: true
};
writeFileSync(path.join(workspace, "forbidden-behaviors-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
