import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const require = createRequire(import.meta.url);
const root = process.cwd();
const workspace = path.join(root, "tmp", "token-bounded-context-contract");
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

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function assertFile(relativePath, outputDir) {
  const filePath = path.join(outputDir, relativePath);
  assert(existsSync(filePath), `Missing generated compact context file: ${relativePath}`);
  return filePath;
}

function assertAgentContext(outputDir, packageType, expectedAvailablePhases) {
  const consumerPlane = readJson(assertFile("agent-context/consumer-plane.json", outputDir));
  assertFile("agent-context/consumer-plane.md", outputDir);
  const summary = readJson(assertFile("agent-context/context-summary.json", outputDir));
  const phaseIndex = readJson(assertFile("agent-context/phase-bundles/index.json", outputDir));
  assert(consumerPlane.source_scope === "consumer-plane", "Consumer plane must identify its source scope.");
  assert(consumerPlane.contract.natural_language_only_for_user === true, "Consumer plane must preserve natural-language UX.");
  assert(consumerPlane.contract.no_webapp_required === true, "Consumer plane must not require a webapp surface.");
  assert(consumerPlane.read_plan.start_here === "agent-context/consumer-plane.json", "Consumer plane must be the first read.");
  assert(consumerPlane.token_budget.default_max_artifact_bytes === 6000, "Consumer plane must expose the bounded default read budget.");
  assert(summary.package_type === packageType, `Expected package type ${packageType}.`);
  assert(summary.start_here === "agent-context/consumer-plane.json", "Summary must point agents at the consumer plane first.");
  assert(summary.consumer_plane === "agent-context/consumer-plane.json", "Summary must expose the consumer plane path.");
  assert(summary.phase_bundle_index === "agent-context/phase-bundles/index.json", "Summary must point to phase bundle index.");
  assert(summary.compact_read_policy.max_default_artifact_bytes === 6000, "Compact read policy must expose bounded default bytes.");
  assert(Array.isArray(phaseIndex.phases), "Phase index must list phase bundles.");
  for (const phase of phaseIndex.phases) {
    assertFile(phase.path, outputDir);
  }
  for (const phaseId of expectedAvailablePhases) {
    const bundleRef = phaseIndex.phases.find((phase) => phase.phase_id === phaseId);
    assert(bundleRef, `Missing phase bundle ${phaseId}.`);
    assert(bundleRef.status === "available" || bundleRef.status === "complete", `${phaseId} should not be blocked.`);
    const bundle = readJson(path.join(outputDir, bundleRef.path));
    assert(bundle.required_reads.length > 0, `${phaseId} bundle must include bounded required reads.`);
    assert(bundle.required_reads.length <= 7, `${phaseId} bundle required reads must stay compact.`);
    assert(bundle.required_reads.every((read) => read.read_mode === "bounded_artifact" || read.read_mode === "human_open"), `${phaseId} bundle must classify read modes.`);
    assert(bundle.required_reads.every((read) => read.read_mode !== "bounded_artifact" || read.max_bytes <= 6000), `${phaseId} bounded reads must stay within 6000 bytes.`);
    assert(bundle.required_reads.every((read) => read.read_mode !== "human_open" || read.counts_against_machine_budget === false), `${phaseId} human-open reads must not count against machine budget.`);
    assert(bundle.full_artifact_policy.includes("Start from this compact bundle"), `${phaseId} bundle must define full artifact policy.`);
  }
  return summary;
}

function assertMirrorDedupe() {
  const skillMirrors = [
    ["skills/archetype/SKILL.md", "plugins/claude-code/skills/archetype/SKILL.md"],
    ["skills/blueprint/SKILL.md", "plugins/claude-code/skills/blueprint/SKILL.md"],
    ["skills/implement/SKILL.md", "plugins/claude-code/skills/implement/SKILL.md"],
    ["skills/verify/SKILL.md", "plugins/claude-code/skills/verify/SKILL.md"],
    ["skills/revise/SKILL.md", "plugins/claude-code/skills/revise/SKILL.md"]
  ];
  const agentFiles = [
    "accessibility-qa.md",
    "accessibility-specialist.md",
    "contract-drift-qa.md",
    "contract-verifier.md",
    "design-system-architect.md",
    "experience-architect.md",
    "frontend-architect.md",
    "frontend-contract-reviewer.md",
    "frontend-practice-enforcer.md",
    "malformed-data-qa.md",
    "pixel-perfect-developer.md",
    "playwright-e2e-engineer.md",
    "product-architect.md",
    "qa-lead.md",
    "repair-planner.md",
    "strict-typescript-developer.md",
    "test-first-developer.md",
    "ui-state-qa.md",
    "visual-regression-qa.md"
  ];
  for (const agent of agentFiles) {
    skillMirrors.push([path.join("agents", agent), path.join("plugins", "claude-code", "agents", agent)]);
  }
  for (const [source, mirror] of skillMirrors) {
    assert(sha256(path.join(root, source)) === sha256(path.join(root, mirror)), `Claude plugin mirror drifted from canonical source: ${mirror}`);
  }
  const tokenContextMentions = [
    "skills/archetype/SKILL.md",
    "skills/implement/SKILL.md",
    "skills/verify/SKILL.md",
    "plugins/codex/skills/archetype/SKILL.md",
    "plugins/codex/skills/archetype-implement/SKILL.md",
    "plugins/codex/skills/archetype-verify/SKILL.md"
  ];
  for (const relativePath of tokenContextMentions) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    assert(text.includes("agent-context/consumer-plane.json"), `${relativePath} must point agents to the consumer plane first.`);
    assert(text.includes("agent-context/context-summary.json"), `${relativePath} must point agents to compact context summary.`);
    assert(text.includes("agent-context/phase-bundles"), `${relativePath} must point agents to phase bundles.`);
  }
}

