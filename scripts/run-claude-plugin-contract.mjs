import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginDir = path.join(root, "plugins", "claude-code");
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
  "commands/archetype.md",
  "skills/archetype/SKILL.md",
  "skills/blueprint/SKILL.md",
  "skills/implement/SKILL.md",
  "skills/verify/SKILL.md",
  "skills/revise/SKILL.md",
  ...requiredAgentRoles.map((role) => `agents/${role}`),
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
assert(mcp.mcpServers?.archetype?.command === "npx", "Claude plugin MCP config must use npx for package execution.");
assert(mcp.mcpServers.archetype.args.includes("github:NikolaCehic/Archetype"), "Claude plugin MCP config must use the GitHub package source until npm publish.");
assert(mcp.mcpServers.archetype.args.includes("archetype-mcp"), "Claude plugin MCP config must launch archetype-mcp.");

const frontDoor = readText("skills/archetype/SKILL.md");
for (const expected of ["project idea", "Self-Contained Pipeline", "archetype_release_doctor", "archetype_create_intake", "archetype_answer_clarification", "materials", "Ask exactly one", "lifecycle/clarification-turn.json", "draft_contract", "draft/design-system-preview.html", "draft/frontend-contract.draft.json", "human approval", "Do not require the user", "tests first", "Do not end by telling the user what to tell Claude Code next"]) {
  assert(frontDoor.includes(expected), `Claude front-door skill missing ${expected}.`);
}
assert(!frontDoor.includes("Ask at most six"), "Claude front-door skill must not ask grouped clarification questions.");
assert(frontDoor.includes("spec/archetype-spec.json"), "Claude front-door skill must read the canonical spec.");
assert(frontDoor.includes("test-first/test-first-contract.json"), "Claude front-door skill must read the test-first contract.");
assert(frontDoor.includes("test-first/test-quality-standard.json"), "Claude front-door skill must read the test quality standard.");
assert(frontDoor.includes("governance/forbidden-behaviors.json"), "Claude front-door skill must read the forbidden behavior contract.");
assert(frontDoor.includes("lifecycle/approval-decision.json"), "Claude front-door skill must read the approval decision.");
assert(frontDoor.includes("lifecycle/final-readiness-report.md"), "Claude front-door skill must read the final readiness report.");
assert(frontDoor.includes("verification/playwright-verification-contract.json"), "Claude front-door skill must read the Playwright verification contract.");
assert(frontDoor.includes("verification/playwright-evidence.json"), "Claude front-door skill must inspect Playwright evidence.");
assert(!frontDoor.includes("Ask me what is missing, then build and verify"), "Claude front-door skill must not require prompt choreography.");

const slashCommand = readText("commands/archetype.md");
for (const expected of ["description:", "$ARGUMENTS", "archetype.intake.json", "archetype-output", "draft_contract", "approval or edits", "test-first contract", "Playwright", "Do not ask the user to run"]) {
  assert(slashCommand.includes(expected), `Claude /archetype command missing ${expected}.`);
}

const blueprint = readText("skills/blueprint/SKILL.md");
for (const expected of ["archetype_create_intake", "archetype_generate_package", "archetype_summarize_package", "archetype_read_artifact", "npx --yes --package github:NikolaCehic/Archetype"]) {
  assert(blueprint.includes(expected), `Blueprint skill missing ${expected}.`);
}

const implement = readText("skills/implement/SKILL.md");
for (const expected of ["lifecycle/approval-decision.json", "reviews/specialist-review-summary.md", "spec/archetype-spec.json", "test-first/test-first-contract.json", "test-first/test-quality-standard.json", "governance/forbidden-behaviors.json", "test-results/initial-red-test-run.md", "implementation-contract.md", "experience/route-map.json", "screens/screen-inventory.json", "design-system/tokens.json", "frontend-agent-contract/implementation-rules.json"]) {
  assert(implement.includes(expected), `Implement skill missing ${expected}.`);
}
assert(implement.includes("Preserve the initial red test result"), "Claude implement skill must enforce red-first TDD.");

const verify = readText("skills/verify/SKILL.md");
for (const expected of ["archetype_validate_package", "archetype_verify_target", "archetype_plan_repair", "skipInstall: false", "verify-target", "test-first/test-quality-standard.json", "governance/forbidden-behaviors.json", "verification/playwright-verification-contract.json", "verification/playwright-evidence.json", "10-revision/repair-task-queue.json", "visual-smoke", "marker-only tests fail"]) {
  assert(verify.includes(expected), `Verify skill missing ${expected}.`);
}

