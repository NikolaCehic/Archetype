import { hashContent } from "../core/stable";
import type { ArchetypePackage } from "../core/types";
import type {
  AgentControlPlaneGate,
  AgentControlPlaneReport,
  AgentControlPlaneRouteProposal,
  AgentControlPlaneSpecialistGate,
  AgentControlPlaneStatus
} from "./types";

type PackageType = AgentControlPlaneReport["package_type"];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringArray(value: unknown): string[] {
  return asArray(value).map(String).filter(Boolean);
}

function gate(input: Omit<AgentControlPlaneGate, "blockers" | "warnings"> & {
  blockers?: string[];
  warnings?: string[];
}): AgentControlPlaneGate {
  return {
    ...input,
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? []
  };
}

function componentContracts(pkg: ArchetypePackage): Record<string, unknown>[] {
  return asArray(asRecord(pkg.designSystem.componentContracts).contracts).map(asRecord);
}

function componentStateNames(pkg: ArchetypePackage, componentName: string): string[] {
  const contract = componentContracts(pkg).find((item) => String(item.name ?? "") === componentName);
  return asArray(contract?.state_contract).map((state) => String(asRecord(state).state ?? "")).filter(Boolean);
}

function proofFingerprint(pkg: ArchetypePackage): Record<string, unknown> | null {
  const approval = asRecord(pkg.manifest.contract_approval);
  const fingerprint = asRecord(approval.contract_fingerprint);
  return fingerprint.fingerprint_version === "1.0" ? fingerprint : null;
}

function currentContractFingerprint(pkg: ArchetypePackage): Record<string, unknown> {
  const routes = pkg.experience.routeMap.routes.map((route) => ({
    route: route.route,
    screen_id: route.screen_id
  }));
  const screens = pkg.experience.screenSpecs.map((screen) => ({
    screen_id: screen.screen_id,
    route: screen.route
  }));
  const componentNames = componentContracts(pkg)
    .map((component) => String(component.name ?? ""))
    .filter(Boolean)
    .sort();
  const tokenShape = {
    primitive: pkg.designSystem.primitiveTokens,
    semantic: pkg.designSystem.semanticTokens,
    component: pkg.designSystem.componentTokens,
    typography: pkg.designSystem.typographySystem,
    token_contracts: pkg.designSystem.tokenContracts,
    draft_status: "candidate_until_contract_approval"
  };
  const frontendContractShape = {
    routing: pkg.frontendContract.routingContract,
    data_contracts: pkg.frontendContract.dataContracts,
    data_operation_contracts: pkg.frontendContract.dataOperationContracts,
    action_contracts: pkg.frontendContract.actionContracts,
    form_contracts: pkg.frontendContract.formContracts,
    verification_strategy: pkg.frontendContract.verificationContracts
  };
  const withoutDigest = {
    fingerprint_version: "1.0",
    route_count: routes.length,
    routes,
    screen_count: screens.length,
    screens,
    component_count: componentNames.length,
    component_names: componentNames,
    token_digest: hashContent(tokenShape),
    frontend_contract_digest: hashContent(frontendContractShape)
  };
  return {
    ...withoutDigest,
    fingerprint_digest: hashContent(withoutDigest)
  };
}

