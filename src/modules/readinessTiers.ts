import type {
  LifecycleArtifacts,
  ReadinessTier,
  ReadinessTierGate,
  ReadinessTiersArtifact
} from "../core/types";
import { READINESS_TIERS, WEAK_CONTEXT_DEFINITION } from "./contextGate";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function approvalStatus(pkg: {
  manifest: {
    implementation_authorized: boolean;
    contract_approval: Record<string, unknown>;
  };
}): string {
  return String(asRecord(pkg.manifest.contract_approval).status ?? "pending_human_review");
}

function gate(
  tier: ReadinessTier,
  status: ReadinessTierGate["status"],
  purpose: string,
  requiredArtifacts: string[],
  evidenceRefs: string[],
  blockers: string[] = []
): ReadinessTierGate {
  return {
    tier,
    status,
    purpose,
    required_artifacts: requiredArtifacts,
    evidence_refs: evidenceRefs,
    blockers
  };
}

function nextTier(current: ReadinessTier): ReadinessTier | null {
  const index = READINESS_TIERS.indexOf(current);
  return index >= 0 ? READINESS_TIERS[index + 1] ?? null : null;
}

function artifactBackedClaims(currentTier: ReadinessTier, readyForFrontendAgent: boolean, implementationAuthorized: boolean): ReadinessTiersArtifact["artifact_backed_claims"] {
  return [
    {
      claim: `readiness_tier:${currentTier}`,
      artifact_refs: ["lifecycle/readiness-tiers.json", "lifecycle/context-matrix.json", "00-manifest/implementation-readiness.json"]
    },
    {
      claim: `ready_for_frontend_agent:${readyForFrontendAgent}`,
      artifact_refs: ["lifecycle/readiness-tiers.json", "00-manifest/implementation-readiness.json", "governance/non-negotiable-principles.json"]
    },
    {
      claim: `implementation_authorized:${implementationAuthorized}`,
      artifact_refs: ["lifecycle/readiness-tiers.json", "governance/non-negotiable-principles.json", "10-revision/approval-gates.json"]
    }
  ];
}

export function buildClarificationReadinessTiersArtifact(input: {
  contextMatrix: LifecycleArtifacts["contextMatrix"];
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
}): ReadinessTiersArtifact {
  const blockers = [
    ...input.contextMatrix.blockers,
    "Contract draft is blocked until required context dimensions are confirmed."
  ];
  const currentTier: ReadinessTier = "ready_for_clarification";
  return {
    artifact_version: "1.0",
    source_scope: "HL-03",
    weak_context_definition: WEAK_CONTEXT_DEFINITION,
    current_tier: currentTier,
    next_tier: "ready_for_contract_draft",
    boolean_compatibility: {
      ready_for_frontend_agent: input.readyForFrontendAgent,
      implementation_authorized: input.implementationAuthorized,
      note: "The boolean is a compatibility summary. The tier gates are the source of truth."
    },
    gates: [
      gate(
        "ready_for_clarification",
        "current",
        "Ask exactly one highest-impact question while preserving the context matrix.",
        ["lifecycle/context-matrix.json", "lifecycle/clarification-turn.json", "lifecycle/clarification-questions.json"],
        ["lifecycle/context-matrix.json"],
        []
      ),
      gate(
        "ready_for_contract_draft",
        "blocked",
        "Generate draft contract artifacts only after every required context dimension is sufficient.",
        ["lifecycle/context-matrix.json"],
        ["lifecycle/context-matrix.json"],
        blockers
      ),
      gate("ready_for_contract_approval", "not_reached", "Review the draft contract before it can authorize implementation.", ["spec/archetype-spec.json", "governance/non-negotiable-principles.json"], [], ["Draft contract has not been generated."]),
      gate("ready_for_test_authoring", "not_reached", "Author tests from an approved canonical contract.", ["test-first/test-first-contract.json"], [], ["Draft contract has not been generated."]),
      gate("ready_for_implementation", "not_reached", "Implement only after tests and human contract approval exist.", ["test-first/test-first-contract.json", "10-revision/approval-gates.json"], [], ["Implementation is not authorized."]),
      gate("ready_for_qa", "not_reached", "Run QA after implementation exists.", ["14-target-execution/target-execution-report.json"], [], ["Target implementation does not exist."]),
      gate("ready_for_completion", "not_reached", "Complete only after Playwright-backed verification passes.", ["verification/playwright-evidence.json"], [], ["Verification has not passed."])
    ],
    artifact_backed_claims: artifactBackedClaims(currentTier, input.readyForFrontendAgent, input.implementationAuthorized),
    blockers
  };
}

