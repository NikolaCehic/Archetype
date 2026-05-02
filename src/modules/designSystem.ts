import type { ArchetypeInput, DesignSystemArtifacts, DomainProfile, ExperienceArtifacts } from "../core/types";
import { slugify } from "../core/stable";

function jsonToken(value: string): Record<string, string> {
  return { value };
}

function buildTypographySystem(): Record<string, unknown> {
  const typeRoles = {
    "display.sm": { font_size: "1.5rem", line_height: "2rem", font_weight: 700, letter_spacing: "0", max_width: "42rem", usage: "Major product area headings only." },
    "heading.lg": { font_size: "1.25rem", line_height: "1.75rem", font_weight: 700, letter_spacing: "0", max_width: "48rem", usage: "Primary screen titles and modal titles." },
    "heading.md": { font_size: "1rem", line_height: "1.5rem", font_weight: 650, letter_spacing: "0", max_width: "52rem", usage: "Panel and section headings." },
    "body.md": { font_size: "0.875rem", line_height: "1.375rem", font_weight: 400, letter_spacing: "0", max_width: "72ch", usage: "Default product body text." },
    "body.sm": { font_size: "0.8125rem", line_height: "1.25rem", font_weight: 400, letter_spacing: "0", max_width: "68ch", usage: "Dense table and support copy." },
    "label.sm": { font_size: "0.75rem", line_height: "1rem", font_weight: 650, letter_spacing: "0", max_width: "32ch", usage: "Field labels, badges, and compact metadata." },
    "code.sm": { font_size: "0.8125rem", line_height: "1.25rem", font_weight: 500, letter_spacing: "0", max_width: "80ch", usage: "Artifact paths, code previews, IDs, and technical values." }
  };

  return {
    system_version: "1.0",
    font_families: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
    },
    type_roles: typeRoles,
    responsive_rules: {
      mobile: "Keep the same role mapping, reduce layout density before reducing font size.",
      tablet: "Preserve heading/body contrast and keep line length below 72ch.",
      desktop: "Use compact roles for dense review surfaces and avoid hero-scale type inside tools."
    },
    accessibility_rules: [
      "Do not scale type with viewport width.",
      "Letter spacing must remain 0 unless a reviewed brand exception is added.",
      "Body copy line length must stay between 65ch and 75ch where prose appears.",
      "Interactive labels must not truncate critical action meaning."
    ],
    css_variables: Object.fromEntries(Object.entries(typeRoles).flatMap(([role, values]) => {
      const key = role.replace(/[.]/g, "-");
      return [
        [`--type-${key}-font-size`, values.font_size],
        [`--type-${key}-line-height`, values.line_height],
        [`--type-${key}-font-weight`, String(values.font_weight)],
        [`--type-${key}-letter-spacing`, values.letter_spacing]
      ];
    })),
    blockers: [],
    warnings: ["Typography uses a deterministic system stack and should be reviewed if a brand typeface is provided."],
    evidence_refs: ["decision_compiler_order"]
  };
}

function buildTypographyCss(typographySystem: Record<string, unknown>): string {
  const variables = typographySystem.css_variables as Record<string, string>;
  const lines = [":root {"];
  for (const [name, value] of Object.entries(variables)) {
    lines.push(`  ${name}: ${value};`);
  }
  lines.push("}");
  lines.push("");
  lines.push(".type-display-sm { font-size: var(--type-display-sm-font-size); line-height: var(--type-display-sm-line-height); font-weight: var(--type-display-sm-font-weight); letter-spacing: var(--type-display-sm-letter-spacing); }");
  lines.push(".type-heading-lg { font-size: var(--type-heading-lg-font-size); line-height: var(--type-heading-lg-line-height); font-weight: var(--type-heading-lg-font-weight); letter-spacing: var(--type-heading-lg-letter-spacing); }");
  lines.push(".type-heading-md { font-size: var(--type-heading-md-font-size); line-height: var(--type-heading-md-line-height); font-weight: var(--type-heading-md-font-weight); letter-spacing: var(--type-heading-md-letter-spacing); }");
  lines.push(".type-body-md { font-size: var(--type-body-md-font-size); line-height: var(--type-body-md-line-height); font-weight: var(--type-body-md-font-weight); letter-spacing: var(--type-body-md-letter-spacing); max-width: 72ch; }");
  lines.push(".type-body-sm { font-size: var(--type-body-sm-font-size); line-height: var(--type-body-sm-line-height); font-weight: var(--type-body-sm-font-weight); letter-spacing: var(--type-body-sm-letter-spacing); max-width: 68ch; }");
  lines.push(".type-label-sm { font-size: var(--type-label-sm-font-size); line-height: var(--type-label-sm-line-height); font-weight: var(--type-label-sm-font-weight); letter-spacing: var(--type-label-sm-letter-spacing); }");
  lines.push(".type-code-sm { font-size: var(--type-code-sm-font-size); line-height: var(--type-code-sm-line-height); font-weight: var(--type-code-sm-font-weight); letter-spacing: var(--type-code-sm-letter-spacing); max-width: 80ch; }");
  return lines.join("\n");
}

function buildTokenContracts(
  primitiveTokens: Record<string, unknown>,
  semanticTokens: Record<string, unknown>,
  componentTokens: Record<string, unknown>,
  typographySystem: Record<string, unknown>
): Record<string, unknown> {
  return {
    contract_version: "1.0",
    layers: {
      primitive: {
        source: "04-design-system/tokens/primitive-tokens.json",
        required_groups: ["color", "spacing", "radius", "font", "fontSize", "lineHeight", "fontWeight"],
        token_count: Object.values(primitiveTokens).reduce<number>((sum, group) => sum + Object.keys(group as Record<string, unknown>).length, 0)
      },
      semantic: {
        source: "04-design-system/tokens/semantic-tokens.json",
        required_groups: ["color", "spacing", "radius", "typography"],
        token_count: Object.values(semanticTokens).reduce<number>((sum, group) => sum + Object.keys(group as Record<string, unknown>).length, 0)
      },
      component: {
        source: "04-design-system/tokens/component-tokens.json",
        token_count: Object.keys(componentTokens).length
      },
      typography: {
        source: "04-design-system/tokens/typography-system.json",
        role_count: Object.keys((typographySystem.type_roles as Record<string, unknown>) ?? {}).length
      }
    },
    usage_map: {
      screen_specs: "Use semantic tokens and typography roles only.",
      component_contracts: "Component token refs must resolve to component or semantic token keys.",
      pattern_contracts: "Patterns inherit component token behavior and must not introduce style literals.",
      frontend_agent: "Report token gaps instead of hardcoding values."
    },
    constraints: [
      "No hardcoded color, radius, spacing, font-size, or line-height values in generated frontend code.",
      "Use CSS variables exported by css-variables.css and typography.css.",
      "Use semantic tokens before primitive tokens.",
      "Do not add new token groups without revising token-contracts.json.",
      "Do not use negative letter spacing."
    ],
    blockers: [],
    warnings: ["Token contracts are generated from the current design direction and should be reviewed when brand systems are supplied."],
    evidence_refs: ["decision_compiler_order"]
  };
}

