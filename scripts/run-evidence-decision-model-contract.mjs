import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "evidence-decision-model-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const approvedOutputDir = path.join(workspace, "approved-output");
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

const canonicalLevels = [
  "explicit_user_answer",
  "imported_material_fact",
  "repo_fact",
  "user_confirmed_assumption"
];
const allLevels = [
  "unknown",
  "archetype_inference",
  "weak_user_hint",
  ...canonicalLevels
];
const statuses = ["confirmed", "candidate", "missing", "conflicted", "blocked"];

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.readyForFrontendAgent === false, "draft package must remain implementation-blocked before approval.");
assert(existsSync(path.join(draftOutputDir, "governance", "evidence-decision-model.json")), "draft package must export the evidence decision model.");
assert(existsSync(path.join(draftOutputDir, "governance", "evidence-decision-model.md")), "draft package must export the evidence decision model report.");
const draftModel = readJson(path.join(draftOutputDir, "governance", "evidence-decision-model.json"));
assert(draftModel.status === "pass", "draft evidence decision model should pass.");
assert(JSON.stringify(draftModel.canonical_evidence_levels) === JSON.stringify(canonicalLevels), "canonical evidence levels must match HL-02.");
assert(JSON.stringify(draftModel.decision_statuses) === JSON.stringify(statuses), "decision statuses must match HL-02.");
assert(allLevels.every((level) => draftModel.evidence_levels.some((item) => item.level === level)), "all HL-02 evidence levels must be present.");
assert((draftModel.decision_summary?.counts?.candidate ?? 0) > 0, "draft package should preserve inference-backed decisions as candidates.");
assert((draftModel.canonical_surface_audit?.candidate_refs ?? []).some((item) => item.ref === "inference_domain_profile"), "draft audit should expose inference refs as candidate evidence.");
assert((draftModel.confirmed_decision_violations ?? []).length === 0, "draft package must not confirm non-canonical decisions.");
assert((draftModel.failures ?? []).length === 0, "draft model must have no failures.");
const draftLedger = readJson(path.join(draftOutputDir, "01-evidence", "evidence-ledger.json"));
assert(draftLedger.inferences.every((item) => item.evidence_level !== "explicit_user_answer"), "inferences must not masquerade as explicit user answers.");
assert(draftLedger.decisions.every((decision) => statuses.includes(decision.status)), "evidence ledger decisions must use HL-02 statuses only.");
assert(draftLedger.decisions.some((decision) => decision.status === "candidate" && decision.candidate_evidence_refs.includes("inference_domain_profile")), "inference-backed route decisions must be candidate decisions.");
const draftValidate = runJson(["validate", "--out", draftOutputDir]);
assert(draftValidate.status === "pass", "draft package with candidate decisions should remain structurally valid.");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Scope 02 Contract Test",
  approvedAt: "2026-05-06T00:00:00.000Z"
});
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "human-approved package should be implementation-ready.");
const approvedModel = readJson(path.join(approvedOutputDir, "governance", "evidence-decision-model.json"));
assert(approvedModel.package_phase === "implementation_authorized", "approved model should mark implementation-authorized phase.");
assert((approvedModel.decision_summary?.counts?.candidate ?? -1) === 0, "human approval should canonicalize candidate decisions as user-confirmed assumptions.");
assert((approvedModel.canonical_surface_audit?.noncanonical_refs_in_authorized_package ?? []).length === 0, "authorized packages must contain no non-canonical canonical-surface refs.");
assert((approvedModel.failures ?? []).length === 0, "approved model must have no failures.");
const approvedLedger = readJson(path.join(approvedOutputDir, "01-evidence", "evidence-ledger.json"));
assert(approvedLedger.decisions.every((decision) => decision.status === "confirmed"), "approved evidence decisions should be confirmed.");
assert(approvedLedger.inferences.every((item) => item.evidence_level === "user_confirmed_assumption" || item.evidence_level === "imported_material_fact"), "approved inferences must either be user-confirmed assumptions or imported-material facts.");
const approvedValidate = runJson(["validate", "--out", approvedOutputDir]);
assert(approvedValidate.status === "pass", "approved package should validate with canonical evidence refs.");

writeFileSync(weakInputPath, `${JSON.stringify({
  projectName: "WeakMarketingAdmin",
  context: "I want to build a admin dashboard for a marketing team",
  operatingMode: "full_architecture"
}, null, 2)}\n`);
const weakGenerate = runJson(["generate", "--input", weakInputPath, "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "weak context should still stop at clarification.");
assert(existsSync(path.join(weakOutputDir, "governance", "evidence-decision-model.json")), "clarification package must include the evidence decision model.");
const weakModel = readJson(path.join(weakOutputDir, "governance", "evidence-decision-model.json"));
assert(weakModel.status === "pass", "clarification evidence decision model should pass.");
assert(JSON.stringify(weakModel.canonical_evidence_levels) === JSON.stringify(canonicalLevels), "clarification package must expose canonical evidence levels.");
assert(JSON.stringify(weakModel.decision_statuses) === JSON.stringify(statuses), "clarification package must expose decision statuses.");
const weakContextMatrix = readJson(path.join(weakOutputDir, "lifecycle", "context-matrix.json"));
assert(weakContextMatrix.decisions.some((decision) => decision.status === "missing"), "weak context matrix should expose missing decisions.");
assert(weakContextMatrix.decisions.every((decision) => typeof decision.evidence_level === "string"), "context decisions must expose evidence levels.");

const summary = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  weakOutputDir,
  draftCandidateDecisions: draftModel.decision_summary.counts.candidate,
  approvedConfirmedDecisions: approvedModel.decision_summary.counts.confirmed,
  weakPackageType: weakGenerate.packageType
};
writeFileSync(path.join(workspace, "evidence-decision-model-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
