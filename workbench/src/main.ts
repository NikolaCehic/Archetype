import "./styles.css";

type ViewId =
  | "overview"
  | "generation"
  | "evidence"
  | "architecture"
  | "dsag"
  | "screens"
  | "design"
  | "contract"
  | "simulation"
  | "impact"
  | "export"
  | "revision";

interface ArtifactDigest {
  path: string;
  hash: string;
  bytes: number;
  kind: string;
}

interface PackageSnapshot {
  name: string;
  projectSlug: string;
  sourceHash: string;
  generatedAt: string;
  readinessScore: number;
  readyForFrontendAgent: boolean;
  blockers: string[];
  warnings: string[];
  routes: string[];
  screens: string[];
  components: string[];
  patterns: string[];
  artifacts: ArtifactDigest[];
}

interface ArtifactDiff {
  path: string;
  status: "added" | "removed" | "changed" | "unchanged";
  group: string;
  nodeId: string | null;
  beforeHash: string | null;
  afterHash: string | null;
  beforeBytes: number | null;
  afterBytes: number | null;
}

interface ImpactRecord {
  artifact: string;
  source: string;
  reason: string;
  depth: number;
  type: "changed" | "downstream" | "rule";
}

interface Bundle {
  generatedAt: string;
  artifacts?: ArtifactDigest[];
  manifest: Record<string, any>;
  readiness: {
    score: number;
    readyForFrontendAgent: boolean;
    blockers: string[];
    warnings: string[];
    requiredHumanReview: string[];
    dimensions: Record<string, number>;
  };
  schemaValidation: {
    status: string;
    blockers: string[];
    warnings: string[];
    checks: Array<{ id: string; status: string; details: string }>;
  };
  schemaIndex: Array<Record<string, string>>;
  evidence: Record<string, any>;
  sourceAnalysis: Record<string, any>;
  productModel: Record<string, any>;
  userModel: Record<string, any>;
  routeMap: { routes: Array<Record<string, any>> };
  screenInventory: { screens: Array<Record<string, any>> };
  dsag: {
    graph_version: string;
    nodes: Array<Record<string, any>>;
    edges: Array<Record<string, any>>;
    integrity: {
      status: string;
      blockers: string[];
      warnings: string[];
      checks: Array<{ id: string; status: string; details: string }>;
    };
  };
  componentRegistry: { components: Array<Record<string, any>> };
  patternRegistry: { patterns: Array<Record<string, any>> };
  primitiveTokens: Record<string, any>;
  semanticTokens: Record<string, any>;
  buildManifest: Record<string, any>;
  componentUsageMap: Record<string, any>;
  dataContracts: Record<string, any>;
  acceptanceCriteria: { criteria: Array<Record<string, any>> };
  buildSimulation: Record<string, any>;
  revision: Record<string, any>;
  reports: Record<string, string>;
  screens: Array<{ path: string; name: string; content: string }>;
}

interface ApprovalOverride {
  state: "pending_human_review" | "approved" | "changes_requested" | "blocked";
  note: string;
  updatedAt: string;
}

const views: Array<{ id: ViewId; label: string; count: (bundle: Bundle) => number | string }> = [
  { id: "overview", label: "Overview", count: (bundle) => bundle.readiness.score },
  { id: "generation", label: "Generate", count: () => "draft" },
  { id: "evidence", label: "Evidence", count: (bundle) => bundle.evidence.sources?.length ?? 0 },
  { id: "architecture", label: "Architecture", count: (bundle) => bundle.routeMap.routes.length },
  { id: "dsag", label: "DSAG", count: (bundle) => bundle.dsag.integrity.status },
  { id: "screens", label: "Screens", count: (bundle) => bundle.screens.length },
  { id: "design", label: "Design System", count: (bundle) => bundle.componentRegistry.components.length },
  { id: "contract", label: "Frontend Contract", count: (bundle) => bundle.buildManifest.entry_routes?.length ?? 0 },
  { id: "simulation", label: "Simulation", count: (bundle) => bundle.buildSimulation.routeSimulation?.routes?.length ?? 0 },
  { id: "impact", label: "Impact", count: () => state.baselineSnapshot ? "diff" : "base" },
  { id: "export", label: "Export", count: (bundle) => bundle.readiness.readyForFrontendAgent ? "ready" : "hold" },
  { id: "revision", label: "Revision", count: (bundle) => bundle.revision.approvalGates?.gates?.length ?? 0 }
];

