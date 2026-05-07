import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "qa-team-contract");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "generated-frontend");

const qaAgents = [
  "qa-lead.md",
  "playwright-e2e-engineer.md",
  "ui-state-qa.md",
  "malformed-data-qa.md",
  "accessibility-qa.md",
  "visual-regression-qa.md",
  "contract-drift-qa.md"
];

const qaArtifacts = [
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "qa/malformed-data-results.json",
  "qa/accessibility-results.md",
  "qa/visual-regression-report.md",
  "qa/contract-drift-report.md",
  "10-revision/repair-task-queue.json"
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

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

for (const role of qaAgents) {
  for (const base of ["agents", path.join("plugins", "claude-code", "agents")]) {
    const filePath = path.join(root, base, role);
    assert(existsSync(filePath), `Missing QA agent ${base}/${role}.`);
    const text = readText(filePath);
    for (const expected of ["## Authority", "## Inputs", "## Outputs", "## Blockers", "## Handoff Rules", "No agent can approve its own work."]) {
      assert(text.includes(expected), `${base}/${role} missing ${expected}.`);
    }
  }
  assert(readText(path.join(root, "agents", role)) === readText(path.join(root, "plugins", "claude-code", "agents", role)), `${role} must be mirrored into the Claude Code plugin.`);
}

const qaLeadRequirements = [
  "## Role",
  "Role ID: `qa-lead`",
  "Role Type: QA orchestration specialist and evidence-coverage gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## QA Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required QA Artifact Contract",
  "## Specialist Assignment Matrix",
  "## Self-Review Checklist",
  "QA produces evidence, not vibes.",
  "qa_ready_for_verifier",
  "qa_needs_repair",
  "qa_blocked_missing_evidence",
  "qa_blocked_stale_evidence",
  "qa_warning_named_external_confirmation",
  "REQUIRED_QA_ARTIFACTS",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "qa/malformed-data-results.json",
  "qa/accessibility-results.md",
  "qa/visual-regression-report.md",
  "qa/contract-drift-report.md",
  "10-revision/repair-task-queue.json",
  "10-revision/drift-report.json",
  "verification/playwright-evidence.json",
  "verification/playwright-evidence.md",
  "14-target-execution/target-execution-report.json",
  "target:test-results/archetype-playwright-results.json",
  "target:test-results/archetype-visual-smoke/",
  "target:playwright-report/",
  "target:test-results/**/*.zip",
  "route",
  "screen_state",
  "flow",
  "responsive",
  "accessibility",
  "visual_smoke",
  "malformed_data",
  "owner_agent",
  "source_contract",
  "evidence_artifacts",
  "qualified human review",
  "Marker-only tests treated as user-visible behavior",
  "No agent can approve its own work.",
  "This role cannot verify or close QA evidence it created."
];
for (const base of ["agents", path.join("plugins", "claude-code", "agents")]) {
  const qaLead = readText(path.join(root, base, "qa-lead.md"));
  for (const expected of qaLeadRequirements) {
    assert(qaLead.includes(expected), `${base}/qa-lead.md missing hardened QA lead requirement: ${expected}.`);
  }
}

const approvedInput = {
  ...readJson(path.join(root, "examples", "saas-dashboard-intake.json")),
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "QA team contract test",
    approvedAt: "2026-05-06T00:00:00.000Z",
    artifactRefs: ["spec/archetype-spec.json", "test-first/test-first-contract.json", "verification/playwright-verification-contract.json"]
  }
};
writeFileSync(approvedInputPath, `${JSON.stringify(approvedInput, null, 2)}\n`);

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "QA fixture generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "QA fixture should be human-approved.");

for (const artifact of qaArtifacts) {
  assert(existsSync(path.join(outputDir, artifact)), `Missing QA artifact ${artifact}.`);
}

const catalog = readJson(path.join(outputDir, "qa", "scenario-catalog.json"));
assert(catalog.source_scope === "HL-10", "QA catalog must identify HL-10.");
assert(catalog.lifecycle_phase === "qa_verification", "QA catalog must identify qa_verification.");
assert(catalog.rule === "QA produces evidence, not vibes.", "QA catalog must encode evidence-not-vibes rule.");
for (const role of qaAgents) assert(catalog.qa_agents.includes(role), `QA catalog missing agent ${role}.`);
for (const artifact of qaArtifacts) assert(catalog.required_artifacts.includes(artifact), `QA catalog missing required artifact ${artifact}.`);
const scenarioTypes = new Set(catalog.scenarios.map((scenario) => scenario.type));
for (const type of ["route", "screen_state", "flow", "responsive", "accessibility", "visual_smoke", "malformed_data"]) {
  assert(scenarioTypes.has(type), `QA catalog missing scenario type ${type}.`);
}

const pendingPlaywright = readJson(path.join(outputDir, "qa", "playwright-results.json"));
assert(pendingPlaywright.status === "pending", "QA Playwright results should start pending.");
const malformed = readJson(path.join(outputDir, "qa", "malformed-data-results.json"));
assert(malformed.source_scope === "HL-10", "Malformed data QA must identify HL-10.");
assert(Array.isArray(malformed.scenarios) && malformed.scenarios.length > 0, "Malformed data QA must expose scenarios.");
assert(readText(path.join(outputDir, "qa", "accessibility-results.md")).includes("## Evidence"), "Accessibility QA report must include evidence.");
assert(readText(path.join(outputDir, "qa", "visual-regression-report.md")).includes("## Evidence"), "Visual QA report must include evidence.");
assert(readText(path.join(outputDir, "qa", "contract-drift-report.md")).includes("## Evidence"), "Contract drift QA report must include evidence.");
assert(runJson(["validate", "--out", outputDir]).status === "pass", "Approved package must validate with pending QA artifacts.");

const summarize = runJson(["summarize", "--out", outputDir]);
for (const artifact of qaArtifacts.filter((item) => item.startsWith("qa/"))) {
  assert(summarize.entrypoints.includes(artifact), `Summarize must expose ${artifact}.`);
}

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target should pass for QA verification.");
const verify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(verify.status === "pass", "verify-target should pass for QA verification.");

const passedPlaywright = readJson(path.join(outputDir, "qa", "playwright-results.json"));
assert(passedPlaywright.status === "pass", "QA Playwright results should pass after verify-target.");
const updatedCatalog = readJson(path.join(outputDir, "qa", "scenario-catalog.json"));
assert(updatedCatalog.scenarios.some((scenario) => scenario.type === "visual_smoke" && scenario.status === "pass"), "Visual-smoke QA scenarios should pass after verify-target.");
assert(readText(path.join(outputDir, "qa", "accessibility-results.md")).includes("Status: pass"), "Accessibility QA report should pass after verify-target.");
assert(readText(path.join(outputDir, "qa", "visual-regression-report.md")).includes("Status: pass"), "Visual QA report should pass after verify-target.");
assert(readText(path.join(outputDir, "qa", "contract-drift-report.md")).includes("Status: pass"), "Contract drift QA report should pass after verify-target.");
assert(runJson(["validate", "--out", outputDir]).status === "pass", "Verified package must validate with QA evidence.");

rmSync(path.join(outputDir, "qa", "visual-regression-report.md"), { force: true });
let failed = false;
try {
  runJson(["validate", "--out", outputDir]);
} catch {
  failed = true;
}
assert(failed, "Validation must fail when a required QA artifact is missing.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  qaAgents,
  qaArtifacts,
  scenarioCount: updatedCatalog.scenarios.length,
  playwrightStatus: passedPlaywright.status
};
writeFileSync(path.join(workspace, "qa-team-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
