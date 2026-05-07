import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { HL16_CONVERGENCE_QUESTIONS } from "../modules/convergenceStandard";
import { HL13_ACCEPTANCE_CRITERIA, HL13_FORBIDDEN_BEHAVIORS } from "../modules/forbiddenBehaviorAcceptance";
import { HL15_IMPLEMENTATION_PHASE_NAMES } from "../modules/implementationPhases";
import { QA_AGENT_ROLES, REQUIRED_QA_ARTIFACTS } from "../modules/qaTeam";
import { FORBIDDEN_TEST_PATTERNS, REQUIRED_TEST_BEHAVIORS } from "../modules/testQualityStandard";
import { REQUIRED_COMPLETE_PACKAGE_ARTIFACTS } from "../modules/requiredPackageArtifacts";

interface PackageValidationResult {
  status: "pass" | "fail";
  outputDir: string;
  checkedFiles: number;
  blockers: string[];
  warnings: string[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readJsonSafe<T>(filePath: string, blockers: string[], description: string): T | null {
  try {
    return readJson<T>(filePath);
  } catch (error) {
    blockers.push(`${description} is not parseable JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const REQUIRED_FRONTEND_PRACTICE_SKILLS = [
  "frontend-architecture",
  "react-practices",
  "typescript-strictness",
  "design-system-practices",
  "accessibility-practices",
  "forms-and-validation",
  "data-contract-practices",
  "responsive-practices",
  "performance-practices",
  "visual-polish-practices",
  "testing-practices"
];

function frontendPracticePath(skill: string): string {
  return `specialist-gate/frontend-practices/${skill}.json`;
}

function validateFrontendPracticeSkills(input: {
  frontendPracticeSkills: {
    source_scope?: string;
    enforcement_rule?: string;
    required_skills?: string[];
    specialist_gate?: { status?: string; pass_fail?: boolean; output_artifacts?: string[] };
    practices?: Array<{ skill?: string; owner?: string; blocker_list?: unknown[]; output_artifact?: string; status?: string }>;
    blockers?: unknown[];
  };
  specialistReview?: {
    frontend_practice_gate?: {
      source_scope?: string;
      status?: string;
      enforcement_rule?: string;
      required_skills?: string[];
      checks?: Array<{ skill?: string; owner?: string; blocker_list?: unknown[]; output_artifact?: string; status?: string }>;
      blockers?: unknown[];
    };
  };
  blockers: string[];
}): void {
  const artifact = input.frontendPracticeSkills;
  if (artifact.source_scope !== "HL-08") input.blockers.push("Frontend practice skills artifact must identify source_scope HL-08.");
  if (!String(artifact.enforcement_rule ?? "").includes("not optional recommendations")) {
    input.blockers.push("Frontend practice skills artifact must encode the non-optional enforcement rule.");
  }
  if (artifact.specialist_gate?.pass_fail !== true) {
    input.blockers.push("Frontend practice skills must be pass/fail checks in the specialist gate.");
  }
  if (artifact.specialist_gate?.status !== "pass") {
    input.blockers.push("Frontend practice skills specialist gate must pass when all required practice definitions are present.");
  }
  const required = artifact.required_skills ?? [];
  if (required.length !== REQUIRED_FRONTEND_PRACTICE_SKILLS.length || REQUIRED_FRONTEND_PRACTICE_SKILLS.some((skill) => !required.includes(skill))) {
    input.blockers.push("Frontend practice skills artifact must expose every HL-08 required skill.");
  }
  const practices = artifact.practices ?? [];
  for (const skill of REQUIRED_FRONTEND_PRACTICE_SKILLS) {
    const practice = practices.find((item) => item.skill === skill);
    if (!practice) {
      input.blockers.push(`Frontend practice skills missing practice ${skill}.`);
      continue;
    }
    if (!practice.owner) input.blockers.push(`Frontend practice ${skill} is missing an owner.`);
    if (!Array.isArray(practice.blocker_list) || practice.blocker_list.length === 0) {
      input.blockers.push(`Frontend practice ${skill} is missing a blocker list.`);
    }
    if (practice.output_artifact !== frontendPracticePath(skill)) {
      input.blockers.push(`Frontend practice ${skill} must write ${frontendPracticePath(skill)}.`);
    }
    if (practice.status !== "pass") {
      input.blockers.push(`Frontend practice ${skill} must have pass status when owner, blockers, and output artifact exist.`);
    }
  }
  const specialistGate = input.specialistReview?.frontend_practice_gate;
  if (!specialistGate) {
    input.blockers.push("Specialist review must include the HL-08 frontend practice gate.");
    return;
  }
  if (specialistGate.source_scope !== "HL-08" || specialistGate.status !== "pass") {
    input.blockers.push("Specialist review frontend practice gate must identify HL-08 and pass.");
  }
  if (!String(specialistGate.enforcement_rule ?? "").includes("pass/fail checks")) {
    input.blockers.push("Specialist review frontend practice gate must state practices are pass/fail checks.");
  }
  if ((specialistGate.checks ?? []).length !== REQUIRED_FRONTEND_PRACTICE_SKILLS.length) {
    input.blockers.push("Specialist review frontend practice gate must include every HL-08 practice check.");
  }
  for (const skill of REQUIRED_FRONTEND_PRACTICE_SKILLS) {
    const check = specialistGate.checks?.find((item) => item.skill === skill);
    if (!check || !check.owner || !Array.isArray(check.blocker_list) || check.blocker_list.length === 0 || check.output_artifact !== frontendPracticePath(skill)) {
      input.blockers.push(`Specialist review frontend practice check for ${skill} must include owner, blocker list, and output artifact.`);
    }
  }
}

function validateQaEvidence(input: {
  scenarioCatalog: {
    source_scope?: string;
    lifecycle_phase?: string;
    rule?: string;
    qa_agents?: string[];
    required_artifacts?: string[];
    scenarios?: Array<{ scenario_id?: string; type?: string; owner_agent?: string; evidence_artifacts?: unknown[]; status?: string }>;
    coverage?: { playwright_scenarios?: number; malformed_data_scenarios?: number; total_scenarios?: number };
  };
  playwrightResults: {
    source_scope?: string;
    lifecycle_phase?: string;
    owner_agent?: string;
    rule?: string;
    status?: string;
    source_evidence?: string;
    proof_artifacts?: unknown[];
    scenario_count?: number;
  };
  malformedDataResults: {
    source_scope?: string;
    lifecycle_phase?: string;
    owner_agent?: string;
    rule?: string;
    status?: string;
    source_contract?: string;
    scenarios?: unknown[];
    results?: unknown[];
    proof_artifacts?: unknown[];
  };
  accessibilityResultsMarkdown: string;
  visualRegressionReportMarkdown: string;
  contractDriftReportMarkdown: string;
  repairTaskQueue?: { source_contract?: string };
  blockers: string[];
}): void {
  const statuses = ["pending", "pass", "fail", "warning"];
  if (input.scenarioCatalog.source_scope !== "HL-10" || input.scenarioCatalog.lifecycle_phase !== "qa_verification") {
    input.blockers.push("QA scenario catalog must identify HL-10 and qa_verification.");
  }
  if (input.scenarioCatalog.rule !== "QA produces evidence, not vibes.") {
    input.blockers.push("QA scenario catalog must encode the evidence-not-vibes rule.");
  }
  for (const role of QA_AGENT_ROLES) {
    if (!input.scenarioCatalog.qa_agents?.includes(role)) input.blockers.push(`QA scenario catalog missing agent ${role}.`);
  }
  for (const artifact of REQUIRED_QA_ARTIFACTS) {
    if (!input.scenarioCatalog.required_artifacts?.includes(artifact)) input.blockers.push(`QA scenario catalog missing required artifact ${artifact}.`);
  }
  const scenarios = input.scenarioCatalog.scenarios ?? [];
  if (scenarios.length === 0 || input.scenarioCatalog.coverage?.total_scenarios !== scenarios.length) {
    input.blockers.push("QA scenario catalog must expose scenarios and a matching total_scenarios count.");
  }
  const scenarioTypes = new Set(scenarios.map((scenario) => scenario.type));
  for (const type of ["route", "screen_state", "flow", "responsive", "accessibility", "visual_smoke", "malformed_data"]) {
    if (!scenarioTypes.has(type)) input.blockers.push(`QA scenario catalog missing scenario type ${type}.`);
  }
  for (const scenario of scenarios) {
    if (!scenario.scenario_id || !scenario.owner_agent || !Array.isArray(scenario.evidence_artifacts) || !statuses.includes(String(scenario.status))) {
      input.blockers.push("Every QA scenario must expose id, owner_agent, evidence_artifacts, and valid status.");
      break;
    }
  }
  if (input.playwrightResults.source_scope !== "HL-10" || input.playwrightResults.lifecycle_phase !== "qa_verification" || input.playwrightResults.owner_agent !== "playwright-e2e-engineer.md") {
    input.blockers.push("QA Playwright results must identify HL-10, qa_verification, and playwright-e2e-engineer.md.");
  }
  if (input.playwrightResults.rule !== "QA produces evidence, not vibes." || !statuses.includes(String(input.playwrightResults.status))) {
    input.blockers.push("QA Playwright results must encode the evidence rule and a valid status.");
  }
  if (input.playwrightResults.source_evidence !== "verification/playwright-evidence.json" || !Array.isArray(input.playwrightResults.proof_artifacts)) {
    input.blockers.push("QA Playwright results must trace verification/playwright-evidence.json and proof artifacts.");
  }
  if (typeof input.playwrightResults.scenario_count !== "number" || input.playwrightResults.scenario_count <= 0) {
    input.blockers.push("QA Playwright results must include a positive scenario_count.");
  }
  if (input.malformedDataResults.source_scope !== "HL-10" || input.malformedDataResults.lifecycle_phase !== "qa_verification" || input.malformedDataResults.owner_agent !== "malformed-data-qa.md") {
    input.blockers.push("QA malformed data results must identify HL-10, qa_verification, and malformed-data-qa.md.");
  }
  if (input.malformedDataResults.rule !== "QA produces evidence, not vibes." || !statuses.includes(String(input.malformedDataResults.status))) {
    input.blockers.push("QA malformed data results must encode the evidence rule and a valid status.");
  }
  if (input.malformedDataResults.source_contract !== "test-first/test-first-contract.json" || !Array.isArray(input.malformedDataResults.scenarios) || !Array.isArray(input.malformedDataResults.results)) {
    input.blockers.push("QA malformed data results must trace test-first contract and expose scenarios/results.");
  }
  for (const [label, markdown] of [
    ["accessibility", input.accessibilityResultsMarkdown],
    ["visual regression", input.visualRegressionReportMarkdown],
    ["contract drift", input.contractDriftReportMarkdown]
  ] as const) {
    if (!markdown.includes("Source scope: HL-10") || !markdown.includes("Rule: QA produces evidence, not vibes.") || !markdown.includes("## Evidence")) {
      input.blockers.push(`QA ${label} report must include HL-10 source scope, evidence rule, and evidence section.`);
    }
  }
  if (input.repairTaskQueue?.source_contract !== "10-revision/verification-repair-contract.json") {
    input.blockers.push("QA required repair task queue must remain traced to the verification repair contract.");
  }
}

function validateTestQualityStandard(input: {
  testQualityStandard: {
    source_scope?: string;
    rule?: string;
    marker_only_tests_fail_verifier?: boolean;
    forbidden_test_patterns?: string[];
    required_test_behaviors?: string[];
    verifier_enforcement?: { target_test_audit?: string; package_validation?: string; required_artifacts?: string[] };
    exit_condition?: string;
  };
  playwrightContract?: {
    test_quality_standard_path?: string;
    marker_only_tests_fail_verifier?: boolean;
    forbidden_test_patterns?: string[];
    required_test_behaviors?: string[];
  };
  playwrightSpecSource: string;
  testQualityStandardMarkdown: string;
  blockers: string[];
}): void {
  const standard = input.testQualityStandard;
  if (standard.source_scope !== "HL-11") input.blockers.push("Test quality standard must identify source_scope HL-11.");
  if (standard.rule !== "Marker-only tests fail the verifier.") input.blockers.push("Test quality standard must encode the marker-only verifier rule.");
  if (standard.marker_only_tests_fail_verifier !== true) input.blockers.push("Test quality standard must set marker_only_tests_fail_verifier true.");
  for (const pattern of FORBIDDEN_TEST_PATTERNS) {
    if (!standard.forbidden_test_patterns?.includes(pattern)) input.blockers.push(`Test quality standard missing forbidden pattern: ${pattern}`);
    if (!input.playwrightContract?.forbidden_test_patterns?.includes(pattern)) input.blockers.push(`Playwright contract missing forbidden test pattern: ${pattern}`);
  }
  for (const behavior of REQUIRED_TEST_BEHAVIORS) {
    if (!standard.required_test_behaviors?.includes(behavior)) input.blockers.push(`Test quality standard missing required behavior: ${behavior}`);
    if (!input.playwrightContract?.required_test_behaviors?.includes(behavior)) input.blockers.push(`Playwright contract missing required test behavior: ${behavior}`);
  }
  if (input.playwrightContract?.test_quality_standard_path !== "test-first/test-quality-standard.json") {
    input.blockers.push("Playwright contract must point to test-first/test-quality-standard.json.");
  }
  if (input.playwrightContract?.marker_only_tests_fail_verifier !== true) {
    input.blockers.push("Playwright contract must enforce marker-only verifier failure.");
  }
  for (const artifact of ["test-first/test-quality-standard.json", "verification/playwright-verification-contract.json", "verification/playwright-verification.spec.ts"]) {
    if (!standard.verifier_enforcement?.required_artifacts?.includes(artifact)) {
      input.blockers.push(`Test quality standard verifier enforcement missing artifact ${artifact}.`);
    }
  }
  for (const expected of ["getByRole", "innerText", "toContainText", "keyboard", "screenshot", "setViewportSize"]) {
    if (!input.playwrightSpecSource.includes(expected)) {
      input.blockers.push(`Playwright verification spec must include non-marker test signal ${expected}.`);
    }
  }
  if (standard.exit_condition !== "Marker-only tests fail the verifier.") {
    input.blockers.push("Test quality standard must preserve the HL-11 exit condition.");
  }
  for (const expected of ["## Forbidden Test Patterns", "## Required Test Behaviors", "## Exit Condition", "Marker-only tests fail the verifier."]) {
    if (!input.testQualityStandardMarkdown.includes(expected)) {
      input.blockers.push(`Test quality standard markdown missing ${expected}.`);
    }
  }
}

function validateRequiredPackageArtifacts(input: {
  outputDir: string;
  topManifest: { artifacts?: Array<{ path?: string; required?: boolean }> };
  internalManifest: { artifact_index?: string[]; implementation_authorized?: boolean };
  approvalDecision: {
    source_scope?: string;
    source_artifact?: string;
    approved?: boolean;
    artifact_refs?: unknown[];
    traceability?: Record<string, unknown>;
    exit_condition?: string;
  };
  approvalRequestMarkdown: string;
  specialistReviewSummaryMarkdown: string;
  initialRedTestRunMarkdown: string;
  finalReadinessReportMarkdown: string;
  blockers: string[];
}): void {
  const topManifestPaths = new Set((input.topManifest.artifacts ?? []).filter((artifact) => artifact.required !== false).map((artifact) => artifact.path));
  const internalArtifactIndex = new Set(input.internalManifest.artifact_index ?? []);
  for (const artifact of REQUIRED_COMPLETE_PACKAGE_ARTIFACTS) {
    if (!existsSync(path.join(input.outputDir, artifact))) input.blockers.push(`Required complete package artifact missing: ${artifact}`);
    if (!topManifestPaths.has(artifact)) input.blockers.push(`Top-level manifest missing required complete package artifact ${artifact}.`);
    if (!internalArtifactIndex.has(artifact)) input.blockers.push(`Internal manifest artifact index missing required complete package artifact ${artifact}.`);
  }
  if (input.approvalDecision.source_scope !== "HL-12") input.blockers.push("Approval decision must identify source_scope HL-12.");
  if (input.approvalDecision.source_artifact !== "00-manifest/manifest.json#/contract_approval") {
    input.blockers.push("Approval decision must trace 00-manifest/manifest.json#/contract_approval.");
  }
  if (input.internalManifest.implementation_authorized === true && input.approvalDecision.approved !== true) {
    input.blockers.push("Implementation-authorized complete package must include an approved approval decision.");
  }
  if (!Array.isArray(input.approvalDecision.artifact_refs) || input.approvalDecision.artifact_refs.length === 0) {
    input.blockers.push("Approval decision must preserve approval artifact refs.");
  }
  for (const trace of ["approval_request", "contract_approval_request", "context_matrix", "evidence_ledger", "manifest"]) {
    if (!input.approvalDecision.traceability?.[trace]) input.blockers.push(`Approval decision missing traceability ${trace}.`);
  }
  if (input.approvalDecision.exit_condition !== "Every complete package preserves traceable contract evidence.") {
    input.blockers.push("Approval decision must preserve the HL-12 exit condition.");
  }
  for (const [label, markdown, expected] of [
    ["approval request", input.approvalRequestMarkdown, ["Source scope: HL-12", "draft/contract-approval-request.json", "## Confirmed Facts", "## Candidate Assumptions"]],
    ["specialist review summary", input.specialistReviewSummaryMarkdown, ["Source scope: HL-12", "draft/specialist-review.json", "No agent can approve its own work.", "## Frontend Practice Gate"]],
    ["initial red test run", input.initialRedTestRunMarkdown, ["Source scope: HL-12", "test-first/test-first-contract.json", "test-first/test-quality-standard.json", "## Required Target Test Files"]],
    ["final readiness report", input.finalReadinessReportMarkdown, ["Source scope: HL-12", "Every complete package preserves traceable contract evidence.", "## Required Evidence"]]
  ] as const) {
    for (const token of expected) {
      if (!markdown.includes(token)) input.blockers.push(`Required ${label} artifact missing ${token}.`);
    }
  }
}

function validateForbiddenBehaviorAcceptance(input: {
  forbiddenBehaviors: {
    source_scope?: string;
    rule?: string;
    forbidden_behaviors?: Array<{
      id?: string;
      behavior?: string;
      encoded_as?: string;
      validator_or_test?: string;
      evidence_artifacts?: unknown[];
      status?: string;
    }>;
    acceptance_criteria?: Array<{ id?: string; criterion?: string; encoded_as?: string }>;
    exit_condition?: string;
  };
  forbiddenBehaviorsMarkdown: string;
  lifecycleExecutionState?: { states?: Array<{ state?: string; forbidden?: string[] }> };
  repairTaskQueue?: { completion_gate?: string };
  qaPlaywrightResults?: { source_evidence?: string };
  blockers: string[];
}): void {
  const artifact = input.forbiddenBehaviors;
  if (artifact.source_scope !== "HL-13") input.blockers.push("Forbidden behavior contract must identify source_scope HL-13.");
  if (artifact.rule !== "Forbidden behaviors are encoded as tests or validators.") {
    input.blockers.push("Forbidden behavior contract must encode the HL-13 rule.");
  }
  if (artifact.exit_condition !== "Forbidden behaviors are encoded as tests or validators.") {
    input.blockers.push("Forbidden behavior contract must preserve the HL-13 exit condition.");
  }

  const behaviors = artifact.forbidden_behaviors ?? [];
  const behaviorText = behaviors.map((behavior) => behavior.behavior);
  if (behaviors.length !== HL13_FORBIDDEN_BEHAVIORS.length || HL13_FORBIDDEN_BEHAVIORS.some((behavior) => !behaviorText.includes(behavior))) {
    input.blockers.push("Forbidden behavior contract must list every exact HL-13 forbidden behavior.");
  }
  const allowedEncodings = ["validator", "contract_test", "lifecycle_gate"];
  for (const behavior of behaviors) {
    if (!behavior.id || !String(behavior.id).startsWith("HL13-F")) {
      input.blockers.push("Every forbidden behavior must have an HL13-F id.");
      break;
    }
    if (behavior.status !== "encoded") {
      input.blockers.push(`Forbidden behavior ${behavior.behavior ?? behavior.id} must have encoded status.`);
    }
    if (!allowedEncodings.includes(String(behavior.encoded_as))) {
      input.blockers.push(`Forbidden behavior ${behavior.behavior ?? behavior.id} must be encoded as a validator, contract test, or lifecycle gate.`);
    }
    if (!behavior.validator_or_test) {
      input.blockers.push(`Forbidden behavior ${behavior.behavior ?? behavior.id} must name the validator or contract test.`);
    }
    if (!Array.isArray(behavior.evidence_artifacts) || behavior.evidence_artifacts.length === 0) {
      input.blockers.push(`Forbidden behavior ${behavior.behavior ?? behavior.id} must name evidence artifacts.`);
    }
  }

  const byBehavior = new Map(behaviors.map((behavior) => [behavior.behavior, behavior]));
  if (byBehavior.get("Generate tests that only validate its own markers.")?.validator_or_test !== "scripts/run-test-quality-standard-contract.mjs") {
    input.blockers.push("Marker-only test behavior must be encoded by scripts/run-test-quality-standard-contract.mjs.");
  }
  if (byBehavior.get("Let implementation mutate the contract without approved evidence.")?.validator_or_test !== "scripts/run-repair-contract.mjs") {
    input.blockers.push("Implementation contract mutation behavior must be encoded by scripts/run-repair-contract.mjs.");
  }
  if (byBehavior.get("Ask bulk questions when one-question clarification is possible.")?.validator_or_test !== "scripts/run-clarification-ux-contract.mjs") {
    input.blockers.push("Bulk question behavior must be encoded by scripts/run-clarification-ux-contract.mjs.");
  }
  const qaEvidence = byBehavior.get("Let QA pass without Playwright evidence.")?.evidence_artifacts ?? [];
  if (!qaEvidence.includes("qa/playwright-results.json") || !qaEvidence.includes("verification/playwright-evidence.json")) {
    input.blockers.push("QA forbidden behavior must require QA Playwright results and Playwright evidence artifacts.");
  }

  const criteria = artifact.acceptance_criteria ?? [];
  const criterionText = criteria.map((criterion) => criterion.criterion);
  if (criteria.length !== HL13_ACCEPTANCE_CRITERIA.length || HL13_ACCEPTANCE_CRITERIA.some((criterion) => !criterionText.includes(criterion))) {
    input.blockers.push("Forbidden behavior contract must list every exact HL-13 acceptance criterion.");
  }
  for (const criterion of criteria) {
    if (!criterion.id || !String(criterion.id).startsWith("HL13-A") || criterion.encoded_as !== "contract_test_or_validator") {
      input.blockers.push("Every HL-13 acceptance criterion must have an HL13-A id and contract_test_or_validator encoding.");
      break;
    }
  }

  for (const expected of ["Source scope: HL-13", "## Forbidden Behaviors", "## Acceptance Criteria", "## Exit Condition", "Forbidden behaviors are encoded as tests or validators."]) {
    if (!input.forbiddenBehaviorsMarkdown.includes(expected)) {
      input.blockers.push(`Forbidden behavior markdown missing ${expected}.`);
    }
  }

  const executionForbidden = (input.lifecycleExecutionState?.states ?? []).flatMap((state) => state.forbidden ?? []);
  for (const expected of ["Replace real behavior with generic success panels.", "Close with unresolved repair queue.", "Claim production readiness without evidence."]) {
    if (input.lifecycleExecutionState && !executionForbidden.includes(expected)) {
      input.blockers.push(`Lifecycle execution state must encode forbidden behavior: ${expected}`);
    }
  }
  if (input.qaPlaywrightResults && input.qaPlaywrightResults.source_evidence !== "verification/playwright-evidence.json") {
    input.blockers.push("QA cannot pass without tracing verification/playwright-evidence.json.");
  }
  if (input.repairTaskQueue && !String(input.repairTaskQueue.completion_gate ?? "").includes("verify-target")) {
    input.blockers.push("Completion must require a clean repair queue behind the verify-target completion gate.");
  }
}

function validateImplementationPhases(input: {
  implementationPhases: {
    source_scope?: string;
    expected_sequence?: string[];
    phase_1_priority?: {
      needs_clarification_blocks_implementation_readiness?: boolean;
      checked_artifacts?: unknown[];
    };
    current_package?: {
      package_type?: string;
      context_status?: string;
      readiness_tier?: string;
      ready_for_frontend_agent?: boolean;
      implementation_authorized?: boolean;
    };
    implementation_readiness_gate?: {
      status?: string;
      can_enter_ready_for_implementation?: boolean;
      needs_clarification_blocks_implementation_readiness?: boolean;
      blockers?: string[];
      evidence_refs?: unknown[];
    };
    phases?: Array<{
      phase_id?: string;
      order?: number;
      name?: string;
      status?: string;
      contract_tests?: string[];
      lifecycle_acceptance_gate?: {
        gate_id?: string;
        status?: string;
        lifecycle_gate?: string;
        required_artifacts?: unknown[];
        required_tests?: unknown[];
        pass_condition?: string;
      };
    }>;
    exit_condition?: string;
  };
  implementationPhasesMarkdown: string;
  packageType: string;
  contextStatus: string;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  implementationAuthorized: boolean;
  blockers: string[];
}): void {
  const artifact = input.implementationPhases;
  const expectedSequence = [...HL15_IMPLEMENTATION_PHASE_NAMES];
  if (artifact.source_scope !== "HL-15") input.blockers.push("Implementation phases artifact must identify source_scope HL-15.");
  if (JSON.stringify(artifact.expected_sequence ?? []) !== JSON.stringify(expectedSequence)) {
    input.blockers.push("Implementation phases artifact must expose the exact HL-15 phase sequence.");
  }
  if (artifact.exit_condition !== "Each phase has tests and a lifecycle acceptance gate.") {
    input.blockers.push("Implementation phases artifact must preserve the HL-15 exit condition.");
  }
  if (artifact.phase_1_priority?.needs_clarification_blocks_implementation_readiness !== true) {
    input.blockers.push("Implementation phases phase 1 priority must block implementation readiness when context needs clarification.");
  }
  for (const requiredArtifact of ["lifecycle/context-matrix.json", "lifecycle/readiness-tiers.json", "00-manifest/implementation-readiness.json", "manifest.json"]) {
    if (!artifact.phase_1_priority?.checked_artifacts?.includes(requiredArtifact)) {
      input.blockers.push(`Implementation phases phase 1 priority missing checked artifact ${requiredArtifact}.`);
    }
  }
  if (artifact.current_package?.package_type !== input.packageType) {
    input.blockers.push("Implementation phases package type must match the exported package.");
  }
  if (artifact.current_package?.context_status !== input.contextStatus) {
    input.blockers.push("Implementation phases context status must match lifecycle context status.");
  }
  if (artifact.current_package?.readiness_tier !== input.readinessTier) {
    input.blockers.push("Implementation phases readiness tier must match manifest readiness tier.");
  }
  if (artifact.current_package?.ready_for_frontend_agent !== input.readyForFrontendAgent) {
    input.blockers.push("Implementation phases frontend-agent readiness must match manifest readiness.");
  }
  if (artifact.current_package?.implementation_authorized !== input.implementationAuthorized) {
    input.blockers.push("Implementation phases implementation authorization must match manifest authorization.");
  }

  const gate = artifact.implementation_readiness_gate;
  const shouldEnterImplementation = input.contextStatus !== "needs_clarification" &&
    input.readinessTier === "ready_for_implementation" &&
    input.readyForFrontendAgent === true &&
    input.implementationAuthorized === true;
  if (gate?.needs_clarification_blocks_implementation_readiness !== true) {
    input.blockers.push("Implementation readiness gate must explicitly encode the needs_clarification block.");
  }
  if (gate?.can_enter_ready_for_implementation !== shouldEnterImplementation) {
    input.blockers.push("Implementation readiness gate must match readiness tier, context status, frontend readiness, and authorization.");
  }
  if (gate?.status !== (shouldEnterImplementation ? "satisfied" : "blocked")) {
    input.blockers.push("Implementation readiness gate status must be satisfied only for implementation-ready packages.");
  }
  if (input.contextStatus === "needs_clarification" && !gate?.blockers?.includes("context_status is needs_clarification")) {
    input.blockers.push("Implementation readiness gate must name needs_clarification as a blocker.");
  }
  if (!Array.isArray(gate?.evidence_refs) || gate.evidence_refs.length === 0) {
    input.blockers.push("Implementation readiness gate must point to evidence artifacts.");
  }

  const phases = artifact.phases ?? [];
  if (phases.length !== expectedSequence.length) {
    input.blockers.push("Implementation phases artifact must expose exactly seven phases.");
  }
  for (const [index, expectedName] of expectedSequence.entries()) {
    const phase = phases[index];
    if (!phase || phase.order !== index + 1 || phase.name !== expectedName || phase.phase_id !== `HL15-P${String(index + 1).padStart(2, "0")}`) {
      input.blockers.push(`Implementation phases sequence mismatch at ${expectedName}.`);
      continue;
    }
    if (!Array.isArray(phase.contract_tests) || phase.contract_tests.length === 0) {
      input.blockers.push(`Implementation phase ${expectedName} must include contract tests.`);
    }
    const acceptanceGate = phase.lifecycle_acceptance_gate;
    if (!acceptanceGate?.gate_id || !acceptanceGate.lifecycle_gate || !Array.isArray(acceptanceGate.required_artifacts) || acceptanceGate.required_artifacts.length === 0) {
      input.blockers.push(`Implementation phase ${expectedName} must include a lifecycle acceptance gate with artifacts.`);
    }
    if (!Array.isArray(acceptanceGate?.required_tests) || JSON.stringify(acceptanceGate.required_tests) !== JSON.stringify(phase.contract_tests)) {
      input.blockers.push(`Implementation phase ${expectedName} acceptance gate must require the same tests as the phase.`);
    }
    if (!String(acceptanceGate?.pass_condition ?? "").includes("pass")) {
      input.blockers.push(`Implementation phase ${expectedName} acceptance gate must encode a pass condition.`);
    }
  }
  for (const expected of ["Source scope: HL-15", "## Phase 1 Priority", "## Phases", "## Exit Condition", "Each phase has tests and a lifecycle acceptance gate."]) {
    if (!input.implementationPhasesMarkdown.includes(expected)) {
      input.blockers.push(`Implementation phases markdown missing ${expected}.`);
    }
  }
}

function validateConvergenceStandard(input: {
  convergenceStandard: {
    source_scope?: string;
    required_answer?: string;
    convergence_questions?: Array<{
      id?: string;
      question?: string;
      answer?: string;
      status?: string;
      automated_evidence?: unknown[];
      documented_evidence?: unknown[];
      lifecycle_artifacts?: unknown[];
    }>;
    automated_evidence_summary?: unknown[];
    documented_evidence_summary?: unknown[];
    exit_condition?: string;
  };
  convergenceStandardMarkdown: string;
  blockers: string[];
}): void {
  const artifact = input.convergenceStandard;
  const expectedQuestions = [...HL16_CONVERGENCE_QUESTIONS];
  if (artifact.source_scope !== "HL-16") input.blockers.push("Convergence standard must identify source_scope HL-16.");
  if (artifact.required_answer !== "No.") input.blockers.push("Convergence standard required answer must be No.");
  if (artifact.exit_condition !== "All convergence questions answer no through automated and documented evidence.") {
    input.blockers.push("Convergence standard must preserve the HL-16 exit condition.");
  }
  const questions = artifact.convergence_questions ?? [];
  if (questions.length !== expectedQuestions.length) {
    input.blockers.push("Convergence standard must expose exactly five convergence questions.");
  }
  for (const [index, expectedQuestion] of expectedQuestions.entries()) {
    const question = questions[index];
    if (!question || question.id !== `HL16-Q${String(index + 1).padStart(2, "0")}` || question.question !== expectedQuestion) {
      input.blockers.push(`Convergence standard question mismatch: ${expectedQuestion}`);
      continue;
    }
    if (question.answer !== "No." || question.status !== "evidence_backed_no") {
      input.blockers.push(`Convergence standard question must answer No with evidence: ${expectedQuestion}`);
    }
    if (!Array.isArray(question.automated_evidence) || question.automated_evidence.length === 0) {
      input.blockers.push(`Convergence standard question missing automated evidence: ${expectedQuestion}`);
    }
    if (!Array.isArray(question.documented_evidence) || question.documented_evidence.length === 0) {
      input.blockers.push(`Convergence standard question missing documented evidence: ${expectedQuestion}`);
    }
    if (!Array.isArray(question.lifecycle_artifacts) || question.lifecycle_artifacts.length === 0) {
      input.blockers.push(`Convergence standard question missing lifecycle artifacts: ${expectedQuestion}`);
    }
  }
  const requiredAutomation = [
    "npm test",
    "npm run marketing-replay:contract",
    "npm run test-quality:contract",
    "npm run qa-team:contract",
    "npm run repair:contract"
  ];
  for (const item of requiredAutomation) {
    if (!artifact.automated_evidence_summary?.includes(item)) {
      input.blockers.push(`Convergence standard automated evidence summary missing ${item}.`);
    }
  }
  for (const item of ["README.md", "docs/agent-lifecycle.md", "governance/convergence-standard.md"]) {
    if (!artifact.documented_evidence_summary?.includes(item)) {
      input.blockers.push(`Convergence standard documented evidence summary missing ${item}.`);
    }
  }
  for (const expected of ["Source scope: HL-16", "Required answer: No.", "## Questions", "## Automated Evidence", "## Documented Evidence", "## Exit Condition"]) {
    if (!input.convergenceStandardMarkdown.includes(expected)) {
      input.blockers.push(`Convergence standard markdown missing ${expected}.`);
    }
  }
}

function validateDesignSystemPreview(input: {
  previewHtml: string;
  reviewMarkdown: string;
  blockers: string[];
}): void {
  const html = input.previewHtml;
  const review = input.reviewMarkdown;
  for (const expected of [
    "data-archetype-artifact=\"draft-design-system-preview\"",
    "data-source-artifact=\"draft/design-system.draft.json\"",
    "data-source-scope=\"HL-17\"",
    "Colors",
    "Typography",
    "Components",
    "Component States",
    "Token Tables",
    "Full Draft Contract Data",
    "not app code",
    "not the source of truth"
  ]) {
    if (!html.includes(expected)) input.blockers.push(`Draft design system preview missing ${expected}.`);
  }
  if (/<script\b/i.test(html)) {
    input.blockers.push("Draft design system preview must be static HTML without scripts.");
  }
  for (const expected of [
    "Source scope: HL-17",
    "draft/design-system.draft.json",
    "draft/design-system-preview.html",
    "one clarification question",
    "not app implementation",
    "not the source of truth",
    "No implementation agent may build product UI from this preview alone."
  ]) {
    if (!review.includes(expected)) input.blockers.push(`Draft design system review missing ${expected}.`);
  }
}

function validateDraftPackage(outputDir: string): PackageValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const requiredFiles = [
    "README.md",
    "manifest.json",
    "00-manifest/manifest.json",
    "00-manifest/implementation-readiness.json",
    "readiness-report.md",
    "lifecycle/state-machine.json",
    "lifecycle/contract-state.json",
    "lifecycle/start-request.json",
    "lifecycle/context-completion.json",
    "lifecycle/context-matrix.json",
    "lifecycle/readiness-tiers.json",
    "lifecycle/readiness-tiers.md",
    "lifecycle/implementation-phases.json",
    "lifecycle/implementation-phases.md",
    "lifecycle/clarification-turn.json",
    "lifecycle/clarification-state.json",
    "lifecycle/clarification-transcript.md",
    "lifecycle/lifecycle-report.md",
    "01-evidence/evidence-ledger.json",
    "01-evidence/missing-context.md",
    "governance/non-negotiable-principles.json",
    "governance/evidence-decision-model.json",
    "governance/forbidden-behaviors.json",
    "governance/forbidden-behaviors.md",
    "governance/convergence-standard.json",
    "governance/convergence-standard.md",
    "governance/frontend-practice-skills.json",
    "governance/frontend-practice-skills.md",
    ...REQUIRED_FRONTEND_PRACTICE_SKILLS.map(frontendPracticePath),
    "draft/product-model.draft.json",
    "draft/experience-architecture.draft.json",
    "draft/design-system.draft.json",
    "draft/design-system-preview.html",
    "draft/design-system-review.md",
    "draft/frontend-contract.draft.json",
    "draft/assumption-ledger.md",
    "draft/specialist-review.json",
    "draft/contract-approval-request.json"
  ];
  const forbiddenFiles = [
    "spec/archetype-spec.json",
    "spec/archetype-spec.md",
    "test-first/test-first-contract.json",
    "verification/playwright-verification-contract.json",
    "frontend-agent-contract/implementation-rules.json",
    "frontend-agent-contract/frontend-agent-instructions.md",
    "frontend-agent-contract/acceptance-criteria.json",
    "implementation-contract.md"
  ];

  for (const relativePath of requiredFiles) {
    if (!existsSync(path.join(outputDir, relativePath))) blockers.push(`Missing ${relativePath}.`);
  }
  for (const relativePath of forbiddenFiles) {
    if (existsSync(path.join(outputDir, relativePath))) blockers.push(`Draft package must not contain ${relativePath}.`);
  }
  if (blockers.length > 0) return { status: "fail", outputDir, checkedFiles: requiredFiles.length, blockers, warnings };

  const manifest = readJsonSafe<{
    packageType?: string;
    readinessTier?: string;
    readyForFrontendAgent?: boolean;
    implementationAuthorized?: boolean;
    artifacts?: Array<{ id?: string; path?: string }>;
  }>(path.join(outputDir, "manifest.json"), blockers, "Draft manifest");
  const internalManifest = readJsonSafe<{
    package_type?: string;
    readiness_tier?: string;
    ready_for_frontend_agent?: boolean;
    implementation_authorized?: boolean;
    artifact_index?: string[];
  }>(path.join(outputDir, "00-manifest", "manifest.json"), blockers, "Draft internal manifest");
  const readiness = readJsonSafe<{
    readinessTier?: string;
    readyForFrontendAgent?: boolean;
  }>(path.join(outputDir, "00-manifest", "implementation-readiness.json"), blockers, "Draft readiness");
  const contextCompletion = readJsonSafe<{
    status?: string;
    readiness_tier?: string;
  }>(path.join(outputDir, "lifecycle", "context-completion.json"), blockers, "Draft context completion");
  const contractState = readJsonSafe<{
    source_scope?: string;
    current_state?: string;
    canonical_spec_generated?: boolean;
    states?: Array<{ state?: string; allowed?: string[]; forbidden?: string[]; outputs?: string[] }>;
  }>(path.join(outputDir, "lifecycle", "contract-state.json"), blockers, "Lifecycle contract state");
  const productDraft = readJsonSafe<{
    source_scope?: string;
    state?: string;
    canonical?: boolean;
    implementation_ready?: boolean;
    unconfirmed_items_default_status?: string;
    forbidden?: string[];
  }>(path.join(outputDir, "draft", "product-model.draft.json"), blockers, "Product model draft");
  const experienceDraft = readJsonSafe<{
    source_scope?: string;
    routes?: Array<{ draft_status?: string; acceptance_state?: string }>;
    screens?: Array<{ draft_status?: string; acceptance_state?: string }>;
  }>(path.join(outputDir, "draft", "experience-architecture.draft.json"), blockers, "Experience architecture draft");
  const designDraft = readJsonSafe<{
    source_scope?: string;
    tokens?: { draft_status?: string };
    components?: Array<{ draft_status?: string; acceptance_state?: string }>;
  }>(path.join(outputDir, "draft", "design-system.draft.json"), blockers, "Design system draft");
  const frontendDraft = readJsonSafe<{
    source_scope?: string;
    implementation_ready?: boolean;
    agent_instruction_policy?: string;
    verification_strategy?: unknown;
  }>(path.join(outputDir, "draft", "frontend-contract.draft.json"), blockers, "Frontend contract draft");
  const specialistReview = readJsonSafe<{
    source_scope?: string;
    state?: string;
    reviewers?: Array<{ role?: string; may_approve?: boolean }>;
    blockers?: unknown[];
    warnings?: unknown[];
    recommendations?: unknown[];
    frontend_practice_gate?: {
      source_scope?: string;
      status?: string;
      enforcement_rule?: string;
      required_skills?: string[];
      checks?: Array<{ skill?: string; owner?: string; blocker_list?: unknown[]; output_artifact?: string; status?: string }>;
      blockers?: unknown[];
    };
  }>(path.join(outputDir, "draft", "specialist-review.json"), blockers, "Specialist review");
  const frontendPracticeSkills = readJsonSafe<{
    source_scope?: string;
    enforcement_rule?: string;
    required_skills?: string[];
    specialist_gate?: { status?: string; pass_fail?: boolean; output_artifacts?: string[] };
    practices?: Array<{ skill?: string; owner?: string; blocker_list?: unknown[]; output_artifact?: string; status?: string }>;
    blockers?: unknown[];
  }>(path.join(outputDir, "governance", "frontend-practice-skills.json"), blockers, "Frontend practice skills");
  const forbiddenBehaviors = readJsonSafe<{
    source_scope?: string;
    rule?: string;
    forbidden_behaviors?: Array<{ id?: string; behavior?: string; encoded_as?: string; validator_or_test?: string; evidence_artifacts?: unknown[]; status?: string }>;
    acceptance_criteria?: Array<{ id?: string; criterion?: string; encoded_as?: string }>;
    exit_condition?: string;
  }>(path.join(outputDir, "governance", "forbidden-behaviors.json"), blockers, "Forbidden behavior contract");
  const convergenceStandard = readJsonSafe<{
    source_scope?: string;
    required_answer?: string;
    convergence_questions?: Array<{ id?: string; question?: string; answer?: string; status?: string; automated_evidence?: unknown[]; documented_evidence?: unknown[]; lifecycle_artifacts?: unknown[] }>;
    automated_evidence_summary?: unknown[];
    documented_evidence_summary?: unknown[];
    exit_condition?: string;
  }>(path.join(outputDir, "governance", "convergence-standard.json"), blockers, "Convergence standard");
  const implementationPhases = readJsonSafe<{
    source_scope?: string;
    expected_sequence?: string[];
    phase_1_priority?: { needs_clarification_blocks_implementation_readiness?: boolean; checked_artifacts?: unknown[] };
    current_package?: { package_type?: string; context_status?: string; readiness_tier?: string; ready_for_frontend_agent?: boolean; implementation_authorized?: boolean };
    implementation_readiness_gate?: { status?: string; can_enter_ready_for_implementation?: boolean; needs_clarification_blocks_implementation_readiness?: boolean; blockers?: string[]; evidence_refs?: unknown[] };
    phases?: Array<{
      phase_id?: string;
      order?: number;
      name?: string;
      status?: string;
      contract_tests?: string[];
      lifecycle_acceptance_gate?: {
        gate_id?: string;
        status?: string;
        lifecycle_gate?: string;
        required_artifacts?: unknown[];
        required_tests?: unknown[];
        pass_condition?: string;
      };
    }>;
    exit_condition?: string;
  }>(path.join(outputDir, "lifecycle", "implementation-phases.json"), blockers, "Implementation phases");
  const approvalRequest = readJsonSafe<{
    source_scope?: string;
    state?: string;
    approval_status?: string;
    confirmed_facts?: unknown[];
    candidate_assumptions?: unknown[];
    unresolved_unknowns?: unknown[];
    risks?: unknown[];
    request?: string;
    forbidden?: string[];
  }>(path.join(outputDir, "draft", "contract-approval-request.json"), blockers, "Contract approval request");

  if (!manifest || !internalManifest || !readiness || !contextCompletion || !contractState || !productDraft || !experienceDraft || !designDraft || !frontendDraft || !specialistReview || !frontendPracticeSkills || !forbiddenBehaviors || !convergenceStandard || !implementationPhases || !approvalRequest) {
    return { status: "fail", outputDir, checkedFiles: requiredFiles.length, blockers, warnings };
  }

  if (manifest.packageType !== "draft_contract" || internalManifest.package_type !== "draft_contract") {
    blockers.push("Draft package manifests must identify packageType/package_type draft_contract.");
  }
  if (manifest.readinessTier !== "ready_for_contract_approval" || internalManifest.readiness_tier !== "ready_for_contract_approval" || readiness.readinessTier !== "ready_for_contract_approval") {
    blockers.push("Draft package readiness tier must be ready_for_contract_approval.");
  }
  if (manifest.readyForFrontendAgent !== false || manifest.implementationAuthorized !== false || internalManifest.ready_for_frontend_agent !== false || internalManifest.implementation_authorized !== false || readiness.readyForFrontendAgent !== false) {
    blockers.push("Draft package must not be frontend-agent ready or implementation authorized.");
  }
  for (const artifactId of ["product-model-draft", "experience-architecture-draft", "design-system-draft", "design-system-preview", "design-system-review", "frontend-contract-draft", "assumption-ledger", "specialist-review", "contract-approval-request", "lifecycle-contract-state", "implementation-phases", "implementation-phases-report", "forbidden-behaviors", "forbidden-behaviors-report", "convergence-standard", "convergence-standard-report", "frontend-practice-skills", "frontend-practice-skills-report"]) {
    if (!manifest.artifacts?.some((artifact) => artifact.id === artifactId)) blockers.push(`Draft manifest missing ${artifactId}.`);
  }
  for (const relativePath of ["lifecycle/implementation-phases.json", "lifecycle/implementation-phases.md", "draft/design-system-preview.html", "draft/design-system-review.md", "governance/convergence-standard.json", "governance/convergence-standard.md"]) {
    if (!internalManifest.artifact_index?.includes(relativePath)) blockers.push(`Draft internal manifest missing ${relativePath}.`);
  }
  for (const skill of REQUIRED_FRONTEND_PRACTICE_SKILLS) {
    const artifactId = `frontend-practice-${skill}`;
    if (!manifest.artifacts?.some((artifact) => artifact.id === artifactId)) blockers.push(`Draft manifest missing ${artifactId}.`);
  }
  if (contractState.source_scope !== "HL-06" || contractState.current_state !== "contract_approval" || contractState.canonical_spec_generated !== false) {
    blockers.push("Lifecycle contract state must identify HL-06, wait at contract approval, and block canonical spec generation.");
  }
  for (const state of ["contract_draft", "specialist_review", "contract_approval", "canonical_spec_generation"]) {
    if (!contractState.states?.some((item) => item.state === state)) blockers.push(`Lifecycle contract state missing ${state}.`);
  }
  if (productDraft.source_scope !== "HL-06" || productDraft.state !== "contract_draft" || productDraft.canonical !== false || productDraft.implementation_ready !== false || productDraft.unconfirmed_items_default_status !== "candidate") {
    blockers.push("Product draft must encode HL-06 draft candidate policy.");
  }
  if (!productDraft.forbidden?.includes("Produce implementation-ready instructions.")) {
    blockers.push("Product draft must forbid implementation-ready instructions.");
  }
  const allowedDraftStatuses = ["confirmed", "candidate", "missing", "conflicted", "blocked"];
  for (const item of [...(experienceDraft.routes ?? []), ...(experienceDraft.screens ?? []), ...(designDraft.components ?? [])]) {
    if (!allowedDraftStatuses.includes(String(item.draft_status))) {
      blockers.push("Draft route, screen, or component contains an invalid draft_status.");
      break;
    }
    if (item.draft_status !== "confirmed" && item.acceptance_state !== "candidate_until_contract_approval") {
      blockers.push("Unconfirmed draft items must remain candidate until contract approval.");
      break;
    }
  }
  if (designDraft.tokens?.draft_status !== "candidate_until_contract_approval") {
    blockers.push("Design token draft must remain candidate until contract approval.");
  }
  validateDesignSystemPreview({
    previewHtml: readFileSync(path.join(outputDir, "draft", "design-system-preview.html"), "utf8"),
    reviewMarkdown: readFileSync(path.join(outputDir, "draft", "design-system-review.md"), "utf8"),
    blockers
  });
  if (frontendDraft.source_scope !== "HL-06" || frontendDraft.implementation_ready !== false || !String(frontendDraft.agent_instruction_policy ?? "").includes("Do not tell an implementation agent")) {
    blockers.push("Frontend contract draft must not be implementation-ready or tell the agent to write code.");
  }
  if (!frontendDraft.verification_strategy) {
    blockers.push("Frontend contract draft must include a verification strategy.");
  }
  if (specialistReview.source_scope !== "HL-06" || specialistReview.state !== "specialist_review" || !Array.isArray(specialistReview.reviewers) || specialistReview.reviewers.some((reviewer) => reviewer.may_approve !== false)) {
    blockers.push("Specialist review must use independent non-approving reviewers.");
  }
  if (!Array.isArray(specialistReview.blockers) || !Array.isArray(specialistReview.warnings) || !Array.isArray(specialistReview.recommendations)) {
    blockers.push("Specialist review must expose blockers, warnings, and recommendations.");
  }
  validateFrontendPracticeSkills({ frontendPracticeSkills, specialistReview, blockers });
  validateForbiddenBehaviorAcceptance({
    forbiddenBehaviors,
    forbiddenBehaviorsMarkdown: readFileSync(path.join(outputDir, "governance", "forbidden-behaviors.md"), "utf8"),
    blockers
  });
  validateConvergenceStandard({
    convergenceStandard,
    convergenceStandardMarkdown: readFileSync(path.join(outputDir, "governance", "convergence-standard.md"), "utf8"),
    blockers
  });
  validateImplementationPhases({
    implementationPhases,
    implementationPhasesMarkdown: readFileSync(path.join(outputDir, "lifecycle", "implementation-phases.md"), "utf8"),
    packageType: "draft_contract",
    contextStatus: String(contextCompletion.status ?? "complete"),
    readinessTier: "ready_for_contract_approval",
    readyForFrontendAgent: false,
    implementationAuthorized: false,
    blockers
  });
  if (approvalRequest.source_scope !== "HL-06" || approvalRequest.state !== "contract_approval") {
    blockers.push("Contract approval request must identify HL-06 contract approval.");
  }
  if (!Array.isArray(approvalRequest.confirmed_facts) || !Array.isArray(approvalRequest.candidate_assumptions) || !Array.isArray(approvalRequest.unresolved_unknowns) || !Array.isArray(approvalRequest.risks)) {
    blockers.push("Contract approval request must present facts, assumptions, unknowns, and risks.");
  }
  if (!String(approvalRequest.request ?? "").includes("Approve this draft contract")) {
    blockers.push("Contract approval request must ask for approval or edits.");
  }
  if (!approvalRequest.forbidden?.includes("Generate canonical spec without approval.") || !approvalRequest.forbidden?.includes("Hide assumptions in generated artifacts.")) {
    blockers.push("Contract approval request must forbid unapproved canonical spec generation and hidden assumptions.");
  }
  const assumptionLedger = readFileSync(path.join(outputDir, "draft", "assumption-ledger.md"), "utf8");
  for (const expected of ["## Candidate Decisions", "## Inferred Assumptions", "## Unresolved Unknowns", "Canonical spec generation is blocked without approval."]) {
    if (!assumptionLedger.includes(expected)) blockers.push(`Assumption ledger missing ${expected}.`);
  }

  return {
    status: blockers.length > 0 ? "fail" : "pass",
    outputDir,
    checkedFiles: requiredFiles.length,
    blockers,
    warnings
  };
}

export function validateExportedPackage(outputDir: string): PackageValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const topManifestPath = path.join(outputDir, "manifest.json");
  if (existsSync(topManifestPath)) {
    try {
      const topManifest = readJson<{ packageType?: string }>(topManifestPath);
      if (topManifest.packageType === "draft_contract") return validateDraftPackage(outputDir);
    } catch {
      // The regular validator will report the parse failure below.
    }
  }
  const agentsPath = path.join(outputDir, "AGENTS.md");
  const claudePath = path.join(outputDir, "CLAUDE.md");
  const canonicalSpecMarkdownPath = path.join(outputDir, "spec", "archetype-spec.md");
  const canonicalSpecJsonPath = path.join(outputDir, "spec", "archetype-spec.json");
  const testFirstContractPath = path.join(outputDir, "test-first", "test-first-contract.json");
  const testFirstPlanPath = path.join(outputDir, "test-first", "test-first-plan.md");
  const testQualityStandardPath = path.join(outputDir, "test-first", "test-quality-standard.json");
  const testQualityStandardMarkdownPath = path.join(outputDir, "test-first", "test-quality-standard.md");
  const initialRedTestRunPath = path.join(outputDir, "test-results", "initial-red-test-run.md");
  const testFirstPlaywrightPath = path.join(outputDir, "test-first", "playwright-contract.spec.ts");
  const testFirstVitestPath = path.join(outputDir, "test-first", "vitest-contract.spec.ts");
  const playwrightContractPath = path.join(outputDir, "verification", "playwright-verification-contract.json");
  const playwrightPlanPath = path.join(outputDir, "verification", "playwright-verification-plan.md");
  const playwrightConfigPath = path.join(outputDir, "verification", "playwright.config.ts");
  const playwrightSpecPath = path.join(outputDir, "verification", "playwright-verification.spec.ts");
  const playwrightEvidencePath = path.join(outputDir, "verification", "playwright-evidence.json");
  const playwrightEvidenceMarkdownPath = path.join(outputDir, "verification", "playwright-evidence.md");
  const qaScenarioCatalogPath = path.join(outputDir, "qa", "scenario-catalog.json");
  const qaPlaywrightResultsPath = path.join(outputDir, "qa", "playwright-results.json");
  const qaMalformedDataResultsPath = path.join(outputDir, "qa", "malformed-data-results.json");
  const qaAccessibilityResultsPath = path.join(outputDir, "qa", "accessibility-results.md");
  const qaVisualRegressionReportPath = path.join(outputDir, "qa", "visual-regression-report.md");
  const qaContractDriftReportPath = path.join(outputDir, "qa", "contract-drift-report.md");
  const repairContractPath = path.join(outputDir, "10-revision", "verification-repair-contract.json");
  const repairTaskQueuePath = path.join(outputDir, "10-revision", "repair-task-queue.json");
  const repairPlanPath = path.join(outputDir, "10-revision", "repair-plan.md");
  const driftReportPath = path.join(outputDir, "10-revision", "drift-report.json");
  const driftReportMarkdownPath = path.join(outputDir, "10-revision", "drift-report.md");
  const targetExecutionReportPath = path.join(outputDir, "14-target-execution", "target-execution-report.json");
  const implementationContractPath = path.join(outputDir, "implementation-contract.md");
  const verificationPlanPath = path.join(outputDir, "verification-plan.md");
  const lifecycleStateMachinePath = path.join(outputDir, "lifecycle", "state-machine.json");
  const startRequestPath = path.join(outputDir, "lifecycle", "start-request.json");
  const contextCompletionPath = path.join(outputDir, "lifecycle", "context-completion.json");
  const contextMatrixPath = path.join(outputDir, "lifecycle", "context-matrix.json");
  const readinessTiersPath = path.join(outputDir, "lifecycle", "readiness-tiers.json");
  const readinessTiersMarkdownPath = path.join(outputDir, "lifecycle", "readiness-tiers.md");
  const implementationPhasesPath = path.join(outputDir, "lifecycle", "implementation-phases.json");
  const implementationPhasesMarkdownPath = path.join(outputDir, "lifecycle", "implementation-phases.md");
  const clarificationTurnPath = path.join(outputDir, "lifecycle", "clarification-turn.json");
  const clarificationTurnMarkdownPath = path.join(outputDir, "lifecycle", "clarification-turn.md");
  const clarificationStatePath = path.join(outputDir, "lifecycle", "clarification-state.json");
  const clarificationTranscriptPath = path.join(outputDir, "lifecycle", "clarification-transcript.md");
  const approvalRequestPath = path.join(outputDir, "lifecycle", "approval-request.md");
  const approvalDecisionPath = path.join(outputDir, "lifecycle", "approval-decision.json");
  const clarificationQuestionsPath = path.join(outputDir, "lifecycle", "clarification-questions.json");
  const lifecycleReportPath = path.join(outputDir, "lifecycle", "lifecycle-report.md");
  const lifecycleExecutionStatePath = path.join(outputDir, "lifecycle", "execution-state.json");
  const finalReadinessReportPath = path.join(outputDir, "lifecycle", "final-readiness-report.md");
  const nonNegotiablePrinciplesPath = path.join(outputDir, "governance", "non-negotiable-principles.json");
  const nonNegotiablePrinciplesMarkdownPath = path.join(outputDir, "governance", "non-negotiable-principles.md");
  const evidenceDecisionModelPath = path.join(outputDir, "governance", "evidence-decision-model.json");
  const evidenceDecisionModelMarkdownPath = path.join(outputDir, "governance", "evidence-decision-model.md");
  const forbiddenBehaviorsPath = path.join(outputDir, "governance", "forbidden-behaviors.json");
  const forbiddenBehaviorsMarkdownPath = path.join(outputDir, "governance", "forbidden-behaviors.md");
  const convergenceStandardPath = path.join(outputDir, "governance", "convergence-standard.json");
  const convergenceStandardMarkdownPath = path.join(outputDir, "governance", "convergence-standard.md");
  const frontendPracticeSkillsPath = path.join(outputDir, "governance", "frontend-practice-skills.json");
  const frontendPracticeSkillsMarkdownPath = path.join(outputDir, "governance", "frontend-practice-skills.md");
  const designSystemPreviewPath = path.join(outputDir, "draft", "design-system-preview.html");
  const designSystemReviewPath = path.join(outputDir, "draft", "design-system-review.md");
  const specialistReviewPath = path.join(outputDir, "draft", "specialist-review.json");
  const specialistReviewSummaryPath = path.join(outputDir, "reviews", "specialist-review-summary.md");
  const manifestPath = path.join(outputDir, "00-manifest", "manifest.json");
  const readinessPath = path.join(outputDir, "00-manifest", "implementation-readiness.json");
  const schemaReportPath = path.join(outputDir, "00-manifest", "schema-validation-report.json");
  const dsagPath = path.join(outputDir, "03-experience-architecture", "dsag.json");
  const productModelPath = path.join(outputDir, "product", "product-model.json");
  const userRolesPath = path.join(outputDir, "product", "user-roles.json");
  const routeMapPath = path.join(outputDir, "experience", "route-map.json");
  const userFlowsPath = path.join(outputDir, "experience", "user-flows.json");
  const tokensPath = path.join(outputDir, "design-system", "tokens.json");
  const componentContractsPath = path.join(outputDir, "design-system", "component-contracts.json");
  const screenInventoryPath = path.join(outputDir, "screens", "screen-inventory.json");
  const screenSpecsPath = path.join(outputDir, "screens", "screen-specs.json");
  const frontendAgentInstructionsPath = path.join(outputDir, "frontend-agent-contract", "frontend-agent-instructions.md");
  const acceptanceCriteriaPath = path.join(outputDir, "frontend-agent-contract", "acceptance-criteria.json");
  const implementationRulesPath = path.join(outputDir, "frontend-agent-contract", "implementation-rules.json");
  const packageValidationPath = path.join(outputDir, "validation", "package-validation.json");
  const simulationReportPath = path.join(outputDir, "validation", "simulation-report.md");
  const evidenceLedgerPath = path.join(outputDir, "01-evidence", "evidence-ledger.json");
  const missingContextPath = path.join(outputDir, "01-evidence", "missing-context.md");

  if (!existsSync(topManifestPath)) blockers.push("Missing manifest.json.");
  if (!existsSync(agentsPath)) blockers.push("Missing AGENTS.md.");
  if (!existsSync(claudePath)) blockers.push("Missing CLAUDE.md.");
  if (!existsSync(canonicalSpecMarkdownPath)) blockers.push("Missing spec/archetype-spec.md.");
  if (!existsSync(canonicalSpecJsonPath)) blockers.push("Missing spec/archetype-spec.json.");
  if (!existsSync(testFirstContractPath)) blockers.push("Missing test-first/test-first-contract.json.");
  if (!existsSync(testFirstPlanPath)) blockers.push("Missing test-first/test-first-plan.md.");
  if (!existsSync(testQualityStandardPath)) blockers.push("Missing test-first/test-quality-standard.json.");
  if (!existsSync(testQualityStandardMarkdownPath)) blockers.push("Missing test-first/test-quality-standard.md.");
  if (!existsSync(initialRedTestRunPath)) blockers.push("Missing test-results/initial-red-test-run.md.");
  if (!existsSync(testFirstPlaywrightPath)) blockers.push("Missing test-first/playwright-contract.spec.ts.");
  if (!existsSync(testFirstVitestPath)) blockers.push("Missing test-first/vitest-contract.spec.ts.");
  if (!existsSync(playwrightContractPath)) blockers.push("Missing verification/playwright-verification-contract.json.");
  if (!existsSync(playwrightPlanPath)) blockers.push("Missing verification/playwright-verification-plan.md.");
  if (!existsSync(playwrightConfigPath)) blockers.push("Missing verification/playwright.config.ts.");
  if (!existsSync(playwrightSpecPath)) blockers.push("Missing verification/playwright-verification.spec.ts.");
  if (!existsSync(playwrightEvidencePath)) blockers.push("Missing verification/playwright-evidence.json.");
  if (!existsSync(playwrightEvidenceMarkdownPath)) blockers.push("Missing verification/playwright-evidence.md.");
  if (!existsSync(qaScenarioCatalogPath)) blockers.push("Missing qa/scenario-catalog.json.");
  if (!existsSync(qaPlaywrightResultsPath)) blockers.push("Missing qa/playwright-results.json.");
  if (!existsSync(qaMalformedDataResultsPath)) blockers.push("Missing qa/malformed-data-results.json.");
  if (!existsSync(qaAccessibilityResultsPath)) blockers.push("Missing qa/accessibility-results.md.");
  if (!existsSync(qaVisualRegressionReportPath)) blockers.push("Missing qa/visual-regression-report.md.");
  if (!existsSync(qaContractDriftReportPath)) blockers.push("Missing qa/contract-drift-report.md.");
  if (!existsSync(repairContractPath)) blockers.push("Missing 10-revision/verification-repair-contract.json.");
  if (!existsSync(repairTaskQueuePath)) blockers.push("Missing 10-revision/repair-task-queue.json.");
  if (!existsSync(repairPlanPath)) blockers.push("Missing 10-revision/repair-plan.md.");
  if (!existsSync(driftReportPath)) blockers.push("Missing 10-revision/drift-report.json.");
  if (!existsSync(driftReportMarkdownPath)) blockers.push("Missing 10-revision/drift-report.md.");
  if (!existsSync(targetExecutionReportPath)) blockers.push("Missing 14-target-execution/target-execution-report.json.");
  if (!existsSync(implementationContractPath)) blockers.push("Missing implementation-contract.md.");
  if (!existsSync(verificationPlanPath)) blockers.push("Missing verification-plan.md.");
  if (!existsSync(lifecycleStateMachinePath)) blockers.push("Missing lifecycle/state-machine.json.");
  if (!existsSync(startRequestPath)) blockers.push("Missing lifecycle/start-request.json.");
  if (!existsSync(contextCompletionPath)) blockers.push("Missing lifecycle/context-completion.json.");
  if (!existsSync(contextMatrixPath)) blockers.push("Missing lifecycle/context-matrix.json.");
  if (!existsSync(readinessTiersPath)) blockers.push("Missing lifecycle/readiness-tiers.json.");
  if (!existsSync(readinessTiersMarkdownPath)) blockers.push("Missing lifecycle/readiness-tiers.md.");
  if (!existsSync(implementationPhasesPath)) blockers.push("Missing lifecycle/implementation-phases.json.");
  if (!existsSync(implementationPhasesMarkdownPath)) blockers.push("Missing lifecycle/implementation-phases.md.");
  if (!existsSync(clarificationTurnPath)) blockers.push("Missing lifecycle/clarification-turn.json.");
  if (!existsSync(clarificationTurnMarkdownPath)) blockers.push("Missing lifecycle/clarification-turn.md.");
  if (!existsSync(clarificationStatePath)) blockers.push("Missing lifecycle/clarification-state.json.");
  if (!existsSync(clarificationTranscriptPath)) blockers.push("Missing lifecycle/clarification-transcript.md.");
  if (!existsSync(approvalRequestPath)) blockers.push("Missing lifecycle/approval-request.md.");
  if (!existsSync(approvalDecisionPath)) blockers.push("Missing lifecycle/approval-decision.json.");
  if (!existsSync(clarificationQuestionsPath)) blockers.push("Missing lifecycle/clarification-questions.json.");
  if (!existsSync(lifecycleReportPath)) blockers.push("Missing lifecycle/lifecycle-report.md.");
  if (!existsSync(lifecycleExecutionStatePath)) blockers.push("Missing lifecycle/execution-state.json.");
  if (!existsSync(finalReadinessReportPath)) blockers.push("Missing lifecycle/final-readiness-report.md.");
  if (!existsSync(nonNegotiablePrinciplesPath)) blockers.push("Missing governance/non-negotiable-principles.json.");
  if (!existsSync(nonNegotiablePrinciplesMarkdownPath)) blockers.push("Missing governance/non-negotiable-principles.md.");
  if (!existsSync(evidenceDecisionModelPath)) blockers.push("Missing governance/evidence-decision-model.json.");
  if (!existsSync(evidenceDecisionModelMarkdownPath)) blockers.push("Missing governance/evidence-decision-model.md.");
  if (!existsSync(forbiddenBehaviorsPath)) blockers.push("Missing governance/forbidden-behaviors.json.");
  if (!existsSync(forbiddenBehaviorsMarkdownPath)) blockers.push("Missing governance/forbidden-behaviors.md.");
  if (!existsSync(convergenceStandardPath)) blockers.push("Missing governance/convergence-standard.json.");
  if (!existsSync(convergenceStandardMarkdownPath)) blockers.push("Missing governance/convergence-standard.md.");
  if (!existsSync(frontendPracticeSkillsPath)) blockers.push("Missing governance/frontend-practice-skills.json.");
  if (!existsSync(frontendPracticeSkillsMarkdownPath)) blockers.push("Missing governance/frontend-practice-skills.md.");
  if (!existsSync(designSystemPreviewPath)) blockers.push("Missing draft/design-system-preview.html.");
  if (!existsSync(designSystemReviewPath)) blockers.push("Missing draft/design-system-review.md.");
  for (const skill of REQUIRED_FRONTEND_PRACTICE_SKILLS) {
    if (!existsSync(path.join(outputDir, frontendPracticePath(skill)))) blockers.push(`Missing ${frontendPracticePath(skill)}.`);
  }
  if (!existsSync(specialistReviewPath)) blockers.push("Missing draft/specialist-review.json.");
  if (!existsSync(specialistReviewSummaryPath)) blockers.push("Missing reviews/specialist-review-summary.md.");
  if (!existsSync(manifestPath)) blockers.push("Missing 00-manifest/manifest.json.");
  if (!existsSync(readinessPath)) blockers.push("Missing 00-manifest/implementation-readiness.json.");
  if (!existsSync(schemaReportPath)) blockers.push("Missing 00-manifest/schema-validation-report.json.");
  if (!existsSync(dsagPath)) blockers.push("Missing 03-experience-architecture/dsag.json.");
  if (!existsSync(productModelPath)) blockers.push("Missing product/product-model.json.");
  if (!existsSync(userRolesPath)) blockers.push("Missing product/user-roles.json.");
  if (!existsSync(routeMapPath)) blockers.push("Missing experience/route-map.json.");
  if (!existsSync(userFlowsPath)) blockers.push("Missing experience/user-flows.json.");
  if (!existsSync(tokensPath)) blockers.push("Missing design-system/tokens.json.");
  if (!existsSync(componentContractsPath)) blockers.push("Missing design-system/component-contracts.json.");
  if (!existsSync(screenInventoryPath)) blockers.push("Missing screens/screen-inventory.json.");
  if (!existsSync(screenSpecsPath)) blockers.push("Missing screens/screen-specs.json.");
  if (!existsSync(frontendAgentInstructionsPath)) blockers.push("Missing frontend-agent-contract/frontend-agent-instructions.md.");
  if (!existsSync(acceptanceCriteriaPath)) blockers.push("Missing frontend-agent-contract/acceptance-criteria.json.");
  if (!existsSync(implementationRulesPath)) blockers.push("Missing frontend-agent-contract/implementation-rules.json.");
  if (!existsSync(packageValidationPath)) blockers.push("Missing validation/package-validation.json.");
  if (!existsSync(simulationReportPath)) blockers.push("Missing validation/simulation-report.md.");
  if (!existsSync(evidenceLedgerPath)) blockers.push("Missing 01-evidence/evidence-ledger.json.");
  if (!existsSync(missingContextPath)) blockers.push("Missing 01-evidence/missing-context.md.");
  if (blockers.length > 0) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  const topManifest = readJsonSafe<{
    artifacts?: Array<{ id?: string; path?: string; required?: boolean }>;
    readyForFrontendAgent?: boolean;
    implementationAuthorized?: boolean;
    readinessTier?: string;
    readinessEvidence?: Array<{ claim?: string; artifact_refs?: unknown[] }>;
  }>(topManifestPath, blockers, "Top-level manifest");
  const manifest = readJsonSafe<{
    artifact_index?: string[];
    ready_for_frontend_agent?: boolean;
    implementation_authorized?: boolean;
    readiness_tier?: string;
    readiness_evidence?: Array<{ claim?: string; artifact_refs?: unknown[] }>;
    blockers?: string[];
    warnings?: string[];
  }>(manifestPath, blockers, "Internal manifest");
  const readiness = readJsonSafe<{
    readinessTier?: string;
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
    score?: number;
  }>(readinessPath, blockers, "Readiness report");
  const schemaReport = readJsonSafe<{
    status?: string;
    blockers?: string[];
  }>(schemaReportPath, blockers, "Schema validation report");
  const dsag = readJsonSafe<{
    integrity?: {
      status?: string;
      blockers?: string[];
    };
  }>(dsagPath, blockers, "DSAG graph");
  const routeMap = readJsonSafe<{ routes?: unknown[] }>(routeMapPath, blockers, "Route map");
  const screenInventory = readJsonSafe<{ screens?: unknown[] }>(screenInventoryPath, blockers, "Screen inventory");
  const screenSpecs = readJsonSafe<{ screens?: unknown[] }>(screenSpecsPath, blockers, "Screen specs");
  const componentContracts = readJsonSafe<{ contracts?: unknown[] }>(componentContractsPath, blockers, "Component contracts");
  const implementationRules = readJsonSafe<Record<string, unknown>>(implementationRulesPath, blockers, "Implementation rules");
  const canonicalSpec = readJsonSafe<{
    source_of_truth?: boolean;
    lifecycle?: { default_entrypoint?: string };
    product?: unknown;
    experience?: { route_count?: number; screen_count?: number; routes?: unknown[]; screens?: unknown[] };
    design_system?: unknown;
    frontend_contract?: unknown;
    verification?: { required_evidence?: unknown[] };
  }>(canonicalSpecJsonPath, blockers, "Canonical spec");
  const testFirstContract = readJsonSafe<{
    source_spec_path?: string;
    tdd_policy?: { test_first_enforced?: boolean; red_phase_required?: boolean };
    required_target_test_files?: unknown[];
    suites?: Array<{ suite_type?: string; tests?: unknown[] }>;
    coverage?: {
      route_count?: number;
      screen_count?: number;
      total_test_count?: number;
      smoke_test_count?: number;
      e2e_test_count?: number;
      integration_test_count?: number;
      unit_test_count?: number;
      required_state_test_count?: number;
      suite_types?: unknown[];
    };
    acceptance_gate?: { required_evidence?: unknown[] };
    traceability?: { canonical_spec?: string };
  }>(testFirstContractPath, blockers, "Test-first contract");
  const testQualityStandard = readJsonSafe<{
    source_scope?: string;
    rule?: string;
    marker_only_tests_fail_verifier?: boolean;
    forbidden_test_patterns?: string[];
    required_test_behaviors?: string[];
    verifier_enforcement?: { target_test_audit?: string; package_validation?: string; required_artifacts?: string[] };
    exit_condition?: string;
  }>(testQualityStandardPath, blockers, "Test quality standard");
  const approvalDecision = readJsonSafe<{
    source_scope?: string;
    source_artifact?: string;
    approved?: boolean;
    artifact_refs?: unknown[];
    traceability?: Record<string, unknown>;
    exit_condition?: string;
  }>(approvalDecisionPath, blockers, "Approval decision");
  const playwrightContract = readJsonSafe<{
    source_spec_path?: string;
    source_test_first_contract_path?: string;
    test_quality_standard_path?: string;
    marker_only_tests_fail_verifier?: boolean;
    forbidden_test_patterns?: string[];
    required_test_behaviors?: string[];
    lifecycle_gate?: string;
    runner?: string;
    required_target_command?: string;
    scenarios?: unknown[];
    coverage?: {
      route_count?: number;
      screen_count?: number;
      route_scenarios?: number;
      state_scenarios?: number;
      flow_scenarios?: number;
      responsive_scenarios?: number;
      accessibility_scenarios?: number;
      visual_smoke_scenarios?: number;
      total_scenarios?: number;
    };
  }>(playwrightContractPath, blockers, "Playwright verification contract");
  const playwrightEvidence = readJsonSafe<{
    status?: string;
    source_contract?: string;
    command?: string;
    coverage?: { route_count?: number; screen_count?: number; total_scenarios?: number };
    summary?: { total?: number };
    proof_artifacts?: unknown[];
  }>(playwrightEvidencePath, blockers, "Playwright evidence");
  const qaScenarioCatalog = readJsonSafe<{
    source_scope?: string;
    lifecycle_phase?: string;
    rule?: string;
    qa_agents?: string[];
    required_artifacts?: string[];
    scenarios?: Array<{ scenario_id?: string; type?: string; owner_agent?: string; evidence_artifacts?: unknown[]; status?: string }>;
    coverage?: { playwright_scenarios?: number; malformed_data_scenarios?: number; total_scenarios?: number };
  }>(qaScenarioCatalogPath, blockers, "QA scenario catalog");
  const qaPlaywrightResults = readJsonSafe<{
    source_scope?: string;
    lifecycle_phase?: string;
    owner_agent?: string;
    rule?: string;
    status?: string;
    source_evidence?: string;
    proof_artifacts?: unknown[];
    scenario_count?: number;
  }>(qaPlaywrightResultsPath, blockers, "QA Playwright results");
  const qaMalformedDataResults = readJsonSafe<{
    source_scope?: string;
    lifecycle_phase?: string;
    owner_agent?: string;
    rule?: string;
    status?: string;
    source_contract?: string;
    scenarios?: unknown[];
    results?: unknown[];
    proof_artifacts?: unknown[];
  }>(qaMalformedDataResultsPath, blockers, "QA malformed data results");
  const repairContract = readJsonSafe<{
    lifecycle_gate?: string;
    source_spec_path?: string;
    source_test_first_contract_path?: string;
    source_playwright_contract_path?: string;
    source_playwright_evidence_path?: string;
    source_target_execution_path?: string;
    output_paths?: { task_queue?: string; plan?: string; drift_report?: string };
    policy?: { default_action?: string; contract_revision_allowed_when?: unknown[]; forbidden_behavior?: unknown[] };
    classifiers?: unknown[];
  }>(repairContractPath, blockers, "Verification repair contract");
  const repairTaskQueue = readJsonSafe<{
    status?: string;
    source_contract?: string;
    source_target_execution?: string;
    source_playwright_evidence?: string;
    next_lifecycle_state?: string;
    task_count?: number;
    tasks?: unknown[];
    traceability?: {
      canonical_spec?: string;
      test_first_contract?: string;
      playwright_contract?: string;
      playwright_evidence?: string;
      target_execution?: string;
    };
    completion_gate?: string;
  }>(repairTaskQueuePath, blockers, "Repair task queue");
  const driftReport = readJsonSafe<{
    status?: string;
    source_task_queue?: string;
    drift_count?: number;
    implementation_patch_count?: number;
    contract_revision_review_count?: number;
    drifts?: unknown[];
    traceability?: unknown;
  }>(driftReportPath, blockers, "Drift report");
  const targetExecutionReport = readJsonSafe<{
    status?: string;
    summary?: { install?: string; typecheck?: string; build?: string; playwright?: string };
    blockers?: unknown[];
    proof_artifacts?: unknown[];
  }>(targetExecutionReportPath, blockers, "Target execution report");
  const lifecycleStateMachine = readJsonSafe<{
    states?: Array<{ state?: string }>;
    default_entrypoint?: string;
    principle?: string;
  }>(lifecycleStateMachinePath, blockers, "Lifecycle state machine");
  const lifecycleExecutionState = readJsonSafe<{
    source_scope?: string;
    current_state?: string;
    implementation_authorized?: boolean;
    ready_for_completion?: boolean;
    exit_condition?: string;
    states?: Array<{ id?: number; state?: string; allowed?: string[]; forbidden?: string[]; outputs?: unknown[] }>;
    gates?: Array<{ state?: string; status?: string; evidence?: Record<string, unknown> }>;
    proof_artifacts?: unknown[];
    blockers?: unknown[];
    warnings?: unknown[];
  }>(lifecycleExecutionStatePath, blockers, "Lifecycle execution state");
  const startRequest = readJsonSafe<{
    artifact_version?: string;
    source_scope?: string;
    state?: string;
    input?: {
      request_type?: string;
      captured_intent?: string;
      project_name?: string | null;
      operating_mode?: string;
    };
    detected_context?: {
      imported_files?: unknown[];
      screenshots?: unknown[];
      folders?: unknown[];
      repo_context?: unknown[];
      material_count?: number;
    };
    allowed?: string[];
    forbidden?: string[];
    output?: string;
  }>(startRequestPath, blockers, "Start request");
  const contextCompletion = readJsonSafe<{
    status?: string;
    current_state?: string;
    next_state?: string;
    readiness_tier?: string;
    questions?: unknown[];
  }>(contextCompletionPath, blockers, "Context completion");
  const contextMatrix = readJsonSafe<{
    source_scope?: string;
    status?: string;
    readiness_tier?: string;
    required_dimensions?: string[];
    readiness_tiers?: string[];
    weak_context_definition?: string;
    decisions?: Array<{ id?: string; status?: string; evidence_level?: string; can_become_canonical?: boolean }>;
    next_question?: { id?: string } | null;
    blockers?: unknown[];
  }>(contextMatrixPath, blockers, "Context matrix");
  const clarificationTurn = readJsonSafe<{
    source_scope?: string;
    rule?: string;
    algorithm?: string[];
    question_count?: number;
    current_question?: { id?: string; selected_decision_id?: string; impact?: string } | null;
    selection?: {
      selection_rule?: string;
      selected_decision_id?: string | null;
      selected_impact?: string | null;
      candidate_blockers?: Array<{ decision_id?: string; impact?: string; status?: string; required?: boolean }>;
    };
    answer_protocol?: {
      update_behavior?: string;
      repeat_behavior?: string;
      final_pre_contract_step?: string;
    };
  }>(clarificationTurnPath, blockers, "Clarification turn");
  const clarificationState = readJsonSafe<{
    artifact_version?: string;
    source_scope?: string;
    state?: string;
    current_question?: { id?: string } | null;
    context_status?: string;
    hard_blockers_remaining?: boolean;
    missing_decisions?: unknown[];
    candidate_decisions?: unknown[];
    confirmed_decisions?: unknown[];
    conflicted_decisions?: unknown[];
    blocked_decisions?: unknown[];
    allowed?: string[];
    forbidden?: string[];
    outputs?: string[];
    next_action?: string;
  }>(clarificationStatePath, blockers, "Clarification state");
  const readinessTiers = readJsonSafe<{
    source_scope?: string;
    weak_context_definition?: string;
    current_tier?: string;
    next_tier?: string | null;
    boolean_compatibility?: { ready_for_frontend_agent?: boolean; implementation_authorized?: boolean };
    gates?: Array<{ tier?: string; status?: string; required_artifacts?: unknown[]; evidence_refs?: unknown[]; blockers?: unknown[] }>;
    artifact_backed_claims?: Array<{ claim?: string; artifact_refs?: unknown[] }>;
    blockers?: unknown[];
  }>(readinessTiersPath, blockers, "Readiness tiers");
  const implementationPhases = readJsonSafe<{
    source_scope?: string;
    expected_sequence?: string[];
    phase_1_priority?: { needs_clarification_blocks_implementation_readiness?: boolean; checked_artifacts?: unknown[] };
    current_package?: { package_type?: string; context_status?: string; readiness_tier?: string; ready_for_frontend_agent?: boolean; implementation_authorized?: boolean };
    implementation_readiness_gate?: { status?: string; can_enter_ready_for_implementation?: boolean; needs_clarification_blocks_implementation_readiness?: boolean; blockers?: string[]; evidence_refs?: unknown[] };
    phases?: Array<{
      phase_id?: string;
      order?: number;
      name?: string;
      status?: string;
      contract_tests?: string[];
      lifecycle_acceptance_gate?: {
        gate_id?: string;
        status?: string;
        lifecycle_gate?: string;
        required_artifacts?: unknown[];
        required_tests?: unknown[];
        pass_condition?: string;
      };
    }>;
    exit_condition?: string;
  }>(implementationPhasesPath, blockers, "Implementation phases");
  const nonNegotiablePrinciples = readJsonSafe<{
    status?: string;
    implementation_authorized?: boolean;
    gates?: Array<{ id?: string; status?: string; artifacts?: unknown[] }>;
    failures?: unknown[];
    readiness_evidence?: unknown[];
  }>(nonNegotiablePrinciplesPath, blockers, "Non-negotiable principles");
  const evidenceDecisionModel = readJsonSafe<{
    status?: string;
    evidence_levels?: Array<{ level?: string; can_become_canonical?: boolean }>;
    canonical_evidence_levels?: string[];
    decision_statuses?: string[];
    confirmed_decision_violations?: unknown[];
    canonical_surface_audit?: { noncanonical_refs_in_authorized_package?: unknown[] };
    failures?: unknown[];
  }>(evidenceDecisionModelPath, blockers, "Evidence decision model");
  const forbiddenBehaviors = readJsonSafe<{
    source_scope?: string;
    rule?: string;
    forbidden_behaviors?: Array<{ id?: string; behavior?: string; encoded_as?: string; validator_or_test?: string; evidence_artifacts?: unknown[]; status?: string }>;
    acceptance_criteria?: Array<{ id?: string; criterion?: string; encoded_as?: string }>;
    exit_condition?: string;
  }>(forbiddenBehaviorsPath, blockers, "Forbidden behavior contract");
  const convergenceStandard = readJsonSafe<{
    source_scope?: string;
    required_answer?: string;
    convergence_questions?: Array<{ id?: string; question?: string; answer?: string; status?: string; automated_evidence?: unknown[]; documented_evidence?: unknown[]; lifecycle_artifacts?: unknown[] }>;
    automated_evidence_summary?: unknown[];
    documented_evidence_summary?: unknown[];
    exit_condition?: string;
  }>(convergenceStandardPath, blockers, "Convergence standard");
  const frontendPracticeSkills = readJsonSafe<{
    source_scope?: string;
    enforcement_rule?: string;
    required_skills?: string[];
    specialist_gate?: { status?: string; pass_fail?: boolean; output_artifacts?: string[] };
    practices?: Array<{ skill?: string; owner?: string; blocker_list?: unknown[]; output_artifact?: string; status?: string }>;
    blockers?: unknown[];
  }>(frontendPracticeSkillsPath, blockers, "Frontend practice skills");
  const specialistReview = readJsonSafe<{
    frontend_practice_gate?: {
      source_scope?: string;
      status?: string;
      enforcement_rule?: string;
      required_skills?: string[];
      checks?: Array<{ skill?: string; owner?: string; blocker_list?: unknown[]; output_artifact?: string; status?: string }>;
      blockers?: unknown[];
    };
  }>(specialistReviewPath, blockers, "Specialist review");

  if (!topManifest || !manifest || !readiness || !schemaReport || !dsag || !routeMap || !screenInventory || !screenSpecs || !componentContracts || !implementationRules || !canonicalSpec || !testFirstContract || !testQualityStandard || !approvalDecision || !playwrightContract || !playwrightEvidence || !qaScenarioCatalog || !qaPlaywrightResults || !qaMalformedDataResults || !repairContract || !repairTaskQueue || !driftReport || !targetExecutionReport || !lifecycleStateMachine || !lifecycleExecutionState || !startRequest || !contextCompletion || !contextMatrix || !clarificationTurn || !clarificationState || !readinessTiers || !implementationPhases || !nonNegotiablePrinciples || !evidenceDecisionModel || !forbiddenBehaviors || !convergenceStandard || !frontendPracticeSkills || !specialistReview) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  const routes = Array.isArray(routeMap.routes) ? routeMap.routes : [];
  const screens = Array.isArray(screenInventory.screens) ? screenInventory.screens : [];
  const specs = Array.isArray(screenSpecs.screens) ? screenSpecs.screens : [];
  if (routes.length === 0) {
    blockers.push("Route map has no parseable routes.");
  }
  if (screens.length === 0) {
    blockers.push("Screen inventory has no parseable screens.");
  }
  if (specs.length === 0) {
    blockers.push("Screen specs have no parseable screens.");
  }
  if (!Array.isArray(componentContracts.contracts) || componentContracts.contracts.length === 0) {
    blockers.push("Component contracts have no parseable contracts.");
  }
  if (!implementationRules.routing || !implementationRules.dataContracts || !implementationRules.actionContracts || !implementationRules.formContracts) {
    blockers.push("Implementation rules must expose routing, data, action, and form contracts.");
  }
  if (canonicalSpec.source_of_truth !== true) {
    blockers.push("Canonical spec must declare source_of_truth: true.");
  }
  if (canonicalSpec.lifecycle?.default_entrypoint !== "/archetype \"project idea\"") {
    blockers.push("Canonical spec must include the /archetype natural-language default entrypoint.");
  }
  if (!canonicalSpec.product || !canonicalSpec.experience || !canonicalSpec.design_system || !canonicalSpec.frontend_contract) {
    blockers.push("Canonical spec must include product, experience, design_system, and frontend_contract sections.");
  }
  if (canonicalSpec.experience?.route_count !== routes.length) {
    blockers.push("Canonical spec route count must match route map.");
  }
  if (canonicalSpec.experience?.screen_count !== specs.length) {
    blockers.push("Canonical spec screen count must match screen specs.");
  }
  if (!Array.isArray(canonicalSpec.verification?.required_evidence) || canonicalSpec.verification.required_evidence.length === 0) {
    blockers.push("Canonical spec must define required verification evidence.");
  }
  if (testFirstContract.source_spec_path !== "spec/archetype-spec.json") {
    blockers.push("Test-first contract must be derived from spec/archetype-spec.json.");
  }
  if (testFirstContract.traceability?.canonical_spec !== "spec/archetype-spec.json") {
    blockers.push("Test-first traceability must point at the canonical spec.");
  }
  if (testFirstContract.tdd_policy?.test_first_enforced !== true || testFirstContract.tdd_policy?.red_phase_required !== true) {
    blockers.push("Test-first contract must enforce red-first test-driven development.");
  }
  const suiteTypes = new Set((testFirstContract.suites ?? []).map((suite) => suite.suite_type));
  for (const requiredSuite of ["smoke", "e2e", "ui", "integration", "unit"]) {
    if (!suiteTypes.has(requiredSuite)) blockers.push(`Test-first contract missing ${requiredSuite} suite.`);
  }
  if ((testFirstContract.coverage?.route_count ?? -1) !== routes.length) {
    blockers.push("Test-first contract route count must match route map.");
  }
  if ((testFirstContract.coverage?.screen_count ?? -1) !== specs.length) {
    blockers.push("Test-first contract screen count must match screen specs.");
  }
  if ((testFirstContract.coverage?.smoke_test_count ?? 0) < routes.length) {
    blockers.push("Test-first contract must include at least one smoke test per route.");
  }
  if ((testFirstContract.coverage?.required_state_test_count ?? 0) === 0) {
    blockers.push("Test-first contract must include UI state tests.");
  }
  if ((testFirstContract.coverage?.integration_test_count ?? 0) === 0) {
    blockers.push("Test-first contract must include integration tests.");
  }
  if ((testFirstContract.coverage?.unit_test_count ?? 0) === 0) {
    blockers.push("Test-first contract must include unit tests.");
  }
  if ((testFirstContract.coverage?.total_test_count ?? 0) <= routes.length) {
    blockers.push("Test-first contract total test count must exceed route count.");
  }
  if (!Array.isArray(testFirstContract.required_target_test_files) || testFirstContract.required_target_test_files.length < 5) {
    blockers.push("Test-first contract must define required target test files.");
  }
  if (!Array.isArray(testFirstContract.acceptance_gate?.required_evidence) || testFirstContract.acceptance_gate.required_evidence.length === 0) {
    blockers.push("Test-first contract must define required test evidence.");
  }
  validateRequiredPackageArtifacts({
    outputDir,
    topManifest,
    internalManifest: manifest,
    approvalDecision,
    approvalRequestMarkdown: readFileSync(approvalRequestPath, "utf8"),
    specialistReviewSummaryMarkdown: readFileSync(specialistReviewSummaryPath, "utf8"),
    initialRedTestRunMarkdown: readFileSync(initialRedTestRunPath, "utf8"),
    finalReadinessReportMarkdown: readFileSync(finalReadinessReportPath, "utf8"),
    blockers
  });
  validateTestQualityStandard({
    testQualityStandard,
    playwrightContract,
    playwrightSpecSource: readFileSync(playwrightSpecPath, "utf8"),
    testQualityStandardMarkdown: readFileSync(testQualityStandardMarkdownPath, "utf8"),
    blockers
  });
  validateForbiddenBehaviorAcceptance({
    forbiddenBehaviors,
    forbiddenBehaviorsMarkdown: readFileSync(forbiddenBehaviorsMarkdownPath, "utf8"),
    lifecycleExecutionState,
    repairTaskQueue,
    qaPlaywrightResults,
    blockers
  });
  validateConvergenceStandard({
    convergenceStandard,
    convergenceStandardMarkdown: readFileSync(convergenceStandardMarkdownPath, "utf8"),
    blockers
  });
  validateDesignSystemPreview({
    previewHtml: readFileSync(designSystemPreviewPath, "utf8"),
    reviewMarkdown: readFileSync(designSystemReviewPath, "utf8"),
    blockers
  });
  if (playwrightContract.source_spec_path !== "spec/archetype-spec.json") {
    blockers.push("Playwright verification contract must derive from the canonical spec.");
  }
  if (playwrightContract.source_test_first_contract_path !== "test-first/test-first-contract.json") {
    blockers.push("Playwright verification contract must point to the test-first contract.");
  }
  if (playwrightContract.lifecycle_gate !== "verifying_with_playwright" || playwrightContract.runner !== "playwright") {
    blockers.push("Playwright verification contract must use the verifying_with_playwright lifecycle gate and playwright runner.");
  }
  if (playwrightContract.required_target_command !== "npm run archetype:playwright") {
    blockers.push("Playwright verification contract must define npm run archetype:playwright as the target command.");
  }
  if ((playwrightContract.coverage?.route_count ?? -1) !== routes.length) {
    blockers.push("Playwright verification route count must match route map.");
  }
  if ((playwrightContract.coverage?.screen_count ?? -1) !== specs.length) {
    blockers.push("Playwright verification screen count must match screen specs.");
  }
  if ((playwrightContract.coverage?.route_scenarios ?? 0) < routes.length) {
    blockers.push("Playwright verification must include route scenarios.");
  }
  if ((playwrightContract.coverage?.state_scenarios ?? 0) === 0) {
    blockers.push("Playwright verification must include screen-state scenarios.");
  }
  if ((playwrightContract.coverage?.flow_scenarios ?? 0) === 0) {
    blockers.push("Playwright verification must include flow scenarios.");
  }
  if ((playwrightContract.coverage?.responsive_scenarios ?? 0) < routes.length) {
    blockers.push("Playwright verification must include responsive scenarios.");
  }
  if ((playwrightContract.coverage?.accessibility_scenarios ?? 0) < routes.length) {
    blockers.push("Playwright verification must include accessibility scenarios.");
  }
  if ((playwrightContract.coverage?.visual_smoke_scenarios ?? 0) < routes.length) {
    blockers.push("Playwright verification must include visual-smoke scenarios.");
  }
  if ((playwrightContract.coverage?.total_scenarios ?? 0) <= routes.length) {
    blockers.push("Playwright verification total scenario count must exceed route count.");
  }
  if (!Array.isArray(playwrightContract.scenarios) || playwrightContract.scenarios.length !== playwrightContract.coverage?.total_scenarios) {
    blockers.push("Playwright verification scenario list must match total scenario count.");
  }
  if (!["pending", "pass", "fail", "warning"].includes(String(playwrightEvidence.status))) {
    blockers.push("Playwright evidence status must be pending, pass, warning, or fail.");
  }
  if (playwrightEvidence.source_contract !== "verification/playwright-verification-contract.json") {
    blockers.push("Playwright evidence must point to the verification contract.");
  }
  if (playwrightEvidence.coverage?.route_count !== routes.length || playwrightEvidence.coverage?.screen_count !== specs.length) {
    blockers.push("Playwright evidence coverage must match route and screen counts.");
  }
  validateQaEvidence({
    scenarioCatalog: qaScenarioCatalog,
    playwrightResults: qaPlaywrightResults,
    malformedDataResults: qaMalformedDataResults,
    accessibilityResultsMarkdown: readFileSync(qaAccessibilityResultsPath, "utf8"),
    visualRegressionReportMarkdown: readFileSync(qaVisualRegressionReportPath, "utf8"),
    contractDriftReportMarkdown: readFileSync(qaContractDriftReportPath, "utf8"),
    repairTaskQueue,
    blockers
  });
  if (repairContract.lifecycle_gate !== "revising") {
    blockers.push("Verification repair contract must bind to the revising lifecycle gate.");
  }
  if (repairContract.source_spec_path !== "spec/archetype-spec.json" || repairContract.source_test_first_contract_path !== "test-first/test-first-contract.json") {
    blockers.push("Verification repair contract must trace canonical spec and test-first contract.");
  }
  if (repairContract.source_playwright_contract_path !== "verification/playwright-verification-contract.json" || repairContract.source_playwright_evidence_path !== "verification/playwright-evidence.json") {
    blockers.push("Verification repair contract must trace Playwright contract and evidence.");
  }
  if (repairContract.source_target_execution_path !== "14-target-execution/target-execution-report.json") {
    blockers.push("Verification repair contract must trace target execution proof.");
  }
  if (repairContract.output_paths?.task_queue !== "10-revision/repair-task-queue.json" || repairContract.output_paths?.plan !== "10-revision/repair-plan.md") {
    blockers.push("Verification repair contract must name the repair task queue and plan outputs.");
  }
  if (!String(repairContract.policy?.default_action ?? "").includes("Patch implementation first")) {
    blockers.push("Verification repair contract must require implementation patching before contract revision.");
  }
  if (!Array.isArray(repairContract.classifiers) || repairContract.classifiers.length < 8) {
    blockers.push("Verification repair contract must include repair classifiers for command and Playwright failures.");
  }
  if (!["pending", "pass", "fail", "warning"].includes(String(repairTaskQueue.status))) {
    blockers.push("Repair task queue status must be pending, pass, warning, or fail.");
  }
  if (repairTaskQueue.source_contract !== "10-revision/verification-repair-contract.json") {
    blockers.push("Repair task queue must point to the repair contract.");
  }
  if (repairTaskQueue.source_target_execution !== "14-target-execution/target-execution-report.json" || repairTaskQueue.source_playwright_evidence !== "verification/playwright-evidence.json") {
    blockers.push("Repair task queue must point to target execution and Playwright evidence.");
  }
  if (repairTaskQueue.traceability?.canonical_spec !== "spec/archetype-spec.json" || repairTaskQueue.traceability?.test_first_contract !== "test-first/test-first-contract.json") {
    blockers.push("Repair task queue must trace spec and test-first artifacts.");
  }
  if (repairTaskQueue.traceability?.playwright_contract !== "verification/playwright-verification-contract.json" || repairTaskQueue.traceability?.playwright_evidence !== "verification/playwright-evidence.json") {
    blockers.push("Repair task queue must trace Playwright artifacts.");
  }
  if (!Array.isArray(repairTaskQueue.tasks) || repairTaskQueue.tasks.length !== repairTaskQueue.task_count) {
    blockers.push("Repair task queue task_count must match tasks length.");
  }
  if (repairTaskQueue.status === "fail" && (repairTaskQueue.task_count ?? 0) === 0) {
    blockers.push("Failed repair queue must contain concrete repair tasks.");
  }
  if (repairTaskQueue.status === "fail" && repairTaskQueue.next_lifecycle_state !== "revising") {
    blockers.push("Failed repair queue must move lifecycle to revising.");
  }
  if (repairTaskQueue.status === "pass" && repairTaskQueue.next_lifecycle_state !== "done") {
    blockers.push("Passing repair queue must move lifecycle to done.");
  }
  if (!String(repairTaskQueue.completion_gate ?? "").includes("verify-target")) {
    blockers.push("Repair task queue must define a verify-target completion gate.");
  }
  if (driftReport.source_task_queue !== "10-revision/repair-task-queue.json") {
    blockers.push("Drift report must point to the repair task queue.");
  }
  if (driftReport.status !== repairTaskQueue.status || driftReport.drift_count !== repairTaskQueue.task_count) {
    blockers.push("Drift report status and drift count must match repair task queue.");
  }
  if (!Array.isArray(driftReport.drifts)) {
    blockers.push("Drift report must expose drift entries.");
  }
  const lifecycleStates = new Set((lifecycleStateMachine.states ?? []).map((item) => item.state));
  for (const requiredState of ["clarifying", "waiting_for_optional_materials", "spec_generating", "test_generating", "implementing_tests_first", "verifying_with_playwright", "revising", "done"]) {
    if (!lifecycleStates.has(requiredState)) blockers.push(`Lifecycle state machine missing ${requiredState}.`);
  }
  if (lifecycleStateMachine.default_entrypoint !== "/archetype \"project idea\"") {
    blockers.push("Lifecycle state machine must define /archetype natural-language default entrypoint.");
  }
  if (!String(lifecycleStateMachine.principle ?? "").includes("No code before contract")) {
    blockers.push("Lifecycle state machine must include the spec/test/verification principle.");
  }
  if (lifecycleExecutionState.source_scope !== "HL-07") {
    blockers.push("Lifecycle execution state must identify source_scope HL-07.");
  }
  const allowedExecutionStates = ["test_first_authoring", "implementation", "qa_verification", "repair_or_revision", "completion"];
  if (!allowedExecutionStates.includes(String(lifecycleExecutionState.current_state))) {
    blockers.push("Lifecycle execution state current_state is invalid.");
  }
  if (lifecycleExecutionState.implementation_authorized !== manifest.implementation_authorized) {
    blockers.push("Lifecycle execution state implementation authorization must match manifest.");
  }
  if (lifecycleExecutionState.exit_condition !== "`ready_for_completion` is true.") {
    blockers.push("Lifecycle execution state must encode the HL-07 exit condition.");
  }
  for (const [id, state] of [[9, "test_first_authoring"], [10, "implementation"], [11, "qa_verification"], [12, "repair_or_revision"], [13, "completion"]] as const) {
    const executionState = lifecycleExecutionState.states?.find((item) => item.id === id && item.state === state);
    if (!executionState) {
      blockers.push(`Lifecycle execution state missing state ${id} ${state}.`);
      continue;
    }
    if (!Array.isArray(executionState.allowed) || executionState.allowed.length === 0) {
      blockers.push(`Lifecycle execution state ${state} must expose allowed operations.`);
    }
    if (!Array.isArray(executionState.forbidden) || executionState.forbidden.length === 0) {
      blockers.push(`Lifecycle execution state ${state} must expose forbidden operations.`);
    }
    if (!Array.isArray(executionState.outputs) || executionState.outputs.length === 0) {
      blockers.push(`Lifecycle execution state ${state} must expose outputs.`);
    }
  }
  const executionForbiddenExpectations: Record<string, string[]> = {
    test_first_authoring: [
      "Write product UI before tests.",
      "Generate tests that only prove generated markers exist.",
      "Weaken tests to make implementation pass."
    ],
    implementation: [
      "Invent routes, screens, actions, entities, visual systems, or data behavior outside spec.",
      "Replace real behavior with generic success panels.",
      "Use untyped escape hatches."
    ],
    qa_verification: [
      "Treat passing smoke tests as sufficient QA.",
      "Ignore visual or behavioral drift because selectors exist."
    ],
    repair_or_revision: [
      "Revise contract to excuse bad implementation.",
      "Close with unresolved repair queue."
    ],
    completion: [
      "Claim production readiness without evidence.",
      "Claim accessibility compliance without review."
    ]
  };
  for (const [state, expectedForbidden] of Object.entries(executionForbiddenExpectations)) {
    const executionState = lifecycleExecutionState.states?.find((item) => item.state === state);
    for (const forbidden of expectedForbidden) {
      if (!executionState?.forbidden?.includes(forbidden)) {
        blockers.push(`Lifecycle execution state ${state} missing forbidden behavior: ${forbidden}`);
      }
    }
  }
  const executionGates = lifecycleExecutionState.gates ?? [];
  for (const state of allowedExecutionStates) {
    if (!executionGates.some((gate) => gate.state === state)) {
      blockers.push(`Lifecycle execution state missing gate for ${state}.`);
    }
  }
  const testFirstGate = executionGates.find((gate) => gate.state === "test_first_authoring");
  if (testFirstGate?.evidence?.marker_only_tests_forbidden !== true) {
    blockers.push("Lifecycle execution test-first gate must forbid marker-only tests.");
  }
  if (!Array.isArray(lifecycleExecutionState.proof_artifacts) || !lifecycleExecutionState.proof_artifacts.includes("verification/playwright-evidence.json") || !lifecycleExecutionState.proof_artifacts.includes("10-revision/repair-task-queue.json")) {
    blockers.push("Lifecycle execution state must name Playwright evidence and repair queue proof artifacts.");
  }
  const computedReadyForCompletion = manifest.implementation_authorized === true &&
    targetExecutionReport.status === "pass" &&
    playwrightEvidence.status === "pass" &&
    repairTaskQueue.status === "pass" &&
    repairTaskQueue.task_count === 0;
  if (lifecycleExecutionState.ready_for_completion !== computedReadyForCompletion) {
    blockers.push("Lifecycle execution ready_for_completion must match target execution, Playwright evidence, and repair queue status.");
  }
  if (lifecycleExecutionState.ready_for_completion === true && lifecycleExecutionState.current_state !== "completion") {
    blockers.push("Lifecycle execution state must be completion when ready_for_completion is true.");
  }
  if (startRequest.source_scope !== "HL-05" || startRequest.state !== "start") {
    blockers.push("Start request artifact must identify HL-05 start state.");
  }
  if (!["natural_language_idea", "change_request", "existing_repo_request"].includes(String(startRequest.input?.request_type))) {
    blockers.push("Start request artifact must classify the request type.");
  }
  if (!Array.isArray(startRequest.allowed) || !startRequest.allowed.some((item) => item.includes("Capture intent")) || !startRequest.allowed.some((item) => item.includes("Detect imported files"))) {
    blockers.push("Start request artifact must encode Scope 05 start allowed operations.");
  }
  if (!Array.isArray(startRequest.forbidden) || !startRequest.forbidden.includes("Generate spec.") || !startRequest.forbidden.includes("Generate tests.") || !startRequest.forbidden.includes("Write product UI.")) {
    blockers.push("Start request artifact must forbid spec generation, test generation, and product UI writes.");
  }
  if (startRequest.output !== "lifecycle/start-request.json") {
    blockers.push("Start request artifact must name lifecycle/start-request.json as its output.");
  }
  if (!Array.isArray(startRequest.detected_context?.imported_files) || !Array.isArray(startRequest.detected_context?.screenshots) || !Array.isArray(startRequest.detected_context?.folders) || !Array.isArray(startRequest.detected_context?.repo_context)) {
    blockers.push("Start request artifact must expose imported files, screenshots, folders, and repo context arrays.");
  }
  if (!["complete", "needs_clarification"].includes(String(contextCompletion.status))) {
    blockers.push("Context completion status must be complete or needs_clarification.");
  }
  if (!Array.isArray(contextCompletion.questions)) {
    blockers.push("Context completion must expose clarification questions.");
  }
  if (!["complete", "needs_clarification"].includes(String(contextMatrix.status))) {
    blockers.push("Context matrix status must be complete or needs_clarification.");
  }
  if (!Array.isArray(contextMatrix.decisions) || contextMatrix.decisions.length === 0) {
    blockers.push("Context matrix must expose decisions.");
  }
  const allowedReadinessTiers = ["ready_for_clarification", "ready_for_contract_draft", "ready_for_contract_approval", "ready_for_test_authoring", "ready_for_implementation", "ready_for_qa", "ready_for_completion"];
  const requiredContextDimensions = ["product_outcome", "primary_users", "must_have_flows", "target_stack", "data_auth_boundary", "design_direction", "test_execution_permission", "assumption_approval", "safety_constraints"];
  if (contextMatrix.source_scope !== undefined && contextMatrix.source_scope !== "HL-03") {
    blockers.push("Context matrix must identify source_scope HL-03.");
  }
  if (contextMatrix.weak_context_definition !== "The next artifact would depend on unapproved invention.") {
    blockers.push("Context matrix must define weak context according to HL-03.");
  }
  if (!Array.isArray(contextMatrix.required_dimensions) || requiredContextDimensions.some((dimension) => !contextMatrix.required_dimensions?.includes(dimension))) {
    blockers.push("Context matrix must expose every HL-03 required dimension.");
  }
  if (!Array.isArray(contextMatrix.readiness_tiers) || JSON.stringify(contextMatrix.readiness_tiers) !== JSON.stringify(allowedReadinessTiers)) {
    blockers.push("Context matrix must expose the exact HL-03 readiness tiers.");
  }
  if (!allowedReadinessTiers.includes(String(contextMatrix.readiness_tier))) {
    blockers.push("Context matrix readiness tier is invalid.");
  }
  const allowedDecisionStatuses = ["confirmed", "candidate", "missing", "conflicted", "blocked"];
  for (const decision of contextMatrix.decisions ?? []) {
    if (!allowedDecisionStatuses.includes(String(decision.status))) {
      blockers.push(`Context matrix decision ${decision.id ?? "unknown"} uses invalid status ${String(decision.status)}.`);
    }
    if (typeof decision.evidence_level !== "string" || typeof decision.can_become_canonical !== "boolean") {
      blockers.push(`Context matrix decision ${decision.id ?? "unknown"} must expose evidence_level and can_become_canonical.`);
    }
  }
  if (contextCompletion.status !== contextMatrix.status) {
    blockers.push("Context completion and context matrix status must agree.");
  }
  if (contextCompletion.readiness_tier !== contextMatrix.readiness_tier) {
    blockers.push("Context completion and context matrix readiness tier must agree.");
  }
  if (contextCompletion.status === "needs_clarification" && (contextCompletion.questions?.length ?? 0) !== 1) {
    blockers.push("Needs-clarification packages must expose exactly one next question.");
  }
  const hl04Algorithm = [
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
  if (clarificationTurn.source_scope !== "HL-04") {
    blockers.push("Clarification turn artifact must identify source_scope HL-04.");
  }
  if (clarificationTurn.rule !== "Clarification is not a bulk form.") {
    blockers.push("Clarification turn artifact must encode the HL-04 bulk-form ban.");
  }
  if (JSON.stringify(clarificationTurn.algorithm ?? []) !== JSON.stringify(hl04Algorithm)) {
    blockers.push("Clarification turn artifact must expose the exact HL-04 algorithm.");
  }
  if (clarificationTurn.question_count !== (contextCompletion.questions?.length ?? 0)) {
    blockers.push("Clarification turn question count must match context completion questions.");
  }
  if (contextCompletion.status === "needs_clarification") {
    const currentQuestionId = clarificationTurn.current_question?.id ?? null;
    if (!currentQuestionId || currentQuestionId !== contextMatrix.next_question?.id) {
      blockers.push("Clarification turn current question must match context matrix next_question.");
    }
    if (clarificationTurn.question_count !== 1) {
      blockers.push("Clarification turn must expose exactly one current question while clarification is needed.");
    }
  }
  if (!String(clarificationTurn.answer_protocol?.update_behavior ?? "").includes("update the affected intake field")) {
    blockers.push("Clarification turn answer protocol must update the affected intake field.");
  }
  if (!String(clarificationTurn.answer_protocol?.final_pre_contract_step ?? "").includes("assumptions and candidate decisions")) {
    blockers.push("Clarification turn answer protocol must present assumptions and candidate decisions before contract generation.");
  }
  if (clarificationState.source_scope !== "HL-05" || clarificationState.state !== "clarification") {
    blockers.push("Clarification state artifact must identify HL-05 clarification state.");
  }
  if (clarificationState.context_status !== contextMatrix.status) {
    blockers.push("Clarification state context status must match the context matrix.");
  }
  const requiredBlockingDecisions = (contextMatrix.decisions ?? []).filter((decision) =>
    ["missing", "conflicted", "blocked"].includes(String(decision.status))
  );
  if (clarificationState.hard_blockers_remaining !== (requiredBlockingDecisions.length > 0)) {
    blockers.push("Clarification state hard blocker flag must reflect missing, conflicted, or blocked context decisions.");
  }
  if (contextCompletion.status === "needs_clarification" && clarificationState.current_question?.id !== contextMatrix.next_question?.id) {
    blockers.push("Clarification state current question must match context matrix next_question.");
  }
  if (!Array.isArray(clarificationState.allowed) || !clarificationState.allowed.includes("Ask one question.") || !clarificationState.allowed.includes("Update the context matrix after the answer.")) {
    blockers.push("Clarification state artifact must encode Scope 05 clarification allowed operations.");
  }
  if (!Array.isArray(clarificationState.forbidden) || !clarificationState.forbidden.includes("Ask bulk question sets by default.") || !clarificationState.forbidden.includes("Proceed to contract draft if a hard blocker remains.")) {
    blockers.push("Clarification state artifact must forbid bulk questions and contract draft while hard blockers remain.");
  }
  if (JSON.stringify(clarificationState.outputs ?? []) !== JSON.stringify(["lifecycle/clarification-state.json", "lifecycle/clarification-transcript.md"])) {
    blockers.push("Clarification state artifact must name the exact Scope 05 clarification outputs.");
  }
  const clarificationTranscript = readFileSync(clarificationTranscriptPath, "utf8");
  for (const requiredSection of ["## Start", "## Context Scan", "## Clarification", "## Optional Material Intake"]) {
    if (!clarificationTranscript.includes(requiredSection)) {
      blockers.push(`Clarification transcript missing ${requiredSection}.`);
    }
  }
  const missingContext = readFileSync(missingContextPath, "utf8");
  for (const requiredSection of ["## Context Matrix Blockers", "## Evidence Ledger Missing Information", "## Candidate Decisions", "## Next Question"]) {
    if (!missingContext.includes(requiredSection)) {
      blockers.push(`Missing context report missing ${requiredSection}.`);
    }
  }
  if (readinessTiers.source_scope !== "HL-03") {
    blockers.push("Readiness tiers artifact must identify source_scope HL-03.");
  }
  if (readinessTiers.weak_context_definition !== "The next artifact would depend on unapproved invention.") {
    blockers.push("Readiness tiers artifact must define weak context according to HL-03.");
  }
  if (!allowedReadinessTiers.includes(String(readinessTiers.current_tier))) {
    blockers.push("Readiness tiers artifact current tier is invalid.");
  }
  if (!Array.isArray(readinessTiers.gates) || readinessTiers.gates.length !== allowedReadinessTiers.length) {
    blockers.push("Readiness tiers artifact must expose exactly seven tier gates.");
  }
  if (allowedReadinessTiers.some((tier) => !readinessTiers.gates?.some((gate) => gate.tier === tier))) {
    blockers.push("Readiness tiers artifact must include every HL-03 tier.");
  }
  if (!Array.isArray(readinessTiers.artifact_backed_claims) || readinessTiers.artifact_backed_claims.length === 0 || readinessTiers.artifact_backed_claims.some((claim) => !Array.isArray(claim.artifact_refs) || claim.artifact_refs.length === 0)) {
    blockers.push("Readiness tier claims must point to artifact refs.");
  }
  if (readinessTiers.boolean_compatibility?.ready_for_frontend_agent !== manifest.ready_for_frontend_agent) {
    blockers.push("Readiness tiers boolean compatibility must match manifest frontend-agent readiness.");
  }
  if (readinessTiers.boolean_compatibility?.implementation_authorized !== manifest.implementation_authorized) {
    blockers.push("Readiness tiers boolean compatibility must match manifest implementation authorization.");
  }
  if (manifest.readiness_tier !== readiness.readinessTier || manifest.readiness_tier !== topManifest.readinessTier) {
    blockers.push("Manifest, top-level manifest, and readiness report must agree on readiness tier.");
  }
  if (manifest.readiness_tier !== readinessTiers.current_tier) {
    blockers.push("Manifest readiness tier must match lifecycle/readiness-tiers.json.");
  }
  validateImplementationPhases({
    implementationPhases,
    implementationPhasesMarkdown: readFileSync(implementationPhasesMarkdownPath, "utf8"),
    packageType: "canonical",
    contextStatus: String(contextCompletion.status ?? "complete"),
    readinessTier: String(manifest.readiness_tier ?? "unknown"),
    readyForFrontendAgent: manifest.ready_for_frontend_agent === true,
    implementationAuthorized: manifest.implementation_authorized === true,
    blockers
  });
  if (!["pass", "blocked"].includes(String(nonNegotiablePrinciples.status))) {
    blockers.push("Non-negotiable principles status must be pass or blocked for an exportable package.");
  }
  if (!Array.isArray(nonNegotiablePrinciples.gates) || nonNegotiablePrinciples.gates.length !== 10) {
    blockers.push("Non-negotiable principles must expose exactly ten gates.");
  }
  if ((nonNegotiablePrinciples.failures?.length ?? 0) > 0) {
    blockers.push("Non-negotiable principles contain failing gates.");
  }
  const allowedEvidenceLevels = ["unknown", "archetype_inference", "weak_user_hint", "explicit_user_answer", "imported_material_fact", "repo_fact", "user_confirmed_assumption"];
  const canonicalEvidenceLevels = ["explicit_user_answer", "imported_material_fact", "repo_fact", "user_confirmed_assumption"];
  if (evidenceDecisionModel.status !== "pass") {
    blockers.push("Evidence decision model must pass.");
  }
  const evidenceLevels = evidenceDecisionModel.evidence_levels ?? [];
  if (evidenceLevels.length !== allowedEvidenceLevels.length || allowedEvidenceLevels.some((level) => !evidenceLevels.some((item) => item.level === level))) {
    blockers.push("Evidence decision model must expose the seven HL-02 evidence levels.");
  }
  if (JSON.stringify(evidenceDecisionModel.canonical_evidence_levels ?? []) !== JSON.stringify(canonicalEvidenceLevels)) {
    blockers.push("Evidence decision model must expose the exact canonical evidence levels.");
  }
  if (JSON.stringify(evidenceDecisionModel.decision_statuses ?? []) !== JSON.stringify(allowedDecisionStatuses)) {
    blockers.push("Evidence decision model must expose the exact HL-02 decision statuses.");
  }
  if ((evidenceDecisionModel.confirmed_decision_violations?.length ?? 0) > 0) {
    blockers.push("Evidence decision model contains confirmed decisions backed by non-canonical evidence.");
  }
  if ((evidenceDecisionModel.failures?.length ?? 0) > 0) {
    blockers.push("Evidence decision model contains failures.");
  }
  if (manifest.implementation_authorized === true && (evidenceDecisionModel.canonical_surface_audit?.noncanonical_refs_in_authorized_package?.length ?? 0) > 0) {
    blockers.push("Implementation-authorized package contains non-canonical evidence refs in canonical surfaces.");
  }
  validateFrontendPracticeSkills({ frontendPracticeSkills, specialistReview, blockers });
  if (topManifest.readyForFrontendAgent === true && topManifest.implementationAuthorized !== true) {
    blockers.push("Top-level manifest cannot mark frontend-agent readiness without implementation authorization.");
  }
  if (manifest.ready_for_frontend_agent === true && manifest.implementation_authorized !== true) {
    blockers.push("Internal manifest cannot mark frontend-agent readiness without implementation authorization.");
  }
  const readinessEvidence = manifest.readiness_evidence ?? [];
  if (readinessEvidence.length < 4 || readinessEvidence.some((item) => !Array.isArray(item.artifact_refs) || item.artifact_refs.length === 0)) {
    blockers.push("Internal manifest readiness claims must point to artifact refs.");
  }

  const artifactIndex = manifest.artifact_index ?? [];
  let checkedFiles = 0;
  for (const artifact of artifactIndex) {
    if (artifact.includes("*")) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact))) {
      blockers.push(`Manifest artifact missing: ${artifact}`);
    }
  }
  for (const artifact of topManifest.artifacts ?? []) {
    if (artifact.required === false || !artifact.path) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact.path))) {
      blockers.push(`Top-level manifest artifact missing: ${artifact.path}`);
    }
  }

  if (manifest.ready_for_frontend_agent !== readiness.readyForFrontendAgent) {
    blockers.push("Manifest readiness and readiness report disagree.");
  }
  if (readiness.readyForFrontendAgent && (readiness.blockers?.length ?? 0) > 0) {
    blockers.push("Readiness report marks package ready while blockers exist.");
  }
  if (schemaReport.status === "fail" || (schemaReport.blockers?.length ?? 0) > 0) {
    blockers.push("Schema validation report contains blockers.");
  }
  if (dsag.integrity?.status === "fail" || (dsag.integrity?.blockers?.length ?? 0) > 0) {
    blockers.push("DSAG integrity report contains blockers.");
  }
  if ((readiness.score ?? 0) < 75) {
    blockers.push("Readiness score is below frontend-agent threshold.");
  }

  warnings.push(...(manifest.warnings ?? []));
  warnings.push(...(readiness.warnings ?? []));

  return {
    status: blockers.length > 0 ? "fail" : "pass",
    outputDir,
    checkedFiles,
    blockers,
    warnings: [...new Set(warnings)]
  };
}
