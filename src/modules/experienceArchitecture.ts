import type {
  AcceptanceCriterion,
  ArchetypeInput,
  DomainProfile,
  EvidenceLedger,
  ExperienceArtifacts,
  ProductArtifacts,
  RouteSpec,
  ScreenSpec,
  UXFlowStateCompleteness
} from "../core/types";
import { slugify, stableId } from "../core/stable";

const REQUIRED_SCREEN_STATES = ["default", "loading", "empty", "error", "permission_denied", "offline", "partial_data", "stale_data"];
const CONTEXTUAL_SCREEN_STATES = ["filtered_empty", "validation_error", "success_confirmation"];
const RECOVERY_STATE_KEYS = ["error", "permission_denied", "offline", "partial_data", "stale_data", "filtered_empty", "validation_error"];

interface GeneratedFlowStep {
  step_id: string;
  order: number;
  route: string;
  screen_id: string;
  intent: string;
  interaction: string;
  required_states: string[];
  entry_condition: string;
  completion_signal: string;
  failure_recovery: string;
}

interface GeneratedFlowSpec {
  flow_id: string;
  name: string;
  route_refs: string[];
  screen_refs: string[];
  steps: GeneratedFlowStep[];
  required_states: string[];
  recovery_states: string[];
  evidence_refs: string[];
}

function humanizeId(value: string): string {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function workflowTokens(workflow: string): string[] {
  return workflow
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !["and", "the", "for", "with", "flow", "work", "user"].includes(token));
}

function matchesWorkflow(route: RouteSpec, workflow: string): boolean {
  const haystack = [route.screen_id, route.route, route.nav_label ?? "", route.nav_group].join(" ").toLowerCase();
  return workflowTokens(workflow).some((token) => haystack.includes(token.replace(/s$/, "")));
}

function routesForWorkflow(workflow: string, routes: RouteSpec[]): RouteSpec[] {
  const exactMatches = routes.filter((route) => matchesWorkflow(route, workflow));
  const primaryFallback = routes.filter((route) => route.priority === "primary");
  const secondaryFallback = routes.filter((route) => route.priority !== "utility");
  const selected = exactMatches.length > 0 ? exactMatches : primaryFallback.length > 0 ? primaryFallback : secondaryFallback;
  return selected.slice(0, Math.max(1, Math.min(3, selected.length)));
}

