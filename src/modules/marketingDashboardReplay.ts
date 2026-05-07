export const MARKETING_DASHBOARD_REPLAY = {
  source_scope: "HL-14",
  prompt: "/archetype \"I want to build an admin dashboard for a marketing team\"",
  context: "I want to build an admin dashboard for a marketing team",
  expected_state: "ready_for_clarification",
  confirmed_facts: [
    "Product surface: admin dashboard.",
    "Domain hint: marketing."
  ],
  candidate_assumptions: [
    "Possible users: campaign operator, marketing executive, growth analyst, agency admin.",
    "Possible routes: campaigns, reports, budget, settings.",
    "Possible data: campaigns, spend, ROAS, CAC, channel performance.",
    "Possible visual direction: dense operational dashboard."
  ],
  missing_blockers: [
    "primary_users",
    "must_have_flows",
    "target_stack",
    "data_auth_boundary",
    "design_direction",
    "test_execution_permission",
    "assumption_approval"
  ],
  correct_next_question: "Who is the primary user of this marketing admin dashboard?",
  forbidden_output_paths: [
    "spec/archetype-spec.json",
    "spec/archetype-spec.md",
    "test-first/test-first-contract.json",
    "test-first/test-first-plan.md",
    "verification/playwright-verification-contract.json",
    "frontend-agent-contract/implementation-rules.json",
    "frontend-agent-contract/frontend-agent-instructions.md",
    "frontend-agent-contract/acceptance-criteria.json",
    "implementation-contract.md",
    "AGENTS.md",
    "CLAUDE.md"
  ],
  exit_condition: "The regression cannot produce a canonical spec, tests, or implementation instructions."
} as const;
