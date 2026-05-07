import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { HL15_IMPLEMENTATION_PHASE_NAMES } from "../dist/modules/implementationPhases.js";

const root = process.cwd();
const workspace = path.join(root, "tmp", "implementation-phases-contract");
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

function assertImplementationPhases(outputDir, expected) {
  const artifactPath = path.join(outputDir, "lifecycle", "implementation-phases.json");
  const markdownPath = path.join(outputDir, "lifecycle", "implementation-phases.md");
  assert(existsSync(artifactPath), `${expected.label} must include lifecycle/implementation-phases.json.`);
  assert(existsSync(markdownPath), `${expected.label} must include lifecycle/implementation-phases.md.`);

  const artifact = readJson(artifactPath);
  assert(artifact.source_scope === "HL-15", `${expected.label} implementation phases must identify HL-15.`);
  assert(JSON.stringify(artifact.expected_sequence) === JSON.stringify([...HL15_IMPLEMENTATION_PHASE_NAMES]), `${expected.label} must expose exact phase sequence.`);
  assert(artifact.exit_condition === "Each phase has tests and a lifecycle acceptance gate.", `${expected.label} must preserve the HL-15 exit condition.`);
  assert(artifact.phase_1_priority?.needs_clarification_blocks_implementation_readiness === true, `${expected.label} must encode phase 1 priority.`);
  assert(artifact.current_package?.package_type === expected.packageType, `${expected.label} package type mismatch.`);
  assert(artifact.current_package?.context_status === expected.contextStatus, `${expected.label} context status mismatch.`);
  assert(artifact.current_package?.readiness_tier === expected.readinessTier, `${expected.label} readiness tier mismatch.`);
  assert(artifact.current_package?.ready_for_frontend_agent === expected.readyForFrontendAgent, `${expected.label} frontend readiness mismatch.`);
  assert(artifact.current_package?.implementation_authorized === expected.implementationAuthorized, `${expected.label} implementation authorization mismatch.`);

  const gate = artifact.implementation_readiness_gate;
  assert(gate?.needs_clarification_blocks_implementation_readiness === true, `${expected.label} implementation gate must preserve the clarification block.`);
  assert(gate?.can_enter_ready_for_implementation === expected.canEnterImplementation, `${expected.label} implementation gate should match expected readiness.`);
  assert(gate?.status === (expected.canEnterImplementation ? "satisfied" : "blocked"), `${expected.label} implementation gate status mismatch.`);
  if (expected.contextStatus === "needs_clarification") {
    assert(gate.blockers.includes("context_status is needs_clarification"), `${expected.label} gate must name needs_clarification as blocker.`);
  }

  assert(Array.isArray(artifact.phases) && artifact.phases.length === HL15_IMPLEMENTATION_PHASE_NAMES.length, `${expected.label} must expose seven phases.`);
  for (const [index, name] of HL15_IMPLEMENTATION_PHASE_NAMES.entries()) {
    const phase = artifact.phases[index];
    assert(phase.phase_id === `HL15-P${String(index + 1).padStart(2, "0")}`, `${expected.label} phase id mismatch for ${name}.`);
    assert(phase.order === index + 1, `${expected.label} phase order mismatch for ${name}.`);
    assert(phase.name === name, `${expected.label} phase name mismatch for ${name}.`);
    assert(Array.isArray(phase.contract_tests) && phase.contract_tests.length > 0, `${expected.label} phase ${name} must include contract tests.`);
    assert(phase.lifecycle_acceptance_gate?.gate_id === `HL15-G${String(index + 1).padStart(2, "0")}`, `${expected.label} phase ${name} must include its acceptance gate.`);
    assert(Array.isArray(phase.lifecycle_acceptance_gate.required_artifacts) && phase.lifecycle_acceptance_gate.required_artifacts.length > 0, `${expected.label} phase ${name} gate must include artifacts.`);
    assert(JSON.stringify(phase.lifecycle_acceptance_gate.required_tests) === JSON.stringify(phase.contract_tests), `${expected.label} phase ${name} gate tests must match phase tests.`);
  }

  const markdown = readFileSync(markdownPath, "utf8");
  for (const expectedText of ["Source scope: HL-15", "## Phase 1 Priority", "## Phases", "## Exit Condition", "Each phase has tests and a lifecycle acceptance gate."]) {
    assert(markdown.includes(expectedText), `${expected.label} implementation phases markdown missing ${expectedText}.`);
  }

  const manifest = readJson(path.join(outputDir, "manifest.json"));
  assert(manifest.artifacts.some((artifactRef) => artifactRef.id === "implementation-phases"), `${expected.label} top manifest must include implementation-phases.`);
  assert(manifest.artifacts.some((artifactRef) => artifactRef.id === "implementation-phases-report"), `${expected.label} top manifest must include implementation-phases-report.`);
  return artifact;
}

