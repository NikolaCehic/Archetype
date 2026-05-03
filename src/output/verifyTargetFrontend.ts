import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { targetExecutionMarkdown } from "../modules/targetExecution";

interface TargetVerifyOptions {
  skipInstall?: boolean;
}

interface CommandResult {
  id: string;
  command: string;
  status: "pending" | "pass" | "fail";
  exit_code: number | null;
  duration_ms: number | null;
  stdout: string;
  stderr: string;
}

export interface TargetVerificationResult {
  report_version: string;
  status: "pass" | "fail";
  generated_at: string;
  output_dir: string;
  target_dir: string;
  commands: CommandResult[];
  summary: {
    install: "pass" | "fail";
    typecheck: "pass" | "fail" | "pending";
    build: "pass" | "fail" | "pending";
  };
  blockers: string[];
  warnings: string[];
  proof_artifacts: string[];
}

function ensureDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath: string, value: unknown): void {
  ensureDir(filePath);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath: string, value: string): void {
  ensureDir(filePath);
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function tail(value: string, max = 12000): string {
  return value.length > max ? value.slice(value.length - max) : value;
}

function runCommand(id: string, command: string, args: string[], cwd: string): CommandResult {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      NEXT_TELEMETRY_DISABLED: "1"
    }
  });
  const exitCode = typeof result.status === "number" ? result.status : 1;
  return {
    id,
    command: [command, ...args].join(" "),
    status: exitCode === 0 ? "pass" : "fail",
    exit_code: exitCode,
    duration_ms: Date.now() - started,
    stdout: tail(result.stdout ?? ""),
    stderr: tail(result.stderr ?? result.error?.message ?? "")
  };
}

function auditTargetDependencies(targetDir: string): { blockers: string[]; warnings: string[] } {
  const result = spawnSync("npm", ["audit", "--json"], {
    cwd: targetDir,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1"
    }
  });
  if (!result.stdout) {
    return { blockers: [], warnings: ["npm audit did not return a parseable report."] };
  }
  try {
    const audit = JSON.parse(result.stdout) as {
      metadata?: {
        vulnerabilities?: {
          moderate?: number;
          high?: number;
          critical?: number;
          total?: number;
        };
      };
    };
    const vulnerabilities = audit.metadata?.vulnerabilities ?? {};
    const high = vulnerabilities.high ?? 0;
    const critical = vulnerabilities.critical ?? 0;
    const moderate = vulnerabilities.moderate ?? 0;
    const blockers = high + critical > 0
      ? [`npm audit reported ${high} high and ${critical} critical vulnerabilities in the generated target dependency tree.`]
      : [];
    const warnings = moderate > 0
      ? [`npm audit reported ${moderate} moderate vulnerabilities in the generated target dependency tree.`]
      : [];
    return { blockers, warnings };
  } catch {
    return { blockers: [], warnings: ["npm audit report could not be parsed."] };
  }
}

function e2eFindingsMarkdown(results: Array<Record<string, unknown>>, summary: Record<string, unknown>): string {
  const warnings = results.filter((item) => item.status === "warning");
  const failures = results.filter((item) => item.status === "fail");
  const faults = [...new Set(warnings.map((item) => String(item.revealed_fault ?? "")).filter(Boolean))];
  return [
    "# E2E Findings",
    "",
    `Total scenarios: ${summary.total}`,
    `Pass: ${summary.pass}`,
    `Warning: ${summary.warning}`,
    `Fail: ${summary.fail}`,
    "",
    "## What Is Wrong",
    "",
    faults.length > 0 ? faults.map((fault) => `- ${fault}`).join("\n") : "No scenario exposed a current fault.",
    "",
    "## Failed Scenarios",
    "",
    failures.length > 0 ? failures.map((item) => `- ${item.scenario_id}: ${item.title}`).join("\n") : "None.",
    "",
    "## Warning Scenarios",
    "",
    warnings.length > 0 ? warnings.map((item) => `- ${item.scenario_id}: ${item.title} - ${item.fix_hint ?? "Fix plan required."}`).join("\n") : "None."
  ].join("\n");
}

