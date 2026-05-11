import type { DataPlaneArtifactType, DataPlanePhase } from "../data-plane/types";
import { AGENT_CONTEXT_ARTIFACTS } from "../agent-context/phaseBundles";
import { FRONTEND_PRACTICE_SKILLS } from "../modules/frontendPracticeSkills";
import { REQUIRED_QA_ARTIFACTS } from "../modules/qaTeam";
import { SESSION_ARTIFACTS } from "../session";

export type ArtifactPackageKind = "draft" | "canonical";
export type ArtifactReadPriority = "hot" | "warm" | "cold";

export interface ManifestArtifactEntry {
  id: string;
  path: string;
  type: DataPlaneArtifactType;
  required: boolean;
}

export interface ArtifactRegistryEntry extends ManifestArtifactEntry {
  packages: ArtifactPackageKind[];
  phase: DataPlanePhase;
  readPriority: ArtifactReadPriority;
  topLevelManifestPackages: ArtifactPackageKind[];
  validator: {
    requiredForDraft: boolean;
    requiredForComplete: boolean;
    forbiddenInDraft: boolean;
    summaryEntrypoint: boolean;
  };
  dataPlane: {
    sourcePhase: DataPlanePhase;
    readPriority: ArtifactReadPriority;
  };
  manifestOrder: number;
}

interface ArtifactSeed {
  path: string;
  id?: string;
  type?: DataPlaneArtifactType;
  readPriority?: ArtifactReadPriority;
}

const FRONTEND_PRACTICE_ARTIFACTS = FRONTEND_PRACTICE_SKILLS.map((skill): ArtifactSeed => ({
  id: `frontend-practice-${skill.id}`,
  path: skill.output_artifact,
  type: "json",
  readPriority: "warm"
}));

const QA_ARTIFACTS = REQUIRED_QA_ARTIFACTS.filter((artifact) => artifact.startsWith("qa/")).map((artifact): ArtifactSeed => ({
  path: artifact,
  readPriority: "hot"
}));

const DRAFT_MANIFEST_ARTIFACTS: ArtifactSeed[] = [
  { id: "draft-readme", path: "README.md", type: "markdown", readPriority: "hot" },
  { id: "manifest", path: "manifest.json", type: "json", readPriority: "hot" },
  ...AGENT_CONTEXT_ARTIFACTS.map((artifact): ArtifactSeed => ({
    id: artifact.id,
    path: artifact.path,
    type: artifact.type,
    readPriority: "hot"
  })),
  ...SESSION_ARTIFACTS.map((artifact): ArtifactSeed => ({
    id: artifact.id,
    path: artifact.path,
    type: artifact.type,
    readPriority: artifact.path.startsWith("review-console/") || artifact.path.startsWith("progressive/") ? "hot" : "warm"
  })),
  { id: "implementation-readiness", path: "00-manifest/implementation-readiness.json", type: "json", readPriority: "hot" },
  { id: "internal-manifest", path: "00-manifest/manifest.json", type: "json", readPriority: "hot" },
  { id: "readiness-report", path: "readiness-report.md", type: "markdown", readPriority: "warm" },
  { id: "lifecycle-state-machine", path: "lifecycle/state-machine.json", type: "json", readPriority: "cold" },
  { id: "lifecycle-contract-state", path: "lifecycle/contract-state.json", type: "json", readPriority: "hot" },
  { id: "start-request", path: "lifecycle/start-request.json", type: "json", readPriority: "warm" },
  { id: "context-completion", path: "lifecycle/context-completion.json", type: "json", readPriority: "hot" },
  { id: "context-matrix", path: "lifecycle/context-matrix.json", type: "json", readPriority: "hot" },
  { id: "readiness-tiers", path: "lifecycle/readiness-tiers.json", type: "json", readPriority: "hot" },
  { id: "readiness-tiers-report", path: "lifecycle/readiness-tiers.md", type: "markdown", readPriority: "warm" },
  { id: "implementation-phases", path: "lifecycle/implementation-phases.json", type: "json", readPriority: "hot" },
  { id: "implementation-phases-report", path: "lifecycle/implementation-phases.md", type: "markdown", readPriority: "warm" },
  { id: "clarification-turn", path: "lifecycle/clarification-turn.json", type: "json", readPriority: "hot" },
  { id: "clarification-turn-report", path: "lifecycle/clarification-turn.md", type: "markdown", readPriority: "warm" },
  { id: "clarification-state", path: "lifecycle/clarification-state.json", type: "json", readPriority: "hot" },
  { id: "clarification-transcript", path: "lifecycle/clarification-transcript.md", type: "markdown", readPriority: "warm" },
  { id: "clarification-questions", path: "lifecycle/clarification-questions.json", type: "json", readPriority: "warm" },
  { id: "lifecycle-report", path: "lifecycle/lifecycle-report.md", type: "markdown", readPriority: "warm" },
  { id: "evidence-ledger", path: "01-evidence/evidence-ledger.json", type: "json", readPriority: "hot" },
  { id: "missing-context", path: "01-evidence/missing-context.md", type: "markdown", readPriority: "hot" },
  { id: "non-negotiable-principles", path: "governance/non-negotiable-principles.json", type: "json", readPriority: "hot" },
  { id: "non-negotiable-principles-report", path: "governance/non-negotiable-principles.md", type: "markdown", readPriority: "warm" },
  { id: "evidence-decision-model", path: "governance/evidence-decision-model.json", type: "json", readPriority: "hot" },
  { id: "evidence-decision-model-report", path: "governance/evidence-decision-model.md", type: "markdown", readPriority: "warm" },
  { id: "forbidden-behaviors", path: "governance/forbidden-behaviors.json", type: "json", readPriority: "hot" },
  { id: "forbidden-behaviors-report", path: "governance/forbidden-behaviors.md", type: "markdown", readPriority: "warm" },
  { id: "convergence-standard", path: "governance/convergence-standard.json", type: "json", readPriority: "hot" },
  { id: "convergence-standard-report", path: "governance/convergence-standard.md", type: "markdown", readPriority: "warm" },
  { id: "frontend-practice-skills", path: "governance/frontend-practice-skills.json", type: "json", readPriority: "warm" },
  { id: "frontend-practice-skills-report", path: "governance/frontend-practice-skills.md", type: "markdown", readPriority: "warm" },
  { id: "agent-control-plane", path: "governance/agent-control-plane.json", type: "json", readPriority: "hot" },
  { id: "agent-control-plane-report", path: "governance/agent-control-plane.md", type: "markdown", readPriority: "hot" },
  ...FRONTEND_PRACTICE_ARTIFACTS,
  { id: "product-model-draft", path: "draft/product-model.draft.json", type: "json", readPriority: "hot" },
  { id: "experience-architecture-draft", path: "draft/experience-architecture.draft.json", type: "json", readPriority: "hot" },
  { id: "design-system-draft", path: "draft/design-system.draft.json", type: "json", readPriority: "hot" },
  { id: "design-directions", path: "draft/design-directions.json", type: "json", readPriority: "hot" },
  { id: "design-quality-gate", path: "draft/design-quality-gate.json", type: "json", readPriority: "hot" },
  { id: "design-craft-rubric", path: "draft/design-craft-rubric.md", type: "markdown", readPriority: "hot" },
  { id: "design-system-preview", path: "draft/design-system-preview.html", type: "html", readPriority: "hot" },
  { id: "design-system-review", path: "draft/design-system-review.md", type: "markdown", readPriority: "hot" },
  { id: "frontend-contract-draft", path: "draft/frontend-contract.draft.json", type: "json", readPriority: "hot" },
  { id: "assumption-ledger", path: "draft/assumption-ledger.md", type: "markdown", readPriority: "hot" },
  { id: "specialist-review", path: "draft/specialist-review.json", type: "json", readPriority: "hot" },
  { id: "contract-approval-request", path: "draft/contract-approval-request.json", type: "json", readPriority: "hot" }
];

