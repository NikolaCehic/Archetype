import type {
  ArchetypeInput,
  DesignSystemArtifacts,
  DomainProfile,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  ProductArtifacts
} from "../core/types";
import { slugify } from "../core/stable";

function fieldForEntity(entity: string): Record<string, unknown> {
  const lower = entity.toLowerCase();
  if (lower.includes("invoice")) {
    return {
      id: { type: "string", required: true, nullable: false, display_format: "identifier", example: "inv_001" },
      customerName: { type: "string", required: true, nullable: false, display_format: "text", example: "Acme Studio" },
      amount: { type: "number", required: true, nullable: false, display_format: "currency", example: 2400 },
      currency: { type: "string", required: true, nullable: false, display_format: "ISO currency", example: "USD" },
      status: { type: "enum", required: true, nullable: false, values: ["draft", "sent", "overdue", "paid"], example: "overdue" },
      dueDate: { type: "ISODate", required: true, nullable: false, display_format: "localized_date", example: "2026-05-15" }
    };
  }
  return {
    id: { type: "string", required: true, nullable: false, display_format: "identifier", example: `${slugify(entity)}_001` },
    label: { type: "string", required: true, nullable: false, display_format: "text", example: `${entity} label` },
    status: { type: "enum", required: true, nullable: false, values: ["active", "review", "archived"], example: "active" },
    updatedAt: { type: "ISODateTime", required: true, nullable: false, display_format: "relative_time", example: "2026-05-02T12:00:00Z" }
  };
}

function fixtureForEntity(entity: string): Record<string, unknown>[] {
  const fields = fieldForEntity(entity);
  const fixture: Record<string, unknown> = {};
  for (const [key, definition] of Object.entries(fields)) {
    const typed = definition as { example?: unknown };
    fixture[key] = typed.example ?? null;
  }
  return [fixture];
}

export function buildFrontendContractArtifacts(
  input: ArchetypeInput,
  profile: DomainProfile,
  product: ProductArtifacts,
  experience: ExperienceArtifacts,
  designSystem: DesignSystemArtifacts
): FrontendContractArtifacts {
  const stack = {
    framework: input.stack?.framework ?? "React",
    language: input.stack?.language ?? "TypeScript",
    styling: input.stack?.styling ?? "Tailwind CSS + CSS variables",
    routing: input.stack?.routing ?? "Next.js App Router"
  };

  const componentUsageMap = Object.fromEntries(
    experience.screenSpecs.map((screen) => [
      screen.screen_id,
      {
        route: screen.route,
        required_components: screen.required_components,
        required_patterns: screen.required_patterns,
        forbidden_components: [],
        allowed_new_components: false,
        required_states: Object.keys(screen.states)
      }
    ])
  );

  const dataContracts = {
    entities: Object.fromEntries(
      profile.entities.map((entity) => [
        entity,
        {
          fields: fieldForEntity(entity),
          source_confidence: "medium",
          evidence_refs: ["inference_domain_profile"]
        }
      ])
    ),
    queries: experience.screenSpecs.map((screen) => ({
      query_id: `${screen.screen_id}.load`,
      route: screen.route,
      returns: screen.data_needs,
      loading_state: "loading",
      error_state: "error",
      empty_state: "empty"
    })),
    mutations: experience.screenSpecs.flatMap((screen) =>
      screen.actions
        .filter((action) => ["create", "update", "delete", "export"].includes(String(action.type)))
        .map((action) => ({
          mutation_id: `${screen.screen_id}.${String(action.type)}`,
          action: action.type,
          actor_role: "authorized_user",
          optimistic_update: action.type === "create" || action.type === "update",
          success_response: "show success feedback and refresh affected screen data",
          error_response: "show recovery-oriented error message",
          affected_screens: [screen.screen_id]
        }))
    )
  };

  return {
    buildManifest: {
      project_name: product.productModel.product_name,
      frontend_stack: stack,
      build_order: [
        "install_tokens",
        "create_layout_shells",
        "create_routes",
        "create_components",
        "create_patterns",
        "build_screens",
        "implement_states",
        "run_accessibility_checks",
        "verify_acceptance_criteria"
      ],
      entry_routes: experience.routeMap.routes.map((route) => route.route),
      forbidden_behavior: [
        "Do not invent unapproved routes.",
        "Do not invent visual styles outside generated tokens.",
        "Do not omit required states.",
        "Do not treat missing data contracts as permission to invent backend behavior."
      ]
    },
    componentUsageMap,
    layoutRules: {
      shell_strategy: "Use the route layout declared by each screen spec.",
      max_width: "Dashboard routes may be fluid; detail and form routes should be constrained unless screen spec says otherwise.",
      density: "Use medium-high density with clear hierarchy.",
      spacing: "Use semantic spacing tokens only."
    },
    responsiveRules: {
      breakpoints: {
        mobile: "< 768px",
        tablet: "768px to 1023px",
        desktop: ">= 1024px"
      },
      mobile: "Use single-column layout, keep primary action reachable, and provide table card fallback where data tables overflow.",
      tablet: "Use two-column layouts only when content remains readable.",
      desktop: "Use persistent navigation and multi-panel layouts where screen specs require them."
    },
    interactionRules: {
      allowed_actions: ["navigate", "create", "update", "delete", "bulk_action", "filter", "sort", "search", "export", "import", "connect", "authenticate", "dismiss", "retry"],
      async_behavior: "Every async action needs loading, success, and error feedback.",
      destructive_behavior: "Destructive actions require confirmation and recovery guidance when possible.",
      gap_policy: "Report missing interaction decisions as design-system gaps."
    },
    formRules: {
      labels: "Every field requires a visible or programmatically associated label.",
      validation_timing: "Validate on blur and submit unless screen spec says otherwise.",
      errors: "Place errors near fields and summarize form-level blockers.",
      dirty_state: "Warn before leaving a dirty form when data loss is possible.",
      submission_feedback: "Show loading, success, and error states."
    },
    dataContracts,
    routingContract: {
      routes: experience.routeMap.routes,
      route_creation_policy: "Create only the routes listed here unless the contract is revised.",
      deep_linking: "Respect deep_linking flags."
    },
    acceptanceCriteria: {
      criteria: experience.screenSpecs.flatMap((screen) => screen.acceptance_criteria)
    },
    fixtureData: Object.fromEntries(profile.entities.map((entity) => [entity, fixtureForEntity(entity)])),
    frontendAgentInstructions: [
      "# Frontend Agent Instructions",
      "",
      "Build the UI using only the provided product model, route map, screen specs, component registry, pattern registry, tokens, layout rules, data contracts, and acceptance criteria.",
      "",
      "Do not invent new components, visual styles, routes, or UX flows unless the contract explicitly allows it.",
      "",
      "If a required element is missing, report a design-system gap instead of improvising.",
      "",
      "Use these package files first:",
      "",
      "1. 00-manifest/manifest.json",
      "2. 02-product-model/product-model.json",
      "3. 03-experience-architecture/route-map.json",
      "4. 05-screen-specs/screen-spec-index.json",
      "5. 04-design-system/components/component-registry.json",
      "6. 04-design-system/patterns/pattern-registry.json",
      "7. 06-frontend-agent-contract/data-contracts.json",
      "8. 06-frontend-agent-contract/acceptance-criteria.json"
    ].join("\n")
  };
}
