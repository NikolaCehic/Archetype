import type { ArchetypeInput, ArchetypePackage } from "../core/types";
import type { ContextGateAssessment } from "../modules/contextGate";

export type AgentContextPackageType = "clarification" | "draft_contract" | "canonical";
export type AgentContextPhaseId =
  | "clarification"
  | "draft_review"
  | "contract_approval"
  | "test_first"
  | "implementation"
  | "verification"
  | "qa"
  | "repair";
export type AgentContextPhaseStatus = "available" | "complete" | "blocked";

export interface AgentContextArtifactSeed {
  id: string;
  path: string;
  type: "json" | "markdown";
}

export interface AgentContextRead {
  artifact_id: string;
  path: string;
  reason: string;
}

export interface AgentContextMcpCall {
  tool: string;
  args: Record<string, string | number | boolean>;
}

export interface AgentContextPhaseBundle {
  schema_version: "1.0";
  phase_id: AgentContextPhaseId;
  phase_name: string;
  package_type: AgentContextPackageType;
  status: AgentContextPhaseStatus;
  purpose: string;
  entry_gate: string;
  exit_gate: string;
  required_reads: AgentContextRead[];
  optional_reads: AgentContextRead[];
  mcp_query_plan: AgentContextMcpCall[];
  full_artifact_policy: string;
  blocked_reason: string | null;
}

export interface AgentContextSummary {
  schema_version: "1.0";
  package_type: AgentContextPackageType;
  product_name: string;
  product_type: string;
  product_category: string;
  readiness_score: number;
  readiness_tier: string;
  ready_for_frontend_agent: boolean;
  implementation_authorized: boolean;
  contract_approval_status: string;
  route_count: number;
  screen_count: number;
  blockers: string[];
  warnings: string[];
  start_here: string;
  phase_bundle_index: string;
  compact_read_policy: {
    default_tool: "archetype_summarize_package";
    read_full_artifact_only_when: string[];
    max_default_artifact_bytes: number;
  };
  phase_bundles: Array<{
    phase_id: AgentContextPhaseId;
    status: AgentContextPhaseStatus;
    path: string;
  }>;
}

export interface AgentContextPackage {
  summary: AgentContextSummary;
  summaryMarkdown: string;
  phaseIndex: {
    schema_version: "1.0";
    start_here: string;
    package_type: AgentContextPackageType;
    phases: AgentContextSummary["phase_bundles"];
  };
  bundles: AgentContextPhaseBundle[];
}

export const AGENT_CONTEXT_DEFAULT_MAX_ARTIFACT_BYTES = 12000;

export const AGENT_CONTEXT_ARTIFACTS: AgentContextArtifactSeed[] = [
  { id: "agent-context-summary", path: "agent-context/context-summary.json", type: "json" },
  { id: "agent-context-summary-report", path: "agent-context/context-summary.md", type: "markdown" },
  { id: "agent-context-phase-index", path: "agent-context/phase-bundles/index.json", type: "json" },
  { id: "agent-context-phase-clarification", path: "agent-context/phase-bundles/clarification.json", type: "json" },
  { id: "agent-context-phase-draft-review", path: "agent-context/phase-bundles/draft-review.json", type: "json" },
  { id: "agent-context-phase-contract-approval", path: "agent-context/phase-bundles/contract-approval.json", type: "json" },
  { id: "agent-context-phase-test-first", path: "agent-context/phase-bundles/test-first.json", type: "json" },
  { id: "agent-context-phase-implementation", path: "agent-context/phase-bundles/implementation.json", type: "json" },
  { id: "agent-context-phase-verification", path: "agent-context/phase-bundles/verification.json", type: "json" },
  { id: "agent-context-phase-qa", path: "agent-context/phase-bundles/qa.json", type: "json" },
  { id: "agent-context-phase-repair", path: "agent-context/phase-bundles/repair.json", type: "json" }
];

