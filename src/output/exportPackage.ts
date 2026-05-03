import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ArchetypePackage } from "../core/types";

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

export function exportPackage(pkg: ArchetypePackage, outDir: string): void {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  writeJson(outDir, "00-manifest/manifest.json", pkg.manifest);
  writeText(outDir, "00-manifest/package-summary.md", [
    "# Package Summary",
    "",
    `Project: ${pkg.manifest.project_slug}`,
    `Spec version: ${pkg.manifest.spec_version}`,
    `Readiness score: ${pkg.manifest.readiness_score}`,
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
  writeText(outDir, "01-evidence/missing-context.md", listMarkdown("Missing Context", pkg.evidence.missing_information));
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

  writeJson(outDir, "15-productization/productization-readiness.json", {
    productization_version: pkg.productization.productization_version,
    product_name: pkg.productization.product_name,
    summary: pkg.productization.summary,
    runtime_boundary: pkg.productization.runtime_boundary,
    gates: pkg.productization.gates,
    launch_blockers: pkg.productization.launch_blockers,
    preserved_onboarding_contracts: pkg.productization.preserved_onboarding_contracts,
    account_workspace_contract: {
      implementation_status: pkg.productization.accountWorkspace.contract.implementation_status,
      implementable_without_invention: pkg.productization.accountWorkspace.contract.readiness.implementable_without_invention,
      backend_implemented: pkg.productization.accountWorkspace.contract.readiness.backend_implemented,
      artifact: "15-productization/account-workspace-contract.json"
    },
    provider_execution_contract: {
      implementation_status: pkg.productization.providerExecution.contract.implementation_status,
      implementable_without_invention: pkg.productization.providerExecution.contract.readiness.implementable_without_invention,
      service_implemented: pkg.productization.providerExecution.contract.readiness.service_implemented,
      session_keys_persisted: pkg.productization.providerExecution.contract.readiness.session_keys_persisted,
      artifact: "15-productization/provider-execution-contract.json"
    },
    telemetry_audit_contract: {
      implementation_status: pkg.productization.telemetryAudit.contract.implementation_status,
      implementable_without_invention: pkg.productization.telemetryAudit.contract.readiness.implementable_without_invention,
      transport_implemented: pkg.productization.telemetryAudit.contract.readiness.transport_implemented,
      telemetry_default_enabled: pkg.productization.telemetryAudit.contract.readiness.telemetry_default_enabled,
      artifact: "15-productization/telemetry-audit-contract.json"
    },
    deployment_operations_contract: {
      implementation_status: pkg.productization.deploymentOperations.contract.implementation_status,
      implementable_without_invention: pkg.productization.deploymentOperations.contract.readiness.implementable_without_invention,
      deployment_implemented: pkg.productization.deploymentOperations.contract.readiness.deployment_implemented,
      launch_ready: pkg.productization.deploymentOperations.contract.readiness.launch_ready,
      artifact: "15-productization/deployment-operations-contract.json"
    },
    next_phase: pkg.productization.next_phase
  });
  writeText(outDir, "15-productization/productization-readiness.md", pkg.productization.readinessReport);
  writeJson(outDir, "15-productization/account-workspace-contract.json", pkg.productization.accountWorkspace.contract);
  writeText(outDir, "15-productization/account-workspace-contract.md", pkg.productization.accountWorkspace.report);
  writeJson(outDir, "15-productization/provider-execution-contract.json", pkg.productization.providerExecution.contract);
  writeText(outDir, "15-productization/provider-execution-contract.md", pkg.productization.providerExecution.report);
  writeJson(outDir, "15-productization/telemetry-audit-contract.json", pkg.productization.telemetryAudit.contract);
  writeText(outDir, "15-productization/telemetry-audit-contract.md", pkg.productization.telemetryAudit.report);
  writeJson(outDir, "15-productization/deployment-operations-contract.json", pkg.productization.deploymentOperations.contract);
  writeText(outDir, "15-productization/deployment-operations-contract.md", pkg.productization.deploymentOperations.report);

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
