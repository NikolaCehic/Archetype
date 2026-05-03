import type {
  ArchetypePackage,
  DesignSystemArtifacts,
  DSAGGraph,
  E2EScenarioArtifacts,
  EvidenceLedger,
  ExperienceArtifacts,
  FrontendBuildSimulationArtifacts,
  FrontendContractArtifacts,
  IngestionArtifacts,
  LLMDecisionArtifacts,
  ProductArtifacts,
  QualityArtifacts,
  ReferenceSurfaceArtifacts,
  RevisionArtifacts,
  ReadinessReport,
  SchemaArtifacts,
  TargetExecutionArtifacts,
  TargetFrontendArtifacts,
  ValidationReport
} from "../core/types";

interface QualityInput {
  ingestion: IngestionArtifacts;
  evidence: EvidenceLedger;
  product: ProductArtifacts;
  experience: ExperienceArtifacts;
  designSystem: DesignSystemArtifacts;
  frontendContract: FrontendContractArtifacts;
  dsag: DSAGGraph;
  schemas: SchemaArtifacts;
  llm: LLMDecisionArtifacts;
  referenceSurfaces: ReferenceSurfaceArtifacts;
  revision: RevisionArtifacts;
  buildSimulation: FrontendBuildSimulationArtifacts;
  targetFrontend: TargetFrontendArtifacts;
  targetExecution: TargetExecutionArtifacts;
  e2e: E2EScenarioArtifacts;
}

function check(id: string, condition: boolean, details: string, warning = false): ValidationReport["checks"][number] {
  return {
    id,
    status: condition ? "pass" : warning ? "warning" : "fail",
    details
  };
}

function schemaRequiredFields(schema: Record<string, unknown>): string[] {
  return Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : [];
}

function validateRequiredFields(
  checks: ValidationReport["checks"],
  schemaName: string,
  schema: Record<string, unknown> | undefined,
  value: Record<string, unknown>,
  label: string
): void {
  if (!schema) {
    checks.push(check(`schema.${schemaName}.present`, false, `${schemaName} is present in schema registry.`));
    return;
  }
  checks.push(check(`schema.${schemaName}.present`, true, `${schemaName} is present in schema registry.`));
  for (const field of schemaRequiredFields(schema)) {
    checks.push(check(`schema.${label}.${field}`, Object.prototype.hasOwnProperty.call(value, field), `${label} includes required field ${field}.`));
  }
}

function coverageItem(id: string, label: string, condition: boolean, artifacts: string[], details: string, warning = false): Record<string, unknown> {
  return {
    id,
    label,
    status: condition ? "pass" : warning ? "warning" : "fail",
    artifacts,
    details
  };
}