interface ComponentPropContract {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string | boolean;
  allowed_values?: string[];
}

interface ComponentContract {
  name: string;
  category: string;
  import_path: string;
  determinism_level: "strict";
  purpose: string;
  used_on_screens: string[];
  prop_contract: ComponentPropContract[];
  slot_contract: Array<{
    name: string;
    required: boolean;
    accepts: string;
    description: string;
  }>;
  variant_contract: Array<{
    variant: string;
    use_when: string;
    token_refs: string[];
  }>;
  state_contract: Array<{
    state: string;
    trigger: string;
    visual_behavior: string;
    token_refs: string[];
    accessibility_behavior: string;
  }>;
  event_contract: Array<{
    event: string;
    payload: string;
    required: boolean;
    description: string;
  }>;
  token_contract: {
    component_token_key: string;
    required_tokens: string[];
    forbidden_tokens: string[];
  };
  accessibility_contract: string[];
  composition_contract: string[];
  data_contract: Record<string, unknown>;
  test_contract: {
    selector: string;
    required_tests: string[];
  };
  forbidden_usage: string[];
  evidence_refs: string[];
}

function componentCategory(component: string): string {
  if (["Button", "IconButton", "Input", "Textarea", "Select", "Checkbox", "Radio", "Switch", "Badge", "Skeleton"].includes(component)) return "primitive";
  if (component.endsWith("Shell")) return "layout";
  if (["DataTable", "MetricGrid", "PageHeader", "DetailHeader", "FormField"].includes(component)) return "composite";
  return "state_or_feedback";
}

function componentVariants(component: string): string[] {
  if (component === "Button") return ["primary", "secondary", "ghost", "danger"];
  if (component === "IconButton") return ["default", "ghost", "danger"];
  if (component === "Badge") return ["neutral", "success", "warning", "danger"];
  if (["Alert", "Toast", "PermissionNotice", "OfflineNotice"].includes(component)) return ["info", "success", "warning", "danger"];
  if (component === "Skeleton") return ["text", "block", "table", "metric"];
  if (component === "DataTable") return ["default", "compact", "card_fallback"];
  if (component === "MetricGrid") return ["default", "dense"];
  return ["default"];
}

function componentProps(component: string): ComponentPropContract[] {
  const common: ComponentPropContract[] = [
    { name: "id", type: "string", required: false, description: "Stable DOM id when the component needs label, description, or test association." },
    { name: "testId", type: "string", required: false, description: "Stable test selector suffix. Do not derive selectors from visible copy." }
  ];

  if (component === "Button") {
    return [
      { name: "label", type: "string", required: true, description: "Visible action label." },
      { name: "variant", type: "primary | secondary | ghost | danger", required: true, default: "secondary", allowed_values: componentVariants(component), description: "Visual priority mapped to semantic action intent." },
      { name: "size", type: "sm | md | lg", required: false, default: "md", allowed_values: ["sm", "md", "lg"], description: "Control size from the component token scale." },
      { name: "disabled", type: "boolean", required: false, default: false, description: "Prevents interaction while preserving accessible disabled state." },
      { name: "loading", type: "boolean", required: false, default: false, description: "Shows pending state for async actions." },
      { name: "type", type: "button | submit | reset", required: false, default: "button", allowed_values: ["button", "submit", "reset"], description: "Native button behavior." },
      { name: "onClick", type: "(event) => void", required: false, description: "Action handler. Required when type is button and the control is interactive." },
      ...common
    ];
  }

  if (component === "IconButton") {
    return [
      { name: "ariaLabel", type: "string", required: true, description: "Accessible action name for icon-only controls." },
      { name: "icon", type: "IconName", required: true, description: "Approved icon identifier from the frontend icon library." },
      { name: "variant", type: "default | ghost | danger", required: true, default: "default", allowed_values: componentVariants(component), description: "Visual priority mapped to action intent." },
      { name: "disabled", type: "boolean", required: false, default: false, description: "Prevents interaction while preserving accessible disabled state." },
      { name: "onClick", type: "(event) => void", required: true, description: "Action handler." },
      ...common
    ];
  }

  if (["Input", "Textarea", "Select"].includes(component)) {
    return [
      { name: "name", type: "string", required: true, description: "Form field name used by validation and submission." },
      { name: "label", type: "string", required: true, description: "Visible or programmatically associated field label." },
      { name: "value", type: "string", required: true, description: "Controlled field value." },
      { name: "placeholder", type: "string", required: false, description: "Supplemental hint. Never replaces the label." },
      { name: "required", type: "boolean", required: false, default: false, description: "Marks field as required in UI and validation copy." },
      { name: "disabled", type: "boolean", required: false, default: false, description: "Disables input while preserving label and value." },
      { name: "error", type: "string | undefined", required: false, description: "Field-level validation message." },
      { name: "onChange", type: "(value: string) => void", required: true, description: "Controlled value update handler." },
      ...common
    ];
  }

  if (["Checkbox", "Radio", "Switch"].includes(component)) {
    return [
      { name: "name", type: "string", required: true, description: "Form control name." },
      { name: "label", type: "string", required: true, description: "Visible control label." },
      { name: "checked", type: "boolean", required: true, description: "Controlled checked state." },
      { name: "disabled", type: "boolean", required: false, default: false, description: "Disables interaction." },
      { name: "onChange", type: "(checked: boolean) => void", required: true, description: "Controlled checked update handler." },
      ...common
    ];
  }

  if (component === "DataTable") {
    return [
      { name: "columns", type: "Array<{ key: string; label: string; align?: 'start' | 'end'; format?: string }>", required: true, description: "Column contract. Labels must match the screen spec and data contract." },
      { name: "rows", type: "Array<Record<string, unknown>>", required: true, description: "Rows from fixture or backend contract only." },
      { name: "rowKey", type: "string", required: true, default: "id", description: "Stable unique key field." },
      { name: "state", type: "default | loading | empty | error | partial_data | stale_data | filtered_empty", required: true, description: "Screen state that controls table presentation." },
      { name: "onSort", type: "(key: string) => void", required: false, description: "Sort interaction handler when sorting is enabled." },
      { name: "onRowAction", type: "(rowId: string, actionId: string) => void", required: false, description: "Row action handler declared by the screen spec." },
      ...common
    ];
  }

  if (component === "PageHeader" || component === "DetailHeader") {
    return [
      { name: "title", type: "string", required: true, description: "Primary screen heading." },
      { name: "subtitle", type: "string", required: false, description: "Concise contextual support copy." },
      { name: "actions", type: "Array<ActionDescriptor>", required: false, description: "Actions declared by the screen spec only." },
      ...common
    ];
  }

  if (["Alert", "Toast", "EmptyState", "FilteredEmptyState", "PermissionNotice", "OfflineNotice", "ValidationSummary"].includes(component)) {
    return [
      { name: "title", type: "string", required: true, description: "State or feedback title." },
      { name: "description", type: "string", required: true, description: "Specific guidance for the current state." },
      { name: "tone", type: "info | success | warning | danger", required: true, default: "info", allowed_values: ["info", "success", "warning", "danger"], description: "Semantic tone. Must match state severity." },
      { name: "action", type: "ActionDescriptor | undefined", required: false, description: "Recovery or next action declared by the state contract." },
      ...common
    ];
  }

  if (component === "FormField") {
    return [
      { name: "fieldId", type: "string", required: true, description: "ID that links label, control, hint, and error." },
      { name: "label", type: "string", required: true, description: "Visible field label." },
      { name: "hint", type: "string | undefined", required: false, description: "Short input guidance." },
      { name: "error", type: "string | undefined", required: false, description: "Field-level validation message." },
      { name: "required", type: "boolean", required: false, default: false, description: "Required marker and validation metadata." },
      ...common
    ];
  }

  if (component.endsWith("Shell")) {
    return [
      { name: "navigation", type: "NavigationItem[]", required: true, description: "Routes from route-map.json only." },
      { name: "activeRoute", type: "string", required: true, description: "Current route path." },
      { name: "children", type: "ReactNode", required: true, description: "Screen content." },
      ...common
    ];
  }

  return [
    { name: "children", type: "ReactNode", required: false, description: "Composed content declared by screen or pattern specs." },
    { name: "state", type: "string", required: false, description: "State key when the component adapts to screen state." },
    ...common
  ];
}

