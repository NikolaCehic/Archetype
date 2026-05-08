import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "lifecycle-contract-states-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const approvedOutputDir = path.join(workspace, "approved-output");
const draftTargetDir = path.join(workspace, "draft-target");

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
    json: JSON.parse(result.stdout)
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "complete but unapproved context must produce a draft contract package.");
assert(draftGenerate.readinessTier === "ready_for_contract_approval", "draft package should wait for contract approval.");
assert(draftGenerate.readyForFrontendAgent === false, "draft package must not be ready for a frontend agent.");
assert(draftGenerate.artifacts.some((artifact) => artifact.id === "product-model-draft"), "draft package must return product model draft artifact.");
assert(!draftGenerate.artifacts.some((artifact) => artifact.id === "canonical-spec"), "draft package must not return canonical spec artifact.");

for (const relativePath of [
  "draft/product-model.draft.json",
  "draft/experience-architecture.draft.json",
  "draft/design-system.draft.json",
  "draft/design-system-preview.html",
  "draft/design-system-review.md",
  "draft/frontend-contract.draft.json",
  "draft/assumption-ledger.md",
  "draft/specialist-review.json",
  "draft/contract-approval-request.json",
  "lifecycle/contract-state.json"
]) {
  assert(existsSync(path.join(draftOutputDir, relativePath)), `Draft package missing ${relativePath}.`);
}
for (const forbidden of [
  "spec/archetype-spec.json",
  "spec/archetype-spec.md",
  "test-first/test-first-contract.json",
  "verification/playwright-verification-contract.json",
  "frontend-agent-contract/implementation-rules.json",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/acceptance-criteria.json",
  "implementation-contract.md"
]) {
  assert(!existsSync(path.join(draftOutputDir, forbidden)), `Draft package must not generate ${forbidden}.`);
}

const contractState = readJson(path.join(draftOutputDir, "lifecycle", "contract-state.json"));
assert(contractState.source_scope === "HL-06", "contract state must identify HL-06.");
assert(contractState.current_state === "contract_approval", "unapproved draft must stop at contract approval.");
assert(contractState.canonical_spec_generated === false, "unapproved draft must not generate canonical spec.");
for (const state of ["contract_draft", "specialist_review", "contract_approval", "canonical_spec_generation"]) {
  assert(contractState.states.some((item) => item.state === state), `contract state missing ${state}.`);
}
const contractDraftState = contractState.states.find((item) => item.state === "contract_draft");
assert(contractDraftState.allowed.some((item) => item.includes("Propose product model")), "contract draft state must allow proposing product and contract surfaces.");
assert(contractDraftState.allowed.some((item) => item.includes("Mark every unconfirmed item as candidate")), "contract draft state must require candidate marking.");
assert(contractDraftState.forbidden.includes("Produce implementation-ready instructions."), "contract draft state must forbid implementation-ready instructions.");

