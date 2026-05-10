import type { AgentContextPackage, AgentContextPhaseBundle, AgentContextPhaseId } from "../agent-context/phaseBundles";
import type { ConsumerPlaneReport } from "../consumer-plane";
import type { AgentControlPlaneReport } from "../control-plane";
import type { ArchetypeInput, EvidenceLedger, SourceRecord } from "../core/types";

export const SESSION_ARTIFACTS = [
  { id: "review-console-session", path: "review-console/session.json", type: "json" as const },
  { id: "review-console", path: "review-console/index.html", type: "html" as const },
  { id: "review-console-approval-decisions", path: "review-console/approval-decisions.json", type: "json" as const },
  { id: "review-console-design-diff", path: "review-console/design-diff.json", type: "json" as const },
  { id: "review-console-run-timeline", path: "review-console/run-timeline.json", type: "json" as const },
  { id: "progressive-generation-plan", path: "progressive/generation-plan.json", type: "json" as const },
  { id: "lazy-contract-index", path: "progressive/lazy-contract-index.json", type: "json" as const },
  { id: "phase-token-budget", path: "progressive/token-budget.json", type: "json" as const },
  { id: "phase-package-plan", path: "progressive/phase-package-plan.json", type: "json" as const },
  { id: "mcp-current-phase-resources", path: "mcp/current-phase-resources.json", type: "json" as const },
  { id: "mcp-current-phase-prompts", path: "mcp/current-phase-prompts.json", type: "json" as const },
  { id: "orchestration-team-handoffs", path: "orchestration/team-handoffs.json", type: "json" as const },
  { id: "orchestration-subagent-ownership", path: "orchestration/subagent-ownership.json", type: "json" as const },
  { id: "orchestration-host-permissions", path: "orchestration/host-permissions.json", type: "json" as const },
  { id: "source-material-ux", path: "attachments/source-materials.json", type: "json" as const },
  { id: "source-material-ux-report", path: "attachments/source-materials.md", type: "markdown" as const },
  { id: "blocked-explanation", path: "lifecycle/blockers-explained.json", type: "json" as const },
  { id: "blocked-explanation-report", path: "lifecycle/blockers-explained.md", type: "markdown" as const }
];

export type SessionPackageType = "clarification" | "draft_contract" | "canonical";

interface SessionRouteProposal {
  route: string;
  screen_id: string;
  status: "missing" | "candidate" | "approved";
  source: string;
}

interface SessionKnownFact {
  id: string;
  claim: string;
  confidence: string;
  evidence_level: string;
}

interface SessionTimelineItem {
  id: string;
  label: string;
  status: "complete" | "current" | "blocked" | "pending";
  evidence_refs: string[];
}

interface SessionReviewSurface {
  title: string;
  path: string;
  purpose: string;
}

interface SessionReviewConsole {
  artifact_version: "1.0";
  source_scope: "session-review-console";
  package_type: SessionPackageType;
  product_name: string;
  current_phase: {
    phase_id: AgentContextPhaseId;
    status: string;
    path: string;
  };
  next_legal_action: ConsumerPlaneReport["next_action"];
  review_mode: "clarification" | "draft_review" | "test_first_handoff" | "implementation" | "verification" | "repair";
  cockpit: {
    knows: SessionKnownFact[];
    missing: string[];
    one_question: { id: string | null; question: string | null };
    attached_materials: SourceRecord[];
    route_proposals: SessionRouteProposal[];
    review_surfaces: SessionReviewSurface[];
    allowed_user_actions: ConsumerPlaneReport["next_action"]["allowed_user_actions"];
    approval_checklist: Array<{ id: string; label: string; status: "required" | "satisfied" | "blocked"; evidence_refs: string[] }>;
    next_action_label: string;
    blocked_summary: string[];
  };
}

interface ProgressiveGenerationPlan {
  artifact_version: "1.0";
  source_scope: "progressive-generation";
  package_type: SessionPackageType;
  strategy: "summary_first_lazy_expand";
  generated_now: string[];
  defer_until_phase: Array<{ phase_id: AgentContextPhaseId; artifacts: string[]; reason: string }>;
  expansion_rules: string[];
  package_size_policy: {
    current_manifest_artifact_count: number;
    broad_generation_before_approval: "forbidden";
    canonical_heavy_artifacts_before_test_first: "defer_when_progressive_mode_is_enabled";
    app_code_handoff_reads: "phase_bundle_required_reads_only";
  };
}

