import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "agent-role-files-contract");

const requiredRoles = [
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
  "repair-planner.md"
];

const requiredSections = ["## Authority", "## Inputs", "## Outputs", "## Blockers", "## Handoff Rules"];
const agentRoots = ["agents", path.join("plugins", "claude-code", "agents")];

rmSync(workspace, { recursive: true, force: true });
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

function validateRoleFile(relativePath) {
  assert(existsSync(path.join(root, relativePath)), `Missing agent role file: ${relativePath}`);
  const text = readText(relativePath);
  for (const section of requiredSections) {
    assert(text.includes(section), `${relativePath} missing required section ${section}.`);
  }
  assert(text.includes("No agent can approve its own work."), `${relativePath} missing self-approval ban.`);
  assert(!/may_approve["']?\s*[:=]\s*true/i.test(text), `${relativePath} allows self-approval.`);
  assert(!/approve its own work except/i.test(text), `${relativePath} weakens the self-approval rule.`);
  return text;
}

for (const agentRoot of agentRoots) {
  assert(existsSync(path.join(root, agentRoot)), `Missing agent root: ${agentRoot}`);
  for (const role of requiredRoles) {
    validateRoleFile(path.join(agentRoot, role));
  }
}

for (const role of requiredRoles) {
  const rootText = readText(path.join("agents", role));
  const claudeText = readText(path.join("plugins", "claude-code", "agents", role));
  assert(rootText === claudeText, `${role} must be mirrored between root agents and Claude Code plugin agents.`);
}

const compatibilityReviewer = validateRoleFile(path.join("agents", "frontend-contract-reviewer.md"));
assert(compatibilityReviewer.includes("Compatibility role"), "frontend-contract-reviewer.md must be marked as compatibility role.");
assert(readText(path.join("plugins", "claude-code", "agents", "frontend-contract-reviewer.md")) === compatibilityReviewer, "Compatibility reviewer must be mirrored into Claude Code plugin agents.");

const pkg = readJson("package.json");
assert(pkg.scripts?.["agent-roles:contract"], "package must expose agent-roles:contract.");
assert(pkg.scripts?.test?.includes("agent-roles:contract"), "npm test must include agent-roles:contract.");
assert(pkg.scripts?.check?.includes("agent-roles:contract"), "npm run check must include agent-roles:contract.");
assert(pkg.scripts?.clean?.includes("tmp/agent-role-files-contract"), "npm run clean must remove agent role contract output.");

const distribution = readText("scripts/run-distribution-contract.mjs");
assert(distribution.includes("scripts/run-agent-role-files-contract.mjs"), "distribution contract must include agent role contract script.");
for (const role of requiredRoles) {
  assert(distribution.includes(`agents/${role}`), `distribution contract must require agents/${role}.`);
}

const claudePlugin = readText("scripts/run-claude-plugin-contract.mjs");
for (const role of requiredRoles) {
  assert(claudePlugin.includes(role), `Claude plugin contract must require agents/${role}.`);
}

const installContract = readText("scripts/run-plugin-install-contract.mjs");
for (const role of requiredRoles) {
  assert(installContract.includes(role), `Plugin install contract must verify installed role ${role}.`);
}

const rootFiles = readdirSync(path.join(root, "agents")).filter((file) => file.endsWith(".md")).sort();
const summary = {
  status: "pass",
  requiredRoles,
  agentRoots,
  compatibilityRoles: ["frontend-contract-reviewer.md"],
  rootFiles,
  sections: requiredSections,
  rule: "No agent can approve its own work."
};

writeFileSync(path.join(workspace, "agent-role-files-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
