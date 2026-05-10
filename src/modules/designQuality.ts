import type { ArchetypeInput, DesignDirectionOption, DesignQualityGateArtifact, DomainProfile, ExperienceArtifacts, IngestionArtifacts } from "../core/types";
import { slugify } from "../core/stable";

type SourceStrength = DesignDirectionOption["source_strength"];

interface DesignSourceProfile {
  productLabel: string;
  productSlug: string;
  primaryUser: string;
  primaryGoal: string;
  workloadLabel: string;
  sourceSignature: string;
  sourceStrength: SourceStrength;
  evidenceRefs: string[];
  materialEvidenceRefs: string[];
  materialAlignment: string[];
  routeScreenAlignment: string[];
  density: DesignDirectionOption["density"];
  paletteHue: number;
  paletteChroma: number;
  physicalScene: string;
}

function mentionsAny(text: string, values: string[]): boolean {
  const normalized = text.toLowerCase();
  return values.some((value) => normalized.includes(value));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function compact(value: string, fallback: string, max = 96): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.length > max ? `${cleaned.slice(0, max - 3)}...` : cleaned;
}

function titleCase(value: string): string {
  const cleaned = value
    .replace(/[_/.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Product";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function hashHue(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return (hash + 23) % 360;
}

function hue(value: number, shift = 0): number {
  return Math.round((value + shift + 360) % 360);
}

function oklch(lightness: number, chroma: number, hueValue: number): string {
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue(hueValue)})`;
}

function paletteFor(profile: DesignSourceProfile, shift: number, intensity: "quiet" | "signal" | "expressive"): DesignDirectionOption["palette"] {
  const h = hue(profile.paletteHue, shift);
  const chroma = intensity === "quiet" ? profile.paletteChroma * 0.45 : intensity === "signal" ? profile.paletteChroma : profile.paletteChroma * 1.35;
  const monochrome = mentionsAny(`${profile.sourceSignature} ${profile.primaryGoal}`, ["monochrome", "black and white", "neutral"]);
  const neutralHue = monochrome ? h : hue(h, -8);
  return {
    background: oklch(0.13, 0.006, neutralHue),
    surface: oklch(0.18, 0.008, neutralHue),
    surface_subtle: oklch(0.24, 0.010, neutralHue),
    text: oklch(0.94, 0.006, neutralHue),
    muted_text: oklch(0.69, 0.012, neutralHue),
    border: oklch(0.34, 0.012, neutralHue),
    accent: oklch(0.78, chroma, h),
    success: oklch(0.72, 0.11, hue(h, 110)),
    warning: oklch(0.78, 0.12, hue(h, 165)),
    danger: oklch(0.68, 0.13, hue(h, 205))
  };
}

function brandHue(input: ArchetypeInput, fallbackSeed: string): number {
  const primary = input.brand?.primaryColor?.trim().toLowerCase();
  if (primary?.startsWith("#") && /^#[0-9a-f]{6}$/u.test(primary)) {
    const r = Number.parseInt(primary.slice(1, 3), 16);
    const g = Number.parseInt(primary.slice(3, 5), 16);
    const b = Number.parseInt(primary.slice(5, 7), 16);
    if (r >= g && r >= b) return 24;
    if (g >= r && g >= b) return 145;
    return 230;
  }
  return hashHue(fallbackSeed);
}

function firstScreenName(experience: ExperienceArtifacts): string {
  const p0 = experience.screenSpecs.find((screen) => screen.priority === "P0") ?? experience.screenSpecs[0];
  return titleCase(p0?.name ?? p0?.screen_id ?? experience.routeMap.routes[0]?.nav_label ?? "Workspace");
}

function routeScreenAlignment(experience: ExperienceArtifacts): string[] {
  return unique([
    ...experience.routeMap.routes.slice(0, 5).map((route) => `${route.route} -> ${route.nav_label ?? route.screen_id}`),
    ...experience.screenSpecs.slice(0, 5).map((screen) => `${screen.name}: ${screen.primary_user_goal}`)
  ]);
}

function materialLabels(input: ArchetypeInput, ingestion?: IngestionArtifacts): string[] {
  return unique([
    ...(input.referenceImages ?? []).map((image) => `${image.label}${image.type ? ` (${image.type})` : ""}`),
    ...(input.materials ?? []).map((material) => `${material.label} (${material.type})`),
    ...(ingestion?.visualEvidence.sources ?? []).map((source) => `${source.source_label} (${source.source_type})`)
  ]);
}

function materialRefs(input: ArchetypeInput, ingestion?: IngestionArtifacts): string[] {
  return unique([
    ...(input.referenceImages ?? []).map((image, index) => image.id ?? `source_reference_image_${index + 1}`),
    ...(input.materials ?? []).map((material, index) => material.id ?? `source_material_${index + 1}_${slugify(material.label)}`),
    ...(ingestion?.visualEvidence.sources ?? []).map((source) => source.source_id)
  ]);
}

function designEvidenceRefs(input: ArchetypeInput, ingestion?: IngestionArtifacts): string[] {
  const refs = ["source_user_context"];
  if ((input.goals ?? []).length > 0) refs.push("source_user_goals");
  if (input.brand) refs.push("source_brand");
  refs.push(...materialRefs(input, ingestion));
  return unique(refs);
}

function sourceStrength(input: ArchetypeInput, ingestion?: IngestionArtifacts): SourceStrength {
  const hasBrand = Boolean(input.brand?.primaryColor || input.brand?.tone || (input.brand?.attributes ?? []).length > 0);
  const visualCount = ingestion?.visualEvidence.source_count ?? 0;
  const hasVisual = visualCount > 0 || (input.referenceImages ?? []).length > 0 || (input.materials ?? []).some((material) => ["design_file", "screenshot", "brand"].includes(material.type));
  if (hasBrand && hasVisual) return "brand_and_visual_evidence";
  if (hasVisual) return "visual_evidence";
  if ((input.goals ?? []).length > 0 || (input.users ?? []).length > 0 || input.context.length > 80) return "product_evidence";
  return "context_only";
}

function densityFromSource(input: ArchetypeInput, ingestion?: IngestionArtifacts): DesignDirectionOption["density"] {
  const visualDensity = ingestion?.visualEvidence.aggregate.density_profile;
  if (visualDensity === "dense") return "compact";
  if (visualDensity === "spacious") return "spacious";
  const text = `${input.context} ${(input.brand?.attributes ?? []).join(" ")} ${(input.referenceImages ?? []).map((image) => image.notes ?? "").join(" ")}`.toLowerCase();
  if (mentionsAny(text, ["dense", "compact", "admin", "operations", "dashboard", "table"])) return "compact";
  if (mentionsAny(text, ["spacious", "marketing", "editorial", "landing", "consumer"])) return "spacious";
  return "balanced";
}

function buildSourceProfile(input: ArchetypeInput, profile: DomainProfile, experience: ExperienceArtifacts, ingestion?: IngestionArtifacts): DesignSourceProfile {
  const productLabel = titleCase(input.projectName ?? profile.productType);
  const primaryUser = titleCase((input.users ?? [])[0] ?? "Primary User");
  const primaryGoal = compact((input.goals ?? [])[0] ?? input.context, "Complete the core workflow");
  const workloadLabel = firstScreenName(experience);
  const materials = materialLabels(input, ingestion);
  const materialEvidenceRefs = materialRefs(input, ingestion);
  const strength = sourceStrength(input, ingestion);
  const sourceSignature = [
    `product=${productLabel}`,
    `user=${primaryUser}`,
    `workload=${workloadLabel}`,
    `strength=${strength}`,
    materials.length > 0 ? `materials=${materials.slice(0, 3).join(" | ")}` : "materials=none"
  ].join("; ");
  const visual = ingestion?.visualEvidence.aggregate;
  const materialSourceAlignment = (ingestion?.normalizedSources ?? [])
    .filter((source) => !["source_user_context", "source_user_goals"].includes(source.source_id))
    .slice(0, 6)
    .flatMap((source) => [
      `Source ${source.source_id} (${source.source_type}): ${source.source_label}.`,
      `Source summary: ${source.summary}`,
      ...source.design_implications.slice(0, 2).map((implication) => `Source implication: ${implication}`)
    ]);
  const materialAlignment = unique([
    ...materials.slice(0, 5).map((material) => `Reflect supplied material: ${material}.`),
    ...materialSourceAlignment,
    ...(visual?.navigation_patterns ?? []).slice(0, 3).map((item) => `Navigation signal from materials: ${item}.`),
    ...(visual?.layout_patterns ?? []).slice(0, 4).map((item) => `Layout signal from materials: ${item}.`),
    ...(visual?.component_candidates ?? []).slice(0, 5).map((item) => `Component signal from materials: ${item}.`),
    ...(visual?.interaction_states ?? []).slice(0, 5).map((item) => `State signal from materials: ${item}.`)
  ]);
  const scene = [
    `${primaryUser} uses ${productLabel} for ${workloadLabel.toLowerCase()}.`,
    strength === "context_only" ? "No visual or design files were supplied, so every visual choice remains a candidate until review." : `Source materials shape the layout, density, and component state decisions: ${materials.slice(0, 2).join(", ")}.`,
    `Primary outcome: ${primaryGoal}.`
  ].join(" ");
  const seed = `${input.projectName ?? ""} ${input.context} ${input.goals?.join(" ") ?? ""} ${materials.join(" ")}`;
  return {
    productLabel,
    productSlug: slugify(productLabel),
    primaryUser,
    primaryGoal,
    workloadLabel,
    sourceSignature,
    sourceStrength: strength,
    evidenceRefs: designEvidenceRefs(input, ingestion),
    materialEvidenceRefs,
    materialAlignment,
    routeScreenAlignment: routeScreenAlignment(experience),
    density: densityFromSource(input, ingestion),
    paletteHue: brandHue(input, seed),
    paletteChroma: mentionsAny(seed, ["monochrome", "neutral", "minimal", "quiet"]) ? 0.035 : 0.075,
    physicalScene: scene
  };
}

function direction(profile: DesignSourceProfile, variant: {
  suffix: string;
  name: string;
  thesis: string;
  paletteStrategy: DesignDirectionOption["palette_strategy"];
  hueShift: number;
  intensity: "quiet" | "signal" | "expressive";
  density?: DesignDirectionOption["density"];
  layout: string;
  component: string;
  typography: string;
  motion: string;
  bestFor: string[];
  risks: string[];
  rejectionTests: string[];
}): DesignDirectionOption {
  return {
    id: `direction-${profile.productSlug}-${variant.suffix}`,
    name: variant.name,
    thesis: variant.thesis,
    source_signature: profile.sourceSignature,
    source_strength: profile.sourceStrength,
    derived_from: profile.evidenceRefs,
    material_alignment: profile.materialAlignment.length > 0
      ? profile.materialAlignment
      : ["No visual material supplied. Treat direction as a candidate derived from product context and require human review before implementation."],
    route_screen_alignment: profile.routeScreenAlignment,
    physical_scene: profile.physicalScene,
    palette_strategy: variant.paletteStrategy,
    palette: paletteFor(profile, variant.hueShift, variant.intensity),
    typography: variant.typography,
    density: variant.density ?? profile.density,
    layout_language: variant.layout,
    component_language: variant.component,
    motion_language: variant.motion,
    best_for: variant.bestFor,
    risks: variant.risks,
    rejection_tests: variant.rejectionTests,
    evidence_refs: unique([...profile.evidenceRefs, ...profile.materialEvidenceRefs])
  };
}

export function buildDesignDirectionOptions(input: ArchetypeInput, profile: DomainProfile, experience: ExperienceArtifacts, ingestion?: IngestionArtifacts): DesignDirectionOption[] {
  const source = buildSourceProfile(input, profile, experience, ingestion);
  const materialClause = source.materialAlignment.length > 0
    ? "It must translate the supplied material signals into abstract layout, component, and state contracts without copying protected surface details."
    : "Because no visual material was supplied, it must stay explicitly candidate and invite the user to add screenshots, design files, SPEC, PRD, or brand docs.";
  return [
    direction(source, {
      suffix: "source-faithful",
      name: `${source.productLabel} Source-Faithful System`,
      thesis: `${source.productLabel} should look like the product implied by the user's evidence, not a reusable Archetype demo. ${materialClause}`,
      paletteStrategy: "restrained",
      hueShift: 0,
      intensity: "quiet",
      layout: `Start from ${source.workloadLabel} and the first five route/screen contracts. Use supplied navigation and layout material signals before introducing any new composition.`,
      component: `Use shadcn primitives only after binding them to ${source.productLabel} component states, source-material components, and ${source.primaryUser.toLowerCase()} recovery actions.`,
      typography: `Compact, source-faithful product typography for ${source.workloadLabel}; hierarchy follows the user's material density and route priority, not a generic dashboard scale.`,
      motion: "Use motion only for orientation, selection, and validation feedback that appears in the source or route contract.",
      bestFor: [source.productLabel, source.workloadLabel, source.primaryUser, profile.productType],
      risks: ["Can overfit weak source material if screenshots or design docs are low quality.", "Requires human review to confirm that abstracted visual signals match the user's intent."],
      rejectionTests: [
        `If the design cannot cite ${source.materialEvidenceRefs.length > 0 ? "a supplied material or route contract" : "user context and route contracts"} for its layout language, reject it.`,
        "If it keeps the old Graphite Command, Editorial Workbench, or Instrument Panel naming pattern, reject it.",
        "If shadcn defaults become the visual identity, reject it."
      ]
    }),
    direction(source, {
      suffix: "workflow-optimized",
      name: `${source.workloadLabel} Workflow System`,
      thesis: `${source.workloadLabel} is the visual anchor: the design should organize routes, data, actions, and states around the work the user described: ${source.primaryGoal}`,
      paletteStrategy: source.sourceStrength === "context_only" ? "restrained" : "full_palette",
      hueShift: 38,
      intensity: "signal",
      layout: `Prioritize the primary route and state matrix: ${source.routeScreenAlignment.slice(0, 3).join(" | ") || "route map pending"}. Avoid decorative screens that are not backed by workflow evidence.`,
      component: `Components are chosen by workflow pressure: filters, tables, forms, route controls, state banners, and review actions appear only where the generated experience contract requires them.`,
      typography: `Workload-first typography: labels and dense values are optimized for ${source.primaryUser.toLowerCase()}, with no hero-metric template unless a supplied material proves it.`,
      motion: "Use short state transitions for flow progress, validation, focus, and async status; no decorative motion.",
      bestFor: [source.primaryGoal, `${source.primaryUser} workflows`, "test-first implementation"],
      risks: ["Can become utilitarian if the user expected a more expressive brand surface.", "Needs real copy and empty/error states to avoid feeling mechanical."],
      rejectionTests: [
        "If the route proposal could fit any SaaS dashboard, reject it.",
        "If a component exists without a route, state, action, or data contract reason, reject it.",
        "If the visual hierarchy ignores the user's primary workflow, reject it."
      ]
    }),
    direction(source, {
      suffix: "evidence-differentiated",
      name: `${source.primaryUser} Decision Surface`,
      thesis: `${source.primaryUser} needs a design that makes decisions, exceptions, and next actions obvious while preserving the specific product evidence for ${source.productLabel}.`,
      paletteStrategy: "full_palette",
      hueShift: -54,
      intensity: "expressive",
      density: source.density === "spacious" ? "balanced" : source.density,
      layout: `Build a decision surface from ${source.productLabel} evidence: route proposals, source material implications, and component states stay visible enough for human review before implementation.`,
      component: `Use product-specific shadcn compositions for ${source.primaryUser.toLowerCase()}: stateful controls, tables or panels only when evidenced, explicit focus/active/disabled/loading/invalid states, and no default examples.`,
      typography: "Decision-oriented hierarchy with source labels, state labels, and action labels that remain readable in dense and responsive layouts.",
      motion: "Motion clarifies what changed after a decision, filter, or validation event; never use motion as decoration.",
      bestFor: ["human review", "approval flows", "agent handoff", source.productLabel],
      risks: ["Can expose too much process if the product is meant to feel invisible.", "Needs screenshot-backed verification so 'premium' is not a subjective claim."],
      rejectionTests: [
        "If the user cannot tell which evidence shaped the design, reject it.",
        "If review, approval, or revision decisions are hidden behind artifact names, reject it.",
        "If the design cannot survive malformed data, empty states, and permission states, reject it."
      ]
    })
  ];
}