interface LazyContractIndex {
  artifact_version: "1.0";
  source_scope: "lazy-contract-index";
  start_here: string;
  phases: Array<{
    phase_id: AgentContextPhaseId;
    status: string;
    bundle: string;
    required_now: string[];
    optional_later: string[];
  }>;
}

interface PhaseTokenBudget {
  artifact_version: "1.0";
  source_scope: "phase-token-budget";
  default_max_artifact_bytes: number;
  per_phase: Array<{
    phase_id: AgentContextPhaseId;
    max_full_artifact_reads: number;
    max_artifact_bytes: number;
    broad_read_policy: "forbidden";
  }>;
}

interface SessionArtifacts {
  reviewSession: SessionReviewConsole;
  reviewConsoleHtml: string;
  approvalDecisions: Record<string, unknown>;
  designDiff: Record<string, unknown>;
  timeline: { artifact_version: "1.0"; source_scope: "user-facing-run-timeline"; items: SessionTimelineItem[] };
  progressivePlan: ProgressiveGenerationPlan;
  lazyContractIndex: LazyContractIndex;
  tokenBudget: PhaseTokenBudget;
  phasePackagePlan: Record<string, unknown>;
  mcpResources: Record<string, unknown>;
  mcpPrompts: Record<string, unknown>;
  teamHandoffs: Record<string, unknown>;
  subagentOwnership: Record<string, unknown>;
  hostPermissions: Record<string, unknown>;
  sourceMaterialUx: Record<string, unknown>;
  sourceMaterialMarkdown: string;
  blockedExplanation: Record<string, unknown>;
  blockedExplanationMarkdown: string;
}

