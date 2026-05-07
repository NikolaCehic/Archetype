import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const {
  DataPlaneError,
  FileDataPlane,
  MemoryDataPlane,
  isDataPlaneError
} = require("../dist");
const { archetypeMcpTools } = require("../dist/mcp/tools");

const root = process.cwd();
const workspace = path.join(root, "tmp", "data-plane-contract");
const fileRoot = path.join(workspace, "file-data-plane");
const outputDir = path.join(workspace, "generated-output");
const approvedIntakePath = path.join(workspace, "approved-intake.json");

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

function appendContractEvents(dataPlane, runId) {
  dataPlane.appendEvent({
    runId,
    type: "intake.recorded",
    phase: "intake",
    payload: {
      summary: "Contract intake recorded.",
      source_hash: "contract-source"
    }
  });
  dataPlane.appendEvent({
    runId,
    type: "evidence.recorded",
    phase: "evidence",
    payload: {
      summary: "Contract evidence recorded.",
      source_count: 1
    }
  });
  dataPlane.appendEvent({
    runId,
    type: "lifecycle.gate_evaluated",
    phase: "approval",
    payload: {
      summary: "Lifecycle gate evaluated.",
      state: "contract_approval",
      readiness_tier: "ready_for_contract_approval",
      implementation_authorized: false,
      ready_for_frontend_agent: false,
      blockers: ["approval required"],
      warnings: []
    }
  });
  dataPlane.appendEvent({
    runId,
    type: "contract.draft_recorded",
    phase: "draft_contract",
    payload: {
      summary: "Draft contract recorded.",
      draft_refs: ["draft/example.json"]
    }
  });
  dataPlane.appendEvent({
    runId,
    type: "readiness.evaluated",
    phase: "readiness",
    payload: {
      summary: "Readiness evaluated.",
      readiness_tier: "ready_for_contract_approval",
      readiness_score: 80,
      ready_for_frontend_agent: false,
      implementation_authorized: false,
      blockers: ["approval required"],
      warnings: []
    }
  });
}

function assertAdapterContract(dataPlane, label) {
  const run = dataPlane.createRun({
    projectSlug: `${label}-project`,
    packageId: `${label}-package`,
    sourceHash: `${label}-source`,
    outputDir: workspace,
    status: "running",
    createdAt: "2026-05-07T00:00:00.000Z"
  });
  appendContractEvents(dataPlane, run.run_id);
  const events = dataPlane.listEvents(run.run_id);
  events.forEach((event, index) => {
    assert(event.sequence === index + 1, `${label}: event sequence ${event.sequence} drifted at ${index + 1}.`);
  });
  const artifact = dataPlane.writeArtifact({
    runId: run.run_id,
    artifactId: `${label}-artifact`,
    path: "draft/example.json",
    type: "json",
    sourcePhase: "draft_contract",
    producer: "data-plane-contract",
    bytes: 17,
    sha256: `${label}-sha256`,
    metadata: {
      required: true,
      package_path: "draft/example.json"
    }
  });
  assert(dataPlane.readArtifact(artifact.artifact_id, run.run_id).ref.path === "draft/example.json", `${label}: artifact read failed.`);
  const projection = dataPlane.writeProjection({
    runId: run.run_id,
    projectionName: "readiness",
    data: {
      readiness_tier: "ready_for_contract_approval",
      blockers: ["approval required"]
    },
    updatedAt: "2026-05-07T00:00:01.000Z"
  });
  assert(dataPlane.getProjection(run.run_id, "readiness").checksum === projection.checksum, `${label}: projection read failed.`);
  const replay = dataPlane.replayRun(run.run_id);
  assert(replay.timeline.length === dataPlane.listEvents(run.run_id).length, `${label}: replay timeline mismatch.`);
  assert(replay.projections.readiness.data.readiness_tier === "ready_for_contract_approval", `${label}: replay readiness mismatch.`);
  assert(replay.artifacts.length === 1, `${label}: replay artifact mismatch.`);
  let missingArtifactFailed = false;
  try {
    dataPlane.readArtifact(`${label}-missing-artifact`, run.run_id);
  } catch (error) {
    missingArtifactFailed = isDataPlaneError(error) && error.code === "ARTIFACT_NOT_FOUND";
  }
  assert(missingArtifactFailed, `${label}: malformed artifact read did not return typed DataPlaneError.`);
  return run.run_id;
}

function mcpTool(name) {
  const tool = archetypeMcpTools.find((candidate) => candidate.name === name);
  assert(tool, `MCP tool missing: ${name}`);
  return tool;
}

assertAdapterContract(new MemoryDataPlane(), "memory");
assertAdapterContract(new FileDataPlane({ rootDir: fileRoot }), "file");