function buildScreenStates(route: RouteSpec, subject: string, screenName: string, isSettings: boolean, entity: string): Record<string, unknown> {
  const stateAcceptanceRef = stableId("AC", subject, "states");
  const primaryContent = route.screen_id.includes("overview") || route.screen_id.includes("dashboard") ? "MetricGrid" : "DataTable";
  const baseAccessibility = "Announce state changes politely, keep focus order stable, and expose the state title through a heading or aria-live region.";
  const dataSource = slugify(entity);

  return {
    default: {
      required: true,
      component: primaryContent,
      description: `Render ${screenName} with available ${entity.toLowerCase()} data and the primary action visible.`,
      trigger: "initial query succeeds and the current role has access",
      user_feedback: "Show current data, timestamps, status labels, and available actions.",
      required_components: ["PageHeader", primaryContent],
      data_contract_expectation: `${dataSource}.load returns displayable records or summary data.`,
      accessibility: "Primary heading appears first, then controls, then content. Status values include text labels.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    loading: {
      required: true,
      component: "Skeleton",
      description: "Preserve the default layout while route data or mutations are pending.",
      trigger: "route query starts, filter changes, refresh starts, or mutation is waiting for server response",
      user_feedback: "Show skeletons in the same regions that will receive content and keep global navigation usable.",
      required_components: ["Skeleton", "PageHeader"],
      data_contract_expectation: "No fabricated records. Use loading placeholders until the relevant query settles.",
      accessibility: "Expose loading status with aria-busy or an equivalent polite announcement.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    empty: {
      required: true,
      component: "EmptyState",
      description: "Explain that no records exist yet and provide the most useful setup action.",
      trigger: "primary query succeeds with zero records before user filters are applied",
      user_feedback: isSettings ? "Explain which configuration has not been completed." : `Invite the user to create the first ${entity.toLowerCase()} item.`,
      primary_action: isSettings ? "Save changes" : "Create first item",
      recovery_action: isSettings ? "Review required settings" : "Create first item",
      required_components: ["EmptyState", "Button"],
      data_contract_expectation: `${dataSource}.load returns an empty collection with no active filters.`,
      accessibility: "Empty-state action is reachable by keyboard and has a specific accessible name.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    error: {
      required: true,
      component: "Alert",
      severity: "danger",
      description: "Explain the load or action failure without blaming the user.",
      trigger: "query or mutation fails after retryable service, network, or validation-independent error",
      user_feedback: "State what failed, what data may be affected, and the safest recovery path.",
      recovery_action: "Retry",
      secondary_action: "Contact support or workspace owner",
      required_components: ["Alert", "Button"],
      data_contract_expectation: "Failed response is not converted into fake content. Error metadata is safe to display.",
      accessibility: "Error summary receives focus when it blocks the current task.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    permission_denied: {
      required: true,
      component: "PermissionNotice",
      severity: "warning",
      description: "Show that the route exists but the current role cannot access or perform the requested work.",
      trigger: "route guard or action permission check fails",
      user_feedback: "Name the missing permission and explain who can grant access.",
      recovery_action: "Contact workspace owner",
      required_components: ["PermissionNotice", "Button"],
      data_contract_expectation: "Do not request protected data after permission denial.",
      accessibility: "Permission notice is announced as a route-level status, not as a generic crash.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    offline: {
      required: true,
      component: "OfflineNotice",
      severity: "warning",
      description: "Keep the user oriented when the app cannot reach the network.",
      trigger: "browser or runtime reports offline status before or during data work",
      user_feedback: "Explain what can still be viewed, what cannot be saved, and when to retry.",
      recovery_action: "Reconnect and retry",
      required_components: ["OfflineNotice", "Button"],
      data_contract_expectation: "Use last-known safe cached data only when explicitly marked as stale.",
      accessibility: baseAccessibility,
      acceptance_criteria_ref: stateAcceptanceRef
    },
    partial_data: {
      required: true,
      component: "Alert",
      severity: "warning",
      description: "Render available primary content while disclosing that secondary content failed or is unavailable.",
      trigger: "primary query succeeds and one or more secondary queries fail",
      user_feedback: "Show what is complete, what is missing, and whether the user can continue safely.",
      recovery_action: "Retry secondary data",
      required_components: ["Alert", primaryContent],
      data_contract_expectation: "Primary entity data remains intact and missing secondary data is explicitly marked.",
      accessibility: "Warning is programmatically associated with the affected section.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    stale_data: {
      required: true,
      component: "Alert",
      severity: "warning",
      description: "Disclose when visible data may be out of date.",
      trigger: "last refresh exceeds freshness threshold or cached data is shown after reconnect",
      user_feedback: "Show last-updated time and a refresh action.",
      recovery_action: "Refresh data",
      required_components: ["Alert", "Button"],
      data_contract_expectation: "Display cache age and avoid presenting stale values as confirmed current state.",
      accessibility: "Freshness warning is readable without relying on color.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    filtered_empty: {
      required: false,
      component: "FilteredEmptyState",
      description: "Explain that active filters or search terms produced no matches.",
      trigger: "filter, search, or sort criteria produce zero visible rows",
      user_feedback: "Summarize active filters and provide a clear reset action.",
      recovery_action: "Clear filters",
      required_components: ["FilteredEmptyState", "Button"],
      data_contract_expectation: "Original unfiltered data remains available or can be reloaded deterministically.",
      accessibility: "Filter reset control has an explicit accessible name.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    validation_error: {
      required: false,
      component: "ValidationSummary",
      severity: "danger",
      description: "Guide the user through correcting invalid form or action input.",
      trigger: "client or server validation rejects submitted input",
      user_feedback: "Show form-level summary and field-level messages near the affected controls.",
      recovery_action: "Fix highlighted fields",
      required_components: ["ValidationSummary", "FormField"],
      data_contract_expectation: "Validation messages map to known fields or to a safe form-level message.",
      accessibility: "Move focus to the validation summary and link each message to its field.",
      acceptance_criteria_ref: stateAcceptanceRef
    },
    success_confirmation: {
      required: false,
      component: "Toast",
      description: "Confirm completion of a create, update, export, or settings action.",
      trigger: "mutation, export, or settings save succeeds",
      user_feedback: "Confirm what changed and show the next useful action.",
      success_action: "Refresh affected data and keep the user on the current route unless navigation is specified.",
      required_components: ["Toast"],
      data_contract_expectation: "Success feedback follows a successful mutation or export response only.",
      accessibility: "Success message is announced politely and never steals focus from the next task.",
      acceptance_criteria_ref: stateAcceptanceRef
    }
  };
}