export interface BuildSessionArtifactsInput {
  packageType: SessionPackageType;
  productName: string;
  readinessScore: number;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
  blockers: string[];
  warnings: string[];
  agentContext: AgentContextPackage;
  consumerPlane: ConsumerPlaneReport;
  controlPlane?: AgentControlPlaneReport;
  evidence?: EvidenceLedger;
  sourceMaterials?: SourceRecord[];
  input?: ArchetypeInput;
  routeSource?: unknown;
  manifestArtifactCount: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function currentBundle(agentContext: AgentContextPackage, consumerPlane: ConsumerPlaneReport): AgentContextPhaseBundle {
  return agentContext.bundles.find((bundle) => bundle.phase_id === consumerPlane.current_phase.phase_id) ?? agentContext.bundles[0];
}

function reviewMode(packageType: SessionPackageType, phaseId: AgentContextPhaseId): SessionReviewConsole["review_mode"] {
  if (packageType === "clarification") return "clarification";
  if (packageType === "draft_contract") return "draft_review";
  if (phaseId === "test_first") return "test_first_handoff";
  if (phaseId === "verification" || phaseId === "qa") return "verification";
  if (phaseId === "repair") return "repair";
  return "implementation";
}

function knownFacts(evidence?: EvidenceLedger): SessionKnownFact[] {
  return (evidence?.known_facts ?? []).slice(0, 10).map((item, index) => ({
    id: item.id || `known-${index + 1}`,
    claim: item.claim ?? item.value ?? "Known fact",
    confidence: item.confidence,
    evidence_level: item.evidence_level
  }));
}

function routeProposals(input: BuildSessionArtifactsInput): SessionRouteProposal[] {
  const routes = asArray(asRecord(input.routeSource).routes);
  return routes.slice(0, 16).map((item, index) => {
    const record = asRecord(item);
    return {
      route: asString(record.route, asString(record.path, `/route-${index + 1}`)),
      screen_id: asString(record.screen_id, asString(record.screenId, `screen-${index + 1}`)),
      status: input.packageType === "canonical" ? "approved" : "candidate",
      source: input.packageType === "canonical" ? "approved route map" : "draft route proposal"
    };
  });
}

function reviewSurfaces(input: BuildSessionArtifactsInput): SessionReviewSurface[] {
  const base = input.consumerPlane.user_experience.review_surfaces.map((path) => ({
    title: path.split("/").at(-1) ?? path,
    path,
    purpose: "Current phase review surface."
  }));
  return [
    { title: "Review Console", path: "review-console/index.html", purpose: "Decision cockpit for the current Archetype session." },
    ...base
  ];
}

function approvalChecklist(input: BuildSessionArtifactsInput): SessionReviewConsole["cockpit"]["approval_checklist"] {
  if (input.packageType === "clarification") {
    return [
      {
        id: "answer-one-question",
        label: "Answer the one current clarification question.",
        status: "required",
        evidence_refs: ["lifecycle/clarification-turn.json"]
      },
      {
        id: "source-material-decision",
        label: "Provide source materials or explicitly proceed without them.",
        status: input.input?.materialIntake?.status === "provided" || input.input?.materialIntake?.status === "none" ? "satisfied" : "required",
        evidence_refs: ["attachments/source-materials.json"]
      }
    ];
  }
  if (input.packageType === "draft_contract") {
    return [
      {
        id: "review-preview",
        label: "Review the design-system preview, directions, and anti-generic quality gate.",
        status: "required",
        evidence_refs: ["draft/design-system-preview.html", "draft/design-directions.json", "draft/design-quality-gate.json", "review-console/design-diff.json"]
      },
      {
        id: "approve-or-edit-routes",
        label: "Approve or edit route proposals.",
        status: "required",
        evidence_refs: ["draft/experience-architecture.draft.json", "review-console/approval-decisions.json"]
      },
      {
        id: "approve-contract",
        label: "Approve the draft contract only after the selected design direction and component states are acceptable.",
        status: "blocked",
        evidence_refs: ["draft/contract-approval-request.json", "draft/design-quality-gate.json"]
      }
    ];
  }
  return [
    {
      id: "author-tests-first",
      label: "Author declared tests before product UI implementation.",
      status: "required",
      evidence_refs: ["test-first/test-first-contract.json", "test-results/initial-red-test-run.md"]
    },
    {
      id: "verify-playwright",
      label: "Verify implementation with Playwright evidence.",
      status: "required",
      evidence_refs: ["verification/playwright-verification-contract.json", "verification/playwright-evidence.json"]
    }
  ];
}

function timelineItems(input: BuildSessionArtifactsInput): SessionTimelineItem[] {
  const phase = input.consumerPlane.current_phase.phase_id;
  return input.agentContext.bundles.map((bundle) => ({
    id: bundle.phase_id,
    label: bundle.phase_name,
    status: bundle.phase_id === phase ? "current" : bundle.status === "complete" ? "complete" : bundle.status === "blocked" ? "blocked" : "pending",
    evidence_refs: [bundle.status === "available" ? input.consumerPlane.read_plan.current_phase_bundle : bundle.blocked_reason ? "agent-context/phase-bundles/index.json" : bundle.required_reads[0]?.path ?? "agent-context/phase-bundles/index.json"]
  }));
}

function blockedSummary(input: BuildSessionArtifactsInput): string[] {
  const gateBlockers = input.controlPlane?.gates
    .filter((gate) => gate.status === "blocked" || gate.status === "fail")
    .flatMap((gate) => gate.blockers.map((blocker) => `${gate.name}: ${blocker}`)) ?? [];
  return [...input.blockers, ...gateBlockers].slice(0, 12);
}

function buildReviewConsoleHtml(session: SessionReviewConsole, timeline: SessionTimelineItem[]): string {
  const knows = session.cockpit.knows.map((item) => `<li><strong>${escapeHtml(item.claim)}</strong><span>${escapeHtml(item.evidence_level)} / ${escapeHtml(item.confidence)}</span></li>`).join("");
  const missing = session.cockpit.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const materials = session.cockpit.attached_materials.map((item) => `<li><strong>${escapeHtml(item.source_label)}</strong><span>${escapeHtml(item.source_type)} / ${escapeHtml(item.evidence_level)}</span></li>`).join("");
  const routes = session.cockpit.route_proposals.map((item) => `<tr><td>${escapeHtml(item.route)}</td><td>${escapeHtml(item.screen_id)}</td><td>${escapeHtml(item.status)}</td></tr>`).join("");
  const checklist = session.cockpit.approval_checklist.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></li>`).join("");
  const actions = session.cockpit.allowed_user_actions.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.result)}${item.requires_feedback ? " Feedback required." : ""}</span></li>`).join("");
  const surfaces = session.cockpit.review_surfaces.map((item) => `<li><a href="../${escapeHtml(item.path)}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.purpose)}</span></li>`).join("");
  const timelineHtml = timeline.map((item) => `<li class="${escapeHtml(item.status)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></li>`).join("");
  const blocked = session.cockpit.blocked_summary.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const designPreview = session.cockpit.review_surfaces.find((item) => item.path.includes("design-system-preview"));
  const designPreviewLink = designPreview
    ? `<a href="../${escapeHtml(designPreview.path)}">${escapeHtml(designPreview.title)}</a>`
    : "<span>Design preview is unavailable until context is sufficient for a draft.</span>";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(session.product_name)} - Archetype Review Console</title>
  <style>
    :root { color-scheme: dark; --bg:#050608; --panel:#0d1017; --line:#252b36; --text:#f4f6fb; --muted:#98a2b3; --accent:#f8fafc; --good:#67e8a5; --warn:#fbbf24; --bad:#fb7185; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); letter-spacing:0; }
    main { width:min(1180px, calc(100vw - 32px)); margin:0 auto; padding:32px 0 48px; }
    header { display:grid; grid-template-columns:1fr auto; gap:20px; align-items:end; border-bottom:1px solid var(--line); padding-bottom:24px; }
    h1 { margin:0; font-size:28px; line-height:1.1; }
    h2 { margin:0 0 14px; font-size:15px; }
    p { color:var(--muted); margin:8px 0 0; max-width:72ch; }
    .pill { border:1px solid var(--line); border-radius:999px; padding:7px 10px; color:var(--muted); font-size:12px; }
    .grid { display:grid; grid-template-columns:1.2fr .8fr; gap:16px; margin-top:18px; }
    section { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:18px; min-width:0; }
    .wide { grid-column:1 / -1; }
    ul { list-style:none; padding:0; margin:0; display:grid; gap:10px; }
    li { border-top:1px solid rgba(255,255,255,.06); padding-top:10px; color:var(--muted); }
    li:first-child { border-top:0; padding-top:0; }
    li strong { display:block; color:var(--text); font-size:13px; margin-bottom:3px; }
    li span { font-size:12px; color:var(--muted); }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th, td { text-align:left; padding:10px; border-top:1px solid rgba(255,255,255,.06); }
    th { color:var(--muted); font-size:11px; text-transform:uppercase; }
    a { color:var(--accent); text-decoration:none; }
    .action { font-size:18px; line-height:1.35; color:var(--text); }
    .current strong { color:var(--accent); }
    .complete strong { color:var(--good); }
    .blocked strong { color:var(--bad); }
    .pending strong { color:var(--muted); }
    .question { border-left:3px solid var(--accent); padding-left:14px; }
    .diff-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
    .diff-box { border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:14px; background:#080b11; min-height:92px; }
    .diff-box strong { display:block; margin-bottom:8px; font-size:13px; }
    @media (max-width: 760px) { header, .grid { grid-template-columns:1fr; } main { width:min(100vw - 20px, 1180px); padding-top:18px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>${escapeHtml(session.product_name)}</h1>
        <p>Archetype Review Console. Decisions first, artifacts only when the current phase needs them.</p>
      </div>
      <div class="pill">${escapeHtml(session.current_phase.phase_id)} / ${escapeHtml(session.current_phase.status)}</div>
    </header>
    <div class="grid">
      <section class="wide">
        <h2>Next Legal Action</h2>
        <div class="action">${escapeHtml(session.cockpit.next_action_label)}</div>
      </section>
      <section>
        <h2>One Question</h2>
        <div class="question">${escapeHtml(session.cockpit.one_question.question ?? "No clarification question is active.")}</div>
      </section>
      <section>
        <h2>Blocked Because</h2>
        <ul>${blocked || "<li><strong>No active blocker.</strong><span>The current phase still controls what may happen next.</span></li>"}</ul>
      </section>
      <section>
        <h2>What Archetype Knows</h2>
        <ul>${knows || "<li><strong>No confirmed facts yet.</strong><span>Clarification must gather enough evidence.</span></li>"}</ul>
      </section>
      <section>
        <h2>What Is Missing</h2>
        <ul>${missing || "<li><strong>No missing required decision in this phase.</strong><span>Continue through the next legal action.</span></li>"}</ul>
      </section>
      <section>
        <h2>Attached Materials</h2>
        <ul>${materials || "<li><strong>No source material attached.</strong><span>The user may provide SPEC, PRD, screenshots, wireframes, design docs, API docs, repo files, or explicitly proceed without materials.</span></li>"}</ul>
      </section>
      <section>
        <h2>Approval Checklist</h2>
        <ul>${checklist}</ul>
      </section>
      <section>
        <h2>Decision Actions</h2>
        <ul>${actions || "<li><strong>No decision action is currently available.</strong><span>The next legal action is blocked by the current phase.</span></li>"}</ul>
      </section>
      <section class="wide">
        <h2>Design Review Diff</h2>
        <div class="diff-grid">
          <div class="diff-box">
            <strong>Visual Preview</strong>
            ${designPreviewLink}
            <p>Review the current design-system surface before approving routes, tokens, components, and states.</p>
          </div>
          <div class="diff-box">
            <strong>Decision Diff</strong>
            <a href="../review-console/design-diff.json">Open design-diff.json</a>
            <p>Use this diff to request concrete changes. Regenerate the draft before canonical approval.</p>
          </div>
        </div>
      </section>
      <section class="wide">
        <h2>Route Proposals</h2>
        <table><thead><tr><th>Route</th><th>Screen</th><th>Status</th></tr></thead><tbody>${routes || "<tr><td colspan=\"3\">No routes proposed in this phase.</td></tr>"}</tbody></table>
      </section>
      <section>
        <h2>Review Surfaces</h2>
        <ul>${surfaces}</ul>
      </section>
      <section>
        <h2>Run Timeline</h2>
        <ul>${timelineHtml}</ul>
      </section>
    </div>
  </main>
</body>
</html>`;
}

function buildProgressivePlan(input: BuildSessionArtifactsInput, bundle: AgentContextPhaseBundle): ProgressiveGenerationPlan {
  return {
    artifact_version: "1.0",
    source_scope: "progressive-generation",
    package_type: input.packageType,
    strategy: "summary_first_lazy_expand",
    generated_now: [
      "agent-context/consumer-plane.json",
      "review-console/session.json",
      input.consumerPlane.read_plan.current_phase_bundle,
      ...bundle.required_reads.map((read) => read.path)
    ],
    defer_until_phase: input.agentContext.bundles.map((phase) => ({
      phase_id: phase.phase_id,
      artifacts: phase.optional_reads.map((read) => read.path),
      reason: phase.status === "blocked" ? "Phase is not legally available yet." : "Read only if the phase bundle makes the artifact necessary."
    })),
    expansion_rules: [
      "Generate or read draft review surfaces before canonical spec surfaces.",
      "Generate test-first and implementation reads only after bound human approval.",
      "Defer QA, repair, target execution, and broad schema artifacts until verification or repair needs them.",
      "Use phase-package output for agent handoff when the host only needs the current phase."
    ],
    package_size_policy: {
      current_manifest_artifact_count: input.manifestArtifactCount,
      broad_generation_before_approval: "forbidden",
      canonical_heavy_artifacts_before_test_first: "defer_when_progressive_mode_is_enabled",
      app_code_handoff_reads: "phase_bundle_required_reads_only"
    }
  };
}

function buildLazyIndex(input: BuildSessionArtifactsInput): LazyContractIndex {
  return {
    artifact_version: "1.0",
    source_scope: "lazy-contract-index",
    start_here: "agent-context/consumer-plane.json",
    phases: input.agentContext.bundles.map((bundle) => ({
      phase_id: bundle.phase_id,
      status: bundle.status,
      bundle: input.consumerPlane.current_phase.phase_id === bundle.phase_id ? input.consumerPlane.read_plan.current_phase_bundle : `agent-context/phase-bundles/${bundle.phase_id.replaceAll("_", "-")}.json`,
      required_now: bundle.required_reads.map((read) => read.path),
      optional_later: bundle.optional_reads.map((read) => read.path)
    }))
  };
}

function buildTokenBudget(input: BuildSessionArtifactsInput): PhaseTokenBudget {
  return {
    artifact_version: "1.0",
    source_scope: "phase-token-budget",
    default_max_artifact_bytes: input.consumerPlane.token_budget.default_max_artifact_bytes,
    per_phase: input.agentContext.bundles.map((bundle) => ({
      phase_id: bundle.phase_id,
      max_full_artifact_reads: bundle.phase_id === input.consumerPlane.current_phase.phase_id ? input.consumerPlane.token_budget.max_required_phase_reads : 3,
      max_artifact_bytes: input.consumerPlane.token_budget.default_max_artifact_bytes,
      broad_read_policy: "forbidden"
    }))
  };
}

function buildMcpResources(input: BuildSessionArtifactsInput, bundle: AgentContextPhaseBundle): Record<string, unknown> {
  const resources = [
    { path: "agent-context/consumer-plane.json", mimeType: "application/json" },
    { path: "review-console/session.json", mimeType: "application/json" },
    { path: input.consumerPlane.read_plan.current_phase_bundle, mimeType: "application/json" },
    ...bundle.required_reads.map((read) => ({ artifact_id: read.artifact_id, path: read.path, mimeType: read.path.endsWith(".json") ? "application/json" : "text/plain" }))
  ];
  return {
    artifact_version: "1.0",
    source_scope: "mcp-current-phase-resources",
    rule: "Expose package resource templates and relative paths before asking the agent to inspect broad artifacts.",
    resource_template: "archetype://package/{encodedOutputDir}/{relativePath}",
    resources: resources.map((resource) => ({
      ...resource,
      uri_template: `archetype://package/{encodedOutputDir}/${resource.path}`
    }))
  };
}

