import type { ArchetypePackage } from "../core/types";

type TokenRow = {
  group: string;
  name: string;
  value: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function productName(pkg: ArchetypePackage): string {
  return String(pkg.product.productModel.product_name ?? pkg.manifest.project_slug);
}

function tokenValue(value: unknown): string {
  const record = asRecord(value);
  if ("value" in record) return String(record.value ?? "");
  return String(value ?? "");
}

function tokenRows(groupName: string, value: unknown): TokenRow[] {
  return Object.entries(asRecord(value)).map(([name, token]) => ({
    group: groupName,
    name,
    value: tokenValue(token)
  }));
}

function tokenFromGroup(group: Record<string, unknown>, name: string, fallback: string): string {
  const value = tokenValue(group[name]);
  return value.trim().length > 0 ? value : fallback;
}

function flattenTokens(tokens: Record<string, unknown>): TokenRow[] {
  return Object.entries(tokens).flatMap(([group, value]) => tokenRows(group, value));
}

function rowsTable(rows: TokenRow[], caption: string): string {
  const body = rows.length > 0
    ? rows.map((row) => [
      "<tr>",
      `<td>${escapeHtml(row.group)}</td>`,
      `<td><code>${escapeHtml(row.name)}</code></td>`,
      `<td><code>${escapeHtml(row.value)}</code></td>`,
      "</tr>"
    ].join("")).join("\n")
    : "<tr><td colspan=\"3\">No tokens generated.</td></tr>";
  return [
    `<table aria-label="${escapeHtml(caption)}">`,
    "<thead><tr><th>Group</th><th>Name</th><th>Value</th></tr></thead>",
    `<tbody>${body}</tbody>`,
    "</table>"
  ].join("\n");
}

function colorSwatches(rows: TokenRow[]): string {
  const items = rows.map((row) => [
    "<div class=\"swatch-card\">",
    `<span class=\"swatch\" style=\"background:${escapeHtml(row.value)}\"></span>`,
    `<strong>${escapeHtml(row.name)}</strong>`,
    `<code>${escapeHtml(row.value)}</code>`,
    "</div>"
  ].join("")).join("\n");
  return items || "<p>No primitive color tokens generated.</p>";
}

function typographySamples(rows: TokenRow[]): string {
  const samples = rows.map((row) => [
    "<div class=\"type-row\">",
    `<span>${escapeHtml(row.name)}</span>`,
    `<p>${escapeHtml(row.value)}: The quick brown fox checks readable hierarchy.</p>`,
    "</div>"
  ].join("")).join("\n");
  return samples || "<p>No typography tokens generated.</p>";
}

function componentName(component: Record<string, unknown>): string {
  return String(component.name ?? component.component ?? component.id ?? "Unnamed component");
}

function componentStates(component: Record<string, unknown>): string[] {
  const states = asArray(component.state_contract).map((state) => String(asRecord(state).state ?? "")).filter(Boolean);
  if (states.length > 0) return states;
  return ["default", "hover", "focus", "disabled", "loading", "invalid"];
}

function componentCards(components: unknown[]): string {
  const cards = components.map((item) => {
    const component = asRecord(item);
    const name = componentName(component);
    const variants = asArray(component.variant_contract)
      .map((variant) => String(asRecord(variant).variant ?? ""))
      .filter(Boolean);
    const states = componentStates(component);
    return [
      "<article class=\"component-card\" data-preview-kind=\"component\">",
      `<div><span class=\"eyebrow\">Component</span><h3>${escapeHtml(name)}</h3></div>`,
      `<p>${escapeHtml(component.purpose ?? "Draft component contract awaiting human review.")}</p>`,
      "<div class=\"sample-row\">",
      `<button type=\"button\">${escapeHtml(name.includes("Button") ? "Primary action" : "Sample")}</button>`,
      "<button type=\"button\" class=\"secondary\">Secondary</button>",
      "<span class=\"badge\">Candidate</span>",
      "</div>",
      `<p><strong>Variants:</strong> ${escapeHtml(variants.length > 0 ? variants.join(", ") : "default")}</p>`,
      `<p><strong>States:</strong> ${escapeHtml(states.join(", "))}</p>`,
      "</article>"
    ].join("\n");
  }).join("\n");
  return cards || "<p>No component contracts generated.</p>";
}

function directionCards(designSystemDraft: Record<string, unknown>): string {
  const designDirections = asRecord(designSystemDraft.design_directions);
  const options = asArray(designDirections.options);
  const selected = String(designDirections.selected_direction_id ?? "");
  const cards = options.map((item) => {
    const direction = asRecord(item);
    const palette = asRecord(direction.palette);
    const accent = String(palette.accent ?? "var(--accent)");
    const surface = String(palette.surface ?? "var(--surface)");
    const text = String(palette.text ?? "var(--ink)");
    return [
      `<article class="direction-card${String(direction.id) === selected ? " selected" : ""}">`,
      `<div class="direction-swatch" style="background:${escapeHtml(surface)};color:${escapeHtml(text)};border-color:${escapeHtml(accent)}"><span style="background:${escapeHtml(accent)}"></span></div>`,
      `<span class="eyebrow">${String(direction.id) === selected ? "Selected direction" : "Design option"}</span>`,
      `<h3>${escapeHtml(direction.name ?? direction.id ?? "Unnamed direction")}</h3>`,
      `<p><strong>Source strength:</strong> ${escapeHtml(direction.source_strength ?? "unknown")}</p>`,
      `<p><strong>Source signature:</strong> ${escapeHtml(direction.source_signature ?? "No source signature supplied.")}</p>`,
      `<p>${escapeHtml(direction.thesis ?? "No thesis supplied.")}</p>`,
      `<p><strong>Scene:</strong> ${escapeHtml(direction.physical_scene ?? "No scene supplied.")}</p>`,
      `<p><strong>Layout:</strong> ${escapeHtml(direction.layout_language ?? "No layout language supplied.")}</p>`,
      `<p><strong>Materials:</strong> ${escapeHtml(asArray(direction.material_alignment).slice(0, 3).join(" ") || "No material alignment supplied.")}</p>`,
      `<p><strong>Routes:</strong> ${escapeHtml(asArray(direction.route_screen_alignment).slice(0, 3).join(" ") || "No route/screen alignment supplied.")}</p>`,
      "</article>"
    ].join("\n");
  }).join("\n");
  return cards || "<p>No design directions generated.</p>";
}

function qualityGate(designSystemDraft: Record<string, unknown>): string {
  const gate = asRecord(designSystemDraft.design_quality_gate);
  const checks = asArray(gate.checks).map((item) => {
    const check = asRecord(item);
    return `<li><strong>${escapeHtml(check.id ?? "DQ")}: ${escapeHtml(check.label ?? "Design quality check")}</strong><span>${escapeHtml(check.status ?? "unknown")} - ${escapeHtml(check.detail ?? "")}</span></li>`;
  }).join("\n");
  const rules = asArray(gate.anti_slop_rules).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
  return [
    "<div class=\"quality-grid\">",
    "<div>",
    `<p><strong>Status:</strong> ${escapeHtml(gate.status ?? "unknown")}</p>`,
    `<p><strong>Selected direction:</strong> ${escapeHtml(gate.selected_direction_id ?? "unknown")}</p>`,
    "<ul>",
    checks || "<li>No design-quality checks generated.</li>",
    "</ul>",
    "</div>",
    "<div>",
    "<h3>Anti-Slop Rules</h3>",
    "<ul>",
    rules || "<li>No anti-slop rules generated.</li>",
    "</ul>",
    "</div>",
    "</div>"
  ].join("\n");
}

function statesList(components: unknown[]): string {
  const rows = components.flatMap((item) => {
    const component = asRecord(item);
    return componentStates(component).map((state) => ({ name: componentName(component), state }));
  });
  const body = rows.map((row) => `<li><strong>${escapeHtml(row.name)}</strong>: ${escapeHtml(row.state)}</li>`).join("\n");
  return body || "<li>No component states generated.</li>";
}

function rawDetails(title: string, value: unknown): string {
  return [
    "<details>",
    `<summary>${escapeHtml(title)}</summary>`,
    `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`,
    "</details>"
  ].join("\n");
}

export function designSystemPreviewHtml(pkg: ArchetypePackage, designSystemDraft: Record<string, unknown>): string {
  const tokens = asRecord(designSystemDraft.tokens);
  const primitive = asRecord(tokens.primitive);
  const primitiveColors = asRecord(primitive.color);
  const semantic = asRecord(tokens.semantic);
  const componentTokenMap = asRecord(tokens.component);
  const typography = asRecord(tokens.typography);
  const colorRows = tokenRows("color", asRecord(primitive.color));
  const semanticRows = flattenTokens(semantic);
  const primitiveRows = flattenTokens(primitive);
  const componentRows = flattenTokens(componentTokenMap);
  const typographyRows = flattenTokens(typography);
  const components = asArray(designSystemDraft.components);
  const patterns = asRecord(designSystemDraft.patterns);
  const accessibility = asRecord(designSystemDraft.accessibility);
  const previewBg = tokenFromGroup(primitiveColors, "neutral.950", "oklch(0.145 0.006 255)");
  const previewSurface = tokenFromGroup(primitiveColors, "neutral.900", "oklch(0.185 0.006 255)");
  const previewSubtle = tokenFromGroup(primitiveColors, "neutral.800", "oklch(0.235 0.006 255)");
  const previewText = tokenFromGroup(primitiveColors, "neutral.100", "oklch(0.94 0.006 255)");
  const previewMuted = tokenFromGroup(primitiveColors, "neutral.600", "oklch(0.68 0.01 255)");
  const previewLine = tokenFromGroup(primitiveColors, "neutral.300", "oklch(0.32 0.008 255)");
  const previewAccent = tokenFromGroup(primitiveColors, "accent.600", "oklch(0.82 0.035 255)");

  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `<title>${escapeHtml(productName(pkg))} Draft Design System Preview</title>`,
    "<style>",
    `:root { color-scheme: dark; --bg: ${previewBg}; --surface: ${previewSurface}; --subtle: ${previewSubtle}; --ink: ${previewText}; --muted: ${previewMuted}; --line: ${previewLine}; --accent: ${previewAccent}; --danger: oklch(0.68 0.13 24); --radius: 8px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }`,
    "* { box-sizing: border-box; }",
    "body { margin: 0; background: var(--bg); color: var(--ink); line-height: 1.5; }",
    "main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }",
    "header { border-bottom: 1px solid var(--line); padding: 24px 0 20px; margin-bottom: 28px; }",
    "h1, h2, h3, p { margin-top: 0; }",
    "h1 { font-size: 2rem; line-height: 1.15; margin-bottom: 8px; }",
    "h2 { font-size: 1.25rem; margin-bottom: 12px; }",
    "h3 { font-size: 1rem; margin-bottom: 8px; }",
    "section { margin: 0 0 32px; }",
    ".notice { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 14px 16px; }",
    ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }",
    ".swatch-card, .component-card, .type-row { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 14px; }",
    ".swatch { display: block; height: 42px; border-radius: 6px; border: 1px solid var(--line); margin-bottom: 10px; }",
    ".eyebrow { display: inline-block; color: var(--muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0; margin-bottom: 4px; }",
    "code, pre { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.85em; }",
    "table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; display: table; }",
    "th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 9px 10px; vertical-align: top; }",
    "th { background: var(--subtle); font-size: 0.78rem; text-transform: uppercase; color: var(--muted); letter-spacing: 0; }",
    ".sample-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 12px; }",
    "button { border: 1px solid var(--accent); background: var(--accent); color: var(--bg); border-radius: 6px; min-height: 36px; padding: 0 12px; font-weight: 650; }",
    "button:hover { filter: brightness(1.05); }",
    "button:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; box-shadow: 0 0 0 4px color-mix(in oklch, var(--accent), transparent 70%); }",
    "button:active { transform: translateY(1px); filter: brightness(0.96); }",
    "button:disabled, button[aria-disabled=\"true\"] { opacity: 0.55; cursor: not-allowed; }",
    "button.secondary { background: var(--surface); color: var(--ink); border-color: var(--line); }",
    ".badge { display: inline-flex; align-items: center; min-height: 28px; border-radius: 999px; padding: 0 10px; background: var(--subtle); color: var(--muted); font-size: 0.8rem; font-weight: 650; }",
    ".direction-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 16px; }",
    ".direction-card.selected { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }",
    ".direction-swatch { display: flex; align-items: end; height: 58px; border: 1px solid var(--line); border-radius: 6px; padding: 8px; margin-bottom: 12px; }",
    ".direction-swatch span { display: block; width: 44px; height: 10px; border-radius: 999px; }",
    ".quality-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 16px; }",
    ".type-row span { display: block; color: var(--muted); font-weight: 700; margin-bottom: 4px; }",
    "details { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 12px 14px; margin-bottom: 10px; }",
    "summary { cursor: pointer; font-weight: 700; }",
    "pre { overflow: auto; white-space: pre-wrap; }",
    "@media (max-width: 720px) { main { padding: 20px 14px 40px; } table { display: block; overflow-x: auto; } .quality-grid { grid-template-columns: 1fr; } }",
    "</style>",
    "</head>",
    "<body>",
    `<main data-archetype-artifact=\"draft-design-system-preview\" data-source-artifact=\"draft/design-system.draft.json\" data-source-scope=\"HL-17\">`,
    "<header>",
    `<span class=\"eyebrow\">Draft review artifact</span><h1>${escapeHtml(productName(pkg))} Design System Preview</h1>`,
    "<p>This static HTML is a human review projection of <code>draft/design-system.draft.json</code>. It is not app code and it is not the source of truth.</p>",
    "</header>",
    "<section class=\"notice\" aria-label=\"Review rules\">",
    "<h2>Review Loop</h2>",
    "<p>Ask questions or request design changes here. Ambiguous changes return to one clarification question. Accepted changes revise the draft JSON and regenerate this preview before approval.</p>",
    "<p><strong>Approval gate:</strong> no canonical design system or implementation instructions are generated from this preview alone.</p>",
    "</section>",
    "<section aria-labelledby=\"directions\"><h2 id=\"directions\">Design Directions</h2><div class=\"grid\">",
    directionCards(designSystemDraft),
    "</div></section>",
    "<section aria-labelledby=\"quality\"><h2 id=\"quality\">Design Quality Gate</h2>",
    qualityGate(designSystemDraft),
    "</section>",
    "<section aria-labelledby=\"colors\"><h2 id=\"colors\">Colors</h2><div class=\"grid\">",
    colorSwatches(colorRows),
    "</div>",
    rowsTable(semanticRows, "Semantic color and design tokens"),
    "</section>",
    "<section aria-labelledby=\"typography\"><h2 id=\"typography\">Typography</h2><div class=\"grid\">",
    typographySamples(typographyRows.slice(0, 12)),
    "</div>",
    rowsTable(typographyRows, "Typography tokens"),
    "</section>",
    "<section aria-labelledby=\"components\"><h2 id=\"components\">Components</h2><div class=\"grid\">",
    componentCards(components),
    "</div></section>",
    "<section aria-labelledby=\"states\"><h2 id=\"states\">Component States</h2><ul>",
    statesList(components),
    "</ul></section>",
    "<section aria-labelledby=\"tokens\"><h2 id=\"tokens\">Token Tables</h2>",
    rowsTable(primitiveRows, "Primitive tokens"),
    rowsTable(componentRows, "Component tokens"),
    "</section>",
    "<section aria-labelledby=\"contracts\"><h2 id=\"contracts\">Full Draft Contract Data</h2>",
    rawDetails("Visual direction", designSystemDraft.visual_direction),
    rawDetails("Design directions", designSystemDraft.design_directions),
    rawDetails("Design quality gate", designSystemDraft.design_quality_gate),
    rawDetails("shadcn integration", designSystemDraft.shadcn_integration),
    rawDetails("Patterns", patterns),
    rawDetails("Accessibility", accessibility),
    rawDetails("Complete draft design system JSON", designSystemDraft),
    "</section>",
    "</main>",
    "</body>",
    "</html>"
  ].join("\n");
}