const state: {
  bundle: Bundle | null;
  view: ViewId;
  selectedScreen: string | null;
  screenFilter: string;
  packageName: string;
  generationDraft: string;
  generationMessage: string;
  approvalOverrides: Record<string, ApprovalOverride>;
  activeGateNote: string;
  baselineSnapshot: PackageSnapshot | null;
  baselineName: string;
  impactMessage: string;
  handoffMessage: string;
} = {
  bundle: null,
  view: "overview",
  selectedScreen: null,
  screenFilter: "",
  packageName: "sample-package",
  generationDraft: "",
  generationMessage: "",
  approvalOverrides: {},
  activeGateNote: "",
  baselineSnapshot: null,
  baselineName: "",
  impactMessage: "",
  handoffMessage: ""
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found.");

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function badge(label: string, tone: "success" | "warning" | "danger" | "neutral" = "neutral"): string {
  const cls = tone === "neutral" ? "badge" : `badge ${tone}`;
  return `<span class="${cls}">${esc(label)}</span>`;
}

function statusTone(status: unknown): "success" | "warning" | "danger" | "neutral" {
  if (status === true || status === "pass" || status === "ready") return "success";
  if (status === "warning") return "warning";
  if (status === false || status === "fail") return "danger";
  return "neutral";
}

function panel(title: string, body: string, aside = ""): string {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>${esc(title)}</h2>
        ${aside}
      </div>
      <div class="panel-body">${body}</div>
    </section>
  `;
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return `<div class="empty">No rows.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${esc(header)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function code(value: unknown): string {
  return `<pre class="code">${esc(typeof value === "string" ? value : pretty(value))}</pre>`;
}

function textArea(id: string, value: string, label: string): string {
  return `
    <label class="field">
      <span>${esc(label)}</span>
      <textarea id="${esc(id)}" class="textarea" spellcheck="false">${esc(value)}</textarea>
    </label>
  `;
}

function metric(label: string, value: unknown, tone: "success" | "warning" | "danger" | "neutral" = "neutral"): string {
  return `
    <section class="panel">
      <div class="panel-body metric">
        <div class="metric-value">${esc(value)}</div>
        <div class="metric-label">${esc(label)}</div>
        <div>${badge(tone === "neutral" ? "tracked" : tone, tone)}</div>
      </div>
    </section>
  `;
}

function renderOverview(bundle: Bundle): string {
  const routeCount = bundle.routeMap.routes.length;
  const screenCount = bundle.screenInventory.screens.length;
  const dsagStatus = bundle.dsag.integrity.status;
  return `
    <div class="grid cols-3">
      ${metric("Readiness score", bundle.readiness.score, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
      ${metric("Routes", routeCount)}
      ${metric("Screens", screenCount)}
      ${metric("DSAG nodes", bundle.dsag.nodes.length, statusTone(dsagStatus))}
      ${metric("Simulation routes", bundle.buildSimulation.routeSimulation?.routes?.length ?? 0, statusTone(bundle.buildSimulation.status))}
      ${metric("Manifest artifacts", bundle.manifest.artifact_index?.length ?? 0)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Warnings", list(bundle.readiness.warnings))}
      ${panel("Human Review", list(bundle.readiness.requiredHumanReview))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Product Model", code(bundle.productModel))}
      ${panel("Validation", code({ status: bundle.schemaValidation.status, checks: bundle.schemaValidation.checks.length, blockers: bundle.schemaValidation.blockers.length }))}
    </div>
  `;
}

function list(items: unknown[]): string {
  if (!items || items.length === 0) return `<div class="empty">None.</div>`;
  return `<div class="list">${items.map((item) => `<div class="list-button">${esc(typeof item === "string" ? item : JSON.stringify(item))}</div>`).join("")}</div>`;
}

function artifactKind(filePath: string): string {
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "yaml";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".css")) return "css";
  if (filePath.endsWith(".ts")) return "typescript";
  return "text";
}

function artifactArea(filePath: string): { group: string; nodeId: string | null } {
  if (filePath.startsWith("01-evidence/")) return { group: "Evidence", nodeId: "evidence" };
  if (filePath === "02-product-model/product-model.json") return { group: "Product Model", nodeId: "productModel" };
  if (filePath === "02-product-model/user-model.json" || filePath === "02-product-model/role-model.json" || filePath === "02-product-model/permission-matrix.json") {
    return { group: "User Model", nodeId: "userModel" };
  }
  if (filePath === "02-product-model/entity-model.json" || filePath === "02-product-model/entity-lifecycle.json") {
    return { group: "Entity Model", nodeId: "entityModel" };
  }
  if (filePath === "03-experience-architecture/route-map.json") return { group: "Route Map", nodeId: "routeMap" };
  if (filePath === "03-experience-architecture/screen-inventory.json") return { group: "Screen Inventory", nodeId: "screenInventory" };
  if (filePath === "03-experience-architecture/dsag.json") return { group: "DSAG", nodeId: "dsag" };
  if (filePath.startsWith("03-experience-architecture/")) return { group: "Experience Architecture", nodeId: "routeMap" };
  if (filePath.startsWith("05-screen-specs/")) return { group: "Screen Specs", nodeId: "screenSpecs" };
  if (filePath === "04-design-system/components/component-registry.json") return { group: "Component Registry", nodeId: "componentRegistry" };
  if (filePath === "04-design-system/patterns/pattern-registry.json") return { group: "Pattern Registry", nodeId: "patternRegistry" };
  if (filePath.startsWith("04-design-system/")) return { group: "Design System", nodeId: "designSystem" };
  if (filePath === "06-frontend-agent-contract/data-contracts.json") return { group: "Data Contracts", nodeId: "dataContracts" };
  if (filePath.startsWith("06-frontend-agent-contract/")) return { group: "Frontend Contract", nodeId: "frontendContract" };
  if (filePath === "00-manifest/implementation-readiness.json" || filePath.startsWith("08-quality/")) return { group: "Readiness", nodeId: "readiness" };
  if (filePath.startsWith("10-revision/")) return { group: "Revision", nodeId: "revision" };
  if (filePath.startsWith("11-build-simulation/")) return { group: "Build Simulation", nodeId: "frontendContract" };
  if (filePath.startsWith("09-schemas/")) return { group: "Schemas", nodeId: null };
  return { group: "Package", nodeId: null };
}

function snapshotFromBundle(bundle: Bundle, name: string): PackageSnapshot {
  return {
    name,
    projectSlug: String(bundle.manifest.project_slug ?? "package"),
    sourceHash: String(bundle.manifest.source_hash ?? ""),
    generatedAt: String(bundle.manifest.generated_at ?? bundle.generatedAt),
    readinessScore: bundle.readiness.score,
    readyForFrontendAgent: bundle.readiness.readyForFrontendAgent,
    blockers: bundle.readiness.blockers ?? [],
    warnings: bundle.readiness.warnings ?? [],
    routes: bundle.routeMap.routes.map((route) => String(route.route ?? "")),
    screens: bundle.screens.map((screen) => screen.name),
    components: bundle.componentRegistry.components.map((component) => String(component.name ?? "")),
    patterns: bundle.patternRegistry.patterns.map((pattern) => String(pattern.name ?? "")),
    artifacts: (bundle.artifacts ?? []).slice().sort((a, b) => a.path.localeCompare(b.path))
  };
}

function currentSnapshot(bundle: Bundle): PackageSnapshot {
  return snapshotFromBundle(bundle, state.packageName || "current-package");
}

function formatBytes(value: number | null): string {
  if (value === null) return "";
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

function diffTone(status: ArtifactDiff["status"]): "success" | "warning" | "danger" | "neutral" {
  if (status === "unchanged") return "success";
  if (status === "added") return "success";
  if (status === "removed") return "danger";
  return "warning";
}

function compareStringSets(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: after.filter((value) => !beforeSet.has(value)),
    removed: before.filter((value) => !afterSet.has(value))
  };
}

function computeArtifactDiffs(current: PackageSnapshot, baseline: PackageSnapshot | null): ArtifactDiff[] {
  if (!baseline) return [];
  const before = new Map(baseline.artifacts.map((artifact) => [artifact.path, artifact]));
  const after = new Map(current.artifacts.map((artifact) => [artifact.path, artifact]));
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  const order: Record<ArtifactDiff["status"], number> = { changed: 0, added: 1, removed: 2, unchanged: 3 };
  return paths.map((pathName) => {
    const beforeArtifact = before.get(pathName);
    const afterArtifact = after.get(pathName);
    const area = artifactArea(pathName);
    const status: ArtifactDiff["status"] = !beforeArtifact
      ? "added"
      : !afterArtifact
        ? "removed"
        : beforeArtifact.hash !== afterArtifact.hash || beforeArtifact.bytes !== afterArtifact.bytes
          ? "changed"
          : "unchanged";
    return {
      path: pathName,
      status,
      group: area.group,
      nodeId: area.nodeId,
      beforeHash: beforeArtifact?.hash ?? null,
      afterHash: afterArtifact?.hash ?? null,
      beforeBytes: beforeArtifact?.bytes ?? null,
      afterBytes: afterArtifact?.bytes ?? null
    };
  }).sort((a, b) => order[a.status] - order[b.status] || a.group.localeCompare(b.group) || a.path.localeCompare(b.path));
}

function changedNodeIds(diffs: ArtifactDiff[]): string[] {
  return [...new Set(diffs.filter((diff) => diff.status !== "unchanged").map((diff) => diff.nodeId).filter((value): value is string => Boolean(value) && value !== "revision"))];
}

function triggerForNode(nodeId: string): string | null {
  const triggers: Record<string, string> = {
    evidence: "evidence_changed",
    productModel: "product_model_changed",
    routeMap: "route_map_changed",
    screenInventory: "route_map_changed",
    screenSpecs: "screen_spec_changed",
    componentRegistry: "component_registry_changed",
    patternRegistry: "component_registry_changed",
    dataContracts: "data_contract_changed",
    designSystem: "accessibility_rule_changed"
  };
  return triggers[nodeId] ?? null;
}

function computeImpactRecords(bundle: Bundle, nodes: string[]): ImpactRecord[] {
  const edges = bundle.revision.dependencyGraph?.edges ?? [];
  const records = new Map<string, ImpactRecord>();
  const queue = nodes.map((node) => ({ node, source: node, depth: 0, reason: "Changed artifact." }));
  const seen = new Set<string>();
  for (const node of nodes) {
    records.set(`changed:${node}`, { artifact: node, source: node, reason: "Artifact content changed.", depth: 0, type: "changed" });
  }
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const visitKey = `${item.source}:${item.node}:${item.depth}`;
    if (seen.has(visitKey)) continue;
    seen.add(visitKey);
    for (const edge of edges.filter((candidate: any) => candidate.from === item.node)) {
      const depth = item.depth + 1;
      const key = `edge:${item.source}:${edge.to}`;
      const existing = records.get(key);
      if (!existing || depth < existing.depth) {
        records.set(key, {
          artifact: edge.to,
          source: item.source,
          reason: edge.reason ?? "Downstream dependency.",
          depth,
          type: "downstream"
        });
      }
      queue.push({ node: edge.to, source: item.source, depth, reason: edge.reason ?? "Downstream dependency." });
    }
  }
  const rules = bundle.revision.invalidationRules?.rules ?? [];
  for (const node of nodes) {
    const trigger = triggerForNode(node);
    if (!trigger) continue;
    for (const rule of rules.filter((candidate: any) => candidate.trigger === trigger)) {
      for (const artifact of rule.invalidates ?? []) {
        records.set(`rule:${node}:${artifact}`, {
          artifact,
          source: node,
          reason: rule.reason ?? trigger,
          depth: 1,
          type: "rule"
        });
      }
    }
  }
  return [...records.values()].sort((a, b) => a.depth - b.depth || a.artifact.localeCompare(b.artifact));
}

