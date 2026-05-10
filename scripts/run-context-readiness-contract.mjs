import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "context-readiness-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const approvedOutputDir = path.join(workspace, "approved-output");
const missingBoundaryInputPath = path.join(workspace, "missing-boundary-intake.json");
const missingBoundaryOutputDir = path.join(workspace, "missing-boundary-output");
const weakInputPath = path.join(workspace, "weak-intake.json");
const weakOutputDir = path.join(workspace, "weak-output");

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

const requiredDimensions = [
  "product_outcome",
  "primary_users",
  "source_materials_review",
  "must_have_flows",
  "target_stack",
  "data_auth_boundary",
  "design_direction",
  "test_execution_permission",
  "assumption_approval",
  "safety_constraints"
];
const readinessTiers = [
  "ready_for_clarification",
  "ready_for_contract_draft",
  "ready_for_contract_approval",
  "ready_for_test_authoring",
  "ready_for_implementation",
  "ready_for_qa",
  "ready_for_completion"
];
const weakContextDefinition = "The next artifact would depend on unapproved invention.";

const baseInput = readJson(path.join(root, "examples", "saas-dashboard-intake.json"));

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.status === "warning", "draft package should warn while contract approval is pending.");
assert(draftGenerate.readinessTier === "ready_for_contract_approval", "draft package should be ready for contract approval, not implementation.");
assert(draftGenerate.readyForFrontendAgent === false, "draft package should not be frontend-agent-ready before approval.");
assert(existsSync(path.join(draftOutputDir, "lifecycle", "readiness-tiers.json")), "draft package must export readiness tiers.");
assert(existsSync(path.join(draftOutputDir, "lifecycle", "readiness-tiers.md")), "draft package must export readiness tier report.");
assert(existsSync(path.join(draftOutputDir, "lifecycle", "clarification-turn.json")), "draft package must export clarification turn.");

const draftContextMatrix = readJson(path.join(draftOutputDir, "lifecycle", "context-matrix.json"));
assert(draftContextMatrix.source_scope === "HL-03", "context matrix must identify HL-03.");
assert(draftContextMatrix.weak_context_definition === weakContextDefinition, "context matrix must define weak context.");
assert(draftContextMatrix.status === "complete", "rich fixture context should be sufficient for a draft.");
assert(draftContextMatrix.readiness_tier === "ready_for_contract_draft", "context matrix should only claim draft readiness.");
assert(JSON.stringify(draftContextMatrix.required_dimensions) === JSON.stringify(requiredDimensions), "context matrix must expose exact required dimensions.");
assert(JSON.stringify(draftContextMatrix.readiness_tiers) === JSON.stringify(readinessTiers), "context matrix must expose exact readiness tiers.");
assert(requiredDimensions.every((id) => draftContextMatrix.decisions.some((decision) => decision.id === id)), "context matrix must have a decision row for every required dimension.");
assert(draftContextMatrix.decisions.filter((decision) => decision.required && decision.status === "missing").length === 0, "rich fixture must have no missing required dimensions.");

const draftReadinessTiers = readJson(path.join(draftOutputDir, "lifecycle", "readiness-tiers.json"));
assert(draftReadinessTiers.source_scope === "HL-03", "readiness tiers must identify HL-03.");
assert(draftReadinessTiers.weak_context_definition === weakContextDefinition, "readiness tiers must define weak context.");
assert(draftReadinessTiers.current_tier === "ready_for_contract_approval", "draft package current tier should be contract approval.");
assert(draftReadinessTiers.gates.length === readinessTiers.length, "readiness tiers must expose seven gates.");
assert(readinessTiers.every((tier) => draftReadinessTiers.gates.some((gate) => gate.tier === tier)), "readiness tiers must include every HL-03 tier.");
assert(draftReadinessTiers.gates.find((gate) => gate.tier === "ready_for_contract_approval")?.status === "current", "draft package should wait at contract approval.");
assert(draftReadinessTiers.gates.find((gate) => gate.tier === "ready_for_implementation")?.status === "blocked", "draft package should block implementation.");
assert(draftReadinessTiers.artifact_backed_claims.every((claim) => claim.artifact_refs.length > 0), "readiness tier claims must be artifact-backed.");
const draftManifest = readJson(path.join(draftOutputDir, "manifest.json"));
const draftInternalManifest = readJson(path.join(draftOutputDir, "00-manifest", "manifest.json"));
const draftReadiness = readJson(path.join(draftOutputDir, "00-manifest", "implementation-readiness.json"));
assert(draftManifest.readinessTier === "ready_for_contract_approval", "top manifest must expose readiness tier.");
assert(draftInternalManifest.readiness_tier === "ready_for_contract_approval", "internal manifest must expose readiness tier.");
assert(draftReadiness.readinessTier === "ready_for_contract_approval", "readiness report must expose readiness tier.");
assert(draftInternalManifest.readiness_evidence.some((item) => item.claim === "readiness_tier:ready_for_contract_approval"), "readiness evidence must support the tier claim.");
assert(runJson(["validate", "--out", draftOutputDir]).status === "pass", "draft package should validate with tiered readiness.");

