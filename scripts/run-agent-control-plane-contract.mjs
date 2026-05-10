import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture, readJson } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "agent-control-plane-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const canonicalOutputDir = path.join(workspace, "canonical-output");
const rawInputPath = path.join(workspace, "raw-approved-intake.json");
const rawOutputDir = path.join(workspace, "raw-output");
const intakePath = path.join(root, "examples", "saas-dashboard-intake.json");

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

function controlPlane(outDir) {
  const jsonPath = path.join(outDir, "governance", "agent-control-plane.json");
  const markdownPath = path.join(outDir, "governance", "agent-control-plane.md");
  assert(existsSync(jsonPath), `Missing ${path.relative(outDir, jsonPath)}.`);
  assert(existsSync(markdownPath), `Missing ${path.relative(outDir, markdownPath)}.`);
  const report = readJson(jsonPath);
  const markdown = readFileSync(markdownPath, "utf8");
  assert(markdown.includes("# Agent Control Plane"), "control-plane markdown must expose the agent handoff surface.");
  return report;
}

function gate(report, id) {
  const found = report.gates?.find((item) => item.id === id);
  assert(found, `Missing control-plane gate ${id}.`);
  return found;
}

function assertGateStatus(report, id, status) {
  const found = gate(report, id);
  assert(found.status === status, `Expected ${id} to be ${status}, found ${found.status}.`);
}

function assertP0Pass(report) {
  for (const item of report.gates ?? []) {
    if (item.severity === "P0") {
      assert(item.status === "pass", `P0 gate ${item.id} must pass in canonical control plane, found ${item.status}.`);
    }
  }
}

const draft = runJson(["generate", "--input", intakePath, "--out", draftOutputDir, "--force"]);
assert(draft.packageType === "draft_contract", "unapproved fixture must generate a draft contract.");
const draftControlPlane = controlPlane(draftOutputDir);
assert(draftControlPlane.source_scope === "agent-control-plane", "draft control plane must identify its source scope.");
assert(draftControlPlane.package_type === "draft_contract", "draft control plane must identify draft package type.");
assert(draftControlPlane.lifecycle_authority?.host_agent_may_override === false, "host agent may not override the control plane.");
assert(draftControlPlane.status === "blocked", "draft control plane must block implementation before approval.");
assert(draftControlPlane.context?.material_intake_status === "confirmed", "draft control plane must preserve source-material intake decision.");
assertGateStatus(draftControlPlane, "ACP-01", "pass");
assertGateStatus(draftControlPlane, "ACP-02", "pass");
assertGateStatus(draftControlPlane, "ACP-03", "pass");
assertGateStatus(draftControlPlane, "ACP-04", "blocked");
assertGateStatus(draftControlPlane, "ACP-05", "not_applicable");
assertGateStatus(draftControlPlane, "ACP-07", "pass");
assertGateStatus(draftControlPlane, "ACP-08", "blocked");
assert((draftControlPlane.required_handoff_order ?? [])[0] === "material_intake", "handoff order must start with material intake.");
assert((draftControlPlane.route_proposals ?? []).length > 0, "draft control plane must expose route proposals.");
assert(draftControlPlane.route_proposals.every((item) => item.approval_state === "candidate_until_approval"), "draft routes must remain candidate proposals.");

const baseInput = readJson(intakePath);
writeFileSync(rawInputPath, `${JSON.stringify({
  ...baseInput,
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "Raw JSON Approval",
    approvedAt: "2026-05-09T00:00:00.000Z",
    artifactRefs: ["spec/archetype-spec.json"]
  }
}, null, 2)}\n`);
const rawGenerate = runJson(["generate", "--input", rawInputPath, "--out", rawOutputDir, "--force"]);
assert(rawGenerate.packageType === "draft_contract", "raw JSON approval must remain a draft package.");
const rawControlPlane = controlPlane(rawOutputDir);
assertGateStatus(rawControlPlane, "ACP-04", "blocked");
assertGateStatus(rawControlPlane, "ACP-06", "blocked");
assert(rawControlPlane.blockers.some((item) => String(item).includes("approvalArtifactPath")), "raw approval control plane must name the missing bound approval proof.");

const approvedFixture = createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Agent Control Plane Contract",
  approvedAt: "2026-05-09T00:00:00.000Z"
});
const approvedInput = readJson(approvedInputPath);
const approvalArtifactPath = path.resolve(path.dirname(approvedInputPath), approvedInput.contractApproval.approvalArtifactPath);
const approvalProof = readJson(approvalArtifactPath);
assert(approvalProof.contract_fingerprint?.fingerprint_digest, "approval proof must include a bound contract fingerprint.");

const canonical = runJson(["generate", "--input", approvedInputPath, "--out", canonicalOutputDir, "--force"]);
assert(canonical.readyForFrontendAgent === true, "canonical control plane should preserve frontend-agent readiness.");
const canonicalManifest = readJson(path.join(canonicalOutputDir, "00-manifest", "manifest.json"));
const canonicalControlPlane = controlPlane(canonicalOutputDir);
assert(canonicalControlPlane.package_type === "canonical_contract", "canonical control plane must identify canonical package type.");
assert(canonicalControlPlane.status === "pass", "canonical control plane must pass after bound approval.");
assert(canonicalControlPlane.context?.implementation_authorized === true, "canonical control plane must expose implementation authorization.");
assertP0Pass(canonicalControlPlane);
assertGateStatus(canonicalControlPlane, "ACP-05", "pass");
assertGateStatus(canonicalControlPlane, "ACP-08", "pass");
assert(canonicalControlPlane.route_proposals.every((item) => item.approval_state === "approved"), "canonical routes must be approved.");
assert(canonicalManifest.contract_approval?.contract_fingerprint?.fingerprint_digest === approvalProof.contract_fingerprint.fingerprint_digest, "canonical manifest must preserve approval fingerprint digest.");

const summary = {
  status: "pass",
  draftOutputDir,
  rawOutputDir,
  canonicalOutputDir,
  draftStatus: draftControlPlane.status,
  canonicalStatus: canonicalControlPlane.status,
  approvalDigest: approvedFixture.approval.approvalDigest,
  gates: canonicalControlPlane.gates.length
};
writeFileSync(path.join(workspace, "agent-control-plane-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
