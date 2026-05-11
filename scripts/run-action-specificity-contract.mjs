import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { inferDomainProfile } = require("../dist/modules/domain.js");
const { buildProductArtifacts } = require("../dist/modules/productModel.js");
const { buildEvidenceLedger } = require("../dist/modules/evidence.js");
const { buildExperienceArtifacts } = require("../dist/modules/experienceArchitecture.js");
const { buildDesignSystemArtifacts } = require("../dist/modules/designSystem.js");
const { buildFrontendContractArtifacts } = require("../dist/modules/frontendContract.js");
const { buildTargetFrontendArtifacts } = require("../dist/modules/targetFrontend.js");
const { buildIngestionArtifacts } = require("../dist/modules/sourceNormalization.js");

const root = process.cwd();
const workspace = path.join(root, "tmp", "action-specificity-contract");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function build(input) {
  const profile = inferDomainProfile(input);
  const ingestion = buildIngestionArtifacts(input);
  const evidence = buildEvidenceLedger(input, profile, `action_specificity_${profile.domain}`, ingestion, {
    approvalState: { status: "approved" }
  });
  const product = buildProductArtifacts(input, profile, evidence);
  const experience = buildExperienceArtifacts(input, profile, product, evidence);
  const designSystem = buildDesignSystemArtifacts(input, profile, experience, ingestion);
  const frontend = buildFrontendContractArtifacts(input, profile, product, experience, designSystem);
  const target = buildTargetFrontendArtifacts({ experience, designSystem, frontendContract: frontend });
  return { profile, experience, frontend, target };
}

function actions(output) {
  return output.experience.screenSpecs.flatMap((screen) =>
    screen.actions.map((action) => ({
      screen_id: screen.screen_id,
      label: String(action.label ?? ""),
      target: String(action.action ?? "")
    }))
  );
}

function assertNoGenericActions(output, label) {
  const forbiddenLabels = new Set(["Filter", "Export", "Edit", "Run", "Save changes", "Create first item", "Primary action"]);
  const forbiddenTargets = new Set(["apply_filter", "export_current_view", "open_edit_flow"]);
  for (const action of actions(output)) {
    assert(!forbiddenLabels.has(action.label), `${label}: ${action.screen_id} emitted generic action label ${action.label}.`);
    assert(!forbiddenTargets.has(action.target), `${label}: ${action.screen_id} emitted generic action target ${action.target}.`);
  }
  assert(output.frontend.actionContracts.blockers.length === 0, `${label}: action contracts should not have blockers.`);
}

function assertViteDefault(output, label) {
  const stack = output.frontend.buildManifest.frontend_stack;
  assert(stack.framework === "Vite + React", `${label}: default framework should be Vite + React.`);
  assert(stack.routing === "React Router", `${label}: default routing should be React Router.`);
  assert(output.target.sourceFileManifest.target_stack.resolved_source_target === "vite_react_router", `${label}: target manifest should resolve to Vite/React Router.`);
  const paths = new Set(output.target.sourceFileManifest.files.map((file) => String(file.path)));
  assert(paths.has("vite.config.ts"), `${label}: default target should include vite.config.ts.`);
  assert(paths.has("src/App.tsx"), `${label}: default target should include src/App.tsx.`);
  assert(!paths.has("next.config.mjs"), `${label}: default target must not include next.config.mjs.`);
  assert(![...paths].some((filePath) => filePath.startsWith("src/app/")), `${label}: default target must not include src/app routes.`);
}

const marketing = build({
  projectName: "Marketing Admin",
  context: "I want to build an admin dashboard for a marketing team",
  goals: ["Review campaign health"],
  users: ["Marketing admin"]
});

const agentBoard = build({
  projectName: "Agent Task Board",
  context: "Agent Task Board for multi-subagent orchestration with tasks, handoffs, logs, artifacts, dependencies, and blocked-state review.",
  goals: ["Coordinate agent work"],
  users: ["Orchestrator"]
});

assertViteDefault(marketing, "marketing default stack");
assertViteDefault(agentBoard, "agent board default stack");
assertNoGenericActions(marketing, "marketing");
assertNoGenericActions(agentBoard, "agent board");

const marketingLabels = new Set(actions(marketing).map((action) => action.label));
for (const expected of ["Continue onboarding", "Select workspace", "Create campaign", "Build report", "Update billing plan", "Save settings"]) {
  assert(marketingLabels.has(expected), `marketing: missing domain-specific action ${expected}.`);
}

const agentLabels = new Set(actions(agentBoard).map((action) => action.label));
for (const expected of ["Create task", "Resolve handoff", "Search run logs", "Search artifacts"]) {
  assert(agentLabels.has(expected), `agent board: missing domain-specific action ${expected}.`);
}

const summary = {
  status: "pass",
  marketingActions: actions(marketing).length,
  agentBoardActions: actions(agentBoard).length,
  defaultTarget: marketing.target.sourceFileManifest.target_stack.resolved_source_target
};
writeFileSync(path.join(workspace, "action-specificity-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