const PHASE_PATHS: Record<AgentContextPhaseId, string> = {
  clarification: "agent-context/phase-bundles/clarification.json",
  draft_review: "agent-context/phase-bundles/draft-review.json",
  contract_approval: "agent-context/phase-bundles/contract-approval.json",
  test_first: "agent-context/phase-bundles/test-first.json",
  implementation: "agent-context/phase-bundles/implementation.json",
  verification: "agent-context/phase-bundles/verification.json",
  qa: "agent-context/phase-bundles/qa.json",
  repair: "agent-context/phase-bundles/repair.json"
};

export function agentContextBundlePath(phaseId: AgentContextPhaseId): string {
  return PHASE_PATHS[phaseId];
}

function read(artifactId: string, path: string, reason: string): AgentContextRead {
  return { artifact_id: artifactId, path, reason };
}

function mcpRead(artifactId: string): AgentContextMcpCall {
  return {
    tool: "archetype_read_artifact",
    args: {
      artifactId,
      maxBytes: AGENT_CONTEXT_DEFAULT_MAX_ARTIFACT_BYTES
    }
  };
}

function phaseStatus(packageType: AgentContextPackageType, phaseId: AgentContextPhaseId): AgentContextPhaseStatus {
  if (phaseId === "clarification") return packageType === "clarification" ? "available" : "complete";
  if (phaseId === "draft_review" || phaseId === "contract_approval") {
    if (packageType === "clarification") return "blocked";
    return packageType === "draft_contract" ? "available" : "complete";
  }
  return packageType === "canonical" ? "available" : "blocked";
}

function blockedReason(packageType: AgentContextPackageType, phaseId: AgentContextPhaseId): string | null {
  if (phaseStatus(packageType, phaseId) !== "blocked") return null;
  if (packageType === "clarification") return "Context is not sufficient for draft or implementation phases.";
  return "Canonical implementation artifacts are blocked until the draft contract is approved by a bound human approval proof.";
}

