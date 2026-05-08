import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const suite = process.argv[2] ?? "full";
const dryRun = process.argv.includes("--dry-run");
const outDir = path.join(root, "tmp", "contract-suite");
const cacheDir = process.env.ARCHETYPE_TARGET_NPM_CACHE_DIR ?? path.join(root, ".cache", "archetype-target-npm");

const gib = 1024 * 1024 * 1024;
const budgets = {
  fast: { maxDurationMs: 4 * 60 * 1000, maxWorkspaceBytes: 2 * gib, maxContextTokens: 300000 },
  contracts: { maxDurationMs: 18 * 60 * 1000, maxWorkspaceBytes: 7 * gib, maxContextTokens: 300000 },
  release: { maxDurationMs: 12 * 60 * 1000, maxWorkspaceBytes: 5 * gib, maxContextTokens: 300000 },
  full: { maxDurationMs: 28 * 60 * 1000, maxWorkspaceBytes: 8 * gib, maxContextTokens: 300000 }
};

const tasks = [
  task("safety-approval", "scripts/run-safety-approval-contract.mjs", "tmp/safety-approval-contract", ["fast", "full"]),
  task("phase-safe", "scripts/run-phase-safe-compiler-contract.mjs", "tmp/phase-safe-compiler-contract", ["fast", "full"]),
  task("artifact-registry", "scripts/run-artifact-registry-contract.mjs", "tmp/artifact-registry-contract", ["fast", "full"]),
  task("data-plane-authority", "scripts/run-data-plane-authority-contract.mjs", "tmp/data-plane-authority-contract", ["fast", "full"]),
  task("token-context", "scripts/run-token-bounded-context-contract.mjs", "tmp/token-bounded-context-contract", ["fast", "full"]),
  task("release-discipline", "scripts/run-release-discipline-contract.mjs", "tmp/release-discipline-contract", ["fast", "full"]),
  task("natural-lifecycle", "scripts/run-natural-lifecycle-contract.mjs", "tmp/natural-lifecycle-contract", ["fast", "full"]),
  task("real-verification", "scripts/run-real-verification-contract.mjs", "tmp/real-verification-contract", ["contracts", "full"]),
  task("cli", "scripts/run-cli-contract.mjs", "tmp/cli-contract", ["contracts", "full"]),
  task("mcp", "scripts/run-mcp-contract.mjs", "tmp/mcp-contract", ["contracts", "full"]),
  task("data-plane", "scripts/run-data-plane-contract.mjs", "tmp/data-plane-contract", ["contracts", "full"]),
  task("plugin-claude", "scripts/run-claude-plugin-contract.mjs", null, ["release", "full"]),
  task("plugin-codex", "scripts/run-codex-plugin-contract.mjs", null, ["release", "full"]),
  task("distribution", "scripts/run-distribution-contract.mjs", null, ["release", "full"]),
  task("release", "scripts/run-release-readiness-contract.mjs", "tmp/release-readiness-contract", ["release", "full"]),
  task("plugin-install", "scripts/run-plugin-install-contract.mjs", "tmp/plugin-install-contract", ["release", "full"]),
  shellTask("repo-audit", ["node", "scripts/run-repository-audit.mjs"], null, ["fast", "full"]),
  task("lifecycle", "scripts/run-lifecycle-contract.mjs", "tmp/lifecycle-contract", ["fast", "full"]),
  task("non-negotiable", "scripts/run-non-negotiable-principles-contract.mjs", "tmp/non-negotiable-principles-contract", ["fast", "full"]),
  task("evidence-decision", "scripts/run-evidence-decision-model-contract.mjs", "tmp/evidence-decision-model-contract", ["fast", "full"]),
  task("context-readiness", "scripts/run-context-readiness-contract.mjs", "tmp/context-readiness-contract", ["fast", "full"]),
  task("clarification-ux", "scripts/run-clarification-ux-contract.mjs", "tmp/clarification-ux-contract", ["fast", "full"]),
  task("lifecycle-intake", "scripts/run-lifecycle-intake-states-contract.mjs", "tmp/lifecycle-intake-states-contract", ["fast", "full"]),
  task("lifecycle-contract", "scripts/run-lifecycle-contract-states-contract.mjs", "tmp/lifecycle-contract-states-contract", ["fast", "full"]),
  task("design-preview", "scripts/run-design-system-preview-contract.mjs", "tmp/design-system-preview-contract", ["fast", "full"]),
  task("lifecycle-execution", "scripts/run-lifecycle-execution-states-contract.mjs", "tmp/lifecycle-execution-states-contract", ["fast", "full"]),
  task("frontend-practices", "scripts/run-frontend-practice-skills-contract.mjs", "tmp/frontend-practice-skills-contract", ["fast", "full"]),
  task("agent-roles", "scripts/run-agent-role-files-contract.mjs", "tmp/agent-role-files-contract", ["fast", "full"]),
  task("qa-team", "scripts/run-qa-team-contract.mjs", "tmp/qa-team-contract", ["contracts", "full"]),
  task("test-quality", "scripts/run-test-quality-standard-contract.mjs", "tmp/test-quality-standard-contract", ["contracts", "full"]),
  task("required-artifacts", "scripts/run-required-package-artifacts-contract.mjs", "tmp/required-package-artifacts-contract", ["contracts", "full"]),
  task("forbidden-behaviors", "scripts/run-forbidden-behaviors-contract.mjs", "tmp/forbidden-behaviors-contract", ["contracts", "full"]),
  task("marketing-replay", "scripts/run-marketing-dashboard-replay-contract.mjs", "tmp/marketing-dashboard-replay-contract", ["fast", "full"]),
  task("implementation-phases", "scripts/run-implementation-phases-contract.mjs", "tmp/implementation-phases-contract", ["fast", "full"]),
  task("convergence", "scripts/run-convergence-standard-contract.mjs", "tmp/convergence-standard-contract", ["fast", "full"]),
  task("spec", "scripts/run-spec-contract.mjs", "tmp/spec-contract", ["fast", "full"]),
  task("test-first", "scripts/run-test-first-contract.mjs", "tmp/test-first-contract", ["fast", "full"]),
  task("playwright", "scripts/run-playwright-verification-contract.mjs", "tmp/playwright-contract", ["contracts", "full"]),
  task("repair", "scripts/run-repair-contract.mjs", "tmp/repair-contract", ["contracts", "full"]),
  task("install", "scripts/run-install-contract.mjs", "tmp/install-contract", ["release", "full"]),
  task("golden", "scripts/run-golden.mjs", "tmp/golden", ["release", "full"])
];

