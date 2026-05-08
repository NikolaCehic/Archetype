import { requiredCompletePackageArtifactPaths } from "../artifacts/registry";

type JsonRecord = Record<string, unknown>;

export const REQUIRED_COMPLETE_PACKAGE_ARTIFACTS = requiredCompletePackageArtifactPaths();

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function list(values: unknown[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${String(value)}`) : ["- None."];
}

export function approvalRequestMarkdown(contractApprovalRequest: JsonRecord): string {
  return [
    "# Approval Request",
    "",
    "Source scope: HL-12",
    "Source artifact: `draft/contract-approval-request.json`",
    "Traceability: `lifecycle/context-matrix.json`, `01-evidence/evidence-ledger.json`, `draft/assumption-ledger.md`",
    "",
    `Approval status: ${String(contractApprovalRequest.approval_status ?? "unknown")}`,
    `Approved: ${String(contractApprovalRequest.approved ?? false)}`,
    "",
    "## Request",
    "",
    String(contractApprovalRequest.request ?? "Approve this draft contract or provide edits."),
    "",
    "## Confirmed Facts",
    "",
    ...list(asArray(contractApprovalRequest.confirmed_facts)),
    "",
    "## Candidate Assumptions",
    "",
    ...list(asArray(contractApprovalRequest.candidate_assumptions)),
    "",
    "## Unresolved Unknowns",
    "",
    ...list(asArray(contractApprovalRequest.unresolved_unknowns)),
    "",
    "## Risks",
    "",
    ...list(asArray(contractApprovalRequest.risks))
  ].join("\n");
}

export function approvalDecisionArtifact(manifest: JsonRecord): JsonRecord {
  const approval = asRecord(manifest.contract_approval);
  return {
    artifact_version: "1.0",
    source_scope: "HL-12",
    source_artifact: "00-manifest/manifest.json#/contract_approval",
    status: approval.status ?? "unknown",
    approved: approval.approved === true,
    approver_type: approval.approver_type ?? "unknown",
    approved_by: approval.approved_by ?? null,
    approved_at: approval.approved_at ?? null,
    artifact_refs: asArray(approval.artifact_refs).map(String),
    approval_artifact_path: approval.approval_artifact_path ?? null,
    approval_digest: approval.approval_digest ?? null,
    draft_package_id: approval.draft_package_id ?? null,
    source_hash: approval.source_hash ?? null,
    package_checksum: approval.package_checksum ?? null,
    approved_assumption_ids: asArray(approval.approved_assumption_ids).map(String),
    blockers: asArray(approval.blockers).map(String),
    traceability: {
      approval_request: "lifecycle/approval-request.md",
      contract_approval_request: "draft/contract-approval-request.json",
      context_matrix: "lifecycle/context-matrix.json",
      evidence_ledger: "01-evidence/evidence-ledger.json",
      manifest: "00-manifest/manifest.json"
    },
    exit_condition: "Every complete package preserves traceable contract evidence."
  };
}

export function specialistReviewSummaryMarkdown(specialistReview: JsonRecord): string {
  const gate = asRecord(specialistReview.frontend_practice_gate);
  const reviewers = asArray(specialistReview.reviewers).map((reviewer) => {
    const record = asRecord(reviewer);
    return `${String(record.role ?? "unknown")} - may approve: ${String(record.may_approve ?? false)}`;
  });
  return [
    "# Specialist Review Summary",
    "",
    "Source scope: HL-12",
    "Source artifact: `draft/specialist-review.json`",
    "Rule: No agent can approve its own work.",
    "",
    "## Reviewers",
    "",
    ...list(reviewers),
    "",
    "## Frontend Practice Gate",
    "",
    `Status: ${String(gate.status ?? "unknown")}`,
    `Source scope: ${String(gate.source_scope ?? "unknown")}`,
    `Enforcement: ${String(gate.enforcement_rule ?? "unknown")}`,
    "",
    "## Blockers",
    "",
    ...list(asArray(specialistReview.blockers)),
    "",
    "## Warnings",
    "",
    ...list(asArray(specialistReview.warnings)),
    "",
    "## Recommendations",
    "",
    ...list(asArray(specialistReview.recommendations))
  ].join("\n");
}

export function initialRedTestRunMarkdown(testFirstContract: JsonRecord): string {
  const requiredFiles = asArray(testFirstContract.required_target_test_files).map((file) => String(asRecord(file).path ?? file));
  return [
    "# Initial Red Test Run",
    "",
    "Source scope: HL-12",
    "Status: pending_until_target_agent_runs_tests",
    "Source contract: `test-first/test-first-contract.json`",
    "Test quality standard: `test-first/test-quality-standard.json`",
    "",
    "The implementation agent must create the declared tests before product UI code, run them in the target repo, preserve the initial red result, and then drive the same tests green.",
    "",
    "## Required Target Test Files",
    "",
    ...list(requiredFiles),
    "",
    "## Traceability",
    "",
    "- `spec/archetype-spec.json`",
    "- `test-first/test-first-contract.json`",
    "- `test-first/test-quality-standard.json`",
    "- `verification/playwright-verification-contract.json`"
  ].join("\n");
}

export function finalReadinessReportMarkdown(input: {
  manifest: JsonRecord;
  playwrightEvidence?: JsonRecord;
  targetExecution?: JsonRecord;
  repairTaskQueue?: JsonRecord;
  qaScenarioCatalog?: JsonRecord;
}): string {
  const manifest = input.manifest;
  const targetExecution = input.targetExecution ?? {};
  const playwrightEvidence = input.playwrightEvidence ?? {};
  const repairTaskQueue = input.repairTaskQueue ?? {};
  const qaScenarioCatalog = input.qaScenarioCatalog ?? {};
  return [
    "# Final Readiness Report",
    "",
    "Source scope: HL-12",
    "Exit condition: Every complete package preserves traceable contract evidence.",
    "",
    "## Readiness",
    "",
    `Readiness tier: ${String(manifest.readiness_tier ?? manifest.readinessTier ?? "unknown")}`,
    `Ready for frontend agent: ${String(manifest.ready_for_frontend_agent ?? manifest.readyForFrontendAgent ?? false)}`,
    `Implementation authorized: ${String(manifest.implementation_authorized ?? manifest.implementationAuthorized ?? false)}`,
    `Target execution status: ${String(targetExecution.status ?? "pending")}`,
    `Playwright evidence status: ${String(playwrightEvidence.status ?? "pending")}`,
    `Repair queue status: ${String(repairTaskQueue.status ?? "pending")}`,
    `Repair task count: ${String(repairTaskQueue.task_count ?? 0)}`,
    `QA scenario count: ${String(asRecord(qaScenarioCatalog.coverage).total_scenarios ?? 0)}`,
    "",
    "## Required Evidence",
    "",
    ...REQUIRED_COMPLETE_PACKAGE_ARTIFACTS.map((artifact) => `- \`${artifact}\``)
  ].join("\n");
}