const CANONICAL_TOP_MANIFEST_ARTIFACTS: ArtifactSeed[] = [
  { id: "package-readme", path: "README.md", type: "markdown", readPriority: "hot" },
  { id: "agent-instructions", path: "AGENTS.md", type: "markdown", readPriority: "hot" },
  { id: "claude-instructions", path: "CLAUDE.md", type: "markdown", readPriority: "hot" },
  { id: "manifest", path: "manifest.json", type: "json", readPriority: "hot" },
  ...AGENT_CONTEXT_ARTIFACTS.map((artifact): ArtifactSeed => ({
    id: artifact.id,
    path: artifact.path,
    type: artifact.type,
    readPriority: "hot"
  })),
  ...SESSION_ARTIFACTS.map((artifact): ArtifactSeed => ({
    id: artifact.id,
    path: artifact.path,
    type: artifact.type,
    readPriority: artifact.path.startsWith("review-console/") || artifact.path.startsWith("progressive/") ? "hot" : "warm"
  })),
  { id: "evidence-ledger", path: "01-evidence/evidence-ledger.json", type: "json", readPriority: "hot" },
  { id: "missing-context", path: "01-evidence/missing-context.md", type: "markdown", readPriority: "hot" },
  { id: "canonical-spec", path: "spec/archetype-spec.md", type: "markdown", readPriority: "hot" },
  { id: "canonical-spec-json", path: "spec/archetype-spec.json", type: "json", readPriority: "hot" },
  { id: "test-first-contract", path: "test-first/test-first-contract.json", type: "json", readPriority: "hot" },
  { id: "test-first-plan", path: "test-first/test-first-plan.md", type: "markdown", readPriority: "hot" },
  { id: "test-quality-standard", path: "test-first/test-quality-standard.json", type: "json", readPriority: "hot" },
  { id: "test-quality-standard-report", path: "test-first/test-quality-standard.md", type: "markdown", readPriority: "warm" },
  { id: "initial-red-test-run", path: "test-results/initial-red-test-run.md", type: "markdown", readPriority: "hot" },
  { id: "test-first-playwright-template", path: "test-first/playwright-contract.spec.ts", type: "text", readPriority: "warm" },
  { id: "test-first-vitest-template", path: "test-first/vitest-contract.spec.ts", type: "text", readPriority: "warm" },
  { id: "playwright-verification-contract", path: "verification/playwright-verification-contract.json", type: "json", readPriority: "hot" },
  { id: "playwright-verification-plan", path: "verification/playwright-verification-plan.md", type: "markdown", readPriority: "warm" },
  { id: "playwright-config-template", path: "verification/playwright.config.ts", type: "text", readPriority: "warm" },
  { id: "playwright-verification-spec", path: "verification/playwright-verification.spec.ts", type: "text", readPriority: "warm" },
  { id: "playwright-evidence", path: "verification/playwright-evidence.json", type: "json", readPriority: "hot" },
  { id: "playwright-evidence-report", path: "verification/playwright-evidence.md", type: "markdown", readPriority: "hot" },
  { id: "qa-scenario-catalog", path: "qa/scenario-catalog.json", type: "json", readPriority: "hot" },
  { id: "qa-playwright-results", path: "qa/playwright-results.json", type: "json", readPriority: "hot" },
  { id: "qa-malformed-data-results", path: "qa/malformed-data-results.json", type: "json", readPriority: "hot" },
  { id: "qa-accessibility-results", path: "qa/accessibility-results.md", type: "markdown", readPriority: "hot" },
  { id: "qa-visual-regression-report", path: "qa/visual-regression-report.md", type: "markdown", readPriority: "hot" },
  { id: "qa-contract-drift-report", path: "qa/contract-drift-report.md", type: "markdown", readPriority: "hot" },
  { id: "verification-repair-contract", path: "10-revision/verification-repair-contract.json", type: "json", readPriority: "hot" },
  { id: "repair-task-queue", path: "10-revision/repair-task-queue.json", type: "json", readPriority: "hot" },
  { id: "repair-plan", path: "10-revision/repair-plan.md", type: "markdown", readPriority: "hot" },
  { id: "drift-report", path: "10-revision/drift-report.json", type: "json", readPriority: "hot" },
  { id: "drift-report-markdown", path: "10-revision/drift-report.md", type: "markdown", readPriority: "hot" },
  { id: "implementation-contract", path: "implementation-contract.md", type: "markdown", readPriority: "hot" },
  { id: "verification-plan", path: "verification-plan.md", type: "markdown", readPriority: "warm" },
  { id: "readiness-report", path: "readiness-report.md", type: "markdown", readPriority: "warm" },
  { id: "lifecycle-state-machine", path: "lifecycle/state-machine.json", type: "json", readPriority: "cold" },
  { id: "start-request", path: "lifecycle/start-request.json", type: "json", readPriority: "warm" },
  { id: "context-completion", path: "lifecycle/context-completion.json", type: "json", readPriority: "hot" },
  { id: "context-matrix", path: "lifecycle/context-matrix.json", type: "json", readPriority: "hot" },
  { id: "readiness-tiers", path: "lifecycle/readiness-tiers.json", type: "json", readPriority: "hot" },
  { id: "readiness-tiers-report", path: "lifecycle/readiness-tiers.md", type: "markdown", readPriority: "warm" },
  { id: "implementation-phases", path: "lifecycle/implementation-phases.json", type: "json", readPriority: "hot" },
  { id: "implementation-phases-report", path: "lifecycle/implementation-phases.md", type: "markdown", readPriority: "warm" },
  { id: "clarification-turn", path: "lifecycle/clarification-turn.json", type: "json", readPriority: "hot" },
  { id: "clarification-turn-report", path: "lifecycle/clarification-turn.md", type: "markdown", readPriority: "warm" },
  { id: "clarification-state", path: "lifecycle/clarification-state.json", type: "json", readPriority: "hot" },
  { id: "clarification-transcript", path: "lifecycle/clarification-transcript.md", type: "markdown", readPriority: "warm" },
  { id: "approval-request", path: "lifecycle/approval-request.md", type: "markdown", readPriority: "hot" },
  { id: "approval-decision", path: "lifecycle/approval-decision.json", type: "json", readPriority: "hot" },
  { id: "clarification-questions", path: "lifecycle/clarification-questions.json", type: "json", readPriority: "warm" },
  { id: "lifecycle-report", path: "lifecycle/lifecycle-report.md", type: "markdown", readPriority: "warm" },
  { id: "final-readiness-report", path: "lifecycle/final-readiness-report.md", type: "markdown", readPriority: "hot" },
  { id: "lifecycle-contract-state", path: "lifecycle/contract-state.json", type: "json", readPriority: "hot" },
  { id: "lifecycle-execution-state", path: "lifecycle/execution-state.json", type: "json", readPriority: "hot" },
  { id: "lifecycle-execution-state-report", path: "lifecycle/execution-state.md", type: "markdown", readPriority: "warm" },
  { id: "product-model-draft", path: "draft/product-model.draft.json", type: "json", readPriority: "warm" },
  { id: "experience-architecture-draft", path: "draft/experience-architecture.draft.json", type: "json", readPriority: "warm" },
  { id: "design-system-draft", path: "draft/design-system.draft.json", type: "json", readPriority: "warm" },
  { id: "design-directions", path: "draft/design-directions.json", type: "json", readPriority: "warm" },
  { id: "design-quality-gate", path: "draft/design-quality-gate.json", type: "json", readPriority: "warm" },
  { id: "design-craft-rubric", path: "draft/design-craft-rubric.md", type: "markdown", readPriority: "warm" },
  { id: "design-system-preview", path: "draft/design-system-preview.html", type: "html", readPriority: "warm" },
  { id: "design-system-review", path: "draft/design-system-review.md", type: "markdown", readPriority: "warm" },
  { id: "frontend-contract-draft", path: "draft/frontend-contract.draft.json", type: "json", readPriority: "warm" },
  { id: "assumption-ledger", path: "draft/assumption-ledger.md", type: "markdown", readPriority: "warm" },
  { id: "specialist-review", path: "draft/specialist-review.json", type: "json", readPriority: "warm" },
  { id: "specialist-review-summary", path: "reviews/specialist-review-summary.md", type: "markdown", readPriority: "hot" },
  { id: "contract-approval-request", path: "draft/contract-approval-request.json", type: "json", readPriority: "warm" },
  { id: "non-negotiable-principles", path: "governance/non-negotiable-principles.json", type: "json", readPriority: "hot" },
  { id: "non-negotiable-principles-report", path: "governance/non-negotiable-principles.md", type: "markdown", readPriority: "warm" },
  { id: "evidence-decision-model", path: "governance/evidence-decision-model.json", type: "json", readPriority: "hot" },
  { id: "evidence-decision-model-report", path: "governance/evidence-decision-model.md", type: "markdown", readPriority: "warm" },
  { id: "forbidden-behaviors", path: "governance/forbidden-behaviors.json", type: "json", readPriority: "hot" },
  { id: "forbidden-behaviors-report", path: "governance/forbidden-behaviors.md", type: "markdown", readPriority: "warm" },
  { id: "convergence-standard", path: "governance/convergence-standard.json", type: "json", readPriority: "hot" },
  { id: "convergence-standard-report", path: "governance/convergence-standard.md", type: "markdown", readPriority: "warm" },
  { id: "frontend-practice-skills", path: "governance/frontend-practice-skills.json", type: "json", readPriority: "warm" },
  { id: "frontend-practice-skills-report", path: "governance/frontend-practice-skills.md", type: "markdown", readPriority: "warm" },
  { id: "agent-control-plane", path: "governance/agent-control-plane.json", type: "json", readPriority: "hot" },
  { id: "agent-control-plane-report", path: "governance/agent-control-plane.md", type: "markdown", readPriority: "hot" },
  ...FRONTEND_PRACTICE_ARTIFACTS,
  { id: "product-model", path: "product/product-model.json", type: "json", readPriority: "warm" },
  { id: "user-roles", path: "product/user-roles.json", type: "json", readPriority: "warm" },
  { id: "route-map", path: "experience/route-map.json", type: "json", readPriority: "warm" },
  { id: "user-flows", path: "experience/user-flows.json", type: "json", readPriority: "warm" },
  { id: "design-tokens", path: "design-system/tokens.json", type: "json", readPriority: "warm" },
  { id: "component-contracts", path: "design-system/component-contracts.json", type: "json", readPriority: "warm" },
  { id: "screen-inventory", path: "screens/screen-inventory.json", type: "json", readPriority: "warm" },
  { id: "screen-specs", path: "screens/screen-specs.json", type: "json", readPriority: "warm" },
  { id: "frontend-agent-instructions", path: "frontend-agent-contract/frontend-agent-instructions.md", type: "markdown", readPriority: "hot" },
  { id: "acceptance-criteria", path: "frontend-agent-contract/acceptance-criteria.json", type: "json", readPriority: "hot" },
  { id: "implementation-rules", path: "frontend-agent-contract/implementation-rules.json", type: "json", readPriority: "hot" },
  { id: "package-validation", path: "validation/package-validation.json", type: "json", readPriority: "warm" },
  { id: "simulation-report", path: "validation/simulation-report.md", type: "markdown", readPriority: "warm" }
];

