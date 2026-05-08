import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "release-discipline-contract");
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function runJson(args) {
  return JSON.parse(execFileSync("node", ["scripts/run-contract-suite.mjs", ...args, "--dry-run"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }));
}

const pkg = readJson("package.json");
for (const scriptName of ["check:fast", "check:contracts", "check:release", "clean:tmp-heavy", "release-discipline:contract"]) {
  assert(typeof pkg.scripts?.[scriptName] === "string", `package.json missing ${scriptName}.`);
}
assert(pkg.scripts.check === "node scripts/run-contract-suite.mjs full", "npm run check must use the build-once contract runner.");
assert(pkg.scripts.test === "node scripts/run-contract-suite.mjs full", "npm run test must use the build-once contract runner.");
assert(pkg.scripts["check:fast"] === "node scripts/run-contract-suite.mjs fast", "check:fast must run the fast suite.");
assert(pkg.scripts["check:contracts"] === "node scripts/run-contract-suite.mjs contracts", "check:contracts must run the contract suite.");
assert(pkg.scripts["check:release"] === "node scripts/run-contract-suite.mjs release", "check:release must run the release suite.");

const runner = readText("scripts/run-contract-suite.mjs");
for (const expected of ["build_once", "target_dependency_cache", "maxWorkspaceBytes", "maxContextTokens", "duration_ms", "workspace_bytes", "ARCHETYPE_TARGET_NPM_CACHE_DIR"]) {
  assert(runner.includes(expected), `contract suite runner missing ${expected}.`);
}
for (const suite of ["fast", "contracts", "release", "full"]) {
  const plan = runJson([suite]);
  assert(plan.status === "plan", `${suite} dry-run should return a plan.`);
  assert(plan.build_once === true, `${suite} suite must be build-once.`);
  assert(plan.target_dependency_cache.includes(".cache") || plan.target_dependency_cache.includes("archetype"), `${suite} suite must expose target dependency cache.`);
  assert(plan.tasks.length > 0, `${suite} suite must include tasks.`);
}

const fastPlan = runJson(["fast"]);
const contractsPlan = runJson(["contracts"]);
const releasePlan = runJson(["release"]);
for (const expected of ["safety-approval", "phase-safe", "artifact-registry", "release-discipline", "repo-audit"]) {
  assert(fastPlan.tasks.some((task) => task.id === expected), `fast suite missing ${expected}.`);
}
for (const expected of ["real-verification", "cli", "mcp", "qa-team", "test-quality", "playwright", "repair"]) {
  assert(contractsPlan.tasks.some((task) => task.id === expected), `contracts suite missing ${expected}.`);
}
for (const expected of ["plugin-claude", "plugin-codex", "distribution", "release", "plugin-install", "install", "golden"]) {
  assert(releasePlan.tasks.some((task) => task.id === expected), `release suite missing ${expected}.`);
}

const cleaner = readText("scripts/clean-tmp-heavy.mjs");
for (const expected of ["node_modules", ".next", "playwright-report", "test-results", "removed_bytes"]) {
  assert(cleaner.includes(expected), `clean:tmp-heavy missing ${expected}.`);
}

const verifyTarget = readText("src/output/verifyTargetFrontend.ts");
assert(verifyTarget.includes("ARCHETYPE_TARGET_NPM_CACHE_DIR"), "verify-target must support target dependency cache env.");
assert(verifyTarget.includes("npm_config_cache"), "verify-target npm install must set npm_config_cache.");

const ciPath = ".github/workflows/ci.yml";
assert(existsSync(path.join(root, ciPath)), "CI workflow is missing.");
const ci = readText(ciPath);
for (const expected of ["check:${{ matrix.suite }}", "fast", "contracts", "release", "actions/setup-node@v4", "actions/cache@v4", "playwright@1.59.1", "ARCHETYPE_TARGET_NPM_CACHE_DIR", "tmp/contract-suite"]) {
  assert(ci.includes(expected), `CI workflow missing ${expected}.`);
}

const docs = `${readText("docs/release-readiness.md")}\n${readText("README.md")}`;
for (const expected of ["check:fast", "check:contracts", "check:release", "clean:tmp-heavy", "contract-suite", "target dependency cache"]) {
  assert(docs.includes(expected), `release docs missing ${expected}.`);
}

const summary = {
  status: "pass",
  suites: {
    fast: fastPlan.tasks.length,
    contracts: contractsPlan.tasks.length,
    release: releasePlan.tasks.length
  },
  buildOnce: true,
  ci: ciPath,
  cleaner: "scripts/clean-tmp-heavy.mjs"
};
writeFileSync(path.join(workspace, "release-discipline-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
