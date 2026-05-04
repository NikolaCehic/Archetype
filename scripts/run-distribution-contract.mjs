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
  "docs/quickstart.md",
  "docs/agent-lifecycle.md",
  "docs/release-readiness.md",
  "docs/install-claude-code-plugin.md",
  "docs/install-codex-plugin.md",
  "docs/demo-script.md",
  "RELEASE_NOTES.md",
  "scripts/run-demo.mjs",
  "scripts/run-install-contract.mjs",
  "scripts/run-plugin-install-contract.mjs",
  "scripts/run-release-readiness-contract.mjs",
  "scripts/run-repository-audit.mjs",
  "scripts/run-lifecycle-contract.mjs",
  "scripts/run-spec-contract.mjs",
  "scripts/run-test-first-contract.mjs",
  "scripts/run-playwright-verification-contract.mjs",
  "scripts/run-repair-contract.mjs",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".agents/plugins/marketplace.json",
  ".mcp.json",
  "skills/archetype/SKILL.md",
  "agents/product-architect.md",
  "mcp.example.json",
  "plugins/claude-code/.mcp.json",
  "plugins/claude-code/commands/archetype.md",
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
assert(pkg.scripts?.["release:contract"], "package must expose release:contract.");
assert(pkg.scripts?.["plugin-install:contract"], "package must expose plugin-install:contract.");
assert(pkg.scripts?.["install:contract"], "package must expose install:contract.");
assert(pkg.scripts?.["repo:audit"], "package must expose repo:audit.");
assert(pkg.scripts?.["lifecycle:contract"], "package must expose lifecycle:contract.");
assert(pkg.scripts?.["spec:contract"], "package must expose spec:contract.");
assert(pkg.scripts?.["test-first:contract"], "package must expose test-first:contract.");
assert(pkg.scripts?.["playwright:contract"], "package must expose playwright:contract.");
assert(pkg.scripts?.["repair:contract"], "package must expose repair:contract.");
assert((pkg.files ?? []).includes("plugins"), "package files must include plugin wrappers.");
assert((pkg.files ?? []).includes(".codex-plugin"), "package files must include root Codex plugin manifest.");
assert((pkg.files ?? []).includes(".claude-plugin"), "package files must include root Claude plugin manifest.");
assert((pkg.files ?? []).includes("skills"), "package files must include root skills.");
assert((pkg.files ?? []).includes("agents"), "package files must include root agents.");
assert((pkg.files ?? []).includes("scripts"), "package files must include demo and contract scripts.");
for (const forbidden of ["iterations", "reinforcement-learning", "archetype-plugin-pivot-md", "tmp", "dist-workbench"]) {
  assert(!(pkg.files ?? []).includes(forbidden), `package files must not publish ${forbidden}.`);
}

for (const deadFile of ["dist/llm/provider.js", "dist/llm/structuredOutput.js", "dist/llm/types.js"]) {
  assert(!existsSync(path.join(root, deadFile)), `distribution must not include stale compiled provider code: ${deadFile}`);
}

const readme = readText("README.md");
for (const expected of [
  "npx --yes --package github:NikolaCehic/Archetype archetype init",
  "npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json",
  "npx --yes --package github:NikolaCehic/Archetype archetype doctor",
  "npx --yes --package github:NikolaCehic/Archetype archetype generate",
  "$archetype \"I want to build a premium B2B analytics app for marketing teams.\"",
  "docs/quickstart.md",
  "docs/agent-lifecycle.md",
  "docs/release-readiness.md",
  "lifecycle/",
  "spec/archetype-spec.json",
  "test-first/",
  "verification/playwright-verification-contract.json",
  "verification/playwright-evidence.json",
  "10-revision/repair-task-queue.json",
  "docs/install.md",
  "docs/demo-script.md",
  "~/.codex/skills/archetype",
  "~/plugins/archetype",
  "~/.claude/plugins/marketplaces/archetype-local/plugins/archetype",
  "~/.claude/skills/archetype",
  "archetype@archetype-local"
]) {
  assert(readme.includes(expected), `README missing ${expected}.`);
}

const install = readText("docs/install.md");
for (const expected of ["archetype install --target all --json", "archetype doctor", "archetype init", "archetype generate", "archetype-mcp", "Local Source Install", "plugin-install:contract", "release:contract"]) {
  assert(install.includes(expected), `install docs missing ${expected}.`);
}
const quickstart = readText("docs/quickstart.md");
for (const expected of ["60 seconds", "archetype install --target all --json", "archetype doctor --json", "archetype generate", "/archetype", "$archetype"]) {
  assert(quickstart.includes(expected), `quickstart docs missing ${expected}.`);
}
const lifecycle = readText("docs/agent-lifecycle.md");
for (const expected of ["clarify missing context", "optional materials", "canonical spec", "tests first", "Playwright", "repair"]) {
  assert(lifecycle.includes(expected), `agent lifecycle docs missing ${expected}.`);
}
const releaseReadiness = readText("docs/release-readiness.md");
for (const expected of ["archetype install --target all --json", "archetype doctor", "npm run release:contract", "npm run plugin-install:contract", "npm run repo:audit", "npm run install:contract", "npm pack --dry-run --json"]) {
  assert(releaseReadiness.includes(expected), `release readiness docs missing ${expected}.`);
}

const demo = readText("docs/demo-script.md");
for (const expected of ["Brief -> Archetype contract -> coding agent implementation -> verification", "npm run demo:run", "AGENTS.md", "CLAUDE.md"]) {
  assert(demo.includes(expected), `demo docs missing ${expected}.`);
}

const releaseNotes = readText("RELEASE_NOTES.md");
for (const expected of ["0.1.0", "Agent Harness", "MCP stdio server", "Claude Code plugin", "Codex plugin"]) {
  assert(releaseNotes.includes(expected), `release notes missing ${expected}.`);
}

for (const config of [".mcp.json", "mcp.example.json", "plugins/claude-code/.mcp.json", "plugins/codex/.mcp.json"]) {
  const json = readJson(config);
  assert(json.mcpServers?.archetype?.args?.includes("archetype-mcp"), `${config} must launch archetype-mcp.`);
}

console.log(JSON.stringify({
  status: "pass",
  docs: [
    "docs/install.md",
    "docs/quickstart.md",
    "docs/agent-lifecycle.md",
    "docs/release-readiness.md",
    "docs/install-claude-code-plugin.md",
    "docs/install-codex-plugin.md",
    "docs/demo-script.md",
    "RELEASE_NOTES.md"
  ],
  scripts: ["demo:run", "distribution:contract", "release:contract", "plugin-install:contract", "repo:audit", "install:contract", "lifecycle:contract", "spec:contract", "test-first:contract", "playwright:contract", "repair:contract"]
}, null, 2));
