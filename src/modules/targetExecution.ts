import type { TargetExecutionArtifacts } from "../core/types";

interface TargetExecutionCommandRecord {
  id: string;
  command: string;
  status: "pending" | "pass" | "fail";
  exit_code: number | null;
  duration_ms: number | null;
  stdout?: string;
  stderr?: string;
}

interface TargetExecutionReport {
  report_version: string;
  status: "pending" | "pass" | "warning" | "fail";
  generated_at: string | null;
  output_dir: string | null;
  target_dir: string | null;
  commands: TargetExecutionCommandRecord[];
  summary: {
    install: "pending" | "pass" | "fail";
    typecheck: "pending" | "pass" | "fail";
    build: "pending" | "pass" | "fail";
  };
  blockers: string[];
  warnings: string[];
  proof_artifacts: string[];
}

export function targetExecutionMarkdown(report: Record<string, unknown>): string {
  const commands = (Array.isArray(report.commands) ? report.commands : []) as TargetExecutionCommandRecord[];
  const blockers = Array.isArray(report.blockers) ? report.blockers.map(String) : [];
  const warnings = Array.isArray(report.warnings) ? report.warnings.map(String) : [];
  const proofArtifacts = Array.isArray(report.proof_artifacts) ? report.proof_artifacts.map(String) : [];
  return [
    "# Target Frontend Execution Report",
    "",
    `Status: ${String(report.status ?? "unknown")}`,
    `Generated: ${String(report.generated_at ?? "pending")}`,
    `Target: ${String(report.target_dir ?? "pending")}`,
    "",
    "## Commands",
    "",
    commands.length > 0
      ? commands.map((item) => `- ${item.status}: ${item.command}${item.exit_code === null ? "" : ` (exit ${item.exit_code})`}`).join("\n")
      : "None.",
    "",
    "## Blockers",
    "",
    blockers.length > 0 ? blockers.map((item) => `- ${item}`).join("\n") : "None.",
    "",
    "## Warnings",
    "",
    warnings.length > 0 ? warnings.map((item) => `- ${item}`).join("\n") : "None.",
    "",
    "## Proof Artifacts",
    "",
    proofArtifacts.length > 0 ? proofArtifacts.map((item) => `- ${item}`).join("\n") : "None."
  ].join("\n");
}

export function buildPendingTargetExecutionArtifacts(): TargetExecutionArtifacts {
  const executionReport: TargetExecutionReport = {
    report_version: "1.0",
    status: "pending",
    generated_at: null,
    output_dir: null,
    target_dir: null,
    commands: [
      { id: "install", command: "npm install", status: "pending", exit_code: null, duration_ms: null },
      { id: "typecheck", command: "npm run typecheck", status: "pending", exit_code: null, duration_ms: null },
      { id: "build", command: "npm run build", status: "pending", exit_code: null, duration_ms: null }
    ],
    summary: {
      install: "pending",
      typecheck: "pending",
      build: "pending"
    },
    blockers: [],
    warnings: ["Target frontend execution proof has not run yet."],
    proof_artifacts: []
  };

  return {
    executionReport: executionReport as unknown as Record<string, unknown>,
    executionMarkdown: targetExecutionMarkdown(executionReport as unknown as Record<string, unknown>)
  };
}
