export type AgentControlPlaneStatus = "pass" | "blocked" | "fail";
export type AgentControlPlaneGateStatus = "pass" | "blocked" | "fail" | "not_applicable";
export type AgentControlPlaneSeverity = "P0" | "P1" | "P2";

export interface AgentControlPlaneGate {
  id: string;
  name: string;
  phase:
    | "intake"
    | "clarification"
    | "draft"
    | "approval"
    | "canonical"
    | "test_first"
    | "implementation"
    | "verification"
    | "qa"
    | "repair";
  severity: AgentControlPlaneSeverity;
  status: AgentControlPlaneGateStatus;
  requirement: string;
  evidence_refs: string[];
  blockers: string[];
  warnings: string[];
  next_action: string;
}

export interface AgentControlPlaneRouteProposal {
  route: string;
  screen_id: string;
  nav_label: string | null;
  source: "user_or_material_confirmed" | "approved_candidate" | "candidate_inference";
  approval_state: "approved" | "candidate_until_approval";
  evidence_refs: string[];
}

export interface AgentControlPlaneSpecialistGate {
  role: string;
  required: boolean;
  authority: string;
  blocks_when_missing: boolean;
  output_artifact: string;
}

export interface AgentControlPlaneReport {
  artifact_version: "1.0";
  source_scope: "agent-control-plane";
  status: AgentControlPlaneStatus;
  package_type: "clarification" | "draft_contract" | "canonical_contract";
  lifecycle_authority: {
    rule: string;
    source_of_truth: string[];
    data_plane_required: boolean;
    host_agent_may_override: false;
  };
  context: {
    context_status: string;
    readiness_tier: string;
    implementation_authorized: boolean;
    material_intake_status: "confirmed" | "missing";
    one_question_clarification: boolean;
  };
  gates: AgentControlPlaneGate[];
  route_proposals: AgentControlPlaneRouteProposal[];
  specialist_gates: AgentControlPlaneSpecialistGate[];
  required_handoff_order: string[];
  blockers: string[];
  warnings: string[];
}
