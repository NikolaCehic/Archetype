import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prepareGeneratedOutputDirectory } from "../safety/pathSafety";
import type { ArchetypeInput } from "../core/types";
import type { ContextGateAssessment } from "../modules/contextGate";
import { buildClarificationTurnArtifact, clarificationTurnMarkdown } from "../modules/clarificationUx";
import { buildConvergenceStandardArtifact, convergenceStandardMarkdown } from "../modules/convergenceStandard";
import { buildClarificationEvidenceDecisionModelArtifact, evidenceDecisionModelMarkdown } from "../modules/evidenceDecisionModel";
import { buildForbiddenBehaviorAcceptanceArtifact, forbiddenBehaviorAcceptanceMarkdown } from "../modules/forbiddenBehaviorAcceptance";
import { buildImplementationPhasesArtifact, implementationPhasesMarkdown } from "../modules/implementationPhases";
import {
  buildClarificationEvidenceForInput,
  buildClarificationStateArtifact,
  buildStartRequestArtifact,
  clarificationTranscriptMarkdown,
  missingContextMarkdown
} from "../modules/lifecycleIntakeStates";
import { buildReadinessEvidence, NON_NEGOTIABLE_PRINCIPLES, nonNegotiablePrinciplesMarkdown } from "../modules/nonNegotiablePrinciples";
import { buildClarificationReadinessTiersArtifact, readinessTiersMarkdown } from "../modules/readinessTiers";

interface ClarificationArtifact {
  id: string;
  path: string;
  type: "json" | "markdown";
  required: boolean;
}

export interface ClarificationPackageExport {
  manifest: Record<string, unknown>;
  readiness: {
    score: number;
    readinessTier: string;
    readyForFrontendAgent: boolean;
    dimensions: Record<string, number>;
    blockers: string[];
    warnings: string[];
    requiredHumanReview: string[];
  };
  artifacts: ClarificationArtifact[];
}

function ensureDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(outDir: string, relativePath: string, value: unknown): void {
  const target = path.join(outDir, relativePath);
  ensureDir(target);
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(outDir: string, relativePath: string, value: string): void {
  const target = path.join(outDir, relativePath);
  ensureDir(target);
  writeFileSync(target, `${value.trimEnd()}\n`);
}

function productName(input: ArchetypeInput): string {
  return input.projectName?.trim() || "Archetype Clarification";
}

function buildStateMachine(assessment: ContextGateAssessment): Record<string, unknown> {
  return {
    lifecycle_version: "1.0",
    default_entrypoint: "/archetype \"project idea\"",
    principle: "No weak context before contract. No code before contract. No implementation before tests. No completion before verification.",
    current_state: assessment.currentState,
    next_state: assessment.nextState,
    readiness_tier: assessment.readinessTier,
    rules: [
      "Weak context stops before canonical spec generation.",
      "Clarification asks exactly one highest-impact question at a time.",
      "After the answer, Archetype updates the context matrix before asking another question or generating artifacts.",
      "The context matrix is the source of truth until enough context exists for a draft contract.",
      "Canonical spec, test-first contracts, Playwright contracts, and implementation contracts are not generated in a clarification package."
    ],
    states: [
      {
        state: "clarifying",
        purpose: "Complete context without inventing product, UX, stack, or verification decisions.",
        entry_condition: "The user supplied a project idea that lacks required implementation context.",
        exit_condition: "The next question has been answered and lifecycle/context-matrix.json has been updated.",
        owner: "archetype",
        next_states: ["clarifying", "waiting_for_optional_materials", "intaking"]
      },
      {
        state: "waiting_for_optional_materials",
        purpose: "Invite optional designs, screenshots, wireframes, PRDs, specs, repo paths, and brand material.",
        entry_condition: "Required context is sufficient for a draft and optional material may improve evidence.",
        exit_condition: "The user attaches material or explicitly proceeds without it.",
        owner: "user",
        next_states: ["intaking"]
      },
      {
        state: "intaking",
        purpose: "Normalize approved context and materials into evidence-backed structured intake.",
        entry_condition: "Required context has been approved enough for draft generation.",
        exit_condition: "Structured intake is ready for spec generation.",
        owner: "archetype",
        next_states: ["spec_generating"]
      }
    ]
  };
}

function buildLifecycleReport(input: ArchetypeInput, assessment: ContextGateAssessment): string {
  return [
    "# Archetype Clarification Report",
    "",
    "## Status",
    "",
    "- Status: needs_clarification",
    `- Readiness tier: ${assessment.readinessTier}`,
    `- Confidence score: ${assessment.confidenceScore}`,
    "- Full contract package generated: false",
    "",
    "## Source Context",
    "",
    input.context.trim() || "No context supplied.",
    "",
    "## Next Question",
    "",
    assessment.questions.length > 0
      ? assessment.questions.map((item) => `- ${item.question}`).join("\n")
      : "- None.",
    "",
    "## Context Matrix",
    "",
    "- Artifact: lifecycle/context-matrix.json",
    `- Decisions: ${assessment.contextMatrix.decisions.length}`,
    `- Blockers: ${assessment.contextMatrix.blockers.length}`,
    "",
    "## Blockers",
    "",
    ...assessment.blockers.map((blocker) => `- ${blocker}`),
    "",
    "## Not Generated",
    "",
    "- spec/archetype-spec.md",
    "- spec/archetype-spec.json",
    "- test-first/test-first-contract.json",
    "- verification/playwright-verification-contract.json",
    "- implementation-contract.md"
  ].join("\n");
}

function buildReadme(input: ArchetypeInput, assessment: ContextGateAssessment): string {
  return [
    `# ${productName(input)} Clarification Package`,
    "",
    "Archetype stopped because the provided context would require unapproved invention.",
    "",
    "## Start Here",
    "",
    "1. Read `lifecycle/lifecycle-report.md`.",
    "2. Read `lifecycle/context-matrix.json`.",
    "3. Read `governance/evidence-decision-model.json` to see which claims can become canonical.",
    "4. Read `governance/forbidden-behaviors.json` to see what Archetype refuses to do.",
    "5. Read `governance/convergence-standard.json` to see the hardened lifecycle no-answers.",
    "6. Read `lifecycle/clarification-turn.json`.",
    "7. Read `lifecycle/implementation-phases.json` to see why implementation is blocked.",
    "8. Answer only the single current question in `lifecycle/clarification-questions.json`.",
    "9. Use `archetype answer-clarification` or MCP tool `archetype_answer_clarification` to update the intake/context matrix from that answer.",
    "",
    "## Current Question",
    "",
    assessment.questions.length > 0
      ? assessment.questions.map((item) => `- ${item.question}`).join("\n")
      : "- None.",
    "",
    "## What Did Not Happen",
    "",
    "- No canonical spec was generated.",
    "- No test-first contract was generated.",
    "- No Playwright contract was generated.",
    "- No implementation contract was generated.",
    "- No app architecture was invented from weak context."
  ].join("\n");
}

export function exportClarificationPackage(
  input: ArchetypeInput,
  assessment: ContextGateAssessment,
  outDir: string,
  sourcePath?: string,
  options: { force?: boolean } = {}
): ClarificationPackageExport {
  prepareGeneratedOutputDirectory(outDir, { force: options.force === true });
  const { ingestion, evidence } = buildClarificationEvidenceForInput(input);

  const artifacts: ClarificationArtifact[] = [
    { id: "clarification-readme", path: "README.md", type: "markdown", required: true },
    { id: "manifest", path: "manifest.json", type: "json", required: true },
    { id: "implementation-readiness", path: "00-manifest/implementation-readiness.json", type: "json", required: true },
    { id: "lifecycle-state-machine", path: "lifecycle/state-machine.json", type: "json", required: true },
    { id: "start-request", path: "lifecycle/start-request.json", type: "json", required: true },
    { id: "context-completion", path: "lifecycle/context-completion.json", type: "json", required: true },
    { id: "context-matrix", path: "lifecycle/context-matrix.json", type: "json", required: true },
    { id: "readiness-tiers", path: "lifecycle/readiness-tiers.json", type: "json", required: true },
    { id: "readiness-tiers-report", path: "lifecycle/readiness-tiers.md", type: "markdown", required: true },
    { id: "implementation-phases", path: "lifecycle/implementation-phases.json", type: "json", required: true },
    { id: "implementation-phases-report", path: "lifecycle/implementation-phases.md", type: "markdown", required: true },
    { id: "clarification-turn", path: "lifecycle/clarification-turn.json", type: "json", required: true },
    { id: "clarification-turn-report", path: "lifecycle/clarification-turn.md", type: "markdown", required: true },
    { id: "clarification-state", path: "lifecycle/clarification-state.json", type: "json", required: true },
    { id: "clarification-transcript", path: "lifecycle/clarification-transcript.md", type: "markdown", required: true },
    { id: "clarification-questions", path: "lifecycle/clarification-questions.json", type: "json", required: true },
    { id: "lifecycle-report", path: "lifecycle/lifecycle-report.md", type: "markdown", required: true },
    { id: "evidence-ledger", path: "01-evidence/evidence-ledger.json", type: "json", required: true },
    { id: "missing-context", path: "01-evidence/missing-context.md", type: "markdown", required: true },
    { id: "non-negotiable-principles", path: "governance/non-negotiable-principles.json", type: "json", required: true },
    { id: "non-negotiable-principles-report", path: "governance/non-negotiable-principles.md", type: "markdown", required: true },
    { id: "evidence-decision-model", path: "governance/evidence-decision-model.json", type: "json", required: true },
    { id: "evidence-decision-model-report", path: "governance/evidence-decision-model.md", type: "markdown", required: true },
    { id: "forbidden-behaviors", path: "governance/forbidden-behaviors.json", type: "json", required: true },
    { id: "forbidden-behaviors-report", path: "governance/forbidden-behaviors.md", type: "markdown", required: true },
    { id: "convergence-standard", path: "governance/convergence-standard.json", type: "json", required: true },
    { id: "convergence-standard-report", path: "governance/convergence-standard.md", type: "markdown", required: true }
  ];
  const readinessEvidence = buildReadinessEvidence({
    readinessScore: Math.min(assessment.confidenceScore, 49),
    readinessTier: "ready_for_clarification",
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    contextStatus: assessment.status
  });
  const readiness = {
    score: Math.min(assessment.confidenceScore, 49),
    readinessTier: "ready_for_clarification",
    readyForFrontendAgent: false,
    dimensions: {
      context_sufficiency: Math.min(assessment.confidenceScore, 49)
    },
    blockers: assessment.blockers,
    warnings: assessment.warnings,
    requiredHumanReview: ["Answer the current clarification question before contract generation."]
  };
  const contextCompletion = {
    status: assessment.status,
    current_state: assessment.currentState,
    next_state: assessment.nextState,
    readiness_tier: "ready_for_clarification",
    confidence_score: readiness.score,
    known_facts: assessment.knownFacts,
    missing_decisions: assessment.missingDecisions,
    assumptions: assessment.assumptions,
    optional_material_prompt: assessment.optionalMaterialPrompt,
    questions: assessment.questions
  };
  const manifest = {
    schemaVersion: "0.1.0",
    packageType: "clarification",
    status: "needs_clarification",
    generatedAt: new Date().toISOString(),
    productName: productName(input),
    sourcePath,
    readinessScore: readiness.score,
    readinessTier: readiness.readinessTier,
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    readinessEvidence,
    blockers: assessment.blockers,
    warnings: assessment.warnings,
    artifacts
  };
  const nonNegotiablePrinciples = {
    artifact_version: "1.0",
    source_scope: "HL-01",
    status: "blocked",
    implementation_authorized: false,
    principles: NON_NEGOTIABLE_PRINCIPLES.map((principle, index) => ({
      id: `HL01-P${String(index + 1).padStart(2, "0")}`,
      principle
    })),
    gates: [
      {
        id: "HL01-P01",
        principle: NON_NEGOTIABLE_PRINCIPLES[0],
        enforcement: "hard_gate",
        status: "blocked",
        artifacts: ["lifecycle/context-completion.json", "lifecycle/context-matrix.json"],
        details: "Canonical contract generation is blocked until context is sufficient."
      },
      {
        id: "HL01-P02",
        principle: NON_NEGOTIABLE_PRINCIPLES[1],
        enforcement: "hard_gate",
        status: "blocked",
        artifacts: ["lifecycle/context-completion.json", "lifecycle/context-matrix.json"],
        details: "Spec generation is blocked by context sufficiency."
      },
      {
        id: "HL01-P07",
        principle: NON_NEGOTIABLE_PRINCIPLES[6],
        enforcement: "validator",
        status: assessment.questions.length <= 1 ? "pass" : "fail",
        artifacts: ["lifecycle/clarification-turn.json", "lifecycle/clarification-questions.json"],
        details: "Clarification exposes one current question."
      }
    ],
    readiness_evidence: readinessEvidence,
    blockers: assessment.blockers,
    failures: []
  };
  const evidenceDecisionModel = buildClarificationEvidenceDecisionModelArtifact({
    contextMatrix: assessment.contextMatrix
  });
  const forbiddenBehaviorAcceptance = buildForbiddenBehaviorAcceptanceArtifact();
  const convergenceStandard = buildConvergenceStandardArtifact({
    packageType: "clarification",
    contextStatus: assessment.status,
    readinessTier: "ready_for_clarification",
    readyForFrontendAgent: false,
    implementationAuthorized: false
  });
  const readinessTiers = buildClarificationReadinessTiersArtifact({
    contextMatrix: assessment.contextMatrix,
    readyForFrontendAgent: false,
    implementationAuthorized: false
  });
  const implementationPhases = buildImplementationPhasesArtifact({
    packageType: "clarification",
    contextStatus: assessment.status,
    readinessTier: "ready_for_clarification",
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    contractApprovalStatus: "not_started"
  });
  const clarificationTurn = buildClarificationTurnArtifact({
    contextMatrix: assessment.contextMatrix,
    questions: assessment.questions
  });
  const startRequest = buildStartRequestArtifact(input, ingestion);
  const clarificationState = buildClarificationStateArtifact(assessment.contextMatrix, clarificationTurn);

  writeText(outDir, "README.md", buildReadme(input, assessment));
  writeJson(outDir, "manifest.json", manifest);
  writeJson(outDir, "00-manifest/implementation-readiness.json", readiness);
  writeJson(outDir, "lifecycle/state-machine.json", buildStateMachine(assessment));
  writeJson(outDir, "lifecycle/start-request.json", startRequest);
  writeJson(outDir, "lifecycle/context-completion.json", contextCompletion);
  writeJson(outDir, "lifecycle/context-matrix.json", assessment.contextMatrix);
  writeJson(outDir, "lifecycle/readiness-tiers.json", readinessTiers);
  writeText(outDir, "lifecycle/readiness-tiers.md", readinessTiersMarkdown(readinessTiers));
  writeJson(outDir, "lifecycle/implementation-phases.json", implementationPhases);
  writeText(outDir, "lifecycle/implementation-phases.md", implementationPhasesMarkdown(implementationPhases));
  writeJson(outDir, "lifecycle/clarification-turn.json", clarificationTurn);
  writeText(outDir, "lifecycle/clarification-turn.md", clarificationTurnMarkdown(clarificationTurn));
  writeJson(outDir, "lifecycle/clarification-state.json", clarificationState);
  writeText(outDir, "lifecycle/clarification-transcript.md", clarificationTranscriptMarkdown(input, startRequest, assessment.contextMatrix, clarificationState));
  writeJson(outDir, "lifecycle/clarification-questions.json", assessment.questions);
  writeText(outDir, "lifecycle/lifecycle-report.md", buildLifecycleReport(input, assessment));
  writeJson(outDir, "01-evidence/evidence-ledger.json", evidence);
  writeText(outDir, "01-evidence/missing-context.md", missingContextMarkdown(evidence, assessment.contextMatrix));
  writeJson(outDir, "governance/non-negotiable-principles.json", nonNegotiablePrinciples);
  writeText(outDir, "governance/non-negotiable-principles.md", nonNegotiablePrinciplesMarkdown(nonNegotiablePrinciples));
  writeJson(outDir, "governance/evidence-decision-model.json", evidenceDecisionModel);
  writeText(outDir, "governance/evidence-decision-model.md", evidenceDecisionModelMarkdown(evidenceDecisionModel));
  writeJson(outDir, "governance/forbidden-behaviors.json", forbiddenBehaviorAcceptance);
  writeText(outDir, "governance/forbidden-behaviors.md", forbiddenBehaviorAcceptanceMarkdown(forbiddenBehaviorAcceptance));
  writeJson(outDir, "governance/convergence-standard.json", convergenceStandard);
  writeText(outDir, "governance/convergence-standard.md", convergenceStandardMarkdown(convergenceStandard));

  return {
    manifest,
    readiness,
    artifacts
  };
}
