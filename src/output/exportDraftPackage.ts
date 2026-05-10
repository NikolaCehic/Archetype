import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { agentContextBundlePath, buildAgentContextForPackage } from "../agent-context/phaseBundles";
import { artifactIndexForPackage, artifactReadOrderForPackage, forbiddenDraftArtifactPaths, manifestArtifactsForPackage } from "../artifacts/registry";
import type { ManifestArtifactEntry } from "../artifacts/registry";
import { buildConsumerPlane, consumerPlaneMarkdown } from "../consumer-plane";
import { agentControlPlaneMarkdown, buildAgentControlPlaneReport } from "../control-plane";
import { prepareGeneratedOutputDirectory } from "../safety/pathSafety";
import type { ArchetypePackage } from "../core/types";
import { buildConvergenceStandardArtifact, convergenceStandardMarkdown } from "../modules/convergenceStandard";
import { designSystemPreviewHtml, designSystemReviewMarkdown } from "../modules/designSystemPreview";
import { buildEvidenceDecisionModelArtifact, evidenceDecisionModelMarkdown } from "../modules/evidenceDecisionModel";
import { buildForbiddenBehaviorAcceptanceArtifact, forbiddenBehaviorAcceptanceMarkdown } from "../modules/forbiddenBehaviorAcceptance";
import { buildFrontendPracticeSkillsArtifact, frontendPracticeSkillOutput, frontendPracticeSkillsMarkdown, FRONTEND_PRACTICE_SKILLS } from "../modules/frontendPracticeSkills";
import { buildImplementationPhasesArtifact, implementationPhasesMarkdown } from "../modules/implementationPhases";
import { buildContractDraftArtifacts } from "../modules/lifecycleContractStates";
import { missingContextMarkdown } from "../modules/lifecycleIntakeStates";
import { buildNonNegotiablePrinciplesArtifact, nonNegotiablePrinciplesMarkdown } from "../modules/nonNegotiablePrinciples";
import { buildPackageReadinessTiersArtifact, readinessTiersMarkdown } from "../modules/readinessTiers";
import { buildSessionArtifacts } from "../session";

