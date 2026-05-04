import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "spec-contract");
const outputDir = path.join(workspace, "archetype-output");

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

const generate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "spec contract generation should succeed or warn.");

const specMdPath = path.join(outputDir, "spec", "archetype-spec.md");
const specJsonPath = path.join(outputDir, "spec", "archetype-spec.json");
assert(existsSync(specMdPath), "canonical spec markdown should exist.");
assert(existsSync(specJsonPath), "canonical spec JSON should exist.");

const spec = readJson(specJsonPath);
assert(spec.source_of_truth === true, "canonical spec must be marked as source of truth.");
assert(spec.lifecycle?.default_entrypoint === "/archetype \"project idea\"", "canonical spec must preserve lifecycle entrypoint.");
assert(spec.lifecycle?.principle?.includes("No code before contract"), "canonical spec must preserve lifecycle principle.");

const routeMap = readJson(path.join(outputDir, "experience", "route-map.json"));
const screenSpecs = readJson(path.join(outputDir, "screens", "screen-specs.json"));
assert(spec.experience.route_count === routeMap.routes.length, "canonical spec route count must match route map.");
assert(spec.experience.screen_count === screenSpecs.screens.length, "canonical spec screen count must match screen specs.");
assert(Array.isArray(spec.experience.routes) && spec.experience.routes.length === routeMap.routes.length, "canonical spec must include routes.");
assert(Array.isArray(spec.experience.screens) && spec.experience.screens.length === screenSpecs.screens.length, "canonical spec must include screens.");
assert(spec.design_system?.tokens?.semantic, "canonical spec must include semantic tokens.");
assert(spec.design_system?.components?.contracts, "canonical spec must include component contracts.");
assert(spec.frontend_contract?.routing, "canonical spec must include routing contract.");
assert(spec.frontend_contract?.data, "canonical spec must include data contracts.");
assert(spec.frontend_contract?.actions, "canonical spec must include action contracts.");
assert(spec.frontend_contract?.forms, "canonical spec must include form contracts.");
assert(Array.isArray(spec.frontend_contract?.acceptance_criteria_ids), "canonical spec must include acceptance criteria ids.");
assert(spec.verification?.required_evidence?.some((item) => String(item).includes("Tests generated")), "canonical spec must require test evidence.");
assert(spec.verification?.test_first_contract_path === "test-first/test-first-contract.json", "canonical spec must point to the test-first contract.");
assert(spec.verification?.playwright_verification_contract_path === "verification/playwright-verification-contract.json", "canonical spec must point to Playwright verification.");
assert(spec.traceability?.artifact_dependencies?.test_first_contract === "test-first/test-first-contract.json", "canonical spec must trace test-first contract dependency.");
assert(spec.traceability?.artifact_dependencies?.playwright_verification_contract === "verification/playwright-verification-contract.json", "canonical spec must trace Playwright verification dependency.");
assert(spec.traceability?.artifact_dependencies?.implementation_contract === "implementation-contract.md", "canonical spec must trace implementation contract dependency.");

const specMarkdown = readFileSync(specMdPath, "utf8");
for (const expected of ["# Archetype Canonical Spec", "source of truth", "No code before contract", "No implementation before tests", "No completion before verification"]) {
  assert(specMarkdown.includes(expected), `canonical spec markdown missing ${expected}.`);
}

const agents = readFileSync(path.join(outputDir, "AGENTS.md"), "utf8");
const claude = readFileSync(path.join(outputDir, "CLAUDE.md"), "utf8");
assert(agents.includes("spec/archetype-spec.json"), "AGENTS.md must tell agents to read the canonical spec JSON.");
assert(claude.includes("spec/archetype-spec.json"), "CLAUDE.md must tell Claude to read the canonical spec JSON.");

const manifest = readJson(path.join(outputDir, "manifest.json"));
for (const artifactId of ["canonical-spec", "canonical-spec-json"]) {
  assert((manifest.artifacts ?? []).some((artifact) => artifact.id === artifactId), `top-level manifest missing ${artifactId}.`);
}

const summarize = runJson(["summarize", "--out", outputDir]);
assert(summarize.entrypoints.includes("spec/archetype-spec.json"), "summarize should include canonical spec JSON entrypoint.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with canonical spec artifacts.");

rmSync(specJsonPath);
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", outputDir]);
    return null;
  } catch (error) {
    const message = String(error.stderr ?? error.message ?? error);
    return message;
  }
})();
assert(failedValidate !== null, "validate should fail when canonical spec JSON is missing.");

const summary = {
  status: "pass",
  outputDir,
  routeCount: spec.experience.route_count,
  screenCount: spec.experience.screen_count,
  acceptanceCriteria: spec.frontend_contract.acceptance_criteria_ids.length
};
writeFileSync(path.join(workspace, "spec-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