function buildMcpPrompts(input: BuildSessionArtifactsInput): Record<string, unknown> {
  return {
    artifact_version: "1.0",
    source_scope: "mcp-current-phase-prompts",
    prompts: [
      {
        name: "archetype_current_phase",
        description: "Explain the current Archetype phase, next legal action, and bounded reads.",
        arguments: [{ name: "outputDir", required: true }],
        message: input.consumerPlane.user_experience.say_this_now
      },
      {
        name: "archetype_review_draft",
        description: "Present draft preview, route proposals, assumptions, blockers, and approval checklist.",
        arguments: [{ name: "outputDir", required: true }],
        message: "Use review-console/session.json and draft/design-system-preview.html. Ask for approval or concrete edits."
      },
      {
        name: "archetype_tests_first_handoff",
        description: "Start canonical implementation by writing tests first from phase-bounded artifacts.",
        arguments: [{ name: "outputDir", required: true }],
        message: "Read the consumer plane, test-first bundle, test quality standard, and initial red test run before writing product UI."
      }
    ]
  };
}

function buildOrchestration(input: BuildSessionArtifactsInput): Pick<SessionArtifacts, "teamHandoffs" | "subagentOwnership" | "hostPermissions"> {
  const phase = input.consumerPlane.current_phase.phase_id;
  const ownership = [
    { role: "product-architect", owns: ["context sufficiency", "product decisions"], writes: ["lifecycle/context-matrix.json"], cannot_approve: true },
    { role: "experience-architect", owns: ["routes", "flows", "screen states"], writes: ["experience/route-map.json", "screens/screen-inventory.json"], cannot_approve: true },
    { role: "design-system-architect", owns: ["tokens", "component contracts", "design preview"], writes: ["design-system/tokens.json", "draft/design-system-preview.html"], cannot_approve: true },
    { role: "test-first-developer", owns: ["red tests", "test quality"], writes: ["test-first/test-first-contract.json", "test-results/initial-red-test-run.md"], cannot_approve: true },
    { role: "playwright-e2e-engineer", owns: ["browser verification"], writes: ["verification/playwright-evidence.json"], cannot_approve: true },
    { role: "repair-planner", owns: ["repair queue"], writes: ["10-revision/repair-task-queue.json"], cannot_approve: true }
  ];
  const queue = ownership
    .filter((item) => phase === "clarification" ? item.role === "product-architect" : phase === "draft_review" || phase === "contract_approval" ? ["experience-architect", "design-system-architect"].includes(item.role) : true)
    .map((item, index) => ({
      order: index + 1,
      role: item.role,
      required_input: input.consumerPlane.read_plan.first_reads,
      handoff_rule: "Write evidence-backed output and hand off to the next owner. No role may approve its own work."
    }));
  return {
    teamHandoffs: {
      artifact_version: "1.0",
      source_scope: "orchestrated-team-handoffs",
      current_phase: phase,
      queue
    },
    subagentOwnership: {
      artifact_version: "1.0",
      source_scope: "subagent-ownership",
      ownership,
      enforcement_rule: "A host agent must assign ownership before broad implementation or QA work. No role can approve its own output."
    },
    hostPermissions: {
      artifact_version: "1.0",
      source_scope: "host-permissions",
      enforcement_rule: "Hosts must call the consumer plane and control plane before tool use. Bad actions are blocked by deterministic package gates and command failures.",
      permissions: [
        { action: "ask_user", status: input.consumerPlane.next_action.requires_user_response ? "allowed" : "discouraged", required_artifact: "agent-context/consumer-plane.json" },
        { action: "read_full_artifact_tree", status: "blocked", required_artifact: "progressive/lazy-contract-index.json" },
        { action: "write_product_ui", status: input.implementationAuthorized ? "allowed_after_tests_first" : "blocked", required_artifact: "governance/agent-control-plane.json" },
        { action: "approve_contract", status: "human_only", required_artifact: "draft/contract-approval-request.json" },
        { action: "revise_contract", status: "blocked_without_user_approved_evidence", required_artifact: "10-revision/repair-task-queue.json" }
      ]
    }
  };
}

