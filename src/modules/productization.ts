import type {
  AccountWorkspaceContract,
  ArchetypeInput,
  FrontendContractArtifacts,
  ProviderExecutionContract,
  ProductizationArtifacts,
  ProductizationGate,
  TelemetryAuditContract
} from "../core/types";

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

function accountWorkspaceReport(contract: AccountWorkspaceContract): string {
  const endpoints = contract.package_persistence_api.endpoints as Array<Record<string, string>>;
  const migrationSteps = contract.migration_rules.sequence as Array<Record<string, string>>;
  const roleRows = contract.permission_model.package_permissions as Array<Record<string, string>>;
  const lines = [
    "# Account and Workspace Backend Contract",
    "",
    `Product: ${contract.product_name}`,
    `Status: ${contract.implementation_status}`,
    `Implementable without invention: ${contract.readiness.implementable_without_invention}`,
    `Backend implemented: ${contract.readiness.backend_implemented}`,
    "",
    "## Purpose",
    "",
    contract.purpose,
    "",
    "## Onboarding Guarantees",
    "",
    ...contract.onboarding_guarantees.map((item) => `- ${item}`),
    "",
    "## Account Model",
    "",
    `- Entity: ${(contract.account_model.entity as Record<string, string>).name}`,
    `- Identifier: ${(contract.account_model.entity as Record<string, string>).primary_key}`,
    `- States: ${((contract.account_model.states as string[]) ?? []).join(", ")}`,
    `- Session policy: ${(contract.account_model.session_policy as Record<string, string>).persistence}`,
    `- Provider key policy: ${(contract.account_model.provider_key_policy as Record<string, string>).storage}`,
    "",
    "## Workspace Model",
    "",
    `- Entity: ${(contract.workspace_model.entity as Record<string, string>).name}`,
    `- Identifier: ${(contract.workspace_model.entity as Record<string, string>).primary_key}`,
    `- Roles: ${((contract.workspace_model.roles as string[]) ?? []).join(", ")}`,
    `- Package revision policy: ${(contract.workspace_model.package_revision_policy as Record<string, string>).immutability}`,
    "",
    "## Package Persistence API",
    "",
    "| Method | Path | Purpose | Auth |",
    "|---|---|---|---|",
    ...endpoints.map((endpoint) => `| ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.purpose} | ${endpoint.auth} |`),
    "",
    "## Local-to-Hosted Migration",
    "",
    ...migrationSteps.map((step) => `- ${step.id}: ${step.action}`),
    "",
    "## Package Permission Matrix",
    "",
    "| Action | Owner | Admin | Editor | Reviewer | Viewer | Agent |",
    "|---|---|---|---|---|---|---|",
    ...roleRows.map((row) => `| ${row.action} | ${row.owner} | ${row.admin} | ${row.editor} | ${row.reviewer} | ${row.viewer} | ${row.agent} |`),
    "",
    "## Data Export",
    "",
    ...((contract.data_export_contract.included_records as string[]) ?? []).map((item) => `- ${item}`),
    "",
    "## Data Deletion",
    "",
    ...((contract.data_deletion_contract.sequence as Array<Record<string, string>>) ?? []).map((step) => `- ${step.id}: ${step.action}`),
    "",
    "## Unresolved Launch Work",
    "",
    ...contract.readiness.unresolved_launch_work.map((item) => `- ${item}`)
  ];
  return lines.join("\n");
}