function inferPrimaryPattern(screenId: string, profile: DomainProfile): string[] {
  if (screenId.includes("settings")) return [];
  if (profile.domain === "healthcare" && screenId.includes("patients")) return profile.patterns;
  if (screenId.includes("report")) return ["ReportSummaryPanel", "DateRangeFilter"].filter((pattern) => profile.patterns.includes(pattern));
  if (screenId.includes("dashboard") || screenId.includes("overview")) {
    return profile.patterns;
  }
  if (screenId.includes("invoice")) return ["InvoiceStatusBadge", "TransactionTableRow", "DateRangeFilter"];
  if (screenId.includes("expense")) return ["TransactionTableRow", "DateRangeFilter"];
  return profile.patterns.slice(0, Math.min(3, profile.patterns.length));
}

function primaryActionFor(route: DomainProfile["routes"][number], profile: DomainProfile): { label: string; action: string; type: string } {
  if (route.screen_id.includes("settings")) {
    return { label: "Save changes", action: "submit:settings", type: "update" };
  }
  if (route.screen_id.includes("dashboard") || route.screen_id.includes("overview")) {
    const invoiceRoute = profile.routes.find((candidate) => candidate.screen_id === "invoices.list");
    if (invoiceRoute) return { label: "Create invoice", action: "navigate:/invoices/new", type: "create" };
  }
  if (route.route.includes(":")) {
    return { label: "Edit", action: "open_edit_flow", type: "update" };
  }
  const entity = profile.entities.find((candidate) => route.screen_id.toLowerCase().includes(candidate.toLowerCase().replace(/s$/, ""))) ?? profile.entities[0];
  return { label: `Create ${entity.toLowerCase()}`, action: `navigate:${route.route}/new`, type: "create" };
}