export function selectDesignDirection(input: ArchetypeInput, directions: DesignDirectionOption[]): DesignDirectionOption {
  const context = input.context.toLowerCase();
  const brandTone = input.brand?.tone?.toLowerCase() ?? "";
  const attributes = (input.brand?.attributes ?? []).join(" ").toLowerCase();
  const text = `${context} ${brandTone} ${attributes}`;
  if (mentionsAny(text, ["review", "approval", "onboarding", "human", "stakeholder", "clarify", "wizard"])) {
    return directions.find((direction) => direction.id.endsWith("evidence-differentiated")) ?? directions[0];
  }
  if (mentionsAny(text, ["workflow", "builder", "report", "campaign", "checkout", "form", "qa", "verification", "test", "ops"])) {
    return directions.find((direction) => direction.id.endsWith("workflow-optimized")) ?? directions[0];
  }
  return directions.find((direction) => direction.id.endsWith("source-faithful")) ?? directions[0];
}

export function buildVisualCraftRubric(selected: DesignDirectionOption): string {
  return [
    "# Visual Craft Rubric",
    "",
    "Source scope: design-quality-gate",
    "",
    `Selected direction: ${selected.name}`,
    `Source strength: ${selected.source_strength}`,
    `Source signature: ${selected.source_signature}`,
    "",
    "## Blocking Checks",
    "",
    "- Reject Default blue-gray SaaS styling unless the user explicitly supplied it as brand evidence.",
    "- Reject identical card grids as the main page structure.",
    "- Reject components that do not render hover, focus-visible, active, disabled, loading, empty, error, and success states where applicable.",
    "- Reject raw Tailwind color literals or inline styling that bypasses tokens.",
    "- Reject shadcn defaults that are not tokenized, stateful, accessible, and product-specific.",
    "- Reject route or screen proposals that cannot be explained from source evidence or explicit assumptions.",
    "- Reject directions whose ids, names, or layout language are reusable presets instead of source-derived product decisions.",
    "- Reject implementation handoff until the user has reviewed the browser-viewable design-system preview.",
    "",
    "## Human Review Questions",
    "",
    "- Does the selected direction fit the physical scene and user workload?",
    "- Are the route proposals the right product, not just plausible routes?",
    "- Are component states tangible enough for a frontend agent to implement deterministically?",
    "- Is there any place where the result still looks like generic AI-generated UI?",
    "",
    "## Direction Rejection Tests",
    "",
    ...selected.rejection_tests.map((test) => `- ${test}`),
    "",
    "## Source Bindings",
    "",
    ...selected.derived_from.map((ref) => `- Evidence: ${ref}`),
    ...selected.material_alignment.map((item) => `- Material alignment: ${item}`),
    ...selected.route_screen_alignment.map((item) => `- Route/screen alignment: ${item}`)
  ].join("\n");
}

