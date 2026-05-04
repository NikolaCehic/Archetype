import type { ArchetypePackage, SpecArtifacts } from "../core/types";

type SpecInput = Omit<ArchetypePackage, "spec" | "testFirst" | "playwright">;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function productName(pkg: SpecInput): string {
  return String(pkg.product.productModel.product_name ?? pkg.manifest.project_slug);
}

function contractNames(record: Record<string, unknown>, keys: string[]): string[] {
  return keys.flatMap((key) => asArray(record[key])).map((item) => {
    const itemRecord = asRecord(item);
    return String(itemRecord.name ?? itemRecord.id ?? itemRecord.component_id ?? itemRecord.pattern_id ?? "unnamed");
  }).filter((item, index, items) => item !== "unnamed" && items.indexOf(item) === index);
}

function criteriaIds(pkg: SpecInput): string[] {
  return asArray(asRecord(pkg.frontendContract.acceptanceCriteria).criteria).map((item) => {
    const record = asRecord(item);
    return String(record.id ?? record.subject ?? "criterion");
  });
}

function requiredStates(pkg: SpecInput): string[] {
  return [
    ...new Set(pkg.experience.screenSpecs.flatMap((screen) =>
      Object.entries(screen.states)
        .filter(([, state]) => asRecord(state).required === true)
        .map(([state]) => state)
    ))
  ].sort();
}

function lines(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- None."];
}

function buildSpecJson(pkg: SpecInput): Record<string, unknown> {
  const componentContractRecord = asRecord(pkg.designSystem.componentContracts);
  const patternContractRecord = asRecord(pkg.designSystem.patternContracts);
  const verification = asRecord(pkg.frontendContract.verificationContracts);
  const testSuites = asArray(verification.test_suites);

  return {
    schema_version: "1.0",
    spec_version: pkg.manifest.spec_version,
    source_of_truth: true,
    source_of_truth_statement: "This canonical Archetype spec is the source of truth for implementation, test generation, verification, and revision.",
    lifecycle: {
      default_entrypoint: pkg.lifecycle.stateMachine.default_entrypoint,
      current_state: pkg.lifecycle.contextCompletion.current_state,
      next_state: pkg.lifecycle.contextCompletion.next_state,
      context_status: pkg.lifecycle.contextCompletion.status,
      principle: pkg.lifecycle.stateMachine.principle
    },
    product: {
      name: productName(pkg),
      model: pkg.product.productModel,
      users: pkg.product.userModel,
      roles: pkg.product.roleModel,
      permissions: pkg.product.permissionMatrix,
      entities: pkg.product.entityModel,
      entity_lifecycle: pkg.product.entityLifecycle
    },
    experience: {
      route_count: pkg.experience.routeMap.routes.length,
      screen_count: pkg.experience.screenSpecs.length,
      routes: pkg.experience.routeMap.routes,
      flows: pkg.experience.flowSpecs,
      navigation: pkg.experience.navigationModel,
      screen_inventory: pkg.experience.screenInventory,
      screens: pkg.experience.screenSpecs,
      required_states: requiredStates(pkg),
      flow_state_completeness: pkg.experience.uxFlowStateCompleteness
    },
    design_system: {
      principles: pkg.designSystem.designPrinciples,
      visual_direction: pkg.designSystem.visualDirection,
      content_rules: pkg.designSystem.contentRules,
      tokens: {
        primitive: pkg.designSystem.primitiveTokens,
        semantic: pkg.designSystem.semanticTokens,
        component: pkg.designSystem.componentTokens,
        contracts: pkg.designSystem.tokenContracts,
        typography: pkg.designSystem.typographySystem
      },
      components: {
        contracts: pkg.designSystem.componentContracts,
        registry: pkg.designSystem.componentRegistry,
        names: contractNames(componentContractRecord, ["contracts", "components"])
      },
      patterns: {
        contracts: pkg.designSystem.patternContracts,
        registry: pkg.designSystem.patternRegistry,
        names: contractNames(patternContractRecord, ["contracts", "patterns"])
      },
      accessibility: pkg.designSystem.accessibilityRules
    },
    frontend_contract: {
      routing: pkg.frontendContract.routingContract,
      layout: pkg.frontendContract.layoutRules,
      responsive: pkg.frontendContract.responsiveRules,
      interaction: pkg.frontendContract.interactionRules,
      data: pkg.frontendContract.dataContracts,
      data_operations: pkg.frontendContract.dataOperationContracts,
      actions: pkg.frontendContract.actionContracts,
      forms: pkg.frontendContract.formContracts,
      acceptance_criteria: pkg.frontendContract.acceptanceCriteria,
      acceptance_criteria_ids: criteriaIds(pkg),
      production_integration: pkg.frontendContract.productionIntegrationContracts
    },
    verification: {
      contracts: pkg.frontendContract.verificationContracts,
      plan_path: "verification-plan.md",
      test_first_contract_path: "test-first/test-first-contract.json",
      playwright_verification_contract_path: "verification/playwright-verification-contract.json",
      test_suite_count: testSuites.length,
      required_evidence: [
        "Tests generated from this spec before product UI implementation",
        "Test-first contract generated from spec/archetype-spec.json before product UI implementation",
        "Automated route, screen, flow, UI, smoke, integration, and unit evidence",
        "Playwright-backed verification for browser-observable behavior",
        "Playwright evidence generated by archetype verify-target",
        "Archetype contract adherence verification before completion"
      ]
    },
    traceability: {
      source_hash: pkg.manifest.source_hash,
      evidence_sources: pkg.evidence.sources.map((source) => source.source_id),
      assumptions: pkg.evidence.assumptions.map((item) => item.claim ?? item.value ?? item.id),
      missing_information: pkg.evidence.missing_information,
      risks: pkg.evidence.risks.map((item) => item.claim ?? item.value ?? item.id),
      artifact_dependencies: {
        lifecycle: "lifecycle/context-completion.json",
        test_first_contract: "test-first/test-first-contract.json",
        playwright_verification_contract: "verification/playwright-verification-contract.json",
        implementation_contract: "implementation-contract.md",
        agent_contract: "frontend-agent-contract/implementation-rules.json",
        verification_contracts: "06-frontend-agent-contract/verification-contracts.json",
        acceptance_criteria: "frontend-agent-contract/acceptance-criteria.json"
      }
    }
  };
}