function componentSlots(component: string): ComponentContract["slot_contract"] {
  if (component === "DataTable") {
    return [
      { name: "header", required: true, accepts: "column labels and sort controls", description: "Table heading row." },
      { name: "body", required: true, accepts: "data rows", description: "Rows bound to the data contract." },
      { name: "empty", required: false, accepts: "EmptyState or FilteredEmptyState", description: "State-specific empty presentation." },
      { name: "actions", required: false, accepts: "Button or IconButton", description: "Row or bulk actions declared by screen specs." }
    ];
  }
  if (component.endsWith("Shell")) {
    return [
      { name: "navigation", required: true, accepts: "Sidebar or TopNav", description: "Generated route navigation." },
      { name: "content", required: true, accepts: "screen content", description: "Current route content." }
    ];
  }
  return [
    { name: "leading", required: false, accepts: "icon or status indicator", description: "Optional leading affordance." },
    { name: "content", required: true, accepts: "text or composed children", description: "Primary component content." },
    { name: "trailing", required: false, accepts: "action, metadata, or icon", description: "Optional trailing affordance." }
  ];
}

function componentStates(component: string): ComponentContract["state_contract"] {
  const base = [
    { state: "default", trigger: "component renders with valid props", visual_behavior: "Use default component tokens and stable layout.", token_refs: [`${slugify(component)}.default.background`, `${slugify(component)}.default.text`], accessibility_behavior: "Expose semantic role and accessible name when interactive." },
    { state: "focus", trigger: "keyboard focus enters an interactive element", visual_behavior: "Show visible focus treatment without layout shift.", token_refs: [`${slugify(component)}.focus.ring`], accessibility_behavior: "Focus indicator meets WCAG AA expectations." },
    { state: "disabled", trigger: "disabled prop is true or action is unavailable", visual_behavior: "Reduce emphasis while preserving readability.", token_refs: [`${slugify(component)}.disabled.background`, `${slugify(component)}.disabled.text`], accessibility_behavior: "Expose disabled semantics and avoid unreachable hidden actions." }
  ];
  if (["Button", "IconButton", "Input", "Textarea", "Select", "Checkbox", "Radio", "Switch"].includes(component)) {
    base.splice(1, 0, { state: "hover", trigger: "pointer hovers over enabled control", visual_behavior: "Use subtle tokenized hover state.", token_refs: [`${slugify(component)}.hover.background`], accessibility_behavior: "Hover never reveals essential information that keyboard users cannot access." });
  }
  if (["Button", "IconButton", "DataTable", "Skeleton"].includes(component)) {
    base.push({ state: "loading", trigger: "async work is pending", visual_behavior: "Show progress without moving surrounding layout.", token_refs: [`${slugify(component)}.loading.background`], accessibility_behavior: "Expose loading state politely." });
  }
  if (["Input", "Textarea", "Select", "FormField", "ValidationSummary"].includes(component)) {
    base.push({ state: "invalid", trigger: "validation error is present", visual_behavior: "Show error message and semantic danger token.", token_refs: [`${slugify(component)}.invalid.border`, "color.status.danger"], accessibility_behavior: "Associate the error message with the invalid control." });
  }
  return base;
}

function componentEvents(component: string): ComponentContract["event_contract"] {
  if (["Button", "IconButton"].includes(component)) {
    return [{ event: "onClick", payload: "{ actionId: string }", required: component === "IconButton", description: "Invoked only for actions declared by the screen spec." }];
  }
  if (["Input", "Textarea", "Select"].includes(component)) {
    return [
      { event: "onChange", payload: "{ name: string; value: string }", required: true, description: "Controlled value update." },
      { event: "onBlur", payload: "{ name: string; value: string }", required: false, description: "Validation timing hook." }
    ];
  }
  if (["Checkbox", "Radio", "Switch"].includes(component)) {
    return [{ event: "onChange", payload: "{ name: string; checked: boolean }", required: true, description: "Controlled checked update." }];
  }
  if (component === "DataTable") {
    return [
      { event: "onSort", payload: "{ key: string; direction: 'asc' | 'desc' }", required: false, description: "Sort event declared by the screen spec." },
      { event: "onRowAction", payload: "{ rowId: string; actionId: string }", required: false, description: "Row action event declared by the screen spec." }
    ];
  }
  return [];
}

function componentDataContract(component: string): Record<string, unknown> {
  if (component === "DataTable") {
    return {
      kind: "record_collection",
      required_fields: ["id"],
      source: "screen.data_needs and data-contracts.json",
      empty_behavior: "Render empty or filtered_empty state instead of invented rows."
    };
  }
  if (component === "MetricGrid") {
    return {
      kind: "metric_collection",
      required_fields: ["label", "value", "status"],
      source: "screen.data_needs and fixture-data.json",
      fallback: "Provide table or text equivalent when a chart-like metric appears."
    };
  }
  return {
    kind: "presentational",
    source: "screen spec, state contract, or pattern contract",
    fallback: "Report a design-system gap when required data is not declared."
  };
}

