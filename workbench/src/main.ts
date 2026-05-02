import "./styles.css";

type ViewId =
  | "overview"
  | "workspace"
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
  | "governance"
  | "revision";

type WorkspaceReadinessFilter = "all" | "ready" | "hold";
type WorkspacePackageView = "active" | "archived" | "all";
type WorkspacePriority = "low" | "medium" | "high";
type WorkspaceSortKey = "savedAt" | "generatedAt" | "name" | "readinessScore" | "artifactCount" | "warningCount" | "priority";
type WorkspaceSortDirection = "asc" | "desc";
type WorkspaceHealthFilter = "all" | "hold" | "high" | "pinned" | "untagged" | "no_notes";

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

interface WorkspaceEntry {
  id: string;
  name: string;
  projectSlug: string;
  packageId: string;
  sourceHash: string;
  savedAt: string;
  generatedAt: string;
  readinessScore: number;
  readyForFrontendAgent: boolean;
  artifactCount: number;
  warningCount: number;
  tags?: string[];
  notes?: string;
  priority?: WorkspacePriority;
  pinned?: boolean;
  updatedAt?: string;
  copiedFromId?: string;
  archivedAt?: string;
}

interface IntakeFormState {
  projectName: string;
  context: string;
  goals: string;
  businessGoals: string;
  users: string;
  brandAttributes: string;
  primaryColor: string;
  tone: string;
  operatingMode: string;
}

interface SourceMaterialDraft {
  id: string;
  label: string;
  type: "document" | "code" | "design_file" | "screenshot" | "brand" | "other";
  content: string;
  notes: string;
  path: string;
}