const CANONICAL_ARTIFACT_PATHS: ArtifactSeed[] = [
  ...CANONICAL_TOP_MANIFEST_ARTIFACTS,
  ...QA_ARTIFACTS,
  { path: "00-manifest/package-summary.md" },
  { path: "00-manifest/schema-validation-report.json" },
  { path: "00-manifest/schema-index.json" },
  { path: "00-manifest/changelog.md" },
  { path: "01-evidence/source-analysis-report.json" },
  { path: "01-evidence/visual-evidence-extraction.json" },
  { path: "01-evidence/visual-evidence-extraction.md" },
  { path: "01-evidence/assumptions.md" },
  { path: "01-evidence/conflicts.md" },
  { path: "01-evidence/risks.md" },
  { path: "01-evidence/decision-records.md" },
  { path: "02-product-model/product-brief.md" },
  { path: "02-product-model/product-model.json" },
  { path: "02-product-model/user-model.json" },
  { path: "02-product-model/jobs-to-be-done.md" },
  { path: "02-product-model/role-model.json" },
  { path: "02-product-model/permission-matrix.json" },
  { path: "02-product-model/entity-model.json" },
  { path: "02-product-model/entity-lifecycle.json" },
  { path: "03-experience-architecture/user-journeys.md" },
  { path: "03-experience-architecture/flow-specs.json" },
  { path: "03-experience-architecture/information-architecture.json" },
  { path: "03-experience-architecture/route-map.json" },
  { path: "03-experience-architecture/screen-inventory.json" },
  { path: "03-experience-architecture/navigation-model.json" },
  { path: "03-experience-architecture/state-models.json" },
  { path: "03-experience-architecture/screen-state-matrix.json" },
  { path: "03-experience-architecture/ux-flow-state-completeness.json" },
  { path: "03-experience-architecture/ux-flow-state-completeness.md" },
  { path: "03-experience-architecture/action-taxonomy.json" },
  { path: "03-experience-architecture/dsag.json" },
  { path: "04-design-system/design-principles.md" },
  { path: "04-design-system/visual-direction.md" },
  { path: "04-design-system/design-directions.json" },
  { path: "04-design-system/design-quality-gate.json" },
  { path: "04-design-system/design-craft-rubric.md" },
  { path: "04-design-system/visual-reference-contract.json" },
  { path: "04-design-system/shadcn-integration.json" },
  { path: "04-design-system/content-rules.md" },
  { path: "04-design-system/tokens/primitive-tokens.json" },
  { path: "04-design-system/tokens/semantic-tokens.json" },
  { path: "04-design-system/tokens/component-tokens.json" },
  { path: "04-design-system/tokens/token-contracts.json" },
  { path: "04-design-system/tokens/typography-system.json" },
  { path: "04-design-system/tokens/theme-light.json" },
  { path: "04-design-system/tokens/css-variables.css" },
  { path: "04-design-system/tokens/typography.css" },
  { path: "04-design-system/tokens/tailwind.config.ts" },
  { path: "04-design-system/components/component-contracts.json" },
  { path: "04-design-system/components/component-contracts.md" },
  { path: "04-design-system/components/component-registry.json" },
  { path: "04-design-system/components/component-specs.md" },
  { path: "04-design-system/components/component-api-contract.md" },
  { path: "04-design-system/patterns/pattern-contracts.json" },
  { path: "04-design-system/patterns/pattern-contracts.md" },
  { path: "04-design-system/patterns/pattern-registry.json" },
  { path: "04-design-system/patterns/pattern-specs.md" },
  { path: "04-design-system/patterns/pattern-lifecycle.md" },
  { path: "04-design-system/accessibility/accessibility-rules.json" },
  { path: "04-design-system/accessibility/accessibility-guidelines.md" },
  { path: "04-design-system/docs/foundations.md" },
  { path: "04-design-system/docs/usage-guidelines.md" },
  { path: "04-design-system/docs/anti-patterns.md" },
  { path: "04-design-system/docs/migration-notes.md" },
  { path: "05-screen-specs/screen-spec-index.json" },
  { path: "06-frontend-agent-contract/build-manifest.json" },
  { path: "06-frontend-agent-contract/component-usage-map.json" },
  { path: "06-frontend-agent-contract/layout-rules.json" },
  { path: "06-frontend-agent-contract/responsive-rules.json" },
  { path: "06-frontend-agent-contract/interaction-rules.json" },
  { path: "06-frontend-agent-contract/form-rules.json" },
  { path: "06-frontend-agent-contract/data-contracts.json" },
  { path: "06-frontend-agent-contract/data-operation-contracts.json" },
  { path: "06-frontend-agent-contract/action-contracts.json" },
  { path: "06-frontend-agent-contract/form-contracts.json" },
  { path: "06-frontend-agent-contract/verification-contracts.json" },
  { path: "06-frontend-agent-contract/verification-plan.md" },
  { path: "06-frontend-agent-contract/production-integration-contracts.json" },
  { path: "06-frontend-agent-contract/production-integration-plan.md" },
  { path: "06-frontend-agent-contract/routing-contract.json" },
  { path: "06-frontend-agent-contract/acceptance-criteria.json" },
  { path: "06-frontend-agent-contract/fixture-data.json" },
  { path: "06-frontend-agent-contract/frontend-agent-instructions.md" },
  { path: "07-agent-runtime/provider-policy.json" },
  { path: "07-agent-runtime/prompt-pack-index.json" },
  { path: "07-agent-runtime/module-contracts.json" },
  { path: "07-agent-runtime/structured-output-policy.md" },
  { path: "07-agent-runtime/repair-policy.md" },
  { path: "07-agent-runtime/prompt-injection-policy.md" },
  { path: "07-reference-surfaces/reference-dashboard.md" },
  { path: "07-reference-surfaces/reference-table.md" },
  { path: "07-reference-surfaces/reference-form.md" },
  { path: "07-reference-surfaces/reference-mobile.md" },
  { path: "07-reference-surfaces/reference-chart.md" },
  { path: "10-revision/revision-protocol.md" },
  { path: "10-revision/artifact-dependency-graph.json" },
  { path: "10-revision/invalidation-rules.json" },
  { path: "10-revision/initial-change-set.json" },
  { path: "10-revision/approval-gates.json" },
  { path: "10-revision/decision-diff-policy.md" },
  { path: "10-revision/artifact-invalidation-report.md" },
  { path: "11-build-simulation/build-plan.json" },
  { path: "11-build-simulation/route-simulation.json" },
  { path: "11-build-simulation/component-resolution.json" },
  { path: "11-build-simulation/pattern-resolution.json" },
  { path: "11-build-simulation/state-coverage.json" },
  { path: "11-build-simulation/data-contract-coverage.json" },
  { path: "11-build-simulation/acceptance-simulation.json" },
  { path: "11-build-simulation/frontend-build-simulation-report.md" },
  { path: "12-target-frontend/source-file-manifest.json" },
  { path: "12-target-frontend/route-component-map.json" },
  { path: "12-target-frontend/codegen-tasks.json" },
  { path: "12-target-frontend/adapter-interfaces.ts" },
  { path: "12-target-frontend/source-generation-runbook.md" },
  { path: "13-e2e/e2e-scenarios.json" },
  { path: "13-e2e/e2e-results.json" },
  { path: "13-e2e/e2e-findings.md" },
  { path: "14-target-execution/target-execution-report.json" },
  { path: "14-target-execution/target-execution-report.md" },
  { path: "08-quality/consistency-report.md" },
  { path: "08-quality/accessibility-report.md" },
  { path: "08-quality/safety-report.md" },
  { path: "08-quality/dsag-integrity-report.md" },
  { path: "08-quality/screen-coverage-report.md" },
  { path: "08-quality/component-coverage-report.md" },
  { path: "08-quality/spec-coverage-audit.json" },
  { path: "08-quality/spec-coverage-audit.md" },
  { path: "08-quality/implementation-readiness-report.md" },
  { path: "08-quality/unresolved-decisions.md" },
  { path: "08-quality/export-readiness-checklist.md" },
  { path: "09-schemas/archetype-intake.schema.json" },
  { path: "09-schemas/manifest.schema.json" },
  { path: "09-schemas/evidence-ledger.schema.json" },
  { path: "09-schemas/visual-evidence-extraction.schema.json" },
  { path: "09-schemas/product-model.schema.json" },
  { path: "09-schemas/route-map.schema.json" },
  { path: "09-schemas/screen-inventory.schema.json" },
  { path: "09-schemas/ux-flow-state-completeness.schema.json" },
  { path: "09-schemas/screen-spec.schema.json" },
  { path: "09-schemas/component-contracts.schema.json" },
  { path: "09-schemas/component-registry.schema.json" },
  { path: "09-schemas/pattern-contracts.schema.json" },
  { path: "09-schemas/pattern-registry.schema.json" },
  { path: "09-schemas/data-contracts.schema.json" },
  { path: "09-schemas/data-operation-contracts.schema.json" },
  { path: "09-schemas/action-contracts.schema.json" },
  { path: "09-schemas/form-contracts.schema.json" },
  { path: "09-schemas/verification-contracts.schema.json" },
  { path: "09-schemas/test-first-contract.schema.json" },
  { path: "09-schemas/playwright-verification-contract.schema.json" },
  { path: "09-schemas/playwright-evidence.schema.json" },
  { path: "09-schemas/verification-repair-contract.schema.json" },
  { path: "09-schemas/repair-task-queue.schema.json" },
  { path: "09-schemas/drift-report.schema.json" },
  { path: "09-schemas/production-integration-contracts.schema.json" },
  { path: "09-schemas/token-contracts.schema.json" },
  { path: "09-schemas/typography-system.schema.json" },
  { path: "09-schemas/spec-coverage-audit.schema.json" },
  { path: "09-schemas/source-file-manifest.schema.json" },
  { path: "09-schemas/route-component-map.schema.json" },
  { path: "09-schemas/codegen-tasks.schema.json" },
  { path: "09-schemas/e2e-scenarios.schema.json" },
  { path: "09-schemas/e2e-results.schema.json" },
  { path: "09-schemas/target-execution-report.schema.json" },
  { path: "09-schemas/frontend-build-manifest.schema.json" },
  { path: "09-schemas/dsag.schema.json" },
  { path: "09-schemas/readiness-report.schema.json" }
];