function buildAccountWorkspaceContract(input: ArchetypeInput): AccountWorkspaceContract {
  const projectName = input.projectName?.trim() || "Generated product";
  return {
    contract_version: "1.0",
    product_name: projectName,
    implementation_status: "contract_ready_backend_not_implemented",
    purpose: "Define the hosted Archetype account and workspace backend boundary so account, storage, migration, permission, export, and deletion behavior can be implemented without changing local-first onboarding.",
    onboarding_guarantees: [
      "Fresh Start Hub, sample package, import package, and local draft save remain available without authentication.",
      "Local preflight continues to run before provider setup.",
      "LLM provider keys are requested only after a user chooses provider-backed generation.",
      "Provider keys and session diagnostics are never migrated from local storage into hosted account records.",
      "Users can reject hosted migration and continue with browser-local workspace state.",
      "AI agents can discover account-gated actions through explicit data-agent hooks and permission denials."
    ],
    account_model: {
      entity: {
        name: "account",
        primary_key: "account_id",
        id_format: "acct_<ksuid>",
        tenancy_scope: "global_identity"
      },
      required_fields: [
        "account_id",
        "primary_email",
        "display_name",
        "status",
        "created_at",
        "updated_at",
        "last_authenticated_at",
        "accepted_terms_version",
        "privacy_region"
      ],
      optional_fields: [
        "avatar_url",
        "company_name",
        "default_workspace_id",
        "locale",
        "timezone"
      ],
      states: ["invited", "active", "suspended", "deletion_requested", "deleted"],
      identity_providers: [
        {
          provider: "email_magic_link",
          required_for_launch: true,
          notes: "Low-friction account path for individual users."
        },
        {
          provider: "oidc_sso",
          required_for_launch: false,
          notes: "Enterprise-ready extension point; must map OIDC subject to account identity."
        }
      ],
      session_policy: {
        persistence: "http_only_secure_cookie_or_equivalent_server_session",
        max_idle_age: "24h",
        max_absolute_age: "30d",
        csrf: "same_site_lax_plus_state_token_for_mutations",
        revocation: "logout, passwordless-link rotation, account suspension, workspace removal"
      },
      provider_key_policy: {
        storage: "never_in_account_or_workspace_tables",
        allowed_runtime_scope: "session_only_until_provider_execution_bridge_exists",
        migration_behavior: "drop_and_warn",
        audit_behavior: "record_presence_of_provider_setup_without_secret_value"
      },
      audit_fields: ["created_by", "updated_by", "deleted_by", "request_id", "ip_hash", "user_agent_hash"]
    },
    workspace_model: {
      entity: {
        name: "workspace",
        primary_key: "workspace_id",
        id_format: "ws_<ksuid>",
        tenancy_scope: "team_workspace"
      },
      required_fields: [
        "workspace_id",
        "name",
        "slug",
        "owner_account_id",
        "status",
        "created_at",
        "updated_at",
        "default_retention_policy"
      ],
      states: ["active", "archived", "transfer_pending", "deletion_requested", "deleted"],
      membership_entity: {
        name: "workspace_membership",
        primary_key: "membership_id",
        uniqueness: "workspace_id + account_id",
        fields: ["workspace_id", "account_id", "role", "status", "invited_by", "joined_at"]
      },
      roles: ["owner", "admin", "editor", "reviewer", "viewer", "agent"],
      package_entity: {
        name: "architecture_package",
        primary_key: "package_id",
        fields: [
          "package_id",
          "workspace_id",
          "project_slug",
          "source_hash",
          "active_revision_id",
          "created_by",
          "created_at",
          "updated_at",
          "visibility"
        ]
      },
      package_revision_policy: {
        entity: "package_revision",
        primary_key: "revision_id",
        immutability: "revisions_are_append_only_after_creation",
        active_pointer: "architecture_package.active_revision_id",
        optimistic_concurrency: "If-Match revision_id required for mutation endpoints",
        artifact_storage: "content_addressed_object_store_or_equivalent_blob_storage"
      },
      local_draft_model: {
        hosted_status: "draft_import_candidate",
        storage_boundary: "browser_local_storage_until_user_confirms_migration",
        conflict_key: "package_id + source_hash + updated_at"
      }
    },
    package_persistence_api: {
      transport: "JSON over HTTPS",
      version_prefix: "/v1",
      auth_header: "Authorization: Bearer <session_or_scoped_agent_token>",
      idempotency_header: "Idempotency-Key required for create/import/export/delete requests",
      concurrency_header: "If-Match required for package mutation using current revision_id",
      standard_error_shape: {
        error: {
          code: "string",
          message: "human-readable summary",
          field_errors: "optional map",
          retryable: "boolean",
          request_id: "string"
        }
      },
      endpoints: [
        {
          method: "GET",
          path: "/v1/me",
          purpose: "Return current account, workspace memberships, and account-level capabilities.",
          auth: "account_session"
        },
        {
          method: "POST",
          path: "/v1/workspaces",
          purpose: "Create a team workspace with the caller as owner.",
          auth: "account_session"
        },
        {
          method: "GET",
          path: "/v1/workspaces/:workspace_id/packages",
          purpose: "List packages visible to the caller with latest revision metadata.",
          auth: "workspace:package.read"
        },
        {
          method: "POST",
          path: "/v1/workspaces/:workspace_id/packages",
          purpose: "Create a package shell or import a local package manifest into hosted storage.",
          auth: "workspace:package.create"
        },
        {
          method: "GET",
          path: "/v1/packages/:package_id/revisions/:revision_id",
          purpose: "Read a full package revision and its artifact manifest.",
          auth: "workspace:package.read"
        },
        {
          method: "POST",
          path: "/v1/packages/:package_id/revisions",
          purpose: "Append a new immutable package revision from compiler output.",
          auth: "workspace:revision.create"
        },
        {
          method: "POST",
          path: "/v1/packages/:package_id/exports",
          purpose: "Create a deterministic handoff export bundle for a package revision.",
          auth: "workspace:export.create"
        },
        {
          method: "GET",
          path: "/v1/exports/:export_id",
          purpose: "Download or inspect export job status.",
          auth: "workspace:export.read"
        },
        {
          method: "POST",
          path: "/v1/local-migrations",
          purpose: "Preview, validate, and commit migration from browser-local package state to hosted workspace.",
          auth: "workspace:migration.create"
        },
        {
          method: "DELETE",
          path: "/v1/packages/:package_id",
          purpose: "Soft-delete a package and schedule artifact retention cleanup.",
          auth: "workspace:package.delete"
        }
      ],
      required_audit_events: [
        "account.authenticated",
        "workspace.created",
        "membership.changed",
        "package.created",
        "revision.created",
        "package.imported_from_local",
        "export.created",
        "package.deleted",
        "workspace.deletion_requested",
        "account.deletion_requested"
      ]
    },
    migration_rules: {
      trigger: "Only when an authenticated user clicks Migrate local workspace or Save to hosted workspace.",
      preconditions: [
        "User has an active account session.",
        "Target workspace exists and caller has workspace:migration.create.",
        "Local package passes the existing schema validation report.",
        "Provider key fields are absent from migration payload."
      ],
      sequence: [
        {
          id: "migration_detect",
          action: "Detect local drafts, recent packages, saved package bundles, onboarding metrics, and workspace activity in browser storage."
        },
        {
          id: "migration_preview",
          action: "Show exact records that will move, records that stay local, records excluded for safety, and target workspace."
        },
        {
          id: "migration_redact",
          action: "Strip provider keys, session-only diagnostics, and unsupported file blobs; preserve safety findings as reviewable metadata."
        },
        {
          id: "migration_commit",
          action: "Create package and initial immutable revision with idempotency key and source hash."
        },
        {
          id: "migration_verify",
          action: "Round-trip read the hosted revision and compare artifact index, package id, source hash, and readiness score."
        },
        {
          id: "migration_confirm",
          action: "Keep local copy until user confirms hosted workspace opens successfully; then mark local record as migrated."
        }
      ],
      conflict_resolution: [
        {
          condition: "Hosted package with same package_id and source_hash exists",
          behavior: "Treat as already migrated and link local recent package to hosted package."
        },
        {
          condition: "Hosted package with same slug but different source_hash exists",
          behavior: "Create a new revision if user has revision.create; otherwise create a duplicate package with disambiguated slug."
        },
        {
          condition: "Schema validation fails",
          behavior: "Block migration and keep local package intact with remediation details."
        }
      ],
      excluded_records: [
        "provider_api_key",
        "provider_session_secret",
        "browser-only file object handles",
        "transient UI view state",
        "unconfirmed malformed import payloads"
      ]
    },
    permission_model: {
      scopes: [
        "workspace:read",
        "workspace:admin",
        "workspace:package.read",
        "workspace:package.create",
        "workspace:package.delete",
        "workspace:revision.create",
        "workspace:revision.approve",
        "workspace:export.create",
        "workspace:export.read",
        "workspace:migration.create",
        "workspace:audit.read"
      ],
      package_permissions: [
        { action: "read_package", owner: "allow", admin: "allow", editor: "allow", reviewer: "allow", viewer: "allow", agent: "allow_with_scope" },
        { action: "create_package", owner: "allow", admin: "allow", editor: "allow", reviewer: "deny", viewer: "deny", agent: "allow_with_scope" },
        { action: "create_revision", owner: "allow", admin: "allow", editor: "allow", reviewer: "deny", viewer: "deny", agent: "allow_with_scope" },
        { action: "approve_revision", owner: "allow", admin: "allow", editor: "deny", reviewer: "allow", viewer: "deny", agent: "deny" },
        { action: "export_package", owner: "allow", admin: "allow", editor: "allow", reviewer: "allow", viewer: "allow", agent: "allow_with_scope" },
        { action: "delete_package", owner: "allow", admin: "allow", editor: "deny", reviewer: "deny", viewer: "deny", agent: "deny" },
        { action: "migrate_local_workspace", owner: "allow", admin: "allow", editor: "allow", reviewer: "deny", viewer: "deny", agent: "deny" },
        { action: "read_audit_log", owner: "allow", admin: "allow", editor: "deny", reviewer: "allow", viewer: "deny", agent: "deny" }
      ],
      denial_contract: {
        http_status: "403",
        code: "permission_denied",
        ui_requirement: "Show required role, current role, and safe next action.",
        ai_agent_requirement: "Return machine-readable required_scope and missing_permission fields."
      },
      scoped_agent_tokens: {
        format: "agt_<ksuid>",
        max_ttl: "1h",
        allowed_roles: ["agent"],
        forbidden_scopes: ["workspace:admin", "workspace:package.delete", "workspace:migration.create", "workspace:audit.read"]
      }
    },
    data_export_contract: {
      endpoint: "POST /v1/workspaces/:workspace_id/data-exports",
      job_states: ["queued", "running", "ready", "expired", "failed"],
      included_records: [
        "account profile fields for requester",
        "workspace metadata and memberships visible to requester",
        "architecture packages and immutable revisions",
        "package export manifests and generated handoff bundles",
        "workspace audit events",
        "onboarding metrics only after telemetry consent exists"
      ],
      excluded_records: [
        "provider API keys",
        "session cookies",
        "raw IP addresses",
        "unredacted secrets detected in source material unless explicitly retained in package artifacts"
      ],
      retention: {
        export_download_window: "7d",
        job_metadata_retention: "30d",
        encryption: "server-side encryption at rest plus signed download URL"
      }
    },
    data_deletion_contract: {
      endpoint: "DELETE /v1/workspaces/:workspace_id or DELETE /v1/account",
      deletion_modes: ["package_delete", "workspace_delete", "account_delete"],
      sequence: [
        {
          id: "deletion_request",
          action: "Record deletion request, requester, scope, and confirmation phrase."
        },
        {
          id: "deletion_hold",
          action: "Apply 7 day reversible hold for workspace/account deletion unless compliance requires immediate package purge."
        },
        {
          id: "artifact_purge",
          action: "Delete package artifact objects, generated exports, local migration upload staging records, and derived search indexes."
        },
        {
          id: "identity_scrub",
          action: "Anonymize account identifiers in retained audit records after legal/audit retention window."
        },
        {
          id: "deletion_receipt",
          action: "Provide deletion receipt with request id, completed scopes, retained tombstones, and appeal/contact path."
        }
      ],
      retention_exceptions: [
        "billing records if billing is later added",
        "security abuse logs",
        "legal hold",
        "minimal tombstone needed to prevent account resurrection"
      ],
      local_state_behavior: "Hosted deletion does not silently erase browser-local packages; UI must offer local reset separately."
    },
    ai_agent_contract: {
      discovery: [
        "Expose data-agent-auth-required on account-gated actions.",
        "Expose data-agent-required-scope when a workspace action is unavailable.",
        "Expose data-agent-resource-id for package, revision, workspace, export, and migration jobs.",
        "Expose data-agent-permission-denial with missing role/scope and safe recovery action."
      ],
      deterministic_errors: [
        "auth_required",
        "workspace_not_found",
        "permission_denied",
        "revision_conflict",
        "schema_validation_failed",
        "migration_contains_session_secret",
        "export_not_ready",
        "deletion_hold_active"
      ],
      forbidden_behavior: [
        "Do not invent a workspace id or package id after a failed API response.",
        "Do not retry mutating requests without the same idempotency key.",
        "Do not include provider keys or session tokens in migration payloads.",
        "Do not mark a hosted revision active until the create revision response confirms it."
      ]
    },
    implementation_checklist: [
      "Implement account sessions and workspace membership storage before enabling hosted save.",
      "Implement immutable package revision storage with artifact index verification.",
      "Implement local-to-hosted migration preview, redaction, commit, verification, and rollback UI.",
      "Implement permission checks on every package, export, revision, migration, audit, and deletion endpoint.",
      "Implement data export and deletion job workers with receipts.",
      "Add integration tests for role denials, idempotency, optimistic concurrency, malformed migration payloads, and provider key exclusion."
    ],
    readiness: {
      implementable_without_invention: true,
      backend_implemented: false,
      launch_ready: false,
      unresolved_launch_work: [
        "Choose and deploy the production auth provider.",
        "Build persistent API storage and object storage adapters.",
        "Wire Workbench hosted save, migration, export, and deletion UI to real endpoints.",
        "Add server-side integration tests and CI launch gates.",
        "Publish privacy, retention, and deletion policy text before external telemetry or hosted collaboration."
      ],
      evidence_refs: [
        "PRODUCTIZATION_PLAN:Phase 2",
        "ONBOARDING_PLAN:Step 0",
        "ONBOARDING_PLAN:Step 4",
        "15-productization/productization-readiness.json"
      ]
    }
  };
}

