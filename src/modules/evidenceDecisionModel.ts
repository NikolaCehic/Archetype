import type {
  ArchetypePackage,
  DecisionRecord,
  DecisionStatus,
  EvidenceItem,
  EvidenceLevel,
  LifecycleArtifacts
} from "../core/types";

export const EVIDENCE_LEVELS: Array<{
  level: EvidenceLevel;
  meaning: string;
  can_become_canonical: boolean;
}> = [
  {
    level: "unknown",
    meaning: "No evidence exists.",
    can_become_canonical: false
  },
  {
    level: "archetype_inference",
    meaning: "Archetype inferred it from category, keywords, or patterns.",
    can_become_canonical: false
  },
  {
    level: "weak_user_hint",
    meaning: "The user hinted, but did not define enough for implementation.",
    can_become_canonical: false
  },
  {
    level: "explicit_user_answer",
    meaning: "The user directly answered the decision.",
    can_become_canonical: true
  },
  {
    level: "imported_material_fact",
    meaning: "Present in imported spec, PRD, screenshot, wireframe, design file, or notes.",
    can_become_canonical: true
  },
  {
    level: "repo_fact",
    meaning: "Proven by the target repository.",
    can_become_canonical: true
  },
  {
    level: "user_confirmed_assumption",
    meaning: "Proposed by Archetype and approved by user.",
    can_become_canonical: true
  }
];

export const CANONICAL_EVIDENCE_LEVELS: EvidenceLevel[] = [
  "explicit_user_answer",
  "imported_material_fact",
  "repo_fact",
  "user_confirmed_assumption"
];

export const DECISION_STATUSES: DecisionStatus[] = [
  "confirmed",
  "candidate",
  "missing",
  "conflicted",
  "blocked"
];

interface EvidenceRefOptions {
  humanApproved?: boolean;
  confirmedDecisionIds?: Set<string>;
}

interface ClassifiedDecision {
  status: DecisionStatus;
  canonicalEvidenceRefs: string[];
  candidateEvidenceRefs: string[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function evidenceLevelCanBecomeCanonical(level: EvidenceLevel): boolean {
  return CANONICAL_EVIDENCE_LEVELS.includes(level);
}

export function sourceTypeEvidenceLevel(sourceType: string): EvidenceLevel {
  if (sourceType === "code") return "repo_fact";
  if (["document", "design_file", "screenshot", "brand", "brand_material", "image_reference"].includes(sourceType)) {
    return "imported_material_fact";
  }
  if (["natural_language_context", "user_goals", "user_roles", "frontend_stack", "data_boundary", "test_execution_permission", "assumption_approval", "safety_constraints"].includes(sourceType)) {
    return "explicit_user_answer";
  }
  if (sourceType === "other") return "weak_user_hint";
  return "unknown";
}

export function evidenceLevelForReference(ref: string, options: EvidenceRefOptions = {}): EvidenceLevel {
  if (!ref) return "unknown";
  if (ref.startsWith("fact_")) return "explicit_user_answer";
  if (ref.startsWith("observation_")) return "imported_material_fact";
  if (ref.startsWith("source_")) {
    if (ref.includes("material") || ref.includes("reference_image") || ref.includes("brand")) return "imported_material_fact";
    if (ref.includes("repo") || ref.includes("code")) return "repo_fact";
    return "explicit_user_answer";
  }
  if (ref.startsWith("decision_")) {
    return options.humanApproved || options.confirmedDecisionIds?.has(ref)
      ? "user_confirmed_assumption"
      : "archetype_inference";
  }
  if (ref.startsWith("inference_") || ref.startsWith("assumption_")) {
    return options.humanApproved ? "user_confirmed_assumption" : "archetype_inference";
  }
  return "unknown";
}

export function evidenceItem<T extends Omit<EvidenceItem, "evidence_level" | "can_become_canonical">>(
  item: T,
  evidenceLevel: EvidenceLevel
): T & Pick<EvidenceItem, "evidence_level" | "can_become_canonical"> {
  return {
    ...item,
    evidence_level: evidenceLevel,
    can_become_canonical: evidenceLevelCanBecomeCanonical(evidenceLevel)
  };
}

export function classifyDecisionEvidenceRefs(refs: string[], options: EvidenceRefOptions = {}): ClassifiedDecision {
  if (refs.length === 0) {
    return {
      status: "missing",
      canonicalEvidenceRefs: [],
      candidateEvidenceRefs: []
    };
  }
  const canonicalEvidenceRefs = refs.filter((ref) => evidenceLevelCanBecomeCanonical(evidenceLevelForReference(ref, options)));
  const candidateEvidenceRefs = refs.filter((ref) => !canonicalEvidenceRefs.includes(ref));
  return {
    status: candidateEvidenceRefs.length === 0 ? "confirmed" : "candidate",
    canonicalEvidenceRefs,
    candidateEvidenceRefs
  };
}

export function decisionStatusForEvidenceRefs(refs: string[], options: EvidenceRefOptions = {}): DecisionStatus {
  return classifyDecisionEvidenceRefs(refs, options).status;
}

export function decisionRecord(input: {
  id: string;
  decision: string;
  confidence: DecisionRecord["confidence"];
  evidence_refs: string[];
  status?: DecisionStatus;
}, options: EvidenceRefOptions = {}): DecisionRecord {
  const classification = classifyDecisionEvidenceRefs(input.evidence_refs, options);
  return {
    id: input.id,
    decision: input.decision,
    status: input.status ?? classification.status,
    confidence: input.confidence,
    evidence_refs: input.evidence_refs,
    canonical_evidence_refs: classification.canonicalEvidenceRefs,
    candidate_evidence_refs: classification.candidateEvidenceRefs
  };
}

export function humanApprovedPackage(pkg: Pick<ArchetypePackage, "manifest">): boolean {
  const approval = asRecord(pkg.manifest.contract_approval);
  return pkg.manifest.implementation_authorized === true
    && approval.status === "approved"
    && approval.approver_type === "human";
}

function collectEvidenceRefs(value: unknown, path: string, refs: Array<{ path: string; refs: string[] }>): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectEvidenceRefs(item, `${path}[${index}]`, refs));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  const record = value as Record<string, unknown>;
  const evidenceRefs = record.evidence_refs;
  if (Array.isArray(evidenceRefs)) {
    refs.push({ path, refs: evidenceRefs.map(String) });
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === "evidence_refs") continue;
    collectEvidenceRefs(child, `${path}.${key}`, refs);
  }
}

