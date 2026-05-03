import type { SchemaArtifacts } from "../core/types";

type JsonSchema = Record<string, unknown>;

function objectSchema(id: string, title: string, required: string[], properties: Record<string, unknown> = {}): JsonSchema {
  return {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": id,
    title,
    type: "object",
    required,
    additionalProperties: true,
    properties
  };
}

export function buildSchemaArtifacts(): SchemaArtifacts {
  const schemas: Record<string, JsonSchema> = {
    "archetype-intake.schema.json": objectSchema(
      "archetype-intake.schema.json",
      "Archetype Intake",
      ["context"],
      {
        projectName: { type: "string" },
        context: { type: "string" },
        goals: { type: "array", items: { type: "string" } },
        businessGoals: { type: "array", items: { type: "string" } },
        users: { type: "array", items: { type: "string" } }
      }
    ),
    "manifest.schema.json": objectSchema(
      "manifest.schema.json",
      "Archetype Manifest",
      ["package_id", "project_slug", "spec_version", "schema_version", "source_hash", "generated_at", "operating_mode", "export_target", "readiness_score", "ready_for_frontend_agent", "artifact_index"]
    ),
    "evidence-ledger.schema.json": objectSchema(
      "evidence-ledger.schema.json",
      "Evidence Ledger",
      ["project_id", "ledger_version", "sources", "known_facts", "observations", "inferences", "assumptions", "conflicts", "missing_information", "risks", "decisions"]
    ),
    "visual-evidence-extraction.schema.json": objectSchema(
      "visual-evidence-extraction.schema.json",
      "Visual Evidence Extraction",
      ["extraction_version", "source_count", "sources", "aggregate"]
    ),
    "product-model.schema.json": objectSchema(
      "product-model.schema.json",
      "Product Model",
      ["product_name", "product_type", "product_category", "primary_goal", "business_goals", "primary_users", "core_jobs", "core_entities", "primary_workflows", "platform", "interface_density", "accessibility_target", "risk_domain_flags", "evidence_refs"]
    ),
    "route-map.schema.json": objectSchema(
      "route-map.schema.json",
      "Route Map",
      ["routes"]
    ),
    "screen-inventory.schema.json": objectSchema(
      "screen-inventory.schema.json",
      "Screen Inventory",
      ["screens"]
    ),
    "ux-flow-state-completeness.schema.json": objectSchema(
      "ux-flow-state-completeness.schema.json",
      "UX Flow and State Completeness",
      ["required_state_keys", "contextual_state_keys", "screen_coverage", "flow_coverage", "state_transition_contracts", "summary", "blockers", "warnings", "evidence_refs"]
    ),
    "screen-spec.schema.json": objectSchema(
      "screen-spec.schema.json",
      "Screen Specification",
      ["screen_id", "route", "name", "priority", "purpose", "primary_user_goal", "business_goal", "evidence_refs", "layout", "sections", "required_components", "required_patterns", "data_needs", "actions", "states", "interactions", "responsive_behavior", "accessibility", "content_rules", "acceptance_criteria", "forbidden_inventions"]
    ),
    "component-contracts.schema.json": objectSchema(
      "component-contracts.schema.json",
      "Component Contracts",
      ["contract_version", "component_count", "contracts", "coverage", "blockers", "warnings", "evidence_refs"]
    ),
    "component-registry.schema.json": objectSchema(
      "component-registry.schema.json",
      "Component Registry",
      ["components"]
    ),
    "pattern-contracts.schema.json": objectSchema(
      "pattern-contracts.schema.json",
      "Pattern Contracts",
      ["contract_version", "pattern_count", "contracts", "coverage", "blockers", "warnings", "evidence_refs"]
    ),
    "pattern-registry.schema.json": objectSchema(
      "pattern-registry.schema.json",
      "Pattern Registry",
      ["patterns"]
    ),
    "data-contracts.schema.json": objectSchema(
      "data-contracts.schema.json",
      "Data Contracts",
      ["entities", "queries", "mutations"]
    ),
    "data-operation-contracts.schema.json": objectSchema(
      "data-operation-contracts.schema.json",
      "Data Operation Contracts",
      ["contract_version", "queries", "mutations", "blockers", "warnings", "evidence_refs"]
    ),
    "action-contracts.schema.json": objectSchema(
      "action-contracts.schema.json",
      "Action Contracts",
      ["contract_version", "actions", "blockers", "warnings", "evidence_refs"]
    ),
    "form-contracts.schema.json": objectSchema(
      "form-contracts.schema.json",
      "Form Contracts",
      ["contract_version", "forms", "blockers", "warnings", "evidence_refs"]
    ),
    "verification-contracts.schema.json": objectSchema(
      "verification-contracts.schema.json",
      "Verification Contracts",
      ["contract_version", "test_suites", "coverage", "blockers", "warnings", "evidence_refs"]
    ),
    "production-integration-contracts.schema.json": objectSchema(
      "production-integration-contracts.schema.json",
      "Production Integration Contracts",
      ["contract_version", "status", "backend_api", "authentication_authorization", "content_brand", "human_review", "target_stack_execution", "form_validation_alignment", "blockers", "warnings", "evidence_refs"]
    ),
    "token-contracts.schema.json": objectSchema(
      "token-contracts.schema.json",
      "Token Contracts",
      ["contract_version", "layers", "usage_map", "constraints", "blockers", "warnings", "evidence_refs"]
    ),
    "typography-system.schema.json": objectSchema(
      "typography-system.schema.json",
      "Typography System",
      ["system_version", "font_families", "type_roles", "responsive_rules", "accessibility_rules", "css_variables", "blockers", "warnings", "evidence_refs"]
    ),
    "spec-coverage-audit.schema.json": objectSchema(
      "spec-coverage-audit.schema.json",
      "Spec Coverage Audit",
      ["audit_version", "coverage", "summary", "remaining_gaps", "blockers", "warnings", "evidence_refs"]
    ),
    "source-file-manifest.schema.json": objectSchema(
      "source-file-manifest.schema.json",
      "Target Frontend Source File Manifest",
      ["manifest_version", "target_stack", "build_order", "file_count", "files", "coverage", "forbidden_behavior", "blockers", "warnings"]
    ),
    "route-component-map.schema.json": objectSchema(
      "route-component-map.schema.json",
      "Target Frontend Route Component Map",
      ["contract_version", "routes", "blockers", "warnings"]
    ),
    "codegen-tasks.schema.json": objectSchema(
      "codegen-tasks.schema.json",
      "Target Frontend Codegen Tasks",
      ["task_version", "tasks", "blockers", "warnings"]
    ),
    "e2e-scenarios.schema.json": objectSchema(
      "e2e-scenarios.schema.json",
      "E2E Scenario Catalog",
      ["catalog_version", "scenario_count", "scenarios", "coverage", "evidence_refs"]
    ),
    "e2e-results.schema.json": objectSchema(
      "e2e-results.schema.json",
      "E2E Scenario Results",
      ["result_version", "summary", "results", "revealed_faults", "fix_plan"]
    ),
    "target-execution-report.schema.json": objectSchema(
      "target-execution-report.schema.json",
      "Target Frontend Execution Report",
      ["report_version", "status", "commands", "summary", "blockers", "warnings", "proof_artifacts"]
    ),
    "productization-readiness.schema.json": objectSchema(
      "productization-readiness.schema.json",
      "Productization Readiness",
      ["productization_version", "product_name", "summary", "runtime_boundary", "gates", "launch_blockers", "preserved_onboarding_contracts", "next_phase"]
    ),
    "account-workspace-contract.schema.json": objectSchema(
      "account-workspace-contract.schema.json",
      "Account and Workspace Backend Contract",
      ["contract_version", "product_name", "implementation_status", "purpose", "onboarding_guarantees", "account_model", "workspace_model", "package_persistence_api", "migration_rules", "permission_model", "data_export_contract", "data_deletion_contract", "ai_agent_contract", "implementation_checklist", "readiness"]
    ),
    "provider-execution-contract.schema.json": objectSchema(
      "provider-execution-contract.schema.json",
      "Provider Execution Bridge Contract",
      ["contract_version", "product_name", "implementation_status", "purpose", "onboarding_guarantees", "request_contract", "response_schema", "credential_handling", "redaction_enforcement", "rate_limit_cost_control", "audit_log_contract", "failure_contract", "ai_agent_contract", "implementation_checklist", "readiness"]
    ),
    "telemetry-audit-contract.schema.json": objectSchema(
      "telemetry-audit-contract.schema.json",
      "Telemetry and Audit Transport Contract",
      ["contract_version", "product_name", "implementation_status", "purpose", "onboarding_guarantees", "consent_privacy_contract", "event_schema", "transport_retry_policy", "audit_log_model", "retention_deletion_controls", "workspace_analytics_boundaries", "ai_agent_contract", "implementation_checklist", "readiness"]
    ),
    "deployment-operations-contract.schema.json": objectSchema(
      "deployment-operations-contract.schema.json",
      "Deployment Operations and Launch Gates Contract",
      ["contract_version", "product_name", "implementation_status", "purpose", "onboarding_guarantees", "environment_configuration", "ci_cd_gates", "hosted_workbench_runbook", "backup_rollback_policy", "observability_signals", "incident_response_checklist", "launch_gate_matrix", "ai_agent_contract", "implementation_checklist", "readiness"]
    ),
    "frontend-build-manifest.schema.json": objectSchema(
      "frontend-build-manifest.schema.json",
      "Frontend Build Manifest",
      ["project_name", "frontend_stack", "build_order", "entry_routes", "forbidden_behavior"]
    ),
    "dsag.schema.json": objectSchema(
      "dsag.schema.json",
      "Design System Architecture Graph",
      ["graph_version", "nodes", "edges", "integrity"]
    ),
    "readiness-report.schema.json": objectSchema(
      "readiness-report.schema.json",
      "Readiness Report",
      ["score", "readyForFrontendAgent", "dimensions", "blockers", "warnings", "requiredHumanReview"]
    )
  };

  return {
    schemaVersion: "1.0",
    schemas,
    index: [
      { artifact: "input", schema_file: "archetype-intake.schema.json", description: "Structured project intake accepted by the compiler." },
      { artifact: "00-manifest/manifest.json", schema_file: "manifest.schema.json", description: "Export package manifest." },
      { artifact: "01-evidence/evidence-ledger.json", schema_file: "evidence-ledger.schema.json", description: "Evidence Ledger contract." },
      { artifact: "01-evidence/visual-evidence-extraction.json", schema_file: "visual-evidence-extraction.schema.json", description: "Visual evidence extraction contract." },
      { artifact: "02-product-model/product-model.json", schema_file: "product-model.schema.json", description: "Product model contract." },
      { artifact: "03-experience-architecture/route-map.json", schema_file: "route-map.schema.json", description: "Route map contract." },
      { artifact: "03-experience-architecture/screen-inventory.json", schema_file: "screen-inventory.schema.json", description: "Screen inventory contract." },
      { artifact: "03-experience-architecture/ux-flow-state-completeness.json", schema_file: "ux-flow-state-completeness.schema.json", description: "UX flow and state completeness contract." },
      { artifact: "05-screen-specs/*.yaml", schema_file: "screen-spec.schema.json", description: "Screen specification contract." },
      { artifact: "04-design-system/components/component-contracts.json", schema_file: "component-contracts.schema.json", description: "Deterministic component API, state, token, and accessibility contracts." },
      { artifact: "04-design-system/components/component-registry.json", schema_file: "component-registry.schema.json", description: "Component registry contract." },
      { artifact: "04-design-system/patterns/pattern-contracts.json", schema_file: "pattern-contracts.schema.json", description: "Deterministic product-specific pattern contracts." },
      { artifact: "04-design-system/patterns/pattern-registry.json", schema_file: "pattern-registry.schema.json", description: "Pattern registry contract." },
      { artifact: "06-frontend-agent-contract/data-contracts.json", schema_file: "data-contracts.schema.json", description: "Data contract package schema." },
      { artifact: "06-frontend-agent-contract/data-operation-contracts.json", schema_file: "data-operation-contracts.schema.json", description: "Query and mutation behavior contracts." },
      { artifact: "06-frontend-agent-contract/action-contracts.json", schema_file: "action-contracts.schema.json", description: "Screen action precondition, permission, and result contracts." },
      { artifact: "06-frontend-agent-contract/form-contracts.json", schema_file: "form-contracts.schema.json", description: "Form field, validation, and submission contracts." },
      { artifact: "06-frontend-agent-contract/verification-contracts.json", schema_file: "verification-contracts.schema.json", description: "Deterministic acceptance and implementation proof contract." },
      { artifact: "06-frontend-agent-contract/production-integration-contracts.json", schema_file: "production-integration-contracts.schema.json", description: "Backend, auth, copy, review, and target-stack confirmation contract." },
      { artifact: "04-design-system/tokens/token-contracts.json", schema_file: "token-contracts.schema.json", description: "Deterministic token layer and usage contract." },
      { artifact: "04-design-system/tokens/typography-system.json", schema_file: "typography-system.schema.json", description: "Typography roles, scale, and CSS contract." },
      { artifact: "08-quality/spec-coverage-audit.json", schema_file: "spec-coverage-audit.schema.json", description: "Spec promise coverage and remaining gap audit." },
      { artifact: "12-target-frontend/source-file-manifest.json", schema_file: "source-file-manifest.schema.json", description: "Deterministic target frontend source file manifest." },
      { artifact: "12-target-frontend/route-component-map.json", schema_file: "route-component-map.schema.json", description: "Target route, screen, component, pattern, data, action, and test selector map." },
      { artifact: "12-target-frontend/codegen-tasks.json", schema_file: "codegen-tasks.schema.json", description: "Ordered downstream frontend code-generation tasks." },
      { artifact: "13-e2e/e2e-scenarios.json", schema_file: "e2e-scenarios.schema.json", description: "One hundred happy-path and edge-case E2E scenarios." },
      { artifact: "13-e2e/e2e-results.json", schema_file: "e2e-results.schema.json", description: "E2E scenario results, revealed faults, and fix plan." },
      { artifact: "14-target-execution/target-execution-report.json", schema_file: "target-execution-report.schema.json", description: "Target frontend install, typecheck, and production build execution proof." },
      { artifact: "15-productization/productization-readiness.json", schema_file: "productization-readiness.schema.json", description: "Productization readiness gate contract." },
      { artifact: "15-productization/account-workspace-contract.json", schema_file: "account-workspace-contract.schema.json", description: "Hosted account, workspace, persistence, migration, permission, export, and deletion contract." },
      { artifact: "15-productization/provider-execution-contract.json", schema_file: "provider-execution-contract.schema.json", description: "Hosted provider request, response, credential, redaction, cost-control, failure, and audit contract." },
      { artifact: "15-productization/telemetry-audit-contract.json", schema_file: "telemetry-audit-contract.schema.json", description: "Consent, event schema, transport retry, audit log, retention, deletion, and workspace analytics contract." },
      { artifact: "15-productization/deployment-operations-contract.json", schema_file: "deployment-operations-contract.schema.json", description: "Environment configuration, CI/CD gates, deployment runbook, backup, rollback, observability, incident response, and launch gates contract." },
      { artifact: "06-frontend-agent-contract/build-manifest.json", schema_file: "frontend-build-manifest.schema.json", description: "Frontend build manifest schema." },
      { artifact: "03-experience-architecture/dsag.json", schema_file: "dsag.schema.json", description: "DSAG graph schema." },
      { artifact: "00-manifest/implementation-readiness.json", schema_file: "readiness-report.schema.json", description: "Readiness report schema." }
    ]
  };
}
