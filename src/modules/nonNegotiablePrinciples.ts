import type { ArchetypeInput, ArchetypePackage, DecisionRecord } from "../core/types";
import path from "node:path";
import { existsSync } from "node:fs";
import { inputSourceHashForApproval, readDraftApprovalProof, verifyDraftApprovalProofDigest } from "../approval/draftApproval";
import { decisionStatusForEvidenceRefs as hl02DecisionStatusForEvidenceRefs, evidenceLevelCanBecomeCanonical, evidenceLevelForReference, humanApprovedPackage } from "./evidenceDecisionModel";

type GateStatus = "pass" | "blocked" | "fail";

interface PrincipleGate {
  id: string;
  principle: string;
  enforcement: "hard_gate" | "validator" | "artifact_requirement";
  status: GateStatus;
  artifacts: string[];
  details: string;
}

export const NON_NEGOTIABLE_PRINCIPLES = [
  "No canonical contract from unapproved invention.",
  "No spec before context is sufficient for a draft.",
  "No implementation before the canonical contract is approved.",
  "No product UI before tests are authored from the canonical contract.",
  "No completion before QA evidence and Playwright-backed verification pass.",
  "Inference may propose candidates, but inference cannot accept decisions.",
  "Clarification happens one question at a time.",
  "No agent may approve its own output.",
  "All readiness claims must point to artifacts.",
  "Every generated route, screen, component, token, action, data operation, and test must trace to approved evidence."
];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hasRefs(value: unknown, key = "evidence_refs"): boolean {
  const refs = asRecord(value)[key];
  return Array.isArray(refs) && refs.length > 0;
}

function isConfirmedNonCanonicalDecision(decision: DecisionRecord, pkg: ArchetypePackage): boolean {
  if (decision.status !== "confirmed") return false;
  const humanApproved = humanApprovedPackage(pkg);
  const confirmedDecisionIds = new Set(pkg.evidence.decisions.filter((item) => item.status === "confirmed").map((item) => item.id));
  return decision.evidence_refs.some((ref) => !evidenceLevelCanBecomeCanonical(evidenceLevelForReference(ref, { humanApproved, confirmedDecisionIds })));
}

export function decisionStatusForEvidenceRefs(refs: string[]): DecisionRecord["status"] {
  return hl02DecisionStatusForEvidenceRefs(refs);
}

export interface ContractApprovalStateOptions {
  sourcePath?: string;
}

function resolveApprovalArtifactPath(approvalArtifactPath: string | undefined, options: ContractApprovalStateOptions): string | null {
  if (!approvalArtifactPath || approvalArtifactPath.trim().length === 0) return null;
  if (approvalArtifactPath.includes("\0")) return null;
  if (path.isAbsolute(approvalArtifactPath)) return path.resolve(approvalArtifactPath);
  if (!options.sourcePath) return null;
  return path.resolve(path.dirname(options.sourcePath), approvalArtifactPath);
}

function approvalProofBlockers(input: ArchetypeInput, options: ContractApprovalStateOptions): string[] {
  const approval = input.contractApproval;
  if (!approval || approval.approved !== true || approval.approverType !== "human") return [];

  const blockers: string[] = [];
  const approvalArtifactPath = resolveApprovalArtifactPath(approval.approvalArtifactPath, options);
  const expectedSourceHash = inputSourceHashForApproval(input);
  if (!approvalArtifactPath) {
    blockers.push("HL-01 approval gate blocked: approvalArtifactPath must point to a bound draft approval proof.");
    return blockers;
  }
  if (!existsSync(approvalArtifactPath)) {
    blockers.push(`HL-01 approval gate blocked: approval proof artifact does not exist: ${approvalArtifactPath}.`);
    return blockers;
  }

  try {
    const proof = readDraftApprovalProof(approvalArtifactPath);
    if (!verifyDraftApprovalProofDigest(proof)) blockers.push("HL-01 approval gate blocked: approval proof digest does not match its contents.");
    if (approval.approvalDigest !== proof.approval_digest) blockers.push("HL-01 approval gate blocked: intake approval digest does not match approval proof.");
    if (approval.draftPackageId !== proof.draft_package_id) blockers.push("HL-01 approval gate blocked: draft package id does not match approval proof.");
    if (approval.sourceHash !== proof.draft_source_hash) blockers.push("HL-01 approval gate blocked: source hash does not match approval proof.");
    if (approval.packageChecksum !== proof.draft_package_checksum) blockers.push("HL-01 approval gate blocked: draft package checksum does not match approval proof.");
    if (proof.draft_source_hash !== expectedSourceHash) blockers.push("HL-01 approval gate blocked: approval proof source hash does not match current intake without approval.");
    if (approval.approvedBy !== proof.approved_by) blockers.push("HL-01 approval gate blocked: approvedBy does not match approval proof.");
    if (approval.approvedAt !== proof.approved_at) blockers.push("HL-01 approval gate blocked: approvedAt does not match approval proof.");
    if (!Array.isArray(proof.artifact_hashes) || proof.artifact_hashes.length === 0) {
      blockers.push("HL-01 approval gate blocked: approval proof must include draft artifact hashes.");
    }
    const refs = new Set(approval.artifactRefs ?? []);
    for (const ref of proof.approved_artifact_refs) {
      if (!refs.has(ref)) blockers.push(`HL-01 approval gate blocked: intake approval is missing proof artifact ref ${ref}.`);
    }
  } catch (error) {
    blockers.push(`HL-01 approval gate blocked: ${(error instanceof Error ? error.message : String(error))}`);
  }

  return blockers;
}