type DraftArtifact = ManifestArtifactEntry;

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
  const readOrder = artifactReadOrderForPackage("draft").map((artifact, index) => {
    const verb = artifact.endsWith(".html") ? "Open" : "Read";
    return `${index + 1}. ${verb} \`${artifact}\`.`;
  });
  const forbidden = forbiddenDraftArtifactPaths().map((artifact) => `- \`${artifact}\``);
  return [
    `# ${productName(pkg)} Draft Contract Package`,
    "",
    "Archetype generated a draft contract for human review. This is not an implementation package.",
    "",
    "## Start Here",
    "",
    ...readOrder,
    "",
    "## Not Generated",
    "",
    ...forbidden,
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

export interface ExportDraftPackageOptions {
  force?: boolean;
}

export function exportDraftPackage(pkg: ArchetypePackage, outDir: string, options: ExportDraftPackageOptions = {}): DraftPackageExport {
  prepareGeneratedOutputDirectory(outDir, { force: options.force === true });

  const draft = buildContractDraftArtifacts(pkg);
  const designPreviewHtml = designSystemPreviewHtml(pkg, draft.designSystemDraft);
  const designReviewMarkdown = designSystemReviewMarkdown(pkg);
  const readinessTiers = buildPackageReadinessTiersArtifact(pkg);
  const nonNegotiablePrinciples = buildNonNegotiablePrinciplesArtifact(pkg);
  const evidenceDecisionModel = buildEvidenceDecisionModelArtifact(pkg);
  const forbiddenBehaviorAcceptance = buildForbiddenBehaviorAcceptanceArtifact();
  const frontendPracticeSkills = buildFrontendPracticeSkillsArtifact(pkg);
  const agentControlPlane = buildAgentControlPlaneReport(pkg, "draft_contract");
  const agentContext = buildAgentContextForPackage(pkg, "draft_contract");
  const consumerPlane = buildConsumerPlane({
    agentContext,
    controlPlane: agentControlPlane
  });
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
  const artifacts = manifestArtifactsForPackage("draft");
  const sessionArtifacts = buildSessionArtifacts({
    packageType: "draft_contract",
    productName: productName(pkg),
    readinessScore: pkg.quality.readiness.score,
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    blockers: pkg.quality.readiness.blockers,
    warnings: pkg.quality.readiness.warnings,
    agentContext,
    consumerPlane,
    controlPlane: agentControlPlane,
    evidence: pkg.evidence,
    routeSource: draft.experienceArchitectureDraft,
    manifestArtifactCount: artifacts.length
  });

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
    compilerPhases: pkg.manifest.compiler_phases ?? [],
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
    artifact_index: artifactIndexForPackage("draft")
  };
  const readiness = {
    ...pkg.quality.readiness,
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false
  };

  writeText(outDir, "README.md", buildReadme(pkg));
  writeJson(outDir, "manifest.json", manifest);
  writeJson(outDir, "agent-context/consumer-plane.json", consumerPlane);
  writeText(outDir, "agent-context/consumer-plane.md", consumerPlaneMarkdown(consumerPlane));
  writeJson(outDir, "agent-context/context-summary.json", agentContext.summary);
  writeText(outDir, "agent-context/context-summary.md", agentContext.summaryMarkdown);
  writeJson(outDir, "agent-context/phase-bundles/index.json", agentContext.phaseIndex);
  for (const bundle of agentContext.bundles) {
    writeJson(outDir, agentContextBundlePath(bundle.phase_id), bundle);
  }
  writeJson(outDir, "review-console/session.json", sessionArtifacts.reviewSession);
  writeText(outDir, "review-console/index.html", sessionArtifacts.reviewConsoleHtml);
  writeJson(outDir, "review-console/approval-decisions.json", sessionArtifacts.approvalDecisions);
  writeJson(outDir, "review-console/design-diff.json", sessionArtifacts.designDiff);
  writeJson(outDir, "review-console/run-timeline.json", sessionArtifacts.timeline);
  writeJson(outDir, "progressive/generation-plan.json", sessionArtifacts.progressivePlan);
  writeJson(outDir, "progressive/lazy-contract-index.json", sessionArtifacts.lazyContractIndex);
  writeJson(outDir, "progressive/token-budget.json", sessionArtifacts.tokenBudget);
  writeJson(outDir, "progressive/phase-package-plan.json", sessionArtifacts.phasePackagePlan);
  writeJson(outDir, "mcp/current-phase-resources.json", sessionArtifacts.mcpResources);
  writeJson(outDir, "mcp/current-phase-prompts.json", sessionArtifacts.mcpPrompts);
  writeJson(outDir, "orchestration/team-handoffs.json", sessionArtifacts.teamHandoffs);
  writeJson(outDir, "orchestration/subagent-ownership.json", sessionArtifacts.subagentOwnership);
  writeJson(outDir, "orchestration/host-permissions.json", sessionArtifacts.hostPermissions);
  writeJson(outDir, "attachments/source-materials.json", sessionArtifacts.sourceMaterialUx);
  writeText(outDir, "attachments/source-materials.md", sessionArtifacts.sourceMaterialMarkdown);
  writeJson(outDir, "lifecycle/blockers-explained.json", sessionArtifacts.blockedExplanation);
  writeText(outDir, "lifecycle/blockers-explained.md", sessionArtifacts.blockedExplanationMarkdown);
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
  writeJson(outDir, "governance/agent-control-plane.json", agentControlPlane);
  writeText(outDir, "governance/agent-control-plane.md", agentControlPlaneMarkdown(agentControlPlane));
  for (const skill of FRONTEND_PRACTICE_SKILLS) {
    writeJson(outDir, skill.output_artifact, frontendPracticeSkillOutput(skill));
  }

  writeJson(outDir, "draft/product-model.draft.json", draft.productModelDraft);
  writeJson(outDir, "draft/experience-architecture.draft.json", draft.experienceArchitectureDraft);
  writeJson(outDir, "draft/design-system.draft.json", draft.designSystemDraft);
  writeJson(outDir, "draft/design-directions.json", pkg.designSystem.designDirectionOptions);
  writeJson(outDir, "draft/design-quality-gate.json", pkg.designSystem.designQualityGate);
  writeText(outDir, "draft/design-craft-rubric.md", pkg.designSystem.visualCraftRubric);
  writeText(outDir, "draft/design-system-preview.html", designPreviewHtml);
  writeText(outDir, "draft/design-system-review.md", designReviewMarkdown);
  writeJson(outDir, "draft/frontend-contract.draft.json", draft.frontendContractDraft);
  writeText(outDir, "draft/assumption-ledger.md", draft.assumptionLedger);
  writeJson(outDir, "draft/specialist-review.json", draft.specialistReview);
  writeJson(outDir, "draft/contract-approval-request.json", draft.contractApprovalRequest);

  return { manifest, artifacts };
}