function buildComponentContract(component: string, profile: DomainProfile, experience: ExperienceArtifacts): ComponentContract {
  const tokenKey = slugify(component);
  const usedOnScreens = experience.screenSpecs
    .filter((screen) => screen.required_components.includes(component))
    .map((screen) => screen.screen_id);
  const variants = componentVariants(component);
  return {
    name: component,
    category: componentCategory(component),
    import_path: `components/${component}`,
    determinism_level: "strict",
    purpose: `${component} exists to support ${profile.category} screens without downstream component invention.`,
    used_on_screens: usedOnScreens,
    prop_contract: componentProps(component),
    slot_contract: componentSlots(component),
    variant_contract: variants.map((variant) => ({
      variant,
      use_when: variant === "default" ? "Use for neutral presentation." : `Use only when the screen or state contract calls for ${variant} intent.`,
      token_refs: [`${tokenKey}.${variant}.background`, `${tokenKey}.${variant}.text`, `${tokenKey}.${variant}.border`]
    })),
    state_contract: componentStates(component),
    event_contract: componentEvents(component),
    token_contract: {
      component_token_key: tokenKey,
      required_tokens: [`${tokenKey}.default.background`, `${tokenKey}.default.text`, `${tokenKey}.default.border`],
      forbidden_tokens: ["hardcoded_hex", "inline_style_override", "unregistered_spacing"]
    },
    accessibility_contract: [
      "Interactive components require accessible names.",
      "Focus states must be visible and tokenized.",
      "Status, risk, and validation states must not rely on color alone.",
      "State changes that affect task completion must be announced politely or move focus intentionally."
    ],
    composition_contract: [
      "Compose components only through declared slots.",
      "Use product-specific patterns before creating new composites.",
      "Do not encode domain business rules inside primitive components.",
      "Do not add props that are absent from this contract without revising the package."
    ],
    data_contract: componentDataContract(component),
    test_contract: {
      selector: `data-archetype-component="${tokenKey}"`,
      required_tests: ["renders_default", "renders_focus_visible_when_interactive", "rejects_undeclared_variant", "uses_declared_tokens"]
    },
    forbidden_usage: [
      "Do not hardcode color, spacing, radius, or typography values.",
      "Do not add undeclared variants or states.",
      "Do not infer backend data shape from visual appearance.",
      "Do not copy visual reference details beyond abstract evidence."
    ],
    evidence_refs: ["decision_compiler_order"]
  };
}

function buildComponentContracts(components: string[], profile: DomainProfile, experience: ExperienceArtifacts): Record<string, unknown> {
  const contracts = components.map((component) => buildComponentContract(component, profile, experience));
  const blockers = contracts
    .filter((contract) => contract.prop_contract.length === 0 || contract.slot_contract.length === 0 || contract.state_contract.length === 0 || contract.variant_contract.length === 0)
    .map((contract) => `${contract.name}: missing prop, slot, state, or variant contract.`);

  return {
    contract_version: "1.0",
    component_count: contracts.length,
    contracts,
    coverage: {
      components_with_props: contracts.filter((contract) => contract.prop_contract.length > 0).length,
      components_with_slots: contracts.filter((contract) => contract.slot_contract.length > 0).length,
      components_with_states: contracts.filter((contract) => contract.state_contract.length > 0).length,
      components_with_tokens: contracts.filter((contract) => contract.token_contract.required_tokens.length > 0).length,
      components_used_on_screens: contracts.filter((contract) => contract.used_on_screens.length > 0).length
    },
    blockers,
    warnings: ["Component contracts are deterministic generated contracts and should be reviewed before binding to a specific frontend component library."],
    evidence_refs: ["decision_compiler_order", "inference_domain_profile"]
  };
}

function componentContractsMarkdown(componentContracts: Record<string, unknown>): string {
  const contracts = (componentContracts.contracts as ComponentContract[] | undefined) ?? [];
  return [
    "# Component Contracts",
    "",
    `Components: ${contracts.length}`,
    "",
    ...contracts.map((contract) => [
      `## ${contract.name}`,
      "",
      `Category: ${contract.category}`,
      `Import path: ${contract.import_path}`,
      `Used on screens: ${contract.used_on_screens.length > 0 ? contract.used_on_screens.join(", ") : "none"}`,
      `Variants: ${contract.variant_contract.map((variant) => variant.variant).join(", ")}`,
      `States: ${contract.state_contract.map((state) => state.state).join(", ")}`,
      "",
      "Required props:",
      contract.prop_contract.filter((prop) => prop.required).length > 0
        ? contract.prop_contract.filter((prop) => prop.required).map((prop) => `- ${prop.name}: ${prop.type}`).join("\n")
        : "- None.",
      "",
      "Forbidden:",
      contract.forbidden_usage.map((item) => `- ${item}`).join("\n")
    ].join("\n")),
    "",
    "## Blockers",
    "",
    ((componentContracts.blockers as string[] | undefined) ?? []).length > 0 ? ((componentContracts.blockers as string[]) ?? []).map((blocker) => `- ${blocker}`).join("\n") : "None."
  ].join("\n\n");
}

interface PatternContract {
  name: string;
  category: "product-specific";
  purpose: string;
  used_on_screens: string[];
  workflow_refs: string[];
  component_refs: string[];
  component_contract_refs: Record<string, string>;
  variant_contract: Array<{
    variant: string;
    use_when: string;
    component_states: string[];
  }>;
  state_contract: Array<{
    state: string;
    trigger: string;
    required_components: string[];
    behavior: string;
    recovery_action?: string;
  }>;
  interaction_contract: Array<{
    interaction: string;
    trigger: string;
    result: string;
    allowed_when: string;
  }>;
  data_contract: {
    entity_refs: string[];
    required_fields: string[];
    empty_behavior: string;
  };
  responsive_contract: Record<string, string>;
  accessibility_contract: string[];
  acceptance_contract: string[];
  forbidden_usage: string[];
  evidence_refs: string[];
}

function patternComponents(pattern: string): string[] {
  if (pattern.includes("Table") || pattern.includes("Row")) return ["DataTable", "Badge", "Button"];
  if (pattern.includes("Filter")) return ["Select", "Button"];
  if (pattern.includes("Status") || pattern.includes("Badge")) return ["Badge", "Tooltip"];
  if (pattern.includes("Alert") || pattern.includes("Exception")) return ["Alert", "Button"];
  if (pattern.includes("Chart") || pattern.includes("Map")) return ["Card", "MetricGrid", "Button"];
  if (pattern.includes("Prompt")) return ["Modal", "Button", "Alert"];
  return ["Card", "Badge", "Button"];
}