function canonicalParityGate(pkg: ArchetypePackage, packageType: PackageType): AgentControlPlaneGate {
  if (packageType !== "canonical_contract") {
    return gate({
      id: "ACP-05",
      name: "Approved Draft To Canonical Parity",
      phase: "canonical",
      severity: "P0",
      status: "not_applicable",
      requirement: "Canonical parity is evaluated only after a bound human approval unlocks canonical generation.",
      evidence_refs: ["draft/contract-approval-request.json", "spec/archetype-spec.json"],
      next_action: "Approve the draft before evaluating canonical parity."
    });
  }
  const proof = proofFingerprint(pkg);
  if (!proof) {
    return gate({
      id: "ACP-05",
      name: "Approved Draft To Canonical Parity",
      phase: "canonical",
      severity: "P0",
      status: "fail",
      requirement: "Canonical spec must be fingerprint-bound to the approved draft package.",
      evidence_refs: ["lifecycle/approval-decision.json", "spec/archetype-spec.json"],
      blockers: ["Approval proof is missing the draft contract fingerprint."],
      next_action: "Regenerate the draft, then submit approve through archetype_submit_review to generate canonical artifacts."
    });
  }
  const current = currentContractFingerprint(pkg);
  const mismatches = [
    JSON.stringify(proof.routes ?? []) === JSON.stringify(current.routes) ? "" : "routes changed after approval",
    JSON.stringify(proof.screens ?? []) === JSON.stringify(current.screens) ? "" : "screens changed after approval",
    JSON.stringify(proof.component_names ?? []) === JSON.stringify(current.component_names) ? "" : "component set changed after approval",
    proof.token_digest === current.token_digest ? "" : "design token digest changed after approval",
    proof.frontend_contract_digest === current.frontend_contract_digest ? "" : "frontend contract digest changed after approval"
  ].filter(Boolean);
  return gate({
    id: "ACP-05",
    name: "Approved Draft To Canonical Parity",
    phase: "canonical",
    severity: "P0",
    status: mismatches.length === 0 ? "pass" : "fail",
    requirement: "Canonical routes, screens, component set, token digest, and frontend contract digest must match the human-approved draft fingerprint.",
    evidence_refs: ["lifecycle/approval-decision.json", "draft/experience-architecture.draft.json", "draft/design-system.draft.json", "spec/archetype-spec.json"],
    blockers: mismatches,
      next_action: mismatches.length === 0 ? "Proceed to test-first authoring." : "Stop implementation and repair the draft/canonical drift before handoff with archetype_submit_review."
  });
}

function materialDecision(pkg: ArchetypePackage): "confirmed" | "missing" {
  const decision = pkg.lifecycle.contextMatrix.decisions.find((item) => item.id === "source_materials_review");
  return decision?.status === "confirmed" ? "confirmed" : "missing";
}

function routeProposals(pkg: ArchetypePackage): AgentControlPlaneRouteProposal[] {
  const approved = pkg.manifest.implementation_authorized === true;
  return pkg.experience.routeMap.routes.map((route) => {
    const refs = route.evidence_refs;
    const confirmed = refs.some((ref) => pkg.evidence.decisions.some((decision) => decision.id === ref && decision.status === "confirmed"));
    const source: AgentControlPlaneRouteProposal["source"] = confirmed
      ? "user_or_material_confirmed"
      : approved
        ? "approved_candidate"
        : "candidate_inference";
    return {
      route: route.route,
      screen_id: route.screen_id,
      nav_label: route.nav_label,
      source,
      approval_state: approved || confirmed ? "approved" : "candidate_until_approval",
      evidence_refs: refs
    };
  });
}

function specialistGates(): AgentControlPlaneSpecialistGate[] {
  return [
    { role: "product-architect", required: true, authority: "Product model, source sufficiency, assumption ledger, and route proposal sanity.", blocks_when_missing: true, output_artifact: "draft/specialist-review.json" },
    { role: "experience-architect", required: true, authority: "Information architecture, route map, screen inventory, flows, and state matrix.", blocks_when_missing: true, output_artifact: "draft/specialist-review.json" },
    { role: "design-system-architect", required: true, authority: "Tokens, typography, component states, design-system preview, and anti-default-component review.", blocks_when_missing: true, output_artifact: "draft/design-system-review.md" },
    { role: "frontend-practice-enforcer", required: true, authority: "Frontend best-practice skills as pass/fail checks, not recommendations.", blocks_when_missing: true, output_artifact: "governance/frontend-practice-skills.json" },
    { role: "test-first-developer", required: true, authority: "Red-first test contract and preservation of test ids through green runs.", blocks_when_missing: true, output_artifact: "test-first/test-first-contract.json" },
    { role: "qa-lead", required: true, authority: "Playwright, malformed-data, accessibility, visual, and contract-drift evidence.", blocks_when_missing: true, output_artifact: "qa/scenario-catalog.json" },
    { role: "contract-drift-qa", required: true, authority: "Reject implementation, route, token, state, and canonical parity drift.", blocks_when_missing: true, output_artifact: "qa/contract-drift-report.md" }
  ];
}