function buildSpecMarkdown(pkg: SpecInput, specJson: Record<string, unknown>): string {
  const experience = asRecord(specJson.experience);
  const designSystem = asRecord(specJson.design_system);
  const components = asRecord(asRecord(designSystem.components));
  const patterns = asRecord(asRecord(designSystem.patterns));
  const frontendContract = asRecord(specJson.frontend_contract);
  const verification = asRecord(specJson.verification);

  return [
    "# Archetype Canonical Spec",
    "",
    "This is the source of truth for spec-driven frontend development. The coding agent must derive tests, implementation, verification, and revisions from this spec.",
    "",
    "## Lifecycle",
    "",
    `- Entry point: ${pkg.lifecycle.stateMachine.default_entrypoint}`,
    `- Current state: ${pkg.lifecycle.contextCompletion.current_state}`,
    `- Next state: ${pkg.lifecycle.contextCompletion.next_state}`,
    `- Context status: ${pkg.lifecycle.contextCompletion.status}`,
    `- Principle: ${pkg.lifecycle.stateMachine.principle}`,
    "",
    "## Product",
    "",
    `- Name: ${productName(pkg)}`,
    `- Type: ${String(pkg.product.productModel.product_type ?? "Unknown")}`,
    `- Primary goal: ${String(pkg.product.productModel.primary_goal ?? "Unknown")}`,
    "",
    "## Experience Architecture",
    "",
    `- Routes: ${String(experience.route_count ?? 0)}`,
    `- Screens: ${String(experience.screen_count ?? 0)}`,
    "",
    "### Routes",
    "",
    ...lines(pkg.experience.routeMap.routes.map((route) => `${route.route} -> ${route.screen_id}`)),
    "",
    "### Required States",
    "",
    ...lines(requiredStates(pkg)),
    "",
    "## Design System",
    "",
    stringValue(designSystem.visual_direction, "Visual direction is generated in design-system artifacts."),
    "",
    "### Component Contracts",
    "",
    ...lines(asArray(components.names).map(String).slice(0, 30)),
    "",
    "### Pattern Contracts",
    "",
    ...lines(asArray(patterns.names).map(String).slice(0, 30)),
    "",
    "## Frontend Contract",
    "",
    "- Routing, layout, responsive, interaction, data, action, and form rules are canonical here and mirrored into `frontend-agent-contract/implementation-rules.json`.",
    `- Acceptance criteria: ${criteriaIds(pkg).length}`,
    `- Data contract keys: ${Object.keys(asRecord(frontendContract.data)).length}`,
    `- Action contract keys: ${Object.keys(asRecord(frontendContract.actions)).length}`,
    `- Form contract keys: ${Object.keys(asRecord(frontendContract.forms)).length}`,
    "",
    "## Verification",
    "",
    "- Tests must be generated from this spec before product UI code is implemented.",
    "- The generated test-first contract lives at `test-first/test-first-contract.json` and must be satisfied before implementation.",
    "- Browser-observable behavior must be verified with Playwright-backed evidence in later lifecycle scopes.",
    `- Verification test suites: ${String(verification.test_suite_count ?? 0)}`,
    "",
    "## Traceability",
    "",
    `- Source hash: ${pkg.manifest.source_hash}`,
    `- Evidence sources: ${pkg.evidence.sources.length}`,
    `- Assumptions: ${pkg.evidence.assumptions.length}`,
    `- Missing information: ${pkg.evidence.missing_information.length}`,
    "",
    "## Non-Negotiable Rules",
    "",
    "- No code before contract.",
    "- No implementation before tests.",
    "- No completion before verification.",
    "- Do not invent routes, screens, states, tokens, components, data contracts, actions, forms, or acceptance criteria outside this spec."
  ].join("\n");
}

export function buildSpecArtifacts(pkg: SpecInput): SpecArtifacts {
  const specJson = buildSpecJson(pkg);
  return {
    specJson,
    specMarkdown: buildSpecMarkdown(pkg, specJson)
  };
}
