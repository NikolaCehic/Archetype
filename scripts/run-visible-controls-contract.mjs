import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "visible-controls-contract");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "generated-frontend");

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
    stdout: result.stdout,
    stderr: result.stderr,
    json: result.stdout ? JSON.parse(result.stdout) : null
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeText(filePath, value) {
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Visible controls contract"
});

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "visible-controls fixture generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "visible-controls fixture should be implementation-authorized.");

const actionContracts = readJson(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"));
assert(actionContracts.visible_control_policy?.policy_id === "visible-controls-require-action-contracts", "action contracts must expose visible-control policy.");
assert(actionContracts.actions?.length > 0, "fixture must generate action contracts.");
assert(actionContracts.actions.every((action) => action.required_selector && action.result_selector), "every action must expose selector and result selector.");

const playwrightContract = readJson(path.join(outputDir, "verification", "playwright-verification-contract.json"));
assert(playwrightContract.coverage.action_scenarios === actionContracts.actions.length, "Playwright contract must create one action scenario per action.");
assert(playwrightContract.coverage.visible_control_policy_scenarios === playwrightContract.coverage.route_count, "Playwright contract must create one visible-control policy scenario per route.");
assert(playwrightContract.scenarios.some((scenario) => scenario.type === "action"), "Playwright contract must include action scenarios.");
assert(playwrightContract.scenarios.some((scenario) => scenario.type === "visible_control_policy"), "Playwright contract must include visible-control policy scenarios.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target should pass.");
const passingVerify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(passingVerify.status === "pass", "visible-control generated target should pass verification.");
assert(passingVerify.contract_fidelity?.status === "pass", "contract fidelity should pass before sabotage.");
const passingEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(passingEvidence.evidence_grades?.actions_verified === "pass", "actions_verified grade should pass.");
assert(passingEvidence.evidence_grades?.visible_controls_verified === "pass", "visible_controls_verified grade should pass.");

const routeMap = readJson(path.join(outputDir, "12-target-frontend", "route-component-map.json"));
const firstScreenFile = String(routeMap.routes?.[0]?.screen_file ?? "");
assert(firstScreenFile.length > 0, "route component map must name a first screen file.");
const firstScreenPath = path.join(targetDir, firstScreenFile);
assert(existsSync(firstScreenPath), "first screen file must exist in target.");

const originalScreenSource = readFileSync(firstScreenPath, "utf8");
const unboundControlSource = originalScreenSource.replace(
  "      <div className=\"archetype-composition\">",
  "      <button type=\"button\">Export JSON</button>\n      <div className=\"archetype-composition\">"
);
writeText(firstScreenPath, unboundControlSource);
const unboundFailure = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", targetDir, "--skip-install"]);
assert(unboundFailure.exitCode === 1, "unbound visible control should fail verify-target.");
assert(unboundFailure.json?.status === "fail", "unbound visible control should report fail.");
const unboundEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(unboundEvidence.evidence_grades?.visible_controls_verified === "fail", "unbound control should fail visible_controls_verified grade.");
assert(unboundEvidence.scenario_results.some((scenario) => scenario.type === "visible_control_policy" && scenario.status === "fail"), "unbound control should produce a failed visible-control scenario.");

writeText(firstScreenPath, originalScreenSource);
const restoredScreenSource = readFileSync(firstScreenPath, "utf8");
const firstActionId = String(actionContracts.actions[0].action_id);
const inertActionSource = restoredScreenSource.replace(
  `onClick={() => setLastAction("${firstActionId}")}`,
  `onClick={() => setLastAction("${firstActionId}.wrong_result")}`
);
assert(inertActionSource !== restoredScreenSource, "inert sabotage must disconnect the first action from its declared runtime proof.");
writeText(firstScreenPath, inertActionSource);
const inertFailure = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", targetDir, "--skip-install"]);
assert(inertFailure.exitCode === 1, "inert declared action should fail verify-target.");
assert(inertFailure.json?.status === "fail", "inert declared action should report fail.");
const inertEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(inertEvidence.evidence_grades?.actions_verified === "fail", "inert action should fail actions_verified grade.");
assert(inertEvidence.scenario_results.some((scenario) => scenario.type === "action" && scenario.status === "fail"), "inert action should produce a failed action scenario.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  actionScenarios: playwrightContract.coverage.action_scenarios,
  visibleControlPolicyScenarios: playwrightContract.coverage.visible_control_policy_scenarios,
  unboundControlBlocked: true,
  inertActionBlocked: true
};
writeText(path.join(workspace, "visible-controls-contract-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
