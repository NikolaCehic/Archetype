import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  AgentContextPackage,
  AgentContextPhaseBundle,
  AgentContextPhaseId,
  AgentContextSummary
} from "../agent-context/phaseBundles";
import { AGENT_CONTEXT_DEFAULT_MAX_ARTIFACT_BYTES, agentContextBundlePath } from "../agent-context/phaseBundles";
import type { AgentControlPlaneReport } from "../control-plane";
import type { ConsumerPlaneNextAction, ConsumerPlanePackageType, ConsumerPlaneReport, ConsumerPlaneUserAction } from "./types";

const PHASE_PRIORITY: AgentContextPhaseId[] = [
  "clarification",
  "draft_review",
  "contract_approval",
  "test_first",
  "implementation",
  "verification",
  "qa",
  "repair"
];

function currentBundle(agentContext: AgentContextPackage): AgentContextPhaseBundle {
  return PHASE_PRIORITY
    .map((phaseId) => agentContext.bundles.find((bundle) => bundle.phase_id === phaseId))
    .find((bundle): bundle is AgentContextPhaseBundle => bundle?.status === "available")
    ?? agentContext.bundles[0];
}

function packageType(summary: AgentContextSummary): ConsumerPlanePackageType {
  return summary.package_type === "canonical" ? "canonical" : summary.package_type;
}

function forbiddenReads(type: ConsumerPlanePackageType): string[] {
  if (type === "clarification") {
    return [
      "Do not read or invent spec/* because the canonical spec does not exist yet.",
      "Do not read test-first/*, verification/*, qa/*, or implementation-contract.md.",
      "Do not scan the entire archetype-output tree."
    ];
  }
  if (type === "draft_contract") {
    return [
      "Do not read or invent spec/* because the draft is not approved.",
      "Do not read test-first/*, verification/*, qa/*, or implementation-contract.md.",
      "Do not scan the entire archetype-output tree."
    ];
  }
  return [
    "Do not read all generated artifacts before the current phase requires them.",
    "Do not read draft internals unless checking approval lineage or revising the contract.",
    "Do not scan the entire archetype-output tree."
  ];
}

function phaseUserMessage(input: {
  summary: AgentContextSummary;
  bundle: AgentContextPhaseBundle;
  questionId?: string | null;
  question?: string | null;
}): string {
  if (input.bundle.phase_id === "clarification") {
    return input.question
      ? input.question
      : "I need one more implementation-critical detail before I can safely draft the product contract.";
  }
  if (input.bundle.phase_id === "draft_review" || input.bundle.phase_id === "contract_approval") {
    return "I have a draft contract and browser-viewable design-system preview ready. Review the preview and approval request, then approve it or ask for specific edits.";
  }
  if (input.bundle.phase_id === "test_first") {
    return "The contract is approved. I will write the declared tests first, preserve the red result, then implement against the contract.";
  }
  if (input.bundle.phase_id === "implementation") {
    return "The implementation phase is active. I will use only the current phase bundle and approved contract reads before writing code.";
  }
  if (input.bundle.phase_id === "verification") {
    return "The target frontend needs Playwright-backed verification against the generated contract.";
  }
  if (input.bundle.phase_id === "qa") {
    return "QA evidence needs scenario, malformed-data, accessibility, visual, and contract-drift review.";
  }
  return "Repair is active. I will patch implementation drift first and only revise the contract when approved evidence proves the contract is wrong.";
}

