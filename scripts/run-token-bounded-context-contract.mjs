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
  const summary = readJson(assertFile("agent-context/context-summary.json", outputDir));
  const phaseIndex = readJson(assertFile("agent-context/phase-bundles/index.json", outputDir));
  assert(summary.package_type === packageType, `Expected package type ${packageType}.`);
  assert(summary.start_here === "agent-context/context-summary.json", "Summary must point agents at itself first.");
  assert(summary.phase_bundle_index === "agent-context/phase-bundles/index.json", "Summary must point to phase bundle index.");
  assert(summary.compact_read_policy.max_default_artifact_bytes === 12000, "Compact read policy must expose bounded default bytes.");
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
assert(compactCliSummary.entrypoints.length === 2, "Compact CLI summary must expose only compact entrypoints.");
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
assert(mcpSummary.entrypoints.length === 2, "MCP summarize must default to compact entrypoints.");
assert(mcpSummary.phaseBundles.length >= 8, "MCP summarize must expose phase bundle references.");

const compatSummary = await Promise.resolve(summarizePackageTool.run({ outputDir: approvedOutputDir, mode: "compat" }));
assert(compatSummary.entrypoints.includes("test-first/test-quality-standard.json"), "MCP compat summary must retain legacy entrypoints.");

const boundedRead = await Promise.resolve(readArtifactTool.run({
  outputDir: approvedOutputDir,
  artifactId: "implementation-contract",
  maxBytes: 256
}));
assert(boundedRead.bounded === true, "MCP read artifact must report bounded reads.");
assert(boundedRead.bytesRead <= 256, "MCP read artifact must respect maxBytes.");
assert(boundedRead.truncated === true, "Implementation contract should be truncated in bounded read.");
assert(boundedRead.nextRead && boundedRead.nextRead.offset > 0, "Truncated read must return nextRead instructions.");

const compactArtifactRead = await Promise.resolve(readArtifactTool.run({
  outputDir: approvedOutputDir,
  artifactId: "agent-context-phase-implementation"
}));
assert(compactArtifactRead.truncated === false, "Implementation phase bundle should fit in the default bounded read.");
assert(String(compactArtifactRead.content).includes("required_reads"), "Phase bundle read must return the compact contract.");

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
