import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "natural-lifecycle-contract");
const materialsDir = path.join(workspace, "materials");
const weakOutput = path.join(workspace, "weak-output");
const weakIntake = path.join(workspace, "weak.intake.json");
const richOutput = path.join(workspace, "rich-output");
const richIntake = path.join(workspace, "rich.intake.json");
const mcpOutput = path.join(workspace, "mcp-output");
const mcpIntake = path.join(workspace, "mcp.intake.json");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(materialsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runJson(args) {
  const stdout = execFileSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(stdout);
}

function runJsonMaybeFail(args) {
  const result = spawnSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    exitCode: result.status ?? 1,
    json: JSON.parse(result.stdout)
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const designPath = path.join(materialsDir, "design.md");
writeFileSync(designPath, [
  "Premium dense dark dashboard design reference.",
  "Sidebar navigation, metric cards, charts, tables, filters, loading, empty, error, and permission states.",
  "Treat this only as abstract design evidence."
].join("\n"));

const weakRun = runJson([
  "run",
  "I want to build a admin dashboard for a marketing team",
  "--out",
  weakOutput,
  "--intake",
  weakIntake,
  "--force"
]);
assert(weakRun.packageType === "clarification", "weak run should stop at clarification.");
assert(weakRun.nextAction?.type === "ask_clarification", "weak run should return ask_clarification next action.");
assert(weakRun.nextQuestionId === "primary_users", "weak marketing dashboard should ask the primary user question first.");
assert(existsSync(weakRun.sourceGraphPath), "weak run should write lifecycle/source-graph.json.");
assert(existsSync(weakRun.runStatePath), "weak run should write lifecycle/run-state.json.");
assert(readJson(weakRun.runStatePath).next_action.type === "ask_clarification", "run-state should preserve the next action.");
assert(weakRun.nextAction.command === null, "clarification continuation should not expose internal CLI commands to the user.");

const answeredRun = runJson([
  "run",
  "--intake",
  weakIntake,
  "--out",
  weakOutput,
  "--question-id",
  weakRun.nextQuestionId,
  "--answer",
  "Marketing operations manager",
  "--force"
]);
assert(answeredRun.packageType === "clarification", "one answer should update state and continue if more blockers remain.");
assert(answeredRun.nextQuestionId && answeredRun.nextQuestionId !== weakRun.nextQuestionId, "answer run should select the next one-question blocker.");

const richBrief = [
  "Build a premium dense dark marketing analytics admin dashboard for marketing managers and growth analysts.",
  "Must include onboarding, workspace switching, campaign overview, reports, budget review, billing, and settings screens.",
  "Use React, TypeScript, Next.js App Router, Tailwind CSS, shadcn-style components, and responsive routing.",
  "Use mock deterministic campaign, report, workspace, billing, and settings data with mock authenticated roles and permissions for marketing manager, growth analyst, and workspace admin.",
  "Allow Playwright, smoke, e2e, UI, integration, unit, and accessibility tests.",
  "You may propose candidate assumptions for draft review.",
  "Safety: mock data only, no financial, compliance, or production integration claims."
].join(" ");

const draftRun = runJson([
  "run",
  richBrief,
  "--out",
  richOutput,
  "--intake",
  richIntake,
  "--material",
  designPath,
  "--force"
]);
assert(draftRun.packageType === "draft_contract", "rich run should create a draft contract.");
assert(draftRun.nextAction?.type === "review_draft", "draft run should require review_draft.");
assert(existsSync(draftRun.designSystemPreviewPath), "draft run should write the design-system preview HTML.");
assert(existsSync(draftRun.approvalRequestPath), "draft run should write the approval request.");
assert(draftRun.nextAction.command === null, "draft continuation should use the review primitive instead of exposing approval commands.");
assert(existsSync(path.join(richOutput, "phase-package.json")), "rich natural-language run should write a small draft review phase package.");
assert(!existsSync(path.join(richOutput, "manifest.json")), "rich natural-language run should not write the broad draft manifest before approval.");
const sourceGraph = readJson(draftRun.sourceGraphPath);
assert(sourceGraph.material_count === 1, "source graph should record one ingested material.");
assert(sourceGraph.materials[0].sha256.length === 64, "source graph should store material SHA-256.");
assert(sourceGraph.materials[0].resolved_path === designPath, "source graph should store the resolved material path.");

const sourceGraphArtifact = runJson([
  "data-plane",
  "read-artifact",
  "--out",
  richOutput,
  "--artifact",
  "lifecycle-source-graph",
  "--run",
  draftRun.dataPlaneRunId
]);
assert(sourceGraphArtifact.artifact?.ref?.path === "lifecycle/source-graph.json", "data plane should record the source graph artifact.");

const approvedRun = runJson([
  "run",
  "--intake",
  richIntake,
  "--out",
  richOutput,
  "--approve",
  "--approved-by",
  "Lifecycle contract",
  "--force"
]);
assert(approvedRun.packageType === "canonical_contract", "approved lifecycle run should generate canonical package.");
assert(approvedRun.readyForFrontendAgent === true, "approved lifecycle run should be implementation ready.");
assert(approvedRun.nextAction?.type === "implement_tests_first", "approved lifecycle run should direct tests-first implementation.");
assert(existsSync(path.join(richOutput, "spec", "archetype-spec.json")), "approved lifecycle run should write canonical spec.");
assert(statSync(path.join(richOutput, "lifecycle", "run-state.json")).isFile(), "approved run should preserve lifecycle run state.");

const unsafe = runJsonMaybeFail([
  "run",
  "Unsafe material test",
  "--material",
  path.parse(root).root,
  "--out",
  path.join(workspace, "unsafe-output"),
  "--force"
]);
assert(unsafe.exitCode === 1, "unsafe material root should fail.");
assert(unsafe.json.status === "error", "unsafe material failure should return typed CLI JSON error.");
assert(String(unsafe.json.message).includes("filesystem root"), "unsafe material failure should explain the root path blocker.");

const child = spawn("node", ["dist/mcp/server.js"], {
  cwd: root,
  stdio: ["pipe", "pipe", "pipe"]
});
let nextId = 1;
let stdoutBuffer = "";
let stderrBuffer = "";
const pending = new Map();

child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk.toString("utf8");
  while (stdoutBuffer.includes("\n")) {
    const index = stdoutBuffer.indexOf("\n");
    const line = stdoutBuffer.slice(0, index);
    stdoutBuffer = stdoutBuffer.slice(index + 1);
    if (!line.trim()) continue;
    const message = JSON.parse(line);
    const waiter = pending.get(message.id);
    if (!waiter) continue;
    pending.delete(message.id);
    clearTimeout(waiter.timeout);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  }
});