function phaseReads(phaseId: AgentContextPhaseId): { required: AgentContextRead[]; optional: AgentContextRead[] } {
  if (phaseId === "clarification") {
    return {
      required: [
        read("context-completion", "lifecycle/context-completion.json", "Current context gate status."),
        read("context-matrix", "lifecycle/context-matrix.json", "Missing, conflicted, blocked, and candidate decisions."),
        read("clarification-turn", "lifecycle/clarification-turn.json", "The single next clarification question."),
        read("missing-context", "01-evidence/missing-context.md", "Human-readable blocker summary.")
      ],
      optional: [
        read("evidence-ledger", "01-evidence/evidence-ledger.json", "Source evidence and missing inputs.")
      ]
    };
  }
  if (phaseId === "draft_review") {
    return {
      required: [
        read("product-model-draft", "draft/product-model.draft.json", "Candidate product scope."),
        read("experience-architecture-draft", "draft/experience-architecture.draft.json", "Candidate routes, screens, and states."),
        read("design-system-draft", "draft/design-system.draft.json", "Candidate design-system contract."),
        read("frontend-contract-draft", "draft/frontend-contract.draft.json", "Candidate frontend contract."),
        read("design-system-preview", "draft/design-system-preview.html", "Browser-reviewable design-system preview.")
      ],
      optional: [
        read("design-system-review", "draft/design-system-review.md", "Review notes for design-system changes."),
        read("assumption-ledger", "draft/assumption-ledger.md", "Candidate assumptions requiring approval.")
      ]
    };
  }
  if (phaseId === "contract_approval") {
    return {
      required: [
        read("contract-approval-request", "draft/contract-approval-request.json", "Bound approval request."),
        read("lifecycle-contract-state", "lifecycle/contract-state.json", "Draft/canonical gate state."),
        read("assumption-ledger", "draft/assumption-ledger.md", "Assumptions that must remain candidate until approval.")
      ],
      optional: [
        read("design-system-review", "draft/design-system-review.md", "Human review notes before approval.")
      ]
    };
  }
  if (phaseId === "test_first") {
    return {
      required: [
        read("canonical-spec-json", "spec/archetype-spec.json", "Canonical source for behavior."),
        read("test-first-contract", "test-first/test-first-contract.json", "Suites and tests to author first."),
        read("test-quality-standard", "test-first/test-quality-standard.json", "Forbidden marker-only and weak test patterns."),
        read("initial-red-test-run", "test-results/initial-red-test-run.md", "Required red-first evidence.")
      ],
      optional: [
        read("test-first-plan", "test-first/test-first-plan.md", "Human-readable test plan.")
      ]
    };
  }
  if (phaseId === "implementation") {
    return {
      required: [
        read("implementation-contract", "implementation-contract.md", "Implementation instructions and constraints."),
        read("route-map", "experience/route-map.json", "Approved routes."),
        read("screen-inventory", "screens/screen-inventory.json", "Approved screens and states."),
        read("design-tokens", "design-system/tokens.json", "Approved token usage."),
        read("component-contracts", "design-system/component-contracts.json", "Approved component APIs."),
        read("implementation-rules", "frontend-agent-contract/implementation-rules.json", "Agent implementation guardrails."),
        read("acceptance-criteria", "frontend-agent-contract/acceptance-criteria.json", "Behavior acceptance criteria.")
      ],
      optional: [
        read("frontend-agent-instructions", "frontend-agent-contract/frontend-agent-instructions.md", "Long-form implementation handoff.")
      ]
    };
  }
  if (phaseId === "verification") {
    return {
      required: [
        read("playwright-verification-contract", "verification/playwright-verification-contract.json", "Browser verification contract."),
        read("playwright-evidence", "verification/playwright-evidence.json", "Current Playwright evidence."),
        read("lifecycle-execution-state", "lifecycle/execution-state.json", "Execution gate state.")
      ],
      optional: [
        read("playwright-evidence-report", "verification/playwright-evidence.md", "Human-readable browser evidence.")
      ]
    };
  }
  if (phaseId === "qa") {
    return {
      required: [
        read("qa-scenario-catalog", "qa/scenario-catalog.json", "QA scenario inventory."),
        read("qa-playwright-results", "qa/playwright-results.json", "Playwright QA result state."),
        read("qa-malformed-data-results", "qa/malformed-data-results.json", "Malformed data result state."),
        read("qa-contract-drift-report", "qa/contract-drift-report.md", "Contract drift findings.")
      ],
      optional: [
        read("qa-accessibility-results", "qa/accessibility-results.md", "Accessibility QA report."),
        read("qa-visual-regression-report", "qa/visual-regression-report.md", "Visual QA report.")
      ]
    };
  }
  return {
    required: [
      read("repair-task-queue", "10-revision/repair-task-queue.json", "Open repair tasks."),
      read("repair-plan", "10-revision/repair-plan.md", "Repair execution plan."),
      read("drift-report", "10-revision/drift-report.json", "Structured drift evidence.")
    ],
    optional: [
      read("verification-repair-contract", "10-revision/verification-repair-contract.json", "Repair contract.")
    ]
  };
}

