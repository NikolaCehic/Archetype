import type {
  DesignSystemArtifacts,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  TargetFrontendArtifacts
} from "../core/types";
import { slugify } from "../core/stable";

type TargetStackKind = "next_app_router" | "vite_react_router";

interface TargetStackPlan {
  kind: TargetStackKind;
  displayName: string;
  routeLayer: string;
  routeOwnership: string;
  appShellPath: string;
  styleEntryPath: string;
  routeRule: string;
  routeFileFor(route: string, screenId: string): string;
  forbiddenFiles: string[];
}

function stackText(stack: Record<string, string>): string {
  return Object.values(stack).join(" ").toLowerCase();
}

function targetStackPlan(stack: Record<string, string>): TargetStackPlan {
  const normalized = stackText(stack);
  const isNext = normalized.includes("next");
  if (isNext) {
    return {
      kind: "next_app_router",
      displayName: "Next.js App Router",
      routeLayer: "src/app",
      routeOwnership: "src/app owns routing and state param normalization only.",
      appShellPath: "src/app/layout.tsx",
      styleEntryPath: "src/app/globals.css",
      routeRule: "Next.js App Router route files normalize route/search params and delegate to feature screens.",
      routeFileFor: routeToNextAppPath,
      forbiddenFiles: ["vite.config.ts", "src/main.tsx", "src/App.tsx", "src/routes/**"]
    };
  }
  return {
    kind: "vite_react_router",
    displayName: "Vite + React Router",
    routeLayer: "src/routes + src/App.tsx",
    routeOwnership: "src/routes owns route modules and src/App.tsx owns React Router wiring only.",
    appShellPath: "src/App.tsx",
    styleEntryPath: "src/index.css",
    routeRule: "Vite/React Router route modules normalize route/search params through src/App.tsx and delegate to feature screens.",
    routeFileFor: (_route, screenId) => `src/routes/${featureSlugForScreen(screenId)}.tsx`,
    forbiddenFiles: ["next.config.mjs", "next-env.d.ts", "src/app/**"]
  };
}

function routeToNextAppPath(route: string): string {
  if (route === "/") return "src/app/page.tsx";
  const parts = route
    .split("/")
    .filter(Boolean)
    .map((part) => part.startsWith(":") ? `[${part.slice(1)}]` : part);
  return `src/app/${parts.join("/")}/page.tsx`;
}

function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("");
}

function screenComponentName(screenId: string): string {
  return `${pascalCase(screenId)}Screen`;
}

function featureSlugForScreen(screenId: string): string {
  return slugify(screenId);
}

function screenPath(screenId: string): string {
  return `src/features/${featureSlugForScreen(screenId)}/screens/${screenComponentName(screenId)}.tsx`;
}

function isLayoutComponent(component: string): boolean {
  const lower = component.toLowerCase();
  return lower.includes("shell") || ["pageheader", "sidebar", "topnav", "detailheader"].includes(lower);
}

function componentPath(component: string): string {
  const layer = isLayoutComponent(component) ? "layout" : "ui";
  return `src/shared/${layer}/${slugify(component)}.tsx`;
}

function patternFeatureSlug(pattern: string): string {
  const lower = pattern.toLowerCase();
  if (lower.includes("campaign")) return "campaigns";
  if (lower.includes("report")) return "reports";
  if (lower.includes("billing")) return "billing";
  if (lower.includes("setting")) return "settings";
  if (lower.includes("workspace")) return "workspaces";
  if (lower.includes("onboarding")) return "onboarding";
  return "workflows";
}

function patternPath(pattern: string): string {
  return `src/features/${patternFeatureSlug(pattern)}/patterns/${slugify(pattern)}.tsx`;
}