function buildScreenSpec(route: DomainProfile["routes"][number], input: ArchetypeInput, profile: DomainProfile): ScreenSpec {
  const screenName = humanizeId(route.screen_id);
  const purpose = route.screen_id.includes("overview") || route.screen_id.includes("dashboard")
    ? `Give users a fast overview of ${profile.category} status and priority risks.`
    : `Support the ${screenName.toLowerCase()} workflow with clear data, actions, and states.`;
  const patterns = inferPrimaryPattern(route.screen_id, profile);
  const isDetail = route.route.includes(":");
  const isSettings = route.screen_id.includes("settings");
  const entity = profile.entities.find((candidate) => route.screen_id.toLowerCase().includes(candidate.toLowerCase().replace(/s$/, ""))) ?? profile.entities[0];
  const components = [
    route.layout,
    "PageHeader",
    ...(isSettings
      ? ["FormField", "Input", "Button", "ValidationSummary", "Alert", "Skeleton", "PermissionNotice", "OfflineNotice", "Toast"]
      : ["DataTable", "Badge", "Button", "EmptyState", "FilteredEmptyState", "Alert", "Skeleton", "PermissionNotice", "OfflineNotice", "ValidationSummary", "Toast"]),
    ...(route.screen_id.includes("overview") || route.screen_id.includes("dashboard") ? ["MetricGrid", "Card"] : []),
    ...(isDetail ? ["DetailHeader", "Tabs"] : [])
  ];
  const subject = route.screen_id;
  const primaryAction = primaryActionFor(route, profile);
  const stateAcceptanceId = stableId("AC", subject, "states");
  const states = buildScreenStates(route, subject, screenName, isSettings, entity);

  const acceptance: AcceptanceCriterion[] = [
    {
      id: stableId("AC", subject, "primary-goal"),
      subject,
      condition: "screen data is available",
      expected_behavior: `User can understand the purpose of ${screenName} and identify the primary next action without guessing.`,
      verification_method: "human_review",
      evidence_refs: route.evidence_refs
    },
    {
      id: stateAcceptanceId,
      subject,
      condition: "screen enters loading, empty, error, permission, offline, partial-data, stale-data, filtered-empty, validation, or success state",
      expected_behavior: "Screen renders the required state with stable layout, explicit trigger handling, recovery guidance, data expectations, and accessible messaging.",
      verification_method: "automated_test",
      evidence_refs: ["assumption_web_responsive"]
    },
    {
      id: stableId("AC", subject, "accessibility"),
      subject,
      condition: "keyboard and screen-reader users navigate the screen",
      expected_behavior: "Interactive controls have visible focus, accessible names, and logical tab order.",
      verification_method: "accessibility_check",
      evidence_refs: ["decision_compiler_order"]
    }
  ];

  return {
    screen_id: route.screen_id,
    route: route.route,
    name: screenName,
    priority: route.priority === "primary" ? "P0" : route.priority === "secondary" ? "P1" : "P2",
    purpose,
    primary_user_goal: input.goals?.[0] ?? `Complete ${profile.category} work efficiently.`,
    business_goal: input.businessGoals?.[0] ?? "Increase trust by producing coherent, implementation-ready UI.",
    evidence_refs: route.evidence_refs,
    layout: {
      type: route.layout,
      max_width: route.layout.includes("Dashboard") ? "fluid" : "constrained",
      density: "medium-high",
      shell: route.layout
    },
    sections: [
      {
        id: "page_header",
        component: "PageHeader",
        content: {
          title: screenName,
          subtitle: purpose,
          actions: isSettings
            ? [{ component: "Button", variant: "primary", label: primaryAction.label, action: primaryAction.action }]
            : [{ component: "Button", variant: "primary", label: primaryAction.label, action: primaryAction.action }]
        }
      },
      {
        id: "primary_content",
        component: route.screen_id.includes("overview") || route.screen_id.includes("dashboard") ? "MetricGrid" : "DataTable",
        data_source: slugify(entity),
        patterns
      },
      {
        id: "supporting_context",
        component: "Card",
        purpose: "Provide secondary context, recent activity, or explanatory guidance."
      }
    ],
    required_components: [...new Set(components)],
    required_patterns: patterns,
    data_needs: [entity, ...profile.entities.slice(0, 2)].filter((value, index, list) => list.indexOf(value) === index),
    actions: [
      { id: "primary_action", type: primaryAction.type, label: primaryAction.label, permission: "can_manage_core_entities" },
      { id: "filter", type: "filter", label: "Filter", permission: "can_view_dashboard" },
      { id: "export", type: "export", label: "Export", permission: "can_export_reports" }
    ],
    states,
    interactions: [
      { id: "primary_cta", trigger: "click", result: isSettings ? "submit_form" : "open_create_flow" },
      { id: "filter_change", trigger: "filter_change", result: "update_visible_results" },
      { id: "retry_load", trigger: "click", result: "retry_data_fetch" },
      { id: "clear_filters", trigger: "click", result: "reset_filter_state" },
      { id: "refresh_stale_data", trigger: "click", result: "refresh_data_query" },
      { id: "retry_after_reconnect", trigger: "online", result: "retry_data_fetch" }
    ],
    responsive_behavior: {
      desktop: "Use shell navigation and multi-column content where useful.",
      tablet: "Collapse secondary panels below primary content.",
      mobile: "Use single-column stack, preserve primary actions, and avoid horizontal scrolling except in data tables with fallback card views."
    },
    accessibility: {
      target: "WCAG AA",
      keyboard_navigation: "required",
      focus_visible: "required",
      color_not_sole_indicator: true,
      chart_fallback_table: route.screen_id.includes("overview") || route.screen_id.includes("report")
    },
    content_rules: [
      "Use specific labels instead of vague UI copy.",
      "Error messages must explain what happened and provide a recovery path.",
      "Status and risk labels must use text, not color alone."
    ],
    acceptance_criteria: acceptance,
    forbidden_inventions: [
      "Do not add routes not listed in route-map.json.",
      "Do not add visual styles outside generated tokens.",
      `Do not remove required states: ${REQUIRED_SCREEN_STATES.join(", ")}.`
    ]
  };
}

