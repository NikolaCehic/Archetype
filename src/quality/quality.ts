import type {
  ArchetypePackage,
  DesignSystemArtifacts,
  DSAGGraph,
  EvidenceLedger,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  IngestionArtifacts,
  LLMDecisionArtifacts,
  ProductArtifacts,
  QualityArtifacts,
  ReferenceSurfaceArtifacts,
  RevisionArtifacts,
  ReadinessReport,
  SchemaArtifacts,
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

export function buildQualityArtifacts(input: QualityInput): QualityArtifacts {
  const checks: ValidationReport["checks"] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  const routeCount = input.experience.routeMap.routes.length;
  const screenCount = input.experience.screenSpecs.length;
  const p0Screens = input.experience.screenSpecs.filter((screen) => screen.priority === "P0");
  const componentRegistry = input.designSystem.componentRegistry as { components?: unknown[] };
  const patternRegistry = input.designSystem.patternRegistry as { patterns?: unknown[] };
  const dataContracts = input.frontendContract.dataContracts as { entities?: Record<string, unknown> };
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
  checks.push(check("ingestion.safety.no_blockers", input.ingestion.safetyFindings.every((finding) => finding.severity !== "blocker"), "No blocker-severity safety findings were detected."));
  checks.push(check("product.model.present", Object.keys(input.product.productModel).length > 0, "Product model artifact exists."));
  checks.push(check("routes.present", routeCount > 0, "Route map has at least one route."));
  checks.push(check("screens.present", screenCount > 0, "Screen specs exist."));
  checks.push(check("screens.cover.routes", routeCount === screenCount, "Every generated route has a generated screen spec."));
  checks.push(check("components.registry.present", Array.isArray(componentRegistry.components) && componentRegistry.components.length > 0, "Component registry exists."));
  checks.push(check("patterns.registry.present", Array.isArray(patternRegistry.patterns) && patternRegistry.patterns.length > 0, "Pattern registry exists."));
  checks.push(check("data.contracts.present", !!dataContracts.entities && Object.keys(dataContracts.entities).length > 0, "Data contracts exist."));
  checks.push(check("accessibility.rules.present", Object.keys(input.designSystem.accessibilityRules).length > 0, "Accessibility rules exist."));
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

  validateRequiredFields(checks, "evidence-ledger.schema.json", input.schemas.schemas["evidence-ledger.schema.json"], input.evidence as unknown as Record<string, unknown>, "evidence-ledger");
  validateRequiredFields(checks, "product-model.schema.json", input.schemas.schemas["product-model.schema.json"], input.product.productModel, "product-model");
  validateRequiredFields(checks, "route-map.schema.json", input.schemas.schemas["route-map.schema.json"], input.experience.routeMap as unknown as Record<string, unknown>, "route-map");
  validateRequiredFields(checks, "screen-inventory.schema.json", input.schemas.schemas["screen-inventory.schema.json"], input.experience.screenInventory, "screen-inventory");
  validateRequiredFields(checks, "component-registry.schema.json", input.schemas.schemas["component-registry.schema.json"], input.designSystem.componentRegistry, "component-registry");
  validateRequiredFields(checks, "pattern-registry.schema.json", input.schemas.schemas["pattern-registry.schema.json"], input.designSystem.patternRegistry, "pattern-registry");
  validateRequiredFields(checks, "data-contracts.schema.json", input.schemas.schemas["data-contracts.schema.json"], input.frontendContract.dataContracts, "data-contracts");
  validateRequiredFields(checks, "frontend-build-manifest.schema.json", input.schemas.schemas["frontend-build-manifest.schema.json"], input.frontendContract.buildManifest, "frontend-build-manifest");
  validateRequiredFields(checks, "dsag.schema.json", input.schemas.schemas["dsag.schema.json"], input.dsag as unknown as Record<string, unknown>, "dsag");
  for (const screen of input.experience.screenSpecs) {
    validateRequiredFields(checks, "screen-spec.schema.json", input.schemas.schemas["screen-spec.schema.json"], screen as unknown as Record<string, unknown>, `screen-spec.${screen.screen_id}`);
  }

  const requiredStates = ["default", "loading", "empty", "error", "permission_denied"];
  for (const screen of p0Screens) {
    for (const state of requiredStates) {
      const hasState = Object.prototype.hasOwnProperty.call(screen.states, state);
      checks.push(check(`screen.${screen.screen_id}.state.${state}`, hasState, `${screen.screen_id} includes ${state} state.`));
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
  }

  const failed = checks.filter((item) => item.status === "fail");
  for (const item of failed) blockers.push(`${item.id}: ${item.details}`);
  blockers.push(...input.dsag.integrity.blockers.map((item) => `DSAG: ${item}`));
  blockers.push(...input.ingestion.safetyFindings.filter((finding) => finding.severity === "blocker").map((finding) => `Safety blocker in ${finding.source_id}: ${finding.finding}`));

  if (input.evidence.missing_information.length > 0) {
    warnings.push(...input.evidence.missing_information.map((item) => `Missing context: ${item}`));
  }
  if (input.evidence.risks.length > 0) {
    warnings.push(...input.evidence.risks.map((item) => item.claim ?? "Unspecified risk"));
  }
  warnings.push(...input.ingestion.safetyFindings.filter((finding) => finding.severity !== "blocker").map((finding) => `Safety ${finding.severity}: ${finding.finding} (${finding.source_id})`));
  warnings.push(...input.dsag.integrity.warnings.map((item) => `DSAG warning: ${item}`));

  const validation: ValidationReport = {
    status: blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass",
    checks,
    blockers,
    warnings
  };

  const dimensions = {
    product_understanding: input.product.productModel ? 15 : 0,
    ux_architecture: routeCount > 0 && screenCount > 0 ? 15 : 0,
    screen_spec_completeness: p0Screens.every((screen) => requiredStates.every((state) => Object.prototype.hasOwnProperty.call(screen.states, state))) ? 15 : 8,
    design_system_coherence: Array.isArray(componentRegistry.components) && Array.isArray(patternRegistry.patterns) && input.dsag.integrity.status !== "fail" ? 15 : 0,
    accessibility_coverage: Object.keys(input.designSystem.accessibilityRules).length > 0 ? 15 : 0,
    frontend_contract_quality: input.frontendContract.frontendAgentInstructions.length > 0 && !!dataContracts.entities ? 15 : 0,
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
      `Pattern registry entries: ${patternRegistry.patterns?.length ?? 0}`,
      `DSAG nodes: ${input.dsag.nodes.length}`,
      `DSAG edges: ${input.dsag.edges.length}`,
      `Schema files: ${Object.keys(input.schemas.schemas).length}`,
      `LLM module contracts: ${Object.keys(input.llm.moduleContracts).length}`,
      "Reference surfaces: dashboard, table, form, mobile, chart",
      `Revision invalidation rules: ${(input.revision.invalidationRules.rules as unknown[] | undefined)?.length ?? 0}`,
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
      ...input.experience.screenSpecs.map((screen) => `- ${screen.screen_id}: ${screen.route}, ${screen.priority}, states ${Object.keys(screen.states).join(", ")}`)
    ].join("\n"),
    componentCoverageReport: [
      "# Component Coverage Report",
      "",
      ...(componentRegistry.components ?? []).map((component) => {
        const typed = component as { name?: string; used_on_screens?: string[] };
        return `- ${typed.name}: ${(typed.used_on_screens ?? []).length} screen refs`;
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
    ].join("\n")
  };
}

export function buildSchemaValidationReport(pkg: ArchetypePackage): ValidationReport {
  return pkg.quality.validation;
}