const REQUIRED_COMPLETE_PACKAGE_ARTIFACT_PATHS = [
  "agent-context/consumer-plane.json",
  "agent-context/consumer-plane.md",
  ...SESSION_ARTIFACTS.map((artifact) => artifact.path),
  "lifecycle/context-matrix.json",
  "lifecycle/implementation-phases.json",
  "lifecycle/implementation-phases.md",
  "lifecycle/clarification-state.json",
  "lifecycle/clarification-transcript.md",
  "lifecycle/approval-request.md",
  "lifecycle/approval-decision.json",
  "01-evidence/evidence-ledger.json",
  "01-evidence/missing-context.md",
  "draft/assumption-ledger.md",
  "draft/design-system-preview.html",
  "draft/design-system-review.md",
  "reviews/specialist-review-summary.md",
  "spec/archetype-spec.json",
  "spec/archetype-spec.md",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/implementation-rules.json",
  "frontend-agent-contract/acceptance-criteria.json",
  "governance/convergence-standard.json",
  "governance/convergence-standard.md",
  "governance/agent-control-plane.json",
  "governance/agent-control-plane.md",
  "test-first/test-first-contract.json",
  "test-first/test-first-plan.md",
  "test-results/initial-red-test-run.md",
  "qa/scenario-catalog.json",
  "qa/playwright-results.json",
  "qa/malformed-data-results.json",
  "qa/accessibility-results.md",
  "qa/visual-regression-report.md",
  "qa/contract-drift-report.md",
  "verification/playwright-evidence.json",
  "verification/playwright-evidence.md",
  "10-revision/repair-task-queue.json",
  "lifecycle/final-readiness-report.md"
];