function buildSpecCoverageAudit(input: QualityInput, readiness: ReadinessReport): Record<string, unknown> {
  const componentContracts = input.designSystem.componentContracts as { contracts?: unknown[]; blockers?: string[] };
  const patternContracts = input.designSystem.patternContracts as { contracts?: unknown[]; blockers?: string[] };
  const tokenContracts = input.designSystem.tokenContracts as { layers?: Record<string, unknown>; blockers?: string[] };
  const typographySystem = input.designSystem.typographySystem as { type_roles?: Record<string, unknown>; blockers?: string[] };
  const dataOperationContracts = input.frontendContract.dataOperationContracts as { queries?: unknown[]; blockers?: string[] };
  const actionContracts = input.frontendContract.actionContracts as { actions?: unknown[]; blockers?: string[] };
  const formContracts = input.frontendContract.formContracts as { forms?: unknown[]; blockers?: string[] };
  const verificationContracts = input.frontendContract.verificationContracts as { coverage?: { test_count?: number }; blockers?: string[] };
  const productionIntegrationContracts = input.frontendContract.productionIntegrationContracts as {
    backend_api?: { endpoint_mappings?: unknown[] };
    authentication_authorization?: { route_guards?: unknown[]; action_guards?: unknown[] };
    content_brand?: { copy_surfaces?: unknown[] };
    human_review?: { review_gates?: unknown[] };
    target_stack_execution?: { required_commands?: unknown[] };
    blockers?: string[];
  };
  const sourceFileManifest = input.targetFrontend.sourceFileManifest as {
    file_count?: number;
    files?: unknown[];
    coverage?: { routes?: number; components?: number; patterns?: number; tests?: number };
    blockers?: string[];
  };
  const routeComponentMap = input.targetFrontend.routeComponentMap as { routes?: unknown[]; blockers?: string[] };
  const codegenTasks = input.targetFrontend.codegenTasks as { tasks?: unknown[]; blockers?: string[] };
  const e2eScenarios = input.e2e.scenarioCatalog as { scenario_count?: number; scenarios?: unknown[] };
  const e2eResults = input.e2e.scenarioResults as { summary?: { total?: number; fail?: number; warning?: number; pass?: number }; results?: unknown[] };
  const coverage = [
    coverageItem("evidence", "Evidence and source normalization", input.evidence.sources.length > 0 && input.ingestion.normalizedSources.length > 0, ["01-evidence/evidence-ledger.json", "01-evidence/source-analysis-report.json"], "Evidence Ledger and normalized source analysis exist."),
    coverageItem("visual_evidence", "Visual evidence extraction", input.ingestion.visualEvidence.source_count > 0 || input.ingestion.normalizedSources.every((source) => !["image_reference", "screenshot", "design_file"].includes(source.source_type)), ["01-evidence/visual-evidence-extraction.json"], "Visual sources are converted into abstract design signals when present."),
    coverageItem("product_model", "Product, roles, permissions, entities", Object.keys(input.product.productModel).length > 0 && Object.keys(input.product.permissionMatrix).length > 0, ["02-product-model/product-model.json", "02-product-model/permission-matrix.json", "02-product-model/entity-model.json"], "Product model artifacts exist."),
    coverageItem("ux_architecture", "UX architecture, routes, flows, screens", input.experience.routeMap.routes.length > 0 && input.experience.screenSpecs.length > 0 && input.experience.uxFlowStateCompleteness.blockers.length === 0, ["03-experience-architecture/route-map.json", "03-experience-architecture/flow-specs.json", "03-experience-architecture/ux-flow-state-completeness.json", "05-screen-specs/*.yaml"], "Routes, flows, screens, states, transitions, and screen specs are generated."),
    coverageItem("components", "Reusable component contracts", (componentContracts.contracts?.length ?? 0) > 0 && (componentContracts.blockers ?? []).length === 0, ["04-design-system/components/component-contracts.json", "04-design-system/components/component-registry.json"], "Component APIs, states, slots, tokens, and accessibility contracts are generated."),
    coverageItem("patterns", "Product-specific pattern contracts", (patternContracts.contracts?.length ?? 0) > 0 && (patternContracts.blockers ?? []).length === 0, ["04-design-system/patterns/pattern-contracts.json", "04-design-system/patterns/pattern-registry.json"], "Product-specific patterns map to workflows, screens, components, states, and data."),
    coverageItem("tokens_typography", "Tokens and typography", Object.keys(tokenContracts.layers ?? {}).length >= 4 && Object.keys(typographySystem.type_roles ?? {}).length > 0, ["04-design-system/tokens/token-contracts.json", "04-design-system/tokens/typography-system.json"], "Token layers and typography roles are deterministic."),
    coverageItem("frontend_contract", "Frontend build contract", Object.keys(input.frontendContract.buildManifest).length > 0 && (dataOperationContracts.queries?.length ?? 0) > 0 && (actionContracts.actions?.length ?? 0) > 0 && (formContracts.forms?.length ?? 0) > 0, ["06-frontend-agent-contract/build-manifest.json", "06-frontend-agent-contract/data-operation-contracts.json", "06-frontend-agent-contract/action-contracts.json", "06-frontend-agent-contract/form-contracts.json"], "Frontend-agent contract includes build order, data operations, actions, forms, routing, and acceptance criteria."),
    coverageItem("verification", "Implementation verification", (verificationContracts.coverage?.test_count ?? 0) > 0 && (verificationContracts.blockers ?? []).length === 0, ["06-frontend-agent-contract/verification-contracts.json"], "Verification suites define downstream proof obligations."),
    coverageItem("production_integration_contract", "Production integration contract", (productionIntegrationContracts.backend_api?.endpoint_mappings?.length ?? 0) > 0 && (productionIntegrationContracts.authentication_authorization?.route_guards?.length ?? 0) > 0 && (productionIntegrationContracts.content_brand?.copy_surfaces?.length ?? 0) > 0 && (productionIntegrationContracts.human_review?.review_gates?.length ?? 0) > 0 && (productionIntegrationContracts.target_stack_execution?.required_commands?.length ?? 0) > 0 && (productionIntegrationContracts.blockers ?? []).length === 0, ["06-frontend-agent-contract/production-integration-contracts.json", "06-frontend-agent-contract/production-integration-plan.md"], "Backend, auth, copy, review, and target-stack confirmation work is exported as explicit contracts."),
    coverageItem("target_frontend_source_manifest", "Target frontend source manifest", (sourceFileManifest.file_count ?? 0) > 0 && (sourceFileManifest.coverage?.routes ?? 0) === input.experience.screenSpecs.length && (routeComponentMap.routes?.length ?? 0) === input.experience.screenSpecs.length && (codegenTasks.tasks?.length ?? 0) > 0 && (sourceFileManifest.blockers ?? []).length === 0 && (routeComponentMap.blockers ?? []).length === 0 && (codegenTasks.blockers ?? []).length === 0, ["12-target-frontend/source-file-manifest.json", "12-target-frontend/route-component-map.json", "12-target-frontend/codegen-tasks.json", "12-target-frontend/adapter-interfaces.ts", "12-target-frontend/source-generation-runbook.md"], "Downstream frontend builders receive exact file paths, route/component mapping, adapter interfaces, and ordered generation tasks."),
    coverageItem("e2e_scenarios", "E2E scenario coverage", e2eScenarios.scenario_count === 100 && e2eResults.summary?.total === 100 && (e2eResults.summary?.fail ?? 1) === 0, ["13-e2e/e2e-scenarios.json", "13-e2e/e2e-results.json", "13-e2e/e2e-findings.md"], "One hundred web-visible E2E scenarios evaluate happy paths and high-risk edge cases."),
    coverageItem("traceability", "DSAG traceability", input.dsag.integrity.status !== "fail", ["03-experience-architecture/dsag.json", "08-quality/dsag-integrity-report.md"], "DSAG connects evidence, product, UX, design system, contracts, and quality gates."),
    coverageItem("workbench", "Workbench review and handoff", input.referenceSurfaces.dashboard.length > 0 && input.revision.revisionProtocol.length > 0, ["07-reference-surfaces/*.md", "10-revision/revision-protocol.md"], "Workbench package includes review surfaces, governance, revision, simulation, and handoff artifacts."),
    coverageItem("production_backend", "Production backend/API confirmation", false, ["06-frontend-agent-contract/production-integration-contracts.json"], "Live backend API, auth provider, and production validation rules still require project-specific confirmation.", true),
    coverageItem("human_review", "Human accessibility, compliance, and brand review", false, ["08-quality/accessibility-report.md", "00-manifest/implementation-readiness.json"], "Human review remains required for accessibility, compliance, exact copy, and brand judgment.", true)
  ];
  const pass = coverage.filter((item) => item.status === "pass").length;
  const warn = coverage.filter((item) => item.status === "warning").length;
  const fail = coverage.filter((item) => item.status === "fail").length;
  return {
    audit_version: "1.0",
    coverage,
    summary: {
      total: coverage.length,
      pass,
      warning: warn,
      fail,
      ready_for_frontend_agent: readiness.readyForFrontendAgent,
      readiness_score: readiness.score
    },
    remaining_gaps: [
      "Confirm production backend API and data schema.",
      "Confirm authentication and authorization integration.",
      "Confirm exact production copy and brand-specific content.",
      "Run human accessibility and compliance review.",
      "Execute generated frontend source code in the target stack."
    ],
    blockers: coverage.filter((item) => item.status === "fail").map((item) => `${item.id}: ${item.details}`),
    warnings: coverage.filter((item) => item.status === "warning").map((item) => `${item.id}: ${item.details}`),
    evidence_refs: ["decision_compiler_order"]
  };
}

function specCoverageMarkdown(audit: Record<string, unknown>): string {
  const coverage = (audit.coverage as Array<Record<string, unknown>> | undefined) ?? [];
  const summary = audit.summary as Record<string, unknown>;
  const remaining = (audit.remaining_gaps as string[] | undefined) ?? [];
  return [
    "# Spec Coverage Audit",
    "",
    `Ready for frontend agent: ${summary.ready_for_frontend_agent}`,
    `Readiness score: ${summary.readiness_score}`,
    `Coverage: ${summary.pass} pass, ${summary.warning} warning, ${summary.fail} fail`,
    "",
    "## Coverage",
    "",
    ...coverage.map((item) => `- [${item.status}] ${item.label}: ${item.details}`),
    "",
    "## Remaining Gaps",
    "",
    ...remaining.map((gap) => `- ${gap}`)
  ].join("\n");
}

