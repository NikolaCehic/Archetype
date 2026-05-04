# Scope 13 — Canonical Spec Artifacts

## Purpose

Make Archetype explicitly spec-driven by generating one canonical source of truth for the full frontend contract.

The canonical spec must bind:

- lifecycle context
- product model
- users, roles, permissions, and entities
- routes
- user flows
- screens and states
- design-system tokens
- components and patterns
- data, action, and form contracts
- acceptance criteria
- verification obligations
- traceability

## Generated Artifacts

```txt
archetype-output/spec/archetype-spec.md
archetype-output/spec/archetype-spec.json
```

## Rules

- `spec/archetype-spec.json` is the machine-readable source of truth.
- `spec/archetype-spec.md` is the human-readable source of truth.
- Generated `AGENTS.md` and `CLAUDE.md` must read the canonical spec before implementation.
- Validation must fail when the canonical spec is missing or inconsistent with route/screen artifacts.
- Test-first contracts in the next scope must derive from the canonical spec.

## Acceptance Criteria

```txt
[ ] Canonical spec markdown exists in every generated package.
[ ] Canonical spec JSON exists in every generated package.
[ ] Top-level manifest lists both canonical spec artifacts.
[ ] CLI and MCP summarize entrypoints include both canonical spec artifacts.
[ ] Package validation checks source_of_truth, lifecycle, product, experience, design_system, frontend_contract, verification, and route/screen counts.
[ ] Contract tests prove the spec exists, is coherent, and validation fails when it is removed.
```

## Codex Instruction

Implement this after lifecycle orchestration and before test-first contracts. Do not create executable tests in this scope; create the canonical spec the tests will later derive from.
