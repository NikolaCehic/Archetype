# Archetype Productization Plan

This plan starts after `ONBOARDING_PLAN.md` Phase 6. Onboarding now proves the local-first workflow. Productization must turn that workflow into a launchable product without weakening the privacy and provider-key boundaries that onboarding established.

## Productization Goal

Archetype becomes productization-ready when a human user or AI agent can inspect the package and know exactly what is local, what is configured, what remains external, and what must be implemented before hosted launch.

## Non-Negotiable Constraints

- Fresh Start Hub remains available without an account.
- Local preflight remains available before provider setup.
- LLM/API keys are requested only after generation is requested.
- Session keys are never persisted.
- Sample and import paths never trigger unnecessary provider setup.
- Telemetry is off by default until privacy, consent, deletion, and retention are explicit.
- Production launch readiness is separate from frontend-agent readiness.

## Phase 1: Productization Readiness Contract

Status: complete

Goal: make production readiness inspectable without introducing hosted infrastructure.

Build:

- Productization readiness artifact.
- Runtime boundary summary for accounts, workspace storage, provider execution, telemetry, deployment, and target frontend proof.
- Productization gates for account backend, telemetry transport, provider execution, deployment operations, privacy retention, and production contract closure.
- Workbench Governance view for the readiness contract.
- Tests proving the artifact exists, the UI renders it, and onboarding guarantees remain intact.

Exit criteria:

- Generated packages include `15-productization/productization-readiness.json`.
- Generated packages include `15-productization/productization-readiness.md`.
- Workbench Governance shows productization foundation readiness and production launch readiness separately.
- Productization does not require an account, telemetry endpoint, or persisted provider key.

## Phase 2: Account and Workspace Backend Contract

Status: complete

Goal: define the hosted account and workspace boundary before implementation.

Build:

- Account model.
- Team workspace model.
- Package persistence API contract.
- Workspace migration rules from local storage to hosted storage.
- Permission model for packages, exports, and revision actions.
- Data deletion and export contract.

Exit criteria:

- A backend or frontend agent can implement hosted workspace APIs without inventing auth, roles, storage, deletion, or migration behavior.

## Phase 3: Provider Execution Bridge

Status: complete

Goal: move from session-only diagnostics to production provider execution without leaking keys or source material.

Build:

- Provider execution request contract.
- Provider response schema.
- Secure credential handling rules.
- Redaction enforcement.
- Rate limit and cost control contract.
- Provider audit log contract.

Exit criteria:

- Provider-backed generation can be implemented as a real service while preserving evidence review, redaction, and no-persisted-key guarantees.

## Phase 4: Telemetry and Audit Transport

Goal: make measurement production-safe.

Build:

- Consent and privacy contract.
- Event schema.
- Transport retry policy.
- Audit log model.
- Data retention and deletion controls.
- Workspace-level analytics boundaries.

Exit criteria:

- Product analytics can be enabled without silently changing the local-first onboarding promise.

## Phase 5: Deployment Operations and Launch Gates

Goal: make launch readiness operational.

Build:

- Environment configuration contract.
- CI/CD gate contract.
- Hosted Workbench deployment runbook.
- Backup and rollback policy.
- Observability signals.
- Incident response checklist.

Exit criteria:

- Archetype can be deployed and operated as a hosted product with explicit launch gates and rollback behavior.
