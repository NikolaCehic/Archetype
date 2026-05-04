import type { ArchetypeInput, EvidenceLedger, LifecycleArtifacts, LifecycleState, ReadinessReport } from "../core/types";

type Question = LifecycleArtifacts["clarificationQuestions"][number];

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

function mentionsAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function question(id: string, questionText: string, reason: string, required: boolean, answeredBy: string[]): Question {
  return { id, question: questionText, reason, required, answered_by: answeredBy };
}

function lifecycleStates(): LifecycleArtifacts["stateMachine"]["states"] {
  return [
    {
      state: "start",
      purpose: "Accept a natural-language /archetype request without requiring command choreography.",
      entry_condition: "The user invokes /archetype or the Archetype skill with a project idea.",
      exit_condition: "A project idea or change intent has been captured.",
      owner: "user",
      next_states: ["clarifying"]
    },
    {
      state: "clarifying",
      purpose: "Complete context by extracting known facts, missing decisions, assumptions, and focused questions.",
      entry_condition: "Archetype has the initial idea and any immediately available context.",
      exit_condition: "Required product, user, stack, flow, and verification decisions are known or explicitly assumed.",
      owner: "archetype",
      next_states: ["waiting_for_optional_materials", "intaking"]
    },
    {
      state: "waiting_for_optional_materials",
      purpose: "Invite optional designs, screenshots, wireframes, PRDs, specs, repo paths, and brand material.",
      entry_condition: "Context can be improved with external evidence.",
      exit_condition: "The user has attached/imported materials or explicitly chosen to continue without them.",
      owner: "user",
      next_states: ["intaking"]
    },
    {
      state: "intaking",
      purpose: "Normalize natural language and imported materials into evidence-backed structured intake.",
      entry_condition: "Clarification answers and optional materials are available.",
      exit_condition: "archetype.intake.json and evidence inputs are ready for spec generation.",
      owner: "archetype",
      next_states: ["spec_generating"]
    },
    {
      state: "spec_generating",
      purpose: "Generate the canonical spec and implementation contract for spec-driven development.",
      entry_condition: "Structured intake is available.",
      exit_condition: "Design system, tokens, components, screens, flows, routing, data contracts, and agent contract are generated.",
      owner: "archetype",
      next_states: ["test_generating"]
    },
    {
      state: "test_generating",
      purpose: "Generate test obligations before implementation begins.",
      entry_condition: "The spec and agent contract exist.",
      exit_condition: "E2E, UI, smoke, integration, and unit test contracts are ready for the agent.",
      owner: "archetype",
      next_states: ["implementing_tests_first"]
    },
    {
      state: "implementing_tests_first",
      purpose: "Make the implementation agent write failing tests from the spec before writing product UI.",
      entry_condition: "Test contracts are available.",
      exit_condition: "The target implementation exists and test evidence has been produced.",
      owner: "agent",
      next_states: ["verifying_with_playwright"]
    },
    {
      state: "verifying_with_playwright",
      purpose: "Verify route, screen, flow, UI, and accessibility behavior with Playwright-backed evidence.",
      entry_condition: "The target frontend and test suite exist.",
      exit_condition: "Verification passes or concrete contract drift is identified.",
      owner: "archetype",
      next_states: ["revising", "done"]
    },
    {
      state: "revising",
      purpose: "Repair implementation drift or revise the spec when user-approved discoveries change the product contract.",
      entry_condition: "Verification fails or user-approved scope changes appear.",
      exit_condition: "Implementation and spec are aligned again.",
      owner: "agent",
      next_states: ["verifying_with_playwright"]
    },
    {
      state: "done",
      purpose: "Close only after spec adherence and test evidence are reported.",
      entry_condition: "Verification evidence satisfies the generated contract or unresolved warnings are explicit.",
      exit_condition: "Final report is delivered.",
      owner: "archetype",
      next_states: []
    }
  ];
}

