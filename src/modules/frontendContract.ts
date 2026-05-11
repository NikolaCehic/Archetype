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

const ACTION_KNOWN_STATES = [
  "default",
  "loading",
  "empty",
  "error",
  "permission_denied",
  "offline",
  "partial_data",
  "stale_data",
  "filtered_empty",
  "validation_error",
  "success_confirmation"
];

const ACTION_TERMINAL_STATES = [
  "success_confirmation",
  "resolved",
  "cancelled",
  "handed_off",
  "completed",
  "archived"
];

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function actionAvailableStates(actionType: string): string[] {
  if (actionType === "filter") return ["default", "partial_data", "stale_data", "filtered_empty"];
  if (actionType === "export") return ["default", "partial_data", "stale_data", "filtered_empty"];
  if (actionType === "create") return ["default", "empty", "partial_data", "stale_data", "filtered_empty", "validation_error"];
  if (actionType === "update") return ["default", "partial_data", "stale_data", "validation_error"];
  if (actionType === "delete") return ["default", "partial_data", "stale_data"];
  return ["default", "partial_data", "stale_data"];
}

function actionUnavailableStates(actionType: string): string[] {
  const available = new Set(actionAvailableStates(actionType));
  return uniqueStrings([...ACTION_KNOWN_STATES.filter((state) => !available.has(state)), ...ACTION_TERMINAL_STATES]);
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
    evidence_refs: screen.evidence_refs,
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
          evidence_refs: screen.evidence_refs,
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
      const availableStates = actionAvailableStates(actionType);
      const unavailableStates = actionUnavailableStates(actionType);
      return {
        action_id: `${screen.screen_id}.${actionId}`,
        screen_id: screen.screen_id,
        route: screen.route,
        label: actionValue(action, "label"),
        action_type: actionType,
        action_target: actionTarget || (["create", "update"].includes(actionType) ? `open_${actionType}_flow` : actionType),
        permission: actionValue(action, "permission"),
        required_selector: `[data-archetype-action="${screen.screen_id}.${actionId}"]`,
        result_selector: `[data-archetype-action-result="${screen.screen_id}.${actionId}"]`,
        availability_policy: {
          available_states: availableStates,
          unavailable_states: unavailableStates,
          terminal_states: ACTION_TERMINAL_STATES,
          default_terminal_behavior: "hide_control",
          disabled_terminal_behavior: "allowed_only_with_disabled_or_aria_disabled_and_data_archetype_action_unavailable",
          allowed_in_terminal_states: false,
          rule: "Actions are available only in declared states. Terminal states must not expose active controls for resolve, handoff, rerun, cancel, create, update, delete, export, or filter actions unless a new contract explicitly allows recovery."
        },
        visible_control_contract: {
          control_must_be_visible_when_available: true,
          control_must_have_accessible_name: true,
          control_must_be_keyboard_focusable: true,
          control_must_have_runtime_result: true,
          allowed_control_states: ["default", "hover", "focus-visible", "active", "disabled", "loading", "success", "error"]
        },
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
          "Do not render a visible control without a matching data-archetype-action or declared control contract.",
          "Do not render a declared action as a visual-only or inert control.",
          "Do not expose active action controls in terminal states such as success_confirmation, resolved, cancelled, handed_off, completed, or archived.",
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
    action_state_policy: {
      policy_id: "terminal-states-disable-conflicting-actions",
      rule: "Terminal states must hide or disable action controls that would mutate, re-run, resolve, hand off, cancel, export, or otherwise change a completed item unless that terminal-state action is explicitly declared.",
      terminal_states: ACTION_TERMINAL_STATES,
      required_runtime_proof: [
        "Each action declares available_states and unavailable_states.",
        "A terminal state route or fixture proves declared actions are absent or disabled.",
        "Disabled visible terminal controls expose disabled, aria-disabled=true, or data-archetype-action-unavailable.",
        "Resolve block, Handoff, Rerun, Cancel, Create, Update, Delete, Export, Filter, and Run controls are not active in terminal states by default."
      ],
      forbidden_terminal_controls: ["Resolve block", "Handoff", "Rerun", "Cancel", "Run", "Create", "Update", "Delete", "Export", "Filter"]
    },
    visible_control_policy: {
      policy_id: "visible-controls-require-action-contracts",
      rule: "Every visible interactive control must map to an action, form field, route link, or explicit control contract, and every action must produce runtime proof.",
      required_runtime_proof: [
        "Visible action controls expose data-archetype-action.",
        "Action IDs match 06-frontend-agent-contract/action-contracts.json.",
        "Clicking a declared action changes URL, changes status text, or renders data-archetype-action-result.",
        "Unbound buttons, role=button controls, inputs, selects, textareas, and action-like links are blockers."
      ],
      forbidden_controls: [
        "Visual-only buttons without data-archetype-action.",
        "Priority chips or filters that look clickable but do not update state or route.",
        "Export, run, create, resolve, cancel, retry, filter, search, or handoff controls without runtime proof.",
        "Icon-only controls without accessible names."
      ]
    },
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

function buildVerificationContracts(
  experience: ExperienceArtifacts,
  designSystem: DesignSystemArtifacts,
  dataOperationContracts: Record<string, unknown>,
  actionContracts: Record<string, unknown>,
  formContracts: Record<string, unknown>
): Record<string, unknown> {
  const componentContracts = designSystem.componentContracts as { contracts?: Array<{ name?: string }> };
  const patternContracts = designSystem.patternContracts as { contracts?: Array<{ name?: string }> };
  const tokenContracts = designSystem.tokenContracts as { layers?: Record<string, unknown> };
  const typographySystem = designSystem.typographySystem as { type_roles?: Record<string, unknown> };
  const actions = (actionContracts.actions as Array<{ action_id?: string; screen_id?: string }> | undefined) ?? [];
  const queries = (dataOperationContracts.queries as Array<{ query_id?: string; screen_id?: string }> | undefined) ?? [];
  const forms = (formContracts.forms as Array<{ form_id?: string; screen_id?: string }> | undefined) ?? [];

  const screenTests = experience.screenSpecs.flatMap((screen) => [
    {
      test_id: `${screen.screen_id}.route.renders`,
      screen_id: screen.screen_id,
      type: "route_render",
      selector: `[data-archetype-screen="${screen.screen_id}"]`,
      assertion: `Route ${screen.route} renders ${screen.name} with the declared layout and page heading.`,
      required_artifacts: ["route-map.json", `${screen.screen_id.replace(/[.]/g, "-")}.yaml`]
    },
    ...Object.keys(screen.states).map((state) => ({
      test_id: `${screen.screen_id}.state.${state}`,
      screen_id: screen.screen_id,
      type: "state_render",
      selector: `[data-archetype-screen="${screen.screen_id}"][data-state="${state}"]`,
      assertion: `${screen.screen_id} renders ${state} state with declared feedback, recovery, data, and accessibility behavior.`,
      required_artifacts: ["ux-flow-state-completeness.json", `${screen.screen_id.replace(/[.]/g, "-")}.yaml`]
    })),
    ...screen.required_components.map((component) => ({
      test_id: `${screen.screen_id}.component.${component}`,
      screen_id: screen.screen_id,
      type: "component_contract",
      selector: `[data-archetype-component="${slugify(component)}"]`,
      assertion: `${component} is implemented from component-contracts.json and uses declared tokens.`,
      required_artifacts: ["component-contracts.json", "component-registry.json"]
    })),
    ...screen.required_patterns.map((pattern) => ({
      test_id: `${screen.screen_id}.pattern.${pattern}`,
      screen_id: screen.screen_id,
      type: "pattern_contract",
      selector: `[data-archetype-pattern="${slugify(pattern)}"]`,
      assertion: `${pattern} is implemented from pattern-contracts.json and appears only where declared.`,
      required_artifacts: ["pattern-contracts.json", "pattern-registry.json"]
    }))
  ]);

  const suite = [
    {
      suite_id: "route_and_screen_contracts",
      required: true,
      tests: screenTests.filter((test) => ["route_render", "state_render"].includes(test.type))
    },
    {
      suite_id: "design_system_contracts",
      required: true,
      tests: [
        ...screenTests.filter((test) => ["component_contract", "pattern_contract"].includes(test.type)),
        {
          test_id: "tokens.layers.present",
          type: "token_contract",
          selector: ":root",
          assertion: `Token contract exposes ${Object.keys(tokenContracts.layers ?? {}).length} required token layers.`,
          required_artifacts: ["token-contracts.json", "css-variables.css"]
        },
        {
          test_id: "typography.roles.present",
          type: "typography_contract",
          selector: ":root",
          assertion: `Typography system exposes ${Object.keys(typographySystem.type_roles ?? {}).length} type roles and CSS variables.`,
          required_artifacts: ["typography-system.json", "typography.css"]
        }
      ]
    },
    {
      suite_id: "data_action_form_contracts",
      required: true,
      tests: [
        ...queries.map((query) => ({
          test_id: `${query.query_id}.contract`,
          screen_id: query.screen_id,
          type: "query_contract",
          selector: `[data-archetype-screen="${query.screen_id}"]`,
          assertion: "Screen data loading maps query outcomes to required screen states.",
          required_artifacts: ["data-operation-contracts.json", "screen-state-matrix.json"]
        })),
        ...actions.map((action) => ({
          test_id: `${action.action_id}.contract`,
          screen_id: action.screen_id,
          type: "action_contract",
          selector: `[data-archetype-action="${action.action_id}"]`,
          assertion: "Action honors preconditions, permission, state transitions, result contract, and route policy.",
          required_artifacts: ["action-contracts.json", "route-map.json"]
        })),
        ...forms.map((form) => ({
          test_id: `${form.form_id}.contract`,
          screen_id: form.screen_id,
          type: "form_contract",
          selector: `[data-archetype-form="${form.form_id}"]`,
          assertion: "Form implements declared fields, validation timing, dirty-state behavior, submission states, and accessibility behavior.",
          required_artifacts: ["form-contracts.json"]
        }))
      ]
    },
    {
      suite_id: "accessibility_contracts",
      required: true,
      tests: experience.screenSpecs.map((screen) => ({
        test_id: `${screen.screen_id}.accessibility`,
        screen_id: screen.screen_id,
        type: "accessibility_contract",
        selector: `[data-archetype-screen="${screen.screen_id}"]`,
        assertion: "Screen has visible focus, keyboard path, accessible names, non-color-only status, and chart fallback where required.",
        required_artifacts: ["accessibility-rules.json", `${screen.screen_id.replace(/[.]/g, "-")}.yaml`]
      }))
    }
  ];

  const testCount = suite.reduce((sum, item) => sum + item.tests.length, 0);
  return {
    contract_version: "1.0",
    test_suites: suite,
    coverage: {
      suite_count: suite.length,
      test_count: testCount,
      screens: experience.screenSpecs.length,
      components: componentContracts.contracts?.length ?? 0,
      patterns: patternContracts.contracts?.length ?? 0,
      queries: queries.length,
      actions: actions.length,
      forms: forms.length
    },
    blockers: testCount > 0 ? [] : ["No verification tests were generated."],
    warnings: ["Verification contracts define required downstream proof during generation; run verify-target for target stack execution and Playwright evidence."],
    evidence_refs: ["decision_compiler_order"]
  };
}

function verificationPlanMarkdown(verificationContracts: Record<string, unknown>): string {
  const suites = (verificationContracts.test_suites as Array<{ suite_id: string; tests: unknown[] }> | undefined) ?? [];
  return [
    "# Verification Plan",
    "",
    "A downstream frontend agent must satisfy these verification suites before handoff.",
    "",
    ...suites.map((suite) => `- ${suite.suite_id}: ${suite.tests.length} tests`),
    "",
    "## Required Execution",
    "",
    "1. Build routes from route-map.json.",
    "2. Implement screens from screen specs.",
    "3. Implement states from ux-flow-state-completeness.json.",
    "4. Implement components, patterns, tokens, typography, data operations, actions, and forms from their contract files.",
    "5. Run the verification suites from verification-contracts.json.",
    "6. Report every failed test as a contract gap instead of inventing missing behavior."
  ].join("\n");
}

function methodForAction(actionType: string): string {
  if (actionType === "create") return "POST";
  if (actionType === "update") return "PATCH";
  if (actionType === "delete") return "DELETE";
  if (actionType === "export") return "POST";
  return "POST";
}

function endpointForEntity(entity: string, actionType?: string): string {
  const base = `/api/${slugify(entity)}`;
  if (actionType === "update" || actionType === "delete") return `${base}/:id`;
  if (actionType === "export") return `${base}/export`;
  return base;
}

function buildProductionIntegrationContracts(
  input: ArchetypeInput,
  stack: Record<string, string>,
  profile: DomainProfile,
  product: ProductArtifacts,
  experience: ExperienceArtifacts,
  dataOperationContracts: Record<string, unknown>,
  actionContracts: Record<string, unknown>,
  formContracts: Record<string, unknown>,
  verificationContracts: Record<string, unknown>
): Record<string, unknown> {
  const queries = (dataOperationContracts.queries as Array<Record<string, unknown>> | undefined) ?? [];
  const mutations = (dataOperationContracts.mutations as Array<Record<string, unknown>> | undefined) ?? [];
  const actions = (actionContracts.actions as Array<Record<string, unknown>> | undefined) ?? [];
  const forms = (formContracts.forms as Array<Record<string, unknown>> | undefined) ?? [];
  const routeByScreen = new Map(experience.routeMap.routes.map((route) => [route.screen_id, route]));
  const permissionMatrix = product.permissionMatrix as { permissions?: Array<Record<string, unknown>>; fallback_state?: string };
  const roleModel = product.roleModel as { roles?: Array<{ role_id?: string; label?: string }> };

  const queryEndpointMappings = queries.map((query) => {
    const screenId = String(query.screen_id ?? "");
    const entityRefs = Array.isArray(query.entity_refs) ? query.entity_refs.map(String) : [];
    const primaryEntity = entityRefs[0] ?? profile.entities[0];
    const route = routeByScreen.get(screenId);
    return {
      operation_id: String(query.query_id ?? `${screenId}.load`),
      operation_kind: "query",
      screen_id: screenId,
      route: String(query.route ?? route?.route ?? ""),
      entity_refs: entityRefs,
      proposed_endpoint: {
        method: "GET",
        path_template: endpointForEntity(primaryEntity),
        route_params: query.route_params ?? [],
        query_params: query.request_contract ?? {},
        response_contract: query.response_contract ?? {}
      },
      auth_contract: {
        auth_requirement: route?.auth_requirement ?? "authenticated",
        role_requirement: route?.role_requirement ?? [],
        permission: query.permission ?? "can_view_dashboard",
        denied_state: permissionMatrix.fallback_state ?? "permission_denied"
      },
      ui_state_mapping: query.state_mapping ?? {},
      adapter_interface: {
        function_name: `load${screenId.split(".").map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join("")}`,
        return_policy: "Return the declared success, empty, stale, partial, offline, permission, and error shapes without inventing fields."
      },
      confirmation_status: "pending_external_confirmation"
    };
  });

  const mutationEndpointMappings = mutations.map((mutation) => {
    const screenId = String(mutation.screen_id ?? "");
    const actionType = String(mutation.action_type ?? mutation.action ?? "mutation");
    const entity = String(mutation.entity_ref ?? profile.entities[0]);
    const route = routeByScreen.get(screenId);
    return {
      operation_id: String(mutation.mutation_id ?? `${screenId}.${actionType}`),
      operation_kind: "mutation",
      screen_id: screenId,
      route: String(mutation.route ?? route?.route ?? ""),
      entity_ref: entity,
      action_type: actionType,
      proposed_endpoint: {
        method: methodForAction(actionType),
        path_template: endpointForEntity(entity, actionType),
        input_contract: mutation.input_contract ?? {},
        success_response: mutation.success_response ?? "Return updated resource or accepted job status.",
        error_response: mutation.error_response ?? "Return structured error with retryability."
      },
      auth_contract: {
        auth_requirement: route?.auth_requirement ?? "authenticated",
        role_requirement: route?.role_requirement ?? [],
        permission: mutation.permission ?? "can_manage_core_entities",
        denied_state: permissionMatrix.fallback_state ?? "permission_denied"
      },
      ui_state_mapping: mutation.state_mapping ?? {},
      invalidates_queries: mutation.invalidates_queries ?? [],
      adapter_interface: {
        function_name: `${actionType}${entity.replace(/[^a-zA-Z0-9]/g, "")}`,
        optimistic_update_allowed: mutation.optimistic_update === true
      },
      confirmation_status: "pending_external_confirmation"
    };
  });

  const routeGuards = experience.routeMap.routes.map((route) => ({
    route: route.route,
    screen_id: route.screen_id,
    auth_requirement: route.auth_requirement,
    role_requirement: route.role_requirement,
    denied_state: permissionMatrix.fallback_state ?? "permission_denied",
    guard_behavior: "Gate route rendering before screen data loads and render the declared permission_denied state on failure.",
    confirmation_status: "pending_external_confirmation"
  }));

  const actionGuards = actions.map((action) => ({
    action_id: action.action_id,
    screen_id: action.screen_id,
    permission: action.permission,
    auth_requirement: routeByScreen.get(String(action.screen_id ?? ""))?.auth_requirement ?? "authenticated",
    role_requirement: routeByScreen.get(String(action.screen_id ?? ""))?.role_requirement ?? [],
    failure_state: "permission_denied",
    guard_behavior: "Disable or intercept the action before mutation execution when permission is missing.",
    confirmation_status: "pending_external_confirmation"
  }));

  const copySurfaces = experience.screenSpecs.map((screen) => ({
    screen_id: screen.screen_id,
    route: screen.route,
    heading: screen.name,
    purpose_copy: screen.purpose,
    primary_action_labels: screen.actions.map((action) => actionValue(action, "label")).filter(Boolean),
    state_messages: Object.entries(screen.states).map(([state, definition]) => ({
      state,
      trigger: typeof definition === "object" && definition !== null ? (definition as Record<string, unknown>).trigger ?? "" : "",
      user_feedback: typeof definition === "object" && definition !== null ? (definition as Record<string, unknown>).user_feedback ?? "" : "",
      recovery_action: typeof definition === "object" && definition !== null ? (definition as Record<string, unknown>).recovery_action ?? null : null
    })),
    content_rules: screen.content_rules,
    confirmation_status: "pending_brand_and_copy_review"
  }));

  const highRiskReviews = profile.riskFlags.map((flag) => ({
    review_id: `domain_${slugify(flag)}_review`,
    label: `${flag} domain review`,
    required: true,
    reason: "High-risk domains require qualified human review before compliance or safety claims.",
    artifacts: ["01-evidence/risks.md", "04-design-system/accessibility/accessibility-guidelines.md", "08-quality/accessibility-report.md"],
    status: "pending_human_review"
  }));

  const reviewGates = [
    {
      review_id: "backend_api_confirmation",
      label: "Backend API confirmation",
      required: true,
      reason: "Generated data operations are frontend expectations until mapped to a real backend API.",
      artifacts: ["06-frontend-agent-contract/data-contracts.json", "06-frontend-agent-contract/data-operation-contracts.json"],
      status: "pending_external_confirmation"
    },
    {
      review_id: "auth_authorization_confirmation",
      label: "Authentication and authorization confirmation",
      required: true,
      reason: "Route and action guards require production session, role, and permission mapping.",
      artifacts: ["02-product-model/permission-matrix.json", "06-frontend-agent-contract/action-contracts.json"],
      status: "pending_external_confirmation"
    },
    {
      review_id: "copy_brand_confirmation",
      label: "Copy and brand confirmation",
      required: true,
      reason: "Generated microcopy and brand tone are architectural defaults, not approved production copy.",
      artifacts: ["04-design-system/content-rules.md", "06-frontend-agent-contract/production-integration-contracts.json"],
      status: "pending_brand_and_copy_review"
    },
    {
      review_id: "accessibility_compliance_confirmation",
      label: "Accessibility and compliance review",
      required: true,
      reason: "The compiler can require accessibility behavior, but qualified human review is needed before compliance claims.",
      artifacts: ["04-design-system/accessibility/accessibility-rules.json", "08-quality/accessibility-report.md"],
      status: "pending_human_review"
    },
    {
      review_id: "target_stack_execution",
      label: "Target stack execution proof",
      required: true,
      reason: "Generated frontend source must build, run, and test in the target repository before production handoff.",
      artifacts: ["06-frontend-agent-contract/verification-contracts.json", "11-build-simulation/frontend-build-simulation-report.md"],
      status: "pending_external_execution"
    },
    ...highRiskReviews
  ];

  const endpointMappings = [...queryEndpointMappings, ...mutationEndpointMappings];
  return {
    contract_version: "1.0",
    status: "integration_contract_ready",
    backend_api: {
      endpoint_mappings: endpointMappings,
      adapter_policy: "Implement a typed data adapter from these mappings. Use fixture data for local frontend simulation, and do not claim production backend integration until every mapping is confirmed.",
      unresolved_confirmation: endpointMappings.map((mapping) => mapping.operation_id)
    },
    authentication_authorization: {
      roles: roleModel.roles ?? [],
      permission_matrix: permissionMatrix.permissions ?? [],
      route_guards: routeGuards,
      action_guards: actionGuards,
      session_contract: {
        required_fields: ["user.id", "user.role_id", "permissions", "auth_state"],
        unauthenticated_state: "permission_denied",
        wallet_state_required: profile.domain === "web3"
      }
    },
    content_brand: {
      brand_inputs: input.brand ?? {},
      copy_surfaces: copySurfaces,
      content_source_policy: "Generated copy is a contract placeholder. Production copy must be confirmed or supplied before launch."
    },
    human_review: {
      review_gates: reviewGates,
      required_human_review_count: reviewGates.filter((gate) => gate.required).length
    },
    target_stack_execution: {
      target_stack: stack,
      required_commands: [
        "install dependencies in the target frontend repo",
        "run typecheck",
        "run lint",
        "run production build",
        "run verification suites from 06-frontend-agent-contract/verification-contracts.json"
      ],
      proof_artifacts: [
        "target build log",
        "route render test results",
        "state render test results",
        "accessibility check results",
        "backend/auth adapter mapping report"
      ],
      verification_contract_summary: verificationContracts.coverage ?? {},
      execution_status: "pending_external_execution"
    },
    form_validation_alignment: {
      forms: forms.map((form) => ({
        form_id: form.form_id,
        screen_id: form.screen_id,
        entity_ref: form.entity_ref,
        fields: Array.isArray(form.fields) ? form.fields.length : 0,
        confirmation_status: "pending_production_validation_alignment"
      }))
    },
    blockers: [],
    warnings: [
      "Production integration contracts are explicit, but live backend API, auth provider, production copy, human review, and target-stack execution remain external confirmations."
    ],
    evidence_refs: ["decision_compiler_order", "inference_domain_profile"]
  };
}

function productionIntegrationPlanMarkdown(productionIntegrationContracts: Record<string, unknown>): string {
  const backend = productionIntegrationContracts.backend_api as { endpoint_mappings?: Array<Record<string, unknown>> } | undefined;
  const auth = productionIntegrationContracts.authentication_authorization as { route_guards?: unknown[]; action_guards?: unknown[] } | undefined;
  const content = productionIntegrationContracts.content_brand as { copy_surfaces?: unknown[] } | undefined;
  const humanReview = productionIntegrationContracts.human_review as { review_gates?: Array<Record<string, unknown>> } | undefined;
  const execution = productionIntegrationContracts.target_stack_execution as { required_commands?: string[]; proof_artifacts?: string[] } | undefined;
  const reviewGates = humanReview?.review_gates ?? [];
  return [
    "# Production Integration Plan",
    "",
    "This plan converts remaining production warnings into explicit confirmation work. A frontend agent may build deterministic UI and adapters from these contracts, but it must not claim production backend, auth, copy, compliance, or target-stack execution until these gates are confirmed.",
    "",
    "## Coverage",
    "",
    `- Backend endpoint mappings: ${backend?.endpoint_mappings?.length ?? 0}`,
    `- Route guards: ${auth?.route_guards?.length ?? 0}`,
    `- Action guards: ${auth?.action_guards?.length ?? 0}`,
    `- Copy surfaces: ${content?.copy_surfaces?.length ?? 0}`,
    `- Human review gates: ${reviewGates.length}`,
    "",
    "## Review Gates",
    "",
    ...reviewGates.map((gate) => `- ${gate.review_id}: ${gate.status}`),
    "",
    "## Required Target Execution",
    "",
    ...((execution?.required_commands ?? []).map((command) => `- ${command}`)),
    "",
    "## Proof Artifacts",
    "",
    ...((execution?.proof_artifacts ?? []).map((artifact) => `- ${artifact}`))
  ].join("\n");
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
  const verificationContracts = buildVerificationContracts(experience, designSystem, dataOperationContracts, actionContracts, formContracts);
  const productionIntegrationContracts = buildProductionIntegrationContracts(input, stack, profile, product, experience, dataOperationContracts, actionContracts, formContracts, verificationContracts);

  return {
    buildManifest: {
      project_name: product.productModel.product_name,
      frontend_stack: stack,
      build_order: [
        "install_target_stack",
        "create_verification_tests",
        "install_design_system_tokens",
        "create_shared_runtime_boundaries",
        "create_shared_ui_and_layout",
        "create_feature_patterns",
        "create_feature_screens",
        "wire_app_routes",
        "implement_data_operations",
        "implement_action_contracts",
        "implement_form_contracts",
        "implement_states",
        "run_accessibility_checks",
        "verify_acceptance_criteria"
      ],
      entry_routes: experience.routeMap.routes.map((route) => route.route),
      forbidden_behavior: [
        "Do not invent unapproved routes.",
        "Do not put product UI composition directly inside route files.",
        "Do not generate archetype-namespaced scaffold folders as the application architecture.",
        "Do not invent visual styles outside generated tokens.",
        "Do not ship default blue-gray SaaS UI, untouched shadcn examples, or generic card-grid dashboards.",
        "Do not bypass the approved design-quality gate.",
        "Do not omit required states.",
        "Do not omit state recovery actions or transition behavior declared in ux-flow-state-completeness.json.",
        "Do not treat missing data contracts as permission to invent backend behavior."
      ]
    },
    componentUsageMap,
    layoutRules: {
      shell_strategy: "Use the route layout declared by each screen spec.",
      max_width: "Dashboard routes may be fluid; detail and form routes should be constrained unless screen spec says otherwise.",
      density: "Use the density declared by the selected design direction and preserve clear hierarchy.",
      spacing: "Use semantic spacing tokens only.",
      design_quality_gate: "04-design-system/design-quality-gate.json"
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
    verificationContracts,
    verificationPlan: verificationPlanMarkdown(verificationContracts),
    productionIntegrationContracts,
    productionIntegrationPlan: productionIntegrationPlanMarkdown(productionIntegrationContracts),
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
      "Use shadcn as the primitive layer and Tailwind through generated CSS variables. Do not ship untouched shadcn defaults or raw visual literals.",
      "",
      "Read the approved design-quality gate before styling. Generic blue-gray SaaS output is a blocker unless explicit brand evidence requires it.",
      "",
      "If a required element is missing, report a design-system gap instead of improvising.",
      "",
      "Use these package files first:",
      "",
      "1. spec/archetype-spec.json",
      "2. test-first/test-first-contract.json",
      "3. 00-manifest/manifest.json",
      "4. 02-product-model/product-model.json",
      "5. 03-experience-architecture/route-map.json",
      "6. 05-screen-specs/screen-spec-index.json",
      "7. 03-experience-architecture/ux-flow-state-completeness.json",
      "8. 04-design-system/design-quality-gate.json",
      "9. 04-design-system/shadcn-integration.json",
      "10. 04-design-system/components/component-contracts.json",
      "11. 04-design-system/components/component-registry.json",
      "12. 04-design-system/patterns/pattern-contracts.json",
      "13. 04-design-system/patterns/pattern-registry.json",
      "14. 04-design-system/tokens/token-contracts.json",
      "15. 04-design-system/tokens/typography-system.json",
      "16. 06-frontend-agent-contract/data-contracts.json",
      "17. 06-frontend-agent-contract/data-operation-contracts.json",
      "18. 06-frontend-agent-contract/action-contracts.json",
      "19. 06-frontend-agent-contract/form-contracts.json",
      "20. 06-frontend-agent-contract/verification-contracts.json",
      "21. 06-frontend-agent-contract/production-integration-contracts.json",
      "22. 06-frontend-agent-contract/acceptance-criteria.json",
      "",
      "Create the tests declared in test-first/test-first-contract.json before product UI implementation."
    ].join("\n")
  };
}
