import type {
  DesignSystemArtifacts,
  DSAGEdge,
  DSAGEdgeType,
  DSAGGraph,
  DSAGIntegrityReport,
  DSAGNode,
  DSAGNodeType,
  EvidenceLedger,
  ExperienceArtifacts,
  FrontendContractArtifacts,
  ProductArtifacts
} from "../core/types";
import { slugify, stableId } from "../core/stable";

interface RegistryComponent {
  name: string;
  token_dependencies?: string[];
}

interface RegistryPattern {
  name: string;
  composed_of?: string[];
  used_on_screens?: string[];
  evidence_refs?: string[];
}

interface ExperienceFlowSpec {
  flow_id?: string;
  evidence_refs?: string[];
  steps?: Array<{
    step_id?: string;
    order?: number;
    route?: string;
    screen_id?: string;
    intent?: string;
    interaction?: string;
    required_states?: string[];
  }>;
}

function addNode(nodes: Map<string, DSAGNode>, node: DSAGNode): void {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function addEdge(edges: DSAGEdge[], from: string, to: string, type: DSAGEdgeType, evidenceRefs: string[] = []): void {
  edges.push({ from, to, type, evidence_refs: evidenceRefs });
}

function nodeId(type: DSAGNodeType, value: string): string {
  return `${type}:${slugify(value)}`;
}

function flattenTokenLeaves(value: unknown, prefix = ""): Array<{ path: string; value: string }> {
  if (typeof value === "string") return [{ path: prefix, value }];
  if (typeof value !== "object" || value === null) return [];
  const result: Array<{ path: string; value: string }> = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key;
    result.push(...flattenTokenLeaves(child, next));
  }
  return result;
}

function extractTokenRefs(value: unknown): string[] {
  if (typeof value === "string") {
    const matches = value.match(/\{([^}]+)\}/g) ?? [];
    return matches.map((match) => match.replace(/[{}]/g, ""));
  }
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value as Record<string, unknown>).flatMap((child) => extractTokenRefs(child));
}

function makeCheck(id: string, condition: boolean, details: string, warning = false): DSAGIntegrityReport["checks"][number] {
  return { id, status: condition ? "pass" : warning ? "warning" : "fail", details };
}

function buildIntegrity(nodes: Map<string, DSAGNode>, edges: DSAGEdge[], artifacts: {
  product: ProductArtifacts;
  experience: ExperienceArtifacts;
  designSystem: DesignSystemArtifacts;
}): DSAGIntegrityReport {
  const checks: DSAGIntegrityReport["checks"] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  const edgeKey = (from: string, to: string, type?: DSAGEdgeType) =>
    edges.some((edge) => edge.from === from && edge.to === to && (!type || edge.type === type));

  const jobs = (artifacts.product.productModel.core_jobs as Array<{ job_id?: string; job?: string }> | undefined) ?? [];
  const jobNodes = jobs.map((job) => nodeId("UserJob", job.job_id ?? job.job ?? "job"));

  for (const screen of artifacts.experience.screenSpecs) {
    const screenNode = nodeId("Screen", screen.screen_id);
    const hasJobLink = jobNodes.some((jobNode) => edgeKey(screenNode, jobNode, "supports") || edgeKey(jobNode, screenNode, "requires"));
    checks.push(makeCheck(`dsag.screen.${screen.screen_id}.job_link`, hasJobLink, `${screen.screen_id} maps to at least one user job.`));
  }

  const patternRegistry = artifacts.designSystem.patternRegistry as { patterns?: RegistryPattern[] };
  for (const pattern of patternRegistry.patterns ?? []) {
    const patternNode = nodeId("Pattern", pattern.name);
    const appearsOnScreen = edges.some((edge) => edge.from === patternNode && edge.type === "appears_on");
    checks.push(makeCheck(`dsag.pattern.${pattern.name}.screen_link`, appearsOnScreen, `${pattern.name} appears on at least one screen.`));
  }

  const componentRegistry = artifacts.designSystem.componentRegistry as { components?: RegistryComponent[] };
  const componentNames = new Set((componentRegistry.components ?? []).map((component) => component.name));
  for (const screen of artifacts.experience.screenSpecs) {
    for (const component of screen.required_components) {
      checks.push(makeCheck(`dsag.screen.${screen.screen_id}.component.${component}`, componentNames.has(component), `${component} exists in component registry.`));
    }
  }

  const semanticTokenNodes = new Set(flattenTokenLeaves(artifacts.designSystem.semanticTokens).map((token) => nodeId("Token", token.path)));
  const referencedTokens = new Set(extractTokenRefs({
    componentTokens: artifacts.designSystem.componentTokens,
    themeLight: artifacts.designSystem.themeLight,
    cssVariables: artifacts.designSystem.cssVariables
  }).map((tokenRef) => nodeId("Token", tokenRef)));
  for (const tokenNode of semanticTokenNodes) {
    checks.push(makeCheck(`dsag.token.${tokenNode}.referenced`, referencedTokens.has(tokenNode), `${tokenNode} is referenced by component, theme, or CSS token output.`, true));
  }

  const decisionNodes = [...nodes.values()].filter((node) => node.type === "Decision");
  for (const decision of decisionNodes) {
    const hasEvidenceLink = edges.some((edge) => edge.from === decision.id && edge.type === "derived_from");
    checks.push(makeCheck(`dsag.decision.${decision.id}.evidence`, hasEvidenceLink, `${decision.label} derives from evidence.`));
  }

  for (const check of checks) {
    if (check.status === "fail") blockers.push(`${check.id}: ${check.details}`);
    if (check.status === "warning") warnings.push(`${check.id}: ${check.details}`);
  }

  return {
    status: blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass",
    checks,
    blockers,
    warnings
  };
}