export function designSystemReviewMarkdown(pkg: ArchetypePackage): string {
  return [
    "# Draft Design System Review",
    "",
    "Source scope: HL-17",
    "Status: draft_only_not_source_of_truth",
    "",
    `Product: ${productName(pkg)}`,
    "",
    "## Review Artifacts",
    "",
    "- Source of truth: `draft/design-system.draft.json`",
    "- Design directions: `draft/design-directions.json`",
    "- Design quality gate: `draft/design-quality-gate.json`",
    "- Visual craft rubric: `draft/design-craft-rubric.md`",
    "- Browser preview: `draft/design-system-preview.html`",
    "- Review record: `draft/design-system-review.md`",
    "",
    "## Review Loop",
    "",
    "1. Open `draft/design-system-preview.html` in a browser.",
    "2. Ask questions or request changes in natural language.",
    "3. If the request is ambiguous, Archetype asks one clarification question before revising.",
    "4. Archetype revises `draft/design-system.draft.json` first.",
    "5. Archetype regenerates `draft/design-system-preview.html` from the revised draft.",
    "6. Human approval is required before canonical spec generation.",
    "",
    "## Anti-Generic Design Gate",
    "",
    "- Archetype must propose differentiated design directions before canonical handoff.",
    "- Default blue-gray SaaS dashboards are rejected unless supplied as explicit brand evidence.",
    "- shadcn components are implementation primitives, not a default visual design.",
    "- Tailwind must consume generated tokens and CSS variables rather than raw visual literals.",
    "- Component states must cover hover, focus-visible, active, disabled, loading, empty, error, and success behavior where applicable.",
    "",
    "## Non-Negotiable Rules",
    "",
    "- The HTML preview is not app implementation.",
    "- The HTML preview is not the source of truth.",
    "- Every visible preview section maps back to `draft/design-system.draft.json`.",
    "- No canonical design system is generated from inferred or unapproved preview feedback.",
    "- No implementation agent may build product UI from this preview alone.",
    "",
    "## Required Review Coverage",
    "",
    "- Colors and semantic token roles.",
    "- Typography scale and readable hierarchy.",
    "- Component contracts and variants.",
    "- Default, hover, focus-visible, active, selected/current, disabled, loading, invalid, and error states where available.",
    "- Accessibility rules and content/state behavior.",
    "- Candidate assumptions and unresolved unknowns before approval."
  ].join("\n");
}