runJson(["init", "--template", "saas-dashboard", "--out", intakePath]);
const draftGenerate = runJson(["generate", "--input", intakePath, "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "Draft fixture must generate a draft contract.");

const draftSummary = assertAgentContext(draftOutputDir, "draft_contract", ["clarification", "draft_review", "contract_approval"]);
assert(draftSummary.phase_bundles.some((phase) => phase.phase_id === "implementation" && phase.status === "blocked"), "Draft context must block implementation phase.");

const compactCliSummary = runJson(["summarize", "--out", draftOutputDir, "--compact"]);
assert(compactCliSummary.entrypoints.length === 3, "Compact CLI summary must expose only compact entrypoints.");
assert(compactCliSummary.entrypoints.includes("agent-context/consumer-plane.json"), "Compact CLI summary must include consumer plane.");
assert(compactCliSummary.entrypoints.includes("agent-context/context-summary.json"), "Compact CLI summary must include context summary.");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  baseInput: JSON.parse(readFileSync(intakePath, "utf8")),
  approvedBy: "Token context contract"
});
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "Approved fixture must be ready for implementation.");

const approvedSummary = assertAgentContext(approvedOutputDir, "canonical", ["test_first", "implementation", "verification", "qa", "repair"]);
assert(approvedSummary.phase_bundles.some((phase) => phase.phase_id === "draft_review" && phase.status === "complete"), "Canonical context must mark draft review complete.");

const { summarizePackageTool } = require("../dist/mcp/tools/summarizePackage.js");
const { readArtifactTool } = require("../dist/mcp/tools/readArtifact.js");
const { dataPlaneArtifactsTool } = require("../dist/mcp/tools/dataPlane.js");

const mcpSummary = await Promise.resolve(summarizePackageTool.run({ outputDir: approvedOutputDir }));
assert(mcpSummary.entrypoints.length === 3, "MCP summarize must default to compact entrypoints.");
assert(mcpSummary.entrypoints.includes("agent-context/consumer-plane.json"), "MCP summarize must include consumer plane.");
assert(mcpSummary.phaseBundles.length >= 8, "MCP summarize must expose phase bundle references.");

const compatSummary = await Promise.resolve(summarizePackageTool.run({ outputDir: approvedOutputDir, mode: "compat" }));
assert(compatSummary.entrypoints.includes("test-first/test-quality-standard.json"), "MCP compat summary must retain legacy entrypoints.");

const boundedRead = await Promise.resolve(readArtifactTool.run({
  outputDir: approvedOutputDir,
  artifactId: "implementation-contract",
  maxBytes: 256,
  allowDeferred: true
}));
assert(boundedRead.bounded === true, "MCP read artifact must report bounded reads.");
assert(boundedRead.bytesRead <= 256, "MCP read artifact must respect maxBytes.");
assert(boundedRead.truncated === true, "Implementation contract should be truncated in bounded read.");
assert(boundedRead.nextRead && boundedRead.nextRead.offset > 0, "Truncated read must return nextRead instructions.");

const compactArtifactRead = await Promise.resolve(readArtifactTool.run({
  outputDir: approvedOutputDir,
  artifactId: "agent-context-phase-test-first"
}));
assert(compactArtifactRead.truncated === false, "Current test-first phase bundle should fit in the default bounded read.");
assert(String(compactArtifactRead.content).includes("required_reads"), "Phase bundle read must return the compact contract.");
try {
  await Promise.resolve(readArtifactTool.run({
    outputDir: approvedOutputDir,
    artifactId: "agent-context-phase-implementation"
  }));
  throw new Error("Deferred implementation phase read should have failed.");
} catch (error) {
  assert(String(error instanceof Error ? error.message : error).includes("deferred by the consumer-plane read plan"), "Deferred phase read should be blocked by the consumer plane.");
}

const boundedArtifacts = await Promise.resolve(dataPlaneArtifactsTool.run({
  outputDir: approvedOutputDir,
  runId: approvedGenerate.dataPlaneRunId,
  readPriority: "hot"
}));
assert(boundedArtifacts.artifactCount <= 50, "MCP data-plane artifacts must default to a bounded result set.");
assert(boundedArtifacts.artifacts.every((artifact) => artifact.metadata?.read_priority === "hot"), "MCP data-plane artifact filter must preserve read priority.");

assertMirrorDedupe();

console.log(JSON.stringify({
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  compactEntrypoints: compactCliSummary.entrypoints,
  mcpDefaultEntrypoints: mcpSummary.entrypoints,
  boundedReadBytes: boundedRead.bytesRead,
  boundedArtifacts: boundedArtifacts.artifactCount
}, null, 2));