export function buildContractApprovalState(input: ArchetypeInput, options: ContractApprovalStateOptions = {}): Record<string, unknown> {
  const approval = input.contractApproval;
  const approved = approval?.approved === true;
  const approverType = approval?.approverType ?? "none";
  const approvedBy = approval?.approvedBy ?? null;
  const artifactRefs = approval?.artifactRefs ?? [];
  const proofBlockers = approvalProofBlockers(input, options);
  const humanApproved = approved && approverType === "human" && typeof approvedBy === "string" && approvedBy.trim().length > 0 && proofBlockers.length === 0;
  const blockers = [
    ...(humanApproved ? [] : ["HL-01 implementation gate blocked: canonical contract is not approved by a human reviewer."]),
    ...(approved && approverType === "agent" ? ["HL-01 approval gate blocked: an agent may not approve its own output."] : []),
    ...proofBlockers
  ];

  return {
    status: humanApproved ? "approved" : approved && approverType === "agent" ? "invalid_agent_approval" : approved && approverType === "human" ? "invalid_unbound_approval" : "pending_human_review",
    approved: humanApproved,
    approved_by: approvedBy,
    approver_type: approverType,
    approved_at: approval?.approvedAt ?? null,
    artifact_refs: artifactRefs,
    approval_artifact_path: approval?.approvalArtifactPath ?? null,
    approval_digest: approval?.approvalDigest ?? null,
    draft_package_id: approval?.draftPackageId ?? null,
    source_hash: approval?.sourceHash ?? null,
    package_checksum: approval?.packageChecksum ?? null,
    approved_assumption_ids: approval?.approvedAssumptionIds ?? [],
    blockers
  };
}

export function buildReadinessEvidence(input: {
  readinessScore: number;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
  contextStatus: string;
}): Array<{ claim: string; status: string; artifact_refs: string[] }> {
  return [
    {
      claim: `readiness_score:${input.readinessScore}`,
      status: "supported",
      artifact_refs: ["00-manifest/implementation-readiness.json", "readiness-report.md", "08-quality/implementation-readiness-report.md"]
    },
    {
      claim: `readiness_tier:${input.readinessTier}`,
      status: "supported",
      artifact_refs: ["lifecycle/readiness-tiers.json", "lifecycle/context-matrix.json", "00-manifest/implementation-readiness.json"]
    },
    {
      claim: `ready_for_frontend_agent:${input.readyForFrontendAgent}`,
      status: "supported",
      artifact_refs: ["00-manifest/implementation-readiness.json", "lifecycle/readiness-tiers.json", "governance/non-negotiable-principles.json", "10-revision/approval-gates.json"]
    },
    {
      claim: `implementation_authorized:${input.implementationAuthorized}`,
      status: "supported",
      artifact_refs: ["lifecycle/readiness-tiers.json", "governance/non-negotiable-principles.json", "10-revision/approval-gates.json"]
    },
    {
      claim: `context_status:${input.contextStatus}`,
      status: "supported",
      artifact_refs: ["lifecycle/context-completion.json", "lifecycle/context-matrix.json"]
    }
  ];
}

