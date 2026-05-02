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

function actionValue(action: Record<string, unknown>, key: string): string {
  const value = action[key];
  return typeof value === "string" ? value : "";
}

function entityForScreen(screen: ExperienceArtifacts["screenSpecs"][number], profile: DomainProfile): string {
  return screen.data_needs[0] ?? profile.entities[0];
}

function routeParams(route: string): string[] {
  return route
    .split("/")
    .filter((part) => part.startsWith(":"))
    .map((part) => part.slice(1));
}

function validationRulesForField(fieldName: string, definition: Record<string, unknown>): string[] {
  const rules: string[] = [];
  if (definition.required === true) rules.push("required");
  if (definition.nullable === false) rules.push("non_nullable");
  if (typeof definition.type === "string") rules.push(`type:${definition.type}`);
  if (Array.isArray(definition.values)) rules.push(`allowed_values:${definition.values.join("|")}`);
  if (fieldName.toLowerCase().includes("email")) rules.push("format:email");
  if (fieldName.toLowerCase().includes("date")) rules.push("format:iso_date");
  return rules;
}

function buildDataOperationContracts(profile: DomainProfile, experience: ExperienceArtifacts): Record<string, unknown> {
  const queries = experience.screenSpecs.map((screen) => ({
    query_id: `${screen.screen_id}.load`,
    screen_id: screen.screen_id,
    route: screen.route,
    entity_refs: screen.data_needs,
    route_params: routeParams(screen.route),
    request_contract: {
      filters: screen.actions.some((action) => actionValue(action, "type") === "filter") ? ["search", "status", "date_range"] : [],
      sort: ["updatedAt", "status"],
      pagination: { strategy: "cursor", default_page_size: 25, max_page_size: 100 }
    },
    response_contract: {
      success_shape: "{ data: Record[]; meta: { total: number; pageInfo?: PageInfo; refreshedAt: ISODateTime } }",
      empty_shape: "{ data: []; meta: { total: 0; refreshedAt: ISODateTime } }",
      error_shape: "{ error: { code: string; message: string; retryable: boolean } }"
    },
    state_mapping: {
      pending: "loading",
      success_with_records: "default",
      success_empty: "empty",
      partial_success: "partial_data",
      stale_cache: "stale_data",
      offline: "offline",
      permission_error: "permission_denied",
      failure: "error"
    },
    freshness_policy: {
      stale_after_seconds: 300,
      show_last_updated: true,
      allow_stale_display: true
    },
    permission: screen.actions.find((action) => actionValue(action, "type") === "filter")?.permission ?? "can_view_dashboard",
    cache_key: [screen.screen_id, ...screen.data_needs.map((entity) => slugify(entity))]
  }));

  const mutations = experience.screenSpecs.flatMap((screen) =>
    screen.actions
      .filter((action) => ["create", "update", "delete", "export"].includes(actionValue(action, "type")))
      .map((action) => {
        const entity = entityForScreen(screen, profile);
        return {
          mutation_id: `${screen.screen_id}.${actionValue(action, "type")}.${actionValue(action, "id") || "action"}`,
          screen_id: screen.screen_id,
          route: screen.route,
          action_id: actionValue(action, "id"),
          action_type: actionValue(action, "type"),
          entity_ref: entity,
          permission: actionValue(action, "permission"),
          input_contract: {
            fields: fieldForEntity(entity),
            validation: Object.fromEntries(Object.entries(fieldForEntity(entity)).map(([field, definition]) => [field, validationRulesForField(field, definition as Record<string, unknown>)]))
          },
          optimistic_update: ["create", "update"].includes(actionValue(action, "type")),
          invalidates_queries: [`${screen.screen_id}.load`],
          state_mapping: {
            pending: "loading",
            success: "success_confirmation",
            validation_failure: "validation_error",
            permission_error: "permission_denied",
            failure: "error",
            offline: "offline"
          },
          success_response: "Show success confirmation and refresh affected data.",
          error_response: "Render recovery-oriented error state without inventing data."
        };
      })
  );

  return {
    contract_version: "1.0",
    queries,
    mutations,
    blockers: [],
    warnings: ["Operation contracts describe frontend expectations and must be reconciled with the real backend API before production integration."],
    evidence_refs: ["decision_compiler_order", "inference_domain_profile"]
  };
}

function buildActionContracts(experience: ExperienceArtifacts, routePaths: Set<string>): Record<string, unknown> {
  const actions = experience.screenSpecs.flatMap((screen) =>
    screen.actions.map((action) => {
      const actionId = actionValue(action, "id");
      const actionType = actionValue(action, "type");
      const actionTarget = actionValue(action, "action");
      const navigateTarget = actionTarget.startsWith("navigate:") ? actionTarget.replace("navigate:", "") : null;
      const isAllowedRouteTarget = !navigateTarget || routePaths.has(navigateTarget);
      return {
        action_id: `${screen.screen_id}.${actionId}`,
        screen_id: screen.screen_id,
        route: screen.route,
        label: actionValue(action, "label"),
        action_type: actionType,
        action_target: actionTarget || (["create", "update"].includes(actionType) ? `open_${actionType}_flow` : actionType),
        permission: actionValue(action, "permission"),
        preconditions: [
          "current route exists in route-map.json",
          "user has declared action permission",
          "required screen state contract is available",
          "required data contract exists"
        ],
        allowed_route_target: navigateTarget,
        route_target_declared: isAllowedRouteTarget,
        invokes_mutation_id: ["create", "update", "delete", "export"].includes(actionType) ? `${screen.screen_id}.${actionType}.${actionId || "action"}` : null,
        state_transitions: {
          start: actionType === "filter" ? "default" : "loading",
          success: ["create", "update", "delete", "export"].includes(actionType) ? "success_confirmation" : "default",
          validation_failure: "validation_error",
          permission_failure: "permission_denied",
          failure: "error"
        },
        result_contract: actionType === "filter"
          ? "Update visible results, support filtered_empty state, and preserve route unless routing contract says otherwise."
          : "Complete the declared action, show feedback, and refresh affected data without adding unapproved routes.",
        forbidden_behavior: [
          "Do not navigate to a route missing from route-map.json.",
          "Do not create hidden mutations outside data-operation-contracts.json.",
          "Do not hide permission or validation failures."
        ],
        evidence_refs: screen.evidence_refs
      };
    })
  );

  const blockers = actions
    .filter((action) => action.allowed_route_target && !action.route_target_declared)
    .map((action) => `${action.action_id}: navigate target ${action.allowed_route_target} is missing from route-map.json.`);

  return {
    contract_version: "1.0",
    actions,
    blockers,
    warnings: [],
    evidence_refs: ["decision_compiler_order"]
  };
}

