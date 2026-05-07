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

  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `<title>${escapeHtml(productName(pkg))} Draft Design System Preview</title>`,
    "<style>",
    ":root { color-scheme: light; --bg: #f8fafc; --surface: #ffffff; --ink: #111827; --muted: #64748b; --line: #d9e1ea; --accent: #2563eb; --danger: #dc2626; --radius: 8px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
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
    "th { background: #eef3f8; font-size: 0.78rem; text-transform: uppercase; color: #475569; letter-spacing: 0; }",
    ".sample-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 12px; }",
    "button { border: 1px solid #1d4ed8; background: var(--accent); color: #f8fafc; border-radius: 6px; min-height: 36px; padding: 0 12px; font-weight: 650; }",
    "button.secondary { background: var(--surface); color: var(--ink); border-color: var(--line); }",
    ".badge { display: inline-flex; align-items: center; min-height: 28px; border-radius: 999px; padding: 0 10px; background: #eef3f8; color: #475569; font-size: 0.8rem; font-weight: 650; }",
    ".type-row span { display: block; color: var(--muted); font-weight: 700; margin-bottom: 4px; }",
    "details { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 12px 14px; margin-bottom: 10px; }",
    "summary { cursor: pointer; font-weight: 700; }",
    "pre { overflow: auto; white-space: pre-wrap; }",
    "@media (max-width: 720px) { main { padding: 20px 14px 40px; } table { display: block; overflow-x: auto; } }",
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
    "- Default, hover, focus, disabled, loading, invalid, and error states where available.",
    "- Accessibility rules and content/state behavior.",
    "- Candidate assumptions and unresolved unknowns before approval."
  ].join("\n");
}