export function buildDSAGGraph(input: {
  evidence: EvidenceLedger;
  product: ProductArtifacts;
  experience: ExperienceArtifacts;
  designSystem: DesignSystemArtifacts;
  frontendContract: FrontendContractArtifacts;
}): DSAGGraph {
  const nodes = new Map<string, DSAGNode>();
  const edges: DSAGEdge[] = [];

  for (const source of input.evidence.sources) {
    addNode(nodes, {
      id: nodeId("EvidenceSource", source.source_id),
      type: "EvidenceSource",
      label: source.source_label,
      evidence_refs: [source.source_id],
      metadata: { source_type: source.source_type, confidence: source.confidence }
    });
  }

  for (const decision of input.evidence.decisions) {
    const decisionNode = nodeId("Decision", decision.id);
    addNode(nodes, {
      id: decisionNode,
      type: "Decision",
      label: decision.decision,
      evidence_refs: decision.evidence_refs,
      metadata: { status: decision.status, confidence: decision.confidence }
    });
    for (const ref of decision.evidence_refs) {
      addEdge(edges, decisionNode, nodeId("EvidenceSource", ref), "derived_from", [ref]);
    }
  }

  const productGoal = String(input.product.productModel.primary_goal ?? "Primary product goal");
  const productGoalNode = nodeId("ProductGoal", productGoal);
  addNode(nodes, { id: productGoalNode, type: "ProductGoal", label: productGoal, evidence_refs: ["fact_product_context"] });

  for (const goal of (input.product.productModel.business_goals as string[] | undefined) ?? []) {
    const businessGoalNode = nodeId("BusinessGoal", goal);
    addNode(nodes, { id: businessGoalNode, type: "BusinessGoal", label: goal, evidence_refs: ["source_user_context"] });
    addEdge(edges, businessGoalNode, productGoalNode, "supports", ["source_user_context"]);
  }

  const users = (input.product.productModel.primary_users as string[] | undefined) ?? [];
  for (const user of users) {
    const userNode = nodeId("UserType", user);
    addNode(nodes, { id: userNode, type: "UserType", label: user, evidence_refs: ["source_user_context"] });
  }

  const jobs = (input.product.productModel.core_jobs as Array<{ job_id?: string; job?: string; user_type?: string; evidence_refs?: string[] }> | undefined) ?? [];
  for (const job of jobs) {
    const jobNode = nodeId("UserJob", job.job_id ?? job.job ?? stableId("job", job));
    addNode(nodes, {
      id: jobNode,
      type: "UserJob",
      label: job.job ?? job.job_id ?? "User job",
      evidence_refs: job.evidence_refs ?? ["inference_domain_profile"],
      metadata: { user_type: job.user_type }
    });
    addEdge(edges, productGoalNode, jobNode, "supports", job.evidence_refs ?? ["inference_domain_profile"]);
    if (job.user_type) addEdge(edges, nodeId("UserType", job.user_type), jobNode, "requires", job.evidence_refs ?? ["source_user_context"]);
  }

  for (const entity of (input.product.productModel.core_entities as string[] | undefined) ?? []) {
    const entityNode = nodeId("Entity", entity);
    addNode(nodes, { id: entityNode, type: "Entity", label: entity, evidence_refs: ["decision_financial_entities"] });
  }

  for (const workflow of (input.product.productModel.primary_workflows as string[] | undefined) ?? []) {
    const workflowNode = nodeId("Workflow", workflow);
    addNode(nodes, { id: workflowNode, type: "Workflow", label: workflow, evidence_refs: ["inference_domain_profile"] });
    for (const job of jobs) {
      addEdge(edges, nodeId("UserJob", job.job_id ?? job.job ?? "job"), workflowNode, "requires", job.evidence_refs ?? ["inference_domain_profile"]);
    }
  }

  for (const flow of ((input.experience.flowSpecs as { flows?: ExperienceFlowSpec[] }).flows ?? [])) {
    const workflowNode = nodeId("Workflow", flow.flow_id ?? "workflow");
    for (const step of flow.steps ?? []) {
      const stepLabel = step.intent ?? step.step_id ?? "Flow step";
      const stepNode = nodeId("FlowStep", step.step_id ?? `${flow.flow_id}.${step.order ?? "step"}`);
      const evidenceRefs = flow.evidence_refs ?? ["inference_domain_profile"];
      addNode(nodes, {
        id: stepNode,
        type: "FlowStep",
        label: stepLabel,
        evidence_refs: evidenceRefs,
        metadata: {
          order: step.order,
          route: step.route,
          screen_id: step.screen_id,
          interaction: step.interaction,
          required_states: step.required_states ?? []
        }
      });
      addEdge(edges, workflowNode, stepNode, "composed_of", evidenceRefs);
      if (step.route) addEdge(edges, stepNode, nodeId("Route", step.route), "requires", evidenceRefs);
      if (step.screen_id) addEdge(edges, stepNode, nodeId("Screen", step.screen_id), "requires", evidenceRefs);
      if (step.screen_id) {
        for (const state of step.required_states ?? []) {
          addEdge(edges, stepNode, nodeId("State", `${step.screen_id}.${state}`), "requires", evidenceRefs);
        }
      }
    }
  }

  for (const route of input.experience.routeMap.routes) {
    const routeNode = nodeId("Route", route.route);
    const screenNode = nodeId("Screen", route.screen_id);
    addNode(nodes, { id: routeNode, type: "Route", label: route.route, evidence_refs: route.evidence_refs, metadata: { layout: route.layout } });
    addNode(nodes, { id: screenNode, type: "Screen", label: route.screen_id, evidence_refs: route.evidence_refs, metadata: { route: route.route } });
    addEdge(edges, routeNode, screenNode, "implemented_by", route.evidence_refs);
    for (const workflow of (input.product.productModel.primary_workflows as string[] | undefined) ?? []) {
      addEdge(edges, nodeId("Workflow", workflow), routeNode, "requires", ["inference_domain_profile"]);
    }
    for (const job of jobs) {
      addEdge(edges, screenNode, nodeId("UserJob", job.job_id ?? job.job ?? "job"), "supports", job.evidence_refs ?? ["inference_domain_profile"]);
    }
  }

  const componentRegistry = input.designSystem.componentRegistry as { components?: RegistryComponent[] };
  for (const component of componentRegistry.components ?? []) {
    const componentNode = nodeId("Component", component.name);
    addNode(nodes, { id: componentNode, type: "Component", label: component.name, evidence_refs: ["decision_compiler_order"] });
    for (const dependency of component.token_dependencies ?? []) {
      const tokenNode = nodeId("Token", dependency);
      addNode(nodes, { id: tokenNode, type: "Token", label: dependency, evidence_refs: ["decision_compiler_order"] });
      addEdge(edges, componentNode, tokenNode, "styled_by", ["decision_compiler_order"]);
    }
  }

  const semanticTokens = flattenTokenLeaves(input.designSystem.semanticTokens);
  for (const token of semanticTokens) {
    const tokenNode = nodeId("Token", token.path);
    addNode(nodes, { id: tokenNode, type: "Token", label: token.path, evidence_refs: ["decision_compiler_order"], metadata: { value: token.value, layer: "semantic" } });
  }

  const componentTokenRefs = extractTokenRefs(input.designSystem.componentTokens);
  for (const tokenRef of componentTokenRefs) {
    addNode(nodes, { id: nodeId("Token", tokenRef), type: "Token", label: tokenRef, evidence_refs: ["decision_compiler_order"], metadata: { layer: "semantic_reference" } });
  }

  const patternRegistry = input.designSystem.patternRegistry as { patterns?: RegistryPattern[] };
  for (const pattern of patternRegistry.patterns ?? []) {
    const patternNode = nodeId("Pattern", pattern.name);
    addNode(nodes, {
      id: patternNode,
      type: "Pattern",
      label: pattern.name,
      evidence_refs: pattern.evidence_refs ?? ["inference_domain_profile"]
    });
    for (const component of pattern.composed_of ?? []) {
      addEdge(edges, patternNode, nodeId("Component", component), "composed_of", pattern.evidence_refs ?? ["inference_domain_profile"]);
    }
    for (const screenId of pattern.used_on_screens ?? []) {
      addEdge(edges, patternNode, nodeId("Screen", screenId), "appears_on", pattern.evidence_refs ?? ["inference_domain_profile"]);
    }
  }

  for (const screen of input.experience.screenSpecs) {
    const screenNode = nodeId("Screen", screen.screen_id);
    for (const pattern of screen.required_patterns) {
      addEdge(edges, screenNode, nodeId("Pattern", pattern), "implemented_by", screen.evidence_refs);
    }
    for (const component of screen.required_components) {
      addEdge(edges, screenNode, nodeId("Component", component), "composed_of", screen.evidence_refs);
    }
    for (const entity of screen.data_needs) {
      const dataNode = nodeId("DataContract", entity);
      addNode(nodes, { id: dataNode, type: "DataContract", label: entity, evidence_refs: ["inference_domain_profile"] });
      addEdge(edges, screenNode, dataNode, "requires", screen.evidence_refs);
    }
    for (const state of Object.keys(screen.states)) {
      const stateNode = nodeId("State", `${screen.screen_id}.${state}`);
      addNode(nodes, { id: stateNode, type: "State", label: `${screen.screen_id}.${state}`, evidence_refs: screen.evidence_refs });
      addEdge(edges, screenNode, stateNode, "requires", screen.evidence_refs);
    }
    addNode(nodes, { id: nodeId("AccessibilityRequirement", `${screen.screen_id}.wcag-aa`), type: "AccessibilityRequirement", label: `${screen.screen_id} WCAG AA requirements`, evidence_refs: screen.evidence_refs });
    addEdge(edges, screenNode, nodeId("AccessibilityRequirement", `${screen.screen_id}.wcag-aa`), "constrained_by", screen.evidence_refs);
  }

  const qualityGates = ["Evidence Quality", "Product Understanding", "UX Architecture", "Design System Coherence", "Accessibility", "Frontend Agent Readiness"];
  for (const gate of qualityGates) {
    const gateNode = nodeId("QualityGate", gate);
    addNode(nodes, { id: gateNode, type: "QualityGate", label: gate, evidence_refs: ["decision_compiler_order"] });
    for (const screen of input.experience.screenSpecs) {
      addEdge(edges, nodeId("Screen", screen.screen_id), gateNode, "validated_by", screen.evidence_refs);
    }
  }

  const integrity = buildIntegrity(nodes, edges, {
    product: input.product,
    experience: input.experience,
    designSystem: input.designSystem
  });

  return {
    graph_version: "1.0",
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: edges.sort((a, b) => `${a.from}:${a.type}:${a.to}`.localeCompare(`${b.from}:${b.type}:${b.to}`)),
    integrity
  };
}