const DRAFT_FORBIDDEN_ARTIFACT_PATHS = [
  "spec/archetype-spec.json",
  "spec/archetype-spec.md",
  "test-first/test-first-contract.json",
  "verification/playwright-verification-contract.json",
  "frontend-agent-contract/implementation-rules.json",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/acceptance-criteria.json",
  "implementation-contract.md"
];

const DRAFT_READ_ORDER = [
  "agent-context/consumer-plane.json",
  "review-console/session.json",
  "review-console/index.html",
  "progressive/generation-plan.json",
  "agent-context/context-summary.json",
  "agent-context/phase-bundles/index.json",
  "agent-context/phase-bundles/draft-review.json",
  "agent-context/phase-bundles/contract-approval.json",
  "governance/agent-control-plane.json",
  "draft/design-system-preview.html",
  "draft/design-system-review.md",
  "draft/contract-approval-request.json",
  "draft/assumption-ledger.md",
  "lifecycle/contract-state.json"
];

const CANONICAL_READ_ORDER = [
  "agent-context/consumer-plane.json",
  "review-console/session.json",
  "review-console/index.html",
  "progressive/generation-plan.json",
  "agent-context/context-summary.json",
  "agent-context/phase-bundles/index.json",
  "agent-context/phase-bundles/test-first.json",
  "agent-context/phase-bundles/implementation.json",
  "agent-context/phase-bundles/verification.json",
  "agent-context/phase-bundles/qa.json",
  "agent-context/phase-bundles/repair.json",
  "governance/agent-control-plane.json",
  "test-first/test-first-contract.json",
  "test-first/test-quality-standard.json",
  "test-results/initial-red-test-run.md",
  "frontend-agent-contract/implementation-rules.json",
  "frontend-agent-contract/acceptance-criteria.json",
  "experience/route-map.json",
  "screens/screen-inventory.json",
  "verification/playwright-verification-contract.json",
  "lifecycle/execution-state.json",
  "10-revision/repair-task-queue.json",
  "governance/forbidden-behaviors.json",
  "implementation-contract.md",
  "spec/archetype-spec.json"
];