child.stderr.on("data", (chunk) => {
  stderrBuffer += chunk.toString("utf8");
});

function request(method, params = {}, timeoutMs = 240000) {
  const id = nextId++;
  const payload = { jsonrpc: "2.0", id, method, params };
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}.\n${stderrBuffer}`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timeout });
  });
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  return promise;
}

function notify(method, params = {}) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function toolPayload(result) {
  if (result.isError) throw new Error(result.content?.[0]?.text ?? JSON.stringify(result));
  return result.structuredContent ?? JSON.parse(result.content?.[0]?.text ?? "{}");
}

try {
  await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "natural-lifecycle-contract", version: "0.1.0" }
  });
  notify("notifications/initialized");
  const listed = await request("tools/list");
  assert((listed.tools ?? []).some((tool) => tool.name === "archetype_run_lifecycle"), "MCP tools list should include archetype_run_lifecycle.");
  const mcpRun = toolPayload(await request("tools/call", {
    name: "archetype_run_lifecycle",
    arguments: {
      brief: "I want to build a admin dashboard for a marketing team",
      inputPath: mcpIntake,
      outputDir: mcpOutput,
      overwrite: true
    }
  }));
  assert(mcpRun.packageType === "clarification", "MCP lifecycle run should stop weak context at clarification.");
  assert(mcpRun.nextAction?.type === "ask_clarification", "MCP lifecycle run should expose one-question next action.");
  assert(existsSync(mcpRun.runStatePath), "MCP lifecycle run should write run-state artifact.");
} finally {
  child.kill();
}

const summary = {
  status: "pass",
  cli: {
    weak: weakRun.packageType,
    answeredNextQuestion: answeredRun.nextQuestionId,
    draft: draftRun.packageType,
    approved: approvedRun.packageType
  },
  mcp: "archetype_run_lifecycle",
  sourceGraph: "lifecycle/source-graph.json",
  runState: "lifecycle/run-state.json"
};
writeFileSync(path.join(workspace, "natural-lifecycle-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