const weakGenerate = runJson(["generate", "--input", "examples/vague-marketing-dashboard-intake.json", "--out", weakOutputDir]);
assert(weakGenerate.packageType === "clarification", "Weak replay should produce clarification.");
assert(weakGenerate.readinessTier === "ready_for_clarification", "Weak replay should stay ready_for_clarification.");
const weakPhases = assertImplementationPhases(weakOutputDir, {
  label: "weak replay",
  packageType: "clarification",
  contextStatus: "needs_clarification",
  readinessTier: "ready_for_clarification",
  readyForFrontendAgent: false,
  implementationAuthorized: false,
  canEnterImplementation: false
});
assert(weakPhases.phases[0].status === "blocked", "Weak replay phase 1 must be blocked.");
for (const forbiddenPath of ["spec/archetype-spec.json", "test-first/test-first-contract.json", "implementation-contract.md"]) {
  assert(!existsSync(path.join(weakOutputDir, forbiddenPath)), `Weak replay must not produce ${forbiddenPath}.`);
}

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "Draft fixture should produce a draft contract.");
assert(draftGenerate.readinessTier === "ready_for_contract_approval", "Draft fixture should wait for contract approval.");
const draftPhases = assertImplementationPhases(draftOutputDir, {
  label: "draft package",
  packageType: "draft_contract",
  contextStatus: "complete",
  readinessTier: "ready_for_contract_approval",
  readyForFrontendAgent: false,
  implementationAuthorized: false,
  canEnterImplementation: false
});
assert(draftPhases.implementation_readiness_gate.blockers.includes("implementation_authorized is false"), "Draft package must block implementation on authorization.");
assert(runJson(["validate", "--out", draftOutputDir]).status === "pass", "Draft package should validate with implementation phases.");

const baseInput = readJson(path.join(root, "examples", "saas-dashboard-intake.json"));
writeFileSync(approvedInputPath, `${JSON.stringify({
  ...baseInput,
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "Scope 15 Implementation Phases Test",
    approvedAt: "2026-05-07T00:00:00.000Z",
    artifactRefs: [
      "lifecycle/implementation-phases.json",
      "spec/archetype-spec.json",
      "test-first/test-first-contract.json"
    ]
  }
}, null, 2)}\n`);
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readinessTier === "ready_for_implementation", "Approved fixture should reach implementation readiness.");
assert(approvedGenerate.readyForFrontendAgent === true, "Approved fixture should be frontend-agent ready.");
assert(existsSync(path.join(approvedOutputDir, "spec", "archetype-spec.json")), "Approved fixture should produce the canonical spec surface.");
const approvedPhases = assertImplementationPhases(approvedOutputDir, {
  label: "approved package",
  packageType: "canonical",
  contextStatus: "complete",
  readinessTier: "ready_for_implementation",
  readyForFrontendAgent: true,
  implementationAuthorized: true,
  canEnterImplementation: true
});
assert(approvedPhases.implementation_readiness_gate.blockers.length === 0, "Approved package should have no implementation phase blockers.");
assert(runJson(["validate", "--out", approvedOutputDir]).status === "pass", "Approved package should validate with implementation phases.");

rmSync(path.join(approvedOutputDir, "lifecycle", "implementation-phases.json"));
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", approvedOutputDir]);
    return null;
  } catch (error) {
    return String(error.stderr ?? error.message ?? error);
  }
})();
assert(failedValidate !== null, "Validate should fail when implementation phases artifact is missing.");

const summary = {
  status: "pass",
  weakOutputDir,
  draftOutputDir,
  approvedOutputDir,
  phases: [...HL15_IMPLEMENTATION_PHASE_NAMES],
  weakGate: weakPhases.implementation_readiness_gate.status,
  approvedGate: approvedPhases.implementation_readiness_gate.status
};
writeFileSync(path.join(workspace, "implementation-phases-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
