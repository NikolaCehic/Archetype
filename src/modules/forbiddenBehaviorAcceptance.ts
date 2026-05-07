type EnforcementKind = "validator" | "contract_test" | "lifecycle_gate";

export const HL13_FORBIDDEN_BEHAVIORS = [
  "Generate code from weak context.",
  "Treat inferred routes as accepted routes.",
  "Treat warnings as readiness.",
  "Ask bulk questions when one-question clarification is possible.",
  "Hide assumptions inside product copy or route names.",
  "Generate a default Vite README as the final project README.",
  "Claim production-grade output from mock-only interactions.",
  "Replace real workflows with generic success states.",
  "Generate tests that only validate its own markers.",
  "Let implementation mutate the contract without approved evidence.",
  "Let QA pass without Playwright evidence."
];

export const HL13_ACCEPTANCE_CRITERIA = [
  "Vague prompts stop at clarification.",
  "Inferred routes remain candidates.",
  "Approved assumptions are recorded.",
  "Shallow tests fail.",
  "Implementation drift creates repair tasks.",
  "Completion requires a clean repair queue."
];

const enforcement: Array<{
  behavior: string;
  encoded_as: EnforcementKind;
  validator_or_test: string;
  evidence_artifacts: string[];
}> = [
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[0],
    encoded_as: "lifecycle_gate",
    validator_or_test: "scripts/run-lifecycle-contract.mjs",
    evidence_artifacts: ["lifecycle/context-completion.json", "lifecycle/context-matrix.json", "lifecycle/clarification-state.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[1],
    encoded_as: "validator",
    validator_or_test: "src/quality/validatePackage.ts",
    evidence_artifacts: ["draft/experience-architecture.draft.json", "draft/assumption-ledger.md", "lifecycle/approval-decision.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[2],
    encoded_as: "validator",
    validator_or_test: "src/quality/validatePackage.ts",
    evidence_artifacts: ["00-manifest/implementation-readiness.json", "lifecycle/readiness-tiers.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[3],
    encoded_as: "contract_test",
    validator_or_test: "scripts/run-clarification-ux-contract.mjs",
    evidence_artifacts: ["lifecycle/clarification-turn.json", "lifecycle/clarification-state.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[4],
    encoded_as: "validator",
    validator_or_test: "src/modules/evidenceDecisionModel.ts",
    evidence_artifacts: ["draft/assumption-ledger.md", "governance/evidence-decision-model.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[5],
    encoded_as: "contract_test",
    validator_or_test: "scripts/run-required-package-artifacts-contract.mjs",
    evidence_artifacts: ["README.md", "manifest.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[6],
    encoded_as: "validator",
    validator_or_test: "src/quality/validatePackage.ts",
    evidence_artifacts: ["verification-plan.md", "lifecycle/final-readiness-report.md", "qa/scenario-catalog.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[7],
    encoded_as: "validator",
    validator_or_test: "src/modules/lifecycleExecutionStates.ts",
    evidence_artifacts: ["lifecycle/execution-state.json", "test-first/test-first-contract.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[8],
    encoded_as: "contract_test",
    validator_or_test: "scripts/run-test-quality-standard-contract.mjs",
    evidence_artifacts: ["test-first/test-quality-standard.json", "verification/playwright-verification-contract.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[9],
    encoded_as: "contract_test",
    validator_or_test: "scripts/run-repair-contract.mjs",
    evidence_artifacts: ["10-revision/repair-task-queue.json", "10-revision/drift-report.json"]
  },
  {
    behavior: HL13_FORBIDDEN_BEHAVIORS[10],
    encoded_as: "validator",
    validator_or_test: "src/quality/validatePackage.ts",
    evidence_artifacts: ["qa/playwright-results.json", "verification/playwright-evidence.json"]
  }
];

export function buildForbiddenBehaviorAcceptanceArtifact(): Record<string, unknown> {
  return {
    artifact_version: "1.0",
    source_scope: "HL-13",
    rule: "Forbidden behaviors are encoded as tests or validators.",
    forbidden_behaviors: enforcement.map((item, index) => ({
      id: `HL13-F${String(index + 1).padStart(2, "0")}`,
      ...item,
      status: "encoded"
    })),
    acceptance_criteria: HL13_ACCEPTANCE_CRITERIA.map((criterion, index) => ({
      id: `HL13-A${String(index + 1).padStart(2, "0")}`,
      criterion,
      encoded_as: "contract_test_or_validator"
    })),
    exit_condition: "Forbidden behaviors are encoded as tests or validators."
  };
}

export function forbiddenBehaviorAcceptanceMarkdown(artifact: Record<string, unknown>): string {
  const behaviors = Array.isArray(artifact.forbidden_behaviors) ? artifact.forbidden_behaviors as Array<Record<string, unknown>> : [];
  const criteria = Array.isArray(artifact.acceptance_criteria) ? artifact.acceptance_criteria as Array<Record<string, unknown>> : [];
  return [
    "# Forbidden Behaviors And Acceptance",
    "",
    "Source scope: HL-13",
    `Rule: ${String(artifact.rule ?? "Forbidden behaviors are encoded as tests or validators.")}`,
    "",
    "## Forbidden Behaviors",
    "",
    ...behaviors.map((behavior) => `- ${String(behavior.id)}: ${String(behavior.behavior)} (${String(behavior.encoded_as)}: ${String(behavior.validator_or_test)})`),
    "",
    "## Acceptance Criteria",
    "",
    ...criteria.map((criterion) => `- ${String(criterion.id)}: ${String(criterion.criterion)}`),
    "",
    "## Exit Condition",
    "",
    String(artifact.exit_condition ?? "Forbidden behaviors are encoded as tests or validators.")
  ].join("\n");
}
