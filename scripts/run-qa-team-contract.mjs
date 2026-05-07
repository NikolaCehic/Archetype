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

const playwrightE2EEngineerRequirements = [
  "## Role",
  "Role ID: `playwright-e2e-engineer`",
  "Role Type: Browser verification specialist and Playwright evidence gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Playwright Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Playwright Evidence Contract",
  "## Scenario Family Matrix",
  "## Failure Routing Matrix",
  "## Self-Review Checklist",
  "playwright_ready_for_qa_lead",
  "playwright_needs_repair",
  "playwright_blocked_missing_evidence",
  "playwright_blocked_contract_mismatch",
  "playwright_blocked_marker_only_evidence",
  "Test user-visible behavior",
  "Marker-only tests fail the verifier.",
  "verification/playwright-verification-contract.json",
  "verification/playwright-verification-plan.md",
  "verification/playwright-verification.spec.ts",
  "verification/playwright.config.ts",
  "verification/playwright-evidence.json",
  "verification/playwright-evidence.md",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "14-target-execution/target-execution-report.json",
  "test-first/test-quality-standard.json",
  "target:playwright.config.ts",
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
  "mobile, tablet, and desktop",
  "screenshot byte size alone",
  "JSON results",
  "HTML report",
  "trace",
  "screenshot",
  "No agent can approve its own work.",
  "This role cannot verify or close Playwright evidence it generated."
];
for (const base of ["agents", path.join("plugins", "claude-code", "agents")]) {
  const playwrightE2EEngineer = readText(path.join(root, base, "playwright-e2e-engineer.md"));
  for (const expected of playwrightE2EEngineerRequirements) {
    assert(playwrightE2EEngineer.includes(expected), `${base}/playwright-e2e-engineer.md missing hardened Playwright E2E requirement: ${expected}.`);
  }
}

const uiStateQaRequirements = [
  "## Role",
  "Role ID: `ui-state-qa`",
  "Role Type: UI state coverage specialist and forced-state evidence gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## UI State Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required UI State Evidence Contract",
  "## State Family Matrix",
  "## Failure Routing Matrix",
  "## Self-Review Checklist",
  "ui_state_ready_for_qa_lead",
  "ui_state_needs_repair",
  "ui_state_blocked_missing_evidence",
  "ui_state_blocked_unreachable_state",
  "ui_state_blocked_marker_only_evidence",
  "ui_state_blocked_accessibility_gap",
  "default",
  "loading",
  "empty",
  "filtered_empty",
  "error",
  "permission_denied",
  "offline",
  "partial_data",
  "stale_data",
  "validation_error",
  "success_confirmation",
  "?archetype_state=...",
  "archetype_state",
  "screen_state",
  "Target evidence: `target:tests/ui/archetype-screen-states.spec.ts`",
  "target:test-results/archetype-playwright-results.json",
  "target:playwright-report/",
  "visible user-facing copy",
  "not marker-only",
  "role, status, alert, error, progress, form association, or accessible feedback",
  "Status messages must not steal focus",
  "screens/screen-specs.json",
  "03-experience-architecture/ux-flow-state-completeness.json",
  "verification/playwright-verification-contract.json",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "14-target-execution/target-execution-report.json",
  "repair-planner.md",
  "accessibility-qa.md",
  "visual-regression-qa.md",
  "No agent can approve its own work.",
  "This role cannot verify or close UI state evidence it generated."
];
for (const base of ["agents", path.join("plugins", "claude-code", "agents")]) {
  const uiStateQa = readText(path.join(root, base, "ui-state-qa.md"));
  for (const expected of uiStateQaRequirements) {
    assert(uiStateQa.includes(expected), `${base}/ui-state-qa.md missing hardened UI state QA requirement: ${expected}.`);
  }
}

