export const HL16_CONVERGENCE_QUESTIONS = [
  "Can weak context still produce code?",
  "Can inferred scope become canonical without approval?",
  "Can tests pass while proving only generated markers?",
  "Can QA pass without Playwright evidence?",
  "Can completion happen with unresolved repair tasks?"
] as const;

type Question = typeof HL16_CONVERGENCE_QUESTIONS[number];

interface EvidenceMap {
  automated_evidence: string[];
  documented_evidence: string[];
  lifecycle_artifacts: string[];
}

const EVIDENCE_BY_QUESTION: Record<Question, EvidenceMap> = {
  "Can weak context still produce code?": {
    automated_evidence: [
      "scripts/run-context-readiness-contract.mjs",
      "scripts/run-marketing-dashboard-replay-contract.mjs",
      "scripts/run-implementation-phases-contract.mjs"
    ],
    documented_evidence: [
      "docs/agent-lifecycle.md",
      "README.md",
      "lifecycle/implementation-phases.md"
    ],
    lifecycle_artifacts: [
      "lifecycle/context-matrix.json",
      "lifecycle/readiness-tiers.json",
      "lifecycle/implementation-phases.json"
    ]
  },
  "Can inferred scope become canonical without approval?": {
    automated_evidence: [
      "scripts/run-evidence-decision-model-contract.mjs",
      "scripts/run-lifecycle-contract-states-contract.mjs",
      "scripts/run-non-negotiable-principles-contract.mjs"
    ],
    documented_evidence: [
      "docs/agent-lifecycle.md",
      "draft/assumption-ledger.md",
      "lifecycle/approval-request.md"
    ],
    lifecycle_artifacts: [
      "governance/evidence-decision-model.json",
      "lifecycle/contract-state.json",
      "lifecycle/approval-decision.json"
    ]
  },
  "Can tests pass while proving only generated markers?": {
    automated_evidence: [
      "scripts/run-test-quality-standard-contract.mjs",
      "scripts/run-test-first-contract.mjs",
      "scripts/run-playwright-verification-contract.mjs"
    ],
    documented_evidence: [
      "docs/agent-lifecycle.md",
      "test-first/test-quality-standard.md",
      "test-results/initial-red-test-run.md"
    ],
    lifecycle_artifacts: [
      "test-first/test-quality-standard.json",
      "test-first/test-first-contract.json",
      "verification/playwright-verification-contract.json"
    ]
  },
  "Can QA pass without Playwright evidence?": {
    automated_evidence: [
      "scripts/run-qa-team-contract.mjs",
      "scripts/run-playwright-verification-contract.mjs",
      "scripts/run-forbidden-behaviors-contract.mjs"
    ],
    documented_evidence: [
      "docs/agent-lifecycle.md",
      "qa/playwright-results.json",
      "verification/playwright-evidence.md"
    ],
    lifecycle_artifacts: [
      "qa/playwright-results.json",
      "verification/playwright-evidence.json",
      "governance/forbidden-behaviors.json"
    ]
  },
  "Can completion happen with unresolved repair tasks?": {
    automated_evidence: [
      "scripts/run-repair-contract.mjs",
      "scripts/run-lifecycle-execution-states-contract.mjs",
      "scripts/run-required-package-artifacts-contract.mjs"
    ],
    documented_evidence: [
      "docs/agent-lifecycle.md",
      "lifecycle/final-readiness-report.md",
      "10-revision/repair-plan.md"
    ],
    lifecycle_artifacts: [
      "lifecycle/execution-state.json",
      "10-revision/repair-task-queue.json",
      "10-revision/drift-report.json"
    ]
  }
};

export function buildConvergenceStandardArtifact(input: {
  packageType: "clarification" | "draft_contract" | "canonical";
  readinessTier: string;
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
  contextStatus: string;
}): Record<string, unknown> {
  return {
    artifact_version: "1.0",
    source_scope: "HL-16",
    scope: "Define when the lifecycle is hardened enough.",
    required_answer: "No.",
    current_package: {
      package_type: input.packageType,
      context_status: input.contextStatus,
      readiness_tier: input.readinessTier,
      ready_for_frontend_agent: input.readyForFrontendAgent,
      implementation_authorized: input.implementationAuthorized
    },
    convergence_questions: HL16_CONVERGENCE_QUESTIONS.map((question, index) => ({
      id: `HL16-Q${String(index + 1).padStart(2, "0")}`,
      question,
      answer: "No.",
      status: "evidence_backed_no",
      automated_evidence: EVIDENCE_BY_QUESTION[question].automated_evidence,
      documented_evidence: EVIDENCE_BY_QUESTION[question].documented_evidence,
      lifecycle_artifacts: EVIDENCE_BY_QUESTION[question].lifecycle_artifacts
    })),
    automated_evidence_summary: [
      "npm test",
      "npm run implementation-phases:contract",
      "npm run marketing-replay:contract",
      "npm run forbidden-behaviors:contract",
      "npm run test-quality:contract",
      "npm run qa-team:contract",
      "npm run repair:contract"
    ],
    documented_evidence_summary: [
      "README.md",
      "docs/agent-lifecycle.md",
      "governance/convergence-standard.md",
      "lifecycle/implementation-phases.md"
    ],
    exit_condition: "All convergence questions answer no through automated and documented evidence."
  };
}

export function convergenceStandardMarkdown(artifact: Record<string, unknown>): string {
  const questions = Array.isArray(artifact.convergence_questions)
    ? artifact.convergence_questions as Array<Record<string, unknown>>
    : [];
  return [
    "# Convergence Standard",
    "",
    "Source scope: HL-16",
    "Required answer: No.",
    "",
    "## Questions",
    "",
    ...questions.map((question) => `${String(question.id)}. ${String(question.question)} Answer: ${String(question.answer)}`),
    "",
    "## Automated Evidence",
    "",
    ...(Array.isArray(artifact.automated_evidence_summary)
      ? artifact.automated_evidence_summary.map((item) => `- ${String(item)}`)
      : ["- None."]),
    "",
    "## Documented Evidence",
    "",
    ...(Array.isArray(artifact.documented_evidence_summary)
      ? artifact.documented_evidence_summary.map((item) => `- ${String(item)}`)
      : ["- None."]),
    "",
    "## Exit Condition",
    "",
    String(artifact.exit_condition ?? "All convergence questions answer no through automated and documented evidence.")
  ].join("\n");
}
