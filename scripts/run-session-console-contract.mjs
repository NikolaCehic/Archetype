import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "session-console-contract");
const intakePath = path.join(workspace, "archetype.intake.json");
const draftOutputDir = path.join(workspace, "draft-output");
const phasePackageDir = path.join(workspace, "draft-phase-package");
const rejectPhasePackageDir = path.join(workspace, "reject-phase-package");
const phaseApprovedInputPath = path.join(workspace, "phase-package.approved.intake.json");
const reviewApprovedOutputDir = path.join(workspace, "review-approved-output");
const reviewChangeOutputDir = path.join(workspace, "review-change-output");
const approvedInputPath = path.join(workspace, "archetype.approved.intake.json");
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

function expectFailure(args, expectedText) {
  try {
    run(args);
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    assert(output.includes(expectedText), `Expected failure containing "${expectedText}", got: ${output}`);
    return;
  }
  throw new Error(`Expected command to fail: ${args.join(" ")}`);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function countFiles(targetPath) {
  if (!existsSync(targetPath)) return 0;
  const stats = statSync(targetPath);
  if (stats.isFile()) return 1;
  return readdirSync(targetPath).reduce((total, entry) => total + countFiles(path.join(targetPath, entry)), 0);
}

function assertSession(outputDir, expected) {
  for (const artifact of [
    "review-console/session.json",
    "review-console/index.html",
    "review-console/approval-decisions.json",
    "review-console/design-diff.json",
    "review-console/run-timeline.json",
    "progressive/generation-plan.json",
    "progressive/lazy-contract-index.json",
    "progressive/token-budget.json",
    "progressive/phase-package-plan.json",
    "mcp/current-phase-resources.json",
    "mcp/current-phase-prompts.json",
    "orchestration/team-handoffs.json",
    "orchestration/subagent-ownership.json",
    "orchestration/host-permissions.json",
    "attachments/source-materials.json",
    "attachments/source-materials.md",
    "lifecycle/blockers-explained.json",
    "lifecycle/blockers-explained.md"
  ]) {
    assert(existsSync(path.join(outputDir, artifact)), `${expected.label}: missing ${artifact}.`);
  }
  const session = readJson(path.join(outputDir, "review-console", "session.json"));
  assert(session.source_scope === "session-review-console", `${expected.label}: session scope mismatch.`);
  assert(session.review_mode === expected.reviewMode, `${expected.label}: expected review mode ${expected.reviewMode}.`);
  assert(session.current_phase.phase_id === expected.phase, `${expected.label}: expected current phase ${expected.phase}.`);
  assert(Array.isArray(session.cockpit.approval_checklist) && session.cockpit.approval_checklist.length > 0, `${expected.label}: approval checklist missing.`);
  assert(Array.isArray(session.cockpit.review_surfaces) && session.cockpit.review_surfaces.some((item) => item.path === "review-console/index.html"), `${expected.label}: review console surface missing.`);
  assert(Array.isArray(session.cockpit.allowed_user_actions) && session.cockpit.allowed_user_actions.length > 0, `${expected.label}: allowed user actions missing.`);
  if (expected.reviewMode === "draft_review") {
    const actionIds = session.cockpit.allowed_user_actions.map((item) => item.id).sort();
    assert(JSON.stringify(actionIds) === JSON.stringify(["approve", "reject", "request_changes"]), `${expected.label}: draft review must expose approve/request_changes/reject.`);
    assert(session.next_legal_action.internal_tool === "archetype_submit_review", `${expected.label}: draft review must use submit review primitive.`);
  }
  const approvalDecisions = readFileSync(path.join(outputDir, "review-console", "approval-decisions.json"), "utf8");
  for (const forbidden of ["approval_command_hint", "approve-draft", "--input", "--out", "archetype "]) {
    assert(!approvalDecisions.includes(forbidden), `${expected.label}: approval decisions leaked internal command string ${forbidden}.`);
  }
  assert(approvalDecisions.includes("archetype_submit_review"), `${expected.label}: approval decisions must name the review primitive.`);
  const html = readFileSync(path.join(outputDir, "review-console", "index.html"), "utf8");
  for (const expectedText of ["Next Legal Action", "One Question", "Attached Materials", "Approval Checklist", "Decision Actions", "Design Review Diff", "Route Proposals", "Run Timeline"]) {
    assert(html.includes(expectedText), `${expected.label}: review console HTML missing ${expectedText}.`);
  }
  const progressive = readJson(path.join(outputDir, "progressive", "generation-plan.json"));
  assert(progressive.strategy === "summary_first_lazy_expand", `${expected.label}: progressive strategy missing.`);
  assert(progressive.package_size_policy.broad_generation_before_approval === "forbidden", `${expected.label}: broad generation policy missing.`);
  const lazyIndex = readJson(path.join(outputDir, "progressive", "lazy-contract-index.json"));
  assert(lazyIndex.start_here === "agent-context/consumer-plane.json", `${expected.label}: lazy index must start at consumer plane.`);
  assert(lazyIndex.phases.some((phase) => phase.phase_id === expected.phase), `${expected.label}: lazy index missing current phase.`);
  const tokenBudget = readJson(path.join(outputDir, "progressive", "token-budget.json"));
  assert(tokenBudget.default_max_artifact_bytes === 6000, `${expected.label}: token budget should use 6000 byte default.`);
  const permissions = readJson(path.join(outputDir, "orchestration", "host-permissions.json"));
  assert(permissions.permissions.some((permission) => permission.action === "write_product_ui"), `${expected.label}: host permissions missing write_product_ui.`);
  const resources = readJson(path.join(outputDir, "mcp", "current-phase-resources.json"));
  assert(resources.resources.some((resource) => resource.path === "review-console/session.json"), `${expected.label}: MCP resources missing review session.`);
  const prompts = readJson(path.join(outputDir, "mcp", "current-phase-prompts.json"));
  assert(prompts.prompts.some((prompt) => prompt.name === "archetype_current_phase"), `${expected.label}: MCP prompts missing current phase.`);
}

runJson(["init", "--template", "saas-dashboard", "--out", intakePath]);
const draftGenerate = runJson(["generate", "--input", intakePath, "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "Fixture should produce a draft package.");
assertSession(draftOutputDir, { label: "draft", reviewMode: "draft_review", phase: "draft_review" });

const phasePackage = runJson(["phase-package", "--out", draftOutputDir, "--phase", "draft_review", "--target", phasePackageDir, "--force"]);
assert(phasePackage.status === "pass", "phase-package should pass.");
assert(existsSync(path.join(phasePackageDir, "phase-package.json")), "phase-package should write phase manifest.");
const phaseManifest = readJson(path.join(phasePackageDir, "phase-package.json"));
const draftManifest = readJson(path.join(draftOutputDir, "manifest.json"));
assert(!("generatedAt" in phaseManifest), "phase-package manifest must not introduce a nondeterministic generatedAt field.");
assert(phaseManifest.sourceGeneratedAt === draftManifest.generatedAt, "phase-package manifest should bind to source package generatedAt.");
assert(existsSync(path.join(phasePackageDir, "review-console", "session.json")), "phase-package should include review session.");
assert(countFiles(phasePackageDir) < countFiles(draftOutputDir), "phase-package should be smaller than the full output directory.");
assert(!existsSync(path.join(phasePackageDir, "test-first", "test-first-contract.json")), "draft phase package must not include test-first artifacts.");
const phaseApproval = runJson(["approve-draft", "--draft", phasePackageDir, "--input", intakePath, "--out", phaseApprovedInputPath, "--approved-by", "Phase package reviewer", "--force"]);
assert(phaseApproval.status === "success", "self-contained phase package should support bound draft approval.");
assert(existsSync(phaseApproval.approvalArtifactPath), "phase package approval should write proof artifact.");
const reviewApproval = runJson(["review", "--draft", phasePackageDir, "--input", intakePath, "--decision", "approve", "--reviewer", "Review primitive reviewer", "--out", reviewApprovedOutputDir, "--force"]);
assert(reviewApproval.status === "success", "review approve should succeed.");
assert(reviewApproval.packageType === "canonical_contract", "review approve should produce canonical contract.");
assert(reviewApproval.implementationAuthorized === true, "review approve should authorize implementation.");
assert(existsSync(path.join(reviewApprovedOutputDir, "lifecycle", "review-decision.json")), "review approve should write review decision.");
assert(existsSync(reviewApproval.approvalArtifactPath), "review approve should write bound approval proof.");
const reviewChange = runJson(["review", "--draft", draftOutputDir, "--input", intakePath, "--decision", "request_changes", "--reviewer", "Review primitive reviewer", "--feedback", "Make the dashboard less generic and add an explicit reports route before approval.", "--out", reviewChangeOutputDir, "--force"]);
assert(reviewChange.status === "warning", "review request_changes should warn and keep implementation blocked.");
assert(reviewChange.packageType === "draft_contract", "review request_changes should regenerate draft package.");
assert(reviewChange.implementationAuthorized === false, "review request_changes must not authorize implementation.");
assert(existsSync(path.join(reviewChangeOutputDir, "lifecycle", "revision-request.json")), "review request_changes should write revision request.");
const rejectPhasePackage = runJson(["phase-package", "--out", draftOutputDir, "--phase", "draft_review", "--target", rejectPhasePackageDir, "--force"]);
assert(rejectPhasePackage.status === "pass", "reject phase package should pass.");
const reviewReject = runJson(["review", "--draft", rejectPhasePackageDir, "--input", intakePath, "--decision", "reject", "--reviewer", "Review primitive reviewer", "--feedback", "Wrong direction"]);
assert(reviewReject.status === "warning", "review reject should warn.");
assert(reviewReject.packageType === "rejected", "review reject should report rejected package.");
assert(reviewReject.implementationAuthorized === false, "review reject must keep implementation blocked.");
assert(existsSync(path.join(rejectPhasePackageDir, "lifecycle", "review-decision.json")), "review reject should write review decision.");
assert(!existsSync(path.join(rejectPhasePackageDir, "spec", "archetype-spec.json")), "review reject must not create canonical spec.");
expectFailure(["phase-package", "--out", draftOutputDir, "--phase", "draft_review", "--target", draftOutputDir, "--force"], "targetDir must be different");
expectFailure(["phase-package", "--out", draftOutputDir, "--phase", "draft_review", "--target", path.join(draftOutputDir, "nested-phase"), "--force"], "targetDir must not be inside");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  baseInput: readJson(intakePath),
  approvedBy: "Session console contract"
});
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "Approved package should be implementation-ready.");
assertSession(approvedOutputDir, { label: "approved", reviewMode: "test_first_handoff", phase: "test_first" });
const approvedProgressive = readJson(path.join(approvedOutputDir, "progressive", "generation-plan.json"));
assert(approvedProgressive.defer_until_phase.some((phase) => phase.phase_id === "verification"), "approved progressive plan should defer verification artifacts.");

const report = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  phasePackageDir,
  reviewApprovedOutputDir,
  reviewChangeOutputDir,
  draftFiles: countFiles(draftOutputDir),
  phasePackageFiles: countFiles(phasePackageDir)
};

writeFileSync(path.join(workspace, "session-console-contract-summary.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