const intake = JSON.parse(readFileSync(path.join(root, "examples", "saas-dashboard-intake.json"), "utf8"));
intake.contractApproval = {
  approved: true,
  approverType: "human",
  approvedBy: "data-plane-contract",
  approvedAt: "2026-05-07T00:00:00.000Z",
  artifactRefs: [
    "draft/product-model.draft.json",
    "draft/experience-architecture.draft.json",
    "draft/design-system.draft.json",
    "draft/frontend-contract.draft.json"
  ]
};
writeFileSync(approvedIntakePath, `${JSON.stringify(intake, null, 2)}\n`);

const generate = runCliJson(["generate", "--input", approvedIntakePath, "--out", outputDir]);
assert(generate.readyForFrontendAgent === true, "approved generate should be ready for frontend agents.");
assert(typeof generate.dataPlaneRunId === "string" && generate.dataPlaneRunId.length > 0, "generate should return dataPlaneRunId.");
for (const requiredPath of [
  "manifest.json",
  "spec/archetype-spec.json",
  "test-first/test-first-contract.json",
  "verification/playwright-verification-contract.json",
  "draft/design-system-preview.html",
  "data-plane"
]) {
  assert(existsSync(path.join(outputDir, requiredPath)), `generated output missing ${requiredPath}.`);
}

const validate = runCliJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should still pass after data-plane generation.");

const status = runCliJson(["data-plane", "status", "--out", outputDir]);
assert(status.runCount === 1, "CLI data-plane status should see one run.");
assert(status.latestRunId === generate.dataPlaneRunId, "CLI data-plane status should match generate run.");
const timeline = runCliJson(["data-plane", "timeline", "--out", outputDir, "--run", generate.dataPlaneRunId]);
assert(timeline.eventCount > 50, "CLI data-plane timeline should include generation events.");
const artifacts = runCliJson(["data-plane", "artifacts", "--out", outputDir, "--run", generate.dataPlaneRunId]);
assert(artifacts.artifactCount > 200, "CLI data-plane artifacts should include canonical artifact lineage.");
const artifact = runCliJson(["data-plane", "read-artifact", "--out", outputDir, "--artifact", "canonical-spec-json"]);
assert(artifact.artifact?.ref?.path === "spec/archetype-spec.json", "CLI data-plane read-artifact should return ArtifactRecord.");
const replay = runCliJson(["data-plane", "replay", "--out", outputDir, "--run", generate.dataPlaneRunId]);
assert(replay.replay?.timeline?.length === timeline.eventCount, "CLI data-plane replay should match timeline.");
const missingRun = runCliJson(["data-plane", "timeline", "--out", outputDir, "--run", "missing-run"], 1);
assert(missingRun.error?.code === "RUN_NOT_FOUND", "CLI malformed run should return typed RUN_NOT_FOUND.");
const missingArtifact = runCliJson(["data-plane", "read-artifact", "--out", outputDir, "--artifact", "missing-artifact"], 1);
assert(missingArtifact.error?.code === "ARTIFACT_NOT_FOUND", "CLI malformed artifact should return typed ARTIFACT_NOT_FOUND.");

const mcpStatus = await mcpTool("archetype_data_plane_status").run({ outputDir });
assert(mcpStatus.latestRunId === generate.dataPlaneRunId, "MCP status should match generated run.");
const mcpTimeline = await mcpTool("archetype_data_plane_timeline").run({
  outputDir,
  runId: generate.dataPlaneRunId
});
assert(mcpTimeline.eventCount === timeline.eventCount, "MCP timeline should match CLI timeline.");
const mcpArtifact = await mcpTool("archetype_data_plane_read_artifact").run({
  outputDir,
  artifactId: "canonical-spec-json"
});
assert(mcpArtifact.artifact?.ref?.path === "spec/archetype-spec.json", "MCP read artifact should return ArtifactRecord.");
const mcpReplay = await mcpTool("archetype_data_plane_replay_run").run({
  outputDir,
  runId: generate.dataPlaneRunId
});
assert(mcpReplay.replay?.timeline?.length === timeline.eventCount, "MCP replay should match CLI timeline.");
let mcpMissingRunFailed = false;
try {
  await mcpTool("archetype_data_plane_timeline").run({ outputDir, runId: "missing-run" });
} catch (error) {
  mcpMissingRunFailed = error instanceof DataPlaneError && error.code === "RUN_NOT_FOUND";
}
assert(mcpMissingRunFailed, "MCP malformed run should throw typed RUN_NOT_FOUND.");

const summary = {
  status: "pass",
  adapters: ["memory", "file"],
  generatedRunId: generate.dataPlaneRunId,
  cli: {
    events: timeline.eventCount,
    artifacts: artifacts.artifactCount,
    malformed: ["RUN_NOT_FOUND", "ARTIFACT_NOT_FOUND"]
  },
  mcp: {
    tools: [
      "archetype_data_plane_status",
      "archetype_data_plane_timeline",
      "archetype_data_plane_read_artifact",
      "archetype_data_plane_replay_run"
    ],
    events: mcpTimeline.eventCount
  }
};

writeFileSync(path.join(workspace, "data-plane-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
