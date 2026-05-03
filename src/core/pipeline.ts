import type { ArchetypeInput, ArchetypePackage, CompilerOptions, Manifest } from "./types";
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
import { buildProductizationArtifacts } from "../modules/productization";

const ARTIFACT_INDEX = [
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
  "15-productization/productization-readiness.json",
  "15-productization/productization-readiness.md",
  "15-productization/account-workspace-contract.json",
  "15-productization/account-workspace-contract.md",
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
  "09-schemas/productization-readiness.schema.json",
  "09-schemas/account-workspace-contract.schema.json",
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
  const productization = buildProductizationArtifacts(input, frontendContract);
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

  const manifest: Manifest = {
    package_id: stableId("package", projectSlug, sourceHash),
    project_slug: projectSlug,
    spec_version: "2.0",
    schema_version: "1.0",
    source_hash: sourceHash,
    generated_at: new Date().toISOString(),
    operating_mode: operatingMode,
    export_target: "react-typescript-tailwind-css-variables",
    readiness_score: quality.readiness.score,
    ready_for_frontend_agent: quality.readiness.readyForFrontendAgent,
    blockers: quality.readiness.blockers,
    warnings: quality.readiness.warnings,
    artifact_index: [
      ...ARTIFACT_INDEX,
      ...experience.screenSpecs.map((screen) => `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`)
    ].sort()
  };

  return {
    manifest,
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
    productization,
    quality
  };
}
