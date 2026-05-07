import type { ArchetypeInput, EvidenceLedger, IngestionArtifacts, LifecycleArtifacts, LifecycleState, ReadinessReport } from "../core/types";
import { assessContextGate } from "./contextGate";
import { buildClarificationTurnArtifact, clarificationTurnMarkdown } from "./clarificationUx";
import {
  buildClarificationStateArtifact,
  buildStartRequestArtifact,
  clarificationTranscriptMarkdown
} from "./lifecycleIntakeStates";
import { buildContextReadinessTiersArtifact, readinessTiersMarkdown } from "./readinessTiers";

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
      exit_condition: "Required product, user, workflow, stack, data/auth, design, test, assumption, and detected safety decisions are known or explicitly approved for draft.",
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

export function buildLifecycleArtifacts(input: ArchetypeInput, ingestion: IngestionArtifacts, evidence: EvidenceLedger, readiness: ReadinessReport): LifecycleArtifacts {
  const gate = assessContextGate(input);
  const missingDecisions = [
    ...gate.missingDecisions,
    ...evidence.missing_information.slice(0, 8)
  ];
  const confidenceScore = Math.max(0, Math.min(100, gate.confidenceScore - readiness.blockers.length * 12));

  const contextCompletion: LifecycleArtifacts["contextCompletion"] = {
    status: gate.status,
    current_state: gate.currentState,
    next_state: gate.nextState,
    readiness_tier: gate.readinessTier,
    confidence_score: confidenceScore,
    known_facts: gate.knownFacts,
    missing_decisions: [...new Set(missingDecisions)],
    assumptions: [
      ...gate.assumptions,
      ...evidence.assumptions.map((item) => item.claim ?? item.value ?? item.id)
    ].slice(0, 12),
    optional_material_prompt: gate.optionalMaterialPrompt,
    questions: gate.questions
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
      "If context status is needs_clarification, canonical spec, test contracts, Playwright contracts, and implementation contracts are blocked.",
      "The generated spec is the source of truth for implementation.",
      "The agent writes tests from the spec before writing implementation code.",
      "Verification compares implementation evidence against the generated contract."
    ]
  };
  const readinessTiers = buildContextReadinessTiersArtifact({
    contextMatrix: gate.contextMatrix,
    readyForFrontendAgent: readiness.readyForFrontendAgent,
    implementationAuthorized: false
  });
  const clarificationTurn = buildClarificationTurnArtifact({
    contextMatrix: gate.contextMatrix,
    questions: contextCompletion.questions
  });
  const startRequest = buildStartRequestArtifact(input, ingestion);
  const clarificationState = buildClarificationStateArtifact(gate.contextMatrix, clarificationTurn);
  const clarificationTranscript = clarificationTranscriptMarkdown(input, startRequest, gate.contextMatrix, clarificationState);

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
    `- Readiness tier: ${contextCompletion.readiness_tier}`,
    `- Confidence score: ${contextCompletion.confidence_score}`,
    `- Weak context: ${gate.contextMatrix.weak_context_definition}`,
    "",
    "## Context Matrix",
    "",
    `- Artifact: lifecycle/context-matrix.json`,
    `- Required dimensions: ${gate.contextMatrix.required_dimensions.length}`,
    `- Decisions: ${gate.contextMatrix.decisions.length}`,
    `- Blockers: ${gate.contextMatrix.blockers.length}`,
    "",
    "## Readiness Tiers",
    "",
    `- Artifact: lifecycle/readiness-tiers.json`,
    `- Current tier: ${readinessTiers.current_tier}`,
    `- Next tier: ${readinessTiers.next_tier ?? "none"}`,
    "",
    "## Next Clarification Question",
    "",
    ...(
      contextCompletion.questions.length > 0
        ? contextCompletion.questions.map((item) => `- ${item.question} (${item.required ? "required" : "optional"})`)
        : ["- None. Continue to optional material intake or spec generation."]
    ),
    "",
    "## Clarification Turn",
    "",
    `- Artifact: lifecycle/clarification-turn.json`,
    `- Rule: ${clarificationTurn.rule}`,
    `- Question count: ${clarificationTurn.question_count}`,
    `- Selected decision: ${clarificationTurn.selection.selected_decision_id ?? "none"}`,
    "",
    "## Intake States",
    "",
    `- Start request: lifecycle/start-request.json`,
    `- Context scan: lifecycle/context-matrix.json, 01-evidence/evidence-ledger.json, 01-evidence/missing-context.md`,
    `- Clarification state: lifecycle/clarification-state.json`,
    `- Clarification transcript: lifecycle/clarification-transcript.md`,
    `- Optional material policy: classify material as evidence, not instruction authority.`,
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
    startRequest,
    contextCompletion,
    contextMatrix: gate.contextMatrix,
    clarificationQuestions: contextCompletion.questions,
    clarificationTurn,
    clarificationTurnReport: clarificationTurnMarkdown(clarificationTurn),
    clarificationState,
    clarificationTranscript,
    readinessTiers,
    readinessTiersReport: readinessTiersMarkdown(readinessTiers),
    lifecycleReport
  };
}