function testPath(suiteId: string): string {
  const paths: Record<string, string> = {
    route_smoke: "tests/e2e/archetype-route-smoke.spec.ts",
    user_flows_e2e: "tests/e2e/archetype-user-flows.spec.ts",
    screen_state_ui: "tests/ui/archetype-screen-states.spec.ts",
    contract_integration: "tests/integration/archetype-contracts.spec.ts",
    component_unit: "tests/unit/archetype-components.spec.ts",
    accessibility_ui: "tests/e2e/archetype-accessibility.spec.ts"
  };
  return paths[suiteId] ?? `tests/archetype/${slugify(suiteId)}.spec.ts`;
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
  const visualReferenceContract = (input.designSystem.visualReferenceContract ?? {}) as {
    required?: boolean;
    density_profile?: string;
    navigation_patterns?: string[];
    layout_patterns?: string[];
    component_candidates?: string[];
    interaction_states?: string[];
    verification_assertions?: Array<Record<string, unknown>>;
  };
  const targetPlan = targetStackPlan(buildManifest.frontend_stack ?? {});

  const routeFiles = input.experience.screenSpecs.map((screen) => ({
    path: targetPlan.routeFileFor(screen.route, screen.screen_id),
    kind: "route",
    route: screen.route,
    screen_id: screen.screen_id,
    screen_file: screenPath(screen.screen_id),
    feature_module: featureSlugForScreen(screen.screen_id),
    exports: ["default"],
    reads: [
      "12-target-frontend/route-component-map.json",
      `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`,
      "03-experience-architecture/route-map.json"
    ],
    required_states: Object.keys(screen.states),
    test_selector: `[data-archetype-screen="${screen.screen_id}"]`,
    forbidden_behavior: [
      "Do not add undeclared routes.",
      "Do not render a route without its feature screen.",
      "Do not omit declared screen states.",
      `Do not emit files forbidden for ${targetPlan.displayName}: ${targetPlan.forbiddenFiles.join(", ")}.`
    ]
  }));

  const screenFiles = input.experience.screenSpecs.map((screen) => ({
    path: screenPath(screen.screen_id),
    kind: "screen",
    route: screen.route,
    screen_id: screen.screen_id,
    feature_module: featureSlugForScreen(screen.screen_id),
    exports: [screenComponentName(screen.screen_id)],
    reads: [
      `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`,
      "03-experience-architecture/ux-flow-state-completeness.json",
      "06-frontend-agent-contract/component-usage-map.json",
      "06-frontend-agent-contract/data-operation-contracts.json",
      "06-frontend-agent-contract/action-contracts.json",
      "06-frontend-agent-contract/form-contracts.json",
      "04-design-system/visual-reference-contract.json",
      "01-evidence/visual-evidence-extraction.json"
    ],
    uses_components: screen.required_components.map(componentPath),
    uses_patterns: screen.required_patterns.map(patternPath),
    required_states: Object.keys(screen.states),
    visual_reference_contract: {
      required: visualReferenceContract.required === true,
      density_profile: visualReferenceContract.density_profile ?? "unknown",
      navigation_patterns: visualReferenceContract.navigation_patterns ?? [],
      layout_patterns: visualReferenceContract.layout_patterns ?? [],
      component_candidates: visualReferenceContract.component_candidates ?? [],
      interaction_states: visualReferenceContract.interaction_states ?? [],
      verification_assertions: visualReferenceContract.verification_assertions ?? [],
      assertion_count: visualReferenceContract.verification_assertions?.length ?? 0
    },
    test_selector: `[data-archetype-screen="${screen.screen_id}"]`,
    forbidden_behavior: ["Do not implement screen UI in the route file.", "Do not omit declared screen states.", "Do not bypass data, action, form, or permission contracts.", "Do not keep unavailable actions active in terminal states.", "Do not drop visual-reference assertions when screenshots, wireframes, or design files exist."]
  }));

  const componentFiles = ((componentContracts.contracts ?? []).map((component) => ({
    path: componentPath(String(component.name ?? "component")),
    kind: "component",
    component: component.name,
    layer: isLayoutComponent(String(component.name ?? "")) ? "shared_layout" : "shared_ui",
    shadcn_strategy: "contract_bound_wrapper",
    exports: [pascalCase(String(component.name ?? "Component"))],
    reads: ["04-design-system/components/component-contracts.json", "04-design-system/tokens/token-contracts.json"],
    test_selector: `[data-archetype-component="${slugify(String(component.name ?? "component"))}"]`,
    forbidden_behavior: ["Do not introduce tokenless styling.", "Do not paste untouched shadcn examples.", "Do not change the component API without revising the contract."]
  })));

  const patternFiles = ((patternContracts.contracts ?? []).map((pattern) => ({
    path: patternPath(String(pattern.name ?? "pattern")),
    kind: "pattern",
    pattern: pattern.name,
    feature_module: patternFeatureSlug(String(pattern.name ?? "pattern")),
    exports: [pascalCase(String(pattern.name ?? "Pattern"))],
    reads: ["04-design-system/patterns/pattern-contracts.json", "04-design-system/components/component-contracts.json"],
    test_selector: `[data-archetype-pattern="${slugify(String(pattern.name ?? "pattern"))}"]`,
    forbidden_behavior: ["Do not compose undeclared components.", "Do not use a pattern on screens where it is not declared."]
  })));

  const frameworkSupportFiles = targetPlan.kind === "next_app_router"
    ? [
      {
        path: "package.json",
        kind: "project_config",
        exports: ["scripts", "dependencies"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not add unapproved UI libraries as design substitutes."]
      },
      {
        path: "next.config.mjs",
        kind: "project_config",
        exports: ["default"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not change framework execution settings to hide generated-source errors."]
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
      }
    ]
    : [
      {
        path: "package.json",
        kind: "project_config",
        exports: ["scripts", "dependencies"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not add unapproved UI libraries as design substitutes."]
      },
      {
        path: "vite.config.ts",
        kind: "project_config",
        exports: ["default"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not change framework execution settings to hide generated-source errors."]
      },
      {
        path: "tsconfig.json",
        kind: "project_config",
        exports: ["compilerOptions"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not disable strict TypeScript checks to hide contract gaps."]
      },
      {
        path: "index.html",
        kind: "html_entry",
        exports: ["root"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not add product UI to index.html."]
      },
      {
        path: "src/vite-env.d.ts",
        kind: "project_config",
        exports: ["vite_client_types"],
        reads: ["06-frontend-agent-contract/build-manifest.json"],
        forbidden_behavior: ["Do not edit generated framework type references by hand."]
      },
      {
        path: "src/main.tsx",
        kind: "app_entry",
        exports: ["root_render"],
        reads: ["06-frontend-agent-contract/build-manifest.json", "03-experience-architecture/route-map.json"],
        forbidden_behavior: ["Do not put product UI composition in src/main.tsx."]
      },
      {
        path: "src/App.tsx",
        kind: "app_shell",
        exports: ["default"],
        reads: ["06-frontend-agent-contract/layout-rules.json", "03-experience-architecture/navigation-model.json", "12-target-frontend/route-component-map.json"],
        forbidden_behavior: ["Do not create navigation items outside route-map.json.", "Do not put feature screen composition in src/App.tsx."]
      },
      {
        path: "src/index.css",
        kind: "style",
        exports: ["global_css_imports"],
        reads: ["04-design-system/tokens/css-variables.css", "04-design-system/tokens/typography.css"],
        forbidden_behavior: ["Do not add global visual styles outside generated tokens."]
      }
    ];

  const supportFiles = [
    ...frameworkSupportFiles,
    {
      path: "src/shared/api/adapter-interfaces.ts",
      kind: "adapter",
      exports: ["ArchetypeDataAdapter", "ArchetypeAuthAdapter"],
      reads: ["12-target-frontend/adapter-interfaces.ts"],
      forbidden_behavior: ["Do not change adapter signatures without revising data, auth, and production integration contracts."]
    },
    {
      path: "src/shared/api/data-adapter.ts",
      kind: "adapter",
      exports: ["ArchetypeDataAdapter", "createFixtureDataAdapter"],
      reads: ["06-frontend-agent-contract/data-operation-contracts.json", "06-frontend-agent-contract/production-integration-contracts.json"],
      forbidden_behavior: ["Do not invent backend fields.", "Do not claim production integration before endpoint mappings are confirmed."]
    },
    {
      path: "src/shared/auth/auth-adapter.ts",
      kind: "adapter",
      exports: ["ArchetypeAuthAdapter", "createFixtureAuthAdapter"],
      reads: ["02-product-model/permission-matrix.json", "06-frontend-agent-contract/production-integration-contracts.json"],
      forbidden_behavior: ["Do not bypass permission_denied states.", "Do not hardcode roles outside the permission matrix."]
    },
    {
      path: "src/shared/content/copy-contract.ts",
      kind: "content",
      exports: ["copySurfaces"],
      reads: ["06-frontend-agent-contract/production-integration-contracts.json"],
      forbidden_behavior: ["Do not replace generated copy with production copy unless copy review is complete."]
    },
    {
      path: "src/design-system/tokens.css",
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
    },
    {
      path: "playwright.config.ts",
      kind: "test_config",
      exports: ["default"],
      reads: ["test-first/test-quality-standard.json", "verification/playwright.config.ts", "verification/playwright-verification-contract.json"],
      forbidden_behavior: ["Do not remove Playwright browser evidence from the verification loop."]
    }
  ];

  const testFiles = ((verificationContracts.test_suites ?? []).map((suite) => ({
    path: testPath(String(suite.suite_id ?? "verification")),
    kind: "test",
    suite_id: suite.suite_id,
    tests: Array.isArray(suite.tests) ? suite.tests.length : 0,
    reads: ["test-first/test-first-contract.json", "test-first/test-quality-standard.json", "verification/playwright-verification-contract.json", "06-frontend-agent-contract/verification-contracts.json"],
    forbidden_behavior: ["Do not write product UI before creating tests.", "Do not delete failing proof obligations.", "Report contract gaps for failed tests."]
  })));
  const playwrightVerificationFiles = [
    {
      path: "tests/e2e/archetype-route-smoke.spec.ts",
      kind: "playwright_verification",
      suite_id: "playwright_verification",
      tests: 0,
      reads: ["test-first/test-quality-standard.json", "verification/playwright-verification-contract.json"],
      forbidden_behavior: ["Do not remove browser-observable route, state, flow, responsive, accessibility, action-state, or visual-smoke checks."]
    },
    {
      path: "tests/e2e/archetype-user-flows.spec.ts",
      kind: "playwright_traceability",
      suite_id: "playwright_flow_traceability",
      tests: 0,
      reads: ["test-first/test-quality-standard.json", "verification/playwright-verification-contract.json"],
      forbidden_behavior: ["Do not remove the required test-first target file."]
    },
    {
      path: "tests/ui/archetype-screen-states.spec.ts",
      kind: "playwright_traceability",
      suite_id: "playwright_state_traceability",
      tests: 0,
      reads: ["test-first/test-quality-standard.json", "verification/playwright-verification-contract.json"],
      forbidden_behavior: ["Do not remove the required test-first target file."]
    },
    {
      path: "tests/e2e/archetype-accessibility.spec.ts",
      kind: "playwright_traceability",
      suite_id: "playwright_accessibility_traceability",
      tests: 0,
      reads: ["test-first/test-quality-standard.json", "verification/playwright-verification-contract.json"],
      forbidden_behavior: ["Do not remove the required test-first target file."]
    }
  ];
  const testFirstTraceabilityFiles = [
    {
      path: "tests/integration/archetype-contracts.spec.ts",
      kind: "test_first_traceability",
      suite_id: "contract_integration",
      tests: 0,
      reads: ["test-first/test-first-contract.json", "test-first/vitest-contract.spec.ts", "06-frontend-agent-contract/data-operation-contracts.json", "06-frontend-agent-contract/action-contracts.json", "06-frontend-agent-contract/form-contracts.json"],
      forbidden_behavior: ["Do not remove integration test ids from the test-first contract.", "Do not replace action/data/form assertions with marker-only checks."]
    },
    {
      path: "tests/unit/archetype-components.spec.ts",
      kind: "test_first_traceability",
      suite_id: "component_unit",
      tests: 0,
      reads: ["test-first/test-first-contract.json", "test-first/vitest-contract.spec.ts", "04-design-system/components/component-contracts.json", "04-design-system/patterns/pattern-contracts.json", "04-design-system/tokens/token-contracts.json"],
      forbidden_behavior: ["Do not remove component, pattern, or token test ids from the test-first contract.", "Do not replace component assertions with marker-only checks."]
    }
  ];

  const files = [...supportFiles, ...playwrightVerificationFiles, ...testFirstTraceabilityFiles, ...testFiles, ...routeFiles, ...screenFiles, ...componentFiles, ...patternFiles];

  const routeComponentMap = {
    contract_version: "1.0",
    routes: input.experience.screenSpecs.map((screen) => ({
      route: screen.route,
      screen_id: screen.screen_id,
      route_file: targetPlan.routeFileFor(screen.route, screen.screen_id),
      screen_file: screenPath(screen.screen_id),
      feature_module: featureSlugForScreen(screen.screen_id),
      components: screen.required_components.map((component) => ({
        name: component,
        file: componentPath(component),
        layer: isLayoutComponent(component) ? "shared_layout" : "shared_ui"
      })),
      patterns: screen.required_patterns.map((pattern) => ({
        name: pattern,
        file: patternPath(pattern),
        feature_module: patternFeatureSlug(pattern)
      })),
      data_query: (dataOperationContracts.queries ?? []).find((query) => query.screen_id === screen.screen_id)?.query_id ?? null,
      actions: (actionContracts.actions ?? []).filter((action) => action.screen_id === screen.screen_id).map((action) => action.action_id),
      forms: (formContracts.forms ?? []).filter((form) => form.screen_id === screen.screen_id).map((form) => form.form_id),
      states: Object.keys(screen.states),
      visual_reference: {
        required: visualReferenceContract.required === true,
        density_profile: visualReferenceContract.density_profile ?? "unknown",
        navigation_patterns: visualReferenceContract.navigation_patterns ?? [],
        layout_patterns: visualReferenceContract.layout_patterns ?? [],
        component_candidates: visualReferenceContract.component_candidates ?? [],
        interaction_states: visualReferenceContract.interaction_states ?? [],
        verification_assertions: visualReferenceContract.verification_assertions ?? [],
        assertion_count: visualReferenceContract.verification_assertions?.length ?? 0
      },
      test_selector: `[data-archetype-screen="${screen.screen_id}"]`,
      architecture_layers: {
        route: targetPlan.routeOwnership,
        screen: "src/features/<screen>/screens owns screen composition and product-specific layout.",
        shared_ui: "src/shared/ui owns shadcn-compatible primitive wrappers.",
        shared_layout: "src/shared/layout owns reusable app shell primitives.",
        data: "src/shared/api owns data adapter interfaces and fixture-safe query/mutation adapters.",
        auth: "src/shared/auth owns session and permission adapter boundaries."
      }
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
        writes: supportFiles.filter((file) => ["project_config", "html_entry", "app_entry"].includes(file.kind)).map((file) => file.path),
        reads: ["00-manifest/manifest.json", "06-frontend-agent-contract/build-manifest.json"],
        acceptance: "Target repo uses the declared framework, language, styling, and routing contract."
      },
      {
        task_id: "create_verification_tests",
        order: 2,
        writes: [...supportFiles.filter((file) => file.kind === "test_config").map((file) => file.path), ...playwrightVerificationFiles.map((file) => file.path), ...testFirstTraceabilityFiles.map((file) => file.path), ...testFiles.map((file) => file.path)],
        reads: ["test-first/test-first-contract.json", "verification/playwright-verification-contract.json", "06-frontend-agent-contract/verification-contracts.json", "12-target-frontend/route-component-map.json"],
        acceptance: "Every required test file exists before product UI implementation and no proof obligation is dropped."
      },
      {
        task_id: "install_design_system_tokens",
        order: 3,
        writes: supportFiles.filter((file) => ["app_shell", "style", "config"].includes(file.kind)).map((file) => file.path),
        reads: ["04-design-system/tokens/css-variables.css", "04-design-system/tokens/typography.css", "06-frontend-agent-contract/layout-rules.json"],
        acceptance: "App shell and token files exist without hardcoded visual values."
      },
      {
        task_id: "create_shared_runtime_boundaries",
        order: 4,
        writes: supportFiles.filter((file) => ["adapter", "content"].includes(file.kind)).map((file) => file.path),
        reads: ["06-frontend-agent-contract/production-integration-contracts.json", "06-frontend-agent-contract/fixture-data.json"],
        acceptance: "Data, auth, and copy adapters expose fixture-safe defaults and production confirmation boundaries."
      },
      {
        task_id: "create_shared_ui_and_layout",
        order: 5,
        writes: componentFiles.map((file) => file.path),
        reads: ["04-design-system/components/component-contracts.json", "04-design-system/tokens/token-contracts.json"],
        acceptance: "Every shared UI and layout wrapper has declared props, states, tokens, selectors, and no untouched shadcn defaults."
      },
      {
        task_id: "create_feature_patterns",
        order: 6,
        writes: patternFiles.map((file) => file.path),
        reads: ["04-design-system/patterns/pattern-contracts.json", "04-design-system/components/component-contracts.json"],
        acceptance: "Every pattern contract has a file composed only from declared components."
      },
      {
        task_id: "create_feature_screens",
        order: 7,
        writes: screenFiles.map((file) => file.path),
        reads: ["03-experience-architecture/route-map.json", "05-screen-specs/*.yaml", "06-frontend-agent-contract/component-usage-map.json", "12-target-frontend/route-component-map.json", "04-design-system/visual-reference-contract.json"],
        acceptance: "Every feature screen composes declared shared UI, layout, patterns, data states, actions, forms, visual-reference assertions, and accessibility behavior."
      },
      {
        task_id: "wire_app_routes",
        order: 8,
        writes: routeFiles.map((file) => file.path),
        reads: ["12-target-frontend/route-component-map.json", "03-experience-architecture/route-map.json"],
        acceptance: "Every route file delegates to its declared feature screen and does not contain product UI composition."
      }
    ],
    blockers: files.length > 0 ? [] : ["No source files were generated for the target manifest."],
    warnings: ["This manifest is deterministic source-generation guidance; use the write-target command to materialize it and then run target stack checks."]
  };

  const sourceFileManifest = {
    manifest_version: "1.0",
    target_stack: {
      ...(buildManifest.frontend_stack ?? {}),
      resolved_source_target: targetPlan.kind,
      route_layer: targetPlan.routeLayer,
      app_shell: targetPlan.appShellPath,
      style_entry: targetPlan.styleEntryPath,
      forbidden_stack_files: targetPlan.forbiddenFiles
    },
    architecture: {
      style: "feature_shared_design_system",
      layers: {
        routing: targetPlan.routeLayer,
        app_shell: targetPlan.appShellPath,
        style_entry: targetPlan.styleEntryPath,
        feature_screens: "src/features/<screen-id>/screens",
        feature_patterns: "src/features/<workflow>/patterns",
        shared_ui: "src/shared/ui",
        shared_layout: "src/shared/layout",
        shared_api: "src/shared/api",
        shared_auth: "src/shared/auth",
        shared_content: "src/shared/content",
        design_system: "src/design-system"
      },
      rules: [
        targetPlan.routeRule,
        "Feature screens own product-specific composition.",
        "Shared UI owns contract-bound shadcn-compatible primitive wrappers.",
        "Shared adapters own data, auth, and copy boundaries.",
        "Design tokens live outside route and feature folders.",
        `Forbidden for this target stack: ${targetPlan.forbiddenFiles.join(", ")}.`
      ]
    },
    build_order: buildManifest.build_order ?? [],
    file_count: files.length,
    files,
    coverage: {
      routes: routeFiles.length,
      screens: screenFiles.length,
      components: componentFiles.length,
      patterns: patternFiles.length,
      tests: testFiles.length + playwrightVerificationFiles.length + testFirstTraceabilityFiles.length,
      visual_reference_assertions: visualReferenceContract.verification_assertions?.length ?? 0,
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
    `- Feature screen files: ${screenFiles.length}`,
    `- Component files: ${componentFiles.length}`,
    `- Pattern files: ${patternFiles.length}`,
    `- Verification test files: ${testFiles.length + playwrightVerificationFiles.length + testFirstTraceabilityFiles.length}`,
    "",
    "## Target Architecture",
    "",
    `- \`${targetPlan.routeLayer}\` owns routing only for ${targetPlan.displayName}.`,
    `- \`${targetPlan.appShellPath}\` owns the application shell.`,
    `- \`${targetPlan.styleEntryPath}\` imports generated global tokens.`,
    "- `src/features/<screen-id>/screens` owns product screen composition.",
    "- `src/features/<workflow>/patterns` owns workflow-specific patterns.",
    "- `src/shared/ui` owns shadcn-compatible primitive wrappers.",
    "- `src/shared/layout` owns reusable shell and navigation primitives.",
    "- `src/shared/api`, `src/shared/auth`, and `src/shared/content` own external boundaries.",
    "- `src/design-system` owns generated tokens and typography.",
    "",
    "## Non-Negotiables",
    "",
    "- Use generated tokens and typography variables.",
    "- Use declared components and patterns only.",
    "- Use data, auth, and copy adapters for external integration.",
    "- Keep every data-archetype selector from the manifest.",
    "- Create tests before product UI code and preserve the initial red result.",
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