function nextAction(input: {
  summary: AgentContextSummary;
  bundle: AgentContextPhaseBundle;
  questionId?: string | null;
  question?: string | null;
}): ConsumerPlaneNextAction {
  const userMessage = phaseUserMessage(input);
  const clarificationActions: ConsumerPlaneUserAction[] = [
    {
      id: "answer_clarification",
      label: "Answer this one question",
      host_tool: "archetype_run_lifecycle",
      requires_feedback: true,
      result: "The answer is recorded and Archetype either asks the next question or advances to draft review."
    }
  ];
  const reviewActions: ConsumerPlaneUserAction[] = [
    {
      id: "approve",
      label: "Approve draft",
      host_tool: "archetype_submit_review",
      requires_feedback: false,
      result: "A bound approval proof is written and canonical/test-first artifacts may be generated."
    },
    {
      id: "request_changes",
      label: "Request changes",
      host_tool: "archetype_submit_review",
      requires_feedback: true,
      result: "Feedback is recorded as source evidence and a revised draft is generated. Canonical artifacts stay blocked."
    },
    {
      id: "reject",
      label: "Reject draft",
      host_tool: "archetype_submit_review",
      requires_feedback: false,
      result: "Implementation remains blocked until a new intake or revision is provided."
    }
  ];
  if (input.bundle.phase_id === "clarification") {
    return {
      type: "ask_one_question",
      phase_id: input.bundle.phase_id,
      user_message: userMessage,
      internal_tool: "archetype_run_lifecycle",
      internal_tool_purpose: "Apply the user's single answer and regenerate the next lifecycle state.",
      allowed_user_actions: clarificationActions,
      requires_user_response: true,
      question_id: input.questionId ?? null,
      question: input.question ?? null
    };
  }
  if (input.bundle.phase_id === "draft_review" || input.bundle.phase_id === "contract_approval") {
    return {
      type: "present_draft_review",
      phase_id: input.bundle.phase_id,
      user_message: userMessage,
      internal_tool: "archetype_submit_review",
      internal_tool_purpose: "Record approve, request_changes, or reject as a deterministic review decision.",
      allowed_user_actions: reviewActions,
      requires_user_response: true,
      question_id: null,
      question: "Approve this draft contract, or tell Archetype exactly what to change?"
    };
  }
  if (input.bundle.phase_id === "test_first") {
    return {
      type: "start_tests_first",
      phase_id: input.bundle.phase_id,
      user_message: userMessage,
      internal_tool: "archetype_summarize_package",
      internal_tool_purpose: "Read the compact test-first phase bundle before authoring tests.",
      allowed_user_actions: [
        {
          id: "start_tests_first",
          label: "Start tests first",
          host_tool: "archetype_summarize_package",
          requires_feedback: false,
          result: "The agent reads the test-first bundle and writes red tests before implementation."
        }
      ],
      requires_user_response: false,
      question_id: null,
      question: null
    };
  }
  return {
    type: input.summary.ready_for_frontend_agent ? "continue_current_phase" : "blocked",
    phase_id: input.bundle.phase_id,
    user_message: userMessage,
    internal_tool: "archetype_summarize_package",
    internal_tool_purpose: "Read only the compact current phase bundle and declared required artifacts.",
    allowed_user_actions: [
      {
        id: "continue_phase",
        label: "Continue current phase",
        host_tool: "archetype_summarize_package",
        requires_feedback: false,
        result: "The agent continues only through the current phase bundle and control-plane gates."
      }
    ],
    requires_user_response: false,
    question_id: null,
    question: null
  };
}

function controlSummary(controlPlane?: AgentControlPlaneReport): ConsumerPlaneReport["control_plane"] {
  if (!controlPlane) {
    return {
      path: null,
      status: "not_available",
      blocked_or_failed_gates: []
    };
  }
  return {
    path: "governance/agent-control-plane.json",
    status: controlPlane.status,
    blocked_or_failed_gates: controlPlane.gates
      .filter((gate) => gate.status === "blocked" || gate.status === "fail")
      .map((gate) => `${gate.id}: ${gate.name}`)
  };
}

function reviewSurfaces(type: ConsumerPlanePackageType, bundle: AgentContextPhaseBundle): string[] {
  if (type === "clarification") return ["lifecycle/clarification-turn.json", "lifecycle/context-matrix.json"];
  if (type === "draft_contract") return ["draft/design-system-preview.html", "draft/design-directions.json", "draft/design-quality-gate.json", "draft/contract-approval-request.json", "governance/agent-control-plane.json"];
  if (bundle.phase_id === "test_first") return ["test-first/test-first-contract.json", "test-first/test-quality-standard.json", "test-results/initial-red-test-run.md"];
  return bundle.required_reads.map((read) => read.path);
}

