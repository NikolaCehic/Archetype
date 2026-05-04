import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "plugin-install-contract");
const sourceHome = path.join(workspace, "source-home");
const dryHome = path.join(workspace, "dry-home");
const npxHome = path.join(workspace, "npx-home");
const started = Date.now();

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
  const codexMarketplacePath = path.join(homeDir, ".agents", "plugins", "marketplace.json");
  const codexMarketplace = readJson(codexMarketplacePath);
  const codexEntry = codexMarketplace.plugins.find((plugin) => plugin.name === "archetype");
  assert(codexEntry?.source?.path === "./plugins/archetype", `${label}: Codex marketplace should point at ./plugins/archetype.`);
  assert(codexEntry?.policy?.installation === "INSTALLED_BY_DEFAULT", `${label}: Codex marketplace should install Archetype by default.`);
  assert(existsSync(path.join(codexPlugin, ".codex-plugin", "plugin.json")), `${label}: Codex install missing root manifest.`);
  assert(existsSync(path.join(codexPlugin, ".mcp.json")), `${label}: Codex install missing MCP config.`);
  assert(readJson(path.join(codexPlugin, ".mcp.json")).mcpServers?.archetype?.args?.includes("github:NikolaCehic/Archetype"), `${label}: Codex MCP config should use the GitHub package source until npm publish.`);
  assert(existsSync(path.join(codexPlugin, "skills", "archetype", "SKILL.md")), `${label}: Codex install missing front-door skill.`);
  assert(existsSync(path.join(codexPlugin, "skills", "implement", "SKILL.md")), `${label}: Codex install missing implementation skill.`);

  const claudeMarketplaceRoot = path.join(homeDir, ".claude", "plugins", "marketplaces", "archetype-local");
  const claudePlugin = path.join(claudeMarketplaceRoot, "plugins", "archetype");
  const claudeMarketplace = readJson(path.join(claudeMarketplaceRoot, ".claude-plugin", "marketplace.json"));
  assert(claudeMarketplace.plugins.some((plugin) => plugin.name === "archetype" && plugin.source === "./plugins/archetype"), `${label}: Claude marketplace should point at ./plugins/archetype.`);
  assert(existsSync(path.join(claudePlugin, ".claude-plugin", "plugin.json")), `${label}: Claude install missing root manifest.`);
  assert(existsSync(path.join(claudePlugin, ".mcp.json")), `${label}: Claude install missing MCP config.`);
  assert(readJson(path.join(claudePlugin, ".mcp.json")).mcpServers?.archetype?.args?.includes("github:NikolaCehic/Archetype"), `${label}: Claude MCP config should use the GitHub package source until npm publish.`);
  assert(existsSync(path.join(claudePlugin, "skills", "archetype", "SKILL.md")), `${label}: Claude install missing front-door skill.`);
  assert(existsSync(path.join(claudePlugin, "agents", "product-architect.md")), `${label}: Claude install missing product architect agent.`);
  assert(existsSync(path.join(claudePlugin, "docs", "quickstart.md")), `${label}: Claude install missing quickstart docs.`);
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
  assert(source.front_doors.codex.startsWith("@Archetype"), "Install report should expose Codex front door.");
  assert(source.front_doors.claude_code.startsWith("/archetype"), "Install report should expose Claude Code front door.");
  assertInstalledHome(sourceHome, "source");

  const packed = packTarball();
  tarballPath = packed.tarballPath;
  for (const required of [
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".mcp.json",
    ".agents/plugins/marketplace.json",
    "skills/archetype/SKILL.md",
    "skills/implement/SKILL.md",
    "agents/product-architect.md",
    "dist/install/pluginInstaller.js",
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