function buildGates(pkg: ArchetypePackage, packageType: PackageType): AgentControlPlaneGate[] {
  const materialStatus = materialDecision(pkg);
  const contextComplete = pkg.lifecycle.contextMatrix.status === "complete";
  const oneQuestion = pkg.lifecycle.contextCompletion.questions.length <= 1;
  const approval = asRecord(pkg.manifest.contract_approval);
  const approvalBlockers = stringArray(approval.blockers);
  const buttonStates = componentStateNames(pkg, "Button");
  const buttonMissingStates = ["hover", "focus", "active", "disabled", "loading"].filter((state) => !buttonStates.includes(state));
  const testQualityStandardPresent = packageType === "canonical_contract" && asArray(pkg.testFirst.contractJson.suites).length > 0;
  const playwrightContract = asRecord(pkg.playwright.contractJson);
  const testBehaviorCount = stringArray(playwrightContract.required_test_behaviors).length;
  const requiredTestBehaviorCount = 10;

  return [
    gate({
      id: "ACP-01",
      name: "Material Intake Gate",
      phase: "intake",
      severity: "P0",
      status: materialStatus === "confirmed" ? "pass" : "blocked",
      requirement: "Archetype must ask for SPEC, SOP, PRD, screenshots, design docs, API docs, route maps, repo files, or an explicit no-materials decision before drafting.",
      evidence_refs: ["lifecycle/context-matrix.json", "lifecycle/source-graph.json"],
      blockers: materialStatus === "confirmed" ? [] : ["No source-material intake decision was recorded."],
      next_action: materialStatus === "confirmed" ? "Continue context evaluation." : "Ask the source-material question exactly once."
    }),
    gate({
      id: "ACP-02",
      name: "Context Sufficiency Gate",
      phase: "clarification",
      severity: "P0",
      status: contextComplete ? "pass" : "blocked",
      requirement: "No draft, spec, tests, or implementation may depend on unapproved invention.",
      evidence_refs: ["lifecycle/context-matrix.json", "lifecycle/context-completion.json"],
      blockers: contextComplete ? [] : pkg.lifecycle.contextMatrix.blockers,
      next_action: contextComplete ? "Continue to draft review." : "Ask the current one-question clarification blocker."
    }),
    gate({
      id: "ACP-03",
      name: "One-Question Clarification Gate",
      phase: "clarification",
      severity: "P1",
      status: oneQuestion ? "pass" : "fail",
      requirement: "Clarification must never become a bulk form.",
      evidence_refs: ["lifecycle/clarification-turn.json", "lifecycle/clarification-questions.json"],
      blockers: oneQuestion ? [] : ["More than one current clarification question is exposed."],
      next_action: oneQuestion ? "Keep asking one question per turn." : "Collapse clarification output to the highest-impact blocker."
    }),
    gate({
      id: "ACP-04",
      name: "Route Proposal Approval Gate",
      phase: "approval",
      severity: "P0",
      status: pkg.manifest.implementation_authorized === true ? "pass" : "blocked",
      requirement: "Routes are proposals until human approval binds them; implementation agents may not invent or silently accept route maps.",
      evidence_refs: ["draft/experience-architecture.draft.json", "lifecycle/approval-decision.json", "experience/route-map.json"],
      blockers: pkg.manifest.implementation_authorized === true ? [] : ["Route map is a candidate draft and cannot authorize implementation."],
      next_action: pkg.manifest.implementation_authorized === true ? "Freeze route map as canonical." : "Show route proposals in the draft review and request approval or edits."
    }),
    canonicalParityGate(pkg, packageType),
    gate({
      id: "ACP-06",
      name: "Bound Human Approval Gate",
      phase: "approval",
      severity: "P0",
      status: approvalBlockers.length === 0 && pkg.manifest.implementation_authorized === true ? "pass" : "blocked",
      requirement: "Implementation authorization requires a bound human approval proof, not edited JSON fields.",
      evidence_refs: ["lifecycle/approval-decision.json", "draft/contract-approval-request.json"],
      blockers: approvalBlockers.length > 0 ? approvalBlockers : pkg.manifest.implementation_authorized ? [] : ["Human approval is pending."],
      next_action: pkg.manifest.implementation_authorized ? "Proceed to canonical test-first handoff." : "Capture approve, request_changes, or reject through archetype_submit_review after human draft review."
    }),
    gate({
      id: "ACP-07",
      name: "Design System State Contract Gate",
      phase: "draft",
      severity: "P1",
      status: buttonMissingStates.length === 0 ? "pass" : "fail",
      requirement: "Core CTAs and controls must define hover, focus-visible, active, disabled, and loading states before implementation.",
      evidence_refs: ["draft/design-system.draft.json", "design-system/component-contracts.json", "draft/design-system-preview.html"],
      blockers: buttonMissingStates.map((state) => `Button contract missing ${state} state.`),
      next_action: buttonMissingStates.length === 0 ? "Review the browser design-system preview." : "Repair component state contracts before draft approval."
    }),
    gate({
      id: "ACP-08",
      name: "Test-First Quality Gate",
      phase: "test_first",
      severity: "P0",
      status: packageType === "canonical_contract"
        ? testQualityStandardPresent && testBehaviorCount >= requiredTestBehaviorCount ? "pass" : "fail"
        : "blocked",
      requirement: "Tests must be authored before implementation and must prove behavior, accessibility, malformed data, route transitions, and visual evidence.",
      evidence_refs: ["test-first/test-first-contract.json", "test-first/test-quality-standard.json", "verification/playwright-verification-contract.json"],
      blockers: packageType === "canonical_contract"
        ? testQualityStandardPresent && testBehaviorCount >= requiredTestBehaviorCount ? [] : ["Canonical package is missing strong test-first or Playwright behavior obligations."]
        : ["Test-first artifacts are blocked until canonical approval."],
      next_action: packageType === "canonical_contract" ? "Generate and run red tests before UI code." : "Do not author implementation tests before approval."
    })
  ];
}

