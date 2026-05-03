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
  | "e2e"
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
type StartMode = "hub" | "intent" | "evidence" | "preflight" | "provider" | "progress";
type PreflightStatus = "pass" | "warning" | "blocker";
type ProviderId = "openai" | "anthropic" | "google" | "local";
type ProviderDiagnosticStatus = "pass" | "warning" | "fail";
type StartGenerationRunStatus = "idle" | "running" | "blocked" | "complete";
type StartGenerationPhaseStatus = "queued" | "running" | "pass" | "warning" | "blocked";
type BundleActivationSource = "workspace" | "sample" | "import" | "generated" | "restore";
type OnboardingMetricEventType =
  | "onboarding_completed"
  | "onboarding_skipped"
  | "provider_setup_success"
  | "generation_success"
  | "first_save"
  | "first_handoff_export"
  | "reset_used";
type OnboardingStateFlag =
  | "start_hub_seen"
  | "first_package_created"
  | "sample_explored"
  | "provider_connected"
  | "launch_review_completed"
  | "handoff_exported";

interface OnboardingMetricEvent {
  id: string;
  type: OnboardingMetricEventType;
  detail: string;
  created_at: string;
}

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
  constraints: string;
  preferredStack: string;
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

interface StartPreflightCheck {
  id: string;
  label: string;
  status: PreflightStatus;
  detail: string;
}

interface StartEvidenceReviewState {
  included: boolean;
  redaction: string;
}

interface ProviderDiagnostic {
  id: string;
  label: string;
  status: ProviderDiagnosticStatus;
  detail: string;
}

interface StartGenerationRunState {
  startedAt: string;
  completedAt: string;
  activePhaseIndex: number;
  status: StartGenerationRunStatus;
  repairedPhaseIds: string[];
  message: string;
}

interface StartGenerationPhaseDefinition {
  id: string;
  label: string;
  artifact: string;
  detail: string;
}

interface StartGenerationPhaseEvaluation {
  status: "pass" | "warning" | "blocked";
  detail: string;
  issue: string;
  action: string;
}

interface StartGenerationPhaseView extends StartGenerationPhaseDefinition {
  status: StartGenerationPhaseStatus;
  detail: string;
  issue: string;
  action: string;
  repaired: boolean;
}

interface OnboardingLocalState {
  start_hub_seen: boolean;
  first_package_created: boolean;
  sample_explored: boolean;
  provider_connected: boolean;
  launch_review_completed: boolean;
  handoff_exported: boolean;
  onboarding_completed_at: string;
  skip_count: number;
  provider_setup_success_count: number;
  generation_success_count: number;
  first_save_at: string;
  first_save_count: number;
  first_handoff_export_at: string;
  first_handoff_export_count: number;
  reset_usage_count: number;
  dismissed_contextual_hints: string[];
  metric_events: OnboardingMetricEvent[];
  updated_at: string;
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
  sourceFileManifest: Record<string, any>;
  routeComponentMap: Record<string, any>;
  codegenTasks: Record<string, any>;
  adapterInterfaceSource: string;
  sourceGenerationRunbook: string;
  e2eScenarios: Record<string, any>;
  e2eResults: Record<string, any>;
  e2eFindings: string;
  targetExecution: Record<string, any>;
  targetExecutionReport: string;
  productizationReadiness: Record<string, any>;
  productizationReport: string;
  accountWorkspaceContract: Record<string, any>;
  accountWorkspaceReport: string;
  providerExecutionContract: Record<string, any>;
  providerExecutionReport: string;
  telemetryAuditContract: Record<string, any>;
  telemetryAuditReport: string;
  deploymentOperationsContract: Record<string, any>;
  deploymentOperationsReport: string;
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

type ViewGroup = "Launch" | "Input" | "Architecture" | "Build Contract" | "Governance";

const viewGroups: ViewGroup[] = ["Launch", "Input", "Architecture", "Build Contract", "Governance"];

const views: Array<{ id: ViewId; label: string; group: ViewGroup; description: string; count: (bundle: Bundle) => number | string }> = [
  { id: "overview", label: "Launch Review", group: "Launch", description: "Decision cockpit for readiness, risk, and next actions.", count: (bundle) => bundle.readiness.score },
  { id: "workspace", label: "Workspace", group: "Launch", description: "Save, compare, import, and manage generated packages.", count: () => state.workspaceEntries.length },
  { id: "export", label: "Handoff", group: "Launch", description: "Export the reviewed package and agent handoff prompt.", count: (bundle) => bundle.readiness.readyForFrontendAgent ? "ready" : "hold" },
  { id: "generation", label: "Intake Builder", group: "Input", description: "Draft or repair product context before compilation.", count: () => "draft" },
  { id: "evidence", label: "Evidence", group: "Input", description: "Inspect source material, visual evidence, and safety signals.", count: (bundle) => bundle.evidence.sources?.length ?? 0 },
  { id: "architecture", label: "Routes and Flows", group: "Architecture", description: "Review product model, route map, screen inventory, and flow coverage.", count: (bundle) => bundle.routeMap.routes.length },
  { id: "screens", label: "Screens", group: "Architecture", description: "Inspect deterministic screen specifications.", count: (bundle) => bundle.screens.length },
  { id: "design", label: "Design System", group: "Architecture", description: "Review tokens, components, patterns, and design contracts.", count: (bundle) => bundle.componentRegistry.components.length },
  { id: "dsag", label: "Trace Graph", group: "Architecture", description: "Inspect DSAG traceability and graph integrity.", count: (bundle) => bundle.dsag.integrity.status },
  { id: "contract", label: "Frontend Contract", group: "Build Contract", description: "Inspect source manifests, data contracts, actions, forms, and adapters.", count: (bundle) => bundle.buildManifest.entry_routes?.length ?? 0 },
  { id: "simulation", label: "Build Simulation", group: "Build Contract", description: "Triage simulated route, component, state, data, and test coverage.", count: (bundle) => bundle.buildSimulation.routeSimulation?.routes?.length ?? 0 },
  { id: "e2e", label: "E2E Proof", group: "Build Contract", description: "Review 100 happy-path and edge-case scenarios.", count: (bundle) => bundle.e2eResults.summary?.total ?? 0 },
  { id: "impact", label: "Revision Impact", group: "Governance", description: "Compare baselines and understand downstream invalidation.", count: () => state.baselineSnapshot ? "diff" : "base" },
  { id: "governance", label: "Governance", group: "Governance", description: "Review local action queues, blockers, and decision records.", count: () => governanceActionQueue().length },
  { id: "revision", label: "Revision Requests", group: "Governance", description: "Capture approval gates and change requests.", count: (bundle) => bundle.revision.approvalGates?.gates?.length ?? 0 }
];

const START_DRAFT_STORAGE_KEY = "archetype:start-draft:v1";
const ONBOARDING_STATE_STORAGE_KEY = "archetype:onboarding-state:v1";
const operatingModeOptions = ["fast_architecture", "full_architecture", "existing_product_audit", "contract_repair"];
const sourceMaterialTypes: SourceMaterialDraft["type"][] = ["document", "code", "design_file", "screenshot", "brand", "other"];
const providerOptions: Array<{ id: ProviderId; label: string; detail: string; keyHint: string }> = [
  { id: "openai", label: "OpenAI", detail: "Provider-backed architecture reasoning for production packages.", keyHint: "Session key usually starts with sk-." },
  { id: "anthropic", label: "Anthropic", detail: "Provider-backed architecture reasoning with Claude-compatible keys.", keyHint: "Session key usually starts with sk-ant-." },
  { id: "google", label: "Google AI", detail: "Provider-backed architecture reasoning with Gemini-compatible keys.", keyHint: "Session key usually starts with AIza." },
  { id: "local", label: "Local deterministic mode", detail: "Offline demo, validation, and sample review. No provider key is needed.", keyHint: "No API key required." }
];
const startGenerationPhaseDefinitions: StartGenerationPhaseDefinition[] = [
  {
    id: "normalize-evidence",
    label: "Normalize evidence",
    artifact: "01-normalized-evidence/context.json",
    detail: "Normalize product context, reviewed evidence, redaction notes, and provider payload boundaries."
  },
  {
    id: "build-evidence-ledger",
    label: "Build Evidence Ledger",
    artifact: "02-evidence-ledger/evidence-ledger.json",
    detail: "Create a traceable ledger of included evidence, safety findings, confidence, and source limits."
  },
  {
    id: "model-domain",
    label: "Model users, roles, permissions, and entities",
    artifact: "03-product-model/users-roles-permissions-entities.json",
    detail: "Infer users, jobs, roles, permissions, entities, and high-impact product constraints."
  },
  {
    id: "create-routes-workflows",
    label: "Create routes, workflows, and screen inventory",
    artifact: "03-product-model/routes-workflows-screen-inventory.json",
    detail: "Convert product goals into route structure, user workflows, screen inventory, and state coverage."
  },
  {
    id: "build-dsag",
    label: "Build DSAG",
    artifact: "05-dsag/dsag.json",
    detail: "Link evidence, product model, routes, screens, components, and contracts into the trace graph."
  },
  {
    id: "generate-screen-specs",
    label: "Generate screen specs",
    artifact: "03-product-model/screen-specifications.json",
    detail: "Produce screen-by-screen layout, states, interactions, data dependencies, and acceptance criteria."
  },
  {
    id: "generate-design-contracts",
    label: "Generate design-system contracts",
    artifact: "04-design-system/design-system-contracts.json",
    detail: "Create tokens, typography, component contracts, product patterns, and usage boundaries."
  },
  {
    id: "generate-frontend-agent-contract",
    label: "Generate frontend-agent contract",
    artifact: "06-frontend-agent-contract/frontend-agent-contract.md",
    detail: "Prepare deterministic instructions, source manifest, data contracts, actions, forms, and adapter expectations."
  },
  {
    id: "validate-package",
    label: "Validate package",
    artifact: "10-validation/package-validation-report.json",
    detail: "Check readiness, contract coverage, DSAG integrity, E2E proof expectations, and target build assumptions."
  },
  {
    id: "prepare-launch-review",
    label: "Prepare Launch Review",
    artifact: "00-launch-review/launch-review-brief.md",
    detail: "Summarize readiness, trusted evidence, missing context, human review needs, and handoff actions."
  }
];

function blankStartGenerationRun(): StartGenerationRunState {
  return {
    startedAt: "",
    completedAt: "",
    activePhaseIndex: 0,
    status: "idle",
    repairedPhaseIds: [],
    message: ""
  };
}

function blankOnboardingState(): OnboardingLocalState {
  return {
    start_hub_seen: false,
    first_package_created: false,
    sample_explored: false,
    provider_connected: false,
    launch_review_completed: false,
    handoff_exported: false,
    onboarding_completed_at: "",
    skip_count: 0,
    provider_setup_success_count: 0,
    generation_success_count: 0,
    first_save_at: "",
    first_save_count: 0,
    first_handoff_export_at: "",
    first_handoff_export_count: 0,
    reset_usage_count: 0,
    dismissed_contextual_hints: [],
    metric_events: [],
    updated_at: ""
  };
}

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
  onboardingState: OnboardingLocalState;
  launchReviewMessage: string;
  replayingOnboarding: boolean;
  startMode: StartMode;
  startDraft: IntakeFormState;
  startSourceMaterials: SourceMaterialDraft[];
  startSourceDraft: SourceMaterialDraft;
  startSourceMessage: string;
  startDraftSavedAt: string;
  startExamplesVisible: boolean;
  startProvider: ProviderId;
  startApiKey: string;
  startSendSummariesOnly: boolean;
  startEvidenceReview: Record<string, StartEvidenceReviewState>;
  startProviderConsent: boolean;
  startProviderDiagnosticsRan: boolean;
  startProviderMessage: string;
  startGenerationRun: StartGenerationRunState;
  startMessage: string;
  intakeForm: IntakeFormState | null;
  sourceMaterials: SourceMaterialDraft[];
  sourceDraft: SourceMaterialDraft;
  sourceMessage: string;
} = {
  bundle: null,
  view: "overview",
  selectedScreen: null,
  screenFilter: "",
  packageName: "No active package",
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
  onboardingState: blankOnboardingState(),
  launchReviewMessage: "",
  replayingOnboarding: false,
  startMode: "hub",
  startDraft: blankIntakeForm(),
  startSourceMaterials: [],
  startSourceDraft: blankSourceDraft(),
  startSourceMessage: "",
  startDraftSavedAt: "",
  startExamplesVisible: false,
  startProvider: "openai",
  startApiKey: "",
  startSendSummariesOnly: true,
  startEvidenceReview: {},
  startProviderConsent: false,
  startProviderDiagnosticsRan: false,
  startProviderMessage: "",
  startGenerationRun: blankStartGenerationRun(),
  startMessage: "",
  intakeForm: null,
  sourceMaterials: [],
  sourceDraft: blankSourceDraft(),
  sourceMessage: ""
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found.");

let startDraftRenderTimer: number | undefined;

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

function badgeLabel(label: string): string {
  const raw = String(label ?? "").trim();
  if (!raw || /[/.]/.test(raw) || /^[a-f0-9]{8,}$/i.test(raw) || /^[A-Z0-9]+$/.test(raw)) return raw;
  return raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bDsag\b/g, "DSAG")
    .replace(/\bE2e\b/g, "E2E")
    .replace(/\bJson\b/g, "JSON")
    .replace(/\bApi\b/g, "API");
}

function badge(label: string, tone: "success" | "warning" | "danger" | "neutral" = "neutral"): string {
  const cls = tone === "neutral" ? "badge" : `badge ${tone}`;
  return `<span class="${cls}">${esc(badgeLabel(label))}</span>`;
}

function statusTone(status: unknown): "success" | "warning" | "danger" | "neutral" {
  if (status === true || status === "pass" || status === "ready") return "success";
  if (status === "warning") return "warning";
  if (status === false || status === "fail") return "danger";
  return "neutral";
}

const labelOverrides: Record<string, string> = {
  all: "All",
  asc: "Ascending",
  auth: "Auth",
  backend: "Backend",
  blocker: "Blocker",
  brand: "Brand",
  code: "Code",
  component: "Component",
  contract_repair: "Contract repair",
  copy: "Copy",
  data_contract: "Data contract",
  design_file: "Design file",
  document: "Document",
  evidence_changed: "Evidence changed",
  existing_product_audit: "Existing product audit",
  fast_architecture: "Fast architecture",
  full_architecture: "Full architecture",
  generatedAt: "Generated date",
  high: "High",
  hold: "Hold",
  low: "Low",
  major: "Major",
  medium: "Medium",
  minor: "Minor",
  name: "Package name",
  no_notes: "Missing notes",
  other: "Other",
  priority: "Priority",
  production_integration: "Production integration",
  production_integration_changed: "Production integration changed",
  ready: "Ready",
  readinessScore: "Readiness score",
  route: "Route",
  route_map_changed: "Route map changed",
  savedAt: "Saved date",
  screen_spec_changed: "Screen spec changed",
  screen_state: "Screen state",
  screenshot: "Screenshot",
  sourceHash: "Source hash",
  warningCount: "Warning count",
  artifactCount: "Artifact count"
};

function humanLabel(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (labelOverrides[raw]) return labelOverrides[raw];
  return raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bDsag\b/g, "DSAG")
    .replace(/\bE2e\b/g, "E2E")
    .replace(/\bJson\b/g, "JSON");
}

function metricStateLabel(tone: "success" | "warning" | "danger" | "neutral"): string {
  if (tone === "success") return "Pass";
  if (tone === "warning") return "Review";
  if (tone === "danger") return "Blocked";
  return "Tracked";
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
        ${options.map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(humanLabel(option))}</option>`).join("")}
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
        <div>${badge(metricStateLabel(tone), tone)}</div>
      </div>
    </section>
  `;
}

function actionButton(label: string, view: ViewId, variant = "button", action = label): string {
  return `<button class="${esc(variant)}" data-view="${esc(view)}" data-agent-action="${esc(action)}" aria-label="${esc(action)}" type="button">${esc(label)}</button>`;
}

function warningCategory(value: string): string {
  const text = value.toLowerCase();
  if (text.includes("backend") || text.includes("api") || text.includes("adapter")) return "Backend";
  if (text.includes("auth") || text.includes("permission")) return "Auth";
  if (text.includes("accessibility") || text.includes("compliance") || text.includes("risk")) return "Review";
  if (text.includes("copy") || text.includes("brand")) return "Content";
  if (text.includes("component") || text.includes("pattern") || text.includes("token") || text.includes("typography")) return "Design";
  if (text.includes("e2e") || text.includes("verification") || text.includes("simulation") || text.includes("target")) return "Proof";
  return "Architecture";
}