const productDraft = readJson(path.join(draftOutputDir, "draft", "product-model.draft.json"));
const experienceDraft = readJson(path.join(draftOutputDir, "draft", "experience-architecture.draft.json"));
const designDraft = readJson(path.join(draftOutputDir, "draft", "design-system.draft.json"));
const designPreview = readFileSync(path.join(draftOutputDir, "draft", "design-system-preview.html"), "utf8");
const designReview = readFileSync(path.join(draftOutputDir, "draft", "design-system-review.md"), "utf8");
const frontendDraft = readJson(path.join(draftOutputDir, "draft", "frontend-contract.draft.json"));
const specialistReview = readJson(path.join(draftOutputDir, "draft", "specialist-review.json"));
const approvalRequest = readJson(path.join(draftOutputDir, "draft", "contract-approval-request.json"));
const assumptionLedger = readFileSync(path.join(draftOutputDir, "draft", "assumption-ledger.md"), "utf8");
assert(productDraft.source_scope === "HL-06" && productDraft.canonical === false && productDraft.implementation_ready === false, "product draft must be non-canonical and not implementation-ready.");
assert(productDraft.unconfirmed_items_default_status === "candidate", "product draft must default unconfirmed items to candidate.");
assert(experienceDraft.routes.every((route) => ["confirmed", "candidate", "missing", "conflicted", "blocked"].includes(route.draft_status)), "routes must expose draft statuses.");
assert(experienceDraft.routes.some((route) => route.acceptance_state === "candidate_until_contract_approval"), "draft routes must include candidate acceptance state.");
assert(designDraft.tokens.draft_status === "candidate_until_contract_approval", "draft tokens must remain candidate until approval.");
assert(designPreview.includes("data-source-artifact=\"draft/design-system.draft.json\""), "design preview must trace to design-system draft JSON.");
assert(designPreview.includes("not app code"), "design preview must state it is not app code.");
assert(designPreview.includes("Colors") && designPreview.includes("Typography") && designPreview.includes("Components") && designPreview.includes("Component States"), "design preview must expose reviewable design system sections.");
assert(designReview.includes("Source scope: HL-17"), "design review must identify HL-17.");
assert(designReview.includes("one clarification question"), "design review must preserve one-question revision UX.");
assert(frontendDraft.implementation_ready === false, "frontend draft must not be implementation-ready.");
assert(frontendDraft.agent_instruction_policy.includes("Do not tell an implementation agent"), "frontend draft must not tell an agent to write code.");
assert(specialistReview.reviewers.every((reviewer) => reviewer.may_approve === false), "specialist reviewers must not approve their own review.");
assert(Array.isArray(specialistReview.blockers) && Array.isArray(specialistReview.warnings) && Array.isArray(specialistReview.recommendations), "specialist review must expose blockers, warnings, and recommendations.");
assert(Array.isArray(approvalRequest.confirmed_facts), "approval request must present confirmed facts.");
assert(Array.isArray(approvalRequest.candidate_assumptions), "approval request must present candidate assumptions.");
assert(Array.isArray(approvalRequest.unresolved_unknowns), "approval request must present unresolved unknowns.");
assert(Array.isArray(approvalRequest.risks), "approval request must present risks.");
assert(approvalRequest.request.includes("Approve this draft contract"), "approval request must ask for approval or edits.");
assert(assumptionLedger.includes("## Candidate Decisions"), "assumption ledger must reveal candidate decisions.");
assert(assumptionLedger.includes("Canonical spec generation is blocked without approval."), "assumption ledger must state canonical spec is blocked.");
assert(runJson(["validate", "--out", draftOutputDir]).status === "pass", "draft package must validate.");
const draftWrite = runJsonMaybeFail(["write-target", "--out", draftOutputDir, "--target", draftTargetDir, "--force"]);
assert(draftWrite.exitCode === 1, "write-target must reject draft packages.");
assert(draftWrite.json.blockers.some((blocker) => String(blocker).includes("Implementation is not authorized")), "write-target must explain implementation authorization blocker.");

const baseInput = readJson(path.join(root, "examples", "saas-dashboard-intake.json"));
createApprovedIntakeFixture({ root, workspace, approvedInputPath, baseInput, approvedBy: "Scope 06 Contract Test" });
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.packageType === undefined, "approved package should be the canonical contract package.");
assert(approvedGenerate.readyForFrontendAgent === true, "approved package should be ready for frontend implementation.");
assert(approvedGenerate.readinessTier === "ready_for_implementation", "approved package should reach implementation readiness.");
for (const required of [
  "spec/archetype-spec.json",
  "spec/archetype-spec.md",
  "frontend-agent-contract/implementation-rules.json",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/acceptance-criteria.json",
  "draft/contract-approval-request.json",
  "lifecycle/contract-state.json"
]) {
  assert(existsSync(path.join(approvedOutputDir, required)), `approved package missing ${required}.`);
}
const approvedContractState = readJson(path.join(approvedOutputDir, "lifecycle", "contract-state.json"));
assert(approvedContractState.current_state === "canonical_spec_generation", "approved package must reach canonical spec generation.");
assert(approvedContractState.canonical_spec_generated === true, "approved package must mark canonical spec generated.");
const approvedSpec = readJson(path.join(approvedOutputDir, "spec", "archetype-spec.json"));
assert(approvedSpec.source_of_truth === true, "approved canonical spec must remain source of truth.");
assert(runJson(["validate", "--out", approvedOutputDir]).status === "pass", "approved canonical package must validate.");

const summary = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  draftPackageType: draftGenerate.packageType,
  approvedTier: approvedGenerate.readinessTier
};
writeFileSync(path.join(workspace, "lifecycle-contract-states-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
