import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "action-state-policy-contract");
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
  approvedBy: "Action state policy contract"
});

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "action-state fixture generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "action-state fixture should be implementation-authorized.");

const actionContracts = readJson(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"));
assert(actionContracts.action_state_policy?.policy_id === "terminal-states-disable-conflicting-actions", "action contracts must expose terminal action-state policy.");
assert(actionContracts.actions?.length > 0, "fixture must generate action contracts.");
for (const action of actionContracts.actions) {
  assert(Array.isArray(action.availability_policy?.available_states) && action.availability_policy.available_states.includes("default"), "every action must declare default availability.");
  assert(Array.isArray(action.availability_policy?.terminal_states) && action.availability_policy.terminal_states.includes("success_confirmation"), "every action must declare terminal states.");
  assert(action.availability_policy?.allowed_in_terminal_states === false, "actions must be terminal-disabled by default.");
}

const playwrightContract = readJson(path.join(outputDir, "verification", "playwright-verification-contract.json"));
assert(playwrightContract.coverage.action_state_policy_scenarios === playwrightContract.coverage.route_count, "Playwright contract must create one action-state policy scenario per route.");
assert(playwrightContract.scenarios.some((scenario) => scenario.type === "action_state_policy"), "Playwright contract must include action-state policy scenarios.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target should pass.");
const passingVerify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(passingVerify.status === "pass", "action-state generated target should pass verification.");
const passingEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(passingEvidence.evidence_grades?.action_state_policy_verified === "pass", "action_state_policy_verified grade should pass.");
assert(passingEvidence.scenario_results.some((scenario) => scenario.type === "action_state_policy" && scenario.status === "pass"), "action-state scenario should pass before sabotage.");

const routeMap = readJson(path.join(outputDir, "12-target-frontend", "route-component-map.json"));
const firstScreenFile = String(routeMap.routes?.[0]?.screen_file ?? "");
assert(firstScreenFile.length > 0, "route component map must name a first screen file.");
const firstScreenPath = path.join(targetDir, firstScreenFile);
assert(existsSync(firstScreenPath), "first screen file must exist in target.");

const originalScreenSource = readFileSync(firstScreenPath, "utf8");
const activeTerminalSource = originalScreenSource.replace(
  "  const visibleActions = actionDefinitions.filter((action) => action.availableStates.includes(state));",
  "  const visibleActions = actionDefinitions;"
);
assert(activeTerminalSource !== originalScreenSource, "terminal sabotage must bypass action availability filtering.");
writeText(firstScreenPath, activeTerminalSource);

const terminalFailure = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", targetDir, "--skip-install"]);
assert(terminalFailure.exitCode === 1, "active terminal actions should fail verify-target.");
assert(terminalFailure.json?.status === "fail", "active terminal actions should report fail.");
const terminalEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(terminalEvidence.evidence_grades?.action_state_policy_verified === "fail", "active terminal actions should fail action_state_policy_verified grade.");
assert(terminalEvidence.scenario_results.some((scenario) => scenario.type === "action_state_policy" && scenario.status === "fail"), "active terminal actions should produce a failed action-state policy scenario.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  actionStatePolicyScenarios: playwrightContract.coverage.action_state_policy_scenarios,
  activeTerminalActionsBlocked: true
};
writeText(path.join(workspace, "action-state-policy-contract-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
