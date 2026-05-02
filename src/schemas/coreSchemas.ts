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
    "screen-spec.schema.json": objectSchema(
      "screen-spec.schema.json",
      "Screen Specification",
      ["screen_id", "route", "name", "priority", "purpose", "primary_user_goal", "business_goal", "evidence_refs", "layout", "sections", "required_components", "required_patterns", "data_needs", "actions", "states", "interactions", "responsive_behavior", "accessibility", "content_rules", "acceptance_criteria", "forbidden_inventions"]
    ),
    "component-registry.schema.json": objectSchema(
      "component-registry.schema.json",
      "Component Registry",
      ["components"]
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
      { artifact: "02-product-model/product-model.json", schema_file: "product-model.schema.json", description: "Product model contract." },
      { artifact: "03-experience-architecture/route-map.json", schema_file: "route-map.schema.json", description: "Route map contract." },
      { artifact: "03-experience-architecture/screen-inventory.json", schema_file: "screen-inventory.schema.json", description: "Screen inventory contract." },
      { artifact: "05-screen-specs/*.yaml", schema_file: "screen-spec.schema.json", description: "Screen specification contract." },
      { artifact: "04-design-system/components/component-registry.json", schema_file: "component-registry.schema.json", description: "Component registry contract." },
      { artifact: "04-design-system/patterns/pattern-registry.json", schema_file: "pattern-registry.schema.json", description: "Pattern registry contract." },
      { artifact: "06-frontend-agent-contract/data-contracts.json", schema_file: "data-contracts.schema.json", description: "Data contract package schema." },
      { artifact: "06-frontend-agent-contract/build-manifest.json", schema_file: "frontend-build-manifest.schema.json", description: "Frontend build manifest schema." },
      { artifact: "03-experience-architecture/dsag.json", schema_file: "dsag.schema.json", description: "DSAG graph schema." },
      { artifact: "00-manifest/implementation-readiness.json", schema_file: "readiness-report.schema.json", description: "Readiness report schema." }
    ]
  };
}