function confirmedDecisionIds(pkg: ArchetypePackage): Set<string> {
  return new Set(pkg.evidence.decisions.filter((decision) => decision.status === "confirmed").map((decision) => decision.id));
}

function evidenceRefsFromLedger(pkg: ArchetypePackage): string[] {
  return uniq([
    ...pkg.evidence.known_facts.map((item) => item.id),
    ...pkg.evidence.observations.map((item) => item.id),
    ...pkg.evidence.inferences.map((item) => item.id),
    ...pkg.evidence.assumptions.map((item) => item.id),
    ...pkg.evidence.conflicts.map((item) => item.id),
    ...pkg.evidence.risks.map((item) => item.id),
    ...pkg.evidence.decisions.map((item) => item.id),
    ...pkg.evidence.decisions.flatMap((item) => item.evidence_refs)
  ]);
}

export function buildEvidenceDecisionModelArtifact(pkg: ArchetypePackage): Record<string, unknown> {
  const humanApproved = humanApprovedPackage(pkg);
  const confirmedIds = confirmedDecisionIds(pkg);
  const options = { humanApproved, confirmedDecisionIds: confirmedIds };
  const canonicalSurfaces = [
    { path: "product/product-model.json", value: pkg.product.productModel },
    { path: "product/user-roles.json", value: pkg.product.roleModel },
    { path: "experience/route-map.json", value: pkg.experience.routeMap },
    { path: "screens/screen-specs.json", value: { screens: pkg.experience.screenSpecs } },
    { path: "design-system/tokens.json", value: pkg.designSystem.tokenContracts },
    { path: "design-system/component-contracts.json", value: pkg.designSystem.componentContracts },
    { path: "frontend-agent-contract/implementation-rules.json", value: pkg.frontendContract },
    { path: "test-first/test-first-contract.json", value: pkg.testFirst.contractJson },
    { path: "verification/playwright-verification-contract.json", value: pkg.playwright.contractJson }
  ];
  const surfaceRefs: Array<{ path: string; refs: string[] }> = [];
  for (const surface of canonicalSurfaces) {
    collectEvidenceRefs(surface.value, surface.path, surfaceRefs);
  }
  const noncanonicalSurfaceRefs = surfaceRefs.flatMap((entry) =>
    entry.refs
      .filter((ref) => !evidenceLevelCanBecomeCanonical(evidenceLevelForReference(ref, options)))
      .map((ref) => ({
        path: entry.path,
        ref,
        evidence_level: evidenceLevelForReference(ref, options)
      }))
  );
  const confirmedDecisionViolations = pkg.evidence.decisions
    .filter((decision) => decision.status === "confirmed")
    .filter((decision) => decision.evidence_refs.some((ref) => !evidenceLevelCanBecomeCanonical(evidenceLevelForReference(ref, options))))
    .map((decision) => decision.id);
  const allRefs = uniq([
    ...evidenceRefsFromLedger(pkg),
    ...surfaceRefs.flatMap((entry) => entry.refs)
  ]);
  const evidenceRefIndex = allRefs.map((ref) => {
    const level = evidenceLevelForReference(ref, options);
    return {
      ref,
      evidence_level: level,
      can_become_canonical: evidenceLevelCanBecomeCanonical(level)
    };
  });
  const decisionStatusCounts = DECISION_STATUSES.reduce<Record<string, number>>((counts, status) => {
    counts[status] = pkg.evidence.decisions.filter((decision) => decision.status === status).length;
    return counts;
  }, {});
  const failures = [
    ...confirmedDecisionViolations.map((id) => `Confirmed decision has non-canonical evidence refs: ${id}.`),
    ...(pkg.manifest.implementation_authorized
      ? noncanonicalSurfaceRefs.map((item) => `Authorized canonical surface uses non-canonical ref ${item.ref} at ${item.path}.`)
      : [])
  ];

  return {
    artifact_version: "1.0",
    source_scope: "HL-02",
    status: failures.length > 0 ? "fail" : "pass",
    package_phase: pkg.manifest.implementation_authorized ? "implementation_authorized" : "draft_or_clarification",
    evidence_levels: EVIDENCE_LEVELS,
    canonical_evidence_levels: CANONICAL_EVIDENCE_LEVELS,
    decision_statuses: DECISION_STATUSES,
    canonical_claim_policy: "Only explicit_user_answer, imported_material_fact, repo_fact, and user_confirmed_assumption may enter implementation-authorized canonical artifacts.",
    inference_policy: "archetype_inference and weak_user_hint remain candidate evidence unless the user explicitly confirms the assumption.",
    decision_summary: {
      total: pkg.evidence.decisions.length,
      counts: decisionStatusCounts
    },
    evidence_ref_index: evidenceRefIndex,
    canonical_surface_audit: {
      audited_surfaces: canonicalSurfaces.map((surface) => surface.path),
      evidence_ref_count: surfaceRefs.reduce((total, entry) => total + entry.refs.length, 0),
      candidate_refs: noncanonicalSurfaceRefs,
      noncanonical_refs_in_authorized_package: pkg.manifest.implementation_authorized ? noncanonicalSurfaceRefs : []
    },
    confirmed_decision_violations: confirmedDecisionViolations,
    failures
  };
}

