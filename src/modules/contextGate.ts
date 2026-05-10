import type { ArchetypeInput, EvidenceLevel, LifecycleArtifacts, LifecycleState, ReadinessTier } from "../core/types";
import { evidenceLevelCanBecomeCanonical } from "./evidenceDecisionModel";

type Question = LifecycleArtifacts["clarificationQuestions"][number];

export type ContextDecisionStatus = "confirmed" | "candidate" | "missing" | "conflicted" | "blocked";
export type ContextReadinessTier = ReadinessTier;

export const REQUIRED_CONTEXT_DIMENSIONS = [
  "product_outcome",
  "primary_users",
  "source_materials_review",
  "must_have_flows",
  "target_stack",
  "data_auth_boundary",
  "design_direction",
  "test_execution_permission",
  "assumption_approval",
  "safety_constraints"
] as const;

export const READINESS_TIERS: ReadinessTier[] = [
  "ready_for_clarification",
  "ready_for_contract_draft",
  "ready_for_contract_approval",
  "ready_for_test_authoring",
  "ready_for_implementation",
  "ready_for_qa",
  "ready_for_completion"
];

export const WEAK_CONTEXT_DEFINITION = "The next artifact would depend on unapproved invention.";
export const HL04_CLARIFICATION_RULE = "Clarification is not a bulk form.";
export const HL04_SELECTION_RULE = "Select the highest-impact missing or conflicted blocker from the context matrix.";
export const DEFAULT_MARKETING_DASHBOARD_QUESTION = "Who is the primary user of this marketing admin dashboard?";

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

export interface ContextMatrixDecision {
  id: string;
  dimension: string;
  label: string;
  status: ContextDecisionStatus;
  required: boolean;
  impact: "critical" | "high" | "medium" | "low";
  evidence_level: EvidenceLevel;
  can_become_canonical: boolean;
  evidence: string[];
  reason: string;
  source_refs: string[];
  question?: Question;
}

export interface ContextMatrix {
  matrix_version: "1.0";
  source_scope: "HL-03";
  purpose: string;
  weak_context_definition: string;
  status: "complete" | "needs_clarification";
  readiness_tier: ContextReadinessTier;
  next_lifecycle_state: LifecycleState;
  required_dimensions: string[];
  readiness_tiers: ReadinessTier[];
  decisions: ContextMatrixDecision[];
  next_question: Question | null;
  blockers: string[];
  warnings: string[];
}