function typeForPath(path: string): DataPlaneArtifactType {
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".txt")) return "text";
  return "other";
}

function phaseForPath(path: string): DataPlanePhase {
  if (path.startsWith("agent-context/")) return "readiness";
  if (path.startsWith("review-console/")) return "readiness";
  if (path.startsWith("progressive/")) return "readiness";
  if (path.startsWith("mcp/")) return "readiness";
  if (path.startsWith("orchestration/")) return "readiness";
  if (path.startsWith("attachments/")) return "evidence";
  if (path.startsWith("lifecycle/")) return "clarification";
  if (path.startsWith("01-evidence/")) return "evidence";
  if (path.startsWith("draft/")) return "draft_contract";
  if (path.startsWith("spec/")) return "canonical_spec";
  if (path.startsWith("test-first/") || path.startsWith("test-results/")) return "test_first";
  if (path.startsWith("verification/")) return "verification";
  if (path.startsWith("qa/")) return "qa";
  if (path.startsWith("10-revision/")) return "repair";
  if (path.startsWith("12-target-frontend/") || path.startsWith("14-target-execution/")) return "implementation";
  if (path.startsWith("00-manifest/") || path === "manifest.json" || path === "readiness-report.md" || path.startsWith("08-quality/")) return "readiness";
  return "unknown";
}