interface SourceFinding {
  severity: "blocker" | "major" | "minor";
  category: string;
  finding: string;
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
  componentContracts: Record<string, any>;
  componentRegistry: { components: Array<Record<string, any>> };
  patternContracts: Record<string, any>;
  patternRegistry: { patterns: Array<Record<string, any>> };
  primitiveTokens: Record<string, any>;
  semanticTokens: Record<string, any>;
  tokenContracts: Record<string, any>;
  typographySystem: Record<string, any>;
  buildManifest: Record<string, any>;
  componentUsageMap: Record<string, any>;
  dataContracts: Record<string, any>;
  dataOperationContracts: Record<string, any>;
  actionContracts: Record<string, any>;
  formContracts: Record<string, any>;
  verificationContracts: Record<string, any>;
  productionIntegrationContracts: Record<string, any>;
  productionIntegrationPlan: string;
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

interface CoverageOverride {
  state: "unreviewed" | "reviewed" | "needs_changes" | "blocked";
  note: string;
  updatedAt: string;
}

interface DesignReviewOverride {
  state: "unreviewed" | "approved" | "needs_changes" | "blocked";
  note: string;
  updatedAt: string;
}

interface ContractGap {
  id: string;
  category: "route" | "screen_state" | "component" | "data_contract" | "backend" | "auth" | "production_integration" | "accessibility" | "copy" | "other";
  severity: "blocker" | "major" | "minor";
  artifact: string;
  description: string;
  status: "open" | "deferred" | "resolved";
  updatedAt: string;
}

interface SimulationTriageOverride {
  state: "untriaged" | "accepted" | "needs_work" | "blocked";
  note: string;
  updatedAt: string;
}

interface RevisionRequest {
  id: string;
  priority: "low" | "medium" | "high";
  changeType: "evidence_changed" | "product_model_changed" | "route_map_changed" | "screen_spec_changed" | "component_registry_changed" | "data_contract_changed" | "production_integration_changed" | "accessibility_rule_changed";
  summary: string;
  affectedArtifacts: string;
  requestedChanges: string;
  status: "draft" | "ready" | "sent";
  updatedAt: string;
}

interface WorkbenchStateExport {
  exportVersion: 1;
  exportedAt: string;
  packageName: string;
  bundle: Bundle;
  localState: {
    generationDraft: string;
    intakeForm: IntakeFormState | null;
    sourceMaterials: SourceMaterialDraft[];
    approvalOverrides: Record<string, ApprovalOverride>;
    coverageOverrides: Record<string, CoverageOverride>;
    designReviewOverrides: Record<string, DesignReviewOverride>;
    contractGaps: ContractGap[];
    simulationTriageOverrides: Record<string, SimulationTriageOverride>;
    revisionRequests: RevisionRequest[];
    baselineSnapshot: PackageSnapshot | null;
  };
}

interface WorkspaceExport {
  exportVersion: 1;
  exportedAt: string;
  collection?: Record<string, unknown>;
  packages: Array<{ entry: WorkspaceEntry; bundle: Bundle }>;
}

interface WorkspaceActivityEntry {
  id: string;
  action: string;
  details: string;
  packageId?: string;
  createdAt: string;
}

interface WorkspaceHealthSnapshot {
  generatedAt: string;
  totalPackages: number;
  activeCount: number;
  archivedCount: number;
  readyCount: number;
  holdCount: number;
  highPriorityCount: number;
  pinnedCount: number;
  untaggedCount: number;
  missingNotesCount: number;
  reviewQueue: Array<{
    id: string;
    name: string;
    projectSlug: string;
    packageId: string;
    readinessScore: number;
    priority: WorkspacePriority;
    pinned: boolean;
    archived: boolean;
    signals: string[];
  }>;
}

interface SavedPackageComparison {
  baseName: string;
  targetName: string;
  generatedAt: string;
  diffs: ArtifactDiff[];
  routeDelta: { added: string[]; removed: string[] };
  screenDelta: { added: string[]; removed: string[] };
  componentDelta: { added: string[]; removed: string[] };
}

const views: Array<{ id: ViewId; label: string; count: (bundle: Bundle) => number | string }> = [
  { id: "overview", label: "Overview", count: (bundle) => bundle.readiness.score },
  { id: "workspace", label: "Workspace", count: () => state.workspaceEntries.length },
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
  { id: "governance", label: "Governance", count: () => governanceActionQueue().length },
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
  coverageOverrides: Record<string, CoverageOverride>;
  activeCoverageNote: string;
  designReviewOverrides: Record<string, DesignReviewOverride>;
  activeDesignReviewNote: string;
  contractGaps: ContractGap[];
  contractGapDraft: Omit<ContractGap, "id" | "status" | "updatedAt">;
  contractMessage: string;
  simulationTriageOverrides: Record<string, SimulationTriageOverride>;
  activeSimulationTriageNote: string;
  revisionRequests: RevisionRequest[];
  revisionDraft: Omit<RevisionRequest, "id" | "status" | "updatedAt">;
  revisionMessage: string;
  baselineSnapshot: PackageSnapshot | null;
  baselineName: string;
  impactMessage: string;
  handoffMessage: string;
  workspaceEntries: WorkspaceEntry[];
  workspaceSearch: string;
  workspaceReadinessFilter: WorkspaceReadinessFilter;
  workspacePackageView: WorkspacePackageView;
  workspaceSortKey: WorkspaceSortKey;
  workspaceSortDirection: WorkspaceSortDirection;
  workspaceInspectId: string;
  workspaceInspectBundle: Bundle | null;
  workspaceNameDraft: string;
  workspacePriorityDraft: WorkspacePriority;
  workspaceTagDraft: string;
  workspaceNoteDraft: string;
  workspaceBulkPriority: WorkspacePriority;
  workspaceHealthFilter: WorkspaceHealthFilter;
  workspaceImportPreview: WorkspaceExport | null;
  workspaceImportFileName: string;
  workspaceActivity: WorkspaceActivityEntry[];
  workspaceMessage: string;
  workspaceCompareBaseId: string;
  workspaceCompareTargetId: string;
  workspaceComparison: SavedPackageComparison | null;
  intakeForm: IntakeFormState | null;
  sourceMaterials: SourceMaterialDraft[];
  sourceDraft: SourceMaterialDraft;
  sourceMessage: string;
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
  coverageOverrides: {},
  activeCoverageNote: "",
  designReviewOverrides: {},
  activeDesignReviewNote: "",
  contractGaps: [],
  contractGapDraft: { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" },
  contractMessage: "",
  simulationTriageOverrides: {},
  activeSimulationTriageNote: "",
  revisionRequests: [],
  revisionDraft: { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" },
  revisionMessage: "",
  baselineSnapshot: null,
  baselineName: "",
  impactMessage: "",
  handoffMessage: "",
  workspaceEntries: [],
  workspaceSearch: "",
  workspaceReadinessFilter: "all",
  workspacePackageView: "active",
  workspaceSortKey: "savedAt",
  workspaceSortDirection: "desc",
  workspaceInspectId: "",
  workspaceInspectBundle: null,
  workspaceNameDraft: "",
  workspacePriorityDraft: "medium",
  workspaceTagDraft: "",
  workspaceNoteDraft: "",
  workspaceBulkPriority: "medium",
  workspaceHealthFilter: "all",
  workspaceImportPreview: null,
  workspaceImportFileName: "",
  workspaceActivity: [],
  workspaceMessage: "",
  workspaceCompareBaseId: "",
  workspaceCompareTargetId: "",
  workspaceComparison: null,
  intakeForm: null,
  sourceMaterials: [],
  sourceDraft: { id: "", label: "", type: "document", content: "", notes: "", path: "" },
  sourceMessage: ""
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

function textArea(id: string, value: string, label: string, className = "textarea"): string {
  return `
    <label class="field">
      <span>${esc(label)}</span>
      <textarea id="${esc(id)}" class="${esc(className)}" spellcheck="false">${esc(value)}</textarea>
    </label>
  `;
}

function inputField(id: string, value: string, label: string, type = "text"): string {
  return `
    <label class="field">
      <span>${esc(label)}</span>
      <input id="${esc(id)}" class="input" type="${esc(type)}" value="${esc(value)}" />
    </label>
  `;
}

function selectField(id: string, value: string, label: string, options: string[]): string {
  return `
    <label class="field">
      <span>${esc(label)}</span>
      <select id="${esc(id)}" class="input">
        ${options.map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}
      </select>
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

function workspaceEntryMatchesFilters(entry: WorkspaceEntry): boolean {
  if (state.workspaceReadinessFilter === "ready" && !entry.readyForFrontendAgent) return false;
  if (state.workspaceReadinessFilter === "hold" && entry.readyForFrontendAgent) return false;
  const query = state.workspaceSearch.trim().toLowerCase();
  if (!query) return true;
  const searchable = [
    entry.name,
    entry.projectSlug,
    entry.packageId,
    entry.sourceHash,
    entry.id,
    entry.copiedFromId ?? "",
    entry.notes ?? "",
    entry.priority ?? "medium",
    entry.pinned ? "pinned" : "",
    ...(entry.tags ?? []),
    String(entry.readinessScore),
    entry.readyForFrontendAgent ? "ready" : "hold"
  ];
  return searchable.some((value) => value.toLowerCase().includes(query));
}

function normalizeWorkspaceTags(value: string): string[] {
  const tags = value.split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 12);
}

function workspacePriorityFromValue(value: string): WorkspacePriority {
  if (value === "low" || value === "high") return value;
  return "medium";
}

function workspaceSortValue(entry: WorkspaceEntry, key: WorkspaceSortKey): string | number {
  if (key === "savedAt") return Date.parse(entry.savedAt) || 0;
  if (key === "generatedAt") return Date.parse(entry.generatedAt) || 0;
  if (key === "name") return entry.name.toLowerCase();
  if (key === "priority") {
    const priority = entry.priority ?? "medium";
    return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  }
  return entry[key];
}

function workspaceSortKeyFromValue(value: string): WorkspaceSortKey {
  if (value === "generatedAt" || value === "name" || value === "readinessScore" || value === "artifactCount" || value === "warningCount" || value === "priority") return value;
  return "savedAt";
}

function sortWorkspaceEntries(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  const direction = state.workspaceSortDirection === "asc" ? 1 : -1;
  return [...entries].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    const aValue = workspaceSortValue(a, state.workspaceSortKey);
    const bValue = workspaceSortValue(b, state.workspaceSortKey);
    const primary = typeof aValue === "string" && typeof bValue === "string"
      ? aValue.localeCompare(bValue)
      : Number(aValue) - Number(bValue);
    if (primary !== 0) return primary * direction;
    return b.savedAt.localeCompare(a.savedAt);
  });
}

function currentWorkspaceEntries(): WorkspaceEntry[] {
  return sortWorkspaceEntries(state.workspaceEntries.filter((entry) => {
    if (!workspaceEntryMatchesFilters(entry)) return false;
    if (state.workspacePackageView === "active") return !entry.archivedAt;
    if (state.workspacePackageView === "archived") return !!entry.archivedAt;
    return true;
  }));
}

function workspaceCollectionDescriptor(): Record<string, unknown> {
  return {
    view: state.workspacePackageView,
    search: state.workspaceSearch.trim(),
    readinessFilter: state.workspaceReadinessFilter,
    sortKey: state.workspaceSortKey,
    sortDirection: state.workspaceSortDirection
  };
}

function workspaceCollectionReport(entries: WorkspaceEntry[]): string {
  const readyCount = entries.filter((entry) => entry.readyForFrontendAgent).length;
  const archivedCount = entries.filter((entry) => entry.archivedAt).length;
  const lines = [
    "# Archetype Workspace Collection",
    "",
    `Exported: ${new Date().toISOString()}`,
    `View: ${state.workspacePackageView}`,
    `Search: ${state.workspaceSearch.trim() || "none"}`,
    `Readiness filter: ${state.workspaceReadinessFilter}`,
    `Sort: ${state.workspaceSortKey} ${state.workspaceSortDirection}`,
    "",
    "## Summary",
    "",
    `- Packages: ${entries.length}`,
    `- Ready: ${readyCount}`,
    `- Hold: ${entries.length - readyCount}`,
    `- Archived: ${archivedCount}`,
    "",
    "## Packages",
    ""
  ];
  for (const [index, entry] of entries.entries()) {
    lines.push(
      `### ${index + 1}. ${entry.name}`,
      "",
      `- Status: ${entry.archivedAt ? "archived" : "active"}`,
      `- Project: ${entry.projectSlug}`,
      `- Package id: ${entry.packageId || entry.id}`,
      `- Readiness: ${entry.readinessScore} (${entry.readyForFrontendAgent ? "ready" : "hold"})`,
      `- Priority: ${entry.priority ?? "medium"}`,
      `- Pinned: ${entry.pinned ? "yes" : "no"}`,
      `- Artifacts: ${entry.artifactCount}`,
      `- Warnings: ${entry.warningCount}`,
      `- Tags: ${(entry.tags ?? []).join(", ") || "none"}`,
      `- Notes: ${entry.notes || "none"}`,
      `- Saved: ${entry.savedAt}`,
      ""
    );
  }
  return `${lines.join("\n")}\n`;
}

function syncInspectedWorkspaceEntry(): void {
  const entry = state.workspaceEntries.find((candidate) => candidate.id === state.workspaceInspectId);
  if (!entry) return;
  state.workspaceNameDraft = entry.name;
  state.workspacePriorityDraft = entry.priority ?? "medium";
  state.workspaceTagDraft = (entry.tags ?? []).join(", ");
  state.workspaceNoteDraft = entry.notes ?? "";
}

async function workspaceRecordsForEntries(entries: WorkspaceEntry[]): Promise<Array<{ entry: WorkspaceEntry; bundle: Bundle }>> {
  const records = await Promise.all(entries.map((entry) => loadWorkspaceBundle(entry.id)));
  return records.filter((record): record is { entry: WorkspaceEntry; bundle: Bundle } => !!record);
}

function renderWorkspaceImportReview(preview: WorkspaceExport | null): string {
  if (!preview) return "";
  const existingIds = new Set(state.workspaceEntries.map((entry) => entry.id));
  const activeCount = preview.packages.filter((record) => !record.entry.archivedAt).length;
  const archivedCount = preview.packages.length - activeCount;
  const updateCount = preview.packages.filter((record) => existingIds.has(record.entry.id)).length;
  return `
    <div style="margin-top:14px">
      ${panel("Import Review", `
        <div class="snapshot-line">
          <div>
            <h3>${esc(state.workspaceImportFileName || "Workspace import")}</h3>
            <div class="muted">${esc(`${preview.packages.length} packages · ${activeCount} active · ${archivedCount} archived · ${updateCount} updates`)}</div>
          </div>
          ${badge(preview.collection ? "collection" : "workspace", "neutral")}
        </div>
        ${preview.collection ? code(preview.collection) : ""}
        ${preview.packages.length ? table(["Package", "Status", "Score", "Saved", "Import"], preview.packages.slice(0, 80).map((record) => [
          `<div><strong>${esc(record.entry.name)}</strong><div class="muted">${esc(record.entry.projectSlug)} · ${esc(record.entry.packageId || record.entry.id)}</div></div>`,
          badge(record.entry.archivedAt ? "archived" : "active", record.entry.archivedAt ? "warning" : "success"),
          badge(String(record.entry.readinessScore), record.entry.readyForFrontendAgent ? "success" : "danger"),
          esc(new Date(record.entry.savedAt).toLocaleString()),
          badge(existingIds.has(record.entry.id) ? "update" : "add", existingIds.has(record.entry.id) ? "warning" : "success")
        ])) : `<div class="empty">No packages found in this import.</div>`}
        <div class="control-row">
          <button class="button primary" id="confirm-workspace-import" type="button" ${preview.packages.length ? "" : "disabled"}>Import reviewed packages</button>
          <button class="button" id="cancel-workspace-import" type="button">Cancel import</button>
        </div>
      `)}
    </div>
  `;
}

function renderWorkspaceActivity(): string {
  const rows = state.workspaceActivity.slice(0, 20);
  return `
    <div style="margin-top:14px">
      ${panel("Activity Log", rows.length ? `
        ${table(["Time", "Action", "Details"], rows.map((entry) => [
          esc(new Date(entry.createdAt).toLocaleString()),
          badge(entry.action),
          `<div>${esc(entry.details)}${entry.packageId ? `<div class="muted">${esc(entry.packageId)}</div>` : ""}</div>`
        ]))}
        <div class="control-row">
          <button class="button" id="export-workspace-activity" type="button">Export activity</button>
          <button class="button" id="clear-workspace-activity" type="button">Clear activity</button>
        </div>
      ` : `
        <div class="empty">No workspace activity yet.</div>
      `)}
    </div>
  `;
}

function workspaceHealthSnapshot(entries: WorkspaceEntry[]): WorkspaceHealthSnapshot {
  const readyCount = entries.filter((entry) => entry.readyForFrontendAgent).length;
  const reviewQueue = entries.map((entry) => {
    const signals = [
      !entry.readyForFrontendAgent ? "hold" : "",
      entry.priority === "high" ? "high" : "",
      entry.pinned ? "pinned" : "",
      !(entry.tags ?? []).length ? "untagged" : "",
      !entry.notes?.trim() ? "no notes" : ""
    ].filter(Boolean);
    return {
      id: entry.id,
      name: entry.name,
      projectSlug: entry.projectSlug,
      packageId: entry.packageId || entry.id,
      readinessScore: entry.readinessScore,
      priority: entry.priority ?? "medium",
      pinned: !!entry.pinned,
      archived: !!entry.archivedAt,
      signals
    };
  }).filter((entry) => entry.signals.length).slice(0, 20);
  return {
    generatedAt: new Date().toISOString(),
    totalPackages: entries.length,
    activeCount: entries.filter((entry) => !entry.archivedAt).length,
    archivedCount: entries.filter((entry) => entry.archivedAt).length,
    readyCount,
    holdCount: entries.length - readyCount,
    highPriorityCount: entries.filter((entry) => entry.priority === "high").length,
    pinnedCount: entries.filter((entry) => entry.pinned).length,
    untaggedCount: entries.filter((entry) => !(entry.tags ?? []).length).length,
    missingNotesCount: entries.filter((entry) => !entry.notes?.trim()).length,
    reviewQueue
  };
}

function workspaceHealthMarkdown(snapshot: WorkspaceHealthSnapshot): string {
  const lines = [
    "# Archetype Workspace Health",
    "",
    `Generated: ${snapshot.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Packages: ${snapshot.totalPackages}`,
    `- Active: ${snapshot.activeCount}`,
    `- Archived: ${snapshot.archivedCount}`,
    `- Ready: ${snapshot.readyCount}`,
    `- Hold: ${snapshot.holdCount}`,
    `- High priority: ${snapshot.highPriorityCount}`,
    `- Pinned: ${snapshot.pinnedCount}`,
    `- Untagged: ${snapshot.untaggedCount}`,
    `- Missing notes: ${snapshot.missingNotesCount}`,
    "",
    "## Review Queue",
    ""
  ];
  if (!snapshot.reviewQueue.length) {
    lines.push("No workspace health issues found.", "");
    return `${lines.join("\n")}\n`;
  }
  for (const [index, entry] of snapshot.reviewQueue.entries()) {
    lines.push(
      `### ${index + 1}. ${entry.name}`,
      "",
      `- Project: ${entry.projectSlug}`,
      `- Package id: ${entry.packageId}`,
      `- Readiness: ${entry.readinessScore}`,
      `- Priority: ${entry.priority}`,
      `- Pinned: ${entry.pinned ? "yes" : "no"}`,
      `- Archived: ${entry.archived ? "yes" : "no"}`,
      `- Signals: ${entry.signals.join(", ")}`,
      ""
    );
  }
  return `${lines.join("\n")}\n`;
}

function workspaceHealthFilterFromValue(value: string): WorkspaceHealthFilter {
  if (value === "hold" || value === "high" || value === "pinned" || value === "untagged" || value === "no_notes") return value;
  return "all";
}

function workspaceHealthEntryMatchesFilter(entry: WorkspaceHealthSnapshot["reviewQueue"][number]): boolean {
  if (state.workspaceHealthFilter === "all") return true;
  const signal = state.workspaceHealthFilter === "no_notes" ? "no notes" : state.workspaceHealthFilter;
  return entry.signals.includes(signal);
}

function renderWorkspaceHealth(entries: WorkspaceEntry[]): string {
  if (!entries.length) return `<div class="empty">No workspace packages to summarize.</div>`;
  const health = workspaceHealthSnapshot(entries);
  const filteredReviewQueue = health.reviewQueue.filter(workspaceHealthEntryMatchesFilter);
  return `
    <div class="mini-metrics">
      <div><strong>${esc(health.readyCount)}</strong><span>ready</span></div>
      <div><strong>${esc(health.holdCount)}</strong><span>hold</span></div>
      <div><strong>${esc(health.highPriorityCount)}</strong><span>high priority</span></div>
      <div><strong>${esc(health.pinnedCount)}</strong><span>pinned</span></div>
      <div><strong>${esc(health.untaggedCount)}</strong><span>untagged</span></div>
      <div><strong>${esc(health.missingNotesCount)}</strong><span>missing notes</span></div>
    </div>
    <div style="margin-top:10px">
      ${filteredReviewQueue.length ? table(["Package", "Signals", "Actions"], filteredReviewQueue.slice(0, 10).map((entry) => [
        `<div><strong>${esc(entry.name)}</strong><div class="muted">${esc(entry.projectSlug)}</div></div>`,
        entry.signals.map((signal) => badge(signal, signal === "hold" || signal === "high" ? "danger" : signal === "pinned" ? "success" : "warning")).join(" "),
        `<div class="control-row compact"><button class="button small" data-workspace-inspect="${esc(entry.id)}" type="button">Inspect</button><button class="button small" data-workspace-pin="${esc(entry.id)}" data-workspace-pinned="${entry.pinned ? "false" : "true"}" type="button">${entry.pinned ? "Unpin" : "Pin"}</button><button class="button small" data-workspace-priority="${esc(entry.id)}" data-workspace-priority-value="${entry.priority === "high" ? "medium" : "high"}" type="button">${entry.priority === "high" ? "Set medium" : "Set high"}</button></div>`
      ])) : `<div class="empty">${health.reviewQueue.length ? "No packages match this health filter." : "Workspace package metadata is complete."}</div>`}
    </div>
    <div class="control-row">
      <label class="field" style="min-width:180px">
        <span>Health filter</span>
        <select id="workspace-health-filter" class="input">
          <option value="all" ${state.workspaceHealthFilter === "all" ? "selected" : ""}>all signals</option>
          <option value="hold" ${state.workspaceHealthFilter === "hold" ? "selected" : ""}>hold</option>
          <option value="high" ${state.workspaceHealthFilter === "high" ? "selected" : ""}>high priority</option>
          <option value="pinned" ${state.workspaceHealthFilter === "pinned" ? "selected" : ""}>pinned</option>
          <option value="untagged" ${state.workspaceHealthFilter === "untagged" ? "selected" : ""}>untagged</option>
          <option value="no_notes" ${state.workspaceHealthFilter === "no_notes" ? "selected" : ""}>missing notes</option>
        </select>
      </label>
      <button class="button" id="export-workspace-health-json" type="button">Export health JSON</button>
      <button class="button" id="export-workspace-health-report" type="button">Export health report</button>
    </div>
    <div class="muted" style="margin-top:10px">${esc(`Showing ${filteredReviewQueue.length} of ${health.reviewQueue.length} health queue packages.`)}</div>
  `;
}

function renderWorkspacePackageActions(entry: WorkspaceEntry): string {
  return entry.archivedAt
    ? `<div class="control-row compact"><button class="button small" data-workspace-inspect="${esc(entry.id)}" type="button">Inspect</button><button class="button small" data-workspace-pin="${esc(entry.id)}" data-workspace-pinned="${entry.pinned ? "false" : "true"}" type="button">${entry.pinned ? "Unpin" : "Pin"}</button><button class="button small" data-workspace-duplicate="${esc(entry.id)}" type="button">Duplicate</button><button class="button small" data-workspace-restore="${esc(entry.id)}" type="button">Restore</button><button class="button small" data-workspace-delete="${esc(entry.id)}" type="button">Delete</button></div>`
    : `<div class="control-row compact"><button class="button small" data-workspace-inspect="${esc(entry.id)}" type="button">Inspect</button><button class="button small" data-workspace-load="${esc(entry.id)}" type="button">Load</button><button class="button small" data-workspace-pin="${esc(entry.id)}" data-workspace-pinned="${entry.pinned ? "false" : "true"}" type="button">${entry.pinned ? "Unpin" : "Pin"}</button><button class="button small" data-workspace-duplicate="${esc(entry.id)}" type="button">Duplicate</button><button class="button small" data-workspace-archive="${esc(entry.id)}" type="button">Archive</button><button class="button small" data-workspace-delete="${esc(entry.id)}" type="button">Delete</button></div>`;
}

function renderWorkspaceEntryIdentity(entry: WorkspaceEntry): string {
  const tags = (entry.tags ?? []).slice(0, 4).map((tag) => badge(tag)).join("");
  return `
    <div>
      <strong>${esc(entry.name)}</strong>
      <div class="muted">${esc(entry.projectSlug)} · ${esc(entry.sourceHash.slice(0, 8) || entry.packageId.slice(0, 8))}</div>
      ${tags ? `<div class="tag-row">${tags}</div>` : ""}
      ${entry.notes ? `<div class="muted">${esc(entry.notes.slice(0, 96))}${entry.notes.length > 96 ? "..." : ""}</div>` : ""}
    </div>
  `;
}

function renderWorkspacePackageTable(entries: WorkspaceEntry[], emptyText: string): string {
  if (!entries.length) return `<div class="empty">${esc(emptyText)}</div>`;
  return table(["Package", "Status", "Score", "Artifacts", "Saved", "Actions"], entries.map((entry) => [
    renderWorkspaceEntryIdentity(entry),
    `${badge(entry.archivedAt ? "archived" : "active", entry.archivedAt ? "warning" : "success")} ${entry.pinned ? badge("pinned", "success") : ""} ${badge(entry.priority ?? "medium", entry.priority === "high" ? "danger" : entry.priority === "low" ? "neutral" : "warning")}`,
    badge(String(entry.readinessScore), entry.readyForFrontendAgent ? "success" : "danger"),
    esc(entry.artifactCount),
    esc(new Date(entry.savedAt).toLocaleString()),
    renderWorkspacePackageActions(entry)
  ]));
}

function renderWorkspaceInspection(entry: WorkspaceEntry | undefined, bundle: Bundle | null): string {
  if (!entry) return `<div class="empty">Select a saved package to inspect.</div>`;
  if (!bundle) return `<div class="empty">Package details are unavailable. Inspect the package again.</div>`;
  return `
    <div class="snapshot-line">
      <div>
        <h3>${esc(entry.name)}</h3>
        <div class="muted">${esc(`${entry.projectSlug} · ${entry.packageId || entry.sourceHash || entry.id}`)}</div>
      </div>
      ${badge(entry.archivedAt ? "archived" : "active", entry.archivedAt ? "warning" : "success")}
    </div>
    <div class="mini-metrics" style="margin-top:10px">
      <div><strong>${esc(bundle.readiness.score)}</strong><span>readiness</span></div>
      <div><strong>${esc(bundle.manifest.artifact_index?.length ?? bundle.artifacts?.length ?? 0)}</strong><span>artifacts</span></div>
      <div><strong>${esc(bundle.readiness.warnings.length)}</strong><span>warnings</span></div>
    </div>
    <div class="form-grid" style="margin-top:10px">
      ${code({
        savedAt: entry.savedAt,
        updatedAt: entry.updatedAt ?? null,
        generatedAt: entry.generatedAt,
        sourceHash: entry.sourceHash,
        copiedFromId: entry.copiedFromId ?? null,
        tags: entry.tags ?? [],
        priority: entry.priority ?? "medium",
        pinned: !!entry.pinned,
        readyForFrontendAgent: bundle.readiness.readyForFrontendAgent,
        blockers: bundle.readiness.blockers.length,
        humanReview: bundle.readiness.requiredHumanReview.length
      })}
      ${code({
        routes: bundle.routeMap.routes.length,
        screens: bundle.screenInventory.screens.length,
        components: bundle.componentRegistry.components.length,
        patterns: bundle.patternRegistry.patterns.length,
        dsagStatus: bundle.dsag.integrity.status,
        schemaStatus: bundle.schemaValidation.status
      })}
    </div>
    <div class="form-grid" style="margin-top:10px">
      ${inputField("workspace-name", state.workspaceNameDraft, "Package name")}
      <label class="field">
        <span>Priority</span>
        <select id="workspace-priority" class="input">
          <option value="low" ${state.workspacePriorityDraft === "low" ? "selected" : ""}>low</option>
          <option value="medium" ${state.workspacePriorityDraft === "medium" ? "selected" : ""}>medium</option>
          <option value="high" ${state.workspacePriorityDraft === "high" ? "selected" : ""}>high</option>
        </select>
      </label>
      ${inputField("workspace-tags", state.workspaceTagDraft, "Tags")}
      ${textArea("workspace-notes", state.workspaceNoteDraft, "Notes", "textarea short")}
    </div>
    <div class="grid cols-2" style="margin-top:10px">
      <div>
        <h3>Warnings</h3>
        ${list(bundle.readiness.warnings.slice(0, 8))}
      </div>
      <div>
        <h3>Human Review</h3>
        ${list(bundle.readiness.requiredHumanReview.slice(0, 8))}
      </div>
    </div>
    <div class="control-row">
      <button class="button primary" id="save-workspace-metadata" type="button">Save details</button>
      <button class="button" data-workspace-load="${esc(entry.id)}" type="button">Load package</button>
      <button class="button" data-workspace-pin="${esc(entry.id)}" data-workspace-pinned="${entry.pinned ? "false" : "true"}" type="button">${entry.pinned ? "Unpin package" : "Pin package"}</button>
      <button class="button" data-workspace-duplicate="${esc(entry.id)}" type="button">Duplicate</button>
      <button class="button" data-workspace-compare-select="${esc(entry.id)}" data-workspace-compare-role="base" type="button">Use as base</button>
      <button class="button" data-workspace-compare-select="${esc(entry.id)}" data-workspace-compare-role="target" type="button">Use as target</button>
      <button class="button" id="clear-workspace-inspection" type="button">Clear details</button>
    </div>
  `;
}

function renderWorkspace(bundle: Bundle): string {
  const activeEntries = state.workspaceEntries.filter((entry) => !entry.archivedAt);
  const archivedEntries = state.workspaceEntries.filter((entry) => entry.archivedAt);
  const matchingActiveEntries = activeEntries.filter(workspaceEntryMatchesFilters);
  const matchingArchivedEntries = archivedEntries.filter(workspaceEntryMatchesFilters);
  const workspaceFiltersActive = !!state.workspaceSearch.trim() || state.workspaceReadinessFilter !== "all";
  const workspaceBrowserChanged = workspaceFiltersActive || state.workspacePackageView !== "active" || state.workspaceSortKey !== "savedAt" || state.workspaceSortDirection !== "desc";
  const visibleWorkspaceEntries = currentWorkspaceEntries();
  const visibleWorkspaceTitle = state.workspacePackageView === "active"
    ? "Active Saved Packages"
    : state.workspacePackageView === "archived"
      ? "Archived Packages"
      : "All Workspace Packages";
  const visibleWorkspaceEmpty = state.workspacePackageView === "active"
    ? (workspaceFiltersActive && activeEntries.length ? "No active packages match the current filters." : "No active packages.")
    : state.workspacePackageView === "archived"
      ? (workspaceFiltersActive && archivedEntries.length ? "No archived packages match the current filters." : "No archived packages.")
      : (workspaceFiltersActive && state.workspaceEntries.length ? "No workspace packages match the current filters." : "No workspace packages.");
  const inspectedEntry = state.workspaceEntries.find((entry) => entry.id === state.workspaceInspectId);
  const compareOptions = (selectedId: string) => state.workspaceEntries.map((entry) => `<option value="${esc(entry.id)}" ${entry.id === selectedId ? "selected" : ""}>${esc(`${entry.name} · ${entry.projectSlug} · score ${entry.readinessScore}`)}</option>`).join("");
  const comparison = state.workspaceComparison;
  const changedDiffs = comparison?.diffs.filter((diff) => diff.status !== "unchanged") ?? [];
  return `
    <div class="grid cols-3">
      ${metric("Saved packages", workspaceFiltersActive ? `${matchingActiveEntries.length}/${activeEntries.length}` : activeEntries.length)}
      ${metric("Active score", bundle.readiness.score, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
      ${metric("Archived", workspaceFiltersActive ? `${matchingArchivedEntries.length}/${archivedEntries.length}` : archivedEntries.length, archivedEntries.length ? "warning" : "success")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Active Package", `
        <div class="snapshot-line">
          <div>
            <h3>${esc(bundle.productModel.product_name ?? bundle.manifest.project_slug)}</h3>
            <div class="muted">${esc(`${bundle.manifest.project_slug ?? "package"} · ${bundle.manifest.package_id ?? "no package id"}`)}</div>
          </div>
          ${badge(bundle.readiness.readyForFrontendAgent ? "ready" : "hold", bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
        </div>
        <div class="control-row">
          <button class="button primary" id="save-workspace-package" type="button">Save active</button>
          <button class="button" id="refresh-workspace" type="button">Refresh workspace</button>
          <button class="button" id="export-workspace" type="button" ${state.workspaceEntries.length ? "" : "disabled"}>Export workspace</button>
          <button class="button" id="import-workspace" type="button">Import workspace</button>
          <button class="button" id="purge-archived-packages" type="button" ${archivedEntries.length ? "" : "disabled"}>Purge archived</button>
          <input id="workspace-import-input" type="file" accept="application/json,.json" hidden />
        </div>
        ${state.workspaceMessage ? `<div class="notice" role="status">${esc(state.workspaceMessage)}</div>` : ""}
      `)}
      ${panel("State Portability", `
        <div class="snapshot-line">
          <div>
            <h3>Session State</h3>
            <div class="muted">${esc(`${Object.keys(state.approvalOverrides).length + Object.keys(state.coverageOverrides).length + Object.keys(state.designReviewOverrides).length + Object.keys(state.simulationTriageOverrides).length} review records · ${state.contractGaps.length} gaps · ${state.revisionRequests.length} revision requests`)}</div>
          </div>
          ${badge(state.baselineSnapshot ? "baseline" : "state", "neutral")}
        </div>
        <div class="control-row">
          <button class="button" id="export-workbench-state" type="button">Export state</button>
          <button class="button" id="restore-workbench-state" type="button">Restore state</button>
          <input id="state-import-input" type="file" accept="application/json,.json" hidden />
        </div>
      `)}
    </div>
    <div style="margin-top:14px">
      ${panel("Package Browser", `
        <div class="form-grid">
          ${inputField("workspace-search", state.workspaceSearch, "Search packages")}
          <label class="field">
            <span>Readiness</span>
            <select id="workspace-readiness-filter" class="input">
              <option value="all" ${state.workspaceReadinessFilter === "all" ? "selected" : ""}>all packages</option>
              <option value="ready" ${state.workspaceReadinessFilter === "ready" ? "selected" : ""}>ready only</option>
              <option value="hold" ${state.workspaceReadinessFilter === "hold" ? "selected" : ""}>hold only</option>
            </select>
          </label>
          <label class="field">
            <span>Sort by</span>
            <select id="workspace-sort-key" class="input">
              <option value="savedAt" ${state.workspaceSortKey === "savedAt" ? "selected" : ""}>saved date</option>
              <option value="generatedAt" ${state.workspaceSortKey === "generatedAt" ? "selected" : ""}>generated date</option>
              <option value="name" ${state.workspaceSortKey === "name" ? "selected" : ""}>package name</option>
              <option value="readinessScore" ${state.workspaceSortKey === "readinessScore" ? "selected" : ""}>readiness score</option>
              <option value="artifactCount" ${state.workspaceSortKey === "artifactCount" ? "selected" : ""}>artifact count</option>
              <option value="warningCount" ${state.workspaceSortKey === "warningCount" ? "selected" : ""}>warning count</option>
              <option value="priority" ${state.workspaceSortKey === "priority" ? "selected" : ""}>priority</option>
            </select>
          </label>
          <label class="field">
            <span>Direction</span>
            <select id="workspace-sort-direction" class="input">
              <option value="desc" ${state.workspaceSortDirection === "desc" ? "selected" : ""}>descending</option>
              <option value="asc" ${state.workspaceSortDirection === "asc" ? "selected" : ""}>ascending</option>
            </select>
          </label>
        </div>
        <div class="control-row">
          <button class="button ${state.workspacePackageView === "active" ? "primary" : ""}" data-workspace-package-view="active" type="button">Active</button>
          <button class="button ${state.workspacePackageView === "archived" ? "primary" : ""}" data-workspace-package-view="archived" type="button">Archived</button>
          <button class="button ${state.workspacePackageView === "all" ? "primary" : ""}" data-workspace-package-view="all" type="button">All</button>
          <button class="button" id="clear-workspace-filters" type="button" ${workspaceFiltersActive ? "" : "disabled"}>Clear filters</button>
          <button class="button" id="reset-workspace-browser" type="button" ${workspaceBrowserChanged ? "" : "disabled"}>Reset browser</button>
          <button class="button" id="export-workspace-collection" type="button" ${visibleWorkspaceEntries.length ? "" : "disabled"}>Export collection</button>
          <button class="button" id="export-workspace-collection-report" type="button" ${visibleWorkspaceEntries.length ? "" : "disabled"}>Export report</button>
        </div>
        <div class="control-row">
          <label class="field" style="min-width:180px">
            <span>Bulk priority</span>
            <select id="workspace-bulk-priority" class="input">
              <option value="low" ${state.workspaceBulkPriority === "low" ? "selected" : ""}>low</option>
              <option value="medium" ${state.workspaceBulkPriority === "medium" ? "selected" : ""}>medium</option>
              <option value="high" ${state.workspaceBulkPriority === "high" ? "selected" : ""}>high</option>
            </select>
          </label>
          <button class="button" id="bulk-workspace-priority" type="button" ${visibleWorkspaceEntries.length ? "" : "disabled"}>Apply priority</button>
          <button class="button" id="bulk-workspace-pin" type="button" ${visibleWorkspaceEntries.length ? "" : "disabled"}>Pin visible</button>
          <button class="button" id="bulk-workspace-unpin" type="button" ${visibleWorkspaceEntries.some((entry) => entry.pinned) ? "" : "disabled"}>Unpin visible</button>
          <button class="button" id="bulk-workspace-archive" type="button" ${visibleWorkspaceEntries.some((entry) => !entry.archivedAt) ? "" : "disabled"}>Archive visible</button>
          <button class="button" id="bulk-workspace-restore" type="button" ${visibleWorkspaceEntries.some((entry) => entry.archivedAt) ? "" : "disabled"}>Restore visible</button>
        </div>
        <div class="muted" style="margin-top:10px">${esc(`Showing ${visibleWorkspaceEntries.length} of ${state.workspaceEntries.length} workspace packages.`)}</div>
      `)}
    </div>
    <div style="margin-top:14px">
      ${panel("Workspace Health", renderWorkspaceHealth(state.workspaceEntries))}
    </div>
    ${renderWorkspaceImportReview(state.workspaceImportPreview)}
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Active Snapshot", code({
        packageName: state.packageName,
        projectSlug: bundle.manifest.project_slug,
        packageId: bundle.manifest.package_id,
        sourceHash: bundle.manifest.source_hash,
        generatedAt: bundle.manifest.generated_at,
        readinessScore: bundle.readiness.score,
        artifactCount: bundle.manifest.artifact_index?.length ?? 0,
        digestCount: bundle.artifacts?.length ?? 0
      }))}
      ${panel("Local State Summary", code({
        approvals: Object.keys(state.approvalOverrides).length,
        coverage: Object.keys(state.coverageOverrides).length,
        designReview: Object.keys(state.designReviewOverrides).length,
        contractGaps: state.contractGaps.length,
        simulationTriage: Object.keys(state.simulationTriageOverrides).length,
        revisionRequests: state.revisionRequests.length,
        baseline: state.baselineSnapshot?.name ?? null,
        sourceMaterials: state.sourceMaterials.length
      }))}
    </div>
    <div style="margin-top:14px">
      ${panel(visibleWorkspaceTitle, renderWorkspacePackageTable(visibleWorkspaceEntries, visibleWorkspaceEmpty))}
    </div>
    <div style="margin-top:14px">
      ${panel("Package Details", renderWorkspaceInspection(inspectedEntry, state.workspaceInspectBundle))}
    </div>
    ${renderWorkspaceActivity()}
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Compare Saved Packages", `
        <div class="form-grid">
          <label class="field">
            <span>Base package</span>
            <select id="workspace-compare-base" class="input">
              <option value="">Select base</option>
              ${compareOptions(state.workspaceCompareBaseId)}
            </select>
          </label>
          <label class="field">
            <span>Target package</span>
            <select id="workspace-compare-target" class="input">
              <option value="">Select target</option>
              ${compareOptions(state.workspaceCompareTargetId)}
            </select>
          </label>
        </div>
        <div class="control-row">
          <button class="button primary" id="compare-workspace-packages" type="button" ${state.workspaceEntries.length >= 2 ? "" : "disabled"}>Compare packages</button>
          <button class="button" id="clear-workspace-comparison" type="button" ${comparison ? "" : "disabled"}>Clear comparison</button>
        </div>
      `)}
      ${panel("Comparison Summary", comparison ? code({
        base: comparison.baseName,
        target: comparison.targetName,
        changedArtifacts: changedDiffs.length,
        routes: comparison.routeDelta,
        screens: comparison.screenDelta,
        components: comparison.componentDelta
      }) : `<div class="empty">Select two saved packages to compare.</div>`)}
    </div>
    <div style="margin-top:14px">
      ${panel("Workspace Diff", comparison ? table(["Status", "Area", "Artifact", "Before", "After"], changedDiffs.slice(0, 120).map((diff) => [
        badge(diff.status, diffTone(diff.status)),
        esc(diff.group),
        `<code>${esc(diff.path)}</code>`,
        esc(formatBytes(diff.beforeBytes)),
        esc(formatBytes(diff.afterBytes))
      ])) : `<div class="empty">No workspace comparison yet.</div>`)}
    </div>
  `;
}

function list(items: unknown[]): string {
  if (!items || items.length === 0) return `<div class="empty">None.</div>`;
  return `<div class="list">${items.map((item) => `<div class="list-button">${esc(typeof item === "string" ? item : JSON.stringify(item))}</div>`).join("")}</div>`;
}

const WORKSPACE_DB = "archetype-workbench";
const WORKSPACE_STORE = "packages";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WORKSPACE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
        db.createObjectStore(WORKSPACE_STORE, { keyPath: "entry.id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function workspaceIdForBundle(bundle: Bundle): string {
  const slug = String(bundle.manifest.project_slug ?? "package");
  const identity = String(bundle.manifest.package_id ?? bundle.manifest.source_hash ?? bundle.generatedAt);
  return `${slug}:${identity}`;
}

function workspaceEntryFromBundle(bundle: Bundle, name: string): WorkspaceEntry {
  return {
    id: workspaceIdForBundle(bundle),
    name,
    projectSlug: String(bundle.manifest.project_slug ?? "package"),
    packageId: String(bundle.manifest.package_id ?? ""),
    sourceHash: String(bundle.manifest.source_hash ?? ""),
    savedAt: new Date().toISOString(),
    generatedAt: String(bundle.manifest.generated_at ?? bundle.generatedAt),
    readinessScore: bundle.readiness.score,
    readyForFrontendAgent: bundle.readiness.readyForFrontendAgent,
    artifactCount: bundle.manifest.artifact_index?.length ?? bundle.artifacts?.length ?? 0,
    warningCount: bundle.readiness.warnings.length
  };
}

function workbenchStateExport(bundle: Bundle): WorkbenchStateExport {
  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    packageName: state.packageName,
    bundle,
    localState: {
      generationDraft: state.generationDraft,
      intakeForm: state.intakeForm,
      sourceMaterials: state.sourceMaterials,
      approvalOverrides: state.approvalOverrides,
      coverageOverrides: state.coverageOverrides,
      designReviewOverrides: state.designReviewOverrides,
      contractGaps: state.contractGaps,
      simulationTriageOverrides: state.simulationTriageOverrides,
      revisionRequests: state.revisionRequests,
      baselineSnapshot: state.baselineSnapshot
    }
  };
}

function isWorkbenchStateExport(value: unknown): value is WorkbenchStateExport {
  const candidate = value as WorkbenchStateExport;
  return !!candidate && candidate.exportVersion === 1 && !!candidate.bundle && !!candidate.bundle.manifest && !!candidate.localState;
}

function isWorkspaceExport(value: unknown): value is WorkspaceExport {
  const candidate = value as WorkspaceExport;
  return !!candidate && candidate.exportVersion === 1 && Array.isArray(candidate.packages);
}

async function listWorkspaceEntries(): Promise<WorkspaceEntry[]> {
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readonly");
    const values = await requestResult<Array<{ entry: WorkspaceEntry }>>(transaction.objectStore(WORKSPACE_STORE).getAll());
    return values.map((value) => value.entry).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } finally {
    db.close();
  }
}

async function listWorkspaceRecords(): Promise<Array<{ entry: WorkspaceEntry; bundle: Bundle }>> {
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readonly");
    const values = await requestResult<Array<{ entry: WorkspaceEntry; bundle: Bundle }>>(transaction.objectStore(WORKSPACE_STORE).getAll());
    return values.sort((a, b) => b.entry.savedAt.localeCompare(a.entry.savedAt));
  } finally {
    db.close();
  }
}

async function saveWorkspaceBundle(bundle: Bundle, name: string): Promise<WorkspaceEntry> {
  const db = await openWorkspaceDb();
  const entry = workspaceEntryFromBundle(bundle, name);
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({ entry, bundle });
    await transactionDone(transaction);
    return entry;
  } finally {
    db.close();
  }
}

async function importWorkspaceRecords(records: Array<{ entry: WorkspaceEntry; bundle: Bundle }>): Promise<number> {
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    for (const record of records) {
      transaction.objectStore(WORKSPACE_STORE).put(record);
    }
    await transactionDone(transaction);
    return records.length;
  } finally {
    db.close();
  }
}

