import type { DesignSystemArtifacts, ExperienceArtifacts, ReferenceSurfaceArtifacts } from "../core/types";

function componentsFor(experience: ExperienceArtifacts, predicate: (screenId: string) => boolean): string[] {
  return [
    ...new Set(
      experience.screenSpecs
        .filter((screen) => predicate(screen.screen_id))
        .flatMap((screen) => screen.required_components)
    )
  ];
}

export function buildReferenceSurfaceArtifacts(
  experience: ExperienceArtifacts,
  designSystem: DesignSystemArtifacts
): ReferenceSurfaceArtifacts {
  const dashboardComponents = componentsFor(experience, (screenId) => screenId.includes("dashboard") || screenId.includes("overview"));
  const tableScreens = experience.screenSpecs.filter((screen) => screen.required_components.includes("DataTable"));
  const formScreens = experience.screenSpecs.filter((screen) => screen.required_components.includes("FormField") || screen.actions.some((action) => action.type === "update"));
  const chartScreens = experience.screenSpecs.filter((screen) => Boolean(screen.accessibility.chart_fallback_table));

  return {
    dashboard: [
      "# Reference Dashboard",
      "",
      "Purpose: Provide a canonical composition for overview screens.",
      "",
      "Required composition:",
      ...dashboardComponents.map((component) => `- ${component}`),
      "",
      "Rules:",
      "- Use medium-high density with clear hierarchy.",
      "- Keep primary status and risk visible above the fold on desktop.",
      "- Use generated tokens only.",
      "- Preserve loading, empty, error, permission, partial, and stale data states when relevant."
    ].join("\n"),
    table: [
      "# Reference Table",
      "",
      "Purpose: Provide a canonical table-first surface for scan-heavy records.",
      "",
      "Screens:",
      ...tableScreens.map((screen) => `- ${screen.screen_id} (${screen.route})`),
      "",
      "Rules:",
      "- Include column headers, row actions, status labels, and keyboard focus.",
      "- Provide filtered-empty state separately from true empty state.",
      "- Mobile must use horizontal overflow only when a card fallback is not viable."
    ].join("\n"),
    form: [
      "# Reference Form",
      "",
      "Purpose: Provide canonical form behavior and layout.",
      "",
      "Screens:",
      ...formScreens.map((screen) => `- ${screen.screen_id} (${screen.route})`),
      "",
      "Rules:",
      "- Every field needs a label.",
      "- Validate on blur and submit unless the screen spec overrides it.",
      "- Preserve dirty state and submission feedback.",
      "- Place field errors near fields and summarize form-level blockers."
    ].join("\n"),
    mobile: [
      "# Reference Mobile",
      "",
      "Purpose: Define responsive transformation rules for generated screens.",
      "",
      "Rules:",
      "- Use a single-column stack below mobile breakpoint.",
      "- Keep primary actions reachable.",
      "- Convert dense supporting panels into ordered sections.",
      "- Preserve focus order and readable text sizes.",
      "- Avoid viewport-width font scaling."
    ].join("\n"),
    chart: [
      "# Reference Chart",
      "",
      "Purpose: Define accessible chart behavior.",
      "",
      "Screens:",
      ...chartScreens.map((screen) => `- ${screen.screen_id} (${screen.route})`),
      "",
      "Rules:",
      "- Charts require a table or textual fallback.",
      "- Color cannot be the only distinction between series or statuses.",
      "- Legends and axis labels must be readable.",
      "- Use semantic status tokens from the design system.",
      "",
      "Relevant accessibility rules:",
      JSON.stringify(designSystem.accessibilityRules, null, 2)
    ].join("\n")
  };
}
