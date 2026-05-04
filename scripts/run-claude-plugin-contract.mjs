import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginDir = path.join(root, "plugins", "claude-code");

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
  ".claude-plugin/plugin.json",
  ".mcp.json",
  "skills/archetype/SKILL.md",
  "skills/blueprint/SKILL.md",
  "skills/implement/SKILL.md",
  "skills/verify/SKILL.md",
  "skills/revise/SKILL.md",
  "agents/product-architect.md",
  "agents/frontend-contract-reviewer.md",
  "assets/README.md"
];

for (const file of requiredFiles) {
  assert(statSync(path.join(pluginDir, file)).isFile(), `Missing Claude plugin file: ${file}`);
}

const manifest = readJson(".claude-plugin/plugin.json");
assert(manifest.name === "archetype", "Claude plugin manifest name must be archetype.");
assert(manifest.version === "0.1.0", "Claude plugin manifest version must be 0.1.0.");
assert(manifest.license === "MIT", "Claude plugin manifest license must be MIT.");
assert(manifest.repository === "https://github.com/NikolaCehic/Archetype", "Claude plugin manifest repository must point to Archetype.");

const mcp = readJson(".mcp.json");
assert(mcp.mcpServers?.archetype?.command === "npx", "Claude plugin MCP config must use npx for published package execution.");
assert(mcp.mcpServers.archetype.args.includes("archetype-mcp"), "Claude plugin MCP config must launch archetype-mcp.");

const frontDoor = readText("skills/archetype/SKILL.md");
for (const expected of ["project idea", "Self-Contained Pipeline", "archetype_create_intake", "materials", "Ask at most six", "Do not require the user", "tests first", "Do not end by telling the user what to tell Claude Code next"]) {
  assert(frontDoor.includes(expected), `Claude front-door skill missing ${expected}.`);
}
assert(frontDoor.includes("spec/archetype-spec.json"), "Claude front-door skill must read the canonical spec.");
assert(frontDoor.includes("test-first/test-first-contract.json"), "Claude front-door skill must read the test-first contract.");
assert(!frontDoor.includes("Ask me what is missing, then build and verify"), "Claude front-door skill must not require prompt choreography.");

const blueprint = readText("skills/blueprint/SKILL.md");
for (const expected of ["archetype_create_intake", "archetype_generate_package", "archetype_summarize_package", "archetype_read_artifact", "npx -y -p @nikolacehic/archetype"]) {
  assert(blueprint.includes(expected), `Blueprint skill missing ${expected}.`);
}

const implement = readText("skills/implement/SKILL.md");
for (const expected of ["spec/archetype-spec.json", "test-first/test-first-contract.json", "implementation-contract.md", "experience/route-map.json", "screens/screen-inventory.json", "design-system/tokens.json", "frontend-agent-contract/implementation-rules.json"]) {
  assert(implement.includes(expected), `Implement skill missing ${expected}.`);
}
assert(implement.includes("Preserve the initial red test result"), "Claude implement skill must enforce red-first TDD.");

const verify = readText("skills/verify/SKILL.md");
for (const expected of ["archetype_validate_package", "archetype_verify_target", "skipInstall: false", "verify-target"]) {
  assert(verify.includes(expected), `Verify skill missing ${expected}.`);
}

const revise = readText("skills/revise/SKILL.md");
for (const expected of ["archetype.intake.json", "archetype_generate_package", "archetype_summarize_package"]) {
  assert(revise.includes(expected), `Revise skill missing ${expected}.`);
}

const productArchitect = readText("agents/product-architect.md");
assert(productArchitect.includes("archetype_create_intake"), "Product architect must reference intake creation.");
assert(productArchitect.includes("missing inputs"), "Product architect must surface missing inputs.");

const reviewer = readText("agents/frontend-contract-reviewer.md");
for (const expected of ["missing evidence", "acceptance criteria", "archetype_validate_package"]) {
  assert(reviewer.toLowerCase().includes(expected), `Frontend contract reviewer missing ${expected}.`);
}

const pluginText = listFiles(".").map((file) => readText(file)).join("\n").toLowerCase();
for (const forbidden of ["hosted web app", "saas dashboard", "account system", "billing surface", "no-code builder"]) {
  assert(!pluginText.includes(forbidden), `Claude plugin reintroduced forbidden product scope: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  pluginDir,
  files: requiredFiles.length,
  skills: ["archetype", "blueprint", "implement", "verify", "revise"],
  agents: ["product-architect", "frontend-contract-reviewer"]
}, null, 2));
