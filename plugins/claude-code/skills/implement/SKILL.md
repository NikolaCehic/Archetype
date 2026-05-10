---
name: archetype-implement
description: Use when implementing frontend code from an existing Archetype contract package.
---

# Archetype Implement

Use this skill for `/archetype:implement`.

## Goal

Build frontend code from `archetype-output` without guessing product behavior.

## Required Reading

Start with the compact context files, then read only the full artifacts named by the active phase bundle:

- `archetype-output/agent-context/consumer-plane.json`
- `archetype-output/agent-context/context-summary.json`
- `archetype-output/agent-context/phase-bundles/index.json`
- `archetype-output/progressive/lazy-contract-index.json`
- `archetype-output/orchestration/host-permissions.json`
- `archetype-output/agent-context/phase-bundles/test-first.json`
- `archetype-output/agent-context/phase-bundles/implementation.json`
- `archetype-output/agent-context/phase-bundles/verification.json`

The implementation bundle should point you to these source files before writing UI code:

- `archetype-output/AGENTS.md`
- `archetype-output/CLAUDE.md`
- `archetype-output/lifecycle/approval-decision.json`
- `archetype-output/lifecycle/implementation-phases.json`
- `archetype-output/reviews/specialist-review-summary.md`
- `archetype-output/spec/archetype-spec.md`
- `archetype-output/spec/archetype-spec.json`
- `archetype-output/test-first/test-first-contract.json`
- `archetype-output/test-first/test-first-plan.md`
- `archetype-output/test-first/test-quality-standard.json`
- `archetype-output/test-results/initial-red-test-run.md`
- `archetype-output/governance/forbidden-behaviors.json`
- `archetype-output/governance/convergence-standard.json`
- `archetype-output/implementation-contract.md`
- `archetype-output/experience/route-map.json`
- `archetype-output/screens/screen-inventory.json`
- `archetype-output/screens/screen-specs.json`
- `archetype-output/04-design-system/design-quality-gate.json`
- `archetype-output/04-design-system/shadcn-integration.json`
- `archetype-output/design-system/tokens.json`
- `archetype-output/design-system/component-contracts.json`
- `archetype-output/frontend-agent-contract/implementation-rules.json`
- `archetype-output/verification-plan.md`

Use MCP tool `archetype_read_artifact` when available. If MCP is unavailable, read the files directly from disk.

## Implementation Rules

- Implement only routes declared in `experience/route-map.json`.
- Follow `12-target-frontend/source-file-manifest.json` exactly: `src/app` owns route wiring only, `src/features/<screen-id>/screens` owns product screen composition, `src/features/<workflow>/patterns` owns workflow patterns, `src/shared/ui` and `src/shared/layout` own contract-bound reusable UI, `src/shared/api` and `src/shared/auth` own external boundaries, and `src/design-system` owns tokens.
- Do not put product UI composition directly in route files. Route files normalize route/search params, bind declared state, and delegate to the declared feature screen.
- Treat `spec/archetype-spec.json` as the canonical source of truth.
- Do not skip any gate in `lifecycle/implementation-phases.json`.
- Create the smoke, E2E, UI, integration, and unit tests from `test-first/test-first-contract.json` before product UI implementation.
- Follow `test-first/test-quality-standard.json`; marker-only tests fail verification.
- Reject every behavior listed in `governance/forbidden-behaviors.json`.
- Keep every convergence question in `governance/convergence-standard.json` answered `No.` with evidence.
- Preserve the initial red test result, then implement until the same tests are green.
- Implement all required screens and states from `screens/screen-inventory.json`.
- Use only tokens and component contracts declared in `design-system/`.
- Enforce `04-design-system/design-quality-gate.json`; generic blue-gray SaaS UI, untouched shadcn defaults, raw Tailwind visual literals, and missing interaction states are blockers.
- Use shadcn as the primitive layer through contract-bound wrappers, not as a default visual design.
- Follow data, action, and form contracts from `frontend-agent-contract/implementation-rules.json`.
- Keep product copy consistent with the contract.
- Do not add any Archetype runtime product UI, backend, account, billing, or cloud surface.

## Completion

Run the target app checks requested by the repo, then use `/archetype:verify`.