function artifactRequirementsForNode(nodeId: string): string[] {
  const requirements: Record<string, string[]> = {
    evidence: ["01-evidence/evidence-ledger.json"],
    productModel: ["02-product-model/product-model.json"],
    userModel: ["02-product-model/user-model.json"],
    entityModel: ["02-product-model/entity-model.json"],
    routeMap: ["03-experience-architecture/route-map.json"],
    screenInventory: ["03-experience-architecture/screen-inventory.json"],
    screenSpecs: ["05-screen-specs/"],
    componentRegistry: ["04-design-system/components/component-registry.json"],
    patternRegistry: ["04-design-system/patterns/pattern-registry.json"],
    designSystem: ["04-design-system/"],
    dataContracts: ["06-frontend-agent-contract/data-contracts.json"],
    frontendContract: ["06-frontend-agent-contract/"],
    dsag: ["03-experience-architecture/dsag.json"],
    readiness: ["00-manifest/implementation-readiness.json", "08-quality/"]
  };
  return requirements[nodeId] ?? [nodeId];
}

function pathMatchesRequirement(pathName: string, requirement: string): boolean {
  return pathName === requirement || pathName.startsWith(requirement) || requirement.startsWith(pathName);
}

function gatesForReview(bundle: Bundle, diffs: ArtifactDiff[], impactRecords: ImpactRecord[]): Array<Record<string, any>> {
  const changedPaths = diffs.filter((diff) => diff.status !== "unchanged").map((diff) => diff.path);
  const impactedPaths = impactRecords.flatMap((record) => artifactRequirementsForNode(record.artifact));
  const reviewPaths = [...changedPaths, ...impactedPaths];
  return (bundle.revision.approvalGates?.gates ?? []).filter((gate: any) =>
    (gate.required_artifacts ?? []).some((required: string) => reviewPaths.some((pathName) => pathMatchesRequirement(pathName, required)))
  );
}

function packageOutputPath(): string {
  return state.packageName === "sample-package" ? "tmp/archetype-output" : "<path-to-archetype-output>";
}

function handoffCommands(): Array<{ label: string; command: string }> {
  const outputPath = packageOutputPath();
  return [
    { label: "Validate package", command: `node dist/cli.js validate --out ${outputPath}` },
    { label: "Simulate frontend contract", command: `node dist/cli.js simulate --out ${outputPath}` },
    { label: "Regenerate sample package", command: "npm run smoke" },
    { label: "Run full compiler checks", command: "npm run check" }
  ];
}

function requiredHandoffArtifacts(bundle: Bundle): Array<{ path: string; label: string; present: boolean }> {
  const index = new Set((bundle.manifest.artifact_index ?? []) as string[]);
  const required = [
    ["00-manifest/manifest.json", "Manifest"],
    ["00-manifest/implementation-readiness.json", "Readiness report"],
    ["00-manifest/package-summary.md", "Package summary"],
    ["01-evidence/evidence-ledger.json", "Evidence ledger"],
    ["02-product-model/product-model.json", "Product model"],
    ["03-experience-architecture/route-map.json", "Route map"],
    ["03-experience-architecture/screen-inventory.json", "Screen inventory"],
    ["04-design-system/components/component-registry.json", "Component registry"],
    ["04-design-system/patterns/pattern-registry.json", "Pattern registry"],
    ["06-frontend-agent-contract/build-manifest.json", "Build manifest"],
    ["06-frontend-agent-contract/data-contracts.json", "Data contracts"],
    ["06-frontend-agent-contract/frontend-agent-instructions.md", "Frontend agent instructions"],
    ["03-experience-architecture/dsag.json", "DSAG graph"],
    ["08-quality/export-readiness-checklist.md", "Export readiness checklist"],
    ["11-build-simulation/frontend-build-simulation-report.md", "Build simulation report"]
  ];
  return required.map(([path, label]) => ({ path, label, present: index.has(path) }));
}

function approvalStateForGate(gate: any): string {
  return state.approvalOverrides[gate.id]?.state ?? gate.approval_state ?? "pending_human_review";
}

function handoffPrompt(bundle: Bundle): string {
  const required = requiredHandoffArtifacts(bundle).filter((artifact) => artifact.present).map((artifact) => `- ${artifact.path}`).join("\n");
  return [
    `You are building from the Archetype package for ${bundle.productModel.product_name ?? bundle.manifest.project_slug}.`,
    "",
    "Use the package as the source of truth. Build only the routes, screens, components, patterns, tokens, data contracts, states, and acceptance criteria declared in the package.",
    "",
    "Required starting artifacts:",
    required,
    "",
    "Do not invent new routes, visual styles, components, or backend behavior when the package is missing a required decision. Report a gap instead.",
    "",
    `Readiness score: ${bundle.readiness.score}`,
    `Ready for frontend agent: ${bundle.readiness.readyForFrontendAgent}`,
    `Source hash: ${bundle.manifest.source_hash ?? "unknown"}`,
    "",
    "Run validation before handoff:",
    handoffCommands().slice(0, 2).map((item) => `- ${item.command}`).join("\n")
  ].join("\n");
}