function patternVariants(pattern: string): string[] {
  if (pattern.includes("Status") || pattern.includes("Badge") || pattern.includes("Alert") || pattern.includes("Risk") || pattern.includes("Exception")) {
    return ["neutral", "success", "warning", "danger"];
  }
  if (pattern.includes("Filter")) return ["default", "compact"];
  if (pattern.includes("Chart") || pattern.includes("Map")) return ["default", "empty", "loading"];
  return ["default", "dense", "summary"];
}

function patternEntities(pattern: string, profile: DomainProfile, screenIds: string[], experience: ExperienceArtifacts): string[] {
  const lower = pattern.toLowerCase();
  const direct = profile.entities.filter((entity) => lower.includes(entity.toLowerCase().replace(/s$/, "")));
  if (direct.length > 0) return direct;
  const fromScreens = experience.screenSpecs
    .filter((screen) => screenIds.includes(screen.screen_id))
    .flatMap((screen) => screen.data_needs);
  return [...new Set(fromScreens.length > 0 ? fromScreens : profile.entities.slice(0, 2))];
}

function workflowsForPattern(pattern: string, screenIds: string[], profile: DomainProfile, experience: ExperienceArtifacts): string[] {
  const lower = pattern.toLowerCase();
  const direct = profile.workflows.filter((workflow) => workflow.split(/[_-]/).some((token) => token.length > 2 && lower.includes(token.replace(/s$/, ""))));
  if (direct.length > 0) return direct;
  const flows = ((experience.flowSpecs as { flows?: Array<{ flow_id?: string; screen_refs?: string[] }> }).flows ?? []);
  return [...new Set(flows.filter((flow) => (flow.screen_refs ?? []).some((screenId) => screenIds.includes(screenId))).map((flow) => flow.flow_id ?? "workflow"))];
}

function buildPatternContract(pattern: string, profile: DomainProfile, experience: ExperienceArtifacts): PatternContract {
  const usedOnScreens = experience.screenSpecs
    .filter((screen) => screen.required_patterns.includes(pattern))
    .map((screen) => screen.screen_id);
  const components = patternComponents(pattern);
  const entityRefs = patternEntities(pattern, profile, usedOnScreens, experience);
  const workflowRefs = workflowsForPattern(pattern, usedOnScreens, profile, experience);
  return {
    name: pattern,
    category: "product-specific",
    purpose: `${pattern} implements a recurring ${profile.category} workflow need and must be reused instead of rebuilt per screen.`,
    used_on_screens: usedOnScreens,
    workflow_refs: workflowRefs,
    component_refs: components,
    component_contract_refs: Object.fromEntries(components.map((component) => [component, `04-design-system/components/component-contracts.json#${component}`])),
    variant_contract: patternVariants(pattern).map((variant) => ({
      variant,
      use_when: variant === "default" ? "Use for the normal product workflow state." : `Use only when data, screen state, or domain status calls for ${variant}.`,
      component_states: variant === "loading" ? ["loading"] : variant === "empty" ? ["empty"] : ["default", "focus"]
    })),
    state_contract: [
      {
        state: "default",
        trigger: "required data is available",
        required_components: components,
        behavior: "Render declared data and interactions using only component contracts."
      },
      {
        state: "loading",
        trigger: "pattern data or parent screen data is pending",
        required_components: components.includes("DataTable") ? ["Skeleton", "DataTable"] : ["Skeleton", ...components.filter((component) => component !== "Button")],
        behavior: "Preserve layout stability and avoid fabricated content."
      },
      {
        state: "empty",
        trigger: "pattern data resolves with no relevant records",
        required_components: ["EmptyState", ...components.filter((component) => component === "Button")],
        behavior: "Explain what is missing and surface the next approved action.",
        recovery_action: "Use the state contract recovery action from the parent screen."
      },
      {
        state: "error",
        trigger: "pattern data or interaction fails",
        required_components: ["Alert", "Button"],
        behavior: "Show recovery-oriented error feedback without hiding safe surrounding content.",
        recovery_action: "Retry or follow the parent screen recovery action."
      }
    ],
    interaction_contract: [
      { interaction: "view_detail", trigger: "user selects a row, card, or status item", result: "navigate only to routes in route-map.json", allowed_when: "route exists and user has permission" },
      { interaction: "filter", trigger: "user changes filter criteria", result: "update visible records and support filtered_empty state", allowed_when: "pattern exposes filter controls" },
      { interaction: "retry", trigger: "user activates recovery action", result: "retry the failed pattern or parent screen data request", allowed_when: "pattern is in error, partial_data, stale_data, or offline state" }
    ],
    data_contract: {
      entity_refs: entityRefs,
      required_fields: ["id", "label", "status", "updatedAt"],
      empty_behavior: "Render empty or filtered_empty state. Do not invent rows, metrics, statuses, or chart points."
    },
    responsive_contract: {
      desktop: "Use the full declared composition with compact scanning density.",
      tablet: "Preserve hierarchy and stack secondary controls below primary content.",
      mobile: "Use single-column pattern layout and expose table/card fallback where dense data would overflow."
    },
    accessibility_contract: [
      "Pattern must preserve keyboard access to every interaction.",
      "Status and risk must include text labels.",
      "Errors and recovery actions must be announced or focused according to parent screen state.",
      "Chart, map, and metric patterns require text or table fallback."
    ],
    acceptance_contract: [
      "Pattern appears only on screens listed in used_on_screens.",
      "Pattern uses only component_refs and their component contracts.",
      "Pattern renders default, loading, empty, and error states.",
      "Pattern data maps to data_contract entity refs or reports a gap."
    ],
    forbidden_usage: [
      "Do not create a pattern variant outside variant_contract.",
      "Do not add new components outside component_refs without revising component contracts.",
      "Do not use pattern visuals as permission to invent backend data.",
      "Do not copy reference screenshots beyond abstract structure."
    ],
    evidence_refs: ["inference_domain_profile"]
  };
}

