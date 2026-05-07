import type { ArchetypePackage, DecisionRecord, EvidenceItem } from "../core/types";
import { buildFrontendPracticeSkillsArtifact, FRONTEND_PRACTICE_SKILLS } from "./frontendPracticeSkills";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function claimText(item: EvidenceItem): string {
  return item.claim ?? item.value ?? item.id;
}

function decisionStatusForRefs(pkg: ArchetypePackage, refs: string[]): DecisionRecord["status"] {
  if (refs.length === 0) return "candidate";
  const decisions = refs
    .map((ref) => pkg.evidence.decisions.find((decision) => decision.id === ref))
    .filter((decision): decision is DecisionRecord => Boolean(decision));
  if (decisions.length === 0) return "candidate";
  if (decisions.some((decision) => decision.status === "blocked")) return "blocked";
  if (decisions.some((decision) => decision.status === "conflicted")) return "conflicted";
  if (decisions.some((decision) => decision.status === "missing")) return "missing";
  if (decisions.every((decision) => decision.status === "confirmed")) return "confirmed";
  return "candidate";
}

function candidateDecisions(pkg: ArchetypePackage): DecisionRecord[] {
  return pkg.evidence.decisions.filter((decision) => decision.status !== "confirmed");
}

function confirmedDecisions(pkg: ArchetypePackage): DecisionRecord[] {
  return pkg.evidence.decisions.filter((decision) => decision.status === "confirmed");
}

function routeDraft(pkg: ArchetypePackage): Record<string, unknown>[] {
  return pkg.experience.routeMap.routes.map((route) => ({
    ...route,
    draft_status: decisionStatusForRefs(pkg, route.evidence_refs),
    acceptance_state: decisionStatusForRefs(pkg, route.evidence_refs) === "confirmed" ? "confirmed_fact" : "candidate_until_contract_approval"
  }));
}

function screenDraft(pkg: ArchetypePackage): Record<string, unknown>[] {
  return pkg.experience.screenSpecs.map((screen) => ({
    screen_id: screen.screen_id,
    route: screen.route,
    name: screen.name,
    purpose: screen.purpose,
    required_components: screen.required_components,
    required_patterns: screen.required_patterns,
    data_needs: screen.data_needs,
    states: screen.states,
    evidence_refs: screen.evidence_refs,
    draft_status: decisionStatusForRefs(pkg, screen.evidence_refs),
    acceptance_state: decisionStatusForRefs(pkg, screen.evidence_refs) === "confirmed" ? "confirmed_fact" : "candidate_until_contract_approval"
  }));
}

function componentDraft(pkg: ArchetypePackage): Record<string, unknown>[] {
  return asArray(asRecord(pkg.designSystem.componentContracts).contracts).map((item) => {
    const record = asRecord(item);
    const refs = asArray(record.evidence_refs).map(String);
    return {
      ...record,
      draft_status: decisionStatusForRefs(pkg, refs),
      acceptance_state: decisionStatusForRefs(pkg, refs) === "confirmed" ? "confirmed_fact" : "candidate_until_contract_approval"
    };
  });
}

function draftPolicy(pkg: ArchetypePackage): Record<string, unknown> {
  const approved = pkg.manifest.implementation_authorized === true;
  return {
    source_scope: "HL-06",
    state: "contract_draft",
    canonical: false,
    implementation_ready: false,
    approved,
    unconfirmed_items_default_status: "candidate",
    rule: "Every unconfirmed route, screen, state, token, component, data operation, action, form, verification strategy, and generated assumption remains candidate until human contract approval.",
    forbidden: [
      "Mark inferred items as accepted.",
      "Produce implementation-ready instructions.",
      "Tell the agent to write code."
    ],
    candidate_decision_ids: candidateDecisions(pkg).map((decision) => decision.id),
    confirmed_decision_ids: confirmedDecisions(pkg).map((decision) => decision.id)
  };
}

