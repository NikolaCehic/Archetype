import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "agent-task-board-regression-contract");
const directInputPath = path.join(workspace, "agent-task-board.intake.json");
const directOutputDir = path.join(workspace, "direct-output");
const reviewInputPath = path.join(workspace, "review-feedback.intake.json");
const reviewOutputDir = path.join(workspace, "review-output");
const longUserInputPath = path.join(workspace, "long-user-answer.intake.json");
const longUserOutputPath = path.join(workspace, "long-user-answer.updated.json");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args) {
  return execFileSync("node", ["dist/cli.js", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function runJson(args) {
  return JSON.parse(run([...args, "--json"]));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function routeText(outDir) {
  const draft = readJson(path.join(outDir, "draft", "experience-architecture.draft.json"));
  return draft.routes.map((route) => [route.route, route.screen_id, route.nav_label, route.nav_group].filter(Boolean).join(" ")).join(" ").toLowerCase();
}

function assertAgentTaskBoardRoutes(outDir, label) {
  const text = routeText(outDir);
  for (const required of ["agent", "task", "handoff", "log", "artifact"]) {
    assert(text.includes(required), `${label}: route proposals must include ${required}.`);
  }
  for (const forbidden of ["campaign", "billing", "workspace", "report builder", "onboarding"]) {
    assert(!text.includes(forbidden), `${label}: route proposals must not include generic SaaS ${forbidden}.`);
  }
  const gate = readJson(path.join(outDir, "draft", "design-quality-gate.json"));
  assert(gate.status === "pass", `${label}: design quality gate must pass for source-aligned routes.`);
  const routeAlignment = gate.checks.find((check) => check.id === "DQ-10");
  assert(routeAlignment?.status === "pass", `${label}: DQ-10 must pass route/source alignment.`);
  const controlPlane = readJson(path.join(outDir, "governance", "agent-control-plane.json"));
  assert(controlPlane.status === "blocked", `${label}: draft must still block implementation until approval.`);
}

const agentTaskBoardContext = [
  "Build a test frontend for an Agent Task Board used in a multi-subagent orchestration platform.",
  "Proceed without external source materials; use this brief as the source of truth.",
  "The app should show each agent as a swimlane with its own tasks, task statuses, dependencies, handoffs, logs, and artifacts, so a user can quickly understand what every subagent is doing and where orchestration is blocked.",
  "Design it like a lightweight Kanban/control-room UI: board overview, task detail drawer, create-task modal, and mobile-friendly agent lane view."
].join(" ");

const completeAgentTaskBoardInput = {
  projectName: "Agent Task Board",
  context: agentTaskBoardContext,
  goals: [
    "Show agent swimlanes with tasks, statuses, dependencies, handoffs, logs, and artifacts.",
    "Support board overview, task detail drawer, create-task modal, and mobile agent lane view.",
    "Make blocked orchestration states visible and actionable."
  ],
  users: [
    "Orchestrator / Workflow Operator",
    "Developer / Platform Engineer",
    "Product / Project Owner",
    "Agent Supervisor / Human-in-the-Loop Reviewer",
    "Admin / System Configurator"
  ],
  stack: {
    framework: "React",
    language: "TypeScript",
    styling: "CSS modules or plain CSS",
    routing: "React Router or target app router"
  },
  dataBoundary: {
    mode: "mock",
    dataSource: "Local deterministic fixtures for agents, tasks, dependencies, handoffs, logs, and artifacts.",
    auth: "No live auth. Role-aware affordances are simulated.",
    permissions: "Role/permission behavior is represented visually only.",
    notes: "No live agents, APIs, secrets, credentials, or real user data."
  },
  testExecution: {
    playwrightAllowed: true,
    commandsAllowed: true,
    testTypes: ["smoke", "e2e", "ui", "integration", "unit", "accessibility"],
    notes: "Use tests-first and Playwright verification."
  },
  materialIntake: {
    status: "none",
    requestedTypes: ["SPEC", "SOP", "PRD", "screenshots", "wireframes", "design_docs", "api_docs", "route_maps", "repo_files"],
    respondedBy: "agent-task-board-regression",
    notes: "Proceed without additional source materials."
  },
  assumptionApproval: {
    approvedForDraft: true,
    approvedBy: "agent-task-board-regression",
    notes: "Propose candidate assumptions from the brief and keep them non-canonical until approval."
  },
  safetyConstraints: [
    "Use local mock data only.",
    "Do not connect to live agents, production APIs, secrets, credentials, or real user data.",
    "Risky actions and approvals are simulated UI states only."
  ],
  operatingMode: "full_architecture"
};

writeFileSync(directInputPath, `${JSON.stringify(completeAgentTaskBoardInput, null, 2)}\n`);
const directGenerate = runJson(["generate", "--input", directInputPath, "--out", directOutputDir, "--force"]);
assert(directGenerate.packageType === "draft_contract", "complete Agent Task Board intake must produce a draft contract.");
assertAgentTaskBoardRoutes(directOutputDir, "direct");
const sourceMaterials = readJson(path.join(directOutputDir, "attachments", "source-materials.json"));
assert(sourceMaterials.material_intake_status === "none", "direct: source-material UX must preserve explicit no-materials decision.");
assert(sourceMaterials.materials.length === 0, "direct: source-material UX must not count user context or test permission as attached materials.");
assert(sourceMaterials.source_evidence.length > 0, "direct: source-material UX should expose non-material source evidence separately.");

const reviewFeedback = "The draft is misaligned with the user brief. Remove generic SaaS analytics/dashboard assumptions, campaign/report/billing/workspace/onboarding routes, and financial entity models. The product is an Agent Task Board for multi-subagent orchestration. Candidate routes/screens should be: /board overview with agent swimlanes; task detail drawer opened from a task card; create-task modal launched from the board; mobile agent lane view responsive at narrow widths. Core entities should be Agent, Task, Dependency, Handoff, LogEntry, Artifact, Blocker, Permission, ReviewDecision, and OrchestrationRun. The UI must show each agent swimlane with own tasks, statuses, dependencies, handoffs, logs, artifacts, and clear blocked-state detection. Use local mock data only, no live auth/API. Design direction should be lightweight Kanban/control-room, dense and scan-friendly, not generic SaaS.";
writeFileSync(reviewInputPath, `${JSON.stringify({
  ...completeAgentTaskBoardInput,
  projectName: "Misaligned Draft Repair",
  context: "I am building a B2B SaaS analytics dashboard for marketing teams. It needs onboarding, workspace selection, campaign overview, report builder, billing, and settings.",
  materials: [
    {
      id: "review-feedback-agent-task-board",
      label: "Human review change request",
      type: "document",
      content: reviewFeedback,
      notes: "Captured from Archetype Review Console decision flow."
    }
  ],
  materialIntake: {
    ...completeAgentTaskBoardInput.materialIntake,
    status: "provided",
    notes: "Human review requested route and domain changes before approval."
  }
}, null, 2)}\n`);
const reviewGenerate = runJson(["generate", "--input", reviewInputPath, "--out", reviewOutputDir, "--force"]);
assert(reviewGenerate.packageType === "draft_contract", "review-feedback intake must produce a revised draft contract.");
assertAgentTaskBoardRoutes(reviewOutputDir, "review-feedback");

writeFileSync(longUserInputPath, `${JSON.stringify({
  projectName: "Long User Answer",
  context: "Build an agent task board.",
  operatingMode: "full_architecture"
}, null, 2)}\n`);
const longAnswer = "Primary users/roles: Orchestrator / Workflow Operator monitors all agents, assigns tasks, watches progress, resolves blocked tasks, and manages handoffs between agents. Developer / Platform Engineer debugs agent behavior, inspects logs, traces task execution, reviews artifacts, and diagnoses failures or stalls. Product / Project Owner sees high-level task progress, throughput, blockers, and whether the workflow is moving toward completion. Agent Supervisor / Human-in-the-Loop Reviewer reviews outputs, approves risky actions, corrects mistakes, and intervenes when judgment is needed. Admin / System Configurator manages agent definitions, permissions, tools, routing rules, and orchestration settings.";
runJson(["answer-clarification", "--input", longUserInputPath, "--out", longUserOutputPath, "--question-id", "primary_users", "--answer", longAnswer, "--answered-by", "agent-task-board-regression"]);
const longUserUpdated = readJson(longUserOutputPath);
assert(longUserUpdated.users.length >= 4, "long user answer should preserve role-level entries.");
for (const badFragment of ["assigns tasks", "watches progress", "permissions", "tools", "routing rules"]) {
  assert(!longUserUpdated.users.includes(badFragment), `long user answer must not split role descriptions into fragment: ${badFragment}.`);
}

const summary = {
  status: "pass",
  directOutputDir,
  reviewOutputDir,
  directRoutes: routeText(directOutputDir),
  reviewRoutes: routeText(reviewOutputDir),
  parsedUsers: longUserUpdated.users.length
};
writeFileSync(path.join(workspace, "agent-task-board-regression-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
