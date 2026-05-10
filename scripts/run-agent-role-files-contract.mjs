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

const designSystemArchitectRequirements = [
  "## Role",
  "Role ID: `design-system-architect`",
  "Role Type: Design-system contract specialist and token/component gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Design-System Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Design-System Contract",
  "## shadcn, Radix, And Tailwind Rules",
  "## Draft Preview Review Loop",
  "## Self-Review Checklist",
  "draft/design-system.draft.json",
  "draft/design-directions.json",
  "draft/design-quality-gate.json",
  "draft/design-craft-rubric.md",
  "draft/design-system-preview.html",
  "draft/design-system-review.md",
  "04-design-system/tokens/primitive-tokens.json",
  "04-design-system/tokens/semantic-tokens.json",
  "04-design-system/tokens/component-tokens.json",
  "04-design-system/tokens/token-contracts.json",
  "04-design-system/tokens/typography-system.json",
  "04-design-system/tokens/css-variables.css",
  "04-design-system/tokens/typography.css",
  "04-design-system/tokens/tailwind.config.ts",
  "04-design-system/design-quality-gate.json",
  "04-design-system/shadcn-integration.json",
  "04-design-system/components/component-contracts.json",
  "04-design-system/components/component-registry.json",
  "04-design-system/patterns/pattern-contracts.json",
  "04-design-system/accessibility/accessibility-rules.json",
  "specialist-gate/frontend-practices/design-system-practices.json",
  "No implementation agent may build product UI from the preview alone.",
  "Never ask a bulk design-system questionnaire",
  "WCAG AA",
  "CSS variables",
  "semantic tokens",
  "component states",
  "shadcn",
  "Radix",
  "Tailwind",
  "generic blue-gray SaaS",
  "untouched shadcn",
  "one-note palettes"
];
for (const agentRoot of agentRoots) {
  const designSystemArchitect = readText(path.join(agentRoot, "design-system-architect.md"));
  for (const expected of designSystemArchitectRequirements) {
    assert(designSystemArchitect.includes(expected), `${agentRoot}/design-system-architect.md missing hardened design-system-architect requirement: ${expected}.`);
  }
}

const frontendPracticeEnforcerRequirements = [
  "## Role",
  "Role ID: `frontend-practice-enforcer`",
  "Role Type: Frontend quality gate specialist and pass/fail practice enforcer.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Frontend Practice Enforcement Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Frontend Practice Contract",
  "## Practice-Specific Enforcement Matrix",
  "## Evidence Rules",
  "## Self-Review Checklist",
  "governance/frontend-practice-skills.json",
  "governance/frontend-practice-skills.md",
  "draft/specialist-review.json",
  "specialist-gate/frontend-practices/frontend-architecture.json",
  "specialist-gate/frontend-practices/react-practices.json",
  "specialist-gate/frontend-practices/typescript-strictness.json",
  "specialist-gate/frontend-practices/design-system-practices.json",
  "specialist-gate/frontend-practices/accessibility-practices.json",
  "specialist-gate/frontend-practices/forms-and-validation.json",
  "specialist-gate/frontend-practices/data-contract-practices.json",
  "specialist-gate/frontend-practices/responsive-practices.json",
  "specialist-gate/frontend-practices/performance-practices.json",
  "specialist-gate/frontend-practices/visual-polish-practices.json",
  "specialist-gate/frontend-practices/testing-practices.json",
  "frontend-architecture",
  "react-practices",
  "typescript-strictness",
  "design-system-practices",
  "accessibility-practices",
  "forms-and-validation",
  "data-contract-practices",
  "responsive-practices",
  "performance-practices",
  "visual-polish-practices",
  "testing-practices",
  "not optional recommendations",
  "pass/fail checks",
  "frontend_practice_gate",
  "marker-only",
  "user-visible behavior",
  "Never ask a bulk frontend-practice questionnaire"
];
for (const agentRoot of agentRoots) {
  const frontendPracticeEnforcer = readText(path.join(agentRoot, "frontend-practice-enforcer.md"));
  for (const expected of frontendPracticeEnforcerRequirements) {
    assert(frontendPracticeEnforcer.includes(expected), `${agentRoot}/frontend-practice-enforcer.md missing hardened frontend-practice-enforcer requirement: ${expected}.`);
  }
}