function handoffMarkdown(bundle: Bundle): string {
  const gates = bundle.revision.approvalGates?.gates ?? [];
  const required = requiredHandoffArtifacts(bundle);
  return [
    `# Archetype Handoff: ${bundle.productModel.product_name ?? bundle.manifest.project_slug}`,
    "",
    `Generated: ${bundle.manifest.generated_at ?? bundle.generatedAt}`,
    `Package ID: ${bundle.manifest.package_id ?? "unknown"}`,
    `Source hash: ${bundle.manifest.source_hash ?? "unknown"}`,
    `Export target: ${bundle.manifest.export_target ?? "unknown"}`,
    `Readiness score: ${bundle.readiness.score}`,
    `Ready for frontend agent: ${bundle.readiness.readyForFrontendAgent}`,
    "",
    "## Blockers",
    ...(bundle.readiness.blockers.length ? bundle.readiness.blockers.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Warnings",
    ...(bundle.readiness.warnings.length ? bundle.readiness.warnings.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Approval Gates",
    ...gates.map((gate: any) => `- ${gate.label}: ${approvalStateForGate(gate)}`),
    "",
    "## Required Handoff Artifacts",
    ...required.map((artifact) => `- ${artifact.present ? "present" : "missing"}: ${artifact.path}`),
    "",
    "## Commands",
    ...handoffCommands().map((item) => `- ${item.label}: ${item.command}`),
    "",
    "## Frontend Agent Prompt",
    "",
    handoffPrompt(bundle)
  ].join("\n");
}

function handoffJson(bundle: Bundle): Record<string, unknown> {
  return {
    generatedAt: new Date().toISOString(),
    packageName: state.packageName,
    manifest: bundle.manifest,
    readiness: bundle.readiness,
    approvalGates: (bundle.revision.approvalGates?.gates ?? []).map((gate: any) => ({
      id: gate.id,
      label: gate.label,
      state: approvalStateForGate(gate),
      requiredArtifacts: gate.required_artifacts ?? [],
      note: state.approvalOverrides[gate.id]?.note ?? ""
    })),
    requiredArtifacts: requiredHandoffArtifacts(bundle),
    artifactDigests: bundle.artifacts ?? [],
    commands: handoffCommands(),
    frontendAgentPrompt: handoffPrompt(bundle)
  };
}

function downloadText(fileName: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function defaultIntakeFromBundle(bundle: Bundle): Record<string, unknown> {
  return {
    projectName: bundle.productModel.product_name ?? "Archetype Project",
    context: `${bundle.productModel.product_type ?? "Product"}: ${bundle.productModel.primary_goal ?? "Generate product architecture."}`,
    goals: (bundle.productModel.core_jobs ?? []).map((job: any) => job.job).filter(Boolean),
    businessGoals: bundle.productModel.business_goals ?? [],
    users: bundle.productModel.primary_users ?? [],
    brand: {
      attributes: ["clear", "precise", "trustworthy"],
      primaryColor: "#2563EB",
      tone: "Clear, direct, and low-hype."
    },
    operatingMode: bundle.manifest.operating_mode ?? "full_architecture"
  };
}

function ensureGenerationDraft(bundle: Bundle): string {
  if (!state.generationDraft) {
    state.generationDraft = pretty(defaultIntakeFromBundle(bundle));
  }
  return state.generationDraft;
}

function intakeFileName(value: Record<string, unknown>): string {
  const projectName = String(value.projectName ?? "custom-project");
  return `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-project"}-intake.json`;
}

function parseGenerationDraft(): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const value = JSON.parse(state.generationDraft);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "Draft must be a JSON object." };
    }
    const record = value as Record<string, unknown>;
    if (typeof record.context !== "string" || record.context.trim().length === 0) {
      return { ok: false, error: "Draft requires a non-empty context field." };
    }
    return { ok: true, value: record };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}

async function copyTextToClipboard(value: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const text = document.createElement("textarea");
  text.value = value;
  text.style.position = "fixed";
  text.style.left = "-9999px";
  document.body.appendChild(text);
  text.focus();
  text.select();
  document.execCommand("copy");
  text.remove();
}

function renderGeneration(bundle: Bundle): string {
  const draft = ensureGenerationDraft(bundle);
  const parsed = parseGenerationDraft();
  const fileName = parsed.ok ? intakeFileName(parsed.value) : "custom-project-intake.json";
  const command = `node dist/cli.js generate --input examples/${fileName} --out tmp/${fileName.replace("-intake.json", "-output")}`;
  return `
    <div class="grid cols-2">
      ${panel("Generation Draft", `
        ${textArea("generation-draft", draft, "Intake JSON")}
        <div class="control-row">
          <button class="button primary" id="validate-draft" type="button">Validate draft</button>
          <button class="button" id="reset-draft" type="button">Use current package</button>
          <button class="button" id="download-draft" type="button">Download intake</button>
        </div>
        ${state.generationMessage ? `<div class="notice">${esc(state.generationMessage)}</div>` : ""}
      `)}
      ${panel("Run Command", `
        ${parsed.ok ? badge("draft valid", "success") : badge("draft invalid", "danger")}
        <div style="height:10px"></div>
        ${parsed.ok ? code(command) : `<div class="empty">${esc(parsed.error)}</div>`}
        <div class="control-row">
          <button class="button" id="copy-command" type="button" ${parsed.ok ? "" : "disabled"}>Copy command</button>
        </div>
      `)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Generation Contract", code({
        required: ["context"],
        recommended: ["projectName", "goals", "businessGoals", "users", "brand", "operatingMode"],
        supportedModes: ["fast_architecture", "full_architecture", "existing_product_audit", "contract_repair"]
      }))}
      ${panel("Current Package Seed", code(defaultIntakeFromBundle(bundle)))}
    </div>
  `;
}

function renderEvidence(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Sources", table(["Source", "Type", "Confidence"], (bundle.evidence.sources ?? []).map((source: any) => [
        esc(source.source_label),
        esc(source.source_type),
        badge(source.confidence, source.confidence === "high" ? "success" : source.confidence === "medium" ? "warning" : "neutral")
      ])))}
      ${panel("Source Analysis", code(bundle.sourceAnalysis))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Decisions", table(["Decision", "Status", "Confidence"], (bundle.evidence.decisions ?? []).map((decision: any) => [
        esc(decision.decision),
        badge(decision.status, decision.status === "accepted" ? "success" : "warning"),
        esc(decision.confidence)
      ])))}
      ${panel("Risks", list(bundle.evidence.risks ?? []))}
    </div>
  `;
}

function renderArchitecture(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Routes", table(["Route", "Screen", "Layout", "Priority"], bundle.routeMap.routes.map((route) => [
        `<code>${esc(route.route)}</code>`,
        esc(route.screen_id),
        esc(route.layout),
        badge(route.priority, route.priority === "primary" ? "success" : "neutral")
      ])))}
      ${panel("Screen Inventory", table(["Screen", "Priority", "Patterns"], bundle.screenInventory.screens.map((screen) => [
        esc(screen.screen_id),
        badge(screen.priority, screen.priority === "P0" ? "success" : "neutral"),
        esc((screen.required_patterns ?? []).join(", "))
      ])))}
    </div>
    <div style="margin-top:14px">
      ${panel("Information Shape", code({ userModel: bundle.userModel, acceptanceCriteria: bundle.acceptanceCriteria.criteria.length }))}
    </div>
  `;
}

