import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ArchetypePackage } from "../core/types";
import { buildConvergenceStandardArtifact, convergenceStandardMarkdown } from "../modules/convergenceStandard";
import { buildEvidenceDecisionModelArtifact, evidenceDecisionModelMarkdown } from "../modules/evidenceDecisionModel";
import { buildForbiddenBehaviorAcceptanceArtifact, forbiddenBehaviorAcceptanceMarkdown } from "../modules/forbiddenBehaviorAcceptance";
import { buildFrontendPracticeSkillsArtifact, frontendPracticeSkillOutput, frontendPracticeSkillsMarkdown, FRONTEND_PRACTICE_SKILLS } from "../modules/frontendPracticeSkills";
import { buildImplementationPhasesArtifact, implementationPhasesMarkdown } from "../modules/implementationPhases";
import { buildContractDraftArtifacts } from "../modules/lifecycleContractStates";
import { missingContextMarkdown } from "../modules/lifecycleIntakeStates";
import { buildNonNegotiablePrinciplesArtifact, nonNegotiablePrinciplesMarkdown } from "../modules/nonNegotiablePrinciples";
import { buildPackageReadinessTiersArtifact, readinessTiersMarkdown } from "../modules/readinessTiers";

interface DraftArtifact {
  id: string;
  path: string;
  type: "json" | "markdown";
  required: boolean;
}

