---
name: archetype-implement
description: Use when implementing frontend code from an existing Archetype contract package.
---

# Archetype Implement

Use this skill for `/archetype:implement`.

## Goal

Build frontend code from `archetype-output` without guessing product behavior.

## Required Reading

Read these files before writing UI code:

- `archetype-output/AGENTS.md`
- `archetype-output/CLAUDE.md`
- `archetype-output/spec/archetype-spec.md`
- `archetype-output/spec/archetype-spec.json`
- `archetype-output/test-first/test-first-contract.json`
- `archetype-output/test-first/test-first-plan.md`
- `archetype-output/implementation-contract.md`
- `archetype-output/experience/route-map.json`
- `archetype-output/screens/screen-inventory.json`
- `archetype-output/screens/screen-specs.json`
- `archetype-output/design-system/tokens.json`
- `archetype-output/design-system/component-contracts.json`
- `archetype-output/frontend-agent-contract/implementation-rules.json`
- `archetype-output/verification-plan.md`

Use MCP tool `archetype_read_artifact` when available. If MCP is unavailable, read the files directly from disk.

## Implementation Rules

- Implement only routes declared in `experience/route-map.json`.
- Treat `spec/archetype-spec.json` as the canonical source of truth.
- Create the smoke, E2E, UI, integration, and unit tests from `test-first/test-first-contract.json` before product UI implementation.
- Preserve the initial red test result, then implement until the same tests are green.
- Implement all required screens and states from `screens/screen-inventory.json`.
- Use only tokens and component contracts declared in `design-system/`.
- Follow data, action, and form contracts from `frontend-agent-contract/implementation-rules.json`.
- Keep product copy consistent with the contract.
- Do not add any Archetype runtime product UI, backend, account, billing, or cloud surface.

## Completion

Run the target app checks requested by the repo, then use `/archetype:verify`.