export function buildAgentControlPlaneReport(pkg: ArchetypePackage, packageType: PackageType): AgentControlPlaneReport {
  const gates = buildGates(pkg, packageType);
  const blockers = gates.flatMap((item) => item.status === "fail" || item.status === "blocked" ? item.blockers.map((blocker) => `${item.id}: ${blocker}`) : []);
  const warnings = gates.flatMap((item) => item.warnings.map((warning) => `${item.id}: ${warning}`));
  const status: AgentControlPlaneStatus = gates.some((item) => item.status === "fail")
    ? "fail"
    : gates.some((item) => item.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    artifact_version: "1.0",
    source_scope: "agent-control-plane",
    status,
    package_type: packageType,
    lifecycle_authority: {
      rule: "The Agent Control Plane decides whether the host agent may clarify, draft, approve, generate canonical contracts, author tests, implement, verify, QA, repair, or complete.",
      source_of_truth: ["lifecycle/context-matrix.json", "governance/agent-control-plane.json", "data-plane/runs/<run-id>/events.jsonl"],
      data_plane_required: true,
      host_agent_may_override: false
    },
    context: {
      context_status: String(pkg.lifecycle.contextMatrix.status),
      readiness_tier: String(pkg.manifest.readiness_tier),
      implementation_authorized: pkg.manifest.implementation_authorized === true,
      material_intake_status: materialDecision(pkg),
      one_question_clarification: pkg.lifecycle.contextCompletion.questions.length <= 1
    },
    gates,
    route_proposals: routeProposals(pkg),
    specialist_gates: specialistGates(),
    required_handoff_order: [
      "material_intake",
      "one_question_clarification",
      "draft_contract",
      "specialist_review",
      "human_approval",
      "canonical_parity",
      "test_first_red_run",
      "implementation",
      "playwright_verification",
      "qa_evidence",
      "repair_until_green"
    ],
    blockers,
    warnings
  };
}

export function agentControlPlaneMarkdown(report: AgentControlPlaneReport): string {
  return [
    "# Agent Control Plane",
    "",
    `Status: ${report.status}`,
    `Package type: ${report.package_type}`,
    `Implementation authorized: ${report.context.implementation_authorized}`,
    "",
    "## Authority",
    "",
    report.lifecycle_authority.rule,
    "",
    "## Gates",
    "",
    ...report.gates.map((item) => `- [${item.status}] ${item.id} ${item.name}: ${item.next_action}`),
    "",
    "## Route Proposals",
    "",
    ...(report.route_proposals.length > 0
      ? report.route_proposals.map((route) => `- ${route.route} -> ${route.screen_id} (${route.source}, ${route.approval_state})`)
      : ["- None."]),
    "",
    "## Specialist Gates",
    "",
    ...report.specialist_gates.map((item) => `- ${item.role}: ${item.authority}`),
    "",
    "## Blockers",
    "",
    ...(report.blockers.length > 0 ? report.blockers.map((item) => `- ${item}`) : ["- None."])
  ].join("\n");
}
