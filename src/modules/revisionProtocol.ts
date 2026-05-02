import type {
  DSAGGraph,
  EvidenceLedger,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  ProductArtifacts,
  RevisionArtifacts
} from "../core/types";

const ARTIFACTS = {
  evidence: "01-evidence/evidence-ledger.json",
  productModel: "02-product-model/product-model.json",
  userModel: "02-product-model/user-model.json",
  entityModel: "02-product-model/entity-model.json",
  routeMap: "03-experience-architecture/route-map.json",
  screenInventory: "03-experience-architecture/screen-inventory.json",
  screenSpecs: "05-screen-specs/*.yaml",
  designSystem: "04-design-system",
  componentRegistry: "04-design-system/components/component-registry.json",
  patternRegistry: "04-design-system/patterns/pattern-registry.json",
  dataContracts: "06-frontend-agent-contract/data-contracts.json",
  frontendContract: "06-frontend-agent-contract",
  dsag: "03-experience-architecture/dsag.json",
  readiness: "00-manifest/implementation-readiness.json"
} as const;

export function buildRevisionArtifacts(input: {
  evidence: EvidenceLedger;
  product: ProductArtifacts;
  experience: ExperienceArtifacts;
  frontendContract: FrontendContractArtifacts;
  dsag: DSAGGraph;
}): RevisionArtifacts {
  const artifactDependencyGraph = {
    graph_version: "1.0",
    nodes: Object.entries(ARTIFACTS).map(([id, path]) => ({ id, path })),
    edges: [
      { from: "evidence", to: "productModel", reason: "Product model derives from evidence." },
      { from: "evidence", to: "userModel", reason: "User model derives from evidence." },
      { from: "productModel", to: "routeMap", reason: "Routes depend on product workflows and jobs." },
      { from: "productModel", to: "entityModel", reason: "Entities derive from product domain." },
      { from: "routeMap", to: "screenInventory", reason: "Screen inventory mirrors route architecture." },
      { from: "screenInventory", to: "screenSpecs", reason: "Screen specs implement screen inventory." },
      { from: "screenSpecs", to: "componentRegistry", reason: "Components must cover required screen composition." },
      { from: "screenSpecs", to: "patternRegistry", reason: "Patterns must cover product-specific screen needs." },
      { from: "entityModel", to: "dataContracts", reason: "Data contracts expose product entities." },
      { from: "screenSpecs", to: "frontendContract", reason: "Frontend contract must build declared screens." },
      { from: "componentRegistry", to: "frontendContract", reason: "Frontend contract constrains component usage." },
      { from: "patternRegistry", to: "frontendContract", reason: "Frontend contract constrains pattern usage." },
      { from: "dataContracts", to: "frontendContract", reason: "Frontend build needs data shapes." },
      { from: "frontendContract", to: "dsag", reason: "DSAG validates implementation graph coherence." },
      { from: "dsag", to: "readiness", reason: "Readiness depends on graph integrity." }
    ]
  };

  const invalidationRules = {
    rules: [
      {
        trigger: "evidence_changed",
        invalidates: ["productModel", "userModel", "entityModel", "routeMap", "screenInventory", "screenSpecs", "designSystem", "frontendContract", "dsag", "readiness"],
        reason: "Evidence changes can alter all downstream architecture decisions."
      },
      {
        trigger: "product_model_changed",
        invalidates: ["routeMap", "screenInventory", "screenSpecs", "designSystem", "frontendContract", "dsag", "readiness"],
        reason: "Product and workflow changes alter UX architecture and contracts."
      },
      {
        trigger: "route_map_changed",
        invalidates: ["screenInventory", "screenSpecs", "frontendContract", "dsag", "readiness"],
        reason: "Routes determine screen inventory and build contract."
      },
      {
        trigger: "screen_spec_changed",
        invalidates: ["componentRegistry", "patternRegistry", "frontendContract", "dsag", "readiness"],
        reason: "Screen composition determines system and contract requirements."
      },
      {
        trigger: "component_registry_changed",
        invalidates: ["frontendContract", "dsag", "readiness"],
        reason: "Contract and graph must reflect component availability."
      },
      {
        trigger: "data_contract_changed",
        invalidates: ["screenSpecs", "frontendContract", "dsag", "readiness"],
        reason: "Data shape changes affect UI states, fixtures, and build expectations."
      },
      {
        trigger: "accessibility_rule_changed",
        invalidates: ["screenSpecs", "componentRegistry", "patternRegistry", "frontendContract", "readiness"],
        reason: "Accessibility rules constrain screens, components, and export readiness."
      }
    ]
  };

  const initialChangeSet = {
    change_set_id: "initial_generation",
    change_type: "initial_generation",
    summary: "Initial compiler-generated package.",
    changed_decisions: input.evidence.decisions.map((decision) => decision.id),
    generated_routes: input.experience.routeMap.routes.map((route) => route.route),
    generated_screens: input.experience.screenSpecs.map((screen) => screen.screen_id),
    generated_contract_routes: (input.frontendContract.buildManifest.entry_routes as string[] | undefined) ?? [],
    dsag_nodes: input.dsag.nodes.length,
    dsag_edges: input.dsag.edges.length,
    invalidated_artifacts: [],
    regenerated_artifacts: Object.values(ARTIFACTS)
  };

  const approvalGates = {
    gates: [
      {
        id: "gate_product_understanding",
        label: "Product Understanding Approval",
        required_artifacts: [ARTIFACTS.evidence, ARTIFACTS.productModel, ARTIFACTS.userModel, ARTIFACTS.entityModel],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_ux_architecture",
        label: "UX Architecture Approval",
        required_artifacts: [ARTIFACTS.routeMap, ARTIFACTS.screenInventory],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_design_system",
        label: "Design System Direction Approval",
        required_artifacts: [ARTIFACTS.componentRegistry, ARTIFACTS.patternRegistry],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_frontend_contract",
        label: "Frontend Contract Approval",
        required_artifacts: [ARTIFACTS.frontendContract, ARTIFACTS.dataContracts],
        approval_state: "pending_human_review"
      },
      {
        id: "gate_export",
        label: "Export Approval",
        required_artifacts: [ARTIFACTS.dsag, ARTIFACTS.readiness],
        approval_state: "pending_human_review"
      }
    ]
  };

  return {
    revisionProtocol: [
      "# Revision Protocol",
      "",
      "Archetype revisions must preserve evidence traceability and artifact coherence.",
      "",
      "Process:",
      "",
      "1. Capture feedback as a revision request.",
      "2. Classify changed evidence, product decisions, UX architecture, design-system decisions, or frontend contract rules.",
      "3. Mark affected decisions as accepted, rejected, superseded, or blocked.",
      "4. Use invalidation rules to mark stale artifacts.",
      "5. Regenerate only affected artifacts and their dependents.",
      "6. Rebuild DSAG and readiness reports.",
      "7. Produce a diff summary before export."
    ].join("\n"),
    artifactDependencyGraph,
    invalidationRules,
    initialChangeSet,
    approvalGates,
    decisionDiffPolicy: [
      "# Decision Diff Policy",
      "",
      "- Decision diffs compare decision ID, status, confidence, evidence refs, and decision text.",
      "- Superseded decisions must point to replacement decisions.",
      "- Rejected decisions must include a reason.",
      "- Low-confidence decisions may be promoted only with stronger evidence or explicit user approval.",
      "- Diff summaries must list affected artifacts and validation changes."
    ].join("\n"),
    artifactInvalidationReport: [
      "# Artifact Invalidation Report",
      "",
      "Current revision: initial_generation",
      "",
      "No stale artifacts exist in the initial generated package.",
      "",
      "Future revisions must apply invalidation rules before export."
    ].join("\n")
  };
}