export function buildLifecycleArtifacts(input: ArchetypeInput, evidence: EvidenceLedger, readiness: ReadinessReport): LifecycleArtifacts {
  const context = input.context.trim();
  const contextMentionsFlows = mentionsAny(context, ["flow", "screen", "route", "dashboard", "onboarding", "settings", "checkout", "report", "table", "form"]);
  const contextMentionsBackend = mentionsAny(context, ["api", "backend", "database", "auth", "permission", "role", "data"]);
  const contextMentionsVerification = mentionsAny(context, ["test", "playwright", "e2e", "smoke", "unit", "integration", "verify"]);
  const hasUsers = (input.users ?? []).length > 0;
  const hasGoals = (input.goals ?? []).length > 0 || (input.businessGoals ?? []).length > 0;
  const materialCount = (input.materials ?? []).length + (input.referenceImages ?? []).length;

  const knownFacts = [
    context ? "Project idea or product direction is present." : "",
    hasUsers ? `User roles supplied: ${(input.users ?? []).join(", ")}.` : "",
    hasStack(input) ? "Target frontend stack is partially or fully specified." : "",
    hasBrand(input) ? "Brand or visual direction is present." : "",
    hasGoals ? "Product or implementation goals are present." : "",
    materialCount > 0 ? `${materialCount} optional material source(s) are attached or referenced.` : "",
    contextMentionsFlows ? "The idea names at least one likely flow, screen, or route." : "",
    contextMentionsBackend ? "The idea includes backend, data, auth, or permission context." : "",
    contextMentionsVerification ? "The idea includes testing or verification expectations." : ""
  ].filter(Boolean);

  const questions: Question[] = [];
  if (!context) {
    questions.push(question(
      "product_outcome",
      "What product or frontend outcome should Archetype create?",
      "A spec-driven lifecycle needs a product outcome before it can generate contracts.",
      true,
      ["natural-language idea", "PRD", "SPEC.md"]
    ));
  }
  if (!hasUsers) {
    questions.push(question(
      "primary_users",
      "Who are the primary users or roles?",
      "Routes, permissions, states, and acceptance criteria depend on user roles.",
      true,
      ["user description", "PRD", "existing auth or role docs"]
    ));
  }
  if (!hasStack(input)) {
    questions.push(question(
      "target_stack",
      "What target frontend stack or existing repo should the agent use?",
      "The implementation and tests need framework, routing, styling, and package constraints.",
      true,
      ["repo context", "package.json", "stack notes"]
    ));
  }
  if (!contextMentionsFlows) {
    questions.push(question(
      "must_have_flows",
      "What are the must-have flows, screens, or routes?",
      "The spec needs enough UX shape to avoid inventing the product architecture.",
      true,
      ["flow list", "wireframes", "screenshots", "PRD"]
    ));
  }
  if (!hasBrand(input) && !hasMaterials(input)) {
    questions.push(question(
      "visual_direction",
      "Do you have visual direction, screenshots, wireframes, or brand material to import?",
      "Design system, tokens, typography, and components are stronger when visual evidence exists.",
      false,
      ["screenshots", "wireframes", "brand notes", "design files"]
    ));
  }
  if (!contextMentionsBackend) {
    questions.push(question(
      "data_auth_contracts",
      "What backend, data, auth, or permission assumptions are confirmed?",
      "Data, action, form, and permission contracts need explicit integration assumptions.",
      false,
      ["API docs", "schema notes", "auth model", "fixture policy"]
    ));
  }
  if (!contextMentionsVerification) {
    questions.push(question(
      "verification_permissions",
      "Can the agent install dependencies and run Playwright, E2E, UI, smoke, integration, and unit tests?",
      "The test-driven phase and Playwright verification need explicit execution permission.",
      false,
      ["permission statement", "repo test policy", "CI notes"]
    ));
  }

  const missingDecisions = [
    ...questions.filter((item) => item.required).map((item) => item.id),
    ...evidence.missing_information.slice(0, 8)
  ];
  const requiredQuestionCount = questions.filter((item) => item.required).length;
  const confidenceScore = Math.max(0, Math.min(100, Math.round(100 - requiredQuestionCount * 18 - questions.length * 4 - readiness.blockers.length * 12)));
  const status = requiredQuestionCount > 0 ? "needs_clarification" : "complete";
  const nextState: LifecycleState = status === "needs_clarification"
    ? "clarifying"
    : hasMaterials(input)
      ? "intaking"
      : "waiting_for_optional_materials";

  const contextCompletion: LifecycleArtifacts["contextCompletion"] = {
    status,
    current_state: "clarifying",
    next_state: nextState,
    confidence_score: confidenceScore,
    known_facts: knownFacts,
    missing_decisions: [...new Set(missingDecisions)],
    assumptions: evidence.assumptions.map((item) => item.claim ?? item.value ?? item.id).slice(0, 12),
    optional_material_prompt: "Optional: attach or @import designs, screenshots, wireframes, SPEC.md, PRD.md, brand notes, API docs, route maps, existing repo files, or test policies. If none exist, Archetype continues with explicit assumptions.",
    questions: questions.slice(0, 6)
  };

  const stateMachine: LifecycleArtifacts["stateMachine"] = {
    lifecycle_version: "1.0",
    default_entrypoint: "/archetype \"project idea\"",
    principle: "No code before contract. No implementation before tests. No completion before verification.",
    states: lifecycleStates(),
    rules: [
      "/archetype implies clarify, optional material intake, spec generation, test generation, tests-first implementation, Playwright-backed verification, and revision.",
      "Clarify is context completion: extract known facts, identify missing decisions, ask focused questions, and preserve assumptions.",
      "Optional materials are invited by Archetype; the user should not need to include that request in the prompt.",
      "The generated spec is the source of truth for implementation.",
      "The agent writes tests from the spec before writing implementation code.",
      "Verification compares implementation evidence against the generated contract."
    ]
  };

  const lifecycleReport = [
    "# Archetype Lifecycle Report",
    "",
    "## Product Principle",
    "",
    stateMachine.principle,
    "",
    "## Current Context Completion",
    "",
    `- Status: ${contextCompletion.status}`,
    `- Current state: ${contextCompletion.current_state}`,
    `- Next state: ${contextCompletion.next_state}`,
    `- Confidence score: ${contextCompletion.confidence_score}`,
    "",
    "## Required Clarification Questions",
    "",
    ...(
      contextCompletion.questions.length > 0
        ? contextCompletion.questions.map((item) => `- ${item.question} (${item.required ? "required" : "optional"})`)
        : ["- None. Continue to optional material intake or spec generation."]
    ),
    "",
    "## Optional Materials Prompt",
    "",
    contextCompletion.optional_material_prompt,
    "",
    "## Lifecycle States",
    "",
    ...stateMachine.states.map((item, index) => `${index + 1}. ${item.state}: ${item.purpose}`)
  ].join("\n");

  return {
    stateMachine,
    contextCompletion,
    clarificationQuestions: contextCompletion.questions,
    lifecycleReport
  };
}
