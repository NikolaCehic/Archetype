import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginDir = path.join(root, "plugins", "codex");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(relativePath) {
  return readFileSync(path.join(pluginDir, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function listFiles(dir) {
  const absolute = path.join(pluginDir, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const next = path.join(absolute, entry);
    const relative = path.relative(pluginDir, next);
    if (statSync(next).isDirectory()) return listFiles(relative);
    return [relative];
  });
}

const requiredFiles = [
  ".codex-plugin/plugin.json",
  ".mcp.json",
  "skills/archetype-blueprint/SKILL.md",
  "skills/archetype-implement/SKILL.md",
  "skills/archetype-verify/SKILL.md",
  "skills/archetype-revise/SKILL.md",
  "assets/README.md"
];

for (const file of requiredFiles) {
  assert(statSync(path.join(pluginDir, file)).isFile(), `Missing Codex plugin file: ${file}`);
}

const manifest = readJson(".codex-plugin/plugin.json");
assert(manifest.name === "archetype", "Codex plugin manifest name must be archetype.");
assert(manifest.version === "0.1.0", "Codex plugin manifest version must be 0.1.0.");
assert(manifest.license === "MIT", "Codex plugin manifest license must be MIT.");
assert(manifest.skills === "./skills/", "Codex plugin manifest must point to skills.");
assert(manifest.mcpServers === "./.mcp.json", "Codex plugin manifest must point to MCP config.");
assert(manifest.interface?.displayName === "Archetype", "Codex plugin manifest display name must be Archetype.");

const mcp = readJson(".mcp.json");
assert(mcp.mcpServers?.archetype?.command === "npx", "Codex plugin MCP config must use npx for published package execution.");
assert(mcp.mcpServers.archetype.args.includes("archetype-mcp"), "Codex plugin MCP config must launch archetype-mcp.");

const blueprint = readText("skills/archetype-blueprint/SKILL.md");
for (const expected of ["archetype_create_intake", "archetype_generate_package", "archetype_summarize_package", "archetype_read_artifact", "npx -y -p @nikolacehic/archetype"]) {
  assert(blueprint.includes(expected), `Codex blueprint skill missing ${expected}.`);
}

const implement = readText("skills/archetype-implement/SKILL.md");
for (const expected of ["AGENTS.md", "implementation-contract.md", "experience/route-map.json", "screens/screen-inventory.json", "design-system/tokens.json", "frontend-agent-contract/acceptance-criteria.json"]) {
  assert(implement.includes(expected), `Codex implement skill missing ${expected}.`);
}

const verify = readText("skills/archetype-verify/SKILL.md");
for (const expected of ["archetype_validate_package", "archetype_verify_target", "skipInstall: false", "verify-target"]) {
  assert(verify.includes(expected), `Codex verify skill missing ${expected}.`);
}

const revise = readText("skills/archetype-revise/SKILL.md");
for (const expected of ["archetype.intake.json", "archetype_generate_package", "archetype_summarize_package"]) {
  assert(revise.includes(expected), `Codex revise skill missing ${expected}.`);
}

const pluginText = listFiles(".").map((file) => readText(file)).join("\n").toLowerCase();
for (const forbidden of ["hosted web app", "saas dashboard", "account system", "billing surface", "no-code builder"]) {
  assert(!pluginText.includes(forbidden), `Codex plugin reintroduced forbidden product scope: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  pluginDir,
  files: requiredFiles.length,
  skills: ["archetype-blueprint", "archetype-implement", "archetype-verify", "archetype-revise"]
}, null, 2));
