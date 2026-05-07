import type { ArchetypeInput, ArchetypePackage, CompilerOptions, Manifest, ReadinessTier } from "./types";
import { hashContent, slugify, stableId } from "./stable";
import { inferDomainProfile } from "../modules/domain";
import { buildIngestionArtifacts } from "../modules/sourceNormalization";
import { buildEvidenceLedger } from "../modules/evidence";
import { buildProductArtifacts } from "../modules/productModel";
import { buildExperienceArtifacts } from "../modules/experienceArchitecture";
import { buildDesignSystemArtifacts } from "../modules/designSystem";
import { buildFrontendContractArtifacts } from "../modules/frontendContract";
import { buildDSAGGraph } from "../modules/dsag";
import { buildQualityArtifacts } from "../quality/quality";
import { buildSchemaArtifacts } from "../schemas/coreSchemas";
import { buildLLMDecisionArtifacts } from "../modules/llmDecisionLayer";
import { buildReferenceSurfaceArtifacts } from "../modules/referenceSurfaces";
import { buildRevisionArtifacts } from "../modules/revisionProtocol";
import { buildFrontendBuildSimulationArtifacts } from "../modules/frontendBuildSimulation";
import { buildTargetFrontendArtifacts } from "../modules/targetFrontend";
import { buildPendingTargetExecutionArtifacts } from "../modules/targetExecution";
import { buildE2EScenarioArtifacts } from "../modules/e2eScenarios";
import { buildLifecycleArtifacts } from "../modules/lifecycle";
import { buildSpecArtifacts } from "../modules/spec";
import { buildTestFirstArtifacts } from "../modules/testFirstContracts";
import { buildPlaywrightVerificationArtifacts } from "../modules/playwrightVerification";
import { buildContractApprovalState, buildReadinessEvidence } from "../modules/nonNegotiablePrinciples";
import { FRONTEND_PRACTICE_SKILLS } from "../modules/frontendPracticeSkills";
import { REQUIRED_QA_ARTIFACTS } from "../modules/qaTeam";