const strictTypescriptDeveloperRequirements = [
  "## Role",
  "Role ID: `strict-typescript-developer`",
  "Role Type: Strict TypeScript implementation specialist and contract-typing gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Type Safety Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Type Contract",
  "## Adapter And State Union Rules",
  "## Strictness Repair Rules",
  "## Self-Review Checklist",
  "strict: true",
  "12-target-frontend/adapter-interfaces.ts",
  "14-target-execution/target-execution-report.json",
  "06-frontend-agent-contract/data-contracts.json",
  "06-frontend-agent-contract/data-operation-contracts.json",
  "06-frontend-agent-contract/action-contracts.json",
  "06-frontend-agent-contract/form-contracts.json",
  "ArchetypeQueryResult",
  "ArchetypeMutationResult",
  "ArchetypeDataAdapter",
  "ArchetypeAuthAdapter",
  "loading",
  "default",
  "empty",
  "error",
  "permission_denied",
  "offline",
  "partial_data",
  "stale_data",
  "success_confirmation",
  "validation_error",
  "broad `any`",
  "unsafe casts",
  "unknown",
  "npm run typecheck",
  "Never ask a bulk TypeScript questionnaire"
];
for (const agentRoot of agentRoots) {
  const strictTypescriptDeveloper = readText(path.join(agentRoot, "strict-typescript-developer.md"));
  for (const expected of strictTypescriptDeveloperRequirements) {
    assert(strictTypescriptDeveloper.includes(expected), `${agentRoot}/strict-typescript-developer.md missing hardened strict-typescript-developer requirement: ${expected}.`);
  }
}

const pixelPerfectDeveloperRequirements = [
  "## Role",
  "Role ID: `pixel-perfect-developer`",
  "Role Type: Visual precision implementation specialist and screenshot-evidence gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Visual Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Visual Evidence Contract",
  "## Viewport And Screenshot Matrix",
  "## Repair Handoff Format",
  "## Self-Review Checklist",
  "04-design-system/visual-direction.md",
  "04-design-system/tokens/token-contracts.json",
  "04-design-system/tokens/typography-system.json",
  "04-design-system/components/component-contracts.json",
  "04-design-system/patterns/pattern-contracts.json",
  "04-design-system/accessibility/accessibility-rules.json",
  "05-screen-specs/*.yaml",
  "06-frontend-agent-contract/responsive-rules.json",
  "12-target-frontend/route-component-map.json",
  "14-target-execution/target-execution-report.json",
  "specialist-gate/frontend-practices/visual-polish-practices.json",
  "specialist-gate/frontend-practices/responsive-practices.json",
  "verification/playwright-verification-contract.json",
  "verification/playwright-evidence.json",
  "qa/visual-regression-report.md",
  "qa/scenario-catalog.json",
  "target:test-results/archetype-visual-smoke/",
  "ready_for_visual_verification",
  "needs_visual_repair",
  "blocked_missing_visual_evidence",
  "visual-smoke",
  "mobile, tablet, and desktop",
  "overlap",
  "clipped controls",
  "horizontal overflow",
  "hidden critical actions",
  "raw styling",
  "screenshot-backed evidence",
  "Never ask a bulk pixel-perfect questionnaire"
];
for (const agentRoot of agentRoots) {
  const pixelPerfectDeveloper = readText(path.join(agentRoot, "pixel-perfect-developer.md"));
  for (const expected of pixelPerfectDeveloperRequirements) {
    assert(pixelPerfectDeveloper.includes(expected), `${agentRoot}/pixel-perfect-developer.md missing hardened pixel-perfect-developer requirement: ${expected}.`);
  }
}

