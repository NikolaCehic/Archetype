# Scope 17 — Release Readiness Hardening

## Purpose

Make Archetype installable, explainable, and verifiable from the first minute.

The internal harness contracts are strong enough now. This scope hardens the outer release surface so a human user or AI agent can verify setup, start the MCP server, load the plugin wrapper, and understand the lifecycle without reverse-engineering the repo.

## Retained Scope

- Add package-level release readiness doctor.
- Expose readiness through CLI command `archetype doctor`.
- Expose readiness through MCP tool `archetype_release_doctor`.
- Add `docs/quickstart.md`.
- Add `docs/agent-lifecycle.md`.
- Add `docs/release-readiness.md`.
- Update README, install docs, plugin docs, and MCP docs to point to the same setup path.
- Add release readiness contract tests.
- Verify the doctor in source, packed install, and `npx -p <tarball>` flows.
- Keep setup guidance focused on the agent harness lifecycle.

## Removed Scope

- Do not publish from the agent loop.
- Do not add account, billing, hosted docs, telemetry, cloud setup, or project storage.
- Do not reintroduce the old web workbench.
- Do not make plugin usage depend on user-managed CLI choreography.

## Required Surfaces

```txt
archetype doctor --json
archetype_release_doctor
docs/quickstart.md
docs/agent-lifecycle.md
docs/release-readiness.md
scripts/run-release-readiness-contract.mjs
```

## Pass Condition

```txt
The source package, packed package, installed package, npx package, MCP server, plugin wrappers, docs, and lifecycle setup path all report release readiness without hidden manual steps.
```

## Codex Instruction

Implement this as local deterministic checks, docs, CLI/MCP wrappers, package contract tests, and install-contract assertions. Keep the product an agent harness for Claude Code and Codex.
