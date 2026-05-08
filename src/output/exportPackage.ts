import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prepareGeneratedOutputDirectory } from "../safety/pathSafety";
import type { ArchetypePackage } from "../core/types";
import { buildConvergenceStandardArtifact, convergenceStandardMarkdown } from "../modules/convergenceStandard";
import { designSystemPreviewHtml, designSystemReviewMarkdown } from "../modules/designSystemPreview";
import { buildEvidenceDecisionModelArtifact, evidenceDecisionModelMarkdown } from "../modules/evidenceDecisionModel";
import { buildForbiddenBehaviorAcceptanceArtifact, forbiddenBehaviorAcceptanceMarkdown } from "../modules/forbiddenBehaviorAcceptance";
import { buildFrontendPracticeSkillsArtifact, frontendPracticeSkillOutput, frontendPracticeSkillsMarkdown, FRONTEND_PRACTICE_SKILLS } from "../modules/frontendPracticeSkills";
import { buildImplementationPhasesArtifact, implementationPhasesMarkdown } from "../modules/implementationPhases";
import { buildContractDraftArtifacts } from "../modules/lifecycleContractStates";
import { buildLifecycleExecutionStateArtifacts } from "../modules/lifecycleExecutionStates";
import { missingContextMarkdown } from "../modules/lifecycleIntakeStates";
import { buildNonNegotiablePrinciplesArtifact, nonNegotiablePrinciplesMarkdown } from "../modules/nonNegotiablePrinciples";
import { buildPendingQaArtifacts, REQUIRED_QA_ARTIFACTS } from "../modules/qaTeam";
import { buildPackageReadinessTiersArtifact, readinessTiersMarkdown } from "../modules/readinessTiers";
import { buildTestQualityStandardArtifact, testQualityStandardMarkdown } from "../modules/testQualityStandard";
import {
  approvalDecisionArtifact,
  approvalRequestMarkdown,
  finalReadinessReportMarkdown,
  initialRedTestRunMarkdown,
  specialistReviewSummaryMarkdown
} from "../modules/requiredPackageArtifacts";

function ensureDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(outDir: string, relativePath: string, value: unknown): void {
  const target = path.join(outDir, relativePath);
  ensureDir(target);
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(outDir: string, relativePath: string, value: string): void {
  const target = path.join(outDir, relativePath);
  ensureDir(target);
  writeFileSync(target, `${value.trimEnd()}\n`);
}

function scalarToYaml(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const text = String(value);
  if (text === "" || /[:#\n{}\[\],&*?|-]/.test(text)) return JSON.stringify(text);
  return text;
}

function toYaml(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return `${pad}- ${toYaml(item, indent + 2).trimStart()}`;
        }
        return `${pad}- ${scalarToYaml(item)}`;
      })
      .join("\n");
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, item]) => {
        if (typeof item === "object" && item !== null) {
          return `${pad}${key}:\n${toYaml(item, indent + 2)}`;
        }
        return `${pad}${key}: ${scalarToYaml(item)}`;
      })
      .join("\n");
  }
  return `${pad}${scalarToYaml(value)}`;
}