const accessibilitySpecialistRequirements = [
  "## Role",
  "Role ID: `accessibility-specialist`",
  "Role Type: Accessibility contract specialist and WCAG AA evidence gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Accessibility Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Accessibility Evidence Contract",
  "## Accessibility Matrix",
  "## Repair Handoff Format",
  "## Self-Review Checklist",
  "WCAG AA",
  "No ARIA is better than Bad ARIA",
  "native HTML semantics",
  "keyboard",
  "visible focus",
  "accessible names",
  "landmarks",
  "heading",
  "forms",
  "error associations",
  "status-announcement",
  "reduced-motion",
  "color-only",
  "chart-fallback",
  "ready_for_accessibility_verification",
  "needs_accessibility_repair",
  "blocked_missing_accessibility_evidence",
  "Never ask a bulk accessibility questionnaire",
  "04-design-system/accessibility/accessibility-rules.json",
  "04-design-system/components/component-contracts.json",
  "04-design-system/patterns/pattern-contracts.json",
  "05-screen-specs/*.yaml",
  "06-frontend-agent-contract/form-contracts.json",
  "06-frontend-agent-contract/action-contracts.json",
  "06-frontend-agent-contract/verification-contracts.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "verification/playwright-verification-contract.json",
  "verification/playwright-evidence.json",
  "specialist-gate/frontend-practices/accessibility-practices.json",
  "qa/accessibility-results.md",
  "qa/scenario-catalog.json",
  "08-quality/accessibility-report.md",
  "10-revision/repair-task-queue.json"
];
for (const agentRoot of agentRoots) {
  const accessibilitySpecialist = readText(path.join(agentRoot, "accessibility-specialist.md"));
  for (const expected of accessibilitySpecialistRequirements) {
    assert(accessibilitySpecialist.includes(expected), `${agentRoot}/accessibility-specialist.md missing hardened accessibility-specialist requirement: ${expected}.`);
  }
}

const testFirstDeveloperRequirements = [
  "## Role",
  "Role ID: `test-first-developer`",
  "Role Type: Test-first implementation specialist and red-green evidence gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Test-First Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Test Evidence Contract",
  "## Required Suite Matrix",
  "## Forbidden Test Patterns",
  "## Required Behavior Checklist",
  "## Self-Review Checklist",
  "No product UI before tests.",
  "red_phase_required",
  "green_phase_required",
  "Marker-only tests fail the verifier.",
  "ready_for_implementation_after_red",
  "needs_test_repair",
  "blocked_untestable_contract",
  "Never ask a bulk test-first questionnaire",
  "test-first/test-first-contract.json",
  "test-first/test-first-plan.md",
  "test-first/test-quality-standard.json",
  "test-first/playwright-contract.spec.ts",
  "test-first/vitest-contract.spec.ts",
  "test-results/initial-red-test-run.md",
  "verification/playwright-verification-contract.json",
  "verification/playwright-evidence.json",
  "03-experience-architecture/route-map.json",
  "05-screen-specs/*.yaml",
  "06-frontend-agent-contract/verification-contracts.json",
  "12-target-frontend/source-file-manifest.json",
  "12-target-frontend/codegen-tasks.json",
  "14-target-execution/target-execution-report.json",
  "qa/scenario-catalog.json",
  "10-revision/repair-task-queue.json",
  "tests/e2e/archetype-route-smoke.spec.ts",
  "tests/e2e/archetype-user-flows.spec.ts",
  "tests/ui/archetype-screen-states.spec.ts",
  "tests/e2e/archetype-accessibility.spec.ts",
  "tests/integration/archetype-contracts.spec.ts",
  "tests/unit/archetype-components.spec.ts",
  "smoke",
  "e2e",
  "ui",
  "accessibility",
  "integration",
  "unit",
  "malformed data",
  "permission mismatches",
  "Visual evidence covers desktop, tablet, and mobile"
];
for (const agentRoot of agentRoots) {
  const testFirstDeveloper = readText(path.join(agentRoot, "test-first-developer.md"));
  for (const expected of testFirstDeveloperRequirements) {
    assert(testFirstDeveloper.includes(expected), `${agentRoot}/test-first-developer.md missing hardened test-first-developer requirement: ${expected}.`);
  }
}

