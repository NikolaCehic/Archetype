import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function gitLsFiles() {
  return execFileSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).split("\n").filter(Boolean).sort();
}

const trackedFiles = gitLsFiles();
const forbiddenTrackedPrefixes = [
  "iterations/",
  "reinforcement-learning/",
  "archetype-plugin-pivot-md/",
  "dist/",
  "tmp/",
  "node_modules/",
  "workbench/",
  "dist-workbench/",
  ".codex/",
  ".claude/",
  "playwright-report/",
  "test-results/",
  "coverage/"
];

for (const prefix of forbiddenTrackedPrefixes) {
  assert(!trackedFiles.some((file) => file.startsWith(prefix)), `Non-publishable tracked path found under ${prefix}`);
}

for (const file of trackedFiles) {
  const base = path.basename(file);
  assert(!/\.env(\..*)?$/.test(base), `Environment file must not be tracked: ${file}`);
  assert(!base.endsWith(".log"), `Log file must not be tracked: ${file}`);
  assert(!base.endsWith(".tgz"), `Package tarball must not be tracked: ${file}`);
  assert(base !== ".DS_Store", `macOS metadata file must not be tracked: ${file}`);
}

const gitignore = readText(".gitignore");
for (const expected of [
  "node_modules/",
  "dist/",
  "tmp/",
  "*.log",
  "*.tgz",
  ".env",
  ".env.*",
  "playwright-report/",
  "test-results/",
  "coverage/",
  ".codex/",
  ".claude/"
]) {
  assert(gitignore.includes(expected), `.gitignore missing ${expected}`);
}

const pkg = readJson("package.json");
assert(pkg.repository?.url?.includes("github.com/NikolaCehic/Archetype"), "package.json must declare the GitHub repository.");
assert(pkg.bugs?.url?.includes("github.com/NikolaCehic/Archetype/issues"), "package.json must declare the issue tracker.");
assert(pkg.homepage?.includes("github.com/NikolaCehic/Archetype"), "package.json must declare the repository homepage.");
assert(pkg.publishConfig?.access === "public", "Scoped package must declare publishConfig.access=public.");
assert(pkg.engines?.node, "package.json must declare a Node engine.");

for (const forbidden of ["iterations", "reinforcement-learning", "archetype-plugin-pivot-md", "tmp", "dist-workbench"]) {
  assert(!(pkg.files ?? []).includes(forbidden), `package files must not publish ${forbidden}.`);
}

for (const required of ["dist", "examples", "docs", ".codex-plugin", ".claude-plugin", ".agents", ".mcp.json", "skills", "agents", "plugins", "scripts", "mcp.example.json", "README.md", "LICENSE"]) {
  assert((pkg.files ?? []).includes(required), `package files missing required publish surface ${required}.`);
}

const publicSurface = [
  readText("README.md"),
  readText("AGENTS.md"),
  readText("docs/install.md"),
  readText("docs/quickstart.md"),
  readText("docs/release-readiness.md")
].join("\n").toLowerCase();

for (const forbidden of ["being pivoted", "pivot reference", "reinforcement-learning", "iteration logs", "workbench ui"]) {
  assert(!publicSurface.includes(forbidden), `Public docs contain non-publishable language: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  trackedFiles: trackedFiles.length,
  forbiddenTrackedPrefixes,
  packageFiles: pkg.files
}, null, 2));
