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

const productArchitectRequirements = [
  "## Role",
  "Role ID: `product-architect`",
  "Role Type: Product-context specialist and context-sufficiency gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Context Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Self-Review Checklist",
  "lifecycle/context-completion.json",
  "lifecycle/context-matrix.json",
  "lifecycle/readiness-tiers.json",
  "archetype_answer_clarification",
  "confirmed_facts",
  "candidate_assumptions",
  "missing_inputs",
  "scope_boundaries",
  "Never ask a grouped form",
  "Weak context means the next artifact would depend on unapproved invention"
];
for (const agentRoot of agentRoots) {
  const productArchitect = readText(path.join(agentRoot, "product-architect.md"));
  for (const expected of productArchitectRequirements) {
    assert(productArchitect.includes(expected), `${agentRoot}/product-architect.md missing hardened product-architect requirement: ${expected}.`);
  }
}

const experienceArchitectRequirements = [
  "## Role",
  "Role ID: `experience-architect`",
  "Role Type: UX architecture specialist and flow/state completeness gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Experience Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required State Contract",
  "## Self-Review Checklist",
  "03-experience-architecture/flow-specs.json",
  "03-experience-architecture/route-map.json",
  "03-experience-architecture/screen-inventory.json",
  "03-experience-architecture/ux-flow-state-completeness.json",
  "05-screen-specs/*.yaml",
  "default",
  "loading",
  "empty",
  "error",
  "permission_denied",
  "offline",
  "partial_data",
  "stale_data",
  "filtered_empty",
  "validation_error",
  "success_confirmation",
  "Never ask a bulk UX questionnaire"
];
for (const agentRoot of agentRoots) {
  const experienceArchitect = readText(path.join(agentRoot, "experience-architect.md"));
  for (const expected of experienceArchitectRequirements) {
    assert(experienceArchitect.includes(expected), `${agentRoot}/experience-architect.md missing hardened experience-architect requirement: ${expected}.`);
  }
}

const frontendArchitectRequirements = [
  "## Role",
  "Role ID: `frontend-architect`",
  "Role Type: Target frontend architecture specialist and source-manifest gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Frontend Architecture Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Target Source Contract",
  "## Test-First Integration",
  "## Production Integration Boundary",
  "## Self-Review Checklist",
  "lifecycle/approval-decision.json",
  "12-target-frontend/source-file-manifest.json",
  "12-target-frontend/route-component-map.json",
  "12-target-frontend/codegen-tasks.json",
  "12-target-frontend/adapter-interfaces.ts",
  "12-target-frontend/source-generation-runbook.md",
  "06-frontend-agent-contract/data-operation-contracts.json",
  "06-frontend-agent-contract/action-contracts.json",
  "06-frontend-agent-contract/form-contracts.json",
  "06-frontend-agent-contract/production-integration-contracts.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "verification/playwright-verification-contract.json",
  "No product UI before tests.",
  "Never ask a bulk frontend architecture questionnaire",
  "Do not invent backend behavior",
  "ready_for_test_authoring",
  "ready_for_implementation_architecture"
];
for (const agentRoot of agentRoots) {
  const frontendArchitect = readText(path.join(agentRoot, "frontend-architect.md"));
  for (const expected of frontendArchitectRequirements) {
    assert(frontendArchitect.includes(expected), `${agentRoot}/frontend-architect.md missing hardened frontend-architect requirement: ${expected}.`);
  }
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
  productArchitectRequirements,
  experienceArchitectRequirements,
  frontendArchitectRequirements,
  rule: "No agent can approve its own work."
};

writeFileSync(path.join(workspace, "agent-role-files-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
