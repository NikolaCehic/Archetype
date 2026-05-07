---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - acceptance
status: active
scope_id: HL-13
---

# Scope 13 - Forbidden Behaviors And Acceptance

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define what the lifecycle must reject and how success is judged.

## Forbidden Behaviors

Archetype must never:

- Generate code from weak context.
- Treat inferred routes as accepted routes.
- Treat warnings as readiness.
- Ask bulk questions when one-question clarification is possible.
- Hide assumptions inside product copy or route names.
- Generate a default Vite README as the final project README.
- Claim production-grade output from mock-only interactions.
- Replace real workflows with generic success states.
- Generate tests that only validate its own markers.
- Let implementation mutate the contract without approved evidence.
- Let QA pass without Playwright evidence.

## Acceptance Criteria

The hardened lifecycle passes when vague prompts stop at clarification, inferred routes remain candidates, approved assumptions are recorded, shallow tests fail, implementation drift creates repair tasks, and completion requires a clean repair queue.

## Exit Condition

Forbidden behaviors are encoded as tests or validators.

