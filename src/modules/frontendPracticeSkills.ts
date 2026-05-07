import type { ArchetypePackage } from "../core/types";

export interface FrontendPracticeSkillDefinition {
  id: string;
  owner: string;
  lifecycle_gates: string[];
  output_artifact: string;
  blocker_list: string[];
  input_artifacts: string[];
}

export const FRONTEND_PRACTICE_SKILLS: FrontendPracticeSkillDefinition[] = [
  {
    id: "frontend-architecture",
    owner: "frontend_architect",
    lifecycle_gates: ["specialist_review", "implementation"],
    output_artifact: "specialist-gate/frontend-practices/frontend-architecture.json",
    blocker_list: [
      "Route, screen, layout, state, or module boundaries are invented outside the canonical contract.",
      "Target file manifest is ignored or bypassed.",
      "Architecture cannot be traced to product, route, screen, data, and verification artifacts."
    ],
    input_artifacts: ["spec/archetype-spec.json", "experience/route-map.json", "screens/screen-inventory.json", "12-target-frontend/source-file-manifest.json"]
  },
  {
    id: "react-practices",
    owner: "react_practices_enforcer",
    lifecycle_gates: ["specialist_review", "implementation"],
    output_artifact: "specialist-gate/frontend-practices/react-practices.json",
    blocker_list: [
      "Components hide behavior in generic success panels instead of implementing declared states.",
      "React state, composition, or effects make contract behavior nondeterministic.",
      "Framework routing or rendering conventions are bypassed without approved evidence."
    ],
    input_artifacts: ["06-frontend-agent-contract/build-manifest.json", "12-target-frontend/route-component-map.json", "05-screen-specs/screen-spec-index.json"]
  },
  {
    id: "typescript-strictness",
    owner: "strict_typing_reviewer",
    lifecycle_gates: ["specialist_review", "implementation", "qa_verification"],
    output_artifact: "specialist-gate/frontend-practices/typescript-strictness.json",
    blocker_list: [
      "Untyped escape hatches such as broad any usage hide contract drift.",
      "Data, action, form, adapter, or component contracts are not represented as types.",
      "Typecheck is disabled, weakened, or ignored."
    ],
    input_artifacts: ["06-frontend-agent-contract/data-contracts.json", "06-frontend-agent-contract/action-contracts.json", "12-target-frontend/adapter-interfaces.ts"]
  },
  {
    id: "design-system-practices",
    owner: "design_system_reviewer",
    lifecycle_gates: ["specialist_review", "implementation"],
    output_artifact: "specialist-gate/frontend-practices/design-system-practices.json",
    blocker_list: [
      "Raw colors, spacing, radius, shadows, or typography replace generated tokens.",
      "Components or patterns are invented outside the registry.",
      "Visual hierarchy conflicts with the approved design-system direction."
    ],
    input_artifacts: ["04-design-system/tokens/token-contracts.json", "04-design-system/components/component-contracts.json", "04-design-system/patterns/pattern-contracts.json"]
  },
  {
    id: "accessibility-practices",
    owner: "accessibility_reviewer",
    lifecycle_gates: ["specialist_review", "qa_verification", "completion"],
    output_artifact: "specialist-gate/frontend-practices/accessibility-practices.json",
    blocker_list: [
      "Interactive controls lack accessible names.",
      "Required headings, focus order, keyboard behavior, or status semantics are missing.",
      "Accessibility compliance is claimed without review evidence."
    ],
    input_artifacts: ["04-design-system/accessibility/accessibility-rules.json", "05-screen-specs/screen-spec-index.json", "verification/playwright-verification-contract.json"]
  },
  {
    id: "forms-and-validation",
    owner: "forms_validation_reviewer",
    lifecycle_gates: ["specialist_review", "implementation", "qa_verification"],
    output_artifact: "specialist-gate/frontend-practices/forms-and-validation.json",
    blocker_list: [
      "Form fields, validation timing, dirty states, submission states, or error states diverge from the contract.",
      "Validation behavior is replaced by generic success or error copy.",
      "Permission, offline, or retry states are omitted where required."
    ],
    input_artifacts: ["06-frontend-agent-contract/form-contracts.json", "06-frontend-agent-contract/form-rules.json", "test-first/test-first-contract.json"]
  },
  {
    id: "data-contract-practices",
    owner: "data_contract_reviewer",
    lifecycle_gates: ["specialist_review", "implementation", "repair_or_revision"],
    output_artifact: "specialist-gate/frontend-practices/data-contract-practices.json",
    blocker_list: [
      "Queries, mutations, entities, or adapter behavior invent fields outside the contract.",
      "Loading, empty, error, permission, stale, or offline states are not fixture-testable.",
      "Production integration is claimed before backend and auth mapping evidence exists."
    ],
    input_artifacts: ["06-frontend-agent-contract/data-contracts.json", "06-frontend-agent-contract/data-operation-contracts.json", "06-frontend-agent-contract/production-integration-contracts.json"]
  },
  {
    id: "responsive-practices",
    owner: "responsive_layout_reviewer",
    lifecycle_gates: ["specialist_review", "qa_verification"],
    output_artifact: "specialist-gate/frontend-practices/responsive-practices.json",
    blocker_list: [
      "Required viewports produce horizontal overflow, clipped controls, or unreadable content.",
      "Responsive behavior is not traceable to layout and screen contracts.",
      "Mobile and desktop flows diverge without approved contract evidence."
    ],
    input_artifacts: ["06-frontend-agent-contract/responsive-rules.json", "05-screen-specs/screen-spec-index.json", "verification/playwright-verification-contract.json"]
  },
  {
    id: "performance-practices",
    owner: "performance_reviewer",
    lifecycle_gates: ["specialist_review", "qa_verification", "completion"],
    output_artifact: "specialist-gate/frontend-practices/performance-practices.json",
    blocker_list: [
      "Implementation introduces avoidable render churn, oversized client surfaces, or blocking data work.",
      "Target build or route execution fails under the declared stack.",
      "Performance readiness is claimed without build and browser execution evidence."
    ],
    input_artifacts: ["06-frontend-agent-contract/build-manifest.json", "14-target-execution/target-execution-report.json", "verification/playwright-evidence.json"]
  },
  {
    id: "visual-polish-practices",
    owner: "visual_polish_reviewer",
    lifecycle_gates: ["specialist_review", "qa_verification", "completion"],
    output_artifact: "specialist-gate/frontend-practices/visual-polish-practices.json",
    blocker_list: [
      "Visual output looks generic, amateur, cramped, misaligned, or inconsistent with the approved direction.",
      "Visual polish is judged only from selectors instead of screenshot or viewport evidence.",
      "States, density, typography, spacing, or hierarchy fail the declared product context."
    ],
    input_artifacts: ["04-design-system/visual-direction.md", "04-design-system/tokens/token-contracts.json", "verification/playwright-evidence.json"]
  },
  {
    id: "testing-practices",
    owner: "qa_practice_reviewer",
    lifecycle_gates: ["specialist_review", "test_first_authoring", "qa_verification", "repair_or_revision"],
    output_artifact: "specialist-gate/frontend-practices/testing-practices.json",
    blocker_list: [
      "Tests are written after product UI or the initial red result is not preserved.",
      "Tests only prove generated markers exist.",
      "Failing tests are deleted, skipped, weakened, or reclassified to make implementation pass."
    ],
    input_artifacts: ["test-first/test-first-contract.json", "verification/playwright-verification-contract.json", "10-revision/repair-task-queue.json"]
  }
];