function buildFlowSpecs(profile: DomainProfile, routes: RouteSpec[]): { flows: GeneratedFlowSpec[] } {
  return {
    flows: profile.workflows.map((workflow) => {
      const workflowRoutes = routesForWorkflow(workflow, routes);
      const steps = workflowRoutes.flatMap((route, routeIndex) => {
        const baseOrder = routeIndex * 4;
        return [
          {
            step_id: stableId("flow-step", workflow, route.screen_id, "enter"),
            order: baseOrder + 1,
            route: route.route,
            screen_id: route.screen_id,
            intent: `Enter ${humanizeId(route.screen_id)} from navigation or a deep link.`,
            interaction: "navigate",
            required_states: ["loading", "error", "permission_denied", "offline"],
            entry_condition: "User is authenticated or reaches an allowed public route.",
            completion_signal: "Route shell, heading, and primary controls are visible.",
            failure_recovery: "Render permission_denied, offline, or error state with a recovery action."
          },
          {
            step_id: stableId("flow-step", workflow, route.screen_id, "review"),
            order: baseOrder + 2,
            route: route.route,
            screen_id: route.screen_id,
            intent: "Review primary data, status, and risk context.",
            interaction: "read",
            required_states: ["default", "empty", "partial_data", "stale_data"],
            entry_condition: "Route data request resolves.",
            completion_signal: "User can identify the current state of the workflow and the next available action.",
            failure_recovery: "Render empty, partial_data, stale_data, or error with explicit guidance."
          },
          {
            step_id: stableId("flow-step", workflow, route.screen_id, "act"),
            order: baseOrder + 3,
            route: route.route,
            screen_id: route.screen_id,
            intent: "Apply a filter, create/update data, export, or continue to the next route.",
            interaction: "primary_action",
            required_states: ["loading", "filtered_empty", "validation_error"],
            entry_condition: "User activates a visible control they have permission to use.",
            completion_signal: "UI reflects the result without changing unapproved routes or styles.",
            failure_recovery: "Render validation_error, filtered_empty, permission_denied, or error state as appropriate."
          },
          {
            step_id: stableId("flow-step", workflow, route.screen_id, "confirm"),
            order: baseOrder + 4,
            route: route.route,
            screen_id: route.screen_id,
            intent: "Confirm result and keep the user oriented for the next task.",
            interaction: "confirm_result",
            required_states: ["success_confirmation", "default"],
            entry_condition: "Action or route update completes successfully.",
            completion_signal: "Success or refreshed default state is visible and accessible.",
            failure_recovery: "Keep the previous safe state visible and render a recovery-oriented error."
          }
        ];
      });

      return {
        flow_id: workflow,
        name: humanizeId(workflow),
        route_refs: workflowRoutes.map((route) => route.route),
        screen_refs: workflowRoutes.map((route) => route.screen_id),
        steps,
        required_states: [...new Set(steps.flatMap((step) => step.required_states))],
        recovery_states: RECOVERY_STATE_KEYS,
        evidence_refs: ["inference_domain_profile"]
      };
    })
  };
}