export function buildContextReadinessTiersArtifact(input: {
  contextMatrix: LifecycleArtifacts["contextMatrix"];
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
}): ReadinessTiersArtifact {
  if (input.contextMatrix.status === "needs_clarification") {
    return buildClarificationReadinessTiersArtifact(input);
  }
  const currentTier: ReadinessTier = "ready_for_contract_draft";
  return {
    artifact_version: "1.0",
    source_scope: "HL-03",
    weak_context_definition: WEAK_CONTEXT_DEFINITION,
    current_tier: currentTier,
    next_tier: "ready_for_contract_approval",
    boolean_compatibility: {
      ready_for_frontend_agent: input.readyForFrontendAgent,
      implementation_authorized: input.implementationAuthorized,
      note: "The boolean is a compatibility summary. The tier gates are the source of truth."
    },
    gates: [
      gate("ready_for_clarification", "satisfied", "Ask exactly one highest-impact question when context is weak.", ["lifecycle/context-matrix.json", "lifecycle/clarification-turn.json", "lifecycle/clarification-questions.json"], ["lifecycle/context-matrix.json", "lifecycle/clarification-turn.json"]),
      gate("ready_for_contract_draft", "current", "Context is sufficient for Archetype to generate a draft contract.", ["lifecycle/context-matrix.json"], ["lifecycle/context-matrix.json"]),
      gate("ready_for_contract_approval", "not_reached", "Human review must approve the generated contract before implementation.", ["spec/archetype-spec.json", "implementation-contract.md"], [], ["Draft contract has not yet been exported in this context-only artifact."]),
      gate("ready_for_test_authoring", "not_reached", "Author tests from an approved canonical contract.", ["test-first/test-first-contract.json"], [], ["Contract approval has not happened."]),
      gate("ready_for_implementation", "not_reached", "Implementation can start only after human approval and test-first artifacts exist.", ["test-first/test-first-contract.json", "10-revision/approval-gates.json"], [], ["Implementation is not authorized."]),
      gate("ready_for_qa", "not_reached", "QA starts after implementation evidence exists.", ["14-target-execution/target-execution-report.json"], [], ["Target implementation does not exist."]),
      gate("ready_for_completion", "not_reached", "Completion requires passing QA and Playwright-backed verification evidence.", ["verification/playwright-evidence.json"], [], ["Verification has not passed."])
    ],
    artifact_backed_claims: artifactBackedClaims(currentTier, input.readyForFrontendAgent, input.implementationAuthorized),
    blockers: []
  };
}

