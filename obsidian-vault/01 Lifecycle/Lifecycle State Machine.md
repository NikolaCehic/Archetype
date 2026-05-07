---
tags:
  - lifecycle
  - state-machine
status: active
---

# Lifecycle State Machine

The lifecycle state machine controls what artifacts may exist.

## States

1. Start.
2. Context scan.
3. Clarification.
4. Optional material intake.
5. Contract draft.
6. Specialist review.
7. Contract approval.
8. Canonical spec generation.
9. Test-first authoring.
10. Implementation.
11. QA verification.
12. Repair or revision.
13. Completion.

## Enforcement

Each state must define:

- Input.
- Owner.
- Allowed actions.
- Forbidden actions.
- Output artifact.
- Blocker conditions.
- Exit condition.

## Related

- [[Readiness Tiers]]
- [[Gate Report]]
- [[Phase 1 - Non-Negotiable Enforcement]]

