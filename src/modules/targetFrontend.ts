import type {
  DesignSystemArtifacts,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  TargetFrontendArtifacts
} from "../core/types";
import { slugify } from "../core/stable";

function routeToAppPath(route: string): string {
  const parts = route
    .split("/")
    .filter(Boolean)
    .map((part) => part.startsWith(":") ? `[${part.slice(1)}]` : part);
  return `src/app/${parts.join("/") || "(home)"}/page.tsx`;
}

function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("");
}

function componentPath(component: string): string {
  return `src/components/archetype/${slugify(component)}.tsx`;
}

function patternPath(pattern: string): string {
  return `src/patterns/archetype/${slugify(pattern)}.tsx`;
}

function testPath(suiteId: string): string {
  return `tests/archetype/${slugify(suiteId)}.spec.ts`;
}

export function buildTargetFrontendArtifacts(input: {
  experience: ExperienceArtifacts;
  designSystem: DesignSystemArtifacts;
  frontendContract: FrontendContractArtifacts;
}): TargetFrontendArtifacts {
  const buildManifest = input.frontendContract.buildManifest as {
    frontend_stack?: Record<string, string>;
    build_order?: string[];
    entry_routes?: string[];
    forbidden_behavior?: string[];
  };
  const componentContracts = input.designSystem.componentContracts as { contracts?: Array<{ name?: string }> };
  const patternContracts = input.designSystem.patternContracts as { contracts?: Array<{ name?: string }> };
  const dataOperationContracts = input.frontendContract.dataOperationContracts as { queries?: Array<{ query_id?: string; screen_id?: string }>; mutations?: Array<{ mutation_id?: string; screen_id?: string }> };
  const actionContracts = input.frontendContract.actionContracts as { actions?: Array<{ action_id?: string; screen_id?: string }> };
  const formContracts = input.frontendContract.formContracts as { forms?: Array<{ form_id?: string; screen_id?: string }> };
  const verificationContracts = input.frontendContract.verificationContracts as { test_suites?: Array<{ suite_id?: string; tests?: unknown[] }> };
  const productionIntegrationContracts = input.frontendContract.productionIntegrationContracts as {
    backend_api?: { endpoint_mappings?: Array<{ operation_id?: string }> };
    authentication_authorization?: { route_guards?: unknown[]; action_guards?: unknown[] };
    content_brand?: { copy_surfaces?: unknown[] };
  };

  const routeFiles = input.experience.screenSpecs.map((screen) => ({
    path: routeToAppPath(screen.route),
    kind: "route",
    route: screen.route,
    screen_id: screen.screen_id,
    exports: ["default"],
    reads: [
      `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`,
      "03-experience-architecture/ux-flow-state-completeness.json",
      "06-frontend-agent-contract/data-operation-contracts.json",
      "06-frontend-agent-contract/action-contracts.json"
    ],
    uses_components: screen.required_components.map(componentPath),
    uses_patterns: screen.required_patterns.map(patternPath),
    required_states: Object.keys(screen.states),
    test_selector: `[data-archetype-screen="${screen.screen_id}"]`,
    forbidden_behavior: ["Do not add undeclared routes.", "Do not omit declared screen states."]
  }));

  const componentFiles = ((componentContracts.contracts ?? []).map((component) => ({
    path: componentPath(String(component.name ?? "component")),
    kind: "component",
    component: component.name,
    exports: [pascalCase(String(component.name ?? "Component"))],
    reads: ["04-design-system/components/component-contracts.json", "04-design-system/tokens/token-contracts.json"],
    test_selector: `[data-archetype-component="${slugify(String(component.name ?? "component"))}"]`,
    forbidden_behavior: ["Do not introduce tokenless styling.", "Do not change the component API without revising the contract."]
  })));

  const patternFiles = ((patternContracts.contracts ?? []).map((pattern) => ({
    path: patternPath(String(pattern.name ?? "pattern")),
    kind: "pattern",
    pattern: pattern.name,
    exports: [pascalCase(String(pattern.name ?? "Pattern"))],
    reads: ["04-design-system/patterns/pattern-contracts.json", "04-design-system/components/component-contracts.json"],
    test_selector: `[data-archetype-pattern="${slugify(String(pattern.name ?? "pattern"))}"]`,
    forbidden_behavior: ["Do not compose undeclared components.", "Do not use a pattern on screens where it is not declared."]
  })));

  const supportFiles = [
    {
      path: "package.json",
      kind: "project_config",
      exports: ["scripts", "dependencies"],
      reads: ["06-frontend-agent-contract/build-manifest.json"],
      forbidden_behavior: ["Do not add unapproved UI libraries as design substitutes."]
    },
    {
      path: "tsconfig.json",
      kind: "project_config",
      exports: ["compilerOptions"],
      reads: ["06-frontend-agent-contract/build-manifest.json"],
      forbidden_behavior: ["Do not disable strict TypeScript checks to hide contract gaps."]
    },
    {
      path: "next-env.d.ts",
      kind: "project_config",
      exports: ["next_types"],
      reads: ["06-frontend-agent-contract/build-manifest.json"],
      forbidden_behavior: ["Do not edit generated framework type references by hand."]
    },
    {
      path: "src/app/layout.tsx",
      kind: "app_shell",
      exports: ["default"],
      reads: ["06-frontend-agent-contract/layout-rules.json", "03-experience-architecture/navigation-model.json"],
      forbidden_behavior: ["Do not create navigation items outside route-map.json."]
    },
    {
      path: "src/app/globals.css",
      kind: "style",
      exports: ["global_css_imports"],
      reads: ["04-design-system/tokens/css-variables.css", "04-design-system/tokens/typography.css"],
      forbidden_behavior: ["Do not add global visual styles outside generated tokens."]
    },
    {
      path: "src/lib/archetype/adapter-interfaces.ts",
      kind: "adapter",
      exports: ["ArchetypeDataAdapter", "ArchetypeAuthAdapter"],
      reads: ["12-target-frontend/adapter-interfaces.ts"],
      forbidden_behavior: ["Do not change adapter signatures without revising data, auth, and production integration contracts."]
    },
    {
      path: "src/lib/archetype/data-adapter.ts",
      kind: "adapter",
      exports: ["ArchetypeDataAdapter", "createFixtureDataAdapter"],
      reads: ["06-frontend-agent-contract/data-operation-contracts.json", "06-frontend-agent-contract/production-integration-contracts.json"],
      forbidden_behavior: ["Do not invent backend fields.", "Do not claim production integration before endpoint mappings are confirmed."]
    },
    {
      path: "src/lib/archetype/auth-adapter.ts",
      kind: "adapter",
      exports: ["ArchetypeAuthAdapter", "createFixtureAuthAdapter"],
      reads: ["02-product-model/permission-matrix.json", "06-frontend-agent-contract/production-integration-contracts.json"],
      forbidden_behavior: ["Do not bypass permission_denied states.", "Do not hardcode roles outside the permission matrix."]
    },
    {
      path: "src/lib/archetype/copy-contract.ts",
      kind: "content",
      exports: ["copySurfaces"],
      reads: ["06-frontend-agent-contract/production-integration-contracts.json"],
      forbidden_behavior: ["Do not replace generated copy with production copy unless copy review is complete."]
    },
    {
      path: "src/styles/archetype/tokens.css",
      kind: "style",
      exports: ["css_variables"],
      reads: ["04-design-system/tokens/css-variables.css", "04-design-system/tokens/typography.css"],
      forbidden_behavior: ["Do not add hardcoded color, spacing, radius, shadow, or type values outside tokens."]
    },
    {
      path: "tailwind.config.ts",
      kind: "config",
      exports: ["default"],
      reads: ["04-design-system/tokens/tailwind.config.ts"],
      forbidden_behavior: ["Do not override generated token names without revising token contracts."]
    }
  ];

  const testFiles = ((verificationContracts.test_suites ?? []).map((suite) => ({
    path: testPath(String(suite.suite_id ?? "verification")),
    kind: "test",
    suite_id: suite.suite_id,
    tests: Array.isArray(suite.tests) ? suite.tests.length : 0,
    reads: ["06-frontend-agent-contract/verification-contracts.json"],
    forbidden_behavior: ["Do not delete failing proof obligations.", "Report contract gaps for failed tests."]
  })));

  const files = [...supportFiles, ...routeFiles, ...componentFiles, ...patternFiles, ...testFiles];

  const routeComponentMap = {
    contract_version: "1.0",
    routes: input.experience.screenSpecs.map((screen) => ({
      route: screen.route,
      screen_id: screen.screen_id,
      route_file: routeToAppPath(screen.route),
      components: screen.required_components.map((component) => ({
        name: component,
        file: componentPath(component)
      })),
      patterns: screen.required_patterns.map((pattern) => ({
        name: pattern,
        file: patternPath(pattern)
      })),
      data_query: (dataOperationContracts.queries ?? []).find((query) => query.screen_id === screen.screen_id)?.query_id ?? null,
      actions: (actionContracts.actions ?? []).filter((action) => action.screen_id === screen.screen_id).map((action) => action.action_id),
      forms: (formContracts.forms ?? []).filter((form) => form.screen_id === screen.screen_id).map((form) => form.form_id),
      states: Object.keys(screen.states),
      test_selector: `[data-archetype-screen="${screen.screen_id}"]`
    })),
    blockers: [],
    warnings: []
  };

  const codegenTasks = {
    task_version: "1.0",
    tasks: [
      {
        task_id: "install_target_stack",
        order: 1,
        writes: supportFiles.filter((file) => file.kind === "project_config").map((file) => file.path),
        reads: ["00-manifest/manifest.json", "06-frontend-agent-contract/build-manifest.json"],
        acceptance: "Target repo uses the declared framework, language, styling, and routing contract."
      },
      {
        task_id: "install_tokens_and_shell",
        order: 2,
        writes: supportFiles.filter((file) => ["app_shell", "style", "config"].includes(file.kind)).map((file) => file.path),
        reads: ["04-design-system/tokens/css-variables.css", "04-design-system/tokens/typography.css", "06-frontend-agent-contract/layout-rules.json"],
        acceptance: "App shell and token files exist without hardcoded visual values."
      },
      {
        task_id: "create_adapters",
        order: 3,
        writes: supportFiles.filter((file) => ["adapter", "content"].includes(file.kind)).map((file) => file.path),
        reads: ["06-frontend-agent-contract/production-integration-contracts.json", "06-frontend-agent-contract/fixture-data.json"],
        acceptance: "Data, auth, and copy adapters expose fixture-safe defaults and production confirmation boundaries."
      },
      {
        task_id: "create_components",
        order: 4,
        writes: componentFiles.map((file) => file.path),
        reads: ["04-design-system/components/component-contracts.json", "04-design-system/tokens/token-contracts.json"],
        acceptance: "Every component contract has a file with declared props, states, tokens, and selectors."
      },
      {
        task_id: "create_patterns",
        order: 5,
        writes: patternFiles.map((file) => file.path),
        reads: ["04-design-system/patterns/pattern-contracts.json", "04-design-system/components/component-contracts.json"],
        acceptance: "Every pattern contract has a file composed only from declared components."
      },
      {
        task_id: "create_routes_and_screens",
        order: 6,
        writes: routeFiles.map((file) => file.path),
        reads: ["03-experience-architecture/route-map.json", "05-screen-specs/*.yaml", "06-frontend-agent-contract/component-usage-map.json"],
        acceptance: "Every route renders its declared screen, states, actions, patterns, and accessibility behavior."
      },
      {
        task_id: "create_verification_tests",
        order: 7,
        writes: testFiles.map((file) => file.path),
        reads: ["06-frontend-agent-contract/verification-contracts.json", "12-target-frontend/route-component-map.json"],
        acceptance: "Every verification suite has a test file and no proof obligation is dropped."
      }
    ],
    blockers: files.length > 0 ? [] : ["No source files were generated for the target manifest."],
    warnings: ["This manifest is deterministic source-generation guidance; use the write-target command to materialize it and then run target stack checks."]
  };

  const sourceFileManifest = {
    manifest_version: "1.0",
    target_stack: buildManifest.frontend_stack ?? {},
    build_order: buildManifest.build_order ?? [],
    file_count: files.length,
    files,
    coverage: {
      routes: routeFiles.length,
      components: componentFiles.length,
      patterns: patternFiles.length,
      tests: testFiles.length,
      backend_endpoint_mappings: productionIntegrationContracts.backend_api?.endpoint_mappings?.length ?? 0,
      auth_guards: (productionIntegrationContracts.authentication_authorization?.route_guards?.length ?? 0) + (productionIntegrationContracts.authentication_authorization?.action_guards?.length ?? 0),
      copy_surfaces: productionIntegrationContracts.content_brand?.copy_surfaces?.length ?? 0
    },
    forbidden_behavior: buildManifest.forbidden_behavior ?? [],
    blockers: [],
    warnings: ["Generated source files must still be materialized with write-target and executed in the target frontend repository."]
  };

  const adapterInterfaceSource = [
    "export type ArchetypeAsyncState = \"loading\" | \"default\" | \"empty\" | \"error\" | \"permission_denied\" | \"offline\" | \"partial_data\" | \"stale_data\";",
    "",
    "export interface ArchetypeQueryResult<TRecord = Record<string, unknown>> {",
    "  state: ArchetypeAsyncState;",
    "  data: TRecord[];",
    "  meta: { total: number; refreshedAt: string; pageInfo?: Record<string, unknown> };",
    "  error?: { code: string; message: string; retryable: boolean };",
    "}",
    "",
    "export interface ArchetypeMutationResult<TRecord = Record<string, unknown>> {",
    "  ok: boolean;",
    "  state: \"success_confirmation\" | \"validation_error\" | \"permission_denied\" | \"offline\" | \"error\";",
    "  data?: TRecord;",
    "  error?: { code: string; message: string; retryable: boolean };",
    "}",
    "",
    "export interface ArchetypeDataAdapter {",
    ...(((dataOperationContracts.queries ?? []).map((query) => `  ${String(query.query_id ?? "query").replace(/[^a-zA-Z0-9_]/g, "_")}(params?: Record<string, unknown>): Promise<ArchetypeQueryResult>;`))),
    ...(((dataOperationContracts.mutations ?? []).map((mutation) => `  ${String(mutation.mutation_id ?? "mutation").replace(/[^a-zA-Z0-9_]/g, "_")}(input: Record<string, unknown>): Promise<ArchetypeMutationResult>;`))),
    "}",
    "",
    "export interface ArchetypeAuthAdapter {",
    "  getSession(): Promise<{ user?: { id: string; role_id: string }; permissions: string[]; auth_state: string }>;",
    "  can(permission: string): Promise<boolean>;",
    "}",
    "",
    "export function createFixtureDataAdapter(): ArchetypeDataAdapter {",
    "  throw new Error(\"Implement from fixture-data.json and production-integration-contracts.json.\");",
    "}",
    "",
    "export function createFixtureAuthAdapter(): ArchetypeAuthAdapter {",
    "  throw new Error(\"Implement from permission-matrix.json and production-integration-contracts.json.\");",
    "}"
  ].join("\n");

  const sourceGenerationRunbook = [
    "# Target Frontend Source Generation Runbook",
    "",
    "This runbook tells a downstream frontend-building agent how to turn the exported package into a target repository without design invention.",
    "",
    "## Required Order",
    "",
    ...((codegenTasks.tasks as Array<Record<string, unknown>>).map((task) => `${task.order}. ${task.task_id}: ${task.acceptance}`)),
    "",
    "## Source Manifest",
    "",
    `- Files to create: ${files.length}`,
    `- Route files: ${routeFiles.length}`,
    `- Component files: ${componentFiles.length}`,
    `- Pattern files: ${patternFiles.length}`,
    `- Verification test files: ${testFiles.length}`,
    "",
    "## Non-Negotiables",
    "",
    "- Use generated tokens and typography variables.",
    "- Use declared components and patterns only.",
    "- Use data, auth, and copy adapters for external integration.",
    "- Keep every data-archetype selector from the manifest.",
    "- Report missing decisions as gaps instead of inventing behavior.",
    "- Run the verification suites before handoff."
  ].join("\n");

  return {
    sourceFileManifest,
    routeComponentMap,
    codegenTasks,
    adapterInterfaceSource,
    sourceGenerationRunbook
  };
}
