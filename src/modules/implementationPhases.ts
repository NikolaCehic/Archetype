type PhaseStatus = "satisfied" | "current" | "blocked" | "not_reached";

export const HL15_IMPLEMENTATION_PHASE_NAMES = [
  "Gate Model",
  "One-Question Clarification UX",
  "Candidate vs Canonical Contracts",
  "Specialist Skills And Agent Roles",
  "Test And QA Hardening",
  "Verification And Drift Enforcement",
  "Regression Fixtures"
] as const;

export interface ImplementationPhaseInput {
  packageType: "clarification" | "draft_contract" | "canonical";
  contextStatus: "complete" | "needs_clarification" | string;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
  contractApprovalStatus?: string;
}

interface PhaseDefinition {
  phase_id: string;
  order: number;
  name: typeof HL15_IMPLEMENTATION_PHASE_NAMES[number];
  purpose: string;
  acceptance_gate_id: string;
  lifecycle_gate: string;
  required_artifacts: string[];
  contract_tests: string[];
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    phase_id: "HL15-P01",
    order: 1,
    name: "Gate Model",
    purpose: "Make readiness tiers and hard gates decide what the lifecycle may do next.",
    acceptance_gate_id: "HL15-G01",
    lifecycle_gate: "ready_for_implementation",
    required_artifacts: [
      "lifecycle/context-matrix.json",
      "lifecycle/readiness-tiers.json",
      "00-manifest/implementation-readiness.json",
      "governance/non-negotiable-principles.json"
    ],
    contract_tests: [
      "scripts/run-context-readiness-contract.mjs",
      "scripts/run-non-negotiable-principles-contract.mjs",
      "scripts/run-marketing-dashboard-replay-contract.mjs",
      "scripts/run-implementation-phases-contract.mjs"
    ]
  },
  {
    phase_id: "HL15-P02",
    order: 2,
    name: "One-Question Clarification UX",
    purpose: "Ask one highest-impact question at a time and update the context matrix before proceeding.",
    acceptance_gate_id: "HL15-G02",
    lifecycle_gate: "clarifying",
    required_artifacts: [
      "lifecycle/clarification-turn.json",
      "lifecycle/clarification-questions.json",
      "lifecycle/clarification-state.json"
    ],
    contract_tests: [
      "scripts/run-clarification-ux-contract.mjs",
      "scripts/run-lifecycle-intake-states-contract.mjs"
    ]
  },
  {
    phase_id: "HL15-P03",
    order: 3,
    name: "Candidate vs Canonical Contracts",
    purpose: "Keep inferred decisions candidate until human approval makes them canonical.",
    acceptance_gate_id: "HL15-G03",
    lifecycle_gate: "contract_approval",
    required_artifacts: [
      "governance/evidence-decision-model.json",
      "lifecycle/contract-state.json",
      "draft/contract-approval-request.json"
    ],
    contract_tests: [
      "scripts/run-evidence-decision-model-contract.mjs",
      "scripts/run-lifecycle-contract-states-contract.mjs"
    ]
  },
  {
    phase_id: "HL15-P04",
    order: 4,
    name: "Specialist Skills And Agent Roles",
    purpose: "Apply role-specific frontend practice gates before implementation work is trusted.",
    acceptance_gate_id: "HL15-G04",
    lifecycle_gate: "specialist_review",
    required_artifacts: [
      "governance/frontend-practice-skills.json",
      "draft/specialist-review.json",
      "agents/"
    ],
    contract_tests: [
      "scripts/run-frontend-practice-skills-contract.mjs",
      "scripts/run-agent-role-files-contract.mjs"
    ]
  },
  {
    phase_id: "HL15-P05",
    order: 5,
    name: "Test And QA Hardening",
    purpose: "Generate tests before implementation and require QA evidence across flows, states, malformed data, accessibility, and visuals.",
    acceptance_gate_id: "HL15-G05",
    lifecycle_gate: "test_first_authoring",
    required_artifacts: [
      "test-first/test-first-contract.json",
      "test-first/test-quality-standard.json",
      "qa/scenario-catalog.json",
      "qa/playwright-results.json"
    ],
    contract_tests: [
      "scripts/run-test-first-contract.mjs",
      "scripts/run-test-quality-standard-contract.mjs",
      "scripts/run-qa-team-contract.mjs"
    ]
  },
  {
    phase_id: "HL15-P06",
    order: 6,
    name: "Verification And Drift Enforcement",
    purpose: "Verify with Playwright, detect contract drift, and force repair before completion claims.",
    acceptance_gate_id: "HL15-G06",
    lifecycle_gate: "qa_verification",
    required_artifacts: [
      "verification/playwright-verification-contract.json",
      "verification/playwright-evidence.json",
      "10-revision/repair-task-queue.json",
      "10-revision/drift-report.json"
    ],
    contract_tests: [
      "scripts/run-playwright-verification-contract.mjs",
      "scripts/run-repair-contract.mjs",
      "scripts/run-forbidden-behaviors-contract.mjs"
    ]
  },
  {
    phase_id: "HL15-P07",
    order: 7,
    name: "Regression Fixtures",
    purpose: "Preserve real failure prompts as replayable fixtures so lifecycle drift is caught.",
    acceptance_gate_id: "HL15-G07",
    lifecycle_gate: "regression_replay",
    required_artifacts: [
      "examples/vague-marketing-dashboard-intake.json",
      "tmp/marketing-dashboard-replay-contract/marketing-dashboard-replay-summary.json"
    ],
    contract_tests: [
      "scripts/run-marketing-dashboard-replay-contract.mjs",
      "scripts/run-golden.mjs"
    ]
  }
];