function idForPath(path: string): string {
  return path
    .replace(/\.[^.]+$/u, "")
    .replace(/[^a-zA-Z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .toLowerCase();
}

function addPackage(target: Map<string, Set<ArtifactPackageKind>>, path: string, packageKind: ArtifactPackageKind): void {
  const packages = target.get(path) ?? new Set<ArtifactPackageKind>();
  packages.add(packageKind);
  target.set(path, packages);
}

function seedMap(seeds: ArtifactSeed[]): Map<string, ArtifactSeed> {
  const map = new Map<string, ArtifactSeed>();
  for (const seed of seeds) {
    if (!map.has(seed.path)) map.set(seed.path, seed);
  }
  return map;
}

const TOP_MANIFEST_SEEDS = seedMap([...DRAFT_MANIFEST_ARTIFACTS, ...CANONICAL_TOP_MANIFEST_ARTIFACTS]);
const TOP_MANIFEST_PACKAGES = new Map<string, Set<ArtifactPackageKind>>();
for (const seed of DRAFT_MANIFEST_ARTIFACTS) addPackage(TOP_MANIFEST_PACKAGES, seed.path, "draft");
for (const seed of CANONICAL_TOP_MANIFEST_ARTIFACTS) addPackage(TOP_MANIFEST_PACKAGES, seed.path, "canonical");

const PATH_PACKAGES = new Map<string, Set<ArtifactPackageKind>>();
for (const seed of DRAFT_MANIFEST_ARTIFACTS) addPackage(PATH_PACKAGES, seed.path, "draft");
for (const seed of CANONICAL_ARTIFACT_PATHS) addPackage(PATH_PACKAGES, seed.path, "canonical");

const ALL_PATHS = [...PATH_PACKAGES.keys()].sort();
const REQUIRED_DRAFT_PATHS = new Set(DRAFT_MANIFEST_ARTIFACTS.map((seed) => seed.path));
const REQUIRED_COMPLETE_PATHS = new Set(REQUIRED_COMPLETE_PACKAGE_ARTIFACT_PATHS);
const FORBIDDEN_DRAFT_PATHS = new Set(DRAFT_FORBIDDEN_ARTIFACT_PATHS);
const SUMMARY_ENTRYPOINT_PATHS = new Set([
  ...DRAFT_READ_ORDER,
  ...CANONICAL_READ_ORDER,
  "lifecycle/approval-request.md",
  "lifecycle/approval-decision.json",
  "lifecycle/final-readiness-report.md"
]);

export const ARTIFACT_REGISTRY: ArtifactRegistryEntry[] = ALL_PATHS.map((artifactPath, index) => {
  const seed = TOP_MANIFEST_SEEDS.get(artifactPath) ?? { path: artifactPath };
  const readPriority = seed.readPriority ?? (SUMMARY_ENTRYPOINT_PATHS.has(artifactPath) ? "hot" : "cold");
  const phase = phaseForPath(artifactPath);
  return {
    id: seed.id ?? idForPath(artifactPath),
    path: artifactPath,
    type: seed.type ?? typeForPath(artifactPath),
    required: true,
    packages: [...(PATH_PACKAGES.get(artifactPath) ?? new Set<ArtifactPackageKind>())].sort(),
    phase,
    readPriority,
    topLevelManifestPackages: [...(TOP_MANIFEST_PACKAGES.get(artifactPath) ?? new Set<ArtifactPackageKind>())].sort(),
    validator: {
      requiredForDraft: REQUIRED_DRAFT_PATHS.has(artifactPath),
      requiredForComplete: REQUIRED_COMPLETE_PATHS.has(artifactPath),
      forbiddenInDraft: FORBIDDEN_DRAFT_PATHS.has(artifactPath),
      summaryEntrypoint: SUMMARY_ENTRYPOINT_PATHS.has(artifactPath)
    },
    dataPlane: {
      sourcePhase: phase,
      readPriority
    },
    manifestOrder: index
  };
});

function includesPackage(entry: ArtifactRegistryEntry, packageKind: ArtifactPackageKind): boolean {
  return entry.packages.includes(packageKind);
}

export function artifactRegistryEntryForPath(path: string): ArtifactRegistryEntry | null {
  return ARTIFACT_REGISTRY.find((entry) => entry.path === path) ?? null;
}

export function artifactTypeForRegistryPath(path: string): DataPlaneArtifactType {
  return artifactRegistryEntryForPath(path)?.type ?? typeForPath(path);
}

export function artifactPhaseForRegistryPath(path: string): DataPlanePhase {
  return artifactRegistryEntryForPath(path)?.dataPlane.sourcePhase ?? phaseForPath(path);
}

export function artifactReadPriorityForPath(path: string): ArtifactReadPriority {
  return artifactRegistryEntryForPath(path)?.readPriority ?? "cold";
}

export function manifestArtifactsForPackage(packageKind: ArtifactPackageKind): ManifestArtifactEntry[] {
  return ARTIFACT_REGISTRY
    .filter((entry) => entry.topLevelManifestPackages.includes(packageKind))
    .sort((a, b) => a.manifestOrder - b.manifestOrder)
    .map((entry) => ({
      id: entry.id,
      path: entry.path,
      type: entry.type,
      required: entry.required
    }));
}

export function artifactIndexForPackage(packageKind: ArtifactPackageKind, dynamicPaths: string[] = []): string[] {
  return [
    ...ARTIFACT_REGISTRY.filter((entry) => includesPackage(entry, packageKind)).map((entry) => entry.path),
    ...dynamicPaths
  ].sort();
}

export function requiredCompletePackageArtifactPaths(): string[] {
  return ARTIFACT_REGISTRY.filter((entry) => entry.validator.requiredForComplete).map((entry) => entry.path).sort();
}

export function requiredDraftPackageArtifactPaths(): string[] {
  return ARTIFACT_REGISTRY.filter((entry) => entry.validator.requiredForDraft).map((entry) => entry.path).sort();
}

export function requiredDraftPackageArtifactIds(): string[] {
  return ARTIFACT_REGISTRY.filter((entry) => entry.validator.requiredForDraft).map((entry) => entry.id).sort();
}

export function forbiddenDraftArtifactPaths(): string[] {
  return ARTIFACT_REGISTRY.filter((entry) => entry.validator.forbiddenInDraft).map((entry) => entry.path).sort();
}

export function summaryEntrypointArtifactPaths(packageKind: ArtifactPackageKind): string[] {
  const readOrder = packageKind === "draft" ? DRAFT_READ_ORDER : CANONICAL_READ_ORDER;
  return readOrder.filter((artifactPath) => artifactRegistryEntryForPath(artifactPath)?.packages.includes(packageKind));
}

export function artifactReadOrderForPackage(packageKind: ArtifactPackageKind): string[] {
  return summaryEntrypointArtifactPaths(packageKind);
}