async function updateWorkspaceBundleMetadata(id: string, name: string, priority: WorkspacePriority, tags: string[], notes: string): Promise<WorkspaceEntry | null> {
  const record = await loadWorkspaceBundle(id);
  if (!record) return null;
  const db = await openWorkspaceDb();
  const entry: WorkspaceEntry = {
    ...record.entry,
    name,
    priority,
    tags,
    notes,
    updatedAt: new Date().toISOString()
  };
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({ entry, bundle: record.bundle });
    await transactionDone(transaction);
    return entry;
  } finally {
    db.close();
  }
}

async function setWorkspaceBundlePinned(id: string, pinned: boolean): Promise<WorkspaceEntry | null> {
  const record = await loadWorkspaceBundle(id);
  if (!record) return null;
  const db = await openWorkspaceDb();
  const entry: WorkspaceEntry = {
    ...record.entry,
    pinned,
    updatedAt: new Date().toISOString()
  };
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({ entry, bundle: record.bundle });
    await transactionDone(transaction);
    return entry;
  } finally {
    db.close();
  }
}

async function setWorkspaceBundlePriority(id: string, priority: WorkspacePriority): Promise<WorkspaceEntry | null> {
  const record = await loadWorkspaceBundle(id);
  if (!record) return null;
  const db = await openWorkspaceDb();
  const entry: WorkspaceEntry = {
    ...record.entry,
    priority,
    updatedAt: new Date().toISOString()
  };
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({ entry, bundle: record.bundle });
    await transactionDone(transaction);
    return entry;
  } finally {
    db.close();
  }
}

async function duplicateWorkspaceBundle(id: string): Promise<WorkspaceEntry | null> {
  const record = await loadWorkspaceBundle(id);
  if (!record) return null;
  const db = await openWorkspaceDb();
  const now = new Date().toISOString();
  const entry: WorkspaceEntry = {
    ...record.entry,
    id: `${record.entry.id}:copy:${Date.now().toString(36)}`,
    name: `${record.entry.name} Copy`,
    savedAt: now,
    updatedAt: now,
    copiedFromId: record.entry.copiedFromId ?? record.entry.id,
    archivedAt: undefined
  };
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({ entry, bundle: record.bundle });
    await transactionDone(transaction);
    return entry;
  } finally {
    db.close();
  }
}

