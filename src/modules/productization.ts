import type { ArchetypeInput, FrontendContractArtifacts, ProductizationArtifacts, ProductizationGate } from "../core/types";

type ProductionIntegrationContracts = {
  backend_api?: { endpoint_mappings?: unknown[] };
  authentication_authorization?: { route_guards?: unknown[]; action_guards?: unknown[] };
  content_brand?: { copy_surfaces?: unknown[] };
  human_review?: { review_gates?: unknown[] };
};

function contractStats(frontendContract: FrontendContractArtifacts): {
  endpointMappings: number;
  routeGuards: number;
  actionGuards: number;
  copySurfaces: number;
  reviewGates: number;
  verificationSuites: number;
} {
  const production = frontendContract.productionIntegrationContracts as ProductionIntegrationContracts;
  const verification = frontendContract.verificationContracts as { test_suites?: unknown[] };
  return {
    endpointMappings: production.backend_api?.endpoint_mappings?.length ?? 0,
    routeGuards: production.authentication_authorization?.route_guards?.length ?? 0,
    actionGuards: production.authentication_authorization?.action_guards?.length ?? 0,
    copySurfaces: production.content_brand?.copy_surfaces?.length ?? 0,
    reviewGates: production.human_review?.review_gates?.length ?? 0,
    verificationSuites: verification.test_suites?.length ?? 0
  };
}

function gate(
  gateId: string,
  area: ProductizationGate["area"],
  status: ProductizationGate["status"],
  severity: ProductizationGate["severity"],
  currentState: string,
  launchRequirement: string,
  owner: string,
  evidenceRefs: string[]
): ProductizationGate {
  return {
    gate_id: gateId,
    area,
    status,
    severity,
    current_state: currentState,
    launch_requirement: launchRequirement,
    owner,
    evidence_refs: evidenceRefs
  };
}

function productizationReport(artifacts: Omit<ProductizationArtifacts, "readinessReport">): string {
  const lines = [
    "# Productization Readiness",
    "",
    `Foundation ready: ${artifacts.summary.productization_foundation_ready}`,
    `Production launch ready: ${artifacts.summary.production_launch_ready}`,
    `Local-first onboarding preserved: ${artifacts.summary.local_first_onboarding_preserved}`,
    `Session keys persisted: ${artifacts.summary.session_keys_persisted}`,
    "",
    "## Runtime Boundary",
    "",
    `- Account mode: ${artifacts.runtime_boundary.account_mode}`,
    `- Workspace persistence: ${artifacts.runtime_boundary.workspace_persistence}`,
    `- Provider execution: ${artifacts.runtime_boundary.provider_execution}`,
    `- Telemetry transport: ${artifacts.runtime_boundary.telemetry_transport}`,
    `- Deployment target: ${artifacts.runtime_boundary.deployment_target}`,
    "",
    "## Gates",
    ""
  ];
  for (const item of artifacts.gates) {
    lines.push(`### ${item.gate_id}`);
    lines.push("");
    lines.push(`- Area: ${item.area}`);
    lines.push(`- Status: ${item.status}`);
    lines.push(`- Severity: ${item.severity}`);
    lines.push(`- Current state: ${item.current_state}`);
    lines.push(`- Launch requirement: ${item.launch_requirement}`);
    lines.push(`- Owner: ${item.owner}`);
    lines.push("");
  }
  lines.push("## Next Phase");
  lines.push("");
  lines.push(artifacts.next_phase);
  return lines.join("\n");
}