function buildPatternContracts(profile: DomainProfile, experience: ExperienceArtifacts): Record<string, unknown> {
  const contracts = profile.patterns.map((pattern) => buildPatternContract(pattern, profile, experience));
  const blockers = contracts
    .filter((contract) =>
      contract.component_refs.length === 0 ||
      contract.used_on_screens.length === 0 ||
      contract.workflow_refs.length === 0 ||
      contract.state_contract.length === 0 ||
      contract.variant_contract.length === 0
    )
    .map((contract) => `${contract.name}: missing screen usage, workflow refs, components, variants, or states.`);

  return {
    contract_version: "1.0",
    pattern_count: contracts.length,
    contracts,
    coverage: {
      patterns_with_screen_usage: contracts.filter((contract) => contract.used_on_screens.length > 0).length,
      patterns_with_workflow_refs: contracts.filter((contract) => contract.workflow_refs.length > 0).length,
      patterns_with_components: contracts.filter((contract) => contract.component_refs.length > 0).length,
      patterns_with_states: contracts.filter((contract) => contract.state_contract.length > 0).length,
      patterns_with_data: contracts.filter((contract) => contract.data_contract.entity_refs.length > 0).length
    },
    blockers,
    warnings: ["Pattern contracts are generated from inferred workflows and should be reviewed for domain-specific edge behavior."],
    evidence_refs: ["inference_domain_profile", "decision_compiler_order"]
  };
}

function patternContractsMarkdown(patternContracts: Record<string, unknown>): string {
  const contracts = (patternContracts.contracts as PatternContract[] | undefined) ?? [];
  return [
    "# Pattern Contracts",
    "",
    `Patterns: ${contracts.length}`,
    "",
    ...contracts.map((contract) => [
      `## ${contract.name}`,
      "",
      `Purpose: ${contract.purpose}`,
      `Used on screens: ${contract.used_on_screens.join(", ") || "none"}`,
      `Workflows: ${contract.workflow_refs.join(", ") || "none"}`,
      `Components: ${contract.component_refs.join(", ")}`,
      `Variants: ${contract.variant_contract.map((variant) => variant.variant).join(", ")}`,
      `States: ${contract.state_contract.map((state) => state.state).join(", ")}`,
      "",
      "Acceptance:",
      contract.acceptance_contract.map((item) => `- ${item}`).join("\n")
    ].join("\n")),
    "",
    "## Blockers",
    "",
    ((patternContracts.blockers as string[] | undefined) ?? []).length > 0 ? ((patternContracts.blockers as string[]) ?? []).map((blocker) => `- ${blocker}`).join("\n") : "None."
  ].join("\n\n");
}

