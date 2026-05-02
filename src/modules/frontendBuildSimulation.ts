import type {
  DesignSystemArtifacts,
  ExperienceArtifacts,
  FrontendBuildSimulationArtifacts,
  FrontendContractArtifacts
} from "../core/types";

interface ComponentRegistryEntry {
  name: string;
}

interface PatternRegistryEntry {
  name: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function buildFrontendBuildSimulationArtifacts(input: {
  experience: ExperienceArtifacts;
  designSystem: DesignSystemArtifacts;
  frontendContract: FrontendContractArtifacts;
}): FrontendBuildSimulationArtifacts {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const componentRegistry = input.designSystem.componentRegistry as { components?: ComponentRegistryEntry[] };
  const patternRegistry = input.designSystem.patternRegistry as { patterns?: PatternRegistryEntry[] };
  const componentNames = new Set((componentRegistry.components ?? []).map((component) => component.name));
  const patternNames = new Set((patternRegistry.patterns ?? []).map((pattern) => pattern.name));
  const dataContracts = input.frontendContract.dataContracts as { entities?: Record<string, unknown>; queries?: unknown[]; mutations?: unknown[] };
  const entityNames = new Set(Object.keys(dataContracts.entities ?? {}));
  const buildManifest = input.frontendContract.buildManifest as { build_order?: string[]; entry_routes?: string[] };
  const componentUsageMap = input.frontendContract.componentUsageMap as Record<string, {
    required_components?: string[];
    required_patterns?: string[];
    required_states?: string[];
    allowed_new_components?: boolean;
  }>;

  const buildPlan = {
    build_order: buildManifest.build_order ?? [],
    entry_routes: buildManifest.entry_routes ?? [],
    simulated_steps: (buildManifest.build_order ?? []).map((step, index) => ({
      order: index + 1,
      step,
      status: "simulated"
    }))
  };

  const routeResults = input.experience.routeMap.routes.map((route) => {
    const screen = input.experience.screenSpecs.find((candidate) => candidate.screen_id === route.screen_id);
    const usage = componentUsageMap[route.screen_id];
    const resultBlockers: string[] = [];
    if (!screen) resultBlockers.push("Missing screen spec.");
    if (!usage) resultBlockers.push("Missing component usage map entry.");
    if (!buildManifest.entry_routes?.includes(route.route)) resultBlockers.push("Route is missing from build manifest entry routes.");
    blockers.push(...resultBlockers.map((blocker) => `${route.route}: ${blocker}`));
    return {
      route: route.route,
      screen_id: route.screen_id,
      layout: route.layout,
      screen_spec_found: Boolean(screen),
      usage_map_found: Boolean(usage),
      entry_route_declared: Boolean(buildManifest.entry_routes?.includes(route.route)),
      status: resultBlockers.length > 0 ? "fail" : "pass",
      blockers: resultBlockers
    };
  });

  const componentResults = input.experience.screenSpecs.map((screen) => {
    const missing = screen.required_components.filter((component) => !componentNames.has(component));
    if (missing.length > 0) blockers.push(`${screen.screen_id}: missing components ${missing.join(", ")}`);
    return {
      screen_id: screen.screen_id,
      required_components: screen.required_components,
      missing_components: missing,
      allowed_new_components: componentUsageMap[screen.screen_id]?.allowed_new_components ?? false,
      status: missing.length > 0 ? "fail" : "pass"
    };
  });

  const patternResults = input.experience.screenSpecs.map((screen) => {
    const missing = screen.required_patterns.filter((pattern) => !patternNames.has(pattern));
    if (missing.length > 0) blockers.push(`${screen.screen_id}: missing patterns ${missing.join(", ")}`);
    return {
      screen_id: screen.screen_id,
      required_patterns: screen.required_patterns,
      missing_patterns: missing,
      status: missing.length > 0 ? "fail" : "pass"
    };
  });

  const requiredStates = ["default", "loading", "empty", "error", "permission_denied", "offline", "partial_data", "stale_data"];
  const recoveryStates = ["error", "permission_denied", "offline", "partial_data", "stale_data", "filtered_empty", "validation_error"];
  const stateResults = input.experience.screenSpecs.map((screen) => {
    const missing = requiredStates.filter((state) => !Object.prototype.hasOwnProperty.call(screen.states, state));
    const missingRecovery = recoveryStates
      .filter((state) => Object.prototype.hasOwnProperty.call(screen.states, state))
      .filter((state) => {
        const definition = screen.states[state];
        return typeof definition !== "object" || definition === null || typeof (definition as Record<string, unknown>).recovery_action !== "string";
      });
    if (missing.length > 0) blockers.push(`${screen.screen_id}: missing states ${missing.join(", ")}`);
    if (missingRecovery.length > 0) blockers.push(`${screen.screen_id}: missing recovery actions for states ${missingRecovery.join(", ")}`);
    return {
      screen_id: screen.screen_id,
      states: Object.keys(screen.states),
      missing_required_states: missing,
      missing_recovery_actions: missingRecovery,
      transition_count: input.experience.uxFlowStateCompleteness.state_transition_contracts.find((contract) => contract.screen_id === screen.screen_id)?.transitions.length ?? 0,
      status: missing.length > 0 || missingRecovery.length > 0 ? "fail" : "pass"
    };
  });

  const dataResults = input.experience.screenSpecs.map((screen) => {
    const missing = screen.data_needs.filter((entity) => !entityNames.has(entity));
    if (missing.length > 0) blockers.push(`${screen.screen_id}: missing data contracts ${missing.join(", ")}`);
    return {
      screen_id: screen.screen_id,
      data_needs: screen.data_needs,
      missing_data_contracts: missing,
      status: missing.length > 0 ? "fail" : "pass"
    };
  });

  const acceptanceCriteria = asArray<{ subject?: string }>((input.frontendContract.acceptanceCriteria as { criteria?: unknown[] }).criteria);
  const acceptanceResults = input.experience.screenSpecs.map((screen) => {
    const criteria = acceptanceCriteria.filter((criterion) => criterion.subject === screen.screen_id);
    if (criteria.length === 0) blockers.push(`${screen.screen_id}: no acceptance criteria available to simulate completion.`);
    return {
      screen_id: screen.screen_id,
      criteria_count: criteria.length,
      verification_methods: [...new Set(screen.acceptance_criteria.map((criterion) => criterion.verification_method))],
      status: criteria.length > 0 ? "pass" : "fail"
    };
  });

  if ((buildManifest.build_order ?? []).length === 0) blockers.push("Build manifest has no build order.");
  if ((buildManifest.entry_routes ?? []).length === 0) blockers.push("Build manifest has no entry routes.");
  if (warnings.length === 0 && blockers.length === 0) {
    warnings.push("Simulation used generated contracts and fixture assumptions; it does not compile a real frontend app yet.");
  }

  const status = blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass";

  return {
    status,
    blockers,
    warnings,
    buildPlan,
    routeSimulation: { routes: routeResults },
    componentResolution: { screens: componentResults },
    patternResolution: { screens: patternResults },
    stateCoverage: { screens: stateResults },
    dataContractCoverage: {
      entity_contracts: [...entityNames],
      query_count: asArray(dataContracts.queries).length,
      mutation_count: asArray(dataContracts.mutations).length,
      screens: dataResults
    },
    acceptanceSimulation: { screens: acceptanceResults },
    simulationReport: [
      "# Frontend Build Simulation Report",
      "",
      `Status: ${status}`,
      `Routes simulated: ${routeResults.length}`,
      `Screens simulated: ${input.experience.screenSpecs.length}`,
      `Components available: ${componentNames.size}`,
      `Patterns available: ${patternNames.size}`,
      `Data contracts available: ${entityNames.size}`,
      "",
      "## Blockers",
      "",
      blockers.length > 0 ? blockers.map((blocker) => `- ${blocker}`).join("\n") : "None.",
      "",
      "## Warnings",
      "",
      warnings.length > 0 ? warnings.map((warning) => `- ${warning}`).join("\n") : "None."
    ].join("\n")
  };
}