export function buildClarificationEvidenceDecisionModelArtifact(input: {
  contextMatrix: LifecycleArtifacts["contextMatrix"];
}): Record<string, unknown> {
  const decisions = input.contextMatrix.decisions;
  const invalidStatuses = decisions.filter((decision) => !DECISION_STATUSES.includes(decision.status));
  const missingCanonicalEvidence = decisions.filter((decision) =>
    decision.status === "confirmed" && !evidenceLevelCanBecomeCanonical(decision.evidence_level)
  );
  const failures = [
    ...invalidStatuses.map((decision) => `Invalid decision status for ${decision.id}: ${decision.status}.`),
    ...missingCanonicalEvidence.map((decision) => `Confirmed context decision lacks canonical evidence level: ${decision.id}.`)
  ];

  return {
    artifact_version: "1.0",
    source_scope: "HL-02",
    status: failures.length > 0 ? "fail" : "pass",
    package_phase: "clarification",
    evidence_levels: EVIDENCE_LEVELS,
    canonical_evidence_levels: CANONICAL_EVIDENCE_LEVELS,
    decision_statuses: DECISION_STATUSES,
    canonical_claim_policy: "Clarification packages cannot generate canonical implementation artifacts.",
    inference_policy: "Inference remains candidate evidence and can only shape the next question.",
    context_decision_summary: {
      total: decisions.length,
      counts: DECISION_STATUSES.reduce<Record<string, number>>((counts, status) => {
        counts[status] = decisions.filter((decision) => decision.status === status).length;
        return counts;
      }, {})
    },
    candidate_decisions: decisions
      .filter((decision) => decision.status === "candidate")
      .map((decision) => ({
        id: decision.id,
        evidence_level: decision.evidence_level,
        reason: decision.reason
      })),
    failures
  };
}

export function evidenceDecisionModelMarkdown(artifact: Record<string, unknown>): string {
  const levels = asArray(artifact.evidence_levels).map(asRecord);
  const statuses = asArray(artifact.decision_statuses).map(String);
  const failures = asArray(artifact.failures).map(String);
  return [
    "# Evidence And Decision Model",
    "",
    `Status: ${String(artifact.status ?? "unknown")}`,
    `Package phase: ${String(artifact.package_phase ?? "unknown")}`,
    "",
    "## Evidence Levels",
    "",
    ...levels.map((level) => `- ${String(level.level)}: canonical=${String(level.can_become_canonical)}; ${String(level.meaning)}`),
    "",
    "## Canonical Evidence Levels",
    "",
    ...CANONICAL_EVIDENCE_LEVELS.map((level) => `- ${level}`),
    "",
    "## Decision Statuses",
    "",
    ...statuses.map((status) => `- ${status}`),
    "",
    "## Policy",
    "",
    `- ${String(artifact.canonical_claim_policy ?? "No policy recorded.")}`,
    `- ${String(artifact.inference_policy ?? "No inference policy recorded.")}`,
    "",
    "## Failures",
    "",
    ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ["- None."])
  ].join("\n");
}