function buildStateTransitions(screen: ScreenSpec): UXFlowStateCompleteness["state_transition_contracts"][number] {
  const transitions = [
    {
      from: "loading",
      on: "query_success_with_records",
      to: "default",
      feedback: "Replace skeletons with stable content in the same layout regions."
    },
    {
      from: "loading",
      on: "query_success_without_records",
      to: "empty",
      feedback: "Render setup guidance without collapsing the route shell.",
      recovery_action: "Create first item"
    },
    {
      from: "loading",
      on: "query_error",
      to: "error",
      feedback: "Show the error summary and preserve safe navigation.",
      recovery_action: "Retry"
    },
    {
      from: "default",
      on: "filter_returns_no_results",
      to: "filtered_empty",
      feedback: "Show active filter context and reset action.",
      recovery_action: "Clear filters"
    },
    {
      from: "default",
      on: "secondary_data_failure",
      to: "partial_data",
      feedback: "Keep usable primary content visible and identify incomplete sections.",
      recovery_action: "Retry secondary data"
    },
    {
      from: "default",
      on: "freshness_threshold_exceeded",
      to: "stale_data",
      feedback: "Show last-updated context and a refresh control.",
      recovery_action: "Refresh data"
    },
    {
      from: "default",
      on: "permission_revoked",
      to: "permission_denied",
      feedback: "Explain the missing permission without leaking protected data.",
      recovery_action: "Contact workspace owner"
    },
    {
      from: "default",
      on: "network_unavailable",
      to: "offline",
      feedback: "Explain what can be viewed and what cannot be saved offline.",
      recovery_action: "Reconnect and retry"
    },
    {
      from: "validation_error",
      on: "valid_input_submitted",
      to: "loading",
      feedback: "Retry the action with corrected input.",
      recovery_action: "Fix highlighted fields"
    },
    {
      from: "loading",
      on: "mutation_success",
      to: "success_confirmation",
      feedback: "Confirm the completed action and refresh affected data."
    },
    {
      from: "success_confirmation",
      on: "announcement_complete",
      to: "default",
      feedback: "Return focus to the next relevant control."
    }
  ].filter((transition) =>
    Object.prototype.hasOwnProperty.call(screen.states, transition.from) &&
    Object.prototype.hasOwnProperty.call(screen.states, transition.to)
  );

  return {
    screen_id: screen.screen_id,
    transitions
  };
}

function stateRecoveryAction(screen: ScreenSpec, state: string): string | undefined {
  const definition = screen.states[state];
  if (typeof definition !== "object" || definition === null) return undefined;
  const recovery = (definition as Record<string, unknown>).recovery_action;
  return typeof recovery === "string" && recovery.trim().length > 0 ? recovery : undefined;
}