const malformedDataQaRequirements = [
  "## Role",
  "Role ID: `malformed-data-qa`",
  "Role Type: Data-boundary QA specialist and invalid-input evidence gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Malformed Data Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Malformed Data Evidence Contract",
  "## Malformed Case Matrix",
  "## Failure Routing Matrix",
  "## Self-Review Checklist",
  "malformed_data_ready_for_qa_lead",
  "malformed_data_needs_repair",
  "malformed_data_blocked_missing_evidence",
  "malformed_data_blocked_unexecuted_runtime",
  "malformed_data_blocked_untraceable_case",
  "malformed_data_blocked_narrative_only",
  "QA produces evidence, not vibes.",
  "missing_required_value",
  "null_non_nullable",
  "wrong_type",
  "invalid_identifier",
  "invalid_enum_value",
  "invalid_date_or_currency",
  "empty_payload",
  "unexpected_extra_field",
  "oversized_or_long_label",
  "permission_denied_fixture",
  "stale_or_conflicting_payload",
  "qa/scenario-catalog.json",
  "qa/malformed-data-results.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "06-frontend-agent-contract/data-operation-contracts.json",
  "06-frontend-agent-contract/form-contracts.json",
  "06-frontend-agent-contract/action-contracts.json",
  "12-target-frontend/adapter-interfaces.ts",
  "14-target-execution/target-execution-report.json",
  "Target evidence: `target:tests/integration/archetype-contracts.spec.ts`",
  "target:test-results/archetype-contracts.json",
  "runtime target evidence",
  "malformed_input",
  "expected_user_result",
  "backend/security validation",
  "strict-typescript-developer.md",
  "frontend-architect.md",
  "repair-planner.md",
  "No agent can approve its own work.",
  "This role cannot verify or close malformed-data evidence it generated."
];
for (const base of ["agents", path.join("plugins", "claude-code", "agents")]) {
  const malformedDataQa = readText(path.join(root, base, "malformed-data-qa.md"));
  for (const expected of malformedDataQaRequirements) {
    assert(malformedDataQa.includes(expected), `${base}/malformed-data-qa.md missing hardened malformed-data QA requirement: ${expected}.`);
  }
}

const accessibilityQaRequirements = [
  "## Role",
  "Role ID: `accessibility-qa`",
  "Role Type: Accessibility evidence verifier and compliance-claim boundary gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Accessibility QA Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Accessibility QA Evidence Contract",
  "## Accessibility QA Matrix",
  "## Failure Routing Matrix",
  "## Self-Review Checklist",
  "accessibility_qa_ready_for_qa_lead",
  "accessibility_qa_needs_repair",
  "accessibility_qa_blocked_missing_evidence",
  "accessibility_qa_blocked_marker_only_evidence",
  "accessibility_qa_blocked_compliance_overclaim",
  "accessibility_qa_blocked_untraceable_finding",
  "Accessibility QA produces evidence, not vibes.",
  "Automated accessibility checks are useful but cannot certify accessibility compliance.",
  "Qualified human evaluation is required before compliance claims.",
  "No ARIA is better than Bad ARIA",
  "qa/accessibility-results.md",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "verification/playwright-verification-contract.json",
  "verification/playwright-evidence.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "04-design-system/accessibility/accessibility-rules.json",
  "04-design-system/components/component-contracts.json",
  "05-screen-specs/*.yaml",
  "08-quality/accessibility-report.md",
  "14-target-execution/target-execution-report.json",
  "Target evidence: `target:tests/e2e/archetype-accessibility.spec.ts`",
  "target:test-results/archetype-playwright-results.json",
  "target:playwright-report/",
  "headings_landmarks",
  "names_labels",
  "roles_semantics",
  "keyboard_path",
  "focus_visibility",
  "forms_errors",
  "status_feedback",
  "color_contrast_meaning",
  "motion_reduced",
  "chart_table_fallback",
  "compliance_boundary",
  "WCAG AA compliance is claimed from Playwright alone",
  "accessibility-specialist.md",
  "design-system-architect.md",
  "repair-planner.md",
  "visual-regression-qa.md",
  "No agent can approve its own work.",
  "This role cannot verify or close accessibility evidence it generated."
];
for (const base of ["agents", path.join("plugins", "claude-code", "agents")]) {
  const accessibilityQa = readText(path.join(root, base, "accessibility-qa.md"));
  for (const expected of accessibilityQaRequirements) {
    assert(accessibilityQa.includes(expected), `${base}/accessibility-qa.md missing hardened accessibility QA requirement: ${expected}.`);
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