export function buildDesignSystemArtifacts(
  input: ArchetypeInput,
  profile: DomainProfile,
  experience: ExperienceArtifacts
): DesignSystemArtifacts {
  const primary = input.brand?.primaryColor ?? "#2563EB";
  const components = [
    ...new Set([
    "Button",
    "IconButton",
    "Input",
    "Textarea",
    "Select",
    "Checkbox",
    "Radio",
    "Switch",
    "Badge",
    "Card",
    "Modal",
    "Toast",
    "Alert",
    "Tooltip",
    "Tabs",
    "DataTable",
    "PageHeader",
    "Sidebar",
    "TopNav",
    "EmptyState",
    "Skeleton",
    "PermissionNotice",
    "MetricGrid",
    "FormField",
    "DashboardShell",
    "DetailShell",
    "SettingsShell",
    "DetailHeader",
    ...experience.screenSpecs.flatMap((screen) => screen.required_components)
    ])
  ];

  const usedScreensByComponent = (component: string): string[] =>
    experience.screenSpecs
      .filter((screen) => screen.required_components.includes(component))
      .map((screen) => screen.screen_id);

  const componentContracts = buildComponentContracts(components, profile, experience);
  const contractByName = new Map(((componentContracts.contracts as ComponentContract[] | undefined) ?? []).map((contract) => [contract.name, contract]));

  const componentRegistry = {
    components: components.map((component) => {
      const contract = contractByName.get(component);
      return {
        name: component,
        category: contract?.category ?? componentCategory(component),
        purpose: `${component} supports implementation-ready ${profile.category} workflows.`,
        determinism_level: "strict",
        contract_ref: `04-design-system/components/component-contracts.json#${component}`,
        variants: contract?.variant_contract.map((variant) => variant.variant) ?? componentVariants(component),
        states: contract?.state_contract.map((state) => state.state) ?? ["default", "focus", "disabled"],
        props: Object.fromEntries((contract?.prop_contract ?? componentProps(component)).map((prop) => [prop.name, prop.type])),
        required_props: (contract?.prop_contract ?? componentProps(component)).filter((prop) => prop.required).map((prop) => prop.name),
        events: contract?.event_contract.map((event) => event.event) ?? [],
        slots: contract?.slot_contract.map((slot) => slot.name) ?? ["content"],
        composition_rules: contract?.composition_contract ?? ["Use only generated tokens.", "Do not encode product-specific business logic in primitives."],
        accessibility_rules: contract?.accessibility_contract ?? ["Must expose accessible name when interactive.", "Must show visible focus state."],
        token_dependencies: contract?.token_contract.required_tokens ?? [`${slugify(component)}.default.background`, `${slugify(component)}.default.text`],
        test_selector: contract?.test_contract.selector ?? `data-archetype-component="${slugify(component)}"`,
        used_on_screens: usedScreensByComponent(component),
        forbidden_usage: contract?.forbidden_usage ?? ["Do not override spacing, color, or radius with hardcoded values."],
        evidence_refs: ["decision_compiler_order"]
      };
    })
  };

  const patternContracts = buildPatternContracts(profile, experience);
  const contractByPattern = new Map(((patternContracts.contracts as PatternContract[] | undefined) ?? []).map((contract) => [contract.name, contract]));
  const patternRegistry = {
    patterns: profile.patterns.map((pattern) => {
      const contract = contractByPattern.get(pattern);
      return {
        name: pattern,
        category: "product-specific",
        purpose: `${pattern} exists because ${profile.productType} workflows need a reusable product-level UI pattern.`,
        determinism_level: "strict",
        contract_ref: `04-design-system/patterns/pattern-contracts.json#${pattern}`,
        composed_of: contract?.component_refs ?? patternComponents(pattern),
        component_contract_refs: contract?.component_contract_refs ?? {},
        variants: contract?.variant_contract.map((variant) => variant.variant) ?? patternVariants(pattern),
        states: contract?.state_contract.map((state) => state.state) ?? ["default", "loading", "empty", "error"],
        data_requirements: contract?.data_contract.required_fields ?? ["label", "value", "status", "timestamp"],
        entity_refs: contract?.data_contract.entity_refs ?? [],
        interactions: contract?.interaction_contract.map((interaction) => interaction.interaction) ?? ["view_detail", "filter", "retry"],
        accessibility_rules: contract?.accessibility_contract ?? ["Status must include text labels.", "Trend and risk cannot rely on color alone."],
        used_on_screens: contract?.used_on_screens ?? experience.screenSpecs
          .filter((screen) => screen.required_patterns.includes(pattern))
          .map((screen) => screen.screen_id),
        workflow_refs: contract?.workflow_refs ?? [],
        evidence_refs: ["inference_domain_profile"]
      };
    })
  };

  const primitiveTokens = {
    color: {
      "blue.600": jsonToken(primary),
      "gray.950": jsonToken("#030712"),
      "gray.700": jsonToken("#374151"),
      "gray.200": jsonToken("#E5E7EB"),
      "gray.50": jsonToken("#F9FAFB"),
      "green.600": jsonToken("#16A34A"),
      "amber.500": jsonToken("#F59E0B"),
      "red.600": jsonToken("#DC2626"),
      "white": jsonToken("#FFFFFF")
    },
    spacing: {
      "1": jsonToken("0.25rem"),
      "2": jsonToken("0.5rem"),
      "3": jsonToken("0.75rem"),
      "4": jsonToken("1rem"),
      "6": jsonToken("1.5rem"),
      "8": jsonToken("2rem")
    },
    radius: {
      "sm": jsonToken("0.25rem"),
      "md": jsonToken("0.375rem"),
      "lg": jsonToken("0.5rem")
    },
    font: {
      "sans": jsonToken("system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"),
      "mono": jsonToken("'SFMono-Regular', Consolas, 'Liberation Mono', monospace")
    },
    fontSize: {
      "12": jsonToken("0.75rem"),
      "13": jsonToken("0.8125rem"),
      "14": jsonToken("0.875rem"),
      "16": jsonToken("1rem"),
      "20": jsonToken("1.25rem"),
      "24": jsonToken("1.5rem")
    },
    lineHeight: {
      "16": jsonToken("1rem"),
      "20": jsonToken("1.25rem"),
      "22": jsonToken("1.375rem"),
      "24": jsonToken("1.5rem"),
      "28": jsonToken("1.75rem"),
      "32": jsonToken("2rem")
    },
    fontWeight: {
      "regular": jsonToken("400"),
      "medium": jsonToken("500"),
      "semibold": jsonToken("650"),
      "bold": jsonToken("700")
    }
  };

  const semanticTokens = {
    color: {
      "action.primary.background": "{color.blue.600}",
      "text.primary": "{color.gray.950}",
      "text.secondary": "{color.gray.700}",
      "surface.default": "{color.white}",
      "surface.subtle": "{color.gray.50}",
      "border.default": "{color.gray.200}",
      "status.success": "{color.green.600}",
      "status.warning": "{color.amber.500}",
      "status.danger": "{color.red.600}"
    },
    spacing: {
      "layout.gap": "{spacing.4}",
      "section.gap": "{spacing.6}",
      "control.padding": "{spacing.3}"
    },
    radius: {
      "control": "{radius.md}",
      "surface": "{radius.lg}"
    },
    typography: {
      "display.sm": "{fontSize.24}/{lineHeight.32}/{fontWeight.bold}",
      "heading.lg": "{fontSize.20}/{lineHeight.28}/{fontWeight.bold}",
      "heading.md": "{fontSize.16}/{lineHeight.24}/{fontWeight.semibold}",
      "body.md": "{fontSize.14}/{lineHeight.22}/{fontWeight.regular}",
      "body.sm": "{fontSize.13}/{lineHeight.20}/{fontWeight.regular}",
      "label.sm": "{fontSize.12}/{lineHeight.16}/{fontWeight.semibold}",
      "code.sm": "{fontSize.13}/{lineHeight.20}/{fontWeight.medium}"
    }
  };

  const componentTokens: Record<string, unknown> = Object.fromEntries(
    components.map((component) => [
      slugify(component),
      {
        "default.background": "{color.surface.default}",
        "default.text": "{color.text.primary}",
        "default.border": "{color.border.default}"
      }
    ])
  );
  for (const contract of (componentContracts.contracts as ComponentContract[] | undefined) ?? []) {
    const tokenKey = contract.token_contract.component_token_key;
    const tokenSet = componentTokens[tokenKey] as Record<string, unknown>;
    for (const variant of contract.variant_contract) {
      tokenSet[`${variant.variant}.background`] = variant.variant === "primary" ? "{color.action.primary.background}" : "{color.surface.default}";
      tokenSet[`${variant.variant}.text`] = variant.variant === "danger" ? "{color.status.danger}" : "{color.text.primary}";
      tokenSet[`${variant.variant}.border`] = variant.variant === "danger" ? "{color.status.danger}" : "{color.border.default}";
    }
    for (const state of contract.state_contract) {
      if (state.state === "focus") tokenSet["focus.ring"] = "{color.action.primary.background}";
      if (state.state === "hover") tokenSet["hover.background"] = "{color.surface.subtle}";
      if (state.state === "disabled") {
        tokenSet["disabled.background"] = "{color.surface.subtle}";
        tokenSet["disabled.text"] = "{color.text.secondary}";
      }
      if (state.state === "loading") tokenSet["loading.background"] = "{color.surface.subtle}";
      if (state.state === "invalid") tokenSet["invalid.border"] = "{color.status.danger}";
    }
  }
  componentTokens.button = {
    ...(componentTokens.button as Record<string, unknown>),
    "primary.background": "{color.action.primary.background}",
    "default.padding": "{spacing.control.padding}",
    "default.radius": "{radius.control}"
  };
  componentTokens.card = {
    ...(componentTokens.card as Record<string, unknown>),
    "default.radius": "{radius.surface}",
    "default.gap": "{spacing.section.gap}"
  };
  componentTokens.badge = {
    ...(componentTokens.badge as Record<string, unknown>),
    "default.text": "{color.text.secondary}",
    "success.text": "{color.status.success}",
    "warning.text": "{color.status.warning}",
    "danger.text": "{color.status.danger}"
  };
  componentTokens[slugify("DashboardShell")] = {
    ...(componentTokens[slugify("DashboardShell")] as Record<string, unknown>),
    "default.gap": "{spacing.layout.gap}"
  };
  const typographySystem = buildTypographySystem();
  const typographyCss = buildTypographyCss(typographySystem);
  const tokenContracts = buildTokenContracts(primitiveTokens, semanticTokens, componentTokens, typographySystem);

  return {
    designPrinciples: [
      "# Design Principles",
      "",
      "1. Clarity before decoration.",
      "2. Product workflows determine reusable patterns.",
      "3. Dense layouts are acceptable only when hierarchy remains clear.",
      "4. Risk and status must never rely on color alone.",
      "5. Components must be reusable across dashboard, list, detail, form, and reporting workflows."
    ].join("\n"),
    visualDirection: `# Visual Direction\n\n${profile.visualDirection}\n\nBrand tone: ${input.brand?.tone ?? "Clear, precise, and low-hype."}`,
    contentRules: [
      "# Content Rules",
      "",
      "- Use specific labels for actions and statuses.",
      "- Empty states must explain what is missing and offer the next useful action.",
      "- Errors must include what happened, recovery action, and support path when relevant.",
      "- Financial, clinical, safety, or risk language must be explicit and reviewable."
    ].join("\n"),
    primitiveTokens,
    semanticTokens,
    componentTokens,
    tokenContracts,
    typographySystem,
    themeLight: {
      name: "light",
      tokens: {
        background: "{color.surface.subtle}",
        surface: "{color.surface.default}",
        text: "{color.text.primary}",
        accent: "{color.action.primary.background}",
        typography: {
          displaySm: "{typography.display.sm}",
          headingLg: "{typography.heading.lg}",
          headingMd: "{typography.heading.md}",
          bodyMd: "{typography.body.md}",
          bodySm: "{typography.body.sm}",
          labelSm: "{typography.label.sm}",
          codeSm: "{typography.code.sm}"
        }
      }
    },
    cssVariables: [
      ":root {",
      `  --color-action-primary-background: ${primary};`,
      "  --color-text-primary: #030712;",
      "  --color-text-secondary: #374151;",
      "  --color-surface-default: #ffffff;",
      "  --color-surface-subtle: #f9fafb;",
      "  --color-border-default: #e5e7eb;",
      "  --radius-surface: 0.5rem;",
      "  --radius-control: 0.375rem;",
      "  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
      "  --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;",
      "}"
    ].join("\n"),
    typographyCss,
    tailwindConfig: [
      "import type { Config } from 'tailwindcss';",
      "",
      "const config: Config = {",
      "  theme: {",
      "    extend: {",
      "      colors: {",
      "        action: 'var(--color-action-primary-background)',",
      "        surface: 'var(--color-surface-default)',",
      "        subtle: 'var(--color-surface-subtle)'",
      "      },",
      "      fontFamily: {",
      "        sans: 'var(--font-sans)',",
      "        mono: 'var(--font-mono)'",
      "      },",
      "      fontSize: {",
      "        'body-md': ['var(--type-body-md-font-size)', { lineHeight: 'var(--type-body-md-line-height)' }],",
      "        'body-sm': ['var(--type-body-sm-font-size)', { lineHeight: 'var(--type-body-sm-line-height)' }],",
      "        'heading-lg': ['var(--type-heading-lg-font-size)', { lineHeight: 'var(--type-heading-lg-line-height)' }]",
      "      }",
      "    }",
      "  }",
      "};",
      "",
      "export default config;"
    ].join("\n"),
    componentContracts,
    componentContractsReport: componentContractsMarkdown(componentContracts),
    componentRegistry,
    componentSpecs: [
      "# Component Specs",
      "",
      ...((componentContracts.contracts as ComponentContract[] | undefined) ?? []).map((contract) => [
        `## ${contract.name}`,
        "",
        `Purpose: ${contract.purpose}`,
        `Category: ${contract.category}`,
        `Import: ${contract.import_path}`,
        `Required props: ${contract.prop_contract.filter((prop) => prop.required).map((prop) => prop.name).join(", ") || "none"}`,
        `Variants: ${contract.variant_contract.map((variant) => variant.variant).join(", ")}`,
        `States: ${contract.state_contract.map((state) => state.state).join(", ")}`,
        `Test selector: ${contract.test_contract.selector}`
      ].join("\n"))
    ].join("\n\n"),
    componentApiContract: [
      "# Component API Contract",
      "",
      "- Components must implement the structured contracts in `component-contracts.json`.",
      "- Components expose only declared props, slots, variants, states, and events.",
      "- Components include visible focus states through tokenized state contracts.",
      "- Components use generated tokens only.",
      "- Icon-only buttons require accessible labels.",
      "- Product-specific business behavior belongs in patterns, not primitives.",
      "- Missing contract requirements are build blockers, not permission to invent APIs."
    ].join("\n"),
    patternContracts,
    patternContractsReport: patternContractsMarkdown(patternContracts),
    patternRegistry,
    patternSpecs: [
      "# Pattern Specs",
      "",
      ...((patternContracts.contracts as PatternContract[] | undefined) ?? []).map((contract) => [
        `## ${contract.name}`,
        "",
        `Purpose: ${contract.purpose}`,
        `Screens: ${contract.used_on_screens.join(", ")}`,
        `Workflows: ${contract.workflow_refs.join(", ")}`,
        `Components: ${contract.component_refs.join(", ")}`,
        `States: ${contract.state_contract.map((state) => state.state).join(", ")}`,
        `Data entities: ${contract.data_contract.entity_refs.join(", ")}`
      ].join("\n"))
    ].join("\n\n"),
    patternLifecycle: [
      "# Pattern Lifecycle",
      "",
      "- Create a pattern when a workflow or P0 screen needs reusable product-specific UI.",
      "- Keep pattern evidence refs linked to screens and jobs.",
      "- Implement patterns from `pattern-contracts.json` before screen-specific composition.",
      "- Deprecate patterns only with migration notes and replacement guidance."
    ].join("\n"),
    accessibilityRules: {
      target: "WCAG AA",
      checks: ["text_contrast", "visible_focus", "keyboard_navigation", "form_labels", "error_messages", "reduced_motion", "chart_fallback", "color_not_sole_indicator"],
      blockers: ["missing_keyboard_path", "missing_focus_state", "status_color_only", "critical_chart_without_fallback"]
    },
    accessibilityGuidelines: [
      "# Accessibility Guidelines",
      "",
      "- All interactive controls require visible focus.",
      "- Status and risk require text labels.",
      "- Charts require table or textual fallback.",
      "- Dialogs must manage focus.",
      "- Forms must have labels and recovery-oriented errors."
    ].join("\n"),
    foundations: [
      "# Foundations",
      "",
      `Product type: ${profile.productType}`,
      `Visual direction: ${profile.visualDirection}`,
      "Accessibility target: WCAG AA"
    ].join("\n"),
    usageGuidelines: [
      "# Usage Guidelines",
      "",
      "- Build screens from screen specs.",
      "- Use product-specific patterns before inventing new composites.",
      "- Use tokens, not hardcoded styles.",
      "- Report design-system gaps instead of improvising."
    ].join("\n"),
    antiPatterns: [
      "# Anti-Patterns",
      "",
      "- UI-kit-first generation.",
      "- Unsupported certainty.",
      "- Token bloat.",
      "- Component sprawl.",
      "- Reference copying.",
      "- Hidden assumptions.",
      "- Frontend improvisation."
    ].join("\n"),
    migrationNotes: [
      "# Migration Notes",
      "",
      "No existing codebase migration was requested for this generation. Future codebase audits should map current components, tokens, and screens to the generated architecture."
    ].join("\n")
  };
}
