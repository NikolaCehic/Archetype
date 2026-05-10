import type {
  ArchetypeInput,
  ClarificationQuestion,
  ClarificationTurnArtifact,
  FrontendStackInput,
  LifecycleArtifacts
} from "../core/types";
import {
  assessContextGate,
  DEFAULT_MARKETING_DASHBOARD_QUESTION,
  HL04_CLARIFICATION_RULE,
  HL04_SELECTION_RULE,
  type ContextMatrix,
  type ContextMatrixDecision
} from "./contextGate";

const IMPACT_ORDER: Record<ContextMatrixDecision["impact"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const DECISION_PRIORITY: Record<string, number> = {
  product_outcome: 0,
  primary_users: 1,
  source_materials_review: 2,
  target_stack: 3,
  must_have_flows: 4,
  data_auth_boundary: 5,
  safety_constraints: 6,
  design_direction: 7,
  test_execution_permission: 8,
  assumption_approval: 9
};

export const HL04_ALGORITHM = [
  "Read idea, imported files, screenshots, and repo context.",
  "Build context matrix.",
  "Mark every required decision as confirmed, candidate, missing, conflicted, or blocked.",
  "Select the highest-impact missing or conflicted blocker.",
  "Ask exactly one question.",
  "Update the context matrix from the answer.",
  "Repeat until the next lifecycle gate is safe.",
  "Present assumptions and candidate decisions for approval.",
  "Generate the canonical contract only after approval."
];

function candidateBlockers(contextMatrix: ContextMatrix): ClarificationTurnArtifact["selection"]["candidate_blockers"] {
  return contextMatrix.decisions
    .filter((item) => item.required && ["missing", "conflicted", "blocked"].includes(item.status))
    .sort((a, b) => {
      const impactOrder = IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
      if (impactOrder !== 0) return impactOrder;
      return (DECISION_PRIORITY[a.id] ?? 99) - (DECISION_PRIORITY[b.id] ?? 99);
    })
    .map((item) => ({
      decision_id: item.id,
      label: item.label,
      status: item.status as "missing" | "conflicted" | "blocked",
      impact: item.impact,
      required: item.required
    }));
}

export function buildClarificationTurnArtifact(input: {
  contextMatrix: ContextMatrix;
  questions: ClarificationQuestion[];
}): ClarificationTurnArtifact {
  const currentQuestion = input.questions[0] ?? input.contextMatrix.next_question ?? null;
  const blockers = candidateBlockers(input.contextMatrix);
  return {
    artifact_version: "1.0",
    source_scope: "HL-04",
    rule: HL04_CLARIFICATION_RULE,
    default_first_question_for_vague_marketing_dashboard: DEFAULT_MARKETING_DASHBOARD_QUESTION,
    algorithm: HL04_ALGORITHM,
    current_question: currentQuestion,
    question_count: input.questions.length,
    selection: {
      selection_rule: HL04_SELECTION_RULE,
      selected_decision_id: currentQuestion?.selected_decision_id ?? null,
      selected_impact: currentQuestion?.impact ?? null,
      candidate_blockers: blockers
    },
    answer_protocol: {
      user_experience: "Ask only current_question.question. Do not ask a grouped form or secondary question in the same turn.",
      answer_storage: "Store the user's answer as explicit user evidence in archetype.intake.json.",
      update_behavior: "After each answer, update the affected intake field, rebuild lifecycle/context-matrix.json, and select the next highest-impact blocker.",
      repeat_behavior: "Repeat one question at a time until no required decision is missing, conflicted, or blocked.",
      final_pre_contract_step: "Before canonical contract generation, present assumptions and candidate decisions for human approval."
    },
    blocked_generation: input.contextMatrix.status === "needs_clarification"
  };
}

export function clarificationTurnMarkdown(artifact: ClarificationTurnArtifact): string {
  return [
    "# One-Question Clarification UX",
    "",
    `Source scope: ${artifact.source_scope}`,
    `Rule: ${artifact.rule}`,
    "",
    "## Current Question",
    "",
    artifact.current_question
      ? `- ${artifact.current_question.question}`
      : "- None. The context matrix has no current clarification blocker.",
    "",
    "## Selection",
    "",
    `- Rule: ${artifact.selection.selection_rule}`,
    `- Selected decision: ${artifact.selection.selected_decision_id ?? "none"}`,
    `- Selected impact: ${artifact.selection.selected_impact ?? "none"}`,
    `- Candidate blockers: ${artifact.selection.candidate_blockers.length}`,
    "",
    "## Answer Protocol",
    "",
    `- ${artifact.answer_protocol.user_experience}`,
    `- ${artifact.answer_protocol.update_behavior}`,
    `- ${artifact.answer_protocol.repeat_behavior}`,
    `- ${artifact.answer_protocol.final_pre_contract_step}`,
    "",
    "## Algorithm",
    "",
    ...artifact.algorithm.map((step, index) => `${index + 1}. ${step}`)
  ].join("\n");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function appendContext(input: ArchetypeInput, questionId: string, answer: string, answeredBy: string): string {
  const existing = input.context.trim();
  const entry = `Clarification answer (${questionId}, answered by ${answeredBy}): ${answer}`;
  return existing ? `${existing}\n\n${entry}` : entry;
}

function splitAnswerList(answer: string): string[] {
  return answer
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferStack(answer: string, existing: FrontendStackInput | undefined): FrontendStackInput {
  const normalized = answer.toLowerCase();
  const stack: FrontendStackInput = { ...(existing ?? {}) };
  if (normalized.includes("next")) {
    stack.framework = stack.framework ?? "React";
    stack.routing = "Next.js App Router";
  } else if (normalized.includes("react")) {
    stack.framework = "React";
    stack.routing = stack.routing ?? "React Router or target app router";
  } else if (normalized.includes("vue")) {
    stack.framework = "Vue";
  } else if (normalized.includes("svelte")) {
    stack.framework = "Svelte";
  }
  if (normalized.includes("typescript") || normalized.includes("ts")) stack.language = "TypeScript";
  if (normalized.includes("tailwind")) stack.styling = "Tailwind CSS";
  if (normalized.includes("css") && !stack.styling) stack.styling = "CSS";
  return Object.keys(stack).length > 0 ? stack : { framework: answer };
}

function inferBoundaryMode(answer: string): ArchetypeInput["dataBoundary"] {
  const normalized = answer.toLowerCase();
  const mode = normalized.includes("mock")
    ? "mock"
    : normalized.includes("api")
      ? "api"
      : normalized.includes("repo")
        ? "repo"
        : normalized.includes("hybrid")
          ? "hybrid"
          : undefined;
  return {
    mode,
    notes: answer,
    dataSource: normalized.includes("api") ? answer : undefined,
    auth: normalized.includes("auth") ? answer : undefined,
    permissions: normalized.includes("permission") || normalized.includes("role") ? answer : undefined
  };
}

function positiveAnswer(answer: string): boolean {
  return /\b(yes|yep|yeah|allow|allowed|may|approve|approved|ok|sure|true)\b/i.test(answer);
}

function testTypes(answer: string): string[] {
  const normalized = answer.toLowerCase();
  const types = [
    normalized.includes("smoke") ? "smoke" : "",
    normalized.includes("e2e") || normalized.includes("end-to-end") ? "e2e" : "",
    normalized.includes("ui") ? "ui" : "",
    normalized.includes("integration") ? "integration" : "",
    normalized.includes("unit") ? "unit" : "",
    normalized.includes("accessibility") || normalized.includes("a11y") ? "accessibility" : ""
  ].filter(Boolean);
  return types.length > 0 ? types : positiveAnswer(answer) ? ["smoke", "e2e", "ui", "integration", "unit", "accessibility"] : ["declined"];
}

function materialIntakeStatus(answer: string): "provided" | "none" | "pending" {
  const normalized = answer.toLowerCase();
  if (/\b(no|none|nothing|do not have|don't have|do not|without|proceed without|nothing to attach)\b/u.test(normalized)) {
    return "none";
  }
  return "pending";
}

export function applyClarificationAnswer(input: {
  intake: ArchetypeInput;
  questionId: string;
  answer: string;
  answeredBy?: string;
}): {
  status: "success" | "warning";
  updatedInput: ArchetypeInput;
  answeredQuestion: ClarificationQuestion | null;
  readinessTier: string;
  contextStatus: string;
  nextQuestion: ClarificationQuestion | null;
  contextMatrix: LifecycleArtifacts["contextMatrix"];
  clarificationTurn: ClarificationTurnArtifact;
} {
  const answer = input.answer.trim();
  if (!answer) throw new Error("answer is required.");
  const answeredBy = input.answeredBy?.trim() || "user";
  const before = assessContextGate(input.intake);
  const answeredQuestion = before.contextMatrix.decisions.find((item) => item.id === input.questionId)?.question ?? null;
  const next: ArchetypeInput = {
    ...input.intake,
    goals: input.intake.goals ? [...input.intake.goals] : undefined,
    businessGoals: input.intake.businessGoals ? [...input.intake.businessGoals] : undefined,
    users: input.intake.users ? [...input.intake.users] : undefined,
    referenceImages: input.intake.referenceImages ? [...input.intake.referenceImages] : undefined,
    brand: input.intake.brand ? { ...input.intake.brand, attributes: input.intake.brand.attributes ? [...input.intake.brand.attributes] : undefined } : undefined,
    stack: input.intake.stack ? { ...input.intake.stack } : undefined,
    dataBoundary: input.intake.dataBoundary ? { ...input.intake.dataBoundary } : undefined,
    testExecution: input.intake.testExecution ? { ...input.intake.testExecution, testTypes: input.intake.testExecution.testTypes ? [...input.intake.testExecution.testTypes] : undefined } : undefined,
    assumptionApproval: input.intake.assumptionApproval ? { ...input.intake.assumptionApproval, approvedAssumptionIds: input.intake.assumptionApproval.approvedAssumptionIds ? [...input.intake.assumptionApproval.approvedAssumptionIds] : undefined } : undefined,
    materialIntake: input.intake.materialIntake ? { ...input.intake.materialIntake, requestedTypes: input.intake.materialIntake.requestedTypes ? [...input.intake.materialIntake.requestedTypes] : undefined } : undefined,
    safetyConstraints: input.intake.safetyConstraints ? [...input.intake.safetyConstraints] : undefined,
    materials: input.intake.materials ? [...input.intake.materials] : undefined,
    context: appendContext(input.intake, input.questionId, answer, answeredBy)
  };

  if (input.questionId === "product_outcome") {
    next.goals = unique([...(next.goals ?? []), answer]);
  } else if (input.questionId === "primary_users") {
    next.users = unique([...(next.users ?? []), ...splitAnswerList(answer)]);
  } else if (input.questionId === "target_stack") {
    next.stack = inferStack(answer, next.stack);
  } else if (input.questionId === "source_materials_review") {
    next.materialIntake = {
      ...(next.materialIntake ?? {}),
      status: materialIntakeStatus(answer),
      requestedTypes: ["SPEC", "SOP", "PRD", "screenshots", "wireframes", "design_docs", "api_docs", "route_maps", "repo_files"],
      respondedBy: answeredBy,
      respondedAt: new Date().toISOString(),
      notes: answer
    };
  } else if (input.questionId === "must_have_flows") {
    next.goals = unique([...(next.goals ?? []), `Must-have flows or screens: ${answer}`]);
  } else if (input.questionId === "data_auth_boundary") {
    next.dataBoundary = {
      ...(next.dataBoundary ?? {}),
      ...inferBoundaryMode(answer)
    };
  } else if (input.questionId === "design_direction") {
    next.brand = {
      ...(next.brand ?? {}),
      tone: answer,
      attributes: unique([...(next.brand?.attributes ?? []), ...splitAnswerList(answer)])
    };
  } else if (input.questionId === "test_execution_permission") {
    next.testExecution = {
      ...(next.testExecution ?? {}),
      playwrightAllowed: positiveAnswer(answer) || /playwright/i.test(answer),
      commandsAllowed: positiveAnswer(answer) || /\b(command|run|ci|test)\b/i.test(answer),
      testTypes: unique([...(next.testExecution?.testTypes ?? []), ...testTypes(answer)]),
      notes: answer
    };
  } else if (input.questionId === "assumption_approval") {
    next.assumptionApproval = {
      ...(next.assumptionApproval ?? {}),
      approvedForDraft: positiveAnswer(answer),
      approvedBy: answeredBy,
      notes: answer
    };
  } else if (input.questionId === "safety_constraints") {
    next.safetyConstraints = unique([...(next.safetyConstraints ?? []), ...splitAnswerList(answer)]);
  }

  const after = assessContextGate(next);
  const clarificationTurn = buildClarificationTurnArtifact({
    contextMatrix: after.contextMatrix,
    questions: after.questions
  });
  return {
    status: after.status === "complete" ? "success" : "warning",
    updatedInput: next,
    answeredQuestion,
    readinessTier: after.readinessTier,
    contextStatus: after.status,
    nextQuestion: after.questions[0] ?? null,
    contextMatrix: after.contextMatrix,
    clarificationTurn
  };
}
