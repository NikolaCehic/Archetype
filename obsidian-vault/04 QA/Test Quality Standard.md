---
tags:
  - qa
  - tests
  - quality
status: draft
---

# Test Quality Standard

Tests must prove behavior, not generated markers.

## Forbidden

- Only checking `[data-archetype-screen]`.
- Clicking a generic primary button and accepting any success message.
- Testing contract arrays without target behavior.
- Treating screenshot byte size as visual quality.
- Mirroring implementation constants without independent expectations.

## Required

- Search filters real visible results or shows filtered-empty with reset.
- Create actions open a form or mutation workflow.
- Export produces a declared artifact or mock adapter result.
- All required states are reachable through deterministic fixtures.
- Route transitions and deep links are browser-observable.
- Keyboard, focus, names, landmarks, and status regions are tested.
- Long labels, malformed data, and permission mismatch are tested.

## Related

- [[QA Team]]
- [[Regression Fixtures]]

