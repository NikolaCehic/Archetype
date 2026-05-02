import type { ArchetypeInput, DomainProfile, EvidenceLedger, IngestionArtifacts, SourceRecord } from "../core/types";
import { stableId } from "../core/stable";

export function buildEvidenceLedger(input: ArchetypeInput, profile: DomainProfile, projectId: string, ingestion: IngestionArtifacts): EvidenceLedger {
  const sources: SourceRecord[] = ingestion.normalizedSources.map((source) => ({
    source_id: source.source_id,
    source_type: source.source_type,
    source_label: source.source_label,
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
      {
        id: "fact_product_context",
        claim: `The product context is: ${input.context}`,
        confidence: "high",
        source_refs: ["source_user_context"]
      },
      ...goals.map((goal, index) => ({
        id: `fact_user_goal_${index + 1}`,
        claim: goal,
        confidence: "high" as const,
        source_refs: ["source_user_goals"]
      }))
    ],
    observations: ingestion.visualEvidence.sources.map((source) => ({
      id: stableId("observation", source.source_id),
      claim: `Visual source ${source.source_label} suggests density ${source.density}, layouts ${source.layout_patterns.join(", ") || "none"}, components ${source.component_candidates.join(", ") || "none"}, and states ${source.interaction_states.join(", ") || "none"}.`,
      confidence: source.confidence,
      reason: "Visual materials are useful design evidence but must be abstracted into structural signals, not copied directly.",
      source_refs: [source.source_id]
    })),
    inferences: [
      {
        id: "inference_domain_profile",
        claim: `The product should be treated as ${profile.productType}.`,
        confidence: "high",
        reason: "Detected from product context and goals.",
        source_refs: ["source_user_context", ...(goals.length > 0 ? ["source_user_goals"] : [])]
      },
      {
        id: "inference_interface_density",
        claim: "The interface should use medium-high density for scan-heavy workflows.",
        confidence: "medium",
        reason: "The product requires dashboards, tables, status, and reporting surfaces.",
        source_refs: ["source_user_context"]
      },
      {
        id: "inference_visual_evidence_profile",
        claim: `Visual evidence extraction found ${ingestion.visualEvidence.aggregate.density_profile} density, layouts ${ingestion.visualEvidence.aggregate.layout_patterns.join(", ") || "none"}, components ${ingestion.visualEvidence.aggregate.component_candidates.join(", ") || "none"}, and states ${ingestion.visualEvidence.aggregate.interaction_states.join(", ") || "none"}.`,
        confidence: ingestion.visualEvidence.source_count > 0 ? "medium" : "low",
        reason: "Derived from reference images, screenshots, and design materials as abstract implementation evidence.",
        source_refs: ingestion.visualEvidence.sources.map((source) => source.source_id)
      }
    ],
    assumptions: [
      {
        id: "assumption_web_responsive",
        claim: "Primary platform is web with responsive support.",
        confidence: "medium",
        reason: "The requested frontend contract targets web UI unless otherwise specified.",
        source_refs: ["source_user_context"]
      },
      {
        id: "assumption_light_theme_first",
        claim: "Light theme is generated first; dark mode is optional unless requested.",
        confidence: "medium",
        reason: "The spec defines light theme as required and dark theme as optional until deeper validation.",
        source_refs: ["source_user_context"]
      },
      {
        id: "assumption_settings_required",
        claim: "A settings surface is required for profile, account, and configuration workflows.",
        confidence: "low",
        reason: "Most authenticated products need settings, but exact settings requirements are not confirmed.",
        source_refs: ["source_user_context"]
      }
    ],
    conflicts: [],
    missing_information: missingInformation,
    risks: [
      ...profile.riskFlags.map((flag) => ({
        id: stableId("risk", flag),
        claim: `Risk-domain flag detected: ${flag}. Human review is required before compliance claims.`,
        confidence: "medium" as const,
        reason: "The product domain can affect financial, health, legal, safety, or regulated decisions.",
        source_refs: ["source_user_context"]
      })),
      {
        id: "risk_reference_copying",
        claim: "Reference images must be used as design evidence and not copied.",
        confidence: "high",
        reason: "The product spec requires abstract extraction rather than direct copying.",
        source_refs: ingestion.visualEvidence.sources.map((source) => source.source_id)
      },
      ...ingestion.safetyFindings.map((finding) => ({
        id: finding.id,
        claim: `${finding.severity} ${finding.category} finding in ${finding.source_id}: ${finding.finding}`,
        confidence: "high" as const,
        reason: finding.recommendation,
        source_refs: [finding.source_id]
      }))
    ],
    decisions: [
      {
        id: "decision_compiler_order",
        decision: "Generate product model and UX architecture before design-system artifacts.",
        status: "accepted",
        confidence: "high",
        evidence_refs: ["fact_product_context", "inference_domain_profile"]
      },
      {
        id: "decision_primary_dashboard",
        decision: "Include a primary overview surface for high-priority product status.",
        status: "accepted",
        confidence: "medium",
        evidence_refs: ["fact_product_context", "inference_interface_density"]
      },
      {
        id: "decision_visual_evidence_constraints",
        decision: "Use visual materials only as abstract evidence for density, hierarchy, navigation, components, states, and layout constraints.",
        status: "accepted",
        confidence: ingestion.visualEvidence.source_count > 0 ? "high" : "medium",
        evidence_refs: visualObservationRefs.length ? visualObservationRefs : ["inference_visual_evidence_profile"]
      },
      {
        id: "decision_financial_entities",
        decision: `Use ${profile.entities.join(", ")} as the initial entity model.`,
        status: "accepted",
        confidence: "medium",
        evidence_refs: ["inference_domain_profile"]
      },
      ...routeDecisionRefs
        .filter((ref) => !["decision_compiler_order", "decision_primary_dashboard", "decision_financial_entities"].includes(ref))
        .map((ref) => ({
          id: ref,
          decision: `Include route or workflow decision ${ref.replace(/^decision_/, "").replace(/_/g, " ")} in the generated architecture.`,
          status: "accepted" as const,
          confidence: "medium" as const,
          evidence_refs: ["inference_domain_profile"]
        }))
    ]
  };
}