function renderDSAG(bundle: Bundle): string {
  const checks = bundle.dsag.integrity.checks.slice(0, 90);
  return `
    <div class="grid cols-3">
      ${metric("Integrity", bundle.dsag.integrity.status, statusTone(bundle.dsag.integrity.status))}
      ${metric("Nodes", bundle.dsag.nodes.length)}
      ${metric("Edges", bundle.dsag.edges.length)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Integrity Checks", table(["Check", "Status"], checks.map((check) => [
        esc(check.id),
        badge(check.status, statusTone(check.status))
      ])))}
      ${panel("Graph Sample", code({ nodes: bundle.dsag.nodes.slice(0, 12), edges: bundle.dsag.edges.slice(0, 12) }))}
    </div>
  `;
}

function renderScreens(bundle: Bundle): string {
  const filtered = bundle.screens.filter((screen) =>
    screen.name.toLowerCase().includes(state.screenFilter.toLowerCase())
  );
  const selected = filtered.find((screen) => screen.name === state.selectedScreen) ?? filtered[0] ?? null;
  if (selected && state.selectedScreen !== selected.name) state.selectedScreen = selected.name;
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>Screens</h2></div>
        <div class="panel-body">
          <input class="search" id="screen-filter" value="${esc(state.screenFilter)}" placeholder="Filter screens" />
          <div class="list" style="margin-top:10px">
            ${filtered.map((screen) => `
              <button class="list-button ${selected?.name === screen.name ? "active" : ""}" data-screen="${esc(screen.name)}">
                ${esc(screen.name)}
              </button>
            `).join("")}
          </div>
        </div>
      </section>
      ${panel(selected ? selected.path : "Screen", selected ? code(selected.content) : `<div class="empty">No matching screen.</div>`)}
    </div>
  `;
}

function renderDesign(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Components", table(["Component", "Category", "Screens"], bundle.componentRegistry.components.map((component) => [
        esc(component.name),
        esc(component.category),
        esc((component.used_on_screens ?? []).join(", ") || "none")
      ])))}
      ${panel("Patterns", table(["Pattern", "Screens", "Data"], bundle.patternRegistry.patterns.map((pattern) => [
        esc(pattern.name),
        esc((pattern.used_on_screens ?? []).join(", ") || "none"),
        esc((pattern.data_requirements ?? []).join(", "))
      ])))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Semantic Tokens", code(bundle.semanticTokens))}
      ${panel("Primitive Tokens", code(bundle.primitiveTokens))}
    </div>
  `;
}

