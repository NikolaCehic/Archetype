export type OperatingMode =
  | "fast_architecture"
  | "full_architecture"
  | "existing_product_audit"
  | "contract_repair";

export interface ReferenceImageInput {
  id?: string;
  label: string;
  type?: string;
  notes?: string;
}

export interface BrandInput {
  attributes?: string[];
  primaryColor?: string;
  tone?: string;
}

export interface FrontendStackInput {
  framework?: string;
  language?: string;
  styling?: string;
  routing?: string;
}

export type SourceMaterialType = "document" | "code" | "design_file" | "screenshot" | "brand" | "other";

export interface SourceMaterialInput {
  id?: string;
  label: string;
  type: SourceMaterialType;
  content?: string;
  notes?: string;
  path?: string;
}

export interface ArchetypeInput {
  projectName?: string;
  context: string;
  goals?: string[];
  businessGoals?: string[];
  users?: string[];
  referenceImages?: ReferenceImageInput[];
  brand?: BrandInput;
  stack?: FrontendStackInput;
  operatingMode?: OperatingMode;
  materials?: SourceMaterialInput[];
}

export interface CompilerOptions {
  sourcePath?: string;
  outputDir?: string;
}

export interface SourceRecord {
  source_id: string;
  source_type: string;
  source_label: string;
  observations: string[];
  design_implications: string[];
  used_for: string[];
  confidence: "high" | "medium" | "low";
}

export interface EvidenceItem {
  id: string;
  claim?: string;
  value?: string;
  confidence: "high" | "medium" | "low";
  reason?: string;
  source_refs?: string[];
}

export interface DecisionRecord {
  id: string;
  decision: string;
  status: "proposed" | "accepted" | "rejected" | "superseded" | "blocked";
  confidence: "high" | "medium" | "low";
  evidence_refs: string[];
}

export interface EvidenceLedger {
  project_id: string;
  ledger_version: string;
  sources: SourceRecord[];
  known_facts: EvidenceItem[];
  observations: EvidenceItem[];
  inferences: EvidenceItem[];
  assumptions: EvidenceItem[];
  conflicts: EvidenceItem[];
  missing_information: string[];
  risks: EvidenceItem[];
  decisions: DecisionRecord[];
}

export interface NormalizedSource {
  source_id: string;
  source_type: string;
  source_label: string;
  summary: string;
  observations: string[];
  design_implications: string[];
  used_for: string[];
  confidence: "high" | "medium" | "low";
  redactions: string[];
}

export interface VisualEvidenceSignal {
  category: "density" | "navigation" | "layout" | "component" | "state" | "typography" | "data_display" | "safety";
  signal: string;
  evidence: string;
  implication: string;
  confidence: "high" | "medium" | "low";
}

export interface VisualEvidenceExtraction {
  source_id: string;
  source_label: string;
  source_type: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  density: "dense" | "medium" | "spacious" | "unknown";
  navigation_patterns: string[];
  layout_patterns: string[];
  component_candidates: string[];
  interaction_states: string[];
  visual_signals: VisualEvidenceSignal[];
  safety_constraints: string[];
  evidence_refs: string[];
}

export interface VisualEvidenceReport {
  extraction_version: string;
  source_count: number;
  sources: VisualEvidenceExtraction[];
  aggregate: {
    density_profile: string;
    navigation_patterns: string[];
    layout_patterns: string[];
    component_candidates: string[];
    interaction_states: string[];
    safety_constraints: string[];
    build_implications: string[];
  };
}

export interface SafetyFinding {
  id: string;
  source_id: string;
  severity: "blocker" | "major" | "minor" | "advisory";
  category: "secret" | "pii" | "prompt_injection" | "regulated_data";
  finding: string;
  recommendation: string;
}

export interface IngestionArtifacts {
  normalizedSources: NormalizedSource[];
  visualEvidence: VisualEvidenceReport;
  safetyFindings: SafetyFinding[];
  sourceAnalysisReport: Record<string, unknown>;
  visualEvidenceReport: string;
  safetyReport: string;
}

export interface DomainProfile {
  domain: string;
  productType: string;
  category: string;
  entities: string[];
  workflows: string[];
  routes: RouteSpec[];
  patterns: string[];
  riskFlags: string[];
  visualDirection: string;
}

export interface RouteSpec {
  route: string;
  screen_id: string;
  layout: string;
  nav_label: string | null;
  nav_group: string;
  priority: "primary" | "secondary" | "utility";
  auth_requirement: string;
  role_requirement: string[];
  parent_route?: string | null;
  deep_linking: boolean;
  evidence_refs: string[];
}

export interface ScreenSpec {
  screen_id: string;
  route: string;
  name: string;
  priority: "P0" | "P1" | "P2";
  purpose: string;
  primary_user_goal: string;
  business_goal: string;
  evidence_refs: string[];
  layout: Record<string, unknown>;
  sections: Record<string, unknown>[];
  required_components: string[];
  required_patterns: string[];
  data_needs: string[];
  actions: Record<string, unknown>[];
  states: Record<string, unknown>;
  interactions: Record<string, unknown>[];
  responsive_behavior: Record<string, unknown>;
  accessibility: Record<string, unknown>;
  content_rules: string[];
  acceptance_criteria: AcceptanceCriterion[];
  forbidden_inventions: string[];
}