function providerExecutionReport(contract: ProviderExecutionContract): string {
  const requestFields = contract.request_contract.required_fields as string[];
  const responseStates = contract.response_schema.status_values as string[];
  const credentialModes = contract.credential_handling.supported_modes as Array<Record<string, string | boolean>>;
  const redactionGates = contract.redaction_enforcement.gates as Array<Record<string, string>>;
  const budgetRules = contract.rate_limit_cost_control.budget_rules as Array<Record<string, string>>;
  const auditEvents = contract.audit_log_contract.events as Array<Record<string, string>>;
  const failureCodes = contract.failure_contract.codes as Array<Record<string, string>>;
  const lines = [
    "# Provider Execution Bridge Contract",
    "",
    `Product: ${contract.product_name}`,
    `Status: ${contract.implementation_status}`,
    `Implementable without invention: ${contract.readiness.implementable_without_invention}`,
    `Service implemented: ${contract.readiness.service_implemented}`,
    `Session keys persisted: ${contract.readiness.session_keys_persisted}`,
    "",
    "## Purpose",
    "",
    contract.purpose,
    "",
    "## Onboarding Guarantees",
    "",
    ...contract.onboarding_guarantees.map((item) => `- ${item}`),
    "",
    "## Request Contract",
    "",
    `- Endpoint: ${contract.request_contract.endpoint}`,
    `- Auth scope: ${contract.request_contract.required_scope}`,
    `- Idempotency: ${contract.request_contract.idempotency}`,
    `- Required fields: ${requestFields.join(", ")}`,
    "",
    "## Response Schema",
    "",
    `- Status values: ${responseStates.join(", ")}`,
    `- Artifact commit policy: ${(contract.response_schema.artifact_commit_policy as Record<string, string>).commit_condition}`,
    "",
    "## Credential Handling",
    "",
    "| Mode | Secret storage | Requires user key |",
    "|---|---|---|",
    ...credentialModes.map((mode) => `| ${mode.mode} | ${mode.secret_storage} | ${mode.requires_user_key} |`),
    "",
    "## Redaction Enforcement",
    "",
    ...redactionGates.map((gateItem) => `- ${gateItem.id}: ${gateItem.rule}`),
    "",
    "## Rate Limits and Cost Controls",
    "",
    ...budgetRules.map((rule) => `- ${rule.id}: ${rule.rule}`),
    "",
    "## Audit Events",
    "",
    ...auditEvents.map((event) => `- ${event.event}: ${event.description}`),
    "",
    "## Failure Codes",
    "",
    ...failureCodes.map((failure) => `- ${failure.code}: ${failure.recovery}`),
    "",
    "## Unresolved Launch Work",
    "",
    ...contract.readiness.unresolved_launch_work.map((item) => `- ${item}`)
  ];
  return lines.join("\n");
}

