---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - state-machine
status: active
scope_id: HL-07
---

# Scope 07 - Lifecycle Execution States

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Modularize lifecycle states 9 through 13.

## 9. Test-First Authoring

Allowed:

- Generate smoke, E2E, UI, accessibility, integration, and unit test obligations.
- Materialize tests before product UI.
- Preserve initial red tests.

Forbidden:

- Write product UI before tests.
- Generate tests that only prove generated markers exist.
- Weaken tests to make implementation pass.

## 10. Implementation

Allowed:

- Build from the canonical contract.
- Use approved specialist guidance.
- Stay inside target architecture and file manifest.

Forbidden:

- Invent routes, screens, actions, entities, visual systems, or data behavior outside spec.
- Replace real behavior with generic success panels.
- Use untyped escape hatches.

## 11. QA Verification

Allowed:

- Run Playwright.
- Generate scenario catalog.
- Test malformed data, edge states, accessibility, responsiveness, and visual evidence.
- Detect contract drift.

Forbidden:

- Treat passing smoke tests as sufficient QA.
- Ignore visual or behavioral drift because selectors exist.

## 12. Repair or Revision

Allowed:

- Patch implementation drift first.
- Revise contract only with approved new evidence.

Forbidden:

- Revise contract to excuse bad implementation.
- Close with unresolved repair queue.

## 13. Completion

Allowed:

- Produce final report.

Forbidden:

- Claim production readiness without evidence.
- Claim accessibility compliance without review.

## Exit Condition

`ready_for_completion` is true.