function buildFormContracts(profile: DomainProfile, experience: ExperienceArtifacts): Record<string, unknown> {
  const forms = experience.screenSpecs
    .filter((screen) => screen.screen_id.includes("settings") || screen.actions.some((action) => ["create", "update"].includes(actionValue(action, "type"))))
    .map((screen) => {
      const entity = entityForScreen(screen, profile);
      const fields = Object.entries(fieldForEntity(entity)).map(([fieldName, definition]) => {
        const typed = definition as Record<string, unknown>;
        return {
          name: fieldName,
          label: fieldName.replace(/([A-Z])/g, " $1").replace(/\b\w/g, (letter) => letter.toUpperCase()),
          type: String(typed.type),
          required: typed.required === true,
          nullable: typed.nullable !== false,
          display_format: typed.display_format ?? null,
          validation_rules: validationRulesForField(fieldName, typed),
          error_message: `${fieldName} must satisfy: ${validationRulesForField(fieldName, typed).join(", ")}`
        };
      });
      return {
        form_id: `${screen.screen_id}.primary_form`,
        screen_id: screen.screen_id,
        route: screen.route,
        entity_ref: entity,
        purpose: `Collect valid ${entity.toLowerCase()} data for ${screen.name}.`,
        fields,
        validation_timing: {
          on_blur: true,
          on_submit: true,
          on_change: false
        },
        submission_contract: {
          submit_action_id: `${screen.screen_id}.primary_action`,
          pending_state: "loading",
          success_state: "success_confirmation",
          validation_error_state: "validation_error",
          failure_state: "error"
        },
        dirty_state: {
          track_dirty_fields: true,
          warn_before_leave: true
        },
        accessibility_contract: [
          "Every field has a visible or programmatically associated label.",
          "Validation summary links to invalid fields.",
          "Submit errors move focus intentionally.",
          "Required fields are communicated in text."
        ],
        evidence_refs: screen.evidence_refs
      };
    });

  return {
    contract_version: "1.0",
    forms,
    blockers: [],
    warnings: ["Form contracts are generated from entity contracts and should be reconciled with production validation rules."],
    evidence_refs: ["decision_compiler_order", "inference_domain_profile"]
  };
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
        component_contract_refs: Object.fromEntries(screen.required_components.map((component) => [component, `04-design-system/components/component-contracts.json#${component}`])),
        required_patterns: screen.required_patterns,
        pattern_contract_refs: Object.fromEntries(screen.required_patterns.map((pattern) => [pattern, `04-design-system/patterns/pattern-contracts.json#${pattern}`])),
        forbidden_components: [],
        allowed_new_components: false,
        required_states: Object.keys(screen.states),
        state_contract_ref: `03-experience-architecture/ux-flow-state-completeness.json#${screen.screen_id}`
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
      empty_state: "empty",
      offline_state: "offline",
      partial_data_state: "partial_data",
      stale_data_state: "stale_data"
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
  const dataOperationContracts = buildDataOperationContracts(profile, experience);
  const actionContracts = buildActionContracts(experience, new Set(experience.routeMap.routes.map((route) => route.route)));
  const formContracts = buildFormContracts(profile, experience);

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
        "implement_data_operations",
        "implement_action_contracts",
        "implement_form_contracts",
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
        "Do not omit state recovery actions or transition behavior declared in ux-flow-state-completeness.json.",
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
      submission_feedback: "Show loading, success, and error states.",
      contract_source: "Use 06-frontend-agent-contract/form-contracts.json for exact fields, validation timing, dirty-state behavior, and submission states."
    },
    dataContracts,
    dataOperationContracts,
    actionContracts,
    formContracts,
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
      "5. 03-experience-architecture/ux-flow-state-completeness.json",
      "6. 04-design-system/components/component-contracts.json",
      "7. 04-design-system/components/component-registry.json",
      "8. 04-design-system/patterns/pattern-contracts.json",
      "9. 04-design-system/patterns/pattern-registry.json",
      "10. 06-frontend-agent-contract/data-contracts.json",
      "11. 06-frontend-agent-contract/data-operation-contracts.json",
      "12. 06-frontend-agent-contract/action-contracts.json",
      "13. 06-frontend-agent-contract/form-contracts.json",
      "14. 06-frontend-agent-contract/acceptance-criteria.json"
    ].join("\n")
  };
}