function phaseMetadata(phaseId: AgentContextPhaseId): Pick<AgentContextPhaseBundle, "phase_name" | "purpose" | "entry_gate" | "exit_gate"> {
  const values: Record<AgentContextPhaseId, Pick<AgentContextPhaseBundle, "phase_name" | "purpose" | "entry_gate" | "exit_gate">> = {
    clarification: {
      phase_name: "Clarification",
      purpose: "Complete weak or conflicted context one question at a time.",
      entry_gate: "User supplied a product idea or materials, but required context is incomplete.",
      exit_gate: "Context matrix has no missing, conflicted, or blocked required decisions."
    },
    draft_review: {
      phase_name: "Draft Review",
      purpose: "Review candidate product, UX, design-system, and frontend contracts before canonicalization.",
      entry_gate: "Context is sufficient for draft generation.",
      exit_gate: "Human reviewer approves or requests specific draft changes."
    },
    contract_approval: {
      phase_name: "Contract Approval",
      purpose: "Bind human approval to immutable draft and source hashes.",
      entry_gate: "Draft artifacts are complete and ready for review.",
      exit_gate: "Approved intake contains a valid bound approval proof."
    },
    test_first: {
      phase_name: "Test First",
      purpose: "Create failing tests before product UI implementation.",
      entry_gate: "Canonical spec and test-first contracts exist.",
      exit_gate: "Initial red test evidence is preserved and implementation can begin."
    },
    implementation: {
      phase_name: "Implementation",
      purpose: "Build the target frontend from approved contracts without invention.",
      entry_gate: "Tests are authored and canonical implementation artifacts are approved.",
      exit_gate: "Target source exists and is ready for browser verification."
    },
    verification: {
      phase_name: "Verification",
      purpose: "Verify implementation behavior with Playwright evidence.",
      entry_gate: "Target frontend exists and can run.",
      exit_gate: "Browser evidence proves or rejects contract adherence."
    },
    qa: {
      phase_name: "QA",
      purpose: "Run scenario, malformed-data, accessibility, visual, and drift checks.",
      entry_gate: "Verification evidence is available.",
      exit_gate: "QA findings are recorded and unresolved drift is routed to repair."
    },
    repair: {
      phase_name: "Repair",
      purpose: "Turn verification and QA drift into bounded implementation repair tasks.",
      entry_gate: "Verification or QA found contract drift or missing evidence.",
      exit_gate: "Repairs are complete and verification is rerun."
    }
  };
  return values[phaseId];
}

function buildBundle(packageType: AgentContextPackageType, phaseId: AgentContextPhaseId): AgentContextPhaseBundle {
  const reads = phaseReads(phaseId);
  const metadata = phaseMetadata(phaseId);
  return {
    schema_version: "1.0",
    phase_id: phaseId,
    phase_name: metadata.phase_name,
    package_type: packageType,
    status: phaseStatus(packageType, phaseId),
    purpose: metadata.purpose,
    entry_gate: metadata.entry_gate,
    exit_gate: metadata.exit_gate,
    required_reads: reads.required,
    optional_reads: reads.optional,
    mcp_query_plan: reads.required.slice(0, 5).map((item) => mcpRead(item.artifact_id)),
    full_artifact_policy: "Start from this compact bundle. Read full artifacts only when the bundle points to them or when verification evidence requires exact source text.",
    blocked_reason: blockedReason(packageType, phaseId)
  };
}

function productNameFromPackage(pkg: ArchetypePackage): string {
  return String(pkg.product.productModel.product_name ?? pkg.manifest.project_slug ?? "Archetype Project");
}

function productTypeFromPackage(pkg: ArchetypePackage): string {
  return String(pkg.product.productModel.product_type ?? "Unknown product type");
}

function productCategoryFromPackage(pkg: ArchetypePackage): string {
  return String(pkg.product.productModel.product_category ?? "Unknown category");
}

function lengthOfUnknownArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function buildPackage(
  packageType: AgentContextPackageType,
  base: Omit<AgentContextSummary, "schema_version" | "start_here" | "phase_bundle_index" | "compact_read_policy" | "phase_bundles">
): AgentContextPackage {
  const phaseIds: AgentContextPhaseId[] = [
    "clarification",
    "draft_review",
    "contract_approval",
    "test_first",
    "implementation",
    "verification",
    "qa",
    "repair"
  ];
  const bundles = phaseIds.map((phaseId) => buildBundle(packageType, phaseId));
  const phase_bundles = bundles.map((bundle) => ({
    phase_id: bundle.phase_id,
    status: bundle.status,
    path: PHASE_PATHS[bundle.phase_id]
  }));
  const summary: AgentContextSummary = {
    schema_version: "1.0",
    ...base,
    start_here: "agent-context/context-summary.json",
    phase_bundle_index: "agent-context/phase-bundles/index.json",
    compact_read_policy: {
      default_tool: "archetype_summarize_package",
      read_full_artifact_only_when: [
        "A phase bundle names the artifact as a required read.",
        "A test or verifier needs exact source text.",
        "The compact summary reports a blocker, warning, or drift item that needs source evidence."
      ],
      max_default_artifact_bytes: AGENT_CONTEXT_DEFAULT_MAX_ARTIFACT_BYTES
    },
    phase_bundles
  };
  return {
    summary,
    summaryMarkdown: agentContextSummaryMarkdown(summary),
    phaseIndex: {
      schema_version: "1.0",
      start_here: summary.start_here,
      package_type: packageType,
      phases: phase_bundles
    },
    bundles
  };
}

export function buildAgentContextForPackage(pkg: ArchetypePackage, packageType: "draft_contract" | "canonical"): AgentContextPackage {
  return buildPackage(packageType, {
    package_type: packageType,
    product_name: productNameFromPackage(pkg),
    product_type: productTypeFromPackage(pkg),
    product_category: productCategoryFromPackage(pkg),
    readiness_score: pkg.quality.readiness.score,
    readiness_tier: packageType === "draft_contract" ? "ready_for_contract_approval" : pkg.manifest.readiness_tier,
    ready_for_frontend_agent: packageType === "canonical" && pkg.quality.readiness.readyForFrontendAgent,
    implementation_authorized: packageType === "canonical" && pkg.manifest.implementation_authorized === true,
    contract_approval_status: String(pkg.manifest.contract_approval.status ?? "unknown"),
    route_count: pkg.experience.routeMap.routes.length,
    screen_count: lengthOfUnknownArray(pkg.experience.screenInventory.screens),
    blockers: pkg.quality.readiness.blockers,
    warnings: pkg.quality.readiness.warnings
  });
}

export function buildAgentContextForClarification(input: ArchetypeInput, assessment: ContextGateAssessment): AgentContextPackage {
  return buildPackage("clarification", {
    package_type: "clarification",
    product_name: input.projectName?.trim() || "Archetype Clarification",
    product_type: "Unknown product type",
    product_category: "Unknown category",
    readiness_score: Math.min(assessment.confidenceScore, 49),
    readiness_tier: "ready_for_clarification",
    ready_for_frontend_agent: false,
    implementation_authorized: false,
    contract_approval_status: "not_started",
    route_count: 0,
    screen_count: 0,
    blockers: assessment.blockers,
    warnings: assessment.warnings
  });
}

export function agentContextSummaryMarkdown(summary: AgentContextSummary): string {
  const phases = summary.phase_bundles.map((bundle) => `- ${bundle.phase_id}: ${bundle.status} (${bundle.path})`);
  const blockers = summary.blockers.length > 0 ? summary.blockers.map((blocker) => `- ${blocker}`) : ["- None."];
  const warnings = summary.warnings.length > 0 ? summary.warnings.map((warning) => `- ${warning}`) : ["- None."];
  return [
    "# Agent Context Summary",
    "",
    `Product: ${summary.product_name}`,
    `Package type: ${summary.package_type}`,
    `Readiness tier: ${summary.readiness_tier}`,
    `Ready for frontend agent: ${summary.ready_for_frontend_agent}`,
    `Implementation authorized: ${summary.implementation_authorized}`,
    "",
    "## Start Here",
    "",
    `- Summary: ${summary.start_here}`,
    `- Phase bundle index: ${summary.phase_bundle_index}`,
    "- Policy: start from the compact phase bundle, then request full artifacts only when the bundle names them.",
    "",
    "## Phase Bundles",
    "",
    ...phases,
    "",
    "## Blockers",
    "",
    ...blockers,
    "",
    "## Warnings",
    "",
    ...warnings
  ].join("\n");
}
