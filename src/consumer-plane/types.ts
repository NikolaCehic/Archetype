import type { AgentContextPhaseId, AgentContextPhaseStatus } from "../agent-context/phaseBundles";
import type { AgentControlPlaneReport } from "../control-plane";

export type ConsumerPlanePackageType = "clarification" | "draft_contract" | "canonical";
export type ConsumerPlaneNextActionType =
  | "ask_one_question"
  | "present_draft_review"
  | "start_tests_first"
  | "continue_current_phase"
  | "blocked";

export type ConsumerPlaneUserActionId =
  | "answer_clarification"
  | "approve"
  | "request_changes"
  | "reject"
  | "start_tests_first"
  | "continue_phase";

export interface ConsumerPlaneUserAction {
  id: ConsumerPlaneUserActionId;
  label: string;
  host_tool: string;
  requires_feedback: boolean;
  result: string;
}

export interface ConsumerPlaneReadPlan {
  start_here: "agent-context/consumer-plane.json";
  first_reads: string[];
  current_phase_bundle: string;
  allowed_full_artifacts_now: string[];
  defer_until_needed: string[];
  forbidden_reads_now: string[];
  max_full_artifact_reads_before_user_response: number;
}

export interface ConsumerPlaneTokenBudget {
  default_max_artifact_bytes: number;
  max_first_read_files: number;
  max_required_phase_reads: number;
  broad_read_policy: "forbidden";
  reason: string;
}

export interface ConsumerPlaneNextAction {
  type: ConsumerPlaneNextActionType;
  phase_id: AgentContextPhaseId;
  user_message: string;
  internal_tool: string;
  internal_tool_purpose: string;
  allowed_user_actions: ConsumerPlaneUserAction[];
  requires_user_response: boolean;
  question_id: string | null;
  question: string | null;
}

export interface ConsumerPlanePhaseRef {
  phase_id: AgentContextPhaseId;
  status: AgentContextPhaseStatus;
  path: string;
}

export interface ConsumerPlaneReport {
  artifact_version: "1.0";
  source_scope: "consumer-plane";
  package_type: ConsumerPlanePackageType;
  front_doors: {
    codex: "$archetype";
    claude_code: "/archetype";
    cli: "archetype run";
    mcp: "archetype_run_lifecycle";
  };
  contract: {
    natural_language_only_for_user: true;
    user_never_runs_internal_commands: true;
    ask_one_question_at_a_time: true;
    agent_may_use_tools: true;
    no_webapp_required: true;
  };
  current_phase: ConsumerPlanePhaseRef;
  next_action: ConsumerPlaneNextAction;
  read_plan: ConsumerPlaneReadPlan;
  token_budget: ConsumerPlaneTokenBudget;
  progressive_delivery: {
    rule: string;
    before_approval: string[];
    after_approval: string[];
  };
  control_plane: {
    path: string | null;
    status: AgentControlPlaneReport["status"] | "not_available";
    blocked_or_failed_gates: string[];
  };
  user_experience: {
    say_this_now: string;
    do_not_say: string[];
    review_surfaces: string[];
  };
}