export interface UXFlowStateCompleteness {
  required_state_keys: string[];
  contextual_state_keys: string[];
  screen_coverage: Array<{
    screen_id: string;
    route: string;
    priority: ScreenSpec["priority"];
    covered_states: string[];
    missing_required_states: string[];
    recovery_states_with_actions: string[];
    missing_recovery_actions: string[];
    action_count: number;
    acceptance_count: number;
    status: "pass" | "fail";
  }>;
  flow_coverage: Array<{
    flow_id: string;
    name: string;
    route_refs: string[];
    screen_refs: string[];
    required_states_covered: string[];
    missing_required_states: string[];
    has_entry_route: boolean;
    has_action_step: boolean;
    has_recovery_step: boolean;
    status: "pass" | "fail";
  }>;
  state_transition_contracts: Array<{
    screen_id: string;
    transitions: Array<{
      from: string;
      on: string;
      to: string;
      feedback: string;
      recovery_action?: string;
    }>;
  }>;
  summary: {
    screen_count: number;
    complete_screens: number;
    incomplete_screens: number;
    flow_count: number;
    complete_flows: number;
    incomplete_flows: number;
  };
  blockers: string[];
  warnings: string[];
  evidence_refs: string[];
}

export interface AcceptanceCriterion {
  id: string;
  subject: string;
  condition: string;
  expected_behavior: string;
  verification_method: "human_review" | "automated_test" | "accessibility_check" | "schema_check";
  evidence_refs: string[];
}

export interface ProductArtifacts {
  productModel: Record<string, unknown>;
  userModel: Record<string, unknown>;
  jobsToBeDone: string;
  roleModel: Record<string, unknown>;
  permissionMatrix: Record<string, unknown>;
  entityModel: Record<string, unknown>;
  entityLifecycle: Record<string, unknown>;
}

export interface ExperienceArtifacts {
  userJourneys: string;
  flowSpecs: Record<string, unknown>;
  informationArchitecture: Record<string, unknown>;
  routeMap: { routes: RouteSpec[] };
  screenInventory: Record<string, unknown>;
  navigationModel: Record<string, unknown>;
  stateModels: Record<string, unknown>;
  screenStateMatrix: Record<string, unknown>;
  uxFlowStateCompleteness: UXFlowStateCompleteness;
  uxFlowStateCompletenessReport: string;
  actionTaxonomy: Record<string, unknown>;
  screenSpecs: ScreenSpec[];
}

export interface DesignSystemArtifacts {
  designPrinciples: string;
  visualDirection: string;
  contentRules: string;
  primitiveTokens: Record<string, unknown>;
  semanticTokens: Record<string, unknown>;
  componentTokens: Record<string, unknown>;
  tokenContracts: Record<string, unknown>;
  typographySystem: Record<string, unknown>;
  themeLight: Record<string, unknown>;
  cssVariables: string;
  typographyCss: string;
  tailwindConfig: string;
  componentContracts: Record<string, unknown>;
  componentContractsReport: string;
  componentRegistry: Record<string, unknown>;
  componentSpecs: string;
  componentApiContract: string;
  patternContracts: Record<string, unknown>;
  patternContractsReport: string;
  patternRegistry: Record<string, unknown>;
  patternSpecs: string;
  patternLifecycle: string;
  accessibilityRules: Record<string, unknown>;
  accessibilityGuidelines: string;
  foundations: string;
  usageGuidelines: string;
  antiPatterns: string;
  migrationNotes: string;
}

export interface FrontendContractArtifacts {
  buildManifest: Record<string, unknown>;
  componentUsageMap: Record<string, unknown>;
  layoutRules: Record<string, unknown>;
  responsiveRules: Record<string, unknown>;
  interactionRules: Record<string, unknown>;
  formRules: Record<string, unknown>;
  dataContracts: Record<string, unknown>;
  dataOperationContracts: Record<string, unknown>;
  actionContracts: Record<string, unknown>;
  formContracts: Record<string, unknown>;
  verificationContracts: Record<string, unknown>;
  verificationPlan: string;
  productionIntegrationContracts: Record<string, unknown>;
  productionIntegrationPlan: string;
  routingContract: Record<string, unknown>;
  acceptanceCriteria: Record<string, unknown>;
  fixtureData: Record<string, unknown>;
  frontendAgentInstructions: string;
}

export type DSAGNodeType =
  | "ProductGoal"
  | "BusinessGoal"
  | "UserType"
  | "UserJob"
  | "Role"
  | "Permission"
  | "Entity"
  | "EntityState"
  | "Workflow"
  | "FlowStep"
  | "Route"
  | "Screen"
  | "ScreenSection"
  | "State"
  | "Interaction"
  | "Pattern"
  | "Component"
  | "ComponentVariant"
  | "Token"
  | "DataContract"
  | "ContentRule"
  | "AccessibilityRequirement"
  | "QualityGate"
  | "Decision"
  | "EvidenceSource";

