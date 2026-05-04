# Lifecycle Loop Log

## Scope Map

Scope 1: Lifecycle and context-completion spine.

- Add a deterministic lifecycle state machine.
- Define clarify as context completion.
- Ask for optional materials as a default lifecycle step.
- Generate lifecycle artifacts in every `archetype-output` package.
- Update generated agent instructions to read lifecycle context first.
- Prove rich context proceeds and sparse context asks questions.

Scope 2: Canonical spec artifacts.

- Generate `spec/archetype-spec.md` and `spec/archetype-spec.json`.
- Make the canonical spec the source of truth for design system, screens, routes, flows, data, states, and acceptance criteria.

Scope 3: Test-first contracts.

- Generate E2E, UI, smoke, integration, and unit test contracts before implementation.
- Update agent instructions so tests are written before product UI code.

Scope 4: Playwright-backed verification.

- Generate Playwright scenario obligations and expected evidence.
- Verify route, screen, flow, responsive, accessibility, and visual-smoke adherence against the spec.

Scope 5: Revision and drift repair loop.

- Make verification failures produce concrete fix/revise tasks.
- Keep implementation changes and spec revisions traceable.

## Scope 1 Review

Context:

- The user corrected the product shape: `/archetype "project idea"` should be sufficient.
- The user should not need to ask Archetype to clarify, request materials, implement, or verify.
- Clarify is context completion: known facts, missing decisions, assumptions, optional material prompt, and focused questions.

Implementation:

- Added lifecycle artifacts to generated packages.
- Added a state machine with `start`, `clarifying`, `waiting_for_optional_materials`, `intaking`, `spec_generating`, `test_generating`, `implementing_tests_first`, `verifying_with_playwright`, `revising`, and `done`.
- Added deterministic context-completion output.
- Updated generated `AGENTS.md` and `CLAUDE.md` to read lifecycle context and enforce spec-driven plus test-driven discipline.
- Added `scripts/run-lifecycle-contract.mjs` and wired it into `npm run check`.
- Added package validation for lifecycle files and lifecycle state-machine semantics.
- Added distribution, CLI, MCP, plugin, install, and pivot-audit coverage for the lifecycle entrypoints.

Validation:

- `npm run lifecycle:contract` passed.
- `npm run cli:contract` passed.
- `npm run mcp:contract` passed.
- `npm run plugin:claude:contract` passed.
- `npm run plugin:codex:contract` passed.
- `npm run distribution:contract` passed.
- `npm run check` passed.
- `npm pack --dry-run --json` included the lifecycle module, scope doc, and lifecycle contract script.
- `npm audit --json` reported 0 vulnerabilities.
- `git diff --check` passed.

Self-review:

- The implementation adheres to Scope 1 because lifecycle behavior is generated as machine-readable and human-readable artifacts, validated by package validation, and covered by a dedicated contract test.
- It does not yet implement canonical spec files, executable test-contract generation, or Playwright result verification. Those are intentionally the next scopes.
- Review answer: YES for Scope 1. The scope is fully implemented according to the current context.

Rule:

- Do not describe `/archetype` as a command the user must decorate with "ask me questions", "build", or "verify". `/archetype "project idea"` implies the lifecycle.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation
