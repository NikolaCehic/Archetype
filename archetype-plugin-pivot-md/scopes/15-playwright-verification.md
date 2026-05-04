# Scope 15 — Playwright Verification

## Purpose

Add browser-backed proof to the agent harness.

Test-first contracts define what tests must be created before implementation. This scope verifies the implemented target in a real browser and writes evidence back into `archetype-output`.

## Retained Scope

- Generate `verification/playwright-verification-contract.json`.
- Generate `verification/playwright-verification-plan.md`.
- Generate `verification/playwright.config.ts`.
- Generate `verification/playwright-verification.spec.ts`.
- Generate pending `verification/playwright-evidence.json`.
- Generate pending `verification/playwright-evidence.md`.
- Materialize target Playwright files through `write-target`.
- Run the target command `npm run archetype:playwright` through `verify-target`.
- Capture route, screen-state, flow, responsive, accessibility, and visual-smoke proof.
- Update target execution and E2E proof artifacts after verification.

## Removed Scope

- Do not add a hosted visual QA dashboard.
- Do not add cloud browser orchestration.
- Do not add account, billing, storage, or project history surfaces.
- Do not turn Archetype into a general test runner outside the generated contract package.

## Required Generated Artifacts

```txt
archetype-output/verification/playwright-verification-contract.json
archetype-output/verification/playwright-verification-plan.md
archetype-output/verification/playwright.config.ts
archetype-output/verification/playwright-verification.spec.ts
archetype-output/verification/playwright-evidence.json
archetype-output/verification/playwright-evidence.md
```

## Verification Coverage

The Playwright contract must derive from:

```txt
spec/archetype-spec.json
test-first/test-first-contract.json
```

It must cover:

- every declared route
- every required browser-observable screen state
- every declared user flow with route or screen references
- mobile, tablet, and desktop responsive smoke checks
- basic accessibility checks
- visual-smoke screenshots

## Pass Condition

```txt
verify-target installs the generated target, typechecks it, builds it, runs Playwright, writes evidence, and validation accepts the resulting package.
```

## Failure Rule

If Playwright verification fails, the harness must expose concrete evidence paths and revision guidance. The user should not have to inspect generated internals to discover whether route, state, flow, responsive, accessibility, or visual-smoke proof failed.

## Codex Instruction

Implement this as generated contract artifacts plus deterministic CLI/MCP verification behavior. Keep the product a local agent harness. Do not reintroduce web app, backend, hosted project, or cloud verification scope.
