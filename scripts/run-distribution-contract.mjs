import { existsSync, readFileSync } from "node:fs";
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

for (const file of [
  "docs/install.md",
  "docs/install-claude-code-plugin.md",
  "docs/install-codex-plugin.md",
  "docs/demo-script.md",
  "RELEASE_NOTES.md",
  "scripts/run-demo.mjs",
  "scripts/run-install-contract.mjs",
  "scripts/run-lifecycle-contract.mjs",
  "scripts/run-spec-contract.mjs",
  "scripts/run-test-first-contract.mjs",
  "mcp.example.json",
  "plugins/claude-code/.mcp.json",
  "plugins/codex/.mcp.json"
]) {
  assert(existsSync(path.join(root, file)), `Missing distribution artifact: ${file}`);
}

const pkg = readJson("package.json");
assert(pkg.bin?.archetype === "./dist/cli.js", "package must expose archetype bin.");
assert(pkg.bin?.["archetype-mcp"] === "./dist/mcp/server.js", "package must expose archetype-mcp bin.");
assert(pkg.scripts?.prepare === "npm run build", "package must build for git installs.");
assert(pkg.scripts?.["demo:run"], "package must expose demo:run.");
assert(pkg.scripts?.["distribution:contract"], "package must expose distribution:contract.");
assert(pkg.scripts?.["install:contract"], "package must expose install:contract.");
assert(pkg.scripts?.["lifecycle:contract"], "package must expose lifecycle:contract.");
assert(pkg.scripts?.["spec:contract"], "package must expose spec:contract.");
assert(pkg.scripts?.["test-first:contract"], "package must expose test-first:contract.");
assert((pkg.files ?? []).includes("plugins"), "package files must include plugin wrappers.");
assert((pkg.files ?? []).includes("scripts"), "package files must include demo and contract scripts.");

for (const deadFile of ["dist/llm/provider.js", "dist/llm/structuredOutput.js", "dist/llm/types.js"]) {
  assert(!existsSync(path.join(root, deadFile)), `distribution must not include stale compiled provider code: ${deadFile}`);
}

const readme = readText("README.md");
for (const expected of [
  "npx -y -p @nikolacehic/archetype archetype init",
  "npx -y -p @nikolacehic/archetype archetype generate",
  "@Archetype \"I want to build a premium B2B analytics app for marketing teams.\"",
  "lifecycle/",
  "spec/archetype-spec.json",
  "test-first/",
  "docs/install.md",
  "docs/demo-script.md",
  "plugins/claude-code",
  "plugins/codex"
]) {
  assert(readme.includes(expected), `README missing ${expected}.`);
}

const install = readText("docs/install.md");
for (const expected of ["archetype init", "archetype generate", "archetype-mcp", "Local Source Install"]) {
  assert(install.includes(expected), `install docs missing ${expected}.`);
}

const demo = readText("docs/demo-script.md");
for (const expected of ["Brief -> Archetype contract -> coding agent implementation -> verification", "npm run demo:run", "AGENTS.md", "CLAUDE.md"]) {
  assert(demo.includes(expected), `demo docs missing ${expected}.`);
}

const releaseNotes = readText("RELEASE_NOTES.md");
for (const expected of ["0.1.0", "Agent Harness Pivot", "MCP stdio server", "Claude Code plugin", "Codex plugin"]) {
  assert(releaseNotes.includes(expected), `release notes missing ${expected}.`);
}

for (const config of ["mcp.example.json", "plugins/claude-code/.mcp.json", "plugins/codex/.mcp.json"]) {
  const json = readJson(config);
  assert(json.mcpServers?.archetype?.args?.includes("archetype-mcp"), `${config} must launch archetype-mcp.`);
}

console.log(JSON.stringify({
  status: "pass",
  docs: [
    "docs/install.md",
    "docs/install-claude-code-plugin.md",
    "docs/install-codex-plugin.md",
    "docs/demo-script.md",
    "RELEASE_NOTES.md"
  ],
  scripts: ["demo:run", "distribution:contract", "install:contract", "lifecycle:contract", "spec:contract", "test-first:contract"]
}, null, 2));
