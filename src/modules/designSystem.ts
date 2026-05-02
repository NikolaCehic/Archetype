import type { ArchetypeInput, DesignSystemArtifacts, DomainProfile, ExperienceArtifacts } from "../core/types";
import { slugify } from "../core/stable";

function jsonToken(value: string): Record<string, string> {
  return { value };
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

  const componentRegistry = {
    components: components.map((component) => ({
      name: component,
      category: ["Button", "Input", "Badge", "Skeleton"].includes(component) ? "primitive" : "composite",
      purpose: `${component} supports implementation-ready ${profile.category} workflows.`,
      variants: component === "Button" ? ["primary", "secondary", "ghost", "danger"] : ["default"],
      states: ["default", "hover", "focus", "active", "disabled", "loading"],
      props: {
        variant: component === "Button" ? "primary | secondary | ghost | danger" : "default",
        size: "sm | md | lg",
        disabled: "boolean"
      },
      slots: ["leading", "content", "trailing"],
      composition_rules: ["Use only generated tokens.", "Do not encode product-specific business logic in primitives."],
      accessibility_rules: ["Must expose accessible name when interactive.", "Must show visible focus state."],
      token_dependencies: [`${slugify(component)}.default.background`, `${slugify(component)}.default.text`],
      used_on_screens: usedScreensByComponent(component),
      forbidden_usage: ["Do not override spacing, color, or radius with hardcoded values."],
      evidence_refs: ["decision_compiler_order"]
    }))
  };

  const patternRegistry = {
    patterns: profile.patterns.map((pattern) => ({
      name: pattern,
      category: "product-specific",
      purpose: `${pattern} exists because ${profile.productType} workflows need a reusable product-level UI pattern.`,
      composed_of: pattern.includes("Table") || pattern.includes("Row") ? ["DataTable", "Badge", "Button"] : ["Card", "Badge", "Button"],
      variants: ["neutral", "positive", "warning", "danger"],
      data_requirements: ["label", "value", "status", "timestamp"],
      interactions: ["view_detail", "filter", "retry"],
      accessibility_rules: ["Status must include text labels.", "Trend and risk cannot rely on color alone."],
      used_on_screens: experience.screenSpecs
        .filter((screen) => screen.required_patterns.includes(pattern))
        .map((screen) => screen.screen_id),
      evidence_refs: ["inference_domain_profile"]
    }))
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
  componentTokens.dashboardShell = {
    ...(componentTokens.dashboardShell as Record<string, unknown>),
    "default.gap": "{spacing.layout.gap}"
  };

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
    themeLight: {
      name: "light",
      tokens: {
        background: "{color.surface.subtle}",
        surface: "{color.surface.default}",
        text: "{color.text.primary}",
        accent: "{color.action.primary.background}"
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
      "}"
    ].join("\n"),
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
      "      }",
      "    }",
      "  }",
      "};",
      "",
      "export default config;"
    ].join("\n"),
    componentRegistry,
    componentSpecs: [
      "# Component Specs",
      "",
      ...components.map((component) => `## ${component}\n\nPurpose: ${component} supports the generated product experience and must use tokens only.`)
    ].join("\n\n"),
    componentApiContract: [
      "# Component API Contract",
      "",
      "- Components expose intentional props and slots.",
      "- Components include visible focus states.",
      "- Components use generated tokens only.",
      "- Icon-only buttons require accessible labels.",
      "- Product-specific business behavior belongs in patterns, not primitives."
    ].join("\n"),
    patternRegistry,
    patternSpecs: [
      "# Pattern Specs",
      "",
      ...profile.patterns.map((pattern) => `## ${pattern}\n\nPurpose: Product-specific pattern for ${profile.productType}. Must define data requirements, states, and accessible status labels.`)
    ].join("\n\n"),
    patternLifecycle: [
      "# Pattern Lifecycle",
      "",
      "- Create a pattern when a workflow or P0 screen needs reusable product-specific UI.",
      "- Keep pattern evidence refs linked to screens and jobs.",
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