export interface ContextGateAssessment {
  status: "complete" | "needs_clarification";
  currentState: LifecycleState;
  nextState: LifecycleState;
  readinessTier: ContextReadinessTier;
  confidenceScore: number;
  knownFacts: string[];
  missingDecisions: string[];
  assumptions: string[];
  optionalMaterialPrompt: string;
  questions: Question[];
  contextMatrix: ContextMatrix;
  blockers: string[];
  warnings: string[];
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasStack(input: ArchetypeInput): boolean {
  return Boolean(input.stack && [input.stack.framework, input.stack.language, input.stack.styling, input.stack.routing].some(hasText));
}

function hasBrand(input: ArchetypeInput): boolean {
  return Boolean(input.brand && ([input.brand.tone, input.brand.primaryColor].some(hasText) || (input.brand.attributes ?? []).length > 0));
}

function hasMaterials(input: ArchetypeInput): boolean {
  return (input.materials ?? []).length > 0 || (input.referenceImages ?? []).length > 0;
}

function hasMaterialIntakeDecision(input: ArchetypeInput, context: string): boolean {
  if (hasMaterials(input)) return true;
  const status = input.materialIntake?.status;
  if (status === "provided" || status === "none") return true;
  return mentionsAny(context, [
    "no spec",
    "no sop",
    "no prd",
    "no design doc",
    "no design docs",
    "no screenshots",
    "no wireframes",
    "no api docs",
    "no route map",
    "no existing docs",
    "no existing documentation",
    "no source materials",
    "no materials",
    "i do not have docs",
    "i don't have docs",
    "nothing to attach"
  ]);
}

function hasExplicitFlowShape(context: string): boolean {
  return mentionsAny(context, [
    "flow",
    "workflow",
    "screen",
    "screens",
    "route",
    "routes",
    "user journey",
    "onboarding",
    "settings",
    "checkout",
    "report builder",
    "table",
    "form",
    "wizard",
    "editor",
    "kanban",
    "calendar"
  ]);
}

function hasExplicitDataBoundaryText(context: string): boolean {
  return mentionsAny(context, [
    "mock data",
    "mocked data",
    "mock fixtures",
    "fixture data",
    "fixtures for",
    "deterministic fixtures",
    "deterministic data",
    "use mock",
    "local mock",
    "no backend",
    "no production backend",
    "existing api",
    "backend api",
    "api integration",
    "use api",
    "real api",
    "target repo",
    "existing repo",
    "repository data",
    "database-backed",
    "connect to database",
    "mock auth",
    "mock authenticated",
    "auth boundary",
    "role-based access",
    "rbac",
    "permissions represented",
    "permission model"
  ]);
}

function hasDataBoundary(input: ArchetypeInput, context: string): boolean {
  const boundary = input.dataBoundary;
  return Boolean(
    boundary && [boundary.mode, boundary.dataSource, boundary.auth, boundary.permissions, boundary.notes].some(hasText)
  ) || hasExplicitDataBoundaryText(context);
}

function hasTestExecutionPermission(input: ArchetypeInput, context: string): boolean {
  return input.testExecution?.playwrightAllowed === true
    || input.testExecution?.commandsAllowed === true
    || (input.testExecution?.testTypes ?? []).length > 0
    || mentionsAny(context, [
      "allow playwright",
      "use playwright",
      "run playwright",
      "playwright-backed",
      "verify with playwright",
      "run tests",
      "run the tests",
      "write tests",
      "generate tests",
      "require tests",
      "test-first",
      "tests first",
      "smoke test",
      "e2e test",
      "end-to-end test",
      "unit test",
      "integration test",
      "ui test",
      "accessibility test"
    ]);
}

function hasAssumptionApproval(input: ArchetypeInput, context: string): boolean {
  return input.assumptionApproval?.approvedForDraft === true
    || mentionsAny(context, ["approve assumptions", "approved assumptions", "permission to create assumptions", "you may propose assumptions", "assumptions for draft"]);
}

function hasSafetyConstraints(input: ArchetypeInput, context: string): boolean {
  return (input.safetyConstraints ?? []).length > 0
    || mentionsAny(context, ["no compliance claims", "human review", "privacy", "pii", "sensitive data", "regulated", "compliance", "wcag", "accessibility review"]);
}

function safetyDetected(input: ArchetypeInput): boolean {
  const materialText = (input.materials ?? [])
    .map((material) => [material.label, material.content, material.notes, material.path].filter(Boolean).join(" "))
    .join(" ");
  const context = `${input.context} ${materialText}`;
  return mentionsAny(context, [
    "healthcare",
    "patient",
    "clinical",
    "medication",
    "fintech",
    "financial",
    "payment",
    "invoice",
    "billing",
    "wallet",
    "crypto",
    "payout",
    "trust and safety",
    "regulated",
    "compliance",
    "pii",
    "api key",
    "password",
    "secret",
    "token"
  ]);
}

function mentionsAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function answerTarget(id: string, intakeFields: string[]): Question["answer_target"] {
  return {
    intake_fields: intakeFields,
    context_matrix_decision_id: id,
    update_strategy: "Store the user's answer as explicit user evidence, update the named intake field, rebuild the context matrix, and select the next highest-impact blocker.",
    canonicalization_rule: "The answer can become canonical only after the context matrix marks the decision confirmed or the user later approves the candidate assumption."
  };
}

function question(
  id: string,
  questionText: string,
  reason: string,
  required: boolean,
  answeredBy: string[],
  impact: Question["impact"],
  intakeFields: string[]
): Question {
  return {
    id,
    question: questionText,
    reason,
    required,
    answered_by: answeredBy,
    source_scope: "HL-04",
    selection_rule: HL04_SELECTION_RULE,
    impact,
    selected_decision_id: id,
    answer_target: answerTarget(id, intakeFields),
    after_answer: {
      action: "Update the context matrix from this answer before asking another question or generating artifacts.",
      repeat_until: "No required context decision is missing, conflicted, or blocked.",
      final_pre_contract_step: "Present assumptions and candidate decisions for approval before generating the canonical contract."
    }
  };
}

function marketingAdminQuestion(context: string): string {
  return mentionsAny(context, ["marketing", "campaign"])
    ? DEFAULT_MARKETING_DASHBOARD_QUESTION
    : "Who are the primary users or roles?";
}

function decision(
  id: string,
  dimension: string,
  label: string,
  status: ContextDecisionStatus,
  required: boolean,
  impact: ContextMatrixDecision["impact"],
  evidenceLevel: EvidenceLevel,
  evidence: string[],
  reason: string,
  sourceRefs: string[],
  nextQuestion?: Question
): ContextMatrixDecision {
  return {
    id,
    dimension,
    label,
    status,
    required,
    impact,
    evidence_level: evidenceLevel,
    can_become_canonical: evidenceLevelCanBecomeCanonical(evidenceLevel),
    evidence,
    reason,
    source_refs: sourceRefs,
    ...(nextQuestion ? { question: nextQuestion } : {})
  };
}

function firstQuestion(decisions: ContextMatrixDecision[]): Question | null {
  const order: Record<ContextMatrixDecision["impact"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  };
  const blocker = decisions
    .filter((item) => item.required && ["missing", "conflicted", "blocked"].includes(item.status) && item.question)
    .sort((a, b) => {
      const impactOrder = order[a.impact] - order[b.impact];
      if (impactOrder !== 0) return impactOrder;
      return (DECISION_PRIORITY[a.id] ?? 99) - (DECISION_PRIORITY[b.id] ?? 99);
    })[0];
  return blocker?.question ?? null;
}

export function assessContextGate(input: ArchetypeInput): ContextGateAssessment {
  const context = input.context.trim();
  const users = input.users ?? [];
  const hasUsers = users.length > 0;
  const contextMentionsFlows = hasExplicitFlowShape(context);
  const contextMentionsVisualDirection = mentionsAny(context, ["premium", "dark", "light", "dense", "polished", "brand", "monochrome", "enterprise", "playful", "minimal"]);
  const materialCount = (input.materials ?? []).length + (input.referenceImages ?? []).length;
  const materialStatus = input.materialIntake?.status;
  const materialDecisionKnown = hasMaterialIntakeDecision(input, context);
  const materialDecisionStatus: ContextDecisionStatus = materialDecisionKnown ? "confirmed" : materialStatus === "pending" ? "blocked" : "missing";
  const boundaryKnown = hasDataBoundary(input, context);
  const testPermissionKnown = hasTestExecutionPermission(input, context);
  const assumptionApprovalKnown = hasAssumptionApproval(input, context);
  const safetyIsDetected = safetyDetected(input);
  const safetyKnown = !safetyIsDetected || hasSafetyConstraints(input, context);

  const productOutcomeQuestion = question(
    "product_outcome",
    "What product or frontend outcome should Archetype create?",
    "A spec-driven lifecycle needs a product outcome before it can generate contracts.",
    true,
    ["natural-language idea", "PRD", "SPEC.md"],
    "critical",
    ["context", "goals"]
  );
  const usersQuestion = question(
    "primary_users",
    marketingAdminQuestion(context),
    "Routes, permissions, states, and acceptance criteria depend on user roles.",
    true,
    ["user description", "PRD", "existing auth or role docs"],
    "critical",
    ["users", "context"]
  );
  const stackQuestion = question(
    "target_stack",
    "What target frontend stack or existing repo should the agent use?",
    "The implementation and tests need framework, routing, styling, and package constraints.",
    true,
    ["repo context", "package.json", "stack notes"],
    "critical",
    ["stack", "materials", "context"]
  );
  const sourceMaterialsQuestion = question(
    "source_materials_review",
    materialStatus === "pending"
      ? "Please attach or @mention the SPEC, SOP, PRD, screenshots, wireframes, design docs, API docs, route maps, or repo files now, or say Archetype should proceed without source materials."
      : "Do you have any SPEC, SOP, PRD, screenshots, wireframes, design docs, API docs, route maps, or repo files to attach, or should Archetype proceed without source materials?",
    "Archetype needs a deliberate source-material decision before it can treat missing documentation as permission to draft assumptions.",
    true,
    ["SPEC.md", "SOP", "PRD", "screenshots", "wireframes", "design docs", "API docs", "route maps", "repo files", "explicit none"],
    "critical",
    ["materialIntake", "materials", "referenceImages", "context"]
  );
  const flowsQuestion = question(
    "must_have_flows",
    "What are the must-have flows, screens, or routes?",
    "The spec needs enough UX shape to avoid inventing the product architecture.",
    true,
    ["flow list", "wireframes", "screenshots", "PRD"],
    "critical",
    ["context", "materials", "goals"]
  );
  const dataBoundaryQuestion = question(
    "data_auth_boundary",
    "Should Archetype use mock data, an existing API, or a target repo for data, auth, and permissions?",
    "Data operations, forms, permissions, fixtures, and tests cannot be canonical if the data/auth boundary is invented.",
    true,
    ["mock/API decision", "backend notes", "repo context", "auth docs"],
    "critical",
    ["dataBoundary", "context", "materials"]
  );
  const designDirectionQuestion = question(
    "design_direction",
    "Should Archetype follow supplied design material or create a design direction for the draft?",
    "Design tokens, typography, components, and layout rules need either evidence or explicit permission to propose a direction.",
    true,
    ["brand notes", "screenshots", "wireframes", "permission to create a design direction"],
    "high",
    ["brand", "materials", "context"]
  );
  const testExecutionQuestion = question(
    "test_execution_permission",
    "May Archetype require Playwright, E2E, UI, smoke, integration, and unit tests for this frontend?",
    "The lifecycle is test-driven; test obligations must be explicitly allowed before they become contract requirements.",
    true,
    ["testing policy", "permission to run tests", "CI notes"],
    "high",
    ["testExecution", "context"]
  );
  const assumptionApprovalQuestion = question(
    "assumption_approval",
    "May Archetype propose candidate assumptions for a draft while keeping them non-canonical until you approve them?",
    "A draft can proceed only when the user allows candidate assumptions to remain visibly non-canonical.",
    true,
    ["assumption approval", "human approval", "revision policy"],
    "high",
    ["assumptionApproval", "context"]
  );
  const safetyQuestion = question(
    "safety_constraints",
    "What safety, compliance, regulated-data, or sensitive-data constraints should Archetype enforce?",
    "The product appears to involve safety, regulated, compliance, or sensitive-data concerns.",
    true,
    ["safety constraints", "compliance notes", "privacy policy", "human review requirements"],
    "critical",
    ["safetyConstraints", "context", "materials"]
  );

  const decisions = [
    decision(
      "product_outcome",
      "Product outcome",
      "Product or frontend outcome",
      context ? "confirmed" : "missing",
      true,
      "critical",
      context ? "explicit_user_answer" : "unknown",
      context ? [`User supplied product context: ${context}`] : [],
      context ? "The initial request contains a product direction." : "No product direction was supplied.",
      context ? ["source_user_context"] : [],
      context ? undefined : productOutcomeQuestion
    ),
    decision(
      "primary_users",
      "Primary users and roles",
      "Primary users or roles",
      hasUsers ? "confirmed" : "missing",
      true,
      "critical",
      hasUsers ? "explicit_user_answer" : "unknown",
      hasUsers ? [`User roles supplied: ${users.join(", ")}.`] : [],
      hasUsers ? "Explicit users are available." : "Audience words in a prompt are not enough to confirm implementation roles.",
      hasUsers ? ["source_user_roles"] : [],
      hasUsers ? undefined : usersQuestion
    ),
    decision(
      "target_stack",
      "Target repo or frontend stack",
      "Frontend stack or existing repo",
      hasStack(input) ? "confirmed" : "missing",
      true,
      "critical",
      hasStack(input) ? "explicit_user_answer" : "unknown",
      hasStack(input) ? ["Target frontend stack is partially or fully specified."] : [],
      hasStack(input) ? "The implementation host has enough stack direction to draft contracts." : "Without a stack or repo, implementation contracts depend on invention.",
      hasStack(input) ? ["source_stack"] : [],
      hasStack(input) ? undefined : stackQuestion
    ),
    decision(
      "source_materials_review",
      "Source materials, documentation, or explicit no-materials decision",
      "SPEC/SOP/PRD/design/API/route/repo material intake",
      materialDecisionStatus,
      true,
      "critical",
      materialDecisionKnown
        ? hasMaterials(input)
          ? "imported_material_fact"
          : "explicit_user_answer"
        : "unknown",
      materialDecisionKnown
        ? hasMaterials(input)
          ? [`${materialCount} source material or reference image item(s) supplied.`]
          : ["User explicitly chose to proceed without attaching source materials."]
        : materialStatus === "pending"
          ? ["User indicated source materials may exist, but none have been ingested yet."]
        : [],
      materialDecisionKnown
        ? "The lifecycle has an explicit source-material boundary."
        : materialStatus === "pending"
          ? "Archetype is waiting for the user to attach or @mention source materials, or explicitly proceed without them."
        : "Without asking for source materials or an explicit none, the draft may miss authoritative SPEC, SOP, PRD, design, API, route, or repo context.",
      materialDecisionKnown
        ? hasMaterials(input) ? ["source_materials"] : ["source_user_context"]
        : materialStatus === "pending" ? ["source_user_context"]
        : [],
      materialDecisionKnown ? undefined : sourceMaterialsQuestion
    ),
    decision(
      "must_have_flows",
      "Must-have workflows or screens",
      "Must-have flows, screens, or routes",
      contextMentionsFlows ? "confirmed" : "missing",
      true,
      "critical",
      contextMentionsFlows ? "explicit_user_answer" : "unknown",
      contextMentionsFlows ? ["The idea names at least one likely flow, screen, route, or workflow surface."] : [],
      contextMentionsFlows ? "There is at least one UX anchor." : "Without workflow or screen anchors, product architecture would be invented.",
      contextMentionsFlows ? ["source_user_context"] : [],
      contextMentionsFlows ? undefined : flowsQuestion
    ),
    decision(
      "data_auth_boundary",
      "Mock, API, data, auth, and permission boundary",
      "Data and permission boundary",
      boundaryKnown ? "confirmed" : "missing",
      true,
      "critical",
      boundaryKnown ? "explicit_user_answer" : "unknown",
      boundaryKnown ? ["Data, mock/API, auth, or permission boundary is explicitly present."] : [],
      boundaryKnown ? "The boundary can be reflected into later contracts." : "The next contract artifact would invent data, auth, permission, or fixture behavior.",
      boundaryKnown ? ["source_user_context", ...(input.dataBoundary ? ["source_data_boundary"] : [])] : [],
      boundaryKnown ? undefined : dataBoundaryQuestion
    ),
    decision(
      "design_direction",
      "Design direction or permission to create one",
      "Visual direction",
      hasBrand(input) || hasMaterials(input) || contextMentionsVisualDirection ? "confirmed" : "missing",
      true,
      "high",
      hasMaterials(input)
        ? "imported_material_fact"
        : hasBrand(input) || contextMentionsVisualDirection
          ? "explicit_user_answer"
          : "archetype_inference",
      [
        ...(hasBrand(input) ? ["Brand or visual direction is present."] : []),
        ...(materialCount > 0 ? [`${materialCount} optional material source(s) are attached or referenced.`] : []),
        ...(contextMentionsVisualDirection ? ["The idea includes visual direction words."] : [])
      ],
      hasBrand(input) || hasMaterials(input) || contextMentionsVisualDirection
        ? "There is some design evidence or visual permission."
        : "Later scopes must ask for material or permission before canonical design decisions.",
      [...(hasBrand(input) ? ["source_brand"] : []), ...(hasMaterials(input) ? ["source_materials"] : []), ...(contextMentionsVisualDirection ? ["source_user_context"] : [])],
      hasBrand(input) || hasMaterials(input) || contextMentionsVisualDirection ? undefined : designDirectionQuestion
    ),
    decision(
      "test_execution_permission",
      "Test and Playwright execution permission",
      "Test execution permission",
      testPermissionKnown ? "confirmed" : "missing",
      true,
      "high",
      testPermissionKnown ? "explicit_user_answer" : "unknown",
      testPermissionKnown ? ["Playwright or test execution permission is present."] : [],
      testPermissionKnown ? "Verification expectations are present." : "The next test artifact would impose unapproved execution requirements.",
      testPermissionKnown ? ["source_user_context", ...(input.testExecution ? ["source_test_execution"] : [])] : [],
      testPermissionKnown ? undefined : testExecutionQuestion
    ),
    decision(
      "assumption_approval",
      "Assumption approval",
      "Approval of candidate assumptions",
      assumptionApprovalKnown ? "confirmed" : "missing",
      true,
      "high",
      assumptionApprovalKnown ? "explicit_user_answer" : "unknown",
      assumptionApprovalKnown ? ["The user allowed candidate assumptions for draft or supplied human approval."] : [],
      assumptionApprovalKnown ? "Candidate assumptions may exist as non-canonical draft evidence." : "The next artifact would depend on assumptions the user has not allowed.",
      assumptionApprovalKnown ? ["source_assumption_approval"] : [],
      assumptionApprovalKnown ? undefined : assumptionApprovalQuestion
    ),
    decision(
      "safety_constraints",
      "Safety, regulated, compliance, or sensitive-data constraints",
      "Safety and sensitive-data constraints",
      safetyIsDetected ? safetyKnown ? "confirmed" : "missing" : "candidate",
      safetyIsDetected,
      "critical",
      safetyKnown
        ? safetyIsDetected
          ? "explicit_user_answer"
          : "archetype_inference"
        : "unknown",
      safetyKnown
        ? safetyIsDetected
          ? [`Safety constraints supplied: ${(input.safetyConstraints ?? []).join("; ") || "present in context."}`]
          : ["No safety, regulated, compliance, or sensitive-data trigger was detected."]
        : [],
      safetyKnown
        ? safetyIsDetected
          ? "Detected safety or sensitive-data concerns have explicit constraints."
          : "Safety constraints are not required because no trigger was detected."
        : "Detected safety or sensitive-data concerns require explicit constraints before drafting.",
      safetyKnown ? [...((input.safetyConstraints ?? []).length > 0 ? ["source_safety_constraints"] : []), "source_user_context"] : [],
      safetyKnown ? undefined : safetyQuestion
    )
  ];

  const missingRequired = decisions.filter((item) => item.required && ["missing", "conflicted", "blocked"].includes(item.status));
  const nextQuestion = firstQuestion(decisions);
  const status = missingRequired.length > 0 ? "needs_clarification" : "complete";
  const readinessTier: ContextReadinessTier = status === "needs_clarification" ? "ready_for_clarification" : "ready_for_contract_draft";
  const nextState: LifecycleState = status === "needs_clarification"
    ? "clarifying"
    : hasMaterials(input)
      ? "intaking"
      : "waiting_for_optional_materials";
  const blockers = missingRequired.map((item) => `HL-03 context sufficiency gate blocked full generation: missing ${item.label}.`);
  if (status === "needs_clarification") {
    blockers.push("Full contract generation stopped before canonical spec, test-first contracts, Playwright contracts, or implementation contracts were generated.");
  }

  const warnings = decisions
    .filter((item) => item.required && item.status === "candidate")
    .map((item) => `Candidate decision needs later approval: ${item.label}.`);
  const knownFacts = decisions
    .filter((item) => item.status === "confirmed")
    .flatMap((item) => item.evidence);
  const missingDecisions = decisions
    .filter((item) => ["missing", "conflicted", "blocked"].includes(item.status))
    .map((item) => item.id);
  const assumptions = decisions
    .filter((item) => item.status === "candidate")
    .map((item) => `${item.id}: ${item.reason}`);
  const confidenceScore = Math.max(0, Math.min(100, Math.round(100 - missingRequired.length * 25 - warnings.length * 4)));
  const contextMatrix: ContextMatrix = {
    matrix_version: "1.0",
    source_scope: "HL-03",
    purpose: "Define whether Archetype may proceed without making the next artifact depend on unapproved invention.",
    weak_context_definition: WEAK_CONTEXT_DEFINITION,
    status,
    readiness_tier: readinessTier,
    next_lifecycle_state: nextState,
    required_dimensions: [...REQUIRED_CONTEXT_DIMENSIONS],
    readiness_tiers: READINESS_TIERS,
    decisions,
    next_question: nextQuestion,
    blockers,
    warnings
  };

  return {
    status,
    currentState: "clarifying",
    nextState,
    readinessTier,
    confidenceScore,
    knownFacts,
    missingDecisions,
    assumptions,
    optionalMaterialPrompt: "Attach or @import any SPEC.md, SOP, PRD.md, screenshots, wireframes, design docs, brand notes, API docs, route maps, existing repo files, or test policies. If none exist, answer that Archetype should proceed without source materials; that choice is recorded as explicit context.",
    questions: nextQuestion ? [nextQuestion] : [],
    contextMatrix,
    blockers,
    warnings
  };
}
