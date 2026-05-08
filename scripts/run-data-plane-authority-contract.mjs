import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const require = createRequire(import.meta.url);
const {
  DataPlaneError,
  FileDataPlane,
  MemoryDataPlane,
  isDataPlaneError,
  recordQaSignal,
  recordRepairSignal,
  recordVerificationSignal,
  writeReplayConsistentProjections
} = require("../dist");
const { archetypeMcpTools } = require("../dist/mcp/tools");

const root = process.cwd();
const workspace = path.join(root, "tmp", "data-plane-authority-contract");
const generatedOutputDir = path.join(workspace, "generated-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCliJson(args, expectedStatus = 0) {
  const result = spawnSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`CLI command did not return JSON: ${args.join(" ")}\nstdout=${result.stdout}\nstderr=${result.stderr}\n${error}`);
  }
  assert(result.status === expectedStatus, `CLI ${args.join(" ")} expected exit ${expectedStatus}, got ${result.status}.`);
  return parsed;
}

function mcpTool(name) {
  const tool = archetypeMcpTools.find((candidate) => candidate.name === name);
  assert(tool, `MCP tool missing: ${name}`);
  return tool;
}

function makeRun(dataPlane, label) {
  return dataPlane.createRun({
    projectSlug: `${label}-project`,
    packageId: `${label}-package`,
    sourceHash: `${label}-source`,
    status: "running",
    createdAt: "2026-05-08T00:00:00.000Z"
  });
}

function assertAmbiguousLookup(dataPlane, label) {
  const first = makeRun(dataPlane, `${label}-one`);
  const second = makeRun(dataPlane, `${label}-two`);
  for (const run of [first, second]) {
    dataPlane.writeArtifact({
      runId: run.run_id,
      artifactId: "shared-artifact",
      path: "spec/archetype-spec.json",
      type: "json",
      sourcePhase: "canonical_spec",
      producer: "authority-contract",
      sha256: `${run.run_id}-sha`,
      metadata: {}
    });
  }
  let ambiguous = false;
  try {
    dataPlane.readArtifact("shared-artifact");
  } catch (error) {
    ambiguous = isDataPlaneError(error) && error.code === "ARTIFACT_LOOKUP_AMBIGUOUS";
  }
  assert(ambiguous, `${label}: ambiguous artifact lookup must return ARTIFACT_LOOKUP_AMBIGUOUS.`);
  assert(dataPlane.readArtifact("shared-artifact", first.run_id).run_id === first.run_id, `${label}: run-scoped artifact lookup should disambiguate.`);
}

function assertWritersAndProjectionConsistency(dataPlane, label) {
  const run = makeRun(dataPlane, `${label}-signals`);
  recordVerificationSignal(dataPlane, {
    runId: run.run_id,
    summary: "Verification authority signal.",
    status: "pass",
    evidenceGrade: "playwright",
    artifactRefs: ["verification/playwright-evidence.json"]
  });
  recordQaSignal(dataPlane, {
    runId: run.run_id,
    summary: "QA authority signal.",
    status: "pass",
    scenarioCount: 3,
    artifactRefs: ["qa/scenario-catalog.json"]
  });
  recordRepairSignal(dataPlane, {
    runId: run.run_id,
    summary: "Repair authority signal.",
    status: "pass",
    taskCount: 0,
    artifactRefs: ["10-revision/repair-task-queue.json"]
  });
  writeReplayConsistentProjections(dataPlane, run.run_id);
  const replay = dataPlane.replayRun(run.run_id);
  for (const projectionName of ["lifecycle", "evidence", "contracts", "verification", "readiness"]) {
    const persisted = dataPlane.getProjection(run.run_id, projectionName);
    assert(persisted.checksum === replay.projections[projectionName].checksum, `${label}: ${projectionName} projection checksum drifted.`);
    assert(persisted.event_count === replay.events.length, `${label}: ${projectionName} projection event_count drifted.`);
  }
  assert(replay.projections.verification.data.qa_status === "pass", `${label}: replay verification projection should include QA signal.`);
  assert(replay.projections.verification.data.repair_status === "pass", `${label}: replay verification projection should include repair signal.`);
}

assertAmbiguousLookup(new MemoryDataPlane(), "memory");
assertWritersAndProjectionConsistency(new MemoryDataPlane(), "memory");

const fileRoot = path.join(workspace, "file-data-plane");
assertAmbiguousLookup(new FileDataPlane({ rootDir: fileRoot }), "file");
assertWritersAndProjectionConsistency(new FileDataPlane({ rootDir: path.join(workspace, "file-data-plane-signals") }), "file");