function buildUXFlowStateCompleteness(screenSpecs: ScreenSpec[], flowSpecs: GeneratedFlowSpec[]): UXFlowStateCompleteness {
  const screenCoverage = screenSpecs.map((screen) => {
    const coveredStates = Object.keys(screen.states);
    const missingRequiredStates = REQUIRED_SCREEN_STATES.filter((state) => !coveredStates.includes(state));
    const missingRecoveryActions = RECOVERY_STATE_KEYS
      .filter((state) => coveredStates.includes(state))
      .filter((state) => !stateRecoveryAction(screen, state));
    const recoveryStatesWithActions = RECOVERY_STATE_KEYS
      .filter((state) => coveredStates.includes(state))
      .filter((state) => stateRecoveryAction(screen, state));

    return {
      screen_id: screen.screen_id,
      route: screen.route,
      priority: screen.priority,
      covered_states: coveredStates,
      missing_required_states: missingRequiredStates,
      recovery_states_with_actions: recoveryStatesWithActions,
      missing_recovery_actions: missingRecoveryActions,
      action_count: screen.actions.length,
      acceptance_count: screen.acceptance_criteria.length,
      status: missingRequiredStates.length === 0 && missingRecoveryActions.length === 0 && screen.acceptance_criteria.length > 0 ? "pass" as const : "fail" as const
    };
  });

  const flowCoverage = flowSpecs.map((flow) => {
    const flowStates = [...new Set(flow.steps.flatMap((step) => step.required_states))];
    const missingRequiredStates = REQUIRED_SCREEN_STATES.filter((state) => !flowStates.includes(state));
    const hasEntryRoute = flow.route_refs.length > 0 && flow.screen_refs.length > 0;
    const hasActionStep = flow.steps.some((step) => step.interaction === "primary_action");
    const hasRecoveryStep = flow.steps.some((step) => step.failure_recovery.toLowerCase().includes("recover") || step.failure_recovery.toLowerCase().includes("retry") || step.failure_recovery.toLowerCase().includes("render"));

    return {
      flow_id: flow.flow_id,
      name: flow.name,
      route_refs: flow.route_refs,
      screen_refs: flow.screen_refs,
      required_states_covered: flowStates,
      missing_required_states: missingRequiredStates,
      has_entry_route: hasEntryRoute,
      has_action_step: hasActionStep,
      has_recovery_step: hasRecoveryStep,
      status: missingRequiredStates.length === 0 && hasEntryRoute && hasActionStep && hasRecoveryStep ? "pass" as const : "fail" as const
    };
  });

  const blockers = [
    ...screenCoverage
      .filter((screen) => screen.status === "fail")
      .map((screen) => `${screen.screen_id}: missing states ${screen.missing_required_states.join(", ") || "none"}; missing recovery actions ${screen.missing_recovery_actions.join(", ") || "none"}`),
    ...flowCoverage
      .filter((flow) => flow.status === "fail")
      .map((flow) => `${flow.flow_id}: incomplete flow state coverage or missing action/recovery steps.`)
  ];

  return {
    required_state_keys: REQUIRED_SCREEN_STATES,
    contextual_state_keys: CONTEXTUAL_SCREEN_STATES,
    screen_coverage: screenCoverage,
    flow_coverage: flowCoverage,
    state_transition_contracts: screenSpecs.map((screen) => buildStateTransitions(screen)),
    summary: {
      screen_count: screenCoverage.length,
      complete_screens: screenCoverage.filter((screen) => screen.status === "pass").length,
      incomplete_screens: screenCoverage.filter((screen) => screen.status === "fail").length,
      flow_count: flowCoverage.length,
      complete_flows: flowCoverage.filter((flow) => flow.status === "pass").length,
      incomplete_flows: flowCoverage.filter((flow) => flow.status === "fail").length
    },
    blockers,
    warnings: blockers.length === 0 ? ["Completeness is generated from deterministic inference and still needs product-owner review for domain-specific edge states."] : [],
    evidence_refs: ["inference_domain_profile", "decision_compiler_order", "assumption_web_responsive"]
  };
}

function buildUXFlowStateCompletenessReport(completeness: UXFlowStateCompleteness): string {
  return [
    "# UX Flow and State Completeness",
    "",
    `Screens: ${completeness.summary.complete_screens}/${completeness.summary.screen_count} complete`,
    `Flows: ${completeness.summary.complete_flows}/${completeness.summary.flow_count} complete`,
    `Required states: ${completeness.required_state_keys.join(", ")}`,
    `Contextual states: ${completeness.contextual_state_keys.join(", ")}`,
    "",
    "## Screen Coverage",
    "",
    ...completeness.screen_coverage.map((screen) => [
      `- ${screen.screen_id} (${screen.route}): ${screen.status}`,
      `  states: ${screen.covered_states.join(", ")}`,
      `  missing required: ${screen.missing_required_states.length > 0 ? screen.missing_required_states.join(", ") : "none"}`,
      `  missing recovery: ${screen.missing_recovery_actions.length > 0 ? screen.missing_recovery_actions.join(", ") : "none"}`
    ].join("\n")),
    "",
    "## Flow Coverage",
    "",
    ...completeness.flow_coverage.map((flow) => [
      `- ${flow.flow_id}: ${flow.status}`,
      `  routes: ${flow.route_refs.join(", ")}`,
      `  states: ${flow.required_states_covered.join(", ")}`,
      `  missing required: ${flow.missing_required_states.length > 0 ? flow.missing_required_states.join(", ") : "none"}`
    ].join("\n")),
    "",
    "## Blockers",
    "",
    completeness.blockers.length > 0 ? completeness.blockers.map((blocker) => `- ${blocker}`).join("\n") : "None.",
    "",
    "## Warnings",
    "",
    completeness.warnings.length > 0 ? completeness.warnings.map((warning) => `- ${warning}`).join("\n") : "None."
  ].join("\n");
}