function task(id, script, workspace, suites) {
  return shellTask(id, ["node", script], workspace, suites);
}

function shellTask(id, command, workspace, suites) {
  return { id, command, workspace, suites };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function runCommand(id, command) {
  const started = Date.now();
  const result = spawnSync(command[0], command.slice(1), {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      NEXT_TELEMETRY_DISABLED: "1",
      ARCHETYPE_TARGET_NPM_CACHE_DIR: cacheDir
    }
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const status = result.status === 0 ? "pass" : "fail";
  return {
    id,
    command: command.join(" "),
    status,
    exit_code: typeof result.status === "number" ? result.status : 1,
    duration_ms: Date.now() - started
  };
}

function directorySize(targetPath) {
  if (!targetPath || !existsSync(targetPath)) return 0;
  const stats = statSync(targetPath);
  if (stats.isFile()) return stats.size;
  if (!stats.isDirectory()) return 0;
  return readdirSync(targetPath).reduce((total, entry) => total + directorySize(path.join(targetPath, entry)), 0);
}

function sourceContextBytes() {
  const roots = ["README.md", "docs", "agents", "skills", "plugins"];
  const allowed = /\.(md|json|txt|ts|js)$/u;
  const walk = (targetPath) => {
    if (!existsSync(targetPath)) return 0;
    const stats = statSync(targetPath);
    if (stats.isDirectory()) {
      return readdirSync(targetPath).reduce((total, entry) => total + walk(path.join(targetPath, entry)), 0);
    }
    return allowed.test(targetPath) ? stats.size : 0;
  };
  return roots.reduce((total, entry) => total + walk(path.join(root, entry)), 0);
}

function writeReports(report) {
  mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `${suite}-timings.json`);
  const mdPath = path.join(outDir, `${suite}-timings.md`);
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(mdPath, [
    `# Contract Suite Timing - ${suite}`,
    "",
    `Status: ${report.status}`,
    `Duration: ${report.duration_ms}ms`,
    `Target npm cache: \`${report.target_dependency_cache}\``,
    "",
    "## Budgets",
    "",
    `- Workspace bytes: ${report.budgets.workspace_bytes} / ${report.budgets.max_workspace_bytes}`,
    `- Context tokens: ${report.budgets.context_tokens} / ${report.budgets.max_context_tokens}`,
    `- Duration ms: ${report.duration_ms} / ${report.budgets.max_duration_ms}`,
    "",
    "## Contracts",
    "",
    ...report.tasks.map((item) => `- ${item.id}: ${item.status} in ${item.duration_ms}ms (${item.workspace_bytes} bytes)`)
  ].join("\n"));
}

const validSuites = new Set(["fast", "contracts", "release", "full"]);
if (!validSuites.has(suite)) fail(`Unknown contract suite: ${suite}. Use fast, contracts, release, or full.`);

const selected = tasks.filter((item) => item.suites.includes(suite));
if (dryRun) {
  console.log(JSON.stringify({
    suite,
    status: "plan",
    build_once: true,
    target_dependency_cache: cacheDir,
    tasks: selected.map((item) => ({ id: item.id, command: item.command.join(" "), workspace: item.workspace })),
    budgets: budgets[suite]
  }, null, 2));
  process.exit(0);
}

mkdirSync(cacheDir, { recursive: true });
const started = Date.now();
const build = runCommand("build", ["npm", "run", "build"]);
const results = [build];
if (build.status === "pass") {
  for (const item of selected) {
    const result = runCommand(item.id, item.command);
    results.push({
      ...result,
      workspace: item.workspace,
      workspace_bytes: directorySize(item.workspace ? path.join(root, item.workspace) : "")
    });
    if (result.status !== "pass") break;
  }
}

const workspaceBytes = results.reduce((total, item) => total + Number(item.workspace_bytes ?? 0), 0);
const contextBytes = sourceContextBytes();
const report = {
  report_version: "1.0",
  suite,
  status: results.every((item) => item.status === "pass") ? "pass" : "fail",
  generated_at: new Date().toISOString(),
  duration_ms: Date.now() - started,
  build_once: true,
  target_dependency_cache: cacheDir,
  tasks: results,
  budgets: {
    workspace_bytes: workspaceBytes,
    max_workspace_bytes: budgets[suite].maxWorkspaceBytes,
    context_tokens: Math.ceil(contextBytes / 4),
    max_context_tokens: budgets[suite].maxContextTokens,
    max_duration_ms: budgets[suite].maxDurationMs
  },
  proof_artifacts: [
    `tmp/contract-suite/${suite}-timings.json`,
    `tmp/contract-suite/${suite}-timings.md`
  ]
};

const budgetFailures = [
  ...(report.duration_ms > budgets[suite].maxDurationMs ? [`Duration exceeded budget: ${report.duration_ms}ms > ${budgets[suite].maxDurationMs}ms.`] : []),
  ...(workspaceBytes > budgets[suite].maxWorkspaceBytes ? [`Workspace disk exceeded budget: ${workspaceBytes} > ${budgets[suite].maxWorkspaceBytes} bytes.`] : []),
  ...(report.budgets.context_tokens > budgets[suite].maxContextTokens ? [`Context token estimate exceeded budget: ${report.budgets.context_tokens} > ${budgets[suite].maxContextTokens}.`] : [])
];
report.budget_failures = budgetFailures;
if (budgetFailures.length > 0) report.status = "fail";
writeReports(report);
console.log(JSON.stringify(report, null, 2));
if (report.status !== "pass") process.exit(1);