async function compareWorkspacePackages(baseId: string, targetId: string): Promise<SavedPackageComparison | null> {
  const base = await loadWorkspaceBundle(baseId);
  const target = await loadWorkspaceBundle(targetId);
  if (!base || !target) return null;
  const baseSnapshot = snapshotFromBundle(base.bundle, base.entry.name);
  const targetSnapshot = snapshotFromBundle(target.bundle, target.entry.name);
  return {
    baseName: base.entry.name,
    targetName: target.entry.name,
    generatedAt: new Date().toISOString(),
    diffs: computeArtifactDiffs(targetSnapshot, baseSnapshot),
    routeDelta: compareStringSets(baseSnapshot.routes, targetSnapshot.routes),
    screenDelta: compareStringSets(baseSnapshot.screens, targetSnapshot.screens),
    componentDelta: compareStringSets(baseSnapshot.components, targetSnapshot.components)
  };
}

async function loadWorkspaceBundle(id: string): Promise<{ entry: WorkspaceEntry; bundle: Bundle } | null> {
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readonly");
    return await requestResult<{ entry: WorkspaceEntry; bundle: Bundle } | undefined>(transaction.objectStore(WORKSPACE_STORE).get(id)) ?? null;
  } finally {
    db.close();
  }
}

async function deleteWorkspaceBundle(id: string): Promise<void> {
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).delete(id);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