const contractVerifierRequirements = [
  "## Role",
  "Role ID: `contract-verifier`",
  "Role Type: Independent lifecycle verifier and completion-readiness gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Verification Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Verification Evidence Contract",
  "## Reconciliation Matrix",
  "## Self-Review Checklist",
  "ready_for_completion",
  "blocked_missing_evidence",
  "blocked_inconsistent_evidence",
  "blocked_unresolved_repair",
  "blocked_unapproved_implementation",
  "needs_repair_or_revision",
  "archetype_validate_package",
  "archetype_verify_target",
  "lifecycle/execution-state.json",
  "lifecycle/final-readiness-report.md",
  "lifecycle/approval-decision.json",
  "governance/non-negotiable-principles.json",
  "governance/convergence-standard.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "test-results/initial-red-test-run.md",
  "verification/playwright-verification-contract.json",
  "verification/playwright-evidence.json",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "qa/accessibility-results.md",
  "qa/visual-regression-report.md",
  "qa/contract-drift-report.md",
  "14-target-execution/target-execution-report.json",
  "10-revision/repair-task-queue.json",
  "10-revision/drift-report.json",
  "implementation_authorized",
  "14-target-execution/target-execution-report.json.status",
  "verification/playwright-evidence.json.status",
  "10-revision/repair-task-queue.json.task_count",
  "No agent can approve its own work.",
  "This role cannot verify artifacts it authored or repaired."
];
for (const agentRoot of agentRoots) {
  const contractVerifier = readText(path.join(agentRoot, "contract-verifier.md"));
  for (const expected of contractVerifierRequirements) {
    assert(contractVerifier.includes(expected), `${agentRoot}/contract-verifier.md missing hardened contract-verifier requirement: ${expected}.`);
  }
}

const repairPlannerRequirements = [
  "## Role",
  "Role ID: `repair-planner`",
  "Role Type: Implementation repair coordinator and drift-to-task gatekeeper.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Repair Sufficiency Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Repair Task Contract",
  "## Priority Matrix",
  "## Owner Matrix",
  "## Self-Review Checklist",
  "ready_for_repair_execution",
  "needs_repair_execution",
  "ready_for_reverification",
  "blocked_missing_repair_evidence",
  "blocked_contract_revision_without_approval",
  "patch_implementation_first",
  "10-revision/verification-repair-contract.json",
  "10-revision/repair-task-queue.json",
  "10-revision/repair-plan.md",
  "10-revision/drift-report.json",
  "verification/playwright-evidence.json",
  "verification/playwright-evidence.md",
  "14-target-execution/target-execution-report.json",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "qa/malformed-data-results.json",
  "qa/accessibility-results.md",
  "qa/visual-regression-report.md",
  "qa/contract-drift-report.md",
  "target:test-results/archetype-playwright-results.json",
  "target:playwright-report/",
  "target:test-results/**/*.zip",
  "archetype_verify_target",
  "archetype_plan_repair",
  "implementation_patch",
  "contract_revision_review",
  "blocked_missing_evidence",
  "marker_only_test_drift",
  "source_artifacts",
  "target_files",
  "expected_fix",
  "forbidden_fixes",
  "rerun_commands",
  "closure_evidence",
  "npm run typecheck",
  "npm run build",
  "npm run archetype:playwright",
  "archetype repair --out <archetype-output> --target <target-frontend> --json",
  "archetype verify-target --out <archetype-output> --target <target-frontend> --json",
  "No agent can approve its own work.",
  "This role cannot close or verify repair tasks it planned."
];
for (const agentRoot of agentRoots) {
  const repairPlanner = readText(path.join(agentRoot, "repair-planner.md"));
  for (const expected of repairPlannerRequirements) {
    assert(repairPlanner.includes(expected), `${agentRoot}/repair-planner.md missing hardened repair-planner requirement: ${expected}.`);
  }
}