createApprovedIntakeFixture({ root, workspace, approvedInputPath, baseInput, approvedBy: "Scope 03 Contract Test" });
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readinessTier === "ready_for_implementation", "approved package should be ready for implementation.");
assert(approvedGenerate.readyForFrontendAgent === true, "approved package should be frontend-agent-ready.");
const approvedReadinessTiers = readJson(path.join(approvedOutputDir, "lifecycle", "readiness-tiers.json"));
assert(approvedReadinessTiers.current_tier === "ready_for_implementation", "approved readiness tier artifact should be implementation.");
assert(approvedReadinessTiers.gates.find((gate) => gate.tier === "ready_for_implementation")?.status === "current", "implementation tier should be current.");
assert(approvedReadinessTiers.gates.find((gate) => gate.tier === "ready_for_qa")?.status === "not_reached", "QA tier should not be claimed before implementation evidence.");
assert(runJson(["validate", "--out", approvedOutputDir]).status === "pass", "approved package should validate.");

const missingBoundaryInput = { ...baseInput };
delete missingBoundaryInput.dataBoundary;
writeFileSync(missingBoundaryInputPath, `${JSON.stringify(missingBoundaryInput, null, 2)}\n`);
const missingBoundaryGenerate = runJson(["generate", "--input", missingBoundaryInputPath, "--out", missingBoundaryOutputDir]);
assert(missingBoundaryGenerate.packageType === "clarification", "missing required data boundary should produce clarification package.");
assert(missingBoundaryGenerate.readinessTier === "ready_for_clarification", "missing boundary package should be ready for clarification only.");
assert(missingBoundaryGenerate.nextQuestion === "Should Archetype use mock data, an existing API, or a target repo for data, auth, and permissions?", "missing data boundary should ask the data/auth question.");
assert(!existsSync(path.join(missingBoundaryOutputDir, "spec", "archetype-spec.json")), "missing boundary package must not generate spec.");
const missingBoundaryMatrix = readJson(path.join(missingBoundaryOutputDir, "lifecycle", "context-matrix.json"));
assert(missingBoundaryMatrix.decisions.some((decision) => decision.id === "data_auth_boundary" && decision.status === "missing"), "missing boundary must be recorded in context matrix.");

writeFileSync(weakInputPath, `${JSON.stringify({
  projectName: "WeakMarketingAdmin",
  context: "I want to build a admin dashboard for a marketing team",
  operatingMode: "full_architecture"
}, null, 2)}\n`);
const weakGenerate = runJson(["generate", "--input", weakInputPath, "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "weak prompt should produce clarification package.");
assert(weakGenerate.readinessTier === "ready_for_clarification", "weak prompt should only be ready for clarification.");
const weakReadinessTiers = readJson(path.join(weakOutputDir, "lifecycle", "readiness-tiers.json"));
assert(weakReadinessTiers.current_tier === "ready_for_clarification", "weak readiness tiers should be clarification.");
assert(weakReadinessTiers.gates.find((gate) => gate.tier === "ready_for_contract_draft")?.status === "blocked", "weak context must block contract draft.");
assert(weakReadinessTiers.artifact_backed_claims.every((claim) => claim.artifact_refs.length > 0), "weak tier claims must be artifact-backed.");

const summary = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  missingBoundaryOutputDir,
  weakOutputDir,
  draftTier: draftReadinessTiers.current_tier,
  approvedTier: approvedReadinessTiers.current_tier,
  weakTier: weakReadinessTiers.current_tier
};
writeFileSync(path.join(workspace, "context-readiness-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