export function buildProductizationArtifacts(input: ArchetypeInput, frontendContract: FrontendContractArtifacts): ProductizationArtifacts {
  const stats = contractStats(frontendContract);
  const projectName = input.projectName?.trim() || "Generated product";
  const gates: ProductizationGate[] = [
    gate(
      "account_workspace_backend",
      "accounts",
      "planned",
      "major",
      "Workbench packages, drafts, onboarding metrics, and workspace activity are stored locally in the browser or exported package files.",
      "Add authenticated accounts, team workspaces, server-side package storage, and migration rules before claiming hosted collaboration.",
      "platform",
      ["ONBOARDING_PLAN:Final Decision", "PRODUCT_DEVELOPMENT_PLAN:Phase 16"]
    ),
    gate(
      "telemetry_transport",
      "telemetry",
      "local_only",
      "minor",
      "Onboarding metrics are local browser state only. No external analytics endpoint is called by default.",
      "Define privacy policy, consent, event schema, transport retries, and deletion controls before enabling product telemetry.",
      "product-ops",
      ["ONBOARDING_PLAN:Phase 6", "ONBOARDING_IMPLEMENTATION_LOG:Phase 6"]
    ),
    gate(
      "provider_execution_bridge",
      "provider",
      "session_only",
      "major",
      "Provider setup accepts session-only keys for diagnostics and deterministic local generation paths. Keys are not saved to localStorage.",
      "Add server or secure client provider execution, request audit trails, redaction enforcement, cost controls, and rate limits before production provider runs.",
      "ai-platform",
      ["ONBOARDING_PLAN:Step 4", "07-agent-runtime/provider-policy.json"]
    ),
    gate(
      "deployment_operations",
      "deployment",
      "local_only",
      "major",
      "The compiler, Workbench build, generated target source, target typecheck, and target build are verified locally.",
      "Add hosted deployment topology, environment configuration, CI gates, rollback policy, backup policy, and observability before public launch.",
      "platform",
      ["14-target-execution/target-execution-report.json", "PRODUCT_DEVELOPMENT_PLAN:Phase 14"]
    ),
    gate(
      "privacy_retention",
      "privacy",
      "planned",
      "major",
      "Source material safety checks, redaction notes, and session-key boundaries are implemented locally. Retention is browser or file-system scoped.",
      "Define hosted data retention, workspace deletion, audit export, regulated-data policy, and encryption requirements.",
      "security",
      ["08-quality/safety-report.md", "ONBOARDING_PLAN:Evidence Review"]
    ),
    gate(
      "production_contract_closure",
      "integration",
      stats.endpointMappings && stats.routeGuards ? "configured" : "planned",
      "major",
      `${stats.endpointMappings} endpoint mappings, ${stats.routeGuards} route guards, ${stats.actionGuards} action guards, ${stats.copySurfaces} copy surfaces, and ${stats.reviewGates} human review gates are expressed as contracts.`,
      "Confirm live backend endpoints, auth provider behavior, production copy, compliance review, and target-stack execution in CI.",
      "engineering",
      ["06-frontend-agent-contract/production-integration-contracts.json", "06-frontend-agent-contract/production-integration-plan.md"]
    )
  ];
  const blockingGates = gates.filter((item) => item.severity === "blocker");
  const majorOpenGates = gates.filter((item) => item.severity === "major" && item.status !== "configured");
  const base = {
    productization_version: "1.0",
    product_name: projectName,
    summary: {
      productization_foundation_ready: blockingGates.length === 0,
      production_launch_ready: false,
      local_first_onboarding_preserved: true,
      session_keys_persisted: false,
      configured_contract_surfaces: stats.endpointMappings + stats.routeGuards + stats.actionGuards + stats.copySurfaces + stats.reviewGates,
      open_major_gates: majorOpenGates.length
    },
    runtime_boundary: {
      account_mode: "local_anonymous_workspace",
      workspace_persistence: "browser_local_storage_and_exported_package_files",
      provider_execution: "session_key_diagnostics_with_deterministic_local_generation",
      telemetry_transport: "none_by_default_local_metrics_only",
      deployment_target: "local_cli_and_static_workbench_build",
      target_frontend_execution: `${stats.verificationSuites} verification suites plus generated target install, typecheck, and build proof`
    },
    gates,
    launch_blockers: [
      "Hosted accounts and server-side package storage are not implemented.",
      "External telemetry transport is intentionally disabled until privacy, consent, and deletion controls exist.",
      "Provider execution is not a hosted production service yet.",
      "Deployment operations, observability, backup, rollback, and rate limiting are not configured."
    ],
    preserved_onboarding_contracts: [
      "Fresh Start Hub remains available without an account.",
      "Local preflight runs before provider setup.",
      "Provider keys are requested only after generation is requested.",
      "Session keys are not persisted.",
      "Sample and import paths do not require provider setup.",
      "A frontend-building AI agent can find handoff actions through deterministic data-agent hooks."
    ],
    next_phase: "Productization Phase 2 should define the account and workspace backend contract without weakening local-first onboarding."
  };
  return {
    ...base,
    readinessReport: productizationReport(base)
  };
}