async function archiveWorkspaceBundle(id: string, archived: boolean): Promise<void> {
  const record = await loadWorkspaceBundle(id);
  if (!record) return;
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({
      ...record,
      entry: {
        ...record.entry,
        archivedAt: archived ? new Date().toISOString() : undefined
      }
    });
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

async function purgeArchivedWorkspaceBundles(): Promise<number> {
  const records = await listWorkspaceRecords();
  const archived = records.filter((record) => record.entry.archivedAt);
  const db = await openWorkspaceDb();
  try {
    const transaction = db.transaction(WORKSPACE_STORE, "readwrite");
    for (const record of archived) {
      transaction.objectStore(WORKSPACE_STORE).delete(record.entry.id);
    }
    await transactionDone(transaction);
    return archived.length;
  } finally {
    db.close();
  }
}

async function restoreWorkbenchState(payload: WorkbenchStateExport): Promise<void> {
  state.bundle = payload.bundle;
  state.packageName = payload.packageName || "restored-package";
  state.view = "workspace";
  state.selectedScreen = null;
  state.screenFilter = "";
  state.generationDraft = payload.localState.generationDraft ?? "";
  state.generationMessage = "";
  state.approvalOverrides = payload.localState.approvalOverrides ?? {};
  state.activeGateNote = "";
  state.coverageOverrides = payload.localState.coverageOverrides ?? {};
  state.activeCoverageNote = "";
  state.designReviewOverrides = payload.localState.designReviewOverrides ?? {};
  state.activeDesignReviewNote = "";
  state.contractGaps = payload.localState.contractGaps ?? [];
  state.contractGapDraft = { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" };
  state.contractMessage = "";
  state.simulationTriageOverrides = payload.localState.simulationTriageOverrides ?? {};
  state.activeSimulationTriageNote = "";
  state.revisionRequests = payload.localState.revisionRequests ?? [];
  state.revisionDraft = { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" };
  state.revisionMessage = "";
  state.baselineSnapshot = payload.localState.baselineSnapshot ?? null;
  state.baselineName = state.baselineSnapshot?.name ?? "";
  state.impactMessage = "";
  state.handoffMessage = "";
  state.intakeForm = payload.localState.intakeForm ?? null;
  state.sourceMaterials = payload.localState.sourceMaterials ?? [];
  state.sourceDraft = { id: "", label: "", type: "document", content: "", notes: "", path: "" };
  state.sourceMessage = "";
  saveApprovalOverrides();
  saveCoverageOverrides();
  saveDesignReviewOverrides();
  saveContractGaps();
  saveSimulationTriageOverrides();
  saveRevisionRequests();
  saveBaselineSnapshot();
  await saveWorkspaceBundle(payload.bundle, state.packageName);
  await refreshWorkspaceEntries();
  recordWorkspaceActivity("restore", `Restored ${state.packageName}.`, workspaceIdForBundle(payload.bundle));
  state.workspaceMessage = `Restored ${state.packageName}.`;
}

async function refreshWorkspaceEntries(): Promise<void> {
  try {
    state.workspaceEntries = await listWorkspaceEntries();
    if (state.workspaceInspectId && !state.workspaceEntries.some((entry) => entry.id === state.workspaceInspectId)) {
      state.workspaceInspectId = "";
      state.workspaceInspectBundle = null;
      state.workspaceNameDraft = "";
      state.workspacePriorityDraft = "medium";
      state.workspaceTagDraft = "";
      state.workspaceNoteDraft = "";
    }
  } catch (error) {
    state.workspaceMessage = error instanceof Error ? error.message : "Workspace storage unavailable.";
  }
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
  if (filePath.startsWith("06-frontend-agent-contract/production-integration")) return { group: "Production Integration", nodeId: "productionIntegrationContracts" };
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
    productionIntegrationContracts: "production_integration_changed",
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
    ["06-frontend-agent-contract/data-operation-contracts.json", "Data operation contracts"],
    ["06-frontend-agent-contract/action-contracts.json", "Action contracts"],
    ["06-frontend-agent-contract/form-contracts.json", "Form contracts"],
    ["06-frontend-agent-contract/verification-contracts.json", "Verification contracts"],
    ["06-frontend-agent-contract/production-integration-contracts.json", "Production integration contracts"],
    ["06-frontend-agent-contract/production-integration-plan.md", "Production integration plan"],
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

function coverageStateForScreen(screenId: string): CoverageOverride["state"] {
  return state.coverageOverrides[screenId]?.state ?? "unreviewed";
}

function coverageTone(value: CoverageOverride["state"]): "success" | "warning" | "danger" | "neutral" {
  if (value === "reviewed") return "success";
  if (value === "blocked") return "danger";
  if (value === "needs_changes") return "warning";
  return "neutral";
}

function designReviewKey(kind: "component" | "pattern" | "token", id: string): string {
  return `${kind}:${id}`;
}

function designReviewState(key: string): DesignReviewOverride["state"] {
  return state.designReviewOverrides[key]?.state ?? "unreviewed";
}

function designReviewTone(value: DesignReviewOverride["state"]): "success" | "warning" | "danger" | "neutral" {
  if (value === "approved") return "success";
  if (value === "blocked") return "danger";
  if (value === "needs_changes") return "warning";
  return "neutral";
}

function tokenGroupNames(bundle: Bundle): string[] {
  return Object.keys(bundle.semanticTokens ?? {}).sort();
}

function gapTone(gap: ContractGap): "success" | "warning" | "danger" | "neutral" {
  if (gap.status === "resolved") return "success";
  if (gap.severity === "blocker") return "danger";
  if (gap.severity === "major") return "warning";
  return "neutral";
}

function simulationTriageKey(kind: "route" | "acceptance", id: string): string {
  return `${kind}:${id}`;
}

function simulationTriageState(key: string): SimulationTriageOverride["state"] {
  return state.simulationTriageOverrides[key]?.state ?? "untriaged";
}

function simulationTriageTone(value: SimulationTriageOverride["state"]): "success" | "warning" | "danger" | "neutral" {
  if (value === "accepted") return "success";
  if (value === "blocked") return "danger";
  if (value === "needs_work") return "warning";
  return "neutral";
}

function revisionRequestPayload(request: RevisionRequest): Record<string, unknown> {
  return {
    request_id: request.id,
    priority: request.priority,
    change_type: request.changeType,
    summary: request.summary,
    affected_artifacts: lines(request.affectedArtifacts),
    requested_changes: lines(request.requestedChanges),
    status: request.status,
    updated_at: request.updatedAt
  };
}

function suggestedRevisionDraft(): Omit<RevisionRequest, "id" | "status" | "updatedAt"> {
  const openGaps = state.contractGaps.filter((gap) => gap.status !== "resolved");
  const blockedScreens = Object.entries(state.coverageOverrides).filter(([, value]) => value.state === "blocked" || value.state === "needs_changes");
  const blockedDesign = Object.entries(state.designReviewOverrides).filter(([, value]) => value.state === "blocked" || value.state === "needs_changes");
  return {
    priority: openGaps.some((gap) => gap.severity === "blocker") || blockedScreens.some(([, value]) => value.state === "blocked") ? "high" : "medium",
    changeType: openGaps.some((gap) => gap.category === "backend" || gap.category === "auth" || gap.category === "production_integration")
      ? "production_integration_changed"
      : openGaps.some((gap) => gap.category === "data_contract")
        ? "data_contract_changed"
        : blockedDesign.length
          ? "component_registry_changed"
          : "screen_spec_changed",
    summary: "Resolve open workbench review findings.",
    affectedArtifacts: [
      ...openGaps.map((gap) => gap.artifact),
      ...blockedScreens.map(([screenId]) => `05-screen-specs/${screenId}.yaml`),
      ...blockedDesign.map(([itemId]) => itemId)
    ].join("\n"),
    requestedChanges: [
      ...openGaps.map((gap) => `${gap.category}: ${gap.description}`),
      ...blockedScreens.map(([screenId, value]) => `${screenId}: ${value.note || value.state}`),
      ...blockedDesign.map(([itemId, value]) => `${itemId}: ${value.note || value.state}`)
    ].join("\n")
  };
}

function governanceActionQueue(): Array<{ source: string; item: string; severity: "blocker" | "major" | "minor"; status: string; note: string }> {
  return [
    ...state.contractGaps.filter((gap) => gap.status !== "resolved").map((gap) => ({
      source: "Contract gap",
      item: gap.artifact,
      severity: gap.severity,
      status: gap.status,
      note: gap.description
    })),
    ...Object.entries(state.coverageOverrides).filter(([, value]) => value.state === "blocked" || value.state === "needs_changes").map(([screenId, value]) => ({
      source: "Screen coverage",
      item: screenId,
      severity: value.state === "blocked" ? "blocker" as const : "major" as const,
      status: value.state,
      note: value.note
    })),
    ...Object.entries(state.designReviewOverrides).filter(([, value]) => value.state === "blocked" || value.state === "needs_changes").map(([itemId, value]) => ({
      source: "Design review",
      item: itemId,
      severity: value.state === "blocked" ? "blocker" as const : "major" as const,
      status: value.state,
      note: value.note
    })),
    ...Object.entries(state.simulationTriageOverrides).filter(([, value]) => value.state === "blocked" || value.state === "needs_work").map(([itemId, value]) => ({
      source: "Simulation triage",
      item: itemId,
      severity: value.state === "blocked" ? "blocker" as const : "major" as const,
      status: value.state,
      note: value.note
    })),
    ...state.revisionRequests.filter((request) => request.status !== "sent").map((request) => ({
      source: "Revision request",
      item: request.changeType,
      severity: request.priority === "high" ? "blocker" as const : request.priority === "medium" ? "major" as const : "minor" as const,
      status: request.status,
      note: request.summary
    }))
  ].sort((a, b) => {
    const order = { blocker: 0, major: 1, minor: 2 };
    return order[a.severity] - order[b.severity] || a.source.localeCompare(b.source);
  });
}

function handoffPrompt(bundle: Bundle): string {
  const required = requiredHandoffArtifacts(bundle).filter((artifact) => artifact.present).map((artifact) => `- ${artifact.path}`).join("\n");
  return [
    `You are building from the Archetype package for ${bundle.productModel.product_name ?? bundle.manifest.project_slug}.`,
    "",
    "Use the package as the source of truth. Build only the routes, screens, components, patterns, tokens, data contracts, production integration adapters, states, and acceptance criteria declared in the package.",
    "",
    "Required starting artifacts:",
    required,
    "",
    "Do not invent new routes, visual styles, components, backend behavior, auth behavior, or production copy when the package is missing a required decision. Report a gap instead.",
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
    "## Screen Coverage Review",
    ...(Object.keys(state.coverageOverrides).length
      ? Object.entries(state.coverageOverrides).map(([screenId, coverage]) => `- ${screenId}: ${coverage.state}${coverage.note ? `, ${coverage.note}` : ""}`)
      : ["- None"]),
    "",
    "## Design System Review",
    ...(Object.keys(state.designReviewOverrides).length
      ? Object.entries(state.designReviewOverrides).map(([itemId, review]) => `- ${itemId}: ${review.state}${review.note ? `, ${review.note}` : ""}`)
      : ["- None"]),
    "",
    "## Frontend Contract Gaps",
    ...(state.contractGaps.length
      ? state.contractGaps.map((gap) => `- [${gap.status}] ${gap.severity} ${gap.category} in ${gap.artifact}: ${gap.description}`)
      : ["- None"]),
    "",
    "## Build Simulation Triage",
    ...(Object.keys(state.simulationTriageOverrides).length
      ? Object.entries(state.simulationTriageOverrides).map(([itemId, triage]) => `- ${itemId}: ${triage.state}${triage.note ? `, ${triage.note}` : ""}`)
      : ["- None"]),
    "",
    "## Revision Requests",
    ...(state.revisionRequests.length
      ? state.revisionRequests.map((request) => `- [${request.status}] ${request.priority} ${request.changeType}: ${request.summary}`)
      : ["- None"]),
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
    screenCoverage: state.coverageOverrides,
    designSystemReview: state.designReviewOverrides,
    contractGaps: state.contractGaps,
    buildSimulationTriage: state.simulationTriageOverrides,
    revisionRequests: state.revisionRequests,
    productionIntegration: bundle.productionIntegrationContracts,
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

function formFromIntake(value: Record<string, unknown>, bundle: Bundle): IntakeFormState {
  const brand = typeof value.brand === "object" && value.brand && !Array.isArray(value.brand) ? value.brand as Record<string, unknown> : {};
  return {
    projectName: String(value.projectName ?? bundle.productModel.product_name ?? ""),
    context: String(value.context ?? ""),
    goals: Array.isArray(value.goals) ? value.goals.map(String).join("\n") : "",
    businessGoals: Array.isArray(value.businessGoals) ? value.businessGoals.map(String).join("\n") : "",
    users: Array.isArray(value.users) ? value.users.map((user) => typeof user === "string" ? user : JSON.stringify(user)).join("\n") : "",
    brandAttributes: Array.isArray(brand.attributes) ? brand.attributes.map(String).join(", ") : "clear, precise, trustworthy",
    primaryColor: String(brand.primaryColor ?? "#2563EB"),
    tone: String(brand.tone ?? "Clear, direct, and low-hype."),
    operatingMode: String(value.operatingMode ?? bundle.manifest.operating_mode ?? "full_architecture")
  };
}

function ensureIntakeForm(bundle: Bundle): IntakeFormState {
  if (!state.intakeForm) {
    state.intakeForm = formFromIntake(defaultIntakeFromBundle(bundle), bundle);
  }
  return state.intakeForm;
}

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function intakeFromForm(form: IntakeFormState): Record<string, unknown> {
  const intake: Record<string, unknown> = {
    projectName: form.projectName.trim() || "Archetype Project",
    context: form.context.trim(),
    goals: lines(form.goals),
    businessGoals: lines(form.businessGoals),
    users: lines(form.users),
    brand: {
      attributes: form.brandAttributes.split(",").map((item) => item.trim()).filter(Boolean),
      primaryColor: form.primaryColor.trim() || "#2563EB",
      tone: form.tone.trim()
    },
    operatingMode: form.operatingMode
  };
  const materials = state.sourceMaterials.map((material, index) => ({
    id: material.id || `source_material_${index + 1}`,
    label: material.label,
    type: material.type,
    content: material.content,
    notes: material.notes,
    path: material.path
  })).filter((material) => material.label || material.content || material.notes || material.path);
  if (materials.length > 0) intake.materials = materials;
  return intake;
}

function ensureGenerationDraft(bundle: Bundle): string {
  if (!state.generationDraft) {
    state.generationDraft = pretty(defaultIntakeFromBundle(bundle));
  }
  return state.generationDraft;
}

function findingsForMaterial(material: SourceMaterialDraft): SourceFinding[] {
  const content = [material.label, material.content, material.notes, material.path].join("\n");
  const rules: Array<SourceFinding & { pattern: RegExp }> = [
    {
      severity: "blocker",
      category: "secret",
      finding: "Potential API key, GitHub token, or cloud credential.",
      pattern: /\b(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/
    },
    {
      severity: "major",
      category: "secret",
      finding: "Potential named secret or credential assignment.",
      pattern: /\b(password|api[_-]?key|secret|token)\s*[:=]\s*['"]?[^'"\s]{8,}/i
    },
    {
      severity: "major",
      category: "prompt injection",
      finding: "Embedded instruction attempts to override system behavior.",
      pattern: /\b(ignore|disregard|override)\b.{0,60}\b(previous|system|developer|instruction|prompt)\b/i
    },
    {
      severity: "minor",
      category: "PII",
      finding: "Potential email address.",
      pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
    },
    {
      severity: "major",
      category: "regulated data",
      finding: "Potential regulated-domain data.",
      pattern: /\b(patient|diagnosis|medication|clinical|claim number|credit score|card number)\b/i
    }
  ];
  return rules.filter((rule) => rule.pattern.test(content)).map(({ severity, category, finding }) => ({ severity, category, finding }));
}

function sourceTone(findings: SourceFinding[]): "success" | "warning" | "danger" {
  if (findings.some((finding) => finding.severity === "blocker")) return "danger";
  if (findings.length > 0) return "warning";
  return "success";
}

function sourceTypeForFile(fileName: string): SourceMaterialDraft["type"] {
  if (/\.(ts|tsx|js|jsx|css|html|py|rb|go|rs)$/i.test(fileName)) return "code";
  if (/\.(fig|sketch|tokens\.json)$/i.test(fileName)) return "design_file";
  if (/\.(png|jpe?g|webp|gif)$/i.test(fileName)) return "screenshot";
  if (/brand|voice|tone|style/i.test(fileName)) return "brand";
  if (/\.(md|txt|doc|docx|pdf)$/i.test(fileName)) return "document";
  return "other";
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

function renderSourceMaterials(): string {
  const findings = state.sourceMaterials.flatMap(findingsForMaterial);
  return panel("Source Materials", `
    <div class="form-grid">
      ${inputField("source-label", state.sourceDraft.label, "Source label")}
      ${selectField("source-type", state.sourceDraft.type, "Source type", ["document", "code", "design_file", "screenshot", "brand", "other"])}
      ${inputField("source-path", state.sourceDraft.path, "Path or URL")}
      ${inputField("source-notes", state.sourceDraft.notes, "Notes")}
    </div>
    <div style="height:10px"></div>
    ${textArea("source-content", state.sourceDraft.content, "Content excerpt", "textarea short")}
    <div class="control-row">
      <button class="button primary" id="add-source-material" type="button">Add source</button>
      <button class="button" id="import-source-files" type="button">Import files</button>
      <button class="button" id="clear-source-materials" type="button" ${state.sourceMaterials.length ? "" : "disabled"}>Clear sources</button>
      <input id="source-file-input" type="file" multiple hidden />
    </div>
    ${state.sourceMessage ? `<div class="notice" role="status">${esc(state.sourceMessage)}</div>` : ""}
    <div style="height:10px"></div>
    <div class="mini-metrics">
      <div><strong>${esc(state.sourceMaterials.length)}</strong><span>Sources</span></div>
      <div><strong>${esc(findings.length)}</strong><span>Safety findings</span></div>
      <div><strong>${esc(findings.filter((finding) => finding.severity === "blocker").length)}</strong><span>Blockers</span></div>
    </div>
    <div style="margin-top:10px">
      ${state.sourceMaterials.length ? table(["Safety", "Type", "Label", "Findings", "Actions"], state.sourceMaterials.map((material) => {
        const materialFindings = findingsForMaterial(material);
        return [
          badge(materialFindings.length ? `${materialFindings.length} findings` : "clear", sourceTone(materialFindings)),
          esc(material.type),
          esc(material.label || material.path || "Untitled source"),
          esc(materialFindings.map((finding) => `${finding.severity}: ${finding.finding}`).join("; ") || "None"),
          `<button class="button small" data-source-remove="${esc(material.id)}" type="button">Remove</button>`
        ];
      })) : `<div class="empty">No source materials added.</div>`}
    </div>
  `);
}

function renderGeneration(bundle: Bundle): string {
  const draft = ensureGenerationDraft(bundle);
  const form = ensureIntakeForm(bundle);
  const parsed = parseGenerationDraft();
  const fileName = parsed.ok ? intakeFileName(parsed.value) : "custom-project-intake.json";
  const command = `node dist/cli.js generate --input examples/${fileName} --out tmp/${fileName.replace("-intake.json", "-output")}`;
  return `
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Intake Builder", `
        <div class="form-grid">
          ${inputField("intake-project-name", form.projectName, "Project name")}
          ${selectField("intake-mode", form.operatingMode, "Operating mode", ["fast_architecture", "full_architecture", "existing_product_audit", "contract_repair"])}
          ${inputField("intake-primary-color", form.primaryColor, "Primary color", "color")}
          ${inputField("intake-brand-attributes", form.brandAttributes, "Brand attributes")}
        </div>
        <div style="height:10px"></div>
        ${textArea("intake-context", form.context, "Context", "textarea short")}
        <div class="form-grid" style="margin-top:10px">
          ${textArea("intake-goals", form.goals, "User goals", "textarea short")}
          ${textArea("intake-business-goals", form.businessGoals, "Business goals", "textarea short")}
          ${textArea("intake-users", form.users, "Users", "textarea short")}
          ${textArea("intake-tone", form.tone, "Tone", "textarea short")}
        </div>
        <div class="control-row">
          <button class="button primary" id="apply-intake-form" type="button">Create project draft</button>
          <button class="button" id="load-form-from-draft" type="button">Load from draft</button>
          <button class="button" id="clear-intake-form" type="button">Clear form</button>
        </div>
      `)}
      ${panel("Generation Draft", `
        ${textArea("generation-draft", draft, "Intake JSON")}
        <div class="control-row">
          <button class="button primary" id="validate-draft" type="button">Validate draft</button>
          <button class="button" id="reset-draft" type="button">Use current package</button>
          <button class="button" id="download-draft" type="button">Download intake</button>
        </div>
        ${state.generationMessage ? `<div class="notice" role="status">${esc(state.generationMessage)}</div>` : ""}
      `)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Run Command", `
        ${parsed.ok ? badge("draft valid", "success") : badge("draft invalid", "danger")}
        <div style="height:10px"></div>
        ${parsed.ok ? code(command) : `<div class="empty">${esc(parsed.error)}</div>`}
        <div class="control-row">
          <button class="button" id="copy-command" type="button" ${parsed.ok ? "" : "disabled"}>Copy command</button>
        </div>
      `)}
      ${panel("Generation Contract", code({
        required: ["context"],
        recommended: ["projectName", "goals", "businessGoals", "users", "brand", "operatingMode"],
        supportedModes: ["fast_architecture", "full_architecture", "existing_product_audit", "contract_repair"]
      }))}
    </div>
    <div style="margin-top:14px">
      ${renderSourceMaterials()}
    </div>
    <div style="margin-top:14px">
      ${panel("Current Package Seed", code(defaultIntakeFromBundle(bundle)))}
    </div>
  `;
}

function renderEvidence(bundle: Bundle): string {
  return `
    <div class="grid cols-2" style="margin-top:14px">
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
  const reviewed = bundle.screenInventory.screens.filter((screen) => coverageStateForScreen(String(screen.screen_id)) === "reviewed").length;
  const needsChanges = bundle.screenInventory.screens.filter((screen) => coverageStateForScreen(String(screen.screen_id)) === "needs_changes").length;
  const blocked = bundle.screenInventory.screens.filter((screen) => coverageStateForScreen(String(screen.screen_id)) === "blocked").length;
  return `
    <div class="grid cols-3">
      ${metric("Reviewed screens", `${reviewed}/${bundle.screenInventory.screens.length}`, reviewed === bundle.screenInventory.screens.length ? "success" : "warning")}
      ${metric("Needs changes", needsChanges, needsChanges > 0 ? "warning" : "success")}
      ${metric("Blocked", blocked, blocked > 0 ? "danger" : "success")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
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
      ${panel("Coverage Review", `
        ${table(["Screen", "Route", "State", "Notes", "Actions"], bundle.screenInventory.screens.map((screen) => {
          const route = bundle.routeMap.routes.find((item) => item.screen_id === screen.screen_id);
          const coverage = coverageStateForScreen(String(screen.screen_id));
          const note = state.coverageOverrides[String(screen.screen_id)]?.note ?? "";
          return [
            esc(screen.screen_id),
            `<code>${esc(route?.route ?? "")}</code>`,
            badge(coverage, coverageTone(coverage)),
            esc(note || "None"),
            `<div class="control-row compact"><button class="button small" data-coverage-screen="${esc(screen.screen_id)}" data-coverage-state="reviewed" type="button">Reviewed</button><button class="button small" data-coverage-screen="${esc(screen.screen_id)}" data-coverage-state="needs_changes" type="button">Needs changes</button><button class="button small" data-coverage-screen="${esc(screen.screen_id)}" data-coverage-state="blocked" type="button">Block</button></div>`
          ];
        }))}
        <div style="height:10px"></div>
        ${textArea("coverage-note", state.activeCoverageNote, "Coverage note for the next screen action", "textarea short")}
        <div class="control-row">
          <button class="button" id="reset-coverage" type="button">Reset coverage states</button>
        </div>
      `)}
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
              <button class="list-button ${selected?.name === screen.name ? "active" : ""}" data-screen="${esc(screen.name)}" type="button" ${selected?.name === screen.name ? "aria-current=\"true\"" : ""}>
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
  const componentContracts = bundle.componentContracts.contracts ?? [];
  const patternContracts = bundle.patternContracts.contracts ?? [];
  const typeRoles = Object.keys(bundle.typographySystem.type_roles ?? {});
  const reviewItems = [
    ...bundle.componentRegistry.components.map((component) => designReviewKey("component", String(component.name))),
    ...bundle.patternRegistry.patterns.map((pattern) => designReviewKey("pattern", String(pattern.name))),
    ...tokenGroupNames(bundle).map((token) => designReviewKey("token", token))
  ];
  const approved = reviewItems.filter((key) => designReviewState(key) === "approved").length;
  const needsChanges = reviewItems.filter((key) => designReviewState(key) === "needs_changes").length;
  const blocked = reviewItems.filter((key) => designReviewState(key) === "blocked").length;
  return `
    <div class="grid cols-3">
      ${metric("Approved items", `${approved}/${reviewItems.length}`, approved === reviewItems.length ? "success" : "warning")}
      ${metric("Needs changes", needsChanges, needsChanges > 0 ? "warning" : "success")}
      ${metric("Blocked", blocked, blocked > 0 ? "danger" : "success")}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Component contracts", componentContracts.length, componentContracts.length === bundle.componentRegistry.components.length ? "success" : "warning")}
      ${metric("Pattern contracts", patternContracts.length, patternContracts.length === bundle.patternRegistry.patterns.length ? "success" : "warning")}
      ${metric("Type roles", typeRoles.length, typeRoles.length ? "success" : "warning")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Components", table(["Component", "Category", "State", "Actions"], bundle.componentRegistry.components.map((component) => {
        const key = designReviewKey("component", String(component.name));
        const reviewState = designReviewState(key);
        return [
          `<div><strong>${esc(component.name)}</strong><div class="muted">${esc((component.used_on_screens ?? []).join(", ") || "none")}</div></div>`,
          esc(component.category),
          badge(reviewState, designReviewTone(reviewState)),
          `<div class="control-row compact"><button class="button small" data-design-review="${esc(key)}" data-design-state="approved" type="button">Approve</button><button class="button small" data-design-review="${esc(key)}" data-design-state="needs_changes" type="button">Needs changes</button><button class="button small" data-design-review="${esc(key)}" data-design-state="blocked" type="button">Block</button></div>`
        ];
      })))}
      ${panel("Patterns", table(["Pattern", "Data", "State", "Actions"], bundle.patternRegistry.patterns.map((pattern) => {
        const key = designReviewKey("pattern", String(pattern.name));
        const reviewState = designReviewState(key);
        return [
          `<div><strong>${esc(pattern.name)}</strong><div class="muted">${esc((pattern.used_on_screens ?? []).join(", ") || "none")}</div></div>`,
          esc((pattern.data_requirements ?? []).join(", ")),
          badge(reviewState, designReviewTone(reviewState)),
          `<div class="control-row compact"><button class="button small" data-design-review="${esc(key)}" data-design-state="approved" type="button">Approve</button><button class="button small" data-design-review="${esc(key)}" data-design-state="needs_changes" type="button">Needs changes</button><button class="button small" data-design-review="${esc(key)}" data-design-state="blocked" type="button">Block</button></div>`
        ];
      })))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Token Groups", table(["Group", "State", "Actions"], tokenGroupNames(bundle).map((token) => {
        const key = designReviewKey("token", token);
        const reviewState = designReviewState(key);
        return [
          esc(token),
          badge(reviewState, designReviewTone(reviewState)),
          `<div class="control-row compact"><button class="button small" data-design-review="${esc(key)}" data-design-state="approved" type="button">Approve</button><button class="button small" data-design-review="${esc(key)}" data-design-state="needs_changes" type="button">Needs changes</button><button class="button small" data-design-review="${esc(key)}" data-design-state="blocked" type="button">Block</button></div>`
        ];
      })))}
      ${panel("Design Review Note", `
        ${textArea("design-review-note", state.activeDesignReviewNote, "Design note for the next review action", "textarea short")}
        <div class="control-row">
          <button class="button" id="reset-design-review" type="button">Reset design review</button>
        </div>
      `)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Semantic Tokens", code(bundle.semanticTokens))}
      ${panel("Primitive Tokens", code(bundle.primitiveTokens))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Component Contracts", table(["Component", "Props", "States", "Screens"], componentContracts.slice(0, 12).map((contract: any) => [
        esc(contract.name),
        String(contract.prop_contract?.length ?? 0),
        String(contract.state_contract?.length ?? 0),
        esc((contract.used_on_screens ?? []).join(", ") || "none")
      ])))}
      ${panel("Pattern Contracts", table(["Pattern", "Components", "States", "Workflows"], patternContracts.slice(0, 12).map((contract: any) => [
        esc(contract.name),
        esc((contract.component_refs ?? []).join(", ")),
        String(contract.state_contract?.length ?? 0),
        esc((contract.workflow_refs ?? []).join(", ") || "none")
      ])))}
      ${panel("Token Contract", code(bundle.tokenContracts))}
      ${panel("Typography System", code(bundle.typographySystem))}
    </div>
  `;
}

function renderContract(bundle: Bundle): string {
  const openGaps = state.contractGaps.filter((gap) => gap.status === "open");
  const blockerGaps = state.contractGaps.filter((gap) => gap.status !== "resolved" && gap.severity === "blocker");
  const resolvedGaps = state.contractGaps.filter((gap) => gap.status === "resolved");
  const operationQueries = bundle.dataOperationContracts.queries ?? [];
  const actionContracts = bundle.actionContracts.actions ?? [];
  const formContracts = bundle.formContracts.forms ?? [];
  const verificationSuites = bundle.verificationContracts.test_suites ?? [];
  const productionIntegration = bundle.productionIntegrationContracts ?? {};
  const endpointMappings = productionIntegration.backend_api?.endpoint_mappings ?? [];
  const routeGuards = productionIntegration.authentication_authorization?.route_guards ?? [];
  const actionGuards = productionIntegration.authentication_authorization?.action_guards ?? [];
  const copySurfaces = productionIntegration.content_brand?.copy_surfaces ?? [];
  const reviewGates = productionIntegration.human_review?.review_gates ?? [];
  return `
    <div class="grid cols-3">
      ${metric("Open gaps", openGaps.length, openGaps.length ? "warning" : "success")}
      ${metric("Blockers", blockerGaps.length, blockerGaps.length ? "danger" : "success")}
      ${metric("Resolved", resolvedGaps.length, resolvedGaps.length ? "success" : "neutral")}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Queries", operationQueries.length, operationQueries.length ? "success" : "warning")}
      ${metric("Actions", actionContracts.length, actionContracts.length ? "success" : "warning")}
      ${metric("Verification tests", bundle.verificationContracts.coverage?.test_count ?? 0, (bundle.verificationContracts.coverage?.test_count ?? 0) ? "success" : "warning")}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Integration endpoints", endpointMappings.length, endpointMappings.length ? "success" : "warning")}
      ${metric("Auth guards", routeGuards.length + actionGuards.length, routeGuards.length ? "success" : "warning")}
      ${metric("Review gates", reviewGates.length, reviewGates.length ? "warning" : "danger")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Build Manifest", code(bundle.buildManifest))}
      ${panel("Data Contracts", code(bundle.dataContracts))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Component Usage", code(bundle.componentUsageMap))}
      ${panel("Acceptance Criteria", code(bundle.acceptanceCriteria))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Data Operations", table(["Query", "Screen", "Entities", "States"], operationQueries.map((query: any) => [
        esc(query.query_id),
        esc(query.screen_id),
        esc((query.entity_refs ?? []).join(", ")),
        esc(Object.values(query.state_mapping ?? {}).join(", "))
      ])))}
      ${panel("Action Contracts", table(["Action", "Type", "Target", "Permission"], actionContracts.slice(0, 18).map((action: any) => [
        esc(action.action_id),
        esc(action.action_type),
        esc(action.action_target),
        esc(action.permission)
      ])))}
      ${panel("Form Contracts", table(["Form", "Screen", "Entity", "Fields"], formContracts.map((form: any) => [
        esc(form.form_id),
        esc(form.screen_id),
        esc(form.entity_ref),
        String(form.fields?.length ?? 0)
      ])))}
      ${panel("Verification Suites", table(["Suite", "Tests"], verificationSuites.map((suite: any) => [
        esc(suite.suite_id),
        String(suite.tests?.length ?? 0)
      ])))}
      ${panel("Production Endpoints", table(["Operation", "Kind", "Method", "Path"], endpointMappings.slice(0, 24).map((mapping: any) => [
        esc(mapping.operation_id),
        esc(mapping.operation_kind),
        esc(mapping.proposed_endpoint?.method),
        `<code>${esc(mapping.proposed_endpoint?.path_template)}</code>`
      ])))}
      ${panel("Production Review Gates", table(["Gate", "Status", "Artifacts"], reviewGates.map((gate: any) => [
        esc(gate.label ?? gate.review_id),
        badge(gate.status ?? "pending", "warning"),
        esc((gate.artifacts ?? []).join(", "))
      ])))}
      ${panel("Copy Surfaces", table(["Screen", "Heading", "Actions"], copySurfaces.map((surface: any) => [
        esc(surface.screen_id),
        esc(surface.heading),
        esc((surface.primary_action_labels ?? []).join(", ") || "none")
      ])))}
      ${panel("Production Integration Plan", code(bundle.productionIntegrationPlan))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Gap Reporter", `
        <div class="form-grid">
          ${selectField("gap-category", state.contractGapDraft.category, "Category", ["route", "screen_state", "component", "data_contract", "backend", "auth", "production_integration", "accessibility", "copy", "other"])}
          ${selectField("gap-severity", state.contractGapDraft.severity, "Severity", ["blocker", "major", "minor"])}
          ${inputField("gap-artifact", state.contractGapDraft.artifact, "Artifact")}
        </div>
        <div style="height:10px"></div>
        ${textArea("gap-description", state.contractGapDraft.description, "Gap description", "textarea short")}
        <div class="control-row">
          <button class="button primary" id="add-contract-gap" type="button">Add gap</button>
          <button class="button" id="clear-resolved-gaps" type="button" ${resolvedGaps.length ? "" : "disabled"}>Clear resolved</button>
        </div>
        ${state.contractMessage ? `<div class="notice" role="status">${esc(state.contractMessage)}</div>` : ""}
      `)}
      ${panel("Contract Gaps", state.contractGaps.length ? table(["Status", "Severity", "Category", "Artifact", "Description", "Actions"], state.contractGaps.map((gap) => [
        badge(gap.status, gapTone(gap)),
        badge(gap.severity, gap.severity === "blocker" ? "danger" : gap.severity === "major" ? "warning" : "neutral"),
        esc(gap.category),
        `<code>${esc(gap.artifact)}</code>`,
        esc(gap.description),
        `<div class="control-row compact"><button class="button small" data-gap="${esc(gap.id)}" data-gap-status="resolved" type="button">Resolve</button><button class="button small" data-gap="${esc(gap.id)}" data-gap-status="deferred" type="button">Defer</button><button class="button small" data-gap="${esc(gap.id)}" data-gap-status="open" type="button">Reopen</button><button class="button small" data-gap-delete="${esc(gap.id)}" type="button">Delete</button></div>`
      ])) : `<div class="empty">No frontend contract gaps.</div>`)}
    </div>
  `;
}

function renderSimulation(bundle: Bundle): string {
  const routeItems = bundle.buildSimulation.routeSimulation?.routes ?? [];
  const acceptanceItems = bundle.buildSimulation.acceptanceSimulation?.screens ?? [];
  const triageKeys = [
    ...routeItems.map((route: any) => simulationTriageKey("route", String(route.route))),
    ...acceptanceItems.map((screen: any) => simulationTriageKey("acceptance", String(screen.screen_id)))
  ];
  const accepted = triageKeys.filter((key) => simulationTriageState(key) === "accepted").length;
  const needsWork = triageKeys.filter((key) => simulationTriageState(key) === "needs_work").length;
  const blocked = triageKeys.filter((key) => simulationTriageState(key) === "blocked").length;
  return `
    <div class="grid cols-3">
      ${metric("Simulation", bundle.buildSimulation.status ?? "warning", statusTone(bundle.buildSimulation.status))}
      ${metric("Routes", bundle.buildSimulation.routeSimulation?.routes?.length ?? 0)}
      ${metric("Screens", bundle.buildSimulation.stateCoverage?.screens?.length ?? 0)}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Accepted checks", `${accepted}/${triageKeys.length}`, accepted === triageKeys.length ? "success" : "warning")}
      ${metric("Needs work", needsWork, needsWork ? "warning" : "success")}
      ${metric("Blocked", blocked, blocked ? "danger" : "success")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Simulation Report", code(bundle.buildSimulation.report))}
      ${panel("Route Simulation", code(bundle.buildSimulation.routeSimulation))}
      ${panel("Component Resolution", code(bundle.buildSimulation.componentResolution))}
      ${panel("Data Coverage", code(bundle.buildSimulation.dataContractCoverage))}
      ${panel("Verification Coverage", code(bundle.buildSimulation.acceptanceSimulation?.verification_suites ?? []))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Route Triage", table(["Route", "Screen", "Simulation", "Triage", "Actions"], routeItems.map((route: any) => {
        const key = simulationTriageKey("route", String(route.route));
        const triage = simulationTriageState(key);
        return [
          `<code>${esc(route.route)}</code>`,
          esc(route.screen_id),
          badge(route.status, statusTone(route.status)),
          badge(triage, simulationTriageTone(triage)),
          `<div class="control-row compact"><button class="button small" data-simulation-triage="${esc(key)}" data-simulation-state="accepted" type="button">Accept</button><button class="button small" data-simulation-triage="${esc(key)}" data-simulation-state="needs_work" type="button">Needs work</button><button class="button small" data-simulation-triage="${esc(key)}" data-simulation-state="blocked" type="button">Block</button></div>`
        ];
      })))}
      ${panel("Acceptance Coverage", table(["Screen", "Criteria", "Methods", "Triage", "Actions"], acceptanceItems.map((screen: any) => {
        const key = simulationTriageKey("acceptance", String(screen.screen_id));
        const triage = simulationTriageState(key);
        return [
          esc(screen.screen_id),
          esc(screen.criteria_count),
          esc((screen.verification_methods ?? []).join(", ")),
          badge(triage, simulationTriageTone(triage)),
          `<div class="control-row compact"><button class="button small" data-simulation-triage="${esc(key)}" data-simulation-state="accepted" type="button">Accept</button><button class="button small" data-simulation-triage="${esc(key)}" data-simulation-state="needs_work" type="button">Needs work</button><button class="button small" data-simulation-triage="${esc(key)}" data-simulation-state="blocked" type="button">Block</button></div>`
        ];
      })))}
    </div>
    <div style="margin-top:14px">
      ${panel("Simulation Triage Note", `
        ${textArea("simulation-triage-note", state.activeSimulationTriageNote, "Simulation note for the next triage action", "textarea short")}
        <div class="control-row">
          <button class="button" id="reset-simulation-triage" type="button">Reset simulation triage</button>
        </div>
      `)}
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
        ${state.impactMessage ? `<div class="notice" role="status">${esc(state.impactMessage)}</div>` : ""}
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
        ${state.handoffMessage ? `<div class="notice" role="status">${esc(state.handoffMessage)}</div>` : ""}
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

function renderGovernance(bundle: Bundle): string {
  const queue = governanceActionQueue();
  const approvalGates = bundle.revision.approvalGates?.gates ?? [];
  const approvedGates = approvalGates.filter((gate: any) => approvalStateForGate(gate) === "approved").length;
  const blockers = queue.filter((item) => item.severity === "blocker").length;
  const reviewSignals = {
    approvalGates: `${approvedGates}/${approvalGates.length}`,
    coverageOverrides: Object.keys(state.coverageOverrides).length,
    designReviews: Object.keys(state.designReviewOverrides).length,
    contractGaps: state.contractGaps.length,
    simulationTriage: Object.keys(state.simulationTriageOverrides).length,
    revisionRequests: state.revisionRequests.length
  };
  return `
    <div class="grid cols-3">
      ${metric("Action queue", queue.length, queue.length ? "warning" : "success")}
      ${metric("Blockers", blockers, blockers ? "danger" : "success")}
      ${metric("Approval gates", `${approvedGates}/${approvalGates.length}`, approvedGates === approvalGates.length ? "success" : "warning")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Governance Signals", code(reviewSignals))}
      ${panel("Readiness Summary", code({
        score: bundle.readiness.score,
        readyForFrontendAgent: bundle.readiness.readyForFrontendAgent,
        blockers: bundle.readiness.blockers,
        warnings: bundle.readiness.warnings,
        humanReview: bundle.readiness.requiredHumanReview
      }))}
    </div>
    <div style="margin-top:14px">
      ${panel("Action Queue", queue.length ? table(["Severity", "Source", "Item", "Status", "Note"], queue.map((item) => [
        badge(item.severity, item.severity === "blocker" ? "danger" : item.severity === "major" ? "warning" : "neutral"),
        esc(item.source),
        esc(item.item),
        esc(item.status),
        esc(item.note || "None")
      ])) : `<div class="empty">No local governance actions.</div>`)}
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
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Change Request Composer", `
        <div class="form-grid">
          ${selectField("revision-priority", state.revisionDraft.priority, "Priority", ["low", "medium", "high"])}
          ${selectField("revision-change-type", state.revisionDraft.changeType, "Change type", ["evidence_changed", "product_model_changed", "route_map_changed", "screen_spec_changed", "component_registry_changed", "data_contract_changed", "production_integration_changed", "accessibility_rule_changed"])}
        </div>
        <div style="height:10px"></div>
        ${inputField("revision-summary", state.revisionDraft.summary, "Summary")}
        <div class="form-grid" style="margin-top:10px">
          ${textArea("revision-artifacts", state.revisionDraft.affectedArtifacts, "Affected artifacts", "textarea short")}
          ${textArea("revision-changes", state.revisionDraft.requestedChanges, "Requested changes", "textarea short")}
        </div>
        <div class="control-row">
          <button class="button primary" id="add-revision-request" type="button">Add request</button>
          <button class="button" id="suggest-revision-request" type="button">Use open findings</button>
          <button class="button" id="download-revision-requests" type="button" ${state.revisionRequests.length ? "" : "disabled"}>Download requests</button>
        </div>
        ${state.revisionMessage ? `<div class="notice" role="status">${esc(state.revisionMessage)}</div>` : ""}
      `)}
      ${panel("Revision Requests", state.revisionRequests.length ? table(["Status", "Priority", "Type", "Summary", "Actions"], state.revisionRequests.map((request) => [
        badge(request.status, request.status === "sent" ? "success" : request.status === "ready" ? "warning" : "neutral"),
        badge(request.priority, request.priority === "high" ? "danger" : request.priority === "medium" ? "warning" : "neutral"),
        esc(request.changeType),
        esc(request.summary),
        `<div class="control-row compact"><button class="button small" data-revision-request="${esc(request.id)}" data-revision-status="ready" type="button">Ready</button><button class="button small" data-revision-request="${esc(request.id)}" data-revision-status="sent" type="button">Sent</button><button class="button small" data-revision-delete="${esc(request.id)}" type="button">Delete</button></div>`
      ])) : `<div class="empty">No revision requests.</div>`)}
    </div>
  `;
}

function renderContent(bundle: Bundle): string {
  switch (state.view) {
    case "overview":
      return renderOverview(bundle);
    case "workspace":
      return renderWorkspace(bundle);
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
    case "governance":
      return renderGovernance(bundle);
    case "revision":
      return renderRevision(bundle);
  }
}

function render(): void {
  const bundle = state.bundle;
  if (!bundle) {
    app.innerHTML = `<main class="main" id="main-content"><div class="empty">Package unavailable.</div></main>`;
    return;
  }
  const viewLabel = views.find((view) => view.id === state.view)?.label ?? "Overview";
  app.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
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
            <button class="nav-item ${state.view === view.id ? "active" : ""}" data-view="${view.id}" type="button" ${state.view === view.id ? "aria-current=\"page\"" : ""}>
              <span>${esc(view.label)}</span>
              <span class="nav-count">${esc(view.count(bundle))}</span>
            </button>
          `).join("")}
        </nav>
        <div class="footer-note">${esc(state.packageName)} · ${esc(bundle.manifest.project_slug ?? "package")}</div>
      </aside>
      <main class="main" id="main-content" tabindex="-1">
        <div class="topbar">
          <div>
            <div class="eyebrow">${esc(viewLabel)}</div>
            <h1>${esc(bundle.productModel.product_name ?? "Archetype Package")}</h1>
            <div class="meta-line">${esc(bundle.productModel.product_type ?? "")} · ${esc(bundle.manifest.operating_mode ?? "")}</div>
          </div>
          <div class="status-strip" aria-label="Package status">
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
  document.querySelector<HTMLTextAreaElement>("#coverage-note")?.addEventListener("input", (event) => {
    state.activeCoverageNote = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelectorAll<HTMLButtonElement>("[data-coverage-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      const screenId = button.dataset.coverageScreen;
      const coverageState = button.dataset.coverageState as CoverageOverride["state"] | undefined;
      if (!screenId || !coverageState) return;
      state.coverageOverrides[screenId] = {
        state: coverageState,
        note: state.activeCoverageNote.trim(),
        updatedAt: new Date().toISOString()
      };
      saveCoverageOverrides();
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#reset-coverage")?.addEventListener("click", () => {
    state.coverageOverrides = {};
    state.activeCoverageNote = "";
    saveCoverageOverrides();
    render();
  });
  document.querySelector<HTMLTextAreaElement>("#design-review-note")?.addEventListener("input", (event) => {
    state.activeDesignReviewNote = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelectorAll<HTMLButtonElement>("[data-design-review]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.designReview;
      const reviewState = button.dataset.designState as DesignReviewOverride["state"] | undefined;
      if (!itemId || !reviewState) return;
      state.designReviewOverrides[itemId] = {
        state: reviewState,
        note: state.activeDesignReviewNote.trim(),
        updatedAt: new Date().toISOString()
      };
      saveDesignReviewOverrides();
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#reset-design-review")?.addEventListener("click", () => {
    state.designReviewOverrides = {};
    state.activeDesignReviewNote = "";
    saveDesignReviewOverrides();
    render();
  });
  const gapBindings: Array<[keyof typeof state.contractGapDraft, string]> = [
    ["category", "#gap-category"],
    ["severity", "#gap-severity"],
    ["artifact", "#gap-artifact"],
    ["description", "#gap-description"]
  ];
  gapBindings.forEach(([field, selector]) => {
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.addEventListener("input", (event) => {
      state.contractGapDraft[field] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value as never;
    });
  });
  document.querySelector<HTMLButtonElement>("#add-contract-gap")?.addEventListener("click", () => {
    if (!state.contractGapDraft.description.trim()) {
      state.contractMessage = "Gap description is required.";
      render();
      return;
    }
    state.contractGaps = [...state.contractGaps, {
      ...state.contractGapDraft,
      id: `gap_${Date.now().toString(36)}`,
      status: "open",
      updatedAt: new Date().toISOString()
    }];
    state.contractGapDraft = { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" };
    state.contractMessage = "Frontend contract gap added.";
    saveContractGaps();
    render();
  });
  document.querySelector<HTMLButtonElement>("#clear-resolved-gaps")?.addEventListener("click", () => {
    state.contractGaps = state.contractGaps.filter((gap) => gap.status !== "resolved");
    state.contractMessage = "Resolved gaps cleared.";
    saveContractGaps();
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-gap]").forEach((button) => {
    button.addEventListener("click", () => {
      const gapId = button.dataset.gap;
      const status = button.dataset.gapStatus as ContractGap["status"] | undefined;
      if (!gapId || !status) return;
      state.contractGaps = state.contractGaps.map((gap) => gap.id === gapId ? { ...gap, status, updatedAt: new Date().toISOString() } : gap);
      state.contractMessage = "Gap status updated.";
      saveContractGaps();
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-gap-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const gapId = button.dataset.gapDelete;
      if (!gapId) return;
      state.contractGaps = state.contractGaps.filter((gap) => gap.id !== gapId);
      state.contractMessage = "Gap deleted.";
      saveContractGaps();
      render();
    });
  });
  document.querySelector<HTMLTextAreaElement>("#simulation-triage-note")?.addEventListener("input", (event) => {
    state.activeSimulationTriageNote = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelectorAll<HTMLButtonElement>("[data-simulation-triage]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.simulationTriage;
      const triageState = button.dataset.simulationState as SimulationTriageOverride["state"] | undefined;
      if (!itemId || !triageState) return;
      state.simulationTriageOverrides[itemId] = {
        state: triageState,
        note: state.activeSimulationTriageNote.trim(),
        updatedAt: new Date().toISOString()
      };
      saveSimulationTriageOverrides();
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#reset-simulation-triage")?.addEventListener("click", () => {
    state.simulationTriageOverrides = {};
    state.activeSimulationTriageNote = "";
    saveSimulationTriageOverrides();
    render();
  });
  document.querySelector<HTMLInputElement>("#workspace-search")?.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    const cursor = input.selectionStart ?? input.value.length;
    state.workspaceSearch = input.value;
    render();
    const restoredInput = document.querySelector<HTMLInputElement>("#workspace-search");
    restoredInput?.focus();
    restoredInput?.setSelectionRange(cursor, cursor);
  });
  document.querySelector<HTMLSelectElement>("#workspace-readiness-filter")?.addEventListener("input", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    state.workspaceReadinessFilter = value === "ready" || value === "hold" ? value : "all";
    render();
  });
  document.querySelector<HTMLSelectElement>("#workspace-sort-key")?.addEventListener("input", (event) => {
    state.workspaceSortKey = workspaceSortKeyFromValue((event.target as HTMLSelectElement).value);
    render();
  });
  document.querySelector<HTMLSelectElement>("#workspace-sort-direction")?.addEventListener("input", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    state.workspaceSortDirection = value === "asc" ? "asc" : "desc";
    render();
  });
  document.querySelector<HTMLSelectElement>("#workspace-bulk-priority")?.addEventListener("input", (event) => {
    state.workspaceBulkPriority = workspacePriorityFromValue((event.target as HTMLSelectElement).value);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-package-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.workspacePackageView;
      state.workspacePackageView = view === "archived" || view === "all" ? view : "active";
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#clear-workspace-filters")?.addEventListener("click", () => {
    state.workspaceSearch = "";
    state.workspaceReadinessFilter = "all";
    render();
  });
  document.querySelector<HTMLButtonElement>("#reset-workspace-browser")?.addEventListener("click", () => {
    state.workspaceSearch = "";
    state.workspaceReadinessFilter = "all";
    state.workspacePackageView = "active";
    state.workspaceSortKey = "savedAt";
    state.workspaceSortDirection = "desc";
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workspace-collection")?.addEventListener("click", async () => {
    const entries = currentWorkspaceEntries();
    const packages = await workspaceRecordsForEntries(entries);
    downloadText("archetype-workspace-collection.json", `${pretty({
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      collection: workspaceCollectionDescriptor(),
      packages
    })}\n`, "application/json");
    recordWorkspaceActivity("export", `Prepared collection JSON with ${packages.length} packages.`);
    state.workspaceMessage = `Workspace collection export prepared with ${packages.length} packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workspace-collection-report")?.addEventListener("click", () => {
    const entries = currentWorkspaceEntries();
    downloadText("archetype-workspace-collection.md", workspaceCollectionReport(entries), "text/markdown");
    recordWorkspaceActivity("export", `Prepared collection report with ${entries.length} packages.`);
    state.workspaceMessage = `Workspace collection report prepared with ${entries.length} packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workspace-activity")?.addEventListener("click", () => {
    downloadText("archetype-workspace-activity.json", `${pretty({
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      activity: state.workspaceActivity
    })}\n`, "application/json");
    state.workspaceMessage = `Workspace activity export prepared with ${state.workspaceActivity.length} entries.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#clear-workspace-activity")?.addEventListener("click", () => {
    state.workspaceActivity = [];
    saveWorkspaceActivity();
    state.workspaceMessage = "Workspace activity cleared.";
    render();
  });
  document.querySelector<HTMLSelectElement>("#workspace-health-filter")?.addEventListener("input", (event) => {
    state.workspaceHealthFilter = workspaceHealthFilterFromValue((event.target as HTMLSelectElement).value);
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workspace-health-json")?.addEventListener("click", () => {
    const health = workspaceHealthSnapshot(state.workspaceEntries);
    downloadText("archetype-workspace-health.json", `${pretty({
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      health
    })}\n`, "application/json");
    recordWorkspaceActivity("export", "Prepared workspace health JSON.");
    state.workspaceMessage = "Workspace health JSON export prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workspace-health-report")?.addEventListener("click", () => {
    const health = workspaceHealthSnapshot(state.workspaceEntries);
    downloadText("archetype-workspace-health.md", workspaceHealthMarkdown(health), "text/markdown");
    recordWorkspaceActivity("export", "Prepared workspace health report.");
    state.workspaceMessage = "Workspace health report export prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#bulk-workspace-priority")?.addEventListener("click", async () => {
    const entries = currentWorkspaceEntries();
    let updated = 0;
    for (const entry of entries) {
      const result = await setWorkspaceBundlePriority(entry.id, state.workspaceBulkPriority);
      if (result) updated += 1;
    }
    await refreshWorkspaceEntries();
    syncInspectedWorkspaceEntry();
    recordWorkspaceActivity("bulk", `Applied ${state.workspaceBulkPriority} priority to ${updated} visible packages.`);
    state.workspaceMessage = `Applied ${state.workspaceBulkPriority} priority to ${updated} visible packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#bulk-workspace-pin")?.addEventListener("click", async () => {
    const entries = currentWorkspaceEntries();
    let updated = 0;
    for (const entry of entries) {
      const result = await setWorkspaceBundlePinned(entry.id, true);
      if (result) updated += 1;
    }
    await refreshWorkspaceEntries();
    syncInspectedWorkspaceEntry();
    recordWorkspaceActivity("bulk", `Pinned ${updated} visible packages.`);
    state.workspaceMessage = `Pinned ${updated} visible packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#bulk-workspace-unpin")?.addEventListener("click", async () => {
    const entries = currentWorkspaceEntries();
    let updated = 0;
    for (const entry of entries) {
      if (!entry.pinned) continue;
      const result = await setWorkspaceBundlePinned(entry.id, false);
      if (result) updated += 1;
    }
    await refreshWorkspaceEntries();
    syncInspectedWorkspaceEntry();
    recordWorkspaceActivity("bulk", `Unpinned ${updated} visible packages.`);
    state.workspaceMessage = `Unpinned ${updated} visible packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#bulk-workspace-archive")?.addEventListener("click", async () => {
    const entries = currentWorkspaceEntries().filter((entry) => !entry.archivedAt);
    for (const entry of entries) {
      await archiveWorkspaceBundle(entry.id, true);
    }
    await refreshWorkspaceEntries();
    syncInspectedWorkspaceEntry();
    recordWorkspaceActivity("bulk", `Archived ${entries.length} visible packages.`);
    state.workspaceMessage = `Archived ${entries.length} visible packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#bulk-workspace-restore")?.addEventListener("click", async () => {
    const entries = currentWorkspaceEntries().filter((entry) => entry.archivedAt);
    for (const entry of entries) {
      await archiveWorkspaceBundle(entry.id, false);
    }
    await refreshWorkspaceEntries();
    syncInspectedWorkspaceEntry();
    recordWorkspaceActivity("bulk", `Restored ${entries.length} visible packages.`);
    state.workspaceMessage = `Restored ${entries.length} visible packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#save-workspace-package")?.addEventListener("click", async () => {
    if (!state.bundle) return;
    const entry = await saveWorkspaceBundle(state.bundle, state.packageName);
    await refreshWorkspaceEntries();
    recordWorkspaceActivity("save", `Saved ${entry.name}.`, entry.id);
    state.workspaceMessage = `Saved ${entry.name}.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#refresh-workspace")?.addEventListener("click", async () => {
    await refreshWorkspaceEntries();
    state.workspaceMessage = "Workspace refreshed.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workspace")?.addEventListener("click", async () => {
    const packages = await listWorkspaceRecords();
    downloadText("archetype-workspace.json", `${pretty({ exportVersion: 1, exportedAt: new Date().toISOString(), packages } satisfies WorkspaceExport)}\n`, "application/json");
    recordWorkspaceActivity("export", `Prepared workspace export with ${packages.length} packages.`);
    state.workspaceMessage = `Workspace export prepared with ${packages.length} packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#import-workspace")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#workspace-import-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#workspace-import-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isWorkspaceExport(parsed)) {
        state.workspaceMessage = "Workspace file is not a valid Archetype workspace export.";
        input.value = "";
        render();
        return;
      }
      state.workspaceImportPreview = parsed;
      state.workspaceImportFileName = file.name;
      state.workspaceMessage = `Review ${parsed.packages.length} workspace packages before importing.`;
      input.value = "";
      render();
    } catch (error) {
      state.workspaceMessage = error instanceof Error ? error.message : "Could not import workspace.";
      input.value = "";
      render();
    }
  });
  document.querySelector<HTMLButtonElement>("#confirm-workspace-import")?.addEventListener("click", async () => {
    if (!state.workspaceImportPreview) return;
    const imported = await importWorkspaceRecords(state.workspaceImportPreview.packages);
    state.workspaceImportPreview = null;
    state.workspaceImportFileName = "";
    await refreshWorkspaceEntries();
    recordWorkspaceActivity("import", `Imported ${imported} reviewed workspace packages.`);
    state.workspaceMessage = `Imported ${imported} reviewed workspace packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#cancel-workspace-import")?.addEventListener("click", () => {
    state.workspaceImportPreview = null;
    state.workspaceImportFileName = "";
    state.workspaceMessage = "Workspace import canceled.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#purge-archived-packages")?.addEventListener("click", async () => {
    const purged = await purgeArchivedWorkspaceBundles();
    await refreshWorkspaceEntries();
    recordWorkspaceActivity("purge", `Purged ${purged} archived packages.`);
    state.workspaceMessage = `Purged ${purged} archived packages.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#export-workbench-state")?.addEventListener("click", () => {
    if (!state.bundle) return;
    const slug = String(state.bundle.manifest.project_slug ?? "archetype-package");
    downloadText(`${slug}-workbench-state.json`, `${pretty(workbenchStateExport(state.bundle))}\n`, "application/json");
    state.workspaceMessage = "Workbench state export prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#restore-workbench-state")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#state-import-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#state-import-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isWorkbenchStateExport(parsed)) {
        state.workspaceMessage = "State file is not a valid Archetype workbench export.";
        render();
        return;
      }
      await restoreWorkbenchState(parsed);
      input.value = "";
      render();
    } catch (error) {
      state.workspaceMessage = error instanceof Error ? error.message : "Could not restore state.";
      render();
    }
  });
  document.querySelector<HTMLSelectElement>("#workspace-compare-base")?.addEventListener("input", (event) => {
    state.workspaceCompareBaseId = (event.target as HTMLSelectElement).value;
  });
  document.querySelector<HTMLSelectElement>("#workspace-compare-target")?.addEventListener("input", (event) => {
    state.workspaceCompareTargetId = (event.target as HTMLSelectElement).value;
  });
  document.querySelector<HTMLButtonElement>("#compare-workspace-packages")?.addEventListener("click", async () => {
    if (!state.workspaceCompareBaseId || !state.workspaceCompareTargetId) {
      state.workspaceMessage = "Choose a base and target package.";
      render();
      return;
    }
    if (state.workspaceCompareBaseId === state.workspaceCompareTargetId) {
      state.workspaceMessage = "Choose two different packages.";
      render();
      return;
    }
    const comparison = await compareWorkspacePackages(state.workspaceCompareBaseId, state.workspaceCompareTargetId);
    if (!comparison) {
      state.workspaceMessage = "One of the selected packages could not be loaded.";
      render();
      return;
    }
    state.workspaceComparison = comparison;
    state.workspaceMessage = `Compared ${comparison.baseName} to ${comparison.targetName}.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#clear-workspace-comparison")?.addEventListener("click", () => {
    state.workspaceComparison = null;
    state.workspaceCompareBaseId = "";
    state.workspaceCompareTargetId = "";
    state.workspaceMessage = "Workspace comparison cleared.";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-inspect]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspaceInspect;
      if (!id) return;
      const record = await loadWorkspaceBundle(id);
      if (!record) {
        state.workspaceInspectId = "";
        state.workspaceInspectBundle = null;
        state.workspaceNameDraft = "";
        state.workspacePriorityDraft = "medium";
        state.workspaceTagDraft = "";
        state.workspaceNoteDraft = "";
        state.workspaceMessage = "Saved package not found.";
        render();
        return;
      }
      state.workspaceInspectId = record.entry.id;
      state.workspaceInspectBundle = record.bundle;
      state.workspaceNameDraft = record.entry.name;
      state.workspacePriorityDraft = record.entry.priority ?? "medium";
      state.workspaceTagDraft = (record.entry.tags ?? []).join(", ");
      state.workspaceNoteDraft = record.entry.notes ?? "";
      state.workspaceMessage = `Inspecting ${record.entry.name}.`;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-duplicate]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspaceDuplicate;
      if (!id) return;
      const entry = await duplicateWorkspaceBundle(id);
      if (!entry) {
        state.workspaceMessage = "Saved package not found.";
        render();
        return;
      }
      await refreshWorkspaceEntries();
      state.workspaceInspectId = entry.id;
      const record = await loadWorkspaceBundle(entry.id);
      state.workspaceInspectBundle = record?.bundle ?? null;
      state.workspaceNameDraft = entry.name;
      state.workspacePriorityDraft = entry.priority ?? "medium";
      state.workspaceTagDraft = (entry.tags ?? []).join(", ");
      state.workspaceNoteDraft = entry.notes ?? "";
      state.workspacePackageView = "active";
      recordWorkspaceActivity("duplicate", `Duplicated ${entry.name}.`, entry.id);
      state.workspaceMessage = `Duplicated ${entry.name}.`;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-pin]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspacePin;
      if (!id) return;
      const pinned = button.dataset.workspacePinned === "true";
      const entry = await setWorkspaceBundlePinned(id, pinned);
      if (!entry) {
        state.workspaceMessage = "Saved package not found.";
        render();
        return;
      }
      await refreshWorkspaceEntries();
      if (state.workspaceInspectId === entry.id) {
        state.workspaceNameDraft = entry.name;
        state.workspacePriorityDraft = entry.priority ?? "medium";
        state.workspaceTagDraft = (entry.tags ?? []).join(", ");
        state.workspaceNoteDraft = entry.notes ?? "";
      }
      recordWorkspaceActivity(entry.pinned ? "pin" : "unpin", `${entry.pinned ? "Pinned" : "Unpinned"} ${entry.name}.`, entry.id);
      state.workspaceMessage = `${entry.pinned ? "Pinned" : "Unpinned"} ${entry.name}.`;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-priority]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspacePriority;
      if (!id) return;
      const priority = workspacePriorityFromValue(button.dataset.workspacePriorityValue ?? "medium");
      const entry = await setWorkspaceBundlePriority(id, priority);
      if (!entry) {
        state.workspaceMessage = "Saved package not found.";
        render();
        return;
      }
      await refreshWorkspaceEntries();
      if (state.workspaceInspectId === entry.id) {
        state.workspaceNameDraft = entry.name;
        state.workspacePriorityDraft = entry.priority ?? "medium";
        state.workspaceTagDraft = (entry.tags ?? []).join(", ");
        state.workspaceNoteDraft = entry.notes ?? "";
      }
      recordWorkspaceActivity("priority", `Set ${entry.name} priority to ${priority}.`, entry.id);
      state.workspaceMessage = `Set ${entry.name} priority to ${priority}.`;
      render();
    });
  });
  document.querySelector<HTMLInputElement>("#workspace-name")?.addEventListener("input", (event) => {
    state.workspaceNameDraft = (event.target as HTMLInputElement).value;
  });
  document.querySelector<HTMLSelectElement>("#workspace-priority")?.addEventListener("input", (event) => {
    state.workspacePriorityDraft = workspacePriorityFromValue((event.target as HTMLSelectElement).value);
  });
  document.querySelector<HTMLInputElement>("#workspace-tags")?.addEventListener("input", (event) => {
    state.workspaceTagDraft = (event.target as HTMLInputElement).value;
  });
  document.querySelector<HTMLTextAreaElement>("#workspace-notes")?.addEventListener("input", (event) => {
    state.workspaceNoteDraft = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelector<HTMLButtonElement>("#save-workspace-metadata")?.addEventListener("click", async () => {
    if (!state.workspaceInspectId) return;
    const name = state.workspaceNameDraft.trim();
    if (!name) {
      state.workspaceMessage = "Package name is required.";
      render();
      return;
    }
    const tags = normalizeWorkspaceTags(state.workspaceTagDraft);
    const notes = state.workspaceNoteDraft.trim();
    const priority = state.workspacePriorityDraft;
    const entry = await updateWorkspaceBundleMetadata(state.workspaceInspectId, name, priority, tags, notes);
    if (!entry) {
      state.workspaceMessage = "Saved package not found.";
      render();
      return;
    }
    state.workspaceNameDraft = name;
    state.workspacePriorityDraft = priority;
    state.workspaceTagDraft = tags.join(", ");
    state.workspaceNoteDraft = notes;
    if (state.bundle && state.workspaceInspectId === workspaceIdForBundle(state.bundle)) {
      state.packageName = name;
    }
    await refreshWorkspaceEntries();
    recordWorkspaceActivity("details", `Saved details for ${entry.name}.`, entry.id);
    state.workspaceMessage = `Saved details for ${entry.name}.`;
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-compare-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.workspaceCompareSelect;
      const role = button.dataset.workspaceCompareRole;
      if (!id) return;
      if (role === "target") {
        state.workspaceCompareTargetId = id;
        state.workspaceMessage = "Selected package as comparison target.";
      } else {
        state.workspaceCompareBaseId = id;
        state.workspaceMessage = "Selected package as comparison base.";
      }
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#clear-workspace-inspection")?.addEventListener("click", () => {
    state.workspaceInspectId = "";
    state.workspaceInspectBundle = null;
    state.workspaceNameDraft = "";
    state.workspacePriorityDraft = "medium";
    state.workspaceTagDraft = "";
    state.workspaceNoteDraft = "";
    state.workspaceMessage = "Package details cleared.";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-load]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspaceLoad;
      if (!id) return;
      const record = await loadWorkspaceBundle(id);
      if (!record) {
        state.workspaceMessage = "Saved package not found.";
        render();
        return;
      }
      state.bundle = record.bundle;
      state.packageName = record.entry.name;
      state.view = "overview";
      state.selectedScreen = null;
      state.generationDraft = "";
      state.generationMessage = "";
      state.activeGateNote = "";
      state.activeCoverageNote = "";
      state.activeDesignReviewNote = "";
      state.handoffMessage = "";
      state.contractMessage = "";
      state.activeSimulationTriageNote = "";
      state.revisionMessage = "";
      state.contractGapDraft = { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" };
      state.revisionDraft = { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" };
      state.intakeForm = null;
      state.sourceMaterials = [];
      state.sourceDraft = { id: "", label: "", type: "document", content: "", notes: "", path: "" };
      state.sourceMessage = "";
      loadApprovalOverrides();
      loadCoverageOverrides();
      loadDesignReviewOverrides();
      loadContractGaps();
      loadSimulationTriageOverrides();
      loadRevisionRequests();
      loadBaselineSnapshot();
      await refreshWorkspaceEntries();
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspaceDelete;
      if (!id) return;
      const name = state.workspaceEntries.find((entry) => entry.id === id)?.name ?? "Saved package";
      await deleteWorkspaceBundle(id);
      if (state.workspaceInspectId === id) {
        state.workspaceInspectId = "";
        state.workspaceInspectBundle = null;
        state.workspaceNameDraft = "";
        state.workspacePriorityDraft = "medium";
        state.workspaceTagDraft = "";
        state.workspaceNoteDraft = "";
      }
      await refreshWorkspaceEntries();
      recordWorkspaceActivity("delete", `Deleted ${name}.`, id);
      state.workspaceMessage = "Saved package deleted.";
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-archive]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspaceArchive;
      if (!id) return;
      await archiveWorkspaceBundle(id, true);
      await refreshWorkspaceEntries();
      recordWorkspaceActivity("archive", "Package archived.", id);
      state.workspaceMessage = "Package archived.";
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-workspace-restore]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workspaceRestore;
      if (!id) return;
      await archiveWorkspaceBundle(id, false);
      await refreshWorkspaceEntries();
      recordWorkspaceActivity("restore", "Package restored.", id);
      state.workspaceMessage = "Package restored.";
      render();
    });
  });
  const formBindings: Array<[keyof IntakeFormState, string]> = [
    ["projectName", "#intake-project-name"],
    ["context", "#intake-context"],
    ["goals", "#intake-goals"],
    ["businessGoals", "#intake-business-goals"],
    ["users", "#intake-users"],
    ["brandAttributes", "#intake-brand-attributes"],
    ["primaryColor", "#intake-primary-color"],
    ["tone", "#intake-tone"],
    ["operatingMode", "#intake-mode"]
  ];
  formBindings.forEach(([field, selector]) => {
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.addEventListener("input", (event) => {
      if (!state.bundle) return;
      const form = ensureIntakeForm(state.bundle);
      form[field] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    });
  });
  document.querySelector<HTMLButtonElement>("#apply-intake-form")?.addEventListener("click", () => {
    if (!state.bundle) return;
    state.generationDraft = pretty(intakeFromForm(ensureIntakeForm(state.bundle)));
    state.generationMessage = "Project draft created from the intake form.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#load-form-from-draft")?.addEventListener("click", () => {
    if (!state.bundle) return;
    const parsed = parseGenerationDraft();
    if (!parsed.ok) {
      state.generationMessage = parsed.error;
      render();
      return;
    }
    state.intakeForm = formFromIntake(parsed.value, state.bundle);
    state.sourceMaterials = Array.isArray(parsed.value.materials) ? parsed.value.materials.map((material: any, index) => ({
      id: String(material.id ?? `source_material_${index + 1}`),
      label: String(material.label ?? ""),
      type: ["document", "code", "design_file", "screenshot", "brand", "other"].includes(material.type) ? material.type : "other",
      content: String(material.content ?? ""),
      notes: String(material.notes ?? ""),
      path: String(material.path ?? "")
    })) : state.sourceMaterials;
    state.generationMessage = "Intake form loaded from the draft.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#clear-intake-form")?.addEventListener("click", () => {
    if (!state.bundle) return;
    state.intakeForm = formFromIntake({
      projectName: "",
      context: "",
      goals: [],
      businessGoals: [],
      users: [],
      brand: { attributes: [], primaryColor: "#2563EB", tone: "" },
      operatingMode: "full_architecture"
    }, state.bundle);
    state.generationMessage = "Intake form cleared.";
    render();
  });
  const sourceBindings: Array<[keyof SourceMaterialDraft, string]> = [
    ["label", "#source-label"],
    ["type", "#source-type"],
    ["path", "#source-path"],
    ["notes", "#source-notes"],
    ["content", "#source-content"]
  ];
  sourceBindings.forEach(([field, selector]) => {
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.addEventListener("input", (event) => {
      state.sourceDraft[field] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value as never;
    });
  });
  document.querySelector<HTMLButtonElement>("#add-source-material")?.addEventListener("click", () => {
    const material = {
      ...state.sourceDraft,
      id: state.sourceDraft.id || `source_${Date.now().toString(36)}`
    };
    if (!material.label.trim() && !material.content.trim() && !material.path.trim()) {
      state.sourceMessage = "Source requires a label, path, or content excerpt.";
      render();
      return;
    }
    state.sourceMaterials = [...state.sourceMaterials, material];
    state.sourceDraft = { id: "", label: "", type: "document", content: "", notes: "", path: "" };
    state.sourceMessage = "Source added to the intake draft.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#import-source-files")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#source-file-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#source-file-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const imported = await Promise.all([...input.files].map(async (file) => ({
      id: `source_${Date.now().toString(36)}_${file.name.replace(/[^a-z0-9]+/gi, "_")}`,
      label: file.name,
      type: sourceTypeForFile(file.name),
      content: file.size <= 120000 ? await file.text() : "",
      notes: file.size > 120000 ? `File omitted from inline content because it is ${formatBytes(file.size)}.` : "",
      path: file.name
    } satisfies SourceMaterialDraft)));
    state.sourceMaterials = [...state.sourceMaterials, ...imported];
    state.sourceMessage = `Imported ${imported.length} source files.`;
    input.value = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#clear-source-materials")?.addEventListener("click", () => {
    state.sourceMaterials = [];
    state.sourceDraft = { id: "", label: "", type: "document", content: "", notes: "", path: "" };
    state.sourceMessage = "Source materials cleared.";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-source-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.sourceRemove;
      if (!id) return;
      state.sourceMaterials = state.sourceMaterials.filter((material) => material.id !== id);
      state.sourceMessage = "Source removed.";
      render();
    });
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
    if (state.bundle) {
      const intake = defaultIntakeFromBundle(state.bundle);
      state.generationDraft = pretty(intake);
      state.intakeForm = formFromIntake(intake, state.bundle);
    }
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
  const revisionBindings: Array<[keyof typeof state.revisionDraft, string]> = [
    ["priority", "#revision-priority"],
    ["changeType", "#revision-change-type"],
    ["summary", "#revision-summary"],
    ["affectedArtifacts", "#revision-artifacts"],
    ["requestedChanges", "#revision-changes"]
  ];
  revisionBindings.forEach(([field, selector]) => {
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.addEventListener("input", (event) => {
      state.revisionDraft[field] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value as never;
    });
  });
  document.querySelector<HTMLButtonElement>("#suggest-revision-request")?.addEventListener("click", () => {
    state.revisionDraft = suggestedRevisionDraft();
    state.revisionMessage = "Revision request seeded from open findings.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#add-revision-request")?.addEventListener("click", () => {
    if (!state.revisionDraft.summary.trim() || !state.revisionDraft.requestedChanges.trim()) {
      state.revisionMessage = "Summary and requested changes are required.";
      render();
      return;
    }
    state.revisionRequests = [...state.revisionRequests, {
      ...state.revisionDraft,
      id: `revision_${Date.now().toString(36)}`,
      status: "draft",
      updatedAt: new Date().toISOString()
    }];
    state.revisionDraft = { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" };
    state.revisionMessage = "Revision request added.";
    saveRevisionRequests();
    render();
  });
  document.querySelector<HTMLButtonElement>("#download-revision-requests")?.addEventListener("click", () => {
    const slug = state.bundle?.manifest.project_slug ?? "archetype-package";
    downloadText(`${slug}-revision-requests.json`, `${pretty(state.revisionRequests.map(revisionRequestPayload))}\n`, "application/json");
    state.revisionMessage = "Revision request export prepared.";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-revision-request]").forEach((button) => {
    button.addEventListener("click", () => {
      const requestId = button.dataset.revisionRequest;
      const status = button.dataset.revisionStatus as RevisionRequest["status"] | undefined;
      if (!requestId || !status) return;
      state.revisionRequests = state.revisionRequests.map((request) => request.id === requestId ? { ...request, status, updatedAt: new Date().toISOString() } : request);
      state.revisionMessage = "Revision request status updated.";
      saveRevisionRequests();
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-revision-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const requestId = button.dataset.revisionDelete;
      if (!requestId) return;
      state.revisionRequests = state.revisionRequests.filter((request) => request.id !== requestId);
      state.revisionMessage = "Revision request deleted.";
      saveRevisionRequests();
      render();
    });
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
      state.activeCoverageNote = "";
      state.activeDesignReviewNote = "";
      state.handoffMessage = "";
      state.contractMessage = "";
      state.activeSimulationTriageNote = "";
      state.revisionMessage = "";
      state.contractGapDraft = { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" };
      state.revisionDraft = { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" };
      state.intakeForm = null;
      state.sourceMaterials = [];
      state.sourceDraft = { id: "", label: "", type: "document", content: "", notes: "", path: "" };
      state.sourceMessage = "";
      loadApprovalOverrides();
      loadCoverageOverrides();
      loadDesignReviewOverrides();
      loadContractGaps();
      loadSimulationTriageOverrides();
      loadRevisionRequests();
      loadBaselineSnapshot();
      await refreshWorkspaceEntries();
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
  state.activeCoverageNote = "";
  state.activeDesignReviewNote = "";
  state.handoffMessage = "";
  state.contractMessage = "";
  state.activeSimulationTriageNote = "";
  state.revisionMessage = "";
  state.contractGapDraft = { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" };
  state.revisionDraft = { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" };
  state.intakeForm = null;
  state.sourceMaterials = [];
  state.sourceDraft = { id: "", label: "", type: "document", content: "", notes: "", path: "" };
  state.sourceMessage = "";
  loadBaselineSnapshot();
  loadCoverageOverrides();
  loadDesignReviewOverrides();
  loadContractGaps();
  loadSimulationTriageOverrides();
  loadRevisionRequests();
  await refreshWorkspaceEntries();
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

function coverageStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:coverage:${slug}`;
}

function loadCoverageOverrides(): void {
  try {
    state.coverageOverrides = JSON.parse(localStorage.getItem(coverageStorageKey()) ?? "{}");
  } catch {
    state.coverageOverrides = {};
  }
}

function saveCoverageOverrides(): void {
  localStorage.setItem(coverageStorageKey(), JSON.stringify(state.coverageOverrides));
}

function designReviewStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:design-review:${slug}`;
}

function loadDesignReviewOverrides(): void {
  try {
    state.designReviewOverrides = JSON.parse(localStorage.getItem(designReviewStorageKey()) ?? "{}");
  } catch {
    state.designReviewOverrides = {};
  }
}

function saveDesignReviewOverrides(): void {
  localStorage.setItem(designReviewStorageKey(), JSON.stringify(state.designReviewOverrides));
}

function contractGapsStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:contract-gaps:${slug}`;
}

function loadContractGaps(): void {
  try {
    state.contractGaps = JSON.parse(localStorage.getItem(contractGapsStorageKey()) ?? "[]");
  } catch {
    state.contractGaps = [];
  }
}

function saveContractGaps(): void {
  localStorage.setItem(contractGapsStorageKey(), JSON.stringify(state.contractGaps));
}

function simulationTriageStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:simulation-triage:${slug}`;
}

function loadSimulationTriageOverrides(): void {
  try {
    state.simulationTriageOverrides = JSON.parse(localStorage.getItem(simulationTriageStorageKey()) ?? "{}");
  } catch {
    state.simulationTriageOverrides = {};
  }
}

function saveSimulationTriageOverrides(): void {
  localStorage.setItem(simulationTriageStorageKey(), JSON.stringify(state.simulationTriageOverrides));
}

function revisionRequestsStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:revision-requests:${slug}`;
}

function loadRevisionRequests(): void {
  try {
    state.revisionRequests = JSON.parse(localStorage.getItem(revisionRequestsStorageKey()) ?? "[]");
  } catch {
    state.revisionRequests = [];
  }
}

function saveRevisionRequests(): void {
  localStorage.setItem(revisionRequestsStorageKey(), JSON.stringify(state.revisionRequests));
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

const WORKSPACE_ACTIVITY_KEY = "archetype:workspace-activity";

function loadWorkspaceActivity(): void {
  try {
    state.workspaceActivity = JSON.parse(localStorage.getItem(WORKSPACE_ACTIVITY_KEY) ?? "[]");
  } catch {
    state.workspaceActivity = [];
  }
}

function saveWorkspaceActivity(): void {
  localStorage.setItem(WORKSPACE_ACTIVITY_KEY, JSON.stringify(state.workspaceActivity.slice(0, 120)));
}

function recordWorkspaceActivity(action: string, details: string, packageId?: string): void {
  state.workspaceActivity = [{
    id: `activity_${Date.now().toString(36)}`,
    action,
    details,
    packageId,
    createdAt: new Date().toISOString()
  }, ...state.workspaceActivity].slice(0, 120);
  saveWorkspaceActivity();
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
    componentContracts: await getJson("04-design-system/components/component-contracts.json"),
    componentRegistry: await getJson("04-design-system/components/component-registry.json"),
    patternContracts: await getJson("04-design-system/patterns/pattern-contracts.json"),
    patternRegistry: await getJson("04-design-system/patterns/pattern-registry.json"),
    primitiveTokens: await getJson("04-design-system/tokens/primitive-tokens.json"),
    semanticTokens: await getJson("04-design-system/tokens/semantic-tokens.json"),
    tokenContracts: await getJson("04-design-system/tokens/token-contracts.json"),
    typographySystem: await getJson("04-design-system/tokens/typography-system.json"),
    buildManifest: await getJson("06-frontend-agent-contract/build-manifest.json"),
    componentUsageMap: await getJson("06-frontend-agent-contract/component-usage-map.json"),
    dataContracts: await getJson("06-frontend-agent-contract/data-contracts.json"),
    dataOperationContracts: await getJson("06-frontend-agent-contract/data-operation-contracts.json"),
    actionContracts: await getJson("06-frontend-agent-contract/action-contracts.json"),
    formContracts: await getJson("06-frontend-agent-contract/form-contracts.json"),
    verificationContracts: await getJson("06-frontend-agent-contract/verification-contracts.json"),
    productionIntegrationContracts: await getJson("06-frontend-agent-contract/production-integration-contracts.json"),
    productionIntegrationPlan: await getText("06-frontend-agent-contract/production-integration-plan.md"),
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

loadWorkspaceActivity();
loadSample().catch((error) => {
  app.innerHTML = `<main class="main"><div class="empty">${esc(error instanceof Error ? error.message : error)}</div></main>`;
});