export function buildContractDraftArtifacts(pkg: ArchetypePackage): {
  contractState: Record<string, unknown>;
  productModelDraft: Record<string, unknown>;
  experienceArchitectureDraft: Record<string, unknown>;
  designSystemDraft: Record<string, unknown>;
  frontendContractDraft: Record<string, unknown>;
  specialistReview: Record<string, unknown>;
  contractApprovalRequest: Record<string, unknown>;
  assumptionLedger: string;
} {
  const policy = draftPolicy(pkg);
  const approval = asRecord(pkg.manifest.contract_approval);
  const approvalStatus = String(approval.status ?? "pending_human_review");
  const risks = pkg.evidence.risks.map(claimText);
  const unresolvedUnknowns = [
    ...pkg.evidence.missing_information,
    ...pkg.lifecycle.contextMatrix.decisions
      .filter((decision) => ["missing", "conflicted", "blocked"].includes(decision.status))
      .map((decision) => `${decision.id}: ${decision.reason}`)
  ];
  const candidates = candidateDecisions(pkg).map((decision) => ({
    id: decision.id,
    decision: decision.decision,
    status: decision.status,
    confidence: decision.confidence,
    evidence_refs: decision.evidence_refs
  }));
  const frontendPracticeGate = buildFrontendPracticeSkillsArtifact(pkg);
  const frontendPracticeBlockers = asArray(frontendPracticeGate.blockers).map(String);

  const contractState = {
    artifact_version: "1.0",
    source_scope: "HL-06",
    current_state: pkg.manifest.implementation_authorized ? "canonical_spec_generation" : "contract_approval",
    approval_status: approvalStatus,
    canonical_spec_generated: pkg.manifest.implementation_authorized === true,
    states: [
      {
        id: 5,
        state: "contract_draft",
        allowed: [
          "Propose product model, IA, routes, screens, flows, tokens, components, data contracts, action contracts, form contracts, and verification strategy.",
          "Mark every unconfirmed item as candidate."
        ],
        forbidden: [
          "Mark inferred items as accepted.",
          "Produce implementation-ready instructions.",
          "Tell the agent to write code."
        ],
        outputs: [
          "draft/product-model.draft.json",
          "draft/experience-architecture.draft.json",
          "draft/design-system.draft.json",
          "draft/design-system-preview.html",
          "draft/design-system-review.md",
          "draft/frontend-contract.draft.json",
          "draft/assumption-ledger.md"
        ]
      },
      {
        id: 6,
        state: "specialist_review",
        allowed: [
          "Review with specialist agents and frontend best-practice skills.",
          "Produce blockers, warnings, and recommendations."
        ],
        forbidden: [
          "Let the same role approve the draft it created.",
          "Convert warning into acceptance without evidence."
        ],
        outputs: ["draft/specialist-review.json"]
      },
      {
        id: 7,
        state: "contract_approval",
        allowed: [
          "Present confirmed facts, candidate assumptions, unresolved unknowns, and risks.",
          "Ask for approval or edits."
        ],
        forbidden: [
          "Generate canonical spec without approval.",
          "Hide assumptions in generated artifacts."
        ],
        outputs: ["draft/contract-approval-request.json"]
      },
      {
        id: 8,
        state: "canonical_spec_generation",
        allowed: [
          "Generate canonical spec and agent contract.",
          "Freeze route, screen, state, token, component, data, action, form, and verification contracts."
        ],
        forbidden: ["Add new product scope not present in approved contract."],
        outputs: [
          "spec/archetype-spec.json",
          "spec/archetype-spec.md",
          "frontend-agent-contract/implementation-rules.json",
          "frontend-agent-contract/frontend-agent-instructions.md",
          "frontend-agent-contract/acceptance-criteria.json"
        ]
      }
    ],
    exit_condition: "Canonical spec is valid, approved, and traceable."
  };

  const productModelDraft = {
    artifact_version: "1.0",
    ...policy,
    product_model: {
      ...pkg.product.productModel,
      draft_status: "candidate_until_contract_approval"
    },
    user_model: {
      ...pkg.product.userModel,
      draft_status: "candidate_until_contract_approval"
    },
    role_model: {
      ...pkg.product.roleModel,
      draft_status: "candidate_until_contract_approval"
    },
    entity_model: {
      ...pkg.product.entityModel,
      draft_status: "candidate_until_contract_approval"
    }
  };

  const experienceArchitectureDraft = {
    artifact_version: "1.0",
    ...policy,
    information_architecture: pkg.experience.informationArchitecture,
    routes: routeDraft(pkg),
    screens: screenDraft(pkg),
    flows: pkg.experience.flowSpecs,
    navigation_model: pkg.experience.navigationModel,
    state_models: pkg.experience.stateModels
  };

  const designSystemDraft = {
    artifact_version: "1.0",
    ...policy,
    visual_direction: pkg.designSystem.visualDirection,
    tokens: {
      primitive: pkg.designSystem.primitiveTokens,
      semantic: pkg.designSystem.semanticTokens,
      component: pkg.designSystem.componentTokens,
      typography: pkg.designSystem.typographySystem,
      token_contracts: pkg.designSystem.tokenContracts,
      draft_status: "candidate_until_contract_approval"
    },
    components: componentDraft(pkg),
    patterns: pkg.designSystem.patternContracts,
    accessibility: pkg.designSystem.accessibilityRules
  };

  const frontendContractDraft = {
    artifact_version: "1.0",
    ...policy,
    build_manifest: pkg.frontendContract.buildManifest,
    routing: pkg.frontendContract.routingContract,
    layout: pkg.frontendContract.layoutRules,
    responsive: pkg.frontendContract.responsiveRules,
    interaction: pkg.frontendContract.interactionRules,
    data_contracts: pkg.frontendContract.dataContracts,
    data_operation_contracts: pkg.frontendContract.dataOperationContracts,
    action_contracts: pkg.frontendContract.actionContracts,
    form_contracts: pkg.frontendContract.formContracts,
    verification_strategy: pkg.frontendContract.verificationContracts,
    implementation_ready: false,
    agent_instruction_policy: "Do not tell an implementation agent to write product UI until the canonical spec is generated after human approval."
  };

  const specialistReview = {
    artifact_version: "1.0",
    source_scope: "HL-06",
    state: "specialist_review",
    reviewers: [
      { role: "product_architect", relationship_to_draft: "independent_review", may_approve: false },
      { role: "frontend_best_practice_enforcer", relationship_to_draft: "independent_review", may_approve: false },
      { role: "qa_contract_reviewer", relationship_to_draft: "independent_review", may_approve: false },
      { role: "accessibility_reviewer", relationship_to_draft: "independent_review", may_approve: false }
    ],
    blockers: approvalStatus === "approved" ? [] : ["Canonical spec generation is blocked until a human approves the draft contract."],
    warnings: [
      ...pkg.quality.readiness.warnings,
      ...candidates.map((decision) => `Candidate decision needs approval: ${decision.id}`)
    ],
    recommendations: [
      "Review candidate decisions before approval.",
      "Confirm unresolved unknowns or approve them as visible draft assumptions.",
      "Reject any draft item that depends on inference but is marked accepted.",
      "Run every HL-08 frontend practice check as pass/fail before approval."
    ],
    frontend_practice_gate: {
      source_scope: "HL-08",
      status: frontendPracticeBlockers.length > 0 ? "fail" : "pass",
      enforcement_rule: "Frontend best-practice skills are pass/fail checks in the specialist gate, not optional recommendations.",
      required_skills: FRONTEND_PRACTICE_SKILLS.map((skill) => skill.id),
      checks: asArray(frontendPracticeGate.practices).map((practice) => {
        const record = asRecord(practice);
        return {
          skill: record.skill,
          owner: record.owner,
          status: record.status,
          blocker_list: record.blocker_list,
          output_artifact: record.output_artifact
        };
      }),
      blockers: frontendPracticeBlockers
    },
    forbidden: [
      "The creator role may not approve its own draft.",
      "Warnings may not be converted into acceptance without evidence."
    ]
  };

  const contractApprovalRequest = {
    artifact_version: "1.0",
    source_scope: "HL-06",
    state: "contract_approval",
    approval_status: approvalStatus,
    approved: approval.approved === true,
    confirmed_facts: pkg.evidence.known_facts.map(claimText),
    candidate_assumptions: [
      ...pkg.evidence.assumptions.map(claimText),
      ...pkg.evidence.inferences.map(claimText),
      ...candidates.map((decision) => `${decision.id}: ${decision.decision}`)
    ],
    unresolved_unknowns: unresolvedUnknowns,
    risks,
    request: "Approve this draft contract for canonical spec generation, or edit the candidate assumptions and unresolved unknowns first.",
    forbidden: [
      "Generate canonical spec without approval.",
      "Hide assumptions in generated artifacts."
    ]
  };

  const assumptionLedger = [
    "# Draft Assumption Ledger",
    "",
    "## Policy",
    "",
    "- Source scope: HL-06",
    "- Every unconfirmed item remains candidate until human contract approval.",
    "- Inferred items are not accepted decisions.",
    "- Canonical spec generation is blocked without approval.",
    "",
    "## Candidate Decisions",
    "",
    ...(candidates.length > 0 ? candidates.map((decision) => `- ${decision.id}: ${decision.decision} (${decision.status})`) : ["- None."]),
    "",
    "## Inferred Assumptions",
    "",
    ...(pkg.evidence.assumptions.length > 0 ? pkg.evidence.assumptions.map((item) => `- ${claimText(item)}`) : ["- None."]),
    "",
    "## Unresolved Unknowns",
    "",
    ...(unresolvedUnknowns.length > 0 ? unresolvedUnknowns.map((item) => `- ${item}`) : ["- None."]),
    "",
    "## Risks",
    "",
    ...(risks.length > 0 ? risks.map((item) => `- ${item}`) : ["- None."])
  ].join("\n");

  return {
    contractState,
    productModelDraft,
    experienceArchitectureDraft,
    designSystemDraft,
    frontendContractDraft,
    specialistReview,
    contractApprovalRequest,
    assumptionLedger
  };
}