const corruptRoot = path.join(workspace, "corrupt-data-plane");
const corruptPlane = new FileDataPlane({ rootDir: corruptRoot });
const corruptRun = makeRun(corruptPlane, "corrupt");
const corruptEventsPath = path.join(corruptRoot, "runs", corruptRun.run_id, "events.jsonl");
writeFileSync(corruptEventsPath, `${readFileSync(corruptEventsPath, "utf8")}{not-json}\n`);
let corruptFailed = false;
try {
  corruptPlane.listEvents(corruptRun.run_id);
} catch (error) {
  corruptFailed = isDataPlaneError(error) && error.code === "CORRUPT_DATA_PLANE_RECORD";
}
assert(corruptFailed, "corrupt JSONL must return CORRUPT_DATA_PLANE_RECORD.");

const continuityRoot = path.join(workspace, "continuity-data-plane");
const continuityPlane = new FileDataPlane({ rootDir: continuityRoot });
const continuityRun = makeRun(continuityPlane, "continuity");
continuityPlane.appendEvent({
  runId: continuityRun.run_id,
  type: "intake.recorded",
  phase: "intake",
  payload: { summary: "continuity event" }
});
const continuityEventsPath = path.join(continuityRoot, "runs", continuityRun.run_id, "events.jsonl");
const lines = readFileSync(continuityEventsPath, "utf8").trim().split(/\r?\n/u);
const firstEvent = JSON.parse(lines[0]);
firstEvent.sequence = 3;
writeFileSync(continuityEventsPath, `${JSON.stringify(firstEvent)}\n${lines.slice(1).join("\n")}\n`);
let continuityFailed = false;
try {
  continuityPlane.listEvents(continuityRun.run_id);
} catch (error) {
  continuityFailed = isDataPlaneError(error) && error.code === "EVENT_SEQUENCE_CORRUPT";
}
assert(continuityFailed, "non-contiguous events must return EVENT_SEQUENCE_CORRUPT.");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "data-plane-authority-contract",
  approvedAt: "2026-05-08T00:00:00.000Z"
});
const generate = runCliJson(["generate", "--input", approvedInputPath, "--out", generatedOutputDir]);
assert(generate.readyForFrontendAgent === true, "approved generation should be implementation-ready.");

const lifecycle = runCliJson(["data-plane", "lifecycle", "--out", generatedOutputDir, "--run", generate.dataPlaneRunId]);
assert(lifecycle.projectionConsistency?.matches === true, "CLI lifecycle projection consistency should pass.");
assert(lifecycle.lifecycle?.data?.implementation_authorized === true, "CLI lifecycle should expose implementation_authorized without artifact reads.");

const replay = runCliJson(["data-plane", "replay", "--out", generatedOutputDir, "--run", generate.dataPlaneRunId]);
assert(replay.projectionConsistency?.matches === true, "CLI replay projection consistency should pass.");
assert(replay.replay?.timeline?.some((event) => event.type === "qa.recorded"), "replay timeline should include QA signal.");
assert(replay.replay?.timeline?.some((event) => event.type === "repair.recorded"), "replay timeline should include repair signal.");

const qaTimeline = runCliJson(["data-plane", "timeline", "--out", generatedOutputDir, "--run", generate.dataPlaneRunId, "--phase", "qa", "--type", "qa.recorded", "--limit", "5"]);
assert(qaTimeline.eventCount === 1, "filtered QA timeline should return one QA event.");
const hotArtifacts = runCliJson(["data-plane", "artifacts", "--out", generatedOutputDir, "--run", generate.dataPlaneRunId, "--priority", "hot", "--limit", "3"]);
assert(hotArtifacts.artifactCount === 3, "filtered hot artifacts should respect limit.");
assert(hotArtifacts.artifacts.every((artifact) => artifact.metadata?.read_priority === "hot"), "filtered hot artifacts should only include hot read priority.");

const mcpLifecycle = await mcpTool("archetype_data_plane_lifecycle").run({ outputDir: generatedOutputDir, runId: generate.dataPlaneRunId });
assert(mcpLifecycle.projectionConsistency?.matches === true, "MCP lifecycle projection consistency should pass.");
const mcpArtifacts = await mcpTool("archetype_data_plane_artifacts").run({
  outputDir: generatedOutputDir,
  runId: generate.dataPlaneRunId,
  readPriority: "hot",
  limit: 2
});
assert(mcpArtifacts.artifactCount === 2, "MCP artifact filter should respect limit.");

const summary = {
  status: "pass",
  generatedRunId: generate.dataPlaneRunId,
  projectionConsistency: lifecycle.projectionConsistency.matches,
  filteredQaEvents: qaTimeline.eventCount,
  filteredHotArtifacts: hotArtifacts.artifactCount,
  typedFailures: [
    "ARTIFACT_LOOKUP_AMBIGUOUS",
    "CORRUPT_DATA_PLANE_RECORD",
    "EVENT_SEQUENCE_CORRUPT"
  ]
};

writeFileSync(path.join(workspace, "data-plane-authority-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