export function buildPackageReadinessTiersArtifact(pkg: {
  manifest: {
    readiness_tier: ReadinessTier;
    ready_for_frontend_agent: boolean;
    implementation_authorized: boolean;
    contract_approval: Record<string, unknown>;
  };
  lifecycle: LifecycleArtifacts;
  playwright: { evidenceJson: Record<string, unknown> };
}): ReadinessTiersArtifact {
  const currentTier = pkg.manifest.readiness_tier;
  const approval = approvalStatus(pkg);
  const implementationAuthorized = pkg.manifest.implementation_authorized === true;
  const playwrightStatus = implementationAuthorized ? String(pkg.playwright.evidenceJson.status ?? "pending") : "skipped";
  const contextBlockers = pkg.lifecycle.contextMatrix.blockers;
  const approvalBlockers = approval === "approved" ? [] : [`Contract approval status is ${approval}.`];
  const implementationBlockers = implementationAuthorized ? [] : ["Implementation is not authorized by a human-approved contract."];
  const qaBlockers = ["Target implementation and target execution evidence are not present in the contract package."];
  const completionBlockers = playwrightStatus === "pass" ? [] : [`Playwright evidence status is ${playwrightStatus}.`];

  const contextStatus = pkg.lifecycle.contextCompletion.status;
  const contractDraftSatisfied = contextStatus === "complete";
  const contractApprovalSatisfied = approval === "approved";
  const testAuthoringSatisfied = contractApprovalSatisfied;
  const implementationSatisfied = implementationAuthorized;
  const qaSatisfied = false;
  const completionSatisfied = playwrightStatus === "pass";

  return {
    artifact_version: "1.0",
    source_scope: "HL-03",
    weak_context_definition: WEAK_CONTEXT_DEFINITION,
    current_tier: currentTier,
    next_tier: nextTier(currentTier),
    boolean_compatibility: {
      ready_for_frontend_agent: pkg.manifest.ready_for_frontend_agent,
      implementation_authorized: pkg.manifest.implementation_authorized,
      note: "The boolean is a compatibility summary. The tier gates are the source of truth."
    },
    gates: [
      gate(
        "ready_for_clarification",
        contextStatus === "needs_clarification" ? "current" : "satisfied",
        "Ask exactly one highest-impact question when context is weak.",
        ["lifecycle/context-matrix.json", "lifecycle/clarification-turn.json", "lifecycle/clarification-questions.json"],
        ["lifecycle/context-matrix.json", "lifecycle/clarification-turn.json"],
        contextStatus === "needs_clarification" ? contextBlockers : []
      ),
      gate(
        "ready_for_contract_draft",
        currentTier === "ready_for_contract_draft" ? "current" : contractDraftSatisfied ? "satisfied" : "blocked",
        "Generate a draft only after required context dimensions are sufficient.",
        ["lifecycle/context-matrix.json", "governance/evidence-decision-model.json"],
        ["lifecycle/context-matrix.json", "governance/evidence-decision-model.json"],
        contractDraftSatisfied ? [] : contextBlockers
      ),
      gate(
        "ready_for_contract_approval",
        currentTier === "ready_for_contract_approval" ? "current" : contractApprovalSatisfied ? "satisfied" : "blocked",
        "Human review must approve the generated contract before implementation.",
        ["spec/archetype-spec.json", "implementation-contract.md", "governance/non-negotiable-principles.json"],
        ["spec/archetype-spec.json", "governance/non-negotiable-principles.json"],
        approvalBlockers
      ),
      gate(
        "ready_for_test_authoring",
        currentTier === "ready_for_test_authoring" ? "current" : testAuthoringSatisfied ? "satisfied" : "blocked",
        "Tests must be authored from the canonical contract before product UI implementation.",
        ["test-first/test-first-contract.json", "verification/playwright-verification-contract.json"],
        ["test-first/test-first-contract.json"],
        testAuthoringSatisfied ? [] : approvalBlockers
      ),
      gate(
        "ready_for_implementation",
        currentTier === "ready_for_implementation" ? "current" : implementationSatisfied ? "satisfied" : "blocked",
        "Implementation can start only after human approval and test-first artifacts exist.",
        ["test-first/test-first-contract.json", "10-revision/approval-gates.json", "governance/non-negotiable-principles.json"],
        ["10-revision/approval-gates.json", "test-first/test-first-contract.json"],
        implementationBlockers
      ),
      gate(
        "ready_for_qa",
        currentTier === "ready_for_qa" ? "current" : qaSatisfied ? "satisfied" : "not_reached",
        "QA starts after implementation evidence exists.",
        ["14-target-execution/target-execution-report.json", "13-e2e/e2e-results.json"],
        ["14-target-execution/target-execution-report.json"],
        qaBlockers
      ),
      gate(
        "ready_for_completion",
        currentTier === "ready_for_completion" ? "current" : completionSatisfied ? "satisfied" : "not_reached",
        "Completion requires passing QA and Playwright-backed verification evidence.",
        ["verification/playwright-evidence.json", "14-target-execution/target-execution-report.json"],
        ["verification/playwright-evidence.json"],
        completionBlockers
      )
    ],
    artifact_backed_claims: artifactBackedClaims(currentTier, pkg.manifest.ready_for_frontend_agent, pkg.manifest.implementation_authorized),
    blockers: [
      ...contextBlockers,
      ...approvalBlockers,
      ...implementationBlockers,
      ...qaBlockers,
      ...completionBlockers
    ]
  };
}

export function readinessTiersMarkdown(artifact: ReadinessTiersArtifact): string {
  return [
    "# Readiness Tiers",
    "",
    `Current tier: ${artifact.current_tier}`,
    `Next tier: ${artifact.next_tier ?? "none"}`,
    `Weak context: ${artifact.weak_context_definition}`,
    "",
    "## Gates",
    "",
    ...artifact.gates.map((item) => `- [${item.status}] ${item.tier}: ${item.purpose}`),
    "",
    "## Artifact-Backed Claims",
    "",
    ...artifact.artifact_backed_claims.map((item) => `- ${item.claim}: ${item.artifact_refs.join(", ")}`),
    "",
    "## Blockers",
    "",
    ...(artifact.blockers.length > 0 ? artifact.blockers.map((item) => `- ${item}`) : ["- None."])
  ].join("\n");
}
