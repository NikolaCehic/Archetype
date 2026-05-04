---
name: archetype-implement
description: Use when Codex should build frontend code from an existing Archetype contract package.
---

# Archetype Implement

Implement from the generated contract. Do not guess.

## Required Files

Read these before writing UI code:

- `archetype-output/AGENTS.md`
- `archetype-output/spec/archetype-spec.md`
- `archetype-output/spec/archetype-spec.json`
- `archetype-output/implementation-contract.md`
- `archetype-output/experience/route-map.json`
- `archetype-output/screens/screen-inventory.json`
- `archetype-output/screens/screen-specs.json`
- `archetype-output/design-system/tokens.json`
- `archetype-output/design-system/component-contracts.json`
- `archetype-output/frontend-agent-contract/implementation-rules.json`
- `archetype-output/frontend-agent-contract/acceptance-criteria.json`
- `archetype-output/verification-plan.md`

Prefer MCP tool `archetype_read_artifact` for targeted artifact reads. If MCP is unavailable, read the files directly.

## Rules

- Create only routes present in the route map.
- Treat `spec/archetype-spec.json` as the canonical source of truth.
- Implement every required screen state.
- Use declared tokens and component contracts.
- Follow data, action, and form contracts.
- Keep product copy consistent with the contract.
- Run local target checks before claiming completion.
- Run `archetype-verify` after implementation.