const ARTIFACT_INDEX = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "manifest.json",
  "readiness-report.md",
  "implementation-contract.md",
  "verification-plan.md",
  "spec/archetype-spec.md",
  "spec/archetype-spec.json",
  "test-first/test-first-contract.json",
  "test-first/test-first-plan.md",
  "test-first/test-quality-standard.json",
  "test-first/test-quality-standard.md",
  "test-results/initial-red-test-run.md",
  "test-first/playwright-contract.spec.ts",
  "test-first/vitest-contract.spec.ts",
  "verification/playwright-verification-contract.json",
  "verification/playwright-verification-plan.md",
  "verification/playwright.config.ts",
  "verification/playwright-verification.spec.ts",
  "verification/playwright-evidence.json",
  "verification/playwright-evidence.md",
  ...REQUIRED_QA_ARTIFACTS.filter((artifact) => artifact.startsWith("qa/")),
  "lifecycle/state-machine.json",
  "lifecycle/start-request.json",
  "lifecycle/context-completion.json",
  "lifecycle/context-matrix.json",
  "lifecycle/readiness-tiers.json",
  "lifecycle/readiness-tiers.md",
  "lifecycle/implementation-phases.json",
  "lifecycle/implementation-phases.md",
  "lifecycle/clarification-turn.json",
  "lifecycle/clarification-turn.md",
  "lifecycle/clarification-state.json",
  "lifecycle/clarification-transcript.md",
  "lifecycle/approval-request.md",
  "lifecycle/approval-decision.json",
  "lifecycle/clarification-questions.json",
  "lifecycle/lifecycle-report.md",
  "lifecycle/final-readiness-report.md",
  "lifecycle/contract-state.json",
  "lifecycle/execution-state.json",
  "lifecycle/execution-state.md",
  "draft/product-model.draft.json",
  "draft/experience-architecture.draft.json",
  "draft/design-system.draft.json",
  "draft/design-system-preview.html",
  "draft/design-system-review.md",
  "draft/frontend-contract.draft.json",
  "draft/assumption-ledger.md",
  "draft/specialist-review.json",
  "draft/contract-approval-request.json",
  "reviews/specialist-review-summary.md",
  "governance/non-negotiable-principles.json",
  "governance/non-negotiable-principles.md",
  "governance/evidence-decision-model.json",
  "governance/evidence-decision-model.md",
  "governance/forbidden-behaviors.json",
  "governance/forbidden-behaviors.md",
  "governance/convergence-standard.json",
  "governance/convergence-standard.md",
  "governance/frontend-practice-skills.json",
  "governance/frontend-practice-skills.md",
  ...FRONTEND_PRACTICE_SKILLS.map((skill) => skill.output_artifact),
  "product/product-model.json",
  "product/user-roles.json",
  "experience/route-map.json",
  "experience/user-flows.json",
  "design-system/tokens.json",
  "design-system/component-contracts.json",
  "screens/screen-inventory.json",
  "screens/screen-specs.json",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/acceptance-criteria.json",
  "frontend-agent-contract/implementation-rules.json",
  "validation/package-validation.json",
  "validation/simulation-report.md",
  "00-manifest/manifest.json",
  "00-manifest/package-summary.md",
  "00-manifest/implementation-readiness.json",
  "00-manifest/schema-validation-report.json",
  "00-manifest/schema-index.json",
  "00-manifest/changelog.md",
  "01-evidence/evidence-ledger.json",
  "01-evidence/source-analysis-report.json",
  "01-evidence/visual-evidence-extraction.json",
  "01-evidence/visual-evidence-extraction.md",
  "01-evidence/assumptions.md",
  "01-evidence/conflicts.md",
  "01-evidence/risks.md",
  "01-evidence/missing-context.md",
  "01-evidence/decision-records.md",
  "02-product-model/product-brief.md",
  "02-product-model/product-model.json",
  "02-product-model/user-model.json",
  "02-product-model/jobs-to-be-done.md",
  "02-product-model/role-model.json",
  "02-product-model/permission-matrix.json",
  "02-product-model/entity-model.json",
  "02-product-model/entity-lifecycle.json",
  "03-experience-architecture/user-journeys.md",
  "03-experience-architecture/flow-specs.json",
  "03-experience-architecture/information-architecture.json",
  "03-experience-architecture/route-map.json",
  "03-experience-architecture/screen-inventory.json",
  "03-experience-architecture/navigation-model.json",
  "03-experience-architecture/state-models.json",
  "03-experience-architecture/screen-state-matrix.json",
  "03-experience-architecture/ux-flow-state-completeness.json",
  "03-experience-architecture/ux-flow-state-completeness.md",
  "03-experience-architecture/action-taxonomy.json",
  "03-experience-architecture/dsag.json",
  "04-design-system/design-principles.md",
  "04-design-system/visual-direction.md",
  "04-design-system/content-rules.md",
  "04-design-system/tokens/primitive-tokens.json",
  "04-design-system/tokens/semantic-tokens.json",
  "04-design-system/tokens/component-tokens.json",
  "04-design-system/tokens/token-contracts.json",
  "04-design-system/tokens/typography-system.json",
  "04-design-system/tokens/theme-light.json",
  "04-design-system/tokens/css-variables.css",
  "04-design-system/tokens/typography.css",
  "04-design-system/tokens/tailwind.config.ts",
  "04-design-system/components/component-contracts.json",
  "04-design-system/components/component-contracts.md",
  "04-design-system/components/component-registry.json",
  "04-design-system/components/component-specs.md",
  "04-design-system/components/component-api-contract.md",
  "04-design-system/patterns/pattern-contracts.json",
  "04-design-system/patterns/pattern-contracts.md",
  "04-design-system/patterns/pattern-registry.json",
  "04-design-system/patterns/pattern-specs.md",
  "04-design-system/patterns/pattern-lifecycle.md",
  "04-design-system/accessibility/accessibility-rules.json",
  "04-design-system/accessibility/accessibility-guidelines.md",
  "04-design-system/docs/foundations.md",
  "04-design-system/docs/usage-guidelines.md",
  "04-design-system/docs/anti-patterns.md",
  "04-design-system/docs/migration-notes.md",
  "05-screen-specs/screen-spec-index.json",
  "06-frontend-agent-contract/build-manifest.json",
  "06-frontend-agent-contract/component-usage-map.json",
  "06-frontend-agent-contract/layout-rules.json",
  "06-frontend-agent-contract/responsive-rules.json",
  "06-frontend-agent-contract/interaction-rules.json",
  "06-frontend-agent-contract/form-rules.json",
  "06-frontend-agent-contract/data-contracts.json",
  "06-frontend-agent-contract/data-operation-contracts.json",
  "06-frontend-agent-contract/action-contracts.json",
  "06-frontend-agent-contract/form-contracts.json",
  "06-frontend-agent-contract/verification-contracts.json",
  "06-frontend-agent-contract/verification-plan.md",
  "06-frontend-agent-contract/production-integration-contracts.json",
  "06-frontend-agent-contract/production-integration-plan.md",
  "06-frontend-agent-contract/routing-contract.json",
  "06-frontend-agent-contract/acceptance-criteria.json",
  "06-frontend-agent-contract/fixture-data.json",
  "06-frontend-agent-contract/frontend-agent-instructions.md",
  "07-agent-runtime/provider-policy.json",
  "07-agent-runtime/prompt-pack-index.json",
  "07-agent-runtime/module-contracts.json",
  "07-agent-runtime/structured-output-policy.md",
  "07-agent-runtime/repair-policy.md",
  "07-agent-runtime/prompt-injection-policy.md",
  "07-reference-surfaces/reference-dashboard.md",
  "07-reference-surfaces/reference-table.md",
  "07-reference-surfaces/reference-form.md",
  "07-reference-surfaces/reference-mobile.md",
  "07-reference-surfaces/reference-chart.md",
  "10-revision/revision-protocol.md",
  "10-revision/artifact-dependency-graph.json",
  "10-revision/invalidation-rules.json",
  "10-revision/initial-change-set.json",
  "10-revision/approval-gates.json",
  "10-revision/decision-diff-policy.md",
  "10-revision/artifact-invalidation-report.md",
  "10-revision/verification-repair-contract.json",
  "10-revision/repair-task-queue.json",
  "10-revision/repair-plan.md",
  "10-revision/drift-report.json",
  "10-revision/drift-report.md",
  "11-build-simulation/build-plan.json",
  "11-build-simulation/route-simulation.json",
  "11-build-simulation/component-resolution.json",
  "11-build-simulation/pattern-resolution.json",
  "11-build-simulation/state-coverage.json",
  "11-build-simulation/data-contract-coverage.json",
  "11-build-simulation/acceptance-simulation.json",
  "11-build-simulation/frontend-build-simulation-report.md",
  "12-target-frontend/source-file-manifest.json",
  "12-target-frontend/route-component-map.json",
  "12-target-frontend/codegen-tasks.json",
  "12-target-frontend/adapter-interfaces.ts",
  "12-target-frontend/source-generation-runbook.md",
  "13-e2e/e2e-scenarios.json",
  "13-e2e/e2e-results.json",
  "13-e2e/e2e-findings.md",
  "14-target-execution/target-execution-report.json",
  "14-target-execution/target-execution-report.md",
  "08-quality/consistency-report.md",
  "08-quality/accessibility-report.md",
  "08-quality/safety-report.md",
  "08-quality/dsag-integrity-report.md",
  "08-quality/screen-coverage-report.md",
  "08-quality/component-coverage-report.md",
  "08-quality/spec-coverage-audit.json",
  "08-quality/spec-coverage-audit.md",
  "08-quality/implementation-readiness-report.md",
  "08-quality/unresolved-decisions.md",
  "08-quality/export-readiness-checklist.md",
  "09-schemas/archetype-intake.schema.json",
  "09-schemas/manifest.schema.json",
  "09-schemas/evidence-ledger.schema.json",
  "09-schemas/visual-evidence-extraction.schema.json",
  "09-schemas/product-model.schema.json",
  "09-schemas/route-map.schema.json",
  "09-schemas/screen-inventory.schema.json",
  "09-schemas/ux-flow-state-completeness.schema.json",
  "09-schemas/screen-spec.schema.json",
  "09-schemas/component-contracts.schema.json",
  "09-schemas/component-registry.schema.json",
  "09-schemas/pattern-contracts.schema.json",
  "09-schemas/pattern-registry.schema.json",
  "09-schemas/data-contracts.schema.json",
  "09-schemas/data-operation-contracts.schema.json",
  "09-schemas/action-contracts.schema.json",
  "09-schemas/form-contracts.schema.json",
  "09-schemas/verification-contracts.schema.json",
  "09-schemas/test-first-contract.schema.json",
  "09-schemas/playwright-verification-contract.schema.json",
  "09-schemas/playwright-evidence.schema.json",
  "09-schemas/verification-repair-contract.schema.json",
  "09-schemas/repair-task-queue.schema.json",
  "09-schemas/drift-report.schema.json",
  "09-schemas/production-integration-contracts.schema.json",
  "09-schemas/token-contracts.schema.json",
  "09-schemas/typography-system.schema.json",
  "09-schemas/spec-coverage-audit.schema.json",
  "09-schemas/source-file-manifest.schema.json",
  "09-schemas/route-component-map.schema.json",
  "09-schemas/codegen-tasks.schema.json",
  "09-schemas/e2e-scenarios.schema.json",
  "09-schemas/e2e-results.schema.json",
  "09-schemas/target-execution-report.schema.json",
  "09-schemas/frontend-build-manifest.schema.json",
  "09-schemas/dsag.schema.json",
  "09-schemas/readiness-report.schema.json"
];