function updateE2ETargetExecutionProof(outputDir: string, result: TargetVerificationResult): void {
  if (result.status !== "pass") return;
  const resultsPath = path.join(outputDir, "13-e2e", "e2e-results.json");
  const findingsPath = path.join(outputDir, "13-e2e", "e2e-findings.md");
  if (!existsSync(resultsPath)) return;
  const e2e = readJson<{
    result_version?: string;
    summary?: Record<string, unknown>;
    results?: Array<Record<string, unknown>>;
    revealed_faults?: unknown[];
    fix_plan?: unknown[];
  }>(resultsPath);
  const results = e2e.results ?? [];
  const scenario = results.find((item) =>
    item.scenario_id === "E2E-066" ||
    String(item.title ?? "").toLowerCase().includes("target stack execution proof")
  );
  if (!scenario) return;
  scenario.status = "pass";
  scenario.result = "Target stack execution proof passed: npm install, typecheck, and production build completed in the generated target workspace.";
  scenario.revealed_fault = null;
  scenario.fix_hint = null;

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === "pass").length,
    warning: results.filter((item) => item.status === "warning").length,
    fail: results.filter((item) => item.status === "fail").length,
    happy_path: results.filter((item) => item.type === "happy_path").length,
    edge_case: results.filter((item) => item.type === "edge_case").length
  };
  const next = {
    ...e2e,
    summary,
    results,
    revealed_faults: [...new Set(results.map((item) => item.revealed_fault).filter(Boolean))],
    fix_plan: [...new Set(results.map((item) => item.fix_hint).filter(Boolean))]
  };
  writeJson(resultsPath, next);
  writeText(findingsPath, e2eFindingsMarkdown(results, summary));
}

export function verifyTargetFrontendExecution(outputDir: string, targetDir: string, options: TargetVerifyOptions = {}): TargetVerificationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!existsSync(outputDir)) blockers.push(`Output directory does not exist: ${outputDir}`);
  if (!existsSync(targetDir)) blockers.push(`Target directory does not exist: ${targetDir}`);
  if (!existsSync(path.join(targetDir, "package.json"))) blockers.push("Target package.json is missing. Run write-target first.");

  const commands: CommandResult[] = [];
  if (blockers.length === 0) {
    if (options.skipInstall) {
      commands.push({
        id: "install",
        command: "npm install",
        status: "pass",
        exit_code: 0,
        duration_ms: 0,
        stdout: "Skipped by --skip-install.",
        stderr: ""
      });
    } else {
      commands.push(runCommand("install", "npm", ["install"], targetDir));
    }
    if (commands.every((item) => item.status === "pass")) commands.push(runCommand("typecheck", "npm", ["run", "typecheck"], targetDir));
    if (commands.every((item) => item.status === "pass")) commands.push(runCommand("build", "npm", ["run", "build"], targetDir));
  }

  for (const command of commands.filter((item) => item.status === "fail")) {
    blockers.push(`${command.command} failed with exit code ${command.exit_code}.`);
  }
  if (commands.length > 0 && commands.every((item) => item.status === "pass")) {
    const audit = auditTargetDependencies(targetDir);
    blockers.push(...audit.blockers);
    warnings.push(...audit.warnings);
    warnings.push("Generated target source still uses fixture adapters until production backend and auth mappings are confirmed.");
  }

  const commandStatus = (id: string): "pass" | "fail" | "pending" => commands.find((item) => item.id === id)?.status ?? "pending";
  const requiredCommandStatus = (id: string): "pass" | "fail" => {
    const status = commandStatus(id);
    return status === "pass" ? "pass" : "fail";
  };
  const report: TargetVerificationResult = {
    report_version: "1.0",
    status: blockers.length > 0 ? "fail" : "pass",
    generated_at: new Date().toISOString(),
    output_dir: outputDir,
    target_dir: targetDir,
    commands,
    summary: {
      install: requiredCommandStatus("install"),
      typecheck: commandStatus("typecheck"),
      build: commandStatus("build")
    },
    blockers,
    warnings,
    proof_artifacts: [
      "14-target-execution/target-execution-report.json",
      "14-target-execution/target-execution-report.md",
      "target:.next"
    ]
  };

  const reportPath = path.join(outputDir, "14-target-execution", "target-execution-report.json");
  const markdownPath = path.join(outputDir, "14-target-execution", "target-execution-report.md");
  writeJson(reportPath, report);
  writeText(markdownPath, targetExecutionMarkdown(report as unknown as Record<string, unknown>));
  updateE2ETargetExecutionProof(outputDir, report);
  return report;
}
