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
    playwright: "pending" | "pass" | "fail";
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
  const repair = typeof report.repair === "object" && report.repair !== null ? report.repair as Record<string, unknown> : {};
  const contractFidelity = typeof report.contract_fidelity === "object" && report.contract_fidelity !== null ? report.contract_fidelity as Record<string, unknown> : {};
  const fidelitySummary = typeof contractFidelity.summary === "object" && contractFidelity.summary !== null ? contractFidelity.summary as Record<string, unknown> : {};
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
    "## Contract Fidelity",
    "",
    `Status: ${String(contractFidelity.status ?? "pending")}`,
    `Manifest files: ${String(fidelitySummary.manifest_files ?? 0)}`,
    `Missing manifest files: ${String(fidelitySummary.missing_manifest_files ?? 0)}`,
    `Missing required test IDs: ${String(fidelitySummary.missing_required_test_ids ?? 0)}`,
    `Missing action test refs: ${String(fidelitySummary.missing_action_test_refs ?? 0)}`,
    `Forbidden stack files: ${String(fidelitySummary.forbidden_stack_files ?? 0)}`,
    "",
    "## Warnings",
    "",
    warnings.length > 0 ? warnings.map((item) => `- ${item}`).join("\n") : "None.",
    "",
    "## Proof Artifacts",
    "",
    proofArtifacts.length > 0 ? proofArtifacts.map((item) => `- ${item}`).join("\n") : "None.",
    "",
    "## Repair",
    "",
    `Status: ${String(repair.status ?? "pending")}`,
    `Task count: ${String(repair.taskCount ?? 0)}`
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
      { id: "build", command: "npm run build", status: "pending", exit_code: null, duration_ms: null },
      { id: "playwright", command: "npm run archetype:playwright", status: "pending", exit_code: null, duration_ms: null }
    ],
    summary: {
      install: "pending",
      typecheck: "pending",
      build: "pending",
      playwright: "pending"
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