function buildSourceMaterialUx(input: BuildSessionArtifactsInput): { artifact: Record<string, unknown>; markdown: string } {
  const materials = input.sourceMaterials ?? input.evidence?.sources ?? [];
  const requested = input.input?.materialIntake?.requestedTypes ?? ["SPEC.md", "PRD.md", "screenshots", "wireframes", "design docs", "API docs", "route maps", "existing repo files", "test policy"];
  const status = input.input?.materialIntake?.status ?? (materials.length > 0 ? "provided" : "pending");
  const artifact = {
    artifact_version: "1.0",
    source_scope: "source-material-ux",
    status,
    user_prompt: status === "pending"
      ? "Do you want to attach SPEC, PRD, screenshots, wireframes, design docs, API docs, route maps, repo files, or should Archetype proceed without source materials?"
      : "Source-material decision has been recorded.",
    requested_types: requested,
    materials: materials.map((item) => ({
      source_id: item.source_id,
      label: item.source_label,
      type: item.source_type,
      evidence_level: item.evidence_level,
      confidence: item.confidence
    }))
  };
  const markdown = [
    "# Source Material UX",
    "",
    `Status: ${status}`,
    "",
    "## Requested Material Types",
    "",
    ...requested.map((item) => `- ${item}`),
    "",
    "## Attached Materials",
    "",
    ...(materials.length > 0 ? materials.map((item) => `- ${item.source_label} (${item.source_type}, ${item.evidence_level})`) : ["- None attached yet."])
  ].join("\n");
  return { artifact, markdown };
}

