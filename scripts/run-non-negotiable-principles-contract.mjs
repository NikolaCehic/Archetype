import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "non-negotiable-principles-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const humanApprovedInputPath = path.join(workspace, "human-approved-intake.json");
const humanApprovedOutputDir = path.join(workspace, "human-approved-output");
const agentApprovedInputPath = path.join(workspace, "agent-approved-intake.json");
const agentApprovedOutputDir = path.join(workspace, "agent-approved-output");
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

const baseInput = readJson(path.join(root, "examples", "saas-dashboard-intake.json"));

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.status === "warning", "draft package should warn while human approval is pending.");
assert(draftGenerate.readyForFrontendAgent === false, "draft package must not be ready for frontend implementation.");
assert(draftGenerate.blockers.some((blocker) => blocker.includes("canonical contract is not approved by a human reviewer")), "draft package must expose human approval blocker.");
const draftManifest = readJson(path.join(draftOutputDir, "manifest.json"));
assert(draftManifest.implementationAuthorized === false, "draft top manifest must block implementation authorization.");
assert(Array.isArray(draftManifest.readinessEvidence) && draftManifest.readinessEvidence.every((item) => item.artifact_refs.length > 0), "top manifest readiness claims must point to artifacts.");
const draftPrinciples = readJson(path.join(draftOutputDir, "governance", "non-negotiable-principles.json"));
assert(draftPrinciples.status === "blocked", "draft non-negotiable principles should be blocked, not failed.");
assert(draftPrinciples.gates.length === 10, "non-negotiable principles must expose ten gates.");
assert(draftPrinciples.gates.find((gate) => gate.id === "HL01-P03")?.status === "blocked", "P03 must block implementation before human approval.");
assert(draftPrinciples.gates.find((gate) => gate.id === "HL01-P05")?.status === "blocked", "P05 must block completion before Playwright evidence passes.");
assert(draftPrinciples.gates.find((gate) => gate.id === "HL01-P06")?.status === "pass", "P06 must keep inference-backed decisions from being confirmed.");
assert(draftPrinciples.gates.find((gate) => gate.id === "HL01-P07")?.status === "pass", "P07 must preserve one-question clarification.");
assert(draftPrinciples.gates.find((gate) => gate.id === "HL01-P09")?.status === "pass", "P09 must enforce artifact-backed readiness claims.");
assert(draftPrinciples.gates.find((gate) => gate.id === "HL01-P10")?.status === "pass", "P10 must enforce traceability.");
const draftValidate = runJson(["validate", "--out", draftOutputDir]);
assert(draftValidate.status === "pass", "draft package should remain structurally valid while implementation is blocked.");
const draftWrite = runJsonMaybeFail(["write-target", "--out", draftOutputDir, "--target", path.join(workspace, "draft-target"), "--force"]);
assert(draftWrite.exitCode === 1, "write-target must hard-block unapproved draft packages.");
assert(draftWrite.json.blockers.some((blocker) => String(blocker).includes("Implementation is not authorized")), "write-target must expose implementation authorization blocker.");

createApprovedIntakeFixture({ root, workspace, approvedInputPath: humanApprovedInputPath, baseInput, approvedBy: "Scope 01 Contract Test" });
const humanGenerate = runJson(["generate", "--input", humanApprovedInputPath, "--out", humanApprovedOutputDir]);
assert(humanGenerate.readyForFrontendAgent === true, "human-approved package should be ready for frontend agents.");
const humanManifest = readJson(path.join(humanApprovedOutputDir, "manifest.json"));
assert(humanManifest.implementationAuthorized === true, "human-approved package must authorize implementation.");
const humanPrinciples = readJson(path.join(humanApprovedOutputDir, "governance", "non-negotiable-principles.json"));
assert(humanPrinciples.gates.find((gate) => gate.id === "HL01-P03")?.status === "pass", "P03 should pass after human approval.");
assert(humanPrinciples.gates.find((gate) => gate.id === "HL01-P08")?.status === "pass", "P08 should pass for human approval.");
const humanWrite = runJson(["write-target", "--out", humanApprovedOutputDir, "--target", path.join(workspace, "human-target"), "--force"]);
assert(humanWrite.status === "pass", "write-target should pass for human-approved packages.");

writeFileSync(agentApprovedInputPath, `${JSON.stringify({
  ...baseInput,
  contractApproval: {
    approved: true,
    approverType: "agent",
    approvedBy: "implementation-agent",
    approvedAt: "2026-05-06T00:00:00.000Z",
    artifactRefs: ["spec/archetype-spec.json"]
  }
}, null, 2)}\n`);
const agentGenerate = runJson(["generate", "--input", agentApprovedInputPath, "--out", agentApprovedOutputDir]);
assert(agentGenerate.readyForFrontendAgent === false, "agent-approved package must not be implementation-ready.");
const agentPrinciples = readJson(path.join(agentApprovedOutputDir, "governance", "non-negotiable-principles.json"));
assert(agentPrinciples.gates.find((gate) => gate.id === "HL01-P08")?.status === "fail", "P08 must fail when an agent approves its own output.");

writeFileSync(weakInputPath, `${JSON.stringify({
  projectName: "WeakMarketingAdmin",
  context: "I want to build a admin dashboard for a marketing team",
  operatingMode: "full_architecture"
}, null, 2)}\n`);
const weakGenerate = runJson(["generate", "--input", weakInputPath, "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "weak context should produce a clarification package.");
assert(existsSync(path.join(weakOutputDir, "governance", "non-negotiable-principles.json")), "clarification package must include non-negotiable principles.");
assert(!existsSync(path.join(weakOutputDir, "spec", "archetype-spec.json")), "weak clarification package must not generate a canonical spec.");
const weakPrinciples = readJson(path.join(weakOutputDir, "governance", "non-negotiable-principles.json"));
assert(weakPrinciples.status === "blocked", "weak clarification principles should be blocked.");
assert(weakPrinciples.gates.find((gate) => gate.id === "HL01-P07")?.status === "pass", "weak clarification should still ask one question.");

const summary = {
  status: "pass",
  draftOutputDir,
  humanApprovedOutputDir,
  agentApprovedOutputDir,
  weakOutputDir,
  draftReady: draftGenerate.readyForFrontendAgent,
  humanReady: humanGenerate.readyForFrontendAgent,
  agentReady: agentGenerate.readyForFrontendAgent,
  weakPackageType: weakGenerate.packageType
};
writeFileSync(path.join(workspace, "non-negotiable-principles-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
