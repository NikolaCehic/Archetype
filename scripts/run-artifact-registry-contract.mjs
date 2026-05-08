import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const require = createRequire(import.meta.url);
const {
  ARTIFACT_REGISTRY,
  artifactIndexForPackage,
  artifactReadOrderForPackage,
  forbiddenDraftArtifactPaths,
  manifestArtifactsForPackage,
  requiredCompletePackageArtifactPaths,
  requiredDraftPackageArtifactPaths
} = require("../dist/artifacts/registry.js");
const { REQUIRED_COMPLETE_PACKAGE_ARTIFACTS } = require("../dist/modules/requiredPackageArtifacts.js");

const root = process.cwd();
const workspace = path.join(root, "tmp", "artifact-registry-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const canonicalOutputDir = path.join(workspace, "canonical-output");

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

function paths(items) {
  return items.map((item) => item.path);
}

function assertSameSet(left, right, message) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  for (const value of leftSet) assert(rightSet.has(value), `${message}: missing ${value}.`);
  for (const value of rightSet) assert(leftSet.has(value), `${message}: unexpected ${value}.`);
}

const registryPaths = ARTIFACT_REGISTRY.map((entry) => entry.path);
assert(ARTIFACT_REGISTRY.length > 180, "artifact registry should cover the full package surface.");
assert(new Set(registryPaths).size === registryPaths.length, "artifact registry paths must be unique.");
for (const entry of ARTIFACT_REGISTRY) {
  assert(entry.id && entry.path && entry.type && entry.phase, `registry entry ${entry.path} is missing core metadata.`);
  assert(["hot", "warm", "cold"].includes(entry.readPriority), `registry entry ${entry.path} has invalid read priority.`);
  assert(entry.dataPlane?.sourcePhase === entry.phase, `registry entry ${entry.path} data-plane phase must match registry phase.`);
}
assert(artifactReadOrderForPackage("draft").length > 0, "draft read order must be registry-backed.");
assert(artifactReadOrderForPackage("canonical").length > 0, "canonical read order must be registry-backed.");
assertSameSet(requiredCompletePackageArtifactPaths(), REQUIRED_COMPLETE_PACKAGE_ARTIFACTS, "complete required artifacts must come from registry");

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "fixture should generate a draft package before approval.");
const draftTopManifest = readJson(path.join(draftOutputDir, "manifest.json"));
const draftInternalManifest = readJson(path.join(draftOutputDir, "00-manifest", "manifest.json"));
assertSameSet(paths(manifestArtifactsForPackage("draft")), paths(draftTopManifest.artifacts ?? []), "draft top manifest must come from registry");
assertSameSet(artifactIndexForPackage("draft"), draftInternalManifest.artifact_index ?? [], "draft internal artifact index must come from registry");
for (const requiredPath of requiredDraftPackageArtifactPaths()) {
  assert(existsSync(path.join(draftOutputDir, requiredPath)), `draft output missing registry required path ${requiredPath}.`);
}
for (const forbiddenPath of forbiddenDraftArtifactPaths()) {
  assert(!existsSync(path.join(draftOutputDir, forbiddenPath)), `draft output leaked forbidden registry path ${forbiddenPath}.`);
}

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Artifact registry contract",
  approvedAt: "2026-05-08T00:00:00.000Z"
});
const canonicalGenerate = runJson(["generate", "--input", approvedInputPath, "--out", canonicalOutputDir]);
assert(canonicalGenerate.readyForFrontendAgent === true, "approved fixture should generate a canonical package.");
const canonicalTopManifest = readJson(path.join(canonicalOutputDir, "manifest.json"));
const canonicalInternalManifest = readJson(path.join(canonicalOutputDir, "00-manifest", "manifest.json"));
assertSameSet(paths(manifestArtifactsForPackage("canonical")), paths(canonicalTopManifest.artifacts ?? []), "canonical top manifest must come from registry");
for (const registryPath of artifactIndexForPackage("canonical")) {
  assert(canonicalInternalManifest.artifact_index?.includes(registryPath), `canonical internal manifest missing registry path ${registryPath}.`);
}
for (const requiredPath of requiredCompletePackageArtifactPaths()) {
  assert(existsSync(path.join(canonicalOutputDir, requiredPath)), `canonical output missing required registry path ${requiredPath}.`);
}

const artifacts = runJson(["data-plane", "artifacts", "--out", canonicalOutputDir, "--run", canonicalGenerate.dataPlaneRunId]);
const canonicalSpecRecord = artifacts.artifacts.find((artifact) => artifact.ref?.path === "spec/archetype-spec.json");
assert(canonicalSpecRecord?.metadata?.registry_id === "canonical-spec-json", "data-plane artifact record must include registry id metadata.");
assert(canonicalSpecRecord?.metadata?.read_priority === "hot", "data-plane artifact record must include read priority metadata.");

const summary = {
  status: "pass",
  registryEntries: ARTIFACT_REGISTRY.length,
  draftArtifacts: draftTopManifest.artifacts?.length ?? 0,
  canonicalArtifacts: canonicalTopManifest.artifacts?.length ?? 0,
  requiredCompleteArtifacts: requiredCompletePackageArtifactPaths().length
};
writeFileSync(path.join(workspace, "artifact-registry-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