function listMarkdown(title: string, values: Array<string | { claim?: string; decision?: string; id?: string }>): string {
  const lines = [`# ${title}`, ""];
  if (values.length === 0) return `${lines.join("\n")}None.`;
  for (const value of values) {
    if (typeof value === "string") {
      lines.push(`- ${value}`);
    } else {
      lines.push(`- ${value.id ? `${value.id}: ` : ""}${value.claim ?? value.decision ?? "No description"}`);
    }
  }
  return lines.join("\n");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function linesForList(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- None."];
}

function productName(pkg: ArchetypePackage): string {
  return String(pkg.product.productModel.product_name ?? pkg.manifest.project_slug);
}

function buildTopLevelManifest(pkg: ArchetypePackage): Record<string, unknown> {
  const artifacts = [
    { id: "package-readme", path: "README.md", type: "markdown", required: true },
    { id: "agent-instructions", path: "AGENTS.md", type: "markdown", required: true },
    { id: "claude-instructions", path: "CLAUDE.md", type: "markdown", required: true },
    { id: "manifest", path: "manifest.json", type: "json", required: true },
    { id: "evidence-ledger", path: "01-evidence/evidence-ledger.json", type: "json", required: true },
    { id: "missing-context", path: "01-evidence/missing-context.md", type: "markdown", required: true },
    { id: "canonical-spec", path: "spec/archetype-spec.md", type: "markdown", required: true },
    { id: "canonical-spec-json", path: "spec/archetype-spec.json", type: "json", required: true },
    { id: "test-first-contract", path: "test-first/test-first-contract.json", type: "json", required: true },
    { id: "test-first-plan", path: "test-first/test-first-plan.md", type: "markdown", required: true },
    { id: "test-quality-standard", path: "test-first/test-quality-standard.json", type: "json", required: true },
    { id: "test-quality-standard-report", path: "test-first/test-quality-standard.md", type: "markdown", required: true },
    { id: "initial-red-test-run", path: "test-results/initial-red-test-run.md", type: "markdown", required: true },
    { id: "test-first-playwright-template", path: "test-first/playwright-contract.spec.ts", type: "text", required: true },
    { id: "test-first-vitest-template", path: "test-first/vitest-contract.spec.ts", type: "text", required: true },
    { id: "playwright-verification-contract", path: "verification/playwright-verification-contract.json", type: "json", required: true },
    { id: "playwright-verification-plan", path: "verification/playwright-verification-plan.md", type: "markdown", required: true },
    { id: "playwright-config-template", path: "verification/playwright.config.ts", type: "text", required: true },
    { id: "playwright-verification-spec", path: "verification/playwright-verification.spec.ts", type: "text", required: true },
    { id: "playwright-evidence", path: "verification/playwright-evidence.json", type: "json", required: true },
    { id: "playwright-evidence-report", path: "verification/playwright-evidence.md", type: "markdown", required: true },
    { id: "qa-scenario-catalog", path: "qa/scenario-catalog.json", type: "json", required: true },
    { id: "qa-playwright-results", path: "qa/playwright-results.json", type: "json", required: true },
    { id: "qa-malformed-data-results", path: "qa/malformed-data-results.json", type: "json", required: true },
    { id: "qa-accessibility-results", path: "qa/accessibility-results.md", type: "markdown", required: true },
    { id: "qa-visual-regression-report", path: "qa/visual-regression-report.md", type: "markdown", required: true },
    { id: "qa-contract-drift-report", path: "qa/contract-drift-report.md", type: "markdown", required: true },
    { id: "verification-repair-contract", path: "10-revision/verification-repair-contract.json", type: "json", required: true },
    { id: "repair-task-queue", path: "10-revision/repair-task-queue.json", type: "json", required: true },
    { id: "repair-plan", path: "10-revision/repair-plan.md", type: "markdown", required: true },
    { id: "drift-report", path: "10-revision/drift-report.json", type: "json", required: true },
    { id: "drift-report-markdown", path: "10-revision/drift-report.md", type: "markdown", required: true },
    { id: "implementation-contract", path: "implementation-contract.md", type: "markdown", required: true },
    { id: "verification-plan", path: "verification-plan.md", type: "markdown", required: true },
    { id: "readiness-report", path: "readiness-report.md", type: "markdown", required: true },
    { id: "lifecycle-state-machine", path: "lifecycle/state-machine.json", type: "json", required: true },
    { id: "start-request", path: "lifecycle/start-request.json", type: "json", required: true },
    { id: "context-completion", path: "lifecycle/context-completion.json", type: "json", required: true },
    { id: "context-matrix", path: "lifecycle/context-matrix.json", type: "json", required: true },
    { id: "readiness-tiers", path: "lifecycle/readiness-tiers.json", type: "json", required: true },
    { id: "readiness-tiers-report", path: "lifecycle/readiness-tiers.md", type: "markdown", required: true },
    { id: "implementation-phases", path: "lifecycle/implementation-phases.json", type: "json", required: true },
    { id: "implementation-phases-report", path: "lifecycle/implementation-phases.md", type: "markdown", required: true },
    { id: "clarification-turn", path: "lifecycle/clarification-turn.json", type: "json", required: true },
    { id: "clarification-turn-report", path: "lifecycle/clarification-turn.md", type: "markdown", required: true },
    { id: "clarification-state", path: "lifecycle/clarification-state.json", type: "json", required: true },
    { id: "clarification-transcript", path: "lifecycle/clarification-transcript.md", type: "markdown", required: true },
    { id: "approval-request", path: "lifecycle/approval-request.md", type: "markdown", required: true },
    { id: "approval-decision", path: "lifecycle/approval-decision.json", type: "json", required: true },
    { id: "clarification-questions", path: "lifecycle/clarification-questions.json", type: "json", required: true },
    { id: "lifecycle-report", path: "lifecycle/lifecycle-report.md", type: "markdown", required: true },
    { id: "final-readiness-report", path: "lifecycle/final-readiness-report.md", type: "markdown", required: true },
    { id: "lifecycle-contract-state", path: "lifecycle/contract-state.json", type: "json", required: true },
    { id: "lifecycle-execution-state", path: "lifecycle/execution-state.json", type: "json", required: true },
    { id: "lifecycle-execution-state-report", path: "lifecycle/execution-state.md", type: "markdown", required: true },
    { id: "product-model-draft", path: "draft/product-model.draft.json", type: "json", required: true },
    { id: "experience-architecture-draft", path: "draft/experience-architecture.draft.json", type: "json", required: true },
    { id: "design-system-draft", path: "draft/design-system.draft.json", type: "json", required: true },
    { id: "design-system-preview", path: "draft/design-system-preview.html", type: "html", required: true },
    { id: "design-system-review", path: "draft/design-system-review.md", type: "markdown", required: true },
    { id: "frontend-contract-draft", path: "draft/frontend-contract.draft.json", type: "json", required: true },
    { id: "assumption-ledger", path: "draft/assumption-ledger.md", type: "markdown", required: true },
    { id: "specialist-review", path: "draft/specialist-review.json", type: "json", required: true },
    { id: "specialist-review-summary", path: "reviews/specialist-review-summary.md", type: "markdown", required: true },
    { id: "contract-approval-request", path: "draft/contract-approval-request.json", type: "json", required: true },
    { id: "non-negotiable-principles", path: "governance/non-negotiable-principles.json", type: "json", required: true },
    { id: "non-negotiable-principles-report", path: "governance/non-negotiable-principles.md", type: "markdown", required: true },
    { id: "evidence-decision-model", path: "governance/evidence-decision-model.json", type: "json", required: true },
    { id: "evidence-decision-model-report", path: "governance/evidence-decision-model.md", type: "markdown", required: true },
    { id: "forbidden-behaviors", path: "governance/forbidden-behaviors.json", type: "json", required: true },
    { id: "forbidden-behaviors-report", path: "governance/forbidden-behaviors.md", type: "markdown", required: true },
    { id: "convergence-standard", path: "governance/convergence-standard.json", type: "json", required: true },
    { id: "convergence-standard-report", path: "governance/convergence-standard.md", type: "markdown", required: true },
    { id: "frontend-practice-skills", path: "governance/frontend-practice-skills.json", type: "json", required: true },
    { id: "frontend-practice-skills-report", path: "governance/frontend-practice-skills.md", type: "markdown", required: true },
    ...FRONTEND_PRACTICE_SKILLS.map((skill) => ({
      id: `frontend-practice-${skill.id}`,
      path: skill.output_artifact,
      type: "json" as const,
      required: true
    })),
    { id: "product-model", path: "product/product-model.json", type: "json", required: true },
    { id: "user-roles", path: "product/user-roles.json", type: "json", required: true },
    { id: "route-map", path: "experience/route-map.json", type: "json", required: true },
    { id: "user-flows", path: "experience/user-flows.json", type: "json", required: true },
    { id: "design-tokens", path: "design-system/tokens.json", type: "json", required: true },
    { id: "component-contracts", path: "design-system/component-contracts.json", type: "json", required: true },
    { id: "screen-inventory", path: "screens/screen-inventory.json", type: "json", required: true },
    { id: "screen-specs", path: "screens/screen-specs.json", type: "json", required: true },
    { id: "frontend-agent-instructions", path: "frontend-agent-contract/frontend-agent-instructions.md", type: "markdown", required: true },
    { id: "acceptance-criteria", path: "frontend-agent-contract/acceptance-criteria.json", type: "json", required: true },
    { id: "implementation-rules", path: "frontend-agent-contract/implementation-rules.json", type: "json", required: true },
    { id: "package-validation", path: "validation/package-validation.json", type: "json", required: true },
    { id: "simulation-report", path: "validation/simulation-report.md", type: "markdown", required: true }
  ];

  return {
    schemaVersion: "0.1.0",
    generatedAt: pkg.manifest.generated_at,
    productName: productName(pkg),
    readinessScore: pkg.quality.readiness.score,
    readinessTier: pkg.manifest.readiness_tier,
    readyForFrontendAgent: pkg.quality.readiness.readyForFrontendAgent,
    implementationAuthorized: pkg.manifest.implementation_authorized,
    contractApproval: pkg.manifest.contract_approval,
    readinessEvidence: pkg.manifest.readiness_evidence,
    compilerPhases: pkg.manifest.compiler_phases ?? [],
    blockers: pkg.quality.readiness.blockers,
    warnings: pkg.quality.readiness.warnings,
    artifacts
  };
}

function buildPackageReadme(pkg: ArchetypePackage): string {
  return [
    `# ${productName(pkg)} Archetype Package`,
    "",
    "This folder is a frontend implementation contract for AI coding agents.",
    "",
    "## Start Here",
    "",
    "1. Read `spec/archetype-spec.md`.",
    "2. Read `spec/archetype-spec.json` for machine-readable source of truth.",
    "3. Read `test-first/test-first-contract.json`.",
    "4. Read `test-first/test-quality-standard.json`.",
    "5. Read `test-results/initial-red-test-run.md`.",
    "6. Read `verification/playwright-verification-contract.json`.",
    "7. Read `10-revision/repair-task-queue.json` before deciding whether to patch or revise.",
    "8. Create the required tests before product UI implementation.",
    "9. Read `implementation-contract.md`.",
    "10. Read `lifecycle/approval-decision.json` and `reviews/specialist-review-summary.md`.",
    "11. Read `AGENTS.md` or `CLAUDE.md` depending on the agent host.",
    "12. Read `lifecycle/lifecycle-report.md` to understand the current lifecycle state.",
    "13. Read `lifecycle/readiness-tiers.json` before interpreting readiness.",
    "14. Read `lifecycle/execution-state.json` before test authoring, implementation, QA, repair, or completion claims.",
    "15. Read `lifecycle/implementation-phases.json` before moving between test, implementation, QA, repair, and regression phases.",
    "16. Read `qa/scenario-catalog.json` and QA result artifacts before completion claims.",
    "17. Read route, screen, and design-system artifacts before implementation.",
    "18. Read `governance/non-negotiable-principles.json` before implementation.",
    "19. Read `governance/evidence-decision-model.json` before treating claims as canonical.",
    "20. Read `governance/forbidden-behaviors.json` before implementation and completion claims.",
    "21. Read `governance/convergence-standard.json` before claiming the lifecycle is hardened.",
    "22. Run the checks in `verification-plan.md` before declaring completion.",
    "",
    "## Readiness",
    "",
    `- Score: ${pkg.quality.readiness.score}`,
    `- Tier: ${pkg.manifest.readiness_tier}`,
    `- Ready for frontend agent: ${pkg.quality.readiness.readyForFrontendAgent}`,
    `- Implementation authorized: ${pkg.manifest.implementation_authorized}`,
    `- Blockers: ${pkg.quality.readiness.blockers.length}`,
    `- Warnings: ${pkg.quality.readiness.warnings.length}`
  ].join("\n");
}

function buildGeneratedAgentsMd(): string {
  return [
    "# Archetype Agent Instructions",
    "",
    "This project uses an Archetype frontend implementation contract.",
    "",
    "## Start Here",
    "",
    "Before implementing UI, read:",
    "",
    "0. `lifecycle/context-completion.json`",
    "0.1. `governance/non-negotiable-principles.json`",
    "0.2. `governance/evidence-decision-model.json`",
    "0.2.1. `governance/forbidden-behaviors.json`",
    "0.2.2. `governance/convergence-standard.json`",
    "0.3. `lifecycle/readiness-tiers.json`",
    "0.4. `lifecycle/execution-state.json`",
    "0.5. `lifecycle/implementation-phases.json`",
    "0.6. `lifecycle/approval-decision.json`",
    "0.7. `reviews/specialist-review-summary.md`",
    "1. `spec/archetype-spec.md`",
    "2. `spec/archetype-spec.json`",
    "3. `test-first/test-first-contract.json`",
    "4. `test-first/test-first-plan.md`",
    "5. `test-first/test-quality-standard.json`",
    "5.1. `test-results/initial-red-test-run.md`",
    "6. `verification/playwright-verification-contract.json`",
    "7. `qa/scenario-catalog.json`",
    "7. `qa/playwright-results.json`",
    "8. `qa/malformed-data-results.json`",
    "9. `qa/accessibility-results.md`",
    "10. `qa/visual-regression-report.md`",
    "11. `qa/contract-drift-report.md`",
    "12. `10-revision/repair-task-queue.json`",
    "13. `10-revision/repair-plan.md`",
    "14. `implementation-contract.md`",
    "15. `frontend-agent-contract/frontend-agent-instructions.md`",
    "16. `experience/route-map.json`",
    "17. `screens/screen-inventory.json`",
    "18. `design-system/tokens.json`",
    "19. `design-system/component-contracts.json`",
    "20. `verification-plan.md`",
    "21. `lifecycle/final-readiness-report.md`",
    "",
    "## Rules",
    "",
    "- Do not invent routes not present in the route map.",
    "- Do not invent screens not present in the screen inventory.",
    "- Do not skip loading, empty, error, success, and permission states when required.",
    "- Do not change product copy in ways that conflict with the contract.",
    "- Use the design-system tokens before creating ad hoc styling.",
    "- Follow data, action, and form contracts.",
    "- Treat `spec/archetype-spec.json` and `spec/archetype-spec.md` as the source of truth.",
    "- Do not implement product UI unless `governance/non-negotiable-principles.json` reports implementation_authorized: true.",
    "- Do not treat archetype_inference or weak_user_hint as canonical evidence.",
    "- Only confirmed decisions with canonical evidence may drive implementation-authorized artifacts.",
    "- Reject every behavior listed in `governance/forbidden-behaviors.json`.",
    "- Treat every question in `governance/convergence-standard.json` as requiring the answer `No.` with evidence.",
    "- Do not treat pending human approval as agent approval.",
    "- Treat Archetype as spec-driven development: no implementation before the generated spec and contract are understood.",
    "- Treat the agent phase as test-driven development: create the tests declared in `test-first/test-first-contract.json` before product UI code.",
    "- Follow `test-first/test-quality-standard.json`; marker-only tests fail the verifier.",
    "- Preserve the initial red test result before implementing, then drive the same tests green.",
    "- Run Playwright-backed verification and attach `verification/playwright-evidence.json` before declaring completion.",
    "- Treat QA as evidence: read `qa/scenario-catalog.json`, `qa/playwright-results.json`, malformed data results, accessibility results, visual regression report, and contract drift report.",
    "- If verification fails, read `10-revision/repair-task-queue.json` and patch listed implementation drift before revising the contract.",
    "- Read `lifecycle/execution-state.json`; completion is blocked until `ready_for_completion` is true.",
    "- Read `lifecycle/implementation-phases.json`; no phase can skip its lifecycle acceptance gate.",
    "- After implementation, run the verification commands in `verification-plan.md`.",
    "",
    "## Completion Standard",
    "",
    "Do not declare completion until verification has passed or all remaining warnings are explicitly listed."
  ].join("\n");
}

function buildGeneratedClaudeMd(): string {
  return [
    "# Archetype Claude Instructions",
    "",
    "Use the Archetype package as the source of truth for frontend implementation.",
    "",
    "## Primary Files",
    "",
    "- `lifecycle/context-completion.json`",
    "- `lifecycle/execution-state.json`",
    "- `lifecycle/implementation-phases.json`",
    "- `lifecycle/approval-decision.json`",
    "- `reviews/specialist-review-summary.md`",
    "- `spec/archetype-spec.md`",
    "- `spec/archetype-spec.json`",
    "- `governance/forbidden-behaviors.json`",
    "- `governance/convergence-standard.json`",
    "- `test-first/test-first-contract.json`",
    "- `test-first/test-first-plan.md`",
    "- `test-first/test-quality-standard.json`",
    "- `test-results/initial-red-test-run.md`",
    "- `verification/playwright-verification-contract.json`",
    "- `qa/scenario-catalog.json`",
    "- `qa/playwright-results.json`",
    "- `qa/malformed-data-results.json`",
    "- `qa/accessibility-results.md`",
    "- `qa/visual-regression-report.md`",
    "- `qa/contract-drift-report.md`",
    "- `10-revision/repair-task-queue.json`",
    "- `10-revision/repair-plan.md`",
    "- `implementation-contract.md`",
    "- `frontend-agent-contract/frontend-agent-instructions.md`",
    "- `experience/route-map.json`",
    "- `screens/screen-inventory.json`",
    "- `design-system/tokens.json`",
    "- `verification-plan.md`",
    "- `lifecycle/final-readiness-report.md`",
    "",
    "## Implementation Discipline",
    "",
    "- Preserve the route map.",
    "- Implement all required screen states.",
    "- Use the design-system tokens.",
    "- Follow the data/action/form contracts.",
    "- Do not invent product behavior outside the contract.",
    "- Create the tests from `test-first/test-first-contract.json` before product UI code.",
    "- Follow `test-first/test-quality-standard.json`; marker-only tests fail the verifier.",
    "- Preserve the initial red test result before implementing, then drive the same tests green.",
    "- Run Playwright-backed verification and attach `verification/playwright-evidence.json` before declaring completion.",
    "- Treat QA as evidence: read all `qa/` artifacts before declaring completion.",
    "- If verification fails, read `10-revision/repair-task-queue.json` and patch listed implementation drift before revising the contract.",
    "- Read `lifecycle/execution-state.json`; completion is blocked until `ready_for_completion` is true.",
    "- Read `lifecycle/implementation-phases.json`; no phase can skip its lifecycle acceptance gate.",
    "- Run validation before declaring completion.",
    "",
    "## Completion Standard",
    "",
    "Return a final summary with:",
    "",
    "- implemented routes",
    "- implemented screens",
    "- implemented required states",
    "- verification results",
    "- unresolved warnings or blockers"
  ].join("\n");
}

function buildImplementationContract(pkg: ArchetypePackage): string {
  const routes = pkg.experience.routeMap.routes.map((route) => `${route.route} -> ${route.screen_id} (${route.layout})`);
  const screens = pkg.experience.screenSpecs.map((screen) => `${screen.screen_id}: ${screen.name}`);
  const requiredStates = [
    ...new Set(
      pkg.experience.screenSpecs.flatMap((screen) =>
        Object.entries(screen.states)
          .filter(([, state]) => asRecord(state).required === true)
          .map(([state]) => state)
      )
    )
  ].sort();
  const componentContractRecord = asRecord(pkg.designSystem.componentContracts);
  const components = [
    ...asArray(componentContractRecord.contracts),
    ...asArray(componentContractRecord.components)
  ].map((component) => {
    const record = asRecord(component);
    return String(record.name ?? record.id ?? "Unnamed component");
  });
  const acceptance = asArray(asRecord(pkg.frontendContract.acceptanceCriteria).criteria).map((criterion) => {
    const record = asRecord(criterion);
    return String(record.id ?? record.subject ?? JSON.stringify(record));
  });

  return [
    "# Implementation Contract",
    "",
    "## 1. Product Summary",
    "",
    `- Product: ${productName(pkg)}`,
    `- Type: ${String(pkg.product.productModel.product_type ?? "Unknown")}`,
    `- Primary goal: ${String(pkg.product.productModel.primary_goal ?? "Unknown")}`,
    "",
    "## 2. User Roles",
    "",
    "See `product/user-roles.json`.",
    "",
    "## 3. Route Map Summary",
    "",
    ...linesForList(routes),
    "",
    "## 4. Required Screens",
    "",
    ...linesForList(screens),
    "",
    "## 5. Required States",
    "",
    ...linesForList(requiredStates),
    "",
    "## 6. Design-System Rules",
    "",
    pkg.designSystem.visualDirection,
    "",
    "Read `design-system/tokens.json` and `design-system/component-contracts.json` before styling or creating components.",
    "",
    "## 7. Component Contract Summary",
    "",
    ...linesForList(components.slice(0, 20)),
    "",
    "## 8. Data, Action, And Form Contracts",
    "",
    "- Data, action, and form rules: `frontend-agent-contract/implementation-rules.json`",
    "- Detailed source contracts remain in `06-frontend-agent-contract/` for advanced audit.",
    "",
    "## 9. Acceptance Criteria",
    "",
    ...linesForList(acceptance.slice(0, 30)),
    "",
    "## 10. Verification Checklist",
    "",
    "- Run `archetype validate --out <archetype-output>`.",
    "- Run `archetype verify-target --out <archetype-output> --target <frontend-app>`.",
    "- Attach the red-then-green evidence required by `test-first/test-first-contract.json`.",
    "- Attach Playwright evidence from `verification/playwright-evidence.json`.",
    "- Report unresolved blockers and warnings before claiming completion."
  ].join("\n");
}

function buildReadinessReport(pkg: ArchetypePackage): string {
  const missingEvidence = pkg.evidence.missing_information;
  const assumptions = pkg.evidence.assumptions.map((item) => item.claim ?? item.value ?? item.id);
  const risks = pkg.evidence.risks.map((item) => item.claim ?? item.value ?? item.id);
  return [
    "# Readiness Report",
    "",
    `- Readiness score: ${pkg.quality.readiness.score}`,
    `- Readiness tier: ${pkg.manifest.readiness_tier}`,
    `- Ready for frontend agent: ${pkg.quality.readiness.readyForFrontendAgent}`,
    `- Implementation authorized: ${pkg.manifest.implementation_authorized}`,
    "",
    "## Blockers",
    "",
    ...linesForList(pkg.quality.readiness.blockers),
    "",
    "## Warnings",
    "",
    ...linesForList(pkg.quality.readiness.warnings),
    "",
    "## Inferred Assumptions",
    "",
    ...linesForList(assumptions),
    "",
    "## Missing Evidence",
    "",
    ...linesForList(missingEvidence),
    "",
    "## Implementation Risks",
    "",
    ...linesForList(risks),
    "",
    "## Recommended Next Action",
    "",
    pkg.manifest.implementation_authorized
      ? "Implement from the contract, then run validation and target verification."
      : "Resolve approval and lifecycle blockers before asking a coding agent to implement the frontend."
  ].join("\n");
}

function buildUserRoles(pkg: ArchetypePackage): Record<string, unknown> {
  return {
    roleModel: pkg.product.roleModel,
    permissionMatrix: pkg.product.permissionMatrix,
    userModel: pkg.product.userModel
  };
}

function buildCanonicalTokens(pkg: ArchetypePackage): Record<string, unknown> {
  return {
    primitive: pkg.designSystem.primitiveTokens,
    semantic: pkg.designSystem.semanticTokens,
    component: pkg.designSystem.componentTokens,
    contracts: pkg.designSystem.tokenContracts,
    typography: pkg.designSystem.typographySystem,
    cssVariables: "04-design-system/tokens/css-variables.css"
  };
}

function buildImplementationRules(pkg: ArchetypePackage): Record<string, unknown> {
  return {
    buildManifest: pkg.frontendContract.buildManifest,
    routing: pkg.frontendContract.routingContract,
    layout: pkg.frontendContract.layoutRules,
    responsive: pkg.frontendContract.responsiveRules,
    interaction: pkg.frontendContract.interactionRules,
    forms: pkg.frontendContract.formRules,
    dataContracts: pkg.frontendContract.dataContracts,
    dataOperations: pkg.frontendContract.dataOperationContracts,
    actionContracts: pkg.frontendContract.actionContracts,
    formContracts: pkg.frontendContract.formContracts,
    testFirstContract: {
      path: "test-first/test-first-contract.json",
      required_before_implementation: true,
      coverage: asRecord(pkg.testFirst.contractJson.coverage)
    },
    playwrightVerification: {
      path: "verification/playwright-verification-contract.json",
      evidence_path: "verification/playwright-evidence.json",
      required_before_completion: true,
      coverage: asRecord(pkg.playwright.contractJson.coverage)
    },
    qaEvidence: {
      required_artifacts: REQUIRED_QA_ARTIFACTS,
      scenario_catalog: "qa/scenario-catalog.json",
      playwright_results: "qa/playwright-results.json",
      malformed_data_results: "qa/malformed-data-results.json",
      accessibility_results: "qa/accessibility-results.md",
      visual_regression_report: "qa/visual-regression-report.md",
      contract_drift_report: "qa/contract-drift-report.md",
      required_before_completion: true,
      rule: "QA produces evidence, not vibes."
    },
    forbiddenBehaviorAcceptance: {
      path: "governance/forbidden-behaviors.json",
      source_scope: "HL-13",
      required_before_implementation: true,
      required_before_completion: true
    },
    convergenceStandard: {
      path: "governance/convergence-standard.json",
      source_scope: "HL-16",
      required_before_completion: true,
      required_answer: "No."
    },
    implementationPhases: {
      path: "lifecycle/implementation-phases.json",
      source_scope: "HL-15",
      required_before_implementation: true,
      rule: "No phase can skip its lifecycle acceptance gate."
    },
    repairLoop: {
      contract_path: "10-revision/verification-repair-contract.json",
      task_queue_path: "10-revision/repair-task-queue.json",
      plan_path: "10-revision/repair-plan.md",
      drift_report_path: "10-revision/drift-report.json",
      required_on_verification_failure: true
    },
    verificationContracts: pkg.frontendContract.verificationContracts,
    forbiddenBehavior: [
      "Do not invent routes outside experience/route-map.json.",
      "Do not invent screens outside screens/screen-inventory.json.",
      "Do not skip required screen states.",
      "Do not create ad hoc tokens before reading design-system/tokens.json.",
      "Do not implement product UI before creating the tests declared in test-first/test-first-contract.json.",
      "Do not claim completion before Playwright evidence is generated by verify-target.",
      "Do not claim QA completion without the required qa/* evidence artifacts.",
      "Do not claim completion while 10-revision/repair-task-queue.json contains blocker tasks.",
      "Do not claim production integration until verification-plan.md has passed."
    ]
  };
}

export interface ExportPackageOptions {
  force?: boolean;
}

export function exportPackage(pkg: ArchetypePackage, outDir: string, options: ExportPackageOptions = {}): void {
  prepareGeneratedOutputDirectory(outDir, { force: options.force === true });
  const nonNegotiablePrinciples = buildNonNegotiablePrinciplesArtifact(pkg);
  const evidenceDecisionModel = buildEvidenceDecisionModelArtifact(pkg);
  const frontendPracticeSkills = buildFrontendPracticeSkillsArtifact(pkg);
  const forbiddenBehaviorAcceptance = buildForbiddenBehaviorAcceptanceArtifact();
  const convergenceStandard = buildConvergenceStandardArtifact({
    packageType: "canonical",
    contextStatus: String(pkg.lifecycle.contextCompletion.status ?? "complete"),
    readinessTier: pkg.manifest.readiness_tier,
    readyForFrontendAgent: pkg.quality.readiness.readyForFrontendAgent,
    implementationAuthorized: pkg.manifest.implementation_authorized
  });
  const readinessTiers = buildPackageReadinessTiersArtifact(pkg);
  const implementationPhases = buildImplementationPhasesArtifact({
    packageType: "canonical",
    contextStatus: String(pkg.lifecycle.contextCompletion.status ?? "complete"),
    readinessTier: pkg.manifest.readiness_tier,
    readyForFrontendAgent: pkg.quality.readiness.readyForFrontendAgent,
    implementationAuthorized: pkg.manifest.implementation_authorized,
    contractApprovalStatus: String(pkg.manifest.contract_approval.status ?? "unknown")
  });
  const draft = buildContractDraftArtifacts(pkg);
  const designPreviewHtml = designSystemPreviewHtml(pkg, draft.designSystemDraft);
  const designReviewMarkdown = designSystemReviewMarkdown(pkg);
  const execution = buildLifecycleExecutionStateArtifacts(pkg);
  const qa = buildPendingQaArtifacts(pkg);
  const testQualityStandard = buildTestQualityStandardArtifact();

  writeText(outDir, "README.md", buildPackageReadme(pkg));
  writeText(outDir, "AGENTS.md", buildGeneratedAgentsMd());
  writeText(outDir, "CLAUDE.md", buildGeneratedClaudeMd());
  writeJson(outDir, "manifest.json", buildTopLevelManifest(pkg));
  writeText(outDir, "readiness-report.md", buildReadinessReport(pkg));
  writeText(outDir, "spec/archetype-spec.md", pkg.spec.specMarkdown);
  writeJson(outDir, "spec/archetype-spec.json", pkg.spec.specJson);
  writeJson(outDir, "test-first/test-first-contract.json", pkg.testFirst.contractJson);
  writeText(outDir, "test-first/test-first-plan.md", pkg.testFirst.planMarkdown);
  writeJson(outDir, "test-first/test-quality-standard.json", testQualityStandard);
  writeText(outDir, "test-first/test-quality-standard.md", testQualityStandardMarkdown(testQualityStandard));
  writeText(outDir, "test-results/initial-red-test-run.md", initialRedTestRunMarkdown(pkg.testFirst.contractJson));
  writeText(outDir, "test-first/playwright-contract.spec.ts", pkg.testFirst.playwrightContractSpec);
  writeText(outDir, "test-first/vitest-contract.spec.ts", pkg.testFirst.vitestContractSpec);
  writeJson(outDir, "verification/playwright-verification-contract.json", pkg.playwright.contractJson);
  writeText(outDir, "verification/playwright-verification-plan.md", pkg.playwright.planMarkdown);
  writeText(outDir, "verification/playwright.config.ts", pkg.playwright.configSource);
  writeText(outDir, "verification/playwright-verification.spec.ts", pkg.playwright.specSource);
  writeJson(outDir, "verification/playwright-evidence.json", pkg.playwright.evidenceJson);
  writeText(outDir, "verification/playwright-evidence.md", pkg.playwright.evidenceMarkdown);
  writeJson(outDir, "qa/scenario-catalog.json", qa.scenarioCatalog);
  writeJson(outDir, "qa/playwright-results.json", qa.playwrightResults);
  writeJson(outDir, "qa/malformed-data-results.json", qa.malformedDataResults);
  writeText(outDir, "qa/accessibility-results.md", qa.accessibilityResultsMarkdown);
  writeText(outDir, "qa/visual-regression-report.md", qa.visualRegressionReportMarkdown);
  writeText(outDir, "qa/contract-drift-report.md", qa.contractDriftReportMarkdown);
  writeText(outDir, "implementation-contract.md", buildImplementationContract(pkg));
  writeText(outDir, "verification-plan.md", pkg.frontendContract.verificationPlan);
  writeJson(outDir, "lifecycle/state-machine.json", pkg.lifecycle.stateMachine);
  writeJson(outDir, "lifecycle/start-request.json", pkg.lifecycle.startRequest);
  writeJson(outDir, "lifecycle/context-completion.json", pkg.lifecycle.contextCompletion);
  writeJson(outDir, "lifecycle/context-matrix.json", pkg.lifecycle.contextMatrix);
  writeJson(outDir, "lifecycle/readiness-tiers.json", readinessTiers);
  writeText(outDir, "lifecycle/readiness-tiers.md", readinessTiersMarkdown(readinessTiers));
  writeJson(outDir, "lifecycle/implementation-phases.json", implementationPhases);
  writeText(outDir, "lifecycle/implementation-phases.md", implementationPhasesMarkdown(implementationPhases));
  writeJson(outDir, "lifecycle/clarification-turn.json", pkg.lifecycle.clarificationTurn);
  writeText(outDir, "lifecycle/clarification-turn.md", pkg.lifecycle.clarificationTurnReport);
  writeJson(outDir, "lifecycle/clarification-state.json", pkg.lifecycle.clarificationState);
  writeText(outDir, "lifecycle/clarification-transcript.md", pkg.lifecycle.clarificationTranscript);
  writeText(outDir, "lifecycle/approval-request.md", approvalRequestMarkdown(draft.contractApprovalRequest));
  writeJson(outDir, "lifecycle/approval-decision.json", approvalDecisionArtifact(pkg.manifest as unknown as Record<string, unknown>));
  writeJson(outDir, "lifecycle/clarification-questions.json", pkg.lifecycle.clarificationQuestions);
  writeText(outDir, "lifecycle/lifecycle-report.md", pkg.lifecycle.lifecycleReport);
  writeText(outDir, "lifecycle/final-readiness-report.md", finalReadinessReportMarkdown({
    manifest: pkg.manifest as unknown as Record<string, unknown>,
    playwrightEvidence: pkg.playwright.evidenceJson,
    repairTaskQueue: pkg.revision.repairTaskQueue,
    qaScenarioCatalog: qa.scenarioCatalog
  }));
  writeJson(outDir, "lifecycle/contract-state.json", draft.contractState);
  writeJson(outDir, "lifecycle/execution-state.json", execution.executionState);
  writeText(outDir, "lifecycle/execution-state.md", execution.executionStateMarkdown);
  writeJson(outDir, "draft/product-model.draft.json", draft.productModelDraft);
  writeJson(outDir, "draft/experience-architecture.draft.json", draft.experienceArchitectureDraft);
  writeJson(outDir, "draft/design-system.draft.json", draft.designSystemDraft);
  writeText(outDir, "draft/design-system-preview.html", designPreviewHtml);
  writeText(outDir, "draft/design-system-review.md", designReviewMarkdown);
  writeJson(outDir, "draft/frontend-contract.draft.json", draft.frontendContractDraft);
  writeText(outDir, "draft/assumption-ledger.md", draft.assumptionLedger);
  writeJson(outDir, "draft/specialist-review.json", draft.specialistReview);
  writeText(outDir, "reviews/specialist-review-summary.md", specialistReviewSummaryMarkdown(draft.specialistReview));
  writeJson(outDir, "draft/contract-approval-request.json", draft.contractApprovalRequest);
  writeJson(outDir, "governance/non-negotiable-principles.json", nonNegotiablePrinciples);
  writeText(outDir, "governance/non-negotiable-principles.md", nonNegotiablePrinciplesMarkdown(nonNegotiablePrinciples));
  writeJson(outDir, "governance/evidence-decision-model.json", evidenceDecisionModel);
  writeText(outDir, "governance/evidence-decision-model.md", evidenceDecisionModelMarkdown(evidenceDecisionModel));
  writeJson(outDir, "governance/forbidden-behaviors.json", forbiddenBehaviorAcceptance);
  writeText(outDir, "governance/forbidden-behaviors.md", forbiddenBehaviorAcceptanceMarkdown(forbiddenBehaviorAcceptance));
  writeJson(outDir, "governance/convergence-standard.json", convergenceStandard);
  writeText(outDir, "governance/convergence-standard.md", convergenceStandardMarkdown(convergenceStandard));
  writeJson(outDir, "governance/frontend-practice-skills.json", frontendPracticeSkills);
  writeText(outDir, "governance/frontend-practice-skills.md", frontendPracticeSkillsMarkdown(frontendPracticeSkills));
  for (const skill of FRONTEND_PRACTICE_SKILLS) {
    writeJson(outDir, skill.output_artifact, frontendPracticeSkillOutput(skill));
  }

  writeJson(outDir, "product/product-model.json", pkg.product.productModel);
  writeJson(outDir, "product/user-roles.json", buildUserRoles(pkg));
  writeJson(outDir, "experience/route-map.json", pkg.experience.routeMap);
  writeJson(outDir, "experience/user-flows.json", pkg.experience.flowSpecs);
  writeJson(outDir, "design-system/tokens.json", buildCanonicalTokens(pkg));
  writeJson(outDir, "design-system/component-contracts.json", pkg.designSystem.componentContracts);
  writeJson(outDir, "screens/screen-inventory.json", pkg.experience.screenInventory);
  writeJson(outDir, "screens/screen-specs.json", { screens: pkg.experience.screenSpecs });
  writeText(outDir, "frontend-agent-contract/frontend-agent-instructions.md", pkg.frontendContract.frontendAgentInstructions);
  writeJson(outDir, "frontend-agent-contract/acceptance-criteria.json", pkg.frontendContract.acceptanceCriteria);
  writeJson(outDir, "frontend-agent-contract/implementation-rules.json", buildImplementationRules(pkg));
  writeJson(outDir, "validation/package-validation.json", pkg.quality.validation);
  writeText(outDir, "validation/simulation-report.md", pkg.buildSimulation.simulationReport);

  writeJson(outDir, "00-manifest/manifest.json", pkg.manifest);
  writeText(outDir, "00-manifest/package-summary.md", [
    "# Package Summary",
    "",
    `Project: ${pkg.manifest.project_slug}`,
    `Spec version: ${pkg.manifest.spec_version}`,
    `Readiness score: ${pkg.manifest.readiness_score}`,
    `Readiness tier: ${pkg.manifest.readiness_tier}`,
    `Ready for frontend agent: ${pkg.manifest.ready_for_frontend_agent}`
  ].join("\n"));
  writeJson(outDir, "00-manifest/implementation-readiness.json", pkg.quality.readiness);
  writeJson(outDir, "00-manifest/schema-validation-report.json", pkg.quality.validation);
  writeJson(outDir, "00-manifest/schema-index.json", pkg.schemas.index);
  writeText(outDir, "00-manifest/changelog.md", "# Changelog\n\n- Initial compiler-generated architecture package.");

  writeJson(outDir, "01-evidence/evidence-ledger.json", pkg.evidence);
  writeJson(outDir, "01-evidence/source-analysis-report.json", pkg.ingestion.sourceAnalysisReport);
  writeJson(outDir, "01-evidence/visual-evidence-extraction.json", pkg.ingestion.visualEvidence);
  writeText(outDir, "01-evidence/visual-evidence-extraction.md", pkg.ingestion.visualEvidenceReport);
  writeText(outDir, "01-evidence/assumptions.md", listMarkdown("Assumptions", pkg.evidence.assumptions));
  writeText(outDir, "01-evidence/conflicts.md", listMarkdown("Conflicts", pkg.evidence.conflicts));
  writeText(outDir, "01-evidence/risks.md", listMarkdown("Risks", pkg.evidence.risks));
  writeText(outDir, "01-evidence/missing-context.md", missingContextMarkdown(pkg.evidence, pkg.lifecycle.contextMatrix));
  writeText(outDir, "01-evidence/decision-records.md", listMarkdown("Decision Records", pkg.evidence.decisions));

  writeText(outDir, "02-product-model/product-brief.md", [
    "# Product Brief",
    "",
    `Product: ${String(pkg.product.productModel.product_name)}`,
    `Type: ${String(pkg.product.productModel.product_type)}`,
    `Primary goal: ${String(pkg.product.productModel.primary_goal)}`
  ].join("\n"));
  writeJson(outDir, "02-product-model/product-model.json", pkg.product.productModel);
  writeJson(outDir, "02-product-model/user-model.json", pkg.product.userModel);
  writeText(outDir, "02-product-model/jobs-to-be-done.md", pkg.product.jobsToBeDone);
  writeJson(outDir, "02-product-model/role-model.json", pkg.product.roleModel);
  writeJson(outDir, "02-product-model/permission-matrix.json", pkg.product.permissionMatrix);
  writeJson(outDir, "02-product-model/entity-model.json", pkg.product.entityModel);
  writeJson(outDir, "02-product-model/entity-lifecycle.json", pkg.product.entityLifecycle);

  writeText(outDir, "03-experience-architecture/user-journeys.md", pkg.experience.userJourneys);
  writeJson(outDir, "03-experience-architecture/flow-specs.json", pkg.experience.flowSpecs);
  writeJson(outDir, "03-experience-architecture/information-architecture.json", pkg.experience.informationArchitecture);
  writeJson(outDir, "03-experience-architecture/route-map.json", pkg.experience.routeMap);
  writeJson(outDir, "03-experience-architecture/screen-inventory.json", pkg.experience.screenInventory);
  writeJson(outDir, "03-experience-architecture/navigation-model.json", pkg.experience.navigationModel);
  writeJson(outDir, "03-experience-architecture/state-models.json", pkg.experience.stateModels);
  writeJson(outDir, "03-experience-architecture/screen-state-matrix.json", pkg.experience.screenStateMatrix);
  writeJson(outDir, "03-experience-architecture/ux-flow-state-completeness.json", pkg.experience.uxFlowStateCompleteness);
  writeText(outDir, "03-experience-architecture/ux-flow-state-completeness.md", pkg.experience.uxFlowStateCompletenessReport);
  writeJson(outDir, "03-experience-architecture/action-taxonomy.json", pkg.experience.actionTaxonomy);
  writeJson(outDir, "03-experience-architecture/dsag.json", pkg.dsag);

  writeText(outDir, "04-design-system/design-principles.md", pkg.designSystem.designPrinciples);
  writeText(outDir, "04-design-system/visual-direction.md", pkg.designSystem.visualDirection);
  writeText(outDir, "04-design-system/content-rules.md", pkg.designSystem.contentRules);
  writeJson(outDir, "04-design-system/tokens/primitive-tokens.json", pkg.designSystem.primitiveTokens);
  writeJson(outDir, "04-design-system/tokens/semantic-tokens.json", pkg.designSystem.semanticTokens);
  writeJson(outDir, "04-design-system/tokens/component-tokens.json", pkg.designSystem.componentTokens);
  writeJson(outDir, "04-design-system/tokens/token-contracts.json", pkg.designSystem.tokenContracts);
  writeJson(outDir, "04-design-system/tokens/typography-system.json", pkg.designSystem.typographySystem);
  writeJson(outDir, "04-design-system/tokens/theme-light.json", pkg.designSystem.themeLight);
  writeText(outDir, "04-design-system/tokens/css-variables.css", pkg.designSystem.cssVariables);
  writeText(outDir, "04-design-system/tokens/typography.css", pkg.designSystem.typographyCss);
  writeText(outDir, "04-design-system/tokens/tailwind.config.ts", pkg.designSystem.tailwindConfig);
  writeJson(outDir, "04-design-system/components/component-contracts.json", pkg.designSystem.componentContracts);
  writeText(outDir, "04-design-system/components/component-contracts.md", pkg.designSystem.componentContractsReport);
  writeJson(outDir, "04-design-system/components/component-registry.json", pkg.designSystem.componentRegistry);
  writeText(outDir, "04-design-system/components/component-specs.md", pkg.designSystem.componentSpecs);
  writeText(outDir, "04-design-system/components/component-api-contract.md", pkg.designSystem.componentApiContract);
  writeJson(outDir, "04-design-system/patterns/pattern-contracts.json", pkg.designSystem.patternContracts);
  writeText(outDir, "04-design-system/patterns/pattern-contracts.md", pkg.designSystem.patternContractsReport);
  writeJson(outDir, "04-design-system/patterns/pattern-registry.json", pkg.designSystem.patternRegistry);
  writeText(outDir, "04-design-system/patterns/pattern-specs.md", pkg.designSystem.patternSpecs);
  writeText(outDir, "04-design-system/patterns/pattern-lifecycle.md", pkg.designSystem.patternLifecycle);
  writeJson(outDir, "04-design-system/accessibility/accessibility-rules.json", pkg.designSystem.accessibilityRules);
  writeText(outDir, "04-design-system/accessibility/accessibility-guidelines.md", pkg.designSystem.accessibilityGuidelines);
  writeText(outDir, "04-design-system/docs/foundations.md", pkg.designSystem.foundations);
  writeText(outDir, "04-design-system/docs/usage-guidelines.md", pkg.designSystem.usageGuidelines);
  writeText(outDir, "04-design-system/docs/anti-patterns.md", pkg.designSystem.antiPatterns);
  writeText(outDir, "04-design-system/docs/migration-notes.md", pkg.designSystem.migrationNotes);

  writeJson(outDir, "05-screen-specs/screen-spec-index.json", {
    screens: pkg.experience.screenSpecs.map((screen) => ({
      screen_id: screen.screen_id,
      route: screen.route,
      file: `${screen.screen_id.replace(/[.]/g, "-")}.yaml`
    }))
  });
  for (const screen of pkg.experience.screenSpecs) {
    writeText(outDir, `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`, toYaml(screen));
  }

  writeJson(outDir, "06-frontend-agent-contract/build-manifest.json", pkg.frontendContract.buildManifest);
  writeJson(outDir, "06-frontend-agent-contract/component-usage-map.json", pkg.frontendContract.componentUsageMap);
  writeJson(outDir, "06-frontend-agent-contract/layout-rules.json", pkg.frontendContract.layoutRules);
  writeJson(outDir, "06-frontend-agent-contract/responsive-rules.json", pkg.frontendContract.responsiveRules);
  writeJson(outDir, "06-frontend-agent-contract/interaction-rules.json", pkg.frontendContract.interactionRules);
  writeJson(outDir, "06-frontend-agent-contract/form-rules.json", pkg.frontendContract.formRules);
  writeJson(outDir, "06-frontend-agent-contract/data-contracts.json", pkg.frontendContract.dataContracts);
  writeJson(outDir, "06-frontend-agent-contract/data-operation-contracts.json", pkg.frontendContract.dataOperationContracts);
  writeJson(outDir, "06-frontend-agent-contract/action-contracts.json", pkg.frontendContract.actionContracts);
  writeJson(outDir, "06-frontend-agent-contract/form-contracts.json", pkg.frontendContract.formContracts);
  writeJson(outDir, "06-frontend-agent-contract/verification-contracts.json", pkg.frontendContract.verificationContracts);
  writeText(outDir, "06-frontend-agent-contract/verification-plan.md", pkg.frontendContract.verificationPlan);
  writeJson(outDir, "06-frontend-agent-contract/production-integration-contracts.json", pkg.frontendContract.productionIntegrationContracts);
  writeText(outDir, "06-frontend-agent-contract/production-integration-plan.md", pkg.frontendContract.productionIntegrationPlan);
  writeJson(outDir, "06-frontend-agent-contract/routing-contract.json", pkg.frontendContract.routingContract);
  writeJson(outDir, "06-frontend-agent-contract/acceptance-criteria.json", pkg.frontendContract.acceptanceCriteria);
  writeJson(outDir, "06-frontend-agent-contract/fixture-data.json", pkg.frontendContract.fixtureData);
  writeText(outDir, "06-frontend-agent-contract/frontend-agent-instructions.md", pkg.frontendContract.frontendAgentInstructions);

  writeJson(outDir, "07-agent-runtime/provider-policy.json", pkg.llm.providerPolicy);
  writeJson(outDir, "07-agent-runtime/prompt-pack-index.json", pkg.llm.promptPackIndex);
  writeJson(outDir, "07-agent-runtime/module-contracts.json", pkg.llm.moduleContracts);
  writeText(outDir, "07-agent-runtime/structured-output-policy.md", pkg.llm.structuredOutputPolicy);
  writeText(outDir, "07-agent-runtime/repair-policy.md", pkg.llm.repairPolicy);
  writeText(outDir, "07-agent-runtime/prompt-injection-policy.md", pkg.llm.promptInjectionPolicy);

  writeText(outDir, "07-reference-surfaces/reference-dashboard.md", pkg.referenceSurfaces.dashboard);
  writeText(outDir, "07-reference-surfaces/reference-table.md", pkg.referenceSurfaces.table);
  writeText(outDir, "07-reference-surfaces/reference-form.md", pkg.referenceSurfaces.form);
  writeText(outDir, "07-reference-surfaces/reference-mobile.md", pkg.referenceSurfaces.mobile);
  writeText(outDir, "07-reference-surfaces/reference-chart.md", pkg.referenceSurfaces.chart);

  writeText(outDir, "10-revision/revision-protocol.md", pkg.revision.revisionProtocol);
  writeJson(outDir, "10-revision/artifact-dependency-graph.json", pkg.revision.artifactDependencyGraph);
  writeJson(outDir, "10-revision/invalidation-rules.json", pkg.revision.invalidationRules);
  writeJson(outDir, "10-revision/initial-change-set.json", pkg.revision.initialChangeSet);
  writeJson(outDir, "10-revision/approval-gates.json", pkg.revision.approvalGates);
  writeText(outDir, "10-revision/decision-diff-policy.md", pkg.revision.decisionDiffPolicy);
  writeText(outDir, "10-revision/artifact-invalidation-report.md", pkg.revision.artifactInvalidationReport);
  writeJson(outDir, "10-revision/verification-repair-contract.json", pkg.revision.repairContract);
  writeJson(outDir, "10-revision/repair-task-queue.json", pkg.revision.repairTaskQueue);
  writeText(outDir, "10-revision/repair-plan.md", pkg.revision.repairPlan);
  writeJson(outDir, "10-revision/drift-report.json", pkg.revision.driftReport);
  writeText(outDir, "10-revision/drift-report.md", pkg.revision.driftReportMarkdown);

  writeJson(outDir, "11-build-simulation/build-plan.json", pkg.buildSimulation.buildPlan);
  writeJson(outDir, "11-build-simulation/route-simulation.json", pkg.buildSimulation.routeSimulation);
  writeJson(outDir, "11-build-simulation/component-resolution.json", pkg.buildSimulation.componentResolution);
  writeJson(outDir, "11-build-simulation/pattern-resolution.json", pkg.buildSimulation.patternResolution);
  writeJson(outDir, "11-build-simulation/state-coverage.json", pkg.buildSimulation.stateCoverage);
  writeJson(outDir, "11-build-simulation/data-contract-coverage.json", pkg.buildSimulation.dataContractCoverage);
  writeJson(outDir, "11-build-simulation/acceptance-simulation.json", pkg.buildSimulation.acceptanceSimulation);
  writeText(outDir, "11-build-simulation/frontend-build-simulation-report.md", pkg.buildSimulation.simulationReport);

  writeJson(outDir, "12-target-frontend/source-file-manifest.json", pkg.targetFrontend.sourceFileManifest);
  writeJson(outDir, "12-target-frontend/route-component-map.json", pkg.targetFrontend.routeComponentMap);
  writeJson(outDir, "12-target-frontend/codegen-tasks.json", pkg.targetFrontend.codegenTasks);
  writeText(outDir, "12-target-frontend/adapter-interfaces.ts", pkg.targetFrontend.adapterInterfaceSource);
  writeText(outDir, "12-target-frontend/source-generation-runbook.md", pkg.targetFrontend.sourceGenerationRunbook);

  writeJson(outDir, "13-e2e/e2e-scenarios.json", pkg.e2e.scenarioCatalog);
  writeJson(outDir, "13-e2e/e2e-results.json", pkg.e2e.scenarioResults);
  writeText(outDir, "13-e2e/e2e-findings.md", pkg.e2e.findingsReport);

  writeJson(outDir, "14-target-execution/target-execution-report.json", pkg.targetExecution.executionReport);
  writeText(outDir, "14-target-execution/target-execution-report.md", pkg.targetExecution.executionMarkdown);

  writeText(outDir, "08-quality/consistency-report.md", pkg.quality.consistencyReport);
  writeText(outDir, "08-quality/accessibility-report.md", pkg.quality.accessibilityReport);
  writeText(outDir, "08-quality/safety-report.md", pkg.ingestion.safetyReport);
  writeText(outDir, "08-quality/dsag-integrity-report.md", pkg.quality.dsagIntegrityReport);
  writeText(outDir, "08-quality/screen-coverage-report.md", pkg.quality.screenCoverageReport);
  writeText(outDir, "08-quality/component-coverage-report.md", pkg.quality.componentCoverageReport);
  writeJson(outDir, "08-quality/spec-coverage-audit.json", pkg.quality.specCoverageAudit);
  writeText(outDir, "08-quality/spec-coverage-audit.md", pkg.quality.specCoverageReport);
  writeText(outDir, "08-quality/implementation-readiness-report.md", pkg.quality.implementationReadinessReport);
  writeText(outDir, "08-quality/unresolved-decisions.md", pkg.quality.unresolvedDecisions);
  writeText(outDir, "08-quality/export-readiness-checklist.md", pkg.quality.exportReadinessChecklist);

  for (const [schemaFile, schema] of Object.entries(pkg.schemas.schemas)) {
    writeJson(outDir, `09-schemas/${schemaFile}`, schema);
  }
}