function buildProviderExecutionContract(input: ArchetypeInput): ProviderExecutionContract {
  const projectName = input.projectName?.trim() || "Generated product";
  return {
    contract_version: "1.0",
    product_name: projectName,
    implementation_status: "contract_ready_service_not_implemented",
    purpose: "Define the production provider execution bridge so hosted generation can call external LLM providers while preserving evidence review, redaction, budget controls, structured output validation, auditability, and no-persisted-session-key guarantees.",
    onboarding_guarantees: [
      "Fresh Start Hub, sample package, import package, and local preflight never require provider setup.",
      "The provider moment appears only after the user chooses Generate architecture or an equivalent provider-backed action.",
      "Users can run deterministic local diagnostics without entering an API key.",
      "User-supplied provider keys are session scoped and are never written to local storage, account records, workspace records, package artifacts, telemetry, or audit logs.",
      "Evidence review and redaction summary are shown before source material is sent to a provider.",
      "Prompt-injection findings are treated as untrusted source risks, never as provider instructions."
    ],
    request_contract: {
      endpoint: "POST /v1/provider-executions",
      method: "POST",
      transport: "JSON over HTTPS",
      required_scope: "workspace:provider.execute",
      idempotency: "Idempotency-Key required for every execution request.",
      timeout_policy: "Client receives execution_id immediately for async execution; synchronous preview must time out before 30s.",
      required_fields: [
        "workspace_id",
        "package_id",
        "requested_by_account_id",
        "execution_mode",
        "prompt_pack_id",
        "module_ids",
        "output_schema_id",
        "evidence_payload",
        "redaction_summary",
        "max_cost_cents",
        "idempotency_key"
      ],
      execution_modes: ["local_diagnostic", "hosted_provider", "hosted_provider_dry_run"],
      evidence_payload_contract: {
        source_records: "Only normalized source records selected in Evidence Review are allowed.",
        required_per_source: ["source_id", "source_type", "source_label", "summary", "included", "redaction_status", "safety_findings"],
        forbidden_per_source: ["provider_api_key", "session_cookie", "unredacted_secret", "raw_binary_blob", "browser_file_handle"],
        instruction_boundary: "Uploaded source text is evidence. It never outranks system, developer, productization, or module-contract instructions."
      },
      provider_selection: {
        provider_id: "Resolved by server deployment configuration or explicit workspace policy.",
        model_id: "Resolved by server deployment configuration, workspace policy, or request allowlist.",
        client_forbidden_behavior: "Client must not hard-code production provider credentials or model fallback behavior."
      },
      forbidden_request_fields: [
        "raw_provider_api_key",
        "workspace_secret_value",
        "account_session_cookie",
        "unredacted_secret_value",
        "billing_token",
        "raw_llm_output_override"
      ]
    },
    response_schema: {
      status_values: ["queued", "running", "succeeded", "failed", "needs_review", "redaction_blocked", "rate_limited", "budget_exceeded"],
      required_fields: [
        "execution_id",
        "status",
        "provider_request_id",
        "created_at",
        "updated_at",
        "module_results",
        "structured_outputs",
        "validation_results",
        "redaction_summary",
        "usage",
        "cost",
        "audit_event_ids",
        "errors"
      ],
      module_result_contract: {
        required_fields: ["module_id", "prompt_pack_id", "output_schema_id", "status", "artifact_refs", "confidence", "evidence_refs"],
        accepted_statuses: ["succeeded", "schema_repaired", "failed", "blocked"],
        schema_validation: "Every module output must parse, match its declared schema, and preserve evidence_refs before artifacts can be committed."
      },
      usage_contract: {
        fields: ["input_tokens", "output_tokens", "cached_tokens", "provider_model_id", "estimated_cost_cents", "final_cost_cents"],
        precision: "Store cost in integer cents or smaller integer billing units. Do not store raw provider invoices in package artifacts."
      },
      artifact_commit_policy: {
        commit_condition: "Only schema-valid, redaction-valid module outputs can create package revisions.",
        partial_success: "A failed module cannot silently generate placeholder artifacts; it must create a blocker or needs_review result.",
        raw_output_policy: "Raw provider output is discarded by default after structured parsing; sanitized debug snippets require explicit ops retention policy."
      }
    },
    credential_handling: {
      supported_modes: [
        {
          mode: "platform_managed",
          secret_storage: "server_secret_manager_or_runtime_environment",
          requires_user_key: false,
          persistence: "server_owned_secret_not_exposed_to_client"
        },
        {
          mode: "session_byok",
          secret_storage: "encrypted_in_memory_or_short_lived_secure_session_binding",
          requires_user_key: true,
          persistence: "ttl_max_1h_never_written_to_database_or_local_storage"
        }
      ],
      credential_binding_flow: [
        "User clicks provider-backed Generate architecture.",
        "Workbench shows provider requirement, evidence payload scope, redaction summary, estimated cost, and session-key persistence statement.",
        "User enters provider key only for session_byok mode or confirms platform-managed execution.",
        "Client sends key only to the credential binding endpoint over HTTPS.",
        "Server returns credential_binding_id, expires_at, and provider capability summary.",
        "Execution request references credential_binding_id and never includes the raw key."
      ],
      forbidden_storage: [
        "localStorage",
        "sessionStorage",
        "IndexedDB",
        "account table",
        "workspace table",
        "package artifacts",
        "audit log body",
        "telemetry payload",
        "browser downloadable exports"
      ],
      rotation_and_revocation: {
        session_byok: "Expire automatically after max 1h, logout, tab close signal when available, account suspension, or explicit revoke.",
        platform_managed: "Rotate through deployment secret manager and record credential alias version only."
      },
      logging_policy: "Logs may contain credential_binding_id and provider alias. They must never contain secret values or reversible secret fragments."
    },
    redaction_enforcement: {
      gates: [
        {
          id: "source_safety_scan",
          rule: "Run deterministic safety checks on every selected source before provider execution."
        },
        {
          id: "blocker_secret_gate",
          rule: "Block execution when a blocker secret finding is present unless the affected source is excluded or redacted."
        },
        {
          id: "regulated_data_review",
          rule: "Require needs_review state for regulated data findings unless workspace policy explicitly allows provider processing."
        },
        {
          id: "prompt_injection_boundary",
          rule: "Wrap uploaded content as quoted evidence and attach prompt-injection findings as risks, not instructions."
        },
        {
          id: "payload_manifest",
          rule: "Persist a sanitized payload manifest with source ids, hashes, redaction status, and inclusion flags."
        },
        {
          id: "output_secret_scan",
          rule: "Scan provider outputs for leaked secrets or source-sensitive fragments before committing artifacts."
        }
      ],
      redaction_statuses: ["not_required", "redacted", "excluded", "blocked", "needs_review"],
      redaction_map_policy: {
        storage: "store one-way hashes and replacement labels only",
        forbidden: "Do not store original secret, PII, or regulated value in redaction maps.",
        replacement_format: "[REDACTED:<category>:<stable_index>]"
      },
      payload_preview_requirement: "Workbench must show selected sources, excluded sources, redaction counts, safety blockers, estimated token use, and estimated cost before execution."
    },
    rate_limit_cost_control: {
      dimensions: ["account_id", "workspace_id", "provider_id", "model_id", "execution_mode", "prompt_pack_id"],
      concurrency_limits: {
        per_account: "2 active hosted_provider executions",
        per_workspace: "5 active hosted_provider executions",
        per_provider_model: "deployment-configured circuit breaker"
      },
      budget_rules: [
        {
          id: "dry_run_estimate",
          rule: "Hosted provider execution must support a dry-run estimate before paid execution."
        },
        {
          id: "request_max_cost",
          rule: "Every request must include max_cost_cents and fail closed when estimate exceeds it."
        },
        {
          id: "workspace_daily_budget",
          rule: "Workspace policy may define daily and monthly provider budgets."
        },
        {
          id: "retry_budget",
          rule: "Retries and schema repair attempts count toward the same execution budget."
        },
        {
          id: "circuit_breaker",
          rule: "Provider timeout, error-rate, or spend spikes trip a provider/model circuit breaker."
        }
      ],
      retry_policy: {
        retryable_errors: ["provider_timeout", "provider_rate_limited", "transient_network_error"],
        non_retryable_errors: ["redaction_blocked", "schema_contract_missing", "budget_exceeded", "permission_denied", "credential_missing"],
        max_attempts: 2,
        backoff: "exponential_with_jitter",
        idempotency: "All attempts reuse the original idempotency key and execution_id."
      }
    },
    audit_log_contract: {
      retention: {
        metadata_events: "180d by default or workspace policy",
        sanitized_debug_payload: "disabled by default; max 7d when explicitly enabled for support",
        raw_prompt_or_raw_output: "not retained by default"
      },
      events: [
        { event: "provider_execution.requested", description: "Execution requested with workspace, package, module ids, redaction summary, and max cost." },
        { event: "provider_execution.credential_bound", description: "Credential binding created without storing or logging secret value." },
        { event: "provider_execution.redaction_applied", description: "Payload redaction, exclusion, blocker, and needs-review counts recorded." },
        { event: "provider_execution.provider_called", description: "Provider alias, model alias, prompt pack, source hash set, and request id recorded." },
        { event: "provider_execution.response_received", description: "Provider response metadata, latency, token usage, and status recorded." },
        { event: "provider_execution.schema_validated", description: "Structured output validation and repair status recorded." },
        { event: "provider_execution.cost_recorded", description: "Estimated and final cost recorded against account/workspace budget." },
        { event: "provider_execution.artifacts_committed", description: "Artifact refs and revision id recorded only after validation passes." },
        { event: "provider_execution.failed", description: "Failure code, retryability, and recovery action recorded." }
      ],
      required_fields: [
        "audit_event_id",
        "execution_id",
        "workspace_id",
        "package_id",
        "account_id",
        "event",
        "created_at",
        "provider_alias",
        "model_alias",
        "prompt_pack_id",
        "source_hashes",
        "redaction_counts",
        "cost_cents",
        "request_id"
      ],
      forbidden_fields: [
        "raw_provider_api_key",
        "raw_prompt_with_unredacted_source",
        "raw_provider_output",
        "session_cookie",
        "unredacted_secret_value"
      ]
    },
    failure_contract: {
      codes: [
        { code: "auth_required", retryable: "false", recovery: "Authenticate or use local deterministic mode." },
        { code: "permission_denied", retryable: "false", recovery: "Request workspace:provider.execute or switch workspace." },
        { code: "credential_missing", retryable: "false", recovery: "Bind a session key or use platform-managed provider if available." },
        { code: "credential_expired", retryable: "true", recovery: "Re-enter session key and rerun with the same draft payload." },
        { code: "redaction_blocked", retryable: "false", recovery: "Exclude or redact blocked source material before retrying." },
        { code: "regulated_data_review_required", retryable: "false", recovery: "Complete human review or change workspace provider policy." },
        { code: "budget_exceeded", retryable: "false", recovery: "Increase max_cost_cents or reduce source payload/module scope." },
        { code: "rate_limited", retryable: "true", recovery: "Wait for retry_after_ms or reduce concurrent executions." },
        { code: "provider_timeout", retryable: "true", recovery: "Retry within budget using the same execution idempotency key." },
        { code: "schema_validation_failed", retryable: "true", recovery: "Run schema repair; if repair fails, return needs_review." },
        { code: "output_secret_scan_failed", retryable: "false", recovery: "Block artifact commit and show sanitized finding." }
      ],
      error_shape: {
        error: {
          code: "string",
          message: "human-readable summary",
          retryable: "boolean",
          recovery_action: "string",
          retry_after_ms: "optional number",
          execution_id: "optional string",
          request_id: "string"
        }
      }
    },
    ai_agent_contract: {
      discovery: [
        "Expose data-agent-provider-required only on generation actions that require hosted_provider execution.",
        "Expose data-agent-provider-key-persistence=\"never\" beside BYOK setup.",
        "Expose data-agent-payload-preview for selected sources, redactions, token estimate, and max cost.",
        "Expose data-agent-provider-execution-id after request creation.",
        "Expose data-agent-provider-failure-code for deterministic recovery."
      ],
      deterministic_recovery: {
        redaction_blocked: "Exclude or redact source, rerun local preflight, then request execution.",
        budget_exceeded: "Reduce modules/source scope or raise explicit max cost.",
        schema_validation_failed: "Run repair path and require needs_review if repair fails.",
        credential_expired: "Request fresh session key without reading previous key from storage."
      },
      forbidden_behavior: [
        "Do not invent provider outputs when execution fails.",
        "Do not persist or replay a user-entered provider key.",
        "Do not bypass payload preview when source material has safety findings.",
        "Do not commit provider output as artifacts until schema validation and output safety scan pass.",
        "Do not retry mutating execution requests without the original idempotency key."
      ]
    },
    implementation_checklist: [
      "Implement credential binding endpoint with no persistent BYOK storage.",
      "Implement provider execution endpoint and async job state machine.",
      "Implement deterministic redaction gates before provider calls and output safety scan after responses.",
      "Implement provider adapters with structured output validation and schema repair.",
      "Implement workspace/account/provider/model rate limits, budgets, and circuit breakers.",
      "Implement provider audit events without raw prompt, raw output, or secret values.",
      "Wire Workbench payload preview, provider setup, execution status, failures, and recovery actions to the contract.",
      "Add integration tests for secret blocking, expired credentials, budget exceeded, rate limits, schema repair failure, and no-persisted-key storage."
    ],
    readiness: {
      implementable_without_invention: true,
      service_implemented: false,
      launch_ready: false,
      session_keys_persisted: false,
      unresolved_launch_work: [
        "Choose production provider adapters and model allowlist.",
        "Build credential binding and provider execution services.",
        "Implement redaction enforcement and output safety scanning in the hosted service.",
        "Implement rate-limit, budget, retry, and circuit-breaker infrastructure.",
        "Implement provider audit log transport and retention controls.",
        "Run hosted provider integration tests with synthetic and malformed payloads."
      ],
      evidence_refs: [
        "PRODUCTIZATION_PLAN:Phase 3",
        "ONBOARDING_PLAN:Step 4",
        "ONBOARDING_PLAN:Evidence Review",
        "07-agent-runtime/provider-policy.json",
        "08-quality/safety-report.md"
      ]
    }
  };
}

