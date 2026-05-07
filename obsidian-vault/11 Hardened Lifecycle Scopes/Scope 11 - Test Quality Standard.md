---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - testing
status: active
scope_id: HL-11
---

# Scope 11 - Test Quality Standard

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define what valid tests must prove.

## Forbidden Test Patterns

- Only checking `[data-archetype-screen]`.
- Clicking a generic primary button and accepting any success message.
- Testing contract arrays without importing target behavior.
- Treating screenshot byte size as visual quality.
- Mirroring implementation constants as expected values without independent contract expectations.

## Required Test Behaviors

- Search filters real visible results or shows filtered-empty with reset.
- Create actions open a form or mutation workflow.
- Export produces a declared artifact, callback, or mock adapter result.
- Required states are reachable through deterministic fixtures.
- Route transitions and deep links are browser-observable.
- Keyboard, focus, accessible names, landmarks, and live/status regions are tested.
- Long labels, malformed data, and permission mismatches are tested.
- Visual evidence covers desktop, tablet, and mobile.

## Exit Condition

Marker-only tests fail the verifier.