function practiceStatus(skill: FrontendPracticeSkillDefinition): "pass" | "fail" {
  return skill.owner && skill.output_artifact && Array.isArray(skill.blocker_list) && skill.blocker_list.length > 0 ? "pass" : "fail";
}

export function frontendPracticeSkillOutput(skill: FrontendPracticeSkillDefinition): Record<string, unknown> {
  return {
    artifact_version: "1.0",
    source_scope: "HL-08",
    skill: skill.id,
    owner: skill.owner,
    lifecycle_gates: skill.lifecycle_gates,
    output_artifact: skill.output_artifact,
    status: practiceStatus(skill),
    blocker_list: skill.blocker_list,
    input_artifacts: skill.input_artifacts,
    enforcement: "This frontend practice is a pass/fail specialist-gate check, not an optional recommendation."
  };
}

export function buildFrontendPracticeSkillsArtifact(pkg: ArchetypePackage): Record<string, unknown> {
  const practices = FRONTEND_PRACTICE_SKILLS.map((skill) => frontendPracticeSkillOutput(skill));
  const failing = practices.filter((practice) => practice.status !== "pass");
  return {
    artifact_version: "1.0",
    source_scope: "HL-08",
    package_id: pkg.manifest.package_id,
    enforcement_rule: "These frontend practices are not optional recommendations. They are pass/fail checks in the specialist gate.",
    required_skills: FRONTEND_PRACTICE_SKILLS.map((skill) => skill.id),
    specialist_gate: {
      status: failing.length > 0 ? "fail" : "pass",
      pass_fail: true,
      required_practice_count: FRONTEND_PRACTICE_SKILLS.length,
      output_artifacts: FRONTEND_PRACTICE_SKILLS.map((skill) => skill.output_artifact)
    },
    practices,
    blockers: failing.map((practice) => `Practice ${String(practice.skill)} is missing an owner, blocker list, or output artifact.`),
    warnings: []
  };
}

export function frontendPracticeSkillsMarkdown(artifact: Record<string, unknown>): string {
  const practices = Array.isArray(artifact.practices) ? artifact.practices as Array<Record<string, unknown>> : [];
  return [
    "# Frontend Practice Skills",
    "",
    `Source scope: ${String(artifact.source_scope ?? "unknown")}`,
    `Gate status: ${String((artifact.specialist_gate as Record<string, unknown> | undefined)?.status ?? "unknown")}`,
    "",
    "These practices are pass/fail specialist-gate checks, not optional recommendations.",
    "",
    "## Practices",
    "",
    ...practices.map((practice) => [
      `### ${String(practice.skill)}`,
      "",
      `Owner: ${String(practice.owner)}`,
      `Output artifact: ${String(practice.output_artifact)}`,
      "",
      "Blockers:",
      ...(Array.isArray(practice.blocker_list) ? practice.blocker_list.map((blocker) => `- ${String(blocker)}`) : ["- Missing blocker list."])
    ].join("\n"))
  ].join("\n");
}