export function buildQualityArtifacts(input: QualityInput): QualityArtifacts {
  const checks: ValidationReport["checks"] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  const routeCount = input.experience.routeMap.routes.length;
  const screenCount = input.experience.screenSpecs.length;
  const requiredStates = ["default", "loading", "empty", "error", "permission_denied", "offline", "partial_data", "stale_data"];
  const recoveryStates = ["error", "permission_denied", "offline", "partial_data", "stale_data", "filtered_empty", "validation_error"];
  const componentRegistry = input.designSystem.componentRegistry as { components?: unknown[] };
  const componentContracts = input.designSystem.componentContracts as {
    component_count?: number;
    contracts?: Array<{
      name?: string;
      prop_contract?: unknown[];
      slot_contract?: unknown[];
      variant_contract?: unknown[];
      state_contract?: unknown[];
      token_contract?: { required_tokens?: unknown[] };
      accessibility_contract?: unknown[];
    }>;
    blockers?: string[];
    warnings?: string[];
  };
  const patternRegistry = input.designSystem.patternRegistry as { patterns?: unknown[] };
  const patternContracts = input.designSystem.patternContracts as {
    pattern_count?: number;
    contracts?: Array<{
      name?: string;
      used_on_screens?: unknown[];
      workflow_refs?: unknown[];
      component_refs?: unknown[];
      variant_contract?: unknown[];
      state_contract?: unknown[];
      data_contract?: { entity_refs?: unknown[] };
      accessibility_contract?: unknown[];
    }>;
    blockers?: string[];
    warnings?: string[];
  };
  const dataContracts = input.frontendContract.dataContracts as { entities?: Record<string, unknown> };
  const dataOperationContracts = input.frontendContract.dataOperationContracts as { queries?: unknown[]; mutations?: unknown[]; blockers?: string[]; warnings?: string[] };
  const actionContracts = input.frontendContract.actionContracts as { actions?: Array<{ action_id?: string; route_target_declared?: boolean }>; blockers?: string[]; warnings?: string[] };
  const formContracts = input.frontendContract.formContracts as { forms?: Array<{ form_id?: string; fields?: unknown[] }>; blockers?: string[]; warnings?: string[] };
  const verificationContracts = input.frontendContract.verificationContracts as {
    test_suites?: Array<{ tests?: unknown[] }>;
    coverage?: { test_count?: number; screens?: number };
    blockers?: string[];
    warnings?: string[];
  };
  const productionIntegrationContracts = input.frontendContract.productionIntegrationContracts as {
    backend_api?: { endpoint_mappings?: unknown[] };
    authentication_authorization?: { route_guards?: unknown[]; action_guards?: unknown[] };
    content_brand?: { copy_surfaces?: unknown[] };
    human_review?: { review_gates?: unknown[] };
    target_stack_execution?: { required_commands?: unknown[]; proof_artifacts?: unknown[] };
    form_validation_alignment?: { forms?: unknown[] };
    blockers?: string[];
    warnings?: string[];
  };
  const sourceFileManifest = input.targetFrontend.sourceFileManifest as {
    file_count?: number;
    files?: Array<{ kind?: string; path?: string }>;
    coverage?: { routes?: number; components?: number; patterns?: number; tests?: number };
    blockers?: string[];
    warnings?: string[];
  };
  const routeComponentMap = input.targetFrontend.routeComponentMap as {
    routes?: unknown[];
    blockers?: string[];
    warnings?: string[];
  };
  const codegenTasks = input.targetFrontend.codegenTasks as {
    tasks?: unknown[];
    blockers?: string[];
    warnings?: string[];
  };
  const e2eScenarios = input.e2e.scenarioCatalog as {
    scenario_count?: number;
    scenarios?: unknown[];
  };
  const e2eResults = input.e2e.scenarioResults as {
    summary?: { total?: number; pass?: number; warning?: number; fail?: number; happy_path?: number; edge_case?: number };
    results?: Array<{ status?: string }>;
    revealed_faults?: unknown[];
    fix_plan?: unknown[];
  };
  const targetExecutionReport = input.targetExecution.executionReport as {
    status?: string;
    commands?: unknown[];
    summary?: Record<string, unknown>;
    blockers?: string[];
    warnings?: string[];
  };
  const tokenContracts = input.designSystem.tokenContracts as {
    layers?: Record<string, unknown>;
    usage_map?: Record<string, unknown>;
    constraints?: unknown[];
    blockers?: string[];
    warnings?: string[];
  };
  const typographySystem = input.designSystem.typographySystem as {
    type_roles?: Record<string, unknown>;
    css_variables?: Record<string, unknown>;
    accessibility_rules?: unknown[];
    blockers?: string[];
    warnings?: string[];
  };
  const evidenceIds = new Set([
    ...input.evidence.known_facts.map((item) => item.id),
    ...input.evidence.observations.map((item) => item.id),
    ...input.evidence.inferences.map((item) => item.id),
    ...input.evidence.assumptions.map((item) => item.id),
    ...input.evidence.risks.map((item) => item.id),
    ...input.evidence.decisions.map((item) => item.id)
  ]);

  checks.push(check("evidence.sources.present", input.evidence.sources.length > 0, "Evidence Ledger has at least one source."));
  checks.push(check("ingestion.sources.normalized", input.ingestion.normalizedSources.length > 0, "Source normalization produced normalized sources."));
  checks.push(check("ingestion.visual_evidence.extracted", input.ingestion.visualEvidence.source_count > 0 || input.ingestion.normalizedSources.every((source) => !["image_reference", "screenshot", "design_file"].includes(source.source_type)), "Visual evidence extraction ran for visual sources."));
  checks.push(check("ingestion.safety.no_blockers", input.ingestion.safetyFindings.every((finding) => finding.severity !== "blocker"), "No blocker-severity safety findings were detected."));
  checks.push(check("product.model.present", Object.keys(input.product.productModel).length > 0, "Product model artifact exists."));
  checks.push(check("routes.present", routeCount > 0, "Route map has at least one route."));
  checks.push(check("screens.present", screenCount > 0, "Screen specs exist."));
  checks.push(check("screens.cover.routes", routeCount === screenCount, "Every generated route has a generated screen spec."));
  checks.push(check("ux_flow_state.completeness.present", input.experience.uxFlowStateCompleteness.summary.screen_count === screenCount, "UX flow/state completeness artifact covers every screen."));
  checks.push(check("ux_flow_state.completeness.no_blockers", input.experience.uxFlowStateCompleteness.blockers.length === 0, "UX flow/state completeness has no blockers."));
  checks.push(check("ux_flow_state.completeness.screens", input.experience.uxFlowStateCompleteness.summary.incomplete_screens === 0, "Every screen passes state coverage."));
  checks.push(check("ux_flow_state.completeness.flows", input.experience.uxFlowStateCompleteness.summary.incomplete_flows === 0, "Every primary flow passes state coverage."));
  checks.push(check("ux_flow_state.transitions.present", input.experience.uxFlowStateCompleteness.state_transition_contracts.every((contract) => contract.transitions.length > 0), "Every screen has state transition contracts."));
  checks.push(check("components.registry.present", Array.isArray(componentRegistry.components) && componentRegistry.components.length > 0, "Component registry exists."));
  checks.push(check("components.contracts.present", Array.isArray(componentContracts.contracts) && componentContracts.contracts.length === (componentRegistry.components?.length ?? -1), "Every registry component has a deterministic component contract."));
  checks.push(check("components.contracts.no_blockers", (componentContracts.blockers ?? []).length === 0, "Component contracts have no blockers."));
  checks.push(check("components.contracts.props", (componentContracts.contracts ?? []).every((contract) => Array.isArray(contract.prop_contract) && contract.prop_contract.length > 0), "Every component contract declares props."));
  checks.push(check("components.contracts.slots", (componentContracts.contracts ?? []).every((contract) => Array.isArray(contract.slot_contract) && contract.slot_contract.length > 0), "Every component contract declares slots."));
  checks.push(check("components.contracts.states", (componentContracts.contracts ?? []).every((contract) => Array.isArray(contract.state_contract) && contract.state_contract.length > 0), "Every component contract declares states."));
  checks.push(check("components.contracts.tokens", (componentContracts.contracts ?? []).every((contract) => Array.isArray(contract.token_contract?.required_tokens) && (contract.token_contract?.required_tokens ?? []).length > 0), "Every component contract declares token dependencies."));
  checks.push(check("components.contracts.accessibility", (componentContracts.contracts ?? []).every((contract) => Array.isArray(contract.accessibility_contract) && contract.accessibility_contract.length > 0), "Every component contract declares accessibility behavior."));
  checks.push(check("patterns.registry.present", Array.isArray(patternRegistry.patterns) && patternRegistry.patterns.length > 0, "Pattern registry exists."));
  checks.push(check("patterns.contracts.present", Array.isArray(patternContracts.contracts) && patternContracts.contracts.length === (patternRegistry.patterns?.length ?? -1), "Every registry pattern has a deterministic pattern contract."));
  checks.push(check("patterns.contracts.no_blockers", (patternContracts.blockers ?? []).length === 0, "Pattern contracts have no blockers."));
  checks.push(check("patterns.contracts.screens", (patternContracts.contracts ?? []).every((contract) => Array.isArray(contract.used_on_screens) && contract.used_on_screens.length > 0), "Every pattern contract maps to screens."));
  checks.push(check("patterns.contracts.workflows", (patternContracts.contracts ?? []).every((contract) => Array.isArray(contract.workflow_refs) && contract.workflow_refs.length > 0), "Every pattern contract maps to workflows."));
  checks.push(check("patterns.contracts.components", (patternContracts.contracts ?? []).every((contract) => Array.isArray(contract.component_refs) && contract.component_refs.length > 0), "Every pattern contract declares component composition."));
  checks.push(check("patterns.contracts.states", (patternContracts.contracts ?? []).every((contract) => Array.isArray(contract.state_contract) && contract.state_contract.length > 0), "Every pattern contract declares states."));
  checks.push(check("patterns.contracts.data", (patternContracts.contracts ?? []).every((contract) => Array.isArray(contract.data_contract?.entity_refs) && (contract.data_contract?.entity_refs ?? []).length > 0), "Every pattern contract declares data entities."));
  checks.push(check("patterns.contracts.accessibility", (patternContracts.contracts ?? []).every((contract) => Array.isArray(contract.accessibility_contract) && contract.accessibility_contract.length > 0), "Every pattern contract declares accessibility behavior."));
  checks.push(check("data.contracts.present", !!dataContracts.entities && Object.keys(dataContracts.entities).length > 0, "Data contracts exist."));
  checks.push(check("data.operations.present", Array.isArray(dataOperationContracts.queries) && dataOperationContracts.queries.length === screenCount, "Data operation contracts include a query for every screen."));
  checks.push(check("data.operations.no_blockers", (dataOperationContracts.blockers ?? []).length === 0, "Data operation contracts have no blockers."));
  checks.push(check("actions.contracts.present", Array.isArray(actionContracts.actions) && actionContracts.actions.length >= screenCount, "Action contracts include generated screen actions."));
  checks.push(check("actions.contracts.no_blockers", (actionContracts.blockers ?? []).length === 0, "Action contracts have no blockers."));
  checks.push(check("actions.contracts.route_targets", (actionContracts.actions ?? []).every((action) => action.route_target_declared !== false), "Action contracts do not target undeclared routes."));
  checks.push(check("forms.contracts.present", Array.isArray(formContracts.forms) && formContracts.forms.length > 0, "Form contracts exist for create, update, or settings flows."));
  checks.push(check("forms.contracts.no_blockers", (formContracts.blockers ?? []).length === 0, "Form contracts have no blockers."));
  checks.push(check("forms.contracts.fields", (formContracts.forms ?? []).every((form) => Array.isArray(form.fields) && form.fields.length > 0), "Every form contract declares fields."));
  checks.push(check("verification.contracts.present", Array.isArray(verificationContracts.test_suites) && verificationContracts.test_suites.length >= 4, "Verification contracts declare required test suites."));
  checks.push(check("verification.contracts.no_blockers", (verificationContracts.blockers ?? []).length === 0, "Verification contracts have no blockers."));
  checks.push(check("verification.contracts.tests", (verificationContracts.coverage?.test_count ?? 0) > screenCount, "Verification contracts include screen, state, design-system, data, action, form, and accessibility tests."));
  checks.push(check("verification.contracts.screens", verificationContracts.coverage?.screens === screenCount, "Verification contracts cover every screen."));
  checks.push(check("production.integration.present", Object.keys(productionIntegrationContracts).length > 0, "Production integration contracts exist."));
  checks.push(check("production.integration.endpoints", (productionIntegrationContracts.backend_api?.endpoint_mappings?.length ?? 0) >= ((dataOperationContracts.queries?.length ?? 0) + (dataOperationContracts.mutations?.length ?? 0)), "Production integration contracts map every generated data operation to a proposed endpoint."));
  checks.push(check("production.integration.route_guards", (productionIntegrationContracts.authentication_authorization?.route_guards?.length ?? 0) === routeCount, "Production integration contracts include route guards for every route."));
  checks.push(check("production.integration.action_guards", (productionIntegrationContracts.authentication_authorization?.action_guards?.length ?? 0) >= (actionContracts.actions?.length ?? 0), "Production integration contracts include action guards for generated actions."));
  checks.push(check("production.integration.copy_surfaces", (productionIntegrationContracts.content_brand?.copy_surfaces?.length ?? 0) === screenCount, "Production integration contracts include copy surfaces for every screen."));
  checks.push(check("production.integration.review_gates", (productionIntegrationContracts.human_review?.review_gates?.length ?? 0) >= 5, "Production integration contracts include backend, auth, copy, accessibility, and target-stack review gates."));
  checks.push(check("production.integration.target_execution", (productionIntegrationContracts.target_stack_execution?.required_commands?.length ?? 0) > 0 && (productionIntegrationContracts.target_stack_execution?.proof_artifacts?.length ?? 0) > 0, "Production integration contracts declare target-stack commands and proof artifacts."));
  checks.push(check("production.integration.no_blockers", (productionIntegrationContracts.blockers ?? []).length === 0, "Production integration contracts have no blockers."));
  checks.push(check("target_frontend.source_manifest.present", (sourceFileManifest.file_count ?? 0) === (sourceFileManifest.files?.length ?? -1) && (sourceFileManifest.file_count ?? 0) > 0, "Target frontend source file manifest exists and file count matches."));
  checks.push(check("target_frontend.source_manifest.routes", sourceFileManifest.coverage?.routes === screenCount, "Target frontend source manifest includes a route file for every screen."));
  checks.push(check("target_frontend.source_manifest.components", (sourceFileManifest.coverage?.components ?? 0) === (componentContracts.contracts?.length ?? -1), "Target frontend source manifest includes a source file for every component contract."));
  checks.push(check("target_frontend.source_manifest.patterns", (sourceFileManifest.coverage?.patterns ?? 0) === (patternContracts.contracts?.length ?? -1), "Target frontend source manifest includes a source file for every pattern contract."));
  checks.push(check("target_frontend.route_component_map.routes", (routeComponentMap.routes?.length ?? 0) === screenCount, "Target frontend route component map covers every screen."));
  checks.push(check("target_frontend.codegen_tasks.present", (codegenTasks.tasks?.length ?? 0) >= 7, "Target frontend codegen tasks define the downstream build order."));
  checks.push(check("target_frontend.adapter_interfaces.present", input.targetFrontend.adapterInterfaceSource.includes("ArchetypeDataAdapter") && input.targetFrontend.adapterInterfaceSource.includes("ArchetypeAuthAdapter"), "Target frontend adapter interface source declares data and auth adapters."));
  checks.push(check("target_frontend.no_blockers", (sourceFileManifest.blockers ?? []).length === 0 && (routeComponentMap.blockers ?? []).length === 0 && (codegenTasks.blockers ?? []).length === 0, "Target frontend source artifacts have no blockers."));
  checks.push(check("e2e.scenarios.count", e2eScenarios.scenario_count === 100 && (e2eScenarios.scenarios?.length ?? 0) === 100, "E2E catalog contains exactly 100 scenarios."));
  checks.push(check("e2e.results.count", e2eResults.summary?.total === 100 && (e2eResults.results?.length ?? 0) === 100, "E2E results cover exactly 100 scenarios."));
  checks.push(check("e2e.results.no_failures", (e2eResults.summary?.fail ?? 0) === 0, "E2E results have no failing scenarios."));
  checks.push(check("e2e.results.revealed_faults", (e2eResults.revealed_faults?.length ?? 0) > 0, "E2E results reveal current faults and fix hints."));
  checks.push(check("target_execution.report.present", Object.keys(targetExecutionReport).length > 0, "Target execution proof report exists."));
  checks.push(check("target_execution.report.commands", (targetExecutionReport.commands?.length ?? 0) >= 3, "Target execution proof tracks install, typecheck, and build commands."));
  checks.push(check("accessibility.rules.present", Object.keys(input.designSystem.accessibilityRules).length > 0, "Accessibility rules exist."));
  checks.push(check("tokens.contracts.present", Object.keys(tokenContracts.layers ?? {}).length >= 4, "Token contracts declare primitive, semantic, component, and typography layers."));
  checks.push(check("tokens.contracts.no_blockers", (tokenContracts.blockers ?? []).length === 0, "Token contracts have no blockers."));
  checks.push(check("tokens.contracts.usage", Object.keys(tokenContracts.usage_map ?? {}).length > 0, "Token contracts declare usage map."));
  checks.push(check("tokens.contracts.constraints", Array.isArray(tokenContracts.constraints) && tokenContracts.constraints.length > 0, "Token contracts declare constraints."));
  checks.push(check("typography.system.present", Object.keys(typographySystem.type_roles ?? {}).length >= 6, "Typography system declares deterministic type roles."));
  checks.push(check("typography.system.no_blockers", (typographySystem.blockers ?? []).length === 0, "Typography system has no blockers."));
  checks.push(check("typography.system.css_variables", Object.keys(typographySystem.css_variables ?? {}).length > 0 && input.designSystem.typographyCss.length > 0, "Typography system exports CSS variables."));
  checks.push(check("typography.system.accessibility", Array.isArray(typographySystem.accessibility_rules) && typographySystem.accessibility_rules.length > 0, "Typography system declares accessibility rules."));
  checks.push(check("frontend.contract.instructions.present", input.frontendContract.frontendAgentInstructions.length > 0, "Frontend-agent instructions exist."));
  checks.push(check("dsag.graph.present", input.dsag.nodes.length > 0 && input.dsag.edges.length > 0, "DSAG graph has nodes and edges."));
  checks.push(check("dsag.integrity.passable", input.dsag.integrity.status !== "fail", "DSAG integrity has no blockers."));
  checks.push(check("llm.provider.policy.present", Object.keys(input.llm.providerPolicy).length > 0, "LLM provider policy exists."));
  checks.push(check("llm.prompt_packs.present", Object.keys(input.llm.promptPackIndex).length > 0, "LLM prompt pack index exists."));
  checks.push(check("llm.structured_output.policy.present", input.llm.structuredOutputPolicy.length > 0, "LLM structured output policy exists."));
  checks.push(check("llm.prompt_injection.policy.present", input.llm.promptInjectionPolicy.length > 0, "LLM prompt-injection policy exists."));
  checks.push(check("reference.dashboard.present", input.referenceSurfaces.dashboard.length > 0, "Reference dashboard surface exists."));
  checks.push(check("reference.table.present", input.referenceSurfaces.table.length > 0, "Reference table surface exists."));
  checks.push(check("reference.form.present", input.referenceSurfaces.form.length > 0, "Reference form surface exists."));
  checks.push(check("reference.mobile.present", input.referenceSurfaces.mobile.length > 0, "Reference mobile surface exists."));
  checks.push(check("reference.chart.present", input.referenceSurfaces.chart.length > 0, "Reference chart surface exists."));
  checks.push(check("revision.protocol.present", input.revision.revisionProtocol.length > 0, "Revision protocol exists."));
  checks.push(check("revision.dependency_graph.present", Array.isArray((input.revision.artifactDependencyGraph.nodes as unknown[] | undefined)) && Array.isArray((input.revision.artifactDependencyGraph.edges as unknown[] | undefined)), "Artifact dependency graph exists."));
  checks.push(check("revision.invalidation_rules.present", Array.isArray((input.revision.invalidationRules.rules as unknown[] | undefined)) && (input.revision.invalidationRules.rules as unknown[]).length > 0, "Invalidation rules exist."));
  checks.push(check("revision.change_set.present", Object.keys(input.revision.initialChangeSet).length > 0, "Initial change set exists."));
  checks.push(check("revision.approval_gates.present", Array.isArray((input.revision.approvalGates.gates as unknown[] | undefined)) && (input.revision.approvalGates.gates as unknown[]).length > 0, "Approval gates exist."));
  checks.push(check("build_simulation.present", input.buildSimulation.status !== undefined, "Frontend build simulation exists."));
  checks.push(check("build_simulation.passable", input.buildSimulation.status !== "fail", "Frontend build simulation has no blockers."));

  validateRequiredFields(checks, "evidence-ledger.schema.json", input.schemas.schemas["evidence-ledger.schema.json"], input.evidence as unknown as Record<string, unknown>, "evidence-ledger");
  validateRequiredFields(checks, "visual-evidence-extraction.schema.json", input.schemas.schemas["visual-evidence-extraction.schema.json"], input.ingestion.visualEvidence as unknown as Record<string, unknown>, "visual-evidence-extraction");
  validateRequiredFields(checks, "product-model.schema.json", input.schemas.schemas["product-model.schema.json"], input.product.productModel, "product-model");
  validateRequiredFields(checks, "route-map.schema.json", input.schemas.schemas["route-map.schema.json"], input.experience.routeMap as unknown as Record<string, unknown>, "route-map");
  validateRequiredFields(checks, "screen-inventory.schema.json", input.schemas.schemas["screen-inventory.schema.json"], input.experience.screenInventory, "screen-inventory");
  validateRequiredFields(checks, "ux-flow-state-completeness.schema.json", input.schemas.schemas["ux-flow-state-completeness.schema.json"], input.experience.uxFlowStateCompleteness as unknown as Record<string, unknown>, "ux-flow-state-completeness");
  validateRequiredFields(checks, "component-contracts.schema.json", input.schemas.schemas["component-contracts.schema.json"], input.designSystem.componentContracts, "component-contracts");
  validateRequiredFields(checks, "component-registry.schema.json", input.schemas.schemas["component-registry.schema.json"], input.designSystem.componentRegistry, "component-registry");
  validateRequiredFields(checks, "pattern-contracts.schema.json", input.schemas.schemas["pattern-contracts.schema.json"], input.designSystem.patternContracts, "pattern-contracts");
  validateRequiredFields(checks, "pattern-registry.schema.json", input.schemas.schemas["pattern-registry.schema.json"], input.designSystem.patternRegistry, "pattern-registry");
  validateRequiredFields(checks, "data-contracts.schema.json", input.schemas.schemas["data-contracts.schema.json"], input.frontendContract.dataContracts, "data-contracts");
  validateRequiredFields(checks, "data-operation-contracts.schema.json", input.schemas.schemas["data-operation-contracts.schema.json"], input.frontendContract.dataOperationContracts, "data-operation-contracts");
  validateRequiredFields(checks, "action-contracts.schema.json", input.schemas.schemas["action-contracts.schema.json"], input.frontendContract.actionContracts, "action-contracts");
  validateRequiredFields(checks, "form-contracts.schema.json", input.schemas.schemas["form-contracts.schema.json"], input.frontendContract.formContracts, "form-contracts");
  validateRequiredFields(checks, "verification-contracts.schema.json", input.schemas.schemas["verification-contracts.schema.json"], input.frontendContract.verificationContracts, "verification-contracts");
  validateRequiredFields(checks, "production-integration-contracts.schema.json", input.schemas.schemas["production-integration-contracts.schema.json"], input.frontendContract.productionIntegrationContracts, "production-integration-contracts");
  validateRequiredFields(checks, "token-contracts.schema.json", input.schemas.schemas["token-contracts.schema.json"], input.designSystem.tokenContracts, "token-contracts");
  validateRequiredFields(checks, "typography-system.schema.json", input.schemas.schemas["typography-system.schema.json"], input.designSystem.typographySystem, "typography-system");
  validateRequiredFields(checks, "frontend-build-manifest.schema.json", input.schemas.schemas["frontend-build-manifest.schema.json"], input.frontendContract.buildManifest, "frontend-build-manifest");
  validateRequiredFields(checks, "source-file-manifest.schema.json", input.schemas.schemas["source-file-manifest.schema.json"], input.targetFrontend.sourceFileManifest, "source-file-manifest");
  validateRequiredFields(checks, "route-component-map.schema.json", input.schemas.schemas["route-component-map.schema.json"], input.targetFrontend.routeComponentMap, "route-component-map");
  validateRequiredFields(checks, "codegen-tasks.schema.json", input.schemas.schemas["codegen-tasks.schema.json"], input.targetFrontend.codegenTasks, "codegen-tasks");
  validateRequiredFields(checks, "e2e-scenarios.schema.json", input.schemas.schemas["e2e-scenarios.schema.json"], input.e2e.scenarioCatalog, "e2e-scenarios");
  validateRequiredFields(checks, "e2e-results.schema.json", input.schemas.schemas["e2e-results.schema.json"], input.e2e.scenarioResults, "e2e-results");
  validateRequiredFields(checks, "target-execution-report.schema.json", input.schemas.schemas["target-execution-report.schema.json"], input.targetExecution.executionReport, "target-execution-report");
  validateRequiredFields(checks, "dsag.schema.json", input.schemas.schemas["dsag.schema.json"], input.dsag as unknown as Record<string, unknown>, "dsag");
  for (const screen of input.experience.screenSpecs) {
    validateRequiredFields(checks, "screen-spec.schema.json", input.schemas.schemas["screen-spec.schema.json"], screen as unknown as Record<string, unknown>, `screen-spec.${screen.screen_id}`);
  }

  for (const screen of input.experience.screenSpecs) {
    for (const state of requiredStates) {
      const hasState = Object.prototype.hasOwnProperty.call(screen.states, state);
      checks.push(check(`screen.${screen.screen_id}.state.${state}`, hasState, `${screen.screen_id} includes ${state} state.`));
    }
    for (const state of recoveryStates) {
      const definition = screen.states[state];
      if (typeof definition === "object" && definition !== null) {
        const recovery = (definition as Record<string, unknown>).recovery_action;
        checks.push(check(`screen.${screen.screen_id}.state.${state}.recovery`, typeof recovery === "string" && recovery.length > 0, `${screen.screen_id} ${state} state includes a recovery action.`));
      }
    }
  }

  for (const route of input.experience.routeMap.routes) {
    const hasScreen = input.experience.screenSpecs.some((screen) => screen.screen_id === route.screen_id);
    checks.push(check(`route.${route.screen_id}.screen_ref`, hasScreen, `${route.route} maps to ${route.screen_id}.`));
    for (const ref of route.evidence_refs) {
      checks.push(check(`route.${route.screen_id}.evidence_ref.${ref}`, evidenceIds.has(ref), `${route.route} evidence ref ${ref} exists in ledger.`));
    }
  }

  for (const screen of input.experience.screenSpecs) {
    const hasAcceptance = screen.acceptance_criteria.length > 0;
    checks.push(check(`screen.${screen.screen_id}.acceptance`, hasAcceptance, `${screen.screen_id} has acceptance criteria.`));
    const hasEvidence = screen.evidence_refs.length > 0;
    checks.push(check(`screen.${screen.screen_id}.evidence`, hasEvidence, `${screen.screen_id} has evidence refs.`));
    for (const ref of screen.evidence_refs) {
      checks.push(check(`screen.${screen.screen_id}.evidence_ref.${ref}`, evidenceIds.has(ref), `${screen.screen_id} evidence ref ${ref} exists in ledger.`));
    }
    for (const component of screen.required_components) {
      const hasContract = (componentContracts.contracts ?? []).some((contract) => contract.name === component);
      checks.push(check(`screen.${screen.screen_id}.component.${component}.contract`, hasContract, `${screen.screen_id} required component ${component} has a component contract.`));
    }
    for (const pattern of screen.required_patterns) {
      const hasContract = (patternContracts.contracts ?? []).some((contract) => contract.name === pattern);
      checks.push(check(`screen.${screen.screen_id}.pattern.${pattern}.contract`, hasContract, `${screen.screen_id} required pattern ${pattern} has a pattern contract.`));
    }
    for (const [state, definition] of Object.entries(screen.states)) {
      const typed = definition as Record<string, unknown>;
      checks.push(check(`screen.${screen.screen_id}.state.${state}.trigger`, typeof typed.trigger === "string" && typed.trigger.length > 0, `${screen.screen_id} ${state} state includes a trigger.`));
      checks.push(check(`screen.${screen.screen_id}.state.${state}.feedback`, typeof typed.user_feedback === "string" && typed.user_feedback.length > 0, `${screen.screen_id} ${state} state includes user feedback.`));
      checks.push(check(`screen.${screen.screen_id}.state.${state}.accessibility`, typeof typed.accessibility === "string" && typed.accessibility.length > 0, `${screen.screen_id} ${state} state includes accessibility behavior.`));
      checks.push(check(`screen.${screen.screen_id}.state.${state}.data`, typeof typed.data_contract_expectation === "string" && typed.data_contract_expectation.length > 0, `${screen.screen_id} ${state} state includes data contract expectation.`));
    }
  }

  const failed = checks.filter((item) => item.status === "fail");
  for (const item of failed) blockers.push(`${item.id}: ${item.details}`);
  blockers.push(...input.dsag.integrity.blockers.map((item) => `DSAG: ${item}`));
  blockers.push(...input.ingestion.safetyFindings.filter((finding) => finding.severity === "blocker").map((finding) => `Safety blocker in ${finding.source_id}: ${finding.finding}`));
  blockers.push(...input.buildSimulation.blockers.map((blocker) => `Build simulation: ${blocker}`));

  if (input.evidence.missing_information.length > 0) {
    warnings.push(...input.evidence.missing_information.map((item) => `Missing context: ${item}`));
  }
  if (input.evidence.risks.length > 0) {
    warnings.push(...input.evidence.risks.map((item) => item.claim ?? "Unspecified risk"));
  }
  warnings.push(...input.experience.uxFlowStateCompleteness.warnings.map((warning) => `UX flow/state completeness: ${warning}`));
  warnings.push(...((componentContracts.warnings ?? []).map((warning) => `Component contracts: ${warning}`)));
  warnings.push(...((patternContracts.warnings ?? []).map((warning) => `Pattern contracts: ${warning}`)));
  warnings.push(...((dataOperationContracts.warnings ?? []).map((warning) => `Data operations: ${warning}`)));
  warnings.push(...((actionContracts.warnings ?? []).map((warning) => `Action contracts: ${warning}`)));
  warnings.push(...((formContracts.warnings ?? []).map((warning) => `Form contracts: ${warning}`)));
  warnings.push(...((verificationContracts.warnings ?? []).map((warning) => `Verification contracts: ${warning}`)));
  warnings.push(...((productionIntegrationContracts.warnings ?? []).map((warning) => `Production integration contracts: ${warning}`)));
  warnings.push(...((sourceFileManifest.warnings ?? []).map((warning) => `Target frontend source manifest: ${warning}`)));
  warnings.push(...((routeComponentMap.warnings ?? []).map((warning) => `Target frontend route map: ${warning}`)));
  warnings.push(...((codegenTasks.warnings ?? []).map((warning) => `Target frontend codegen tasks: ${warning}`)));
  if ((e2eResults.summary?.warning ?? 0) > 0) {
    warnings.push(`E2E scenarios: ${e2eResults.summary?.warning ?? 0} warning scenarios reveal remaining production and runtime proof gaps.`);
  }
  warnings.push(...((tokenContracts.warnings ?? []).map((warning) => `Token contracts: ${warning}`)));
  warnings.push(...((typographySystem.warnings ?? []).map((warning) => `Typography system: ${warning}`)));
  warnings.push(...input.ingestion.safetyFindings.filter((finding) => finding.severity !== "blocker").map((finding) => `Safety ${finding.severity}: ${finding.finding} (${finding.source_id})`));
  warnings.push(...input.dsag.integrity.warnings.map((item) => `DSAG warning: ${item}`));
  warnings.push(...input.buildSimulation.warnings.map((warning) => `Build simulation: ${warning}`));

  const validation: ValidationReport = {
    status: blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass",
    checks,
    blockers,
    warnings
  };

  const dimensions = {
    product_understanding: input.product.productModel ? 15 : 0,
    ux_architecture: routeCount > 0 && screenCount > 0 ? 15 : 0,
    screen_spec_completeness: input.experience.screenSpecs.every((screen) => requiredStates.every((state) => Object.prototype.hasOwnProperty.call(screen.states, state))) && input.experience.uxFlowStateCompleteness.summary.incomplete_screens === 0 ? 15 : 8,
    design_system_coherence: Array.isArray(componentRegistry.components) && Array.isArray(patternRegistry.patterns) && (componentContracts.blockers ?? []).length === 0 && (patternContracts.blockers ?? []).length === 0 && (tokenContracts.blockers ?? []).length === 0 && (typographySystem.blockers ?? []).length === 0 && input.dsag.integrity.status !== "fail" ? 15 : 0,
    accessibility_coverage: Object.keys(input.designSystem.accessibilityRules).length > 0 ? 15 : 0,
    frontend_contract_quality: input.frontendContract.frontendAgentInstructions.length > 0 && !!dataContracts.entities && (dataOperationContracts.blockers ?? []).length === 0 && (actionContracts.blockers ?? []).length === 0 && (formContracts.blockers ?? []).length === 0 && (verificationContracts.blockers ?? []).length === 0 && (productionIntegrationContracts.blockers ?? []).length === 0 && (sourceFileManifest.blockers ?? []).length === 0 && (routeComponentMap.blockers ?? []).length === 0 && (codegenTasks.blockers ?? []).length === 0 && input.buildSimulation.status !== "fail" ? 15 : 0,
    evidence_traceability: input.evidence.decisions.length > 0 ? 10 : 0
  };

  const rawScore = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const score = blockers.length > 0 ? Math.min(rawScore, 74) : warnings.length > 0 ? Math.min(rawScore, 89) : rawScore;
  const hardBlockers = [...blockers];
  if (!dataContracts.entities || Object.keys(dataContracts.entities).length === 0) {
    hardBlockers.push("Missing required data contracts.");
  }
  if (score < 75) hardBlockers.push("Readiness score below frontend-agent threshold.");

  const readiness: ReadinessReport = {
    score,
    readyForFrontendAgent: hardBlockers.length === 0,
    dimensions,
    blockers: hardBlockers,
    warnings,
    requiredHumanReview: [
      "Confirm user roles and permissions.",
      "Confirm backend data schema.",
      "Perform human accessibility review before compliance claims.",
      ...input.evidence.risks.map((risk) => `Review risk: ${risk.claim}`)
    ]
  };
  const specCoverageAudit = buildSpecCoverageAudit(input, readiness);

  return {
    validation,
    readiness,
    dsagIntegrityReport: [
      "# DSAG Integrity Report",
      "",
      `Status: ${input.dsag.integrity.status}`,
      `Nodes: ${input.dsag.nodes.length}`,
      `Edges: ${input.dsag.edges.length}`,
      "",
      "## Checks",
      "",
      ...input.dsag.integrity.checks.map((item) => `- [${item.status === "pass" ? "x" : " "}] ${item.id}: ${item.details}`),
      "",
      "## Blockers",
      "",
      input.dsag.integrity.blockers.length > 0 ? input.dsag.integrity.blockers.map((item) => `- ${item}`).join("\n") : "None.",
      "",
      "## Warnings",
      "",
      input.dsag.integrity.warnings.length > 0 ? input.dsag.integrity.warnings.map((item) => `- ${item}`).join("\n") : "None."
    ].join("\n"),
    consistencyReport: [
      "# Consistency Report",
      "",
      `Routes: ${routeCount}`,
      `Screen specs: ${screenCount}`,
      `Component registry entries: ${componentRegistry.components?.length ?? 0}`,
      `Component contracts: ${componentContracts.contracts?.length ?? 0}`,
      `Pattern registry entries: ${patternRegistry.patterns?.length ?? 0}`,
      `Pattern contracts: ${patternContracts.contracts?.length ?? 0}`,
      `Data operation queries: ${dataOperationContracts.queries?.length ?? 0}`,
      `Action contracts: ${actionContracts.actions?.length ?? 0}`,
      `Form contracts: ${formContracts.forms?.length ?? 0}`,
      `Verification tests: ${verificationContracts.coverage?.test_count ?? 0}`,
      `Production endpoint mappings: ${productionIntegrationContracts.backend_api?.endpoint_mappings?.length ?? 0}`,
      `Production review gates: ${productionIntegrationContracts.human_review?.review_gates?.length ?? 0}`,
      `Target frontend source files: ${sourceFileManifest.file_count ?? 0}`,
      `Target frontend codegen tasks: ${codegenTasks.tasks?.length ?? 0}`,
      `E2E scenarios: ${e2eResults.summary?.total ?? 0}`,
      `E2E warnings: ${e2eResults.summary?.warning ?? 0}`,
      `Token contract layers: ${Object.keys(tokenContracts.layers ?? {}).length}`,
      `Typography roles: ${Object.keys(typographySystem.type_roles ?? {}).length}`,
      `DSAG nodes: ${input.dsag.nodes.length}`,
      `DSAG edges: ${input.dsag.edges.length}`,
      `Schema files: ${Object.keys(input.schemas.schemas).length}`,
      `LLM module contracts: ${Object.keys(input.llm.moduleContracts).length}`,
      `UX state completeness blockers: ${input.experience.uxFlowStateCompleteness.blockers.length}`,
      "Reference surfaces: dashboard, table, form, mobile, chart",
      `Revision invalidation rules: ${(input.revision.invalidationRules.rules as unknown[] | undefined)?.length ?? 0}`,
      `Frontend build simulation: ${input.buildSimulation.status}`,
      "",
      blockers.length === 0 ? "No consistency blockers detected." : `Blockers:\n${blockers.map((item) => `- ${item}`).join("\n")}`
    ].join("\n"),
    accessibilityReport: [
      "# Accessibility Report",
      "",
      "Target: WCAG AA",
      "",
      "- Visible focus states: required.",
      "- Keyboard navigation: required.",
      "- Color-not-sole-indicator: required.",
      "- Chart/table fallback: required when charts appear.",
      "",
      "Status: review_required"
    ].join("\n"),
    screenCoverageReport: [
      "# Screen Coverage Report",
      "",
      ...input.experience.uxFlowStateCompleteness.screen_coverage.map((screen) => `- ${screen.screen_id}: ${screen.route}, ${screen.priority}, ${screen.status}, states ${screen.covered_states.join(", ")}, missing ${screen.missing_required_states.length > 0 ? screen.missing_required_states.join(", ") : "none"}`)
    ].join("\n"),
    componentCoverageReport: [
      "# Component Coverage Report",
      "",
      ...(componentRegistry.components ?? []).map((component) => {
        const typed = component as { name?: string; used_on_screens?: string[] };
        const contract = (componentContracts.contracts ?? []).find((candidate) => candidate.name === typed.name);
        return `- ${typed.name}: ${(typed.used_on_screens ?? []).length} screen refs, contract ${contract ? "present" : "missing"}`;
      })
    ].join("\n"),
    implementationReadinessReport: [
      "# Implementation Readiness Report",
      "",
      `Score: ${readiness.score}`,
      `Ready for frontend agent: ${readiness.readyForFrontendAgent}`,
      "",
      "## Blockers",
      "",
      readiness.blockers.length > 0 ? readiness.blockers.map((item) => `- ${item}`).join("\n") : "None.",
      "",
      "## Warnings",
      "",
      readiness.warnings.length > 0 ? readiness.warnings.map((item) => `- ${item}`).join("\n") : "None."
    ].join("\n"),
    unresolvedDecisions: [
      "# Unresolved Decisions",
      "",
      ...input.evidence.missing_information.map((item) => `- ${item}`)
    ].join("\n"),
    exportReadinessChecklist: [
      "# Export Readiness Checklist",
      "",
      ...checks.map((item) => `- [${item.status === "pass" ? "x" : " "}] ${item.id}: ${item.details}`),
      "",
      `Ready for frontend agent: ${readiness.readyForFrontendAgent}`
    ].join("\n"),
    specCoverageAudit,
    specCoverageReport: specCoverageMarkdown(specCoverageAudit)
  };
}

export function buildSchemaValidationReport(pkg: ArchetypePackage): ValidationReport {
  return pkg.quality.validation;
}