function traceabilityMissing(pkg: ArchetypePackage): string[] {
  const missing: string[] = [];
  for (const route of pkg.experience.routeMap.routes) {
    if (!route.evidence_refs.length) missing.push(`route:${route.route}`);
  }
  for (const screen of pkg.experience.screenSpecs) {
    if (!screen.evidence_refs.length) missing.push(`screen:${screen.screen_id}`);
  }

  const componentContracts = asArray(asRecord(pkg.designSystem.componentContracts).contracts);
  for (const component of componentContracts) {
    if (!hasRefs(component)) missing.push(`component:${String(asRecord(component).name ?? "unknown")}`);
  }

  if (!hasRefs(pkg.designSystem.tokenContracts)) missing.push("tokens:token-contracts");

  const actions = asArray(asRecord(pkg.frontendContract.actionContracts).actions);
  for (const action of actions) {
    if (!hasRefs(action)) missing.push(`action:${String(asRecord(action).action_id ?? "unknown")}`);
  }

  const dataOps = pkg.frontendContract.dataOperationContracts;
  for (const query of asArray(asRecord(dataOps).queries)) {
    if (!hasRefs(query)) missing.push(`data_query:${String(asRecord(query).query_id ?? "unknown")}`);
  }
  for (const mutation of asArray(asRecord(dataOps).mutations)) {
    if (!hasRefs(mutation)) missing.push(`data_mutation:${String(asRecord(mutation).mutation_id ?? "unknown")}`);
  }

  const testSuites = asArray(pkg.testFirst.contractJson.suites);
  for (const suite of testSuites) {
    for (const test of asArray(asRecord(suite).tests)) {
      const record = asRecord(test);
      const sourceRefs = asArray(record.source_spec_paths);
      const evidenceRefs = asArray(record.evidence_refs);
      if (sourceRefs.length === 0 && evidenceRefs.length === 0) {
        missing.push(`test:${String(record.test_id ?? "unknown")}`);
      }
    }
  }

  return missing;
}