export type DSAGEdgeType =
  | "supports"
  | "requires"
  | "appears_on"
  | "composed_of"
  | "implemented_by"
  | "styled_by"
  | "constrained_by"
  | "derived_from"
  | "validated_by"
  | "blocked_by"
  | "replaces"
  | "alternative_to"
  | "owned_by"
  | "permitted_by";

export interface DSAGNode {
  id: string;
  type: DSAGNodeType;
  label: string;
  evidence_refs: string[];
  metadata?: Record<string, unknown>;
}

export interface DSAGEdge {
  from: string;
  to: string;
  type: DSAGEdgeType;
  evidence_refs: string[];
}

export interface DSAGIntegrityReport {
  status: "pass" | "warning" | "fail";
  checks: Array<{
    id: string;
    status: "pass" | "warning" | "fail";
    details: string;
  }>;
  blockers: string[];
  warnings: string[];
}

export interface DSAGGraph {
  graph_version: string;
  nodes: DSAGNode[];
  edges: DSAGEdge[];
  integrity: DSAGIntegrityReport;
}

export interface SchemaArtifacts {
  schemaVersion: string;
  schemas: Record<string, Record<string, unknown>>;
  index: Array<{
    artifact: string;
    schema_file: string;
    description: string;
  }>;
}

export interface LLMDecisionArtifacts {
  providerPolicy: Record<string, unknown>;
  promptPackIndex: Record<string, unknown>;
  structuredOutputPolicy: string;
  repairPolicy: string;
  promptInjectionPolicy: string;
  moduleContracts: Record<string, unknown>;
}

export interface ReferenceSurfaceArtifacts {
  dashboard: string;
  table: string;
  form: string;
  mobile: string;
  chart: string;
}

export interface RevisionArtifacts {
  revisionProtocol: string;
  artifactDependencyGraph: Record<string, unknown>;
  invalidationRules: Record<string, unknown>;
  initialChangeSet: Record<string, unknown>;
  approvalGates: Record<string, unknown>;
  decisionDiffPolicy: string;
  artifactInvalidationReport: string;
}

export interface FrontendBuildSimulationArtifacts {
  status: "pass" | "warning" | "fail";
  blockers: string[];
  warnings: string[];
  buildPlan: Record<string, unknown>;
  routeSimulation: Record<string, unknown>;
  componentResolution: Record<string, unknown>;
  patternResolution: Record<string, unknown>;
  stateCoverage: Record<string, unknown>;
  dataContractCoverage: Record<string, unknown>;
  acceptanceSimulation: Record<string, unknown>;
  simulationReport: string;
}

export interface TargetFrontendArtifacts {
  sourceFileManifest: Record<string, unknown>;
  routeComponentMap: Record<string, unknown>;
  codegenTasks: Record<string, unknown>;
  adapterInterfaceSource: string;
  sourceGenerationRunbook: string;
}

export interface E2EScenarioArtifacts {
  scenarioCatalog: Record<string, unknown>;
  scenarioResults: Record<string, unknown>;
  findingsReport: string;
}

export interface ValidationReport {
  status: "pass" | "warning" | "fail";
  checks: Array<{
    id: string;
    status: "pass" | "warning" | "fail";
    details: string;
  }>;
  blockers: string[];
  warnings: string[];
}

export interface ReadinessReport {
  score: number;
  readyForFrontendAgent: boolean;
  dimensions: Record<string, number>;
  blockers: string[];
  warnings: string[];
  requiredHumanReview: string[];
}

export interface QualityArtifacts {
  validation: ValidationReport;
  readiness: ReadinessReport;
  dsagIntegrityReport: string;
  consistencyReport: string;
  accessibilityReport: string;
  screenCoverageReport: string;
  componentCoverageReport: string;
  implementationReadinessReport: string;
  unresolvedDecisions: string;
  exportReadinessChecklist: string;
  specCoverageAudit: Record<string, unknown>;
  specCoverageReport: string;
}

export interface Manifest {
  package_id: string;
  project_slug: string;
  spec_version: string;
  schema_version: string;
  source_hash: string;
  generated_at: string;
  operating_mode: OperatingMode;
  export_target: string;
  readiness_score: number;
  ready_for_frontend_agent: boolean;
  blockers: string[];
  warnings: string[];
  artifact_index: string[];
}

export interface ArchetypePackage {
  manifest: Manifest;
  ingestion: IngestionArtifacts;
  evidence: EvidenceLedger;
  product: ProductArtifacts;
  experience: ExperienceArtifacts;
  designSystem: DesignSystemArtifacts;
  frontendContract: FrontendContractArtifacts;
  dsag: DSAGGraph;
  schemas: SchemaArtifacts;
  llm: LLMDecisionArtifacts;
  referenceSurfaces: ReferenceSurfaceArtifacts;
  revision: RevisionArtifacts;
  buildSimulation: FrontendBuildSimulationArtifacts;
  targetFrontend: TargetFrontendArtifacts;
  e2e: E2EScenarioArtifacts;
  quality: QualityArtifacts;
}