function renderContract(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Build Manifest", code(bundle.buildManifest))}
      ${panel("Data Contracts", code(bundle.dataContracts))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Component Usage", code(bundle.componentUsageMap))}
      ${panel("Acceptance Criteria", code(bundle.acceptanceCriteria))}
    </div>
  `;
}

function renderSimulation(bundle: Bundle): string {
  return `
    <div class="grid cols-3">
      ${metric("Simulation", bundle.buildSimulation.status ?? "warning", statusTone(bundle.buildSimulation.status))}
      ${metric("Routes", bundle.buildSimulation.routeSimulation?.routes?.length ?? 0)}
      ${metric("Screens", bundle.buildSimulation.stateCoverage?.screens?.length ?? 0)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Simulation Report", code(bundle.buildSimulation.report))}
      ${panel("Route Simulation", code(bundle.buildSimulation.routeSimulation))}
      ${panel("Component Resolution", code(bundle.buildSimulation.componentResolution))}
      ${panel("Data Coverage", code(bundle.buildSimulation.dataContractCoverage))}
    </div>
  `;
}

function renderImpact(bundle: Bundle): string {
  const current = currentSnapshot(bundle);
  const baseline = state.baselineSnapshot;
  const diffs = computeArtifactDiffs(current, baseline);
  const changedDiffs = diffs.filter((diff) => diff.status !== "unchanged");
  const nodes = changedNodeIds(diffs);
  const activeTriggers = new Set(nodes.map(triggerForNode).filter((value): value is string => Boolean(value)));
  const impactRecords = baseline ? computeImpactRecords(bundle, nodes) : [];
  const reviewGates = baseline ? gatesForReview(bundle, diffs, impactRecords) : [];
  const addedRoutes = baseline ? compareStringSets(baseline.routes, current.routes).added : [];
  const removedRoutes = baseline ? compareStringSets(baseline.routes, current.routes).removed : [];
  const addedScreens = baseline ? compareStringSets(baseline.screens, current.screens).added : [];
  const removedScreens = baseline ? compareStringSets(baseline.screens, current.screens).removed : [];
  const addedComponents = baseline ? compareStringSets(baseline.components, current.components).added : [];
  const removedComponents = baseline ? compareStringSets(baseline.components, current.components).removed : [];
  const changed = diffs.filter((diff) => diff.status === "changed").length;
  const added = diffs.filter((diff) => diff.status === "added").length;
  const removed = diffs.filter((diff) => diff.status === "removed").length;
  const unchanged = diffs.filter((diff) => diff.status === "unchanged").length;
  return `
    <div class="grid cols-3">
      ${metric("Changed artifacts", changed + added + removed, changed + added + removed === 0 ? "success" : "warning")}
      ${metric("Impacted artifacts", impactRecords.length, impactRecords.length === 0 ? "success" : "warning")}
      ${metric("Review gates", reviewGates.length, reviewGates.length === 0 ? "success" : "warning")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Baseline", `
        <div class="snapshot-line">
          <div>
            <h3>${esc(baseline?.name ?? "No baseline captured")}</h3>
            <div class="muted">${esc(baseline ? `${baseline.projectSlug} · score ${baseline.readinessScore} · ${baseline.artifacts.length} artifacts` : "Capture the active package or import a previous package folder.")}</div>
          </div>
          ${baseline ? badge(baseline.sourceHash.slice(0, 8) || "snapshot", "neutral") : badge("empty", "warning")}
        </div>
        <div class="control-row">
          <button class="button primary" id="capture-baseline" type="button">Capture current</button>
          <button class="button" id="import-baseline" type="button">Import baseline</button>
          <button class="button" id="clear-baseline" type="button" ${baseline ? "" : "disabled"}>Clear baseline</button>
          <input id="baseline-input" type="file" webkitdirectory multiple hidden />
        </div>
        ${state.impactMessage ? `<div class="notice">${esc(state.impactMessage)}</div>` : ""}
      `)}
      ${panel("Package Delta", baseline ? code({
        baseline: {
          name: baseline.name,
          sourceHash: baseline.sourceHash,
          readinessScore: baseline.readinessScore,
          readyForFrontendAgent: baseline.readyForFrontendAgent,
          warnings: baseline.warnings.length,
          blockers: baseline.blockers.length
        },
        current: {
          name: current.name,
          sourceHash: current.sourceHash,
          readinessScore: current.readinessScore,
          readyForFrontendAgent: current.readyForFrontendAgent,
          warnings: current.warnings.length,
          blockers: current.blockers.length
        },
        routes: { added: addedRoutes, removed: removedRoutes },
        screens: { added: addedScreens, removed: removedScreens },
        components: { added: addedComponents, removed: removedComponents },
        artifacts: { changed, added, removed, unchanged }
      }) : `<div class="empty">No baseline selected.</div>`)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Artifact Changes", baseline ? table(["Status", "Area", "Artifact", "Before", "After"], changedDiffs.slice(0, 120).map((diff) => [
        badge(diff.status, diffTone(diff.status)),
        esc(diff.group),
        `<code>${esc(diff.path)}</code>`,
        esc(formatBytes(diff.beforeBytes)),
        esc(formatBytes(diff.afterBytes))
      ])) : `<div class="empty">Capture or import a baseline to compare artifacts.</div>`)}
      ${panel("Impact Chain", baseline ? table(["Type", "Source", "Artifact", "Depth"], impactRecords.slice(0, 120).map((record) => [
        badge(record.type, record.type === "changed" ? "warning" : "neutral"),
        esc(record.source),
        esc(record.artifact),
        esc(record.depth)
      ])) : `<div class="empty">Impact analysis requires a baseline.</div>`)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Revision Review Set", baseline ? table(["Gate", "State", "Required Artifacts"], reviewGates.map((gate: any) => {
        const override = state.approvalOverrides[gate.id];
        const approvalState = override?.state ?? gate.approval_state;
        return [
          esc(gate.label),
          badge(approvalState, approvalState === "approved" ? "success" : approvalState === "blocked" ? "danger" : "warning"),
          esc((gate.required_artifacts ?? []).join(", "))
        ];
      })) : `<div class="empty">No baseline selected.</div>`)}
      ${panel("Invalidation Rules", baseline ? table(["Trigger", "Invalidates"], (bundle.revision.invalidationRules?.rules ?? [])
        .filter((rule: any) => activeTriggers.has(rule.trigger))
        .map((rule: any) => [
          esc(rule.trigger),
          esc((rule.invalidates ?? []).join(", "))
        ])) : `<div class="empty">No invalidation rules evaluated.</div>`)}
    </div>
  `;
}

function renderExport(bundle: Bundle): string {
  const required = requiredHandoffArtifacts(bundle);
  const present = required.filter((artifact) => artifact.present).length;
  const gates = bundle.revision.approvalGates?.gates ?? [];
  const approved = gates.filter((gate: any) => approvalStateForGate(gate) === "approved").length;
  const commands = handoffCommands();
  return `
    <div class="grid cols-3">
      ${metric("Readiness", bundle.readiness.score, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
      ${metric("Required files", `${present}/${required.length}`, present === required.length ? "success" : "danger")}
      ${metric("Approved gates", `${approved}/${gates.length}`, approved === gates.length ? "success" : "warning")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Handoff Actions", `
        <div class="snapshot-line">
          <div>
            <h3>${esc(bundle.productModel.product_name ?? bundle.manifest.project_slug)}</h3>
            <div class="muted">${esc(`${bundle.manifest.export_target ?? "export"} · ${bundle.manifest.artifact_index?.length ?? 0} artifacts · ${bundle.artifacts?.length ?? 0} digests`)}</div>
          </div>
          ${badge(bundle.readiness.readyForFrontendAgent ? "ready" : "hold", bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
        </div>
        <div class="control-row">
          <button class="button primary" id="download-handoff-md" type="button">Download handoff</button>
          <button class="button" id="download-handoff-json" type="button">Download handoff JSON</button>
          <button class="button" id="copy-handoff-prompt" type="button">Copy agent prompt</button>
          <button class="button" id="copy-validate-command" type="button">Copy validation command</button>
        </div>
        ${state.handoffMessage ? `<div class="notice">${esc(state.handoffMessage)}</div>` : ""}
      `)}
      ${panel("Handoff Commands", table(["Command", "Run"], commands.map((item) => [
        esc(item.label),
        `<code>${esc(item.command)}</code>`
      ])))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Required Files", table(["Status", "Artifact", "Label"], required.map((artifact) => [
        badge(artifact.present ? "present" : "missing", artifact.present ? "success" : "danger"),
        `<code>${esc(artifact.path)}</code>`,
        esc(artifact.label)
      ])))}
      ${panel("Approval Summary", table(["Gate", "State", "Artifacts"], gates.map((gate: any) => {
        const approvalState = approvalStateForGate(gate);
        return [
          esc(gate.label),
          badge(approvalState, approvalState === "approved" ? "success" : approvalState === "blocked" ? "danger" : "warning"),
          esc((gate.required_artifacts ?? []).join(", "))
        ];
      })))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Frontend Agent Prompt", code(handoffPrompt(bundle)))}
      ${panel("Readiness Report", code(bundle.reports.readiness))}
    </div>
  `;
}

function renderRevision(bundle: Bundle): string {
  const gates = bundle.revision.approvalGates?.gates ?? [];
  return `
    <div class="grid cols-2">
      ${panel("Approval Gates", `
        <div class="list">
          ${gates.map((gate: any) => {
            const override = state.approvalOverrides[gate.id];
            const approvalState = override?.state ?? gate.approval_state;
            return `
              <div class="gate-row">
                <div>
                  <h3>${esc(gate.label)}</h3>
                  <div class="muted">${esc((gate.required_artifacts ?? []).join(", "))}</div>
                  ${override?.note ? `<div class="gate-note">${esc(override.note)}</div>` : ""}
                </div>
                <div class="gate-actions">
                  ${badge(approvalState, approvalState === "approved" ? "success" : approvalState === "blocked" ? "danger" : "warning")}
                  <button class="button small" data-gate="${esc(gate.id)}" data-approval-state="approved" type="button">Approve</button>
                  <button class="button small" data-gate="${esc(gate.id)}" data-approval-state="changes_requested" type="button">Request changes</button>
                  <button class="button small" data-gate="${esc(gate.id)}" data-approval-state="blocked" type="button">Block</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div style="height:10px"></div>
        ${textArea("gate-note", state.activeGateNote, "Approval note for the next gate action")}
        <div class="control-row">
          <button class="button" id="reset-gates" type="button">Reset local gate states</button>
        </div>
      `)}
      ${panel("Initial Change Set", code(bundle.revision.initialChangeSet))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Invalidation Rules", code(bundle.revision.invalidationRules))}
      ${panel("Revision Protocol", code(bundle.revision.protocol))}
    </div>
  `;
}

function renderContent(bundle: Bundle): string {
  switch (state.view) {
    case "overview":
      return renderOverview(bundle);
    case "generation":
      return renderGeneration(bundle);
    case "evidence":
      return renderEvidence(bundle);
    case "architecture":
      return renderArchitecture(bundle);
    case "dsag":
      return renderDSAG(bundle);
    case "screens":
      return renderScreens(bundle);
    case "design":
      return renderDesign(bundle);
    case "contract":
      return renderContract(bundle);
    case "simulation":
      return renderSimulation(bundle);
    case "impact":
      return renderImpact(bundle);
    case "export":
      return renderExport(bundle);
    case "revision":
      return renderRevision(bundle);
  }
}

function render(): void {
  const bundle = state.bundle;
  if (!bundle) {
    app.innerHTML = `<main class="main"><div class="empty">Package unavailable.</div></main>`;
    return;
  }
  const viewLabel = views.find((view) => view.id === state.view)?.label ?? "Overview";
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="mark">A</div>
          <div>
            <div class="brand-title">Archetype</div>
            <div class="brand-subtitle">Architecture Workbench</div>
          </div>
        </div>
        <div class="package-tools">
          <button class="button primary" id="load-sample" type="button">Load sample</button>
          <button class="button" id="import-folder" type="button">Import package</button>
          <input id="folder-input" type="file" webkitdirectory multiple hidden />
        </div>
        <nav class="nav" aria-label="Workbench views">
          ${views.map((view) => `
            <button class="nav-item ${state.view === view.id ? "active" : ""}" data-view="${view.id}" type="button">
              <span>${esc(view.label)}</span>
              <span class="nav-count">${esc(view.count(bundle))}</span>
            </button>
          `).join("")}
        </nav>
        <div class="footer-note">${esc(state.packageName)} · ${esc(bundle.manifest.project_slug ?? "package")}</div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <div class="eyebrow">${esc(viewLabel)}</div>
            <h1>${esc(bundle.productModel.product_name ?? "Archetype Package")}</h1>
            <div class="meta-line">${esc(bundle.productModel.product_type ?? "")} · ${esc(bundle.manifest.operating_mode ?? "")}</div>
          </div>
          <div class="status-strip">
            ${badge(`score ${bundle.readiness.score}`, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
            ${badge(bundle.readiness.readyForFrontendAgent ? "ready" : "blocked", bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
            ${badge(`DSAG ${bundle.dsag.integrity.status}`, statusTone(bundle.dsag.integrity.status))}
            ${badge(`${bundle.readiness.warnings.length} warnings`, bundle.readiness.warnings.length ? "warning" : "success")}
          </div>
        </div>
        ${renderContent(bundle)}
      </main>
    </div>
  `;
  bindEvents();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view as ViewId;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedScreen = button.dataset.screen ?? null;
      render();
    });
  });
  document.querySelector<HTMLInputElement>("#screen-filter")?.addEventListener("input", (event) => {
    state.screenFilter = (event.target as HTMLInputElement).value;
    state.selectedScreen = null;
    render();
  });
  document.querySelector<HTMLTextAreaElement>("#generation-draft")?.addEventListener("input", (event) => {
    state.generationDraft = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelector<HTMLButtonElement>("#validate-draft")?.addEventListener("click", () => {
    const parsed = parseGenerationDraft();
    state.generationMessage = parsed.ok ? "Draft is valid JSON and includes context." : parsed.error;
    render();
  });
  document.querySelector<HTMLButtonElement>("#reset-draft")?.addEventListener("click", () => {
    if (state.bundle) state.generationDraft = pretty(defaultIntakeFromBundle(state.bundle));
    state.generationMessage = "Draft reset from the current package.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#download-draft")?.addEventListener("click", () => {
    const parsed = parseGenerationDraft();
    if (!parsed.ok) {
      state.generationMessage = parsed.error;
      render();
      return;
    }
    const fileName = intakeFileName(parsed.value);
    const blob = new Blob([`${pretty(parsed.value)}\n`], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    state.generationMessage = `Prepared ${fileName}.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#copy-command")?.addEventListener("click", async () => {
    const parsed = parseGenerationDraft();
    if (!parsed.ok) return;
    const fileName = intakeFileName(parsed.value);
    const command = `node dist/cli.js generate --input examples/${fileName} --out tmp/${fileName.replace("-intake.json", "-output")}`;
    await copyTextToClipboard(command);
    state.generationMessage = "Command copied.";
    render();
  });
  document.querySelector<HTMLTextAreaElement>("#gate-note")?.addEventListener("input", (event) => {
    state.activeGateNote = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelectorAll<HTMLButtonElement>("[data-gate]").forEach((button) => {
    button.addEventListener("click", () => {
      const gateId = button.dataset.gate;
      const approvalState = button.dataset.approvalState as ApprovalOverride["state"] | undefined;
      if (!gateId || !approvalState) return;
      state.approvalOverrides[gateId] = {
        state: approvalState,
        note: state.activeGateNote.trim(),
        updatedAt: new Date().toISOString()
      };
      saveApprovalOverrides();
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#reset-gates")?.addEventListener("click", () => {
    state.approvalOverrides = {};
    state.activeGateNote = "";
    saveApprovalOverrides();
    render();
  });
  document.querySelector<HTMLButtonElement>("#capture-baseline")?.addEventListener("click", () => {
    if (!state.bundle) return;
    state.baselineSnapshot = currentSnapshot(state.bundle);
    state.baselineName = state.baselineSnapshot.name;
    state.impactMessage = `Captured ${state.baselineSnapshot.artifacts.length} artifact digests.`;
    saveBaselineSnapshot();
    render();
  });
  document.querySelector<HTMLButtonElement>("#import-baseline")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#baseline-input")?.click();
  });
  document.querySelector<HTMLButtonElement>("#clear-baseline")?.addEventListener("click", () => {
    state.baselineSnapshot = null;
    state.baselineName = "";
    state.impactMessage = "Baseline cleared.";
    saveBaselineSnapshot();
    render();
  });
  document.querySelector<HTMLInputElement>("#baseline-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const baselineBundle = await bundleFromFiles([...input.files]);
      const packageName = input.files[0]?.webkitRelativePath?.split("/")[0] || "baseline-package";
      state.baselineSnapshot = snapshotFromBundle(baselineBundle, packageName);
      state.baselineName = packageName;
      state.impactMessage = `Imported baseline with ${state.baselineSnapshot.artifacts.length} artifact digests.`;
      saveBaselineSnapshot();
      input.value = "";
      render();
    }
  });
  document.querySelector<HTMLButtonElement>("#download-handoff-md")?.addEventListener("click", () => {
    if (!state.bundle) return;
    const slug = String(state.bundle.manifest.project_slug ?? "archetype-package");
    downloadText(`${slug}-handoff.md`, `${handoffMarkdown(state.bundle)}\n`, "text/markdown");
    state.handoffMessage = "Handoff markdown prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#download-handoff-json")?.addEventListener("click", () => {
    if (!state.bundle) return;
    const slug = String(state.bundle.manifest.project_slug ?? "archetype-package");
    downloadText(`${slug}-handoff.json`, `${pretty(handoffJson(state.bundle))}\n`, "application/json");
    state.handoffMessage = "Handoff JSON prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#copy-handoff-prompt")?.addEventListener("click", async () => {
    if (!state.bundle) return;
    await copyTextToClipboard(handoffPrompt(state.bundle));
    state.handoffMessage = "Frontend agent prompt copied.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#copy-validate-command")?.addEventListener("click", async () => {
    await copyTextToClipboard(handoffCommands()[0].command);
    state.handoffMessage = "Validation command copied.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#load-sample")?.addEventListener("click", () => loadSample());
  document.querySelector<HTMLButtonElement>("#import-folder")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#folder-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#folder-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      state.bundle = await bundleFromFiles([...input.files]);
      state.packageName = input.files[0]?.webkitRelativePath?.split("/")[0] || "imported-package";
      state.view = "overview";
      state.selectedScreen = null;
      state.generationDraft = "";
      state.generationMessage = "";
      state.activeGateNote = "";
      state.handoffMessage = "";
      loadApprovalOverrides();
      loadBaselineSnapshot();
      render();
    }
  });
}

async function loadSample(): Promise<void> {
  const response = await fetch("/sample-package.json");
  state.bundle = await response.json() as Bundle;
  state.packageName = "sample-package";
  loadApprovalOverrides();
  state.selectedScreen = null;
  state.generationDraft = "";
  state.generationMessage = "";
  state.activeGateNote = "";
  state.handoffMessage = "";
  loadBaselineSnapshot();
  render();
}

function approvalStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:approval:${slug}`;
}

function loadApprovalOverrides(): void {
  try {
    state.approvalOverrides = JSON.parse(localStorage.getItem(approvalStorageKey()) ?? "{}");
  } catch {
    state.approvalOverrides = {};
  }
}

function saveApprovalOverrides(): void {
  localStorage.setItem(approvalStorageKey(), JSON.stringify(state.approvalOverrides));
}

function baselineStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:baseline:${slug}`;
}

function loadBaselineSnapshot(): void {
  try {
    state.baselineSnapshot = JSON.parse(localStorage.getItem(baselineStorageKey()) ?? "null");
    state.baselineName = state.baselineSnapshot?.name ?? "";
    state.impactMessage = "";
  } catch {
    state.baselineSnapshot = null;
    state.baselineName = "";
  }
}

function saveBaselineSnapshot(): void {
  if (!state.baselineSnapshot) {
    localStorage.removeItem(baselineStorageKey());
    return;
  }
  localStorage.setItem(baselineStorageKey(), JSON.stringify(state.baselineSnapshot));
}

async function readFile(file: File): Promise<string> {
  return file.text();
}

async function hashFile(file: File): Promise<string> {
  if (!crypto.subtle) {
    const text = await file.text();
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function bundleFromFiles(files: File[]): Promise<Bundle> {
  const byPath = new Map<string, File>();
  for (const file of files) {
    const parts = (file.webkitRelativePath || file.name).split("/");
    const relative = parts.includes("00-manifest") ? parts.slice(parts.indexOf("00-manifest")).join("/") : parts.slice(1).join("/");
    byPath.set(relative || file.name, file);
  }
  const getText = async (path: string) => {
    const file = byPath.get(path);
    if (!file) throw new Error(`Missing ${path}`);
    return readFile(file);
  };
  const getJson = async (path: string) => JSON.parse(await getText(path));
  const screenEntries = [...byPath.entries()]
    .filter(([path]) => path.startsWith("05-screen-specs/") && path.endsWith(".yaml"))
    .sort(([a], [b]) => a.localeCompare(b));
  const screens = await Promise.all(screenEntries.map(async ([path, file]) => ({
    path,
    name: path.split("/").pop()?.replace(".yaml", "") ?? path,
    content: await readFile(file)
  })));
  const artifacts = await Promise.all([...byPath.entries()].map(async ([path, file]) => ({
    path,
    hash: await hashFile(file),
    bytes: file.size,
    kind: artifactKind(path)
  })));
  return {
    generatedAt: new Date().toISOString(),
    artifacts: artifacts.sort((a, b) => a.path.localeCompare(b.path)),
    manifest: await getJson("00-manifest/manifest.json"),
    readiness: await getJson("00-manifest/implementation-readiness.json"),
    schemaValidation: await getJson("00-manifest/schema-validation-report.json"),
    schemaIndex: await getJson("00-manifest/schema-index.json"),
    evidence: await getJson("01-evidence/evidence-ledger.json"),
    sourceAnalysis: await getJson("01-evidence/source-analysis-report.json"),
    productModel: await getJson("02-product-model/product-model.json"),
    userModel: await getJson("02-product-model/user-model.json"),
    routeMap: await getJson("03-experience-architecture/route-map.json"),
    screenInventory: await getJson("03-experience-architecture/screen-inventory.json"),
    dsag: await getJson("03-experience-architecture/dsag.json"),
    componentRegistry: await getJson("04-design-system/components/component-registry.json"),
    patternRegistry: await getJson("04-design-system/patterns/pattern-registry.json"),
    primitiveTokens: await getJson("04-design-system/tokens/primitive-tokens.json"),
    semanticTokens: await getJson("04-design-system/tokens/semantic-tokens.json"),
    buildManifest: await getJson("06-frontend-agent-contract/build-manifest.json"),
    componentUsageMap: await getJson("06-frontend-agent-contract/component-usage-map.json"),
    dataContracts: await getJson("06-frontend-agent-contract/data-contracts.json"),
    acceptanceCriteria: await getJson("06-frontend-agent-contract/acceptance-criteria.json"),
    buildSimulation: {
      buildPlan: await getJson("11-build-simulation/build-plan.json"),
      routeSimulation: await getJson("11-build-simulation/route-simulation.json"),
      componentResolution: await getJson("11-build-simulation/component-resolution.json"),
      patternResolution: await getJson("11-build-simulation/pattern-resolution.json"),
      stateCoverage: await getJson("11-build-simulation/state-coverage.json"),
      dataContractCoverage: await getJson("11-build-simulation/data-contract-coverage.json"),
      acceptanceSimulation: await getJson("11-build-simulation/acceptance-simulation.json"),
      report: await getText("11-build-simulation/frontend-build-simulation-report.md")
    },
    revision: {
      dependencyGraph: await getJson("10-revision/artifact-dependency-graph.json"),
      invalidationRules: await getJson("10-revision/invalidation-rules.json"),
      approvalGates: await getJson("10-revision/approval-gates.json"),
      initialChangeSet: await getJson("10-revision/initial-change-set.json"),
      protocol: await getText("10-revision/revision-protocol.md")
    },
    reports: {
      dsagIntegrity: await getText("08-quality/dsag-integrity-report.md"),
      consistency: await getText("08-quality/consistency-report.md"),
      accessibility: await getText("08-quality/accessibility-report.md"),
      safety: await getText("08-quality/safety-report.md"),
      readiness: await getText("08-quality/implementation-readiness-report.md")
    },
    screens
  };
}

loadSample().catch((error) => {
  app.innerHTML = `<main class="main"><div class="empty">${esc(error instanceof Error ? error.message : error)}</div></main>`;
});