export function buildNonNegotiablePrinciplesArtifact(pkg: ArchetypePackage): Record<string, unknown> {
  const approval = asRecord(pkg.manifest.contract_approval);
  const approvalBlockers = asArray(approval.blockers).map(String);
  const readinessEvidence = pkg.manifest.readiness_evidence ?? [];
  const confirmedNonCanonicalDecisions = pkg.evidence.decisions.filter((decision) => isConfirmedNonCanonicalDecision(decision, pkg)).map((decision) => decision.id);
  const missingTraceability = traceabilityMissing(pkg);
  const contextComplete = pkg.lifecycle.contextCompletion.status === "complete";
  const oneQuestion = pkg.lifecycle.contextCompletion.questions.length <= 1;
  const testFirstPresent = asArray(pkg.testFirst.contractJson.suites).length > 0
    && pkg.testFirst.contractJson.source_spec_path === "spec/archetype-spec.json";
  const playwrightStatus = String(pkg.playwright.evidenceJson.status ?? "pending");

  const gates: PrincipleGate[] = [
    {
      id: "HL01-P01",
      principle: NON_NEGOTIABLE_PRINCIPLES[0],
      enforcement: "hard_gate",
      status: contextComplete ? "pass" : "blocked",
      artifacts: ["lifecycle/context-completion.json", "lifecycle/context-matrix.json"],
      details: contextComplete ? "Context is sufficient for a draft contract." : "Canonical contract generation is blocked until context is sufficient."
    },
    {
      id: "HL01-P02",
      principle: NON_NEGOTIABLE_PRINCIPLES[1],
      enforcement: "hard_gate",
      status: contextComplete ? "pass" : "blocked",
      artifacts: ["lifecycle/context-completion.json", "spec/archetype-spec.json"],
      details: contextComplete ? "Spec generation was reached only after context sufficiency passed." : "Spec generation is blocked by context sufficiency."
    },
    {
      id: "HL01-P03",
      principle: NON_NEGOTIABLE_PRINCIPLES[2],
      enforcement: "hard_gate",
      status: approvalBlockers.length === 0 ? "pass" : "blocked",
      artifacts: ["10-revision/approval-gates.json", "governance/non-negotiable-principles.json"],
      details: approvalBlockers.length === 0 ? "Implementation is human-approved." : approvalBlockers.join(" ")
    },
    {
      id: "HL01-P04",
      principle: NON_NEGOTIABLE_PRINCIPLES[3],
      enforcement: "validator",
      status: testFirstPresent ? "pass" : "fail",
      artifacts: ["test-first/test-first-contract.json", "spec/archetype-spec.json"],
      details: testFirstPresent ? "Test-first contract is derived from the canonical spec." : "Test-first contract is missing or not traced to the canonical spec."
    },
    {
      id: "HL01-P05",
      principle: NON_NEGOTIABLE_PRINCIPLES[4],
      enforcement: "hard_gate",
      status: playwrightStatus === "pass" ? "pass" : "blocked",
      artifacts: ["verification/playwright-evidence.json", "14-target-execution/target-execution-report.json", "10-revision/repair-task-queue.json"],
      details: playwrightStatus === "pass" ? "Playwright evidence is passing." : `Completion is blocked while Playwright evidence is ${playwrightStatus}.`
    },
    {
      id: "HL01-P06",
      principle: NON_NEGOTIABLE_PRINCIPLES[5],
      enforcement: "validator",
      status: confirmedNonCanonicalDecisions.length === 0 ? "pass" : "fail",
      artifacts: ["01-evidence/evidence-ledger.json"],
      details: confirmedNonCanonicalDecisions.length === 0 ? "Inference-backed decisions remain candidate until approval." : `Confirmed non-canonical decisions: ${confirmedNonCanonicalDecisions.join(", ")}.`
    },
    {
      id: "HL01-P07",
      principle: NON_NEGOTIABLE_PRINCIPLES[6],
      enforcement: "validator",
      status: oneQuestion ? "pass" : "fail",
      artifacts: ["lifecycle/clarification-turn.json", "lifecycle/clarification-questions.json"],
      details: oneQuestion ? "Clarification exposes at most one current question." : "Clarification exposed more than one question."
    },
    {
      id: "HL01-P08",
      principle: NON_NEGOTIABLE_PRINCIPLES[7],
      enforcement: "hard_gate",
      status: approval.approver_type === "agent" ? "fail" : "pass",
      artifacts: ["10-revision/approval-gates.json", "governance/non-negotiable-principles.json"],
      details: approval.approver_type === "agent" ? "Agent approval is invalid." : "No agent approval was accepted."
    },
    {
      id: "HL01-P09",
      principle: NON_NEGOTIABLE_PRINCIPLES[8],
      enforcement: "artifact_requirement",
      status: readinessEvidence.length >= 4 && readinessEvidence.every((item) => item.artifact_refs.length > 0) ? "pass" : "fail",
      artifacts: ["manifest.json", "00-manifest/implementation-readiness.json", "readiness-report.md"],
      details: "Readiness claims are backed by manifest readiness_evidence artifact refs."
    },
    {
      id: "HL01-P10",
      principle: NON_NEGOTIABLE_PRINCIPLES[9],
      enforcement: "validator",
      status: missingTraceability.length === 0 ? "pass" : "fail",
      artifacts: ["03-experience-architecture/dsag.json", "01-evidence/evidence-ledger.json", "test-first/test-first-contract.json"],
      details: missingTraceability.length === 0 ? "Generated contract surfaces expose traceability refs." : `Missing traceability: ${missingTraceability.slice(0, 20).join(", ")}.`
    }
  ];
  const failures = gates.filter((gate) => gate.status === "fail");
  const blocked = gates.filter((gate) => gate.status === "blocked");

  return {
    artifact_version: "1.0",
    source_scope: "HL-01",
    status: failures.length > 0 ? "fail" : blocked.length > 0 ? "blocked" : "pass",
    implementation_authorized: pkg.manifest.implementation_authorized,
    principles: NON_NEGOTIABLE_PRINCIPLES.map((principle, index) => ({
      id: `HL01-P${String(index + 1).padStart(2, "0")}`,
      principle
    })),
    gates,
    readiness_evidence: readinessEvidence,
    confirmed_noncanonical_decisions: confirmedNonCanonicalDecisions,
    missing_traceability: missingTraceability,
    blockers: blocked.map((gate) => `${gate.id}: ${gate.details}`),
    failures: failures.map((gate) => `${gate.id}: ${gate.details}`)
  };
}

export function nonNegotiablePrinciplesMarkdown(artifact: Record<string, unknown>): string {
  const gates = asArray(artifact.gates).map(asRecord);
  const blockers = asArray(artifact.blockers).map(String);
  const failures = asArray(artifact.failures).map(String);
  return [
    "# Non-Negotiable Principles Enforcement",
    "",
    `Status: ${String(artifact.status ?? "unknown")}`,
    `Implementation authorized: ${String(artifact.implementation_authorized ?? false)}`,
    "",
    "## Gates",
    "",
    ...gates.map((gate) => `- [${gate.status}] ${gate.id}: ${gate.principle} (${gate.enforcement})`),
    "",
    "## Blockers",
    "",
    ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker}`) : ["- None."]),
    "",
    "## Failures",
    "",
    ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ["- None."])
  ].join("\n");
}