function buildBlockedExplanation(input: BuildSessionArtifactsInput): { artifact: Record<string, unknown>; markdown: string } {
  const blockers = blockedSummary(input);
  const artifact = {
    artifact_version: "1.0",
    source_scope: "blocked-explanation",
    status: blockers.length > 0 ? "blocked_or_warning" : "clear",
    current_phase: input.consumerPlane.current_phase.phase_id,
    say_this: input.consumerPlane.user_experience.say_this_now,
    blockers,
    next_legal_action: input.consumerPlane.next_action.type,
    required_user_response: input.consumerPlane.next_action.requires_user_response,
    review_surfaces: input.consumerPlane.user_experience.review_surfaces
  };
  const markdown = [
    "# Why Archetype Is Blocked",
    "",
    input.consumerPlane.user_experience.say_this_now,
    "",
    "## Blockers",
    "",
    ...(blockers.length > 0 ? blockers.map((item) => `- ${item}`) : ["- No active blocker. Continue with the next legal action."]),
    "",
    "## Next Legal Action",
    "",
    `- ${input.consumerPlane.next_action.type}`
  ].join("\n");
  return { artifact, markdown };
}

export function buildSessionArtifacts(input: BuildSessionArtifactsInput): SessionArtifacts {
  const bundle = currentBundle(input.agentContext, input.consumerPlane);
  const materials = input.sourceMaterials ?? input.evidence?.sources ?? [];
  const timeline = timelineItems(input);
  const reviewSession: SessionReviewConsole = {
    artifact_version: "1.0",
    source_scope: "session-review-console",
    package_type: input.packageType,
    product_name: input.productName,
    current_phase: input.consumerPlane.current_phase,
    next_legal_action: input.consumerPlane.next_action,
    review_mode: reviewMode(input.packageType, input.consumerPlane.current_phase.phase_id),
    cockpit: {
      knows: knownFacts(input.evidence),
      missing: input.evidence?.missing_information?.slice(0, 12) ?? [],
      one_question: {
        id: input.consumerPlane.next_action.question_id,
        question: input.consumerPlane.next_action.question
      },
      attached_materials: materials,
      route_proposals: routeProposals(input),
      review_surfaces: reviewSurfaces(input),
      allowed_user_actions: input.consumerPlane.next_action.allowed_user_actions,
      approval_checklist: approvalChecklist(input),
      next_action_label: input.consumerPlane.user_experience.say_this_now,
      blocked_summary: blockedSummary(input)
    }
  };
  const sourceMaterialUx = buildSourceMaterialUx(input);
  const blocked = buildBlockedExplanation(input);
  const orchestration = buildOrchestration(input);
  const progressivePlan = buildProgressivePlan(input, bundle);
  const lazyContractIndex = buildLazyIndex(input);
  const tokenBudget = buildTokenBudget(input);
  return {
    reviewSession,
    reviewConsoleHtml: buildReviewConsoleHtml(reviewSession, timeline),
    approvalDecisions: {
      artifact_version: "1.0",
      source_scope: "approval-decision-ui",
      rule: "Human approval must be explicit per decision and bound to draft/source hashes.",
      decisions: reviewSession.cockpit.approval_checklist,
      allowed_user_actions: reviewSession.cockpit.allowed_user_actions,
      host_review_primitive: "archetype_submit_review",
      decision_contract: {
        approve: "Writes bound approval proof and canonical package.",
        request_changes: "Records feedback as source evidence and regenerates a draft package.",
        reject: "Records rejection and keeps implementation blocked."
      }
    },
    designDiff: {
      artifact_version: "1.0",
      source_scope: "design-review-diff",
      before: input.packageType === "clarification" ? "no draft design yet" : "previous approved or empty baseline",
      after: input.packageType === "clarification" ? "blocked until context is sufficient" : "draft/design-system-preview.html",
      changed_surfaces: input.consumerPlane.user_experience.review_surfaces,
      review_rule: "Ask for specific design changes; regenerate draft design-system JSON, design directions, and design-quality gate before canonical approval.",
      anti_generic_gate: input.packageType === "clarification" ? "pending" : "draft/design-quality-gate.json",
      direction_selection: input.packageType === "clarification" ? "pending" : "draft/design-directions.json"
    },
    timeline: {
      artifact_version: "1.0",
      source_scope: "user-facing-run-timeline",
      items: timeline
    },
    progressivePlan,
    lazyContractIndex,
    tokenBudget,
    phasePackagePlan: {
      artifact_version: "1.0",
      source_scope: "phase-package-plan",
      host_tool: "archetype_phase_package",
      current_phase: input.consumerPlane.current_phase.phase_id,
      included_by_default: progressivePlan.generated_now,
      excluded_until_needed: progressivePlan.defer_until_phase
    },
    mcpResources: buildMcpResources(input, bundle),
    mcpPrompts: buildMcpPrompts(input),
    teamHandoffs: orchestration.teamHandoffs,
    subagentOwnership: orchestration.subagentOwnership,
    hostPermissions: orchestration.hostPermissions,
    sourceMaterialUx: sourceMaterialUx.artifact,
    sourceMaterialMarkdown: sourceMaterialUx.markdown,
    blockedExplanation: blocked.artifact,
    blockedExplanationMarkdown: blocked.markdown
  };
}
