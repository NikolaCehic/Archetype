import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "plugin-install-contract");
const sourceHome = path.join(workspace, "source-home");
const dryHome = path.join(workspace, "dry-home");
const npxHome = path.join(workspace, "npx-home");
const started = Date.now();
const requiredAgentRoles = [
  "product-architect.md",
  "experience-architect.md",
  "frontend-architect.md",
  "design-system-architect.md",
  "frontend-practice-enforcer.md",
  "strict-typescript-developer.md",
  "pixel-perfect-developer.md",
  "accessibility-specialist.md",
  "test-first-developer.md",
  "contract-verifier.md",
  "repair-planner.md",
  "qa-lead.md",
  "playwright-e2e-engineer.md",
  "ui-state-qa.md",
  "malformed-data-qa.md",
  "accessibility-qa.md",
  "visual-regression-qa.md",
  "contract-drift-qa.md"
];

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      npm_config_audit: "false",
      npm_config_fund: "false"
    }
  });
}

function runJson(command, args, options = {}) {
  const stdout = run(command, args, options);
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Command did not return JSON: ${command} ${args.join(" ")}\n${stdout}\n${error}`);
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertInstalledHome(homeDir, label) {
  const codexPlugin = path.join(homeDir, "plugins", "archetype");
  const codexNativePlugin = path.join(homeDir, ".codex", "plugins", "archetype");
  const codexSkills = path.join(homeDir, ".codex", "skills");
  const codexMarketplacePath = path.join(homeDir, ".agents", "plugins", "marketplace.json");
  const codexMarketplace = readJson(codexMarketplacePath);
  const codexEntry = codexMarketplace.plugins.find((plugin) => plugin.name === "archetype");
  assert(codexEntry?.source?.path === "./plugins/archetype", `${label}: Codex marketplace should point at ./plugins/archetype.`);
  assert(codexEntry?.policy?.installation === "INSTALLED_BY_DEFAULT", `${label}: Codex marketplace should install Archetype by default.`);
  assert(existsSync(path.join(codexPlugin, ".codex-plugin", "plugin.json")), `${label}: Codex install missing root manifest.`);
  assert(existsSync(path.join(codexNativePlugin, ".codex-plugin", "plugin.json")), `${label}: Codex native plugin install missing root manifest.`);
  assert(existsSync(path.join(codexPlugin, ".mcp.json")), `${label}: Codex install missing MCP config.`);
  assert(existsSync(path.join(codexNativePlugin, ".mcp.json")), `${label}: Codex native plugin install missing MCP config.`);
  assert(readJson(path.join(codexPlugin, ".mcp.json")).mcpServers?.archetype?.args?.includes("github:NikolaCehic/Archetype"), `${label}: Codex MCP config should use the GitHub package source until npm publish.`);
  assert(existsSync(path.join(codexPlugin, "skills", "archetype", "SKILL.md")), `${label}: Codex install missing front-door skill.`);
  assert(existsSync(path.join(codexPlugin, "skills", "implement", "SKILL.md")), `${label}: Codex install missing implementation skill.`);
  for (const role of requiredAgentRoles) {
    assert(existsSync(path.join(codexPlugin, "agents", role)), `${label}: Codex install missing agent role ${role}.`);
    assert(existsSync(path.join(codexNativePlugin, "agents", role)), `${label}: Codex native plugin install missing agent role ${role}.`);
  }
  assert(existsSync(path.join(codexSkills, "archetype", "SKILL.md")), `${label}: Codex home skills missing front-door skill.`);
  assert(existsSync(path.join(codexSkills, "archetype-blueprint", "SKILL.md")), `${label}: Codex home skills missing blueprint skill.`);
  assert(existsSync(path.join(codexSkills, "archetype-implement", "SKILL.md")), `${label}: Codex home skills missing implementation skill.`);
  assert(existsSync(path.join(codexSkills, "archetype-verify", "SKILL.md")), `${label}: Codex home skills missing verification skill.`);
  assert(existsSync(path.join(codexSkills, "archetype-revise", "SKILL.md")), `${label}: Codex home skills missing revision skill.`);
  assert(readFileSync(path.join(codexSkills, "archetype", "SKILL.md"), "utf8").includes("$archetype"), `${label}: Codex front-door skill should document $archetype.`);

  const claudeMarketplaceRoot = path.join(homeDir, ".claude", "plugins", "marketplaces", "archetype-local");
  const claudePlugin = path.join(claudeMarketplaceRoot, "plugins", "archetype");
  const claudeMarketplace = readJson(path.join(claudeMarketplaceRoot, ".claude-plugin", "marketplace.json"));
  assert(claudeMarketplace.plugins.some((plugin) => plugin.name === "archetype" && plugin.source === "./plugins/archetype"), `${label}: Claude marketplace should point at ./plugins/archetype.`);
  assert(existsSync(path.join(claudePlugin, ".claude-plugin", "plugin.json")), `${label}: Claude install missing root manifest.`);
  assert(!existsSync(path.join(claudePlugin, ".claude-plugin", "marketplace.json")), `${label}: Claude plugin install should not include a nested marketplace manifest.`);
  assert(existsSync(path.join(claudePlugin, ".mcp.json")), `${label}: Claude install missing MCP config.`);
  assert(readJson(path.join(claudePlugin, ".mcp.json")).mcpServers?.archetype?.args?.includes("github:NikolaCehic/Archetype"), `${label}: Claude MCP config should use the GitHub package source until npm publish.`);
  assert(existsSync(path.join(claudePlugin, "commands", "archetype.md")), `${label}: Claude install missing /archetype slash command.`);
  assert(existsSync(path.join(claudePlugin, "skills", "archetype", "SKILL.md")), `${label}: Claude install missing front-door skill.`);
  for (const role of requiredAgentRoles) {
    assert(existsSync(path.join(claudePlugin, "agents", role)), `${label}: Claude install missing agent role ${role}.`);
  }
  assert(existsSync(path.join(claudePlugin, "docs", "quickstart.md")), `${label}: Claude install missing quickstart docs.`);
  assert(existsSync(path.join(homeDir, ".claude", "skills", "archetype", "SKILL.md")), `${label}: Claude home skills missing /archetype front-door skill.`);
  assert(existsSync(path.join(homeDir, ".claude", "skills", "archetype-blueprint", "SKILL.md")), `${label}: Claude home skills missing blueprint skill.`);
  assert(existsSync(path.join(homeDir, ".claude", "skills", "archetype-implement", "SKILL.md")), `${label}: Claude home skills missing implementation skill.`);
  assert(existsSync(path.join(homeDir, ".claude", "skills", "archetype-verify", "SKILL.md")), `${label}: Claude home skills missing verification skill.`);
  assert(existsSync(path.join(homeDir, ".claude", "skills", "archetype-revise", "SKILL.md")), `${label}: Claude home skills missing revision skill.`);
  assert(readFileSync(path.join(homeDir, ".claude", "skills", "archetype", "SKILL.md"), "utf8").includes("/archetype"), `${label}: Claude front-door skill should document /archetype.`);
}

function packTarball() {
  const raw = run("npm", ["pack", "--json"]);
  const items = JSON.parse(raw);
  const item = items[0];
  const fileName = item?.filename;
  assert(typeof fileName === "string" && fileName.endsWith(".tgz"), "npm pack did not return a tarball filename.");
  const tarballPath = path.join(root, fileName);
  assert(existsSync(tarballPath), `Packed tarball missing: ${tarballPath}`);
  return { tarballPath, packedPaths: new Set((item.files ?? []).map((file) => file.path)) };
}

let tarballPath = "";
try {
  const dry = runJson("node", [
    "dist/cli.js",
    "install",
    "--target",
    "all",
    "--home",
    dryHome,
    "--dry-run",
    "--json"
  ]);
  assert(dry.status === "warning", "Dry-run install should warn that no files were written.");
  assert(dry.actions.every((action) => action.status === "planned"), "Dry-run install should only contain planned actions.");
  assert(!existsSync(path.join(dryHome, "plugins")), "Dry-run install must not write Codex plugin files.");
  assert(!existsSync(path.join(dryHome, ".codex")), "Dry-run install must not write Codex native plugin or skill files.");
  assert(!existsSync(path.join(dryHome, ".claude")), "Dry-run install must not write Claude plugin files.");

  const source = runJson("node", [
    "dist/cli.js",
    "install",
    "--target",
    "all",
    "--home",
    sourceHome,
    "--json"
  ]);
  assert(source.status === "pass", "Source install should pass.");
  assert(source.front_doors.codex.startsWith("$archetype"), "Install report should expose Codex front door.");
  assert(source.front_doors.claude_code.startsWith("/archetype"), "Install report should expose Claude Code front door.");
  assertInstalledHome(sourceHome, "source");

  const packed = packTarball();
  tarballPath = packed.tarballPath;
  for (const required of [
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".mcp.json",
    ".agents/plugins/marketplace.json",
    "plugins/claude-code/commands/archetype.md",
    "skills/archetype/SKILL.md",
    "skills/implement/SKILL.md",
    "agents/product-architect.md",
    "agents/contract-verifier.md",
    "agents/repair-planner.md",
    "dist/install/pluginInstaller.js",
    "scripts/run-test-quality-standard-contract.mjs",
    "scripts/run-action-state-policy-contract.mjs",
    "scripts/run-required-package-artifacts-contract.mjs",
    "scripts/run-forbidden-behaviors-contract.mjs",
    "scripts/run-marketing-dashboard-replay-contract.mjs",
    "scripts/run-implementation-phases-contract.mjs",
    "scripts/run-convergence-standard-contract.mjs",
    "scripts/run-design-system-preview-contract.mjs",
    "scripts/run-plugin-install-contract.mjs"
  ]) {
    assert(packed.packedPaths.has(required), `Packed package missing ${required}.`);
  }

  const npxInstall = runJson("npx", [
    "-y",
    "-p",
    tarballPath,
    "archetype",
    "install",
    "--target",
    "all",
    "--home",
    npxHome,
    "--json"
  ]);
  assert(npxInstall.status === "pass", "npx install command should pass.");
  assertInstalledHome(npxHome, "npx");

  const durationMs = Date.now() - started;
  assert(durationMs < 60000, `Plugin install contract exceeded 60 seconds: ${durationMs}ms.`);

  const summary = {
    status: "pass",
    durationMs,
    sourceHome,
    npxHome,
    sourceActions: source.actions.length,
    npxActions: npxInstall.actions.length,
    frontDoors: source.front_doors
  };
  writeFileSync(path.join(workspace, "plugin-install-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (tarballPath) rmSync(tarballPath, { force: true });
}