export function runArchetypeCompiler(input: ArchetypeInput, _options: CompilerOptions = {}): ArchetypePackage {
  const profile = inferDomainProfile(input);
  const projectSlug = slugify(input.projectName ?? profile.productType);
  const sourceHash = hashContent(input);
  const projectId = stableId("project", projectSlug, sourceHash);
  const operatingMode = input.operatingMode ?? "full_architecture";

  const ingestion = buildIngestionArtifacts(input);
  const evidence = buildEvidenceLedger(input, profile, projectId, ingestion);
  const product = buildProductArtifacts(input, profile, evidence);
  const experience = buildExperienceArtifacts(input, profile, product, evidence);
  const designSystem = buildDesignSystemArtifacts(input, profile, experience);
  const frontendContract = buildFrontendContractArtifacts(input, profile, product, experience, designSystem);
  const schemas = buildSchemaArtifacts();
  const llm = buildLLMDecisionArtifacts();
  const referenceSurfaces = buildReferenceSurfaceArtifacts(experience, designSystem);
  const dsag = buildDSAGGraph({
    evidence,
    product,
    experience,
    designSystem,
    frontendContract
  });
  const revision = buildRevisionArtifacts({
    evidence,
    product,
    experience,
    frontendContract,
    dsag
  });
  const buildSimulation = buildFrontendBuildSimulationArtifacts({
    experience,
    designSystem,
    frontendContract
  });
  const targetFrontend = buildTargetFrontendArtifacts({
    experience,
    designSystem,
    frontendContract
  });
  const targetExecution = buildPendingTargetExecutionArtifacts();
  const e2e = buildE2EScenarioArtifacts({
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    schemas,
    llm,
    referenceSurfaces,
    revision,
    buildSimulation,
    targetFrontend,
    dsag
  });
  const quality = buildQualityArtifacts({
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    schemas,
    llm,
    referenceSurfaces,
    revision,
    buildSimulation,
    targetFrontend,
    targetExecution,
    e2e,
    dsag
  });
  const lifecycle = buildLifecycleArtifacts(input, ingestion, evidence, quality.readiness);
  const lifecycleGateBlockers = lifecycle.contextCompletion.status === "needs_clarification"
    ? lifecycle.contextMatrix.blockers
    : [];
  const lifecycleGateWarnings = lifecycle.contextMatrix.warnings;
  const contractApproval = buildContractApprovalState(input);
  const approvalBlockers = (contractApproval.blockers as string[] | undefined) ?? [];
  const principleGateBlockers = lifecycle.contextCompletion.status === "complete" ? approvalBlockers : [];
  const gatedReadinessScore = lifecycleGateBlockers.length > 0 ? Math.min(quality.readiness.score, 49) : quality.readiness.score;
  const packageReadinessTier: ReadinessTier = lifecycle.contextCompletion.status === "needs_clarification"
    ? "ready_for_clarification"
    : principleGateBlockers.length > 0
      ? "ready_for_contract_approval"
      : "ready_for_implementation";
  const qualityForManifest = lifecycleGateBlockers.length === 0 && principleGateBlockers.length === 0
    ? quality
    : {
      ...quality,
      validation: quality.validation,
      readiness: {
        ...quality.readiness,
        score: gatedReadinessScore,
        readinessTier: packageReadinessTier,
        readyForFrontendAgent: false,
        blockers: [...new Set([...lifecycleGateBlockers, ...principleGateBlockers, ...quality.readiness.blockers])],
        warnings: [...new Set([...lifecycleGateWarnings, ...quality.readiness.warnings])]
      },
      specCoverageAudit: {
        ...quality.specCoverageAudit,
        summary: {
          ...((quality.specCoverageAudit.summary as Record<string, unknown> | undefined) ?? {}),
          ready_for_frontend_agent: false,
          readiness_score: gatedReadinessScore
        }
      },
      specCoverageReport: quality.specCoverageReport
        .replace(/Ready for frontend agent: .*/u, "Ready for frontend agent: false")
        .replace(/Readiness score: .*/u, `Readiness score: ${gatedReadinessScore}`),
      implementationReadinessReport: [
        quality.implementationReadinessReport,
        "",
        "## Hardened Lifecycle Gates",
        "",
        `Context status: ${lifecycle.contextCompletion.status}`,
        `Contract approval status: ${String(contractApproval.status)}`,
        "",
        ...[...lifecycleGateBlockers, ...principleGateBlockers].map((blocker) => `- ${blocker}`)
      ].join("\n")
    };
  const implementationAuthorized = Boolean(contractApproval.approved) && lifecycleGateBlockers.length === 0 && principleGateBlockers.length === 0;
  const finalReadinessTier: ReadinessTier = implementationAuthorized ? "ready_for_implementation" : packageReadinessTier;
  const finalQuality = {
    ...qualityForManifest,
    readiness: {
      ...qualityForManifest.readiness,
      readinessTier: finalReadinessTier
    }
  };

  const manifest: Manifest = {
    package_id: stableId("package", projectSlug, sourceHash),
    project_slug: projectSlug,
    spec_version: "2.0",
    schema_version: "1.0",
    source_hash: sourceHash,
    generated_at: new Date().toISOString(),
    operating_mode: operatingMode,
    export_target: "react-typescript-tailwind-css-variables",
    readiness_score: finalQuality.readiness.score,
    readiness_tier: finalReadinessTier,
    ready_for_frontend_agent: finalQuality.readiness.readyForFrontendAgent,
    implementation_authorized: implementationAuthorized,
    contract_approval: contractApproval,
    readiness_evidence: buildReadinessEvidence({
      readinessScore: finalQuality.readiness.score,
      readinessTier: finalReadinessTier,
      readyForFrontendAgent: finalQuality.readiness.readyForFrontendAgent,
      implementationAuthorized,
      contextStatus: lifecycle.contextCompletion.status
    }),
    blockers: finalQuality.readiness.blockers,
    warnings: finalQuality.readiness.warnings,
    artifact_index: [
      ...ARTIFACT_INDEX,
      ...experience.screenSpecs.map((screen) => `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`)
    ].sort()
  };

  const packageWithoutSpecTestFirstAndPlaywright: Omit<ArchetypePackage, "spec" | "testFirst" | "playwright"> = {
    manifest,
    lifecycle,
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    dsag,
    schemas,
    llm,
    referenceSurfaces,
    revision,
    buildSimulation,
    targetFrontend,
    targetExecution,
    e2e,
    quality: finalQuality
  };
  const spec = buildSpecArtifacts(packageWithoutSpecTestFirstAndPlaywright);
  const packageWithoutTestFirstAndPlaywright: Omit<ArchetypePackage, "testFirst" | "playwright"> = {
    ...packageWithoutSpecTestFirstAndPlaywright,
    spec
  };
  const testFirst = buildTestFirstArtifacts(packageWithoutTestFirstAndPlaywright);
  const packageWithoutPlaywright: Omit<ArchetypePackage, "playwright"> = {
    ...packageWithoutTestFirstAndPlaywright,
    testFirst
  };
  const playwright = buildPlaywrightVerificationArtifacts(packageWithoutPlaywright);

  return {
    ...packageWithoutPlaywright,
    playwright
  };
}