function warningBuckets(bundle: Bundle): Array<{ category: string; count: number; items: string[] }> {
  const map = new Map<string, string[]>();
  for (const warning of bundle.readiness.warnings) {
    const category = warningCategory(String(warning));
    map.set(category, [...(map.get(category) ?? []), String(warning)]);
  }
  return [...map.entries()]
    .map(([category, items]) => ({ category, count: items.length, items }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

function readinessDecision(bundle: Bundle): { label: string; tone: "success" | "warning" | "danger"; body: string } {
  if (bundle.readiness.blockers.length) {
    return {
      label: "Blocked",
      tone: "danger",
      body: "This package has blockers. Resolve them before handing it to a frontend agent."
    };
  }
  if (!bundle.readiness.readyForFrontendAgent || bundle.readiness.warnings.length) {
    return {
      label: "Ready with review",
      tone: "warning",
      body: "The deterministic contract is usable, but production confirmations and review gates still need attention."
    };
  }
  return {
    label: "Ready for handoff",
    tone: "success",
    body: "The package has the core contracts and proof required for deterministic frontend generation."
  };
}

function launchSteps(bundle: Bundle): Array<{ label: string; view: ViewId; status: string; tone: "success" | "warning" | "danger" | "neutral"; detail: string }> {
  const warnings = warningBuckets(bundle);
  const backendWarnings = warnings.find((item) => item.category === "Backend")?.count ?? 0;
  const proofWarnings = warnings.find((item) => item.category === "Proof")?.count ?? 0;
  const reviewWarnings = warnings.find((item) => item.category === "Review")?.count ?? 0;
  return [
    {
      label: "Confirm intake",
      view: "generation",
      status: bundle.evidence.sources?.length ? "Ready" : "Needs source",
      tone: bundle.evidence.sources?.length ? "success" : "warning",
      detail: "Product context, goals, users, brand, and source material are the evidence base."
    },
    {
      label: "Review architecture",
      view: "architecture",
      status: `${bundle.routeMap.routes.length} routes`,
      tone: bundle.routeMap.routes.length && bundle.screenInventory.screens.length ? "success" : "danger",
      detail: "Routes, screens, states, and flows must be complete before component review matters."
    },
    {
      label: "Approve design system",
      view: "design",
      status: `${bundle.componentRegistry.components.length} components`,
      tone: bundle.componentRegistry.components.length ? "success" : "warning",
      detail: "Tokens, typography, components, and patterns define what frontend code may use."
    },
    {
      label: "Resolve contract gaps",
      view: "contract",
      status: backendWarnings ? `${backendWarnings} backend gaps` : "Mapped",
      tone: backendWarnings ? "warning" : "success",
      detail: "Data, actions, forms, auth, adapters, and source manifests become build instructions."
    },
    {
      label: "Verify proof",
      view: "e2e",
      status: proofWarnings || reviewWarnings ? "Review proof" : "Proof attached",
      tone: proofWarnings || reviewWarnings ? "warning" : "success",
      detail: "E2E scenarios and target execution explain what is proven and what remains external."
    },
    {
      label: "Export handoff",
      view: "export",
      status: bundle.readiness.readyForFrontendAgent ? "Ready" : "Hold",
      tone: bundle.readiness.readyForFrontendAgent ? "success" : "danger",
      detail: "Export only after the human and agent handoff contract is understandable."
    }
  ];
}

function statusSummary(label: string, value: unknown, tone: "success" | "warning" | "danger" | "neutral", detail: string): string {
  return `
    <div class="status-card" data-agent-status="${esc(label)}">
      <div>
        <div class="status-value">${esc(value)}</div>
        <div class="status-label">${esc(label)}</div>
      </div>
      ${badge(detail, tone)}
    </div>
  `;
}

function workflowStep(index: number, step: ReturnType<typeof launchSteps>[number]): string {
  return `
    <button class="workflow-step" data-view="${esc(step.view)}" data-agent-action="${esc(`Open ${step.label}`)}" type="button">
      <span class="workflow-index">${esc(index + 1)}</span>
      <span class="workflow-copy">
        <strong>${esc(step.label)}</strong>
        <span>${esc(step.detail)}</span>
      </span>
      ${badge(step.status, step.tone)}
    </button>
  `;
}

function launchReviewAnswers(bundle: Bundle): Array<{ question: string; answer: string; tone: "success" | "warning" | "danger" | "neutral" }> {
  const decision = readinessDecision(bundle);
  const e2eSummary = bundle.e2eResults.summary ?? {};
  const trusted = [
    `${bundle.evidence.sources?.length ?? 0} evidence sources`,
    `${bundle.routeMap.routes.length} routes`,
    `${bundle.screenInventory.screens.length} screen specs`,
    `DSAG ${humanLabel(bundle.dsag.integrity.status)}`,
    `schema ${humanLabel(bundle.schemaValidation.status)}`
  ];
  const missing = [...bundle.readiness.blockers, ...bundle.readiness.warnings];
  const exportable = [
    "Frontend contract",
    "Route and screen map",
    "Design system contracts",
    "E2E proof",
    "Handoff prompt"
  ];
  return [
    {
      question: "Is this package ready for frontend agent?",
      answer: `${decision.label}. ${decision.body}`,
      tone: decision.tone
    },
    {
      question: "What is trusted?",
      answer: trusted.join(", "),
      tone: bundle.schemaValidation.blockers.length || bundle.dsag.integrity.blockers?.length ? "warning" : "success"
    },
    {
      question: "What is missing?",
      answer: missing.length ? missing.slice(0, 4).join(" ") : "No blockers or readiness warnings are currently open.",
      tone: bundle.readiness.blockers.length ? "danger" : bundle.readiness.warnings.length ? "warning" : "success"
    },
    {
      question: "What needs human review?",
      answer: bundle.readiness.requiredHumanReview.length
        ? bundle.readiness.requiredHumanReview.slice(0, 5).join(" ")
        : "No required human review items are open.",
      tone: bundle.readiness.requiredHumanReview.length ? "warning" : "success"
    },
    {
      question: "What can be exported?",
      answer: `${exportable.join(", ")}. E2E proof shows ${e2eSummary.pass ?? 0}/${e2eSummary.total ?? 0} passing scenarios with ${e2eSummary.warning ?? 0} warnings.`,
      tone: bundle.readiness.readyForFrontendAgent ? "success" : "warning"
    }
  ];
}

function renderLaunchReviewAnswers(bundle: Bundle): string {
  return panel("Launch Review Answers", `
    <div class="launch-answer-grid" data-agent-section="launch-review-answers">
      ${launchReviewAnswers(bundle).map((item) => `
        <div class="launch-answer" data-agent-launch-question="${esc(item.question)}">
          ${badge(item.tone === "success" ? "answered" : item.tone === "danger" ? "blocked" : "review", item.tone)}
          <strong>${esc(item.question)}</strong>
          <span>${esc(item.answer)}</span>
        </div>
      `).join("")}
    </div>
  `);
}

function launchReviewCallouts(bundle: Bundle): Array<{ id: string; title: string; body: string; view: ViewId; action: string; tone: "success" | "warning" | "danger" | "neutral" }> {
  const decision = readinessDecision(bundle);
  const warningCount = bundle.readiness.blockers.length + bundle.readiness.warnings.length;
  const e2eSummary = bundle.e2eResults.summary ?? {};
  return [
    {
      id: "launch-readiness",
      title: "Readiness decision",
      body: `${decision.label}: ${decision.body}`,
      view: "overview",
      action: "Review readiness",
      tone: decision.tone
    },
    {
      id: "launch-warnings",
      title: "Warnings and missing context",
      body: warningCount
        ? `${warningCount} item${warningCount === 1 ? "" : "s"} need review before production handoff.`
        : "No readiness warnings are currently open.",
      view: "revision",
      action: "Review warnings",
      tone: warningCount ? "warning" : "success"
    },
    {
      id: "launch-proof",
      title: "Proof coverage",
      body: `E2E proof reports ${e2eSummary.pass ?? 0}/${e2eSummary.total ?? 0} passing scenarios and target status ${humanLabel(bundle.targetExecution.status ?? "pending")}.`,
      view: "e2e",
      action: "Inspect proof",
      tone: (e2eSummary.fail ?? 0) ? "danger" : (e2eSummary.warning ?? 0) ? "warning" : "success"
    },
    {
      id: "launch-handoff",
      title: "Handoff export",
      body: "The frontend contract, validation proof, and agent prompt can be exported from Handoff.",
      view: "export",
      action: "Open handoff",
      tone: bundle.readiness.readyForFrontendAgent ? "success" : "warning"
    }
  ];
}

function renderLaunchReviewCallouts(bundle: Bundle): string {
  if (!state.onboardingState.launch_review_completed) {
    return state.launchReviewMessage ? `<div class="notice" role="status">${esc(state.launchReviewMessage)}</div>` : "";
  }
  const callouts = launchReviewCallouts(bundle).filter((callout) => !onboardingHintDismissed(callout.id));
  if (!callouts.length && !state.launchReviewMessage) return "";
  return panel("First Launch Review", `
    ${state.launchReviewMessage ? `<div class="notice" role="status">${esc(state.launchReviewMessage)}</div>` : ""}
    ${callouts.length ? `<div class="launch-callout-list">
      ${callouts.map((callout) => `
        <div class="launch-callout" data-onboarding-hint-id="${esc(callout.id)}" data-agent-landmark="${esc(callout.id)}">
          <div>
            ${badge(callout.title, callout.tone)}
            <strong>${esc(callout.title)}</strong>
            <span>${esc(callout.body)}</span>
          </div>
          <div class="launch-callout-actions">
            ${actionButton(callout.action, callout.view, "button small", callout.action)}
            <button class="button small subtle" data-dismiss-onboarding-hint="${esc(callout.id)}" type="button" aria-label="${esc(`Dismiss ${callout.title}`)}">Dismiss</button>
          </div>
        </div>
      `).join("")}
    </div>` : ""}
  `);
}

function renderOverview(bundle: Bundle): string {
  const decision = readinessDecision(bundle);
  const warningGroups = warningBuckets(bundle);
  const e2eSummary = bundle.e2eResults.summary ?? {};
  return `
    <section class="launch-hero panel" data-agent-section="launch-review" data-agent-landmark="launch-review" data-agent-onboarding-complete="${state.onboardingState.launch_review_completed ? "true" : "false"}">
      <div class="launch-copy">
        <div class="eyebrow">Launch Decision</div>
        <h2>${esc(decision.label)}</h2>
        <p>${esc(decision.body)}</p>
        <div class="hero-actions">
          <button class="button primary" id="save-launch-package" data-agent-action="save-package-to-workspace" type="button">Save package to workspace</button>
          ${actionButton("Review frontend contract", "contract", "button", "Open frontend contract")}
          ${actionButton("Review E2E proof", "e2e", "button", "Open E2E proof")}
          ${actionButton("Export handoff", "export", "button", "Open handoff export")}
          ${actionButton("Create revision request", "revision", "button subtle", "Create revision request")}
        </div>
      </div>
      <div class="launch-score" aria-label="Readiness score">
        <strong>${esc(bundle.readiness.score)}</strong>
        <span>readiness</span>
        ${badge(decision.label, decision.tone)}
      </div>
    </section>
    ${renderLaunchReviewCallouts(bundle)}
    <div class="status-grid">
      ${statusSummary("Routes", bundle.routeMap.routes.length, bundle.routeMap.routes.length ? "success" : "danger", "Mapped")}
      ${statusSummary("Screens", bundle.screenInventory.screens.length, bundle.screenInventory.screens.length ? "success" : "danger", "Specified")}
      ${statusSummary("Components", bundle.componentRegistry.components.length, bundle.componentRegistry.components.length ? "success" : "warning", "Contracted")}
      ${statusSummary("E2E", `${e2eSummary.pass ?? 0}/${e2eSummary.total ?? 0}`, (e2eSummary.fail ?? 0) ? "danger" : (e2eSummary.warning ?? 0) ? "warning" : "success", `${e2eSummary.warning ?? 0} warnings`)}
      ${statusSummary("Target build", bundle.targetExecution.status ?? "pending", statusTone(bundle.targetExecution.status), humanLabel(bundle.targetExecution.summary?.build ?? "pending"))}
      ${statusSummary("Warnings", bundle.readiness.warnings.length, bundle.readiness.warnings.length ? "warning" : "success", bundle.readiness.warnings.length ? "Review" : "Clear")}
    </div>
    <div class="section-gap">
      ${renderLaunchReviewAnswers(bundle)}
    </div>
    <div class="grid cols-2 section-gap">
      ${panel("Guided Review Path", `
        <div class="workflow-list">
          ${launchSteps(bundle).map((step, index) => workflowStep(index, step)).join("")}
        </div>
      `)}
      ${panel("What Is Actually Wrong", warningGroups.length ? `
        <div class="issue-list">
          ${warningGroups.map((group) => `
            <div class="issue-row" data-agent-issue="${esc(group.category)}">
              <div>
                <strong>${esc(group.category)}</strong>
                <span>${esc(group.items[0])}</span>
              </div>
              ${badge(`${group.count} items`, group.category === "Review" || group.category === "Proof" || group.category === "Backend" ? "warning" : "neutral")}
            </div>
          `).join("")}
        </div>
      ` : `<div class="empty">No current readiness warnings.</div>`)}
    </div>
    <div class="grid cols-2 section-gap">
      ${panel("Human Review Queue", bundle.readiness.requiredHumanReview.length ? table(["Review Item", "Next Step"], bundle.readiness.requiredHumanReview.map((item) => [
        esc(item),
        item.toLowerCase().includes("backend") ? actionButton("Open contract", "contract", "button small", "Open production contract") :
          item.toLowerCase().includes("accessibility") ? actionButton("Open governance", "governance", "button small", "Open governance review") :
            actionButton("Open revision", "revision", "button small", "Open revision gates")
      ])) : `<div class="empty">No human review items.</div>`)}
      ${panel("AI Agent Handoff Map", table(["Need", "Artifact", "Open"], [
        ["Implementation source plan", "<code>12-target-frontend/source-file-manifest.json</code>", actionButton("Contract", "contract", "button small", "Open target source manifest")],
        ["Route and screen mapping", "<code>12-target-frontend/route-component-map.json</code>", actionButton("Screens", "screens", "button small", "Open screens")],
        ["Design primitives", "<code>04-design-system/</code>", actionButton("Design", "design", "button small", "Open design system")],
        ["Runtime proof", "<code>14-target-execution/target-execution-report.json</code>", actionButton("Proof", "e2e", "button small", "Open target proof")],
        ["Final handoff prompt", "<code>handoff.md</code>", actionButton("Export", "export", "button small", "Open handoff")]
      ]))}
    </div>
    <div class="grid cols-2 section-gap">
      ${panel("Product Model", code({
        product: bundle.productModel.product_name,
        type: bundle.productModel.product_type,
        mode: bundle.manifest.operating_mode,
        packageId: bundle.manifest.package_id,
        sourceHash: bundle.manifest.source_hash
      }))}
      ${panel("Validation Proof", code({
        schema: bundle.schemaValidation.status,
        checks: bundle.schemaValidation.checks.length,
        blockers: bundle.schemaValidation.blockers.length,
        dsag: bundle.dsag.integrity.status,
        targetExecution: bundle.targetExecution.status
      }))}
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
          <button class="button danger" id="clear-workspace-activity" type="button">Clear activity</button>
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
          <option value="all" ${state.workspaceHealthFilter === "all" ? "selected" : ""}>All signals</option>
          <option value="hold" ${state.workspaceHealthFilter === "hold" ? "selected" : ""}>Hold</option>
          <option value="high" ${state.workspaceHealthFilter === "high" ? "selected" : ""}>High priority</option>
          <option value="pinned" ${state.workspaceHealthFilter === "pinned" ? "selected" : ""}>Pinned</option>
          <option value="untagged" ${state.workspaceHealthFilter === "untagged" ? "selected" : ""}>Untagged</option>
          <option value="no_notes" ${state.workspaceHealthFilter === "no_notes" ? "selected" : ""}>Missing notes</option>
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
    ? `<div class="control-row compact"><button class="button small" data-workspace-inspect="${esc(entry.id)}" type="button">Inspect</button><button class="button small" data-workspace-pin="${esc(entry.id)}" data-workspace-pinned="${entry.pinned ? "false" : "true"}" type="button">${entry.pinned ? "Unpin" : "Pin"}</button><button class="button small" data-workspace-duplicate="${esc(entry.id)}" type="button">Duplicate</button><button class="button small" data-workspace-restore="${esc(entry.id)}" type="button">Restore</button><button class="button small danger" data-workspace-delete="${esc(entry.id)}" type="button">Delete</button></div>`
    : `<div class="control-row compact"><button class="button small" data-workspace-inspect="${esc(entry.id)}" type="button">Inspect</button><button class="button small" data-workspace-load="${esc(entry.id)}" type="button">Load</button><button class="button small" data-workspace-pin="${esc(entry.id)}" data-workspace-pinned="${entry.pinned ? "false" : "true"}" type="button">${entry.pinned ? "Unpin" : "Pin"}</button><button class="button small" data-workspace-duplicate="${esc(entry.id)}" type="button">Duplicate</button><button class="button small" data-workspace-archive="${esc(entry.id)}" type="button">Archive</button><button class="button small danger" data-workspace-delete="${esc(entry.id)}" type="button">Delete</button></div>`;
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
          <option value="low" ${state.workspacePriorityDraft === "low" ? "selected" : ""}>Low</option>
          <option value="medium" ${state.workspacePriorityDraft === "medium" ? "selected" : ""}>Medium</option>
          <option value="high" ${state.workspacePriorityDraft === "high" ? "selected" : ""}>High</option>
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
      <button class="button subtle" id="clear-workspace-inspection" type="button">Clear details</button>
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
          <button class="button danger" id="purge-archived-packages" type="button" ${archivedEntries.length ? "" : "disabled"}>Purge archived</button>
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
              <option value="all" ${state.workspaceReadinessFilter === "all" ? "selected" : ""}>All packages</option>
              <option value="ready" ${state.workspaceReadinessFilter === "ready" ? "selected" : ""}>Ready only</option>
              <option value="hold" ${state.workspaceReadinessFilter === "hold" ? "selected" : ""}>Hold only</option>
            </select>
          </label>
          <label class="field">
            <span>Sort by</span>
            <select id="workspace-sort-key" class="input">
              <option value="savedAt" ${state.workspaceSortKey === "savedAt" ? "selected" : ""}>Saved date</option>
              <option value="generatedAt" ${state.workspaceSortKey === "generatedAt" ? "selected" : ""}>Generated date</option>
              <option value="name" ${state.workspaceSortKey === "name" ? "selected" : ""}>Package name</option>
              <option value="readinessScore" ${state.workspaceSortKey === "readinessScore" ? "selected" : ""}>Readiness score</option>
              <option value="artifactCount" ${state.workspaceSortKey === "artifactCount" ? "selected" : ""}>Artifact count</option>
              <option value="warningCount" ${state.workspaceSortKey === "warningCount" ? "selected" : ""}>Warning count</option>
              <option value="priority" ${state.workspaceSortKey === "priority" ? "selected" : ""}>Priority</option>
            </select>
          </label>
          <label class="field">
            <span>Direction</span>
            <select id="workspace-sort-direction" class="input">
              <option value="desc" ${state.workspaceSortDirection === "desc" ? "selected" : ""}>Descending</option>
              <option value="asc" ${state.workspaceSortDirection === "asc" ? "selected" : ""}>Ascending</option>
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
              <option value="low" ${state.workspaceBulkPriority === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${state.workspaceBulkPriority === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${state.workspaceBulkPriority === "high" ? "selected" : ""}>High</option>
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
  if (!items || items.length === 0) return `<div class="empty">No items to review.</div>`;
  return `<div class="list">${items.map((item) => `<div class="review-item">${esc(typeof item === "string" ? item : JSON.stringify(item))}</div>`).join("")}</div>`;
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
  state.startMode = "hub";
  state.replayingOnboarding = false;
  state.startMessage = "";
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
  state.launchReviewMessage = "";
  state.intakeForm = payload.localState.intakeForm ?? null;
  state.sourceMaterials = payload.localState.sourceMaterials ?? [];
  state.sourceDraft = blankSourceDraft();
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

function resetPackageScopedState(): void {
  state.selectedScreen = null;
  state.screenFilter = "";
  state.generationDraft = "";
  state.generationMessage = "";
  state.approvalOverrides = {};
  state.activeGateNote = "";
  state.coverageOverrides = {};
  state.activeCoverageNote = "";
  state.designReviewOverrides = {};
  state.activeDesignReviewNote = "";
  state.contractGaps = [];
  state.contractGapDraft = { category: "data_contract", severity: "major", artifact: "06-frontend-agent-contract/data-contracts.json", description: "" };
  state.contractMessage = "";
  state.simulationTriageOverrides = {};
  state.activeSimulationTriageNote = "";
  state.revisionRequests = [];
  state.revisionDraft = { priority: "medium", changeType: "screen_spec_changed", summary: "", affectedArtifacts: "", requestedChanges: "" };
  state.revisionMessage = "";
  state.baselineSnapshot = null;
  state.baselineName = "";
  state.impactMessage = "";
  state.handoffMessage = "";
  state.launchReviewMessage = "";
  state.intakeForm = null;
  state.sourceMaterials = [];
  state.sourceDraft = blankSourceDraft();
  state.sourceMessage = "";
}

function enterFreshState(message = "", replayingOnboarding = false): void {
  state.bundle = null;
  state.packageName = "No active package";
  state.view = "overview";
  state.startMode = "hub";
  state.replayingOnboarding = replayingOnboarding;
  state.startMessage = message;
  state.workspaceMessage = "";
  resetPackageScopedState();
}

function replayOnboarding(): void {
  clearStartDraftStorage();
  state.onboardingState = {
    ...state.onboardingState,
    dismissed_contextual_hints: state.onboardingState.dismissed_contextual_hints.filter((id) => !id.startsWith("launch-"))
  };
  persistOnboardingState();
  enterFreshState("Onboarding replay started. Saved packages stay in the workspace.", true);
}

async function activateBundle(bundle: Bundle, packageName: string, view: ViewId = "overview", source: BundleActivationSource = "workspace"): Promise<void> {
  state.bundle = bundle;
  state.packageName = packageName;
  state.view = view;
  state.startMode = "hub";
  state.replayingOnboarding = false;
  state.startMessage = "";
  resetPackageScopedState();
  state.launchReviewMessage = "";
  loadApprovalOverrides();
  loadCoverageOverrides();
  loadDesignReviewOverrides();
  loadContractGaps();
  loadSimulationTriageOverrides();
  loadRevisionRequests();
  loadBaselineSnapshot();
  await refreshWorkspaceEntries();
  if (view === "overview" && (source === "generated" || source === "import")) {
    completeOnboarding(source === "generated" ? "Generated package reached Launch Review." : "Imported package reached Launch Review.");
    state.launchReviewMessage = source === "generated"
      ? "Launch Review reached from generation. The package is ready for readiness, proof, and handoff review."
      : "Imported package opened in Launch Review. Review readiness, proof, and handoff before exporting.";
  }
}

async function activateBundleFromFiles(files: FileList | File[]): Promise<void> {
  const fileList = [...files];
  if (!fileList.length) return;
  const bundle = await bundleFromFiles(fileList);
  const packageName = fileList[0]?.webkitRelativePath?.split("/")[0] || "imported-package";
  await activateBundle(bundle, packageName, "overview", "import");
  recordSkipUsage("Imported package path opened.");
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
  if (filePath.startsWith("12-target-frontend/")) return { group: "Target Frontend", nodeId: "targetFrontend" };
  if (filePath.startsWith("13-e2e/")) return { group: "E2E", nodeId: "e2e" };
  if (filePath.startsWith("14-target-execution/")) return { group: "Target Execution", nodeId: "targetExecution" };
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
    targetFrontend: "production_integration_changed",
    e2e: "production_integration_changed",
    targetExecution: "production_integration_changed",
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
    ["12-target-frontend/source-file-manifest.json", "Target source file manifest"],
    ["12-target-frontend/route-component-map.json", "Route component map"],
    ["12-target-frontend/codegen-tasks.json", "Codegen tasks"],
    ["12-target-frontend/adapter-interfaces.ts", "Adapter interfaces"],
    ["12-target-frontend/source-generation-runbook.md", "Source generation runbook"],
    ["13-e2e/e2e-scenarios.json", "E2E scenarios"],
    ["13-e2e/e2e-results.json", "E2E results"],
    ["13-e2e/e2e-findings.md", "E2E findings"],
    ["14-target-execution/target-execution-report.json", "Target execution report"],
    ["14-target-execution/target-execution-report.md", "Target execution proof"],
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
    "Use the package as the source of truth. Build only the source files, routes, screens, components, patterns, tokens, data contracts, production integration adapters, states, and acceptance criteria declared in the package.",
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
    e2e: {
      scenarios: bundle.e2eScenarios,
      results: bundle.e2eResults,
      findings: bundle.e2eFindings
    },
    targetExecution: bundle.targetExecution,
    targetFrontend: {
      sourceFileManifest: bundle.sourceFileManifest,
      routeComponentMap: bundle.routeComponentMap,
      codegenTasks: bundle.codegenTasks
    },
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
    constraints: bundle.productModel.constraints ?? [],
    preferredStack: bundle.buildManifest.framework ? [String(bundle.buildManifest.framework)] : [],
    brand: {
      attributes: ["clear", "precise", "trustworthy"],
      primaryColor: "#2563EB",
      tone: "Clear, direct, and low-hype."
    },
    operatingMode: bundle.manifest.operating_mode ?? "full_architecture"
  };
}

function blankIntakeForm(): IntakeFormState {
  return {
    projectName: "",
    context: "",
    goals: "",
    businessGoals: "",
    users: "",
    constraints: "",
    preferredStack: "",
    brandAttributes: "clear, precise, trustworthy",
    primaryColor: "#2563EB",
    tone: "Clear, direct, and low-hype.",
    operatingMode: "full_architecture"
  };
}

function blankSourceDraft(): SourceMaterialDraft {
  return { id: "", label: "", type: "document", content: "", notes: "", path: "" };
}

function normalizeIntakeForm(value: unknown): IntakeFormState {
  const record = typeof value === "object" && value && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const blank = blankIntakeForm();
  const mode = String(record.operatingMode ?? blank.operatingMode);
  return {
    projectName: String(record.projectName ?? blank.projectName),
    context: String(record.context ?? blank.context),
    goals: String(record.goals ?? blank.goals),
    businessGoals: String(record.businessGoals ?? blank.businessGoals),
    users: String(record.users ?? blank.users),
    constraints: String(record.constraints ?? blank.constraints),
    preferredStack: String(record.preferredStack ?? blank.preferredStack),
    brandAttributes: String(record.brandAttributes ?? blank.brandAttributes),
    primaryColor: String(record.primaryColor ?? blank.primaryColor),
    tone: String(record.tone ?? blank.tone),
    operatingMode: operatingModeOptions.includes(mode) ? mode : blank.operatingMode
  };
}

function formFromIntake(value: Record<string, unknown>, bundle?: Bundle): IntakeFormState {
  const brand = typeof value.brand === "object" && value.brand && !Array.isArray(value.brand) ? value.brand as Record<string, unknown> : {};
  return {
    projectName: String(value.projectName ?? bundle?.productModel.product_name ?? ""),
    context: String(value.context ?? ""),
    goals: Array.isArray(value.goals) ? value.goals.map(String).join("\n") : "",
    businessGoals: Array.isArray(value.businessGoals) ? value.businessGoals.map(String).join("\n") : "",
    users: Array.isArray(value.users) ? value.users.map((user) => typeof user === "string" ? user : JSON.stringify(user)).join("\n") : "",
    constraints: Array.isArray(value.constraints) ? value.constraints.map(String).join("\n") : String(value.constraints ?? ""),
    preferredStack: Array.isArray(value.preferredStack) ? value.preferredStack.map(String).join("\n") : String(value.preferredStack ?? ""),
    brandAttributes: Array.isArray(brand.attributes) ? brand.attributes.map(String).join(", ") : "clear, precise, trustworthy",
    primaryColor: String(brand.primaryColor ?? "#2563EB"),
    tone: String(brand.tone ?? "Clear, direct, and low-hype."),
    operatingMode: String(value.operatingMode ?? bundle?.manifest.operating_mode ?? "full_architecture")
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

function intakeFromForm(form: IntakeFormState, sourceMaterials = state.sourceMaterials): Record<string, unknown> {
  const intake: Record<string, unknown> = {
    projectName: form.projectName.trim() || "Archetype Project",
    context: form.context.trim(),
    goals: lines(form.goals),
    businessGoals: lines(form.businessGoals),
    users: lines(form.users),
    constraints: lines(form.constraints),
    preferredStack: lines(form.preferredStack),
    brand: {
      attributes: form.brandAttributes.split(",").map((item) => item.trim()).filter(Boolean),
      primaryColor: form.primaryColor.trim() || "#2563EB",
      tone: form.tone.trim()
    },
    operatingMode: form.operatingMode
  };
  const materials = sourceMaterials.map((material, index) => ({
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

function isSourceMaterialType(value: unknown): value is SourceMaterialDraft["type"] {
  return sourceMaterialTypes.includes(value as SourceMaterialDraft["type"]);
}

function isProviderId(value: unknown): value is ProviderId {
  return providerOptions.some((provider) => provider.id === value);
}

function normalizeSourceMaterial(value: unknown, index: number): SourceMaterialDraft {
  const record = typeof value === "object" && value && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    id: String(record.id ?? `source_material_${index + 1}`),
    label: String(record.label ?? ""),
    type: isSourceMaterialType(record.type) ? record.type : "other",
    content: String(record.content ?? ""),
    notes: String(record.notes ?? ""),
    path: String(record.path ?? "")
  };
}

function normalizeEvidenceReview(value: unknown): Record<string, StartEvidenceReviewState> {
  const record = typeof value === "object" && value && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(record).map(([id, review]) => {
    const reviewRecord = typeof review === "object" && review && !Array.isArray(review) ? review as Record<string, unknown> : {};
    return [id, {
      included: reviewRecord.included !== false,
      redaction: String(reviewRecord.redaction ?? "")
    }];
  }));
}

function normalizeStartGenerationRun(value: unknown): StartGenerationRunState {
  const record = typeof value === "object" && value && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rawStatus = String(record.status ?? "idle");
  const status: StartGenerationRunStatus = rawStatus === "running" || rawStatus === "blocked" || rawStatus === "complete" ? rawStatus : "idle";
  const activePhaseIndex = Math.max(0, Math.min(startGenerationPhaseDefinitions.length, Number(record.activePhaseIndex) || 0));
  return {
    startedAt: typeof record.startedAt === "string" ? record.startedAt : "",
    completedAt: typeof record.completedAt === "string" ? record.completedAt : "",
    activePhaseIndex,
    status,
    repairedPhaseIds: Array.isArray(record.repairedPhaseIds)
      ? record.repairedPhaseIds.map(String).filter((id) => startGenerationPhaseDefinitions.some((phase) => phase.id === id))
      : [],
    message: typeof record.message === "string" ? record.message : ""
  };
}

function normalizeOnboardingState(value: unknown): OnboardingLocalState {
  const record = typeof value === "object" && value && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const blank = blankOnboardingState();
  const hints = Array.isArray(record.dismissed_contextual_hints)
    ? record.dismissed_contextual_hints.map(String).filter(Boolean)
    : Array.isArray(record.dismissedHints)
      ? record.dismissedHints.map(String).filter(Boolean)
      : [];
  const rawEvents = Array.isArray(record.metric_events) ? record.metric_events : [];
  const metricEvents = rawEvents.map((event, index) => {
    const eventRecord = typeof event === "object" && event && !Array.isArray(event) ? event as Record<string, unknown> : {};
    const type = String(eventRecord.type ?? "");
    if (!isOnboardingMetricEventType(type)) return null;
    return {
      id: String(eventRecord.id ?? `event_${index + 1}`),
      type,
      detail: String(eventRecord.detail ?? ""),
      created_at: typeof eventRecord.created_at === "string" ? eventRecord.created_at : ""
    } satisfies OnboardingMetricEvent;
  }).filter((event): event is OnboardingMetricEvent => Boolean(event)).slice(-80);
  return {
    start_hub_seen: Boolean(record.start_hub_seen ?? record.startHubSeen ?? blank.start_hub_seen),
    first_package_created: Boolean(record.first_package_created ?? record.firstPackageCreated ?? blank.first_package_created),
    sample_explored: Boolean(record.sample_explored ?? record.sampleExplored ?? blank.sample_explored),
    provider_connected: Boolean(record.provider_connected ?? record.providerConnected ?? blank.provider_connected),
    launch_review_completed: Boolean(record.launch_review_completed ?? record.launchReviewCompleted ?? blank.launch_review_completed),
    handoff_exported: Boolean(record.handoff_exported ?? record.handoffExported ?? blank.handoff_exported),
    onboarding_completed_at: typeof record.onboarding_completed_at === "string" ? record.onboarding_completed_at : "",
    skip_count: safeCount(record.skip_count),
    provider_setup_success_count: safeCount(record.provider_setup_success_count),
    generation_success_count: safeCount(record.generation_success_count),
    first_save_at: typeof record.first_save_at === "string" ? record.first_save_at : "",
    first_save_count: safeCount(record.first_save_count),
    first_handoff_export_at: typeof record.first_handoff_export_at === "string" ? record.first_handoff_export_at : "",
    first_handoff_export_count: safeCount(record.first_handoff_export_count),
    reset_usage_count: safeCount(record.reset_usage_count),
    dismissed_contextual_hints: [...new Set(hints)].slice(0, 80),
    metric_events: metricEvents,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : typeof record.updatedAt === "string" ? record.updatedAt : ""
  };
}

function safeCount(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function isOnboardingMetricEventType(value: string): value is OnboardingMetricEventType {
  return [
    "onboarding_completed",
    "onboarding_skipped",
    "provider_setup_success",
    "generation_success",
    "first_save",
    "first_handoff_export",
    "reset_used"
  ].includes(value);
}

function loadOnboardingState(): void {
  try {
    state.onboardingState = normalizeOnboardingState(localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY)
      ? JSON.parse(localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY) ?? "{}")
      : {});
  } catch {
    state.onboardingState = blankOnboardingState();
  }
}

function persistOnboardingState(): void {
  try {
    state.onboardingState.updated_at = new Date().toISOString();
    localStorage.setItem(ONBOARDING_STATE_STORAGE_KEY, JSON.stringify(state.onboardingState));
  } catch {
    // Onboarding progress is helpful, but the Workbench remains usable without localStorage.
  }
}

function markOnboardingFlag(flag: OnboardingStateFlag, value = true): void {
  if (state.onboardingState[flag] === value) return;
  state.onboardingState = { ...state.onboardingState, [flag]: value };
  persistOnboardingState();
}

function recordOnboardingMetric(type: OnboardingMetricEventType, detail: string): void {
  const now = new Date().toISOString();
  const next: OnboardingLocalState = {
    ...state.onboardingState,
    metric_events: [
      ...state.onboardingState.metric_events,
      { id: `onboarding_event_${Date.now().toString(36)}`, type, detail, created_at: now }
    ].slice(-80)
  };
  if (type === "onboarding_completed") {
    next.onboarding_completed_at ||= now;
  }
  if (type === "onboarding_skipped") {
    next.skip_count += 1;
  }
  if (type === "provider_setup_success") {
    next.provider_setup_success_count += 1;
  }
  if (type === "generation_success") {
    next.generation_success_count += 1;
  }
  if (type === "first_save") {
    next.first_save_at ||= now;
    next.first_save_count += 1;
  }
  if (type === "first_handoff_export") {
    next.first_handoff_export_at ||= now;
    next.first_handoff_export_count += 1;
  }
  if (type === "reset_used") {
    next.reset_usage_count += 1;
  }
  state.onboardingState = next;
  persistOnboardingState();
}

function completeOnboarding(detail: string): void {
  markOnboardingFlag("launch_review_completed");
  if (!state.onboardingState.onboarding_completed_at) {
    recordOnboardingMetric("onboarding_completed", detail);
  }
}

function recordProviderSetupSuccess(detail: string): void {
  markOnboardingFlag("provider_connected");
  recordOnboardingMetric("provider_setup_success", detail);
}

function recordGenerationSuccess(detail: string): void {
  recordOnboardingMetric("generation_success", detail);
}

function recordFirstSave(detail: string): void {
  recordOnboardingMetric("first_save", detail);
}

function recordFirstHandoffExport(detail: string): void {
  markOnboardingFlag("handoff_exported");
  recordOnboardingMetric("first_handoff_export", detail);
}

function recordResetUsage(detail: string): void {
  recordOnboardingMetric("reset_used", detail);
}

function recordSkipUsage(detail: string): void {
  recordOnboardingMetric("onboarding_skipped", detail);
}

function dismissOnboardingHint(id: string): void {
  if (!id) return;
  state.onboardingState = {
    ...state.onboardingState,
    dismissed_contextual_hints: [...new Set([...state.onboardingState.dismissed_contextual_hints, id])]
  };
  persistOnboardingState();
}

function onboardingHintDismissed(id: string): boolean {
  return state.onboardingState.dismissed_contextual_hints.includes(id);
}

function startDraftHasContent(): boolean {
  const draft = state.startDraft;
  return [draft.projectName, draft.context, draft.goals, draft.businessGoals, draft.users, draft.constraints, draft.preferredStack].some((value) => String(value).trim().length > 0)
    || state.startSourceMaterials.length > 0;
}

function persistStartDraft(): boolean {
  try {
    const savedAt = new Date().toISOString();
    localStorage.setItem(START_DRAFT_STORAGE_KEY, JSON.stringify({
      exportVersion: 1,
      savedAt,
      draft: state.startDraft,
      sourceMaterials: state.startSourceMaterials,
      evidenceReview: state.startEvidenceReview,
      sendSummariesOnly: state.startSendSummariesOnly,
      provider: state.startProvider,
      generationRun: state.startGenerationRun
    }));
    state.startDraftSavedAt = savedAt;
    return true;
  } catch {
    return false;
  }
}

function saveStartDraft(message: string): void {
  state.startMessage = persistStartDraft() ? message : "Could not save draft locally in this browser.";
}

function loadStartDraft(): void {
  try {
    const raw = localStorage.getItem(START_DRAFT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    state.startDraft = normalizeIntakeForm(parsed.draft);
    state.startSourceMaterials = Array.isArray(parsed.sourceMaterials)
      ? parsed.sourceMaterials.map(normalizeSourceMaterial)
      : [];
    state.startEvidenceReview = normalizeEvidenceReview(parsed.evidenceReview);
    state.startSendSummariesOnly = parsed.sendSummariesOnly !== false;
    state.startProvider = isProviderId(parsed.provider) ? parsed.provider : "openai";
    state.startGenerationRun = normalizeStartGenerationRun(parsed.generationRun);
    state.startDraftSavedAt = typeof parsed.savedAt === "string" ? parsed.savedAt : "";
  } catch {
    state.startMessage = "Saved onboarding draft could not be read. Start a fresh draft or reset onboarding.";
  }
}

function clearStartDraftStorage(): void {
  try {
    localStorage.removeItem(START_DRAFT_STORAGE_KEY);
  } catch {
    // Local storage can be disabled. Resetting in memory still gives the user a fresh state.
  }
  state.startDraft = blankIntakeForm();
  state.startSourceMaterials = [];
  state.startSourceDraft = blankSourceDraft();
  state.startSourceMessage = "";
  state.startDraftSavedAt = "";
  state.startExamplesVisible = false;
  state.startProvider = "openai";
  state.startApiKey = "";
  state.startSendSummariesOnly = true;
  state.startEvidenceReview = {};
  state.startProviderConsent = false;
  state.startProviderDiagnosticsRan = false;
  state.startProviderMessage = "";
  state.startGenerationRun = blankStartGenerationRun();
}

function scheduleStartDraftRefresh(): void {
  window.clearTimeout(startDraftRenderTimer);
  const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  const activeId = activeElement?.id ?? "";
  startDraftRenderTimer = window.setTimeout(() => {
    render();
    if (!activeId) return;
    const restored = document.getElementById(activeId) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!restored || restored.disabled) return;
    restored.focus();
    if ("setSelectionRange" in restored && restored.tagName !== "SELECT" && restored.type !== "color") {
      const end = restored.value.length;
      restored.setSelectionRange(end, end);
    }
  }, 260);
}

function operatingModeDetail(mode: string): { label: string; bestFor: string; output: string } {
  const details: Record<string, { label: string; bestFor: string; output: string }> = {
    fast_architecture: {
      label: "Fast Architecture",
      bestFor: "Early product direction, quick screen maps, and a compact agent handoff.",
      output: "A lean architecture package with routes, core screens, primary components, and readiness checks."
    },
    full_architecture: {
      label: "Full Architecture",
      bestFor: "Production-grade frontend planning with complete UX, design system, data, and validation contracts.",
      output: "The complete package: product model, route map, screen specs, tokens, component contracts, E2E proof, and handoff."
    },
    existing_product_audit: {
      label: "Existing Product Audit",
      bestFor: "Screenshots, docs, or code from an existing app that needs diagnosis before rebuilding or extending.",
      output: "A gap-led package with evidence findings, UX/contract risks, repair recommendations, and deterministic build notes."
    },
    contract_repair: {
      label: "Contract Repair",
      bestFor: "A partial or broken frontend-agent contract that needs enough structure to become buildable.",
      output: "Targeted repairs for routes, screens, components, data contracts, actions, acceptance criteria, and unresolved gaps."
    }
  };
  return details[mode] ?? details.full_architecture;
}

function startPreflightChecks(): StartPreflightCheck[] {
  const draft = state.startDraft;
  const contextLength = draft.context.trim().length;
  const hasUsersOrGoals = !!draft.users.trim() || !!draft.goals.trim();
  const findings = state.startSourceMaterials.flatMap(findingsForMaterial);
  const blockerFindings = findings.filter((finding) => finding.severity === "blocker");
  const warningFindings = findings.filter((finding) => finding.severity !== "blocker");
  const evidenceCount = state.startSourceMaterials.length;
  const unsupportedEvidence = state.startSourceMaterials.filter((material) => material.type === "other").length;
  const unreadableEvidence = state.startSourceMaterials.filter((material) => !material.content.trim() && !material.path.trim() && !material.notes.trim()).length;
  const highImpactText = [
    draft.context,
    draft.goals,
    draft.businessGoals,
    draft.constraints,
    draft.preferredStack,
    state.startSourceMaterials.map((material) => `${material.label} ${material.notes} ${material.path}`).join("\n")
  ].join("\n").toLowerCase();
  const missingConstraints = [
    { label: "backend/API", pattern: /\b(api|backend|database|server|endpoint|graphql|rest)\b/ },
    { label: "auth/permissions", pattern: /\b(auth|permission|role|login|session|oauth|sso|rbac)\b/ },
    { label: "production copy", pattern: /\b(copy|content|locale|empty state|error message|microcopy|i18n)\b/ },
    { label: "compliance/accessibility", pattern: /\b(accessibility|wcag|compliance|privacy|gdpr|hipaa|soc 2|audit)\b/ }
  ].filter((item) => !item.pattern.test(highImpactText)).map((item) => item.label);

  return [
    {
      id: "context",
      label: "Product context",
      status: contextLength >= 80 ? "pass" : contextLength >= 36 ? "warning" : "blocker",
      detail: contextLength >= 80
        ? "Context is specific enough for architecture work."
        : contextLength >= 36
          ? "Context exists but should explain the product, state, and desired outcome more clearly."
          : "Add product context before generation can be trusted."
    },
    {
      id: "users-goals",
      label: "Users or user goals",
      status: hasUsersOrGoals ? "pass" : "blocker",
      detail: hasUsersOrGoals
        ? "The compiler has a target user or job to optimize around."
        : "Add primary users or user goals so the generated UX has a real audience."
    },
    {
      id: "mode",
      label: "Operating mode",
      status: operatingModeOptions.includes(draft.operatingMode) ? "pass" : "blocker",
      detail: operatingModeOptions.includes(draft.operatingMode)
        ? `${operatingModeDetail(draft.operatingMode).label} is selected.`
        : "Choose a supported operating mode."
    },
    {
      id: "evidence",
      label: "Evidence readability",
      status: evidenceCount === 0 || unsupportedEvidence || unreadableEvidence ? "warning" : "pass",
      detail: evidenceCount === 0
        ? "No source material is attached yet. You can continue, but evidence will make the architecture less generic."
        : unsupportedEvidence
          ? `${unsupportedEvidence} source item uses an unsupported or unknown type and will be recorded with limitations.`
          : unreadableEvidence
            ? `${unreadableEvidence} source item needs content, notes, or a path before it can constrain generation.`
            : `${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"} are readable locally.`
    },
    {
      id: "safety",
      label: "Evidence safety",
      status: blockerFindings.length ? "blocker" : warningFindings.length ? "warning" : "pass",
      detail: blockerFindings.length
        ? `${blockerFindings.length} blocker finding requires redaction before provider-backed generation.`
        : warningFindings.length
          ? `${warningFindings.length} safety warning${warningFindings.length === 1 ? "" : "s"} should be reviewed.`
          : "No prompt-injection, secret, PII, or regulated-data signals were detected locally."
    },
    {
      id: "constraints",
      label: "High-impact constraints",
      status: missingConstraints.length ? "warning" : "pass",
      detail: missingConstraints.length
        ? `Missing context: ${missingConstraints.join(", ")}.`
        : "Backend, auth, copy, and compliance/accessibility constraints are represented."
    }
  ];
}

function startPreflightSummary(checks = startPreflightChecks()): { label: "Ready to generate" | "Generate with warnings" | "Needs required context"; tone: "success" | "warning" | "danger"; score: number; blockers: number; warnings: number } {
  const blockers = checks.filter((check) => check.status === "blocker").length;
  const warnings = checks.filter((check) => check.status === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - blockers * 28 - warnings * 11));
  if (blockers) return { label: "Needs required context", tone: "danger", score, blockers, warnings };
  if (warnings) return { label: "Generate with warnings", tone: "warning", score, blockers, warnings };
  return { label: "Ready to generate", tone: "success", score, blockers, warnings };
}

function requiredContextBlockers(checks = startPreflightChecks()): number {
  return checks.filter((check) => check.status === "blocker" && check.id !== "safety").length;
}

function providerDetail(providerId = state.startProvider): { id: ProviderId; label: string; detail: string; keyHint: string } {
  return providerOptions.find((provider) => provider.id === providerId) ?? providerOptions[0];
}

function providerRequiresKey(providerId = state.startProvider): boolean {
  return providerId !== "local";
}

function providerKeyLooksValid(providerId: ProviderId, key: string): boolean {
  if (providerId === "local") return true;
  if (providerId === "openai") return /^sk-[A-Za-z0-9_-]{20,}$/.test(key.trim());
  if (providerId === "anthropic") return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
  if (providerId === "google") return /^AIza[A-Za-z0-9_-]{20,}$/.test(key.trim());
  return false;
}

function evidenceReviewFor(material: SourceMaterialDraft): StartEvidenceReviewState {
  if (!state.startEvidenceReview[material.id]) {
    state.startEvidenceReview[material.id] = { included: true, redaction: "" };
  }
  return state.startEvidenceReview[material.id];
}

function cleanupEvidenceReview(): void {
  const ids = new Set(state.startSourceMaterials.map((material) => material.id));
  state.startEvidenceReview = Object.fromEntries(Object.entries(state.startEvidenceReview).filter(([id]) => ids.has(id)));
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\b(sk-[A-Za-z0-9_-]{8,}|sk-ant-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|AKIA[0-9A-Z]{8,})\b/g, "[redacted credential]")
    .replace(/\b(password|api[_-]?key|secret|token)\s*[:=]\s*['"]?[^'"\s]{4,}/gi, "$1=[redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]");
}

function materialSummary(material: SourceMaterialDraft): string {
  const text = [material.label, material.notes, material.path, material.content].filter(Boolean).join(" ");
  const normalized = text.replace(/\s+/g, " ").trim();
  return redactSensitiveText(normalized.slice(0, 260) || "Evidence metadata only.");
}

function redactionSuggestions(material: SourceMaterialDraft): string[] {
  const findings = findingsForMaterial(material);
  if (!findings.length) return [];
  return [...new Set(findings.map((finding) => {
    if (finding.category === "secret") return "Redact credentials, tokens, passwords, and key-like values.";
    if (finding.category === "prompt injection") return "Keep the source as evidence, but do not send embedded instructions as commands.";
    if (finding.category === "PII") return "Remove personal identifiers or use summaries only.";
    if (finding.category === "regulated data") return "Summarize regulated data and exclude raw records.";
    return `Review ${finding.category}.`;
  }))];
}

function includedStartSources(): SourceMaterialDraft[] {
  return state.startSourceMaterials.filter((material) => evidenceReviewFor(material).included);
}

function unresolvedIncludedSafetyBlockers(): SourceMaterialDraft[] {
  return includedStartSources().filter((material) => {
    const review = evidenceReviewFor(material);
    return findingsForMaterial(material).some((finding) => finding.severity === "blocker") && !review.redaction.trim();
  });
}

function providerPayloadPreview(): Record<string, unknown> {
  const intake = intakeFromForm(state.startDraft, state.startSourceMaterials);
  return {
    provider: providerDetail().label,
    keyHandling: providerRequiresKey() ? "session-only, not stored in localStorage" : "no provider key required",
    sendMode: state.startSendSummariesOnly ? "summaries only" : "approved excerpts",
    normalizedContext: {
      projectName: intake.projectName,
      operatingMode: intake.operatingMode,
      context: intake.context,
      users: intake.users,
      goals: intake.goals,
      businessGoals: intake.businessGoals,
      constraints: intake.constraints,
      preferredStack: intake.preferredStack,
      brand: intake.brand
    },
    evidence: state.startSourceMaterials.map((material) => {
      const review = evidenceReviewFor(material);
      const findings = findingsForMaterial(material);
      return {
        id: material.id,
        label: material.label || material.path || "Untitled evidence",
        type: material.type,
        included: review.included,
        sendMode: review.included ? state.startSendSummariesOnly ? "summary" : "approved excerpt" : "excluded",
        safetyFindings: findings.map((finding) => `${finding.severity}: ${finding.finding}`),
        redaction: review.redaction.trim() || redactionSuggestions(material).join(" "),
        summary: review.included ? materialSummary(material) : ""
      };
    }),
    excludedHiddenState: ["workspace history", "saved packages", "browser storage", "session API key"]
  };
}

function providerDiagnostics(): ProviderDiagnostic[] {
  const checks = startPreflightChecks();
  const summary = startPreflightSummary(checks);
  const requiredBlockers = requiredContextBlockers(checks);
  const included = includedStartSources();
  const unresolvedBlockers = unresolvedIncludedSafetyBlockers();
  const key = state.startApiKey.trim();
  const keyRequired = providerRequiresKey();
  const hasSafetyWarnings = included.some((material) => findingsForMaterial(material).length > 0);

  return [
    {
      id: "preflight",
      label: "Local preflight",
      status: requiredBlockers ? "fail" : summary.blockers || summary.warnings ? "warning" : "pass",
      detail: requiredBlockers
        ? "Resolve required context before provider-backed generation."
        : summary.blockers || summary.warnings
          ? "Local preflight allows generation with warnings."
          : "Local preflight is ready."
    },
    {
      id: "provider",
      label: "Provider selection",
      status: "pass",
      detail: `${providerDetail().label} selected. ${providerDetail().detail}`
    },
    {
      id: "session-key",
      label: "Session key",
      status: !keyRequired ? "pass" : !key ? "fail" : providerKeyLooksValid(state.startProvider, key) ? "pass" : "fail",
      detail: !keyRequired
        ? "Local deterministic mode does not require an API key."
        : !key
          ? "Enter a session-only provider key to continue."
          : providerKeyLooksValid(state.startProvider, key)
            ? "Key format looks valid and remains in memory for this browser session."
            : `Key format does not match ${providerDetail().label}.`
    },
    {
      id: "evidence-inclusion",
      label: "Evidence inclusion",
      status: included.length ? hasSafetyWarnings ? "warning" : "pass" : "warning",
      detail: included.length
        ? `${included.length} evidence item${included.length === 1 ? "" : "s"} included. ${state.startSendSummariesOnly ? "Summaries only is enabled." : "Approved excerpts may be sent."}`
        : "No evidence is included. Generation can continue, but architecture quality may be weaker."
    },
    {
      id: "redaction",
      label: "Redaction gate",
      status: unresolvedBlockers.length ? "fail" : hasSafetyWarnings ? "warning" : "pass",
      detail: unresolvedBlockers.length
        ? `${unresolvedBlockers.length} included evidence item${unresolvedBlockers.length === 1 ? "" : "s"} need redaction notes or exclusion.`
        : hasSafetyWarnings
          ? "Safety warnings are documented. Review redaction notes before generation."
          : "No included evidence safety findings require redaction."
    },
    {
      id: "consent",
      label: "Final consent",
      status: state.startProviderConsent ? "pass" : "fail",
      detail: state.startProviderConsent
        ? "User approved the reviewed context and evidence summary."
        : "Confirm the reviewed payload before generation."
    }
  ];
}

function providerSetupReady(diagnostics = providerDiagnostics()): boolean {
  return state.startProviderDiagnosticsRan && diagnostics.every((diagnostic) => diagnostic.status !== "fail");
}

function startGenerationStarted(): boolean {
  return !!state.startGenerationRun.startedAt;
}

function generationPhaseTone(status: StartGenerationPhaseStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "pass") return "success";
  if (status === "warning" || status === "running") return "warning";
  if (status === "blocked") return "danger";
  return "neutral";
}

function generationPhaseLabel(status: StartGenerationPhaseStatus): string {
  if (status === "pass") return "pass";
  if (status === "warning") return "warning";
  if (status === "blocked") return "blocked";
  if (status === "running") return "running";
  return "queued";
}

function generationPhaseEvaluation(phase: StartGenerationPhaseDefinition): StartGenerationPhaseEvaluation {
  const included = includedStartSources();
  const unresolvedBlockers = unresolvedIncludedSafetyBlockers();
  const checks = startPreflightChecks();
  const summary = startPreflightSummary(checks);
  const requiredBlockers = requiredContextBlockers(checks);
  const providerWarnings = providerDiagnostics().filter((diagnostic) => diagnostic.status === "warning").length;
  const constraintCheck = checks.find((check) => check.id === "constraints");
  const readableEvidenceCheck = checks.find((check) => check.id === "evidence");
  const brandMissing = !state.startDraft.brandAttributes.trim();
  const repaired = state.startGenerationRun.repairedPhaseIds.includes(phase.id);

  let evaluation: StartGenerationPhaseEvaluation = {
    status: "pass",
    detail: phase.detail,
    issue: "",
    action: ""
  };

  if (phase.id === "normalize-evidence") {
    if (requiredBlockers) {
      evaluation = {
        status: "blocked",
        detail: "Required context is still missing before generation can be trusted.",
        issue: `${requiredBlockers} required context blocker${requiredBlockers === 1 ? "" : "s"} remain.`,
        action: "Return to Local Preflight and resolve required context."
      };
    } else if (unresolvedBlockers.length) {
      evaluation = {
        status: "blocked",
        detail: "Included evidence still has unresolved secret-like material.",
        issue: `${unresolvedBlockers.length} included evidence item${unresolvedBlockers.length === 1 ? "" : "s"} need redaction notes or exclusion.`,
        action: "Return to Provider Setup and repair the evidence review."
      };
    }
  }

  if (phase.id === "build-evidence-ledger" && included.length === 0) {
    evaluation = {
      status: "warning",
      detail: "The ledger can be created from product context, but no source evidence is included.",
      issue: "No included evidence. Architecture quality may be less grounded.",
      action: "Include source material or continue with a warning."
    };
  }

  if (phase.id === "model-domain" && constraintCheck?.status === "warning") {
    evaluation = {
      status: "warning",
      detail: "The domain model can be inferred, but high-impact constraints are incomplete.",
      issue: constraintCheck.detail,
      action: "Add backend, auth, copy, or compliance notes before rerunning if those decisions are known."
    };
  }

  if (phase.id === "create-routes-workflows" && summary.warnings) {
    evaluation = {
      status: "warning",
      detail: "Routes and workflows can be created, but intake warnings should remain visible in Launch Review.",
      issue: `${summary.warnings} local preflight warning${summary.warnings === 1 ? "" : "s"} remain.`,
      action: "Review warnings or record a repair before Launch Review."
    };
  }

  if (phase.id === "build-dsag" && readableEvidenceCheck?.status === "warning") {
    evaluation = {
      status: "warning",
      detail: "DSAG can be built, but evidence trace confidence is limited.",
      issue: readableEvidenceCheck.detail,
      action: "Add readable evidence excerpts for stronger trace links."
    };
  }

  if (phase.id === "generate-screen-specs" && state.startProvider === "local") {
    evaluation = {
      status: "warning",
      detail: "Screen specs are generated by deterministic local inference.",
      issue: "Local deterministic mode skips provider-backed reasoning.",
      action: "Connect a provider and rerun if production reasoning is required."
    };
  }

  if (phase.id === "generate-design-contracts" && brandMissing) {
    evaluation = {
      status: "warning",
      detail: "Design contracts can be created from product context, but brand evidence is thin.",
      issue: "No brand attributes were supplied.",
      action: "Add brand notes or accept the neutral product UI defaults."
    };
  }

  if (phase.id === "generate-frontend-agent-contract" && constraintCheck?.status === "warning") {
    evaluation = {
      status: "warning",
      detail: "Frontend-agent contracts can be produced, but some integration assumptions stay explicit.",
      issue: constraintCheck.detail,
      action: "Confirm backend, auth, copy, and compliance contracts before production handoff."
    };
  }

  if (phase.id === "validate-package" && providerWarnings) {
    evaluation = {
      status: "warning",
      detail: "Package validation can finish, but provider setup warnings remain part of the proof trail.",
      issue: `${providerWarnings} provider diagnostic warning${providerWarnings === 1 ? "" : "s"} remain.`,
      action: "Review diagnostics before Launch Review."
    };
  }

  if (phase.id === "prepare-launch-review" && (summary.warnings || providerWarnings)) {
    evaluation = {
      status: "warning",
      detail: "Launch Review can be prepared with explicit warnings and human-review notes.",
      issue: `${summary.warnings + providerWarnings} warning${summary.warnings + providerWarnings === 1 ? "" : "s"} will graduate into Launch Review.`,
      action: "Keep warnings visible in Phase 5 or record repairs now."
    };
  }

  if (repaired && evaluation.status !== "pass") {
    return {
      status: "pass",
      detail: `Repair recorded. ${evaluation.detail}`,
      issue: "",
      action: "Repair has been acknowledged for this generation run."
    };
  }

  return evaluation;
}

function generationPhaseViews(): StartGenerationPhaseView[] {
  const run = state.startGenerationRun;
  const started = startGenerationStarted();
  return startGenerationPhaseDefinitions.map((phase, index) => {
    const evaluation = generationPhaseEvaluation(phase);
    let status: StartGenerationPhaseStatus = "queued";
    if (started) {
      if (run.status === "complete" || run.activePhaseIndex > index) {
        status = evaluation.status === "blocked" ? "blocked" : evaluation.status;
      } else if (run.activePhaseIndex === index) {
        status = run.status === "blocked" ? "blocked" : run.status === "running" ? "running" : "queued";
      }
    }
    return {
      ...phase,
      status,
      detail: evaluation.detail,
      issue: evaluation.issue,
      action: evaluation.action,
      repaired: state.startGenerationRun.repairedPhaseIds.includes(phase.id)
    };
  });
}

function generationRunSummary(phases = generationPhaseViews()): { completed: number; warnings: number; blockers: number; queued: number; label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  const completed = phases.filter((phase) => phase.status === "pass" || phase.status === "warning").length;
  const warnings = phases.filter((phase) => phase.status === "warning").length;
  const blockers = phases.filter((phase) => phase.status === "blocked").length;
  const queued = phases.filter((phase) => phase.status === "queued").length;
  if (blockers) return { completed, warnings, blockers, queued, label: "Blocked", tone: "danger" };
  if (state.startGenerationRun.status === "complete") return { completed, warnings, blockers, queued, label: warnings ? "Complete with warnings" : "Complete", tone: warnings ? "warning" : "success" };
  if (state.startGenerationRun.status === "running") return { completed, warnings, blockers, queued, label: "Running", tone: "warning" };
  return { completed, warnings, blockers, queued, label: "Ready", tone: "neutral" };
}

function startGenerationLog(): Record<string, unknown> {
  const phases = generationPhaseViews();
  const summary = generationRunSummary(phases);
  return {
    run: {
      status: state.startGenerationRun.status,
      startedAt: state.startGenerationRun.startedAt || null,
      completedAt: state.startGenerationRun.completedAt || null,
      activePhaseIndex: state.startGenerationRun.activePhaseIndex,
      repairedPhaseIds: state.startGenerationRun.repairedPhaseIds
    },
    summary: {
      completed: summary.completed,
      warnings: summary.warnings,
      blockers: summary.blockers,
      queued: summary.queued,
      label: summary.label
    },
    provider: {
      id: state.startProvider,
      label: providerDetail().label,
      keyHandling: providerRequiresKey() ? "session-only, not persisted, excluded from logs" : "no provider key required"
    },
    phases: phases.map((phase) => ({
      id: phase.id,
      label: phase.label,
      status: phase.status,
      artifact: phase.artifact,
      detail: phase.detail,
      issue: phase.issue || null,
      action: phase.action || null,
      repaired: phase.repaired
    })),
    payloadPreview: providerPayloadPreview()
  };
}

function beginStartGenerationRun(): void {
  state.startGenerationRun = {
    ...blankStartGenerationRun(),
    startedAt: new Date().toISOString(),
    activePhaseIndex: 0,
    status: "running",
    message: "Generation started. Normalize evidence is running."
  };
  persistStartDraft();
}

function completeStartGenerationMessage(): string {
  const phases = generationPhaseViews();
  const warnings = phases.filter((phase) => phase.status === "warning").length;
  return warnings
    ? `Generation completed with ${warnings} warning${warnings === 1 ? "" : "s"}. Launch Review is ready.`
    : "Generation completed. Launch Review is ready.";
}

function runNextStartGenerationPhase(): void {
  if (!startGenerationStarted()) beginStartGenerationRun();
  if (state.startGenerationRun.status === "complete") {
    state.startGenerationRun.message = completeStartGenerationMessage();
    return;
  }
  const activeIndex = Math.min(state.startGenerationRun.activePhaseIndex, startGenerationPhaseDefinitions.length - 1);
  const phase = startGenerationPhaseDefinitions[activeIndex];
  const evaluation = generationPhaseEvaluation(phase);
  if (evaluation.status === "blocked") {
    state.startGenerationRun.status = "blocked";
    state.startGenerationRun.message = `${phase.label} is blocked. ${evaluation.issue || evaluation.detail}`;
    persistStartDraft();
    return;
  }

  const nextIndex = activeIndex + 1;
  state.startGenerationRun.activePhaseIndex = nextIndex;
  if (nextIndex >= startGenerationPhaseDefinitions.length) {
    state.startGenerationRun.status = "complete";
    state.startGenerationRun.completedAt = new Date().toISOString();
    state.startGenerationRun.message = completeStartGenerationMessage();
    recordGenerationSuccess("Generation completed all compiler phases.");
  } else {
    state.startGenerationRun.status = "running";
    state.startGenerationRun.message = `${phase.label} created ${phase.artifact}. ${startGenerationPhaseDefinitions[nextIndex].label} is running.`;
  }
  persistStartDraft();
}

function runAllStartGenerationPhases(): void {
  if (!startGenerationStarted()) beginStartGenerationRun();
  while (state.startGenerationRun.status !== "blocked" && state.startGenerationRun.status !== "complete") {
    runNextStartGenerationPhase();
  }
}

function retryStartGenerationPhase(): void {
  if (!startGenerationStarted()) {
    beginStartGenerationRun();
    return;
  }
  const activePhase = startGenerationPhaseDefinitions[Math.min(state.startGenerationRun.activePhaseIndex, startGenerationPhaseDefinitions.length - 1)];
  state.startGenerationRun.status = "running";
  state.startGenerationRun.message = activePhase ? `Retrying ${activePhase.label}.` : "Retrying generation.";
  persistStartDraft();
}

function repairStartGenerationPhase(phaseId: string): void {
  if (!startGenerationPhaseDefinitions.some((phase) => phase.id === phaseId)) return;
  state.startGenerationRun.repairedPhaseIds = [...new Set([...state.startGenerationRun.repairedPhaseIds, phaseId])];
  const phase = startGenerationPhaseDefinitions.find((candidate) => candidate.id === phaseId);
  if (state.startGenerationRun.status === "blocked" && phase?.id === startGenerationPhaseDefinitions[state.startGenerationRun.activePhaseIndex]?.id) {
    state.startGenerationRun.status = "running";
  }
  state.startGenerationRun.message = `Repair recorded for ${phase?.label ?? "generation phase"}. Rerun the phase to refresh proof.`;
  persistStartDraft();
}

function intakeFileName(value: Record<string, unknown>): string {
  const projectName = String(value.projectName ?? "custom-project");
  return `${slugFromText(projectName, "custom-project")}-intake.json`;
}

function slugFromText(value: string, fallback = "archetype-project"): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function launchPackageName(): string {
  return state.startDraft.projectName.trim() || "Generated Architecture Package";
}

function generatedBundleFromTemplate(template: Bundle): Bundle {
  const now = new Date().toISOString();
  const projectName = launchPackageName();
  const slug = slugFromText(projectName, "generated-architecture-package");
  const bundle = structuredClone(template) as Bundle;
  bundle.generatedAt = now;
  bundle.productModel = {
    ...bundle.productModel,
    product_name: projectName,
    primary_goal: state.startDraft.goals.trim() || bundle.productModel.primary_goal
  };
  bundle.manifest = {
    ...bundle.manifest,
    package_id: `package_${slug}_${Date.now().toString(36)}`,
    project_slug: slug,
    generated_at: now,
    operating_mode: state.startDraft.operatingMode,
    source_hash: `onboarding-${slug}`
  };
  bundle.evidence = {
    ...bundle.evidence,
    onboarding_intake: intakeFromForm(state.startDraft, state.startSourceMaterials),
    onboarding_generation_log: startGenerationLog()
  };
  bundle.productizationReadiness = {
    ...bundle.productizationReadiness,
    product_name: projectName
  };
  bundle.accountWorkspaceContract = {
    ...bundle.accountWorkspaceContract,
    product_name: projectName
  };
  bundle.providerExecutionContract = {
    ...bundle.providerExecutionContract,
    product_name: projectName
  };
  bundle.telemetryAuditContract = {
    ...bundle.telemetryAuditContract,
    product_name: projectName
  };
  bundle.deploymentOperationsContract = {
    ...bundle.deploymentOperationsContract,
    product_name: projectName
  };
  return bundle;
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
      <button class="button danger" id="clear-source-materials" type="button" ${state.sourceMaterials.length ? "" : "disabled"}>Clear sources</button>
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
          esc(humanLabel(material.type)),
          esc(material.label || material.path || "Untitled source"),
          esc(materialFindings.map((finding) => `${finding.severity}: ${finding.finding}`).join("; ") || "None"),
          `<button class="button small danger" data-source-remove="${esc(material.id)}" type="button">Remove</button>`
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
          ${textArea("intake-constraints", form.constraints, "Constraints", "textarea short")}
          ${textArea("intake-preferred-stack", form.preferredStack, "Preferred stack", "textarea short")}
          ${textArea("intake-tone", form.tone, "Tone", "textarea short")}
        </div>
        <div class="control-row">
          <button class="button primary" id="apply-intake-form" type="button">Create project draft</button>
          <button class="button" id="load-form-from-draft" type="button">Load from draft</button>
          <button class="button subtle" id="clear-intake-form" type="button">Clear form</button>
        </div>
      `)}
      ${panel("Generation Draft", `
        ${textArea("generation-draft", draft, "Intake JSON")}
        <div class="control-row">
          <button class="button primary" id="validate-draft" type="button">Validate draft</button>
          <button class="button subtle" id="reset-draft" type="button">Use current package</button>
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
          <button class="button subtle" id="reset-coverage" type="button">Reset coverage states</button>
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
          <button class="button subtle" id="reset-design-review" type="button">Reset design review</button>
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
  const sourceFiles = bundle.sourceFileManifest.files ?? [];
  const codegenTasks = bundle.codegenTasks.tasks ?? [];
  const routeComponentRows = bundle.routeComponentMap.routes ?? [];
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
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Source files", bundle.sourceFileManifest.file_count ?? sourceFiles.length, sourceFiles.length ? "success" : "warning")}
      ${metric("Codegen tasks", codegenTasks.length, codegenTasks.length ? "success" : "warning")}
      ${metric("Mapped routes", routeComponentRows.length, routeComponentRows.length ? "success" : "warning")}
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
      ${panel("Target Source Files", table(["Kind", "Path", "Reads"], sourceFiles.slice(0, 40).map((file: any) => [
        badge(file.kind ?? "file"),
        `<code>${esc(file.path)}</code>`,
        esc((file.reads ?? []).join(", "))
      ])))}
      ${panel("Codegen Tasks", table(["Order", "Task", "Writes"], codegenTasks.map((task: any) => [
        esc(task.order),
        esc(task.task_id),
        esc((task.writes ?? []).slice(0, 4).join(", ") || "none")
      ])))}
      ${panel("Route Component Map", table(["Route", "Screen", "File", "States"], routeComponentRows.map((route: any) => [
        `<code>${esc(route.route)}</code>`,
        esc(route.screen_id),
        `<code>${esc(route.route_file)}</code>`,
        esc((route.states ?? []).join(", "))
      ])))}
      ${panel("Source Generation Runbook", code(bundle.sourceGenerationRunbook))}
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
          <button class="button subtle" id="clear-resolved-gaps" type="button" ${resolvedGaps.length ? "" : "disabled"}>Clear resolved</button>
        </div>
        ${state.contractMessage ? `<div class="notice" role="status">${esc(state.contractMessage)}</div>` : ""}
      `)}
      ${panel("Contract Gaps", state.contractGaps.length ? table(["Status", "Severity", "Category", "Artifact", "Description", "Actions"], state.contractGaps.map((gap) => [
        badge(gap.status, gapTone(gap)),
        badge(gap.severity, gap.severity === "blocker" ? "danger" : gap.severity === "major" ? "warning" : "neutral"),
        esc(gap.category),
        `<code>${esc(gap.artifact)}</code>`,
        esc(gap.description),
        `<div class="control-row compact"><button class="button small" data-gap="${esc(gap.id)}" data-gap-status="resolved" type="button">Resolve</button><button class="button small" data-gap="${esc(gap.id)}" data-gap-status="deferred" type="button">Defer</button><button class="button small" data-gap="${esc(gap.id)}" data-gap-status="open" type="button">Reopen</button><button class="button small danger" data-gap-delete="${esc(gap.id)}" type="button">Delete</button></div>`
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
          <button class="button subtle" id="reset-simulation-triage" type="button">Reset simulation triage</button>
        </div>
      `)}
    </div>
  `;
}

function renderE2E(bundle: Bundle): string {
  const summary = bundle.e2eResults.summary ?? {};
  const results = bundle.e2eResults.results ?? [];
  const faults = bundle.e2eResults.revealed_faults ?? [];
  const fixPlan = bundle.e2eResults.fix_plan ?? [];
  const coverage = bundle.e2eScenarios.coverage ?? [];
  const executionCommands = bundle.targetExecution.commands ?? [];
  const failing = results.filter((item: any) => item.status === "fail");
  const warning = results.filter((item: any) => item.status === "warning");
  return `
    <div class="grid cols-3">
      ${metric("Scenarios", summary.total ?? results.length, (summary.total ?? results.length) === 100 ? "success" : "danger")}
      ${metric("Pass", summary.pass ?? 0, "success")}
      ${metric("Warnings", summary.warning ?? warning.length, warning.length ? "warning" : "success")}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Failures", summary.fail ?? failing.length, failing.length ? "danger" : "success")}
      ${metric("Happy paths", summary.happy_path ?? 0)}
      ${metric("Edge cases", summary.edge_case ?? 0)}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${metric("Target execution", bundle.targetExecution.status ?? "pending", statusTone(bundle.targetExecution.status))}
      ${metric("Typecheck", bundle.targetExecution.summary?.typecheck ?? "pending", statusTone(bundle.targetExecution.summary?.typecheck))}
      ${metric("Build", bundle.targetExecution.summary?.build ?? "pending", statusTone(bundle.targetExecution.summary?.build))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("What Is Wrong", faults.length ? table(["Fault"], faults.map((fault: string) => [esc(fault)])) : `<div class="empty">No current faults exposed by the E2E pass.</div>`)}
      ${panel("How To Fix It", fixPlan.length ? table(["Fix"], fixPlan.map((fix: string) => [esc(fix)])) : `<div class="empty">No fix plan required.</div>`)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Coverage", table(["Area", "Scenarios", "Happy", "Edge"], coverage.map((area: any) => [
        esc(area.area),
        esc(area.scenarios),
        esc(area.happy_path),
        esc(area.edge_case)
      ])))}
      ${panel("Warnings By Scenario", warning.length ? table(["Scenario", "Area", "Fault", "Fix"], warning.map((item: any) => [
        `<code>${esc(item.scenario_id)}</code> ${esc(item.title)}`,
        esc(item.area),
        esc(item.revealed_fault ?? "none"),
        esc(item.fix_hint ?? "none")
      ])) : `<div class="empty">No warning scenarios.</div>`)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Target Execution Commands", table(["Status", "Command", "Duration"], executionCommands.map((item: any) => [
        badge(item.status, statusTone(item.status)),
        `<code>${esc(item.command)}</code>`,
        esc(item.duration_ms === null || item.duration_ms === undefined ? "pending" : `${item.duration_ms}ms`)
      ])))}
      ${panel("Target Execution Report", code(bundle.targetExecutionReport))}
    </div>
    <div style="margin-top:14px">
      ${panel("All 100 Scenarios", table(["Status", "Scenario", "Area", "Type", "Result"], results.map((item: any) => [
        badge(item.status, statusTone(item.status)),
        `<code>${esc(item.scenario_id)}</code> ${esc(item.title)}`,
        esc(item.area),
        esc(item.type),
        esc(item.result)
      ])))}
    </div>
    <div style="margin-top:14px">
      ${panel("E2E Findings Report", code(bundle.e2eFindings))}
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
          <button class="button subtle" id="clear-baseline" type="button" ${baseline ? "" : "disabled"}>Clear baseline</button>
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
    <section data-agent-landmark="handoff" data-agent-section="handoff">
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
          <button class="button primary" id="download-handoff-md" data-agent-action="export-handoff" type="button">Download handoff</button>
          <button class="button" id="download-handoff-json" data-agent-action="export-handoff" type="button">Download handoff JSON</button>
          <button class="button" id="copy-handoff-prompt" data-agent-action="export-handoff" type="button">Copy agent prompt</button>
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
    </section>
  `;
}

function productizationTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "configured") return "success";
  if (status === "session_only" || status === "local_only" || status === "planned") return "warning";
  return "neutral";
}

function renderProductizationReadiness(bundle: Bundle): string {
  const readiness = bundle.productizationReadiness ?? legacyProductizationReadiness();
  const summary = readiness.summary ?? {};
  const gates = Array.isArray(readiness.gates) ? readiness.gates : [];
  const runtime = readiness.runtime_boundary ?? {};
  return `
    <section data-agent-section="productization-readiness">
      <div class="grid cols-3">
        ${metric("Foundation", summary.productization_foundation_ready ? "ready" : "review", summary.productization_foundation_ready ? "success" : "warning")}
        ${metric("Launch", summary.production_launch_ready ? "ready" : "not ready", summary.production_launch_ready ? "success" : "warning")}
        ${metric("Open gates", summary.open_major_gates ?? gates.filter((gate: any) => gate.severity === "major" && gate.status !== "configured").length, "warning")}
      </div>
      <div class="productization-boundary">
        <div><strong>Accounts</strong><span>${esc(runtime.account_mode ?? "unknown")}</span></div>
        <div><strong>Workspace</strong><span>${esc(runtime.workspace_persistence ?? "unknown")}</span></div>
        <div><strong>Provider</strong><span>${esc(runtime.provider_execution ?? "unknown")}</span></div>
        <div><strong>Telemetry</strong><span>${esc(runtime.telemetry_transport ?? "unknown")}</span></div>
        <div><strong>Deployment</strong><span>${esc(runtime.deployment_target ?? "unknown")}</span></div>
      </div>
      ${table(["Gate", "Area", "Status", "Requirement"], gates.map((gate: any) => [
        `<strong>${esc(gate.gate_id)}</strong><div class="muted">${esc(gate.current_state ?? "")}</div>`,
        esc(gate.area),
        badge(gate.status ?? "planned", productizationTone(gate.status ?? "planned")),
        esc(gate.launch_requirement ?? "")
      ]))}
      <div class="productization-lists">
        <div>
          <h3>Preserved Onboarding Contracts</h3>
          ${table(["Contract"], (readiness.preserved_onboarding_contracts ?? []).map((item: string) => [esc(item)]))}
        </div>
        <div>
          <h3>Launch Blockers</h3>
          ${table(["Blocker"], (readiness.launch_blockers ?? []).map((item: string) => [esc(item)]))}
        </div>
      </div>
    </section>
  `;
}

function renderAccountWorkspaceContract(bundle: Bundle): string {
  const contract = bundle.accountWorkspaceContract ?? legacyAccountWorkspaceContract();
  const account = contract.account_model ?? {};
  const workspace = contract.workspace_model ?? {};
  const api = contract.package_persistence_api ?? {};
  const migration = contract.migration_rules ?? {};
  const permissions = contract.permission_model ?? {};
  const dataExport = contract.data_export_contract ?? {};
  const deletion = contract.data_deletion_contract ?? {};
  const readiness = contract.readiness ?? {};
  const endpoints = Array.isArray(api.endpoints) ? api.endpoints : [];
  const migrationSteps = Array.isArray(migration.sequence) ? migration.sequence : [];
  const permissionRows = Array.isArray(permissions.package_permissions) ? permissions.package_permissions : [];
  const deletionSteps = Array.isArray(deletion.sequence) ? deletion.sequence : [];
  const roles = Array.isArray(workspace.roles) ? workspace.roles : [];
  const accountStates = Array.isArray(account.states) ? account.states : [];
  return `
    <section data-agent-section="account-workspace-contract" data-agent-auth-required="hosted-save" data-agent-required-scope="workspace:package.create">
      <div class="grid cols-3">
        ${metric("Contract", readiness.implementable_without_invention ? "ready" : "review", readiness.implementable_without_invention ? "success" : "warning")}
        ${metric("Backend", readiness.backend_implemented ? "live" : "contract only", readiness.backend_implemented ? "success" : "warning")}
        ${metric("Launch", readiness.launch_ready ? "ready" : "not ready", readiness.launch_ready ? "success" : "warning")}
      </div>
      <div class="productization-boundary">
        <div><strong>Account states</strong><span>${esc(accountStates.map(humanLabel).join(", ") || "unknown")}</span></div>
        <div><strong>Workspace roles</strong><span>${esc(roles.map(humanLabel).join(", ") || "unknown")}</span></div>
        <div><strong>Persistence</strong><span>${esc((workspace.package_revision_policy?.immutability as string) ?? "unknown")}</span></div>
        <div><strong>Migration</strong><span>${esc((migration.trigger as string) ?? "unknown")}</span></div>
        <div><strong>Provider keys</strong><span>${esc((account.provider_key_policy?.storage as string) ?? "unknown")}</span></div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>API Contract</h3>
          ${table(["Method", "Path", "Auth"], endpoints.map((endpoint: any) => [
            badge(endpoint.method ?? "GET", "neutral"),
            `<code>${esc(endpoint.path ?? "")}</code><div class="muted">${esc(endpoint.purpose ?? "")}</div>`,
            esc(endpoint.auth ?? "")
          ]))}
        </div>
        <div>
          <h3>Migration Sequence</h3>
          ${table(["Step", "Action"], migrationSteps.map((step: any) => [
            `<strong>${esc(humanLabel(step.id))}</strong><div class="muted"><code>${esc(step.id ?? "")}</code></div>`,
            esc(step.action ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Package Permissions</h3>
          ${table(["Action", "Owner", "Admin", "Editor", "Reviewer", "Viewer", "Agent"], permissionRows.map((row: any) => [
            `<strong>${esc(humanLabel(row.action))}</strong><div class="muted"><code>${esc(row.action ?? "")}</code></div>`,
            esc(humanLabel(row.owner)),
            esc(humanLabel(row.admin)),
            esc(humanLabel(row.editor)),
            esc(humanLabel(row.reviewer)),
            esc(humanLabel(row.viewer)),
            esc(humanLabel(row.agent))
          ]))}
        </div>
        <div>
          <h3>Deletion and Export</h3>
          ${table(["Contract", "Value"], [
            ["Export endpoint", `<code>${esc(dataExport.endpoint ?? "")}</code>`],
            ["Deletion endpoint", `<code>${esc(deletion.endpoint ?? "")}</code>`],
            ["Export includes", esc(((dataExport.included_records ?? []) as string[]).join(", "))],
            ...deletionSteps.map((step: any) => [esc(humanLabel(step.id)), esc(step.action ?? "")])
          ])}
        </div>
      </div>
    </section>
  `;
}

function renderProviderExecutionContract(bundle: Bundle): string {
  const contract = bundle.providerExecutionContract ?? legacyProviderExecutionContract();
  const request = contract.request_contract ?? {};
  const response = contract.response_schema ?? {};
  const credentials = contract.credential_handling ?? {};
  const redaction = contract.redaction_enforcement ?? {};
  const limits = contract.rate_limit_cost_control ?? {};
  const audit = contract.audit_log_contract ?? {};
  const failures = contract.failure_contract ?? {};
  const readiness = contract.readiness ?? {};
  const credentialModes = Array.isArray(credentials.supported_modes) ? credentials.supported_modes : [];
  const redactionGates = Array.isArray(redaction.gates) ? redaction.gates : [];
  const budgetRules = Array.isArray(limits.budget_rules) ? limits.budget_rules : [];
  const auditEvents = Array.isArray(audit.events) ? audit.events : [];
  const failureCodes = Array.isArray(failures.codes) ? failures.codes : [];
  return `
    <section
      data-agent-section="provider-execution-contract"
      data-agent-provider-required="on-generation"
      data-agent-provider-key-persistence="never"
      data-agent-required-scope="${esc(request.required_scope ?? "workspace:provider.execute")}"
    >
      <div class="grid cols-3">
        ${metric("Contract", readiness.implementable_without_invention ? "ready" : "review", readiness.implementable_without_invention ? "success" : "warning")}
        ${metric("Service", readiness.service_implemented ? "live" : "contract only", readiness.service_implemented ? "success" : "warning")}
        ${metric("Keys persisted", readiness.session_keys_persisted ? "yes" : "never", readiness.session_keys_persisted ? "danger" : "success")}
      </div>
      <div class="productization-boundary">
        <div><strong>Endpoint</strong><span>${esc(request.endpoint ?? "unknown")}</span></div>
        <div><strong>Scope</strong><span>${esc(request.required_scope ?? "unknown")}</span></div>
        <div><strong>Modes</strong><span>${esc(((request.execution_modes ?? []) as string[]).map(humanLabel).join(", "))}</span></div>
        <div><strong>Status values</strong><span>${esc(((response.status_values ?? []) as string[]).map(humanLabel).join(", "))}</span></div>
        <div><strong>Raw output</strong><span>${esc((response.artifact_commit_policy?.raw_output_policy as string) ?? "unknown")}</span></div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Credential Handling</h3>
          ${table(["Mode", "Storage", "User key"], credentialModes.map((mode: any) => [
            `<strong>${esc(humanLabel(mode.mode))}</strong><div class="muted"><code>${esc(mode.mode ?? "")}</code></div>`,
            esc(mode.secret_storage ?? ""),
            badge(String(Boolean(mode.requires_user_key)), mode.requires_user_key ? "warning" : "success")
          ]))}
        </div>
        <div>
          <h3>Redaction Gates</h3>
          ${table(["Gate", "Rule"], redactionGates.map((gate: any) => [
            `<strong>${esc(humanLabel(gate.id))}</strong><div class="muted"><code>${esc(gate.id ?? "")}</code></div>`,
            esc(gate.rule ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Budgets and Rate Limits</h3>
          ${table(["Rule", "Requirement"], budgetRules.map((rule: any) => [
            `<strong>${esc(humanLabel(rule.id))}</strong><div class="muted"><code>${esc(rule.id ?? "")}</code></div>`,
            esc(rule.rule ?? "")
          ]))}
        </div>
        <div>
          <h3>Audit Events</h3>
          ${table(["Event", "Description"], auditEvents.map((event: any) => [
            `<strong>${esc(humanLabel(event.event))}</strong><div class="muted"><code>${esc(event.event ?? "")}</code></div>`,
            esc(event.description ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Failure Contract</h3>
          ${table(["Code", "Recovery"], failureCodes.map((failure: any) => [
            `<strong>${esc(humanLabel(failure.code))}</strong><div class="muted"><code>${esc(failure.code ?? "")}</code></div>`,
            esc(failure.recovery ?? "")
          ]))}
        </div>
        <div>
          <h3>Forbidden Storage</h3>
          ${table(["Location"], ((credentials.forbidden_storage ?? []) as string[]).map((item) => [esc(item)]))}
        </div>
      </div>
    </section>
  `;
}

function renderTelemetryAuditContract(bundle: Bundle): string {
  const contract = bundle.telemetryAuditContract ?? legacyTelemetryAuditContract();
  const consent = contract.consent_privacy_contract ?? {};
  const eventSchema = contract.event_schema ?? {};
  const transport = contract.transport_retry_policy ?? {};
  const audit = contract.audit_log_model ?? {};
  const retention = contract.retention_deletion_controls ?? {};
  const analytics = contract.workspace_analytics_boundaries ?? {};
  const readiness = contract.readiness ?? {};
  const purposes = Array.isArray(consent.purposes) ? consent.purposes : [];
  const eventCatalog = Array.isArray(eventSchema.event_catalog) ? eventSchema.event_catalog : [];
  const retryRules = Array.isArray(transport.retry_rules) ? transport.retry_rules : [];
  const auditTypes = Array.isArray(audit.event_types) ? audit.event_types : [];
  const retentionClasses = Array.isArray(retention.retention_classes) ? retention.retention_classes : [];
  const allowedMetrics = Array.isArray(analytics.allowed_metrics) ? analytics.allowed_metrics : [];
  return `
    <section
      data-agent-section="telemetry-audit-contract"
      data-agent-telemetry-default="${readiness.telemetry_default_enabled ? "on" : "off"}"
      data-agent-event-schema-version="${esc(eventSchema.schema_version ?? "unknown")}"
      data-agent-consent-state="${esc(consent.default_state ?? "not_asked")}"
    >
      <div class="grid cols-3">
        ${metric("Contract", readiness.implementable_without_invention ? "ready" : "review", readiness.implementable_without_invention ? "success" : "warning")}
        ${metric("Transport", readiness.transport_implemented ? "live" : "contract only", readiness.transport_implemented ? "success" : "warning")}
        ${metric("Default", readiness.telemetry_default_enabled ? "on" : "off", readiness.telemetry_default_enabled ? "danger" : "success")}
      </div>
      <div class="productization-boundary">
        <div><strong>Consent</strong><span>${esc(consent.default_state ?? "unknown")}</span></div>
        <div><strong>Collection</strong><span>${esc(consent.collection_default ?? "unknown")}</span></div>
        <div><strong>Endpoint</strong><span>${esc(transport.endpoint ?? "unknown")}</span></div>
        <div><strong>Audit store</strong><span>${esc(audit.storage_status ?? "unknown")}</span></div>
        <div><strong>Analytics</strong><span>${esc(analytics.default_visibility ?? "unknown")}</span></div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Consent Purposes</h3>
          ${table(["Purpose", "Default", "Local required"], purposes.map((purpose: any) => [
            `<strong>${esc(humanLabel(purpose.purpose))}</strong><div class="muted"><code>${esc(purpose.purpose ?? "")}</code></div>`,
            esc(humanLabel(purpose.default_state)),
            badge(String(Boolean(purpose.required_for_local_use)), purpose.required_for_local_use ? "warning" : "success")
          ]))}
        </div>
        <div>
          <h3>Event Catalog</h3>
          ${table(["Event", "Purpose", "Privacy"], eventCatalog.map((event: any) => [
            `<strong>${esc(humanLabel(event.event_name))}</strong><div class="muted"><code>${esc(event.event_name ?? "")}</code></div>`,
            esc(humanLabel(event.purpose)),
            esc(humanLabel(event.privacy_classification))
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Transport Retry</h3>
          ${table(["Rule", "Requirement"], retryRules.map((rule: any) => [
            `<strong>${esc(humanLabel(rule.id))}</strong><div class="muted"><code>${esc(rule.id ?? "")}</code></div>`,
            esc(rule.rule ?? "")
          ]))}
        </div>
        <div>
          <h3>Audit Events</h3>
          ${table(["Type", "Description"], auditTypes.map((event: any) => [
            `<strong>${esc(humanLabel(event.event_type))}</strong><div class="muted"><code>${esc(event.event_type ?? "")}</code></div>`,
            esc(event.description ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Retention Classes</h3>
          ${table(["Class", "Retention", "Deletion"], retentionClasses.map((item: any) => [
            `<strong>${esc(humanLabel(item.class))}</strong><div class="muted"><code>${esc(item.class ?? "")}</code></div>`,
            esc(item.default_retention ?? ""),
            esc(item.deletion_behavior ?? "")
          ]))}
        </div>
        <div>
          <h3>Workspace Analytics</h3>
          ${table(["Boundary", "Value"], [
            ["Default visibility", esc(analytics.default_visibility ?? "")],
            ["Minimum group size", esc(analytics.minimum_group_size ?? "")],
            ["Allowed metrics", esc(allowedMetrics.join(", "))],
            ["Forbidden metrics", esc(((analytics.forbidden_metrics ?? []) as string[]).join(", "))]
          ])}
        </div>
      </div>
    </section>
  `;
}

function renderDeploymentOperationsContract(bundle: Bundle): string {
  const contract = bundle.deploymentOperationsContract ?? legacyDeploymentOperationsContract();
  const environment = contract.environment_configuration ?? {};
  const ci = contract.ci_cd_gates ?? {};
  const runbook = contract.hosted_workbench_runbook ?? {};
  const backup = contract.backup_rollback_policy ?? {};
  const observability = contract.observability_signals ?? {};
  const incident = contract.incident_response_checklist ?? {};
  const launch = contract.launch_gate_matrix ?? {};
  const readiness = contract.readiness ?? {};
  const environments = Array.isArray(environment.environments) ? environment.environments : [];
  const ciGates = Array.isArray(ci.required_gates) ? ci.required_gates : [];
  const deploySteps = Array.isArray(runbook.deploy_sequence) ? runbook.deploy_sequence : [];
  const policies = Array.isArray(backup.policies) ? backup.policies : [];
  const signals = Array.isArray(observability.signals) ? observability.signals : [];
  const severities = Array.isArray(incident.severity_levels) ? incident.severity_levels : [];
  const launchGates = Array.isArray(launch.gates) ? launch.gates : [];
  return `
    <section
      data-agent-section="deployment-operations-contract"
      data-agent-deployment-contract="${readiness.implementable_without_invention ? "ready" : "review"}"
      data-agent-production-launch-ready="${readiness.launch_ready ? "true" : "false"}"
    >
      <div class="grid cols-3">
        ${metric("Contract", readiness.implementable_without_invention ? "ready" : "review", readiness.implementable_without_invention ? "success" : "warning")}
        ${metric("Deployment", readiness.deployment_implemented ? "live" : "contract only", readiness.deployment_implemented ? "success" : "warning")}
        ${metric("Launch", readiness.launch_ready ? "ready" : "not ready", readiness.launch_ready ? "success" : "warning")}
      </div>
      <div class="productization-boundary">
        <div><strong>Environments</strong><span>${esc(environments.map((item: any) => humanLabel(item.name)).join(", "))}</span></div>
        <div><strong>CI gates</strong><span>${esc(ciGates.length)}</span></div>
        <div><strong>Runbook</strong><span>${esc(deploySteps.length)} steps</span></div>
        <div><strong>Rollback</strong><span>${esc((backup.objectives?.rto as string) ?? "unknown")}</span></div>
        <div><strong>Launch gates</strong><span>${esc(launchGates.length)}</span></div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Environments</h3>
          ${table(["Name", "Purpose", "Promotion"], environments.map((item: any) => [
            `<strong>${esc(humanLabel(item.name))}</strong><div class="muted"><code>${esc(item.name ?? "")}</code></div>`,
            esc(item.purpose ?? ""),
            esc(item.promotion_source ?? "")
          ]))}
        </div>
        <div>
          <h3>CI/CD Gates</h3>
          ${table(["Gate", "Requirement"], ciGates.map((gate: any) => [
            `<strong>${esc(humanLabel(gate.id))}</strong><div class="muted"><code>${esc(gate.id ?? "")}</code></div>`,
            esc(gate.requirement ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Deployment Runbook</h3>
          ${table(["Step", "Action"], deploySteps.map((step: any) => [
            `<strong>${esc(humanLabel(step.id))}</strong><div class="muted"><code>${esc(step.id ?? "")}</code></div>`,
            esc(step.action ?? "")
          ]))}
        </div>
        <div>
          <h3>Backup and Rollback</h3>
          ${table(["Scope", "Policy"], policies.map((policy: any) => [
            `<strong>${esc(humanLabel(policy.scope))}</strong><div class="muted"><code>${esc(policy.scope ?? "")}</code></div>`,
            esc(policy.policy ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Observability</h3>
          ${table(["Signal", "SLO"], signals.map((signal: any) => [
            `<strong>${esc(humanLabel(signal.signal))}</strong><div class="muted"><code>${esc(signal.signal ?? "")}</code></div>`,
            esc(signal.slo ?? "")
          ]))}
        </div>
        <div>
          <h3>Incident Response</h3>
          ${table(["Severity", "Response", "Examples"], severities.map((severity: any) => [
            `<strong>${esc(humanLabel(severity.severity))}</strong><div class="muted"><code>${esc(severity.severity ?? "")}</code></div>`,
            esc(severity.response_time ?? ""),
            esc(severity.examples ?? "")
          ]))}
        </div>
      </div>
      <div class="productization-lists contract-lists">
        <div>
          <h3>Launch Gate Matrix</h3>
          ${table(["Gate", "Status", "Owner"], launchGates.map((gate: any) => [
            `<strong data-agent-launch-gate-id="${esc(gate.id ?? "")}" data-agent-launch-gate-status="${esc(gate.status ?? "")}">${esc(humanLabel(gate.id))}</strong><div class="muted"><code>${esc(gate.id ?? "")}</code></div>`,
            badge(gate.status ?? "planned", gate.status === "blocked" ? "danger" : gate.status === "pass" ? "success" : "warning"),
            esc(gate.owner ?? "")
          ]))}
        </div>
        <div>
          <h3>Launch Rule</h3>
          ${table(["Rule", "Value"], [
            ["Calculation", esc(launch.launch_ready_calculation ?? "")],
            ["Exception policy", esc(launch.exception_policy ?? "")],
            ["Unresolved work", esc(((readiness.unresolved_launch_work ?? []) as string[]).join(", "))]
          ])}
        </div>
      </div>
    </section>
  `;
}

function renderGovernance(bundle: Bundle): string {
  const queue = governanceActionQueue();
  const approvalGates = bundle.revision.approvalGates?.gates ?? [];
  const approvedGates = approvalGates.filter((gate: any) => approvalStateForGate(gate) === "approved").length;
  const blockers = queue.filter((item) => item.severity === "blocker").length;
  const productization = bundle.productizationReadiness?.summary ?? {};
  const reviewSignals = {
    approvalGates: `${approvedGates}/${approvalGates.length}`,
    coverageOverrides: Object.keys(state.coverageOverrides).length,
    designReviews: Object.keys(state.designReviewOverrides).length,
    contractGaps: state.contractGaps.length,
    simulationTriage: Object.keys(state.simulationTriageOverrides).length,
    revisionRequests: state.revisionRequests.length,
    productizationFoundationReady: Boolean(productization.productization_foundation_ready),
    productionLaunchReady: Boolean(productization.production_launch_ready)
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
      ${panel("Productization Readiness", renderProductizationReadiness(bundle))}
    </div>
    <div style="margin-top:14px">
      ${panel("Account Workspace Contract", renderAccountWorkspaceContract(bundle))}
    </div>
    <div style="margin-top:14px">
      ${panel("Provider Execution Contract", renderProviderExecutionContract(bundle))}
    </div>
    <div style="margin-top:14px">
      ${panel("Telemetry Audit Contract", renderTelemetryAuditContract(bundle))}
    </div>
    <div style="margin-top:14px">
      ${panel("Deployment Operations Contract", renderDeploymentOperationsContract(bundle))}
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
          <button class="button subtle" id="reset-gates" type="button">Reset local gate states</button>
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
        `<div class="control-row compact"><button class="button small" data-revision-request="${esc(request.id)}" data-revision-status="ready" type="button">Ready</button><button class="button small" data-revision-request="${esc(request.id)}" data-revision-status="sent" type="button">Sent</button><button class="button small danger" data-revision-delete="${esc(request.id)}" type="button">Delete</button></div>`
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
    case "e2e":
      return renderE2E(bundle);
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

function renderProductMap(): string {
  const rows = [
    ["Input", "Context, goals, users, screenshots, brand, docs, and code."],
    ["Compiler", "Evidence Ledger, Product Model, workflows, DSAG, design system, and contracts."],
    ["Proof", "Validation, readiness, E2E scenarios, and target execution evidence."],
    ["Handoff", "Frontend-agent instructions, routes, screens, components, tokens, and data contracts."]
  ];
  return `<div class="start-map">${rows.map(([label, detail]) => `
    <div>
      <strong>${esc(label)}</strong>
      <span>${esc(detail)}</span>
    </div>
  `).join("")}</div>`;
}

function renderRecentPackages(): string {
  const recent = state.workspaceEntries.filter((entry) => !entry.archivedAt).slice(0, 5);
  if (!recent.length) {
    return `<div class="empty">Saved packages will appear here after you save or restore a package.</div>`;
  }
  return table(["Package", "Status", "Saved", "Open"], recent.map((entry) => [
    `<div><strong>${esc(entry.name)}</strong><div class="muted">${esc(entry.projectSlug)} · ${esc(entry.packageId || entry.id)}</div></div>`,
    `${badge(entry.readyForFrontendAgent ? "ready" : "hold", entry.readyForFrontendAgent ? "success" : "danger")} ${badge(`score ${entry.readinessScore}`, entry.readyForFrontendAgent ? "success" : "warning")}`,
    esc(new Date(entry.savedAt).toLocaleString()),
    `<button class="button small" data-start-recent-load="${esc(entry.id)}" data-agent-action="open-recent-package" type="button">Open</button>`
  ]));
}

function returningUserActive(): boolean {
  return !state.replayingOnboarding && (state.onboardingState.launch_review_completed || state.workspaceEntries.some((entry) => !entry.archivedAt));
}

function startAgentLandmark(): string {
  const landmarks: Record<StartMode, string> = {
    hub: "start-hub",
    intent: "intake",
    evidence: "evidence",
    preflight: "preflight",
    provider: "provider-setup",
    progress: "generation-progress"
  };
  return landmarks[state.startMode];
}

function viewAgentLandmark(view: ViewId): string {
  if (view === "overview") return "launch-review";
  if (view === "export") return "handoff";
  return view;
}

function activeOnboardingState(): string {
  if (state.view === "overview") return state.onboardingState.launch_review_completed ? "launch-review" : "sample-review";
  if (state.view === "export") return "handoff";
  return state.onboardingState.launch_review_completed ? "workspace-active" : "package-active";
}

function providerSetupRequired(): boolean {
  return state.startMode === "provider" && providerRequiresKey();
}

function generationBlocked(): boolean {
  return state.startGenerationRun.status === "blocked" || requiredContextBlockers() > 0;
}

function renderOnboardingSignals(): string {
  const metrics = state.onboardingState;
  return `
    <div class="onboarding-signals" data-agent-onboarding-metrics="true">
      <div class="mini-metrics">
        <div><strong>${esc(metrics.onboarding_completed_at ? "yes" : "no")}</strong><span>completed</span></div>
        <div><strong>${esc(metrics.provider_setup_success_count)}</strong><span>provider success</span></div>
        <div><strong>${esc(metrics.generation_success_count)}</strong><span>generation success</span></div>
        <div><strong>${esc(metrics.first_save_count)}</strong><span>package saves</span></div>
        <div><strong>${esc(metrics.first_handoff_export_count)}</strong><span>handoff exports</span></div>
        <div><strong>${esc(metrics.reset_usage_count)}</strong><span>resets</span></div>
      </div>
      <div class="onboarding-event-list">
        ${metrics.metric_events.slice(-4).reverse().map((event) => `
          <div class="onboarding-event" data-agent-onboarding-event="${esc(event.type)}">
            ${badge(event.type, event.type === "reset_used" || event.type === "onboarding_skipped" ? "warning" : "success")}
            <span>${esc(event.detail || humanLabel(event.type))}</span>
          </div>
        `).join("") || `<div class="empty">Onboarding signals appear here after setup, generation, save, handoff, reset, or replay events.</div>`}
      </div>
    </div>
  `;
}

function renderReturningWorkspaceHealth(): string {
  const health = workspaceHealthSnapshot(state.workspaceEntries);
  return `
    <div class="mini-metrics">
      <div><strong>${esc(health.readyCount)}</strong><span>ready packages</span></div>
      <div><strong>${esc(health.holdCount)}</strong><span>review gates</span></div>
      <div><strong>${esc(health.highPriorityCount)}</strong><span>high priority</span></div>
    </div>
    <div class="workspace-health-list">
      ${health.reviewQueue.slice(0, 3).map((entry) => `
        <div class="workspace-health-item" data-agent-workspace-health="${esc(entry.id)}">
          <div>
            <strong>${esc(entry.name)}</strong>
            <span>${esc(entry.signals.join(", ") || "No review signal")}</span>
          </div>
          ${badge(entry.archived ? "archived" : entry.readinessScore >= 90 ? "ready" : "review", entry.readinessScore >= 90 ? "success" : "warning")}
        </div>
      `).join("") || `<div class="empty">No unresolved workspace gates.</div>`}
    </div>
  `;
}

function startOnboardingState(): string {
  const states: Record<StartMode, string> = {
    hub: "fresh-start",
    intent: "guided-intent",
    evidence: "guided-evidence",
    preflight: "guided-preflight",
    provider: "provider-setup",
    progress: "generation-progress"
  };
  return states[state.startMode];
}

function renderStartStepper(): string {
  const steps: Array<{ id: Exclude<StartMode, "hub">; label: string; detail: string }> = [
    { id: "intent", label: "Project Intent", detail: "Context, users, goals, stack, mode." },
    { id: "evidence", label: "Evidence Upload", detail: "Screenshots, docs, code, brand, API notes." },
    { id: "preflight", label: "Local Preflight", detail: "Deterministic readiness before provider setup." },
    { id: "provider", label: "Provider Setup", detail: "Key, evidence review, redaction, diagnostics." },
    { id: "progress", label: "Generation Progress", detail: "Compiler phases, artifacts, repair actions." }
  ];
  return `<div class="intake-stepper" aria-label="Guided package creation steps">
    ${steps.map((step, index) => {
      const disabled = step.id === "progress" && !startGenerationStarted();
      return `
      <button class="step-card ${state.startMode === step.id ? "active" : ""}" data-start-step="${esc(step.id)}" data-agent-action="open-${esc(step.id)}-step" type="button" ${state.startMode === step.id ? "aria-current=\"step\"" : ""} ${disabled ? "disabled aria-disabled=\"true\"" : ""}>
        <span class="step-index">${String(index + 1).padStart(2, "0")}</span>
        <span>
          <strong>${esc(step.label)}</strong>
          <small>${esc(step.detail)}</small>
        </span>
      </button>
    `;
    }).join("")}
  </div>`;
}

function renderStartExamples(): string {
  if (!state.startExamplesVisible) return "";
  return `
    <div class="example-shelf" id="start-examples">
      <div>
        <strong>Product context</strong>
        <span>A B2B approvals tool where finance operators review vendor changes, spot risk, and hand off clean exceptions to managers.</span>
      </div>
      <div>
        <strong>User goals</strong>
        <span>Find risky changes quickly. Resolve low-risk items in bulk. Leave an auditable trail for every approval.</span>
      </div>
      <div>
        <strong>Constraints</strong>
        <span>Role-based access, audit log, WCAG AA, empty states for no vendor activity, and REST API backed tables.</span>
      </div>
    </div>
  `;
}

function renderStartModeOptions(): string {
  return `<div class="mode-grid" role="group" aria-label="Operating mode options">
    ${operatingModeOptions.map((mode) => {
      const detail = operatingModeDetail(mode);
      const active = state.startDraft.operatingMode === mode;
      return `
        <button class="mode-card ${active ? "active" : ""}" data-start-mode-option="${esc(mode)}" type="button" aria-pressed="${active}">
          <strong>${esc(detail.label)}</strong>
          <span>${esc(detail.bestFor)}</span>
          <em>${esc(detail.output)}</em>
        </button>
      `;
    }).join("")}
  </div>`;
}

function renderStartQualityPanel(checks: StartPreflightCheck[], summary: ReturnType<typeof startPreflightSummary>): string {
  return panel("Input Quality", `
    <div class="quality-meter" aria-label="Input quality score ${esc(summary.score)} out of 100">
      <div style="width:${esc(summary.score)}%"></div>
    </div>
    <div class="mini-metrics">
      <div><strong>${esc(summary.score)}</strong><span>Quality score</span></div>
      <div><strong>${esc(summary.blockers)}</strong><span>Required gaps</span></div>
      <div><strong>${esc(summary.warnings)}</strong><span>Warnings</span></div>
    </div>
    <div class="preflight-list compact" aria-label="Current intake checks">
      ${checks.slice(0, 4).map((check) => `
        <div class="preflight-row ${esc(check.status)}">
          ${badge(check.status, check.status === "pass" ? "success" : check.status === "warning" ? "warning" : "danger")}
          <div>
            <strong>${esc(check.label)}</strong>
            <span>${esc(check.detail)}</span>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="control-row">
      <button class="button" id="toggle-start-examples" data-agent-action="toggle-intake-examples" type="button">${state.startExamplesVisible ? "Hide examples" : "Show examples"}</button>
      <button class="button primary" id="continue-start-evidence" data-agent-action="continue-to-evidence" type="button">Continue to evidence</button>
    </div>
    ${renderStartExamples()}
  `);
}

function renderStartIntentStep(checks: StartPreflightCheck[], summary: ReturnType<typeof startPreflightSummary>): string {
  const intake = intakeFromForm(state.startDraft, state.startSourceMaterials);
  return `
    <div class="grid cols-2 section-gap">
      ${panel("Project Intent", `
        <div class="form-grid">
          ${inputField("start-project-name", state.startDraft.projectName, "Project name")}
          ${selectField("start-mode", state.startDraft.operatingMode, "Operating mode", operatingModeOptions)}
          ${inputField("start-primary-color", state.startDraft.primaryColor, "Primary color", "color")}
          ${inputField("start-brand-attributes", state.startDraft.brandAttributes, "Brand attributes")}
        </div>
        <div style="height:10px"></div>
        ${textArea("start-context", state.startDraft.context, "Product context", "textarea short")}
        <div class="form-grid" style="margin-top:10px">
          ${textArea("start-goals", state.startDraft.goals, "User goals", "textarea short")}
          ${textArea("start-business-goals", state.startDraft.businessGoals, "Business goals", "textarea short")}
          ${textArea("start-users", state.startDraft.users, "Primary users", "textarea short")}
          ${textArea("start-constraints", state.startDraft.constraints, "Constraints", "textarea short")}
          ${textArea("start-preferred-stack", state.startDraft.preferredStack, "Preferred stack", "textarea short")}
          ${textArea("start-tone", state.startDraft.tone, "Tone", "textarea short")}
        </div>
      `)}
      ${renderStartQualityPanel(checks, summary)}
    </div>
    <div class="grid cols-2 section-gap">
      ${panel("Operating Mode Explanation", renderStartModeOptions())}
      ${panel("Local Draft Preview", `
        ${state.startMessage ? `<div class="notice" role="status">${esc(state.startMessage)}</div><div style="height:10px"></div>` : ""}
        ${code(intake)}
      `)}
    </div>
  `;
}

function renderStartEvidenceStep(): string {
  const findings = state.startSourceMaterials.flatMap(findingsForMaterial);
  const hasBlockers = findings.some((finding) => finding.severity === "blocker");
  return `
    <div class="grid cols-2 section-gap">
      ${panel("Evidence Upload", `
        <div class="form-grid">
          ${inputField("start-source-label", state.startSourceDraft.label, "Evidence label")}
          ${selectField("start-source-type", state.startSourceDraft.type, "Evidence type", sourceMaterialTypes)}
          ${inputField("start-source-path", state.startSourceDraft.path, "Path or URL")}
          ${inputField("start-source-notes", state.startSourceDraft.notes, "Notes")}
        </div>
        <div style="height:10px"></div>
        ${textArea("start-source-content", state.startSourceDraft.content, "Content excerpt", "textarea short")}
        <div class="control-row">
          <button class="button primary" id="add-start-source" data-agent-action="add-evidence-record" type="button">Add evidence</button>
          <button class="button" id="import-start-source-files" data-agent-action="import-evidence-files" type="button">Import files</button>
          <button class="button danger" id="clear-start-sources" data-agent-action="clear-evidence-records" type="button" ${state.startSourceMaterials.length ? "" : "disabled"}>Clear evidence</button>
          <input id="start-source-file-input" type="file" multiple hidden />
        </div>
        ${state.startSourceMessage ? `<div class="notice" role="status">${esc(state.startSourceMessage)}</div>` : ""}
      `)}
      ${panel("Source Material State", `
        <div class="mini-metrics">
          <div><strong>${esc(state.startSourceMaterials.length)}</strong><span>Evidence records</span></div>
          <div><strong>${esc(findings.length)}</strong><span>Safety findings</span></div>
          <div><strong>${esc(findings.filter((finding) => finding.severity === "blocker").length)}</strong><span>Blockers</span></div>
        </div>
        <div class="notice" role="note">
          Prompt-injection text is treated as risky source material, not as an instruction. Sensitive data should be redacted before Phase 3 provider setup.
        </div>
        <div class="control-row">
          <button class="button subtle" id="back-start-intent" data-agent-action="back-to-intent" type="button">Back to intent</button>
          <button class="button primary" id="continue-start-preflight" data-agent-action="run-local-preflight" type="button">Continue to preflight</button>
        </div>
      `)}
    </div>
    <div class="section-gap">
      ${panel("Evidence Records", `
        ${state.startSourceMaterials.length ? table(["Safety", "Type", "Label", "Findings", "Actions"], state.startSourceMaterials.map((material) => {
          const materialFindings = findingsForMaterial(material);
          return [
            badge(materialFindings.length ? `${materialFindings.length} findings` : "clear", sourceTone(materialFindings)),
            esc(humanLabel(material.type)),
            `<div><strong>${esc(material.label || material.path || "Untitled evidence")}</strong><div class="muted">${esc(material.path || material.notes || "Local draft evidence")}</div></div>`,
            esc(materialFindings.map((finding) => `${finding.severity}: ${finding.finding}`).join("; ") || "None"),
            `<button class="button small danger" data-start-source-remove="${esc(material.id)}" type="button">Remove</button>`
          ];
        })) : `<div class="source-empty">
          <strong>No evidence added yet.</strong>
          <span>Add screenshots, product references, brand notes, docs, code snippets, backend/API notes, or auth/permission notes. The draft can still be checked locally before any LLM key is requested.</span>
        </div>`}
        ${hasBlockers ? `<div class="notice" role="status">Safety blocker detected. Redact secrets before provider-backed generation in Phase 3.</div>` : ""}
      `)}
    </div>
  `;
}

function renderStartPreflightStep(checks: StartPreflightCheck[], summary: ReturnType<typeof startPreflightSummary>): string {
  const intake = intakeFromForm(state.startDraft, state.startSourceMaterials);
  const canOpenProvider = requiredContextBlockers(checks) === 0;
  return `
    <div class="grid cols-2 section-gap">
      ${panel("Local Preflight", `
        <div class="preflight-summary ${esc(summary.tone)}">
          <strong>${esc(summary.label)}</strong>
          <span>${esc(summary.blockers ? "Resolve required gaps before generation." : summary.warnings ? "You can proceed later, but review the warnings first." : "The local intake is ready for provider-backed generation setup.")}</span>
        </div>
        <div class="quality-meter" aria-label="Local preflight score ${esc(summary.score)} out of 100">
          <div style="width:${esc(summary.score)}%"></div>
        </div>
        <div class="preflight-list">
          ${checks.map((check) => `
            <div class="preflight-row ${esc(check.status)}">
              ${badge(check.status, check.status === "pass" ? "success" : check.status === "warning" ? "warning" : "danger")}
              <div>
                <strong>${esc(check.label)}</strong>
                <span>${esc(check.detail)}</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="control-row">
          <button class="button subtle" id="back-start-evidence" data-agent-action="back-to-evidence" type="button">Back to evidence</button>
          <button class="button" id="download-start-draft-preflight" data-agent-action="download-project-draft" type="button">Download intake JSON</button>
          <button class="button primary" id="start-generate-architecture" data-agent-action="connect-provider" type="button" ${canOpenProvider ? "" : "disabled"} aria-describedby="phase3-provider-note">Generate architecture</button>
        </div>
        <div class="notice" id="phase3-provider-note" role="note">${canOpenProvider ? "Next you will review exactly what will be sent, redact or exclude risky evidence, choose a provider, and enter a session-only key if needed." : "Resolve required context before provider setup. No API key is requested during local preflight."}</div>
      `)}
      ${panel("Intake Preview", code(intake))}
    </div>
  `;
}

function renderProviderSelection(diagnostics: ProviderDiagnostic[]): string {
  const keyRequired = providerRequiresKey();
  const keyStatus = diagnostics.find((diagnostic) => diagnostic.id === "session-key");
  return panel("Provider Setup", `
    <div class="provider-grid" role="group" aria-label="Provider options">
      ${providerOptions.map((provider) => {
        const active = state.startProvider === provider.id;
        return `
          <button class="provider-card ${active ? "active" : ""}" data-start-provider-option="${esc(provider.id)}" type="button" aria-pressed="${active}">
            <strong>${esc(provider.label)}</strong>
            <span>${esc(provider.detail)}</span>
            <em>${esc(provider.keyHint)}</em>
          </button>
        `;
      }).join("")}
    </div>
    <div class="provider-key-grid">
      ${selectField("start-provider", state.startProvider, "Provider", providerOptions.map((provider) => provider.id))}
      <label class="field">
        <span>${keyRequired ? "Session API key" : "Session API key"}</span>
        <input id="start-api-key" class="input" type="password" value="${esc(state.startApiKey)}" autocomplete="off" ${keyRequired ? "" : "disabled"} />
      </label>
    </div>
    <div class="notice" role="note">
      Archetype can run local checks without an LLM key. To generate a full architecture package from your context and evidence, connect a model provider. Review the evidence summary before sending it.
    </div>
    <div class="mini-metrics">
      <div><strong>${esc(providerDetail().label)}</strong><span>Provider</span></div>
      <div><strong>${esc(keyRequired ? "Session" : "None")}</strong><span>Key handling</span></div>
      <div><strong>${esc(keyStatus?.status ?? "fail")}</strong><span>Key diagnostic</span></div>
    </div>
    <div class="control-row">
      <button class="button" id="start-use-local-mode" data-agent-action="use-local-deterministic-mode" type="button">Use local deterministic mode</button>
      <button class="button primary" id="start-run-provider-diagnostics" data-agent-action="run-provider-diagnostics" type="button">Run diagnostics</button>
    </div>
    ${state.startProviderMessage ? `<div class="notice" role="status">${esc(state.startProviderMessage)}</div>` : ""}
  `);
}

function renderEvidenceReview(): string {
  return panel("Evidence Review Before Generation", `
    <div data-agent-action="review-evidence" data-agent-section="provider-evidence-review">
      <div class="checkbox-row">
        <label>
          <input id="start-send-summaries-only" type="checkbox" ${state.startSendSummariesOnly ? "checked" : ""} />
          <span>Send summaries only</span>
        </label>
        <small>Default. Raw files and hidden app state are excluded from the provider payload.</small>
      </div>
      <div class="evidence-review-list">
        ${state.startSourceMaterials.length ? state.startSourceMaterials.map((material) => {
          const review = evidenceReviewFor(material);
          const findings = findingsForMaterial(material);
          const suggestions = redactionSuggestions(material);
          return `
            <div class="review-row" data-agent-evidence-id="${esc(material.id)}">
              <div class="review-row-main">
                <label class="checkbox-row compact">
                  <input type="checkbox" data-start-evidence-include="${esc(material.id)}" ${review.included ? "checked" : ""} />
                  <span>${esc(material.label || material.path || "Untitled evidence")}</span>
                </label>
                <div class="muted">${esc(humanLabel(material.type))} · ${esc(material.path || "local draft evidence")}</div>
                <div class="tag-row">
                  ${badge(review.included ? "included" : "excluded", review.included ? "success" : "neutral")}
                  ${badge(state.startSendSummariesOnly ? "summary only" : "approved excerpt", state.startSendSummariesOnly ? "success" : "warning")}
                  ${badge(findings.length ? `${findings.length} safety` : "clear", sourceTone(findings))}
                </div>
                ${suggestions.length ? `<div class="notice compact" role="note">${esc(suggestions.join(" "))}</div>` : ""}
              </div>
              <label class="field">
                <span>Redaction note</span>
                <textarea class="textarea compact" data-start-evidence-redaction="${esc(material.id)}" spellcheck="false">${esc(review.redaction)}</textarea>
              </label>
            </div>
          `;
        }).join("") : `<div class="source-empty">
          <strong>No evidence included.</strong>
          <span>The provider payload can still use normalized product context, but architecture quality improves when source material is reviewed and included.</span>
        </div>`}
      </div>
    </div>
  `);
}

function renderProviderDiagnostics(diagnostics: ProviderDiagnostic[]): string {
  return panel("Connection Diagnostics", `
    <div class="diagnostic-list">
      ${diagnostics.map((diagnostic) => `
        <div class="diagnostic-row ${esc(diagnostic.status)}">
          ${badge(diagnostic.status, diagnostic.status === "pass" ? "success" : diagnostic.status === "warning" ? "warning" : "danger")}
          <div>
            <strong>${esc(diagnostic.label)}</strong>
            <span>${esc(diagnostic.detail)}</span>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="consent-box">
      <label class="checkbox-row compact">
        <input id="start-provider-consent" type="checkbox" ${state.startProviderConsent ? "checked" : ""} />
        <span>I reviewed the provider payload and approve the included summaries.</span>
      </label>
      <small>The session key is not saved to localStorage and is never included in draft export.</small>
    </div>
    <div class="control-row">
      <button class="button subtle" id="back-start-preflight" data-agent-action="back-to-local-preflight" type="button">Back to preflight</button>
      <button class="button" id="download-provider-payload" data-agent-action="download-provider-payload-preview" type="button">Download payload preview</button>
      <button class="button primary" id="final-start-generate-architecture" data-agent-action="generate-architecture" type="button" ${providerSetupReady(diagnostics) ? "" : "disabled"}>Generate architecture</button>
    </div>
    ${!state.startProviderDiagnosticsRan ? `<div class="notice" role="note">Run diagnostics after provider, key, evidence, and consent are set.</div>` : ""}
  `);
}

function renderProviderPayload(): string {
  return panel("What Will Be Sent", `
    <div class="payload-scope">
      <div>
        <strong>Sent</strong>
        <span>Normalized product context, selected evidence summaries, safety notes, redaction notes, provider id.</span>
      </div>
      <div>
        <strong>Not sent</strong>
        <span>Session API key, workspace history, saved packages, hidden browser state, excluded evidence, raw private files.</span>
      </div>
      <div>
        <strong>Do not include</strong>
        <span>Secrets, credentials, raw regulated data, or private files that have not been approved.</span>
      </div>
    </div>
    ${code(providerPayloadPreview())}
  `);
}

function renderStartProviderStep(): string {
  cleanupEvidenceReview();
  const diagnostics = providerDiagnostics();
  return `
    <div class="grid cols-2 section-gap">
      ${renderProviderSelection(diagnostics)}
      ${renderProviderDiagnostics(diagnostics)}
    </div>
    <div class="grid cols-2 section-gap">
      ${renderEvidenceReview()}
      ${renderProviderPayload()}
    </div>
  `;
}

function renderGenerationPhaseRow(phase: StartGenerationPhaseView, index: number): string {
  const canRepair = phase.status === "warning" || phase.status === "blocked";
  const canRetry = phase.status === "blocked" || phase.status === "running";
  return `
    <div class="generation-phase-row ${esc(phase.status)}" data-start-generation-phase="${esc(phase.id)}">
      <span class="generation-phase-index">${esc(String(index + 1).padStart(2, "0"))}</span>
      <div class="generation-phase-copy">
        <div class="generation-phase-title">
          <strong>${esc(phase.label)}</strong>
          ${badge(generationPhaseLabel(phase.status), generationPhaseTone(phase.status))}
        </div>
        <span>${esc(phase.detail)}</span>
        <code>${esc(phase.artifact)}</code>
        ${phase.issue ? `<div class="notice compact" role="note">${esc(phase.issue)} ${esc(phase.action)}</div>` : ""}
      </div>
      <div class="generation-phase-actions">
        ${canRetry ? `<button class="button small" data-start-generation-retry="${esc(phase.id)}" type="button">Retry phase</button>` : ""}
        ${canRepair ? `<button class="button small" data-start-generation-repair="${esc(phase.id)}" type="button">${phase.repaired ? "Repair recorded" : "Record repair"}</button>` : ""}
      </div>
    </div>
  `;
}

function renderCurrentGenerationPhase(phase: StartGenerationPhaseView | undefined): string {
  if (!phase) {
    return `<div class="empty">Generation has not started. Return to Provider Setup and approve generation.</div>`;
  }
  return `
    <div class="snapshot-line">
      <div>
        <h3>${esc(phase.label)}</h3>
        <div class="muted">${esc(phase.detail)}</div>
      </div>
      ${badge(generationPhaseLabel(phase.status), generationPhaseTone(phase.status))}
    </div>
    <div class="payload-scope" style="margin-top:10px">
      <div>
        <strong>Artifact</strong>
        <span>${esc(phase.artifact)}</span>
      </div>
      <div>
        <strong>Phase status</strong>
        <span>${esc(generationPhaseLabel(phase.status))}</span>
      </div>
      <div>
        <strong>Repair action</strong>
        <span>${esc(phase.issue ? phase.action : "No repair needed for this phase.")}</span>
      </div>
    </div>
    ${phase.issue ? `<div class="notice" role="status">${esc(phase.issue)}</div>` : ""}
    <div class="control-row">
      <button class="button" id="retry-current-generation-phase" data-agent-action="retry-generation-phase" type="button" ${phase.status === "blocked" || phase.status === "running" ? "" : "disabled"}>Retry current phase</button>
      <button class="button" data-start-generation-repair="${esc(phase.id)}" data-agent-action="repair-generation-phase" type="button" ${phase.status === "warning" || phase.status === "blocked" ? "" : "disabled"}>Record repair</button>
    </div>
  `;
}

function renderGenerationArtifacts(phases: StartGenerationPhaseView[]): string {
  const created = phases.filter((phase) => phase.status === "pass" || phase.status === "warning");
  if (!created.length) {
    return `<div class="empty">Artifacts appear here as compiler phases complete.</div>`;
  }
  return table(["Status", "Phase", "Artifact", "Issue"], created.map((phase) => [
    badge(generationPhaseLabel(phase.status), generationPhaseTone(phase.status)),
    esc(phase.label),
    `<code>${esc(phase.artifact)}</code>`,
    esc(phase.issue || "None")
  ]));
}

function renderStartGenerationProgressStep(): string {
  const phases = generationPhaseViews();
  const summary = generationRunSummary(phases);
  const activePhase = phases[state.startGenerationRun.activePhaseIndex] ?? phases[phases.length - 1];
  const progress = Math.round((summary.completed / startGenerationPhaseDefinitions.length) * 100);
  return `
    <div class="grid cols-2 section-gap">
      ${panel("Compiler Progress", `
        <div class="preflight-summary ${esc(summary.tone)}">
          <strong>${esc(summary.label)}</strong>
          <span>${esc(state.startGenerationRun.message || "Generation is ready to run through deterministic compiler phases.")}</span>
        </div>
        <div class="quality-meter" aria-label="Generation progress ${esc(progress)} percent">
          <div style="width:${esc(progress)}%"></div>
        </div>
        <div class="mini-metrics">
          <div><strong>${esc(`${summary.completed}/10`)}</strong><span>phases complete</span></div>
          <div><strong>${esc(summary.warnings)}</strong><span>warnings</span></div>
          <div><strong>${esc(summary.blockers)}</strong><span>blockers</span></div>
          <div><strong>${esc(summary.queued)}</strong><span>queued</span></div>
          <div><strong>${esc(providerDetail().label)}</strong><span>provider</span></div>
          <div><strong>${esc(state.startGenerationRun.repairedPhaseIds.length)}</strong><span>repairs</span></div>
        </div>
        <div class="control-row">
          <button class="button subtle" id="back-start-provider" data-agent-action="back-to-provider-setup" type="button">Back to provider setup</button>
          <button class="button" id="save-generation-progress-draft" data-agent-action="save-generation-progress-draft" type="button">Save progress draft</button>
          <button class="button" id="download-generation-progress-log" data-agent-action="download-generation-progress-log" type="button">Download generation log</button>
          <button class="button primary" id="run-next-generation-phase" data-agent-action="run-next-generation-phase" type="button" ${state.startGenerationRun.status === "complete" ? "disabled" : ""}>Run next phase</button>
          <button class="button primary" id="run-all-generation-phases" data-agent-action="run-all-generation-phases" type="button" ${state.startGenerationRun.status === "complete" ? "disabled" : ""}>Run all phases</button>
        </div>
        ${state.startGenerationRun.status === "complete" ? `
          <div class="notice launch-graduation" role="status" data-agent-landmark="launch-review-graduation">
            <div>
              <strong>Generation complete.</strong>
              <span>Open Launch Review to finish onboarding with readiness, trusted evidence, missing context, human review, and handoff actions.</span>
            </div>
            <button class="button primary" id="open-generated-launch-review" data-agent-action="open-launch-review" type="button">Open Launch Review</button>
          </div>
        ` : ""}
      `)}
      ${panel("Current Phase", renderCurrentGenerationPhase(activePhase))}
    </div>
    <div class="grid cols-2 section-gap">
      ${panel("Phase Timeline", `
        <div class="generation-phase-list">
          ${phases.map((phase, index) => renderGenerationPhaseRow(phase, index)).join("")}
        </div>
      `)}
      ${panel("Artifacts Created", renderGenerationArtifacts(phases))}
    </div>
    <div class="section-gap">
      ${panel("Generation Log Preview", code(startGenerationLog()))}
    </div>
  `;
}

function renderStartDraft(): string {
  const checks = startPreflightChecks();
  const summary = startPreflightSummary(checks);
  const stepCopy: Record<Exclude<StartMode, "hub">, { eyebrow: string; title: string; body: string }> = {
    intent: {
      eyebrow: "Guided Intake",
      title: "Tell Archetype what product should exist.",
      body: "Capture the product, users, goals, constraints, stack, and operating mode locally. No LLM API key is needed for drafting."
    },
    evidence: {
      eyebrow: "Evidence Upload",
      title: "Attach the source material that should constrain the architecture.",
      body: "Every source becomes an evidence record with immediate local safety feedback. Risky source text is never treated as an instruction."
    },
    preflight: {
      eyebrow: "Local Preflight",
      title: "Check readiness before provider setup.",
      body: "Archetype validates the intake locally and tells you whether it is ready, warning-only, or missing required context."
    },
    provider: {
      eyebrow: "Provider Setup",
      title: "Review what will be sent before generation.",
      body: "Choose a provider, keep the key session-only, redact risky evidence, and run diagnostics before architecture generation starts."
    },
    progress: {
      eyebrow: "Generation Progress",
      title: "Watch Archetype compile the architecture package.",
      body: "Generation is shown as deterministic compiler phases with artifacts, warnings, blockers, repair actions, and a saveable progress log."
    }
  };
  const copy = stepCopy[state.startMode === "hub" ? "intent" : state.startMode];
  return `
    <section class="start-hero panel" data-agent-section="guided-intake">
      <div class="start-copy">
        <div class="eyebrow">${esc(copy.eyebrow)}</div>
        <h1>${esc(copy.title)}</h1>
        <p>${esc(copy.body)}</p>
        <div class="hero-actions">
          <button class="button primary" id="save-start-draft" data-agent-action="save-project-draft" type="button">Save draft locally</button>
          <button class="button" id="download-start-draft" data-agent-action="download-project-draft" type="button">Download intake JSON</button>
          <button class="button subtle" id="back-start-hub" data-agent-action="back-to-start-hub" type="button">Back to Start Hub</button>
        </div>
      </div>
      <div class="start-proof" aria-label="Draft status">
        ${badge(summary.label, summary.tone)}
        ${badge(`${state.startSourceMaterials.length} evidence`, state.startSourceMaterials.length ? "success" : "warning")}
        ${state.startMode === "provider" ? badge(providerDetail().label, state.startProvider === "local" ? "success" : "neutral") : ""}
        ${state.startMode === "progress" ? badge(generationRunSummary().label, generationRunSummary().tone) : ""}
        ${badge(state.startDraftSavedAt ? "draft saved" : "local draft", state.startDraftSavedAt ? "success" : "neutral")}
        ${badge((state.startMode === "provider" || state.startMode === "progress") && providerRequiresKey() ? "session key only" : "no API key needed", "success")}
      </div>
    </section>
    ${renderStartStepper()}
    ${state.startMode === "intent" ? renderStartIntentStep(checks, summary) : ""}
    ${state.startMode === "evidence" ? renderStartEvidenceStep() : ""}
    ${state.startMode === "preflight" ? renderStartPreflightStep(checks, summary) : ""}
    ${state.startMode === "provider" ? renderStartProviderStep() : ""}
    ${state.startMode === "progress" ? renderStartGenerationProgressStep() : ""}
  `;
}

function renderStartHub(): string {
  if (state.startMode === "hub") markOnboardingFlag("start_hub_seen");
  const savedCount = state.workspaceEntries.filter((entry) => !entry.archivedAt).length;
  const hasDraft = startDraftHasContent();
  const returning = returningUserActive();
  const startEyebrow = returning ? "Returning Workspace" : "Fresh Start";
  const startTitle = returning ? "Continue from your architecture workspace." : "Compile product context into a buildable frontend contract.";
  const startBody = returning
    ? "Review recent packages, workspace health, drafts waiting for generation, and packages with unresolved launch gates."
    : "Archetype turns evidence into a Product Model, UX architecture, design system, validation proof, and deterministic handoff for a frontend-building agent.";
  const createLabel = returning ? "Create new package" : "Create a package";
  const body = state.startMode !== "hub" ? renderStartDraft() : `
    <section class="start-hero panel" data-agent-section="start-hub">
      <div class="start-copy">
        <div class="eyebrow">${esc(startEyebrow)}</div>
        <h1>${esc(startTitle)}</h1>
        <p>${esc(startBody)}</p>
        <div class="hero-actions">
          <button class="button primary" id="start-create-package" data-agent-action="create-package" type="button">${esc(createLabel)}</button>
          <button class="button" id="start-load-sample" data-agent-action="explore-sample" type="button">Explore sample package</button>
          <button class="button" id="start-import-package" data-agent-action="import-package" type="button">Import existing package</button>
          ${returning ? `<button class="button subtle" id="start-replay-onboarding" data-agent-action="replay-onboarding" type="button">Replay onboarding</button>` : ""}
          <input id="start-folder-input" type="file" webkitdirectory multiple hidden />
        </div>
      </div>
      <div class="start-proof" aria-label="Workspace status">
        ${badge(`${savedCount} saved`, savedCount ? "success" : "neutral")}
        ${badge(hasDraft ? "draft waiting" : "fresh state", hasDraft ? "warning" : "success")}
        ${returning ? badge("returning", "success") : ""}
        ${badge("no API key needed", "success")}
      </div>
    </section>
    <div class="grid cols-3 section-gap">
      <button class="start-card" id="start-create-package-card" data-agent-action="create-package" type="button">
        <strong>${esc(createLabel)}</strong>
        <span>Start a clean project draft from product context and goals.</span>
      </button>
      <button class="start-card" id="start-load-sample-card" data-agent-action="explore-sample" type="button">
        <strong>Explore sample package</strong>
        <span>Learn the Launch Review, proof, contract, and handoff flow with generated data.</span>
      </button>
      <button class="start-card" id="start-import-package-card" data-agent-action="import-package" type="button">
        <strong>Import existing package</strong>
        <span>Open an exported Archetype package folder without running generation.</span>
      </button>
    </div>
    <div class="grid cols-2 section-gap">
      ${panel(returning ? "Workspace Health" : "Quick Product Map", returning ? renderReturningWorkspaceHealth() : renderProductMap())}
      ${panel("Recent Packages", renderRecentPackages())}
    </div>
    <div class="grid cols-2 section-gap">
      ${panel("Start Actions", `
        <div class="control-row">
          <button class="button" id="start-restore-state" data-agent-action="restore-workspace" type="button">Restore workspace state</button>
          ${returning ? `<button class="button" id="start-replay-onboarding-actions" data-agent-action="replay-onboarding" type="button">Replay onboarding</button>` : ""}
          <button class="button subtle" id="start-reset-fresh" data-agent-action="reset-workspace" type="button">Reset to fresh state</button>
          <input id="start-state-import-input" type="file" accept="application/json,.json" hidden />
        </div>
        ${state.startMessage ? `<div class="notice" role="status">${esc(state.startMessage)}</div>` : ""}
      `)}
      ${panel(returning ? "Onboarding Signals" : "What You Get", returning ? renderOnboardingSignals() : `
        <div class="start-output-list">
          <span>Evidence Ledger</span>
          <span>Product Model</span>
          <span>Routes and Screen Specs</span>
          <span>Design System Contracts</span>
          <span>Frontend Agent Contract</span>
          <span>Validation and Readiness Proof</span>
        </div>
      `)}
    </div>
  `;
  return `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <main class="start-main" id="main-content" data-agent-current-view="start" data-agent-landmark="${esc(startAgentLandmark())}" data-agent-package-exists="false" data-agent-provider-required="${providerSetupRequired() ? "true" : "false"}" data-agent-generation-blocked="${generationBlocked() ? "true" : "false"}" data-agent-onboarding-complete="${state.onboardingState.launch_review_completed ? "true" : "false"}" data-agent-onboarding-state="${esc(startOnboardingState())}" tabindex="-1">
      <header class="start-header">
        <div class="brand">
          <div class="mark">A</div>
          <div>
            <div class="brand-title">Archetype</div>
            <div class="brand-subtitle">Design Architecture Compiler</div>
          </div>
        </div>
        <div class="status-strip" role="status" aria-live="polite">
          ${badge(returning ? "returning workspace" : "fresh state", "success")}
          ${badge(`${state.workspaceEntries.length} workspace packages`, state.workspaceEntries.length ? "success" : "neutral")}
        </div>
      </header>
      ${body}
    </main>
  `;
}

function render(): void {
  const bundle = state.bundle;
  if (!bundle) {
    app.innerHTML = renderStartHub();
    bindStartHubEvents();
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
        <div class="package-tools" aria-label="Package actions">
          <button class="button subtle" id="reset-active-package" data-agent-action="reset-workspace" type="button">New Project</button>
          <button class="button" id="replay-onboarding" data-agent-action="replay-onboarding" type="button">Replay Onboarding</button>
          <button class="button primary" id="load-sample" data-agent-action="explore-sample" type="button">Load Sample Package</button>
          <button class="button" id="import-folder" data-agent-action="import-package" type="button">Import Package Folder</button>
          <input id="folder-input" type="file" webkitdirectory multiple hidden />
        </div>
        <nav class="nav" aria-label="Workbench views">
          ${viewGroups.map((group) => `
            <section class="nav-section" aria-label="${esc(group)}">
              <div class="nav-section-title">${esc(group)}</div>
              ${views.filter((view) => view.group === group).map((view) => `
                <button class="nav-item ${state.view === view.id ? "active" : ""}" data-view="${view.id}" data-agent-view="${view.id}" aria-label="${esc(`${view.label}: ${view.description}`)}" type="button" ${state.view === view.id ? "aria-current=\"page\"" : ""}>
                  <span>
                    <span>${esc(view.label)}</span>
                    <span class="nav-description">${esc(view.description)}</span>
                  </span>
                  <span class="nav-count">${esc(humanLabel(view.count(bundle)))}</span>
                </button>
              `).join("")}
            </section>
          `).join("")}
        </nav>
        <div class="footer-note">${esc(state.packageName)} · ${esc(bundle.manifest.project_slug ?? "package")}</div>
      </aside>
      <main class="main" id="main-content" data-agent-current-view="${esc(state.view)}" data-agent-landmark="${esc(viewAgentLandmark(state.view))}" data-agent-package-exists="true" data-agent-provider-required="false" data-agent-generation-blocked="false" data-agent-onboarding-complete="${state.onboardingState.launch_review_completed ? "true" : "false"}" data-agent-onboarding-state="${esc(activeOnboardingState())}" tabindex="-1">
        <div class="topbar" role="region" aria-label="Current package status">
          <div>
            <div class="eyebrow">${esc(viewLabel)}</div>
            <h1>${esc(bundle.productModel.product_name ?? "Archetype Package")}</h1>
            <div class="meta-line">${esc([humanLabel(bundle.productModel.product_type ?? ""), humanLabel(bundle.manifest.operating_mode ?? "")].filter(Boolean).join(" · "))}</div>
          </div>
          <div class="status-strip" role="status" aria-live="polite" aria-label="Package status">
            ${badge(`Score ${bundle.readiness.score}`, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
            ${badge(bundle.readiness.readyForFrontendAgent ? "Ready" : "Blocked", bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
            ${badge(`DSAG ${humanLabel(bundle.dsag.integrity.status)}`, statusTone(bundle.dsag.integrity.status))}
            ${badge(`${bundle.readiness.warnings.length} warnings`, bundle.readiness.warnings.length ? "warning" : "success")}
          </div>
        </div>
        ${renderContent(bundle)}
      </main>
    </div>
  `;
  bindEvents();
}

function bindStartHubEvents(): void {
  const openCreate = () => {
    state.startMode = "intent";
    state.startMessage = "";
    render();
  };
  document.querySelector<HTMLButtonElement>("#start-create-package")?.addEventListener("click", openCreate);
  document.querySelector<HTMLButtonElement>("#start-create-package-card")?.addEventListener("click", openCreate);
  document.querySelector<HTMLButtonElement>("#back-start-hub")?.addEventListener("click", () => {
    state.startMode = "hub";
    state.startMessage = "";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = button.dataset.startStep as StartMode | undefined;
      if (!step || step === "hub") return;
      if (step === "progress" && !startGenerationStarted()) {
        state.startProviderMessage = "Start generation from Provider Setup before opening Generation Progress.";
        state.startMode = "provider";
        render();
        return;
      }
      state.startMode = step;
      state.startMessage = "";
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#continue-start-evidence")?.addEventListener("click", () => {
    persistStartDraft();
    state.startMode = "evidence";
    state.startMessage = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#back-start-intent")?.addEventListener("click", () => {
    state.startMode = "intent";
    state.startSourceMessage = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#continue-start-preflight")?.addEventListener("click", () => {
    persistStartDraft();
    state.startMode = "preflight";
    state.startSourceMessage = "";
    state.startMessage = "Local preflight completed without sending data to a provider.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#back-start-evidence")?.addEventListener("click", () => {
    state.startMode = "evidence";
    state.startMessage = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#start-generate-architecture")?.addEventListener("click", () => {
    const checks = startPreflightChecks();
    if (requiredContextBlockers(checks) > 0) {
      state.startMessage = "Resolve required context before provider setup.";
      render();
      return;
    }
    persistStartDraft();
    state.startMode = "provider";
    state.startProviderDiagnosticsRan = false;
    state.startProviderMessage = "Provider setup opened. Review evidence before entering a session key.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#back-start-preflight")?.addEventListener("click", () => {
    state.startMode = "preflight";
    state.startProviderMessage = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#back-start-provider")?.addEventListener("click", () => {
    state.startMode = "provider";
    state.startGenerationRun.message = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#toggle-start-examples")?.addEventListener("click", () => {
    state.startExamplesVisible = !state.startExamplesVisible;
    render();
  });
  document.querySelector<HTMLButtonElement>("#start-load-sample")?.addEventListener("click", () => loadSample());
  document.querySelector<HTMLButtonElement>("#start-load-sample-card")?.addEventListener("click", () => loadSample());
  document.querySelector<HTMLButtonElement>("#start-replay-onboarding")?.addEventListener("click", () => {
    replayOnboarding();
    render();
  });
  document.querySelector<HTMLButtonElement>("#start-replay-onboarding-actions")?.addEventListener("click", () => {
    replayOnboarding();
    render();
  });
  const importPackage = () => {
    document.querySelector<HTMLInputElement>("#start-folder-input")?.click();
  };
  document.querySelector<HTMLButtonElement>("#start-import-package")?.addEventListener("click", importPackage);
  document.querySelector<HTMLButtonElement>("#start-import-package-card")?.addEventListener("click", importPackage);
  document.querySelector<HTMLInputElement>("#start-folder-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    try {
      await activateBundleFromFiles(input.files);
      input.value = "";
      render();
    } catch (error) {
      state.startMessage = error instanceof Error ? error.message : "Could not import package.";
      input.value = "";
      render();
    }
  });
  document.querySelector<HTMLButtonElement>("#start-restore-state")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#start-state-import-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#start-state-import-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isWorkbenchStateExport(parsed)) {
        state.startMessage = "State file is not a valid Archetype workbench export.";
        input.value = "";
        render();
        return;
      }
      await restoreWorkbenchState(parsed);
      input.value = "";
      render();
    } catch (error) {
      state.startMessage = error instanceof Error ? error.message : "Could not restore state.";
      input.value = "";
      render();
    }
  });
  document.querySelector<HTMLButtonElement>("#start-reset-fresh")?.addEventListener("click", () => {
    clearStartDraftStorage();
    recordResetUsage("Start Hub reset to fresh state.");
    enterFreshState("Fresh state reset. Saved packages are still available.");
    render();
  });
  const startBindings: Array<[keyof IntakeFormState, string]> = [
    ["projectName", "#start-project-name"],
    ["operatingMode", "#start-mode"],
    ["primaryColor", "#start-primary-color"],
    ["brandAttributes", "#start-brand-attributes"],
    ["context", "#start-context"],
    ["goals", "#start-goals"],
    ["businessGoals", "#start-business-goals"],
    ["users", "#start-users"],
    ["constraints", "#start-constraints"],
    ["preferredStack", "#start-preferred-stack"],
    ["tone", "#start-tone"]
  ];
  startBindings.forEach(([field, selector]) => {
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.addEventListener("input", (event) => {
      state.startDraft[field] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value as never;
      persistStartDraft();
      scheduleStartDraftRefresh();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-mode-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.startModeOption;
      if (!mode) return;
      state.startDraft.operatingMode = mode;
      persistStartDraft();
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#save-start-draft")?.addEventListener("click", () => {
    const intake = intakeFromForm(state.startDraft, state.startSourceMaterials);
    state.generationDraft = pretty(intake);
    saveStartDraft(state.startDraft.context.trim()
      ? "Project draft saved locally. Provider setup is only needed when generation starts."
      : "Project draft saved locally. Add product context before generation.");
    render();
  });
  const downloadStartDraft = () => {
    const intake = intakeFromForm(state.startDraft, state.startSourceMaterials);
    downloadText(intakeFileName(intake), `${pretty(intake)}\n`, "application/json");
    state.startMessage = "Intake JSON prepared.";
    render();
  };
  document.querySelector<HTMLButtonElement>("#download-start-draft")?.addEventListener("click", downloadStartDraft);
  document.querySelector<HTMLButtonElement>("#download-start-draft-preflight")?.addEventListener("click", downloadStartDraft);
  document.querySelector<HTMLButtonElement>("#download-provider-payload")?.addEventListener("click", () => {
    const payload = providerPayloadPreview();
    downloadText(`${intakeFileName(payload).replace("-intake.json", "")}-provider-payload.json`, `${pretty(payload)}\n`, "application/json");
    state.startProviderMessage = "Provider payload preview prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#download-generation-progress-log")?.addEventListener("click", () => {
    const payload = providerPayloadPreview();
    downloadText(`${intakeFileName(payload).replace("-intake.json", "")}-generation-log.json`, `${pretty(startGenerationLog())}\n`, "application/json");
    state.startGenerationRun.message = "Generation log prepared.";
    render();
  });
  document.querySelector<HTMLSelectElement>("#start-provider")?.addEventListener("change", (event) => {
    const provider = (event.target as HTMLSelectElement).value;
    if (!isProviderId(provider)) return;
    state.startProvider = provider;
    if (!providerRequiresKey(provider)) state.startApiKey = "";
    state.startProviderDiagnosticsRan = false;
    persistStartDraft();
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-provider-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const provider = button.dataset.startProviderOption;
      if (!isProviderId(provider)) return;
      state.startProvider = provider;
      if (!providerRequiresKey(provider)) state.startApiKey = "";
      state.startProviderDiagnosticsRan = false;
      persistStartDraft();
      render();
    });
  });
  document.querySelector<HTMLInputElement>("#start-api-key")?.addEventListener("input", (event) => {
    state.startApiKey = (event.target as HTMLInputElement).value;
    state.startProviderDiagnosticsRan = false;
  });
  document.querySelector<HTMLButtonElement>("#start-use-local-mode")?.addEventListener("click", () => {
    state.startProvider = "local";
    state.startApiKey = "";
    state.startProviderDiagnosticsRan = false;
    state.startProviderMessage = "Local deterministic mode selected. No provider key is required.";
    recordSkipUsage("Provider-backed generation skipped for local deterministic mode.");
    persistStartDraft();
    render();
  });
  document.querySelector<HTMLButtonElement>("#start-run-provider-diagnostics")?.addEventListener("click", () => {
    const diagnostics = providerDiagnostics();
    const failures = diagnostics.filter((diagnostic) => diagnostic.status === "fail").length;
    const warnings = diagnostics.filter((diagnostic) => diagnostic.status === "warning").length;
    state.startProviderDiagnosticsRan = true;
    state.startProviderMessage = failures
      ? `Diagnostics found ${failures} blocker${failures === 1 ? "" : "s"}.`
      : warnings
        ? `Diagnostics passed with ${warnings} warning${warnings === 1 ? "" : "s"}.`
        : "Diagnostics passed. Provider setup is ready.";
    if (!failures) recordProviderSetupSuccess(`${providerDetail().label} diagnostics passed.`);
    render();
  });
  document.querySelector<HTMLInputElement>("#start-send-summaries-only")?.addEventListener("change", (event) => {
    state.startSendSummariesOnly = (event.target as HTMLInputElement).checked;
    state.startProviderDiagnosticsRan = false;
    persistStartDraft();
    render();
  });
  document.querySelector<HTMLInputElement>("#start-provider-consent")?.addEventListener("change", (event) => {
    state.startProviderConsent = (event.target as HTMLInputElement).checked;
    state.startProviderDiagnosticsRan = false;
    render();
  });
  document.querySelectorAll<HTMLInputElement>("[data-start-evidence-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.startEvidenceInclude;
      if (!id) return;
      state.startEvidenceReview[id] = {
        ...state.startEvidenceReview[id],
        included: input.checked,
        redaction: state.startEvidenceReview[id]?.redaction ?? ""
      };
      state.startProviderDiagnosticsRan = false;
      persistStartDraft();
      render();
    });
  });
  document.querySelectorAll<HTMLTextAreaElement>("[data-start-evidence-redaction]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const id = textarea.dataset.startEvidenceRedaction;
      if (!id) return;
      state.startEvidenceReview[id] = {
        ...state.startEvidenceReview[id],
        included: state.startEvidenceReview[id]?.included !== false,
        redaction: textarea.value
      };
      state.startProviderDiagnosticsRan = false;
      persistStartDraft();
    });
  });
  document.querySelector<HTMLButtonElement>("#final-start-generate-architecture")?.addEventListener("click", () => {
    const diagnostics = providerDiagnostics();
    if (!providerSetupReady(diagnostics)) {
      state.startProviderMessage = "Run diagnostics and resolve provider setup blockers before generation.";
      render();
      return;
    }
    beginStartGenerationRun();
    state.startMode = "progress";
    state.startProviderMessage = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#run-next-generation-phase")?.addEventListener("click", () => {
    runNextStartGenerationPhase();
    render();
  });
  document.querySelector<HTMLButtonElement>("#run-all-generation-phases")?.addEventListener("click", () => {
    runAllStartGenerationPhases();
    render();
  });
  document.querySelector<HTMLButtonElement>("#open-generated-launch-review")?.addEventListener("click", () => {
    void openGeneratedLaunchReview();
  });
  document.querySelector<HTMLButtonElement>("#retry-current-generation-phase")?.addEventListener("click", () => {
    retryStartGenerationPhase();
    render();
  });
  document.querySelector<HTMLButtonElement>("#save-generation-progress-draft")?.addEventListener("click", () => {
    saveStartDraft("Generation progress draft saved locally.");
    state.startGenerationRun.message = "Generation progress draft saved locally.";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-generation-retry]").forEach((button) => {
    button.addEventListener("click", () => {
      retryStartGenerationPhase();
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-generation-repair]").forEach((button) => {
    button.addEventListener("click", () => {
      const phaseId = button.dataset.startGenerationRepair;
      if (!phaseId) return;
      repairStartGenerationPhase(phaseId);
      render();
    });
  });
  const startSourceBindings: Array<[keyof SourceMaterialDraft, string]> = [
    ["label", "#start-source-label"],
    ["type", "#start-source-type"],
    ["path", "#start-source-path"],
    ["notes", "#start-source-notes"],
    ["content", "#start-source-content"]
  ];
  startSourceBindings.forEach(([field, selector]) => {
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.addEventListener("input", (event) => {
      state.startSourceDraft[field] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value as never;
    });
  });
  document.querySelector<HTMLButtonElement>("#add-start-source")?.addEventListener("click", () => {
    const material = {
      ...state.startSourceDraft,
      id: state.startSourceDraft.id || `start_source_${Date.now().toString(36)}`
    };
    if (!material.label.trim() && !material.content.trim() && !material.path.trim()) {
      state.startSourceMessage = "Evidence requires a label, path, or content excerpt.";
      render();
      return;
    }
    state.startSourceMaterials = [...state.startSourceMaterials, material];
    evidenceReviewFor(material);
    state.startSourceDraft = blankSourceDraft();
    saveStartDraft("Evidence record saved locally.");
    state.startSourceMessage = "Evidence record added to the intake draft.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#import-start-source-files")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#start-source-file-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#start-source-file-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const imported = await Promise.all([...input.files].map(async (file) => ({
      id: `start_source_${Date.now().toString(36)}_${file.name.replace(/[^a-z0-9]+/gi, "_")}`,
      label: file.name,
      type: sourceTypeForFile(file.name),
      content: file.size <= 120000 && /^text\/|json|javascript|typescript|svg|xml|markdown/i.test(file.type || file.name) ? await file.text() : "",
      notes: file.size > 120000
        ? `File omitted from inline content because it is ${formatBytes(file.size)}.`
        : sourceTypeForFile(file.name) === "screenshot"
          ? "Binary screenshot recorded as evidence metadata for later provider review."
          : sourceTypeForFile(file.name) === "other"
            ? "Unsupported file type recorded with metadata only."
            : "",
      path: file.name
    } satisfies SourceMaterialDraft)));
    state.startSourceMaterials = [...state.startSourceMaterials, ...imported];
    imported.forEach(evidenceReviewFor);
    saveStartDraft(`Imported ${imported.length} evidence file${imported.length === 1 ? "" : "s"} locally.`);
    state.startSourceMessage = `Imported ${imported.length} evidence file${imported.length === 1 ? "" : "s"}.`;
    input.value = "";
    render();
  });
  document.querySelector<HTMLButtonElement>("#clear-start-sources")?.addEventListener("click", () => {
    state.startSourceMaterials = [];
    state.startEvidenceReview = {};
    state.startSourceDraft = blankSourceDraft();
    saveStartDraft("Evidence records cleared from the local draft.");
    state.startSourceMessage = "Evidence records cleared.";
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-source-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.startSourceRemove;
      if (!id) return;
      state.startSourceMaterials = state.startSourceMaterials.filter((material) => material.id !== id);
      delete state.startEvidenceReview[id];
      saveStartDraft("Evidence record removed from the local draft.");
      state.startSourceMessage = "Evidence record removed.";
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-start-recent-load]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.startRecentLoad;
      if (!id) return;
      const record = await loadWorkspaceBundle(id);
      if (!record) {
        state.startMessage = "Saved package not found.";
        render();
        return;
      }
      await activateBundle(record.bundle, record.entry.name);
      render();
    });
  });
}

function bindEvents(): void {
  document.querySelector<HTMLButtonElement>("#reset-active-package")?.addEventListener("click", () => {
    recordResetUsage("Active package reset to Start Hub.");
    enterFreshState("Fresh state ready. Saved packages are still available.");
    render();
  });
  document.querySelector<HTMLButtonElement>("#replay-onboarding")?.addEventListener("click", () => {
    replayOnboarding();
    render();
  });
  document.querySelector<HTMLButtonElement>("#save-launch-package")?.addEventListener("click", async () => {
    if (!state.bundle) return;
    const entry = await saveWorkspaceBundle(state.bundle, state.packageName);
    await refreshWorkspaceEntries();
    recordWorkspaceActivity("save", `Saved ${entry.name} from Launch Review.`, entry.id);
    recordFirstSave("Package saved from Launch Review.");
    state.launchReviewMessage = `Saved ${entry.name} to workspace.`;
    render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-dismiss-onboarding-hint]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.dismissOnboardingHint;
      if (!id) return;
      dismissOnboardingHint(id);
      state.launchReviewMessage = "Launch Review hint dismissed.";
      render();
    });
  });
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
    recordFirstSave("Package saved from Workspace.");
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
      await activateBundle(record.bundle, record.entry.name);
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
    ["constraints", "#intake-constraints"],
    ["preferredStack", "#intake-preferred-stack"],
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
    state.sourceMaterials = Array.isArray(parsed.value.materials)
      ? parsed.value.materials.map(normalizeSourceMaterial)
      : state.sourceMaterials;
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
      constraints: [],
      preferredStack: [],
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
    state.sourceDraft = blankSourceDraft();
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
    state.sourceDraft = blankSourceDraft();
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
    recordFirstHandoffExport("Handoff markdown exported.");
    state.handoffMessage = "Handoff markdown prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#download-handoff-json")?.addEventListener("click", () => {
    if (!state.bundle) return;
    const slug = String(state.bundle.manifest.project_slug ?? "archetype-package");
    downloadText(`${slug}-handoff.json`, `${pretty(handoffJson(state.bundle))}\n`, "application/json");
    recordFirstHandoffExport("Handoff JSON exported.");
    state.handoffMessage = "Handoff JSON prepared.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#copy-handoff-prompt")?.addEventListener("click", async () => {
    if (!state.bundle) return;
    await copyTextToClipboard(handoffPrompt(state.bundle));
    recordFirstHandoffExport("Frontend agent prompt copied.");
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
      await activateBundleFromFiles(input.files);
      input.value = "";
      render();
    }
  });
}

async function loadSample(): Promise<void> {
  const response = await fetch("/sample-package.json");
  markOnboardingFlag("sample_explored");
  recordSkipUsage("Sample package path opened.");
  await activateBundle(await response.json() as Bundle, "sample-package", "overview", "sample");
  render();
}

async function openGeneratedLaunchReview(): Promise<void> {
  if (state.startGenerationRun.status !== "complete") {
    state.startGenerationRun.message = "Complete all generation phases before opening Launch Review.";
    render();
    return;
  }
  const response = await fetch("/sample-package.json");
  const generatedBundle = generatedBundleFromTemplate(await response.json() as Bundle);
  state.generationDraft = pretty(intakeFromForm(state.startDraft, state.startSourceMaterials));
  markOnboardingFlag("first_package_created");
  markOnboardingFlag("provider_connected");
  await activateBundle(generatedBundle, `${launchPackageName()} Launch Package`, "overview", "generated");
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

function legacyProductizationReadiness(): Record<string, any> {
  return {
    productization_version: "legacy",
    summary: {
      productization_foundation_ready: false,
      production_launch_ready: false,
      local_first_onboarding_preserved: true,
      session_keys_persisted: false,
      configured_contract_surfaces: 0,
      open_major_gates: 1
    },
    runtime_boundary: {
      account_mode: "unknown_legacy_package",
      workspace_persistence: "package_import_only",
      provider_execution: "unknown",
      telemetry_transport: "unknown",
      deployment_target: "unknown"
    },
    gates: [{
      gate_id: "legacy_productization_artifact_missing",
      area: "integration",
      status: "planned",
      severity: "major",
      current_state: "This imported package was generated before productization readiness artifacts existed.",
      launch_requirement: "Regenerate the package with the current compiler before production launch review.",
      owner: "platform",
      evidence_refs: ["15-productization/productization-readiness.json"]
    }],
    launch_blockers: ["Productization readiness artifact missing."],
    preserved_onboarding_contracts: ["Legacy package import remains non-blocking."],
    next_phase: "Regenerate this package to inspect productization readiness."
  };
}

function legacyProductizationReport(): string {
  return "# Productization Readiness\n\nThis package was generated before productization readiness artifacts existed. Regenerate it with the current compiler to inspect production launch gates.";
}

function legacyAccountWorkspaceContract(): Record<string, any> {
  return {
    contract_version: "legacy",
    product_name: "Legacy package",
    implementation_status: "contract_ready_backend_not_implemented",
    purpose: "This imported package was generated before the account and workspace backend contract existed.",
    onboarding_guarantees: ["Legacy package import remains non-blocking and does not require an account."],
    account_model: {
      states: ["unknown"],
      provider_key_policy: { storage: "unknown" }
    },
    workspace_model: {
      roles: ["unknown"],
      package_revision_policy: { immutability: "unknown" }
    },
    package_persistence_api: {
      endpoints: []
    },
    migration_rules: {
      trigger: "Regenerate package to inspect hosted migration rules.",
      sequence: []
    },
    permission_model: {
      package_permissions: []
    },
    data_export_contract: {
      endpoint: "unknown",
      included_records: []
    },
    data_deletion_contract: {
      endpoint: "unknown",
      sequence: []
    },
    ai_agent_contract: {
      discovery: ["Regenerate the package to inspect account-gated AI hooks."]
    },
    implementation_checklist: ["Regenerate the package with the current compiler."],
    readiness: {
      implementable_without_invention: false,
      backend_implemented: false,
      launch_ready: false,
      unresolved_launch_work: ["Account and workspace contract artifact missing."],
      evidence_refs: ["15-productization/account-workspace-contract.json"]
    }
  };
}

function legacyAccountWorkspaceReport(): string {
  return "# Account and Workspace Backend Contract\n\nThis package was generated before account and workspace backend artifacts existed. Regenerate it with the current compiler to inspect hosted workspace contracts.";
}

function legacyProviderExecutionContract(): Record<string, any> {
  return {
    contract_version: "legacy",
    product_name: "Legacy package",
    implementation_status: "contract_ready_service_not_implemented",
    purpose: "This imported package was generated before the provider execution bridge contract existed.",
    onboarding_guarantees: ["Legacy package import remains non-blocking and does not require provider setup."],
    request_contract: {
      endpoint: "unknown",
      required_scope: "workspace:provider.execute",
      execution_modes: []
    },
    response_schema: {
      status_values: [],
      artifact_commit_policy: {
        raw_output_policy: "unknown"
      }
    },
    credential_handling: {
      supported_modes: [],
      forbidden_storage: ["localStorage", "package artifacts"]
    },
    redaction_enforcement: {
      gates: []
    },
    rate_limit_cost_control: {
      budget_rules: []
    },
    audit_log_contract: {
      events: []
    },
    failure_contract: {
      codes: []
    },
    ai_agent_contract: {
      discovery: ["Regenerate the package to inspect provider execution hooks."]
    },
    implementation_checklist: ["Regenerate the package with the current compiler."],
    readiness: {
      implementable_without_invention: false,
      service_implemented: false,
      launch_ready: false,
      session_keys_persisted: false,
      unresolved_launch_work: ["Provider execution contract artifact missing."],
      evidence_refs: ["15-productization/provider-execution-contract.json"]
    }
  };
}

function legacyProviderExecutionReport(): string {
  return "# Provider Execution Bridge Contract\n\nThis package was generated before provider execution bridge artifacts existed. Regenerate it with the current compiler to inspect provider contracts.";
}

function legacyTelemetryAuditContract(): Record<string, any> {
  return {
    contract_version: "legacy",
    product_name: "Legacy package",
    implementation_status: "contract_ready_transport_not_implemented",
    purpose: "This imported package was generated before the telemetry and audit transport contract existed.",
    onboarding_guarantees: ["Legacy package import remains non-blocking and does not enable telemetry."],
    consent_privacy_contract: {
      default_state: "not_asked",
      collection_default: "disabled",
      purposes: []
    },
    event_schema: {
      schema_version: "legacy",
      event_catalog: []
    },
    transport_retry_policy: {
      endpoint: "unknown",
      retry_rules: []
    },
    audit_log_model: {
      storage_status: "unknown",
      event_types: []
    },
    retention_deletion_controls: {
      retention_classes: []
    },
    workspace_analytics_boundaries: {
      default_visibility: "unknown",
      allowed_metrics: [],
      forbidden_metrics: []
    },
    ai_agent_contract: {
      discovery: ["Regenerate the package to inspect telemetry and audit hooks."]
    },
    implementation_checklist: ["Regenerate the package with the current compiler."],
    readiness: {
      implementable_without_invention: false,
      transport_implemented: false,
      launch_ready: false,
      telemetry_default_enabled: false,
      unresolved_launch_work: ["Telemetry and audit contract artifact missing."],
      evidence_refs: ["15-productization/telemetry-audit-contract.json"]
    }
  };
}

function legacyTelemetryAuditReport(): string {
  return "# Telemetry and Audit Transport Contract\n\nThis package was generated before telemetry and audit artifacts existed. Regenerate it with the current compiler to inspect consent, event, audit, retention, and deletion contracts.";
}

function legacyDeploymentOperationsContract(): Record<string, any> {
  return {
    contract_version: "legacy",
    product_name: "Legacy package",
    implementation_status: "contract_ready_deployment_not_implemented",
    purpose: "This imported package was generated before the deployment operations contract existed.",
    onboarding_guarantees: ["Legacy package import remains non-blocking and does not imply production launch readiness."],
    environment_configuration: {
      environments: []
    },
    ci_cd_gates: {
      required_gates: []
    },
    hosted_workbench_runbook: {
      deploy_sequence: []
    },
    backup_rollback_policy: {
      objectives: {},
      policies: []
    },
    observability_signals: {
      signals: []
    },
    incident_response_checklist: {
      severity_levels: []
    },
    launch_gate_matrix: {
      launch_ready_calculation: "Regenerate the package to inspect launch gates.",
      gates: []
    },
    ai_agent_contract: {
      discovery: ["Regenerate the package to inspect deployment hooks."]
    },
    implementation_checklist: ["Regenerate the package with the current compiler."],
    readiness: {
      implementable_without_invention: false,
      deployment_implemented: false,
      launch_ready: false,
      unresolved_launch_work: ["Deployment operations contract artifact missing."],
      evidence_refs: ["15-productization/deployment-operations-contract.json"]
    }
  };
}

function legacyDeploymentOperationsReport(): string {
  return "# Deployment Operations and Launch Gates Contract\n\nThis package was generated before deployment operations artifacts existed. Regenerate it with the current compiler to inspect launch gates.";
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
  const getOptionalText = async (path: string, fallback: string) => {
    const file = byPath.get(path);
    return file ? readFile(file) : fallback;
  };
  const getOptionalJson = async (path: string, fallback: Record<string, any>) => {
    const file = byPath.get(path);
    return file ? JSON.parse(await readFile(file)) : fallback;
  };
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
    sourceFileManifest: await getJson("12-target-frontend/source-file-manifest.json"),
    routeComponentMap: await getJson("12-target-frontend/route-component-map.json"),
    codegenTasks: await getJson("12-target-frontend/codegen-tasks.json"),
    adapterInterfaceSource: await getText("12-target-frontend/adapter-interfaces.ts"),
    sourceGenerationRunbook: await getText("12-target-frontend/source-generation-runbook.md"),
    e2eScenarios: await getJson("13-e2e/e2e-scenarios.json"),
    e2eResults: await getJson("13-e2e/e2e-results.json"),
    e2eFindings: await getText("13-e2e/e2e-findings.md"),
    targetExecution: await getJson("14-target-execution/target-execution-report.json"),
    targetExecutionReport: await getText("14-target-execution/target-execution-report.md"),
    productizationReadiness: await getOptionalJson("15-productization/productization-readiness.json", legacyProductizationReadiness()),
    productizationReport: await getOptionalText("15-productization/productization-readiness.md", legacyProductizationReport()),
    accountWorkspaceContract: await getOptionalJson("15-productization/account-workspace-contract.json", legacyAccountWorkspaceContract()),
    accountWorkspaceReport: await getOptionalText("15-productization/account-workspace-contract.md", legacyAccountWorkspaceReport()),
    providerExecutionContract: await getOptionalJson("15-productization/provider-execution-contract.json", legacyProviderExecutionContract()),
    providerExecutionReport: await getOptionalText("15-productization/provider-execution-contract.md", legacyProviderExecutionReport()),
    telemetryAuditContract: await getOptionalJson("15-productization/telemetry-audit-contract.json", legacyTelemetryAuditContract()),
    telemetryAuditReport: await getOptionalText("15-productization/telemetry-audit-contract.md", legacyTelemetryAuditReport()),
    deploymentOperationsContract: await getOptionalJson("15-productization/deployment-operations-contract.json", legacyDeploymentOperationsContract()),
    deploymentOperationsReport: await getOptionalText("15-productization/deployment-operations-contract.md", legacyDeploymentOperationsReport()),
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

loadOnboardingState();
loadStartDraft();
loadWorkspaceActivity();
refreshWorkspaceEntries()
  .catch((error) => {
    state.startMessage = error instanceof Error ? error.message : "Workspace storage unavailable.";
  })
  .finally(() => {
    enterFreshState(state.startMessage);
    render();
  });