export function buildShadcnIntegrationContract(selected: DesignDirectionOption): Record<string, unknown> {
  return {
    artifact_version: "1.0",
    source_scope: "design-quality-gate",
    selected_direction_id: selected.id,
    source_strength: selected.source_strength,
    source_signature: selected.source_signature,
    derived_from: selected.derived_from,
    shadcn_policy: {
      required: true,
      rule: "Use shadcn components as implementation primitives, not as untouched default UI.",
      required_primitives: [
        "Button",
        "Input",
        "Textarea",
        "Select",
        "Checkbox",
        "Switch",
        "Tabs",
        "Dialog",
        "Popover",
        "Tooltip",
        "DropdownMenu",
        "Table",
        "Badge",
        "Toast"
      ],
      extension_rule: "Wrap shadcn primitives in product-specific components only when the wrapper removes duplication, binds contract state, or enforces accessibility.",
      forbidden: [
        "Do not ship unmodified default shadcn visual styling.",
        "Do not invent component variants outside component-contracts.json.",
        "Do not use shadcn examples as product architecture.",
        "Do not use a generic Card grid as the page composition system."
      ]
    },
    tailwind_policy: {
      required: true,
      token_source: "04-design-system/tokens/css-variables.css",
      allowed: ["CSS variables", "semantic Tailwind theme aliases", "state variants generated from component contracts"],
      forbidden: ["raw color literals", "arbitrary spacing literals for product layout", "negative letter spacing", "viewport-scaled font sizes"]
    },
    component_layering: [
      "tokens",
      "shadcn primitive wrappers",
      "contract-bound reusable components",
      "product-specific patterns",
      "route screens",
      "data adapters and fixtures"
    ],
    selected_direction_summary: selected.thesis
  };
}