export function buildExperienceArtifacts(
  input: ArchetypeInput,
  profile: DomainProfile,
  product: ProductArtifacts,
  evidence: EvidenceLedger
): ExperienceArtifacts {
  const routes = profile.routes;
  const screenSpecs = routes.map((route) => buildScreenSpec(route, input, profile));
  const flowSpecs = buildFlowSpecs(profile, routes);
  const uxFlowStateCompleteness = buildUXFlowStateCompleteness(screenSpecs, flowSpecs.flows);

  return {
    userJourneys: [
      "# User Journeys",
      "",
      ...profile.workflows.map((workflow) => `- ${humanizeId(workflow)}: user enters through primary navigation, reviews relevant data, takes action, and receives accessible feedback.`)
    ].join("\n"),
    flowSpecs,
    informationArchitecture: {
      hierarchy: [
        { level: 1, label: "Core work", routes: routes.filter((route) => route.nav_group === "core").map((route) => route.route) },
        { level: 1, label: "Analysis", routes: routes.filter((route) => route.nav_group === "analysis").map((route) => route.route) },
        { level: 1, label: "Utility", routes: routes.filter((route) => route.nav_group === "utility").map((route) => route.route) }
      ],
      evidence_refs: ["decision_compiler_order"]
    },
    routeMap: { routes },
    screenInventory: {
      screens: screenSpecs.map((screen) => ({
        screen_id: screen.screen_id,
        route: screen.route,
        purpose: screen.purpose,
        primary_user_goal: screen.primary_user_goal,
        business_goal: screen.business_goal,
        priority: screen.priority,
        complexity: screen.required_patterns.length > 3 ? "medium-high" : "medium",
        required_patterns: screen.required_patterns,
        required_entities: screen.data_needs,
        required_states: Object.keys(screen.states),
        evidence_refs: screen.evidence_refs
      }))
    },
    navigationModel: {
      type: "persistent_sidebar_with_responsive_mobile_nav",
      primary_routes: routes.filter((route) => route.priority === "primary"),
      utility_routes: routes.filter((route) => route.priority === "utility"),
      active_state: "match current route and parent route for detail screens",
      evidence_refs: ["assumption_web_responsive"]
    },
    stateModels: {
      global_states: ["authenticated", "unauthenticated", "loading", "error", "permission_denied", "offline", "stale_session"],
      required_screen_states: REQUIRED_SCREEN_STATES,
      contextual_screen_states: CONTEXTUAL_SCREEN_STATES,
      recovery_states: RECOVERY_STATE_KEYS,
      screen_states: screenSpecs.map((screen) => ({
        screen_id: screen.screen_id,
        route: screen.route,
        states: Object.keys(screen.states),
        required_states: REQUIRED_SCREEN_STATES,
        contextual_states: CONTEXTUAL_SCREEN_STATES,
        transitions_ref: `ux-flow-state-completeness.state_transition_contracts.${screen.screen_id}`
      }))
    },
    screenStateMatrix: {
      required_state_keys: REQUIRED_SCREEN_STATES,
      contextual_state_keys: CONTEXTUAL_SCREEN_STATES,
      screens: screenSpecs.map((screen) => ({
        screen_id: screen.screen_id,
        route: screen.route,
        priority: screen.priority,
        states: Object.entries(screen.states).map(([state, definition]) => ({
          state,
          ...(definition as Record<string, unknown>)
        }))
      }))
    },
    uxFlowStateCompleteness,
    uxFlowStateCompletenessReport: buildUXFlowStateCompletenessReport(uxFlowStateCompleteness),
    actionTaxonomy: {
      actions: ["navigate", "create", "update", "delete", "bulk_action", "filter", "sort", "search", "export", "import", "connect", "authenticate", "dismiss", "retry"]
    },
    screenSpecs
  };
}