function telemetryAuditReport(contract: TelemetryAuditContract): string {
  const purposes = contract.consent_privacy_contract.purposes as Array<Record<string, string | boolean>>;
  const events = contract.event_schema.event_catalog as Array<Record<string, string>>;
  const retryRules = contract.transport_retry_policy.retry_rules as Array<Record<string, string | number>>;
  const auditEvents = contract.audit_log_model.event_types as Array<Record<string, string>>;
  const retentionRows = contract.retention_deletion_controls.retention_classes as Array<Record<string, string>>;
  const lines = [
    "# Telemetry and Audit Transport Contract",
    "",
    `Product: ${contract.product_name}`,
    `Status: ${contract.implementation_status}`,
    `Implementable without invention: ${contract.readiness.implementable_without_invention}`,
    `Transport implemented: ${contract.readiness.transport_implemented}`,
    `Telemetry default enabled: ${contract.readiness.telemetry_default_enabled}`,
    "",
    "## Purpose",
    "",
    contract.purpose,
    "",
    "## Onboarding Guarantees",
    "",
    ...contract.onboarding_guarantees.map((item) => `- ${item}`),
    "",
    "## Consent Purposes",
    "",
    "| Purpose | Default | Required for local use |",
    "|---|---|---|",
    ...purposes.map((purpose) => `| ${purpose.purpose} | ${purpose.default_state} | ${purpose.required_for_local_use} |`),
    "",
    "## Event Catalog",
    "",
    "| Event | Purpose | Privacy class |",
    "|---|---|---|",
    ...events.map((event) => `| ${event.event_name} | ${event.purpose} | ${event.privacy_classification} |`),
    "",
    "## Transport Retry Policy",
    "",
    ...retryRules.map((rule) => `- ${rule.id}: ${rule.rule}`),
    "",
    "## Audit Log Model",
    "",
    ...auditEvents.map((event) => `- ${event.event_type}: ${event.description}`),
    "",
    "## Retention Classes",
    "",
    ...retentionRows.map((row) => `- ${row.class}: ${row.default_retention}`),
    "",
    "## Unresolved Launch Work",
    "",
    ...contract.readiness.unresolved_launch_work.map((item) => `- ${item}`)
  ];
  return lines.join("\n");
}

