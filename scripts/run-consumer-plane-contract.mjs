import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const require = createRequire(import.meta.url);
const root = process.cwd();
const workspace = path.join(root, "tmp", "consumer-plane-contract");
const intakePath = path.join(workspace, "archetype.intake.json");
const draftOutputDir = path.join(workspace, "draft-output");
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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertConsumerPlane(report, expected) {
  assert(report.source_scope === "consumer-plane", `${expected.label} consumer plane must name its scope.`);
  assert(report.front_doors.codex === "$archetype", `${expected.label} consumer plane must preserve Codex front door.`);
  assert(report.front_doors.claude_code === "/archetype", `${expected.label} consumer plane must preserve Claude Code front door.`);
  assert(report.contract.natural_language_only_for_user === true, `${expected.label} consumer plane must keep natural-language UX.`);
  assert(report.contract.user_never_runs_internal_commands === true, `${expected.label} consumer plane must hide internal commands from users.`);
  assert(report.contract.ask_one_question_at_a_time === true, `${expected.label} consumer plane must enforce one-question clarification.`);
  assert(report.contract.no_webapp_required === true, `${expected.label} consumer plane must not require a webapp.`);
  assert(report.next_action.type === expected.action, `${expected.label} consumer plane expected ${expected.action}, got ${report.next_action.type}.`);
  assert(report.read_plan.start_here === "agent-context/consumer-plane.json", `${expected.label} must start at consumer plane.`);
  assert(report.read_plan.first_reads[0] === "agent-context/consumer-plane.json", `${expected.label} first read must be consumer plane.`);
  assert(report.read_plan.first_reads.length <= 5, `${expected.label} first reads must stay bounded.`);
  assert(report.read_plan.allowed_full_artifacts_now.length <= 6, `${expected.label} required full reads must stay bounded.`);
  assert(report.read_plan.current_phase_bundle === expected.phaseBundle, `${expected.label} must point to current phase bundle.`);
  assert(report.token_budget.default_max_artifact_bytes === 6000, `${expected.label} must expose 6KB default read budget.`);
  assert(report.token_budget.broad_read_policy === "forbidden", `${expected.label} must forbid broad reads.`);
  assert(report.user_experience.do_not_say.some((rule) => rule.includes("CLI commands")), `${expected.label} must hide CLI command choreography.`);
}

runJson(["init", "--template", "saas-dashboard", "--out", intakePath]);
const draftGenerate = runJson(["generate", "--input", intakePath, "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "Fixture should produce a draft contract.");
assert(existsSync(path.join(draftOutputDir, "agent-context", "consumer-plane.json")), "Draft output must include consumer-plane JSON.");
assert(existsSync(path.join(draftOutputDir, "agent-context", "consumer-plane.md")), "Draft output must include consumer-plane markdown.");

const draftConsumer = runJson(["next-action", "--out", draftOutputDir]);
assertConsumerPlane(draftConsumer, {
  label: "draft",
  action: "present_draft_review",
  phaseBundle: "agent-context/phase-bundles/draft-review.json"
});
assert(draftConsumer.read_plan.allowed_full_artifacts_now.includes("draft/design-system-preview.html"), "Draft consumer plane must surface design preview.");
assert(draftConsumer.read_plan.allowed_full_artifacts_now.includes("draft/design-directions.json"), "Draft consumer plane must surface design directions.");
assert(draftConsumer.read_plan.allowed_full_artifacts_now.includes("draft/design-quality-gate.json"), "Draft consumer plane must surface design quality gate.");
assert(draftConsumer.read_plan.forbidden_reads_now.some((rule) => rule.includes("Do not read or invent spec/*")), "Draft consumer plane must forbid canonical reads.");

const draftSummary = runJson(["summarize", "--out", draftOutputDir, "--compact"]);
assert(draftSummary.entrypoints.length === 3, "Draft compact summary must expose only consumer, summary, and phase index.");
assert(draftSummary.entrypoints[0] === "agent-context/consumer-plane.json", "Draft compact summary must start at consumer plane.");
assert(draftSummary.consumerPlane.nextAction === "present_draft_review", "Draft summary must echo consumer next action.");

const { consumerPlaneTool } = require("../dist/mcp/tools/consumerPlane.js");
const mcpDraftConsumer = await Promise.resolve(consumerPlaneTool.run({ outputDir: draftOutputDir }));
assertConsumerPlane(mcpDraftConsumer, {
  label: "MCP draft",
  action: "present_draft_review",
  phaseBundle: "agent-context/phase-bundles/draft-review.json"
});

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  baseInput: readJson(intakePath),
  approvedBy: "Consumer plane contract"
});
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "Approved fixture must be implementation-ready.");

const approvedConsumer = runJson(["next-action", "--out", approvedOutputDir]);
assertConsumerPlane(approvedConsumer, {
  label: "approved",
  action: "start_tests_first",
  phaseBundle: "agent-context/phase-bundles/test-first.json"
});
assert(approvedConsumer.read_plan.allowed_full_artifacts_now.includes("test-first/test-first-contract.json"), "Approved consumer plane must start with tests first.");
assert(approvedConsumer.read_plan.forbidden_reads_now.some((rule) => rule.includes("Do not read all generated artifacts")), "Approved consumer plane must forbid broad reads.");

const approvedSummary = runJson(["summarize", "--out", approvedOutputDir, "--compact"]);
assert(approvedSummary.entrypoints.length === 3, "Approved compact summary must expose only consumer, summary, and phase index.");
assert(approvedSummary.boundedReadPolicy.maxDefaultArtifactBytes === 6000, "Approved compact summary must keep 6KB read default.");
assert(approvedSummary.consumerPlane.nextAction === "start_tests_first", "Approved summary must echo consumer next action.");

const report = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  draftNextAction: draftConsumer.next_action.type,
  approvedNextAction: approvedConsumer.next_action.type,
  compactEntrypoints: approvedSummary.entrypoints
};

writeFileSync(path.join(workspace, "consumer-plane-contract-summary.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