export function buildConsumerPlane(input: {
  agentContext: AgentContextPackage;
  controlPlane?: AgentControlPlaneReport;
  questionId?: string | null;
  question?: string | null;
}): ConsumerPlaneReport {
  const bundle = currentBundle(input.agentContext);
  const type = packageType(input.agentContext.summary);
  const action = nextAction({
    summary: input.agentContext.summary,
    bundle,
    questionId: input.questionId,
    question: input.question
  });
  const requiredPaths = bundle.required_reads.map((read) => read.path);
  const optionalPaths = bundle.optional_reads.map((read) => read.path);
  const currentPhaseBundlePath = agentContextBundlePath(bundle.phase_id);
  const firstReads = [
    "agent-context/consumer-plane.json",
    "agent-context/context-summary.json",
    "agent-context/phase-bundles/index.json",
    bundle.status === "available" ? currentPhaseBundlePath : bundle.blocked_reason ? "agent-context/phase-bundles/index.json" : "",
    input.controlPlane ? "governance/agent-control-plane.json" : ""
  ].filter(Boolean);
  return {
    artifact_version: "1.0",
    source_scope: "consumer-plane",
    package_type: type,
    front_doors: {
      codex: "$archetype",
      claude_code: "/archetype",
      cli: "archetype run",
      mcp: "archetype_run_lifecycle"
    },
    contract: {
      natural_language_only_for_user: true,
      user_never_runs_internal_commands: true,
      ask_one_question_at_a_time: true,
      agent_may_use_tools: true,
      no_webapp_required: true
    },
    current_phase: {
      phase_id: bundle.phase_id,
      status: bundle.status,
      path: currentPhaseBundlePath
    },
    next_action: action,
    read_plan: {
      start_here: "agent-context/consumer-plane.json",
      first_reads: firstReads,
      current_phase_bundle: currentPhaseBundlePath,
      allowed_full_artifacts_now: requiredPaths,
      defer_until_needed: optionalPaths,
      forbidden_reads_now: forbiddenReads(type),
      max_full_artifact_reads_before_user_response: action.requires_user_response ? Math.min(requiredPaths.length, 3) : Math.min(requiredPaths.length, 6)
    },
    token_budget: {
      default_max_artifact_bytes: AGENT_CONTEXT_DEFAULT_MAX_ARTIFACT_BYTES,
      max_first_read_files: 5,
      max_required_phase_reads: 6,
      broad_read_policy: "forbidden",
      reason: "Consumer plane keeps $archetype and /archetype conversational by exposing only the next legal action and phase-bounded reads."
    },
    progressive_delivery: {
      rule: "Small human decision first. Large machine contract only when the current phase requires it.",
      before_approval: [
        "Ask one clarification question at a time.",
        "Show the draft preview and approval request before canonical/test artifacts.",
        "Do not ask implementation agents to read canonical files before approval."
      ],
      after_approval: [
        "Start with test-first bundle.",
        "Read implementation artifacts only after tests are authored.",
        "Read QA and repair artifacts only during verification/repair phases."
      ]
    },
    control_plane: controlSummary(input.controlPlane),
    user_experience: {
      say_this_now: action.user_message,
      do_not_say: [
        "Do not ask the user to run CLI commands.",
        "Do not list internal artifact trees unless the user asks.",
        "Do not ask grouped clarification forms.",
        "Do not end with instructions for what to tell Codex or Claude Code next."
      ],
      review_surfaces: reviewSurfaces(type, bundle)
    }
  };
}

export function consumerPlaneMarkdown(report: ConsumerPlaneReport): string {
  return [
    "# Archetype Consumer Plane",
    "",
    `Package type: ${report.package_type}`,
    `Current phase: ${report.current_phase.phase_id} (${report.current_phase.status})`,
    `Next action: ${report.next_action.type}`,
    "",
    "## Say This Now",
    "",
    report.user_experience.say_this_now,
    "",
    "## Read Plan",
    "",
    ...report.read_plan.first_reads.map((item) => `- ${item}`),
    "",
    "## Allowed Full Artifacts Now",
    "",
    ...(report.read_plan.allowed_full_artifacts_now.length > 0
      ? report.read_plan.allowed_full_artifacts_now.map((item) => `- ${item}`)
      : ["- None."]),
    "",
    "## Do Not Say",
    "",
    ...report.user_experience.do_not_say.map((item) => `- ${item}`)
  ].join("\n");
}

export function readConsumerPlane(outputDir: string): ConsumerPlaneReport {
  return JSON.parse(readFileSync(path.join(outputDir, "agent-context", "consumer-plane.json"), "utf8")) as ConsumerPlaneReport;
}
