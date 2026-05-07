import type { ArchetypeInput, DomainProfile, EvidenceLedger, IngestionArtifacts, SourceRecord } from "../core/types";
import { stableId } from "../core/stable";
import {
  decisionRecord,
  evidenceItem,
  evidenceLevelCanBecomeCanonical,
  sourceTypeEvidenceLevel
} from "./evidenceDecisionModel";

export function buildEvidenceLedger(input: ArchetypeInput, profile: DomainProfile, projectId: string, ingestion: IngestionArtifacts): EvidenceLedger {
  const humanApproved = input.contractApproval?.approved === true && input.contractApproval.approverType === "human";
  const candidateEvidenceLevel = humanApproved ? "user_confirmed_assumption" : "archetype_inference";
  const sources: SourceRecord[] = ingestion.normalizedSources.map((source) => ({
    source_id: source.source_id,
    source_type: source.source_type,
    source_label: source.source_label,
    evidence_level: sourceTypeEvidenceLevel(source.source_type),
    can_become_canonical: evidenceLevelCanBecomeCanonical(sourceTypeEvidenceLevel(source.source_type)),
    observations: source.observations,
    design_implications: source.design_implications,
    used_for: source.used_for,
    confidence: source.confidence
  }));

  const goals = input.goals ?? [];
  const missingInformation = [
    "Confirmed backend data schema",
    "Confirmed authentication and authorization model",
    "Exact production copy requirements",
    "Human-validated accessibility review"
  ];

  if (!input.users || input.users.length === 0) {
    missingInformation.push("Exact primary and secondary user roles");
  }
  if (!input.brand?.primaryColor) {
    missingInformation.push("Confirmed brand color palette");
  }

  const routeDecisionRefs = [
    ...new Set(profile.routes.flatMap((route) => route.evidence_refs).filter((ref) => ref.startsWith("decision_")))
  ];
  const visualObservationRefs = ingestion.visualEvidence.sources.flatMap((source) => source.evidence_refs);

  return {
    project_id: projectId,
    ledger_version: "1.0",
    sources,
    known_facts: [
      evidenceItem({
        id: "fact_product_context",
        claim: `The product context is: ${input.context}`,
        confidence: "high",
        source_refs: ["source_user_context"]
      }, "explicit_user_answer"),
      ...goals.map((goal, index) => evidenceItem({
        id: `fact_user_goal_${index + 1}`,
        claim: goal,
        confidence: "high" as const,
        source_refs: ["source_user_goals"]
      }, "explicit_user_answer"))
    ],
    observations: ingestion.visualEvidence.sources.map((source) => evidenceItem({
      id: stableId("observation", source.source_id),
      claim: `Visual source ${source.source_label} suggests density ${source.density}, layouts ${source.layout_patterns.join(", ") || "none"}, components ${source.component_candidates.join(", ") || "none"}, and states ${source.interaction_states.join(", ") || "none"}.`,
      confidence: source.confidence,
      reason: "Visual materials are useful design evidence but must be abstracted into structural signals, not copied directly.",
      source_refs: [source.source_id]
    }, "imported_material_fact")),
    inferences: [
      evidenceItem({
        id: "inference_domain_profile",
        claim: `The product should be treated as ${profile.productType}.`,
        confidence: "high",
        reason: "Detected from product context and goals.",
        source_refs: ["source_user_context", ...(goals.length > 0 ? ["source_user_goals"] : [])]
      }, candidateEvidenceLevel),
      evidenceItem({
        id: "inference_interface_density",
        claim: "The interface should use medium-high density for scan-heavy workflows.",
        confidence: "medium",
        reason: "The product requires dashboards, tables, status, and reporting surfaces.",
        source_refs: ["source_user_context"]
      }, candidateEvidenceLevel),
      evidenceItem({
        id: "inference_visual_evidence_profile",
        claim: `Visual evidence extraction found ${ingestion.visualEvidence.aggregate.density_profile} density, layouts ${ingestion.visualEvidence.aggregate.layout_patterns.join(", ") || "none"}, components ${ingestion.visualEvidence.aggregate.component_candidates.join(", ") || "none"}, and states ${ingestion.visualEvidence.aggregate.interaction_states.join(", ") || "none"}.`,
        confidence: ingestion.visualEvidence.source_count > 0 ? "medium" : "low",
        reason: "Derived from reference images, screenshots, and design materials as abstract implementation evidence.",
        source_refs: ingestion.visualEvidence.sources.map((source) => source.source_id)
      }, ingestion.visualEvidence.source_count > 0 ? "imported_material_fact" : candidateEvidenceLevel)
    ],
    assumptions: [
      evidenceItem({
        id: "assumption_web_responsive",
        claim: "Primary platform is web with responsive support.",
        confidence: "medium",
        reason: "The requested frontend contract targets web UI unless otherwise specified.",
        source_refs: ["source_user_context"]
      }, candidateEvidenceLevel),
      evidenceItem({
        id: "assumption_light_theme_first",
        claim: "Light theme is generated first; dark mode is optional unless requested.",
        confidence: "medium",
        reason: "The spec defines light theme as required and dark theme as optional until deeper validation.",
        source_refs: ["source_user_context"]
      }, candidateEvidenceLevel),
      evidenceItem({
        id: "assumption_settings_required",
        claim: "A settings surface is required for profile, account, and configuration workflows.",
        confidence: "low",
        reason: "Most authenticated products need settings, but exact settings requirements are not confirmed.",
        source_refs: ["source_user_context"]
      }, candidateEvidenceLevel)
    ],
    conflicts: [],
    missing_information: missingInformation,
    risks: [
      ...profile.riskFlags.map((flag) => evidenceItem({
        id: stableId("risk", flag),
        claim: `Risk-domain flag detected: ${flag}. Human review is required before compliance claims.`,
        confidence: "medium" as const,
        reason: "The product domain can affect financial, health, legal, safety, or regulated decisions.",
        source_refs: ["source_user_context"]
      }, "weak_user_hint")),
      evidenceItem({
        id: "risk_reference_copying",
        claim: "Reference images must be used as design evidence and not copied.",
        confidence: "high",
        reason: "The product spec requires abstract extraction rather than direct copying.",
        source_refs: ingestion.visualEvidence.sources.map((source) => source.source_id)
      }, ingestion.visualEvidence.source_count > 0 ? "imported_material_fact" : "unknown"),
      ...ingestion.safetyFindings.map((finding) => evidenceItem({
        id: finding.id,
        claim: `${finding.severity} ${finding.category} finding in ${finding.source_id}: ${finding.finding}`,
        confidence: "high" as const,
        reason: finding.recommendation,
        source_refs: [finding.source_id]
      }, "imported_material_fact"))
    ],
    decisions: [
      decisionRecord({
        id: "decision_compiler_order",
        decision: "Generate product model and UX architecture before design-system artifacts.",
        confidence: "high",
        evidence_refs: ["fact_product_context"]
      }, { humanApproved }),
      decisionRecord({
        id: "decision_primary_dashboard",
        decision: "Include a primary overview surface for high-priority product status.",
        confidence: "medium",
        evidence_refs: ["fact_product_context", "inference_interface_density"]
      }, { humanApproved }),
      decisionRecord({
        id: "decision_visual_evidence_constraints",
        decision: "Use visual materials only as abstract evidence for density, hierarchy, navigation, components, states, and layout constraints.",
        confidence: ingestion.visualEvidence.source_count > 0 ? "high" : "medium",
        evidence_refs: visualObservationRefs.length ? visualObservationRefs : ["inference_visual_evidence_profile"]
      }, { humanApproved }),
      decisionRecord({
        id: "decision_financial_entities",
        decision: `Use ${profile.entities.join(", ")} as the initial entity model.`,
        confidence: "medium",
        evidence_refs: ["inference_domain_profile"]
      }, { humanApproved }),
      ...routeDecisionRefs
        .filter((ref) => !["decision_compiler_order", "decision_primary_dashboard", "decision_financial_entities"].includes(ref))
        .map((ref) => decisionRecord({
          id: ref,
          decision: `Include route or workflow decision ${ref.replace(/^decision_/, "").replace(/_/g, " ")} in the generated architecture.`,
          confidence: "medium" as const,
          evidence_refs: ["inference_domain_profile"]
        }, { humanApproved }))
    ]
  };
}
