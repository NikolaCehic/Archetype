# Scope 14 — Test-First Contracts

## Purpose

Make the agent implementation phase explicitly test-driven.

The canonical spec answers what must be built. The test-first contract answers what tests must exist before the frontend agent writes product UI code.

## Generated Artifacts

```txt
archetype-output/test-first/test-first-contract.json
archetype-output/test-first/test-first-plan.md
archetype-output/test-first/playwright-contract.spec.ts
archetype-output/test-first/vitest-contract.spec.ts
```

## Rules

- `test-first/test-first-contract.json` derives from `spec/archetype-spec.json`.
- The contract must require tests before product UI implementation.
- The contract must include smoke, E2E, UI, integration, and unit suites.
- Playwright-backed suites must cover browser-observable route, flow, screen-state, and accessibility behavior.
- Vitest-style suites must cover component, pattern, token, data, action, and form contracts.
- Agents must preserve the initial red test result before implementation and then drive the same tests green.
- Validation must fail when the test-first contract is missing or inconsistent with the canonical spec.

## Acceptance Criteria

```txt
[ ] Test-first contract JSON exists in every generated package.
[ ] Test-first plan markdown exists in every generated package.
[ ] Playwright and Vitest contract templates exist in every generated package.
[ ] Top-level manifest lists all test-first artifacts.
[ ] CLI and MCP summarize entrypoints include the test-first contract.
[ ] Package validation checks source spec path, TDD policy, suite types, route/screen counts, and required evidence.
[ ] Contract tests prove validation fails when the test-first contract is removed.
```

## Codex Instruction

Implement this after canonical spec artifacts. Do not make Archetype a test runner for the user's app in this scope. Generate deterministic test obligations and templates that Claude Code, Codex, or another frontend agent can create in the target repo before implementation.
