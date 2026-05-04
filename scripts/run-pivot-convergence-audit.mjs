import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function walk(dir) {
  const absolute = path.join(root, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute).flatMap((entry) => {
    if (entry === "node_modules" || entry === "dist" || entry === "tmp" || entry === ".git") return [];
    const next = path.join(absolute, entry);
    const relative = path.relative(root, next);
    if (statSync(next).isDirectory()) return walk(relative);
    return [relative];
  });
}

const removedLegacyRootFiles = [
  "CONVERGENCE_REPORT.md",
  "DESIGN.md",
  "IMPLEMENTATION_STATUS.md",
  "ONBOARDING_IMPLEMENTATION_LOG.md",
  "ONBOARDING_PLAN.md",
  "PRODUCT.md",
  "PRODUCTIZATION_IMPLEMENTATION_LOG.md",
  "PRODUCTIZATION_PLAN.md",
  "PRODUCT_DEVELOPMENT_PLAN.md",
  "SPEC.md",
  "SPEC_CONVERGED.md",
  "WORKBENCH_UI_AUDIT.md"
];

for (const file of removedLegacyRootFiles) {
  assert(!existsSync(path.join(root, file)), `Legacy pre-pivot root file still exists: ${file}`);
}

for (const dir of ["workbench", "dist-workbench"]) {
  assert(!existsSync(path.join(root, dir)), `Legacy workbench directory still exists: ${dir}`);
}

const requiredHarnessPaths = [
  "README.md",
  "AGENTS.md",
  "RELEASE_NOTES.md",
  "archetype-plugin-pivot-md/START_HERE.md",
  "src/cli.ts",
  "src/mcp/server.ts",
  "plugins/claude-code/.claude-plugin/plugin.json",
  "plugins/claude-code/skills/archetype/SKILL.md",
  "plugins/codex/.codex-plugin/plugin.json",
  "plugins/codex/skills/archetype/SKILL.md",
  "docs/install.md",
  "docs/demo-script.md",
  "scripts/run-cli-contract.mjs",
  "scripts/run-mcp-contract.mjs",
  "scripts/run-distribution-contract.mjs",
  "scripts/run-install-contract.mjs",
  "scripts/run-lifecycle-contract.mjs",
  "scripts/run-spec-contract.mjs"
];

for (const file of requiredHarnessPaths) {
  assert(existsSync(path.join(root, file)), `Required harness path is missing: ${file}`);
}

const packageJson = JSON.parse(readText("package.json"));
assert(packageJson.bin?.archetype, "Package must expose the archetype CLI bin.");
assert(packageJson.bin?.["archetype-mcp"], "Package must expose the archetype MCP bin.");
assert((packageJson.files ?? []).includes("plugins"), "Package must include plugin wrappers.");

const productSurfaceText = [
  readText("README.md"),
  readText("AGENTS.md"),
  readText("docs/install.md"),
  readText("docs/use-with-mcp.md"),
  readText("plugins/claude-code/skills/blueprint/SKILL.md"),
  readText("plugins/codex/skills/archetype-blueprint/SKILL.md")
].join("\n").toLowerCase();

for (const forbidden of [
  "workbench-first",
  "hosted productization",
  "productization plan",
  "onboarding plan",
  "workbench ui",
  "cloud auth",
  "hosted storage"
]) {
  assert(!productSurfaceText.includes(forbidden), `Primary product surface still mentions forbidden pivot residue: ${forbidden}`);
}

const sourceFiles = walk("src").filter((file) => file.endsWith(".ts"));
assert(sourceFiles.length > 0, "Source files must exist.");

for (const deadFile of [
  "src/llm/provider.ts",
  "src/llm/structuredOutput.ts",
  "src/llm/types.ts",
  "dist/llm/provider.js",
  "dist/llm/structuredOutput.js",
  "dist/llm/types.js"
]) {
  assert(!existsSync(path.join(root, deadFile)), `Unused LLM provider dead code still exists: ${deadFile}`);
}

console.log(JSON.stringify({
  status: "pass",
  removedLegacyRootFiles,
  requiredHarnessPaths,
  sourceFiles: sourceFiles.length
}, null, 2));
