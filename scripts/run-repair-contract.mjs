import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "repair-contract");
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
    json: JSON.parse(result.stdout)
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const generate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "repair contract generation should succeed or warn.");

const repairContractPath = path.join(outputDir, "10-revision", "verification-repair-contract.json");
const taskQueuePath = path.join(outputDir, "10-revision", "repair-task-queue.json");
const planPath = path.join(outputDir, "10-revision", "repair-plan.md");
const driftPath = path.join(outputDir, "10-revision", "drift-report.json");
const driftMarkdownPath = path.join(outputDir, "10-revision", "drift-report.md");
for (const file of [repairContractPath, taskQueuePath, planPath, driftPath, driftMarkdownPath]) {
  assert(existsSync(file), `Missing repair artifact: ${path.relative(outputDir, file)}`);
}

const repairContract = readJson(repairContractPath);
assert(repairContract.lifecycle_gate === "revising", "repair contract must bind to revising lifecycle gate.");
assert(repairContract.source_playwright_evidence_path === "verification/playwright-evidence.json", "repair contract must trace Playwright evidence.");
assert(repairContract.policy.default_action === "Patch implementation first.", "repair contract must patch implementation first.");

const pendingQueue = readJson(taskQueuePath);
assert(pendingQueue.status === "pending", "generated repair queue should start pending.");
assert(pendingQueue.task_count === 0, "pending repair queue should start empty.");
assert(pendingQueue.next_lifecycle_state === "verifying_with_playwright", "pending repair queue should wait for verification.");

const summarize = runJson(["summarize", "--out", outputDir]);
assert(summarize.entrypoints.includes("10-revision/repair-task-queue.json"), "summarize should expose repair task queue.");
assert(summarize.entrypoints.includes("10-revision/repair-plan.md"), "summarize should expose repair plan.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with pending repair artifacts.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target should pass before repair sabotage.");

const sourceManifest = readJson(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"));
const firstRoute = sourceManifest.files.find((file) => file.kind === "route");
assert(firstRoute?.path, "source manifest should include a route file.");
const routeFilePath = path.join(targetDir, firstRoute.path);
const routeSource = readFileSync(routeFilePath, "utf8");
assert(routeSource.includes("data-archetype-screen"), "route source should include archetype screen selector before sabotage.");
writeFileSync(routeFilePath, routeSource.replace("data-archetype-screen", "data-archetype-screen-broken"));

const failedVerify = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(failedVerify.exitCode === 1, "verify-target should exit non-zero after target drift.");
assert(failedVerify.json.status === "fail", "verify-target should report fail after target drift.");
assert(failedVerify.json.summary.playwright === "fail", "Playwright should fail after target drift.");
assert(failedVerify.json.repair.taskCount > 0, "verify-target should produce repair tasks on failure.");

const failedQueue = readJson(taskQueuePath);
assert(failedQueue.status === "fail", "repair queue should become fail after verification failure.");
assert(failedQueue.next_lifecycle_state === "revising", "failed repair queue should move lifecycle to revising.");
assert(failedQueue.task_count === failedQueue.tasks.length, "repair queue task count should match tasks.");
assert(failedQueue.tasks.some((task) => String(task.classification).includes("route") || String(task.classification).includes("playwright")), "repair queue should include Playwright or route drift task.");
const failedPlaywrightTasks = failedQueue.tasks.filter((task) => task.source === "playwright");
assert(failedPlaywrightTasks.length > 0, "repair queue should classify browser scenario failures as Playwright-sourced tasks.");
assert(failedQueue.task_count > 2, "repair queue should include scenario-level tasks, not only command-level failure tasks.");
assert(failedQueue.tasks.every((task) => Array.isArray(task.source_artifacts) && task.source_artifacts.length > 0), "repair tasks must name source artifacts.");
assert(failedQueue.tasks.every((task) => Array.isArray(task.rerun_commands) && task.rerun_commands.length > 0), "repair tasks must name rerun commands.");

const repair = runJson(["repair", "--out", outputDir, "--target", targetDir]);
assert(repair.status === "fail", "repair command should reflect failed verification status.");
assert(repair.taskCount === failedQueue.task_count, "repair command should report task count.");

const failedDrift = readJson(driftPath);
assert(failedDrift.status === "fail", "drift report should reflect failed verification status.");
assert(failedDrift.drift_count === failedQueue.task_count, "drift report should mirror repair task count.");
assert(readFileSync(planPath, "utf8").includes("Patch implementation first"), "repair plan should enforce patch-first policy.");

const validateWithFailedEvidence = runJson(["validate", "--out", outputDir]);
assert(validateWithFailedEvidence.status === "pass", "validate should pass when failed verification has concrete repair tasks.");

runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
const passingVerify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(passingVerify.status === "pass", "verify-target should pass after clean target regeneration.");
assert(passingVerify.repair.status === "pass", "passing verify-target should mark repair queue pass.");
assert(passingVerify.repair.taskCount === 0, "passing verify-target should clear repair tasks.");
const passingQueue = readJson(taskQueuePath);
assert(passingQueue.status === "pass", "repair queue should be pass after clean verification.");
assert(passingQueue.task_count === 0, "passing repair queue should be empty.");

rmSync(repairContractPath);
const failedValidate = runJsonMaybeFail(["validate", "--out", outputDir]);
assert(failedValidate.exitCode === 1, "validate should fail when repair contract is missing.");
assert(failedValidate.json.blockers.some((blocker) => String(blocker).includes("verification-repair-contract.json")), "validate should name missing repair contract.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  failedTasks: failedQueue.task_count,
  failedPlaywrightTasks: failedPlaywrightTasks.length,
  passingTasks: passingQueue.task_count,
  driftCount: failedDrift.drift_count
};
writeFileSync(path.join(workspace, "repair-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