export interface DraftPackageExport {
  manifest: Record<string, unknown>;
  artifacts: DraftArtifact[];
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

function productName(pkg: ArchetypePackage): string {
  return String(pkg.product.productModel.product_name ?? pkg.manifest.project_slug);
}

function linesForList(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- None."];
}

function buildReadme(pkg: ArchetypePackage): string {
  return [
    `# ${productName(pkg)} Draft Contract Package`,
    "",
    "Archetype generated a draft contract for human review. This is not an implementation package.",
    "",
    "## Start Here",
    "",
    "1. Read `lifecycle/contract-state.json`.",
    "2. Review `draft/product-model.draft.json`.",
    "3. Review `draft/experience-architecture.draft.json`.",
    "4. Review `draft/design-system.draft.json`.",
    "5. Review `draft/frontend-contract.draft.json`.",
    "6. Review `draft/assumption-ledger.md`.",
    "7. Review `draft/specialist-review.json`.",
    "8. Review `lifecycle/implementation-phases.json`.",
    "9. Review `governance/convergence-standard.json`.",
    "10. Approve or edit using `draft/contract-approval-request.json`.",
    "",
    "## Not Generated",
    "",
    "- `spec/archetype-spec.json`",
    "- `spec/archetype-spec.md`",
    "- `test-first/test-first-contract.json`",
    "- `verification/playwright-verification-contract.json`",
    "- `frontend-agent-contract/implementation-rules.json`",
    "- `frontend-agent-contract/frontend-agent-instructions.md`",
    "- `frontend-agent-contract/acceptance-criteria.json`",
    "- `implementation-contract.md`",
    "",
    "## Rule",
    "",
    "Canonical spec generation is blocked until the draft contract is approved by a human reviewer."
  ].join("\n");
}

function buildReadinessReport(pkg: ArchetypePackage): string {
  return [
    "# Draft Readiness Report",
    "",
    `- Readiness score: ${pkg.quality.readiness.score}`,
    "- Readiness tier: ready_for_contract_approval",
    "- Ready for frontend agent: false",
    "- Implementation authorized: false",
    "",
    "## Blockers",
    "",
    ...linesForList(pkg.quality.readiness.blockers),
    "",
    "## Warnings",
    "",
    ...linesForList(pkg.quality.readiness.warnings),
    "",
    "## Next Action",
    "",
    "Review and approve the draft contract before canonical spec generation."
  ].join("\n");
}

function artifactIndex(artifacts: DraftArtifact[]): string[] {
  return artifacts.map((artifact) => artifact.path).sort();
}

export function exportDraftPackage(pkg: ArchetypePackage, outDir: string): DraftPackageExport {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const draft = buildContractDraftArtifacts(pkg);
  const readinessTiers = buildPackageReadinessTiersArtifact(pkg);
  const nonNegotiablePrinciples = buildNonNegotiablePrinciplesArtifact(pkg);
  const evidenceDecisionModel = buildEvidenceDecisionModelArtifact(pkg);
  const forbiddenBehaviorAcceptance = buildForbiddenBehaviorAcceptanceArtifact();
  const frontendPracticeSkills = buildFrontendPracticeSkillsArtifact(pkg);
  const convergenceStandard = buildConvergenceStandardArtifact({
    packageType: "draft_contract",
    contextStatus: String(pkg.lifecycle.contextCompletion.status ?? "complete"),
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false,
    implementationAuthorized: false
  });
  const implementationPhases = buildImplementationPhasesArtifact({
    packageType: "draft_contract",
    contextStatus: String(pkg.lifecycle.contextCompletion.status ?? "complete"),
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    contractApprovalStatus: String(pkg.manifest.contract_approval.status ?? "pending_human_review")
  });
  const artifacts: DraftArtifact[] = [
    { id: "draft-readme", path: "README.md", type: "markdown", required: true },
    { id: "manifest", path: "manifest.json", type: "json", required: true },
    { id: "implementation-readiness", path: "00-manifest/implementation-readiness.json", type: "json", required: true },
    { id: "internal-manifest", path: "00-manifest/manifest.json", type: "json", required: true },
    { id: "readiness-report", path: "readiness-report.md", type: "markdown", required: true },
    { id: "lifecycle-state-machine", path: "lifecycle/state-machine.json", type: "json", required: true },
    { id: "lifecycle-contract-state", path: "lifecycle/contract-state.json", type: "json", required: true },
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
    { id: "convergence-standard-report", path: "governance/convergence-standard.md", type: "markdown", required: true },
    { id: "frontend-practice-skills", path: "governance/frontend-practice-skills.json", type: "json", required: true },
    { id: "frontend-practice-skills-report", path: "governance/frontend-practice-skills.md", type: "markdown", required: true },
    ...FRONTEND_PRACTICE_SKILLS.map((skill): DraftArtifact => ({
      id: `frontend-practice-${skill.id}`,
      path: skill.output_artifact,
      type: "json",
      required: true
    })),
    { id: "product-model-draft", path: "draft/product-model.draft.json", type: "json", required: true },
    { id: "experience-architecture-draft", path: "draft/experience-architecture.draft.json", type: "json", required: true },
    { id: "design-system-draft", path: "draft/design-system.draft.json", type: "json", required: true },
    { id: "frontend-contract-draft", path: "draft/frontend-contract.draft.json", type: "json", required: true },
    { id: "assumption-ledger", path: "draft/assumption-ledger.md", type: "markdown", required: true },
    { id: "specialist-review", path: "draft/specialist-review.json", type: "json", required: true },
    { id: "contract-approval-request", path: "draft/contract-approval-request.json", type: "json", required: true }
  ];

  const manifest = {
    schemaVersion: "0.1.0",
    packageType: "draft_contract",
    status: "needs_contract_approval",
    generatedAt: pkg.manifest.generated_at,
    productName: productName(pkg),
    readinessScore: pkg.quality.readiness.score,
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    contractApproval: pkg.manifest.contract_approval,
    readinessEvidence: pkg.manifest.readiness_evidence,
    blockers: pkg.quality.readiness.blockers,
    warnings: pkg.quality.readiness.warnings,
    artifacts
  };
  const internalManifest = {
    ...pkg.manifest,
    package_type: "draft_contract",
    readiness_tier: "ready_for_contract_approval",
    ready_for_frontend_agent: false,
    implementation_authorized: false,
    artifact_index: artifactIndex(artifacts)
  };
  const readiness = {
    ...pkg.quality.readiness,
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false
  };

  writeText(outDir, "README.md", buildReadme(pkg));
  writeJson(outDir, "manifest.json", manifest);
  writeJson(outDir, "00-manifest/manifest.json", internalManifest);
  writeJson(outDir, "00-manifest/implementation-readiness.json", readiness);
  writeText(outDir, "readiness-report.md", buildReadinessReport(pkg));

  writeJson(outDir, "lifecycle/state-machine.json", pkg.lifecycle.stateMachine);
  writeJson(outDir, "lifecycle/contract-state.json", draft.contractState);
  writeJson(outDir, "lifecycle/start-request.json", pkg.lifecycle.startRequest);
  writeJson(outDir, "lifecycle/context-completion.json", pkg.lifecycle.contextCompletion);
  writeJson(outDir, "lifecycle/context-matrix.json", pkg.lifecycle.contextMatrix);
  writeJson(outDir, "lifecycle/readiness-tiers.json", readinessTiers);
  writeText(outDir, "lifecycle/readiness-tiers.md", readinessTiersMarkdown(readinessTiers));
  writeJson(outDir, "lifecycle/implementation-phases.json", implementationPhases);
  writeText(outDir, "lifecycle/implementation-phases.md", implementationPhasesMarkdown(implementationPhases));
  writeJson(outDir, "lifecycle/clarification-turn.json", pkg.lifecycle.clarificationTurn);
  writeText(outDir, "lifecycle/clarification-turn.md", pkg.lifecycle.clarificationTurnReport);
  writeJson(outDir, "lifecycle/clarification-state.json", pkg.lifecycle.clarificationState);
  writeText(outDir, "lifecycle/clarification-transcript.md", pkg.lifecycle.clarificationTranscript);
  writeJson(outDir, "lifecycle/clarification-questions.json", pkg.lifecycle.clarificationQuestions);
  writeText(outDir, "lifecycle/lifecycle-report.md", pkg.lifecycle.lifecycleReport);

  writeJson(outDir, "01-evidence/evidence-ledger.json", pkg.evidence);
  writeText(outDir, "01-evidence/missing-context.md", missingContextMarkdown(pkg.evidence, pkg.lifecycle.contextMatrix));
  writeJson(outDir, "governance/non-negotiable-principles.json", nonNegotiablePrinciples);
  writeText(outDir, "governance/non-negotiable-principles.md", nonNegotiablePrinciplesMarkdown(nonNegotiablePrinciples));
  writeJson(outDir, "governance/evidence-decision-model.json", evidenceDecisionModel);
  writeText(outDir, "governance/evidence-decision-model.md", evidenceDecisionModelMarkdown(evidenceDecisionModel));
  writeJson(outDir, "governance/forbidden-behaviors.json", forbiddenBehaviorAcceptance);
  writeText(outDir, "governance/forbidden-behaviors.md", forbiddenBehaviorAcceptanceMarkdown(forbiddenBehaviorAcceptance));
  writeJson(outDir, "governance/convergence-standard.json", convergenceStandard);
  writeText(outDir, "governance/convergence-standard.md", convergenceStandardMarkdown(convergenceStandard));
  writeJson(outDir, "governance/frontend-practice-skills.json", frontendPracticeSkills);
  writeText(outDir, "governance/frontend-practice-skills.md", frontendPracticeSkillsMarkdown(frontendPracticeSkills));
  for (const skill of FRONTEND_PRACTICE_SKILLS) {
    writeJson(outDir, skill.output_artifact, frontendPracticeSkillOutput(skill));
  }

  writeJson(outDir, "draft/product-model.draft.json", draft.productModelDraft);
  writeJson(outDir, "draft/experience-architecture.draft.json", draft.experienceArchitectureDraft);
  writeJson(outDir, "draft/design-system.draft.json", draft.designSystemDraft);
  writeJson(outDir, "draft/frontend-contract.draft.json", draft.frontendContractDraft);
  writeText(outDir, "draft/assumption-ledger.md", draft.assumptionLedger);
  writeJson(outDir, "draft/specialist-review.json", draft.specialistReview);
  writeJson(outDir, "draft/contract-approval-request.json", draft.contractApprovalRequest);

  return { manifest, artifacts };
}