function buildTelemetryAuditContract(input: ArchetypeInput): TelemetryAuditContract {
  const projectName = input.projectName?.trim() || "Generated product";
  return {
    contract_version: "1.0",
    product_name: projectName,
    implementation_status: "contract_ready_transport_not_implemented",
    purpose: "Define product telemetry and workspace audit transport so measurement can be enabled only after explicit consent, privacy classification, retention, deletion, and workspace analytics boundaries are implemented.",
    onboarding_guarantees: [
      "Telemetry transport is off by default for Fresh Start Hub, sample package, import package, local draft save, local preflight, and local deterministic diagnostics.",
      "Local onboarding metrics remain browser-local until the user opts into hosted telemetry.",
      "No telemetry event may include provider API keys, session secrets, raw source material, raw provider prompts, or raw provider outputs.",
      "Consent can be declined or revoked without blocking local package creation, sample exploration, import, export, or reset.",
      "Workspace audit events are separate from product analytics and are visible/exportable to authorized workspace roles.",
      "Deletion and export controls apply to telemetry events, audit logs, provider audit metadata, and workspace analytics aggregates."
    ],
    consent_privacy_contract: {
      consent_states: ["not_asked", "granted", "declined", "revoked"],
      default_state: "not_asked",
      collection_default: "disabled",
      purposes: [
        { purpose: "product_analytics", default_state: "not_asked", required_for_local_use: false, description: "Usage events for product improvement after explicit consent." },
        { purpose: "workspace_audit", default_state: "enabled_when_hosted_workspace_exists", required_for_local_use: false, description: "Security and collaboration audit trail for hosted workspace actions." },
        { purpose: "provider_execution_audit", default_state: "enabled_for_hosted_provider_execution", required_for_local_use: false, description: "Provider execution metadata needed for security, billing, cost, and incident review." },
        { purpose: "support_debug", default_state: "not_asked", required_for_local_use: false, description: "Short-lived sanitized diagnostics shared only after user/workspace approval." }
      ],
      consent_capture: {
        trigger: "Only when user enables hosted telemetry, hosted workspace collaboration, provider execution, or support diagnostics.",
        required_copy_points: ["what_is_collected", "why_it_is_collected", "retention", "deletion", "workspace_visibility", "revocation"],
        proof_fields: ["consent_id", "purpose", "state", "policy_version", "captured_at", "actor_id", "workspace_id", "region"]
      },
      privacy_classifications: ["operational", "analytics", "security", "support_debug", "sensitive_forbidden"],
      data_minimization: [
        "Hash or omit IP addresses and user agents unless security policy requires temporary retention.",
        "Use package_id, workspace_id, artifact counts, status, and timings instead of raw source content.",
        "Store redaction counts and safety categories, never original secret/PII values.",
        "Aggregate analytics before display when workspace membership count is too small."
      ],
      forbidden_payload_fields: [
        "provider_api_key",
        "session_secret",
        "raw_source_material",
        "raw_prompt",
        "raw_provider_output",
        "unredacted_secret_value",
        "session_cookie",
        "full_ip_address"
      ],
      regional_policy: {
        default_region: "workspace_selected_region",
        cross_region_transfer: "disabled_until_policy_and_dpa_are_configured",
        data_subject_rights: ["export", "delete", "revoke_consent", "appeal_retention_exception"]
      }
    },
    event_schema: {
      schema_version: "1.0",
      envelope_required_fields: [
        "event_id",
        "event_name",
        "schema_version",
        "occurred_at",
        "producer",
        "privacy_classification",
        "consent_snapshot_id",
        "workspace_id",
        "account_id",
        "anonymous_session_id",
        "package_id",
        "request_id",
        "payload"
      ],
      payload_rules: {
        allowed_value_types: ["string", "number", "boolean", "null", "array", "object"],
        max_payload_bytes: 8192,
        pii_policy: "No direct PII in analytics payloads. Account/workspace ids are allowed only when consent or hosted audit purpose permits.",
        source_material_policy: "Use source_count, source_type_counts, redaction_counts, and source_hashes only."
      },
      event_catalog: [
        { event_name: "onboarding.start_hub_viewed", purpose: "product_analytics", privacy_classification: "analytics" },
        { event_name: "onboarding.local_preflight_run", purpose: "product_analytics", privacy_classification: "analytics" },
        { event_name: "package.generated", purpose: "product_analytics", privacy_classification: "analytics" },
        { event_name: "package.exported", purpose: "product_analytics", privacy_classification: "analytics" },
        { event_name: "workspace.package_saved", purpose: "workspace_audit", privacy_classification: "operational" },
        { event_name: "workspace.package_deleted", purpose: "workspace_audit", privacy_classification: "security" },
        { event_name: "workspace.local_migration_committed", purpose: "workspace_audit", privacy_classification: "operational" },
        { event_name: "provider.execution_requested", purpose: "provider_execution_audit", privacy_classification: "security" },
        { event_name: "provider.execution_completed", purpose: "provider_execution_audit", privacy_classification: "security" },
        { event_name: "provider.redaction_blocked", purpose: "provider_execution_audit", privacy_classification: "security" },
        { event_name: "consent.updated", purpose: "workspace_audit", privacy_classification: "security" },
        { event_name: "support.debug_bundle_created", purpose: "support_debug", privacy_classification: "support_debug" }
      ],
      event_id_policy: "evt_<ksuid> generated client-side for analytics and server-side for audit/security events.",
      idempotency_policy: "event_id is idempotency key; duplicate event_id must be ignored after first accepted write."
    },
    transport_retry_policy: {
      endpoint: "POST /v1/telemetry/events",
      transport_state: "not_implemented_off_by_default",
      batching: {
        max_events: 50,
        max_bytes: 65536,
        max_delay_ms: 10000
      },
      local_queue: {
        enabled_only_after_consent: true,
        storage: "IndexedDB or in-memory queue with explicit consent snapshot",
        max_age: "24h",
        drop_on_revoke_consent: true
      },
      retry_rules: [
        { id: "network_retry", rule: "Retry transient network failures with exponential backoff and jitter.", max_attempts: 3 },
        { id: "server_retry", rule: "Retry HTTP 429, 500, 502, 503, and 504 when retry_after is absent or valid.", max_attempts: 3 },
        { id: "client_drop", rule: "Drop HTTP 400, 401, 403, and schema-invalid events after recording local non-telemetry diagnostic.", max_attempts: 0 },
        { id: "consent_recheck", rule: "Recheck consent snapshot before every flush; revoke drops queued analytics immediately.", max_attempts: 0 },
        { id: "dead_letter", rule: "Server stores sanitized dead-letter metadata for accepted audit events that fail downstream processing.", max_attempts: 0 }
      ],
      offline_behavior: "Queue only after consent. If queue is unavailable or consent missing, drop analytics and preserve local app behavior.",
      backpressure_behavior: "Telemetry transport must never block package generation, local preflight, sample exploration, import, export, or reset."
    },
    audit_log_model: {
      storage_status: "contract_ready_audit_store_not_implemented",
      entity: {
        name: "workspace_audit_event",
        primary_key: "audit_event_id",
        id_format: "aud_<ksuid>"
      },
      required_fields: [
        "audit_event_id",
        "event_type",
        "workspace_id",
        "actor_account_id",
        "actor_role",
        "target_resource_type",
        "target_resource_id",
        "occurred_at",
        "request_id",
        "privacy_classification",
        "retention_class",
        "payload_digest",
        "sanitized_payload"
      ],
      event_types: [
        { event_type: "workspace.created", description: "Workspace created or transferred." },
        { event_type: "membership.changed", description: "Workspace member invited, joined, role-changed, removed, or suspended." },
        { event_type: "package.revision_created", description: "Immutable package revision created." },
        { event_type: "package.export_created", description: "Export bundle created or downloaded." },
        { event_type: "package.deleted", description: "Package deletion requested, held, purged, or restored." },
        { event_type: "provider.execution_audited", description: "Provider execution metadata recorded without raw prompt, output, or secrets." },
        { event_type: "telemetry.consent_changed", description: "Consent purpose changed by user or workspace admin." },
        { event_type: "data_export.created", description: "Workspace/account data export requested or completed." },
        { event_type: "data_deletion.completed", description: "Workspace/account/package deletion scope completed." }
      ],
      immutability: "Append-only except privacy-preserving anonymization fields after deletion/retention windows.",
      visibility: {
        owner: "all_workspace_audit_events",
        admin: "all_workspace_audit_events",
        reviewer: "package_and_provider_review_events",
        editor: "own_actions_and_package_revision_events",
        viewer: "none",
        agent: "none"
      },
      forbidden_fields: [
        "raw_source_material",
        "raw_prompt",
        "raw_provider_output",
        "provider_api_key",
        "session_cookie",
        "unredacted_secret_value"
      ]
    },
    retention_deletion_controls: {
      retention_classes: [
        { class: "analytics_event", default_retention: "180d", deletion_behavior: "delete_or_anonymize_on_account_deletion_or_consent_revocation" },
        { class: "workspace_audit", default_retention: "365d", deletion_behavior: "retain_minimal_tombstone_until_retention_expires" },
        { class: "provider_execution_audit", default_retention: "180d", deletion_behavior: "delete_or_anonymize_metadata_after_workspace_deletion" },
        { class: "support_debug", default_retention: "7d", deletion_behavior: "delete_on_expiry_or_revoke" },
        { class: "security_abuse", default_retention: "365d", deletion_behavior: "retain_only_when security_or_legal_exception_applies" }
      ],
      deletion_sequence: [
        { id: "resolve_scope", action: "Resolve account, workspace, package, telemetry purpose, provider execution, and support-debug records in scope." },
        { id: "pause_transport", action: "Stop new analytics collection for revoked purposes before deletion begins." },
        { id: "delete_events", action: "Delete or anonymize analytics and support-debug events according to retention class." },
        { id: "anonymize_audit", action: "Anonymize actor identifiers in retained audit logs after retention/exception policy allows it." },
        { id: "delete_aggregates", action: "Recompute or delete workspace analytics aggregates that include deleted events." },
        { id: "issue_receipt", action: "Return deletion receipt with completed scopes, retained exceptions, and request id." }
      ],
      export_sequence: [
        { id: "collect_records", action: "Collect consent records, telemetry events, audit events, aggregates, and retention exceptions visible to requester." },
        { id: "sanitize_records", action: "Remove forbidden fields and annotate redacted/anonymized values." },
        { id: "package_export", action: "Produce signed download with schema version and retention metadata." }
      ],
      retention_exception_policy: "Security, abuse, and legal-hold exceptions must be explicit, auditable, time-bound, and visible in export/deletion receipts."
    },
    workspace_analytics_boundaries: {
      default_visibility: "workspace_owner_and_admin_only",
      minimum_group_size: 5,
      aggregation_rules: [
        "Do not show individual member productivity analytics.",
        "Do not expose source material, prompt text, or provider output in analytics dashboards.",
        "Use counts, durations, warning categories, readiness scores, and artifact coverage only.",
        "Suppress or bucket metrics when group size is below minimum_group_size.",
        "Separate product analytics from security audit logs in navigation and permissions."
      ],
      allowed_metrics: [
        "packages_created",
        "packages_exported",
        "local_preflight_runs",
        "readiness_score_distribution",
        "redaction_blocker_count",
        "provider_execution_count",
        "provider_execution_cost_cents",
        "e2e_pass_rate",
        "launch_gate_status_counts"
      ],
      forbidden_metrics: [
        "raw_source_content",
        "raw_prompt_text",
        "raw_provider_output",
        "individual_keystrokes",
        "secret_values",
        "cross_workspace_user_tracking"
      ]
    },
    ai_agent_contract: {
      discovery: [
        "Expose data-agent-telemetry-default=\"off\" until consent is granted.",
        "Expose data-agent-consent-state for each telemetry purpose.",
        "Expose data-agent-event-schema-version in telemetry settings and audit export UI.",
        "Expose data-agent-retention-class for audit and telemetry rows.",
        "Expose data-agent-delete-scope and data-agent-export-scope in privacy controls."
      ],
      deterministic_recovery: {
        consent_missing: "Keep analytics local/off and continue the user workflow.",
        consent_revoked: "Drop queued analytics events and update UI state without blocking local use.",
        telemetry_transport_failed: "Do not block package workflows; retry according to transport policy.",
        deletion_requested: "Pause matching telemetry collection, process deletion sequence, and show receipt.",
        export_requested: "Generate sanitized export with retention metadata."
      },
      forbidden_behavior: [
        "Do not enable telemetry silently during onboarding.",
        "Do not send analytics from sample or import paths without consent.",
        "Do not include raw source material, prompts, provider outputs, or secrets in telemetry payloads.",
        "Do not expose individual member analytics when workspace group size is below threshold.",
        "Do not delete browser-local packages when hosted telemetry deletion is requested."
      ]
    },
    implementation_checklist: [
      "Implement consent capture, revocation, and policy-version records.",
      "Implement event schema validation and privacy classification at ingest.",
      "Implement transport batching, retry, idempotency, offline queue, and consent recheck.",
      "Implement append-only workspace audit storage and role-filtered audit views.",
      "Implement telemetry/audit export and deletion workers with receipts.",
      "Implement workspace analytics aggregation with group-size suppression.",
      "Add integration tests for consent missing, consent revoke, forbidden payload fields, retry/drop behavior, deletion receipts, and workspace analytics permissions."
    ],
    readiness: {
      implementable_without_invention: true,
      transport_implemented: false,
      launch_ready: false,
      telemetry_default_enabled: false,
      unresolved_launch_work: [
        "Build consent settings UI and hosted consent records.",
        "Build telemetry ingest endpoint and schema validation.",
        "Build audit log store and role-filtered audit views.",
        "Build retention, deletion, export, and receipt workers.",
        "Build workspace analytics aggregation and suppression.",
        "Publish privacy policy, DPA posture, and region/retention documentation before enabling telemetry."
      ],
      evidence_refs: [
        "PRODUCTIZATION_PLAN:Phase 4",
        "ONBOARDING_PLAN:Step 0",
        "ONBOARDING_PLAN:Activation Metrics",
        "15-productization/provider-execution-contract.json",
        "15-productization/account-workspace-contract.json"
      ]
    }
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
  lines.push("## Account and Workspace Contract");
  lines.push("");
  lines.push(`- Status: ${artifacts.accountWorkspace.contract.implementation_status}`);
  lines.push(`- Implementable without invention: ${artifacts.accountWorkspace.contract.readiness.implementable_without_invention}`);
  lines.push(`- Backend implemented: ${artifacts.accountWorkspace.contract.readiness.backend_implemented}`);
  lines.push(`- Artifact: 15-productization/account-workspace-contract.json`);
  lines.push("");
  lines.push("## Provider Execution Contract");
  lines.push("");
  lines.push(`- Status: ${artifacts.providerExecution.contract.implementation_status}`);
  lines.push(`- Implementable without invention: ${artifacts.providerExecution.contract.readiness.implementable_without_invention}`);
  lines.push(`- Service implemented: ${artifacts.providerExecution.contract.readiness.service_implemented}`);
  lines.push(`- Session keys persisted: ${artifacts.providerExecution.contract.readiness.session_keys_persisted}`);
  lines.push(`- Artifact: 15-productization/provider-execution-contract.json`);
  lines.push("");
  lines.push("## Telemetry and Audit Contract");
  lines.push("");
  lines.push(`- Status: ${artifacts.telemetryAudit.contract.implementation_status}`);
  lines.push(`- Implementable without invention: ${artifacts.telemetryAudit.contract.readiness.implementable_without_invention}`);
  lines.push(`- Transport implemented: ${artifacts.telemetryAudit.contract.readiness.transport_implemented}`);
  lines.push(`- Telemetry default enabled: ${artifacts.telemetryAudit.contract.readiness.telemetry_default_enabled}`);
  lines.push(`- Artifact: 15-productization/telemetry-audit-contract.json`);
  lines.push("");
  lines.push("## Next Phase");
  lines.push("");
  lines.push(artifacts.next_phase);
  return lines.join("\n");
}

export function buildProductizationArtifacts(input: ArchetypeInput, frontendContract: FrontendContractArtifacts): ProductizationArtifacts {
  const stats = contractStats(frontendContract);
  const projectName = input.projectName?.trim() || "Generated product";
  const accountWorkspaceContract = buildAccountWorkspaceContract(input);
  const accountWorkspace = {
    contract: accountWorkspaceContract,
    report: accountWorkspaceReport(accountWorkspaceContract)
  };
  const providerExecutionContract = buildProviderExecutionContract(input);
  const providerExecution = {
    contract: providerExecutionContract,
    report: providerExecutionReport(providerExecutionContract)
  };
  const telemetryAuditContract = buildTelemetryAuditContract(input);
  const telemetryAudit = {
    contract: telemetryAuditContract,
    report: telemetryAuditReport(telemetryAuditContract)
  };
  const gates: ProductizationGate[] = [
    gate(
      "account_workspace_backend",
      "accounts",
      accountWorkspace.contract.readiness.implementable_without_invention ? "configured" : "planned",
      "major",
      "Hosted account, workspace, package persistence, migration, permission, export, and deletion behavior is now defined as an implementation contract. Workbench runtime still stores packages locally until a backend is built.",
      "Implement authenticated sessions, persistent workspace APIs, object storage, deletion/export workers, and hosted Workbench wiring before claiming hosted collaboration.",
      "platform",
      ["ONBOARDING_PLAN:Final Decision", "PRODUCTIZATION_PLAN:Phase 2", "15-productization/account-workspace-contract.json"]
    ),
    gate(
      "telemetry_transport",
      "telemetry",
      telemetryAudit.contract.readiness.implementable_without_invention ? "configured" : "local_only",
      "minor",
      "Telemetry consent, event schema, retry/drop behavior, audit model, retention, deletion, export, and workspace analytics boundaries are defined. Transport remains off by default until implemented and consented.",
      "Implement consent UI, telemetry ingest, audit store, retention/deletion workers, and privacy policy before enabling product telemetry.",
      "product-ops",
      ["ONBOARDING_PLAN:Phase 6", "ONBOARDING_IMPLEMENTATION_LOG:Phase 6", "15-productization/telemetry-audit-contract.json"]
    ),
    gate(
      "provider_execution_bridge",
      "provider",
      providerExecution.contract.readiness.implementable_without_invention ? "configured" : "session_only",
      "major",
      "Provider execution request, response, credential, redaction, cost-control, rate-limit, failure, and audit contracts are defined. The hosted provider service is not implemented yet and session keys still are not persisted.",
      "Implement credential binding, provider adapters, redaction enforcement, budget controls, rate limits, schema repair, output safety scan, and provider audit transport before production provider runs.",
      "ai-platform",
      ["ONBOARDING_PLAN:Step 4", "07-agent-runtime/provider-policy.json", "15-productization/provider-execution-contract.json"]
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
      telemetryAudit.contract.readiness.implementable_without_invention ? "configured" : "planned",
      "major",
      "Hosted telemetry/audit retention classes, deletion/export sequences, consent revocation, and workspace analytics privacy boundaries are now defined as contracts. Runtime retention is not implemented yet.",
      "Implement retention/deletion/export workers, receipts, regional policy, and privacy documentation before hosted launch.",
      "security",
      ["08-quality/safety-report.md", "ONBOARDING_PLAN:Evidence Review", "15-productization/telemetry-audit-contract.json"]
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
      provider_execution: "provider_execution_contract_ready_session_keys_never_persisted",
      telemetry_transport: "telemetry_audit_contract_ready_off_by_default",
      deployment_target: "local_cli_and_static_workbench_build",
      target_frontend_execution: `${stats.verificationSuites} verification suites plus generated target install, typecheck, and build proof`
    },
    gates,
    launch_blockers: [
      "Hosted accounts and server-side package storage have an implementation contract but are not implemented.",
      "Telemetry and audit transport have implementation contracts but the hosted transport, consent UI, retention workers, and privacy policy are not implemented.",
      "Provider execution has an implementation contract but the hosted execution service is not implemented.",
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
    next_phase: "Productization Phase 5 should define deployment operations and launch gates.",
    accountWorkspace,
    providerExecution,
    telemetryAudit
  };
  return {
    ...base,
    readinessReport: productizationReport(base)
  };
}