function phaseStatus(input: ImplementationPhaseInput, phase: PhaseDefinition): PhaseStatus {
  if (phase.order === 1) {
    return input.contextStatus === "needs_clarification" || input.implementationAuthorized !== true
      ? "blocked"
      : "satisfied";
  }
  if (input.contextStatus === "needs_clarification") return "not_reached";
  if (input.packageType === "draft_contract" && phase.order <= 4) return "current";
  if (input.implementationAuthorized === true) return phase.order <= 5 ? "satisfied" : "current";
  return "not_reached";
}

function implementationBlockers(input: ImplementationPhaseInput): string[] {
  return [
    ...(input.contextStatus === "needs_clarification" ? ["context_status is needs_clarification"] : []),
    ...(input.readinessTier !== "ready_for_implementation" ? [`readiness_tier is ${input.readinessTier}`] : []),
    ...(input.implementationAuthorized !== true ? ["implementation_authorized is false"] : []),
    ...(input.readyForFrontendAgent !== true ? ["ready_for_frontend_agent is false"] : [])
  ];
}

export function buildImplementationPhasesArtifact(input: ImplementationPhaseInput): Record<string, unknown> {
  const blockers = implementationBlockers(input);
  const canEnterImplementation = blockers.length === 0;
  return {
    artifact_version: "1.0",
    source_scope: "HL-15",
    scope: "Define phase sequencing after the plan is approved.",
    sequencing_rule: "After contract approval, phases run in order and no phase may skip its lifecycle acceptance gate.",
    expected_sequence: [...HL15_IMPLEMENTATION_PHASE_NAMES],
    phase_1_priority: {
      rule: "Make needs_clarification block implementation readiness.",
      needs_clarification_blocks_implementation_readiness: true,
      checked_artifacts: [
        "lifecycle/context-matrix.json",
        "lifecycle/readiness-tiers.json",
        "00-manifest/implementation-readiness.json",
        "manifest.json"
      ]
    },
    current_package: {
      package_type: input.packageType,
      context_status: input.contextStatus,
      readiness_tier: input.readinessTier,
      ready_for_frontend_agent: input.readyForFrontendAgent,
      implementation_authorized: input.implementationAuthorized,
      contract_approval_status: input.contractApprovalStatus ?? "unknown"
    },
    implementation_readiness_gate: {
      gate_id: "HL15-IMPLEMENTATION-READINESS",
      status: canEnterImplementation ? "satisfied" : "blocked",
      can_enter_ready_for_implementation: canEnterImplementation,
      needs_clarification_blocks_implementation_readiness: true,
      blockers,
      evidence_refs: [
        "lifecycle/context-matrix.json",
        "lifecycle/readiness-tiers.json",
        "00-manifest/implementation-readiness.json",
        "governance/non-negotiable-principles.json"
      ]
    },
    phases: PHASE_DEFINITIONS.map((phase) => ({
      phase_id: phase.phase_id,
      order: phase.order,
      name: phase.name,
      purpose: phase.purpose,
      status: phaseStatus(input, phase),
      contract_tests: phase.contract_tests,
      lifecycle_acceptance_gate: {
        gate_id: phase.acceptance_gate_id,
        lifecycle_gate: phase.lifecycle_gate,
        status: phaseStatus(input, phase),
        required_artifacts: phase.required_artifacts,
        required_tests: phase.contract_tests,
        pass_condition: `All required artifacts exist and ${phase.contract_tests.join(", ")} pass.`
      }
    })),
    exit_condition: "Each phase has tests and a lifecycle acceptance gate."
  };
}

export function implementationPhasesMarkdown(artifact: Record<string, unknown>): string {
  const phases = Array.isArray(artifact.phases) ? artifact.phases as Array<Record<string, unknown>> : [];
  const gate = artifact.implementation_readiness_gate as Record<string, unknown> | undefined;
  return [
    "# Implementation Phases",
    "",
    "Source scope: HL-15",
    `Scope: ${String(artifact.scope ?? "Define phase sequencing after the plan is approved.")}`,
    `Sequencing rule: ${String(artifact.sequencing_rule ?? "")}`,
    "",
    "## Phase 1 Priority",
    "",
    "Make `needs_clarification` block implementation readiness.",
    `Implementation readiness gate: ${String(gate?.status ?? "unknown")}`,
    "",
    "## Phases",
    "",
    ...phases.map((phase) => {
      const acceptanceGate = phase.lifecycle_acceptance_gate as Record<string, unknown> | undefined;
      const tests = Array.isArray(phase.contract_tests) ? phase.contract_tests.map(String).join(", ") : "None";
      return `${String(phase.order)}. ${String(phase.name)} - ${String(phase.status)} - gate ${String(acceptanceGate?.gate_id ?? "unknown")} - tests: ${tests}`;
    }),
    "",
    "## Exit Condition",
    "",
    String(artifact.exit_condition ?? "Each phase has tests and a lifecycle acceptance gate.")
  ].join("\n");
}