const compatibilityReviewer = validateRoleFile(path.join("agents", "frontend-contract-reviewer.md"));
assert(compatibilityReviewer.includes("Compatibility role"), "frontend-contract-reviewer.md must be marked as compatibility role.");
assert(readText(path.join("plugins", "claude-code", "agents", "frontend-contract-reviewer.md")) === compatibilityReviewer, "Compatibility reviewer must be mirrored into Claude Code plugin agents.");
const compatibilityReviewerRequirements = [
  "## Role",
  "Role ID: `frontend-contract-reviewer`",
  "Role Type: Compatibility frontend contract preflight reviewer and implementation-guesswork blocker.",
  "Does Not Own",
  "Success Condition",
  "## Mission",
  "## Production Standard",
  "## Operating Procedure",
  "## Compatibility Contract Review Gate",
  "## One-Question Clarification Priority",
  "## Output Schema",
  "## Decision Rules",
  "## Required Frontend Contract Evidence Contract",
  "## Review Matrix",
  "## Failure Routing Matrix",
  "## Self-Review Checklist",
  "frontend_contract_review_ready_for_contract_verifier",
  "frontend_contract_review_needs_revision",
  "frontend_contract_review_blocked_missing_evidence",
  "frontend_contract_review_blocked_draft_used_as_canonical",
  "frontend_contract_review_blocked_unverifiable_criteria",
  "frontend_contract_review_blocked_specialist_gate",
  "Compatibility does not mean weaker governance.",
  "This role can review and route, but it cannot approve contracts it reviewed.",
  "Missing evidence that would force implementation guessing is a blocker.",
  "Draft artifacts remain drafts until approval state and readiness tiers authorize implementation.",
  "Tests must prove user-visible behavior, not generated markers alone.",
  "draft/frontend-contract.draft.json",
  "draft/specialist-review.json",
  "draft/assumption-ledger.md",
  "draft/design-quality-gate.json",
  "draft/design-system-preview.html",
  "lifecycle/approval-decision.json",
  "lifecycle/readiness-tiers.json",
  "governance/frontend-practice-skills.json",
  "governance/forbidden-behaviors.json",
  "spec/archetype-spec.json",
  "implementation-contract.md",
  "03-experience-architecture/route-map.json",
  "03-experience-architecture/screen-inventory.json",
  "03-experience-architecture/ux-flow-state-completeness.json",
  "04-design-system/tokens/token-contracts.json",
  "04-design-system/design-quality-gate.json",
  "04-design-system/shadcn-integration.json",
  "04-design-system/components/component-contracts.json",
  "04-design-system/accessibility/accessibility-rules.json",
  "05-screen-specs/*.yaml",
  "06-frontend-agent-contract/verification-contracts.json",
  "06-frontend-agent-contract/data-operation-contracts.json",
  "06-frontend-agent-contract/form-contracts.json",
  "06-frontend-agent-contract/action-contracts.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "verification/playwright-verification-contract.json",
  "qa/scenario-catalog.json",
  "10-revision/repair-task-queue.json",
  "archetype_validate_package",
  "archetype_summarize_package",
  "archetype_read_artifact",
  "archetype_verify_target",
  "contract-verifier.md",
  "repair-planner.md",
  "test-first-developer.md",
  "qa-lead.md",
  "No agent can approve its own work.",
  "This compatibility role cannot approve contracts it reviewed."
];
for (const expected of compatibilityReviewerRequirements) {
  assert(compatibilityReviewer.includes(expected), `agents/frontend-contract-reviewer.md missing hardened compatibility requirement: ${expected}.`);
}

const pkg = readJson("package.json");
assert(pkg.scripts?.["agent-roles:contract"], "package must expose agent-roles:contract.");
assert(pkg.scripts?.test?.includes("agent-roles:contract") || pkg.scripts?.test?.includes("run-contract-suite.mjs full"), "npm test must include agent role coverage.");
assert(pkg.scripts?.check?.includes("agent-roles:contract") || pkg.scripts?.check?.includes("run-contract-suite.mjs full"), "npm run check must include agent role coverage.");
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
  designSystemArchitectRequirements,
  frontendPracticeEnforcerRequirements,
  strictTypescriptDeveloperRequirements,
  pixelPerfectDeveloperRequirements,
  accessibilitySpecialistRequirements,
  testFirstDeveloperRequirements,
  contractVerifierRequirements,
  repairPlannerRequirements,
  rule: "No agent can approve its own work."
};

writeFileSync(path.join(workspace, "agent-role-files-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