function check(id: string, label: string, status: "pass" | "fail", detail: string, evidenceRefs: string[]): DesignQualityGateArtifact["checks"][number] {
  return { id, label, status, detail, evidence_refs: evidenceRefs };
}

export function buildDesignQualityGate(input: {
  directions: DesignDirectionOption[];
  selected: DesignDirectionOption;
  experience: ExperienceArtifacts;
  componentContracts: Record<string, unknown>;
  primitiveTokens: Record<string, unknown>;
  semanticTokens: Record<string, unknown>;
}): DesignQualityGateArtifact {
  const components = Array.isArray(input.componentContracts.contracts) ? input.componentContracts.contracts as Array<Record<string, unknown>> : [];
  const allStates = new Set(
    components.flatMap((component) =>
      Array.isArray(component.state_contract)
        ? component.state_contract.map((state) => typeof state === "object" && state !== null ? String((state as Record<string, unknown>).state ?? "") : "")
        : []
    ).filter(Boolean)
  );
  const colorValues = JSON.stringify(input.primitiveTokens).toLowerCase();
  const semanticValues = JSON.stringify(input.semanticTokens).toLowerCase();
  const hasDefaultBlueGray = colorValues.includes("#2563eb") || colorValues.includes("blue.600") || semanticValues.includes("blue.600");
  const requiredStates = ["default", "hover", "focus", "active", "disabled", "loading", "invalid"];
  const missingStates = requiredStates.filter((state) => !allStates.has(state));
  const forbiddenPresetNames = ["Graphite Command Surface", "Editorial Workbench", "Instrument Panel"];
  const forbiddenPresetIds = ["direction-01-graphite-command", "direction-02-editorial-workbench", "direction-03-instrument-panel"];
  const hasPresetDirection = input.directions.some((direction) => forbiddenPresetNames.includes(direction.name) || forbiddenPresetIds.includes(direction.id));
  const sourceBoundDirections = input.directions.every((direction) =>
    direction.source_signature.length > 0
    && direction.source_strength.length > 0
    && direction.derived_from.includes("source_user_context")
    && direction.route_screen_alignment.length > 0
  );
  const hasMaterialEvidence = input.directions.some((direction) => direction.source_strength === "visual_evidence" || direction.source_strength === "brand_and_visual_evidence");
  const materialBoundDirections = !hasMaterialEvidence || input.directions.every((direction) =>
    direction.material_alignment.some((item) => !item.includes("No visual material supplied"))
    && direction.evidence_refs.some((ref) => !["source_user_context", "source_user_goals", "source_brand"].includes(ref))
  );
  const checks = [
    check("DQ-01", "Three differentiated design directions exist", input.directions.length >= 3 ? "pass" : "fail", "The draft must show alternatives before a direction becomes canonical.", ["draft/design-directions.json"]),
    check("DQ-02", "Selected direction is explicit", input.selected.id ? "pass" : "fail", `Selected ${input.selected.id}.`, ["draft/design-system.draft.json"]),
    check("DQ-03", "Palette avoids default blue-gray SaaS reflex", hasDefaultBlueGray ? "fail" : "pass", hasDefaultBlueGray ? "Default blue-gray tokens detected." : "Palette is generated from the selected direction and avoids default blue-gray tokens.", ["04-design-system/tokens/primitive-tokens.json"]),
    check("DQ-04", "Component states cover implementation-critical states", missingStates.length === 0 ? "pass" : "fail", missingStates.length === 0 ? "Required component states are present." : `Missing states: ${missingStates.join(", ")}.`, ["04-design-system/components/component-contracts.json"]),
    check("DQ-05", "Routes and screens are bound to the design review", input.experience.routeMap.routes.length > 0 && input.experience.screenSpecs.length > 0 ? "pass" : "fail", "Design review must include route proposals and screen state implications.", ["draft/experience-architecture.draft.json"]),
    check("DQ-06", "Browser preview and human review are required before implementation", "pass", "draft/design-system-preview.html and review-console/index.html are mandatory review surfaces.", ["draft/design-system-preview.html", "review-console/index.html"]),
    check("DQ-07", "shadcn plus Tailwind implementation is contract-bound", "pass", "shadcn is the primitive layer; Tailwind consumes generated CSS variables and semantic tokens.", ["04-design-system/design-quality-gate.json"]),
    check("DQ-08", "Design directions are bound to source evidence", sourceBoundDirections && materialBoundDirections ? "pass" : "fail", sourceBoundDirections && materialBoundDirections ? "Directions expose source signatures, evidence refs, material alignment, and route/screen alignment." : "One or more directions are not bound to user/material evidence.", ["draft/design-directions.json", "01-evidence/visual-evidence-extraction.json"]),
    check("DQ-09", "Reusable preset directions are forbidden", hasPresetDirection ? "fail" : "pass", hasPresetDirection ? "A reusable preset direction name or id was generated." : "Direction ids and names are source-derived for this product.", ["draft/design-directions.json"])
  ];
  const blockers = checks.filter((item) => item.status === "fail").map((item) => `${item.id}: ${item.detail}`);
  return {
    artifact_version: "1.0",
    source_scope: "design-quality-gate",
    status: blockers.length > 0 ? "fail" : "pass",
    selected_direction_id: input.selected.id,
    required_before_implementation: true,
    implementation_blocked_until_human_review: true,
    checks,
    anti_slop_rules: [
      "No default blue-gray SaaS palette unless user-supplied brand evidence explicitly requires it.",
      "No generic card-grid dashboard as the primary architecture.",
      "No untouched shadcn examples or default component styling.",
      "No gradient text, decorative glassmorphism, side-stripe cards, or hero-metric templates.",
      "No route, component, token, or layout invention after contract approval.",
      "No visual completion claims without browser screenshots or Playwright visual-smoke evidence.",
      "No reusable Archetype demo directions; every direction must cite source context, materials when present, and route/screen alignment."
    ],
    required_review_surfaces: [
      "review-console/index.html",
      "draft/design-system-preview.html",
      "draft/design-directions.json",
      "draft/design-quality-gate.json",
      "draft/experience-architecture.draft.json",
      "draft/contract-approval-request.json"
    ],
    required_agent_behaviors: [
      "Present design directions before canonical spec generation.",
      "Ask for one clarification question when design feedback is ambiguous.",
      "Bind approved direction to tokens, typography, components, routes, and tests.",
      "Write tests for focus, active, disabled, loading, error, empty, and malformed-data states before implementation.",
      "Report a design-system gap instead of inventing missing visual behavior."
    ],
    playwright_preview_requirement: {
      required: true,
      viewports: ["mobile", "tablet", "desktop"],
      evidence_artifacts: [
        "verification/playwright-evidence.json",
        "qa/visual-regression-report.md",
        "qa/playwright-results.json"
      ]
    },
    shadcn_tailwind_policy: {
      shadcn_required: true,
      tailwind_required: true,
      css_variable_tokens_required: true,
      forbidden: [
        "raw hex colors in component implementation",
        "hardcoded spacing outside generated token aliases",
        "default shadcn demo layout copied as product UI",
        "component variants not present in component-contracts.json"
      ]
    },
    blockers,
    warnings: [
      "Human approval is still required; this gate only proves the design draft has enough structure to review.",
      "If the user supplies brand or screenshots later, regenerate directions and tokens before approval.",
      ...(input.selected.source_strength === "context_only" ? ["No SPEC, PRD, screenshot, design file, or brand material was supplied. Treat visual direction as candidate and ask for materials before approval when design fidelity matters."] : [])
    ]
  };
}
