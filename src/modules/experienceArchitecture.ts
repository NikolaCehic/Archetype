import type {
  AcceptanceCriterion,
  ArchetypeInput,
  DomainProfile,
  EvidenceLedger,
  ExperienceArtifacts,
  ProductArtifacts,
  ScreenSpec
} from "../core/types";
import { slugify, stableId } from "../core/stable";

function humanizeId(value: string): string {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferPrimaryPattern(screenId: string, profile: DomainProfile): string[] {
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
    ...(isSettings ? ["FormField", "Input", "Button"] : ["DataTable", "Badge", "Button", "EmptyState", "Alert", "Skeleton"]),
    ...(route.screen_id.includes("overview") || route.screen_id.includes("dashboard") ? ["MetricGrid", "Card"] : []),
    ...(isDetail ? ["DetailHeader", "Tabs"] : [])
  ];
  const subject = route.screen_id;
  const primaryAction = primaryActionFor(route, profile);

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
      id: stableId("AC", subject, "states"),
      subject,
      condition: "screen enters loading, empty, error, or permission state",
      expected_behavior: "Screen renders the required state with stable layout, recovery guidance, and accessible messaging.",
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
    states: {
      default: { required: true, description: "Render live or fixture-backed data." },
      loading: { required: true, component: "Skeleton", description: "Preserve layout while data loads." },
      empty: { required: true, component: "EmptyState", primary_action: isSettings ? "Save changes" : "Create first item" },
      error: { required: true, component: "Alert", recovery_action: "Retry" },
      permission_denied: { required: true, component: "PermissionNotice", recovery_action: "Contact workspace owner" },
      partial_data: { required: !isSettings, component: "Alert", severity: "warning" },
      stale_data: { required: !isSettings, component: "Alert", severity: "warning" }
    },
    interactions: [
      { id: "primary_cta", trigger: "click", result: isSettings ? "submit_form" : "open_create_flow" },
      { id: "filter_change", trigger: "filter_change", result: "update_visible_results" },
      { id: "retry_load", trigger: "click", result: "retry_data_fetch" }
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
      "Do not remove required loading, empty, error, or permission states."
    ]
  };
}

export function buildExperienceArtifacts(
  input: ArchetypeInput,
  profile: DomainProfile,
  product: ProductArtifacts,
  evidence: EvidenceLedger
): ExperienceArtifacts {
  const routes = profile.routes;
  const screenSpecs = routes.map((route) => buildScreenSpec(route, input, profile));

  return {
    userJourneys: [
      "# User Journeys",
      "",
      ...profile.workflows.map((workflow) => `- ${humanizeId(workflow)}: user enters through primary navigation, reviews relevant data, takes action, and receives accessible feedback.`)
    ].join("\n"),
    flowSpecs: {
      flows: profile.workflows.map((workflow) => ({
        flow_id: workflow,
        name: humanizeId(workflow),
        steps: ["open_relevant_route", "review_primary_data", "apply_filter_or_action", "confirm_result"],
        evidence_refs: ["inference_domain_profile"]
      }))
    },
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
      global_states: ["authenticated", "unauthenticated", "loading", "error", "permission_denied"],
      screen_states: screenSpecs.map((screen) => ({ screen_id: screen.screen_id, states: Object.keys(screen.states) }))
    },
    screenStateMatrix: {
      screens: screenSpecs.map((screen) => ({
        screen_id: screen.screen_id,
        states: screen.states
      }))
    },
    actionTaxonomy: {
      actions: ["navigate", "create", "update", "delete", "bulk_action", "filter", "sort", "search", "export", "import", "connect", "authenticate", "dismiss", "retry"]
    },
    screenSpecs
  };
}