const revise = readText("skills/revise/SKILL.md");
for (const expected of ["archetype.intake.json", "archetype_generate_package", "archetype_summarize_package", "archetype_plan_repair", "10-revision/repair-task-queue.json"]) {
  assert(revise.includes(expected), `Revise skill missing ${expected}.`);
}

const productArchitect = readText("agents/product-architect.md");
assert(productArchitect.includes("archetype_create_intake"), "Product architect must reference intake creation.");
assert(productArchitect.includes("missing inputs"), "Product architect must surface missing inputs.");
for (const expected of [
  "## Role",
  "Role ID: `product-architect`",
  "Role Type: Product-context specialist and context-sufficiency gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Operating Procedure",
  "## Context Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "lifecycle/context-matrix.json",
  "archetype_answer_clarification",
  "confirmed_facts",
  "candidate_assumptions",
  "missing_inputs",
  "scope_boundaries",
  "Never ask a grouped form"
]) {
  assert(productArchitect.includes(expected), `Product architect missing hardened requirement ${expected}.`);
}

const experienceArchitect = readText("agents/experience-architect.md");
for (const expected of [
  "## Role",
  "Role ID: `experience-architect`",
  "Role Type: UX architecture specialist and flow/state completeness gatekeeper.",
  "## Operating Procedure",
  "## Experience Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Required State Contract",
  "03-experience-architecture/flow-specs.json",
  "03-experience-architecture/route-map.json",
  "03-experience-architecture/screen-inventory.json",
  "03-experience-architecture/ux-flow-state-completeness.json",
  "permission_denied",
  "partial_data",
  "stale_data",
  "validation_error",
  "success_confirmation",
  "Never ask a bulk UX questionnaire"
]) {
  assert(experienceArchitect.includes(expected), `Experience architect missing hardened requirement ${expected}.`);
}

const frontendArchitect = readText("agents/frontend-architect.md");
for (const expected of [
  "## Role",
  "Role ID: `frontend-architect`",
  "Role Type: Target frontend architecture specialist and source-manifest gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Operating Procedure",
  "## Frontend Architecture Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Required Target Source Contract",
  "## Test-First Integration",
  "## Production Integration Boundary",
  "lifecycle/approval-decision.json",
  "12-target-frontend/source-file-manifest.json",
  "12-target-frontend/route-component-map.json",
  "12-target-frontend/codegen-tasks.json",
  "12-target-frontend/adapter-interfaces.ts",
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
]) {
  assert(frontendArchitect.includes(expected), `Frontend architect missing hardened requirement ${expected}.`);
}

const designSystemArchitect = readText("agents/design-system-architect.md");
for (const expected of [
  "## Role",
  "Role ID: `design-system-architect`",
  "Role Type: Design-system contract specialist and token/component gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Operating Procedure",
  "## Design-System Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Required Design-System Contract",
  "## shadcn, Radix, And Tailwind Rules",
  "## Draft Preview Review Loop",
  "draft/design-system.draft.json",
  "draft/design-system-preview.html",
  "draft/design-system-review.md",
  "04-design-system/tokens/token-contracts.json",
  "04-design-system/tokens/typography-system.json",
  "04-design-system/tokens/css-variables.css",
  "04-design-system/tokens/tailwind.config.ts",
  "04-design-system/components/component-contracts.json",
  "04-design-system/patterns/pattern-contracts.json",
  "04-design-system/accessibility/accessibility-rules.json",
  "specialist-gate/frontend-practices/design-system-practices.json",
  "No implementation agent may build product UI from the preview alone.",
  "Never ask a bulk design-system questionnaire",
  "WCAG AA",
  "CSS variables",
  "semantic tokens",
  "shadcn",
  "Radix",
  "Tailwind",
  "one-note palettes"
]) {
  assert(designSystemArchitect.includes(expected), `Design-system architect missing hardened requirement ${expected}.`);
}

const reviewer = readText("agents/frontend-contract-reviewer.md");
for (const expected of ["missing evidence", "acceptance criteria", "archetype_validate_package"]) {
  assert(reviewer.toLowerCase().includes(expected), `Frontend contract reviewer missing ${expected}.`);
}

for (const role of requiredAgentRoles) {
  const text = readText(`agents/${role}`);
  for (const expected of ["## Authority", "## Inputs", "## Outputs", "## Blockers", "## Handoff Rules", "No agent can approve its own work."]) {
    assert(text.includes(expected), `Claude agent ${role} missing ${expected}.`);
  }
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
  agents: requiredAgentRoles.map((role) => role.replace(/\.md$/, ""))
}, null, 2));
